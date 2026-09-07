# Banco de hallazgos

Fecha de apertura: 2026-09-07. Autor: Claude. Estado: propuesta abierta a revision de Codex.

## Por que existe

Hay tareas recurrentes que producen investigacion cada semana: el radar de IA/diseno/HCI, la recopilacion de stack para webs dinamicas, las auditorias publicas, el trabajo continuo de los proyectos de cliente. Esa investigacion se esta perdiendo. Vive en hilos de chat que nadie vuelve a abrir, y cuando semanas despues hace falta -al elegir un efecto para una landing, al decidir una libreria, al escribir un articulo- se investiga otra vez desde cero.

El problema no es la falta de investigacion: es que no tiene destino. Este archivo es el destino.

## La regla

**Un hallazgo solo entra si dice donde se aplica.** Sin destino concreto no es un hallazgo, es un enlace, y los enlaces sueltos son exactamente lo que ya no funciona.

Consecuencias practicas:

- Descartar tambien se escribe, y con motivo. Un descarte sin motivo se vuelve a investigar el mes que viene.
- El destino es una pieza, no un area: `V1 · hero`, `V4 · pasarela`, `articulo 03`. No vale "el portfolio".
- Quien deposita no tiene que implementar. Depositar es barato a proposito; si depositar cuesta, deja de hacerse.
- Un hallazgo adoptado se cierra con el commit o el documento donde acabo. Ahi termina su vida en esta tabla.

## Tabla

| Fecha | Origen | Hallazgo | Donde se aplica | Estado |
| --- | --- | --- | --- | --- |
| 2026-09-07 | Recopilacion stack webs dinamicas (Manuel/ChatGPT) | Repertorio de efectos y librerias para landings de impacto | V1 · biblioteca de efectos; futuras landings de cliente | Pendiente de deposito por Codex |
| 2026-09-07 | Auditoria publica | El presupuesto de bundle solo se actualizaba a mano y bloqueaba cada ruta nueva | V1 · `scripts/update-public-bundle-baseline.mjs` | Adoptado · `f27a547` |
| 2026-09-07 | Revision del TFM Buy&Sell | Envio por SMTP contra buzon propio: sin plataforma intermedia y sin tocar el DNS | V1 · `src/lib/mailer.ts`; reutilizable en V4 | Adoptado · `6077b2f` |
| 2026-09-07 | Auditoria de dependencias | fflate GHSA-px8p-9vwx-vf98 no alcanzable desde el publico, pero corregible con dos parches | V1 · `overrides` de `package.json` | Adoptado · `b95b525` |

## Como se usa

Al cerrar una tarea recurrente, anadir una fila. Si el hallazgo no tiene destino todavia, la fila se escribe igual con destino `sin destino aun` y caduca a las cuatro semanas: si en ese plazo nadie le encuentra sitio, se borra la fila con una linea diciendo que se descarto por falta de destino. Es preferible a una lista que crece para siempre y que por eso deja de leerse.

El banco no sustituye al Hub ni al registro. El Hub transporta decisiones; el registro documenta entregas; esto guarda materia prima reutilizable entre verticales.
