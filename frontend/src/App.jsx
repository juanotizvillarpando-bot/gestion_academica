import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import SquircleDock from './components/SquircleDock';
import Toast from './components/Toast';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import EstudiantesView from './views/EstudiantesView';
import DocentesView from './views/DocentesView';
import MateriasView from './views/MateriasView';
import PeriodosView from './views/PeriodosView';
import OfertasView from './views/OfertasView';
import InscripcionesView from './views/InscripcionesView';
import { api } from './services/api';

export default function App() {
  // Siempre inicia en null: Obligatorio iniciar sesión al abrir el sistema
  const [currentUser, setCurrentUser] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [toast, setToast] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);

  const notify = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.removeItem('usuario_sesion');
    localStorage.removeItem('auth_token');
    setCurrentUser(null);
    notify('Sesión cerrada. Ingrese sus credenciales para volver a entrar.', 'info');
  };

  const checkStatus = async () => {
    try {
      const res = await api.getConfiguracion();
      setServerStatus(res);
    } catch (err) {
      setServerStatus({ conectado: false, servidor: '.\\SQLEXPRESS' });
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  // 1. PANTALLA OBLIGATORIA DE LOGIN:
  // Si no ha iniciado sesión, NUNCA entra al sistema; muestra primero el Login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center font-sans">
        <LoginView onLoginSuccess={setCurrentUser} onToast={notify} />
        {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      </div>
    );
  }

  // 2. SISTEMA INTERNO:
  // Solo se visualiza después de haberse autenticado con éxito
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Header Superior con Perfil del Usuario autenticado y botón de Cerrar Sesión */}
      <Header status={serverStatus} currentUser={currentUser} onLogout={handleLogout} />

      {/* Dock de Navegación Squircle (Uiverse) */}
      <SquircleDock activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Contenedor Principal de Vistas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-200">
        {activeTab === 'dashboard' && <DashboardView notify={notify} />}
        {activeTab === 'estudiantes' && <EstudiantesView notify={notify} />}
        {activeTab === 'docentes' && <DocentesView notify={notify} />}
        {activeTab === 'materias' && <MateriasView notify={notify} />}
        {activeTab === 'periodos' && <PeriodosView notify={notify} />}
        {activeTab === 'ofertas' && <OfertasView notify={notify} />}
        {activeTab === 'inscripcion' && <InscripcionesView notify={notify} />}
      </main>

      {/* Notificaciones Toast Flotantes */}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </div>
  );
}
