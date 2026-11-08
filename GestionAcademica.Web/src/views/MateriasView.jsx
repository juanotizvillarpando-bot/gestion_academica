import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Save, Trash2, Search, BookOpen } from 'lucide-react';

export default function MateriasView({ notify }) {
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ codigo: '', nombre: '' });
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getMaterias();
      setMaterias(res);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = (mat) => {
    setSelectedId(mat.materiaId);
    setFormData({
      codigo: mat.codigo,
      nombre: mat.nombre,
    });
  };

  const handleNuevo = () => {
    setSelectedId(null);
    setFormData({ codigo: '', nombre: '' });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      notify('El código y el nombre son obligatorios.', 'warning');
      return;
    }

    try {
      const res = await api.guardarMateria(formData, selectedId);
      notify(res.message, 'success');
      handleNuevo();
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleEliminar = async () => {
    if (!selectedId) {
      notify('Selecciona una materia para eliminar.', 'warning');
      return;
    }

    if (
      !window.confirm(
        '¿Seguro que deseas eliminar esta materia? (Si está incluida en ofertas académicas, debe removerse primero)'
      )
    )
      return;

    try {
      const res = await api.eliminarMateria(selectedId);
      notify(res.message, 'warning');
      handleNuevo();
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const filtered = materias.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.codigo.toLowerCase().includes(q) ||
      m.nombre.toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Columna Izquierda: Formulario */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Asignaturas
          </span>
          <span className="text-xs text-slate-400">
            {selectedId ? 'Editando registro' : 'Nuevo registro'}
          </span>
        </div>

        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Registro de Materias
        </h2>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Código de Materia:
            </label>
            <input
              type="text"
              maxLength={20}
              placeholder="Ej. MAT-001"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nombre de la Asignatura:
            </label>
            <input
              type="text"
              maxLength={120}
              placeholder="Ej. Programación I"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-colors"
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

      {/* Columna Derecha: Tabla de Materias */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Catálogo de Asignaturas</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {filtered.length} {filtered.length === 1 ? 'materia' : 'materias'}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-4 w-32">Código</th>
                <th className="py-2.5 px-4">Nombre de la Asignatura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="2" className="text-center py-10 text-slate-400">
                    No hay materias registradas o no coinciden con la búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((mat) => {
                  const isSelected = selectedId === mat.materiaId;
                  return (
                    <tr
                      key={mat.materiaId}
                      onClick={() => handleSelect(mat)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-emerald-100/70 text-emerald-950 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-mono font-medium">{mat.codigo}</td>
                      <td className="py-2.5 px-4">{mat.nombre}</td>
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

