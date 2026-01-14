import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProtectedRoute from './pages/ProtectedRoute';
import Usuarios from './pages/modules/Usuarios';
import Pacientes from './pages/modules/Pacientes';
import HistoriasClinicas from './pages/modules/HistoriasClinicas';
import Odontogramas from './pages/modules/Odontogramas';
import Pagos from './pages/modules/Pagos';
import Ortodoncia from './pages/modules/Ortodoncia';
import CajaCentral from './pages/modules/CajaCentral';
import Citas from './pages/modules/Citas';
import Reportes from './pages/modules/Reportes';
import { PermisosProvider } from './context/PermisosContext';
import { PacienteProvider } from './context/PacienteContext';
import Configuracion from './pages/modules/Configuracion';

function App() {
  return (
    <PermisosProvider>
      <PacienteProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/pacientes" element={<Navigate to="/dashboard/pacientes" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route path="pacientes" element={<Pacientes />} />
              <Route path="usuarios" element={<Usuarios />} />
              <Route path="pagos" element={<Pagos />} />
              <Route path="historias-clinicas" element={<HistoriasClinicas />} />
              <Route path="odontogramas" element={<Odontogramas />} />
              <Route path="ortodoncia" element={<Ortodoncia />} />
              <Route path="caja" element={<CajaCentral />} />
              <Route path="citas" element={<Citas />} />
              <Route path="reportes" element={<Reportes />} />
              <Route path="configuracion" element={<Configuracion />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PacienteProvider>
    </PermisosProvider>
  );
}

export default App;
