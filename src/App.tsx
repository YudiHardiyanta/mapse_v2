import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TerritoryFilter } from './components/TerritoryFilter';
import { MapView } from './components/MapView';
import { StatsCards } from './components/StatsCards';
import { DataTable } from './components/DataTable';
import { OsmPolicyModal } from './components/OsmPolicyModal';
import { SelectItem, Point, GeoJsonData, TileProvider } from './types';
import { TILE_PROVIDERS } from './data/tileProviders';
import { QUICK_PRESETS, QuickPreset, KABUPATEN_LIST } from './data/kabupaten';
import { 
  getKecamatan, 
  getDesa, 
  getSLS, 
  getSubSLS, 
  getBoundaryMap, 
  getLocations 
} from './services/api';
import { AlertCircle, X, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function App() {
  // Tile Provider State (Default to OpenStreetMap Leaflet Standard: no carto)
  const [currentProvider, setCurrentProvider] = useState<TileProvider>(TILE_PROVIDERS[0]);
  const [isOsmModalOpen, setIsOsmModalOpen] = useState(false);

  // Region Filter State
  const [selectedKabupaten, setSelectedKabupaten] = useState<string | null>(null);
  const [selectedKecamatan, setSelectedKecamatan] = useState<string | null>(null);
  const [selectedDesa, setSelectedDesa] = useState<string | null>(null);
  const [selectedSLS, setSelectedSLS] = useState<string | null>(null);
  const [selectedSubSLS, setSelectedSubSLS] = useState<string | null>(null);
  const [fullKodeInput, setFullKodeInput] = useState<string>('');

  // Options State
  const [kecamatanItems, setKecamatanItems] = useState<SelectItem[]>([]);
  const [desaItems, setDesaItems] = useState<SelectItem[]>([]);
  const [slsItems, setSlsItems] = useState<SelectItem[]>([]);
  const [subslsItems, setSubslsItems] = useState<SelectItem[]>([]);

  // Loading States
  const [loadingLevel, setLoadingLevel] = useState<'kab' | 'kec' | 'desa' | 'sls' | 'subsls' | 'map' | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Map & Points State
  const [mapCenter, setMapCenter] = useState<[number, number]>([-8.4095, 115.1889]); // Bali center
  const [mapZoom, setMapZoom] = useState<number>(10);
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonData | null>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  // Load Map & Points for a specific SLS or Sub-SLS code
  const loadMapAndPoints = useCallback(async (code: string) => {
    setLoadingLevel('map');
    setErrorToast(null);

    try {
      const [boundaryResult, locationResult] = await Promise.all([
        getBoundaryMap(code),
        getLocations(code),
      ]);

      if (boundaryResult && boundaryResult.features && boundaryResult.features.length > 0) {
        const feature = boundaryResult.features[0];
        setGeoJsonData(boundaryResult);

        if (feature.properties?.centroid_y && feature.properties?.centroid_x) {
          setMapCenter([feature.properties.centroid_y, feature.properties.centroid_x]);
          setMapZoom(17);
        }
      } else {
        setGeoJsonData(null);
      }

      setPoints(locationResult || []);
    } catch (err: any) {
      console.error('Error loading map or locations:', err);
      setErrorToast(err.message || 'Gagal mengambil data spasial SLS dari server.');
    } finally {
      setLoadingLevel(null);
    }
  }, []);

  // Handle Kabupaten Change
  const handleKabChange = async (value: string | null) => {
    setSelectedKabupaten(value);
    setSelectedKecamatan(null);
    setSelectedDesa(null);
    setSelectedSLS(null);
    setSelectedSubSLS(null);
    setKecamatanItems([]);
    setDesaItems([]);
    setSlsItems([]);
    setSubslsItems([]);
    setGeoJsonData(null);
    setPoints([]);
    setSelectedPointId(null);

    if (!value) return;

    setLoadingLevel('kab');
    try {
      const kec = await getKecamatan(value);
      setKecamatanItems(kec);
    } catch (err: any) {
      setErrorToast('Gagal memuat daftar kecamatan.');
    } finally {
      setLoadingLevel(null);
    }
  };

  // Handle Kecamatan Change
  const handleKecChange = async (value: string | null) => {
    setSelectedKecamatan(value);
    setSelectedDesa(null);
    setSelectedSLS(null);
    setSelectedSubSLS(null);
    setDesaItems([]);
    setSlsItems([]);
    setSubslsItems([]);
    setGeoJsonData(null);
    setPoints([]);
    setSelectedPointId(null);

    if (!value) return;

    setLoadingLevel('kec');
    try {
      const desa = await getDesa(value);
      setDesaItems(desa);
    } catch (err: any) {
      setErrorToast('Gagal memuat daftar desa/kelurahan.');
    } finally {
      setLoadingLevel(null);
    }
  };

  // Handle Desa Change
  const handleDesaChange = async (value: string | null) => {
    setSelectedDesa(value);
    setSelectedSLS(null);
    setSelectedSubSLS(null);
    setSlsItems([]);
    setSubslsItems([]);
    setGeoJsonData(null);
    setPoints([]);
    setSelectedPointId(null);

    if (!value) return;

    setLoadingLevel('desa');
    try {
      const sls = await getSLS(value);
      setSlsItems(sls);
    } catch (err: any) {
      setErrorToast('Gagal memuat daftar SLS.');
    } finally {
      setLoadingLevel(null);
    }
  };

  // Handle SLS Change
  const handleSlsChange = async (value: string | null) => {
    setSelectedSLS(value);
    setSelectedSubSLS(null);
    setSubslsItems([]);
    setSelectedPointId(null);

    if (!value) {
      setFullKodeInput('');
      setGeoJsonData(null);
      setPoints([]);
      return;
    }

    setFullKodeInput(value);
    setLoadingLevel('sls');
    try {
      // Fetch sub-SLS in parallel with map data
      const subPromise = getSubSLS(value);
      await Promise.all([
        loadMapAndPoints(value),
        subPromise.then((subs) => setSubslsItems(subs)).catch(() => setSubslsItems([])),
      ]);
    } catch (err: any) {
      setErrorToast('Gagal memuat data SLS.');
    } finally {
      setLoadingLevel(null);
    }
  };

  // Handle Sub-SLS Change
  const handleSubslsChange = async (value: string | null) => {
    setSelectedSubSLS(value);
    setSelectedPointId(null);

    if (value) {
      setFullKodeInput(value);
      await loadMapAndPoints(value);
    } else if (selectedSLS) {
      setFullKodeInput(selectedSLS);
      await loadMapAndPoints(selectedSLS);
    } else {
      setFullKodeInput('');
    }
  };

  // Handle Direct Full Kode SUBSLS Submit (calls identical API as selecting Sub-SLS)
  const handleFullKodeSubmit = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) {
      setErrorToast('Silakan masukkan Full Kode SUBSLS.');
      return;
    }

    setFullKodeInput(code);
    setSelectedPointId(null);
    setLoadingLevel('subsls');
    setErrorToast(null);

    try {
      // 1. Tembak API yang sama persis seperti saat memilih subsls (atau sls jika 14 digit)
      // code 16 digit: /maps/subsls_2025_01/{code} & /locations/{code}
      // code 14 digit: /maps/sls_2025_01/{code} & /locations/{code}
      await loadMapAndPoints(code);

      // 2. Set status terpilih
      if (code.length === 16) {
        setSelectedSubSLS(code);
      } else if (code.length === 14) {
        setSelectedSLS(code);
        setSelectedSubSLS(null);
      }

      // 3. Jika kode BPS standar Bali (51...) dengan panjang minimal 14 digit, sinkronkan dropdown secara otomatis
      if (code.startsWith('51') && code.length >= 14) {
        const kabCode = code.slice(0, 4);
        const kecCode = code.slice(0, 7);
        const desaCode = code.slice(0, 10);
        const slsCode = code.slice(0, 14);

        setSelectedKabupaten(kabCode);

        try {
          const [kecList, desaList, slsList] = await Promise.all([
            getKecamatan(kabCode).catch(() => []),
            getDesa(kecCode).catch(() => []),
            getSLS(desaCode).catch(() => []),
          ]);

          setKecamatanItems(kecList);
          setSelectedKecamatan(kecCode);

          setDesaItems(desaList);
          setSelectedDesa(desaCode);

          setSlsItems(slsList);
          setSelectedSLS(slsCode);

          const subList = await getSubSLS(slsCode).catch(() => []);
          setSubslsItems(subList);
          if (code.length === 16) {
            setSelectedSubSLS(code);
          }
        } catch (hierErr) {
          console.warn('Gagal memuat sebagian nama hierarki dropdown:', hierErr);
        }
      }
    } catch (err: any) {
      console.error('Error in handleFullKodeSubmit:', err);
      setErrorToast(err.message || 'Gagal memuat data dari Full Kode SUBSLS.');
    } finally {
      setLoadingLevel(null);
    }
  };

  // Apply Quick Preset
  const handleApplyPreset = async (preset: QuickPreset) => {
    setSelectedKabupaten(preset.kab);
    setSelectedKecamatan(null);
    setSelectedDesa(null);
    setSelectedSLS(null);
    setSelectedSubSLS(null);
    setFullKodeInput(preset.subsls || preset.sls);
    setLoadingLevel('kab');

    try {
      const [kecList, desaList, slsList] = await Promise.all([
        getKecamatan(preset.kab),
        getDesa(preset.kec),
        getSLS(preset.desa),
      ]);

      setKecamatanItems(kecList);
      setSelectedKecamatan(preset.kec);

      setDesaItems(desaList);
      setSelectedDesa(preset.desa);

      setSlsItems(slsList);
      setSelectedSLS(preset.sls);

      // Fetch Sub-SLS list
      getSubSLS(preset.sls).then((subs) => setSubslsItems(subs)).catch(() => setSubslsItems([]));

      // Load Map & Points
      await loadMapAndPoints(preset.sls);
    } catch (err: any) {
      console.error('Error applying preset:', err);
      setErrorToast('Gagal memuat preset wilayah pilihan.');
    } finally {
      setLoadingLevel(null);
    }
  };

  // Reset Everything
  const handleReset = () => {
    setSelectedKabupaten(null);
    setSelectedKecamatan(null);
    setSelectedDesa(null);
    setSelectedSLS(null);
    setSelectedSubSLS(null);
    setFullKodeInput('');
    setKecamatanItems([]);
    setDesaItems([]);
    setSlsItems([]);
    setSubslsItems([]);
    setGeoJsonData(null);
    setPoints([]);
    setSelectedPointId(null);
    setMapCenter([-8.4095, 115.1889]);
    setMapZoom(10);
  };

  // Handle Point Selection from Table or Map Marker
  const handleSelectPoint = (point: Point) => {
    setSelectedPointId(point.id);
  };

  // Automatically load the first preset on initial mount for instant live display
  useEffect(() => {
    handleApplyPreset(QUICK_PRESETS[0]);
  }, []);

  // Compute active SLS display name
  const activeSlsName = slsItems.find((s) => s.value === selectedSLS)?.title.split(' - ')[1] || null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Header */}
      <Header
        currentProvider={currentProvider}
        totalPoints={points.length}
        activeSlsName={activeSlsName}
        onOpenOsmModal={() => setIsOsmModalOpen(true)}
        onReset={handleReset}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Error Toast if any */}
        {errorToast && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorToast}</span>
            </div>
            <button
              onClick={() => setErrorToast(null)}
              className="p-1 text-rose-400 hover:text-rose-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Notice banner highlighting compliance & modern design */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-200/80 rounded-2xl p-3.5 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-600 text-white rounded-lg shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-950">
                Peta Leaflet Terverifikasi Bebas Error 403 & Sesuai Regulasi OSM:
              </span>{' '}
              <span className="text-emerald-800">
                Menggunakan Leaflet dengan tile OpenStreetMap standar & Humanitarian resmi berlisensi ODbL.
              </span>
            </div>
          </div>
          <button
            onClick={() => setIsOsmModalOpen(true)}
            className="text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2 shrink-0 self-end sm:self-auto"
          >
            Lihat Bukti Kepatuhan
          </button>
        </div>

        {/* 1. Territory Hierarchical Filter */}
        <TerritoryFilter
          selectedKabupaten={selectedKabupaten}
          selectedKecamatan={selectedKecamatan}
          selectedDesa={selectedDesa}
          selectedSLS={selectedSLS}
          selectedSubSLS={selectedSubSLS}
          kecamatanItems={kecamatanItems}
          desaItems={desaItems}
          slsItems={slsItems}
          subslsItems={subslsItems}
          loadingLevel={loadingLevel}
          fullKodeInput={fullKodeInput}
          onFullKodeInputChange={setFullKodeInput}
          onFullKodeSubmit={handleFullKodeSubmit}
          onKabChange={handleKabChange}
          onKecChange={handleKecChange}
          onDesaChange={handleDesaChange}
          onSlsChange={handleSlsChange}
          onSubslsChange={handleSubslsChange}
          onApplyPreset={handleApplyPreset}
          onReset={handleReset}
        />

        {/* 2. Statistical Metric Cards */}
        <StatsCards
          points={points}
          center={mapCenter}
          activeBoundaryName={activeSlsName}
        />

        {/* 3. Interactive WebGIS Map (Leaflet) */}
        <MapView
          center={mapCenter}
          zoom={mapZoom}
          points={points}
          geoJsonData={geoJsonData}
          loading={loadingLevel === 'map'}
          selectedPointId={selectedPointId}
          currentProvider={currentProvider}
          onSelectProvider={(p) => setCurrentProvider(p)}
          onSelectPoint={handleSelectPoint}
          onOpenOsmModal={() => setIsOsmModalOpen(true)}
        />

        {/* 4. Interactive Data Table with Search, Filter & Export */}
        <DataTable
          points={points}
          selectedPointId={selectedPointId}
          onSelectPoint={handleSelectPoint}
          activeSlsName={activeSlsName}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-8 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Sensus Ekonomi Provinsi Bali &copy; {new Date().getFullYear()} — BPS Provinsi Bali
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Tile Source: Leaflet & OpenStreetMap</span>
            <span>&bull;</span>
            <button 
              onClick={() => setIsOsmModalOpen(true)}
              className="hover:text-emerald-600 transition-colors"
            >
              OSM Tile Policy
            </button>
          </div>
        </div>
      </footer>

      {/* OpenStreetMap Regulation & Policy Modal */}
      <OsmPolicyModal
        isOpen={isOsmModalOpen}
        onClose={() => setIsOsmModalOpen(false)}
        onSelectRecommendedProvider={() => {
          const recommended = TILE_PROVIDERS.find((p) => p.id === 'osm-standard') || TILE_PROVIDERS[0];
          if (recommended) setCurrentProvider(recommended);
        }}
      />
    </div>
  );
}
