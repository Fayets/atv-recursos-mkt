import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Biblioteca from './Biblioteca.jsx'
import Clases from './Clases.jsx'
import Video from './Video.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La raíz es el índice de clases de Juan; /video queda por los links ya compartidos. */}
        <Route index element={<Clases />} />
        <Route path="/video" element={<Video />} />
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
