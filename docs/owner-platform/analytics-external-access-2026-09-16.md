# Acceso externo a estadísticas — 16/09/2026

Manuel aprobó conservar Umami sin Pro y añadir acceso externo desde el Dashboard. La API de su cuenta exige Pro; no hay sincronización automática. No se ha aprobado migración a GA4. Las capturas de Manuel confirman actividad en el panel Umami, potencialmente QA.

## Implementación

OwnerOverview muestra «Abrir estadísticas en Umami» hacia la propiedad UE del portfolio, en pestaña nueva con noopener/noreferrer. Reutiliza los estilos/tamaño táctil existentes y avisa de sesión externa y falta de sincronización. Disponible con o sin snapshots. No API key, iframe, login nuevo, llamadas externas automáticas ni cambios públicos.

## Pruebas nuevas

- RED: dashboard.browser falla en las ocho variantes porque falta el enlace (197b60).
- GREEN: mismo harness pasa 320/390/768/1280, claro/oscuro, con estadísticas vacías y sintéticas. Verifica destino exacto, pestaña nueva, noreferrer, permanencia y ausencia de overflow (5d4807/a92aa7).
- 99 pruebas analytics/dashboard en 29 archivos pasan (4c6bc6).
- Typecheck y ESLint focal pasan (770dbf); diff check correcto.
- Es verificación de componentes reales con HTTP simulado, no sesión completa de Payload ni prueba del móvil físico. No nueva compilación de producción o despliegue CMS.

## Pendientes y continuidad

### Compilación completa — 08:56 Madrid

Build nativo Windows sobre `f8145cf`: `npm run build` en owner-platform termina0 (647909), TypeScript y generación23/23 correctas. Incluye Dashboard con enlace externo, no servidor desplegado ni prueba de correo/DB real. No otros builds owner activos detectados; caché dev pública conservada. Frontera pública22 entradas PASS y checkpoint0f0adf686b2752e23c25d224f8c60815b10fd451 intacto (f611cf). Git conserva únicamente los cinco documentos compartidos previamente modificados: build no introduce cambios rastreados. No se considera resuelta la intermitencia histórica de Windows por este resultado.

### Regresión de acceso — 08:23 Madrid

Sobre40ea12c: harness ampliado con respuesta403 del resumen tras recarga; verifica ausencia de acciones editoriales, métricas y enlace externo. Al reintentar con respuesta válida recupera seis acciones, acceso Umami y aviso de datos sintéticos. Ocho variantes pasan (7fa8b6/1fc0f4), ESLint/diffcheck pasan (2ae202). Solo pruebas: no fallo runtime encontrado, no prueba de revocación en caliente ni del servidor de autenticación Payload.

El enlace no arregla el rechazo de conexión en el móvil: afecta también a Google Analytics, causa todavía desconocida. No se cambia configuración de red ni protecciones. Acceso CMS remoto/alojamiento siguen independientes; no se declara CMS desplegado.

Automatización existente reactivada hasta 16/09 15:50 Europe/Madrid, cada 30 minutos, para estabilidad CMS y pruebas acotadas; pausa al terminar, sin gasto, exposición CMS, nuevos permisos ni migración. Depende de disponibilidad de host/app. Próximo responsable: Codex, revisar puertas operativas y avances posteriores antes de elegir el siguiente hito.
