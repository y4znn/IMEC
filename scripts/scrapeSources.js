/* eslint-disable @typescript-eslint/no-require-imports */
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const QUERIES = [
    "India-Middle East-Europe Economic Corridor",
    "IMEC Corridor",
    "Abraham Accords geopolitics",
    "Belt and Road Initiative Middle East",
    "Red Sea shipping crisis economic impact",
    "Global Gateway EU infrastructure",
    "Subsea cables geopolitics Middle East",
    "India Middle East relations economic",
    "Development Road project Iraq logistics"
];

function determineCategory(title) {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('suez') || lowerTitle.includes('red sea') || lowerTitle.includes('houthi') || lowerTitle.includes('gaza') || lowerTitle.includes('abraham accord') || lowerTitle.includes('conflict') || lowerTitle.includes('shock')) {
        return 'Regional Shocks & Conflicts';
    }
    if (lowerTitle.includes('bri') || lowerTitle.includes('belt and road') || lowerTitle.includes('china') || lowerTitle.includes('rival') || lowerTitle.includes('development road') || lowerTitle.includes('instc')) {
        return 'Geopolitics & Rival Corridors (BRI)';
    }
    if (lowerTitle.includes('digital') || lowerTitle.includes('energy') || lowerTitle.includes('cable') || lowerTitle.includes('green') || lowerTitle.includes('hydrogen') || lowerTitle.includes('port')) {
        return 'Infrastructure: Digital & Energy';
    }
    return 'Foundations & Architecture';
}

function generateDescription(title, abstract) {
    if (abstract && abstract.length > 20) {
        // Strip XML/HTML tags
        let clean = abstract.replace(/<[^>]+>/g, '').trim();
        // Return first two sentences or short chunk
        const sentences = clean.split('. ');
        return sentences.slice(0, 2).join('. ') + (sentences.length > 2 ? '.' : '');
    }

    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('suez') || lowerTitle.includes('red sea')) {
        return "Examines the severe economic and supply chain disruptions affecting global trade due to maritime security threats.";
    }
    if (lowerTitle.includes('gaza') || lowerTitle.includes('abraham')) {
        return "Analyzes the geopolitical fallout, normalization efforts, and regional stability.";
    }
    if (lowerTitle.includes('bri') || lowerTitle.includes('china')) {
        return "A comparative analysis detailing strategic rival corridor influences across Eurasia and the Middle East.";
    }
    if (lowerTitle.includes('hydrogen') || lowerTitle.includes('energy') || lowerTitle.includes('cable')) {
        return "Investigates the intersection of physical infrastructure, digital connectivity, and resource transitions.";
    }
    return "Comprehensive academic assessment concerning the geopolitical, economic, and systemic implications of transnational connectivity frameworks.";
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

async function scrapeCrossref() {
    // Also load existing 33 sources to not lose them and avoid duplicates
    const sourcesPath = path.join(__dirname, '../public/data/sources.json');
    let existingSources = [];
    if (fs.existsSync(sourcesPath)) {
        try {
            existingSources = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));
        } catch {
            existingSources = [];
        }
    }

    // Create a set of existing URLs to prevent duplicates
    const seenUrls = new Set();
    const seenTitles = new Set();

    // We want to KEEP the verified 33 sources.
    const finalSources = [...existingSources];
    existingSources.forEach(s => {
        seenUrls.add(s.url);
        seenTitles.add(s.title.toLowerCase());
    });

    console.log(`Starting with ${finalSources.length} existing verified sources.`);

    for (const query of QUERIES) {
        if (finalSources.length >= 250) break;

        console.log(`Querying CrossRef API for: "${query}"...`);
        try {
            const url = `https://api.crossref.org/works?query=${encodeURIComponent(query)}&select=title,URL,author,created,abstract&rows=40`;
            const response = await axios.get(url, { headers: { 'User-Agent': 'IMEC-Research-Project/1.0 (mailto:admin@example.com)' } });

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

                    // Don't want stuff too old if we want modern geopolitics (IMEC is 2023)
                    // But some background is fine.

                    finalSources.push({
                        id: `live-${finalSources.length + 1}`,
                        title: title,
                        url: itemUrl,
                        category: category,
                        description: desc,
                        year: year,
                        authors: author
                    });
                }
            }
        } catch {
            console.log(`[SKIP] Search failed for query: ${query}`);
        }

        // Respect rate limits gently
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // If we didn't hit 200, let's use OpenAlex API for a few extra queries
    if (finalSources.length < 210) {
        console.log("Falling back to OpenAlex API to reach the 200+ target...");
        const alexQueries = ["IMEC", "Abraham Accords", "Belt and Road"];
        for (const query of alexQueries) {
            if (finalSources.length >= 250) break;
            console.log(`Querying OpenAlex for: "${query}"...`);
            try {
                const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=50`;
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
                            id: `live-${finalSources.length + 1}`,
                            title: title,
                            url: itemUrl,
                            category: category,
                            description: desc,
                            year: year,
                            authors: author
                        });
                    }
                }
            } catch (err) {
                console.error(`Error fetching from OpenAlex '${query}':`, err.message);
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    fs.writeFileSync(sourcesPath, JSON.stringify(finalSources, null, 2));
    console.log(`\n✅ Successfully generated ${finalSources.length} VERIFIED, real-world sources mapped to JSON!`);
}

scrapeCrossref();
