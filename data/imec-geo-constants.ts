// ============================================================
// IMEC Geospatial Intelligence Constants
// All static data for deck.gl layers — strictly typed
// ============================================================

const IMEC_MANDATE = "Memorandum of Understanding on the Principles of an India-Middle East-Europe Economic Corridor";

// ── Types ──────────────────────────────────────────────────

export interface SubseaCable {
  name: string;
  source: [number, number];
  target: [number, number];
  sourceColor: [number, number, number, number];
  targetColor: [number, number, number, number];
  status: string;
  owner: string;
  entity: string;
  mandate: string;
  ref: string;
}

export interface RailwayPath {
  name: string;
  path: [number, number][];
  status: 'operational' | 'proposed' | 'missing';
  color: [number, number, number];
  entity: string;
  mandate: string;
  ref?: string;
}

export interface DataCenterPoint {
  position: [number, number];
  facility: string;
  city: string;
  country: string;
  entity: string;
  mandate: string;
}

export type DemographicPoint = [number, number, number]; // [lng, lat, weight]

export interface CountryGroup {
  countries: string[];
  color: string;
  label?: string;
}

export interface FTAEntry {
  name: string;
  countries: string[];
  status: 'In Force' | 'Proposed';
  color: [number, number, number, number];
  ref: string;
}

export interface DefenceEntry {
  name: string;
  countries: string[];
  color: [number, number, number, number];
  ref: string;
}

// ── EU Member ISO-3 Codes ──────────────────────────────────

const EU_CODES: string[] = [
  'AUT','BEL','BGR','HRV','CYP','CZE','DNK','EST','FIN','FRA',
  'DEU','GRC','HUN','IRL','ITA','LVA','LTU','LUX','MLT','NLD',
  'POL','PRT','ROU','SVK','SVN','ESP','SWE',
];

// ── A. Subsea Cable Arc Data (ArcLayer) ────────────────────

export const SUBSEA_CABLES: SubseaCable[] = [
  {
    name: 'Blue Cable',
    source: [5.3698, 43.2965],
    target: [35.0078, 29.5267],
    sourceColor: [16, 185, 129, 255],
    targetColor: [16, 185, 129, 255],
    status: 'Active',
    owner: 'Google / Sparkle',
    entity: 'Google / Sparkle',
    mandate: IMEC_MANDATE,
    ref: 'https://www.submarinecablemap.com/submarine-cable/blue',
  },
  {
    name: 'Blue Cable — Genoa Spur',
    source: [5.3698, 43.2965],
    target: [8.9463, 44.4056],
    sourceColor: [16, 185, 129, 255],
    targetColor: [16, 185, 129, 255],
    status: 'Active',
    owner: 'Sparkle',
    entity: 'Sparkle',
    mandate: IMEC_MANDATE,
    ref: 'https://www.submarinecablemap.com/submarine-cable/blue',
  },
  {
    name: 'Blue Cable — Crete–Cyprus',
    source: [24.43, 35.02],
    target: [32.73, 34.68],
    sourceColor: [16, 185, 129, 255],
    targetColor: [16, 185, 129, 255],
    status: 'Active',
    owner: 'Sparkle / Cyta',
    entity: 'Sparkle / Cyta',
    mandate: IMEC_MANDATE,
    ref: 'https://www.submarinecablemap.com/submarine-cable/blue',
  },
  {
    name: 'Blue Cable — Athens–Crete',
    source: [23.6371, 37.9475],
    target: [24.43, 35.02],
    sourceColor: [16, 185, 129, 255],
    targetColor: [16, 185, 129, 255],
    status: 'Active',
    owner: 'Sparkle',
    entity: 'Sparkle',
    mandate: IMEC_MANDATE,
    ref: 'https://www.submarinecablemap.com/submarine-cable/blue',
  },
  {
    name: 'Blue Cable — Cyprus–Aqaba',
    source: [32.73, 34.68],
    target: [35.0078, 29.5267],
    sourceColor: [16, 185, 129, 255],
    targetColor: [16, 185, 129, 255],
    status: 'Active',
    owner: 'Aqaba Digital Hub',
    entity: 'Aqaba Digital Hub',
    mandate: IMEC_MANDATE,
    ref: 'https://www.submarinecablemap.com/submarine-cable/blue',
  },
  {
    name: 'Raman Cable',
    source: [35.0078, 29.5267],
    target: [72.8774, 19.0761],
    sourceColor: [14, 165, 233, 255],
    targetColor: [14, 165, 233, 255],
    status: 'Under Construction',
    owner: 'Google / Sparkle / Zain Omantel',
    entity: 'Google / Sparkle / Zain Omantel',
    mandate: IMEC_MANDATE,
    ref: 'https://www.submarinecablemap.com/submarine-cable/raman',
  },
  {
    name: 'Raman Cable — Duba Spur',
    source: [35.0078, 29.5267],
    target: [36.65, 27.23],
    sourceColor: [14, 165, 233, 255],
    targetColor: [14, 165, 233, 255],
    status: 'Under Construction',
    owner: 'Google / Sparkle',
    entity: 'Google / Sparkle',
    mandate: IMEC_MANDATE,
    ref: 'https://www.submarinecablemap.com/submarine-cable/raman',
  },
  {
    name: 'Raman Cable — Djibouti Spur',
    source: [36.65, 27.23],
    target: [43.15, 11.57],
    sourceColor: [14, 165, 233, 255],
    targetColor: [14, 165, 233, 255],
    status: 'Under Construction',
    owner: 'Djibouti Telecom',
    entity: 'Djibouti Telecom',
    mandate: IMEC_MANDATE,
    ref: 'https://www.submarinecablemap.com/submarine-cable/raman',
  },
  {
    name: 'Raman Cable — Oman Leg',
    source: [43.15, 11.57],
    target: [57.05, 17.02],
    sourceColor: [14, 165, 233, 255],
    targetColor: [14, 165, 233, 255],
    status: 'Under Construction',
    owner: 'Zain Omantel',
    entity: 'Zain Omantel',
    mandate: IMEC_MANDATE,
    ref: 'https://www.submarinecablemap.com/submarine-cable/raman',
  },
  {
    name: 'Raman Cable — Barka–Mumbai',
    source: [54.00, 23.42],
    target: [72.8774, 19.0761],
    sourceColor: [14, 165, 233, 255],
    targetColor: [14, 165, 233, 255],
    status: 'Under Construction',
    owner: 'Google',
    entity: 'Google',
    mandate: IMEC_MANDATE,
    ref: 'https://www.submarinecablemap.com/submarine-cable/raman',
  },
];

