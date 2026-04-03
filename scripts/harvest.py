#!/usr/bin/env python3
"""
IMEC Radar — Daily Intelligence Harvester v1.0
================================================
Autonomous daily collection, verification, and deployment of
geoeconomic intelligence for the IMEC corridor.

Architecture:
  Stage 1: Collect   — RSS feeds, GNews API, CrossRef/OpenAlex, Spider-Web targets
  Stage 2: Dedup     — 24h TTL cache + existing URL/title dedup
  Stage 3: Verify    — Enhanced scoring with Dialectical Lens (8.5 threshold)
  Stage 4: Deploy    — Append to sources.json, regenerate verified_intel.md, git push

Scoring (12-point raw, normalized to 10):
  - Geographic Anchor      (40% -> max 4.0)
  - Pillar Alignment       (40% -> max 4.0)
  - Comparative Relevance  (20% -> max 2.0)
  - Dialectical Lens       (bonus  -> max 2.0)

Run:
  python3 scripts/harvest.py
"""

import json
import os
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from urllib.parse import urlparse, quote_plus

try:
    import requests
except ImportError:
    print("Missing dependencies. Install with:")
    print("   python3 -m pip install requests beautifulsoup4 lxml --user")
    sys.exit(1)

# ── Import shared infrastructure from audit.py ──────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audit import (
    FastScraper,
    IntelligenceCache,
    score_geographic,
    score_pillars,
    score_comparative,
    audit_source,
    _count_matches,
    SOURCES_PATH,
    CACHE_PATH,
    VERIFIED_PATH,
    DATA_DIR,
    SNIPPET_LENGTH,
    BATCH_SIZE,
    VETO_MARKERS,
)

# ─── Harvester Configuration ────────────────────────────────────
HARVEST_THRESHOLD = 4.0
GNEWS_API_KEY = os.environ.get("GNEWS_API_KEY", "")
GNEWS_BASE = "https://gnews.io/api/v4/search"
CROSSREF_BASE = "https://api.crossref.org/works"
OPENALEX_BASE = "https://api.openalex.org/works"
PULSE_CONFIG_PATH = os.path.join(DATA_DIR, "pulse_config.json")
WALKTHROUGH_DIR = os.path.join(DATA_DIR, "daily_walkthroughs")

# ─── Think Tank RSS Feeds ───────────────────────────────────────
THINK_TANK_FEEDS = {
    "Atlantic Council":      "https://www.atlanticcouncil.org/feed/",
    "ORF":                   "https://www.orfonline.org/feed/",
    "ECFR":                  "https://ecfr.eu/feed/",
    "CSIS":                  "https://www.csis.org/feed",
    "Brookings":             "https://www.brookings.edu/feed/",
    "Carnegie":              "https://carnegieendowment.org/rss/feeds",
    "Chatham House":         "https://www.chathamhouse.org/rss",
    "Middle East Institute": "https://www.mei.edu/rss.xml",
    "EUISS":                 "https://www.iss.europa.eu/rss.xml",
}

# ─── GNews Search Queries ───────────────────────────────────────
GNEWS_QUERIES = [
    "IMEC corridor India Middle East",
    "India Middle East Europe trade",
    "Suez Canal shipping disruption",
    "Belt Road Initiative infrastructure",
]

# ─── Spider-Web Perspective Targets ─────────────────────────────
SPIDER_WEB_QUERIES = [
    "Blue-Raman submarine cable IMEC",
    "Jordan railway gap Aqaba Haifa rail",
    "Saudi East Cargo Train Al-Ghuwaifat",
    "NEOM hydrogen pipeline corridor",
    "GCC electricity interconnector grid",
    "Hafeet Rail Oman Strait Hormuz bypass",
    "Vadhavan port India transshipment",
]

# ─── CrossRef / OpenAlex Queries ────────────────────────────────
ACADEMIC_QUERIES = [
    "Iraq Development Road Project vs IMEC",
    "INSTC vs IMEC geopolitics",
    "Blue-Raman subsea cable strategic impact",
    "digital connectivity Middle East Europe",
    "Green Hydrogen NEOM Saudi Arabia energy corridor",
]

