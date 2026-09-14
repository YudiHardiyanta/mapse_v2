export interface SelectItem {
  title: string;
  value: string;
}

export interface RegionItem {
  level_1_fullcode?: string;
  level_2_fullcode?: string;
  level_3_fullcode?: string;
  level_4_fullcode?: string;
  level_5_fullcode?: string;
  level_6_fullcode?: string;
  level_1_name?: string;
  level_2_name?: string;
  level_3_name?: string;
  level_4_name?: string;
  level_5_name?: string;
  level_6_name?: string;
}

export interface Point {
  id: string;
  nama: string;
  alamat?: string;
  no_bangunan: string;
  jenis?: string;
  kodeWilayah: string;
  lat: number;
  long: number;
  status?: string;
}

export interface GeoJsonFeature {
  type: string;
  properties: {
    centroid_x?: number;
    centroid_y?: number;
    idsls?: string;
    idsubsls?: string;
    nmprov?: string;
    nmkab?: string;
    nmkec?: string;
    nmdesa?: string;
    nmsls?: string;
    nmsubsls?: string;
    [key: string]: any;
  };
  geometry: any;
}

export interface GeoJsonData {
  type: string;
  name?: string;
  features: GeoJsonFeature[];
  crs?: any;
}

export interface TileProvider {
  id: string;
  name: string;
  category: 'street' | 'satellite' | 'terrain' | 'dark' | 'light';
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom?: number;
  description: string;
  isOsmCompliant: boolean;
}

declare module 'leaflet' {
  interface MapOptions {
    rotate?: boolean;
    bearing?: number;
    rotateControl?: boolean | object;
    touchRotate?: boolean;
    shiftKeyRotate?: boolean;
    compassBearing?: boolean;
  }
  interface Map {
    setBearing?: (bearing: number) => this;
    getBearing?: () => number;
    touchRotate?: {
      enable: () => void;
      disable: () => void;
      enabled: () => boolean;
    };
    compassBearing?: {
      enable: () => void;
      disable: () => void;
      enabled: () => boolean;
    };
  }
}
