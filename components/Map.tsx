import React, { useEffect, useMemo, useState, useRef } from 'react';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import { Country, Alliance } from '../types';

interface MapProps {
  countries: Country[];
  alliances: Alliance[];
  selectedCountryId: string | null;
  onSelectCountry: (id: string) => void;
  commandSources: Country[]; 
  commandTarget: Country | null;
  viewMode: 'political' | 'alliances';
  commandAction?: string; // Nouvelle prop pour savoir quelle action est en cours
}

// Palette excluding Blue (#0ea5e9, etc) and Green (#22c55e, etc)
// Using warm and neutral pastel tones for the political map style.
const MAP_PALETTE = [
  "#e2e8f0", // Slate 200
  "#fecaca", // Red 200
  "#fed7aa", // Orange 200
  "#fde68a", // Amber 200
  "#e9d5ff", // Purple 200
  "#f5d0fe", // Fuchsia 200
  "#fbcfe8", // Pink 200
  "#fecdd3", // Rose 200
  "#d6d3d1", // Stone 300
];

const MAJOR_POWERS = [
  "United States of America", 
  "Russia", 
  "China", 
  "Brazil", 
  "India"
];

// Manual overrides for label positions [Longitude, Latitude]
// Fixes centroid issues (e.g. USA pulling towards Alaska, France towards Guiana)
const LABEL_OVERRIDES: { [key: string]: [number, number] } = {
  "United States of America": [-98, 39], // Center of mainland US
  "France": [2.5, 46.5], // Metropolitan France
  "Norway": [9, 61], 
  "Portugal": [-8, 39.5],
  "Canada": [-106, 56], // Centered better visually
};

const getStableColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % MAP_PALETTE.length;
  return MAP_PALETTE[index];
};

