import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Biblioteca from './Biblioteca.jsx'
import Video from './Video.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La raíz de recursos.atvos.io es el recurso del momento; /video queda por los links ya compartidos. */}
        <Route index element={<Video />} />
        <Route path="/video" element={<Video />} />
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
