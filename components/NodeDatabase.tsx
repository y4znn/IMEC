/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Filter, Anchor, Network, AlertTriangle, Lightbulb, Hexagon, SlidersHorizontal, Eye, Activity, Server, Zap, ShieldAlert, Swords, Sun, Moon, Clock } from 'lucide-react';
import * as d3 from 'd3-force-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), { ssr: false });
const MiniGlobe = dynamic(() => import('react-globe.gl'), { ssr: false });

/* ══════════════════════════════════════════════════════════
   DATASET (Hardcoded IMEC + AI War Cloud Intelligence Data)
   ══════════════════════════════════════════════════════════ */

type NodeType = 'Actor' | 'Framework' | 'Logistics' | 'Digital' | 'Energy' | 'Shock' | 'Rival';

interface NodeData {
    id: string;
    label: string;
    type: NodeType;
    val: number;
    color: string;
    fz?: number;              // Z-Stack Layer mapping
    commencementDate?: number; // Timeline slider mapping
    ghost?: boolean;          // Requires decryption to fully appear
    decrypted?: boolean;
    x?: number;
    y?: number;
    z?: number;
    lat?: number;
    lng?: number;
    desc: string;
}

interface LinkData {
    source: string;
    target: string;
    label?: string;
    commencementDate?: number;
}