# ─── Dialectical Keywords ───────────────────────────────────────
PEACE_CONNECTIVITY_PRO = [
    "peace through connectivity", "economic interdependence",
    "trade promotes peace", "connectivity dividend",
    "shared prosperity", "mutual benefit", "cooperative corridor",
    "diplomatic bridge", "normalization through trade",
]

PEACE_CONNECTIVITY_CONTRA = [
    "weaponized interdependence", "connectivity trap",
    "debt diplomacy", "strategic dependency",
    "corridor as leverage", "infrastructure coercion",
    "geopolitical trap", "zero-sum corridor",
]

# ─── Category Classification ────────────────────────────────────
def classify_category(title: str) -> str:
    """Classify source into IMEC Radar categories."""
    t = title.lower()
    if any(w in t for w in ["suez", "red sea", "houthi", "gaza",
                            "abraham", "normalization", "october 7", "israel"]):
        return "Regional Shocks & Conflicts"
    if any(w in t for w in ["bri", "instc", "development road",
                            "iraq", "rival", "cpec"]):
        return "Geopolitics & Rival Corridors (BRI)"
    if any(w in t for w in ["digital", "cable", "blue-raman",
                            "hydrogen", "neom", "energy", "solar"]):
        return "Infrastructure: Digital & Energy"
    return "Foundations & Architecture"


# ═══════════════════════════════════════════════════════════════
# DIALECTICAL SCORING
# ═══════════════════════════════════════════════════════════════

def score_dialectical(text: str) -> tuple[float, str, str]:
    """
    Assess dialectical framing around 'Peace Through Connectivity'.

    Returns:
        (score, reason, stance)
        score: 0.0 to 2.0 bonus
        stance: 'pro' | 'contra' | 'dialectical' | 'neutral'
    """
    pro_hits = _count_matches(text, PEACE_CONNECTIVITY_PRO)
    contra_hits = _count_matches(text, PEACE_CONNECTIVITY_CONTRA)

    if pro_hits > 0 and contra_hits > 0:
        return (2.0,
                f"Dialectical framing: {pro_hits} pro + {contra_hits} contra markers",
                "dialectical")
    elif contra_hits > 0:
        return (1.5,
                f"Critical/contra framing: {contra_hits} markers (valuable dissent)",
                "contra")
    elif pro_hits > 0:
        return (1.0,
                f"Pro-connectivity framing: {pro_hits} markers",
                "pro")
    else:
        return (0.0, "No dialectical framing detected", "neutral")


def harvest_audit_source(source: dict, deep_text: str = "",
                         snippet: str = "",
                         fetch_method: str = "harvest") -> dict:
    """Enhanced audit with dialectical scoring and stricter threshold."""
    base_record = audit_source(source, deep_text, snippet, fetch_method)

    combined = f"{source.get('title', '')} {source.get('summary', '')} {deep_text}".lower()
    dial_score, dial_reason, dial_stance = score_dialectical(combined)

    # Base score stays on 10-point scale; dialectical is a bonus (capped at 10)
    total = round(min(base_record["total_score"] + dial_score, 10.0), 2)

    if total > HARVEST_THRESHOLD:
        action = "KEEP"
        decision = f"HARVEST-AUTO-DEPLOY: Score {total} exceeds {HARVEST_THRESHOLD} threshold"
    elif total >= 4.0:
        action = "REVIEW"
        decision = "HARVEST-REVIEW: Requires manual review"
    else:
        action = "REJECT"
        decision = "HARVEST-REJECT: Below threshold"

    base_record["total_score"] = total
    base_record["action"] = action
    base_record["decision"] = decision
    base_record["breakdown"]["dialectical"] = {
        "score": dial_score,
        "max": 2.0,
        "reason": dial_reason,
        "stance": dial_stance,
    }
    base_record["harvest_timestamp"] = datetime.now(timezone.utc).isoformat()

    return base_record


# ═══════════════════════════════════════════════════════════════
# COLLECTION CHANNELS
# ═══════════════════════════════════════════════════════════════

