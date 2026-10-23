import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Encabezado from './Encabezado.jsx'
import { IconoDescarga, IconoWhatsapp } from './Iconos.jsx'
import Reproductor from './Reproductor.jsx'
import { descargarHref, evento, getContenido, partesTitular, whatsappHref } from './contenido.js'
import './juan.css'

/** El recurso del momento: el video de Juan y el recurso, que se descarga o se pide por WhatsApp. */
export default function Video() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getContenido().then(setDatos).catch((e) => setError(e.message))
  }, [])

  const r = datos?.destacado
  useEffect(() => {
    if (r) {
      evento(r.slug, 'visita', 'landing')
      document.title = `${r.titulo} · Juan Carrizo`
    }
  }, [r])

  if (error) return <main className="jv"><Encabezado /><p className="jv-estado">{error}</p></main>
  if (!datos) return <main className="jv"><Encabezado /><div className="jv-cargando" aria-label="Cargando" /></main>
  if (!r) {
    return (
      <main className="jv">
        <Encabezado />
        <section className="jv-hero">
          <h1 className="jv-h1">Todos los <em>recursos</em></h1>
          <Link className="jv-cta" to="/biblioteca">Ver la biblioteca</Link>
        </section>
      </main>
    )
  }

  const regalo = r.entrega === 'regalo'
  return (
    <main className="jv">
      <Encabezado />
      <section className="jv-hero">
        <span className="jv-pill">Video + recurso</span>
        <h1 className="jv-h1">
          {partesTitular(r.titular).map((p, i) => (p.rojo ? <em key={i}>{p.t}</em> : <span key={i}>{p.t}</span>))}
        </h1>
        <p className="jv-sub">
          <b>Mirá el video completo</b> y {regalo ? 'llevate el recurso' : 'pedime el recurso por WhatsApp'} para armar tu propio proceso.
        </p>
        <Reproductor recurso={r} />
        {regalo ? (
          <a className="jv-cta" href={descargarHref(r.slug)} target="_blank" rel="noreferrer">
            <IconoDescarga />Descargar recursos
          </a>
        ) : (
          <a className="jv-cta wa" href={whatsappHref(r.slug, 'landing')} target="_blank" rel="noreferrer">
            <IconoWhatsapp />Pedir el recurso por WhatsApp
          </a>
        )}
        <Link className="jv-mas" to="/biblioteca">Ver todos los recursos →</Link>
      </section>
    </main>
  )
}
