import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Save, Trash2, Search, CalendarDays } from 'lucide-react';

export default function PeriodosView({ notify }) {
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    codigo: '',
    fechaInicio: new Date().toISOString().slice(0, 10),
    fechaFin: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getPeriodos();
      setPeriodos(res);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = (per) => {
    setSelectedId(per.periodoId);
    setFormData({
      codigo: per.codigo,
      fechaInicio: per.fechaInicio.slice(0, 10),
      fechaFin: per.fechaFin.slice(0, 10),
    });
  };

  const handleNuevo = () => {
    setSelectedId(null);
    setFormData({
      codigo: '',
      fechaInicio: new Date().toISOString().slice(0, 10),
      fechaFin: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!formData.codigo.trim()) {
      notify('El código de periodo es obligatorio (ej. 2026-2).', 'warning');
      return;
    }

    if (formData.fechaInicio >= formData.fechaFin) {
      notify('La fecha de inicio debe ser anterior a la fecha de fin.', 'warning');
      return;
    }

    try {
      const res = await api.guardarPeriodo(formData, selectedId);
      notify(res.message, 'success');
      handleNuevo();
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleEliminar = async () => {
    if (!selectedId) {
      notify('Selecciona un periodo para eliminar.', 'warning');
      return;
    }

    if (
      !window.confirm(
        '¿Seguro que deseas eliminar este periodo? (Si tiene ofertas asociadas, deben eliminarse primero)'
      )
    )
      return;

    try {
      const res = await api.eliminarPeriodo(selectedId);
      notify(res.message, 'warning');
      handleNuevo();
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const filtered = periodos.filter((p) => {
    const q = search.toLowerCase();
    return p.codigo.toLowerCase().includes(q);
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const [y, m, d] = dateStr.slice(0, 10).split('-');
    return `${d}/${m}/${y}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Columna Izquierda: Formulario */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Semestres
          </span>
          <span className="text-xs text-slate-400">
            {selectedId ? 'Editando registro' : 'Nuevo registro'}
          </span>
        </div>

        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-amber-600" />
          Periodo Académico
        </h2>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Código del Periodo:
            </label>
            <input
              type="text"
              maxLength={20}
              placeholder="Ej. 2026-2"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fecha de Inicio:
            </label>
            <input
              type="date"
              value={formData.fechaInicio}
              onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Fecha de Fin:
            </label>
            <input
              type="date"
              value={formData.fechaFin}
              onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleNuevo}
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-100/70 hover:bg-slate-200/70 text-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nuevo
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-500/20 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar
            </button>
          </div>

          {selectedId && (
            <button
              type="button"
              onClick={handleEliminar}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Seleccionado
            </button>
          )}
        </form>
      </div>

      {/* Columna Derecha: Tabla de Periodos */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Periodos Registrados</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {filtered.length} {filtered.length === 1 ? 'periodo' : 'periodos'}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 shadow-sm"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-4">Código Periodo</th>
                <th className="py-2.5 px-4">Fecha de Inicio</th>
                <th className="py-2.5 px-4">Fecha de Fin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-slate-400">
                    No hay periodos registrados o no coinciden con la búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((per) => {
                  const isSelected = selectedId === per.periodoId;
                  return (
                    <tr
                      key={per.periodoId}
                      onClick={() => handleSelect(per)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-amber-100/70 text-amber-950 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-medium">{per.codigo}</td>
                      <td className="py-2.5 px-4">{formatDate(per.fechaInicio)}</td>
                      <td className="py-2.5 px-4">{formatDate(per.fechaFin)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

