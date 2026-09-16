# Analítica mínima: plan de cierre de viabilidad

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. No delegación automática. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Resolver las condiciones técnicas y jurídicas antes de añadir medición sin consentimiento.

**Architecture:** Mantener GA4/Umami opt-in. Elegir agregados operativos sin identificación ni código cliente adicional únicamente si fuente, fundamento y contratos comprobados permiten esa finalidad. Sin nueva captura durante esta fase.

**Tech Stack:** Next.js 16.3.4, Vercel existente, Markdown; sin nuevas dependencias.

**Spec:** `docs/owner-platform/analytics-lawful-baseline-2026-09-16.md`.

## Global Constraints

- Sin activación, publicación, gasto ni exportación de logs personales en esta fase.
- Sin SDK público adicional, IP/hash, sesiones o cruces entre clientes.
- Preservar consentimiento publicado y cambios ajenos; comprobar reservas.
- Leer documentación local Next.js antes de programar posteriormente.
- Este plan produce expediente y viabilidad, no código para una API cuya disponibilidad aún no se ha verificado.

## Tarea 1: inventario verificable

**Archivos:** añadir «Evidencia de viabilidad» a la spec; consultar `vercel.json`, `src/lib/analytics-consent/providers.ts`, `src/app/layout.tsx` y recibo de publicación, sin modificar runtime.

**Entrada:** proyecto Vercel vinculado. **Salida:** tabla campo/origen/finalidad/retención/destinatario/coste/evidencia con resultado apto/no apto.

- [ ] Leer skill Vercel observability y documentación oficial vigente.
- [ ] Verificar plan y API de agregados mediante metadatos de solo lectura; no mostrar tokens o peticiones individuales.
- [ ] Comprobar cobertura CDN/cache, documentos, recursos, bots y prefetch; si no se distinguen, no etiquetar como vistas.
- [ ] Verificar DPA aplicable, subencargados, región, retención y reutilización. Marketing no sustituye al contrato.
- [ ] Registrar `APTO` solo con fuente real compatible para cada campo. En caso contrario, `NO ACTIVAR`, con evidencia y motivo.
- [ ] Ejecutar `git diff --check`; commit explícito únicamente de documentación propia.

## Tarea 2: expediente jurídico

**Archivos:** sección de viabilidad de la spec y entrada aditiva `00_Coordinacion_IA/docs/REGISTRO.md`.

**Entrada:** inventario. **Salida:** evaluación revisable por el responsable, sin simular firmas o aceptación.

- [ ] Separar tratamiento técnico necesario, agregación operativa y analítica opcional.
- [ ] Documentar interés legítimo: finalidad, alternativas, necesidad, expectativas, riesgos, garantías y oposición. Si no se sostiene, excluir captura.
- [ ] Describir operaciones sobre terminal y fundamento de exención o ausencia justificada de operación cubierta; no usar solo «server-side» como argumento.
- [ ] Evaluar inferencia/reidentificación, transferencias y necesidad de EIPD; incertidumbre no equivale a aprobación.
- [ ] Obtener revisión jurídica cualificada; si requiere contratar, pedir alcance/coste a Manuel antes de hacerlo.
- [ ] Registrar resultado: `VIABLE PARA PROTOTIPO SIN TRÁFICO`, `VIABLE PARA ACTIVACIÓN TRAS PRUEBAS` o `NO ACTIVAR`.

## Tarea 3: plan técnico de la solución admitida

**Archivos:** ampliar este plan con contrato real del adaptador, módulos/tests exactos y comandos derivados de la fuente validada. Leer instrucciones de `owner-platform` antes de definir cambios allí.

**Entrada:** tareas 1–2. **Salida:** plan de código reproducible o cierre documentado sin captura nueva.

- [ ] Fijar casos sintéticos: dos peticiones no son dos personas; rutas privadas/query no persistidas; oposición conocida/GPC excluyen conteo no esencial; fuente caída produce «No disponible».
- [ ] Especificar pruebas de purga a 90 días, aislamiento, autorización y celdas pequeñas sin reconstrucción por diferencias.
- [ ] Definir pruebas de caché/prefetch y navegación cliente; declarar lo no observable sin añadir beacons.
- [ ] Conservar regresiones `scripts/verify-analytics-consent.mjs` y `scripts/verify-analytics-live.mjs`; el segundo solo con guard explícito y prueba real autorizada.
- [ ] Definir activación reversible del colector independiente de GA4/Umami, sin logs completos para depurar.
- [ ] Contrastar cada fila de la spec antes de programar. API, almacenamiento, fundamento o contrato sin resolver impiden activar.

## Estado

Diseño decidido; tareas de viabilidad pendientes, no marcadas como ejecutadas. Ninguna nueva recogida publicada. Continuación en esta misma tarea sin abrir otra. La existencia de este plan no autoriza gasto ni publicación automática.
