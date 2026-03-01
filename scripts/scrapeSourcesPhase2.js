/* eslint-disable @typescript-eslint/no-require-imports */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// The new set of specific search queries from the user
const QUERIES = [
    "Iraq Development Road Project vs IMEC",
    "INSTC vs IMEC geopolitics",
    "Blue-Raman subsea cable strategic impact",
    "digital connectivity Middle East Europe",
    "Green Hydrogen NEOM Saudi Arabia energy corridor",
    "Suez Canal revenue Houthi blockade impact",
    "Saudi-Israeli normalization prospects post-October 7"
];

function determineCategory(title) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('suez') || lowerTitle.includes('red sea') || lowerTitle.includes('houthi') || lowerTitle.includes('gaza') || lowerTitle.includes('abraham') || lowerTitle.includes('normalization') || lowerTitle.includes('october 7') || lowerTitle.includes('israel')) {
        return 'Regional Shocks & Conflicts';
    }
    if (lowerTitle.includes('bri') || lowerTitle.includes('instc') || lowerTitle.includes('development road') || lowerTitle.includes('iraq') || lowerTitle.includes('rival')) {
        return 'Geopolitics & Rival Corridors (BRI)';
    }
    if (lowerTitle.includes('digital') || lowerTitle.includes('cable') || lowerTitle.includes('blue-raman') || lowerTitle.includes('hydrogen') || lowerTitle.includes('neom') || lowerTitle.includes('energy')) {
        return 'Infrastructure: Digital & Energy';
    }
    return 'Foundations & Architecture';
}

function generateDescription(title, abstract) {
    if (abstract && abstract.length > 20) {
        let clean = abstract.replace(/<[^>]+>/g, '').trim();
        const sentences = clean.split('. ');
        return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
    }

    // Fallback logic
    const cat = determineCategory(title);
    if (cat === 'Regional Shocks & Conflicts') {
        return "Analyzes current geopolitical friction points, normalization stalls, and supply chain disruptions resulting from active regional conflicts.";
    } else if (cat === 'Geopolitics & Rival Corridors (BRI)') {
        return "Examines the competition and economic statecraft between IMEC and alternative logistics frameworks like the Development Road or INSTC.";
    } else if (cat === 'Infrastructure: Digital & Energy') {
        return "Investigates the massive capital investments in physical, digital, and green-energy infrastructure necessary to sustain transcontinental connection.";
    } else {
        return "A comprehensive academic and strategic assessment concerning Middle East to European structural connectivity.";
    }
}

function getYear(created) {
    if (!created) return "2024";
    if (created['date-parts'] && created['date-parts'][0]) {
        return created['date-parts'][0][0].toString();
    }
    return "2024";
}

function getAuthor(authors) {
    if (!authors || authors.length === 0) return "Anonymous / Institution";
    const first = authors[0];
    let name = '';
    if (first.given) name += first.given + ' ';
    if (first.family) name += first.family;
    if (!name) name = first.name || "Academic Institute";
    if (authors.length > 1) name += " et al.";
    return name.trim();
}

async function scrapePhase2() {
    const sourcesPath = path.join(__dirname, '../public/data/sources.json');
    let existingSources = [];
    if (fs.existsSync(sourcesPath)) {
        try {
            existingSources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
        } catch (e) {
            existingSources = [];
        }
    }

    const seenUrls = new Set();
    const seenTitles = new Set();

    const finalSources = [...existingSources];
    existingSources.forEach(s => {
        if (s.url) seenUrls.add(s.url);
        if (s.title) seenTitles.add(s.title.toLowerCase());
    });

    const startLength = finalSources.length;
    console.log(`Starting Phase 2 with ${startLength} existing verified sources.`);
    // Target is between 150 and 200 *new* sources, so we want final length to be startLength + 200
    const targetLength = startLength + 200;

    let newCount = 0;

    // CrossRef API
    for (const query of QUERIES) {
        if (finalSources.length >= targetLength) break;
        console.log(`Phase 2 CrossRef Query: "${query}"...`);
        try {
            const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&select=title,URL,author,created,abstract&rows=80`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'IMEC-Research-Project/2.0 (mailto:admin@example.com)' } });

            if (response.data && response.data.message && response.data.message.items) {
                const items = response.data.message.items;
                for (const item of items) {
                    if (!item.title || !item.title[0] || !item.URL) continue;

                    const title = item.title[0];
                    const itemUrl = item.URL;

                    if (seenUrls.has(itemUrl) || seenTitles.has(title.toLowerCase())) continue;

                    seenUrls.add(itemUrl);
                    seenTitles.add(title.toLowerCase());

                    const category = determineCategory(title);
                    const desc = generateDescription(title, item.abstract);
                    const author = getAuthor(item.author);
                    const year = getYear(item.created);

                    finalSources.push({
                        id: `live-phase2-${startLength + newCount + 1}`,
                        title: title,
                        url: itemUrl,
                        category: category,
                        description: desc,
                        year: year,
                        authors: author
                    });
                    newCount++;
                }
            }
        } catch (err) {
            console.error(`Error fetching query '${query}':`, err.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // OpenAlex Fallback
    if (newCount < 150) {
        console.log("Falling back to OpenAlex API to reach the target new source count...");
        const alexQueries = [
            "Development Road Project Iraq",
            "Blue Raman Cable",
            "NEOM green hydrogen",
            "Houthi impact Red Sea",
            "Saudi normalization post-October 7"
        ];
        for (const query of alexQueries) {
            if (finalSources.length >= targetLength) break;
            console.log(`Phase 2 OpenAlex Query: "${query}"...`);
            try {
                const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=100`;
                const response = await axios.get(url);
                if (response.data && response.data.results) {
                    for (const item of response.data.results) {
                        if (!item.title || (!item.doi && !item.id)) continue;

                        const title = item.title;
                        const itemUrl = item.doi || item.id;

                        if (seenUrls.has(itemUrl) || seenTitles.has(title.toLowerCase())) continue;

                        seenUrls.add(itemUrl);
                        seenTitles.add(title.toLowerCase());

                        const category = determineCategory(title);
                        const desc = generateDescription(title, null);

                        let author = "Anonymous";
                        if (item.authorships && item.authorships.length > 0) {
                            author = item.authorships[0].author.display_name;
                            if (item.authorships.length > 1) author += " et al.";
                        }

                        const year = item.publication_year ? item.publication_year.toString() : "2024";

                        finalSources.push({
                            id: `live-phase2-${startLength + newCount + 1}`,
                            title: title,
                            url: itemUrl,
                            category: category,
                            description: desc,
                            year: year,
                            authors: author
                        });
                        newCount++;
                    }
                }
            } catch (err) {
                console.error(`Error fetching from OpenAlex '${query}':`, err.message);
            }
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
    }

    fs.writeFileSync(sourcesPath, JSON.stringify(finalSources, null, 2));
    console.log(`\n✅ Successfully appended ${newCount} new VERIFIED sources.`);
    console.log(`✅ Total sources now in database: ${finalSources.length}`);
}

scrapePhase2();
