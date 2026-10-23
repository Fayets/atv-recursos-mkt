import { useEffect, useMemo, useState } from 'react'
import { Flecha, LogoAtv, Lupa, MarcaAtv, Pdf, Play } from './IconosClases.jsx'
import { getClases, irHref, portadaClase, visitaClases } from './contenido.js'
import './clases.css'

// La raíz de recursos.atvos.io: el índice de las clases de Juan. El diseño es su maqueta; los
// textos, las series y los links salen de ATV Ops (Marketing → Clases), así que acá no hay
// nada escrito a mano. Los links viajan por /ir: ahí se cuenta quién abre cada cosa.

const dos = (n) => String(n).padStart(2, '0')
const pelado = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

// "*6 clases completas* sobre contenido" → lo de los asteriscos resaltado.
function conAsteriscos(texto, Etiqueta) {
  return String(texto || '').split(/(\*[^*]+\*)/).filter(Boolean).map((p, i) =>
    p.startsWith('*') && p.endsWith('*') && p.length > 2
      ? <Etiqueta key={i}>{p.slice(1, -1)}</Etiqueta>
      : <span key={i}>{p}</span>)
}

// "Fathoms + Playbooks": el signo en la tipografía de palo y lo que sigue en rojo.
function Titulo({ texto }) {
  const corte = String(texto || '').indexOf('+')
  if (corte < 0) return <h1>{texto}</h1>
  return (
    <h1>
      {texto.slice(0, corte).trim()}
      <span className="plus">+</span>
      <br />
      <em>{texto.slice(corte + 1).trim()}</em>
    </h1>
  )
}

const FILTROS = [
  { clave: 'todo', texto: 'Todo' },
  { clave: 'llamada', texto: 'Llamadas' },
  { clave: 'playbook', texto: 'Playbooks' },
]

const leerFiltro = () => {
  try {
    const f = localStorage.getItem('atv-filter')
    return FILTROS.some((x) => x.clave === f) ? f : 'todo'
  } catch {
    return 'todo'
  }
}

