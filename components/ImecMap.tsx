'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  Cpu,
  Zap,
  Shield,
  Anchor,
  Globe,
  Database,
  Search,
  Users,
  Menu,
  ActivitySquare
} from 'lucide-react';

// Set Mapbox token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

// ── Data Schemas ───────────────────────────────────────────

interface PortAsset {
  id: string;
  name: string;
  country: string;
  coordinates: [number, number];
  unLocode: string;
  teu: number;
  capacityText: string;
  draft: string;
  turnaround: string;
  ownership: string;
  congestion: 'Low' | 'Moderate' | 'High';
  vesselsTracked: number;
  status: 'Active' | 'Under Expansion' | 'Inactive';
  headlines: string[];
}

interface RailwayAsset {
  id: string;
  name: string;
  status: 'Built' | 'Proposed';
  length: string;
  gauge: string;
  provisions: string;
  country: string;
  coordinates: [number, number][];
  headlines: string[];
}

interface DataCenterAsset {
  id: string;
  name: string;
  city: string;
  country: string;
  coordinates: [number, number];
  operator: string;
  serversCount: string;
  tier: string;
  securityRating: string;
}

interface CableAsset {
  id: string;
  name: string;
  landingPoints: string[];
  status: 'Active' | 'Under Development';
  owners: string;
  suppliers: string;
  securityRating: string;
  coordinates: [number, number][];
}

interface EnergyAsset {
  id: string;
  name: string;
  type: 'Pipeline' | 'HVDC Interconnector';
  product: string;
  capacity: string;
  status: string;
  route: string;
  promoters: string;
  coordinates: [number, number][];
}

interface AgreementAsset {
  id: string;
  name: string;
  type: 'FTA' | 'Defense';
  signedYear: string;
  status: string;
  members: string[];
  provisions: string;
  benefits: string;
  developments: string[];
  coordinates: [number, number][][][]; // Multipolygons for shading
}

// ── Static Database ────────────────────────────────────────

