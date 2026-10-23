import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Biblioteca from './Biblioteca.jsx'
import Video from './Video.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/video" element={<Video />} />
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="*" element={<Navigate to="/video" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
