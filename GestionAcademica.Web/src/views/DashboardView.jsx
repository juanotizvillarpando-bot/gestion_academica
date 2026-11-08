import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import KpiCard from '../components/KpiCard';
import Modal from '../components/Modal';
import { Search, RefreshCw, Download, Edit3, Award } from 'lucide-react';

export default function DashboardView({ notify }) {
  const [data, setData] = useState({
    totalEstudiantes: 0,
    totalDocentes: 0,
    totalMaterias: 0,
    totalInscripciones: 0,
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [calificarModal, setCalificarModal] = useState({
    isOpen: false,
    item: null,
    nota: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getReporte();
      setData(res);
    } catch (err) {
      notify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = data.items.filter((item) => {
    const q = search.toLowerCase();
    return (
      item.estudiante.toLowerCase().includes(q) ||
      item.codigoEstudiante.toLowerCase().includes(q) ||
      item.materia.toLowerCase().includes(q) ||
      item.codigoMateria.toLowerCase().includes(q) ||
      item.docente.toLowerCase().includes(q) ||
      item.periodo.toLowerCase().includes(q)
    );
  });

  const handleExportCSV = () => {
    if (data.items.length === 0) {
      notify('No hay datos para exportar.', 'warning');
      return;
    }

    const headers = [
      'InscripcionId',
      'Cod. Estudiante',
      'Estudiante',
      'Cod. Materia',
      'Materia',
      'Docente',
      'Periodo',
      'Nota Final',
      'Estado',
    ];
    const rows = filteredItems.map((i) => [
      i.inscripcionId,
      `"${i.codigoEstudiante}"`,
      `"${i.estudiante}"`,
      `"${i.codigoMateria}"`,
      `"${i.materia}"`,
      `"${i.docente}"`,
      `"${i.periodo}"`,
      i.notaFinal ?? '',
      `"${i.estado}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Academico_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('Reporte exportado exitosamente a CSV', 'success');
  };

  const handleOpenCalificar = (item) => {
    setCalificarModal({
      isOpen: true,
      item,
      nota: item.notaFinal !== null ? item.notaFinal.toString() : '',
    });
  };

  const handleGuardarNota = async (e) => {
    e.preventDefault();
    const val = calificarModal.nota.trim();
    const parsed = val === '' ? null : parseFloat(val);

    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 100)) {
      notify('La calificación debe ser un número válido entre 0.00 y 100.00', 'warning');
      return;
    }

    try {
      await api.actualizarNota(calificarModal.item.inscripcionId, parsed);
      notify('Calificación actualizada con éxito', 'success');
      setCalificarModal({ isOpen: false, item: null, nota: '' });
      loadData();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Estudiantes"
          value={data.totalEstudiantes}
          subtitle="Alumnos registrados en sistema"
          emoji="🎓"
          accentColor="from-blue-600 to-blue-400"
          bgBadge="bg-blue-50"
          textBadge="text-blue-700"
        />
        <KpiCard
          title="Docentes"
          value={data.totalDocentes}
          subtitle="Profesores y catedráticos"
          emoji="👨‍🏫"
          accentColor="from-indigo-600 to-indigo-400"
          bgBadge="bg-indigo-50"
          textBadge="text-indigo-700"
        />
        <KpiCard
          title="Materias"
          value={data.totalMaterias}
          subtitle="Asignaturas curriculares"
          emoji="📚"
          accentColor="from-emerald-600 to-emerald-400"
          bgBadge="bg-emerald-50"
          textBadge="text-emerald-700"
        />
        <KpiCard
          title="Inscripciones"
          value={data.totalInscripciones}
          subtitle="Matrículas y calificaciones"
          emoji="📝"
          accentColor="from-amber-600 to-amber-400"
          bgBadge="bg-amber-50"
          textBadge="text-amber-700"
        />
      </div>

      {/* 2. Main Data Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Consolidado de Inscripciones y Calificaciones
            </h2>
            <p className="text-xs text-slate-500">
              Doble clic sobre cualquier fila para calificar o modificar la nota.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar alumno, materia, código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>

            <button
              onClick={() => {
                loadData();
                notify('Datos actualizados', 'info');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors shadow-sm"
              title="Refrescar datos"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refrescar</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium transition-colors shadow-sm"
              title="Exportar a archivo CSV"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Exportar CSV</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Cod. Alumno</th>
                <th className="py-3 px-4">Estudiante</th>
                <th className="py-3 px-4">Cod. Materia</th>
                <th className="py-3 px-4">Asignatura</th>
                <th className="py-3 px-4">Profesor Asignado</th>
                <th className="py-3 px-4">Periodo</th>
                <th className="py-3 px-4 text-center">Nota Final</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-blue-500" />
                    Cargando información académica...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-400">
                    No se encontraron registros de inscripciones.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const estadoBadge = {
                    Aprobado: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    Reprobado: 'bg-rose-50 text-rose-700 border-rose-200',
                    Pendiente: 'bg-amber-50 text-amber-700 border-amber-200',
                  }[item.estado] || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <tr
                      key={item.inscripcionId}
                      onDoubleClick={() => handleOpenCalificar(item)}
                      className="hover:bg-blue-50/50 transition-colors cursor-pointer select-none group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-500">
                        {item.codigoEstudiante}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {item.estudiante}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {item.codigoMateria}
                      </td>
                      <td className="py-3 px-4">{item.materia}</td>
                      <td className="py-3 px-4 text-slate-600">{item.docente}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                          {item.periodo}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono">
                        {item.notaFinal !== null ? item.notaFinal.toFixed(2) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold border ${estadoBadge}`}
                        >
                          {item.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCalificar(item);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Calificar
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-4">
          <span>Mostrando {filteredItems.length} de {data.items.length} alumnos registrados</span>
          <span>Haga doble clic en una fila para calificar</span>
        </div>
      </div>

      {/* Modal Calificar */}
      <Modal
        isOpen={calificarModal.isOpen}
        title="Actualizar Calificación"
        onClose={() => setCalificarModal({ isOpen: false, item: null, nota: '' })}
      >
        {calificarModal.item && (
          <form onSubmit={handleGuardarNota} className="space-y-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
              <div>
                <span className="font-semibold text-slate-600">Alumno:</span>{' '}
                <span className="text-slate-900 font-bold">{calificarModal.item.estudiante}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Asignatura:</span>{' '}
                <span className="text-slate-900">{calificarModal.item.materia}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">Periodo:</span>{' '}
                <span className="text-slate-900">{calificarModal.item.periodo}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                Nueva Calificación (0.00 a 100.00):
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="Ej. 85.00 (deja vacío para 'Sin calificar')"
                value={calificarModal.nota}
                onChange={(e) => setCalificarModal({ ...calificarModal, nota: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nota mínima para aprobar: 51.00 puntos.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCalificarModal({ isOpen: false, item: null, nota: '' })}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-colors"
              >
                Guardar Calificación
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

