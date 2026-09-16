# Cierre técnico del consentimiento · 16/09/2026

Continuación de f54fc6d y 4bcc32b. Manuel solicita dejarlo implementado para aceptar y recopilar visitas; no autoriza planes de pago ni nuevas credenciales. Este recibo sustituye los pendientes históricos de presupuesto y comprobación de cuentas. **No publicado todavía.**

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

## Bloqueo exacto de publicación

Vercel get_project devuelve 404 para el proyecto enlazado localmente prj_FPjndwATLizeajuQIOTyhYQBPi85. El conector sí reconoce el equipo correcto, pero su listado sólo devuelve otros dos proyectos. La sesión Chrome redirige a Login de Vercel; Continue with GitHub solicita usuario y contraseña. Esto no demuestra que el proyecto esté borrado. No se modifica .vercel/project.json, no se crea sustituto, no se sube el workspace privado ni se promueve otro proyecto.

Siguiente Manuel: iniciar sesión en Vercel con la cuenta que administra el portfolio. Siguiente Codex: comprobar proyecto, SHA de producción y alcance del release, publicar sólo el cambio aprobado y verificar una recogida real mínima. No se ha enviado tráfico de prueba a los informes ni se certifica cumplimiento jurídico universal.
