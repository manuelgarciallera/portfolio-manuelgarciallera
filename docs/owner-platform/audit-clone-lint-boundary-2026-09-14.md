# Clones de QA y lint raíz · 14/09/2026

Base cd327eb. El cierre raíz (sesión 95284) pasó 242 unitarias, pero lint
empezó a recorrer `.audit/owner-clean-install-230278e/owner-platform/.next`.
Babel informó chunks SSR mayores de 500 KB; el proceso llegó a 1,95 GB RAM.
Se detuvo únicamente PID 59780, identificado por su comando ESLint de este
repositorio. La sesión terminó con -1: no se presenta como lint aprobado.

La configuración flat no ignoraba `.audit`. Los clones de verificación no
están rastreados en Git, pero ESLint no usa automáticamente `.gitignore`.
La repetición encontró también chunks generados en
`.owner-verification-builds/seo-ae673c7-system-ca` (897438); se detuvo solo
su proceso ESLint PID 61080 tras identificarlo. Se añade un segundo caso
RED d98047 antes de corregirlo.

Se añaden exclusivamente `.audit/**` y `.owner-verification-builds/**` a
globalIgnores. No se borran artefactos,
no se desactivan reglas y no se excluye código publicado o tests reales.

Regresión ejecutada mediante la API real de ESLint en public-guards:

- RED fbd74e: isPathIgnored devuelve false para un chunk del clon.
- GREEN final 09b571: 15 tests pasan; ignora chunk y fuente del clon,
  además del build aislado, y sigue
  detectando no-explicit-any en texto evaluado con ruta `src/...`.

La prueba está incluida en `npm run test:public-guards`, no es un script
manual desconectado. TypeScript no se modifica sin evidencia adicional.
Repetición normal `npm run lint` y `npm run typecheck`: sesión 14565,
salida 0 a5de47. Sin errores ni modificación de tsconfig. Las 242 pruebas
unitarias raíz ya habían pasado en la ejecución inicial e65b5a; no se
presenta esa ejecución interrumpida como un check completo.
Sin cambios visuales, dependencias, publicación ni borrado de datos del CMS.