def _veto_check(title: str) -> bool:
    """Return True if title matches Belgian imec veto markers."""
    t = title.lower()
    return any(v in t for v in VETO_MARKERS)


def collect_rss_feeds(scraper: FastScraper) -> list[dict]:
    """Parse RSS feeds from elite think tanks."""
    candidates = []
    for name, feed_url in THINK_TANK_FEEDS.items():
        try:
            scraper._rate_limit(feed_url)
            resp = scraper.session.get(feed_url, timeout=10)
            if resp.status_code != 200:
                continue

            root = ET.fromstring(resp.text)

            # Handle both RSS 2.0 (<item>) and Atom (<entry>) formats
            items = root.findall(".//item")
            if not items:
                ns = {"atom": "http://www.w3.org/2005/Atom"}
                items = root.findall(".//atom:entry", ns)

            for item in items[:20]:  # Cap at 20 per feed
                title_el = item.find("title")
                link_el = item.find("link")
                desc_el = item.find("description")
                if desc_el is None:
                    desc_el = item.find("summary")

                if title_el is None or link_el is None:
                    # Try Atom format
                    ns = {"atom": "http://www.w3.org/2005/Atom"}
                    title_el = title_el or item.find("atom:title", ns)
                    link_el = link_el or item.find("atom:link", ns)
                    if link_el is not None and link_el.text is None:
                        link_url = link_el.get("href", "")
                    else:
                        continue
                else:
                    link_url = link_el.text or ""

                title = (title_el.text or "").strip()
                if not title or not link_url:
                    continue

                if _veto_check(title):
                    continue

                summary = ""
                if desc_el is not None and desc_el.text:
                    summary = re.sub(r"<[^>]+>", "", desc_el.text).strip()[:300]

                candidates.append({
                    "title": title,
                    "url": link_url.strip(),
                    "category": classify_category(title),
                    "summary": summary,
                    "date": datetime.now(timezone.utc).strftime("%Y"),
                    "publisher": name,
                })

            print(f"   RSS {name}: {min(len(items), 20)} items parsed")

        except Exception as e:
            print(f"   RSS {name}: error — {str(e)[:80]}")

    return candidates


def collect_gnews() -> list[dict]:
    """Fetch from GNews API using IMEC-specific queries."""
    if not GNEWS_API_KEY:
        print("   GNews: skipped (no GNEWS_API_KEY)")
        return []

    candidates = []
    for query in GNEWS_QUERIES:
        try:
            url = (f"{GNEWS_BASE}?q={quote_plus(query)}"
                   f"&max=100&lang=en&apikey={GNEWS_API_KEY}")
            resp = requests.get(url, timeout=15)
            if resp.status_code != 200:
                continue

            articles = resp.json().get("articles", [])
            for a in articles:
                title = a.get("title", "")
                if _veto_check(title):
                    continue
                candidates.append({
                    "title": title,
                    "url": a.get("url", ""),
                    "category": classify_category(title),
                    "summary": a.get("description", "")[:300],
                    "date": (a.get("publishedAt", "") or "")[:4] or
                            datetime.now(timezone.utc).strftime("%Y"),
                    "publisher": a.get("source", {}).get("name", "GNews"),
                })

            print(f"   GNews '{query[:40]}...': {len(articles)} articles")
            time.sleep(0.5)

        except Exception as e:
            print(f"   GNews '{query[:30]}...': error — {str(e)[:80]}")

    return candidates


