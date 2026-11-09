import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Save, Trash2, Search, Users } from 'lucide-react';

export default function DocentesView({ notify }) {
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ codigo: '', nombres: '', apellidos: '' });
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getDocentes();
      setDocentes(res);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = (doc) => {
    setSelectedId(doc.docenteId);
    setFormData({
      codigo: doc.codigo,
      nombres: doc.nombres,
      apellidos: doc.apellidos || '',
    });
  };

  const handleNuevo = () => {
    setSelectedId(null);
    setFormData({ codigo: '', nombres: '', apellidos: '' });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombres.trim()) {
      notify('El código y los nombres son obligatorios.', 'warning');
      return;
    }

    try {
      const res = await api.guardarDocente(formData, selectedId);
      notify(res.message, 'success');
      handleNuevo();
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleEliminar = async () => {
    if (!selectedId) {
      notify('Selecciona un docente para eliminar.', 'warning');
      return;
    }

    if (
      !window.confirm(
        '¿Seguro que deseas eliminar este docente? (Si tiene ofertas asociadas, deben eliminarse primero)'
      )
    )
      return;

    try {
      const res = await api.eliminarDocente(selectedId);
      notify(res.message, 'warning');
      handleNuevo();
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const filtered = docentes.filter((d) => {
    const q = search.toLowerCase();
    return (
      d.codigo.toLowerCase().includes(q) ||
      d.nombres.toLowerCase().includes(q) ||
      (d.apellidos || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Columna Izquierda: Formulario */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            Profesores
          </span>
          <span className="text-xs text-slate-400">
            {selectedId ? 'Editando registro' : 'Nuevo registro'}
          </span>
        </div>

        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Registro de Docentes
        </h2>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Código de Docente:
            </label>
            <input
              type="text"
              maxLength={20}
              placeholder="Ej. DOC-001"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nombres:
            </label>
            <input
              type="text"
              maxLength={80}
              placeholder="Nombres del profesor"
              value={formData.nombres}
              onChange={(e) => setFormData({ ...formData, nombres: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Apellidos:
            </label>
            <input
              type="text"
              maxLength={80}
              placeholder="Apellidos del profesor"
              value={formData.apellidos}
              onChange={(e) => setFormData({ ...formData, apellidos: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 transition-colors"
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

      {/* Columna Derecha: Tabla de Docentes */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Listado de Profesores</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {filtered.length} {filtered.length === 1 ? 'registro' : 'registros'}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-4">Código</th>
                <th className="py-2.5 px-4">Nombres</th>
                <th className="py-2.5 px-4">Apellidos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-slate-400">
                    No hay docentes registrados o no coinciden con la búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => {
                  const isSelected = selectedId === doc.docenteId;
                  return (
                    <tr
                      key={doc.docenteId}
                      onClick={() => handleSelect(doc)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-indigo-100/70 text-indigo-950 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono">{doc.codigo}</td>
                      <td className="py-2.5 px-4">{doc.nombres}</td>
                      <td className="py-2.5 px-4">{doc.apellidos || '-'}</td>
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

