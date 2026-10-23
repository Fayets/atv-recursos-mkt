import { useEffect, useRef, useState } from 'react'
import { archivo, evento, miniatura } from './contenido.js'

// Hasta dónde vio: se manda cada hito una sola vez por carga.
const HITOS = [[0.25, 'p25'], [0.5, 'p50'], [0.75, 'p75'], [0.97, 'p100']]
function usarHitos(slug) {
  const vistos = useRef(new Set())
  return (parte) => {
    for (const [umbral, tipo] of HITOS) {
      if (parte >= umbral && !vistos.current.has(tipo)) { vistos.current.add(tipo); evento(slug, tipo, 'landing') }
    }
  }
}

// La API de YouTube se carga una sola vez y solo cuando alguien da play.
let apiYouTube = null
function cargarYouTube() {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (!apiYouTube) {
    apiYouTube = new Promise((resolve) => {
      const previo = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => { previo?.(); resolve(window.YT) }
      const s = document.createElement('script')
      s.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(s)
    })
  }
  return apiYouTube
}

function YouTube({ id, hito, onAvance }) {
  const caja = useRef(null)
  useEffect(() => {
    let player = null
    let reloj = null
    let vivo = true
    cargarYouTube().then((YT) => {
      if (!vivo || !caja.current) return
      player = new YT.Player(caja.current, {
        videoId: id,
        host: 'https://www.youtube-nocookie.com',
        playerVars: { autoplay: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onStateChange: (e) => {
            clearInterval(reloj)
            if (e.data !== YT.PlayerState.PLAYING) return
            reloj = setInterval(() => {
              const total = player.getDuration?.() || 0
              if (!total) return
              const parte = (player.getCurrentTime?.() || 0) / total
              onAvance(parte)
              hito(parte)
            }, 1000)
          },
        },
      })
    })
    return () => { vivo = false; clearInterval(reloj); player?.destroy?.() }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  return <div className="jv-yt"><div ref={caja} /></div>
}

// Vimeo avisa el avance por postMessage: no hace falta cargar su librería.
function Vimeo({ id, h, hito, onAvance }) {
  const marco = useRef(null)
  useEffect(() => {
    function mensaje(e) {
      if (e.origin !== 'https://player.vimeo.com') return
      let d = e.data
      try { if (typeof d === 'string') d = JSON.parse(d) } catch { return }
      if (d?.event === 'ready') {
        marco.current?.contentWindow?.postMessage(JSON.stringify({ method: 'addEventListener', value: 'playProgress' }), 'https://player.vimeo.com')
      }
      if (d?.event === 'playProgress' && d.data) { onAvance(d.data.percent || 0); hito(d.data.percent || 0) }
    }
    window.addEventListener('message', mensaje)
    return () => window.removeEventListener('message', mensaje)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps
  const qs = new URLSearchParams({ autoplay: '1', api: '1', dnt: '1' })
  if (h) qs.set('h', h)
  return (
    <div className="jv-yt">
      <iframe ref={marco} src={`https://player.vimeo.com/video/${id}?${qs}`} title="Video" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
    </div>
  )
}

/** Una secuencia de historias, como en Instagram: barras arriba, tocar para pasar. Las que tienen
 *  video guardado se ven con sonido; las de antes del 22-10-2026 quedan como foto. */
function Historias({ slug, historias, hito }) {
  const [i, setI] = useState(0)
  const [andando, setAndando] = useState(false)
  const [avance, setAvance] = useState(0)
  const n = historias.length
  const h = historias[i]

  useEffect(() => { if (andando) hito((i + avance) / n) }, [i, avance, andando]) // eslint-disable-line react-hooks/exhaustive-deps

  // Las fotos duran 6 segundos; los videos, lo que duran.
  useEffect(() => {
    if (!andando || h?.video) return undefined
    const inicio = performance.now()
    let cuadro
    const paso = (t) => {
      const parte = Math.min((t - inicio) / 6000, 1)
      setAvance(parte)
      if (parte >= 1) siguiente()
      else cuadro = requestAnimationFrame(paso)
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [i, andando]) // eslint-disable-line react-hooks/exhaustive-deps

  function siguiente() {
    if (i < n - 1) { setAvance(0); setI(i + 1) } else { setAvance(1); setAndando(false) }
  }
  function anterior() { setAvance(0); setI(Math.max(0, i - 1)) }
  function arrancar() {
    evento(slug, 'play', 'landing')
    if (i === n - 1 && avance >= 1) { setI(0); setAvance(0) }
    setAndando(true)
  }

  if (!h) return null
  return (
    <div className="jv-historias">
      <div className="jv-barras">
        {historias.map((x, k) => (
          <i key={x.id}><b style={{ transform: `scaleX(${k < i ? 1 : k === i ? avance : 0})` }} /></i>
        ))}
      </div>
      {h.video ? (
        <video
          key={`${h.id}-${andando}`} src={archivo(h.video)} poster={archivo(h.imagen) || undefined} playsInline
          autoPlay={andando} muted={!andando}
          onTimeUpdate={(e) => { const v = e.currentTarget; if (andando && v.duration) setAvance(v.currentTime / v.duration) }}
          onEnded={siguiente}
        />
      ) : (
        h.imagen && <img key={h.id} src={archivo(h.imagen)} alt="" />
      )}
      {andando ? (
        <div className="jv-toque">
          <button type="button" aria-label="Historia anterior" onClick={anterior} />
          <button type="button" aria-label="Historia siguiente" onClick={siguiente} />
        </div>
      ) : (
        <button type="button" className="jv-poster limpio" onClick={arrancar} aria-label="Ver las historias"><span className="jv-play" /></button>
      )}
    </div>
  )
}

export default function Reproductor({ recurso }) {
  const [reproduciendo, setReproduciendo] = useState(false)
  const [avance, setAvance] = useState(0)
  const { slug, gancho, duracion } = recurso
  const media = recurso.media || (recurso.youtube ? { tipo: 'youtube', id: recurso.youtube } : { tipo: 'ninguno' })
  const hito = usarHitos(slug)
  const vertical = media.tipo === 'reel' || media.tipo === 'secuencia'

  if (media.tipo === 'secuencia') {
    return (
      <div className="jv-player vertical">
        <Historias slug={slug} historias={media.historias || []} hito={hito} />
      </div>
    )
  }

  function play() {
    evento(slug, 'play', 'landing')
    if (media.tipo === 'link') window.open(media.url, '_blank', 'noopener')
    else if (media.tipo !== 'ninguno') setReproduciendo(true)
  }

  const poster = archivo(media.poster) || (media.tipo === 'youtube' ? miniatura(media.id) : null)
  let reproductor = null
  if (reproduciendo) {
    if (media.tipo === 'youtube') reproductor = <YouTube id={media.id} hito={hito} onAvance={setAvance} />
    if (media.tipo === 'vimeo') reproductor = <Vimeo id={media.id} h={media.h} hito={hito} onAvance={setAvance} />
    // Loom e Instagram no avisan hasta dónde vio: de esos se cuenta el play.
    if (media.tipo === 'loom') {
      reproductor = <div className="jv-yt"><iframe src={`https://www.loom.com/embed/${media.id}?autoplay=1&hide_owner=true&hide_share=true`} title="Video" allow="autoplay; fullscreen" allowFullScreen /></div>
    }
    if (media.tipo === 'reel') {
      reproductor = <div className="jv-yt"><iframe src={`https://www.instagram.com/reel/${media.codigo}/embed/`} title="Reel" allow="autoplay; encrypted-media" scrolling="no" /></div>
    }
  }

  return (
    <div className={`jv-player${vertical ? ' vertical' : ''}`}>
      {reproductor || (
        <button type="button" className="jv-poster" onClick={play} aria-label="Reproducir video">
          {poster ? <img src={poster} alt="" /> : <span className="jv-gancho">{gancho}</span>}
          <span className="jv-play" />
          {duracion && media.tipo !== 'reel' && <span className="jv-dur">{duracion}</span>}
        </button>
      )}
      {reproduciendo && (media.tipo === 'youtube' || media.tipo === 'vimeo') && (
        <span className="jv-avance" style={{ transform: `scaleX(${avance})` }} />
      )}
    </div>
  )
}
