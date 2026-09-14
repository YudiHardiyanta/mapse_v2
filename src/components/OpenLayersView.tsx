import React, { useEffect, useRef, useState } from 'react';
import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import XYZ from 'ol/source/XYZ';
import GeoJSON from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import PointGeom from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Style, Circle as CircleStyle, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';
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
  ZoomOut,
  Sparkles,
  Map as MapIcon,
  X
} from 'lucide-react';
import { Point, GeoJsonData, TileProvider } from '../types';
import { TILE_PROVIDERS } from '../data/tileProviders';

interface OpenLayersViewProps {
  center: [number, number]; // [lat, lng]
  zoom: number;
  points: Point[];
  geoJsonData: GeoJsonData | null;
  loading: boolean;
  selectedPointId: string | null;
  currentProvider: TileProvider;
  onSelectProvider: (provider: TileProvider) => void;
  onSelectPoint: (point: Point) => void;
  onOpenOsmModal: () => void;
  activeEngine: 'openlayers' | 'leaflet';
  onToggleEngine: (engine: 'openlayers' | 'leaflet') => void;
}

export const OpenLayersView: React.FC<OpenLayersViewProps> = ({
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
  activeEngine,
  onToggleEngine,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  
  const mapInstanceRef = useRef<Map | null>(null);
  const tileLayerRef = useRef<TileLayer<XYZ> | null>(null);
  const boundaryLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const pointsLayerRef = useRef<VectorLayer<VectorSource> | null>(null);
  const overlayRef = useRef<Overlay | null>(null);

  const [activePopupPoint, setActivePopupPoint] = useState<Point | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayerPicker, setShowLayerPicker] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [osmTileWarning, setOsmTileWarning] = useState<boolean>(false);

  // Helper to build XYZ URLs for OpenLayers
  const getProviderUrls = (provider: TileProvider): string[] => {
    if (provider.subdomains && provider.subdomains.length > 0) {
      return provider.subdomains.map((s) =>
        provider.url.replace('{s}', s).replace('{r}', '')
      );
    }
    return [provider.url.replace('{r}', '')];
  };

  // Point Style Generator
  const getPointStyle = (point: Point, isSelected: boolean) => {
    const statusLower = (point.status || '').toLowerCase();
    const isApproved = statusLower.includes('approved') || statusLower.includes('disetujui');
    const isRejected = statusLower.includes('rejected') || statusLower.includes('ditolak');

    let fillColor = '#f59e0b'; // Amber (pending/other)
    if (isApproved) {
      fillColor = '#10b981'; // Emerald
    } else if (isRejected) {
      fillColor = '#f43f5e'; // Rose
    }

    return new Style({
      image: new CircleStyle({
        radius: isSelected ? 9 : 6.5,
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({
          color: isSelected ? '#1e293b' : '#ffffff',
          width: isSelected ? 3 : 2,
        }),
      }),
    });
  };

  // Initialize OpenLayers Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Initial Base Tile Layer
    const tileSource = new XYZ({
      urls: getProviderUrls(currentProvider),
      attributions: currentProvider.attribution,
      maxZoom: currentProvider.maxZoom || 19,
      crossOrigin: 'anonymous',
    });

    tileSource.on('tileloaderror', () => {
      if (currentProvider.id === 'osm-standard') {
        setOsmTileWarning(true);
      }
    });

    const tileLayer = new TileLayer({
      source: tileSource,
    });
    tileLayerRef.current = tileLayer;

    // Vector Layer for SLS/Sub-SLS boundary
    const boundarySource = new VectorSource();
    const boundaryLayer = new VectorLayer({
      source: boundarySource,
      style: new Style({
        stroke: new Stroke({
          color: '#ea580c',
          width: 2.5,
          lineDash: [6, 6],
        }),
        fill: new Fill({
          color: 'rgba(234, 88, 12, 0.08)',
        }),
      }),
      zIndex: 10,
    });
    boundaryLayerRef.current = boundaryLayer;

    // Vector Layer for Points
    const pointsSource = new VectorSource();
    const pointsLayer = new VectorLayer({
      source: pointsSource,
      style: (feature) => {
        const pt = feature.get('pointData') as Point;
        const isSelected = pt && pt.id === selectedPointId;
        return getPointStyle(pt, isSelected);
      },
      zIndex: 20,
    });
    pointsLayerRef.current = pointsLayer;

    // Overlay Popup
    const overlay = new Overlay({
      element: popupRef.current || undefined,
      autoPan: {
        animation: {
          duration: 250,
        },
        margin: 40,
      },
      positioning: 'bottom-center',
      stopEvent: true,
      offset: [0, -12],
    });
    overlayRef.current = overlay;

    // Create Map
    const map = new Map({
      target: mapContainerRef.current,
      layers: [tileLayer, boundaryLayer, pointsLayer],
      overlays: [overlay],
      controls: [], // We use our custom sleek controls
      view: new View({
        center: fromLonLat([center[1], center[0]]),
        zoom: zoom,
        maxZoom: 20,
        minZoom: 9,
      }),
    });

    mapInstanceRef.current = map;

    // Map Click Interaction
    map.on('click', (evt) => {
      let clickedPoint: Point | null = null;
      let clickedCoord: number[] | null = null;

      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (layer === pointsLayer) {
          const pt = feature.get('pointData') as Point;
          if (pt) {
            clickedPoint = pt;
            const geom = feature.getGeometry() as PointGeom;
            clickedCoord = geom.getCoordinates();
            return true; // Stop iteration
          }
        }
      });

      if (clickedPoint && clickedCoord) {
        setActivePopupPoint(clickedPoint);
        onSelectPoint(clickedPoint);
        overlay.setPosition(clickedCoord);
      } else {
        // Clicked outside point
        overlay.setPosition(undefined);
        setActivePopupPoint(null);
      }
    });

    // Pointer cursor when hovering points
    map.on('pointermove', (evt) => {
      if (evt.dragging) return;
      const hit = map.hasFeatureAtPixel(evt.pixel, {
        layerFilter: (layer) => layer === pointsLayer,
      });
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      map.updateSize();
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      map.setTarget(undefined);
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when currentProvider changes
  useEffect(() => {
    const tileLayer = tileLayerRef.current;
    if (!tileLayer) return;

    setOsmTileWarning(false);
    const newSource = new XYZ({
      urls: getProviderUrls(currentProvider),
      attributions: currentProvider.attribution,
      maxZoom: currentProvider.maxZoom || 19,
      crossOrigin: 'anonymous',
    });

    newSource.on('tileloaderror', () => {
      if (currentProvider.id === 'osm-standard') {
        setOsmTileWarning(true);
      }
    });

    tileLayer.setSource(newSource);
  }, [currentProvider]);

  // Update SLS / Sub-SLS Boundary GeoJSON
  useEffect(() => {
    const boundaryLayer = boundaryLayerRef.current;
    const map = mapInstanceRef.current;
    if (!boundaryLayer || !map) return;

    const source = boundaryLayer.getSource();
    if (!source) return;

    source.clear();

    if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
      try {
        const features = new GeoJSON().readFeatures(geoJsonData, {
          dataProjection: 'EPSG:4326',
          featureProjection: 'EPSG:3857',
        });
        source.addFeatures(features);

        // Fit view to polygon
        const extent = source.getExtent();
        if (extent && !extent.some(isNaN)) {
          map.getView().fit(extent, {
            padding: [50, 50, 50, 50],
            maxZoom: 18,
            duration: 500,
          });
        }
      } catch (err) {
        console.error('Failed to parse GeoJSON in OpenLayers:', err);
      }
    }
  }, [geoJsonData]);

  // Update Points Features
  useEffect(() => {
    const pointsLayer = pointsLayerRef.current;
    if (!pointsLayer) return;

    const source = pointsLayer.getSource();
    if (!source) return;

    source.clear();

    if (points && points.length > 0) {
      const features = points
        .filter((pt) => pt.lat && pt.long && !isNaN(Number(pt.lat)) && !isNaN(Number(pt.long)))
        .map((pt) => {
          const feature = new Feature({
            geometry: new PointGeom(fromLonLat([Number(pt.long), Number(pt.lat)])),
            pointData: pt,
          });
          return feature;
        });

      source.addFeatures(features);
    }
  }, [points]);

  // Update Styles when selectedPointId changes
  useEffect(() => {
    const pointsLayer = pointsLayerRef.current;
    if (!pointsLayer) return;

    pointsLayer.setStyle((feature) => {
      const pt = feature.get('pointData') as Point;
      const isSelected = pt && pt.id === selectedPointId;
      return getPointStyle(pt, isSelected);
    });

    // If external selection, pan to point and show popup
    if (selectedPointId && points && points.length > 0) {
      const targetPoint = points.find((p) => p.id === selectedPointId);
      const map = mapInstanceRef.current;
      const overlay = overlayRef.current;

      if (targetPoint && map && overlay) {
        const coord = fromLonLat([Number(targetPoint.long), Number(targetPoint.lat)]);
        setActivePopupPoint(targetPoint);
        overlay.setPosition(coord);
        map.getView().animate({
          center: coord,
          zoom: Math.max(map.getView().getZoom() || 16, 17),
          duration: 400,
        });
      }
    }
  }, [selectedPointId, points]);

  // Handle Zoom In / Out
  const handleZoomIn = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const view = map.getView();
    view.animate({ zoom: (view.getZoom() || 15) + 1, duration: 250 });
  };

  const handleZoomOut = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const view = map.getView();
    view.animate({ zoom: (view.getZoom() || 15) - 1, duration: 250 });
  };

  // Reset / Fit Bounds
  const handleFitBounds = () => {
    const map = mapInstanceRef.current;
    const boundaryLayer = boundaryLayerRef.current;
    const pointsLayer = pointsLayerRef.current;
    if (!map) return;

    if (boundaryLayer && boundaryLayer.getSource()?.getFeatures().length) {
      const extent = boundaryLayer.getSource()!.getExtent();
      map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 18, duration: 400 });
    } else if (pointsLayer && pointsLayer.getSource()?.getFeatures().length) {
      const extent = pointsLayer.getSource()!.getExtent();
      map.getView().fit(extent, { padding: [50, 50, 50, 50], maxZoom: 18, duration: 400 });
    } else {
      map.getView().animate({
        center: fromLonLat([center[1], center[0]]),
        zoom: 15,
        duration: 400,
      });
    }
  };

  // Copy coordinates
  const handleCopyCoord = (lat: string, lng: string, id: string) => {
    const text = `${lat}, ${lng}`;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const closePopup = () => {
    if (overlayRef.current) {
      overlayRef.current.setPosition(undefined);
    }
    setActivePopupPoint(null);
  };

  return (
    <div
      id="openlayers-map-container-wrapper"
      className={`relative rounded-2xl overflow-hidden border border-slate-200/90 shadow-sm bg-slate-100 transition-all duration-300 ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none h-screen' : 'h-[520px] sm:h-[600px] w-full'
      }`}
    >
      {/* Map Target Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full" tabIndex={0} />

      {/* Top Left: Engine & Basemap Indicator Pill */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/90 shadow-md text-xs font-semibold text-slate-800">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-emerald-700 font-bold">OpenLayers v10</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 truncate max-w-[130px] sm:max-w-[180px]">
            {currentProvider.name}
          </span>
        </div>

        {/* Engine Switcher Toggle (OpenLayers vs Leaflet) */}
        <div className="flex items-center bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-md text-xs font-medium">
          <button
            onClick={() => onToggleEngine('openlayers')}
            className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
              activeEngine === 'openlayers'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Gunakan OpenLayers sebagai engine peta utama"
          >
            <Sparkles className="w-3 h-3" />
            <span>OpenLayers</span>
          </button>
          <button
            onClick={() => onToggleEngine('leaflet')}
            className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
              activeEngine === 'leaflet'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Beralih ke Leaflet engine"
          >
            <MapIcon className="w-3 h-3" />
            <span>Leaflet</span>
          </button>
        </div>
      </div>

      {/* Top Right: Controls (Layer, Zoom, Fit, Fullscreen) */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2 pointer-events-auto">
        {/* Layer Picker Toggle */}
        <div className="relative">
          <button
            id="btn-openlayer-picker"
            onClick={() => setShowLayerPicker(!showLayerPicker)}
            className={`p-2.5 rounded-xl border shadow-md backdrop-blur-md transition-all flex items-center gap-1.5 text-xs font-semibold ${
              showLayerPicker
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white/95 text-slate-700 hover:bg-white border-slate-200'
            }`}
            title="Ganti Jenis Peta (CARTO / OSM / Satelit)"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Pilihan Peta</span>
          </button>

          {/* Layer Menu Dropdown */}
          {showLayerPicker && (
            <div className="absolute right-0 top-12 w-72 sm:w-80 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-20 space-y-2 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" /> Basemap Engine OpenLayers
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                  Resmi ODbL
                </span>
              </div>

              <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                {TILE_PROVIDERS.map((provider) => {
                  const isSelected = currentProvider.id === provider.id;
                  return (
                    <button
                      key={provider.id}
                      onClick={() => {
                        onSelectProvider(provider);
                        setShowLayerPicker(false);
                      }}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all flex flex-col gap-0.5 ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50/80 text-emerald-950 font-semibold shadow-xs'
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold flex items-center gap-1.5">
                          {provider.name}
                          {provider.id === 'carto-voyager' && (
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-bold">
                              Rekomendasi
                            </span>
                          )}
                          {provider.id === 'osm-standard' && (
                            <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-medium">
                              OSM Asli
                            </span>
                          )}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal leading-tight line-clamp-2">
                        {provider.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-100 text-slate-700 transition-colors border-b border-slate-100"
            title="Perbesar Peta (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-100 text-slate-700 transition-colors"
            title="Perkecil Peta (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Fit Bounds / Centering */}
        <button
          onClick={handleFitBounds}
          className="p-2.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md hover:bg-white text-slate-700 transition-all flex items-center justify-center"
          title="Pusatkan Batas SLS & Titik"
        >
          <Crosshair className="w-4 h-4 text-emerald-600" />
        </button>

        {/* Fullscreen Toggle */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-2.5 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-md hover:bg-white text-slate-700 transition-all flex items-center justify-center"
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 bg-slate-900/20 backdrop-blur-[2px] flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 px-4 py-3 rounded-2xl shadow-xl border border-slate-200 flex items-center space-x-3">
            <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
            <span className="text-xs font-semibold text-slate-800">
              Memuat data spasial OpenLayers...
            </span>
          </div>
        </div>
      )}

      {/* OSM 403 Warning & Fallback Banner */}
      {osmTileWarning && currentProvider.id === 'osm-standard' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 max-w-md w-[90%] bg-rose-50 border border-rose-200 rounded-2xl p-3.5 shadow-xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-rose-900">Peringatan Server OSM 403 Terdeteksi</h4>
              <p className="text-rose-700 leading-relaxed">
                Server sukarelawan OpenStreetMap membatasi akses langsung web app tanpa CDN. Beralihlah ke CARTO Voyager untuk akses lancar 100%.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  onClick={() => onSelectProvider(TILE_PROVIDERS[0])}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-colors"
                >
                  Beralih ke CARTO Voyager
                </button>
                <button
                  onClick={() => setOsmTileWarning(false)}
                  className="text-slate-500 hover:text-slate-700 text-xs underline"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Left: Map Legend */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-slate-200/90 shadow-md flex items-center flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white shadow-xs" />
            <span className="text-slate-700 font-medium">Disetujui</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500 border border-white shadow-xs" />
            <span className="text-slate-700 font-medium">Ditolak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs" />
            <span className="text-slate-700 font-medium">Pending/Lainnya</span>
          </div>
          {geoJsonData && (
            <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200">
              <span className="w-3.5 h-1 bg-orange-600 rounded-full" />
              <span className="text-slate-700 font-medium">Batas SLS</span>
            </div>
          )}
        </div>
      </div>

      {/* OpenLayers Popup Element Container (Managed by ol/Overlay) */}
      <div
        ref={popupRef}
        className="pointer-events-auto"
        style={{ display: activePopupPoint ? 'block' : 'none' }}
      >
        {activePopupPoint && (() => {
          const statusLower = (activePopupPoint.status || '').toLowerCase();
          const isApproved = statusLower.includes('approved') || statusLower.includes('disetujui');
          const isRejected = statusLower.includes('rejected') || statusLower.includes('ditolak');

          return (
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden w-72 text-xs font-sans animate-in fade-in zoom-in-95">
              {/* Header */}
              <div
                className={`p-3 text-white flex items-center justify-between ${
                  isApproved
                    ? 'bg-emerald-600'
                    : isRejected
                    ? 'bg-rose-600'
                    : 'bg-amber-600'
                }`}
              >
                <div className="flex items-center space-x-1.5">
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="font-bold truncate max-w-[200px]">
                    {activePopupPoint.nama || `Titik #${activePopupPoint.no_bangunan}`}
                  </span>
                </div>
                <button
                  onClick={closePopup}
                  className="text-white/80 hover:text-white p-0.5 rounded-md hover:bg-black/10 transition-colors"
                  title="Tutup Popup"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-3 space-y-2 text-slate-700">
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-400">Nomor Bangunan:</span>
                  <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded font-mono">
                    #{activePopupPoint.no_bangunan || '-'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-100">
                  <span className="text-slate-400">Status:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[11px] ${
                      isApproved
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isRejected
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {activePopupPoint.status || 'Belum Verifikasi'}
                  </span>
                </div>
                {activePopupPoint.alamat && (
                  <div className="flex justify-between items-start py-1 border-b border-slate-100">
                    <span className="text-slate-400 shrink-0">Alamat:</span>
                    <span className="font-medium text-slate-800 text-right line-clamp-2">
                      {activePopupPoint.alamat}
                    </span>
                  </div>
                )}
                <div className="py-1 border-b border-slate-100 space-y-1">
                  <span className="text-slate-400 block text-[11px]">Koordinat GPS:</span>
                  <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200/80 font-mono text-[11px]">
                    <span>
                      {Number(activePopupPoint.lat).toFixed(6)},{' '}
                      {Number(activePopupPoint.long).toFixed(6)}
                    </span>
                    <button
                      onClick={() =>
                        handleCopyCoord(
                          String(activePopupPoint.lat),
                          String(activePopupPoint.long),
                          activePopupPoint.id
                        )
                      }
                      className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                      title="Salin Koordinat"
                    >
                      {copiedId === activePopupPoint.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Action Link: Google Maps */}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${activePopupPoint.lat},${activePopupPoint.long}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full mt-2 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center justify-center space-x-1.5 font-medium transition-colors"
                >
                  <span>Buka di Google Maps</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
