# Consentimiento de analítica: incremento aislado

16/09/2026 · Codex · base 2ebd747 · **implementado y probado en aislamiento, no integrado ni publicado**.

## Entrega

- `src/lib/analytics-consent/policy.ts`: consentimiento v1 por Google/Umami; rechazo por defecto; guardado fechado; caducidad180 días; formato inválido o futuro no autoriza.
- `controller.ts`: persistencia antes de aceptación, selección independiente, desactivación por señal de privacidad/entorno, fallo de almacenamiento cerrado, retirada, rutas permitidas sin query/hash, cambios de pestaña. Adaptadores externos obligatorios: no incluye SDK real ni asume que llamar a stop elimina cookies.
- `lifecycle.ts`: storage/focus/visibility y temporizador de caducidad con fragmentación del límite de32 bits; limpieza de listeners y timers.
- `src/components/analytics/consent/AnalyticsConsentCard.tsx` y CSS Module: tarjeta no modal, aceptar/rechazar equivalentes, detalles con casillas inicialmente desmarcadas, guardar, cerrar sin cambiar, enlace persistente, error de almacenamiento, señales de privacidad, foco de reapertura y Escape. Estado sincronizado con cambios de elección externos.
- `scripts/verify-analytics-consent.mjs`: monta únicamente componente/controlador reales, con proveedores sintéticos y origen local. No inicia Google ni Umami, ni envía visitas al portfolio. Cierra navegador y servidor al finalizar.

La guía frontend ha orientado la reutilización de tipografía/paleta existente y la reducción de decoración. Aceptar y rechazar comparten clase, contraste y tamaño; sin publicidad, casillas opcionales premarcadas ni aceptación por navegación. Las guías de pruebas han llevado a separar estado real del consentimiento de las fronteras de SDK/storage.

## Evidencia de esta ejecución

| Prueba | Resultado |
| --- | --- |
| Política: RED con funciones iniciales sin comportamiento | 3 fallos de aserción; luego12/12 |
| Controlador: RED sin comportamiento | 8 fallos; luego11/11 |
| Lifecycle: RED sin listeners/temporizador | 2 fallos; luego2/2 |
| `npm run test:unit` | 286 pruebas,44 archivos,exit0 (25 pruebas nuevas) |
| `npm run typecheck` | exit0 |
| `npx eslint src/lib/analytics-consent src/components/analytics/consent scripts/verify-analytics-consent.mjs` | exit0 |
| `npm run check:public-boundary` | exit0,22 entradas |
| `node scripts/verify-analytics-consent.mjs` | exit0,320/390/768/1440,claro/oscuro |

El ensayo comprueba botones de44px, prominencia equivalente, casillas inicialmente desmarcadas, ausencia de carga de proveedores sintéticos hasta aceptar, elección sólo Umami, retirada, persistencia tras recarga, reapertura/foco/Escape, cambio desde otra pestaña, aceptación de ambos, señal de privacidad y almacenamiento bloqueado. Cero errores JS en los cuatro recorridos de anchuras. Capturas en `.audit/analytics-consent-2026-09-16/`; no se incluyen en el commit.

Se corrigieron nombres accesibles de casillas (nombre separado de descripción), foco al reabrir y reapertura tras invalidación externa. El ensayo se ajustó para esperar el foco del siguiente frame antes de Escape y para no intentar reabrir una tarjeta ya abierta por cambio externo.

Peso del **harness entero, incluyendo React/ReactDOM**: JS gzip63.212 bytes; CSS gzip994 bytes. No es incremento de bundle del portfolio. Sin dependencia nueva. No hay ensayo de zoom200%, dispositivo físico, build final ni integración sobre páginas del portfolio; esos controles siguen abiertos.

## Puertas de integración que NO están cerradas

1. Resolver relevo de archivos públicos solicitado a Claude mediante Hub, mensaje008574fe-ea1f-435c-a05b-cbc124b1d7c6 (anteriorca92fc43). Bandeja del tema vacía no acredita respuesta ni liberación. No se han alterado `src/app/layout.tsx`, `src/lib/umami-tracker.ts` ni `src/app/privacidad/page.tsx`.
2. Implementar adaptadores reales y wrapper Next. Retirar bootstrap Umami anterior en la misma integración. `WebVitalsReporter` tiene envío propio previo al consentimiento; inspeccionar finalidad y activación efectiva, no ocultarlo bajo la etiqueta «necesario».
3. Verificar configuración remota GA4: medición mejorada apagada; no Signals/publicidad/User-ID. Probar que SDK no filtra URL/referrer/títulos/valores y que el rechazo y retirada detienen peticiones reales. No evadir bloqueadores.
4. Borrado selectivo de cookies propias de esta integración y retirada segura del runtime, evitando pérdida de formularios; retirada no borra histórico remoto. El controlador sólo llama al adaptador; no acredita estos efectos todavía.
5. Completar información de privacidad: inventario, finalidades, proveedores, retención efectiva, transferencias y retirada; evitar prometer anonimato. El enlace de la tarjeta apunta a la página existente, aún no actualizada, por eso no debe montarse aisladamente en producción.
6. Comprobar web real móvil/escritorio, tema, teclado, zoom, Contacto, navegación Next, SDK y bundle. Sólo después evaluar publicación con autoridad aplicable. Sin gasto ni CMS desplegado.

**Siguiente responsable:** Codex para adaptadores/integración/pruebas; Claude para respuesta al relevo público, o Manuel para modificar explícitamente ese reparto. Esta entrega no requiere claves del usuario ni plan de pago. La API del Dashboard es otro incremento.

## Fuentes consultadas

- AEPD, Guía sobre uso de cookies (PDF mayo2024 consultado16/09/2026): https://www.aepd.es/guias/guia-cookies.pdf
- Google, controles de privacidad y deshabilitación: https://developers.google.com/tag-platform/security/guides/privacy
- Umami, configuración auto-track/before-send: https://docs.umami.is/docs/tracker-configuration

Diseño orientado a cumplir los requisitos aplicables; no constituye certificación jurídica del sitio ni evidencia de que la versión publicada ya los cumpla.