const PORTS_DATABASE: PortAsset[] = [
  {
    id: 'jnpt',
    name: 'Jawaharlal Nehru Port (JNPT)',
    country: 'India',
    coordinates: [72.946, 18.948],
    unLocode: 'INNSA',
    teu: 10.0,
    capacityText: '~10.0M TEU / Year',
    draft: '15.0m',
    turnaround: '1.5 Days',
    ownership: 'Government of India / PSA International (Singapore)',
    congestion: 'Moderate',
    vesselsTracked: 24,
    status: 'Active',
    headlines: [
      'JNPT handles record container volumes in Q1 2026.',
      'New automated terminal systems reduce vessel wait times.'
    ]
  },
  {
    id: 'mundra',
    name: 'Mundra Port',
    country: 'India',
    coordinates: [69.7317, 22.8397],
    unLocode: 'INMUN',
    teu: 8.0,
    capacityText: '~8.0M TEU / Year',
    draft: '16.5m',
    turnaround: '1.2 Days',
    ownership: 'Adani Ports (National) / DP World',
    congestion: 'Moderate',
    vesselsTracked: 18,
    status: 'Active',
    headlines: [
      'Adani Ports announces new deep-water container terminal berths.',
      'Strategic rail connectivity routes completed from Gujarat manufacturing belt.'
    ]
  },
  {
    id: 'mumbai_port',
    name: 'Mumbai Port Authority',
    country: 'India',
    coordinates: [72.8582, 18.9482],
    unLocode: 'INBOM',
    teu: 1.5,
    capacityText: '75.15 MMT total cargo / Year',
    draft: '12.5m',
    turnaround: '2.0 Days',
    ownership: 'Government of India (Mumbai Port Authority)',
    congestion: 'Low',
    vesselsTracked: 11,
    status: 'Active',
    headlines: [
      'Mumbai Port Authority initiates dry bulk terminal modernization.',
      'Cargo flow capacity upgrades approved for western manufacturing hubs.'
    ]
  },
  {
    id: 'jebel_ali',
    name: 'Port of Jebel Ali',
    country: 'UAE',
    coordinates: [55.0612, 25.0113],
    unLocode: 'AEJEA',
    teu: 19.4,
    capacityText: '~19.4M TEU / Year',
    draft: '17.0m',
    turnaround: '1.1 Days',
    ownership: 'DP World (State-backed)',
    congestion: 'Low',
    vesselsTracked: 42,
    status: 'Active',
    headlines: [
      'DP World integrates AI logistics tracking across Jebel Ali terminals.',
      'Etihad Rail cargo services officially commence from Jebel Ali.'
    ]
  },
  {
    id: 'khalifa',
    name: 'Khalifa Port',
    country: 'UAE',
    coordinates: [54.6247, 24.8932],
    unLocode: 'AEKHL',
    teu: 8.0,
    capacityText: '~8.0M TEU / Year',
    draft: '18.0m',
    turnaround: '1.2 Days',
    ownership: 'Abu Dhabi Ports Group / CMA CGM (French)',
    congestion: 'Low',
    vesselsTracked: 19,
    status: 'Active',
    headlines: [
      'Khalifa Port expands automated container yard.',
      'French shipping major CMA CGM scales Mediterranean feeder routes.'
    ]
  },
  {
    id: 'fujairah',
    name: 'Port of Fujairah',
    country: 'UAE',
    coordinates: [56.3658, 25.1612],
    unLocode: 'AEFJR',
    teu: 1.0,
    capacityText: '~1.0M TEU / Year',
    draft: '18.0m',
    turnaround: '1.8 Days',
    ownership: 'Government of Fujairah / DP World',
    congestion: 'Low',
    vesselsTracked: 15,
    status: 'Under Expansion',
    headlines: [
      'Fujairah begins container capacity expansion to absorb Hormuz bypass cargo.',
      'New rail terminal links Fujairah direct to Saudi border.'
    ]
  },
  {
    id: 'duqm',
    name: 'Port of Duqm',
    country: 'Oman',
    coordinates: [57.7513, 19.6738],
    unLocode: 'OMDQM',
    teu: 3.5,
    capacityText: '~3.5M TEU / Year',
    draft: '19.0m',
    turnaround: '1.6 Days',
    ownership: 'Asyad Ports Oman / Consortium Antwerp Port (Belgium)',
    congestion: 'Low',
    vesselsTracked: 8,
    status: 'Under Expansion',
    headlines: [
      'Oman signs Belgium consortium deal to scale Duqm container operations.',
      'Special Economic Zone at Duqm attracts $2.4B in logistics investments.'
    ]
  },
  {
    id: 'salalah',
    name: 'Port of Salalah',
    country: 'Oman',
    coordinates: [54.0112, 16.9423],
    unLocode: 'OMSLL',
    teu: 6.5,
    capacityText: '~6.5M TEU / Year',
    draft: '18.5m',
    turnaround: '1.3 Days',
    ownership: 'APM Terminals (Danish) / Asyad Ports',
    congestion: 'Moderate',
    vesselsTracked: 20,
    status: 'Active',
    headlines: [
      'Salalah Port increases transshipment links to East Africa.',
      'New hybrid cranes deployed to improve turnaround efficiency.'
    ]
  },
  {
    id: 'dammam',
    name: 'King Abdulaziz Port, Dammam',
    country: 'Saudi Arabia',
    coordinates: [50.1753, 26.4328],
    unLocode: 'SADMM',
    teu: 3.5,
    capacityText: '~3.5M TEU / Year',
    draft: '16.0m',
    turnaround: '1.4 Days',
    ownership: 'Saudi Ports Authority (Mawani)',
    congestion: 'Low',
    vesselsTracked: 14,
    status: 'Active',
    headlines: [
      'Dammam Port reports 12% growth in container volume.',
      'New cargo rail connection to Riyadh dry port launched.'
    ]
  },
  {
    id: 'jeddah',
    name: 'Jeddah Islamic Port',
    country: 'Saudi Arabia',
    coordinates: [39.1601, 21.4658],
    unLocode: 'SAJED',
    teu: 13.0,
    capacityText: '~13.0M TEU / Year',
    draft: '16.5m',
    turnaround: '1.5 Days',
    ownership: 'Saudi Ports Authority / DP World / RSGT',
    congestion: 'High',
    vesselsTracked: 22,
    status: 'Active',
    headlines: [
      'Jeddah Port handles massive transshipments despite Red Sea shipping detours.',
      'DP World expands automated container yard at Jeddah.'
    ]
  },
  {
    id: 'aqaba',
    name: 'Port of Aqaba',
    country: 'Jordan',
    coordinates: [35.0118, 29.5267],
    unLocode: 'JOAQB',
    teu: 1.3,
    capacityText: '~1.3M TEU / Year',
    draft: '15.0m',
    turnaround: '2.0 Days',
    ownership: 'Aqaba Development Corp / APM Terminals',
    congestion: 'Moderate',
    vesselsTracked: 6,
    status: 'Active',
    headlines: [
      'Jordan and UAE sign $2.3B deal for Aqaba railway line.',
      'Aqaba Port scales bulk cargo operations.'
    ]
  },
  {
    id: 'haifa',
    name: 'Port of Haifa',
    country: 'Israel',
    coordinates: [34.9892, 32.7940],
    unLocode: 'ILHFA',
    teu: 1.5,
    capacityText: '~1.5M TEU / Year',
    draft: '15.5m',
    turnaround: '2.1 Days',
    ownership: 'Adani Group (India) 70% / Gadot Group (Israel) 30% / Bay Port operated by Chinese SIPG',
    congestion: 'High',
    vesselsTracked: 12,
    status: 'Active',
    headlines: [
      'Security review initiated regarding SIPGs Bay Port lease at Haifa.',
      'Haifa terminal reports logistics backlogs amidst regional friction.'
    ]
  },
  {
    id: 'ashdod',
    name: 'Port of Ashdod',
    country: 'Israel',
    coordinates: [34.6478, 31.8175],
    unLocode: 'ILASD',
    teu: 1.5,
    capacityText: '~1.5M TEU / Year',
    draft: '15.0m',
    turnaround: '1.9 Days',
    ownership: 'Israel Ports Authority / TIL (Swiss)',
    congestion: 'Moderate',
    vesselsTracked: 9,
    status: 'Active',
    headlines: [
      'Ashdod absorbs cargo diverted from Red Sea blockades.',
      'Upgrade plans approved to double container yard capacity.'
    ]
  },
  {
    id: 'piraeus',
    name: 'Port of Piraeus',
    country: 'Greece',
    coordinates: [23.6371, 37.9475],
    unLocode: 'GRPIR',
    teu: 7.2,
    capacityText: '~7.2M TEU / Year',
    draft: '16.0m',
    turnaround: '1.4 Days',
    ownership: 'COSCO Shipping (China)',
    congestion: 'Moderate',
    vesselsTracked: 31,
    status: 'Active',
    headlines: [
      'COSCO reports record EU-bound transshipments via Piraeus.',
      'European Council debates digital security toolbox vetting for Piraeus terminals.'
    ]
  },
  {
    id: 'trieste',
    name: 'Port of Trieste',
    country: 'Italy',
    coordinates: [13.7631, 45.6582],
    unLocode: 'ITTRS',
    teu: 1.0,
    capacityText: '~1.0M TEU / Year',
    draft: '18.0m',
    turnaround: '1.3 Days',
    ownership: 'AdSP Italy / HHLA (German)',
    congestion: 'Low',
    vesselsTracked: 7,
    status: 'Active',
    headlines: [
      'Trieste Port records increase in Central European rail exports.',
      'HHLA expands terminal infrastructure at Trieste.'
    ]
  },
  {
    id: 'genoa',
    name: 'Port of Genoa',
    country: 'Italy',
    coordinates: [8.9463, 44.4056],
    unLocode: 'ITGOA',
    teu: 3.0,
    capacityText: '~3.0M TEU / Year',
    draft: '15.0m',
    turnaround: '1.6 Days',
    ownership: 'AdSP Italy / PSA International (Singapore)',
    congestion: 'Moderate',
    vesselsTracked: 16,
    status: 'Active',
    headlines: [
      'Genoa terminal links directly to Alpine rail network.',
      'Suez detour bypass increases container rates at Genoa.'
    ]
  },
  {
    id: 'marseille',
    name: 'Port of Marseille-Fos',
    country: 'France',
    coordinates: [4.9768, 43.4345],
    unLocode: 'FRMRS',
    teu: 1.5,
    capacityText: '~1.5M TEU / Year',
    draft: '15.5m',
    turnaround: '1.7 Days',
    ownership: 'Grand Port Maritime de Marseille (State)',
    congestion: 'Low',
    vesselsTracked: 11,
    status: 'Active',
    headlines: [
      'Marseille-Fos expands container berths to handle larger vessels.',
      'New subsea fiber landing station commissioned at Marseille.'
    ]
  },
  {
    id: 'tartus',
    name: 'Tartus Port (Alternative)',
    country: 'Syria',
    coordinates: [35.8789, 34.9048],
    unLocode: 'SYTAR',
    teu: 2.0,
    capacityText: '2.0M TEU / Year Equivalent',
    draft: '14.5m',
    turnaround: '2.5 Days',
    ownership: 'DP World (30-year concession)',
    congestion: 'Low',
    vesselsTracked: 3,
    status: 'Under Expansion',
    headlines: [
      'DP World signs landmark 30-year deal to develop Tartus Port.',
      'Syrian infrastructure projects attract Gulf logistics interest.'
    ]
  },
  {
    id: 'latakia',
    name: 'Latakia Port (Alternative)',
    country: 'Syria',
    coordinates: [35.7876, 35.5312],
    unLocode: 'SYLTK',
    teu: 1.8,
    capacityText: '1.8M TEU / Year Equivalent',
    draft: '14.0m',
    turnaround: '2.3 Days',
    ownership: 'CMA CGM (French)',
    congestion: 'Low',
    vesselsTracked: 4,
    status: 'Under Expansion',
    headlines: [
      'CMA CGM announces €200M Latakia port expansion.',
      'Latakia terminal upgrades container processing software.'
    ]
  },
  {
    id: 'riyadh_dry_port',
    name: 'Riyadh Dry Port',
    country: 'Saudi Arabia',
    coordinates: [46.7249, 24.6402],
    unLocode: 'SARYD',
    teu: 1.2,
    capacityText: '1.2M TEU / Year',
    draft: 'Land Terminal',
    turnaround: '0.8 Days',
    ownership: 'Saudi Railway Company (SAR)',
    congestion: 'Moderate',
    vesselsTracked: 0,
    status: 'Active',
    headlines: [
      'Riyadh dry terminal handles record daily trains from Eastern province.',
      'SAR implements smart cargo pre-clearing.'
    ]
  },
  {
    id: 'al_haditha_terminal',
    name: 'Al Haditha Terminal',
    country: 'Saudi Arabia',
    coordinates: [37.1597, 31.4553],
    unLocode: 'SAHDT',
    teu: 0.5,
    capacityText: '500k Containers / Year',
    draft: 'Land Border',
    turnaround: '1.4 Days',
    ownership: 'Saudi Railway Company (SAR)',
    congestion: 'Low',
    vesselsTracked: 0,
    status: 'Active',
    headlines: [
      'Border yard capacity expanded for container offloads.',
      'Saudi-Jordan rail connector plans proceed to design stage.'
    ]
  }
];

