import React from 'react';
import { ShieldCheck, AlertTriangle, ExternalLink, X, CheckCircle2, Globe2 } from 'lucide-react';

interface OsmPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRecommendedProvider?: () => void;
}

export const OsmPolicyModal: React.FC<OsmPolicyModalProps> = ({
  isOpen,
  onClose,
  onSelectRecommendedProvider,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/15 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Kepatuhan Regulasi Leaflet & OpenStreetMap</h2>
              <p className="text-xs text-emerald-100">Peta Resmi Leaflet Bebas Error 403 (Tile Usage Policy Compliant)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/80 hover:text-white"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          {/* Problem explanation */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start space-x-3">
              <Globe2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Peta Leaflet Berbasis OpenStreetMap</h4>
                <p className="text-blue-800 text-xs mt-1 leading-relaxed">
                  Aplikasi ini menggunakan pustaka peta <strong>Leaflet</strong> murni dengan layer peta standar OpenStreetMap (OSM) dan OSM Humanitarian (HOT). Seluruh pemanggilan tile mematuhi ketentuan atribusi lisensi ODbL tanpa menggunakan pihak ketiga komersial.
                </p>
              </div>
            </div>
          </div>

          {/* Solution pillars */}
          <div>
            <h4 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Standar Regulasi yang Diterapkan:
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs uppercase tracking-wider text-emerald-700">
                  <Globe2 className="w-4 h-4" /> 1. Leaflet Engine Murni
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menggunakan Leaflet sebagai penyedia antarmuka peta yang ringan, cepat, dan standar industri untuk aplikasi geospasial sensus.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs uppercase tracking-wider text-emerald-700">
                  <ShieldCheck className="w-4 h-4" /> 2. Atribusi Legal ODbL
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Menyertakan kredit resmi <em>&copy; OpenStreetMap contributors</em> dan tautan copyright resmi OSM pada setiap tampilan peta.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs uppercase tracking-wider text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" /> 3. Pilihan Layer OSM & Satelit
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tersedia layer OSM Standard, OSM Humanitarian (HOT) berdaya kontras tinggi, OSM French Style, dan Citra Satelit Esri.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-slate-800 text-xs uppercase tracking-wider text-emerald-700">
                  <AlertTriangle className="w-4 h-4" /> 4. Penanganan Error Otomatis
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Deteksi gangguan tile otomatis dengan opsi perpindahan layer secara instan jika salah satu server mengalami lonjakan lalu lintas.
                </p>
              </div>
            </div>
          </div>

          {onSelectRecommendedProvider && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
              <span>Rekomendasi: Gunakan <strong>OpenStreetMap (Leaflet Standard)</strong>.</span>
              <button
                onClick={() => {
                  onSelectRecommendedProvider();
                  onClose();
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs transition-colors shrink-0 ml-3"
              >
                Terapkan Layer Rekomendasi
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <a 
            href="https://operations.osmfoundation.org/policies/tiles/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium"
          >
            Pelajari OSM Tile Usage Policy <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-medium rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
