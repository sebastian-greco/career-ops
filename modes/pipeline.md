# Modo: pipeline — Inbox de URLs (Second Brain)

Procesa URLs de ofertas acumuladas en `data/pipeline.md`. El usuario agrega URLs cuando quiera y luego ejecuta `/career-ops pipeline` para procesarlas todas.

## Workflow

1. **Leer** `data/pipeline.md` → buscar items `- [ ]` en la sección "Pendientes"
2. **Para cada URL pendiente**:
   a. Calcular siguiente `REPORT_NUM` secuencial (leer `reports/`, tomar el número más alto + 1)
   b. **Extraer JD** usando Playwright (browser_navigate + browser_snapshot) → WebFetch → WebSearch
   c. **Guardar el JD** en `jds/{###}-{company-slug}-{role-slug}-{YYYY-MM-DD}.md` salvo que el input ya sea `local:jds/...`
   d. **Generar coverage scan reutilizable** en `reports/{###}-{company-slug}-{YYYY-MM-DD}-skills.md` siguiendo la misma estructura base que usa `json-cv` para hard skills, soft skills y keywords
   e. **Inspeccionar preguntas visibles del formulario** cuando sea factible con Playwright y embutirlas en el report
   c. Si la URL no es accesible → marcar como `- [!]` con nota y continuar
   f. **Ejecutar auto-pipeline completo**: Evaluación A-F → Report .md con referencias a JD/skills → JSON CV (si score >= 4.0, siguiendo la preferencia RxResume) → Tracker
   g. **Mover de "Pendientes" a "Procesadas"**: `- [x] #NNN | URL | Empresa | Rol | Score/5 | JSON ✅/❌`
3. **Si hay 3+ URLs pendientes**, lanzar agentes en paralelo (Agent tool con `run_in_background`) para maximizar velocidad.
4. **Al terminar**, mostrar tabla resumen:

```
| # | Empresa | Rol | Score | JSON | Acción recomendada |
```

## Formato de pipeline.md

```markdown
## Pendientes
- [ ] https://jobs.example.com/posting/123
- [ ] https://boards.greenhouse.io/company/jobs/456 | Company Inc | Senior PM
- [!] https://private.url/job — Error: login required

## Procesadas
- [x] #143 | https://jobs.example.com/posting/789 | Acme Corp | AI PM | 4.2/5 | JSON ✅
- [x] #144 | https://boards.greenhouse.io/xyz/jobs/012 | BigCo | SA | 2.1/5 | JSON ❌
```

## Detección inteligente de JD desde URL

1. **Playwright (preferido):** `browser_navigate` + `browser_snapshot`. Funciona con todas las SPAs.
2. **WebFetch (fallback):** Para páginas estáticas o cuando Playwright no está disponible.
3. **WebSearch (último recurso):** Buscar en portales secundarios que indexan el JD.

**Casos especiales:**
- **LinkedIn**: Puede requerir login → marcar `[!]` y pedir al usuario que pegue el texto
- **PDF**: Si la URL apunta a un PDF, leerlo directamente con Read tool
- **`local:` prefix**: Leer el archivo local. Ejemplo: `local:jds/linkedin-pm-ai.md` → leer `jds/linkedin-pm-ai.md`

## Numeración automática

1. Listar todos los archivos en `reports/`
2. Extraer el número del prefijo (e.g., `142-medispend...` → 142)
3. Nuevo número = máximo encontrado + 1

## Sincronización de fuentes

Antes de procesar cualquier URL, verificar sync:
```bash
node cv-sync-check.mjs
```
Si hay desincronización, advertir al usuario antes de continuar.

## Artefactos persistidos por evaluación

Cada item procesado por pipeline debe dejar, como minimo, estos artefactos reutilizables:

1. Report principal: `reports/{###}-{company-slug}-{YYYY-MM-DD}.md`
2. JD completo guardado: `jds/{###}-{company-slug}-{role-slug}-{YYYY-MM-DD}.md`
3. Skill coverage scan: `reports/{###}-{company-slug}-{YYYY-MM-DD}-skills.md`

El report principal debe incluir las rutas de 2 y 3 en su sección de artifacts para que el dashboard y futuros modos puedan reutilizarlas sin volver a extraer ni re-analizar innecesariamente.