const RAILWAYS_DATABASE: RailwayAsset[] = [
  {
    id: 'etihad_rail',
    name: 'Etihad Rail Freight Network',
    status: 'Built',
    length: '1,200 km',
    gauge: 'Standard (1,435 mm)',
    provisions: 'Main UAE corridor linking Fujairah bypass port to Jebel Ali, Khalifa, and Ghuwaifat border.',
    country: 'UAE',
    coordinates: [[56.36, 25.16], [55.06, 25.01], [54.37, 24.45], [51.62, 24.08]],
    headlines: [
      'Etihad Rail officially launches commercial operations.',
      'Weekly container freight volumes reach record highs between Abu Dhabi and Fujairah.'
    ]
  },
  {
    id: 'uae_saudi_link',
    name: 'UAE – Saudi Arabia Cross-Border Link',
    status: 'Proposed',
    length: '290 km',
    gauge: 'Standard (1,435 mm)',
    provisions: 'Connects UAE al-Ghuwaifat border terminal to Saudi East cargo track at Haradh/Dammam.',
    country: 'UAE & Saudi Arabia',
    coordinates: [[51.62, 24.08], [49.5, 24.0], [50.17, 26.43]],
    headlines: [
      'UAE-Saudi cross border link enters bidding/tender phase.',
      'Bilateral committees align regulatory frameworks for freight transits.'
    ]
  },
  {
    id: 'saudi_east_north',
    name: 'Saudi East Cargo & North Rail Network',
    status: 'Built',
    length: '1,749 km',
    gauge: 'Standard (1,435 mm)',
    provisions: 'Bypasses Hormuz chokepoints by connecting Dammam and Riyadh directly to Al Haditha Jordan border.',
    country: 'Saudi Arabia',
    coordinates: [[50.17, 26.43], [46.72, 24.64], [43.9, 26.3], [41.0, 27.5], [37.1597, 31.4553]],
    headlines: [
      'SAR officially launches consolidated active overland cargo corridor.',
      'Double-stack container test runs completed from Riyadh inland ports.'
    ]
  },
  {
    id: 'saudi_jordan_link',
    name: 'Saudi Arabia – Jordan Cross-Border Link',
    status: 'Proposed',
    length: '180 km',
    gauge: 'Standard (1,435 mm)',
    provisions: 'Extends from Al Haditha Saudi railhead into Jordanian standard-gauge network.',
    country: 'Saudi Arabia & Jordan',
    coordinates: [[37.1597, 31.4553], [36.0, 31.8], [35.01, 29.52]],
    headlines: [
      'Truck-to-rail container transfers continue at Al Haditha border depot.',
      'Jordanian Ministry of Transport drafts standard-gauge border terminal design.'
    ]
  },
  {
    id: 'jordan_aqaba_project',
    name: 'Jordan Aqaba Railway Project',
    status: 'Proposed',
    length: '360 km',
    gauge: 'Standard (1,435 mm)',
    provisions: 'Links mining zones and inland hubs directly to Port of Aqaba. Anchored by UAE-funded package.',
    country: 'Jordan',
    coordinates: [[35.01, 29.52], [36.0, 31.5]],
    headlines: [
      'UAE signs $2.3B investment deal to construct and operate Aqaba Rail corridor.',
      'Environmental assessments completed for standard-gauge track alignments.'
    ]
  },
  {
    id: 'jordan_israel_link',
    name: 'Jordan – Israel Cross-Border Link',
    status: 'Proposed',
    length: '15 km',
    gauge: 'Standard (1,435 mm)',
    provisions: 'Strategic corridor between Jordan River border crossing and Israel Beit She\'an rail network.',
    country: 'Jordan & Israel',
    coordinates: [[36.0, 31.8], [35.5, 32.5], [35.0, 32.79]],
    headlines: [
      'Jordan-Israel link faces regional geopolitical negotiations.',
      'Alternative logistics corridors evaluated to bypass land borders.'
    ]
  },
  {
    id: 'israel_port_link',
    name: 'Haifa Port Rail Link',
    status: 'Built',
    length: '60 km',
    gauge: 'Standard (1,435 mm)',
    provisions: 'Connects Haifa maritime terminals to Beit She\'an network, providing the Levant cargo outlet.',
    country: 'Israel',
    coordinates: [[35.0, 32.79], [34.9892, 32.7940]],
    headlines: [
      'Haifa rail connection reports operational readiness for container freights.',
      'New cargo yards commissioned to handle container diversions.'
    ]
  }
];

const DATA_CENTERS_DATABASE: DataCenterAsset[] = [
  { id: 'dc_mumbai', name: 'Yotta Navi Mumbai (NM1)', city: 'Navi Mumbai', country: 'India', coordinates: [73.08, 19.03], operator: 'Yotta Infrastructure', serversCount: '150,000+ Servers', tier: 'Tier IV Certified', securityRating: 'Sovereign-Ready' },
  { id: 'dc_dubai', name: 'Khazna Dubai Cluster', city: 'Dubai', country: 'UAE', coordinates: [55.27, 25.20], operator: 'Khazna Data Centers', serversCount: '80,000+ Servers', tier: 'Tier III / IV', securityRating: 'Premier Regional Aggregator' },
  { id: 'dc_riyadh', name: 'center3 Riyadh Hyperscale', city: 'Riyadh', country: 'Saudi Arabia', coordinates: [46.72, 24.64], operator: 'center3 (stc Group)', serversCount: '95,000+ Servers', tier: 'Tier IV', securityRating: 'Sovereign Cloud Localisation' },
  { id: 'dc_aqaba', name: 'Aqaba IX Terrestrial Bridge', city: 'Aqaba', country: 'Jordan', coordinates: [35.01, 29.52], operator: 'Naitel / Aqaba IX', serversCount: '10,000+ Servers', tier: 'Tier III', securityRating: 'Critical Red Sea Bridge' },
  { id: 'dc_telaviv', name: 'Tel Aviv EdgeConneX', city: 'Tel Aviv', country: 'Israel', coordinates: [34.78, 32.08], operator: 'EdgeConneX / AWS', serversCount: '45,000+ Servers', tier: 'Tier III', securityRating: 'Cybersecurity R&D Hub' },
  { id: 'dc_athens', name: 'Athens Digital Realty', city: 'Athens', country: 'Greece', coordinates: [23.72, 37.98], operator: 'Digital Realty', serversCount: '25,000+ Servers', tier: 'Tier III', securityRating: 'EU Digital Gateway' },
  { id: 'dc_milan', name: 'Milan Aruba Cluster', city: 'Milan', country: 'Italy', coordinates: [9.19, 45.46], operator: 'Aruba / Sparkle', serversCount: '120,000+ Servers', tier: 'Tier IV', securityRating: 'Southern European Axis' },
  { id: 'dc_marseille', name: 'Marseille Connectivity Hub', city: 'Marseille', country: 'France', coordinates: [5.36, 43.29], operator: 'OVHcloud / Digital Realty', serversCount: '200,000+ Servers', tier: 'Tier IV', securityRating: 'Global Connectivity Capital' }
];

