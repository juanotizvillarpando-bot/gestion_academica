import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Save, Trash2, Search, FileCheck2 } from 'lucide-react';

export default function OfertasView({ notify }) {
  const [ofertas, setOfertas] = useState([]);
  const [combos, setCombos] = useState({ materias: [], docentes: [], periodos: [] });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({ materiaId: '', docenteId: '', periodoId: '' });
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [listRes, combosRes] = await Promise.all([
        api.getOfertas(),
        api.getCombosOfertas(),
      ]);
      setOfertas(listRes);
      setCombos(combosRes);

      if (combosRes.materias.length > 0 && !formData.materiaId) {
        setFormData({
          materiaId: combosRes.materias[0].id,
          docenteId: combosRes.docentes[0]?.id || '',
          periodoId: combosRes.periodos[0]?.id || '',
        });
      }
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelect = (of) => {
    setSelectedId(of.ofertaId);
    setFormData({
      materiaId: of.materiaId,
      docenteId: of.docenteId,
      periodoId: of.periodoId,
    });
  };

  const handleNuevo = () => {
    setSelectedId(null);
    setFormData({
      materiaId: combos.materias[0]?.id || '',
      docenteId: combos.docentes[0]?.id || '',
      periodoId: combos.periodos[0]?.id || '',
    });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (
      combos.materias.length === 0 ||
      combos.docentes.length === 0 ||
      combos.periodos.length === 0
    ) {
      notify(
        'Debes tener registradas Materias, Docentes y Periodos antes de crear una oferta.',
        'warning'
      );
      return;
    }

    if (!formData.materiaId || !formData.docenteId || !formData.periodoId) {
      notify('Debes seleccionar Asignatura, Profesor y Periodo.', 'warning');
      return;
    }

    try {
      const res = await api.guardarOferta(
        {
          materiaId: parseInt(formData.materiaId),
          docenteId: parseInt(formData.docenteId),
          periodoId: parseInt(formData.periodoId),
        },
        selectedId
      );
      notify(res.message, 'success');
      handleNuevo();
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleEliminar = async () => {
    if (!selectedId) {
      notify('Selecciona una oferta para eliminar.', 'warning');
      return;
    }

    if (
      !window.confirm(
        '¿Seguro que deseas eliminar esta oferta académica? (Si tiene alumnos inscritos, deben desmatricularse primero)'
      )
    )
      return;

    try {
      const res = await api.eliminarOferta(selectedId);
      notify(res.message, 'warning');
      handleNuevo();
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const filtered = ofertas.filter((o) => {
    const q = search.toLowerCase();
    return (
      (o.materia || '').toLowerCase().includes(q) ||
      (o.periodo || '').toLowerCase().includes(q) ||
      (o.docente || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Columna Izquierda: Formulario */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            Asignación
          </span>
          <span className="text-xs text-slate-400">
            {selectedId ? 'Editando oferta' : 'Nueva oferta'}
          </span>
        </div>

        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileCheck2 className="w-5 h-5 text-red-600" />
          Oferta Académica
        </h2>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Asignatura / Materia:
            </label>
            <select
              value={formData.materiaId}
              onChange={(e) => setFormData({ ...formData, materiaId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              required
            >
              {combos.materias.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre} ({m.codigo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Profesor Asignado:
            </label>
            <select
              value={formData.docenteId}
              onChange={(e) => setFormData({ ...formData, docenteId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              required
            >
              {combos.docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.nombre} ({d.codigo})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Periodo Académico:
            </label>
            <select
              value={formData.periodoId}
              onChange={(e) => setFormData({ ...formData, periodoId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
              required
            >
              {combos.periodos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.codigo}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={handleNuevo}
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-100/70 hover:bg-slate-200/70 text-slate-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva
            </button>
            <button
              type="submit"
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20 transition-colors"
            >
              <Save className="w-4 h-4" />
              Asignar
            </button>
          </div>

          {selectedId && (
            <button
              type="button"
              onClick={handleEliminar}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Oferta
            </button>
          )}
        </form>
      </div>

      {/* Columna Derecha: Tabla de Ofertas */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Ofertas Académicas Registradas</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {filtered.length} {filtered.length === 1 ? 'oferta' : 'ofertas'}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por materia, docente o periodo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 shadow-sm"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-4">Asignatura / Materia</th>
                <th className="py-2.5 px-4 w-28">Periodo</th>
                <th className="py-2.5 px-4">Profesor Asignado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-slate-400">
                    No hay ofertas académicas registradas o no coinciden con la búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((of) => {
                  const isSelected = selectedId === of.ofertaId;
                  return (
                    <tr
                      key={of.ofertaId}
                      onClick={() => handleSelect(of)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-red-100/70 text-red-950 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-medium">{of.materia}</td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                          {of.periodo}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">{of.docente}</td>
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

