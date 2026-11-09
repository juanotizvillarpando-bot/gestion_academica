import React, { useState, useEffect } from 'react';
import { Database, Clock, LogOut, UserCheck } from 'lucide-react';

export default function Header({ status, currentUser, onLogout }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDate = (d) => {
    return d.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }) + ' • ' + d.toLocaleTimeString('es-ES');
  };

  const isConnected = status?.conectado ?? false;
  const serverName = status?.servidor || '.\\SQLEXPRESS';

  return (
    <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80 px-6 py-3.5 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
            🎓
          </div>
          <div>
            <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              SISTEMA DE GESTIÓN ACADÉMICA
              <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30">
                Web 2.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Control Curricular, Alumnos y Docentes • SQL Server
            </p>
          </div>
        </div>

        {/* User Info & Status Pills */}
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* User Profile Badge */}
          {currentUser && (
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 shadow-inner">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {currentUser.nombreCompleto?.charAt(0) || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-slate-200 leading-tight">
                  {currentUser.nombreCompleto}
                </p>
                <p className="text-[10px] text-blue-400 font-medium">
                  {currentUser.rol}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Cerrar Sesión"
                className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Server Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner backdrop-blur text-xs">
            <span className="relative flex h-2.5 w-2.5">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span className={`font-semibold ${isConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-300 font-mono text-[11px] truncate max-w-[130px]" title={serverName}>
              {serverName}
            </span>
          </div>

          {/* Real-time Clock */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 shadow-inner text-xs text-slate-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{formatDate(time)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
