# Modo: scan-jobgether — Browser Scan for Jobgether

Escanea la feed visible de Jobgether usando la sesion ya abierta en Chrome, deduplica con las mismas fuentes de Career-Ops, y añade las URLs nuevas a `data/pipeline.md` para procesarlas despues.

## Objetivo

Reutilizar el core de Career-Ops:
- `data/pipeline.md` como inbox de ofertas pendientes
- `data/scan-history.tsv` como historial de descubrimiento/dedup
- `data/applications.md` como dedup semantico por empresa + rol

Sin crear un tracker paralelo ni reglas nuevas de escritura.

## Batch por defecto

- Procesar las **primeras 10 cards visibles** en `https://jobgether.com/home`
- No seguir scrolleando por defecto

## Workflow

1. Verificar que existe una tab abierta de Jobgether logueada
2. Leer las primeras 10 cards visibles del feed
3. Para cada card visible extraer:
   - `jobgether_offer_url`
   - `company`
   - `title`
4. Abrir la `jobgether_offer_url` en una nueva tab
5. En la pagina de detalle, leer el link externo `APPLY`
   - Preferir leer el `href` directamente de la pagina de detalle
   - No depender del modal de `Apply manually` del feed si no hace falta
6. Normalizar la URL externa a la URL de JD/overview cuando sea posible:
   - Lever: quitar `/apply` y tracking params
   - Ashby: quitar `/application` y tracking params
   - Greenhouse `embed/job_app`: convertir a `job-boards.greenhouse.io/{board}/jobs/{token}` si hay `for` + `token`
   - Workable: quitar tracking params
   - SuccessFactors: conservar solo params estables (`career_ns`, `company`, `career_job_req_id`)
7. Deduplicar contra:
   - `data/scan-history.tsv` por URL exacta
   - `data/pipeline.md` por URL exacta
   - `data/applications.md` por `company + role` normalizado
8. Si la oferta es nueva:
   - Añadir a `data/pipeline.md` como `- [ ] {url} | {company} | {title}`
   - Registrar en `data/scan-history.tsv` con status `added`
9. Si la oferta es duplicada:
   - Registrar en `data/scan-history.tsv` con status `skipped_dup`
10. Limpiar la card en Jobgether segun la regla:
    - **Duplicada** → `I'm Interested`
    - **Nueva y plausiblemente relevante** → `I'm Interested`
    - **Nueva pero claramente fuera de perfil** → `Not Interested`
    - **Si Jobgether bloquea `I'm Interested` con popup/premium limit** → cerrar el popup y usar `Not Interested` como fallback operacional para retirar la card del feed

## Ejecucion del subagente

### 1. Encontrar la tab correcta

- Preferir una tab ya abierta en Chrome cuyo URL empiece por `https://jobgether.com/home`
- Si hay varias tabs de Jobgether, usar la que ya muestra el feed principal
- Si no existe una tab abierta, abrir `https://jobgether.com/home`
- Si la sesion no esta logueada, parar y pedir al usuario que inicie sesion

### 2. Capturar las cards del feed

- Trabajar solo con las primeras 10 cards visibles sin hacer scroll adicional
- Para cada card visible, capturar y guardar en memoria:
  - `index` (1-based, segun el orden visual del feed)
  - `company`
  - `title`
  - `jobgetherOfferUrl`
- Mantener ese orden fijo durante toda la ejecucion
- No hacer clicks de limpieza todavia

### 3. Extraer el `APPLY` externo

- Para cada card capturada:
  - abrir `jobgetherOfferUrl` en una tab aparte
  - leer el `href` del boton o link `APPLY`
  - guardar `{ index, company, title, externalUrl, jobgetherOfferUrl }`
- Si la pagina tiene overlays, cerrar solo lo minimo necesario para leer el `APPLY`
- Si una oferta no expone `APPLY`, devolver `externalUrl: ""` para que el helper la clasifique como `skipped_invalid`
- Cerrar la tab secundaria al terminar cada extraccion si no hace falta para depurar

### 4. Handoff al helper determinista

- Construir un JSON temporal con los items en el mismo orden visual del feed
- Ejecutar:

```bash
node scan-jobgether.mjs --input /tmp/jobgether-batch.json
```

- Parsear la salida JSON y conservar la correspondencia por `index`

### 5. Aplicar limpieza en Jobgether

- Volver a la tab original del feed
- Aplicar clicks siguiendo el orden original de las cards capturadas
- Preferir siempre los botones redondos del listado (`I'm Interested` / `Not Interested`) para limpiar la feed; no hace falta abrir la vista de detalle para esta parte
- Para cada resultado:
  - `cleanupAction = "I'm Interested"` → click `I'm Interested`
  - `cleanupAction = "Not Interested"` → click `Not Interested`
  - `cleanupAction = "Leave Alone"` → no hacer click
