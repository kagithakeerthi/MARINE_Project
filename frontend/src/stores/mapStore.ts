import { create } from 'zustand';

interface Viewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing: number;
  pitch: number;
}

interface DebrisZone {
  id: string;
  center: [number, number];
  radius: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  debrisType: string;
  detectedAt: string;
}

interface EcosystemRegion {
  id: string;
  type: 'coral_reef' | 'seagrass' | 'algae' | 'protected_area';
  polygon: [number, number][];
  healthStatus: string;
  healthScore: number;
}

interface MapStore {
  viewport: Viewport;
  debrisZones: DebrisZone[];
  ecosystemRegions: EcosystemRegion[];
  selectedZone: string | null;
  layers: {
    debris: boolean;
    ecosystem: boolean;
    wave: boolean;
    satellite: boolean;
  };
  setViewport: (viewport: Partial<Viewport>) => void;
  setDebrisZones: (zones: DebrisZone[]) => void;
  setEcosystemRegions: (regions: EcosystemRegion[]) => void;
  setSelectedZone: (id: string | null) => void;
  toggleLayer: (layer: keyof MapStore['layers']) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  viewport: {
    latitude: 20.0,
    longitude: 80.0,
    zoom: 5,
    bearing: 0,
    pitch: 45,
  },
  debrisZones: [],
  ecosystemRegions: [],
  selectedZone: null,
  layers: {
    debris: true,
    ecosystem: true,
    wave: true,
    satellite: true,
  },
  
  setViewport: (viewport) =>
    set((state) => ({
      viewport: { ...state.viewport, ...viewport },
    })),
  
  setDebrisZones: (zones) => set({ debrisZones: zones }),
  
  setEcosystemRegions: (regions) => set({ ecosystemRegions: regions }),
  
  setSelectedZone: (id) => set({ selectedZone: id }),
  
  toggleLayer: (layer) =>
    set((state) => ({
      layers: { ...state.layers, [layer]: !state.layers[layer] },
    })),
}));