// ── B. Railway Path Data (PathLayer) ───────────────────────

export const EXISTING_RAILWAYS: RailwayPath[] = [
  {
    name: 'Etihad Rail (UAE)',
    path: [
      [56.37, 25.16], [55.95, 25.10], [55.27, 25.20],
      [54.65, 24.70], [54.38, 24.45], [53.97, 24.22],
      [52.64, 23.96], [51.60, 24.03],
    ],
    status: 'operational',
    color: [16, 185, 129],
    entity: 'Etihad Rail',
    mandate: IMEC_MANDATE,
  },
  {
    name: 'Saudi Railways (Riyadh–Dammam)',
    path: [
      [49.98, 26.43], [48.50, 25.90], [47.99, 25.38], [46.72, 24.64],
    ],
    status: 'operational',
    color: [16, 185, 129],
    entity: 'Saudi Arabia Railways (SAR)',
    mandate: IMEC_MANDATE,
  },
  {
    name: 'Haramain High-Speed (Mecca–Medina)',
    path: [
      [39.83, 21.42], [39.17, 21.53], [38.80, 22.30],
      [39.60, 24.47],
    ],
    status: 'operational',
    color: [16, 185, 129],
    entity: 'Saudi Arabia Railways (SAR)',
    mandate: IMEC_MANDATE,
  },
  {
    name: 'Israel Railways (Haifa–Tel Aviv–Beer Sheva)',
    path: [
      [34.99, 32.79], [34.88, 32.49], [34.78, 32.07],
      [34.77, 31.78], [34.77, 31.25],
    ],
    status: 'operational',
    color: [16, 185, 129],
    entity: 'Israel Railways / Adani Ports & SEZ',
    mandate: IMEC_MANDATE,
  },
  {
    name: 'Aqaba Railway (Jordan)',
    path: [
      [35.93, 31.95], [35.85, 31.53], [35.73, 31.18],
      [35.52, 30.75], [35.01, 29.53],
    ],
    status: 'operational',
    color: [16, 185, 129],
    entity: 'Aqaba Railway Corporation',
    mandate: IMEC_MANDATE,
  },
];

