import type { Metadata } from 'next'
import styles from './privacy.module.css'

export const metadata: Metadata = {
  title: 'Privacidad',
  description: 'Información sobre la medición de visitas y el contacto en el portfolio de Manuel García-Llera Añón.',
  alternates: { canonical: '/privacidad' },
}

export default function PrivacyPage() {
  return <main className={styles.page}>
    {/* Full navigation is intentional: this informational page needs no Link/prefetch client bundle. */}
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
    <a href="/">← Volver al portfolio</a>
    <h1>Privacidad y cookies</h1>
    <p>Este portfolio pertenece a Manuel García-Llera Añón. Para consultas sobre tus datos puedes escribir a <a href="mailto:hello@manuelgarciallera.com">hello@manuelgarciallera.com</a>.</p>
    <h2>Qué medimos y para qué</h2>
    <p>Con tu consentimiento, Google Analytics y Umami Cloud permiten conocer las visitas y el uso de las páginas para mejorar los contenidos del portfolio. Puedes autorizar uno, ambos o ninguno. No se cargan antes de aceptar y rechazar no limita el acceso a la web.</p>
    <p>Enviamos únicamente rutas públicas conocidas, sin parámetros de búsqueda ni fragmentos. No enviamos el sitio de procedencia, títulos libres de páginas, nombres, correos ni contenido de formularios. No activamos publicidad personalizada, Google Signals, identificadores de usuario añadidos, grabación de sesiones ni mapas de calor.</p>
    <p>Google Analytics utiliza identificadores de navegador en cookies y datos técnicos para elaborar estadísticas de visitas y sesiones. Umami mide visitas sin cookies de seguimiento. Ambos proveedores reciben información de la conexión, como la dirección IP y el navegador; no debe confundirse la ausencia de nombres con anonimato absoluto. Los informes no permiten saber el nombre de cada visitante.</p>
    <h2>Tu elección</h2>
    <p>La base de esta medición es tu consentimiento. El aviso ofrece aceptar, rechazar y configurar cada herramienta. Cerrar el aviso, pulsar fuera o seguir navegando no equivale a aceptar. Las opciones de analítica empiezan desactivadas.</p>
    <p>Puedes cambiar o retirar tu elección en el botón «Preferencias de analítica», al pie de cualquier página. La retirada detiene los nuevos envíos y elimina las cookies de Google creadas por esta integración; no borra los informes anteriores ni puede cancelar una petición que ya se haya enviado. No se recarga la página ni se borran formularios al retirar el consentimiento.</p>
    <p>Respetamos «Do Not Track» y «Global Privacy Control»: si están activos, la medición permanece desactivada. Las pruebas locales, las previsualizaciones y las rutas no incluidas en el contenido público no activan el seguimiento. Si un bloqueador impide la medición, puedes seguir navegando.</p>
    <h2>Almacenamiento en tu navegador</h2>
    <div className={styles.tableWrap}><table>
      <caption>Elementos utilizados por esta integración</caption>
      <thead><tr><th>Elemento</th><th>Finalidad y proveedor</th><th>Duración</th></tr></thead>
      <tbody>
        <tr><td><code>portfolio-analytics-consent-v1</code></td><td>Almacenamiento local propio: recordar tu elección, también si rechazas.</td><td>Validez de 180 días. Después se solicita una nueva elección.</td></tr>
        <tr><td><code>mgl_ga</code><br /><code>mgl_ga_SD9S08GHWS</code></td><td>Cookies de Google Analytics: distinguir navegadores y mantener el estado de las sesiones. Sólo tras aceptar Google Analytics.</td><td>Hasta 180 días, sin renovación automática por cada visita; eliminación al retirar el permiso.</td></tr>
        <tr><td><code>rd-theme</code></td><td>Almacenamiento local propio: recordar el tema claro u oscuro que elijas.</td><td>Hasta que cambies la elección o borres el almacenamiento del navegador.</td></tr>
      </tbody>
    </table></div>
    <p>Guardar la elección de privacidad no autoriza la analítica. Puedes borrar estos elementos desde tu navegador; si eliminas la elección, la siguiente visita volverá a mostrar el aviso.</p>
    <h2>Proveedores y conservación de informes</h2>
    <p>Los destinatarios de los datos de medición son Google, a través de Google Analytics, y Umami, a través de Umami Cloud. Pueden intervenir infraestructuras y subencargados fuera del Espacio Económico Europeo. Sus condiciones detallan el tratamiento y las garantías para las transferencias internacionales: <a href="https://business.safety.google/adsprocessorterms/" target="_blank" rel="noreferrer">condiciones de tratamiento de Google</a>, <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">privacidad de Google</a> y <a href="https://umami.is/privacy" target="_blank" rel="noreferrer">privacidad de Umami</a>. Puedes solicitar información adicional sobre las garantías al correo indicado.</p>
    <p>La duración de las cookies no equivale a la conservación de los informes. La propiedad de Google Analytics está configurada con 2 meses para datos de eventos y 14 meses para datos de usuarios; el plazo de usuario se renueva con nueva actividad. Los informes agregados estándar no están sujetos a esos mismos plazos. Umami Cloud utiliza la región europea y el plan Hobby, con 6 meses de conservación. Estos informes se utilizan para comparar la evolución del portfolio y revisar sus contenidos, no para identificar personas. Puedes consultar al responsable sobre su supresión.</p>
    <h2>Contacto y preferencias</h2>
    <p>Si utilizas el formulario, los datos que facilites se usan para recibir y responder tu consulta, por un circuito separado de la analítica. Puedes solicitar información o eliminación de tu consulta escribiendo al correo indicado. La preferencia de tema claro u oscuro se conserva localmente en tu navegador.</p>
    <h2>Tus derechos</h2>
    <p>Puedes solicitar acceso, rectificación, supresión, limitación, oposición y portabilidad cuando procedan, así como retirar el consentimiento, escribiendo a <a href="mailto:hello@manuelgarciallera.com">hello@manuelgarciallera.com</a>. La retirada no afecta a la licitud del tratamiento anterior. Si consideras que tus derechos no se han atendido, puedes reclamar ante la <a href="https://www.aepd.es/" target="_blank" rel="noreferrer">Agencia Española de Protección de Datos</a>.</p>
    <p>Última actualización: 16 de septiembre de 2026.</p>
  </main>
}
