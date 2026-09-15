import type { Metadata } from 'next'
import Link from 'next/link'
import styles from './privacy.module.css'

export const metadata: Metadata = {
  title: 'Privacidad',
  description: 'Información sobre la medición de visitas y el contacto en el portfolio de Manuel García-Llera Añón.',
  alternates: { canonical: '/privacidad' },
}

export default function PrivacyPage() {
  return <main className={styles.page}>
    <Link href="/">← Volver al portfolio</Link>
    <h1>Privacidad</h1>
    <p>Este portfolio pertenece a Manuel García-Llera Añón. Para consultas sobre tus datos puedes escribir a <a href="mailto:hello@manuelgarciallera.com">hello@manuelgarciallera.com</a>.</p>
    <h2>Medición de visitas</h2>
    <p>Utilizo Umami Cloud para conocer qué páginas se visitan y desde qué sitios llegan las visitas, y mejorar el portfolio. La configuración envía la ruta de la página sin parámetros ni fragmentos, el origen del sitio de referencia, idioma y tamaño de pantalla. El proveedor recibe además la información técnica necesaria para procesar la conexión; esto no identifica por nombre a quienes visitan la web.</p>
    <p>No se envían a Umami los campos del formulario, nombres, correos, títulos de página ni identificadores personales añadidos por esta web. No activo grabación de sesiones ni seguimiento publicitario. Las pruebas locales y los dominios de previsualización no cargan este seguimiento.</p>
    <p>La integración respeta las señales «Do Not Track» y «Global Privacy Control» del navegador: cuando están activas, no carga Umami. Si tu navegador o bloqueador impide la medición, el portfolio sigue funcionando.</p>
    <p>Consulta también la <a href="https://umami.is/privacy" target="_blank" rel="noreferrer">política de privacidad de Umami</a>. La duración de conservación y otras condiciones dependen del plan contratado; no se promete conservación indefinida.</p>
    <h2>Contacto y preferencias</h2>
    <p>Si utilizas el formulario, los datos que facilites se usan para recibir y responder tu consulta, por un circuito separado de la analítica. Puedes solicitar información o eliminación de tu consulta escribiendo al correo indicado. La preferencia de tema claro u oscuro se conserva localmente en tu navegador.</p>
    <p>Última actualización: 15 de septiembre de 2026.</p>
  </main>
}
