const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const queries = [
    "India–Middle East–Europe Economic Corridor: Geoeconomic Architecture",
    "IMEC corridor logistics and supply chain analysis",
    "India Middle East Europe Economic Corridor geopolitical impact",
    "Blue-Raman submarine cable system geopolitics",
    "Saudi Arabia UAE green hydrogen export infrastructure",
    "Israel Haifa port Adani investments IMEC",
    "Iraq Development Road project vs IMEC competition",
    "Red Sea Houthi attacks impact on global supply chains and IMEC",
    "Abraham Accords normalization impact on Middle East trade routes",
    "EU Global Gateway strategy and India-Middle East connections",
    "Gaza conflict impact on regional infrastructure projects",
    "Jordan railway financing gap logistics hub"
];

function determineCategory(title, snippet) {
    const text = (title + " " + snippet).toLowerCase();
    if (text.includes('suez') || text.includes('red sea') || text.includes('houthi') || text.includes('gaza') || text.includes('abraham accord') || text.includes('conflict') || text.includes('shock')) {
        return 'Regional Shocks & Conflicts';
    }
    if (text.includes('bri') || text.includes('belt and road') || text.includes('china') || text.includes('rival') || text.includes('development road') || text.includes('instc')) {
        return 'Geopolitics & Rival Corridors (BRI)';
    }
    if (text.includes('digital') || text.includes('energy') || text.includes('cable') || text.includes('green') || text.includes('hydrogen') || text.includes('port')) {
        return 'Infrastructure: Digital & Energy';
    }
    return 'Foundations & Architecture';
}

function summarizeText(text) {
    if (!text) return "A key geoeconomic analysis of the India-Middle East-Europe Economic Corridor.";
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    return sentences.slice(0, 2).join(' ').trim() || text;
}

function extractDomain(urlStr) {
    try {
        const url = new URL(urlStr);
        return url.hostname.replace('www.', '');
    } catch (e) {
        return "Publisher";
    }
}

async function scrapeDuckDuckGo() {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.createBrowserContext();
    const page = await context.newPage();

    // Set a realistic User Agent
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
    });

    const results = [];
    const seenUrls = new Set();
    const seenTitles = new Set();

    for (const query of queries) {
        console.log(`Scraping for query: "${query}"...`);
        try {
            await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // Wait slightly to prevent bot blocks
            await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 1500));

            const items = await page.evaluate(() => {
                const elements = document.querySelectorAll('.result');
                const extracted = [];
                for (let i = 0; i < Math.min(elements.length, 15); i++) {
                    const row = elements[i];
                    const titleEl = row.querySelector('.result__title a');
                    const snippetEl = row.querySelector('.result__snippet');
                    const urlEl = row.querySelector('.result__url');

                    if (titleEl && urlEl) {
                        extracted.push({
                            title: titleEl.innerText.trim(),
                            snippet: snippetEl ? snippetEl.innerText.trim() : "",
                            url: urlEl.getAttribute('href')
                        });
                    }
                }
                return extracted;
            });

            for (let item of items) {
                let realUrl = item.url;
                if (realUrl.includes('//duckduckgo.com/l/?uddg=')) {
                    try {
                        const uddgMatch = realUrl.match(/uddg=([^&]+)/);
                        if (uddgMatch && uddgMatch[1]) {
                            realUrl = decodeURIComponent(uddgMatch[1]);
                        }
                    } catch (e) { }
                }

                if (seenUrls.has(realUrl) || seenTitles.has(item.title.toLowerCase())) continue;

                seenUrls.add(realUrl);
                seenTitles.add(item.title.toLowerCase());

                const category = determineCategory(item.title, item.snippet);
                const summary = summarizeText(item.snippet);
                const publisher = extractDomain(realUrl);
                const currentYear = new Date().getFullYear().toString();

                results.push({
                    id: `live-${results.length + 1}`,
                    title: item.title,
                    url: realUrl,
                    category: category,
                    description: summary,
                    year: currentYear,
                    authors: publisher
                });
            }
        } catch (err) {
            console.warn(`Attempt failed for query "${query}": ${err.message}`);
        }
    }

    console.log(`Closing browser. Extracted ${results.length} total unique results.`);
    await browser.close();

    const targetPath = path.join(__dirname, '../public/data/sources.json');
    fs.writeFileSync(targetPath, JSON.stringify(results, null, 2), 'utf-8');

    console.log(`✅ Refreshed Sources: Saved ${results.length} articles to public/data/sources.json`);
}

scrapeDuckDuckGo();