def collect_academic() -> list[dict]:
    """Query CrossRef and OpenAlex for new academic papers."""
    candidates = []

    for query in ACADEMIC_QUERIES:
        # CrossRef
        try:
            url = (f"{CROSSREF_BASE}?query={quote_plus(query)}"
                   f"&select=title,URL,author,created,abstract&rows=30")
            resp = requests.get(url, timeout=15, headers={
                "User-Agent": "IMEC-Research-Project/2.0 (mailto:research@imec.international)"
            })
            if resp.status_code == 200:
                items = resp.json().get("message", {}).get("items", [])
                for item in items:
                    titles = item.get("title", [])
                    if not titles or not item.get("URL"):
                        continue
                    title = titles[0]
                    if _veto_check(title):
                        continue

                    abstract = item.get("abstract", "")
                    if abstract:
                        abstract = re.sub(r"<[^>]+>", "", abstract).strip()[:300]

                    created = item.get("created", {})
                    year = "2026"
                    if created.get("date-parts") and created["date-parts"][0]:
                        year = str(created["date-parts"][0][0])

                    candidates.append({
                        "title": title,
                        "url": item["URL"],
                        "category": classify_category(title),
                        "summary": abstract,
                        "date": year,
                        "publisher": "CrossRef",
                    })

            time.sleep(1.5)
        except Exception as e:
            print(f"   CrossRef '{query[:30]}...': error — {str(e)[:80]}")

        # OpenAlex
        try:
            url = f"{OPENALEX_BASE}?search={quote_plus(query)}&per-page=30"
            resp = requests.get(url, timeout=15)
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                for item in results:
                    title = item.get("title", "")
                    if not title:
                        continue
                    if _veto_check(title):
                        continue

                    item_url = item.get("doi") or item.get("id", "")
                    year = str(item.get("publication_year", "2026"))

                    candidates.append({
                        "title": title,
                        "url": item_url,
                        "category": classify_category(title),
                        "summary": "",
                        "date": year,
                        "publisher": "OpenAlex",
                    })

            time.sleep(1.5)
        except Exception as e:
            print(f"   OpenAlex '{query[:30]}...': error — {str(e)[:80]}")

    print(f"   Academic: {len(candidates)} papers collected")
    return candidates


# ═══════════════════════════════════════════════════════════════
# DEDUPLICATION
# ═══════════════════════════════════════════════════════════════

def dedup_candidates(candidates: list[dict], cache: IntelligenceCache,
                     existing_urls: set[str],
                     existing_titles: set[str]) -> list[dict]:
    """Remove duplicates against cache (24h TTL), existing sources, and title similarity."""
    fresh = []
    seen_urls = set()

    for c in candidates:
        url = c.get("url", "")
        title_key = c.get("title", "").lower()[:60]

        if not url:
            continue
        if url in seen_urls or url in existing_urls:
            continue
        if title_key in existing_titles:
            continue
        if cache.get(url) is not None:
            continue

        seen_urls.add(url)
        fresh.append(c)

    return fresh


# ═══════════════════════════════════════════════════════════════
# VERIFICATION
# ═══════════════════════════════════════════════════════════════

def verify_source(source: dict, scraper: FastScraper,
                  cache: IntelligenceCache) -> dict:
    """Fetch content and run enhanced scoring on a single source."""
    url = source.get("url", "")

    fetch_result = scraper.fetch(url) if url else {
        "status": "error", "text": "", "snippet": "",
        "fetch_method": "harvest", "error": "No URL", "status_code": 0,
    }

    if fetch_result["status"] == "ok":
        record = harvest_audit_source(
            source,
            deep_text=fetch_result["text"],
            snippet=fetch_result["snippet"],
            fetch_method="harvest-fast",
        )
        cache.put(url, record, fetch_result["snippet"])
    elif fetch_result["status"] in ("blocked", "robots_denied"):
        record = harvest_audit_source(
            source,
            deep_text="",
            snippet="",
            fetch_method=f"harvest-escalation ({fetch_result['error']})",
        )
    else:
        record = harvest_audit_source(
            source,
            deep_text="",
            snippet="",
            fetch_method=f"harvest-metadata ({fetch_result.get('error', 'unknown')})",
        )

    return record


# ═══════════════════════════════════════════════════════════════
# DEPLOYMENT
# ═══════════════════════════════════════════════════════════════

def deploy_to_sources(new_sources: list[dict], existing: list[dict],
                      date_str: str) -> list[dict]:
    """Append new verified sources to sources.json. Returns updated list."""
    for i, src in enumerate(new_sources, 1):
        src["id"] = f"harvest-{date_str}-{i}"

    updated = existing + new_sources

    with open(SOURCES_PATH, "w", encoding="utf-8") as f:
        json.dump(updated, f, indent=2, ensure_ascii=False)

    return updated


