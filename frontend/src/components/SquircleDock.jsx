import React from 'react';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  CalendarDays,
  FileCheck2,
  ClipboardPen,
} from 'lucide-react';

const MODULES = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    gradient: 'from-gray-700 to-gray-900 border-gray-600/50 hover:shadow-gray-700/50',
    activeRing: 'ring-gray-400',
  },
  {
    id: 'estudiantes',
    label: 'Estudiantes',
    icon: GraduationCap,
    gradient: 'from-blue-600 to-blue-800 border-blue-500/50 hover:shadow-blue-600/50',
    activeRing: 'ring-blue-400',
  },
  {
    id: 'docentes',
    label: 'Docentes',
    icon: Users,
    gradient: 'from-indigo-600 to-indigo-800 border-indigo-500/50 hover:shadow-indigo-600/50',
    activeRing: 'ring-indigo-400',
  },
  {
    id: 'materias',
    label: 'Materias',
    icon: BookOpen,
    gradient: 'from-emerald-600 to-emerald-800 border-emerald-500/50 hover:shadow-emerald-600/50',
    activeRing: 'ring-emerald-400',
  },
  {
    id: 'periodos',
    label: 'Periodos',
    icon: CalendarDays,
    gradient: 'from-amber-600 to-amber-800 border-amber-500/50 hover:shadow-amber-600/50',
    activeRing: 'ring-amber-400',
  },
  {
    id: 'ofertas',
    label: 'Ofertas',
    icon: FileCheck2,
    gradient: 'from-red-600 to-red-800 border-red-500/50 hover:shadow-red-600/50',
    activeRing: 'ring-red-400',
  },
  {
    id: 'inscripcion',
    label: 'Inscripción',
    icon: ClipboardPen,
    gradient: 'from-purple-600 to-purple-800 border-purple-500/50 hover:shadow-purple-600/50',
    activeRing: 'ring-purple-400',
  },
];

export default function SquircleDock({ activeTab, onSelectTab }) {
  return (
    <div className="w-full bg-slate-950 py-3 border-b border-slate-800/80 shadow-md flex justify-center">
      <div className="relative">
        {/* Glassmorphism background pill container */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl"></div>

        {/* Squircle Dock items */}
        <div className="relative flex items-end gap-x-2 sm:gap-x-3 p-2 overflow-x-auto max-w-full">
          {MODULES.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="group relative flex flex-col items-center focus:outline-none"
              >
                {/* Squircle Icon with Uiverse clip-path and hover animation */}
                <div
                  style={{ clipPath: 'url(#squircleClip)' }}
                  className={`w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br ${
                    item.gradient
                  } rounded-xl flex items-center justify-center shadow-lg border cursor-pointer transform transition-all duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-2 group-hover:shadow-2xl ${
                    isActive
                      ? '-translate-y-1 scale-105 ring-2 ' + item.activeRing
                      : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow" />
                </div>

                {/* Module title under squircle */}
                <span
                  className={`mt-1.5 text-[11px] sm:text-xs font-medium tracking-tight transition-colors duration-200 ${
                    isActive
                      ? 'text-white font-bold'
                      : 'text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </span>

                {/* Active indicator bar */}
                {isActive && (
                  <span className="w-4 h-1 bg-blue-400 rounded-full mt-0.5 shadow-sm shadow-blue-400/80"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