const CABLES_DATABASE: CableAsset[] = [
  {
    id: 'blue_raman',
    name: 'Blue & Raman Cable System',
    landingPoints: ['Genoa (Italy)', 'Marseille (France)', 'Chania (Greece)', 'Tel Aviv (Israel)', 'Aqaba (Jordan)', 'Dubah (Saudi Arabia)', 'Mumbai (India)'],
    status: 'Under Development',
    owners: 'Google / Sparkle / Zain Omantel International',
    suppliers: 'Alcatel Submarine Networks (ASN)',
    securityRating: 'Trusted Connectivity (EU Toolbox Approved)',
    coordinates: [[5.3698, 43.2965], [8.94, 44.4], [12.0, 37.0], [23.63, 37.94], [34.98, 32.79], [35.01, 29.52], [39.16, 21.46], [54.01, 16.94], [72.946, 18.948]]
  },
  {
    id: 'emc_cable',
    name: 'East to Med Corridor (EMC)',
    landingPoints: ['Marseille (France)', 'Genoa (Italy)', 'Athens (Greece)', 'Tel Aviv (Israel)', 'Jeddah (Saudi Arabia)'],
    status: 'Active',
    owners: 'stc / Cyta / PPC / TTSA',
    suppliers: 'Alcatel Submarine Networks (ASN)',
    securityRating: 'Trusted Corridor (French Strategic Oversight)',
    coordinates: [[5.36, 43.2], [8.94, 44.40], [23.63, 37.94], [34.98, 32.79], [39.16, 21.46]]
  },
  {
    id: 'iex_cable',
    name: 'India-Europe Express (IEX)',
    landingPoints: ['Mumbai (India)', 'Salalah (Oman)', 'Jeddah (Saudi Arabia)', 'Suez (Egypt)', 'Athens (Greece)', 'Marseille (France)'],
    status: 'Active',
    owners: 'Reliance Jio Infocomm',
    suppliers: 'SubCom',
    securityRating: 'National Champion Managed',
    coordinates: [[72.946, 18.948], [54.01, 16.94], [39.16, 21.46], [32.32, 29.93], [23.63, 37.94], [5.36, 43.2]]
  }
];

const ENERGY_DATABASE: EnergyAsset[] = [
  {
    id: 'eastmed_pipe',
    name: 'EastMed Pipeline Project',
    type: 'Pipeline',
    product: 'Natural Gas (H2-ready)',
    capacity: '10 Billion Cubic Meters / Year',
    status: 'Permitting / Paused (Geopolitical dispute with Turkey)',
    route: 'Israel Levantine Basin ↔ Cyprus ↔ Greece ↔ Italy',
    promoters: 'IGI Poseidon (Edison Italy, DEPA Greece)',
    coordinates: [[34.8, 32.0], [33.0, 34.5], [24.5, 35.0], [23.5, 38.0], [18.49, 40.14]]
  },
  {
    id: 'south2_corridor',
    name: 'SoutH2 Corridor',
    type: 'Pipeline',
    product: 'Green Hydrogen',
    capacity: '4 Million Tonnes / Year',
    status: 'Planned (EU Project of Common Interest)',
    route: 'Algeria ↔ Tunisia ↔ Italy (Sicily) ↔ Austria ↔ Germany',
    promoters: 'Snam (Italy)',
    coordinates: [[3.27, 32.93], [8.83, 35.17], [12.58, 37.65], [12.8, 42.0], [9.19, 45.46]]
  },
  {
    id: 'h2_poseidon',
    name: 'H2Poseidon',
    type: 'Pipeline',
    product: '100% Green Hydrogen',
    capacity: '2.5 Million Tonnes / Year',
    status: 'Planned (Design & Auth obtained)',
    route: 'Greece ↔ Italy (Ionian Sea Crossing)',
    promoters: 'IGI Poseidon',
    coordinates: [[20.26, 39.50], [18.49, 40.14]]
  },
  {
    id: 'saudi_ew_pipeline',
    name: 'Saudi East-West Crude Pipeline',
    type: 'Pipeline',
    product: 'Crude Oil',
    capacity: '5.0 Million Barrels / Day',
    status: 'Existing (Bypasses Strait of Hormuz)',
    route: 'Saudi Eastern Province (Abqaiq) ↔ Yanbu (Red Sea)',
    promoters: 'Saudi Aramco',
    coordinates: [[49.68, 25.93], [46.72, 24.64], [38.22, 24.09]]
  },
  {
    id: 'great_sea_interconnector',
    name: 'Great Sea Interconnector',
    type: 'HVDC Interconnector',
    product: 'Electricity Grid',
    capacity: '2,000 MW',
    status: 'Under Construction (Expected 2029)',
    route: 'Israel ↔ Cyprus ↔ Crete (Greece)',
    promoters: 'Nexans / EuroAsia Interconnector',
    coordinates: [[34.8, 32.0], [33.0, 34.5], [24.5, 35.0], [23.8, 37.8]]
  },
  {
    id: 'egypt_ksa_link',
    name: 'Egypt-KSA Interconnection',
    type: 'HVDC Interconnector',
    product: 'Electricity Grid',
    capacity: '3,000 MW',
    status: 'Final Stage (Phase 1 operational 2025)',
    route: 'Saudi Arabia (Tabuk) ↔ Egypt (Badr)',
    promoters: 'Saudi Electricity Company / ONGC Egypt',
    coordinates: [[36.56, 28.38], [34.8, 28.2], [31.74, 30.13]]
  },
  {
    id: 'india_uae_hvdc',
    name: 'India–UAE HVDC Subsea Link',
    type: 'HVDC Interconnector',
    product: 'Electricity Grid',
    capacity: '2,000 MW',
    status: 'Feasibility Stage (OSOWOG framework)',
    route: 'India (Mundra) ↔ UAE (Fujairah)',
    promoters: 'Power Grid Corporation of India / TAQA UAE',
    coordinates: [[69.73, 22.84], [56.36, 25.18]]
  }
];

const AGREEMENTS_DATABASE: AgreementAsset[] = [
  {
    id: 'gcc_market',
    name: 'GCC Common Market',
    type: 'FTA',
    signedYear: '2008 (Upgraded 2024)',
    status: 'In Force',
    members: ['Saudi Arabia', 'UAE', 'Oman', 'Qatar', 'Kuwait', 'Bahrain'],
    provisions: 'Zero internal customs, unified tariff borders, free capital movement.',
    benefits: 'Seamless trans-desert rail freight cargo routing without border transit duties.',
    developments: [
      'GCC Customs Union integrates digital rail manifest clearance systems.',
      'Sovereign transit agreements approved for UAE-Saudi cross-border links.'
    ],
    coordinates: [
      [[[34.5, 29.5], [48.0, 30.0], [60.0, 25.0], [59.0, 22.0], [54.0, 16.5], [44.0, 12.5], [35.0, 22.0], [34.5, 29.5]]]
    ]
  },
  {
    id: 'eu_market',
    name: 'EU Single Market',
    type: 'FTA',
    signedYear: '1993',
    status: 'In Force',
    members: ['France', 'Italy', 'Greece', 'Germany', 'Austria', 'Spain', 'Belgium'],
    provisions: 'Four freedoms: free movement of goods, capital, services, and people.',
    benefits: 'Allows container cargo landed in Piraeus, Genoa, or Trieste to circulate without customs.',
    developments: [
      'EU Submarine Cable Security Toolbox integrated into maritime network protocols.',
      'CBAM adjustments introduced on hydrogen pipelines crossing external borders.'
    ],
    coordinates: [
      [[[-9.0, 38.0], [15.0, 38.0], [25.0, 36.0], [30.0, 45.0], [20.0, 54.0], [2.0, 50.0], [-9.0, 38.0]]]
    ]
  },
  {
    id: 'india_uae_cepa',
    name: 'India–UAE Comprehensive Economic Partnership (CEPA)',
    type: 'FTA',
    signedYear: '2022',
    status: 'In Force',
    members: ['India', 'UAE'],
    provisions: 'Elimination of tariffs on 90% of goods, digital trade rules, investment guarantees.',
    benefits: 'Underwrites the East Corridor maritime leg, lowering shipping duty overheads by 15%.',
    developments: [
      'Bilateral trade reaches historic high of $90B.',
      'Joint industrial parks launched in Gujarat and Abu Dhabi to support corridor exports.'
    ],
    coordinates: [
      [[[68.1, 23.0], [72.0, 31.0], [77.0, 35.0], [88.0, 27.0], [92.0, 21.0], [80.0, 6.0], [72.0, 8.0], [68.1, 23.0]]],
      [[[34.5, 29.5], [48.0, 30.0], [60.0, 25.0], [59.0, 22.0], [54.0, 16.5], [44.0, 12.5], [35.0, 22.0], [34.5, 29.5]]]
    ]
  },
  {
    id: 'aspides_shield',
    name: 'EUNAVFOR Operation Aspides',
    type: 'Defense',
    signedYear: '2024',
    status: 'Active Command',
    members: ['European Union', 'Regional Escort Entities'],
    provisions: 'Defensive naval convoy screens to safeguard commercial shipping lanes in Red Sea/Bab al-Mandab.',
    benefits: 'Secures alternative Suez routes and Levantine sea lanes against asymmetric threat profiles.',
    developments: [
      'EU Aspides task force unifies coordination with regional naval anchors.',
      'Over 400 container ships escorted with zero casualties reported under naval canopy.'
    ],
    coordinates: [
      [[[32.32, 29.93], [35.0, 26.0], [39.5, 18.0], [43.25, 12.60], [40.0, 11.0], [31.0, 20.0], [32.32, 29.93]]]
    ]
  },
  {
    id: 'akashteer_dome',
    name: 'Akashteer Air Defense Command Network',
    type: 'Defense',
    signedYear: '2025',
    status: 'Active Canopy',
    members: ['UAE', 'India Defense Primes (BEL)'],
    provisions: 'Akashteer tactical air defense command network unifies Gulf multi-sensor radar infrastructure.',
    benefits: 'Shields land corridors and ports in Jebel Ali and Fujairah against drone/missile attacks.',
    developments: [
      'UAE integrates Akashteer systems with Israeli anti-drone defensive batteries.',
      'EDGE group coordinates technology sharing and radar sensor co-development.'
    ],
    coordinates: [
      [[[52.0, 22.0], [58.0, 22.0], [58.0, 27.0], [52.0, 27.0], [52.0, 22.0]]]
    ]
  }
];