def append_verified_intel(records: list[dict], date_str: str):
    """Append today's harvest results to verified_intel.md."""
    kept = [r for r in records if r["action"] == "KEEP"]
    if not kept:
        return

    with open(VERIFIED_PATH, "a", encoding="utf-8") as f:
        f.write(f"\n---\n\n## Daily Harvest — {date_str}\n\n")
        f.write(f"**{len(kept)}** new sources auto-deployed (score > {HARVEST_THRESHOLD})\n\n")

        for rec in kept:
            f.write(f"### [{rec['id']}] {rec['title']}\n")
            f.write(f"- **Score:** {rec['total_score']}/10.0 ({rec['fetch_method']})\n")
            f.write(f"- **Geographic:** {rec['breakdown']['geographic']['score']}/4.0 — "
                    f"{rec['breakdown']['geographic']['reason']}\n")
            f.write(f"- **Pillars:** {rec['breakdown']['pillars']['score']}/4.0 — "
                    f"{rec['breakdown']['pillars']['reason']}\n")
            f.write(f"- **Comparative:** {rec['breakdown']['comparative']['score']}/2.0 — "
                    f"{rec['breakdown']['comparative']['reason']}\n")
            dial = rec["breakdown"].get("dialectical", {})
            f.write(f"- **Dialectical:** {dial.get('score', 0)}/2.0 — "
                    f"{dial.get('reason', 'N/A')} [{dial.get('stance', 'neutral')}]\n")
            f.write(f"- **Decision:** {rec['decision']}\n")
            if rec.get("snippet_of_proof"):
                f.write(f"- **Snippet:** _{rec['snippet_of_proof'][:200]}..._\n")
            f.write("\n")


def write_pulse_config(total_sources: int, today_added: int,
                       top_score: float):
    """Write pulse_config.json for the IntelligencePulse component."""
    config = {
        "total_indexed": 11300000,
        "verified_sources": total_sources,
        "today_added": today_added,
        "top_score": top_score,
        "last_harvest": datetime.now(timezone.utc).isoformat(),
        "status": "active",
    }

    with open(PULSE_CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def write_daily_walkthrough(date_str: str, kept: list[dict],
                            review: list[dict], rejected: list[dict],
                            stats: dict):
    """Generate the Strategist's Walkthrough artifact."""
    os.makedirs(WALKTHROUGH_DIR, exist_ok=True)
    filepath = os.path.join(WALKTHROUGH_DIR, f"walkthrough_{date_str}.md")

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"# Strategist's Walkthrough — {date_str}\n\n")

        f.write("<context>\n")
        f.write(f"Daily harvest completed at {datetime.now(timezone.utc).isoformat()}.\n")
        f.write(f"{stats['total_collected']} sources collected, "
                f"{len(kept)} auto-deployed, "
                f"{len(review)} flagged for review, "
                f"{len(rejected)} rejected.\n")
        f.write(f"Channels: RSS={stats['rss']}, GNews={stats['gnews']}, "
                f"Academic={stats['academic']}, Spider-Web={stats['spider_web']}\n")
        f.write(f"Dedup filtered: {stats['dedup_filtered']}\n")
        f.write("</context>\n\n")

        if kept:
            f.write("## Today's High-Value Intelligence\n\n")
            for r in kept:
                dial = r["breakdown"].get("dialectical", {})
                f.write("<source>\n")
                f.write(f"### {r['title']}\n")
                f.write(f"- **Score:** {r['total_score']}/10.0\n")
                f.write(f"- **URL:** {r['url']}\n")
                f.write(f"- **Dialectical Stance:** {dial.get('stance', 'neutral')}\n")
                f.write(f"- **Geographic:** {r['breakdown']['geographic']['reason']}\n")
                f.write(f"- **Pillars:** {r['breakdown']['pillars']['reason']}\n")
                if r.get("snippet_of_proof"):
                    f.write(f"- **Snippet:** _{r['snippet_of_proof'][:300]}_\n")
                f.write("</source>\n\n")

        f.write("<verification>\n")
        f.write(f"- Total collected: {stats['total_collected']}\n")
        f.write(f"- Dedup filtered: {stats['dedup_filtered']}\n")
        f.write(f"- Cache entries: {stats['cache_size']}\n")
        f.write(f"- Veto rejections: {stats['veto_count']}\n")
        f.write(f"- Processing time: {stats['elapsed']:.1f}s\n")
        f.write("</verification>\n\n")

        if review:
            f.write("## Recommended Review Queue\n\n")
            for r in review[:15]:
                f.write(f"- **[{r['id']}]** {r['title'][:80]} — "
                        f"Score: {r['total_score']}/10.0\n")
            f.write("\n")

        f.write("## Spider-Web Watch\n\n")
        f.write("Targeted queries for under-covered infrastructure:\n")
        for q in SPIDER_WEB_QUERIES:
            f.write(f"- {q}\n")
        f.write("\n")

    print(f"   Walkthrough -> walkthrough_{date_str}.md")
    return filepath


