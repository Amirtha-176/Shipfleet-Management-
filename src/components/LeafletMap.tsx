import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Play,
  Pause,
  FastForward,
  Wind,
  Waves,
  CloudRain,
  Zap,
  Layers,
  Info,
  Compass,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { ITrackingItem } from '../types/client.ts';
import { useSocket } from '../context/SocketContext.tsx';
import {
  ACTIVE_STORMS,
  WAVE_HEIGHT_ZONES,
  GLOBAL_WIND_VECTORS,
  ICycloneStorm,
  IWaveZone
} from '../data/marineWeather.ts';

interface LeafletMapProps {
  vessels: ITrackingItem[];
  selectedVesselId?: string | null;
  onSelectVessel?: (vesselId: string) => void;
  height?: string;
  zoom?: number;
  center?: [number, number];
  showRoutes?: boolean;
  defaultBasemap?: 'dark' | 'satellite' | 'carto';
}

export type WeatherLayerType = 'none' | 'wind' | 'waves' | 'radar' | 'storms' | 'all';

export const LeafletMap: React.FC<LeafletMapProps> = ({
  vessels,
  selectedVesselId,
  onSelectVessel,
  height = '500px',
  zoom = 2,
  center = [20, 20],
  showRoutes = true,
  defaultBasemap = 'satellite'
}) => {
  const { simulationSpeed, setSimulationSpeed } = useSocket();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});
  const polylinesRef = useRef<L.Polyline[]>([]);
  const tileLayersRef = useRef<L.LayerGroup | null>(null);
  const weatherLayersRef = useRef<L.LayerGroup | null>(null);

  const [basemap, setBasemap] = useState<'dark' | 'satellite' | 'carto'>(defaultBasemap);
  const [weatherLayer, setWeatherLayer] = useState<WeatherLayerType>('storms');
  const [selectedStorm, setSelectedStorm] = useState<ICycloneStorm | null>(null);
  const [selectedWaveZone, setSelectedWaveZone] = useState<IWaveZone | null>(null);
  const [isWeatherMenuOpen, setIsWeatherMenuOpen] = useState(false);
  const [radarTimestamp, setRadarTimestamp] = useState<number | null>(null);

  const MAP_API_KEY = (import.meta as any).env?.VITE_MAP_API_KEY || '';

  // Fetch latest RainViewer radar timestamp
  useEffect(() => {
    fetch('https://api.rainviewer.com/public/weather-maps.json')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.radar && data.radar.past && data.radar.past.length > 0) {
          const latest = data.radar.past[data.radar.past.length - 1];
          setRadarTimestamp(latest.time);
        }
      })
      .catch(() => {
        // Fallback default timestamp
        setRadarTimestamp(Math.floor(Date.now() / 1000) - 600);
      });
  }, []);

  // Switch or set basemap layer
  const applyTileLayer = (map: L.Map, type: 'dark' | 'satellite' | 'carto') => {
    if (tileLayersRef.current) {
      tileLayersRef.current.remove();
      tileLayersRef.current = null;
    }

    const group = L.layerGroup();

    if (type === 'satellite') {
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(group);
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 18 }
      ).addTo(group);
    } else if (type === 'carto') {
      L.tileLayer(
        `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?api_key=${MAP_API_KEY}`,
        { subdomains: 'abcd', maxZoom: 19 }
      ).addTo(group);
    } else {
      // Clean Dark Maritime Basemap (Esri World Dark Gray - crisp, no watermarks)
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16 }
      ).addTo(group);
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 16 }
      ).addTo(group);
    }

    group.addTo(map);
    tileLayersRef.current = group;
  };

  // Render Weather & Storm Overlays
  const applyWeatherOverlays = (map: L.Map, type: WeatherLayerType) => {
    if (weatherLayersRef.current) {
      weatherLayersRef.current.remove();
      weatherLayersRef.current = null;
    }

    if (type === 'none') return;

    const group = L.layerGroup();

    // 1. RADAR PRECIPITATION LAYER
    if (type === 'radar' || type === 'all') {
      if (radarTimestamp) {
        L.tileLayer(
          `https://tilecache.rainviewer.com/v2/radar/${radarTimestamp}/256/{z}/{x}/{y}/2/1_1.png`,
          {
            opacity: 0.65,
            maxZoom: 12,
            zIndex: 100
          }
        ).addTo(group);
      }
    }

    // 2. WAVE HEIGHT & SEA STATE ZONES
    if (type === 'waves' || type === 'all') {
      WAVE_HEIGHT_ZONES.forEach((zone) => {
        const strokeColor =
          zone.riskLevel === 'extreme'
            ? '#ef4444'
            : zone.riskLevel === 'high'
            ? '#f97316'
            : zone.riskLevel === 'moderate'
            ? '#eab308'
            : '#10b981';

        const fillColor =
          zone.riskLevel === 'extreme'
            ? '#b91c1c'
            : zone.riskLevel === 'high'
            ? '#c2410c'
            : zone.riskLevel === 'moderate'
            ? '#a16207'
            : '#047857';

        const poly = L.polygon(zone.polygon, {
          color: strokeColor,
          weight: 1.8,
          dashArray: '5, 5',
          fillColor: fillColor,
          fillOpacity: 0.18
        }).addTo(group);

        poly.on('click', () => {
          setSelectedWaveZone(zone);
        });

        // Center badge for wave height
        const waveBadgeIcon = L.divIcon({
          className: 'wave-badge-icon',
          html: `
            <div style="background: rgba(15, 23, 42, 0.9); border: 1.5px solid ${strokeColor}; border-radius: 8px; padding: 2px 6px; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 10px rgba(0,0,0,0.6); pointer-events: none;">
              <span style="font-size: 11px;">🌊</span>
              <span style="font-size: 11px; font-weight: 800; color: #ffffff;">${zone.waveHeightMeters}m</span>
              <span style="font-size: 9px; color: ${strokeColor}; font-weight: 600;">${zone.seaStateText}</span>
            </div>
          `,
          iconSize: [88, 24],
          iconAnchor: [44, 12]
        });

        L.marker(zone.center, { icon: waveBadgeIcon, interactive: false }).addTo(group);
      });
    }

    // 3. GLOBAL WIND VECTORS
    if (type === 'wind' || type === 'all') {
      GLOBAL_WIND_VECTORS.forEach((wind) => {
        const windColor =
          wind.speedKnots >= 50
            ? '#ef4444'
            : wind.speedKnots >= 35
            ? '#f97316'
            : wind.speedKnots >= 20
            ? '#38bdf8'
            : '#34d399';

        const windIcon = L.divIcon({
          className: 'wind-arrow-icon',
          html: `
            <div style="background: rgba(15, 23, 42, 0.88); border: 1px solid ${windColor}; border-radius: 14px; padding: 2px 7px; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
              <div style="transform: rotate(${wind.directionDeg}deg); display: flex; align-items: center; justify-content: center; width: 12px; height: 12px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${windColor}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                </svg>
              </div>
              <span style="font-size: 10px; font-weight: 800; color: #ffffff;">${wind.speedKnots}kt</span>
            </div>
          `,
          iconSize: [60, 22],
          iconAnchor: [30, 11]
        });

        const m = L.marker(wind.position, { icon: windIcon }).addTo(group);
        m.bindPopup(`
          <div style="font-family: inherit; font-size: 12px; min-width: 170px; color: #0f172a; padding: 2px;">
            <div style="font-weight: 700; color: #1e3a8a; margin-bottom: 2px;">${wind.name}</div>
            <div><strong>Speed:</strong> ${wind.speedKnots} knots (${wind.gustKnots} kts gust)</div>
            <div><strong>Direction:</strong> ${wind.directionDeg}°</div>
            <div><strong>Beaufort Scale:</strong> Force ${wind.beaufortScale}</div>
          </div>
        `);
      });
    }

    // 4. ACTIVE CYCLONES & STORMS
    if (type === 'storms' || type === 'all') {
      ACTIVE_STORMS.forEach((storm) => {
        // Danger gale radius buffer circle
        L.circle(storm.center, {
          radius: storm.galeRadiusNm * 1852,
          color: storm.category >= 4 ? '#ef4444' : '#f97316',
          weight: 1.5,
          dashArray: '6, 6',
          fillColor: storm.category >= 4 ? '#ef4444' : '#f97316',
          fillOpacity: 0.12
        }).addTo(group);

        // Forecast track polyline
        L.polyline(storm.forecastTrack, {
          color: '#f87171',
          weight: 2.5,
          dashArray: '4, 6',
          opacity: 0.85
        }).addTo(group);

        // Rotating Cyclone SVG icon
        const stormIcon = L.divIcon({
          className: 'custom-storm-marker',
          html: `
            <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
              <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${
                storm.category >= 4 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(249, 115, 22, 0.3)'
              }; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: ${
                storm.category >= 4 ? '#dc2626' : '#ea580c'
              }; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 14px ${
                storm.category >= 4 ? 'rgba(220, 38, 38, 0.9)' : 'rgba(234, 88, 12, 0.9)'
              };">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 2a10 10 0 0 1 10 10c0 3-1.5 5.5-4 7"/>
                  <path d="M12 22a10 10 0 0 1-10-10c0-3 1.5-5.5 4-7"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });

        const stormMarker = L.marker(storm.center, { icon: stormIcon }).addTo(group);
        stormMarker.on('click', () => {
          setSelectedStorm(storm);
        });
      });
    }

    group.addTo(map);
    weatherLayersRef.current = group;
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        minZoom: 2,
        maxZoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      applyTileLayer(map, basemap);
      applyWeatherOverlays(map, weatherLayer);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update basemap
  useEffect(() => {
    if (mapInstanceRef.current) {
      applyTileLayer(mapInstanceRef.current, basemap);
    }
  }, [basemap]);

  // Update weather overlay
  useEffect(() => {
    if (mapInstanceRef.current) {
      applyWeatherOverlays(mapInstanceRef.current, weatherLayer);
    }
  }, [weatherLayer, radarTimestamp]);

  // Update Markers & Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old routes
    polylinesRef.current.forEach((line) => line.remove());
    polylinesRef.current = [];

    // Clear old markers that no longer exist
    const currentVesselIds = new Set(vessels.map((v) => v.vesselId));
    Object.keys(markersRef.current).forEach((vId) => {
      if (!currentVesselIds.has(vId)) {
        markersRef.current[vId].remove();
        delete markersRef.current[vId];
      }
    });

    // Create or update markers
    vessels.forEach((vsl) => {
      const isSelected = selectedVesselId === vsl.vesselId;
      const statusColor =
        vsl.status === 'In Transit'
          ? '#06b6d4'
          : vsl.status === 'Docked'
          ? '#10b981'
          : vsl.status === 'Maintenance'
          ? '#f59e0b'
          : vsl.status === 'Delayed'
          ? '#ef4444'
          : '#94a3b8';

      // Custom Ship SVG Icon with heading rotation
      const iconHtml = `
        <div style="transform: rotate(${vsl.heading}deg); transition: transform 0.5s ease-out; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
          <div style="background-color: ${isSelected ? '#3b82f6' : statusColor}; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 0 10px ${statusColor};">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m12 2 4 8H8l4-8z"/>
              <path d="M4 12v4a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-4"/>
              <path d="M12 10v10"/>
            </svg>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'custom-vessel-marker',
        html: iconHtml,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18]
      });

      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; color: #0f172a; padding: 4px;">
          <div style="font-weight: 700; font-size: 14px; margin-bottom: 2px; color: #1e3a8a;">${vsl.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-bottom: 6px;">${vsl.imoNumber} • ${vsl.type}</div>
          <div style="font-size: 12px; margin-bottom: 4px;"><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: 600;">${vsl.status}</span></div>
          <div style="font-size: 12px; margin-bottom: 4px;"><strong>Speed:</strong> ${vsl.speedKnots} knots (${vsl.heading}°)</div>
          <div style="font-size: 12px; margin-bottom: 4px;"><strong>Area:</strong> ${vsl.portOrArea}</div>
          ${
            vsl.voyage
              ? `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 11px;">
                  <div><strong>Voyage:</strong> ${vsl.voyage.voyageId}</div>
                  <div>${vsl.voyage.origin} ➔ ${vsl.voyage.destination}</div>
                  <div><strong>ETA:</strong> ${new Date(vsl.voyage.eta).toLocaleDateString()}</div>
                </div>`
              : ''
          }
        </div>
      `;

      if (markersRef.current[vsl.vesselId]) {
        // Update existing marker
        const existingMarker = markersRef.current[vsl.vesselId];
        existingMarker.setLatLng([vsl.lat, vsl.lng]);
        existingMarker.setIcon(customIcon);
        existingMarker.setPopupContent(popupContent);
      } else {
        // Create new marker
        const marker = L.marker([vsl.lat, vsl.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent);
        marker.on('click', () => {
          if (onSelectVessel) {
            onSelectVessel(vsl.vesselId);
          }
        });
        markersRef.current[vsl.vesselId] = marker;
      }

      // Draw Route Polyline if vessel has active voyage and routes enabled
      if (showRoutes && vsl.voyage && vsl.voyage.waypoints && vsl.voyage.waypoints.length > 1) {
        const polyline = L.polyline(vsl.voyage.waypoints, {
          color: isSelected ? '#38bdf8' : '#0284c7',
          weight: isSelected ? 3 : 2,
          opacity: isSelected ? 0.9 : 0.6,
          dashArray: '5, 8'
        }).addTo(map);

        polylinesRef.current.push(polyline);
      }
    });

    // Center map if selected vessel provided
    if (selectedVesselId) {
      const selected = vessels.find((v) => v.vesselId === selectedVesselId);
      if (selected) {
        map.setView([selected.lat, selected.lng], Math.max(map.getZoom(), 4), { animate: true });
        if (markersRef.current[selected.vesselId]) {
          markersRef.current[selected.vesselId].openPopup();
        }
      }
    }
  }, [vessels, selectedVesselId, showRoutes]);

  const isPaused = simulationSpeed === 0;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <div ref={mapContainerRef} style={{ height, width: '100%' }} />

      {/* TOP CONTROLS BAR: AIS Simulation Speed + Weather Overlays + Basemap */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: AIS Simulation Speed Control */}
        <div className="pointer-events-auto flex items-center space-x-1.5 p-1 rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 shadow-xl text-xs">
          <div className="flex items-center space-x-1 px-2 py-0.5 border-r border-slate-700 text-slate-300 font-semibold text-[11px]">
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">AIS Speed:</span>
          </div>

          {/* Play / Pause Toggle */}
          <button
            type="button"
            onClick={() => setSimulationSpeed(isPaused ? 1 : 0)}
            className={`p-1.5 rounded-lg font-bold transition-all flex items-center justify-center ${
              isPaused
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
            title={isPaused ? 'Resume live vessel movements' : 'Pause vessel movements'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
          </button>

          {/* Speed Presets */}
          <div className="flex items-center space-x-0.5">
            {[1, 2, 5, 10].map((spd) => (
              <button
                key={spd}
                type="button"
                onClick={() => setSimulationSpeed(spd)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  simulationSpeed === spd
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Status Badge */}
          <div className="hidden md:flex items-center pl-1 text-[10px] text-slate-400 font-medium">
            {isPaused ? (
              <span className="text-amber-400">⏸ Paused</span>
            ) : (
              <span className="text-cyan-400">⚡ Live ({simulationSpeed}x)</span>
            )}
          </div>
        </div>

        {/* Right: Weather & Storm Overlays + Basemap Switcher */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {/* Weather & Storm Overlay Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsWeatherMenuOpen(!isWeatherMenuOpen)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xl transition-all ${
                weatherLayer !== 'none'
                  ? 'bg-blue-600/30 text-cyan-300 border-cyan-500/60 backdrop-blur-md'
                  : 'bg-slate-900/95 text-slate-300 border-slate-700/80 hover:text-white backdrop-blur-md'
              }`}
            >
              {weatherLayer === 'wind' && <Wind className="w-3.5 h-3.5 text-cyan-400" />}
              {weatherLayer === 'waves' && <Waves className="w-3.5 h-3.5 text-amber-400" />}
              {weatherLayer === 'radar' && <CloudRain className="w-3.5 h-3.5 text-emerald-400" />}
              {weatherLayer === 'storms' && <Zap className="w-3.5 h-3.5 text-rose-400" />}
              {weatherLayer === 'all' && <Layers className="w-3.5 h-3.5 text-purple-400" />}
              {weatherLayer === 'none' && <Layers className="w-3.5 h-3.5 text-slate-400" />}
              <span>
                {weatherLayer === 'wind'
                  ? 'Wind Flow'
                  : weatherLayer === 'waves'
                  ? 'Wave Height'
                  : weatherLayer === 'radar'
                  ? 'Rain Radar'
                  : weatherLayer === 'storms'
                  ? 'Storms & Cyclones'
                  : weatherLayer === 'all'
                  ? 'All Weather'
                  : 'Weather: Off'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isWeatherMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-slate-900/98 border border-slate-700 shadow-2xl p-1 z-50 text-xs backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => {
                    setWeatherLayer('none');
                    setIsWeatherMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    weatherLayer === 'none' ? 'bg-slate-800 text-white font-bold' : 'text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  <span>None (Clear Maritime)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWeatherLayer('storms');
                    setIsWeatherMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    weatherLayer === 'storms' ? 'bg-rose-500/20 text-rose-300 font-bold' : 'text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5 text-rose-400" />
                  <span>Storms &amp; Cyclones</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWeatherLayer('waves');
                    setIsWeatherMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    weatherLayer === 'waves' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <Waves className="w-3.5 h-3.5 text-amber-400" />
                  <span>Wave Height &amp; Sea State</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWeatherLayer('wind');
                    setIsWeatherMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    weatherLayer === 'wind' ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Wind Vectors &amp; Knots</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWeatherLayer('radar');
                    setIsWeatherMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    weatherLayer === 'radar' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  <CloudRain className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Precipitation Radar</span>
                </button>
                <div className="my-1 border-t border-slate-800"></div>
                <button
                  type="button"
                  onClick={() => {
                    setWeatherLayer('all');
                    setIsWeatherMenuOpen(false);
                  }}
                  className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                    weatherLayer === 'all' ? 'bg-purple-500/20 text-purple-300 font-bold' : 'text-purple-300 hover:bg-slate-850'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>All Weather Overlays</span>
                </button>
              </div>
            )}
          </div>

          {/* Basemap Switcher */}
          <div className="bg-slate-900/95 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-xl flex items-center space-x-1 text-[11px] font-semibold text-slate-300">
            <button
              type="button"
              onClick={() => setBasemap('dark')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                basemap === 'dark' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              Dark
            </button>
            <button
              type="button"
              onClick={() => setBasemap('satellite')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                basemap === 'satellite' ? 'bg-blue-600 text-white shadow-sm' : 'hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>
        </div>
      </div>

      {/* STORM ADVISORY FLYOUT CARD (When a storm is clicked) */}
      {selectedStorm && (
        <div className="absolute top-16 left-3 z-[450] max-w-sm w-full bg-slate-900/95 backdrop-blur-md rounded-2xl border border-rose-500/50 shadow-2xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-1 rounded-md bg-rose-500/20 text-rose-400">
                  <Zap className="w-4 h-4" />
                </span>
                <span className="font-bold text-white text-sm">{selectedStorm.name}</span>
              </div>
              <div className="text-[11px] text-rose-300 font-medium mt-0.5">
                Category {selectedStorm.category} • {selectedStorm.classification}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedStorm(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block">Max Sustained Wind</span>
              <span className="font-extrabold text-rose-400 text-sm">{selectedStorm.maxWindKnots} kts</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block">Central Pressure</span>
              <span className="font-extrabold text-cyan-300 text-sm">{selectedStorm.centralPressureHpa} hPa</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block">Movement</span>
              <span className="font-bold text-slate-200">
                {selectedStorm.headingDeg}° at {selectedStorm.speedKnots} kts
              </span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block">Gale Radius</span>
              <span className="font-bold text-amber-300">{selectedStorm.galeRadiusNm} NM</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-[11px] text-rose-200 leading-relaxed">
            <div className="font-bold text-rose-300 mb-0.5 flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>IMO / NOAA Maritime Advisory</span>
            </div>
            {selectedStorm.advisory}
          </div>
        </div>
      )}

      {/* WAVE ZONE ADVISORY CARD (When a wave zone is clicked) */}
      {selectedWaveZone && (
        <div className="absolute top-16 left-3 z-[450] max-w-sm w-full bg-slate-900/95 backdrop-blur-md rounded-2xl border border-amber-500/50 shadow-2xl p-4 text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Waves className="w-4 h-4" />
              </span>
              <div>
                <span className="font-bold text-white text-sm">{selectedWaveZone.name}</span>
                <span className="block text-[11px] text-amber-300 font-semibold">
                  Significant Wave Height (Hs): {selectedWaveZone.waveHeightMeters}m
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWaveZone(null)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] text-center">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Sea State</span>
              <span className="font-extrabold text-amber-400">{selectedWaveZone.seaStateText}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Wave Period</span>
              <span className="font-extrabold text-cyan-300">{selectedWaveZone.wavePeriodSec}s</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px]">Swell Dir</span>
              <span className="font-extrabold text-slate-200">{selectedWaveZone.swellDirectionDeg}°</span>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM LEGEND: Vessel Status + Active Weather Scale */}
      <div className="absolute bottom-3 left-3 z-[400] flex flex-wrap items-center gap-2 pointer-events-none">
        {/* Vessel Status Legend */}
        <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 text-xs shadow-xl flex items-center space-x-3 text-slate-300">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400"></span>
            <span>In Transit</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span>Docked</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span>Maintenance</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
            <span>Delayed</span>
          </div>
        </div>

        {/* Weather Scale Legend (Shown if weather layers are active) */}
        {weatherLayer !== 'none' && (
          <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/80 text-[11px] shadow-xl flex items-center space-x-3 text-slate-300">
            {(weatherLayer === 'waves' || weatherLayer === 'all') && (
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-semibold">Waves:</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">&lt;2m</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">2-4m</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400">4-7m</span>
                <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400">&gt;7m</span>
              </div>
            )}
            {(weatherLayer === 'wind' || weatherLayer === 'all') && (
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-semibold">Wind:</span>
                <span className="text-cyan-400">Trades (15-25k)</span>
                <span className="text-amber-400">Gale (35-50k)</span>
                <span className="text-rose-400">Storm (60k+)</span>
              </div>
            )}
            {(weatherLayer === 'storms' || weatherLayer === 'all') && (
              <div className="flex items-center space-x-1.5 text-rose-300">
                <Zap className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span>Active Tropical Storm Warning</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
