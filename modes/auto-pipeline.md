# Modo: auto-pipeline — Pipeline Completo Automático

Cuando el usuario pega un JD (texto o URL) sin sub-comando explícito, ejecutar TODO el pipeline en secuencia:

## Paso 0 — Extraer JD

Si el input es una **URL** (no texto de JD pegado), seguir esta estrategia para extraer el contenido:

**Orden de prioridad:**

1. **Playwright (preferido):** La mayoría de portales de empleo (Lever, Ashby, Greenhouse, Workday) son SPAs. Usar `browser_navigate` + `browser_snapshot` para renderizar y leer el JD.
2. **WebFetch (fallback):** Para páginas estáticas (ZipRecruiter, WeLoveProduct, company career pages).
3. **WebSearch (último recurso):** Buscar título del rol + empresa en portales secundarios que indexan el JD en HTML estático.

**Si ningún método funciona:** Pedir al candidato que pegue el JD manualmente o comparta un screenshot.

**Si el input es texto de JD** (no URL): usar directamente, sin necesidad de fetch.

**Persistencia obligatoria del JD:**

- Como el pipeline ya necesita leer el JD completo, guardarlo SIEMPRE en `jds/{###}-{company-slug}-{role-slug}-{YYYY-MM-DD}.md`
- El archivo debe contener el JD completo en markdown plano, lo mas verbatim posible desde la pagina o texto fuente
- Si el origen fue URL, incluir al inicio una referencia breve a la URL fuente
- Si el input ya era `local:jds/...`, reutilizar ese archivo y referenciarlo en el report en vez de crear una copia innecesaria

## Paso 1 — Evaluación A-G
Ejecutar exactamente igual que el modo `oferta` (leer `modes/oferta.md` para todos los bloques A-F + Block G Posting Legitimacy).

**Antes de cerrar la evaluacion**, generar tambien un artefacto de coverage scan reutilizable para futuros pasos:

- Reutilizar la misma logica conceptual de `modes/json-cv.md` para comparar:
  - JD exacto guardado en `jds/...`
  - CV base (`cv.md`) como evidencia de verdad
  - report como contexto secundario solo cuando ayude a explicar riesgos o priorizacion
- Guardar ese scan en `reports/{###}-{company-slug}-{YYYY-MM-DD}-skills.md`
- El scan debe incluir como minimo:
  - tabla de hard skills: `Skill | CV / base evidence | Job Description | Notes`
  - tabla de soft skills / leadership signals: `Skill | CV / base evidence | Job Description | Notes`
  - lista compacta de keywords del JD
  - breve lectura de riesgos reales vs gaps aceptables
- Este artefacto existe para que `json-cv` y futuros flujos no tengan que repetir el mismo analisis base

## Paso 2 — Guardar Report .md
Guardar la evaluación completa en `reports/{###}-{company-slug}-{YYYY-MM-DD}.md` (ver formato en `modes/oferta.md`).
Include Block G in the saved report. Add `**Legitimacy:** {tier}` to the report header.

El report debe referenciar explicitamente:
- la ruta del JD guardado en `jds/...`
- la ruta del skill coverage scan guardado en `reports/...-skills.md`
- si se pudieron leer preguntas visibles del formulario, listar esas preguntas en el propio report

## Paso 3 — Generar PDF
Read `config/profile.yml`. Check `cv.output_format`:

- If `"latex"`, execute the full pipeline from `modes/latex.md`
- Otherwise (default), execute the full pipeline from `modes/pdf.md`

## Paso 4 — Application Form Questions + Draft Answers (solo si score >= 4.5 para respuestas)

Siempre que sea factible con Playwright, inspeccionar tambien el flujo de apply para extraer las preguntas visibles del formulario.

1. **Extraer preguntas del formulario**: Usar Playwright para navegar al formulario y hacer snapshot. Guardar las preguntas visibles exactas como lista en el report bajo `## H) Application Form Questions`.
2. **No responder todavia** si el score es < 4.5. En ese caso solo guardar preguntas.
3. **Si score >= 4.5**, generar ademas borrador de respuestas y guardarlo en `## I) Draft Application Answers`.

Si no se pueden extraer preguntas reales del formulario, dejar constancia breve de que no fue posible y usar las preguntas genéricas solo para el borrador cuando aplique.

### Preguntas genéricas (usar si no se pueden extraer del formulario)

- Why are you interested in this role?
- Why do you want to work at [Company]?
- Tell us about a relevant project or achievement
- What makes you a good fit for this position?
- How did you hear about this role?

### Tono para Form Answers

**Posición: "I'm choosing you."** el candidato tiene opciones y está eligiendo esta empresa por razones concretas.

**Reglas de tono:**
- **Confiado sin arrogancia**: "I've spent the past year building production AI agent systems — your role is where I want to apply that experience next"
- **Selectivo sin soberbia**: "I've been intentional about finding a team where I can contribute meaningfully from day one"
- **Específico y concreto**: Siempre referenciar algo REAL del JD o de la empresa, y algo REAL de la experiencia del candidato
- **Directo, sin fluff**: 2-4 frases por respuesta. Sin "I'm passionate about..." ni "I would love the opportunity to..."
- **El hook es la prueba, no la afirmación**: En vez de "I'm great at X", decir "I built X that does Y"

**Framework por pregunta:**
- **Why this role?** → "Your [specific thing] maps directly to [specific thing I built]."
- **Why this company?** → Mencionar algo concreto sobre la empresa. "I've been using [product] for [time/purpose]."
- **Relevant experience?** → Un proof point cuantificado. "Built [X] that [metric]. Sold the company in 2025."
- **Good fit?** → "I sit at the intersection of [A] and [B], which is exactly where this role lives."
- **How did you hear?** → Honesto: "Found through [portal/scan], evaluated against my criteria, and it scored highest."

**Idioma**: Siempre en el idioma del JD (EN default). Aplicar `/tech-translate`.

## Paso 5 — Actualizar Tracker
Registrar en `data/applications.md` con todas las columnas incluyendo Report y PDF en ✅.

**Si algún paso falla**, continuar con los siguientes y marcar el paso fallido como pendiente en el tracker.
