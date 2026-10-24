import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import Biblioteca from './Biblioteca.jsx'
import Clases from './Clases.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Una sola landing: el índice de clases. /video era la vieja y cae acá por el comodín. */}
        <Route index element={<Clases />} />
        <Route path="/biblioteca" element={<Biblioteca />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
