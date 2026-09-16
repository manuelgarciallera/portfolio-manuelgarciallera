# Decisión: medición mínima y analítica opcional

16/09/2026 · Codex · Encargo de Manuel: estudiar España, UE y Estados Unidos y decidir la ejecución. Base local `139e4e8`; publicación previa documentada en [recibo](analytics-consent-release-2026-09-16.md). Investigación y diseño, no dictamen jurídico profesional ni certificación multinacional. No se activa nueva recogida en este turno.

## Decisión ejecutiva

1. Mantener GA4 y Umami sujetos a elección afirmativa, por separado. No activar Consent Mode avanzado ni pings analíticos al rechazar.
2. Conservar el tratamiento técnico imprescindible para servir y proteger la web, separado de marketing. No reutilizar retrospectivamente registros de seguridad como historiales de navegación.
3. Elegir como siguiente desarrollo una capa de **contadores operativos agregados en servidor**, sin SDK público adicional ni seguimiento. Activarla únicamente después de acreditar fuente, fundamento jurídico y contratos. Ser server-side no implica estar exento.
4. No activar por defecto dispositivos, localización, referentes, scroll, clics o sesiones bajo la etiqueta «necesarias». El margen español permite estudiar algunas mediciones adicionales; no necesitamos agotarlo en el piloto.
5. Separar en Dashboard «Peticiones técnicas» y «Analítica consentida», sin sumar ni confundir sus métricas.
6. **No contratar Umami Pro ahora.** Pagar habilita prestaciones, no una base jurídica. Mantener dos alternativas comerciales de analítica, no imponer dos proveedores a cada cliente.

## Fundamento contrastado

### España