const gData: { nodes: NodeData[]; links: LinkData[] } = {
    nodes: [
        // CATEGORY: GEOPOLITICAL ACTORS & FRAMEWORKS (Middle Layer: z=0)
        { id: "usa", type: "Actor", val: 6, color: "#e4e4e7", fz: 0, commencementDate: 2020, lat: 38.907, lng: -77.036, label: "United States", desc: "Strategic backer of IMEC via PGII to counter China's BRI." },
        { id: "india", type: "Actor", val: 6, color: "#e4e4e7", fz: 0, commencementDate: 2020, lat: 28.613, lng: 77.209, label: "India", desc: "Anchor economy leveraging IMEC to bypass Pakistan." },
        { id: "eu", type: "Actor", val: 5, color: "#e4e4e7", fz: 0, commencementDate: 2021, lat: 50.850, lng: 4.351, label: "European Union", desc: "Aligning IMEC with its €300 Billion Global Gateway fund." },
        { id: "ksa", type: "Actor", val: 5, color: "#e4e4e7", fz: 0, commencementDate: 2020, lat: 23.885, lng: 45.079, label: "Saudi Arabia", desc: "Crucial land bridge connecting the Gulf to the Levant." },
        { id: "uae", type: "Actor", val: 5, color: "#e4e4e7", fz: 0, commencementDate: 2020, lat: 23.424, lng: 53.847, label: "UAE", desc: "Pioneering the logistics network and funding Jordanian rails." },
        { id: "israel", type: "Actor", val: 4, color: "#e4e4e7", fz: 0, commencementDate: 2020, lat: 31.046, lng: 34.851, label: "Israel", desc: "The Mediterranean anchor point; provides overland redundancy." },
        { id: "china", type: "Actor", val: 6, color: "#e4e4e7", fz: 0, commencementDate: 2020, lat: 35.861, lng: 104.195, label: "China", desc: "Architect of the $8 Trillion BRI. Views IMEC as containment." },

        { id: "abraham_accords", type: "Framework", val: 4, color: "#e4e4e7", fz: 0, commencementDate: 2020, lat: 38.897, lng: -77.036, label: "Abraham Accords", desc: "Geopolitical normalization underpinning the overland routes." },
        { id: "pgii", type: "Framework", val: 3, color: "#e4e4e7", fz: 0, commencementDate: 2022, lat: 47.450, lng: 11.002, label: "G7 PGII", desc: "Partnership for Global Infrastructure and Investment." },
        { id: "global_gateway", type: "Framework", val: 3, color: "#e4e4e7", fz: 0, commencementDate: 2021, lat: 50.850, lng: 4.351, label: "EU Global Gateway", desc: "EU strategy to mobilize investments." },
        { id: "i2u2", type: "Framework", val: 3, color: "#e4e4e7", fz: 0, commencementDate: 2021, lat: 31.768, lng: 35.213, label: "I2U2 Group", desc: "India, Israel, UAE, and US partnership." },
        { id: "imec_announce", type: "Framework", val: 5, color: "#38bdf8", fz: 0, commencementDate: 2023.09, lat: 28.613, lng: 77.209, label: "IMEC Declaration", desc: "Formal announcement at G20 New Delhi." },

        // -- AI WAR CLOUD INTEGRATIONS (Actors & Frameworks) --
        { id: "palantir", type: "Actor", val: 5, color: "#e4e4e7", fz: 0, commencementDate: 2021, lat: 39.739, lng: -104.990, label: "Palantir Foundry", desc: "Military/intelligence data integration platform." },
        { id: "scaleai", type: "Actor", val: 4, color: "#e4e4e7", fz: 0, commencementDate: 2022, lat: 37.774, lng: -122.419, label: "ScaleAI", desc: "Data labeling for autonomous defense systems." },
        { id: "elbit", type: "Actor", val: 4, color: "#e4e4e7", fz: 0, commencementDate: 2020, lat: 32.794, lng: 34.989, label: "Elbit Systems", desc: "Defense contractor providing physical security infrastructure." },
        { id: "ai_dss", type: "Framework", val: 4, color: "#a855f7", fz: 0, commencementDate: 2023, lat: 31.046, lng: 34.851, label: "AI-DSS Protocol", desc: "Automated Decision Support Systems integrating global sensor nodes." },

        // CATEGORY: TRANSPORTATION PILLAR - PORTS & RAIL (Bottom Layer: z=-50)
        { id: "vadhavan", type: "Logistics", val: 4, color: "#3b82f6", fz: -50, commencementDate: 2024, lat: 19.798, lng: 72.716, label: "Vadhavan Port", desc: "Upcoming $9B Indian mega-port." },
        { id: "jebel_ali", type: "Logistics", val: 4, color: "#3b82f6", fz: -50, commencementDate: 2020, lat: 24.985, lng: 55.061, label: "Jebel Ali Port", desc: "The largest port in the Middle East." },
        { id: "al_ghuwaifat", type: "Logistics", val: 2, color: "#3b82f6", fz: -50, commencementDate: 2021, lat: 24.120, lng: 51.587, label: "Al-Ghuwaifat Link", desc: "Crucial UAE-Saudi Arabia rail border crossing." },
        { id: "al_haditha", type: "Logistics", val: 2, color: "#3b82f6", fz: -50, commencementDate: 2021, lat: 31.021, lng: 37.151, label: "Al-Haditha Hub", desc: "Key Saudi-Jordanian border transshipment." },
        { id: "mafraq", type: "Logistics", val: 3, color: "#3b82f6", fz: -50, commencementDate: 2023, lat: 32.342, lng: 36.208, label: "Mafraq (JOR)", desc: "Jordanian logistical hub." },
        { id: "beit_shean", type: "Logistics", val: 3, color: "#3b82f6", fz: -50, commencementDate: 2023, lat: 32.500, lng: 35.498, label: "Beit She'an (ISR)", desc: "Vital rail junction connecting Jordan to Israel." },
        { id: "haifa", type: "Logistics", val: 5, color: "#3b82f6", fz: -50, commencementDate: 2020, lat: 32.819, lng: 34.998, label: "Haifa Port", desc: "Critical Mediterranean gateway, acquired by Adani." },
        { id: "piraeus", type: "Logistics", val: 4, color: "#3b82f6", fz: -50, commencementDate: 2020, lat: 37.942, lng: 23.646, label: "Piraeus Port", desc: "Major European entry point, controlled by COSCO." },
        { id: "marseille", type: "Logistics", val: 3, color: "#3b82f6", fz: -50, commencementDate: 2020, lat: 43.300, lng: 5.369, label: "Port of Marseille", desc: "Key European terminus for shipping and cables." },

        // Ghost Nodes
        { id: "ben_gurion_canal", type: "Logistics", val: 4, color: "#3b82f6", fz: -50, commencementDate: 2025, ghost: true, lat: 29.563, lng: 34.951, label: "Ben Gurion Canal [SPECULATIVE]", desc: "Theoretical Israeli alternative to the Suez Canal." },

        // CATEGORY: DIGITAL PILLAR - DATA SOVEREIGNTY (Top Layer: z=50)
        { id: "blue_raman", type: "Digital", val: 5, color: "#a855f7", fz: 50, commencementDate: 2023, lat: 20.0, lng: 60.0, label: "Blue-Raman Cable", desc: "218 Tbps Google subsea fiber bypassing Egypt." },
        { id: "teas", type: "Digital", val: 4, color: "#a855f7", fz: 50, commencementDate: 2023, lat: 25.0, lng: 55.0, label: "TEAS Network", desc: "Trans Europe Asia System linking Mumbai to Marseille." },
        { id: "data_centers", type: "Digital", val: 4, color: "#a855f7", fz: 50, commencementDate: 2024, lat: 24.0, lng: 45.0, label: "Gulf AI Data Centers", desc: "High-compute nodes in UAE/KSA drawing on IMEC." },

        // -- AI WAR CLOUD INTEGRATIONS (Digital) --
        { id: "project_nimbus", type: "Digital", val: 5, color: "#a855f7", fz: 50, commencementDate: 2021, lat: 31.046, lng: 34.851, label: "Project Nimbus", desc: "$1.2B cloud computing project by Google/Amazon." },
        { id: "lavender", type: "Digital", val: 4, color: "#a855f7", fz: 50, commencementDate: 2023.10, lat: 31.500, lng: 34.466, label: "Lavender AI", desc: "Automated targeting system deployed in asymmetric conflict." },
        { id: "peace_cable", type: "Digital", val: 4, color: "#a855f7", fz: 50, commencementDate: 2024, ghost: true, lat: 30.0, lng: 32.0, label: "PEACE Cable [CLASSIFIED]", desc: "Chinese-backed digital backbone penetrating the Mediterranean." },

        // CATEGORY: ENERGY PILLAR (Middle Layer: z=0)
        { id: "neom_h2", type: "Energy", val: 4, color: "#10b981", fz: 0, commencementDate: 2022, lat: 28.083, lng: 35.150, label: "NEOM Green Hydrogen", desc: "$8.4B Saudi project aimed at exporting green ammonia." },
        { id: "hvdc_interconnector", type: "Energy", val: 4, color: "#10b981", fz: 0, commencementDate: 2024, lat: 25.0, lng: 60.0, label: "UAE-India HVDC", desc: "Proposed High-Voltage Direct Current subsea cable." },

        // CATEGORY: THREATS, SHOCKS & CHOKEPOINTS (Float dynamically relative to impact)
        { id: "gaza_war", type: "Shock", val: 6, color: "#ef4444", fz: 0, commencementDate: 2023.10, lat: 31.500, lng: 34.466, label: "Gaza War", desc: "Systemic shock stalling normalization." },
        { id: "red_sea", type: "Shock", val: 5, color: "#ef4444", fz: -50, commencementDate: 2023.11, lat: 16.500, lng: 41.000, label: "Red Sea Crisis", desc: "Houthi attacks paralyzing Suez shipping." },
        { id: "suez_chokepoint", type: "Shock", val: 4, color: "#ef4444", fz: -50, commencementDate: 2020, lat: 30.585, lng: 32.265, label: "Suez Vulnerability", desc: "Historical maritime bottleneck." },
        { id: "automated_targeting", type: "Shock", val: 4, color: "#ef4444", fz: 50, commencementDate: 2024, lat: 32.0, lng: 35.0, label: "AI Target Bleed", desc: "Algorithms executing lethal targeting without human loops." },

        // CATEGORY: RIVAL ARCHITECTURES
        { id: "bri", type: "Rival", val: 5, color: "#f59e0b", fz: 0, commencementDate: 2020, lat: 35.861, lng: 104.195, label: "Belt & Road Initiative", desc: "China's global infrastructure project." },
        { id: "drp", type: "Rival", val: 4, color: "#f59e0b", fz: -50, commencementDate: 2023, lat: 33.315, lng: 44.361, label: "Development Road", desc: "$17 Billion Iraq-Turkey rail bypass." },
    ],
    links: [
        // Foundations
        { source: "israel", target: "abraham_accords", commencementDate: 2020 }, { source: "uae", target: "abraham_accords", commencementDate: 2020 },
        { source: "abraham_accords", target: "i2u2", commencementDate: 2021 }, { source: "india", target: "i2u2", commencementDate: 2021 },
        { source: "i2u2", target: "imec_announce", commencementDate: 2023.09 }, { source: "eu", target: "imec_announce", commencementDate: 2023.09 },

        // Vertical Integrations (Nodes connecting across Z-planes)
        { source: "haifa", target: "blue_raman", commencementDate: 2023 }, // Physical -> Digital
        { source: "jebel_ali", target: "data_centers", commencementDate: 2024 }, // Physical -> Digital
        { source: "ksa", target: "neom_h2", commencementDate: 2022 }, // Actor -> Energy

        // Horizontal Physical Logistics
        { source: "vadhavan", target: "jebel_ali", commencementDate: 2024 },
        { source: "jebel_ali", target: "al_ghuwaifat", commencementDate: 2021 },
        { source: "al_ghuwaifat", target: "al_haditha", commencementDate: 2021 },
        { source: "al_haditha", target: "mafraq", commencementDate: 2023 },
        { source: "mafraq", target: "beit_shean", commencementDate: 2023 },
        { source: "beit_shean", target: "haifa", commencementDate: 2023 },
        { source: "haifa", target: "piraeus", commencementDate: 2020 },
        { source: "piraeus", target: "marseille", commencementDate: 2020 },

        // AI War Cloud Network (Cross-layer cyber warfare)
        { source: "usa", target: "palantir", commencementDate: 2021 },
        { source: "israel", target: "elbit", commencementDate: 2020 },
        { source: "palantir", target: "ai_dss", commencementDate: 2023 },
        { source: "scaleai", target: "ai_dss", commencementDate: 2023 },
        { source: "ai_dss", target: "lavender", commencementDate: 2023.10 },
        { source: "usa", target: "project_nimbus", commencementDate: 2021 },
        { source: "project_nimbus", target: "israel", commencementDate: 2021 },
        { source: "project_nimbus", target: "lavender", commencementDate: 2023.10 },
        { source: "lavender", target: "automated_targeting", commencementDate: 2024 },
        { source: "project_nimbus", target: "data_centers", commencementDate: 2024 },

        // Shocks
        { source: "gaza_war", target: "abraham_accords", commencementDate: 2023.10 }, // Disrupts framework
        { source: "gaza_war", target: "red_sea", commencementDate: 2023.11 },
        { source: "red_sea", target: "suez_chokepoint", commencementDate: 2023.11 },

        // Rivals & Ghosts
        { source: "china", target: "bri", commencementDate: 2020 },
        { source: "china", target: "peace_cable", commencementDate: 2024 },
        { source: "bri", target: "drp", commencementDate: 2023 },
        { source: "suez_chokepoint", target: "ben_gurion_canal", commencementDate: 2025 }
    ]
};

