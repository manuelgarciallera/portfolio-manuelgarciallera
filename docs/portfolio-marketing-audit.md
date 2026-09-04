# Auditoría de posicionamiento y conversión

## Objetivo

El portfolio debe convertir atención en una conversación profesional y, a medio plazo, construir autoridad para una línea doctoral en HCI. La promesa central es: **Product Designer y Design Engineer que investiga sistemas complejos y puede llevarlos de la evidencia al código.**

## Vulnerabilidades detectadas

1. **Demasiadas identidades simultáneas.** UX/UI, full stack, IA, investigación y cultura material pueden parecer perfiles separados. Solución: presentarlos como fases de una sola práctica: investigar, sistematizar y construir.
2. **Profundidad antes de deseo.** Los textos extensos demuestran rigor, pero exigen atención antes de ganarla. Solución: portada visual, explicación breve y evidencia; documentación completa después.
3. **Riesgo de autoría difusa.** Los proyectos colectivos pueden generar dudas sobre la contribución. Solución: primera persona precisa, créditos y límites visibles.
4. **Proyectos con acabado desigual.** Una cuadrícula uniforme expone las diferencias de material disponible. Solución: dirección visual específica y relatos modulares; no fingir el mismo tipo de evidencia.
5. **IA como palabra genérica.** Mencionarla sin decisiones verificables rebaja credibilidad. Solución: documentar qué ejecutó, qué criterio humano se aplicó y qué límite tuvo.
6. **Conversión tardía.** Un visitante puede entender el perfil y marcharse sin siguiente paso. Solución: CTA contextual tras cada historia y continuidad automática hacia otro caso.
7. **Inspiración demasiado reconocible.** Copiar superficies de Clay dañaría la autoría. Solución: adoptar ritmo editorial, escala y activación, pero construir materiales desde los proyectos de Manuel.

## Contrato de voz

- Titular: una idea, ocho palabras cuando sea posible.
- Entradilla: problema y resultado, sin adjetivos vacíos.
- Primera persona: sólo para contribución y decisiones reales.
- Equipo: nombrar colaboración y límites sin falsa modestia.
- Evidencia: pantalla, componente, flujo, prueba o código cerca de cada afirmación.
- CTA: describir lo que ocurrirá —“Ver caso de estudio”, “Recorrer el producto”, “Leer el artículo”.

## Embudo

1. **Captar:** hero y portadas vivas.
2. **Orientar:** capacidades inmediatamente visibles.
3. **Convencer:** casos con evidencia fragmentada.
4. **Profundizar:** artículos indexables y firmados.
5. **Convertir:** contacto contextual y siguiente contenido.

## Estado de implementación — 2 septiembre 2026

- La promesa central se mantiene en todas las rutas: producto, sistemas, código e investigación forman una sola práctica.
- La landing muestra capacidades antes de pedir profundidad y alterna evidencia, color y texto breve.
- Los cuatro casos publicados incluyen tres pruebas rápidas, contribución explícita, relato visual y continuidad hacia el siguiente caso.
- Los cuatro artículos están firmados con retrato, biografía, LinkedIn, enlaces a casos y lecturas relacionadas.
- LinkedIn y contacto son accesibles desde cabecera, menú móvil, cuerpo y footer; el correo receptor permanece privado.
- Las animaciones continuas se detienen fuera del viewport y las secciones largas se componen sólo al acercarse.
- El 404 conserva la marca y devuelve al visitante al embudo.

## Riesgos que siguen abiertos

1. **Entrega de correo sin proveedor configurado.** La ruta está lista, pero requiere `RESEND_API_KEY` y un remitente verificado para enviar de verdad.
2. **Evidencia visual desigual.** The UX Union y Buy&Sell ya tienen material abundante; LaLiga y Coordination Hub ganarán credibilidad cuando se incorporen capturas reales adicionales sin datos sensibles.
3. **Autoridad editorial aún sin distribución.** Los artículos construyen SEO on-site, pero necesitan publicación y enlaces desde LinkedIn para empezar a generar señales externas.
4. **Afirmaciones sin métricas de negocio.** Se muestran alcance y complejidad, no resultados inventados. Cuando existan datos verificables, conviene sustituir pruebas técnicas por impacto observado.

## Verificación técnica

- 34 pruebas unitarias en 16 archivos.
- Responsive inspeccionado entre 320 y 1920 px, incluidos los breakpoints 768 y 1024.
- Lighthouse de producción: escritorio 99/100/100/100; móvil 92/100/100/100.
- CLS 0 en ambos formatos; TBT 10 ms en escritorio y 100 ms en móvil.
- Build de 27 rutas completado y auditoría npm sin vulnerabilidades.
