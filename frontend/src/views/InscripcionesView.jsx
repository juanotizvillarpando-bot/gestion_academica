import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Save, Trash2, Search, ClipboardPen } from 'lucide-react';

export default function InscripcionesView({ notify }) {
  const [inscripciones, setInscripciones] = useState([]);
  const [combos, setCombos] = useState({ estudiantes: [], ofertas: [] });
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [formData, setFormData] = useState({
    estudianteId: '',
    ofertaId: '',
    notaFinal: '0',
    sinCalificar: false,
  });
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [listRes, combosRes] = await Promise.all([
        api.getInscripciones(),
        api.getCombosInscripciones(),
      ]);
      setInscripciones(listRes);
      setCombos(combosRes);

      if (combosRes.estudiantes.length > 0 && !formData.estudianteId) {
        setFormData({
          estudianteId: combosRes.estudiantes[0].id,
          ofertaId: combosRes.ofertas[0]?.id || '',
          notaFinal: '0',
          sinCalificar: false,
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

  const handleSelect = (ins) => {
    setSelectedId(ins.inscripcionId);
    setFormData({
      estudianteId: ins.estudianteId,
      ofertaId: ins.ofertaId,
      notaFinal: ins.notaFinal !== null ? ins.notaFinal.toString() : '0',
      sinCalificar: ins.notaFinal === null,
    });
  };

  const handleNuevo = () => {
    setSelectedId(null);
    setFormData({
      estudianteId: combos.estudiantes[0]?.id || '',
      ofertaId: combos.ofertas[0]?.id || '',
      notaFinal: '0',
      sinCalificar: false,
    });
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    if (combos.estudiantes.length === 0 || combos.ofertas.length === 0) {
      notify(
        'Debes tener estudiantes registrados y ofertas académicas creadas antes de inscribir.',
        'warning'
      );
      return;
    }

    if (!formData.estudianteId || !formData.ofertaId) {
      notify('Debes seleccionar un alumno y una oferta académica.', 'warning');
      return;
    }

    let nota = null;
    if (!formData.sinCalificar) {
      const parsed = parseFloat(formData.notaFinal);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        notify('La nota final debe ser un número entre 0.00 y 100.00.', 'warning');
        return;
      }
      nota = parsed;
    }

    try {
      const res = await api.guardarInscripcion(
        {
          estudianteId: parseInt(formData.estudianteId),
          ofertaId: parseInt(formData.ofertaId),
          notaFinal: nota,
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
      notify('Selecciona una inscripción para eliminar.', 'warning');
      return;
    }

    if (!window.confirm('¿Seguro que deseas eliminar esta inscripción?')) return;

    try {
      const res = await api.eliminarInscripcion(selectedId);
      notify(res.message, 'warning');
      handleNuevo();
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const filtered = inscripciones.filter((i) => {
    const q = search.toLowerCase();
    return (
      (i.estudiante || '').toLowerCase().includes(q) ||
      (i.oferta || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Columna Izquierda: Formulario */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
            Matrícula
          </span>
          <span className="text-xs text-slate-400">
            {selectedId ? 'Editando matrícula' : 'Nueva matrícula'}
          </span>
        </div>

        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ClipboardPen className="w-5 h-5 text-purple-600" />
          Inscripción de Alumno
        </h2>

        <form onSubmit={handleGuardar} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Alumno / Estudiante:
            </label>
            <select
              value={formData.estudianteId}
              onChange={(e) => setFormData({ ...formData, estudianteId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              required
            >
              {combos.estudiantes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Oferta Académica (Materia y Periodo):
            </label>
            <select
              value={formData.ofertaId}
              onChange={(e) => setFormData({ ...formData, ofertaId: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
              required
            >
              {combos.ofertas.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.descripcion}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nota Final (0.00 a 100.00):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                disabled={formData.sinCalificar}
                value={formData.notaFinal}
                onChange={(e) => setFormData({ ...formData, notaFinal: e.target.value })}
                className="w-32 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 font-mono disabled:opacity-50"
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.sinCalificar}
                  onChange={(e) =>
                    setFormData({ ...formData, sinCalificar: e.target.checked })
                  }
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                Sin calificar
              </label>
            </div>
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
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20 transition-colors"
            >
              <Save className="w-4 h-4" />
              Inscribir
            </button>
          </div>

          {selectedId && (
            <button
              type="button"
              onClick={handleEliminar}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar Inscripción
            </button>
          )}
        </form>
      </div>

      {/* Columna Derecha: Tabla de Inscripciones */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900">Matrículas Registradas</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {filtered.length} {filtered.length === 1 ? 'matrícula' : 'matrículas'}
            </span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar estudiante u oferta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 shadow-sm"
            />
          </div>
        </div>

        {/* Table List */}
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="sticky top-0 bg-slate-100 text-slate-600 font-bold uppercase text-[11px] border-b border-slate-200 z-10">
              <tr>
                <th className="py-2.5 px-4">Estudiante</th>
                <th className="py-2.5 px-4">Oferta Académica</th>
                <th className="py-2.5 px-4 text-center w-28">Nota Final</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="3" className="text-center py-10 text-slate-400">
                    No hay matrículas registradas o no coinciden con la búsqueda.
                  </td>
                </tr>
              ) : (
                filtered.map((ins) => {
                  const isSelected = selectedId === ins.inscripcionId;
                  return (
                    <tr
                      key={ins.inscripcionId}
                      onClick={() => handleSelect(ins)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-purple-100/70 text-purple-950 font-semibold'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <td className="py-2.5 px-4 font-medium">{ins.estudiante}</td>
                      <td className="py-2.5 px-4 text-slate-600">{ins.oferta}</td>
                      <td className="py-2.5 px-4 text-center font-bold font-mono">
                        {ins.notaFinal !== null ? ins.notaFinal.toFixed(2) : '-'}
                      </td>
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