const PRESENTATION_STEPS = [
    { title: "I. The Baseline Geometry", speech: "Before 2023, the logistical architecture relied on legacy chokepoints and emergent diplomatic frameworks like the Abraham Accords.", year: 2022, targetNode: "abraham_accords", camPos: { x: 0, y: 0, z: 250 }, repulsion: -200 },
    { title: "II. The Sovereign Backbone", speech: "In September 2023, the IMEC was declared, establishing a multi-modal physical corridor from India to Europe.", year: 2023.09, targetNode: "imec_announce", camPos: { x: 50, y: -50, z: 150 }, repulsion: -400 },
    { title: "III. The Digital Artery & AI-DSS", speech: "This physical route is underpinned by a sovereign digital layer—Project Nimbus, Blue-Raman, and automated intelligence networks.", year: 2024, targetNode: "project_nimbus", camPos: { x: 0, y: 150, z: 100 }, repulsion: -500 },
    { title: "IV. Systemic Shock & Vulnerability", speech: "However, the architecture is highly fragile. The October kinetic events and subsequent Red Sea crisis paralyzed the physical flow...", year: 2023.11, targetNode: "gaza_war", camPos: { x: -80, y: 0, z: 100 }, repulsion: -600 },
    { title: "V. The Eurasian Alternative", speech: "...which immediately accelerates the viability of rival architectures like the Development Road and the BRI.", year: 2025, targetNode: "drp", camPos: { x: 0, y: 0, z: 300 }, repulsion: -300 }
];

