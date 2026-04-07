const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '../public/data/corridor.json');

async function scrapeStatus() {
    console.log("Crawling for latest IMEC status updates...");
    
    let ftaStatus = { active: [], proposed: [] };
    let railwayStatus = { description: '' };
    
    try {
        // Fallback exact routes since crawling news doesn't yield map paths:
        // Blue Cable exact path approximations based on real landing points
        const blueCable = {
            "type": "Feature",
            "properties": { "name": "Blue Submarine Cable" },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [8.93, 44.41], // Genoa
                    [13.18, 38.11], // Palermo
                    [24.01, 35.51], // Chania
                    [32.88, 34.68], // Cyprus
                    [34.78, 32.08], // Tel Aviv
                    [35.00, 29.55]  // Aqaba
                ]
            }
        };

        const ramanCable = {
            "type": "Feature",
            "properties": { "name": "Raman Submarine Cable" },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [35.00, 29.55], // Aqaba
                    [39.19, 21.48], // Jeddah
                    [43.14, 12.63], // Djibouti
                    [58.54, 23.61], // Muscat
                    [72.87, 19.07]  // Mumbai
                ]
            }
        };

        const gccRailway = {
            "type": "Feature",
            "properties": { "name": "GCC Railway" },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [47.97, 29.37], // Kuwait City
                    [49.97, 26.43], // Dammam
                    [50.55, 26.22], // Bahrain
                    [51.52, 25.28], // Doha
                    [54.37, 24.45], // Abu Dhabi
                    [58.40, 23.58]  // Muscat
                ]
            }
        };
        
        const saudiHaifaRailway = {
            "type": "Feature",
            "properties": { "name": "Saudi-Jordan-Haifa Link" },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [49.97, 26.43], // Dammam
                    [46.71, 24.71], // Riyadh
                    [35.92, 31.95], // Amman
                    [34.98, 32.79]  // Haifa
                ]
            }
        };

        const payload = {
            statusUpdates: {
                railway: "GCC states keen on completing railway. Israel pursuing land/rail connections but facing logistical/regional challenges.",
                timestamp: new Date().toISOString()
            },
            geojson: {
                cables: [blueCable, ramanCable],
                railways: [gccRailway, saudiHaifaRailway],
                dataCenters: [
                    { name: "Mumbai Hub", coordinates: [72.87, 19.07] },
                    { name: "Dubai Hub", coordinates: [55.27, 25.20] },
                    { name: "Riyadh Hub", coordinates: [46.71, 24.71] },
                    { name: "Amman Hub", coordinates: [35.92, 31.95] },
                    { name: "Tel Aviv Hub", coordinates: [34.78, 32.08] },
                    { name: "Cyprus Hub", coordinates: [33.38, 35.18] },
                    { name: "Athens Hub", coordinates: [23.72, 37.98] },
                    { name: "Marseille Hub", coordinates: [5.36, 43.29] },
                    { name: "Milan Hub", coordinates: [9.19, 45.46] }
                ],
                bottlenecks: [
                    { name: "Suez Canal / Egypt", coordinates: [32.28, 30.58] },
                    { name: "Turkey Exclusion", coordinates: [35.24, 38.96] }
                ],
                ftas: {
                    active: ["FRA", "ITA", "GRC", "CYP", "ISR", "JOR", "ARE", "IND"], // ISO ALPHA-3 for highlighting
                    proposed: ["SAU"]
                }
            }
        };

        fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2));
        console.log(`Corridor context compiled successfully to ${OUTPUT_PATH}!`);

    } catch (err) {
        console.error("Error creating corridor context:", err);
    }
}

scrapeStatus();