- Despues de cada click, esperar a que la card desaparezca o el feed se estabilice antes de seguir
- No reordenar resultados ni mezclar cards; la correspondencia debe seguir el `index` capturado
- Si al hacer click aparece un popup/banner de Premium o limite de plan:
  - cerrarlo primero (`Not now`, `✕`, o control equivalente)
  - reintentar una sola vez la accion prevista
  - si `I'm Interested` sigue bloqueado por el mismo limite, degradar a `Not Interested` para esa card concreta y continuar
- Reportar al final cuantas cards usaron este fallback

### 6. Recuperacion ante overlays o DOM inestable

- Si aparece un modal, cookie banner, tooltip, o interstitial que bloquea clicks:
  - cerrarlo si hay un control obvio de close/dismiss
  - si no, recargar la pagina una sola vez y reintentar
- Si aparece especificamente el modal de Premium/plan limit despues de una accion de limpieza:
  - tratarlo como bloqueo recuperable de la UI, no como fallo fatal del scan
  - cerrarlo y continuar con la estrategia de fallback descrita arriba
- Si el feed cambia y se pierde la correspondencia visual:
  - no seguir limpiando a ciegas
  - re-capturar las cards visibles y reconciliar por `jobgetherOfferUrl`
- Si no se puede reconciliar con seguridad, parar y reportar el bloqueo

### 7. Resumen final

- Reportar:
  - cards visibles procesadas
  - `added`
  - `skipped_dup`
  - `skipped_invalid`
  - lista breve de roles anadidos
  - lista breve de duplicados

## Regla de limpieza Jobgether

**MUY IMPORTANTE:** `Not Interested` NO es una accion generica de limpieza.

Usar:
- `I'm Interested` para duplicadas y para roles nuevos plausibles
- `Not Interested` solo para no-fit obvio por titulo/dominio
- **Excepcion operacional:** si Jobgether impide limpiar con `I'm Interested` por limite/premium popup, se permite `Not Interested` como fallback para despejar la feed

Razon:
- Evitar que el algoritmo deje de mostrar familias de roles similares
- Mantener visibles en la seccion de `Liked` los roles plausibles

## Dedup y escrituras

Reutilizar las mismas helpers compartidas que usa el scanner principal:
- carga de URLs vistas
- carga de `company + role` vistos
- escritura en `pipeline.md`
- escritura en `scan-history.tsv`
- heuristicas de `title_filter` / IC exceptions desde `portals.yml`

## Contrato con `scan-jobgether.mjs`

El subagente de navegador debe pasar un batch JSON al helper determinista con este formato:

```json
{
  "source": "Jobgether",
  "items": [
    {
      "company": "n8n",
      "title": "Engineering Manager | Remote | Europe",
      "externalUrl": "https://jobs.ashbyhq.com/n8n/.../application?...",
      "jobgetherOfferUrl": "https://jobgether.com/offer/..."
    }
  ]
}
```

Invocacion recomendada:

```bash
node scan-jobgether.mjs --input /tmp/jobgether-batch.json
```

O por `stdin`:

```bash
node scan-jobgether.mjs --stdin < /tmp/jobgether-batch.json
```

Respuesta esperada:

```json
{
  "date": "2026-04-28",
  "results": [
    {
      "company": "n8n",
      "title": "Engineering Manager | Remote | Europe",
      "externalUrl": "https://jobs.ashbyhq.com/n8n/.../application?...",
      "jobgetherOfferUrl": "https://jobgether.com/offer/...",
      "normalizedUrl": "https://jobs.ashbyhq.com/n8n/...",
      "status": "added",
      "cleanupAction": "I'm Interested"
    }
  ],
  "summary": {
    "received": 1,
    "added": 1,
    "skipped_dup": 0,
    "skipped_invalid": 0
  }
}
```

`status` posibles:
- `added`
- `skipped_dup`
- `skipped_invalid`

`cleanupAction` indica la accion sugerida en Jobgether para esa card:
- `I'm Interested`
- `Not Interested`
- `Leave Alone`

## Resumen esperado

Al final devolver algo como:

```text
Jobgether Scan — YYYY-MM-DD
━━━━━━━━━━━━━━━━━━━━━━━━━━
Cards visibles procesadas: 10
Duplicadas: N
Nuevas añadidas: N

  + Company | Title
  + Company | Title

→ Ejecuta /career-ops pipeline para evaluar las nuevas ofertas.
```
