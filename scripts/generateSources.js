/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const institutions = [
    'Atlantic Council', 'Observer Research Foundation (ORF)', 'INSS Israel', 'RAND Corporation',
    'Middle East Institute', 'CSIS', 'Brookings Institution', 'Chatham House', 'CFR',
    'IISS', 'ECFR', 'Hoover Institution', 'Hudson Institute'
];

const topics = [
    'Geopolitics of Connectivity', 'Strategic Rebalancing', 'Digital Corridors',
    'Supply Chain Resilience', 'Infrastructure Warfare', 'Eurasian Integration',
    'Port Deepening', 'Subsea Cable Networks', 'Economic Statecraft',
    'Railway Diplomacy', 'Energy Transit Routes', 'Maritime Security'
];

const regions = [
    'West Asia', 'the Indo-Pacific', 'the Levant', 'the Eastern Mediterranean',
    'the Global South', 'the Red Sea Basin', 'the Arabian Peninsula', 'Eurasia'
];

const docTypes = ['Research Paper', 'Policy Brief', 'Strategic Report', 'Working Paper', 'Journal Article', 'Monograph'];
const randTags = ['Geopolitics', 'Economics', 'Trade', 'Security', 'Infrastructure', 'Diplomacy', 'Technology', 'Energy'];

const allSources = [];

for (let i = 1; i <= 650; i++) {
    const inst = institutions[i % institutions.length];
    const topic = topics[i % topics.length];
    const region = regions[i % regions.length];
    const type = docTypes[i % docTypes.length];

    // Distribute quadrants logically or pseudorandomly
    // Let's make Q1 the rarest, and Q4 the most common
    let q = 'Q4';
    if (i % 10 === 0) q = 'Q1';
    else if (i % 5 === 0) q = 'Q2';
    else if (i % 3 === 0) q = 'Q3';

    const tag1 = randTags[i % randTags.length];
    const tag2 = randTags[(i * 3) % randTags.length];

    allSources.push({
        id: `src-${i}`,
        title: `${topic} in ${region}: A Strategic Assessment v${i}`,
        author: inst,
        year: `${2015 + (i % 10)}`, // Generates years between 2015 and 2024
        type: type,
        tags: Array.from(new Set([tag1, tag2])),
        url: `https://doi.org/10.1000/imec.${i}`,
        quadrant: q
    });
}

// Sort by year descending
allSources.sort((a, b) => parseInt(b.year) - parseInt(a.year));

const outPath = path.join(__dirname, '../public/data/sources.json');

fs.writeFileSync(outPath, JSON.stringify(allSources, null, 2));

console.log(`Successfully generated ${allSources.length} sources to ${outPath}`);
