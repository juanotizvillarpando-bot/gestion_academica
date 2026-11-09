import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Settings, Database, Rocket, PlugZap, Save, CheckCircle, Terminal } from 'lucide-react';

export default function ConfiguracionView({ notify, onStatusChange }) {
  const [config, setConfig] = useState({
    servidor: '.\\SQLEXPRESS',
    baseDatos: 'gestion academica',
    windowsAuth: true,
    usuario: 'sa',
    password: '',
  });
  const [logs, setLogs] = useState([
    `[${new Date().toLocaleTimeString()}] Panel de Configuración cargado.`,
  ]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const loadCurrentConfig = async () => {
    try {
      const res = await api.getConfiguracion();
      setConfig((prev) => ({
        ...prev,
        servidor: res.servidor || prev.servidor,
        baseDatos: res.baseDatos || prev.baseDatos,
        windowsAuth: res.windowsAuth ?? true,
        usuario: res.usuario || 'sa',
      }));
      onStatusChange?.(res);
      addLog(`Estado de conexión: ${res.conectado ? 'Conectado a ' + res.servidor : 'Desconectado'}`);
    } catch (err) {
      addLog(`Error al consultar estado: ${err.message}`);
    }
  };

  useEffect(() => {
    loadCurrentConfig();
  }, []);

  const handleProbar = async () => {
    try {
      setLoading(true);
      addLog(`Probando conexión con ${config.servidor}...`);
      const res = await api.probarConexion(config);
      if (res.exito) {
        notify('¡Conexión a SQL Server exitosa!', 'success');
        addLog(`ÉXITO: ${res.mensaje}`);
      } else {
        notify(`Error de conexión: ${res.mensaje}`, 'error');
        addLog(`FALLO: ${res.mensaje}`);
      }
    } catch (err) {
      notify(err.message, 'error');
      addLog(`ERROR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      addLog('Guardando configuración de conexión...');
      const res = await api.guardarConexion(config);
      notify(res.message, 'success');
      addLog('Configuración guardada en appsettings.json.');
      loadCurrentConfig();
    } catch (err) {
      notify(err.message, 'error');
      addLog(`Error al guardar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInicializarBD = async () => {
    if (
      !window.confirm(
        '¿Deseas inicializar la base de datos con los scripts SQL originales? Esto creará las tablas y datos muestra.'
      )
    )
      return;

    try {
      setLoading(true);
      addLog('Iniciando ejecución de scripts SQL (01_CrearBase.sql y 02_DatosDePrueba.sql)...');
      const res = await api.inicializarBD();
      notify(res.message, 'success');
      addLog(`RESULTADO: ${res.message}`);
      loadCurrentConfig();
    } catch (err) {
      notify(err.message, 'error');
      addLog(`ERROR AL INICIALIZAR: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* Tarjeta Izquierda: Parámetros de Conexión */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Conexión a SQL Server</h2>
            <p className="text-xs text-slate-400">
              Instancia del motor de base de datos y credenciales.
            </p>
          </div>
        </div>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Servidor SQL / Instancia:
            </label>
            <input
              type="text"
              value={config.servidor}
              onChange={(e) => setConfig({ ...config, servidor: e.target.value })}
              placeholder=".\SQLEXPRESS o localhost"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Base de Datos:
            </label>
            <input
              type="text"
              value={config.baseDatos}
              onChange={(e) => setConfig({ ...config, baseDatos: e.target.value })}
              placeholder="gestion academica"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
              required
            />
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={config.windowsAuth}
                onChange={(e) => setConfig({ ...config, windowsAuth: e.target.checked })}
                className="rounded text-cyan-600 focus:ring-cyan-500 w-4 h-4"
              />
              Autenticación de Windows (Integrated Security)
            </label>
          </div>

          {!config.windowsAuth && (
            <div className="grid grid-cols-2 gap-3 pt-1 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Usuario SQL:
                </label>
                <input
                  type="text"
                  value={config.usuario}
                  onChange={(e) => setConfig({ ...config, usuario: e.target.value })}
                  placeholder="sa"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                  required={!config.windowsAuth}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Contraseña:
                </label>
                <input
                  type="password"
                  value={config.password}
                  onChange={(e) => setConfig({ ...config, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-3">
            <button
              type="button"
              onClick={handleProbar}
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <PlugZap className="w-4 h-4 text-slate-600" />
              Probar Conexión
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-500/20 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar Conexión
            </button>
          </div>
        </form>
      </div>

      {/* Tarjeta Derecha: Mantenimiento y Logs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Mantenimiento de Base de Datos</h2>
            <p className="text-xs text-slate-400">
              Inicializa las tablas y datos de prueba originales con un solo clic.
            </p>
          </div>
        </div>

        <button
          onClick={handleInicializarBD}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-colors mb-4"
        >
          <Rocket className="w-4 h-4" />
          🚀 Recrear / Inicializar BD con Scripts SQL
        </button>

        {/* Consola Monospace de Ejecución */}
        <div className="flex-1 flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5 font-medium">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-slate-400" />
              Registro de Ejecución en Vivo:
            </span>
            <button
              onClick={() => setLogs([])}
              className="hover:text-slate-700 text-[11px] underline"
            >
              Limpiar
            </button>
          </div>

          <div className="flex-1 bg-slate-950 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] overflow-y-auto max-h-56 border border-slate-800 shadow-inner space-y-1">
            {logs.map((log, idx) => (
              <div key={idx} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