export const PROPOSED_RAILWAYS: RailwayPath[] = [
  {
    name: 'IMEC Corridor Railway (Saudi Segment)',
    path: [
      [56.37, 25.16], [55.06, 25.01], [54.38, 24.45],
      [49.08, 24.14], [46.72, 24.64], [40.00, 28.50],
      [37.16, 31.46]
    ],
    status: 'proposed',
    color: [14, 165, 233],
    entity: 'Saudi Arabia Railways (SAR)',
    mandate: IMEC_MANDATE,
  },
  {
    name: 'GCC Railway',
    path: [
      [47.98, 29.37],  // Kuwait City
      [48.50, 28.30],  // Kuwait–KSA border
      [49.98, 26.43],  // Dammam
      [49.20, 24.50],  // Al-Batha junction
      [54.38, 24.45],  // Abu Dhabi
      [55.27, 25.20],  // Dubai
      [56.37, 25.16],  // Fujairah
    ],
    status: 'proposed',
    color: [14, 165, 233],
    entity: 'GCC Consortia',
    mandate: IMEC_MANDATE,
    ref: 'https://www.gccrailway.com/',
  },
  {
    name: 'GCC Railway — Bahrain Spur',
    path: [
      [49.98, 26.43],  // Dammam
      [50.30, 26.35],  // King Hamad Causeway
      [50.58, 26.23],  // Bahrain
    ],
    status: 'proposed',
    color: [14, 165, 233],
    entity: 'GCC Consortia',
    mandate: IMEC_MANDATE,
    ref: 'https://www.gccrailway.com/',
  },
  {
    name: 'GCC Railway — Qatar Spur',
    path: [
      [49.98, 26.43],  // Dammam
      [50.80, 25.80],  // Salwa crossing
      [51.53, 25.29],  // Doha
    ],
    status: 'proposed',
    color: [14, 165, 233],
    entity: 'GCC Consortia',
    mandate: IMEC_MANDATE,
    ref: 'https://www.gccrailway.com/',
  },
  {
    name: 'GCC Railway — Oman Extension',
    path: [
      [55.76, 24.22],  // Al Ain
      [56.73, 24.35],  // Border
      [58.19, 23.59],  // Sohar, Oman
      [58.54, 23.61],  // Muscat
    ],
    status: 'proposed',
    color: [14, 165, 233],
    entity: 'GCC Consortia',
    mandate: IMEC_MANDATE,
    ref: 'https://www.gccrailway.com/',
  },
];

export const MISSING_RAILWAYS: RailwayPath[] = [
  {
    name: 'Jordan-Israel Rail Gap',
    path: [
      [37.16, 31.46], // Saudi border approach
      [35.95, 31.96], // Jordan side
      [35.45, 32.35], // Crossing
      [34.99, 32.79], // Haifa
    ],
    status: 'missing',
    color: [156, 163, 175],
    entity: 'Stalled / Financial Deficit',
    mandate: IMEC_MANDATE,
  },
  {
    name: 'Syria/Lebanon Theoretical Branch',
    path: [
      [34.99, 32.79], // Haifa
      [35.50, 33.88], // Lebanon
      [36.29, 33.51], // Syria
    ],
    status: 'missing',
    color: [156, 163, 175],
    entity: 'Non-feasible / Geopolitical Block',
    mandate: IMEC_MANDATE,
  }
];

// ── C. Data Center Points (ScatterplotLayer) ───────────────

export const DATA_CENTERS: DataCenterPoint[] = [
  { position: [72.8965, 19.1144], facility: 'Equinix MB3', city: 'Mumbai', country: 'India', entity: 'Equinix', mandate: IMEC_MANDATE },
  { position: [55.1870, 25.0262], facility: 'Equinix DX1', city: 'Dubai', country: 'UAE', entity: 'Equinix', mandate: IMEC_MANDATE },
  { position: [35.9300, 31.9300], facility: 'STS Data Center', city: 'Amman', country: 'Jordan', entity: 'STS', mandate: IMEC_MANDATE },
  { position: [46.7720, 24.7171], facility: 'STC Rawabi', city: 'Riyadh', country: 'KSA', entity: 'STC', mandate: IMEC_MANDATE },
  { position: [35.0118, 31.8963], facility: 'Azure Israel Central', city: "Modi'in", country: 'Israel', entity: 'Microsoft Azure', mandate: IMEC_MANDATE },
  { position: [33.0580, 34.7150], facility: 'CL8', city: 'Limassol', country: 'Cyprus', entity: 'CL8', mandate: IMEC_MANDATE },
  { position: [23.7548, 38.0772], facility: 'Equinix Metamorfosi', city: 'Athens', country: 'Greece', entity: 'Equinix', mandate: IMEC_MANDATE },
  { position: [5.3765, 43.3168], facility: 'Digital Realty MRS1', city: 'Marseille', country: 'France', entity: 'Digital Realty', mandate: IMEC_MANDATE },
  { position: [9.1578, 45.4497], facility: 'Equinix ML2', city: 'Milan', country: 'Italy', entity: 'Equinix', mandate: IMEC_MANDATE },
];

