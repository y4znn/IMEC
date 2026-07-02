'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  MapPin,
  Clock,
  Layers,
  Activity,
  X,
  ChevronRight,
  ChevronLeft,
  Sun,
  Moon,
  BarChart3,
  Cpu
} from 'lucide-react';
import {
  SUBSEA_CABLES,
  DATA_CENTERS,
  DEMOGRAPHIC_POINTS
} from '@/data/imec-geo-constants';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// ── Types ──────────────────────────────────────────────────
interface ImecNode {
  id: string;
  name: string;
  type: 'port' | 'rail-hub' | 'dry-port';
  country: string;
  coordinates: [number, number];
  role: string;
  capacity: string;
  status: 'operational' | 'limited' | 'inactive';
  transitTimeFromIndia: string;
  economicImpact: string;
  description: string;
}

interface TourStep {
  title: string;
  center: [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
  description: string;
  highlightedNodes: string[];
}

// ── Node Definitions ────────────────────────────────────────
const IMEC_NODES: ImecNode[] = [
  {
    id: 'mundra',
    name: 'Mundra Port',
    type: 'port',
    country: 'India',
    coordinates: [69.7317, 22.8397],
    role: 'Primary departure port for East Corridor maritime segment',
    capacity: '150 Million Metric Tonnes / Year',
    status: 'operational',
    transitTimeFromIndia: 'Day 0 (Origin)',
    economicImpact: 'Directly supports $35B+ in Indian export trade; key manufacturing corridor link.',
    description: 'Mundra is India\'s largest private commercial port, hosting deep-draft berths and high-speed cargo-handling equipment. It connects Northern and Western India\'s industrial heartlands directly to the Arabian Gulf.'
  },
  {
    id: 'kandla',
    name: 'Kandla Port',
    type: 'port',
    country: 'India',
    coordinates: [70.2147, 23.0031],
    role: 'Major dry bulk & petroleum handling terminal',
    capacity: '127 Million Metric Tonnes / Year',
    status: 'operational',
    transitTimeFromIndia: 'Day 0 (Origin)',
    economicImpact: 'Primary energy security hub for Northwest India; key fertilizer imports gateway.',
    description: 'Deendayal Port in Kandla is a vital public port in Gujarat, handling massive volumes of dry bulk cargo, chemicals, and petroleum. It represents the public sector anchor of IMEC\'s eastern maritime leg.'
  },
  {
    id: 'fujairah',
    name: 'Fujairah Port',
    type: 'port',
    country: 'UAE',
    coordinates: [56.3658, 25.1612],
    role: 'Strait of Hormuz bypass terminal and rail connector',
    capacity: '100 Million Metric Tonnes / Year',
    status: 'operational',
    transitTimeFromIndia: '3 Days (Sea)',
    economicImpact: 'Acts as a critical strategic route avoiding maritime chokepoints; major bunkering node.',
    description: 'Fujairah is a key port on the Gulf of Oman, allowing container and energy trade to bypass the volatile Strait of Hormuz. It marks the coastal entrance of the Etihad Rail freight network.'
  },
  {
    id: 'jebel_ali',
    name: 'Jebel Ali Port',
    type: 'port',
    country: 'UAE',
    coordinates: [55.0612, 25.0113],
    role: 'Primary sea-to-rail intermodal transshipment terminal',
    capacity: '22.4 Million TEU / Year',
    status: 'operational',
    transitTimeFromIndia: '3.5 Days (Sea)',
    economicImpact: 'Key logistics anchor for 8,000+ multinational firms in JAFZA; central Gulf trade hub.',
    description: 'Jebel Ali is the largest container port in the Middle East and one of the top 10 globally. In IMEC, it acts as the primary transfer hub where maritime container freight is loaded onto Etihad Rail.'
  },
  {
    id: 'riyadh',
    name: 'Riyadh Dry Port',
    type: 'dry-port',
    country: 'Saudi Arabia',
    coordinates: [46.7249, 24.6402],
    role: 'Central Arabian rail freight sorting and logistics node',
    capacity: '1.2 Million TEU / Year',
    status: 'limited',
    transitTimeFromIndia: '4.5 Days (Sea + Rail)',
    economicImpact: 'Cuts container customs clearance and transit times to Riyadh interior by 50%.',
    description: 'Riyadh Dry Port is Saudi Arabia\'s premier inland rail terminal, connected to the Dammam line and the North-South Rail. It consolidates cargo traveling across the interior Saudi desert segment.'
  },
  {
    id: 'al_haditha',
    name: 'Al Haditha Terminal',
    type: 'dry-port',
    country: 'Saudi Arabia',
    coordinates: [37.1597, 31.4553],
    role: 'Saudi-Jordanian border logistics and customs terminal',
    capacity: 'Freight yard capacity of 500,000 containers / Year',
    status: 'limited',
    transitTimeFromIndia: '5.5 Days (Sea + Rail)',
    economicImpact: 'Key border corridor hub; facilitates customs pre-clearance and multi-state rail gauge transit.',
    description: 'Al Haditha is the largest land border crossing in Saudi Arabia. Under IMEC, it represents the critical gateway linking the GCC network to Jordan, bypassing traditional road transport bottleneck zones.'
  },
  {
    id: 'haifa',
    name: 'Haifa Port',
    type: 'port',
    country: 'Israel',
    coordinates: [34.9892, 32.7940],
    role: 'Primary rail-to-sea Mediterranean transshipment gateway',
    capacity: '30 Million Tonnes / Year',
    status: 'inactive',
    transitTimeFromIndia: '6.5 Days (Sea + Rail)',
    economicImpact: 'Bypasses the Suez Canal entirely for Levant cargo, reducing transit costs to the Mediterranean.',
    description: 'Haifa Port is the leading gateway in Israel, operated by a consortium led by Adani Ports. In the IMEC pipeline, it receives overland rail cargo and loads it onto vessels heading to European shores.'
  },
  {
    id: 'piraeus',
    name: 'Piraeus Port',
    type: 'port',
    country: 'Greece',
    coordinates: [23.6371, 37.9475],
    role: 'Primary maritime gateway into Southeast & Central Europe',
    capacity: '7.2 Million TEU / Year',
    status: 'operational',
    transitTimeFromIndia: '8.5 Days (Sea + Rail + Sea)',
    economicImpact: 'Direct access to Balkan and European rail networks, reducing final delivery times by 3-4 days.',
    description: 'Piraeus Port in Athens is the primary entry point for IMEC cargo into Europe. From Piraeus, goods enter the European rail system for distribution into Central and Eastern European markets.'
  },
  {
    id: 'genoa',
    name: 'Genoa Port',
    type: 'port',
    country: 'Italy',
    coordinates: [8.9463, 44.4056],
    role: 'Southern European gateway for Italian & Swiss industrial hubs',
    capacity: '2.8 Million TEU / Year',
    status: 'operational',
    transitTimeFromIndia: '9.5 Days (Sea + Rail + Sea)',
    economicImpact: 'Bypasses Gibraltar shipping detours; connects directly to Northern Italy\'s manufacturing belt.',
    description: 'Genoa is Italy\'s leading maritime hub, offering a direct path through the Alps to Central European industrial zones, bypassing the longer sea routes around Western Europe.'
  },
  {
    id: 'marseille',
    name: 'Marseille Port',
    type: 'port',
    country: 'France',
    coordinates: [5.3698, 43.2965],
    role: 'Western European maritime terminal and digital subsea cable landing',
    capacity: '79 Million Tonnes / Year',
    status: 'operational',
    transitTimeFromIndia: '10 Days (Sea + Rail + Sea)',
    economicImpact: 'Connects Middle East cargo to Western European consumers; landing point of Blue-Raman subsea fiber.',
    description: 'Marseille is France\'s largest commercial port and a global digital hub. It serves as a major entry terminal for IMEC and the landing station for the Blue-Raman ultra-high-speed data pipeline.'
  }
];

// ── Guided Tour Steps ───────────────────────────────────────
const TOUR_STEPS: TourStep[] = [
  {
    title: '1. Corridor Overview',
    center: [38.0, 31.0],
    zoom: 3.5,
    pitch: 30,
    bearing: 0,
    description: 'The India-Middle East-Europe Economic Corridor (IMEC) is a multi-modal transit network designed to streamline trade, digital data, and clean energy pipeline transport across three continents.',
    highlightedNodes: []
  },
  {
    title: '2. Indian Terminals (Origin)',
    center: [69.9, 22.9],
    zoom: 5.5,
    pitch: 45,
    bearing: -10,
    description: 'IMEC begins at Mundra and Kandla ports in Gujarat, India. These deep-water ports serve as consolidation hubs for manufacturing exports originating from the Indian subcontinent.',
    highlightedNodes: ['mundra', 'kandla']
  },
  {
    title: '3. East Corridor Maritime Route',
    center: [62.5, 23.5],
    zoom: 4.8,
    pitch: 40,
    bearing: -20,
    description: 'Vessels transit the Arabian Sea from West India to the UAE. This maritime leg replaces overland routes and connects South Asian trade directly to the Arabian Peninsula in 3 days.',
    highlightedNodes: ['fujairah', 'jebel_ali']
  },
  {
    title: '4. Arabian Gulf Terminals',
    center: [55.5, 25.1],
    zoom: 6.8,
    pitch: 45,
    bearing: 15,
    description: 'Cargo is offloaded at Jebel Ali or Fujairah. Jebel Ali is the Middle East\'s largest container port, serving as the critical intermodal transshipment node where sea lanes meet the GCC railway.',
    highlightedNodes: ['fujairah', 'jebel_ali']
  },
  {
    title: '5. Arabian Peninsula Railway Segment',
    center: [47.0, 25.0],
    zoom: 5.0,
    pitch: 50,
    bearing: 25,
    description: 'The Northern Corridor utilizes a high-capacity railway. Running from Fujairah through Riyadh and across Saudi Arabia to Jordan and Israel, this 2,650km rail link bypasses maritime bottlenecks.',
    highlightedNodes: ['riyadh', 'al_haditha']
  },
  {
    title: '6. Levant Gateway (Haifa Port)',
    center: [34.9892, 32.7940],
    zoom: 8.0,
    pitch: 55,
    bearing: 30,
    description: 'OVERLAND ENDPOINT: Rail cargo reaches Haifa Port, Israel. This strategic Mediterranean port transfers freight back onto ships bound for European maritime gateways.',
    highlightedNodes: ['haifa']
  },
  {
    title: '7. Mediterranean Sea Lanes & European Terminals',
    center: [15.0, 40.0],
    zoom: 4.5,
    pitch: 40,
    bearing: -15,
    description: 'The final leg connects Haifa to European ports (Piraeus in Greece, Genoa in Italy, Marseille in France) via Mediterranean maritime routes, cutting overall India-to-Europe shipping times to just 10 days.',
    highlightedNodes: ['piraeus', 'genoa', 'marseille']
  }
];

export default function ImecMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // ── UI States ─────────────────────────────────────────────
  const [mapStyle, setMapStyle] = useState<'dark' | 'light'>('light');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedNode, setSelectedNode] = useState<ImecNode | null>(null);
  const [isSuezToggled, setIsSuezToggled] = useState<boolean>(false);
  const [isCablesToggled, setIsCablesToggled] = useState<boolean>(false);
  const [isDataCentersToggled, setIsDataCentersToggled] = useState<boolean>(false);
  const [isEconomicToggled, setIsEconomicToggled] = useState<boolean>(false);
  const [mapLoaded, setMapLoaded] = useState<boolean>(false);

  // ── Dash Array Sequences for Marching Ants ────────────────
  const dashArraySequence = [
    [3, 3],
    [0, 0.5, 3, 2.5],
    [0, 1.0, 3, 2.0],
    [0, 1.5, 3, 1.5],
    [0, 2.0, 3, 1.0],
    [0, 2.5, 3, 0.5],
    [0, 3.0, 3, 0]
  ];

  // ── Coordinates and Lines ─────────────────────────────────
  const eastMaritimeLanes = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [69.7317, 22.8397],
            [64.5, 21.0],
            [59.5, 22.0],
            [56.3658, 25.1612]
          ]
        },
        properties: { name: 'Mundra-Fujairah Sea Route' }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [70.2147, 23.0031],
            [65.0, 21.3],
            [60.0, 22.3],
            [56.8, 25.8],
            [55.0612, 25.0113]
          ]
        },
        properties: { name: 'Kandla-Jebel Ali Sea Route' }
      }
    ]
  };

  const railwayLine = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [56.3658, 25.1612],
            [55.0612, 25.0113],
            [54.3773, 24.4539],
            [49.0817, 24.1353],
            [46.7249, 24.6402],
            [37.1597, 31.4553],
            [35.9456, 31.9566],
            [34.9896, 32.7940]
          ]
        },
        properties: { name: 'GCC-Levant IMEC Railway Link' }
      }
    ]
  };

  const northMaritimeLanes = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [34.9892, 32.7940],
            [31.5, 33.8],
            [27.0, 35.0],
            [23.6371, 37.9475]
          ]
        },
        properties: { name: 'Haifa-Piraeus Sea Route' }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [34.9892, 32.7940],
            [30.5, 33.5],
            [24.0, 34.8],
            [19.0, 36.0],
            [14.0, 37.8],
            [9.8, 41.5],
            [8.9463, 44.4056]
          ]
        },
        properties: { name: 'Haifa-Genoa Sea Route' }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [34.9892, 32.7940],
            [30.5, 33.5],
            [24.0, 34.8],
            [19.0, 36.0],
            [12.0, 37.5],
            [7.0, 40.5],
            [5.3698, 43.2965]
          ]
        },
        properties: { name: 'Haifa-Marseille Sea Route' }
      }
    ]
  };

  const suezAlternativeRoute = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [69.7317, 22.8397],
            [65.0, 18.0],
            [58.0, 14.5],
            [47.5, 12.0],
            [43.25, 12.60],
            [39.5, 18.0],
            [35.0, 26.0],
            [32.32, 29.93],
            [30.0, 32.5],
            [20.0, 35.0],
            [12.0, 37.5],
            [5.3698, 43.2965]
          ]
        },
        properties: { name: 'Suez Canal Route (Competitor)' }
      }
    ]
  };

  const subseaCablesGeoJSON = {
    type: 'FeatureCollection',
    features: SUBSEA_CABLES.map(cable => ({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [cable.source, cable.target]
      },
      properties: {
        name: cable.name,
        status: cable.status,
        owner: cable.owner
      }
    }))
  };

  const dataCentersGeoJSON = {
    type: 'FeatureCollection',
    features: DATA_CENTERS.map(dc => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: dc.position
      },
      properties: {
        facility: dc.facility,
        city: dc.city,
        country: dc.country,
        entity: dc.entity
      }
    }))
  };

  const demographicGeoJSON = {
    type: 'FeatureCollection',
    features: DEMOGRAPHIC_POINTS.map(pt => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [pt[0], pt[1]]
      },
      properties: {
        weight: pt[2]
      }
    }))
  };

  // ── Setup Map & Layers ───────────────────────────────────
  const addMapLayersAndSources = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // ── Add Sources ──
    map.addSource('east-maritime', { type: 'geojson', data: eastMaritimeLanes as any });
    map.addSource('railway', { type: 'geojson', data: railwayLine as any });
    map.addSource('north-maritime', { type: 'geojson', data: northMaritimeLanes as any });
    map.addSource('suez-alternative', { type: 'geojson', data: suezAlternativeRoute as any });
    map.addSource('subsea-cables', { type: 'geojson', data: subseaCablesGeoJSON as any });
    map.addSource('data-centers', { type: 'geojson', data: dataCentersGeoJSON as any });
    map.addSource('demographics', { type: 'geojson', data: demographicGeoJSON as any });

    // ── Add Layers ──

    // 1. Economic / Demographic Heatmap Layer
    map.addLayer({
      id: 'demographics-heatmap',
      type: 'heatmap',
      source: 'demographics',
      layout: {
        visibility: isEconomicToggled ? 'visible' : 'none'
      },
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 6, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-value'],
          0, 'rgba(0,0,0,0)',
          0.2, 'rgba(70, 130, 180, 0.1)',
          0.5, 'rgba(70, 130, 180, 0.25)',
          0.8, 'rgba(217, 119, 6, 0.35)',
          1.0, 'rgba(185, 28, 28, 0.55)'
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 3, 9, 22],
        'heatmap-opacity': 0.65
      }
    });

    // 2. Suez Canal Layer (Crimson dotted)
    map.addLayer({
      id: 'suez-layer',
      type: 'line',
      source: 'suez-alternative',
      layout: {
        visibility: isSuezToggled ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#b91c1c',
        'line-width': 2,
        'line-dasharray': [3, 3]
      }
    });

    // 3. Subsea Cables Layer (Deep Teal)
    map.addLayer({
      id: 'cables-layer',
      type: 'line',
      source: 'subsea-cables',
      layout: {
        visibility: isCablesToggled ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#0f766e',
        'line-width': 2,
        'line-opacity': 0.75
      }
    });

    // 4. Data Centers Point Layer (Charcoal/Slate)
    map.addLayer({
      id: 'datacenters-layer',
      type: 'circle',
      source: 'data-centers',
      layout: {
        visibility: isDataCentersToggled ? 'visible' : 'none'
      },
      paint: {
        'circle-radius': 5.5,
        'circle-color': '#475569',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.9
      }
    });

    // 5. East Corridor Maritime (Navy Flowing)
    map.addLayer({
      id: 'east-maritime-layer',
      type: 'line',
      source: 'east-maritime',
      paint: {
        'line-color': '#1e3a8a',
        'line-width': 3.5,
        'line-dasharray': [3, 3]
      }
    });

    // 6. North Corridor Maritime (Navy Flowing)
    map.addLayer({
      id: 'north-maritime-layer',
      type: 'line',
      source: 'north-maritime',
      paint: {
        'line-color': '#1e3a8a',
        'line-width': 3.5,
        'line-dasharray': [3, 3]
      }
    });

    // 7. Rail Base (Dark Slate outline)
    map.addLayer({
      id: 'rail-base-layer',
      type: 'line',
      source: 'railway',
      paint: {
        'line-color': '#334155',
        'line-width': 5.5
      }
    });

    // 8. Rail Inner (Terracotta track)
    map.addLayer({
      id: 'rail-inner-layer',
      type: 'line',
      source: 'railway',
      paint: {
        'line-color': '#c2410c',
        'line-width': 2.5,
        'line-dasharray': [3, 3]
      }
    });

    // ── Popups ──
    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'imec-custom-popup'
    });

    map.on('mouseenter', 'datacenters-layer', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const features = map.queryRenderedFeatures(e.point, { layers: ['datacenters-layer'] });
      if (!features.length) return;

      const feat = features[0];
      const props = feat.properties || {};
      const coords = (feat.geometry as any).coordinates;

      popup
        .setLngLat(coords)
        .setHTML(`
          <div class="font-mono text-[9px] text-cyan-400 font-bold uppercase tracking-wider mb-1">
            Data Hub Facility
          </div>
          <div class="font-sans font-bold text-xs text-white mb-0.5">${props.facility || ''}</div>
          <div class="font-sans text-[11px] text-gray-300 mb-1">${props.city || ''}, ${props.country || ''}</div>
          <div class="border-t border-white/10 pt-1 text-[8px] text-gray-400 uppercase tracking-widest font-mono">
            Provider: ${props.entity || ''}
          </div>
        `)
        .addTo(map);
    });

    map.on('mouseleave', 'datacenters-layer', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });

    map.on('mouseenter', 'cables-layer', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const features = map.queryRenderedFeatures(e.point, { layers: ['cables-layer'] });
      if (!features.length) return;

      const feat = features[0];
      const props = feat.properties || {};

      popup
        .setLngLat(e.lngLat)
        .setHTML(`
          <div class="font-mono text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-1">
            Subsea Fiber Cable
          </div>
          <div class="font-sans font-bold text-xs text-white mb-0.5">${props.name}</div>
          <div class="font-sans text-[11px] text-gray-300 mb-1">Status: <span class="${props.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'} font-bold">${props.status}</span></div>
          <div class="border-t border-white/10 pt-1 text-[8px] text-gray-400 uppercase tracking-widest font-mono">
            Consortium: ${props.owner}
          </div>
        `)
        .addTo(map);
    });

    map.on('mouseleave', 'cables-layer', () => {
      map.getCanvas().style.cursor = '';
      popup.remove();
    });

  }, [isSuezToggled, isCablesToggled, isDataCentersToggled, isEconomicToggled]);

  // ── Render Custom Markers ──
  const updateMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    IMEC_NODES.forEach(node => {
      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer group';
      
      const ringColor = 
        node.status === 'operational' ? 'border-emerald-600 bg-emerald-600/5' :
        node.status === 'limited' ? 'border-amber-600 bg-amber-600/5' :
        'border-gray-400 bg-gray-400/5';

      const dotColor = 
        node.status === 'operational' ? 'bg-emerald-700' :
        node.status === 'limited' ? 'bg-amber-700' :
        'bg-gray-500';

      const isStepHighlighted = TOUR_STEPS[currentStep].highlightedNodes.includes(node.id);
      const isSelected = selectedNode?.id === node.id;
      
      el.innerHTML = `
        <div class="absolute w-7 h-7 border rounded-full ${ringColor} ${isStepHighlighted || isSelected ? 'animate-ping' : 'opacity-40 group-hover:animate-ping'} duration-1000"></div>
        <div class="relative w-3.5 h-3.5 border border-gray-300 rounded-full ${dotColor} shadow-sm flex items-center justify-center transition-all ${isSelected ? 'scale-125 ring-2 ring-gray-400/50' : 'group-hover:scale-110'}">
          <div class="w-1 h-1 bg-white rounded-full"></div>
        </div>
        <div class="absolute bottom-full mb-2 bg-white text-gray-950 font-mono text-[9px] font-bold tracking-widest uppercase border border-gray-300 px-2 py-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-sm">
          ${node.name}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedNode(node);
        map.flyTo({
          center: node.coordinates,
          zoom: 7.5,
          pitch: 50,
          speed: 1.2
        });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(node.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [currentStep, selectedNode]);

  // ── Effect: Initialize Mapbox ──
  useEffect(() => {
    if (mapRef.current) return;

    const styleUrl = mapStyle === 'dark' 
      ? 'mapbox://styles/mapbox/navigation-night-v1' 
      : 'mapbox://styles/mapbox/light-v11';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: styleUrl,
      center: TOUR_STEPS[0].center,
      zoom: TOUR_STEPS[0].zoom,
      pitch: TOUR_STEPS[0].pitch,
      bearing: TOUR_STEPS[0].bearing,
      antialias: true
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'bottom-right');

    map.on('load', () => {
      setMapLoaded(true);
      addMapLayersAndSources();
      updateMarkers();

      // Start flow animation
      let step = 0;
      let lastUpdate = 0;
      const animate = (timestamp: number) => {
        if (!mapRef.current) return;

        if (timestamp - lastUpdate > 65) {
          lastUpdate = timestamp;
          step = (step + 1) % dashArraySequence.length;
          const currentDash = dashArraySequence[step];

          if (mapRef.current.getLayer('east-maritime-layer')) {
            mapRef.current.setPaintProperty('east-maritime-layer', 'line-dasharray', currentDash);
          }
          if (mapRef.current.getLayer('north-maritime-layer')) {
            mapRef.current.setPaintProperty('north-maritime-layer', 'line-dasharray', currentDash);
          }
          if (mapRef.current.getLayer('suez-layer')) {
            mapRef.current.setPaintProperty('suez-layer', 'line-dasharray', currentDash);
          }
          
          const offsetShift = step % 2 === 0 ? [3, 3] : [0, 1.5, 3, 1.5];
          if (mapRef.current.getLayer('rail-inner-layer')) {
            mapRef.current.setPaintProperty('rail-inner-layer', 'line-dasharray', offsetShift);
          }
        }
        animationFrameIdRef.current = requestAnimationFrame(animate);
      };

      animationFrameIdRef.current = requestAnimationFrame(animate);
    });

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      markersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Effect: Handle style changes and visibility updates ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const targetStyle = mapStyle === 'dark' 
      ? 'mapbox://styles/mapbox/navigation-night-v1' 
      : 'mapbox://styles/mapbox/light-v11';

    const currentStyle = map.getStyle();
    if (currentStyle && currentStyle.sprite !== targetStyle) {
      map.setStyle(targetStyle);
      map.once('style.load', () => {
        addMapLayersAndSources();
        updateMarkers();
      });
      return;
    }

    if (map.getLayer('suez-layer')) {
      map.setLayoutProperty('suez-layer', 'visibility', isSuezToggled ? 'visible' : 'none');
    }
    if (map.getLayer('cables-layer')) {
      map.setLayoutProperty('cables-layer', 'visibility', isCablesToggled ? 'visible' : 'none');
    }
    if (map.getLayer('datacenters-layer')) {
      map.setLayoutProperty('datacenters-layer', 'visibility', isDataCentersToggled ? 'visible' : 'none');
    }
    if (map.getLayer('demographics-heatmap')) {
      map.setLayoutProperty('demographics-heatmap', 'visibility', isEconomicToggled ? 'visible' : 'none');
    }
  }, [mapStyle, isSuezToggled, isCablesToggled, isDataCentersToggled, isEconomicToggled, mapLoaded, addMapLayersAndSources, updateMarkers]);

  // Sync markers
  useEffect(() => {
    updateMarkers();
  }, [currentStep, selectedNode, updateMarkers]);

  // Tour navigation
  const handleTourStep = (index: number) => {
    const map = mapRef.current;
    if (!map) return;

    const targetIndex = Math.max(0, Math.min(TOUR_STEPS.length - 1, index));
    setCurrentStep(targetIndex);
    setSelectedNode(null);

    const step = TOUR_STEPS[targetIndex];
    map.flyTo({
      center: step.center,
      zoom: step.zoom,
      pitch: step.pitch,
      bearing: step.bearing,
      speed: 1.0,
      curve: 1.2
    });
  };

  return (
    <div className="w-full h-full relative font-sans">
      <div ref={mapContainerRef} className="w-full h-full absolute inset-0" />

      {/* Floating Story HUD */}
      <div className="absolute top-16 bottom-4 left-4 z-[400] w-[350px] max-w-[calc(100vw-2rem)] flex flex-col pointer-events-none">
        <div className="flex flex-col gap-3 max-h-full pointer-events-auto overflow-y-auto brutalist-scrollbar bg-white/95 border border-gray-300 p-5 text-gray-900 shadow-md relative">
          
          <div className="border-b border-gray-200 pb-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-500 font-mono tracking-[0.25em] uppercase font-bold flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-gray-400 animate-spin" style={{ animationDuration: '8s' }} />
                IMEC Intelligence HUD
              </span>
              <button 
                onClick={() => setMapStyle(prev => prev === 'dark' ? 'light' : 'dark')}
                className="p-1 hover:bg-gray-100 rounded transition-all border border-gray-200 text-gray-500 hover:text-gray-900"
                title="Toggle Base Map"
              >
                {mapStyle === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
              </button>
            </div>
            <h2 className="font-sans font-bold text-base tracking-tight mt-1.5 text-gray-900 uppercase">
              Interactive Terminal
            </h2>
          </div>

          {/* Guided Tour */}
          <div className="bg-gray-50 border border-gray-200 p-3.5">
            <h3 className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-1.5 flex justify-between items-center">
              <span>Guided Geoeconomic Tour</span>
              <span className="text-gray-700 font-bold">{currentStep + 1}/{TOUR_STEPS.length}</span>
            </h3>
            <h4 className="font-sans font-bold text-sm text-gray-900 mb-2 uppercase tracking-tight">
              {TOUR_STEPS[currentStep].title}
            </h4>
            <p className="font-serif text-[12px] text-gray-600 leading-relaxed mb-4">
              {TOUR_STEPS[currentStep].description}
            </p>
            
            <div className="flex items-center justify-between gap-2 border-t border-gray-200/60 pt-3">
              <button
                onClick={() => handleTourStep(currentStep - 1)}
                disabled={currentStep === 0}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:pointer-events-none transition-all font-mono text-[9px] uppercase tracking-wider"
              >
                <ChevronLeft size={14} /> Back
              </button>
              <button
                onClick={() => handleTourStep(currentStep + 1)}
                disabled={currentStep === TOUR_STEPS.length - 1}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-gray-900 border border-gray-800 text-white hover:bg-black disabled:opacity-30 disabled:pointer-events-none transition-all font-mono text-[9px] uppercase tracking-wider"
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Layer Control */}
          <div className="bg-gray-50 border border-gray-200 p-3.5">
            <h3 className="font-mono text-[9px] text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-gray-400" />
              Intelligence Layer Overlays
            </h3>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setIsSuezToggled(prev => !prev)}
                className={`flex items-center justify-between p-2 border text-left transition-all ${
                  isSuezToggled 
                    ? 'bg-red-50 border-red-200 text-red-800' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider">Suez Canal Alternative</span>
                <span className={`w-2 h-2 rounded-full ${isSuezToggled ? 'bg-red-700 shadow-sm' : 'bg-gray-200'}`} />
              </button>

              <button
                onClick={() => setIsCablesToggled(prev => !prev)}
                className={`flex items-center justify-between p-2 border text-left transition-all ${
                  isCablesToggled 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider">Blue-Raman Fiber Cables</span>
                <span className={`w-2 h-2 rounded-full ${isCablesToggled ? 'bg-emerald-700 shadow-sm' : 'bg-gray-200'}`} />
              </button>

              <button
                onClick={() => setIsDataCentersToggled(prev => !prev)}
                className={`flex items-center justify-between p-2 border text-left transition-all ${
                  isDataCentersToggled 
                    ? 'bg-sky-50 border-sky-200 text-sky-800' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider">Cloud Data Centers</span>
                <span className={`w-2 h-2 rounded-full ${isDataCentersToggled ? 'bg-sky-600 shadow-sm' : 'bg-gray-200'}`} />
              </button>

              <button
                onClick={() => setIsEconomicToggled(prev => !prev)}
                className={`flex items-center justify-between p-2 border text-left transition-all ${
                  isEconomicToggled 
                    ? 'bg-amber-50 border-amber-200 text-amber-800' 
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-mono text-[10px] uppercase tracking-wider">Economic Density Heatmap</span>
                <span className={`w-2 h-2 rounded-full ${isEconomicToggled ? 'bg-amber-700 shadow-sm' : 'bg-gray-200'}`} />
              </button>
            </div>
          </div>

          {/* Suez Comparison Stats */}
          <AnimatePresence>
            {isSuezToggled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-red-50/50 border border-red-200 p-3.5"
              >
                <h3 className="font-mono text-[9px] text-red-800 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" />
                  Suez Canal vs. IMEC Transit Metrics
                </h3>
                <div className="flex flex-col gap-3 font-mono text-[10px]">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Transit Duration (Days)</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div>
                        <div className="flex justify-between text-[9px] text-red-800">
                          <span>SUEZ ROUTE</span>
                          <span>18 Days</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 border border-gray-200">
                          <div className="h-full bg-red-700" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] text-blue-800">
                          <span>IMEC CORRIDOR</span>
                          <span>10 Days (-44%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 border border-gray-200">
                          <div className="h-full bg-blue-700" style={{ width: '55.5%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center border-t border-gray-200 pt-2 mt-1">
                    <div className="bg-white p-2 border border-gray-200">
                      <div className="text-[8px] text-gray-400 uppercase">Suez Route</div>
                      <div className="text-[11px] font-bold text-red-700 mt-0.5">12,000 KM</div>
                      <div className="text-[8px] text-red-600 mt-0.5">100% Maritime</div>
                      <div className="text-[8px] text-gray-400 mt-1">Red Sea Risks</div>
                    </div>
                    <div className="bg-white p-2 border border-gray-200">
                      <div className="text-[8px] text-gray-400 uppercase">IMEC Pipeline</div>
                      <div className="text-[11px] font-bold text-blue-700 mt-0.5">6,800 KM</div>
                      <div className="text-[8px] text-blue-600 mt-0.5">Sea + Rail Hybrid</div>
                      <div className="text-[8px] text-gray-400 mt-1">Bypasses Suez</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Infrastructure Cable Notes */}
          <AnimatePresence>
            {isCablesToggled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-50/50 border border-emerald-200 p-3 font-mono text-[9px] text-gray-700 flex flex-col gap-1.5"
              >
                <span className="text-[9px] font-bold text-emerald-800 uppercase tracking-widest flex items-center gap-1">
                  <Cpu size={12} /> Digital Corridor Alignments
                </span>
                <p className="font-serif leading-relaxed text-[11px] text-gray-600 mt-0.5">
                  The IMEC agenda parallels the layout of high-speed transcontinental cables like Blue-Raman, routing digital capacity alongside container logistics.
                </p>
                <div className="flex flex-col gap-1 mt-1 border-t border-emerald-200/60 pt-1.5">
                  <div className="flex justify-between">
                    <span>BLUE SYSTEM (Europe-Levant):</span>
                    <span className="text-emerald-700 font-bold">Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RAMAN SYSTEM (Levant-India):</span>
                    <span className="text-amber-700 font-bold">Under Dev</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Node Inspector Overlay */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-16 bottom-4 right-4 z-[400] w-[360px] max-w-[calc(100vw-2rem)] bg-white/95 border border-gray-300 p-5 text-gray-900 shadow-md flex flex-col overflow-y-auto brutalist-scrollbar"
          >
            <div className="flex items-start justify-between border-b border-gray-200 pb-3 mb-4">
              <div>
                <span className="text-[9px] text-gray-500 font-mono tracking-widest uppercase font-bold flex items-center gap-1">
                  <MapPin size={11} />
                  Terminal Node Inspector
                </span>
                <h2 className="font-sans font-bold text-base mt-1.5 text-gray-900 uppercase tracking-tight">
                  {selectedNode.name}
                </h2>
                <span className="font-mono text-[9px] text-gray-400 uppercase tracking-widest">
                  {selectedNode.country}
                </span>
              </div>
              <button
                onClick={() => setSelectedNode(null)}
                className="p-1 hover:bg-gray-100 rounded transition-all text-gray-500 hover:text-gray-900"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <span className="text-gray-500">CORRIDOR STATUS</span>
                <span className={`px-2 py-0.5 font-bold uppercase tracking-wider ${
                  selectedNode.status === 'operational' ? 'bg-emerald-50 border border-emerald-300 text-emerald-700' :
                  selectedNode.status === 'limited' ? 'bg-amber-50 border border-amber-300 text-amber-700' :
                  'bg-gray-100 border border-gray-300 text-gray-600'
                }`}>
                  {selectedNode.status}
                </span>
              </div>

              <div>
                <h4 className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-1">Functional Outline</h4>
                <p className="font-serif text-[12px] text-gray-700 leading-relaxed">
                  {selectedNode.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="bg-gray-50 border border-gray-200 p-2.5 font-mono">
                  <div className="text-[8px] text-gray-400 uppercase">Transit Timeline</div>
                  <div className="text-[11px] font-bold text-blue-800 mt-1 flex items-center gap-1">
                    <Clock size={11} /> {selectedNode.transitTimeFromIndia}
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 p-2.5 font-mono">
                  <div className="text-[8px] text-gray-400 uppercase">Capacity / Volume</div>
                  <div className="text-[11px] font-bold text-gray-900 mt-1">
                    {selectedNode.capacity}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 flex flex-col gap-3 font-mono text-[10px]">
                <div>
                  <span className="text-gray-400 uppercase text-[8px] block mb-0.5">Corridor Segment Role</span>
                  <span className="text-gray-800">{selectedNode.role}</span>
                </div>
                <div>
                  <span className="text-gray-400 uppercase text-[8px] block mb-0.5">Geoeconomic & Regional Impact</span>
                  <span className="text-gray-700 font-serif leading-relaxed text-[11px] block mt-0.5">{selectedNode.economicImpact}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (mapRef.current) {
                    mapRef.current.flyTo({
                      center: selectedNode.coordinates,
                      zoom: 8.5,
                      pitch: 60,
                      speed: 1.0
                    });
                  }
                }}
                className="mt-2 w-full py-2 bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all font-mono text-[9px] uppercase tracking-widest text-center text-gray-700 hover:text-gray-900 shadow-sm"
              >
                Focus Coordinates
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Bar */}
      <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-2 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md border border-gray-300 px-3 py-1.5 flex items-center gap-2 font-mono text-[9px] text-gray-500 uppercase tracking-widest shadow-sm pointer-events-auto">
          <Activity size={10} className="text-emerald-600" />
          <span>Engine: WebGL v2</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span className="text-gray-900 font-bold">Active</span>
        </div>
      </div>
    </div>
  );
}
