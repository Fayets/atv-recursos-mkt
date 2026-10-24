import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Encabezado from './Encabezado.jsx'
import { IconoDescarga, IconoWhatsapp } from './Iconos.jsx'
import { descargarHref, evento, getContenido, miniatura, whatsappHref } from './contenido.js'
import './juan.css'

const sinAcentos = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/**
 * Todos los recursos que Juan regaló. Los viejos se piden siempre por WhatsApp; el del momento
 * se descarga directo si es de regalo. Con ?r=palabra (el link que manda el DM de un reel
 * viejo) se cuenta la visita para ese recurso y su tarjeta queda marcada.
 */
export default function Biblioteca() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [params] = useSearchParams()
  const pedido = sinAcentos(params.get('r') || '')
  const marcada = useRef(null)

  useEffect(() => {
    document.title = 'Recursos · Juan Carrizo'
    getContenido().then(setDatos).catch((e) => setError(e.message))
  }, [])

  useEffect(() => {
    if (!datos || !pedido) return
    const r = datos.recursos.find((x) => x.slug === pedido)
    if (r) {
      evento(r.slug, 'visita', 'biblioteca')
      requestAnimationFrame(() => marcada.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
    }
  }, [datos, pedido])

  const lista = useMemo(() => {
    const t = sinAcentos(q.trim())
    return (datos?.recursos || []).filter((r) => !t || sinAcentos(`${r.palabra} ${r.titulo} ${r.tema || ''}`).includes(t))
  }, [datos, q])

  const destacado = datos?.destacado?.slug
  const regalo = datos?.destacado?.entrega === 'regalo'
  return (
    <main className="jv">
      <Encabezado />
      <section className="jv-lib-head">
        <h1 className="jv-h1 izq">Todos los <em>recursos</em></h1>
        <p className="jv-sub izq">Cada recurso que regalé en un reel. <b>Pedilo por WhatsApp</b> y te lo mando.</p>
        <div className="jv-tools">
          <input
            className="jv-buscar" type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Buscá por palabra o tema" aria-label="Buscar recurso"
          />
          {datos && <span className="jv-cuenta">{lista.length} recursos</span>}
        </div>
      </section>

      {error && <p className="jv-estado">{error}</p>}
      {!datos && !error && <div className="jv-cargando" aria-label="Cargando" />}

      <div className="jv-grid">
        {lista.map((r) => {
          const nuevo = r.slug === destacado
          const elegida = r.slug === pedido
          const poster = miniatura(r.youtube)
          return (
            <article key={r.slug} ref={elegida ? marcada : null} className={`jv-card${nuevo ? ' nuevo' : ''}${elegida ? ' elegida' : ''}`}>
              <div className="jv-mini">
                {nuevo && <span className="jv-flag">Nuevo</span>}
                {poster ? <img src={poster} alt="" loading="lazy" /> : <span className="jv-gancho">{r.gancho}</span>}
              </div>
              <div className="jv-card-body">
                <span className="jv-kw">Comentá {r.palabra}</span>
                <h2>{r.titulo}</h2>
                {r.tema && <span className="jv-meta">{r.tema}</span>}
                {nuevo && regalo ? (
                  <a className="jv-cta chico" href={descargarHref(r.slug, 'biblioteca')}>
                    <IconoDescarga />Llevate el recurso
                  </a>
                ) : (
                  <a className="jv-cta chico wa" href={whatsappHref(r.slug, 'biblioteca')} target="_blank" rel="noreferrer">
                    <IconoWhatsapp />Pedir por WhatsApp
                  </a>
                )}
              </div>
            </article>
          )
        })}
        {datos && !lista.length && <p className="jv-estado">No hay recursos con «{q}».</p>}
      </div>
    </main>
  )
}
