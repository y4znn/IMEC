/**
 * IMEC Corridor Map Component
 */

const map = new maplibregl.Map({
    container: 'map',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
    center: [45.0, 30.0],
    zoom: 3.5,
    pitch: 45,
    bearing: -15,
    trackResize: true // VITAL for responsive rendering when embedded in a scalable container
});

/**
 * ============================================================================
 * EXPOSED LIFECYCLE METHOD FOR HOST TAB RE-RENDERING
 * ============================================================================
 * WebGL maps instantiated inside hidden elements (e.g. wrapper displays as 'none') 
 * fail to reliably configure canvas coordinate boundaries correctly, stalling the map engine rendering logic.
 * 
 * When the host website user interacts with GUI tabs routing to reveal the IMEC Map, the 
 * host website developers MUST execute this exact globally exposed function after the element switches to display visible.
 * 
 * Example Implementation Pattern for Main Website:
 * document.getElementById('imec-tab-button').addEventListener('click', () => {
 *     document.getElementById('imec-map-module').style.display = 'block';
 *     if (typeof window.resizeImecMap === 'function') {
 *         // Wait for browser generic paint pipeline
 *         setTimeout(() => window.resizeImecMap(), 50); 
 *     }
 * });
 * ============================================================================
 */
window.resizeImecMap = function() {
    if (map) {
        map.resize();
        console.log("IMEC Map Component correctly resized parameters.");
    }
};

let datacenterMarkers = [];

