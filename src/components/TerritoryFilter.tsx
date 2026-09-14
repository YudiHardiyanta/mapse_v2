import React, { useState } from 'react';
import { MapPin, RotateCcw, Sparkles, ChevronRight, Loader2, Search, X, Hash } from 'lucide-react';
import { SelectItem } from '../types';
import { KABUPATEN_LIST, QUICK_PRESETS, QuickPreset } from '../data/kabupaten';

interface TerritoryFilterProps {
  selectedKabupaten: string | null;
  selectedKecamatan: string | null;
  selectedDesa: string | null;
  selectedSLS: string | null;
  selectedSubSLS: string | null;
  kecamatanItems: SelectItem[];
  desaItems: SelectItem[];
  slsItems: SelectItem[];
  subslsItems: SelectItem[];
  loadingLevel: 'kab' | 'kec' | 'desa' | 'sls' | 'subsls' | 'map' | null;
  fullKodeInput: string;
  onFullKodeInputChange: (val: string) => void;
  onFullKodeSubmit: (code: string) => void;
  onKabChange: (val: string | null) => void;
  onKecChange: (val: string | null) => void;
  onDesaChange: (val: string | null) => void;
  onSlsChange: (val: string | null) => void;
  onSubslsChange: (val: string | null) => void;
  onApplyPreset: (preset: QuickPreset) => void;
  onReset: () => void;
}