// ── D. Demographic Density Points (HexagonLayer) ──────────

function generateCluster(
  center: [number, number],
  count: number,
  spread: number,
  baseWeight: number = 1
): DemographicPoint[] {
  const points: DemographicPoint[] = [];
  // Deterministic pseudo-random based on center coordinates
  let seed = Math.abs(center[0] * 1000 + center[1] * 1000);
  const nextRand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < count; i++) {
    const angle = nextRand() * Math.PI * 2;
    const dist = nextRand() * spread;
    points.push([
      center[0] + Math.cos(angle) * dist,
      center[1] + Math.sin(angle) * dist,
      baseWeight + nextRand() * baseWeight,
    ]);
  }
  return points;
}

export const DEMOGRAPHIC_POINTS: DemographicPoint[] = [
  // India (1.4B pop, $3.9T GDP) — heavy clusters
  ...generateCluster([77.1, 28.6], 300, 4, 5),
  ...generateCluster([72.9, 19.1], 250, 3.5, 4),
  ...generateCluster([80.3, 13.1], 150, 3, 3),
  ...generateCluster([88.4, 22.6], 120, 2.5, 3),
  ...generateCluster([77.6, 12.97], 100, 2, 3),
  ...generateCluster([78.5, 17.4], 80, 2, 2),
  // UAE ($500B GDP)
  ...generateCluster([55.3, 25.3], 80, 1.5, 4),
  ...generateCluster([54.4, 24.5], 50, 1.2, 3),
  // Saudi Arabia ($1.1T GDP)
  ...generateCluster([46.7, 24.7], 120, 2.5, 4),
  ...generateCluster([39.2, 21.5], 70, 2, 3),
  ...generateCluster([50.1, 26.4], 40, 1.5, 2),
  // Israel ($530B GDP)
  ...generateCluster([34.8, 32.1], 65, 1.2, 4),
  ...generateCluster([35.2, 31.8], 30, 1, 2),
  // Jordan ($50B GDP)
  ...generateCluster([35.9, 31.9], 25, 1, 2),
  // Greece ($240B GDP)
  ...generateCluster([23.7, 37.9], 40, 1.5, 3),
  // Italy ($2.2T GDP)
  ...generateCluster([9.2, 45.5], 120, 2.5, 4),
  ...generateCluster([12.5, 41.9], 80, 2, 3),
  ...generateCluster([11.2, 43.8], 30, 1.5, 2),
  // France ($3.1T GDP)
  ...generateCluster([2.3, 48.9], 150, 3, 4),
  ...generateCluster([5.4, 43.3], 50, 1.5, 3),
  ...generateCluster([4.8, 45.75], 40, 1.5, 2),
  // Cyprus ($30B GDP)
  ...generateCluster([33.4, 35.2], 15, 0.8, 2),
  // Oman ($100B GDP)
  ...generateCluster([58.5, 23.6], 30, 1.2, 2),
  // Bahrain ($45B GDP)
  ...generateCluster([50.5, 26.2], 15, 0.5, 2),
  // Qatar ($220B GDP)
  ...generateCluster([51.5, 25.3], 35, 0.8, 3),
  // Kuwait ($180B GDP)
  ...generateCluster([47.98, 29.37], 30, 1, 2),
];

// ── E. Geopolitical Data (Mapbox country-boundaries) ──────