export default function NodeDatabase() {
    const fgRef = useRef<any>(null);
    const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
    const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);

    // Decryption state for ghost nodes
    const [decryptedNodes, setDecryptedNodes] = useState<Set<string>>(new Set());
    const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // AI Analyst Panel
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [timelineYear, setTimelineYear] = useState<number>(2026);
    const [searchQuery, setSearchQuery] = useState('');
    const [briefingText, setBriefingText] = useState('');

    // Presentation Autopilot
    const [currentStep, setCurrentStep] = useState<number>(-1);
    const [isPresentationMode, setIsPresentationMode] = useState(false);

    // Physics Engine Controls
    const [linkDistance, setLinkDistance] = useState(80);
    const [repulsion, setRepulsion] = useState(-400);

    // Forensic Upgrades States & Refs
    const materialsToAnimate = useRef<THREE.MeshStandardMaterial[]>([]);
    const miniGlobeRef = useRef<any>(null);
    const [countries, setCountries] = useState({ features: [] });

    useEffect(() => {
        fetch('https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then(setCountries)
            .catch(e => console.error("Globemap fetch error", e));
    }, []);

    // Pulsing Material Engine
    useEffect(() => {
        let reqId: number;
        const animate = () => {
            const time = Date.now() * 0.001;
            const pulse = Math.sin(time * 2) * 0.35 + 1.15; // Oscillates 0.8 to 1.5
            materialsToAnimate.current.forEach(mat => {
                if (mat) mat.emissiveIntensity = (mat.userData.baseEmissive || 1.2) * (pulse / 1.15);
            });
            reqId = requestAnimationFrame(animate);
        };
        animate();
        return () => cancelAnimationFrame(reqId);
    }, []);

    // Autopilot Execution Engine
    const executeStep = useCallback((stepIndex: number) => {
        if (stepIndex < 0 || stepIndex >= PRESENTATION_STEPS.length) {
            setIsPresentationMode(false);
            setCurrentStep(-1);
            return;
        }

        setIsPresentationMode(true);
        setCurrentStep(stepIndex);

        const step = PRESENTATION_STEPS[stepIndex];
        setTimelineYear(step.year);
        setRepulsion(step.repulsion);

        const targetNode = gData.nodes.find(n => n.id === step.targetNode) || null;
        if (targetNode) {
            setSelectedNode(targetNode);
            setIsPanelOpen(true);

            if (fgRef.current) {
                fgRef.current.cameraPosition(
                    step.camPos,
                    { x: targetNode.x || 0, y: targetNode.y || 0, z: targetNode.z || 0 },
                    2500
                );
            }
        }
    }, [fgRef, setTimelineYear, setRepulsion, setSelectedNode, setIsPanelOpen]);

    // Typewriter Effect Logic
    useEffect(() => {
        if (!selectedNode) return;

        let fullText = "";
        if (isPresentationMode && currentStep >= 0 && currentStep < PRESENTATION_STEPS.length) {
            fullText = PRESENTATION_STEPS[currentStep].speech;
        } else {
            fullText = selectedNode.type === 'Shock' ?
                "CRITICAL VULNERABILITY DETECTED. Network flow compromised. Immediate state-intervention required to stabilize logistical throughput." :
                `Analyzing structural dependencies... System nominal. ${selectedNode.type === 'Digital' ? 'Cloud perimeter secure but facing AI intrusion spikes.' : 'Supply chain resilient against secondary shocks.'}`;
        }

        let currentText = "";
        const interval = setInterval(() => {
            if (currentText.length === 0) setBriefingText(""); // Clear on first tick implicitly if needed
            if (currentText.length < fullText.length) {
                currentText = fullText.substring(0, currentText.length + 1);
                setBriefingText(currentText);
            } else {
                clearInterval(interval);
            }
        }, 15);

        // Orient MiniGlobe natively
        if (miniGlobeRef.current && selectedNode.lat !== undefined) {
            miniGlobeRef.current.pointOfView({ lat: selectedNode.lat, lng: selectedNode.lng, altitude: 2 }, 1500);
        }

        return () => clearInterval(interval);
    }, [selectedNode, isPresentationMode, currentStep]);

    // On hover decryption logic for ghost nodes
    const handleNodeHover = useCallback((node: NodeData | null) => {
        setHoveredNode(node);

        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        if (node && node.ghost && !decryptedNodes.has(node.id)) {
            // Apply decryption delay
            hoverTimeoutRef.current = setTimeout(() => {
                setDecryptedNodes(prev => new Set(prev).add(node.id));
            }, 3000);
        }
    }, [decryptedNodes]);

    const handleNodeClick = useCallback((node: NodeData) => {
        if (node.ghost && !decryptedNodes.has(node.id)) return; // Prevents clicking encrypted nodes
        setSelectedNode(node);
        setIsPanelOpen(true);

        // Center camera smoothly in 3D using a cinematic 45 degree offset fly-by
        if (fgRef.current) {
            const distance = 150;
            const theta = Math.PI / 4;
            const cx = (node.x || 0) + distance * Math.cos(theta);
            const cz = (node.z || 0) + distance * Math.sin(theta);
            const cy = (node.y || 0) + distance * 0.3; // Slight elevation

            fgRef.current.cameraPosition(
                { x: cx, y: cy, z: cz },
                { x: node.x || 0, y: node.y || 0, z: node.z || 0 },
                2000
            );
        }
    }, [decryptedNodes, fgRef]);

    // Apply Timeline Filter
    const filteredData = useMemo(() => {
        const activeNodes = gData.nodes.map(n => ({
            ...n,
            decrypted: decryptedNodes.has(n.id)
        })).filter(n => (n.commencementDate || 2020) <= timelineYear)
            .filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()) || n.type.toLowerCase().includes(searchQuery.toLowerCase()));

        const nodeIds = new Set(activeNodes.map(n => n.id));
        const activeLinks = gData.links.filter(l =>
            nodeIds.has(typeof l.source === 'object' ? (l.source as any).id : l.source) &&
            nodeIds.has(typeof l.target === 'object' ? (l.target as any).id : l.target) &&
            (l.commencementDate || 2020) <= timelineYear
        );

        return { nodes: activeNodes, links: activeLinks };
    }, [timelineYear, decryptedNodes, searchQuery]);

    const isStressed = useMemo(() => {
        return filteredData.nodes.some(n => n.type === 'Shock');
    }, [filteredData]);

    const riskPercentage = useMemo(() => {
        const shockCount = filteredData.nodes.filter(n => n.type === 'Shock').length;
        const maxShocks = 4;
        return Math.min((shockCount / maxShocks) * 100, 100);
    }, [filteredData]);

    useEffect(() => {
        if (fgRef.current) {
            const fg = fgRef.current;
            fg.d3Force('link').distance(linkDistance);
            fg.d3Force('charge').strength(repulsion);
            // Lock nodes to their assigned Z planes
            fg.d3Force('z', d3.forceZ().z((d: any) => d.fz !== undefined ? d.fz : 0).strength(1));
            // 3D collision using d3-force-3d internal mappings
            fg.d3Force('collide', d3.forceCollide().radius((node: any) => Math.sqrt(node.val || 1) * 3 + 6 + (node.val > 4 ? 15 : 0)));
            fg.d3ReheatSimulation();

            // Add Environmental Z-Stack Grids
            const scene = fg.scene();
            if (scene && !scene.getObjectByName('z-stack-grids')) {
                const gridGroup = new THREE.Group();
                gridGroup.name = 'z-stack-grids';

                const createGrid = (z: number) => {
                    const grid = new THREE.GridHelper(600, 40, 0xffffff, 0xffffff);
                    grid.position.z = z;
                    grid.rotation.x = Math.PI / 2; // Orient grid to XY horizontal plane
                    (grid.material as THREE.Material).opacity = 0.05;
                    (grid.material as THREE.Material).transparent = true;
                    return grid;
                };

                gridGroup.add(createGrid(50));
                gridGroup.add(createGrid(0));
                gridGroup.add(createGrid(-50));
                scene.add(gridGroup);
            }

            // Global Post-Processing
            try {
                const composer = fg.postProcessingComposer();
                if (composer && !composer.passes.some((p: any) => p.name === 'UnrealBloomPass')) {
                    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.85);
                    (bloomPass as any).name = 'UnrealBloomPass';
                    composer.addPass(bloomPass);
                }
            } catch (e) {
                console.warn('Post-processing unsupported on this iteration', e);
            }
        }
    }, [linkDistance, repulsion, filteredData]);

    return (
        <div className={`absolute inset-0 z-10 w-full h-screen overflow-hidden font-sans transition-colors duration-1000 ${isStressed ? 'bg-[#050000]' : 'bg-black'}`}>

            {/* ── Search Bar Overlay ── */}
            <div className="absolute top-24 left-6 z-20 pointer-events-auto">
                <div className="flex items-center gap-3 px-4 py-2.5 bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-xl shadow-2xl transition-all group hover:bg-zinc-900/60 focus-within:bg-zinc-900/60 focus-within:border-white/20">
                    <Search className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 transition-colors" strokeWidth={1.2} />
                    <input
                        type="text"
                        placeholder="Search node telemetry..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm text-zinc-200 placeholder:text-zinc-600 w-56 font-mono tracking-tight"
                    />
                </div>
            </div>

            {/* ── 3D Force Graph ── */}
            <div className="absolute inset-0 cursor-crosshair">
                <ForceGraph3D
                    ref={fgRef}
                    graphData={filteredData}
                    nodeRelSize={4}
                    backgroundColor={isStressed ? "#050000" : "#000000"}
                    showNavInfo={false}
                    onNodeHover={(n) => handleNodeHover(n as NodeData)}
                    onNodeClick={(n) => handleNodeClick(n as NodeData)}

                    // 3D Node Rendering
                    nodeThreeObject={(node: any) => {
                        const isGhost = node.ghost && !node.decrypted;
                        const isHovered = node === hoveredNode;

                        const group = new THREE.Group();

                        // Sphere Core
                        const r = Math.sqrt(node.val) * 2;
                        const geometry = new THREE.SphereGeometry(r, 16, 16);
                        const material = new THREE.MeshStandardMaterial({
                            color: node.color,
                            transparent: true,
                            opacity: isGhost ? 0.15 : (isHovered ? 1.0 : 0.8),
                            emissive: node.color,
                            emissiveIntensity: isHovered ? 2.5 : 1.2,
                            wireframe: isGhost // Gives it a skeletal look
                        });

                        // Push into pulsing ref
                        material.userData.baseEmissive = isHovered ? 2.5 : 1.2;
                        if (!materialsToAnimate.current.includes(material)) {
                            materialsToAnimate.current.push(material);
                        }

                        const sphere = new THREE.Mesh(geometry, material);
                        group.add(sphere);

                        // Rotating Ring for Parent Nodes (val >= 5)
                        if (node.val >= 5 && !isGhost) {
                            const torusGeo = new THREE.TorusGeometry(r + 1.5, 0.2, 16, 32);
                            const torusMat = new THREE.MeshStandardMaterial({
                                color: node.color,
                                transparent: true,
                                opacity: 0.5,
                                emissive: node.color,
                                emissiveIntensity: 2.0
                            });
                            const torus = new THREE.Mesh(torusGeo, torusMat);
                            // Set static rotation angles or optionally animate via ref
                            torus.rotation.x = Math.PI / 2;
                            group.add(torus);
                        }

                        // Internal Data Clusters (Digital/Actor)
                        if (!isGhost && (node.type === 'Digital' || node.type === 'Actor')) {
                            const pointsGeo = new THREE.BufferGeometry();
                            const pointsCount = 40;
                            const pos = new Float32Array(pointsCount * 3);
                            for (let i = 0; i < pointsCount * 3; i++) {
                                pos[i] = (Math.random() - 0.5) * r * 1.5;
                            }
                            pointsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
                            const pointsMat = new THREE.PointsMaterial({ color: node.color, size: 0.5, transparent: true, opacity: 0.8 });
                            const points = new THREE.Points(pointsGeo, pointsMat);
                            group.add(points);
                        }

                        // Text Label (Always faces camera)
                        if (!isGhost || isHovered) {
                            const label = isGhost ? "DECRYPTING..." : node.label;
                            const sprite = new SpriteText(label);
                            sprite.color = isGhost ? '#ef4444' : '#ffffff';
                            sprite.textHeight = isHovered ? 4 : 3;
                            sprite.position.y = r + 3;
                            group.add(sprite);
                        }

                        return group;
                    }}

                    // Custom Link Drawing
                    linkCurvature={0.2}
                    linkCurveRotation={0.5}
                    linkDirectionalParticles={(l: any) => {
                        const sourceZ = typeof l.source === 'object' ? (l.source.fz || 0) : 0;
                        const targetZ = typeof l.target === 'object' ? (l.target.fz || 0) : 0;
                        const sourceType = typeof l.source === 'object' ? l.source.type : '';
                        const targetType = typeof l.target === 'object' ? l.target.type : '';

                        if (sourceType === 'Shock' || targetType === 'Shock') return 6;
                        if (sourceZ !== targetZ) return 4;
                        return (l.commencementDate && l.commencementDate === timelineYear) ? 4 : 1;
                    }}
                    linkDirectionalParticleWidth={1.5}
                    linkDirectionalParticleSpeed={() => isStressed ? 0.03 : 0.01}
                    linkDirectionalParticleColor={(l: any) => {
                        const sourceType = typeof l.source === 'object' ? l.source.type : '';
                        const targetType = typeof l.target === 'object' ? l.target.type : '';
                        if (sourceType === 'Shock' || targetType === 'Shock') return 'rgba(239, 68, 68, 0.8)';
                        return 'rgba(255, 255, 255, 0.8)';
                    }}
                    linkWidth={(l: any) => {
                        const sourceZ = typeof l.source === 'object' ? (l.source.fz || 0) : 0;
                        const targetZ = typeof l.target === 'object' ? (l.target.fz || 0) : 0;
                        return sourceZ !== targetZ ? 1.5 : 0.5; // Thicker vertical links
                    }}
                    linkColor={(l: any) => {
                        const sourceZ = typeof l.source === 'object' ? (l.source.fz || 0) : 0;
                        const targetZ = typeof l.target === 'object' ? (l.target.fz || 0) : 0;
                        const sourceType = typeof l.source === 'object' ? l.source.type : '';
                        const targetType = typeof l.target === 'object' ? l.target.type : '';

                        // Glowing white for vertical cross-layer dependencies
                        if (sourceZ !== targetZ) return 'rgba(255, 255, 255, 0.4)';
                        // Red indicator for shock links
                        if (sourceType === 'Shock' || targetType === 'Shock') return 'rgba(239, 68, 68, 0.5)';
                        return 'rgba(255, 255, 255, 0.15)';
                    }}
                />
            </div>

            {/* ── Overlay: The Time Machine Slider ── */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 pointer-events-auto w-[600px]">
                <div className="backdrop-blur-xl bg-zinc-900/60 border border-white/5 rounded-2xl p-6 shadow-2xl flex flex-col items-center">
                    <div className="flex items-center justify-between w-full mb-4">
                        <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" strokeWidth={1.2} /> Temporal Intelligence
                        </span>
                        <span className={`font-mono text-sm font-bold ${timelineYear >= 2023.10 ? 'text-red-500' : 'text-zinc-200'}`}>
                            {timelineYear < 2023.10 ? Math.floor(timelineYear) : (timelineYear === 2023.10 ? 'OCT 2023: GAZA SHOCK' : '2024-2026: ESCALATION')}
                        </span>
                    </div>

                    <input
                        type="range"
                        min="2020"
                        max="2026"
                        step="0.05"
                        value={timelineYear}
                        onChange={(e) => setTimelineYear(parseFloat(e.target.value))}
                        className="w-full appearance-none bg-zinc-800 h-1 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:scale-125 transition-all"
                    />
                    <div className="flex justify-between w-full text-[10px] text-zinc-600 font-mono mt-2 px-1">
                        <span>2020</span>
                        <span>2022</span>
                        <span>2024</span>
                        <span>2026</span>
                    </div>

                    <div className="w-full flex items-center gap-4 mt-6 pt-4 border-t border-white/5 disabled:opacity-50">
                        <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest flex items-center gap-1 w-24">
                            <SlidersHorizontal className="w-3 h-3" strokeWidth={1.2} /> Repulsion
                        </span>
                        <input
                            type="range"
                            min="-1000"
                            max="-50"
                            step="10"
                            value={repulsion}
                            onChange={(e) => setRepulsion(parseFloat(e.target.value))}
                            className="flex-1 appearance-none bg-zinc-800 h-1 rounded-full outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-zinc-400 [&::-webkit-slider-thumb]:rounded-full cursor-pointer hover:[&::-webkit-slider-thumb]:bg-white transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* ── AI Analyst Slide-out Panel ── */}
            <AnimatePresence>
                {isPanelOpen && (
                    <motion.div
                        initial={{ x: 400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 400, opacity: 0 }}
                        className="absolute top-24 right-6 w-96 max-h-[80vh] overflow-y-auto custom-scrollbar z-30 bg-zinc-900/60 backdrop-blur-[20px] border border-white/10 rounded-2xl shadow-2xl pointer-events-auto"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-400 flex items-center gap-2 chromatic-text cursor-default">
                                    <Activity className="w-4 h-4 text-purple-400" strokeWidth={1.2} /> AI-DSS Report
                                </h3>
                                <button onClick={() => setIsPanelOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                                    <X className="w-4 h-4" strokeWidth={1.2} />
                                </button>
                            </div>

                            {selectedNode ? (
                                <div className="space-y-4">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-white tracking-tight leading-none mb-1">
                                            {selectedNode.label}
                                        </h2>
                                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest bg-white/5 border border-white/10`} style={{ color: selectedNode.color }}>
                                            {selectedNode.type} Node
                                        </span>
                                    </div>
                                    <p className="text-sm text-zinc-400 leading-relaxed font-light">
                                        {selectedNode.desc}
                                    </p>

                                    <div className="pt-4 border-t border-white/10">
                                        <h4 className="text-[10px] font-mono uppercase text-zinc-500 mb-2">Automated Strategic Friction Briefing</h4>
                                        <div className="bg-black/40 rounded-lg p-4 font-mono text-xs leading-relaxed min-h-[80px]">
                                            <span className={selectedNode.type === 'Shock' ? "text-red-400" : "text-zinc-300"}>
                                                {briefingText}
                                            </span>
                                            <span className="animate-pulse ml-1 opacity-50 text-zinc-400">_</span>
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-2 border-t border-white/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="text-[10px] font-mono text-zinc-500 uppercase">System Risk Gauge</h4>
                                            <span className={`text-[10px] font-mono ${riskPercentage > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{Math.round(riskPercentage)}% Criticality</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${riskPercentage}%` }}
                                                transition={{ duration: 1 }}
                                                className={`h-full ${riskPercentage > 50 ? 'bg-red-500' : 'bg-emerald-500'} shadow-[0_0_10px_rgba(239,68,68,0.5)]`}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4 mt-2">
                                        <h4 className="text-[10px] font-mono text-zinc-500 mb-3 uppercase">Forensic Metadata</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-black/40 rounded p-2 border border-white/5">
                                                <div className="text-[9px] text-zinc-500 font-mono mb-1">Z-PLANE</div>
                                                <div className="text-xs text-white font-mono">{selectedNode.fz === 50 ? 'DIGITAL' : selectedNode.fz === -50 ? 'PHYSICAL' : 'ACTOR'}</div>
                                            </div>
                                            <div className="bg-black/40 rounded p-2 border border-white/5">
                                                <div className="text-[9px] text-zinc-500 font-mono mb-1">RISK INDEX</div>
                                                <div className={`text-xs font-mono ${selectedNode.type === 'Shock' ? 'text-red-400' : 'text-emerald-400'}`}>
                                                    {selectedNode.type === 'Shock' ? 'HIGH' : 'LOW'}
                                                </div>
                                            </div>
                                            <div className="bg-black/40 rounded p-2 border border-white/5">
                                                <div className="text-[9px] text-zinc-500 font-mono mb-1">COMMENCE</div>
                                                <div className="text-xs text-white font-mono">{selectedNode.commencementDate || 'N/A'}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-sm text-zinc-500 text-center py-10 font-mono">
                                    Select node to decrypt telemetry.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Contextual Mini-Map ── */}
            <div className="absolute bottom-6 right-6 w-48 h-48 rounded-full overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-md shadow-2xl z-20 pointer-events-none group hover:border-cyan-500/30 transition-colors">
                <MiniGlobe
                    ref={miniGlobeRef}
                    globeImageUrl={undefined}
                    backgroundColor="rgba(0,0,0,0)"
                    width={192}
                    height={192}
                    polygonsData={countries.features}
                    polygonCapColor={() => '#1f2937'}
                    polygonStrokeColor={() => '#3f3f46'}
                    pointsData={selectedNode && selectedNode.lat ? [selectedNode] : []}
                    pointLat="lat"
                    pointLng="lng"
                    pointColor="color"
                    pointAltitude={0.1}
                    pointRadius={2}
                    pointsMerge={false}
                />
            </div>

            {/* ── Cinematic Presentation Director ── */}
            <div className="absolute bottom-6 left-6 z-40">
                {!isPresentationMode ? (
                    <button
                        onClick={() => executeStep(0)}
                        className="flex items-center gap-2 px-4 py-2 bg-zinc-900/40 backdrop-blur-md border border-cyan-500/30 rounded-xl text-cyan-400 font-mono text-xs tracking-widest hover:bg-cyan-900/20 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(34,211,238,0.1)] group"
                    >
                        <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" strokeWidth={1.2} />
                        INITIALIZE DEFENSE SEQUENCE
                    </button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-[400px] bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                    >
                        <div className="flex justify-between items-center px-4 py-3 border-b border-white/10 bg-black/40">
                            <span className="text-[10px] font-mono text-cyan-400 tracking-widest uppercase">
                                Phase {currentStep + 1} / {PRESENTATION_STEPS.length}
                            </span>
                            <button onClick={() => executeStep(-1)} className="text-zinc-500 hover:text-white transition-colors">
                                <X className="w-4 h-4" strokeWidth={1.2} />
                            </button>
                        </div>
                        <div className="p-5">
                            <h3 className="text-lg font-bold text-white tracking-tight mb-3">
                                {PRESENTATION_STEPS[currentStep].title}
                            </h3>
                            <div className="pl-3 border-l-2 border-cyan-500/50">
                                <p className="text-sm font-mono text-zinc-300 leading-relaxed">
                                    {PRESENTATION_STEPS[currentStep].speech}
                                </p>
                            </div>
                        </div>
                        <div className="flex px-4 py-3 bg-black/40 border-t border-white/10 gap-3">
                            <button
                                onClick={() => executeStep(currentStep - 1)}
                                disabled={currentStep === 0}
                                className="flex-1 py-2 text-xs font-mono text-zinc-400 border border-white/10 rounded-lg hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                [ ← BACK ]
                            </button>
                            <button
                                onClick={() => executeStep(currentStep + 1)}
                                className="flex-1 py-2 text-xs font-mono text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/10 hover:text-cyan-300 transition-all font-bold"
                            >
                                {currentStep === PRESENTATION_STEPS.length - 1 ? '[ CONCLUDE ]' : '[ NEXT → ]'}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

        </div>
    );
}
