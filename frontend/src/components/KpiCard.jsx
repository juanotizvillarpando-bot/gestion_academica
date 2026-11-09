import React from 'react';

export default function KpiCard({ title, value, subtitle, emoji, accentColor, bgBadge, textBadge }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentColor}`}></div>

      {/* Top Header: Badge Pill + Emoji circle */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${bgBadge} ${textBadge} border border-current/20 flex items-center gap-1.5`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
          {title}
        </span>
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg shadow-inner group-hover:scale-110 transition-transform">
          {emoji}
        </div>
      </div>

      {/* Value */}
      <div className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
        {value ?? 0}
      </div>

      {/* Subtitle */}
      <div className="text-xs font-medium text-slate-500">
        {subtitle}
      </div>
    </div>
  );
}