export default function Clases() {
  const [datos, setDatos] = useState(null)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState(leerFiltro)

  useEffect(() => {
    getClases().then(setDatos).catch((e) => setError(e.message))
    visitaClases()
  }, [])

  const pagina = datos?.pagina || {}
  useEffect(() => {
    if (pagina.titulo) document.title = `${pagina.titulo} · ATV`
  }, [pagina.titulo])

  const elegirFiltro = (clave) => {
    setTipo(clave)
    try {
      localStorage.setItem('atv-filter', clave)
    } catch { /* en incógnito no se guarda y no importa */ }
  }

  // Una sola pasada: cada recurso con su texto de búsqueda ya armado.
  const series = useMemo(() => (datos?.series || []).map((s) => ({
    ...s,
    recursos: [s.llamada, ...(s.playbooks || [])].filter(Boolean).map((r, i) => ({
      ...r,
      indice: r.tipo === 'playbook' ? i : 0,
      busca: pelado([r.titulo, r.descripcion, s.titulo,
        r.tipo === 'llamada' ? 'llamada fathom video' : 'playbook pdf'].join(' ')),
    })),
  })), [datos])

  const { visibles, cuantos } = useMemo(() => {
    const palabras = pelado(busqueda).split(/\s+/).filter(Boolean)
    const pasa = (r) => (tipo === 'todo' || r.tipo === tipo) && palabras.every((p) => r.busca.includes(p))
    const visibles = new Set()
    let cuantos = 0
    series.forEach((s) => s.recursos.forEach((r) => {
      if (!pasa(r)) return
      visibles.add(r.slug)
      cuantos += 1
    }))
    return { visibles, cuantos }
  }, [series, busqueda, tipo])

  const t = datos?.totales || {}
  const instagram = pagina.instagram || 'https://ig.me/m/juanxcarrizo'

  return (
    <div className="clases">
      <header className="head">
        <div className="wrap">
          <span className="eyebrow">{pagina.titulo || 'Fathoms + Playbooks'}</span>
          <a className="logo" href="#top" aria-label="Aumenta tu valor"><LogoAtv /></a>
          <span className="eyebrow r">{pagina.autor}</span>
        </div>
      </header>

      <main id="top">
        <section className="hero">
          <div className="wrap hero-grid">
            <div>
              <Titulo texto={pagina.titulo || 'Fathoms + Playbooks'} />
              <p className="hero-lede">{conAsteriscos(pagina.bajada, 'strong')}</p>
            </div>
            <div className="hero-side">
              <div className="stat">
                <b>{dos(t.llamadas || 0)}</b>
                <span><strong>Llamadas completas</strong><br />{pagina.notaLlamadas}</span>
              </div>
              <div className="stat">
                <b>{dos(t.playbooks || 0)}</b>
                <span><strong>Playbooks en PDF</strong><br />{pagina.notaPlaybooks}</span>
              </div>
              <div className="stat">
                <b>{t.horas || '—'}</b>
                <span>
                  <strong>De contenido</strong><br />
                  {t.minutos ? `${t.minutos} minutos de llamadas y ${t.playbooks} PDFs ` : ''}
                  {pagina.notaContenido}
                </span>
              </div>
            </div>
          </div>
        </section>

        {error ? <p className="empty show">{error}</p> : null}
        {!datos && !error ? <p className="empty show">Cargando las clases…</p> : null}

        {datos ? (
          <>
            <div className="toolbar">
              <div className="wrap">
                <label className="search">
                  <Lupa />
                  <input
                    type="search"
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    placeholder="Buscá por palabra o tema (historias, hooks, YouTube, métricas…)"
                    autoComplete="off"
                    aria-label="Buscar recursos"
                  />
                </label>
                <div className="filters" role="group" aria-label="Filtrar por tipo">
                  {FILTROS.map((f) => (
                    <button
                      key={f.clave}
                      className="filter"
                      type="button"
                      aria-pressed={tipo === f.clave}
                      onClick={() => elegirFiltro(f.clave)}
                    >
                      {f.texto}
                    </button>
                  ))}
                </div>
                <span className="count">{cuantos} {cuantos === 1 ? 'recurso' : 'recursos'}</span>
              </div>
            </div>

            <nav className="index" aria-label="Series">
              <div className="wrap">
                {series.map((s) => (
                  <a key={s.slug} className="chip" data-n={dos(s.numero)} href={`#serie-${dos(s.numero)}`}>
                    <span>{s.titulo}</span>
                  </a>
                ))}
              </div>
            </nav>

            <div className="wrap">
              {series.map((s) => {
                const cuenta = [
                  s.llamada ? '1 llamada' : null,
                  s.playbooks?.length ? `${s.playbooks.length} playbook${s.playbooks.length === 1 ? '' : 's'}` : null,
                ].filter(Boolean).join(' · ')
                return (
                  <section
                    className="serie"
                    id={`serie-${dos(s.numero)}`}
                    key={s.slug}
                    hidden={!s.recursos.some((r) => visibles.has(r.slug))}
                  >
                    <header className="serie-head">
                      <span className="serie-num" aria-hidden="true">{dos(s.numero)}</span>
                      <div className="serie-meta">
                        <span className="eyebrow">Serie {dos(s.numero)} de {dos(series.length)}</span>
                        <h2 className="serie-title">{s.titulo}</h2>
                      </div>
                      <span className="serie-count">{cuenta}</span>
                    </header>
                    <div className="grid">
                      {s.llamada ? <Llamada r={s.llamada} oculta={!visibles.has(s.llamada.slug)} /> : null}
                      {(s.playbooks || []).map((r, i) => (
                        <Playbook
                          key={r.slug}
                          r={r}
                          n={i + 1}
                          de={s.playbooks.length}
                          oculta={!visibles.has(r.slug)}
                        />
                      ))}
                    </div>
                  </section>
                )
              })}
            </div>

            <p className={`empty${cuantos === 0 ? ' show' : ''}`}>
              No hay recursos con esa palabra. Probá con otro tema: historias, hooks, YouTube, métricas, oferta.
            </p>
          </>
        ) : null}

        <section className="cta">
          <div className="wrap">
            <div>
              <h2>{pagina.ctaTitulo}</h2>
              <p>{conAsteriscos(pagina.ctaTexto, 'strong')}</p>
            </div>
            <div className="cta-actions">
              <a className="btn btn-solid" href={instagram} target="_blank" rel="noopener noreferrer">
                Escribime por Instagram <Flecha />
              </a>
              <span className="handle">{pagina.autor?.split('·').pop()?.trim()}</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <span className="eyebrow">ATV · Aumenta tu valor</span>
          <span className="eyebrow" style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <MarcaAtv /> El valor se potencia en la conexión
          </span>
          <span className="eyebrow">{new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  )
}

function Llamada({ r, oculta }) {
  const href = irHref(r.slug)
  const duracion = r.minutos ? `${r.minutos} min` : null
  return (
    <article className="card card-call" data-type="llamada" hidden={oculta}>
      <a className="card-media" href={href} target="_blank" rel="noopener noreferrer">
        {portadaClase(r.portada) ? <img src={portadaClase(r.portada)} alt="" loading="lazy" /> : null}
        <div className="card-media-text">
          <span className="eyebrow eyebrow-light">
            Llamada completa{duracion ? ` · ${duracion}` : ''}
          </span>
          <h3 className="card-media-title">{r.titulo}</h3>
        </div>
      </a>
      <div className="card-body">
        <span className="tag tag-red"><Play /> Fathom{duracion ? ` · ${duracion}` : ''}</span>
        <p className="card-desc">{r.descripcion}</p>
        <a className="btn btn-solid" href={href} target="_blank" rel="noopener noreferrer">
          Ver la llamada completa <Flecha />
        </a>
      </div>
    </article>
  )
}

function Playbook({ r, n, de, oculta }) {
  const href = irHref(r.slug)
  const portada = portadaClase(r.portada)
  return (
    <article className="card card-pb" data-type="playbook" hidden={oculta}>
      <a className="card-paper" href={href} target="_blank" rel="noopener noreferrer">
        <div className="paper-top">
          <span className="eyebrow">Playbook {dos(n)} / {dos(de)}</span>
          <MarcaAtv />
        </div>
        {portada ? <img className="paper-sheet" src={portada} alt={`Portada del playbook ${dos(n)}`} loading="lazy" /> : null}
      </a>
      <div className="card-body">
        <span className="tag"><Pdf /> Playbook PDF{r.paginas ? ` · ${r.paginas} págs.` : ''}</span>
        <h3 className="card-title">{r.titulo}</h3>
        <p className="card-desc">{r.descripcion}</p>
        <a className="btn btn-line" href={href} target="_blank" rel="noopener noreferrer">
          Abrir playbook <Flecha />
        </a>
      </div>
    </article>
  )
}
