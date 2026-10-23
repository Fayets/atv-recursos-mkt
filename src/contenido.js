// Los recursos de Juan viven en ATV Ops. El nginx de esta landing reenvía /api/contenido/ a
// ops.atvos.io/api/recursos-publicos/, así que para el navegador es el mismo dominio.
const BASE = '/api/contenido'

export async function getContenido() {
  // Con barra: el host solo manda a esta app lo que empieza con /api/contenido/.
  const res = await fetch(`${BASE}/`)
  if (!res.ok) throw new Error('No se pudieron cargar los recursos. Probá de nuevo en un rato.')
  return res.json()
}

// Una persona = un navegador. Con esto Ops cuenta una visita por persona y día, no por recarga.
export function sesion() {
  try {
    let s = localStorage.getItem('atv_sesion')
    if (!s || !/^[A-Za-z0-9_-]{8,64}$/.test(s)) {
      s = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, '0')).join('')
      localStorage.setItem('atv_sesion', s)
    }
    return s
  } catch {
    if (!window.__atvSesion) window.__atvSesion = Math.random().toString(36).slice(2) + Date.now().toString(36)
    return window.__atvSesion
  }
}

// text/plain: así sendBeacon no pide preflight y el evento sale aunque la persona cierre la pestaña.
export function evento(slug, tipo, origen) {
  const cuerpo = JSON.stringify({ slug, tipo, origen, sesion: sesion() })
  const blob = new Blob([cuerpo], { type: 'text/plain' })
  if (navigator.sendBeacon?.(`${BASE}/evento`, blob)) return
  fetch(`${BASE}/evento`, { method: 'POST', body: cuerpo, keepalive: true }).catch(() => {})
}

export const descargarHref = (slug, origen = 'landing') =>
  `${BASE}/${encodeURIComponent(slug)}/descargar?s=${sesion()}&o=${origen}`

export const whatsappHref = (slug, origen) =>
  `${BASE}/${encodeURIComponent(slug)}/whatsapp?s=${sesion()}&o=${origen}`

// "Cómo hago *$2M al año* trabajando solo 4h/día" → partes, las de asteriscos en rojo.
export function partesTitular(texto) {
  return String(texto || '').split(/(\*[^*]+\*)/).filter(Boolean).map((p) =>
    p.startsWith('*') && p.endsWith('*') ? { rojo: true, t: p.slice(1, -1) } : { rojo: false, t: p })
}

// "**Mirá el video completo** y llevate…" → la parte entre dobles asteriscos va en negrita.
export function partesNegrita(texto) {
  return String(texto || '').split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((p) =>
    p.startsWith('**') && p.endsWith('**') && p.length > 4 ? { negrita: true, t: p.slice(2, -2) } : { negrita: false, t: p })
}

export const miniatura = (youtube) => (youtube ? `https://i.ytimg.com/vi/${youtube}/hqdefault.jpg` : null)

// Las miniaturas y los videos de las historias viven en ATV Ops (/uploads/ig, /uploads/yt). El
// nginx de esta app los trae por /api/contenido/archivos/, así siguen siendo del mismo dominio.
export const archivo = (ruta) =>
  ruta && ruta.startsWith('/uploads/') ? `${BASE}/archivos/${ruta.slice('/uploads/'.length)}` : ruta || null