// Ticker bulletins
const NEWS_BULLETINS = [
  'ALERT: UAE Akashteer tactical air defense network unifies Gulf radar monitoring.',
  'UPDATE: India-UAE CEPA trade volumes surge 15% in Q1 2026.',
  'REPORT: Shanghai Port Group (SIPG) extends lease on Haifa\'s Bay Port; security review initiated.',
  'DEAL: €200M CMA CGM investment in Syria\'s Latakia Port begins Phase 2 expansion.',
  'HVDC: Egypt-KSA Interconnection (3000 MW) enters final testing stage.',
  'SECURITY: EUNAVFOR Aspides frigate escorts container convoy through Bab al-Mandab.',
  'ENERGY: Algeria-Italy SoutH2 corridor gains EU Project of Common Interest funding.',
  'RAILWAY: Jordan standard-gauge rail network secures $2.3B UAE construction grant.'
];

export default function ImecMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // ── Layer Visibility States ──────────────────────────────
  const [activeLayers, setActiveLayers] = useState<Record<string, boolean>>({
    ports: true,
    railways: true,
    datacenters: false,
    cables: false,
    energy: false,
    ftas: false,
    defense: false
  });

  const [mapStyle, setMapStyle] = useState<'dark' | 'light'>('dark');
  const [selectedAsset, setSelectedAsset] = useState<{ type: string; data: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tickerIndex, setTickerIndex] = useState(0);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(3.0);

  // ── Toggle Layer Handler ──────────────────────────────────
  const toggleLayer = (layer: string) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  // ── Simulated News Ticker Loop ────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % NEWS_BULLETINS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // ── Setup Sources & Layers (Mapbox) ───────────────────────
  const addMapLayersAndSources = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing sources/layers if reloading style
    const cleanupLayers = [
      'railways-layer', 'cables-layer', 'datacenters-layer',
      'pipelines-layer', 'hvdc-layer', 'security-escort-layer',
      'security-radar-layer', 'ftas-layer', 'defense-layer'
    ];
    cleanupLayers.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });

    const cleanupSources = [
      'railways', 'subsea-cables', 'data-centers', 'energy-pipelines',
      'electricity-hvdc', 'security-escort', 'security-radar',
      'ftas-source', 'defense-source'
    ];
    cleanupSources.forEach(id => {
      if (map.getSource(id)) map.removeSource(id);
    });

    // 1. Railways GeoJSON
    map.addSource('railways', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: RAILWAYS_DATABASE.map(rail => ({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: rail.coordinates },
          properties: { id: rail.id, name: rail.name, status: rail.status }
        }))
      }
    });

    // 2. Cables GeoJSON
    map.addSource('subsea-cables', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: CABLES_DATABASE.map(cable => ({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: cable.coordinates },
          properties: { id: cable.id, name: cable.name, status: cable.status, owners: cable.owners }
        }))
      }
    });

    // 3. Data Centers GeoJSON
    map.addSource('data-centers', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: DATA_CENTERS_DATABASE.map(dc => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: dc.coordinates },
          properties: { id: dc.id, name: dc.name, operator: dc.operator }
        }))
      }
    });

    // 4. Energy Pipelines GeoJSON
    map.addSource('energy-pipelines', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: ENERGY_DATABASE.filter(e => e.type === 'Pipeline').map(pipe => ({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: pipe.coordinates },
          properties: { id: pipe.id, name: pipe.name, status: pipe.status }
        }))
      }
    });

    // 5. Electricity HVDC GeoJSON
    map.addSource('electricity-hvdc', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: ENERGY_DATABASE.filter(e => e.type === 'HVDC Interconnector').map(hvdc => ({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: hvdc.coordinates },
          properties: { id: hvdc.id, name: hvdc.name, status: hvdc.status }
        }))
      }
    });

    // 6. FTAs GeoJSON Polygons
    map.addSource('ftas-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: AGREEMENTS_DATABASE.filter(a => a.type === 'FTA').map(fta => ({
          type: 'Feature',
          geometry: { type: 'MultiPolygon', coordinates: fta.coordinates },
          properties: { id: fta.id, name: fta.name }
        }))
      }
    });

    // 7. Defense GeoJSON Polygons
    map.addSource('defense-source', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: AGREEMENTS_DATABASE.filter(a => a.type === 'Defense').map(def => ({
          type: 'Feature',
          geometry: { type: 'MultiPolygon', coordinates: def.coordinates },
          properties: { id: def.id, name: def.name }
        }))
      }
    });

    // ── Render Layers ──

    // FTAs shaded background (Teal/Emerald)
    map.addLayer({
      id: 'ftas-layer',
      type: 'fill',
      source: 'ftas-source',
      layout: { visibility: activeLayers.ftas ? 'visible' : 'none' },
      paint: { 'fill-color': '#10b981', 'fill-opacity': 0.15, 'fill-outline-color': '#059669' }
    });

    // Defense shaded background (Indigo/Red)
    map.addLayer({
      id: 'defense-layer',
      type: 'fill',
      source: 'defense-source',
      layout: { visibility: activeLayers.defense ? 'visible' : 'none' },
      paint: { 'fill-color': '#f43f5e', 'fill-opacity': 0.18, 'fill-outline-color': '#e11d48' }
    });

    // Railways (Slate Built, Dashed Red Proposed)
    map.addLayer({
      id: 'railways-layer',
      type: 'line',
      source: 'railways',
      layout: {
        visibility: activeLayers.railways ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': ['match', ['get', 'status'], 'Built', '#64748b', '#e11d48'],
        'line-width': ['match', ['get', 'status'], 'Built', 3, 2],
        'line-dasharray': ['match', ['get', 'status'], 'Built', [1, 0], [4, 3]]
      }
    });

    // Cables (Cyan Glowing Curved)
    map.addLayer({
      id: 'cables-layer',
      type: 'line',
      source: 'subsea-cables',
      layout: {
        visibility: activeLayers.cables ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: { 'line-color': '#06b6d4', 'line-width': 2.5, 'line-opacity': 0.8 }
    });

    // Data Centers (Server nodes)
    map.addLayer({
      id: 'datacenters-layer',
      type: 'circle',
      source: 'data-centers',
      layout: { visibility: activeLayers.datacenters ? 'visible' : 'none' },
      paint: {
        'circle-radius': 6.5,
        'circle-color': '#0d9488',
        'circle-stroke-width': 1.5,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Pipelines (Amber Dashed)
    map.addLayer({
      id: 'pipelines-layer',
      type: 'line',
      source: 'energy-pipelines',
      layout: {
        visibility: activeLayers.energy ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: { 'line-color': '#d97706', 'line-width': 2.5, 'line-dasharray': [4, 3] }
    });

    // HVDC grids (Emerald Solid)
    map.addLayer({
      id: 'hvdc-layer',
      type: 'line',
      source: 'electricity-hvdc',
      layout: {
        visibility: activeLayers.energy ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: { 'line-color': '#10b981', 'line-width': 3 }
    });

    // ── Interaction Listeners ──
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    const hoverLayers = [
      { id: 'railways-layer', db: RAILWAYS_DATABASE, title: 'Railway Segment' },
      { id: 'cables-layer', db: CABLES_DATABASE, title: 'Subsea Fiber Cable' },
      { id: 'datacenters-layer', db: DATA_CENTERS_DATABASE, title: 'Data Center Facility' },
      { id: 'pipelines-layer', db: ENERGY_DATABASE, title: 'Energy Pipeline' },
      { id: 'hvdc-layer', db: ENERGY_DATABASE, title: 'HVDC Grid Line' },
      { id: 'ftas-layer', db: AGREEMENTS_DATABASE, title: 'Trade Agreement Area' },
      { id: 'defense-layer', db: AGREEMENTS_DATABASE, title: 'Defense Shield Canopy' }
    ];

    hoverLayers.forEach(({ id, db, title }) => {
      map.on('mouseenter', id, (e) => {
        map.getCanvas().style.cursor = 'pointer';
        const features = map.queryRenderedFeatures(e.point, { layers: [id] });
        if (!features.length) return;
        
        const featureId = features[0].properties?.id;
        const record = db.find(x => x.id === featureId);
        if (!record) return;

        popup
          .setLngLat(e.lngLat)
          .setHTML(`
            <div class="font-mono text-[9px] text-sky-400 font-bold uppercase tracking-wider mb-1">${title}</div>
            <div class="font-sans font-bold text-xs text-gray-900 mb-0.5">${record.name}</div>
            <div class="font-mono text-[9px] text-gray-500">${'status' in record ? record.status : 'Active'}</div>
          `)
          .addTo(map);
      });

      map.on('mouseleave', id, () => {
        map.getCanvas().style.cursor = '';
        popup.remove();
      });

      map.on('click', id, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [id] });
        if (!features.length) return;
        const featureId = features[0].properties?.id;
        const record = db.find(x => x.id === featureId);
        if (record) {
          const typeMap: Record<string, string> = {
            'railways-layer': 'railway',
            'cables-layer': 'cable',
            'datacenters-layer': 'datacenter',
            'pipelines-layer': 'energy',
            'hvdc-layer': 'energy',
            'ftas-layer': 'fta',
            'defense-layer': 'defense'
          };
          setSelectedAsset({ type: typeMap[id], data: record });
        }
      });
    });

  }, [activeLayers]);

  // ── Sync Custom Port Markers ──
  const updatePortMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (!activeLayers.ports) return;

    PORTS_DATABASE.forEach(port => {
      // Automatic Zoom-based visibility & layout clustering
      const isVisible = 
        zoomLevel >= 6 ||
        (zoomLevel >= 4 && port.teu >= 1.5) ||
        (zoomLevel < 4 && port.teu >= 3.5);

      if (!isVisible) return;

      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer group';

      const ringColor = 
        port.status === 'Active' ? 'border-sky-500 bg-sky-500/5' :
        port.status === 'Under Expansion' ? 'border-amber-500 bg-amber-500/5' :
        'border-gray-500 bg-gray-500/5';

      const dotColor = 
        port.status === 'Active' ? 'bg-sky-500' :
        port.status === 'Under Expansion' ? 'bg-amber-500' :
        'bg-gray-400';

      const markerSize = Math.max(12, Math.min(24, Math.sqrt(port.teu) * 4.5));
      const innerDotSize = Math.max(4, markerSize / 2.5);

      const isSelected = selectedAsset?.type === 'port' && selectedAsset.data.id === port.id;

      el.innerHTML = `
        <div class="absolute w-[200%] h-[200%] border rounded-full ${ringColor} ${isSelected ? 'animate-ping' : 'opacity-40 group-hover:animate-ping'} transition-all"></div>
        <div class="relative rounded-full ${dotColor} flex items-center justify-center transition-all ${isSelected ? 'scale-125 ring-2 ring-white/50' : 'group-hover:scale-110'}" style="width: ${markerSize}px; height: ${markerSize}px;">
          <div class="rounded-full bg-slate-900" style="width: ${innerDotSize}px; height: ${innerDotSize}px;"></div>
        </div>
        <div class="absolute top-[120%] bg-slate-900/90 text-white font-mono text-[8px] font-bold tracking-wider uppercase border border-slate-700/50 px-1.5 py-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
          ${port.name} (${port.capacityText})
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedAsset({ type: 'port', data: port });
        map.flyTo({ center: port.coordinates, zoom: 6.5, speed: 1.2 });
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat(port.coordinates)
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [activeLayers.ports, zoomLevel, selectedAsset]);

  // ── Effect: Initialize Mapbox ──
  useEffect(() => {
    if (mapRef.current) return;

    const styleUrl = mapStyle === 'dark' 
      ? 'mapbox://styles/mapbox/dark-v11' 
      : 'mapbox://styles/mapbox/light-v11';

    const map = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: styleUrl,
      center: [38.0, 31.0],
      zoom: 3.0,
      pitch: 0,
      bearing: 0,
      projection: { name: 'mercator' }
    });

    mapRef.current = map;

    map.on('load', () => {
      setMapLoaded(true);
      addMapLayersAndSources();
      updatePortMarkers();
    });

    map.on('zoom', () => {
      setZoomLevel(map.getZoom());
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update layout when styles/toggles reload
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const targetStyle = mapStyle === 'dark' 
      ? 'mapbox://styles/mapbox/dark-v11' 
      : 'mapbox://styles/mapbox/light-v11';

    const currentStyle = map.getStyle();
    if (currentStyle && currentStyle.sprite !== targetStyle) {
      map.setStyle(targetStyle);
      map.once('style.load', () => {
        addMapLayersAndSources();
        updatePortMarkers();
      });
      return;
    }

    addMapLayersAndSources();
    updatePortMarkers();
  }, [mapStyle, activeLayers, mapLoaded, addMapLayersAndSources, updatePortMarkers]);

  // Sync zoom-based clusters
  useEffect(() => {
    updatePortMarkers();
  }, [zoomLevel, selectedAsset, updatePortMarkers]);

  // ── Search Database Handler ───────────────────────────────
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const ports = PORTS_DATABASE.filter(x => x.name.toLowerCase().includes(q)).map(x => ({ type: 'port', data: x }));
    const rails = RAILWAYS_DATABASE.filter(x => x.name.toLowerCase().includes(q)).map(x => ({ type: 'railway', data: x }));
    const dcs = DATA_CENTERS_DATABASE.filter(x => x.name.toLowerCase().includes(q)).map(x => ({ type: 'datacenter', data: x }));
    const cables = CABLES_DATABASE.filter(x => x.name.toLowerCase().includes(q)).map(x => ({ type: 'cable', data: x }));
    const energy = ENERGY_DATABASE.filter(x => x.name.toLowerCase().includes(q)).map(x => ({ type: 'energy', data: x }));
    const agreements = AGREEMENTS_DATABASE.filter(x => x.name.toLowerCase().includes(q)).map(x => ({ type: 'agreement', data: x }));
    
    return [...ports, ...rails, ...dcs, ...cables, ...energy, ...agreements];
  }, [searchQuery]);

  return (
    <div className="w-full h-full relative flex text-slate-100 font-sans overflow-hidden">
      
      {/* ── Left Sidebar (Bloomberg/SaaS Terminal) ── */}
      <div className="w-[360px] h-full bg-slate-900 border-r border-slate-800 flex flex-col z-[400] select-none pointer-events-auto">
        
        {/* Terminal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-cyan-400 font-mono tracking-[0.25em] uppercase font-bold flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '12s' }} />
              Logistics Terminal
            </span>
            <button 
              onClick={() => setMapStyle(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-1 hover:bg-slate-800 rounded transition-all border border-slate-700/50 text-slate-400 hover:text-white"
              title="Toggle Map Base"
            >
              {mapStyle === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
          <h2 className="font-sans font-bold text-base tracking-tight mt-2 uppercase">
            GEOPOLITICAL INTELLIGENCE
          </h2>
        </div>

        {/* Global Search Bar */}
        <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/20">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search global assets, agreements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 font-sans transition-all"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded scrollbar-thin">
              {searchResults.map((res: any, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedAsset({ type: res.type, data: res.data });
                    if (res.data.coordinates && typeof res.data.coordinates[0] === 'number') {
                      mapRef.current?.flyTo({ center: res.data.coordinates, zoom: 6.0 });
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-800 text-[11px] border-b border-slate-800/40 last:border-b-0 flex justify-between items-center"
                >
                  <span className="truncate font-sans text-slate-350">{res.data.name}</span>
                  <span className="font-mono text-[9px] text-cyan-400 uppercase tracking-widest bg-cyan-950/40 border border-cyan-800/40 px-1 rounded">{res.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layer Filters control list */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 brutalist-scrollbar">
          <div>
            <h3 className="font-mono text-[9.5px] text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Interactive Layers & Overlays
            </h3>
            
            <div className="flex flex-col gap-2">
              {[
                { key: 'ports', label: 'Maritime Ports', color: 'border-sky-500 text-sky-400 bg-sky-950/10', dotColor: 'bg-sky-500', icon: <Anchor size={12} /> },
                { key: 'railways', label: 'Logistics Railways', color: 'border-slate-500 text-slate-400 bg-slate-950/10', dotColor: 'bg-slate-400', icon: <Layers size={12} /> },
                { key: 'datacenters', label: 'Data Processing Hubs', color: 'border-teal-500 text-teal-400 bg-teal-950/10', dotColor: 'bg-teal-500', icon: <Database size={12} /> },
                { key: 'cables', label: 'Subsea Fiber Cables', color: 'border-cyan-500 text-cyan-400 bg-cyan-950/10', dotColor: 'bg-cyan-500', icon: <Cpu size={12} /> },
                { key: 'energy', label: 'Energy Pipelines & Grids', color: 'border-amber-500 text-amber-400 bg-amber-950/10', dotColor: 'bg-amber-500', icon: <Zap size={12} /> },
                { key: 'ftas', label: 'Trade Agreements (FTAs)', color: 'border-emerald-500 text-emerald-400 bg-emerald-950/10', dotColor: 'bg-emerald-500', icon: <Users size={12} /> },
                { key: 'defense', label: 'Defense & Security Shields', color: 'border-rose-500 text-rose-400 bg-rose-950/10', dotColor: 'bg-rose-500', icon: <Shield size={12} /> }
              ].map(lyr => (
                <button
                  key={lyr.key}
                  onClick={() => toggleLayer(lyr.key)}
                  className={`flex items-center justify-between p-2.5 border text-left transition-all ${
                    activeLayers[lyr.key]
                      ? `${lyr.color} font-bold`
                      : 'bg-slate-950/40 border-slate-800 text-slate-500 hover:border-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider">
                    {lyr.icon}
                    {lyr.label}
                  </div>
                  <span className={`w-2 h-2 rounded-full ${activeLayers[lyr.key] ? lyr.dotColor : 'bg-slate-800'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Infrastructure Health Indicator */}
          <div className="bg-slate-950/40 border border-slate-800 p-4 font-mono text-[10px]">
            <h4 className="text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <ActivitySquare className="w-3.5 h-3.5 text-cyan-500" />
              Corridor Flow Metrics
            </h4>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span>Tracked Container Volume</span>
                  <span className="text-cyan-400 font-bold">144.2K TEU/d</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500" style={{ width: '78%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Energy Pipeline Capacity</span>
                  <span className="text-amber-400 font-bold">5.8M Bbl/d</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500" style={{ width: '92%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span>Digital Grid Bandwidth</span>
                  <span className="text-emerald-400 font-bold">420 Tb/s</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: '64%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Ticker Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 h-16 flex items-center overflow-hidden">
          <div className="flex items-start gap-2.5">
            <span className="px-1.5 py-0.5 bg-cyan-950 border border-cyan-800 text-[8px] font-mono text-cyan-400 font-bold uppercase tracking-widest rounded animate-pulse">
              Feed
            </span>
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.p
                  key={tickerIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="font-mono text-[9px] text-slate-400 leading-normal line-clamp-2"
                >
                  {NEWS_BULLETINS[tickerIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── Center Map Canvas ── */}
      <div className="flex-1 h-full relative">
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0 bg-slate-950" />
      </div>

      {/* ── Right Slide-over Drawer (Details Panel) ── */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-[400px] h-full bg-slate-900 border-l border-slate-800 z-[400] flex flex-col pointer-events-auto select-none font-sans"
          >
            
            {/* Header info */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-start">
              <div>
                <span className="text-[9px] text-cyan-400 font-mono tracking-widest uppercase font-bold flex items-center gap-1.5">
                  <MapPin size={11} className="animate-bounce" />
                  Asset Deep-Dive
                </span>
                <h2 className="font-sans font-bold text-lg mt-1 text-slate-100 uppercase tracking-tight leading-snug">
                  {selectedAsset.data.name}
                </h2>
                <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">
                  {'country' in selectedAsset.data ? selectedAsset.data.country : 'Multinational'}
                </span>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 hover:bg-slate-800 rounded transition-all text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Dynamic content rendering based on selected item type */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 brutalist-scrollbar">
              
              {selectedAsset.type === 'port' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-950/40 border border-slate-800 p-3 font-mono">
                      <div className="text-[8px] text-slate-500 uppercase">Annual Volume</div>
                      <div className="text-[13px] font-bold text-cyan-400 mt-1">{(selectedAsset.data as PortAsset).capacityText}</div>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 p-3 font-mono">
                      <div className="text-[8px] text-slate-500 uppercase">Congestion Rate</div>
                      <div className={`text-[13px] font-bold mt-1 ${
                        (selectedAsset.data as PortAsset).congestion === 'High' ? 'text-rose-500' :
                        (selectedAsset.data as PortAsset).congestion === 'Moderate' ? 'text-amber-500' :
                        'text-emerald-500'
                      }`}>
                        {(selectedAsset.data as PortAsset).congestion}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-xs border-t border-slate-800 pt-4">
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">UN/LOCODE:</span>
                      <span className="text-slate-200 font-bold">{(selectedAsset.data as PortAsset).unLocode}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Max Draft Depth:</span>
                      <span className="text-slate-200">{(selectedAsset.data as PortAsset).draft}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Avg Turnaround Time:</span>
                      <span className="text-slate-200">{(selectedAsset.data as PortAsset).turnaround}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Ownership/Operators:</span>
                      <span className="text-slate-200 text-right truncate max-w-[200px]" title={(selectedAsset.data as PortAsset).ownership}>
                        {(selectedAsset.data as PortAsset).ownership}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Live Tracked Vessels:</span>
                      <span className="text-emerald-400 font-bold">{(selectedAsset.data as PortAsset).vesselsTracked} Vessels</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      Live Geopolitical News Feed
                    </h3>
                    <div className="flex flex-col gap-2">
                      {(selectedAsset.data as PortAsset).headlines.map((headline, idx) => (
                        <div key={idx} className="bg-slate-950/60 border border-slate-800 p-3 font-mono text-[10px] leading-relaxed text-slate-350">
                          {headline}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedAsset.type === 'railway' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-950/40 border border-slate-800 p-3 font-mono">
                      <div className="text-[8px] text-slate-500 uppercase">Operational Link Length</div>
                      <div className="text-[13px] font-bold text-cyan-400 mt-1">{(selectedAsset.data as RailwayAsset).length}</div>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 p-3 font-mono">
                      <div className="text-[8px] text-slate-500 uppercase">Track Gauge</div>
                      <div className="text-[13px] font-bold text-slate-200 mt-1">{(selectedAsset.data as RailwayAsset).gauge}</div>
                    </div>
                  </div>

                  <div className="font-mono text-xs border-t border-slate-800 pt-4">
                    <h4 className="text-[9px] text-slate-500 uppercase mb-1">Corridor Segment Role</h4>
                    <p className="font-sans text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-3 border border-slate-800">
                      {(selectedAsset.data as RailwayAsset).provisions}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      Infrastructure Developments
                    </h3>
                    <div className="flex flex-col gap-2">
                      {(selectedAsset.data as RailwayAsset).headlines.map((h, idx) => (
                        <div key={idx} className="bg-slate-950/60 border border-slate-800 p-3 font-mono text-[10px] leading-relaxed text-slate-350">
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {selectedAsset.type === 'datacenter' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-950/40 border border-slate-800 p-3 font-mono">
                      <div className="text-[8px] text-slate-500 uppercase">System Density</div>
                      <div className="text-[13px] font-bold text-teal-400 mt-1">{(selectedAsset.data as DataCenterAsset).serversCount}</div>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 p-3 font-mono">
                      <div className="text-[8px] text-slate-500 uppercase">Tier Rating</div>
                      <div className="text-[13px] font-bold text-slate-200 mt-1">{(selectedAsset.data as DataCenterAsset).tier}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-xs border-t border-slate-800 pt-4">
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Operating Entity:</span>
                      <span className="text-slate-200 font-bold">{(selectedAsset.data as DataCenterAsset).operator}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Processing Location:</span>
                      <span className="text-slate-200">{(selectedAsset.data as DataCenterAsset).city}, {(selectedAsset.data as DataCenterAsset).country}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Security / Sovereignty Tier:</span>
                      <span className="text-emerald-400 font-bold">{(selectedAsset.data as DataCenterAsset).securityRating}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedAsset.type === 'cable' && (
                <div className="flex flex-col gap-5">
                  <div className="bg-slate-950/40 border border-slate-800 p-4 font-mono text-xs">
                    <h4 className="text-[9px] text-slate-500 uppercase mb-2">Landing Core Stations</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedAsset.data as CableAsset).landingPoints.map((pt, idx) => (
                        <span key={idx} className="bg-slate-900 border border-slate-800 px-2 py-0.5 text-[9px] text-slate-300 font-sans">
                          {pt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-xs border-t border-slate-800 pt-4">
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Status:</span>
                      <span className="text-cyan-400 font-bold">{(selectedAsset.data as CableAsset).status}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Consortium Owners:</span>
                      <span className="text-slate-200 text-right max-w-[220px] truncate">{(selectedAsset.data as CableAsset).owners}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Technical Supplier:</span>
                      <span className="text-slate-200">{(selectedAsset.data as CableAsset).suppliers}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Trusted Connectivity Vetting:</span>
                      <span className="text-emerald-400 font-bold">{(selectedAsset.data as CableAsset).securityRating}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedAsset.type === 'energy' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-950/40 border border-slate-800 p-3 font-mono">
                      <div className="text-[8px] text-slate-500 uppercase">Product Type</div>
                      <div className="text-[13px] font-bold text-amber-400 mt-1">{(selectedAsset.data as EnergyAsset).product}</div>
                    </div>
                    <div className="bg-slate-950/40 border border-slate-800 p-3 font-mono">
                      <div className="text-[8px] text-slate-500 uppercase">Throughput Capacity</div>
                      <div className="text-[13px] font-bold text-emerald-400 mt-1">{(selectedAsset.data as EnergyAsset).capacity}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-xs border-t border-slate-800 pt-4">
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Infrastructure Type:</span>
                      <span className="text-slate-200 font-bold">{(selectedAsset.data as EnergyAsset).type}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Operational Status:</span>
                      <span className="text-slate-200">{(selectedAsset.data as EnergyAsset).status}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Connecting Grid Route:</span>
                      <span className="text-slate-200 text-right max-w-[200px] truncate" title={(selectedAsset.data as EnergyAsset).route}>
                        {(selectedAsset.data as EnergyAsset).route}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Promoters & Engineering:</span>
                      <span className="text-slate-200 text-right max-w-[200px] truncate">{(selectedAsset.data as EnergyAsset).promoters}</span>
                    </div>
                  </div>
                </div>
              )}

              {(selectedAsset.type === 'fta' || selectedAsset.type === 'defense') && (
                <div className="flex flex-col gap-5">
                  <div className="bg-slate-950/40 border border-slate-800 p-4 font-mono text-xs">
                    <h4 className="text-[9px] text-slate-500 uppercase mb-2">Sovereign Signatories</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedAsset.data as AgreementAsset).members.map((m, idx) => (
                        <span key={idx} className="bg-slate-900 border border-slate-800 px-2 py-0.5 text-[9px] text-slate-350">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 font-mono text-xs border-t border-slate-800 pt-4">
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Treaty Type:</span>
                      <span className="text-slate-200 font-bold">{(selectedAsset.data as AgreementAsset).type}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Signing/Launch Year:</span>
                      <span className="text-slate-200">{(selectedAsset.data as AgreementAsset).signedYear}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[8.5px] block mb-0.5">Core Provisions</span>
                      <span className="text-slate-300 font-sans text-xs bg-slate-950/40 p-2.5 border border-slate-800 block leading-relaxed">
                        {(selectedAsset.data as AgreementAsset).provisions}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase text-[8.5px] block mb-0.5">Economic/Geopolitical Benefits</span>
                      <span className="text-slate-300 font-sans text-xs bg-slate-950/40 p-2.5 border border-slate-800 block leading-relaxed">
                        {(selectedAsset.data as AgreementAsset).benefits}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      Treaty Developments
                    </h3>
                    <div className="flex flex-col gap-2">
                      {(selectedAsset.data as AgreementAsset).developments.map((dev, idx) => (
                        <div key={idx} className="bg-slate-950/60 border border-slate-800 p-3 font-mono text-[10px] leading-relaxed text-slate-350">
                          {dev}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Focus Button */}
              {selectedAsset.data.coordinates && (
                <button
                  onClick={() => {
                    const map = mapRef.current;
                    if (!map) return;
                    
                    const coords = 
                      typeof selectedAsset.data.coordinates[0] === 'number' 
                        ? selectedAsset.data.coordinates
                        : selectedAsset.data.coordinates[0];

                    map.flyTo({
                      center: coords,
                      zoom: selectedAsset.type === 'port' ? 7.5 : 5.0,
                      speed: 1.2
                    });
                  }}
                  className="w-full py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-bold uppercase tracking-widest text-center text-cyan-400 transition-all select-none"
                >
                  Focus Coordinates
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
