# Cierre técnico del consentimiento · 16/09/2026

Continuación de f54fc6d y 4bcc32b. Manuel solicita dejarlo implementado para aceptar y recopilar visitas; sin planes de pago. Este recibo sustituye los pendientes históricos de presupuesto y comprobación de cuentas. **Publicado y verificado en producción el 16/09/2026.**

## Ejecución en producción · 13:08 CEST

Manuel autorizó Vercel CLI mediante el flujo oficial de dispositivo, con su cuenta Google, y solicitó «Avanza hasta la ejecución». `whoami` y `project inspect` confirman usuario manuelgarciallera y proyecto prj_FPjndwATLizeajuQIOTyhYQBPi85. El bloqueo de acceso descrito al final es histórico y está resuelto; no debe volver a pedirse login sin comprobarlo.

- Push acotado de 2ebd747 a **581a820fe61c74ce9d4189e15e6e5ae4b34c2c1e**, rama existente codex/checkpoint-pre-editor-2026-09-04. Sin subir el workspace sin commit ni modificar main. Diff de producción limitado a analítica/privacidad; dependencias y demás contenido público intactos.
- GitHub Actions **35088265320: SUCCESS**, validate y owner correctos (606e15). Repetición local: 280/43 y frontera22 PASS (b49f9c).
- Preview **dpl_7z5vhptXn6erhCUx62TZS5tQkXkL: READY**. Build Next16.3.4, 30 páginas, 24 s de build Vercel; HTML privado consultado con vercel curl sin desactivar protección. Retención correcta y antiguo script ausente. El aviso se monta al hidratar, no en HTML SSR.
- Promoción ejecutada y verificada: **dpl_B3JukeQZyfm5uYtKe6JSYsHVKMnD**, target production, READY, SHA581a820; dominio https://manuelgarciallera.com. Vercel creó un deployment de producción al promover, no se supone que el ID del preview sea el ID final.
- `CONSENT_LIVE_TEST=1 node scripts/verify-analytics-live.mjs`: **PASS exit0** (883a1e), sobre dominio real sin interceptar. Escritorio1440: rechazar, cero solicitudes analíticas. Móvil390: cero solicitudes antes de aceptar, SDK200, **Umami POST /api/send200 y GA4 /g/collect204**. Tras retirar y navegar: cero solicitudes nuevas, cookies mgl_ga eliminadas, cero errores JS. Una vista consentida de prueba por proveedor en /privacidad; sin parámetros ni datos sintéticos.
- La recepción HTTP acredita aceptación en los colectores; no equivale a haber consultado la aparición en cada informe del Dashboard del proveedor. CMS sigue sin conector API real. No se han comprado planes ni cambiado DNS.
- Reversión identificada: deployment previo **dpl_8LDCkrdVAGvgAvaDCi6UVwNJb8YF**, SHA f72a420. Contiene el tracker anterior: no revertir automáticamente sin valorar esa diferencia de privacidad.
- Coordinación: dbf1636c documenta autoridad directa y alcance; sin aprobación ajena inferida.
- Observabilidad posterior: consulta de logs nivel error, deployment final, últimos15min: sin entradas (768d75). Es una ventana limitada, no una garantía de ausencia de fallos futuros. Drains no inspeccionados ni instalados; no se añade monitor periódico.

## Implementado

- Preferencias detalladas descargadas al abrirlas; aceptar/rechazar siguen disponibles si falla ese fragmento. Error recuperable con reintento.
- Mismo diseño responsive aprobado y botones equivalentes. Sin nuevas dependencias ni cambio de baseline.
- Menos JavaScript inicial: privacidad 73.928 B raw / 25.891 B gzip; incremento frente a baseline +2.040 B / +668 B. Presupuesto de todas las rutas verde. La descarga diferida no significa que desaparezca el peso al abrir los detalles.
- Privacidad actualizada con conservación real, verificada en las sesiones autenticadas existentes.

## Cuentas verificadas, sin cambiar medición ni comprar planes

- GA4: propiedad 554614432, flujo 15787738010, G-SD9S08GHWS. Medición mejorada **desactivada**; etiquetas de sitios conectadas: 0. Conservación de eventos 2 meses y de usuarios 14 meses; renovación con actividad activa. No extrapolar estos plazos a informes agregados estándar. Se descartaron comunicaciones comerciales opcionales del asistente inicial.
- Umami: sitio 7c0010a4-8f44-4340-8ee2-d8a7bda1152c, dominio manuelgarciallera.com, región EU, Hobby gratuito con 6 meses de conservación. No se cambió de plan ni se obtuvo una API key.
- No hacen falta claves nuevas para la recogida del sitio. El Dashboard CMS **no tiene aún un conector de informes reales**; esa fase requiere acceso autorizado a la API y no queda resuelta por instalar el tracker.

## Verificación

- 280 pruebas unitarias / 43 archivos; lint focal correcto.
- Build Next de producción: 30 páginas, TypeScript correcto (b7d38f).
- Bundle fresco y baseline intacta: errores [] (43bbcc).
- 24 escenarios responsive Chromium: 320–1920 px, horizontal/vertical, ambos temas, texto 200%, foco, teclado y sin overflow (22f8c5). No son dispositivos físicos.
- SDK oficiales con colectores interceptados: carga tras consentimiento, saneado de URL, navegación y revocación; borrado de cookies propias (f99249).
- Seguridad: DNT/GPC, almacenamiento bloqueado, preview, carga tardía tras revocar y fallo de SDK (161b19).
- E2E sobre páginas Next reales y SDK oficiales; colección interceptada, sin contaminar informes (8f63fb). Carga diferida y fallo recuperable (5a34e9); ambos repetidos tras el último texto de privacidad: PASS exit0 (141024). Unitarias y lint repetidos: 280/43 y exit0 (b8bdb1/efbe1d).
- Frontera pública 22, guards 15, tipografía/nav móvil/hero pasan. El verificador global de codificación falla en artefactos y Monaco ajenos; el mismo verificador limitado a src pasa. No se declara todo el repositorio verde.
- Las inclusiones TypeScript creadas automáticamente por el directorio de build aislado se retiran tras verificar la frescura; no afectan código runtime.

## Historial: bloqueo de publicación ya resuelto

Vercel get_project devuelve 404 para el proyecto enlazado localmente prj_FPjndwATLizeajuQIOTyhYQBPi85. El conector sí reconoce el equipo correcto, pero su listado sólo devuelve otros dos proyectos. La sesión Chrome redirige a Login de Vercel; Continue with GitHub solicita usuario y contraseña. Esto no demuestra que el proyecto esté borrado. No se modifica .vercel/project.json, no se crea sustituto, no se sube el workspace privado ni se promueve otro proyecto.

Ese era el siguiente paso pendiente; quedó completado mediante autorización de dispositivo y despliegue descritos arriba. No se certifica cumplimiento jurídico universal. Para esta recogida pública no queda ninguna clave que pedir a Manuel; el conector de informes CMS es una fase distinta.
