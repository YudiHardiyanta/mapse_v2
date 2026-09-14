import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { 
  Layers, 
  Maximize2, 
  Minimize2, 
  Crosshair, 
  ShieldCheck, 
  AlertCircle, 
  ExternalLink,
  Copy,
  Check,
  Navigation,
  Loader2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { Point, GeoJsonData, TileProvider } from '../types';
import { TILE_PROVIDERS } from '../data/tileProviders';

interface MapViewProps {
  center: [number, number];
  zoom: number;
  points: Point[];
  geoJsonData: GeoJsonData | null;
  loading: boolean;
  selectedPointId: string | null;
  currentProvider: TileProvider;
  onSelectProvider: (provider: TileProvider) => void;
  onSelectPoint: (point: Point) => void;
  onOpenOsmModal: () => void;
}

export const MapView: React.FC<MapViewProps> = ({
  center,
  zoom,
  points,
  geoJsonData,
  loading,
  selectedPointId,
  currentProvider,
  onSelectProvider,
  onSelectPoint,
  onOpenOsmModal,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);
  const markersLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const markerMapRef = useRef<Map<string, L.CircleMarker>>(new Map());

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [osmTileWarning, setOsmTileWarning] = useState<boolean>(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false, // We create custom sleek controls
      attributionControl: true,
    });

    // Custom attribution positioning
    map.attributionControl.setPosition('bottomright');

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerGroupRef.current = markersGroup;

    mapInstanceRef.current = map;

    // Observe resizing
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    setOsmTileWarning(false);

    const subdomains = currentProvider.subdomains || ['a', 'b', 'c'];
    const tileLayer = L.tileLayer(currentProvider.url, {
      attribution: currentProvider.attribution,
      subdomains: subdomains,
      maxZoom: currentProvider.maxZoom || 20,
    });

    // Listen for tile load errors (e.g. 403 Forbidden from OSM volunteer server)
    tileLayer.on('tileerror', (error) => {
      if (currentProvider.id === 'osm-standard') {
        console.warn('OSM Standard volunteer tile server rate limited or blocked (403):', error);
        setOsmTileWarning(true);
      }
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;
  }, [currentProvider]);

  // Update Center & Zoom when changed from outside
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Only set view if not animating to a point
    if (!selectedPointId) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom]);

  // Update GeoJSON Layer (SLS Boundary)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geoJsonLayerRef.current) {
      map.removeLayer(geoJsonLayerRef.current);
      geoJsonLayerRef.current = null;
    }

    if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
      const geoLayer = L.geoJSON(geoJsonData, {
        style: () => ({
          color: '#ea580c', // Bright orange boundary line
          weight: 2.5,
          opacity: 0.95,
          fillColor: '#f97316',
          fillOpacity: 0.22,
          dashArray: '4, 4',
        }),
        onEachFeature: (feature, layer) => {
          const props = feature.properties || {};
          const title = props.nmsls || props.nmsubsls || 'Batas SLS';
          const code = props.idsls || props.idsubsls || '';

          layer.bindTooltip(
            `<div class="p-1 font-sans text-xs">
              <div class="font-bold text-slate-900">${title}</div>
              <div class="text-[10px] text-slate-500 font-mono">${code}</div>
            </div>`,
            { sticky: true, className: 'leaflet-custom-tooltip' }
          );

          layer.on({
            mouseover: (e) => {
              const l = e.target;
              l.setStyle({
                weight: 3.5,
                fillOpacity: 0.35,
                dashArray: '',
              });
            },
            mouseout: (e) => {
              const l = e.target;
              l.setStyle({
                weight: 2.5,
                fillOpacity: 0.22,
                dashArray: '4, 4',
              });
            },
          });
        },
      }).addTo(map);

      geoJsonLayerRef.current = geoLayer;

      // Fit bounds if valid
      try {
        const bounds = geoLayer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
        }
      } catch (err) {
        console.warn('Error fitting bounds:', err);
      }
    }
  }, [geoJsonData]);

  // Update Point Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    markerMapRef.current.clear();

    points.forEach((item) => {
      const isApproved = (item.status || '').toLowerCase().includes('approved');
      const isRejected = (item.status || '').toLowerCase().includes('rejected');

      const color = isApproved ? '#059669' : isRejected ? '#e11d48' : '#f59e0b';
      const fillColor = isApproved ? '#10b981' : isRejected ? '#f4393e' : '#fbbf24';

      const marker = L.circleMarker([item.lat, item.long], {
        radius: 6.5,
        color: '#ffffff',
        weight: 1.8,
        fillColor: fillColor,
        fillOpacity: 0.95,
      });

      // Custom popup HTML
      const popupContent = document.createElement('div');
      popupContent.className = 'p-3 text-slate-800 text-xs space-y-2 min-w-[220px]';
      popupContent.innerHTML = `
        <div class="flex items-start justify-between gap-2 border-b border-slate-100 pb-2">
          <div>
            <div class="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">No. Bangunan</div>
            <div class="font-extrabold text-sm text-slate-900">#${item.no_bangunan || '-'}</div>
          </div>
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isApproved
              ? 'bg-emerald-100 text-emerald-800'
              : isRejected
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
          }">
            ${item.status || 'Belum Verifikasi'}
          </span>
        </div>
        <div class="space-y-1">
          <div>
            <span class="text-slate-400 text-[10px]">Nama:</span>
            <div class="font-bold text-slate-900">${item.nama || '-'}</div>
          </div>
          ${item.alamat ? `<div><span class="text-slate-400 text-[10px]">Alamat:</span> <div class="text-slate-700">${item.alamat}</div></div>` : ''}
          <div class="flex items-center justify-between text-[11px] font-mono bg-slate-50 p-1.5 rounded border border-slate-200">
            <span>${item.lat.toFixed(6)}, ${item.long.toFixed(6)}</span>
          </div>
        </div>
        <div class="pt-1 flex items-center gap-1.5">
          <a href="https://www.google.com/maps?q=${item.lat},${item.long}" target="_blank" rel="noopener noreferrer" class="flex-1 py-1 px-2 text-center rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors text-[10px] flex items-center justify-center gap-1">
            Google Maps
          </a>
        </div>
      `;

      marker.bindPopup(popupContent, { maxWidth: 300 });

      marker.on('click', () => {
        onSelectPoint(item);
      });

      markersGroup.addLayer(marker);
      markerMapRef.current.set(item.id, marker);
    });

    // If points exist and no geojson bounds, fit markers
    if (points.length > 0 && (!geoJsonData || !geoJsonData.features?.length)) {
      try {
        const group = L.featureGroup(Array.from(markerMapRef.current.values()));
        map.fitBounds(group.getBounds(), { padding: [30, 30], maxZoom: 19 });
      } catch (e) {
        // ignore
      }
    }
  }, [points, geoJsonData]);

  // Focus selected point if clicked from table
  useEffect(() => {
    if (!selectedPointId) return;
    const map = mapInstanceRef.current;
    const marker = markerMapRef.current.get(selectedPointId);
    if (!map || !marker) return;

    const latLng = marker.getLatLng();
    map.setView(latLng, Math.max(map.getZoom(), 18), { animate: true });
    marker.openPopup();

    // Pulse visual effect
    marker.setStyle({ radius: 10, weight: 3 });
    const timer = setTimeout(() => {
      marker.setStyle({ radius: 6.5, weight: 1.8 });
    }, 1500);

    return () => clearTimeout(timer);
  }, [selectedPointId]);

  // Handle fit bounds button
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geoJsonLayerRef.current) {
      const bounds = geoJsonLayerRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40] });
        return;
      }
    }

    if (points.length > 0) {
      const group = L.featureGroup(Array.from(markerMapRef.current.values()));
      map.fitBounds(group.getBounds(), { padding: [30, 30] });
      return;
    }

    map.setView(center, zoom);
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
  };

  return (
    <div
      className={`relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-0' : 'h-[520px] sm:h-[600px] w-full'
      }`}
    >
      {/* Map Container */}
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-xs flex flex-col items-center justify-center text-white">
          <div className="p-4 bg-white/95 rounded-2xl shadow-xl flex items-center gap-3 text-slate-800 text-xs font-semibold">
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
            <span>Memuat data poligon batas & titik sensus...</span>
          </div>
        </div>
      )}

      {/* OSM 403 Warning Alert (If user selects OSM Standard and encounters Volunteer Server Block) */}
      {osmTileWarning && currentProvider.id === 'osm-standard' && (
        <div className="absolute top-4 left-4 right-4 z-20 max-w-xl mx-auto p-3.5 bg-rose-950/90 text-white rounded-xl border border-rose-500 shadow-xl backdrop-blur-sm animate-in fade-in flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <div className="font-bold text-rose-200">OSM Volunteer Server 403 Terdeteksi</div>
              <div className="text-[11px] text-rose-300">
                Server relawan OSM mengalami antrean. Alihkan ke OSM Humanitarian (HOT) untuk koneksi lancar.
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              const hot = TILE_PROVIDERS.find((p) => p.id === 'osm-hot');
              if (hot) onSelectProvider(hot);
              setOsmTileWarning(false);
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shrink-0 ml-2"
          >
            Alihkan ke OSM HOT
          </button>
        </div>
      )}

      {/* Floating Top-Right Controls: Layer Switcher & Fullscreen */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {/* Layer Switcher Toggle */}
        <div className="relative">
          <button
            onClick={() => setShowLayerPicker(!showLayerPicker)}
            className="p-2.5 bg-white/95 hover:bg-white text-slate-700 hover:text-emerald-700 rounded-xl shadow-md border border-slate-200/90 transition-all flex items-center gap-1.5 text-xs font-semibold backdrop-blur-xs"
            title="Ganti Jenis Peta (Basemap)"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">{currentProvider.name}</span>
          </button>

          {/* Layer Menu Dropdown */}
          {showLayerPicker && (
            <div className="absolute right-0 mt-2 w-72 max-h-[380px] overflow-y-auto bg-white rounded-xl shadow-2xl border border-slate-200 p-2 space-y-1 text-xs z-30">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs pb-1 border-b border-slate-100">
                <span>Pilihan Provider Peta (Leaflet)</span>
                <span className="text-emerald-600 font-normal cursor-pointer" onClick={onOpenOsmModal}>
                  Aturan OSM
                </span>
              </div>
              {TILE_PROVIDERS.map((provider) => {
                const isActive = provider.id === currentProvider.id;
                return (
                  <button
                    key={provider.id}
                    onClick={() => {
                      onSelectProvider(provider);
                      setShowLayerPicker(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-start justify-between gap-2 transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-900 font-semibold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>{provider.name}</span>
                        {provider.id === 'osm-standard' && (
                          <span className="text-[9px] px-1 bg-blue-100 text-blue-800 rounded font-bold">
                            Default
                          </span>
                        )}
                        {provider.id === 'osm-hot' && (
                          <span className="text-[9px] px-1 bg-emerald-100 text-emerald-800 rounded font-bold">
                            Rekomendasi
                          </span>
                        )}
                        {provider.id.startsWith('carto') && (
                          <span className="text-[9px] px-1 bg-amber-100 text-amber-900 rounded font-semibold">
                            CARTO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                        {provider.description}
                      </div>
                    </div>
                    {isActive && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={toggleFullscreen}
          className="p-2.5 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl shadow-md border border-slate-200/90 transition-all backdrop-blur-xs"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Floating Top-Left Status Badge */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md text-xs font-semibold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-emerald-700 font-bold">Leaflet</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 truncate max-w-[130px] sm:max-w-[180px]">
            {currentProvider.name}
          </span>
        </div>

        <div className="bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl shadow-md border border-slate-200 text-xs font-medium text-slate-700 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Titik Ditampilkan: <strong className="text-slate-900">{points.length}</strong></span>
        </div>

        {geoJsonData && (
          <div className="bg-amber-500/90 text-white backdrop-blur-xs px-2.5 py-1 rounded-lg shadow-sm text-[11px] font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white" />
            <span>Batas SLS Aktif</span>
          </div>
        )}
      </div>

      {/* Custom Map Navigation Buttons (Zoom & Fit) on Bottom-Left */}
      <div className="absolute bottom-6 left-3 z-10 flex flex-col gap-1.5">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl shadow-md border border-slate-200/90 transition-all"
          title="Perbesar Peta"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2 bg-white/95 hover:bg-white text-slate-700 hover:text-slate-900 rounded-xl shadow-md border border-slate-200/90 transition-all"
          title="Perkecil Peta"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitBounds}
          className="p-2 bg-white/95 hover:bg-white text-emerald-700 rounded-xl shadow-md border border-slate-200/90 transition-all mt-1"
          title="Pusatkan Batas SLS / Titik Bangunan"
        >
          <Crosshair className="w-4 h-4" />
        </button>
      </div>

      {/* Legend Badge on Bottom-Right above Leaflet Attribution */}
      <div className="absolute bottom-8 right-3 z-10 hidden sm:flex items-center gap-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-[11px] font-medium text-slate-700">
        <span className="font-bold text-slate-900">Legenda:</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
          <span>Approved</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-200" />
          <span>Rejected</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-200" />
          <span>Lainnya</span>
        </div>
        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
          <span className="w-3 h-1.5 border border-dashed border-orange-500 bg-orange-200/50" />
          <span>Batas SLS</span>
        </div>
      </div>
    </div>
  );
};