export const FTA_AGREEMENTS: FTAEntry[] = [
  {
    name: 'EU–India FTA',
    countries: ['IND', ...EU_CODES],
    status: 'In Force',
    color: [16, 185, 129, 100],
    ref: 'https://commission.europa.eu/topics/trade/eu-india-trade-agreement_en',
  },
  {
    name: 'EU–GCC FTA',
    countries: [...EU_CODES, 'SAU', 'ARE', 'QAT', 'BHR', 'KWT', 'OMN'],
    status: 'Proposed',
    color: [6, 182, 212, 80],
    ref: 'https://www.commerce.gov.in/international-trade/trade-agreements/',
  },
  {
    name: 'EU–Israel FTA',
    countries: [...EU_CODES, 'ISR'],
    status: 'In Force',
    color: [16, 185, 129, 100],
    ref: 'https://trade.ec.europa.eu/access-to-markets/en/content/eu-israel-association-agreement',
  },
  {
    name: 'India–GCC FTA',
    countries: ['IND', 'SAU', 'ARE', 'QAT', 'BHR', 'KWT', 'OMN'],
    status: 'Proposed',
    color: [6, 182, 212, 80],
    ref: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2232327',
  },
  {
    name: 'India–Israel FTA',
    countries: ['IND', 'ISR'],
    status: 'Proposed',
    color: [6, 182, 212, 80],
    ref: 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=2232335',
  },
  {
    name: 'Israel–Jordan FTA',
    countries: ['ISR', 'JOR'],
    status: 'In Force',
    color: [16, 185, 129, 100],
    ref: 'https://wits.worldbank.org/GPTAD/PDF/archive/Isreal-Jordon.pdf',
  },
  {
    name: 'Israel–UAE FTA',
    countries: ['ISR', 'ARE'],
    status: 'In Force',
    color: [16, 185, 129, 100],
    ref: 'https://www.chathamhouse.org/2023/03/abraham-accords-and-israel-uae-normalization/',
  },
];

export const DEFENCE_PARTNERSHIPS: DefenceEntry[] = [
  {
    name: 'India–EU Defence',
    countries: ['IND', ...EU_CODES],
    color: [239, 68, 68, 100],
    ref: 'https://www.eeas.europa.eu/eeas/security-and-defence-partnership-between-european-union-and-republic-india_en',
  },
  {
    name: 'India–Israel Defence',
    countries: ['IND', 'ISR'],
    color: [249, 115, 22, 120],
    ref: 'https://breakingdefense.com/2025/11/india-israel-sign-new-mou-on-defense-tech/',
  },
  {
    name: 'India–UAE Defence',
    countries: ['IND', 'ARE'],
    color: [239, 68, 68, 120], // Removed amber, match red constraint
    ref: 'https://www.al-monitor.com/originals/2026/01/uae-india-agree-formalizing-defense-pact',
  },
];

// Core MoU Signatories (~70) for visual focus on IMEC corridor
export const BRI_COUNTRIES: string[] = [
  'CHN', 'PAK', 'LKA', 'BGD', 'MMR', 'LAO', 'KHM', 'THA', 'MYS', 'IDN',
  'BRN', 'PHL', 'VNM', 'MNG', 'KAZ', 'UZB', 'TKM', 'TJK', 'KGZ', 'RUS',
  'BLR', 'UKR', 'GEO', 'AZE', 'ARM', 'TUR', 'IRN', 'IRQ', 'SYR', 'LBN',
  'JOR', 'SAU', 'ARE', 'OMN', 'YEM', 'EGY', 'ETH', 'KEN', 'TZA', 'DJI',
  'SDN', 'ZAF', 'NGA', 'SEN', 'GHA', 'CMR', 'COG', 'AGO', 'MOZ', 'MDG',
  'SRB', 'HUN', 'GRC', 'HRV', 'CZE', 'SVK', 'POL', 'LTU', 'LVA', 'EST',
  'PER', 'CHL', 'ARG', 'BOL', 'VEN', 'ECU', 'URY', 'CRI', 'PAN', 'CUB',
];

export const BRICS_MEMBERS: string[] = [
  'BRA', 'RUS', 'IND', 'CHN', 'ZAF',
  'EGY', 'ETH', 'IRN', 'SAU', 'ARE', 'IDN',
];

export const BRICS_PARTNERS: string[] = [
  'BLR', 'BOL', 'CUB', 'KAZ', 'MYS',
  'NGA', 'THA', 'UGA', 'UZB', 'VNM',
];

export const WEAKNESS_COUNTRIES: string[] = ['EGY', 'TUR'];

// ── F. Reference Links ────────────────────────────────────

export const REFERENCE_LINKS = {
  gccRailway: 'https://www.gccrailway.com/',
  blueCable: 'https://www.submarinecablemap.com/submarine-cable/blue',
  ramanCable: 'https://www.submarinecablemap.com/submarine-cable/raman',
  cloudInfraMap: 'https://www.cloudinfrastructuremap.com/',
  openRailwayMap: 'https://www.openrailwaymap.org/',
  tradExplorer: 'https://www.tradexplorermap.be/',
} as const;
