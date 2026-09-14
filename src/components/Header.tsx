import React from 'react';
import { MapPin, ShieldCheck, Layers, HelpCircle, Building2 } from 'lucide-react';
import { TileProvider } from '../types';

interface HeaderProps {
  currentProvider: TileProvider;
  totalPoints: number;
  activeSlsName: string | null;
  onOpenOsmModal: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentProvider,
  totalPoints,
  activeSlsName,
  onOpenOsmModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Peta Persebaran Titik Sensus Ekonomi SLS Bali
              </h1>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                SE 2026
              </span>
            </div>
            <p className="text-xs text-slate-500 font-normal">
              Pemetaan Geospasial Bangunan Sensus Berdasarkan Satuan Lingkungan Setempat (SLS)
            </p>
          </div>
        </div>

        {/* Right action badges */}
        <div className="flex items-center flex-wrap gap-2 text-xs">
          {/* Active SLS Indicator */}
          {activeSlsName && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate max-w-[180px]" title={activeSlsName}>
                {activeSlsName}
              </span>
              <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-200/70 text-emerald-900 text-[10px] font-bold">
                {totalPoints} Titik
              </span>
            </div>
          )}

          {/* Active Tile Layer Badge */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span className="font-medium truncate max-w-[120px]">{currentProvider.name}</span>
          </div>

          {/* OSM Compliance Verified Button */}
          <button
            onClick={onOpenOsmModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors font-medium shadow-2xs"
            title="Klik untuk detail regulasi tile OpenStreetMap & pencegahan error 403"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-semibold">Regulasi OSM</span>
            <HelpCircle className="w-3 h-3 text-teal-500 opacity-80" />
          </button>
        </div>
      </div>
    </header>
  );
};
