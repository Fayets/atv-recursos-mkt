import { useEffect, useRef, useState } from 'react'
import { evento, miniatura } from './contenido.js'

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

const HITOS = [[0.25, 'p25'], [0.5, 'p50'], [0.75, 'p75'], [0.97, 'p100']]

export default function Reproductor({ recurso }) {
  const [reproduciendo, setReproduciendo] = useState(false)
  const [avance, setAvance] = useState(0)
  const caja = useRef(null)
  const { slug, youtube, video, gancho, duracion } = recurso

  useEffect(() => {
    if (!reproduciendo || !youtube) return undefined
    let player = null
    let reloj = null
    const vistos = new Set()
    let vivo = true
    cargarYouTube().then((YT) => {
      if (!vivo || !caja.current) return
      player = new YT.Player(caja.current, {
        videoId: youtube,
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
              setAvance(parte)
              for (const [umbral, tipo] of HITOS) {
                if (parte >= umbral && !vistos.has(tipo)) { vistos.add(tipo); evento(slug, tipo, 'landing') }
              }
            }, 1000)
          },
        },
      })
    })
    return () => { vivo = false; clearInterval(reloj); player?.destroy?.() }
  }, [reproduciendo, youtube, slug])

  function play() {
    evento(slug, 'play', 'landing')
    if (youtube) setReproduciendo(true)
    else if (video) window.open(video, '_blank', 'noopener')
  }

  const poster = miniatura(youtube)
  return (
    <div className="jv-player">
      {reproduciendo ? (
        <div className="jv-yt"><div ref={caja} /></div>
      ) : (
        <button type="button" className="jv-poster" onClick={play} aria-label="Reproducir video">
          {poster ? <img src={poster} alt="" /> : <span className="jv-gancho">{gancho}</span>}
          <span className="jv-play" />
          {duracion && <span className="jv-dur">{duracion}</span>}
        </button>
      )}
      {reproduciendo && <span className="jv-avance" style={{ transform: `scaleX(${avance})` }} />}
    </div>
  )
}
