import React from 'react';
import { Building2, CheckCircle2, XCircle, AlertCircle, Compass, MapPin } from 'lucide-react';
import { Point } from '../types';

interface StatsCardsProps {
  points: Point[];
  center: [number, number];
  activeBoundaryName: string | null;
}

export const StatsCards: React.FC<StatsCardsProps> = ({ points, center, activeBoundaryName }) => {
  if (points.length === 0 && !activeBoundaryName) {
    return null;
  }

  const total = points.length;
  const approved = points.filter((p) => (p.status || '').toLowerCase().includes('approved')).length;
  const rejected = points.filter((p) => (p.status || '').toLowerCase().includes('rejected')).length;
  const pending = total - approved - rejected;

  const approvedPercent = total > 0 ? Math.round((approved / total) * 100) : 0;
  const rejectedPercent = total > 0 ? Math.round((rejected / total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
      {/* Total Points */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bangunan</span>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Building2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-slate-900">{total}</span>
          <span className="text-xs text-slate-400 font-medium">titik</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-1 truncate">
          {activeBoundaryName || 'Satuan Lingkungan Setempat'}
        </p>
      </div>

      {/* Disetujui */}
      <div className="bg-white p-4 rounded-2xl border border-emerald-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Disetujui</span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-emerald-700">{approved}</span>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded">
            {approvedPercent}%
          </span>
        </div>
        <p className="text-[11px] text-emerald-600/80 mt-1">Status verifikasi Pengawas</p>
      </div>

      {/* Ditolak */}
      <div className="bg-white p-4 rounded-2xl border border-rose-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Ditolak</span>
          <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
            <XCircle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-rose-700">{rejected}</span>
          {rejected > 0 && (
            <span className="text-xs font-semibold text-rose-600 bg-rose-100/70 px-1.5 py-0.5 rounded">
              {rejectedPercent}%
            </span>
          )}
        </div>
        <p className="text-[11px] text-rose-600/80 mt-1">Perlu perbaikan</p>
      </div>

      {/* Koordinat Centroid / Status */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Titik Pusat (Centroid)</span>
          <div className="p-2 bg-slate-100 text-slate-600 rounded-xl">
            <Compass className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 font-mono text-xs font-bold text-slate-800 truncate">
          {center[0].toFixed(5)}, {center[1].toFixed(5)}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
          <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="truncate">WGS84 Lat/Long Bali</span>
        </div>
      </div>
    </div>
  );
};