map.on('load', async () => {
    // Structural Sources
    map.addSource('railway', {
        type: 'geojson',
        data: './data/imec-railway.geojson'
    });

    map.addSource('cables', {
        type: 'geojson',
        data: './data/subsea-cables.geojson'
    });

    map.addSource('cable-nodes', {
        type: 'geojson',
        data: './data/cable-nodes.geojson'
    });

    map.addSource('railway-nodes', {
        type: 'geojson',
        data: './data/railway-nodes.geojson'
    });

    // Layer 1: Railway (Charcoal Dashed)
    map.addLayer({
        id: 'railway-line',
        type: 'line',
        source: 'railway',
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#4a4a4a',
            'line-width': 3,
            'line-dasharray': [2, 2.5],
            'line-opacity': 1,
            'line-opacity-transition': { duration: 300 }
        }
    });

    // Layer 1.5: PEACE Cable (Competitor - Silver, beneath IMEC cables)
    map.addLayer({
        id: 'peace-cable-line',
        type: 'line',
        source: 'cables',
        filter: ['==', ['get', 'System'], 'PEACE'],
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#A9A9A9',
            'line-width': 2,
            'line-opacity': 1,
            'line-opacity-transition': { duration: 300 }
        }
    });

    // Layer 2: Blue Cable (Solid Teal)
    map.addLayer({
        id: 'blue-cable-line',
        type: 'line',
        source: 'cables',
        filter: ['==', ['get', 'Segment'], 'Blue'],
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#008b8b',
            'line-width': 4,
            'line-opacity': 1,
            'line-opacity-transition': { duration: 300 }
        }
    });

    // Layer 3: Raman Cable (Solid Muted Magenta, Dashed)
    map.addLayer({
        id: 'raman-cable-line',
        type: 'line',
        source: 'cables',
        filter: ['==', ['get', 'Segment'], 'Raman'],
        layout: {
            'line-join': 'round',
            'line-cap': 'round'
        },
        paint: {
            'line-color': '#c71585',
            'line-width': 4,
            'line-dasharray': [2, 2],
            'line-opacity': 1,
            'line-opacity-transition': { duration: 300 }
        }
    });

    // Layer 4: Cable Landing Stations
    map.addLayer({
        id: 'cable-nodes-layer',
        type: 'circle',
        source: 'cable-nodes',
        paint: {
            'circle-radius': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                7,
                5
            ],
            'circle-color': '#1a365d',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 1,
            'circle-stroke-opacity': 1,
            'circle-opacity-transition': { duration: 300 },
            'circle-stroke-opacity-transition': { duration: 300 }
        }
    });

    // Layer 5: Railway Hubs
    map.addLayer({
        id: 'railway-nodes-layer',
        type: 'circle',
        source: 'railway-nodes',
        paint: {
            'circle-radius': [
                'case',
                ['boolean', ['feature-state', 'hover'], false],
                7,
                5
            ],
            'circle-color': '#333333',
            'circle-stroke-width': 1,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 1,
            'circle-stroke-opacity': 1,
            'circle-opacity-transition': { duration: 300 },
            'circle-stroke-opacity-transition': { duration: 300 }
        }
    });

    // Layer 3: Datacenters (SVGs instantiated natively)
    try {
        const response = await fetch('./data/datacenters.geojson');
        const data = await response.json();
        
        data.features.forEach(feature => {
            const coords = feature.geometry.coordinates;
            const props = feature.properties;

            // Instantiating pure HTML-SVG Node matching global aesthetics structurally
            const el = document.createElement('div');
            el.className = 'datacenter-marker';
            el.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="8" cy="8" r="6" fill="var(--imec-primary-color, #1a1a1a)" stroke="var(--imec-bg-color, #ffffff)" stroke-width="2"/>
                    <circle cx="8" cy="8" r="2" fill="var(--imec-bg-color, #ffffff)" />
                </svg>
            `;

            const popup = new maplibregl.Popup({ offset: 10, closeButton: false, closeOnClick: true })
                .setHTML(`
                    <div class="datacenter-popup">
                        <h4>${props.Facility}</h4>
                        <p>${props.City}, ${props.Country}</p>
                    </div>
                `);

            const marker = new maplibregl.Marker({ element: el })
                .setLngLat(coords)
                .setPopup(popup)
                .addTo(map);

            el.addEventListener('mouseenter', () => marker.togglePopup());
            el.addEventListener('mouseleave', () => marker.togglePopup());

            datacenterMarkers.push(marker);
        });
    } catch(err) {
        console.error("IMEC Web: Failed to load datacenters.", err);
    }

    // Connect Interactivity (Toggles via Paint Properties)
    document.getElementById('toggle-railway').addEventListener('change', (e) => {
        map.setPaintProperty('railway-line', 'line-opacity', e.target.checked ? 1 : 0);
    });

    document.getElementById('toggle-imec-cable').addEventListener('change', (e) => {
        const op = e.target.checked ? 1 : 0;
        map.setPaintProperty('blue-cable-line', 'line-opacity', op);
        map.setPaintProperty('raman-cable-line', 'line-opacity', op);
    });

    document.getElementById('toggle-bri-cable').addEventListener('change', (e) => {
        const op = e.target.checked ? 1 : 0;
        map.setPaintProperty('peace-cable-line', 'line-opacity', op);
    });

    document.getElementById('toggle-cable-nodes').addEventListener('change', (e) => {
        const op = e.target.checked ? 1 : 0;
        map.setPaintProperty('cable-nodes-layer', 'circle-opacity', op);
        map.setPaintProperty('cable-nodes-layer', 'circle-stroke-opacity', op);
    });

    document.getElementById('toggle-railway-nodes').addEventListener('change', (e) => {
        const op = e.target.checked ? 1 : 0;
        map.setPaintProperty('railway-nodes-layer', 'circle-opacity', op);
        map.setPaintProperty('railway-nodes-layer', 'circle-stroke-opacity', op);
    });

    // Node Interactive Popup Logic
    const nodePopup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        className: 'node-popup-container',
        offset: 8
    });

    // Network Lines Interactive Popup Logic
    const networkLayers = ['peace-cable-line', 'blue-cable-line', 'raman-cable-line'];
    
    networkLayers.forEach(layerId => {
        map.on('mouseenter', layerId, (e) => {
            map.getCanvas().style.cursor = 'pointer';
        });

        map.on('mouseleave', layerId, (e) => {
            map.getCanvas().style.cursor = '';
        });

        map.on('click', layerId, (e) => {
            if (e.features.length === 0) return;
            const props = e.features[0].properties;
            const title = props.System || 'Cable System';
            
            const html = `
                <div class="node-popup">
                    <h4>${title}</h4>
                    <table class="metadata-table">
                        <tr><td>Segment</td><td>${props.Segment || 'N/A'}</td></tr>
                        <tr><td>Alignment</td><td>${props.Alignment || 'N/A'}</td></tr>
                        <tr><td>Status</td><td>${props.Status || 'N/A'}</td></tr>
                    </table>
                </div>
            `;
            nodePopup.setLngLat(e.lngLat).setHTML(html).addTo(map);
        });
    });

    const nodeLayers = ['cable-nodes-layer', 'railway-nodes-layer'];
    
    nodeLayers.forEach(layerId => {
        map.on('mouseenter', layerId, (e) => {
            map.getCanvas().style.cursor = 'pointer';
            
            // Set feature state for radius enlarge if features have IDs
            if (e.features.length > 0 && e.features[0].id !== undefined) {
                map.setFeatureState(
                    { source: e.features[0].source, id: e.features[0].id },
                    { hover: true }
                );
            }
        });

        map.on('mouseleave', layerId, (e) => {
            map.getCanvas().style.cursor = '';
            
            // Remove feature state hover
            if (e.features.length > 0 && e.features[0].id !== undefined) {
                map.setFeatureState(
                    { source: e.features[0].source, id: e.features[0].id },
                    { hover: false }
                );
            }
        });

        map.on('click', layerId, (e) => {
            if (e.features.length === 0) return;
            const props = e.features[0].properties;
            const coords = e.features[0].geometry.coordinates.slice();

            const title = props.Facility_Name || props.Station_Name || "Node";
            const systemOrGauge = props.System || props.Gauge || "N/A";
            const ownerOrStatus = props.Owners || props.Status || "N/A";
            const systemLabel = props.System ? "System" : "Gauge";
            const ownerLabel = props.Owners ? "Owners" : "Status";
            
            // Safely copy country or track usage
            const detailLabel = props.Country ? "Country" : "Usage";
            const detailVal = props.Country || props.Track_Usage || "N/A";

            const html = `
                <div class="node-popup">
                    <h4>${title}</h4>
                    <table class="metadata-table">
                        <tr><td>Type</td><td>${props.Node_Type || 'Unknown'}</td></tr>
                        <tr><td>${detailLabel}</td><td>${detailVal}</td></tr>
                        <tr><td>${systemLabel}</td><td>${systemOrGauge}</td></tr>
                        <tr><td>${ownerLabel}</td><td>${ownerOrStatus}</td></tr>
                    </table>
                </div>
            `;

            nodePopup.setLngLat(coords)
                     .setHTML(html)
                     .addTo(map);
        });
    });

    document.getElementById('toggle-datacenters').addEventListener('change', (e) => {
        const displayType = e.target.checked ? 'block' : 'none';
        datacenterMarkers.forEach(m => {
            m.getElement().style.display = displayType;
        });
    });

    // Local Native Map Animations utilizing ease logic parameters
    const regions = {
        'europe': { center: [14.0, 42.0], zoom: 5, pitch: 40, bearing: -10 },
        'middle-east': { center: [45.0, 26.0], zoom: 4.5, pitch: 40, bearing: -15 },
        'india': { center: [72.8, 19.1], zoom: 6, pitch: 40, bearing: 10 },
        'overview': { center: [45.0, 30.0], zoom: 3.5, pitch: 40, bearing: -15 }
    };

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const region = e.target.getAttribute('data-region');
            if (regions[region]) {
                map.flyTo({
                    ...regions[region],
                    essential: true,
                    duration: 2500
                });
            }
        });
    });
});