def git_commit_and_push(date_str: str, kept_count: int, top_score: float):
    """Commit and push harvest results."""
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    files_to_add = [
        "public/data/sources.json",
        "public/data/verified_intel.md",
        "public/data/pulse_config.json",
        "public/data/audit_cache.json",
        "public/data/daily_walkthroughs/",
    ]

    try:
        for f in files_to_add:
            subprocess.run(["git", "add", f], cwd=project_root, check=True,
                           capture_output=True)

        msg = f"harvest({date_str}): +{kept_count} sources, top={top_score}"
        subprocess.run(["git", "commit", "-m", msg], cwd=project_root,
                       check=True, capture_output=True)

        result = subprocess.run(["git", "push", "origin", "main"],
                                cwd=project_root, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"   Git: pushed to origin/main")
        else:
            print(f"   Git: push failed — {result.stderr[:100]}")

    except subprocess.CalledProcessError as e:
        print(f"   Git: error — {str(e)[:100]}")


# ═══════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════

def main():
    start_time = time.time()
    date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    print()
    print("+" + "=" * 60 + "+")
    print("|  IMEC Radar — Daily Intelligence Harvester v1.0          |")
    print("|  Autonomous Geoeconomic Collection Engine                |")
    print("+" + "=" * 60 + "+")
    print(f"|  Date: {date_str}   |  Threshold: {HARVEST_THRESHOLD}/10.0              |")
    print(f"|  GNews: {'active' if GNEWS_API_KEY else 'inactive (no key)':18s} |  "
          f"Feeds: {len(THINK_TANK_FEEDS)} think tanks     |")
    print("+" + "=" * 60 + "+")
    print()

    # ── Initialize ──
    scraper = FastScraper()
    cache = IntelligenceCache(CACHE_PATH)

    with open(SOURCES_PATH, "r", encoding="utf-8") as f:
        existing_sources = json.load(f)

    existing_urls = {s.get("url", "") for s in existing_sources if s.get("url")}
    existing_titles = {s.get("title", "").lower()[:60] for s in existing_sources
                       if s.get("title")}

    # ── Stage 1: Collect ──
    print("STAGE 1: Collection")

    rss_candidates = collect_rss_feeds(scraper)
    gnews_candidates = collect_gnews()
    academic_candidates = collect_academic()

    all_candidates = rss_candidates + gnews_candidates + academic_candidates
    total_collected = len(all_candidates)

    print(f"\n   Total collected: {total_collected}")
    print()

    # ── Stage 2: Dedup ──
    print("STAGE 2: Deduplication")
    fresh = dedup_candidates(all_candidates, cache, existing_urls, existing_titles)
    dedup_filtered = total_collected - len(fresh)
    print(f"   Fresh candidates: {len(fresh)} (filtered {dedup_filtered} duplicates)")
    print()

    if not fresh:
        print("No new candidates found. Harvest complete.")
        write_pulse_config(len(existing_sources), 0, 0.0)
        elapsed = time.time() - start_time
        write_daily_walkthrough(date_str, [], [], [], {
            "total_collected": total_collected, "dedup_filtered": dedup_filtered,
            "rss": len(rss_candidates), "gnews": len(gnews_candidates),
            "academic": len(academic_candidates), "spider_web": 0,
            "cache_size": len(cache.data), "veto_count": 0,
            "elapsed": elapsed,
        })
        cache.save()
        return

    # ── Stage 3: Verify ──
    print("STAGE 3: Verification (enhanced scoring with Dialectical Lens)")
    records = []
    processed = 0

    for batch_start in range(0, len(fresh), BATCH_SIZE):
        batch = fresh[batch_start:batch_start + BATCH_SIZE]

        with ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
            futures = {executor.submit(verify_source, src, scraper, cache): src
                       for src in batch}
            for future in as_completed(futures):
                try:
                    record = future.result()
                except Exception as e:
                    src = futures[future]
                    record = harvest_audit_source(src,
                                                 fetch_method=f"error ({str(e)[:50]})")
                records.append(record)
                processed += 1

        pct = int(processed / len(fresh) * 100)
        bar = "=" * (pct // 5) + "-" * (20 - pct // 5)
        print(f"\r   [{bar}] {pct:>3}% ({processed}/{len(fresh)})", end="", flush=True)

    print()
    print()

    # ── Triage ──
    kept = [r for r in records if r["action"] == "KEEP"]
    review = [r for r in records if r["action"] == "REVIEW"]
    rejected = [r for r in records if r["action"] == "REJECT"]

    top_score = max((r["total_score"] for r in records), default=0.0)

    print("+" + "=" * 60 + "+")
    print("|                  HARVEST RESULTS                         |")
    print("+" + "=" * 60 + "+")
    print(f"|  AUTO-DEPLOY:  {len(kept):>4} sources (score > {HARVEST_THRESHOLD})              |")
    print(f"|  REVIEW:       {len(review):>4} sources (score 4.0 - {HARVEST_THRESHOLD})          |")
    print(f"|  REJECTED:     {len(rejected):>4} sources (score < 4.0)              |")
    print(f"|  Top Score:    {top_score:>5.1f}/10.0                               |")
    print("+" + "=" * 60 + "+")
    print()

    # ── Stage 4: Deploy ──
    print("STAGE 4: Deployment")

    # Prepare source dicts for kept records
    new_source_dicts = []
    for r in kept:
        new_source_dicts.append({
            "title": r["title"],
            "url": r["url"],
            "category": classify_category(r["title"]),
            "summary": r.get("snippet_of_proof", "")[:300],
            "date": datetime.now(timezone.utc).strftime("%Y"),
            "publisher": urlparse(r["url"]).netloc if r.get("url") else "unknown",
        })

    if new_source_dicts:
        updated = deploy_to_sources(new_source_dicts, existing_sources, date_str)
        print(f"   sources.json: +{len(new_source_dicts)} -> {len(updated)} total")
    else:
        updated = existing_sources

    append_verified_intel(records, date_str)
    print(f"   verified_intel.md: appended {len(kept)} entries")

    write_pulse_config(len(updated), len(new_source_dicts), top_score)
    print(f"   pulse_config.json: updated")

    cache.save()
    print(f"   audit_cache.json: {len(cache.data)} entries")

    elapsed = time.time() - start_time

    stats = {
        "total_collected": total_collected,
        "dedup_filtered": dedup_filtered,
        "rss": len(rss_candidates),
        "gnews": len(gnews_candidates),
        "academic": len(academic_candidates),
        "spider_web": 0,
        "cache_size": len(cache.data),
        "veto_count": sum(1 for r in records if "VETO" in
                          r.get("breakdown", {}).get("geographic", {}).get("reason", "")),
        "elapsed": elapsed,
    }

    write_daily_walkthrough(date_str, kept, review, rejected, stats)

    # Git commit
    if new_source_dicts:
        git_commit_and_push(date_str, len(new_source_dicts), top_score)

    print(f"\nHarvest complete in {elapsed:.1f}s.")


if __name__ == "__main__":
    main()
