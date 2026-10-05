import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SpringEntity, InterventionRecommendation } from '../types';
import { Layers, MapPin, Compass, Ruler, Eye, Crosshair } from 'lucide-react';

interface GisMapProps {
  springs: SpringEntity[];
  selectedSpring: SpringEntity | null;
  onSelectSpring: (spring: SpringEntity) => void;
  interventions?: InterventionRecommendation[];
}

export const GisMap: React.FC<GisMapProps> = ({
  springs,
  selectedSpring,
  onSelectSpring,
  interventions = []
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Layer groups refs
  const baseLayersRef = useRef<{ [key: string]: L.Layer }>({});
  const springsLayerRef = useRef<L.LayerGroup | null>(null);
  const polygonLayerRef = useRef<L.LayerGroup | null>(null);
  const lineamentsLayerRef = useRef<L.LayerGroup | null>(null);
  const streamsLayerRef = useRef<L.LayerGroup | null>(null);
  const interventionsLayerRef = useRef<L.LayerGroup | null>(null);
  const measureLayerRef = useRef<L.LayerGroup | null>(null);

  // UI state
  const [activeBasemap, setActiveBasemap] = useState<'dark' | 'topo' | 'satellite'>('dark');
  const [showLayerPanel, setShowLayerPanel] = useState<boolean>(false);
  const [visibleLayers, setVisibleLayers] = useState({
    springs: true,
    rechargeZones: true,
    lineaments: true,
    streams: true,
    interventions: true,
  });
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [measuringMode, setMeasuringMode] = useState<boolean>(false);
  const [measurePoints, setMeasurePoints] = useState<L.LatLng[]>([]);
  const [measuredDistanceM, setMeasuredDistanceM] = useState<number | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Basemaps
    const runtimeKey = typeof window !== 'undefined' ? (window as any).__SPRINGAI_CONFIG__?.cartoApiKey : undefined;
    const cartoKey = runtimeKey || (import.meta as any).env?.VITE_CARTO_API_KEY;

    // If an API key is provided, use CARTO Dark Matter with ?key=...
    // If no key is provided, use ESRI World Dark Gray Canvas so maps never show watermark errors!
    const darkTile = (cartoKey && cartoKey.trim().length > 0)
      ? L.tileLayer(
          cartoKey.startsWith('http')
            ? cartoKey
            : `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey.trim()}`,
          {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            subdomains: 'abcd',
            maxZoom: 19
          }
        )
      : L.layerGroup([
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
            maxZoom: 16
          }),
          L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
            attribution: '',
            maxZoom: 16
          })
        ]);

    const topoTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA, FAO',
      maxZoom: 18
    });

    const satelliteTile = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 18
    });

    baseLayersRef.current = {
      dark: darkTile,
      topo: topoTile,
      satellite: satelliteTile
    };

    const initialLat = selectedSpring ? selectedSpring.latitude : 29.3512;
    const initialLng = selectedSpring ? selectedSpring.longitude : 79.5623;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      layers: [darkTile],
      zoomControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create layer groups
    springsLayerRef.current = L.layerGroup().addTo(map);
    polygonLayerRef.current = L.layerGroup().addTo(map);
    lineamentsLayerRef.current = L.layerGroup().addTo(map);
    streamsLayerRef.current = L.layerGroup().addTo(map);
    interventionsLayerRef.current = L.layerGroup().addTo(map);
    measureLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Mouse coordinates tracker
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      setCursorCoords({ lat: Number(e.latlng.lat.toFixed(5)), lng: Number(e.latlng.lng.toFixed(5)) });
    });

    map.on('mouseout', () => {
      setCursorCoords(null);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Basemap Switch
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(baseLayersRef.current).forEach(tile => {
      if (map.hasLayer(tile)) map.removeLayer(tile);
    });

    const activeTile = baseLayersRef.current[activeBasemap];
    if (activeTile) {
      activeTile.addTo(map);
      (activeTile as any).bringToBack?.();
    }
  }, [activeBasemap]);

  // Handle Measuring Tool Click
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (!measuringMode) return;

      const newPoints = [...measurePoints, e.latlng];
      setMeasurePoints(newPoints);

      if (measureLayerRef.current) {
        measureLayerRef.current.clearLayers();

        // Add point markers
        newPoints.forEach(p => {
          L.circleMarker(p, { radius: 5, color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 0.9 }).addTo(measureLayerRef.current!);
        });

        // Add line connecting points
        if (newPoints.length > 1) {
          const polyline = L.polyline(newPoints, { color: '#f59e0b', weight: 2.5, dashArray: '5, 5' }).addTo(measureLayerRef.current!);
          let totalDistM = 0;
          for (let i = 0; i < newPoints.length - 1; i++) {
            totalDistM += newPoints[i].distanceTo(newPoints[i + 1]);
          }
          setMeasuredDistanceM(Math.round(totalDistM));
        }
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [measuringMode, measurePoints]);

  const resetMeasureTool = () => {
    setMeasurePoints([]);
    setMeasuredDistanceM(null);
    if (measureLayerRef.current) {
      measureLayerRef.current.clearLayers();
    }
  };

  // Render Geological Lineaments and Drainage
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !lineamentsLayerRef.current || !streamsLayerRef.current) return;

    lineamentsLayerRef.current.clearLayers();
    streamsLayerRef.current.clearLayers();

    if (!visibleLayers.lineaments && !visibleLayers.streams) return;

    springs.forEach(spring => {
      const lat = spring.latitude;
      const lng = spring.longitude;

      // Geological Fault Lineaments (red/crimson dashed lines aligned with strike)
      if (visibleLayers.lineaments) {
        const rad = (spring.strike * Math.PI) / 180;
        const len = 0.015;
        const lineCoords: [number, number][] = [
          [lat - len * Math.sin(rad), lng - len * Math.cos(rad)],
          [lat + len * Math.sin(rad), lng + len * Math.cos(rad)]
        ];

        const line = L.polyline(lineCoords, {
          color: '#ef4444',
          weight: 2,
          dashArray: '6, 6',
          opacity: 0.8
        });
        line.bindTooltip(`Fault Lineament · Strike ${spring.strike}°`, { permanent: false, direction: 'top' });
        lineamentsLayerRef.current?.addLayer(line);
      }

      // Drainage Streams (blue stream vector paths)
      if (visibleLayers.streams) {
        const streamCoords: [number, number][] = [
          [lat + 0.012, lng - 0.004],
          [lat + 0.007, lng - 0.001],
          [lat, lng],
          [lat - 0.006, lng + 0.003],
          [lat - 0.012, lng + 0.008]
        ];

        const streamLine = L.polyline(streamCoords, {
          color: '#38bdf8',
          weight: 2.5,
          opacity: 0.85
        });
        streamLine.bindTooltip(`Ephemeral Drainage Channel (Order 2)`, { permanent: false, direction: 'right' });
        streamsLayerRef.current?.addLayer(streamLine);
      }
    });
  }, [springs, visibleLayers.lineaments, visibleLayers.streams]);

  // Render Springs Markers & Delineated Recharge Zone Polygon
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !springsLayerRef.current || !polygonLayerRef.current) return;

    springsLayerRef.current.clearLayers();
    polygonLayerRef.current.clearLayers();

    if (visibleLayers.springs) {
      springs.forEach(spring => {
        const isSelected = selectedSpring?.id === spring.id;

        // Color based on status
        let fillColor = '#06b6d4'; // Active - cyan
        if (spring.status === 'Critical') fillColor = '#ef4444'; // Red
        else if (spring.status === 'Drying') fillColor = '#f59e0b'; // Amber
        else if (spring.status === 'Revived') fillColor = '#10b981'; // Emerald

        const marker = L.circleMarker([spring.latitude, spring.longitude], {
          radius: isSelected ? 9 : 7,
          color: isSelected ? '#ffffff' : '#0f172a',
          weight: isSelected ? 2.5 : 1.5,
          fillColor,
          fillOpacity: 0.95
        });

        // Popup content with scientific metrics
        const popupContent = `
          <div style="font-family: sans-serif; min-width: 220px; font-size: 12px; color: #0f172a;">
            <div style="font-weight: 700; font-size: 13px; margin-bottom: 2px;">${spring.name}</div>
            <div style="color: #64748b; margin-bottom: 8px;">${spring.id} · ${spring.village}, ${spring.district}</div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
              <div><strong>Discharge:</strong> ${spring.averageDischarge} LPM</div>
              <div><strong>Elevation:</strong> ${spring.elevation}m MSL</div>
              <div><strong>Type:</strong> ${spring.springType}</div>
              <div><strong>Status:</strong> ${spring.status}</div>
            </div>
            <div style="margin-top: 6px; font-size: 11px; color: #475569;">
              <strong>Formation:</strong> ${spring.geologicalFormation}
            </div>
          </div>
        `;
        marker.bindPopup(popupContent);

        marker.on('click', () => {
          onSelectSpring(spring);
        });

        springsLayerRef.current?.addLayer(marker);
      });
    }

    // Render Delineated Polygon for Selected Spring
    if (visibleLayers.rechargeZones && selectedSpring) {
      const coords = selectedSpring.delineatedPolygon.coordinates[0];
      const latLngs: [number, number][] = coords.map(c => [c[1], c[0]]);

      const polygon = L.polygon(latLngs, {
        color: '#06b6d4',
        weight: 2,
        dashArray: '5, 5',
        fillColor: '#06b6d4',
        fillOpacity: 0.22
      });

      polygon.bindTooltip(`
        <strong>Probable Recharge Zone</strong><br/>
        Area: ${selectedSpring.rechargeAreaHa} ha<br/>
        Method: ${selectedSpring.delineationMethod.replace('_', ' ')}<br/>
        Confidence: ${selectedSpring.confidence}
      `, { sticky: true });

      polygonLayerRef.current?.addLayer(polygon);
    }
  }, [springs, selectedSpring, visibleLayers.springs, visibleLayers.rechargeZones, onSelectSpring]);

  // Render Suggested Interventions
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !interventionsLayerRef.current) return;

    interventionsLayerRef.current.clearLayers();
    if (!visibleLayers.interventions || !selectedSpring || !interventions.length) return;

    interventions.forEach(rec => {
      rec.suggestedCoordinates.forEach(pt => {
        const marker = L.circleMarker([pt.lat, pt.lng], {
          radius: 6,
          color: '#ffffff',
          weight: 1.5,
          fillColor: '#8b5cf6', // purple
          fillOpacity: 0.95
        });

        marker.bindTooltip(`
          <strong>${rec.type}</strong><br/>
          Elev: ${pt.elevation}m<br/>
          ${pt.rationale}
        `, { direction: 'top' });

        interventionsLayerRef.current?.addLayer(marker);
      });
    });
  }, [interventions, selectedSpring, visibleLayers.interventions]);

  // Pan to selected spring when selected
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedSpring) return;

    map.flyTo([selectedSpring.latitude, selectedSpring.longitude], 14, {
      duration: 1.2
    });
  }, [selectedSpring]);

  const fitAllBounds = () => {
    const map = mapInstanceRef.current;
    if (!map || !springs.length) return;
    const group = L.featureGroup(springs.map(s => L.marker([s.latitude, s.longitude])));
    map.fitBounds(group.getBounds().pad(0.2));
  };

  return (
    <div className="relative w-full h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0 cursor-crosshair" />

      {/* Top Floating GIS Controls Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        {/* Basemap Switcher */}
        <div className="flex items-center bg-slate-900/90 backdrop-blur border border-slate-800 rounded p-1 text-xs">
          <button
            onClick={() => setActiveBasemap('dark')}
            className={`px-2.5 py-1 rounded transition-colors ${activeBasemap === 'dark' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'}`}
          >
            Dark Carto
          </button>
          <button
            onClick={() => setActiveBasemap('topo')}
            className={`px-2.5 py-1 rounded transition-colors ${activeBasemap === 'topo' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'}`}
          >
            Topographic
          </button>
          <button
            onClick={() => setActiveBasemap('satellite')}
            className={`px-2.5 py-1 rounded transition-colors ${activeBasemap === 'satellite' ? 'bg-cyan-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'}`}
          >
            Satellite DEM
          </button>
        </div>

        {/* Layer Manager Toggle */}
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur border text-xs rounded transition-colors ${showLayerPanel ? 'border-cyan-400 text-cyan-400' : 'border-slate-800 text-slate-300 hover:text-white'}`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
        </button>

        {/* Measure Tool */}
        <button
          onClick={() => {
            const nextMode = !measuringMode;
            setMeasuringMode(nextMode);
            if (!nextMode) resetMeasureTool();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 backdrop-blur border text-xs rounded transition-colors ${measuringMode ? 'border-amber-400 text-amber-400 font-semibold' : 'border-slate-800 text-slate-300 hover:text-white'}`}
        >
          <Ruler className="w-3.5 h-3.5" />
          <span>{measuringMode ? 'Measuring...' : 'Measure'}</span>
        </button>

        {/* Fit Bounds */}
        <button
          onClick={fitAllBounds}
          title="Zoom to Fit All Springs"
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900/90 backdrop-blur border border-slate-800 text-slate-300 hover:text-white text-xs rounded transition-colors"
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Fit Extent</span>
        </button>
      </div>

      {/* Layer Control Dropdown Panel */}
      {showLayerPanel && (
        <div className="absolute top-16 left-4 z-20 w-64 bg-slate-900/95 backdrop-blur border border-slate-800 rounded p-3 text-xs text-slate-200 shadow-xl">
          <div className="font-semibold text-slate-100 mb-2 border-b border-slate-800 pb-1 flex items-center justify-between">
            <span>GIS Vector Layers</span>
            <span className="text-[10px] text-slate-500 font-mono">EPSG:4326</span>
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                Spring Locations ({springs.length})
              </span>
              <input
                type="checkbox"
                checked={visibleLayers.springs}
                onChange={e => setVisibleLayers({ ...visibleLayers, springs: e.target.checked })}
                className="rounded accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-cyan-400/40 border border-cyan-400 inline-block" />
                Probable Recharge Zones
              </span>
              <input
                type="checkbox"
                checked={visibleLayers.rechargeZones}
                onChange={e => setVisibleLayers({ ...visibleLayers, rechargeZones: e.target.checked })}
                className="rounded accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-3 h-0.5 bg-red-500 inline-block border-t border-dashed border-red-500" />
                Structural Faults & Lineaments
              </span>
              <input
                type="checkbox"
                checked={visibleLayers.lineaments}
                onChange={e => setVisibleLayers({ ...visibleLayers, lineaments: e.target.checked })}
                className="rounded accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-3 h-1 bg-sky-400 inline-block" />
                Drainage Channels (D8)
              </span>
              <input
                type="checkbox"
                checked={visibleLayers.streams}
                onChange={e => setVisibleLayers({ ...visibleLayers, streams: e.target.checked })}
                className="rounded accent-cyan-400"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
                Suggested Interventions
              </span>
              <input
                type="checkbox"
                checked={visibleLayers.interventions}
                onChange={e => setVisibleLayers({ ...visibleLayers, interventions: e.target.checked })}
                className="rounded accent-cyan-400"
              />
            </label>
          </div>
        </div>
      )}

      {/* Measurement HUD banner */}
      {measuringMode && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-amber-500/90 text-slate-950 px-4 py-1.5 rounded font-medium text-xs shadow-lg flex items-center gap-3">
          <span>Click on map to measure geodetic distance</span>
          {measuredDistanceM !== null && (
            <span className="font-mono font-bold bg-slate-950 text-amber-400 px-2 py-0.5 rounded">
              {measuredDistanceM >= 1000 ? `${(measuredDistanceM / 1000).toFixed(2)} km` : `${measuredDistanceM} m`}
            </span>
          )}
          <button
            onClick={resetMeasureTool}
            className="text-xs underline font-bold hover:text-white"
          >
            Clear
          </button>
        </div>
      )}

      {/* Bottom Telemetry HUD */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 bg-slate-900/90 backdrop-blur border border-slate-800 rounded px-3 py-1.5 text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-1.5">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>CRS: <span className="text-slate-200">WGS84 (EPSG:4326)</span></span>
        </div>
        {cursorCoords && (
          <div className="hidden sm:flex items-center gap-3 border-l border-slate-800 pl-3">
            <span>LAT: <span className="text-slate-200">{cursorCoords.lat}°</span></span>
            <span>LNG: <span className="text-slate-200">{cursorCoords.lng}°</span></span>
          </div>
        )}
        {selectedSpring && (
          <div className="hidden md:flex items-center gap-1.5 border-l border-slate-800 pl-3">
            <span>Selected: <span className="text-cyan-400 font-semibold">{selectedSpring.name}</span> ({selectedSpring.averageDischarge} LPM)</span>
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-16 z-10 hidden sm:flex items-center gap-3 bg-slate-900/90 backdrop-blur border border-slate-800 rounded px-3 py-1 text-[11px] text-slate-300">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Active</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" /> Drying</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400" /> Critical</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Revived</span>
        <span className="flex items-center gap-1 border-l border-slate-800 pl-2">
          <span className="w-3 h-2 border border-cyan-400 bg-cyan-400/30" /> Springshed
        </span>
      </div>
    </div>
  );
};