export const TerritoryFilter: React.FC<TerritoryFilterProps> = ({
  selectedKabupaten,
  selectedKecamatan,
  selectedDesa,
  selectedSLS,
  selectedSubSLS,
  kecamatanItems,
  desaItems,
  slsItems,
  subslsItems,
  loadingLevel,
  fullKodeInput,
  onFullKodeInputChange,
  onFullKodeSubmit,
  onKabChange,
  onKecChange,
  onDesaChange,
  onSlsChange,
  onSubslsChange,
  onApplyPreset,
  onReset,
}) => {
  // Find names for active breadcrumbs
  const kabName = KABUPATEN_LIST.find((k) => k.value === selectedKabupaten)?.title.split(' - ')[1];
  const kecName = kecamatanItems.find((k) => k.value === selectedKecamatan)?.title.split(' - ')[1];
  const desaName = desaItems.find((d) => d.value === selectedDesa)?.title.split(' - ')[1];
  const slsName = slsItems.find((s) => s.value === selectedSLS)?.title.split(' - ')[1];

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (fullKodeInput && fullKodeInput.trim()) {
      onFullKodeSubmit(fullKodeInput.trim());
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-4">
      {/* Top row: Filter Title & Quick Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2 text-slate-800">
          <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-semibold text-sm">Filter Wilayah Sensus (Provinsi Bali)</span>
            <span className="text-xs text-slate-400 font-normal hidden md:inline ml-2">
              — Pilih bertingkat atau input langsung Full Kode SUBSLS
            </span>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-slate-400 flex items-center gap-1 text-[11px] mr-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Contoh Cepat:
          </span>
          {QUICK_PRESETS.map((preset) => (
            <button
              key={preset.title}
              onClick={() => onApplyPreset(preset)}
              disabled={loadingLevel !== null}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 font-medium transition-colors disabled:opacity-50"
            >
              {preset.title}
            </button>
          ))}
          <button
            onClick={onReset}
            disabled={!selectedKabupaten && !fullKodeInput && loadingLevel === null}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-30 ml-1"
            title="Reset Pilihan Wilayah"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Field Text: Full Kode SUBSLS (Direct API Call) */}
      <div className="bg-gradient-to-r from-emerald-50/70 via-slate-50 to-teal-50/50 border border-emerald-200/80 rounded-xl p-3 sm:p-3.5 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <label htmlFor="full-kode-subsls" className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5 text-emerald-600" />
            <span>Full Kode SUBSLS (16 Digit)</span>
            <span className="text-[11px] font-normal text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded border border-emerald-200">
              Akses Langsung
            </span>
          </label>
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 flex-wrap">
            
          </div>
        </div>

        <form onSubmit={handleDirectSubmit} className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <input
              id="full-kode-subsls"
              type="text"
              value={fullKodeInput}
              onChange={(e) => onFullKodeInputChange(e.target.value.trim())}
              placeholder="Ketik atau paste Full Kode SUBSLS, contoh: 5101010001000101"
              maxLength={20}
              className="w-full text-xs font-mono bg-white border border-slate-300 focus:border-emerald-500 rounded-xl pl-3 pr-24 py-2.5 text-slate-900 placeholder:text-slate-400 placeholder:font-sans focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all shadow-inner"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {fullKodeInput && (
                <button
                  type="button"
                  onClick={() => onFullKodeInputChange('')}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
                  title="Bersihkan input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                  fullKodeInput.length === 16
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : fullKodeInput.length === 14
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : fullKodeInput.length > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'text-slate-400'
                }`}
                title={fullKodeInput.length === 16 ? 'Format 16 digit Sub-SLS lengkap' : `${fullKodeInput.length} digit`}
              >
                {fullKodeInput.length}/16
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!fullKodeInput.trim() || loadingLevel !== null}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm shrink-0"
          >
            {loadingLevel === 'map' || loadingLevel === 'subsls' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memuat Peta...</span>
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                <span>Cari</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* 5-Column Dropdown Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Kabupaten/Kota */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-600">
            1. Kabupaten / Kota <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <select
              value={selectedKabupaten || ''}
              onChange={(e) => onKabChange(e.target.value || null)}
              className="w-full text-xs bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none"
            >
              <option value="">-- Pilih Kabupaten --</option>
              {KABUPATEN_LIST.map((kab) => (
                <option key={kab.value} value={kab.value}>
                  {kab.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Kecamatan */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-600">
              2. Kecamatan <span className="text-rose-500">*</span>
            </label>
            {loadingLevel === 'kab' && (
              <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
            )}
          </div>
          <div className="relative">
            <select
              value={selectedKecamatan || ''}
              disabled={!selectedKabupaten || kecamatanItems.length === 0 || loadingLevel === 'kab'}
              onChange={(e) => onKecChange(e.target.value || null)}
              className="w-full text-xs bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingLevel === 'kab'
                  ? 'Memuat kecamatan...'
                  : !selectedKabupaten
                  ? '-- Pilih Kab dahulu --'
                  : kecamatanItems.length === 0
                  ? 'Tidak ada data'
                  : '-- Pilih Kecamatan --'}
              </option>
              {kecamatanItems.map((kec) => (
                <option key={kec.value} value={kec.value}>
                  {kec.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Desa / Kelurahan */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-600">
              3. Desa / Kelurahan <span className="text-rose-500">*</span>
            </label>
            {loadingLevel === 'kec' && (
              <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
            )}
          </div>
          <div className="relative">
            <select
              value={selectedDesa || ''}
              disabled={!selectedKecamatan || desaItems.length === 0 || loadingLevel === 'kec'}
              onChange={(e) => onDesaChange(e.target.value || null)}
              className="w-full text-xs bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingLevel === 'kec'
                  ? 'Memuat desa...'
                  : !selectedKecamatan
                  ? '-- Pilih Kec dahulu --'
                  : desaItems.length === 0
                  ? 'Tidak ada data'
                  : '-- Pilih Desa/Kelurahan --'}
              </option>
              {desaItems.map((desa) => (
                <option key={desa.value} value={desa.value}>
                  {desa.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4. SLS (Satuan Lingkungan Setempat) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-600">
              4. SLS (Banjar/Lingkungan) <span className="text-emerald-600 font-bold">*Wajib</span>
            </label>
            {loadingLevel === 'desa' && (
              <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
            )}
          </div>
          <div className="relative">
            <select
              value={selectedSLS || ''}
              disabled={!selectedDesa || slsItems.length === 0 || loadingLevel === 'desa'}
              onChange={(e) => onSlsChange(e.target.value || null)}
              className="w-full text-xs bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingLevel === 'desa'
                  ? 'Memuat SLS...'
                  : !selectedDesa
                  ? '-- Pilih Desa dahulu --'
                  : slsItems.length === 0
                  ? 'Tidak ada SLS'
                  : '-- Pilih SLS --'}
              </option>
              {slsItems.map((sls) => (
                <option key={sls.value} value={sls.value}>
                  {sls.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. Sub-SLS (Opsional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-600">
              5. Sub-SLS <span className="text-slate-400 font-normal">(Opsional)</span>
            </label>
            {loadingLevel === 'sls' && (
              <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
            )}
          </div>
          <div className="relative">
            <select
              value={selectedSubSLS || ''}
              disabled={!selectedSLS || subslsItems.length === 0 || loadingLevel === 'sls'}
              onChange={(e) => onSubslsChange(e.target.value || null)}
              className="w-full text-xs bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingLevel === 'sls'
                  ? 'Memuat Sub-SLS...'
                  : !selectedSLS
                  ? '-- Pilih SLS dahulu --'
                  : subslsItems.length === 0
                  ? 'Semua Sub-SLS (Utuh)'
                  : '-- Semua Sub-SLS / Pilih --'}
              </option>
              {subslsItems.map((sub) => (
                <option key={sub.value} value={sub.value}>
                  {sub.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active Breadcrumb Trail */}
      {kabName && (
        <div className="flex items-center flex-wrap gap-1 text-xs text-slate-500 pt-1">
          <span className="font-semibold text-slate-700">Wilayah:</span>
          <span>Provinsi Bali</span>
          <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="font-medium text-slate-800">{kabName}</span>
          {kecName && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-800">{kecName}</span>
            </>
          )}
          {desaName && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-800">{desaName}</span>
            </>
          )}
          {slsName && (
            <>
              <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {slsName}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