const Map: React.FC<MapProps> = ({ 
  countries,
  alliances,
  selectedCountryId, 
  onSelectCountry, 
  commandSources, 
  commandTarget,
  viewMode,
  commandAction
}) => {
  const [geoData, setGeoData] = useState<any>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  useEffect(() => {
    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(response => response.json())
      .then(topology => {
        const geojson = topojson.feature(topology, topology.objects.countries);
        setGeoData(geojson);
      })
      .catch(err => console.error("Failed to load map data", err));
  }, []);

  const width = 800;
  const height = 450;

  const projection = useMemo(() => {
    return d3.geoMercator()
      .scale(130)
      .translate([width / 2, height / 1.5]);
  }, []);

  const pathGenerator = useMemo(() => {
    return d3.geoPath().projection(projection);
  }, [projection]);

  // Zoom behavior
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 80]) 
      .translateExtent([[0, 0], [width, height]])
      .on('zoom', (event) => {
        const { k, x, y } = event.transform;
        
        // 1. Transform Group
        d3.select(gRef.current).attr('transform', `translate(${x},${y}) scale(${k})`);

        // 2. Update CSS Variables for Labels (Performance Optimization)
        // Scale font size inversely to zoom to keep visual size constant (~10px)
        const fontSize = Math.max(0.5, 12 / k);

        // Visibility Logic
        // Major Powers: Always visible
        // Others: Visible only when zoomed in (k > 4.5)
        const minorOpacity = k > 4.5 ? 1 : 0;
        const majorOpacity = 1;

        if (gRef.current) {
            gRef.current.style.setProperty('--label-size', `${fontSize}px`);
            gRef.current.style.setProperty('--label-opacity-minor', String(minorOpacity));
            gRef.current.style.setProperty('--label-opacity-major', String(majorOpacity));
        }
      });

    d3.select(svgRef.current).call(zoom);
  }, [geoData]); 

  const getCountryColor = (countryName: string, isSelected: boolean) => {
    const countryData = countries.find(c => c.name === countryName);
    
    // Command Overrides
    if (commandSources.some(c => c.name === countryName)) return "#22c55e"; // Green-500
    if (commandTarget?.name === countryName) return "#ef4444"; // Red-500
    if (isSelected) return "#0ea5e9"; // Sky-500

    // RÈGLE SPÉCIALE: Si on rejoint une alliance, on grise tout ce qui n'est pas un leader d'alliance
    if (commandAction === 'Rejoindre Alliance') {
        const isAllianceLeader = alliances.some(a => a.leaderId === countryData?.id);
        if (isAllianceLeader) {
             // Si c'est un leader, on le met en évidence (or/jaune)
             return "#f59e0b"; // Amber-500
        }
        // Sinon grisé
        return "#e2e8f0"; // Slate-200
    }

    if (countryData?.isDestroyed) {
        return "#334155"; // Slate-700 (Ash Gray/Dark)
    }

    // Determine the effective owner for coloring (Annexation logic)
    const ownerId = countryData?.ownerId || countryName;
    const ownerData = countries.find(c => c.name === ownerId);

    // 2. Alliance View Mode
    if (viewMode === 'alliances') {
        const allianceId = ownerData?.allianceId;
        if (allianceId) {
            const alliance = alliances.find(a => a.id === allianceId);
            return alliance ? alliance.color : "#94a3b8";
        }
        return "#cbd5e1"; // Slate-300 (Gray) for non-aligned
    }
    
    // 3. Political View Mode (Default)
    return getStableColor(ownerId);
  };

  const getCountryStroke = (countryName: string, isSelected: boolean) => {
    const countryData = countries.find(c => c.name === countryName);
    if (countryData?.isDestroyed && !isSelected) return "#1e293b"; // Darker border for destroyed

    if (commandSources.some(c => c.name === countryName)) return "#15803d"; 
    if (commandTarget?.name === countryName) return "#b91c1c"; 
    if (isSelected) return "#0284c7"; 
    
    if (viewMode === 'alliances') return "#ffffff"; // White borders in alliance mode for clarity

    return "#94a3b8"; 
  };

  if (!geoData) {
    return <div className="flex items-center justify-center h-full text-slate-500 animate-pulse font-tech">Chargement Cartographie...</div>;
  }

  return (
    <div className="w-full h-full relative overflow-hidden bg-sky-100 shadow-inner rounded-xl border border-slate-300">
      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`} 
        className="w-full h-full cursor-grab active:cursor-grabbing bg-sky-200"
        style={{ backgroundColor: '#bae6fd' }} 
      >
        <g 
            ref={gRef} 
            style={{ 
                '--label-size': '2px',
                '--label-opacity-minor': 0,
                '--label-opacity-major': 1
            } as React.CSSProperties}
        >
          {/* Map Paths */}
          {geoData.features.map((feature: any, i: number) => {
            const countryName = feature.properties.name;
            const countryData = countries.find(c => c.name === countryName);
            const ownerId = countryData?.ownerId || countryName;

            // Check if this specific feature's OWNER matches the selected global ID
            const isSelected = selectedCountryId === ownerId;
            
            // Interaction logic for Join Alliance mode
            const isInteractable = commandAction !== 'Rejoindre Alliance' || alliances.some(a => a.leaderId === countryData?.id);

            return (
              <g key={`region-${i}`} onClick={(e) => {
                e.stopPropagation();
                if (isInteractable) {
                    onSelectCountry(countryName);
                }
              }}>
                <path
                  d={pathGenerator(feature) || ""}
                  fill={getCountryColor(countryName, isSelected)}
                  stroke={getCountryStroke(countryName, isSelected)}
                  strokeWidth={isSelected || commandSources.some(c => c.name === countryName) ? 0.4 : 0.15}
                  vectorEffect="non-scaling-stroke" 
                  className={`transition-all duration-200 ${isInteractable ? 'hover:opacity-75 cursor-pointer' : 'opacity-50 cursor-default'}`}
                  style={{
                    fillOpacity: commandSources.some(c => c.name === countryName) ? 0.9 : 1,
                  }}
                />
              </g>
            );
          })}

          {/* Country Labels */}
          {geoData.features.map((feature: any, i: number) => {
              const countryName = feature.properties.name;
              const countryData = countries.find(c => c.name === countryName);
              
              let x = 0;
              let y = 0;

              // Check for manual override
              if (LABEL_OVERRIDES[countryName]) {
                  const projected = projection(LABEL_OVERRIDES[countryName]);
                  if (projected) {
                      [x, y] = projected;
                  }
              }

              // Fallback to centroid if no override or projection failed
              if (x === 0 && y === 0) {
                  const centroid = pathGenerator.centroid(feature);
                  if (!centroid || isNaN(centroid[0]) || isNaN(centroid[1])) return null;
                  [x, y] = centroid;
              }

              const isMajor = MAJOR_POWERS.includes(countryName);
              const isDestroyed = countryData?.isDestroyed;
              const ownerId = countryData?.ownerId;
              const isAnnexed = ownerId && ownerId !== countryName;
              const labelText = isAnnexed ? ownerId : countryName;

              return (
                <text
                    key={`label-${i}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    className="font-sans font-bold pointer-events-none select-none transition-opacity duration-300"
                    fill={isDestroyed ? "#94a3b8" : (isAnnexed ? "#475569" : "#334155")}
                    style={{
                        opacity: isMajor ? 'var(--label-opacity-major)' : 'var(--label-opacity-minor)',
                        fontSize: 'var(--label-size)',
                        textShadow: isDestroyed 
                            ? 'none' 
                            : '0px 0px 4px rgba(255,255,255,0.9), 0px 0px 1px rgba(255,255,255,1)',
                        fontWeight: isMajor ? 800 : 600,
                        textDecoration: isDestroyed ? 'line-through' : 'none'
                    }}
                >
                    {labelText}
                    {isDestroyed && " (DÉTRUIT)"}
                </text>
              );
          })}
        </g>
      </svg>
    </div>
  );
};

export default Map;