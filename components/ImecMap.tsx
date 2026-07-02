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
  coordinates: [number, number][][][]; // Multi-polygons for shading
}

// ── Static Database (Direct alignment with Google Briefing Doc) ──

const PORTS_DATABASE: PortAsset[] = [
  {
    id: 'jnpt',
    name: 'Jawaharlal Nehru Port (JNPT), Mumbai',
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
    name: 'Mumbai Port',
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
      'Mumbai Port undergoes major bulk/liquid capacity transformation.',
      'Infrastructure updates approved for western industrial trade routes.'
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
    ownership: 'Adani Group (India) 70% / Gadot Group (Israel) 30% | Chinese state-owned SIPG operates adjacent Bay Port under 25-yr lease.',
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
    provisions: 'Extends from Al Haditha Saudi railhead into Jordanian rail network.',
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

// Table 5: Country-based Data Center Sovereign Ecosystems
const DATA_CENTERS_DATABASE: DataCenterAsset[] = [
  { id: 'dc_india', name: 'India Sovereign Data Ecosystem', city: 'Mumbai / Chennai / Noida', country: 'India', coordinates: [72.8777, 19.0760], operator: 'CtrlS, Nxtra, Yotta, NTT, AWS, Google', serversCount: '150+ Facilities', tier: 'Tier III / IV Scale', securityRating: 'Sovereign-Ready / FDI Secure' },
  { id: 'dc_uae', name: 'UAE Regional Aggregator Hub', city: 'Dubai / Abu Dhabi', country: 'UAE', coordinates: [54.3773, 24.4539], operator: 'Khazna, Equinix, Moro Hub, Microsoft, AWS', serversCount: '50+ Facilities', tier: 'Tier III / IV Hub', securityRating: 'Premier Regional Data Aggregator' },
  { id: 'dc_saudi', name: 'Saudi Arabia Sovereign Cloud', city: 'Riyadh / Jeddah / NEOM', country: 'Saudi Arabia', coordinates: [46.7219, 24.6877], operator: 'center3 (stc group), Mobily, NEOM Cloud', serversCount: '35+ Facilities', tier: 'Tier IV Cloud Core', securityRating: 'Sovereign Cloud Localisation' },
  { id: 'dc_jordan', name: 'Jordan Terrestrial Bridge', city: 'Aqaba / Amman', country: 'Jordan', coordinates: [35.9304, 31.9454], operator: 'Aqaba IX, Naitel Gateway', serversCount: '5–10 Facilities', tier: 'Tier III Edge', securityRating: 'Critical Red Sea Bridge Link' },
  { id: 'dc_israel', name: 'Israel Cyber & AI Hub', city: 'Tel Aviv / Haifa', country: 'Israel', coordinates: [34.7818, 32.0853], operator: 'Serverfarm, EdgeConneX, AWS, Google Cloud', serversCount: '30+ Facilities', tier: 'Tier III R&D Edge', securityRating: 'Cybersecurity R&D Hub' },
  { id: 'dc_greece', name: 'Greece EU Digital Gateway', city: 'Athens / Chania', country: 'Greece', coordinates: [23.7275, 37.9838], operator: 'Digital Realty, DATA4, Microsoft Hub', serversCount: '15+ Facilities', tier: 'Tier III Gateway', securityRating: 'EU Digital Gateway' },
  { id: 'dc_italy', name: 'Italy Southern Digital Axis', city: 'Milan / Rome / Palermo', country: 'Italy', coordinates: [9.1900, 45.4642], operator: 'Aruba, Sparkle, Equinix, Vantage', serversCount: '135+ Facilities', tier: 'Tier IV Edge Cluster', securityRating: 'Southern European Axis' },
  { id: 'dc_france', name: 'France Connectivity Capital', city: 'Marseille / Paris', country: 'France', coordinates: [5.3698, 43.2965], operator: 'OVHcloud, Orange, Digital Realty, Equinix', serversCount: '260+ Facilities', tier: 'Tier IV Sovereign Core', securityRating: 'Global Connectivity Capital' }
];

// Table 4: Subsea Cables
const CABLES_DATABASE: CableAsset[] = [
  {
    id: 'blue_raman',
    name: 'Blue & Raman Cable System',
    landingPoints: ['Genoa (Italy)', 'Marseille (France)', 'Chania (Greece)', 'Tel Aviv (Israel)', 'Aqaba (Jordan)', 'Dubah (Saudi Arabia)', 'Mumbai (India)'],
    status: 'Under Development',
    owners: 'Google, Sparkle, Zain Omantel Intl.',
    suppliers: 'Alcatel Submarine Networks (ASN)',
    securityRating: 'Trusted Connectivity (EU Toolbox Approved)',
    coordinates: [[5.3698, 43.2965], [8.94, 44.4], [12.0, 37.0], [23.63, 37.94], [34.98, 32.79], [35.01, 29.52], [39.16, 21.46], [54.01, 16.94], [72.946, 18.948]]
  },
  {
    id: 'emc_cable',
    name: 'East to Med Corridor (EMC)',
    landingPoints: ['Marseille (France)', 'Genoa (Italy)', 'Athens (Greece)', 'Tel Aviv (Israel)', 'Jeddah (Saudi Arabia)'],
    status: 'Active',
    owners: 'EMC Subsea Cable Co. (stc, Cyta, PPC, TTSA)',
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
  },
  {
    id: 'medusa_cable',
    name: 'Medusa Cable',
    landingPoints: ['Portugal', 'Spain', 'Marseille (France)', 'Italy', 'Cyprus', 'Egypt', 'Syria', 'Lebanon'],
    status: 'Active',
    owners: 'AFR-IX telecom',
    suppliers: 'Alcatel Submarine Networks (ASN)',
    securityRating: 'EU Strategic Infrastructure Approved',
    coordinates: [[-9.13, 38.72], [2.17, 41.38], [5.36, 43.29], [13.36, 38.11], [33.0, 34.5], [31.2, 30.0], [35.8, 34.9], [35.5, 33.8]]
  },
  {
    id: 'greenmed_cable',
    name: 'GreenMed System',
    landingPoints: ['Genoa (Italy)', 'Balkans', 'Chania (Greece)', 'Aqaba (Jordan)'],
    status: 'Active',
    owners: 'Sparkle',
    suppliers: 'Alcatel Submarine Networks (ASN), Elettra Tlc',
    securityRating: 'EU Sovereign Security Compliance',
    coordinates: [[8.94, 44.40], [18.0, 42.0], [24.0, 35.5], [35.01, 29.52]]
  },
  {
    id: 'eu_africa_india',
    name: 'EU-Africa-India Corridor',
    landingPoints: ['Marseille (France)', 'Djibouti', 'Mumbai (India)'],
    status: 'Active',
    owners: 'Géant, EIB, European Commission',
    suppliers: 'European private sector consortia (ASN-led)',
    securityRating: 'Multilateral Trusted Security Shield',
    coordinates: [[5.36, 43.29], [43.14, 11.57], [72.946, 18.948]]
  }
];

// Tables 6 & 7: Energy Integration
const ENERGY_DATABASE: EnergyAsset[] = [
  {
    id: 'eastmed_pipe',
    name: 'EastMed Pipeline Project',
    type: 'Pipeline',
    product: 'Natural Gas (H2-ready)',
    capacity: '10 BCM / Year',
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
    route: 'Algeria ↔ Tunisia ↔ Italy ↔ Austria ↔ Germany',
    promoters: 'Snam (Italy)',
    coordinates: [[3.27, 32.93], [8.83, 35.17], [12.58, 37.65], [12.8, 42.0], [9.19, 45.46]]
  },
  {
    id: 'h2_poseidon',
    name: 'H2Poseidon',
    type: 'Pipeline',
    product: '100% Green Hydrogen',
    capacity: '2.5 Million Tonnes / Year',
    status: 'Planned',
    route: 'Greece ↔ Italy (Ionian Sea Crossing)',
    promoters: 'IGI Poseidon (Edison, DEPA)',
    coordinates: [[20.26, 39.50], [18.49, 40.14]]
  },
  {
    id: 'saudi_ew_pipeline',
    name: 'Saudi East-West Crude Pipeline',
    type: 'Pipeline',
    product: 'Crude Oil / NGLs',
    capacity: '5.0 Million Barrels / Day',
    status: 'Existing (Bypasses Strait of Hormuz)',
    route: 'Saudi Eastern Province (Abqaiq) ↔ Yanbu (Red Sea)',
    promoters: 'Saudi Aramco',
    coordinates: [[49.68, 25.93], [46.72, 24.64], [38.22, 24.09]]
  },
  {
    id: 'neom_h2',
    name: 'NEOM Green Hydrogen Export',
    type: 'Pipeline',
    product: 'Ammonia / H2 Export',
    capacity: '2.5 Million Tonnes / Year equivalent',
    status: 'Under Construction',
    route: 'Saudi Arabia (NEOM) ↔ Global export via ships/pipes',
    promoters: 'ACWA Power, Air Products',
    coordinates: [[35.0, 28.5], [34.0, 27.5]]
  },
  {
    id: 'great_sea_interconnector',
    name: 'Great Sea Interconnector',
    type: 'HVDC Interconnector',
    product: 'Electricity Grid',
    capacity: '2,000 MW (Offshore HVDC)',
    status: 'Under Construction (Expected 2029)',
    route: 'Israel ↔ Cyprus ↔ Crete (Greece)',
    promoters: 'Nexans / EuroAsia Interconnector / EU PCI',
    coordinates: [[34.8, 32.0], [33.0, 34.5], [24.5, 35.0], [23.8, 37.8]]
  },
  {
    id: 'egypt_ksa_link',
    name: 'Egypt-KSA Interconnection',
    type: 'HVDC Interconnector',
    product: 'Electricity Grid',
    capacity: '3,000 MW',
    status: 'Final Stage (Phase 1 operational 2025)',
    route: 'Saudi Arabia ↔ Egypt',
    promoters: 'Saudi Electricity Company / ONGC Egypt',
    coordinates: [[46.72, 24.64], [36.56, 28.38], [34.8, 28.2], [31.2, 30.0]]
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
  },
  {
    id: 'india_saudi_hvdc',
    name: 'India–Saudi Arabia HVDC Link',
    type: 'HVDC Interconnector',
    product: 'Electricity Grid',
    capacity: '2,000 MW',
    status: 'Feasibility Stage',
    route: 'India (Mundra) ↔ Saudi Arabia',
    promoters: 'Power Grid Corporation of India',
    coordinates: [[69.73, 22.84], [54.01, 16.94], [46.72, 24.64]]
  },
  {
    id: 'elmed_interconnector',
    name: 'ELMED Interconnector',
    type: 'HVDC Interconnector',
    product: 'Electricity Grid',
    capacity: '600 MW',
    status: 'Permitting (Expected 2028)',
    route: 'Tunisia ↔ Sicily (Italy)',
    promoters: 'Terna, built by Prysmian',
    coordinates: [[10.18, 36.8], [12.58, 37.65]]
  },
  {
    id: 'gregy_interconnector',
    name: 'GREGY Interconnector',
    type: 'HVDC Interconnector',
    product: 'Electricity Grid',
    capacity: '3,000 MW',
    status: 'Feasibility Study',
    route: 'Egypt ↔ Greece',
    promoters: 'Elica Group (Copelouzos)',
    coordinates: [[31.2, 30.0], [23.63, 37.94]]
  },
  {
    id: 'eurogulf_interconnector',
    name: 'EuroGulf Interconnector',
    type: 'HVDC Interconnector',
    product: 'Electricity Grid',
    capacity: '2,000 MW',
    status: 'Under Consideration',
    route: 'Saudi Arabia ↔ Egypt ↔ Cyprus ↔ EU',
    promoters: 'EuroAsia Interconnector Group',
    coordinates: [[46.72, 24.64], [31.2, 30.0], [33.0, 34.5], [23.63, 37.94]]
  }
];

// Table 8: Strategic Defense Shields & Security Pacts
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

// Strategic Update Log Bulletins
const NEWS_BULLETINS = [
  'UPDATE: India-UAE CEPA trade volumes surge 15% in Q1 2026 under expanded tariff removals.',
  'INFRASTRUCTURE: Jordan standard-gauge rail network secures $2.3B UAE construction funding grant.',
  'RADAR: UAE Akashteer tactical air defense canopy unifies regional Gulf multi-sensor monitoring.',
  'CABLES: EU Submarine Cable Security Toolbox implementation begins landing station audits.',
  'POWER: Egypt-KSA Interconnection (3000 MW) enters final load-balancing testing stage.',
  'SECURITY: EUNAVFOR Aspides Task Force increases naval escort frequencies through Red Sea corridors.',
  'PORT EXPANSION: Fujairah and Duqm fast-track container berths to absorb Hormuz bypass cargo.',
  'HYDROGEN: Algeria-Italy SoutH2 green hydrogen corridor files design updates to EU Commission.'
];

export default function ImecMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const loadedStyleRef = useRef<'light' | 'dark'>('light');

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

  const [mapStyle, setMapStyle] = useState<'dark' | 'light'>('light');
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
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  // ── Setup Sources & Layers (Mapbox) ───────────────────────
  const addMapLayersAndSources = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove existing sources/layers if reloading style
    const cleanupLayers = [
      'railways-built-layer', 'railways-proposed-layer', 'cables-layer', 'datacenters-layer',
      'pipelines-layer', 'hvdc-layer', 'ftas-layer', 'defense-layer'
    ];
    cleanupLayers.forEach(id => {
      if (map.getLayer(id)) map.removeLayer(id);
    });

    const cleanupSources = [
      'railways', 'subsea-cables', 'data-centers', 'energy-pipelines',
      'electricity-hvdc', 'ftas-source', 'defense-source'
    ];
    cleanupSources.forEach(id => {
      if (map.getSource(id)) map.removeSource(id);
    });

    // 1. Railways GeoJSON Source
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

    // 2. Cables GeoJSON Source
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

    // 3. Data Centers GeoJSON Source
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

    // 4. Energy Pipelines GeoJSON Source
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

    // 5. Electricity HVDC GeoJSON Source
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

    // 6. FTAs GeoJSON Polygons Source
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

    // 7. Defense GeoJSON Polygons Source
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

    // ── Render Layers (Muted Academic Colors) ──

    // FTAs shaded background (Soft Green Wash)
    map.addLayer({
      id: 'ftas-layer',
      type: 'fill',
      source: 'ftas-source',
      layout: { visibility: activeLayers.ftas ? 'visible' : 'none' },
      paint: { 'fill-color': '#16a34a', 'fill-opacity': 0.06, 'fill-outline-color': '#15803d' }
    });

    // Defense shaded background (Soft Dust-Red Wash)
    map.addLayer({
      id: 'defense-layer',
      type: 'fill',
      source: 'defense-source',
      layout: { visibility: activeLayers.defense ? 'visible' : 'none' },
      paint: { 'fill-color': '#b91c1c', 'fill-opacity': 0.06, 'fill-outline-color': '#991b1b' }
    });

    // Railways Built (Slate Solid Line - Separated to avoid Mapbox dash expression crash)
    map.addLayer({
      id: 'railways-built-layer',
      type: 'line',
      source: 'railways',
      filter: ['==', ['get', 'status'], 'Built'],
      layout: {
        visibility: activeLayers.railways ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#475569',
        'line-width': 2.5
      }
    });

    // Railways Proposed (Muted Crimson Dashed Line)
    map.addLayer({
      id: 'railways-proposed-layer',
      type: 'line',
      source: 'railways',
      filter: ['==', ['get', 'status'], 'Proposed'],
      layout: {
        visibility: activeLayers.railways ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: {
        'line-color': '#b91c1c',
        'line-width': 1.5,
        'line-dasharray': [4, 3]
      }
    });

    // Cables (Muted Deep Blue)
    map.addLayer({
      id: 'cables-layer',
      type: 'line',
      source: 'subsea-cables',
      layout: {
        visibility: activeLayers.cables ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: { 'line-color': '#0284c7', 'line-width': 2, 'line-opacity': 0.75 }
    });

    // Data Centers (Muted Sage Teal Node)
    map.addLayer({
      id: 'datacenters-layer',
      type: 'circle',
      source: 'data-centers',
      layout: { visibility: activeLayers.datacenters ? 'visible' : 'none' },
      paint: {
        'circle-radius': 5.5,
        'circle-color': '#0f766e',
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff'
      }
    });

    // Pipelines (Terracotta/Clay Orange Dashed)
    map.addLayer({
      id: 'pipelines-layer',
      type: 'line',
      source: 'energy-pipelines',
      layout: {
        visibility: activeLayers.energy ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: { 'line-color': '#b45309', 'line-width': 2, 'line-dasharray': [4, 3] }
    });

    // HVDC grids (Solid Green Line)
    map.addLayer({
      id: 'hvdc-layer',
      type: 'line',
      source: 'electricity-hvdc',
      layout: {
        visibility: activeLayers.energy ? 'visible' : 'none',
        'line-cap': 'round',
        'line-join': 'round'
      },
      paint: { 'line-color': '#16a34a', 'line-width': 2.5 }
    });

    // ── Interaction Listeners ──
    const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false });

    const hoverLayers = [
      { id: 'railways-built-layer', db: RAILWAYS_DATABASE, title: 'Railway Segment' },
      { id: 'railways-proposed-layer', db: RAILWAYS_DATABASE, title: 'Railway Segment' },
      { id: 'cables-layer', db: CABLES_DATABASE, title: 'Subsea Fiber Cable' },
      { id: 'datacenters-layer', db: DATA_CENTERS_DATABASE, title: 'Sovereign DC Ecosystem' },
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
            <div class="font-mono text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-0.5">${title}</div>
            <div class="font-sans font-bold text-xs text-slate-900 mb-0.5">${record.name}</div>
            <div class="font-mono text-[8px] text-slate-500">${'status' in record ? record.status : 'Active'}</div>
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
            'railways-built-layer': 'railway',
            'railways-proposed-layer': 'railway',
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
      // Zoom-based density controls
      const isVisible = 
        zoomLevel >= 6 ||
        (zoomLevel >= 4 && port.teu >= 1.5) ||
        (zoomLevel < 4 && port.teu >= 3.5);

      if (!isVisible) return;

      const el = document.createElement('div');
      el.className = 'relative flex items-center justify-center cursor-pointer group';

      const ringColor = 
        port.status === 'Active' ? 'border-slate-700 bg-slate-700/5' :
        port.status === 'Under Expansion' ? 'border-amber-700 bg-amber-700/5' :
        'border-gray-400 bg-gray-400/5';

      const dotColor = 
        port.status === 'Active' ? 'bg-slate-700' :
        port.status === 'Under Expansion' ? 'bg-amber-700' :
        'bg-gray-400';

      const markerSize = Math.max(10, Math.min(20, Math.sqrt(port.teu) * 4));
      const innerDotSize = Math.max(3, markerSize / 2.5);

      const isSelected = selectedAsset?.type === 'port' && selectedAsset.data.id === port.id;

      el.innerHTML = `
        <div class="absolute w-[200%] h-[200%] border rounded-full ${ringColor} ${isSelected ? 'scale-110 border-slate-900 border-2' : 'opacity-40'} transition-all"></div>
        <div class="relative rounded-full ${dotColor} flex items-center justify-center transition-all ${isSelected ? 'scale-110' : 'group-hover:scale-105'}" style="width: ${markerSize}px; height: ${markerSize}px;">
          <div class="rounded-full bg-white" style="width: ${innerDotSize}px; height: ${innerDotSize}px;"></div>
        </div>
        <div class="absolute top-[120%] bg-white text-slate-800 border border-slate-200 px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-wider uppercase pointer-events-none opacity-0 group-hover:opacity-100 shadow-sm transition-opacity whitespace-nowrap z-50">
          ${port.name}
        </div>
      `;

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedAsset({ type: 'port', data: port });
        map.flyTo({ center: port.coordinates, zoom: 6.5, speed: 1.0 });
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
    loadedStyleRef.current = mapStyle;

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

  // 1. Handle Map Style Changes (Light <-> Dark)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (loadedStyleRef.current !== mapStyle) {
      loadedStyleRef.current = mapStyle;
      const targetStyle = mapStyle === 'dark' 
        ? 'mapbox://styles/mapbox/dark-v11' 
        : 'mapbox://styles/mapbox/light-v11';

      map.setStyle(targetStyle);
      map.once('style.load', () => {
        // Re-add sources and layers because style reload wipes them out
        addMapLayersAndSources();
        updatePortMarkers();
      });
    }
  }, [mapStyle, mapLoaded]);

  // 2. Handle Layer Visibilities via Instant setLayoutProperty Updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const layerVisibilities: Record<string, string[]> = {
      railways: ['railways-built-layer', 'railways-proposed-layer'],
      datacenters: ['datacenters-layer'],
      cables: ['cables-layer'],
      energy: ['pipelines-layer', 'hvdc-layer'],
      ftas: ['ftas-layer'],
      defense: ['defense-layer']
    };

    Object.entries(layerVisibilities).forEach(([key, layerIds]) => {
      const isVisible = activeLayers[key] ? 'visible' : 'none';
      layerIds.forEach(id => {
        if (map.getLayer(id)) {
          map.setLayoutProperty(id, 'visibility', isVisible);
        }
      });
    });
  }, [activeLayers, mapLoaded]);

  // 3. Sync zoom-based clusters and port toggling
  useEffect(() => {
    updatePortMarkers();
  }, [zoomLevel, activeLayers.ports, selectedAsset, updatePortMarkers]);

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
    <div className="w-full h-full relative flex text-slate-800 font-sans overflow-hidden bg-gray-50">
      
      {/* ── Left Sidebar (Light Academic Theme) ── */}
      <div className="w-[360px] h-full bg-white border-r border-slate-200 flex flex-col z-[400] select-none pointer-events-auto shadow-sm">
        
        {/* Academic Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-slate-500 font-mono tracking-[0.2em] uppercase font-bold flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-slate-400" />
              IMEC Geopolitical radar
            </span>
            <button 
              onClick={() => setMapStyle(prev => prev === 'dark' ? 'light' : 'dark')}
              className="p-1 hover:bg-slate-200 rounded transition-all border border-slate-200 text-slate-500 hover:text-slate-900"
              title="Toggle Map Style"
            >
              {mapStyle === 'dark' ? <Sun size={12} /> : <Moon size={12} />}
            </button>
          </div>
          <h2 className="font-serif font-bold text-base tracking-tight mt-2 text-slate-950 uppercase leading-snug">
            Corridor Analytics
          </h2>
        </div>

        {/* Global Search Bar */}
        <div className="px-5 py-3 border-b border-slate-200/60 bg-slate-50/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-450" />
            <input
              type="text"
              placeholder="Filter infrastructure database..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 pl-8 pr-4 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-slate-400 transition-all font-sans"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="mt-1 max-h-36 overflow-y-auto bg-white border border-slate-200 rounded-none shadow-sm">
              {searchResults.map((res: any, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedAsset({ type: res.type, data: res.data });
                    if (res.data.coordinates && typeof res.data.coordinates[0] === 'number') {
                      mapRef.current?.flyTo({ center: res.data.coordinates, zoom: 6.0 });
                    }
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-[11px] border-b border-slate-100 last:border-b-0 flex justify-between items-center"
                >
                  <span className="truncate font-sans text-slate-700 font-medium">{res.data.name}</span>
                  <span className="font-mono text-[8px] text-slate-500 uppercase bg-slate-100 border border-slate-200 px-1 rounded">{res.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Layer Filters list */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 brutalist-scrollbar">
          <div>
            <h3 className="font-mono text-[9px] text-slate-450 uppercase tracking-widest mb-2.5 flex items-center gap-1.5 font-bold">
              <Layers className="w-3 h-3 text-slate-450" />
              Corridor Layer Matrices
            </h3>
            
            <div className="flex flex-col gap-1.5">
              {[
                { key: 'ports', label: 'Maritime Ports (TEU / MMT)', color: 'border-slate-400 text-slate-800 bg-slate-50', dotColor: 'bg-slate-700', icon: <Anchor size={11} className="text-slate-500" /> },
                { key: 'railways', label: 'Overland Railways (built/prop)', color: 'border-slate-400 text-slate-800 bg-slate-50', dotColor: 'bg-slate-600', icon: <Layers size={11} className="text-slate-500" /> },
                { key: 'datacenters', label: 'Digital Data Ecosystems', color: 'border-slate-400 text-slate-800 bg-slate-50', dotColor: 'bg-teal-700', icon: <Database size={11} className="text-slate-500" /> },
                { key: 'cables', label: 'Subsea Fiber Cables', color: 'border-slate-400 text-slate-800 bg-slate-50', dotColor: 'bg-sky-600', icon: <Cpu size={11} className="text-slate-500" /> },
                { key: 'energy', label: 'Energy pipelines & grids', color: 'border-slate-400 text-slate-800 bg-slate-50', dotColor: 'bg-amber-700', icon: <Zap size={11} className="text-slate-500" /> },
                { key: 'ftas', label: 'Trade Agreements (FTAs)', color: 'border-slate-400 text-slate-800 bg-slate-50', dotColor: 'bg-emerald-600', icon: <Users size={11} className="text-slate-500" /> },
                { key: 'defense', label: 'Defense Shields & Pacts', color: 'border-slate-400 text-slate-800 bg-slate-50', dotColor: 'bg-red-750', icon: <Shield size={11} className="text-slate-500" /> }
              ].map(lyr => (
                <button
                  key={lyr.key}
                  onClick={() => toggleLayer(lyr.key)}
                  className={`flex items-center justify-between px-3 py-2 border text-left rounded-none transition-all ${
                    activeLayers[lyr.key]
                      ? `${lyr.color} border-slate-400 font-bold shadow-sm`
                      : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-[9.5px] uppercase tracking-wider">
                    {lyr.icon}
                    {lyr.label}
                  </div>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeLayers[lyr.key] ? lyr.dotColor : 'bg-slate-200'}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Infrastructure Capacity Indicators */}
          <div className="bg-slate-50 border border-slate-200 p-4 font-mono text-[9px]">
            <h4 className="text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-1.5 font-bold">
              <ActivitySquare className="w-3 h-3 text-slate-500" />
              Sovereign Cargo Metrics
            </h4>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between mb-1 text-slate-600">
                  <span>Tracked Container Volume</span>
                  <span className="text-slate-800 font-bold">144.2K TEU/d</span>
                </div>
                <div className="w-full h-1 bg-slate-200 overflow-hidden">
                  <div className="h-full bg-slate-600" style={{ width: '78%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-slate-600">
                  <span>Energy Pipeline Capacity</span>
                  <span className="text-slate-800 font-bold">5.8M Bbl/d</span>
                </div>
                <div className="w-full h-1 bg-slate-200 overflow-hidden">
                  <div className="h-full bg-amber-700" style={{ width: '92%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-slate-600">
                  <span>Digital Grid Bandwidth</span>
                  <span className="text-slate-800 font-bold">420 Tb/s</span>
                </div>
                <div className="w-full h-1 bg-slate-200 overflow-hidden">
                  <div className="h-full bg-teal-700" style={{ width: '64%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Briefing Logs (Clean grey footer) */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 h-24 flex flex-col justify-center overflow-hidden">
          <div className="text-[8px] font-mono text-slate-450 uppercase tracking-widest mb-1.5 font-bold">
            Strategic briefing logs
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.p
                key={tickerIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25 }}
                className="font-mono text-[9px] text-slate-650 leading-relaxed font-medium"
              >
                {NEWS_BULLETINS[tickerIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Center Map Canvas ── */}
      <div className="flex-1 h-full relative">
        <div ref={mapContainerRef} className="w-full h-full absolute inset-0 bg-slate-105" />
      </div>

      {/* ── Right Slide-over Drawer (Details Panel) ── */}
      <AnimatePresence>
        {selectedAsset && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-[400px] h-full bg-white border-l border-slate-200 z-[400] flex flex-col pointer-events-auto select-none"
          >
            
            {/* Header info */}
            <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50">
              <div>
                <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold flex items-center gap-1.5">
                  <MapPin size={10} className="text-slate-450" />
                  Asset Matrix Deep-Dive
                </span>
                <h2 className="font-serif font-bold text-base mt-1 text-slate-900 uppercase tracking-tight leading-snug">
                  {selectedAsset.data.name}
                </h2>
                <span className="font-mono text-[9px] text-slate-450 uppercase tracking-widest font-semibold mt-0.5 block">
                  {'country' in selectedAsset.data ? selectedAsset.data.country : 'Multinational Axis'}
                </span>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                className="p-1 hover:bg-slate-200 rounded transition-all text-slate-400 hover:text-slate-700"
              >
                <X size={15} />
              </button>
            </div>

            {/* Dynamic content rendering based on selected item type */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 brutalist-scrollbar bg-white">
              
              {selectedAsset.type === 'port' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50 border border-slate-200 p-3 font-mono">
                      <div className="text-[8px] text-slate-450 uppercase font-semibold">Max capacity</div>
                      <div className="text-[12px] font-bold text-slate-800 mt-1">{(selectedAsset.data as PortAsset).capacityText}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 font-mono">
                      <div className="text-[8px] text-slate-450 uppercase font-semibold">Congestion Index</div>
                      <div className={`text-[12px] font-bold mt-1 ${
                        (selectedAsset.data as PortAsset).congestion === 'High' ? 'text-red-700' :
                        (selectedAsset.data as PortAsset).congestion === 'Moderate' ? 'text-amber-700' :
                        'text-emerald-700'
                      }`}>
                        {(selectedAsset.data as PortAsset).congestion}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-xs border-t border-slate-200 pt-4">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">UN/LOCODE Identifier:</span>
                      <span className="text-slate-800 font-bold">{(selectedAsset.data as PortAsset).unLocode}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Max Draft Depth:</span>
                      <span className="text-slate-800">{(selectedAsset.data as PortAsset).draft}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Avg Turnaround Metrics:</span>
                      <span className="text-slate-800">{(selectedAsset.data as PortAsset).turnaround}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Ownership / Operators:</span>
                      <span className="text-slate-700 text-right truncate max-w-[200px]" title={(selectedAsset.data as PortAsset).ownership}>
                        {(selectedAsset.data as PortAsset).ownership}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-450 font-medium">Vessels In Port (24h):</span>
                      <span className="text-slate-850 font-bold">{(selectedAsset.data as PortAsset).vesselsTracked} Tracked</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-bold">
                      <Activity className="w-3 h-3 text-slate-450" />
                      Geoeconomic updates
                    </h3>
                    <div className="flex flex-col gap-2">
                      {(selectedAsset.data as PortAsset).headlines.map((headline, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3 font-mono text-[9.5px] leading-relaxed text-slate-650 font-medium">
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
                    <div className="bg-slate-50 border border-slate-200 p-3 font-mono">
                      <div className="text-[8px] text-slate-450 uppercase font-semibold">Track Length</div>
                      <div className="text-[12px] font-bold text-slate-800 mt-1">{(selectedAsset.data as RailwayAsset).length}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 font-mono">
                      <div className="text-[8px] text-slate-450 uppercase font-semibold">Track Gauge</div>
                      <div className="text-[12px] font-bold text-slate-700 mt-1">{(selectedAsset.data as RailwayAsset).gauge}</div>
                    </div>
                  </div>

                  <div className="font-mono text-xs border-t border-slate-200 pt-4">
                    <h4 className="text-[8.5px] text-slate-450 uppercase mb-1 font-bold">Segment Description</h4>
                    <p className="font-sans text-[11.5px] text-slate-750 leading-relaxed bg-slate-50 p-3 border border-slate-200">
                      {(selectedAsset.data as RailwayAsset).provisions}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-bold">
                      <Activity className="w-3 h-3 text-slate-450" />
                      Infrastructure Developments
                    </h3>
                    <div className="flex flex-col gap-2">
                      {(selectedAsset.data as RailwayAsset).headlines.map((h, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3 font-mono text-[9.5px] leading-relaxed text-slate-650 font-medium">
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
                    <div className="bg-slate-50 border border-slate-200 p-3 font-mono">
                      <div className="text-[8px] text-slate-450 uppercase font-semibold">Ecosystem Density</div>
                      <div className="text-[12px] font-bold text-slate-800 mt-1">{(selectedAsset.data as DataCenterAsset).serversCount}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 font-mono">
                      <div className="text-[8px] text-slate-450 uppercase font-semibold">Tier Metrics</div>
                      <div className="text-[12px] font-bold text-slate-700 mt-1">{(selectedAsset.data as DataCenterAsset).tier}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-xs border-t border-slate-200 pt-4">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Dominant Operators:</span>
                      <span className="text-slate-800 text-right max-w-[220px] truncate" title={(selectedAsset.data as DataCenterAsset).operator}>
                        {(selectedAsset.data as DataCenterAsset).operator}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Hub Locations:</span>
                      <span className="text-slate-850 font-medium">{(selectedAsset.data as DataCenterAsset).city}, {(selectedAsset.data as DataCenterAsset).country}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-450 font-medium">Security / Sovereignty Tier:</span>
                      <span className="text-teal-700 font-bold">{(selectedAsset.data as DataCenterAsset).securityRating}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedAsset.type === 'cable' && (
                <div className="flex flex-col gap-5">
                  <div className="bg-slate-50 border border-slate-200 p-4 font-mono text-xs">
                    <h4 className="text-[8.5px] text-slate-450 uppercase mb-2 font-bold">Landing Core Stations</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedAsset.data as CableAsset).landingPoints.map((pt, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 text-[9px] text-slate-700 font-sans shadow-sm font-medium">
                          {pt}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-xs border-t border-slate-200 pt-4">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Deployment Status:</span>
                      <span className="text-slate-800 font-bold">{(selectedAsset.data as CableAsset).status}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Consortium Owners:</span>
                      <span className="text-slate-800 text-right max-w-[220px] truncate" title={(selectedAsset.data as CableAsset).owners}>
                        {(selectedAsset.data as CableAsset).owners}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Technical Supplier:</span>
                      <span className="text-slate-800">{(selectedAsset.data as CableAsset).suppliers}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-450 font-medium">Trusted Vetting:</span>
                      <span className="text-sky-750 font-bold">{(selectedAsset.data as CableAsset).securityRating}</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedAsset.type === 'energy' && (
                <div className="flex flex-col gap-5">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="bg-slate-50 border border-slate-200 p-3 font-mono">
                      <div className="text-[8px] text-slate-450 uppercase font-semibold">Product Type</div>
                      <div className="text-[12px] font-bold text-amber-700 mt-1">{(selectedAsset.data as EnergyAsset).product}</div>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 p-3 font-mono">
                      <div className="text-[8px] text-slate-450 uppercase font-semibold">Throughput Metric</div>
                      <div className="text-[12px] font-bold text-emerald-700 mt-1">{(selectedAsset.data as EnergyAsset).capacity}</div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 font-mono text-xs border-t border-slate-200 pt-4">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Infrastructure Grid Type:</span>
                      <span className="text-slate-800 font-bold">{(selectedAsset.data as EnergyAsset).type}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Operational Status:</span>
                      <span className="text-slate-800">{(selectedAsset.data as EnergyAsset).status}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Connecting Grid Route:</span>
                      <span className="text-slate-700 text-right max-w-[200px] truncate" title={(selectedAsset.data as EnergyAsset).route}>
                        {(selectedAsset.data as EnergyAsset).route}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-450 font-medium">Grid Promoters & Engineering:</span>
                      <span className="text-slate-700 text-right max-w-[200px] truncate" title={(selectedAsset.data as EnergyAsset).promoters}>
                        {(selectedAsset.data as EnergyAsset).promoters}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {(selectedAsset.type === 'fta' || selectedAsset.type === 'defense') && (
                <div className="flex flex-col gap-5">
                  <div className="bg-slate-50 border border-slate-200 p-4 font-mono text-xs">
                    <h4 className="text-[8.5px] text-slate-450 uppercase mb-2 font-bold font-mono">Sovereign Signatories</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedAsset.data as AgreementAsset).members.map((m, idx) => (
                        <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 text-[9px] text-slate-750 font-sans shadow-sm font-medium">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 font-mono text-xs border-t border-slate-200 pt-4">
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Treaty Type:</span>
                      <span className="text-slate-800 font-bold">{(selectedAsset.data as AgreementAsset).type}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-450 font-medium">Signing / Launch Year:</span>
                      <span className="text-slate-800">{(selectedAsset.data as AgreementAsset).signedYear}</span>
                    </div>
                    <div>
                      <span className="text-slate-450 uppercase text-[8px] block mb-0.5 font-bold">Core Provisions</span>
                      <span className="text-slate-700 font-sans text-xs bg-slate-50 p-2.5 border border-slate-200 block leading-relaxed">
                        {(selectedAsset.data as AgreementAsset).provisions}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-450 uppercase text-[8px] block mb-0.5 font-bold">Geopolitical & Economic Benefits</span>
                      <span className="text-slate-700 font-sans text-xs bg-slate-50 p-2.5 border border-slate-200 block leading-relaxed">
                        {(selectedAsset.data as AgreementAsset).benefits}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5 font-bold">
                      <Activity className="w-3 h-3 text-slate-450" />
                      Treaty Developments
                    </h3>
                    <div className="flex flex-col gap-2">
                      {(selectedAsset.data as AgreementAsset).developments.map((dev, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3 font-mono text-[9.5px] leading-relaxed text-slate-650 font-medium">
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
                      center: coords as [number, number],
                      zoom: selectedAsset.type === 'port' ? 7.5 : 5.0,
                      speed: 1.0
                    });
                  }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 border border-slate-800 text-xs font-mono font-bold uppercase tracking-widest text-center text-white transition-all select-none"
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