El [artículo 22.2 LSSI](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758#a22) exige consentimiento para almacenamiento/acceso al terminal, salvo excepciones de transmisión y servicio expresamente solicitado. Una finalidad comercial útil no se convierte por ello en imprescindible. Guardar una preferencia solicitada y medir navegación son finalidades distintas.

La [guía AEPD de medición de audiencia](https://www.aepd.es/guias/guia-cookies-analiticas-externas.pdf), apartados II–III, admite exención condicionada: audiencia exclusiva para el editor, resultados estadísticos anónimos, sin cruces ni seguimiento entre sitios. Exige información, conservación limitada, evaluación documentada y garantías del encargado, incluida ausencia de reutilización y separación por editor. Sus referencias de 13 meses para dispositivos y máximo 25 para información no son objetivos de conservación del producto. No hemos acreditado todos esos requisitos en el contrato/configuración de Umami Cloud actual: no lo reclasificaremos como exento.

### Unión Europea

El [RGPD, texto oficial BOE](https://www.boe.es/buscar/doc.php?id=DOUE-L-2016-80807), considerando 26 y artículos 5, 6, 13, 21, 25, 28 y 44, distingue anonimato real de datos personales. El tratamiento previo a anonimizar necesita fundamento; hashear una IP no garantiza anonimato. El interés legítimo requiere finalidad, necesidad y ponderación, además de información y derechos. No sustituye consentimiento exigido por ePrivacy. Región UE del proveedor no basta para descartar transferencias internacionales.

Las [directrices finales EDPB 2/2023, versión 2.0](https://www.edpb.europa.eu/system/files/documents/2024-10/edpb_guidelines_202302_technical_scope_art_53_eprivacydirective_v2_en_0.pdf), §§52–56, contemplan procesamiento local y seguimiento por IP. Recibir datos en servidor no resuelve automáticamente el análisis. El documento separa ámbito técnico y evaluación de exenciones. No basaremos la solución en IP hasheada, fingerprints ni beacons alternativos.

La [CNIL, julio de 2025](https://www.cnil.fr/fr/cookies-solutions-pour-les-outils-de-mesure-daudience), exige condiciones y autoevaluación para audiencia exenta y advierte que no equivalen a certificación CNIL. La excepción española no autoriza automáticamente toda Europa: cada implantación requiere determinar legislación y autoridades aplicables.

### Estados Unidos

La [CCPA/CPRA, explicación oficial de California](https://oag.ca.gov/privacy/ccpa), contempla condiciones de aplicación, transparencia y derechos, incluida oposición a venta/compartición publicitaria mediante GPC. No superar un umbral no elimina otras obligaciones.

La [autoridad de Colorado](https://coag.gov/resources/colorado-privacy-act/) identifica supuestos que necesitan consentimiento, incluidos datos sensibles y finalidades secundarias; sus [mecanismos universales de oposición](https://coag.gov/opt-out/) deben respetarse cuando corresponda. Mantendremos una política conservadora común, sin añadir geolocalización para elegir un régimen más permisivo.

[Maryland §14-4707](https://mgaleg.maryland.gov/2026RS/Statute_Web/gcl/14-4707.pdf) establece necesidad y proporcionalidad para el servicio solicitado, restricciones de datos sensibles y publicidad/venta respecto de menores. El consentimiento no cura cualquier exceso de recogida.

[COPPA, FAQ de la FTC](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions), actualizada con la reforma de 2025, recoge obligaciones específicas para servicios dirigidos a menores de 13 años o con conocimiento relevante. Los identificadores persistentes pueden estar cubiertos; la excepción de operaciones internas no es permiso general para analítica comercial infantil.

**Límite del estudio:** estas fuentes permiten adoptar un diseño conservador, no certificar los 50 estados, todas las normas europeas o sectores regulados. Antes de ofrecerlo a salud, menores, educación, finanzas o productos con grabaciones: revisión específica de jurisdicción, comunicaciones/interceptación, datos sensibles y contratos. No prometer «cumplimiento mundial».

## Especificación decidida de la capa candidata

Finalidad: disponibilidad, demanda técnica y dimensionamiento de este sitio; sin marketing individual, atribución, enriquecimiento CRM o cruces entre clientes.

| Elemento | Diseño y límite |
| --- | --- |
| Entrada | Preferir agregados ya disponibles en el alojamiento para esta finalidad. No importar logs brutos. Si faltan, evaluar agregación en el punto de servicio antes de autorizar una nueva captura. |
| Unidad | Peticiones, no personas ni necesariamente vistas. Documentar bots, caché, prefetch, reintentos y navegación cliente. |
| Persistencia candidata | `siteKey`, `dayUTC`, `publicRouteKey`, `statusClass`, `requestCount`. Histograma fijo de latencia del servidor solo si la fuente lo proporciona. Sin eventos individuales persistidos por nuestra capa. |
| Rutas | Lista cerrada de páginas públicas; excluir URLs libres, query, hash, referentes, formularios, cabeceras, cuerpos, owner, API y preview. |
| Identidad | Ninguna IP almacenada por nuestra capa, ni hash, sesión, usuario o fingerprint. Inventariar aparte el procesamiento de IP del alojamiento para entrega/seguridad. |
| Minimización | Sin país, dispositivo u hora exacta. Agrupar/suprimir celdas pequeñas y evitar reconstrucción por diferencias. Un umbral numérico aislado no garantiza anonimato. |
| Retención propuesta | Agregados del piloto: 90 días, purga automática, revisión de utilidad a los 30 días. Decisión de producto, no plazo legal universal. Retención real de logs del proveedor: comprobar por separado. |
| Acceso | Servidor y Dashboard autenticado; separación por sitio y credenciales fuera del navegador. |
| Preferencias | Mantener rechazo/revocación/GPC/DNT en analítica opcional. Excluir voluntariamente del conteo no esencial cuando conozcamos oposición, sin identificar al visitante. No prometer eliminar comunicación/seguridad necesarias. |
| Fallos | Mostrar «No disponible», no cero ni datos simulados. No degradar la web para obtener métricas. |

La API de agregados disponible en el plan Vercel concreto **no está acreditada en este estudio**. No se selecciona un endpoint supuesto, Drains, una base nueva o un plan de pago. Si el alojamiento no permite el diseño, conservar únicamente la analítica consentida; no recurrir a una técnica más invasiva.

## Ejecución y puertas de lanzamiento

1. Inventariar fuente de alojamiento: campos, finalidad, caché, retención, región, destinatarios, contratos, acceso y coste. Inspección de metadatos y datos sintéticos, no exportación de trazas de visitantes.
2. Documentar finalidad/necesidad/ponderación y evaluación del acceso al terminal; DPA, subencargados, reutilización y transferencias. Evaluar necesidad de EIPD sin presuponer resultado. Obtener revisión jurídica cualificada antes de activar medición sin consentimiento o vender esa modalidad.
3. Prototipo aislado con fixtures; contrato de agregados y pruebas negativas. No conectar tráfico real sin superar las puertas anteriores.
4. Adaptador y Dashboard con fuente, definición, cobertura, actualización y retención visibles. No mezclar usuarios GA4 con visitantes Umami o peticiones.
5. Privacidad acorde al flujo aprobado, pruebas desktop/mobile, auditoría de red/almacenamiento, purga y desconexión. Publicación controlada con recibo de resultados reales.

Responsable técnico: Codex. Manuel interviene solo ante gasto, contrato, acceso no disponible o validación del responsable sobre el expediente jurídico; no hacen falta claves por chat ahora. [Plan de viabilidad](../superpowers/plans/2026-09-16-analytics-lawful-baseline.md).

## Reutilización comercial

Dos modalidades, no dos grados de legalidad: GA4 para necesidades del ecosistema Google; Umami para control/simplicidad según alojamiento y alcance. La base operativa es otra capa y no sustituye visitantes, embudos o campañas. Suscripciones, implantación y soporte se presupuestan separados según la [comparación canónica](analytics-provider-strategy-2026-09-16.md). API disponible no acredita derecho de reventa ni idoneidad jurídica. No hay gasto aprobado por esta decisión.
