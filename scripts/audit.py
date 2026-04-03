#!/usr/bin/env python3
"""
IMEC Radar — Source Gatekeeper Audit Script v2.0
=================================================
High-Speed Batch Auditing with Hybrid Scraping Architecture.

Architecture:
  Pass 1 (Fast): requests + BeautifulSoup4 for 80% of sites
  Pass 2 (Deep): Escalation list for Browser Subagent (JS-heavy / Cloudflare)

Scoring:
  - Geographic Anchor    (40% → max 4.0)
  - Pillar Alignment     (40% → max 4.0)
  - Comparative Relevance (20% → max 2.0)

Thresholds:
  > 7.5  → AUTO-KEEP  (verified_intel.md)
  4 – 7.5 → REVIEW   (review_needed.json)
  < 4    → REJECT    (trash.json)

Performance:
  - ThreadPoolExecutor (batch of 5 concurrent fetches)
  - 24-hour intelligent cache (audit_cache.json)
  - Batch Intelligence Summary every 10 sources
  - Snippet of Proof for every audit record
"""

import hashlib
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("❌ Missing dependencies. Install with:")
    print("   python3 -m pip install requests beautifulsoup4 lxml --user")
    sys.exit(1)

# ─── Configuration ───────────────────────────────────────────────────
BATCH_SIZE = 5          # Parallel workers
CACHE_TTL_HOURS = 24    # Cache validity window
REQUEST_TIMEOUT = 10    # Seconds per request
RATE_LIMIT_DELAY = 0.5  # Seconds between domain requests
SNIPPET_LENGTH = 500    # Characters for Snippet of Proof
BATCH_REPORT_INTERVAL = 10  # Report every N sources

# ─── Paths ───────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "public", "data")

SOURCES_PATH = os.path.join(DATA_DIR, "sources.json")
VERIFIED_PATH = os.path.join(DATA_DIR, "verified_intel.md")
REVIEW_PATH = os.path.join(DATA_DIR, "review_needed.json")
TRASH_PATH = os.path.join(DATA_DIR, "trash.json")
AUDIT_LOG_PATH = os.path.join(DATA_DIR, "audit_log.json")
CACHE_PATH = os.path.join(DATA_DIR, "audit_cache.json")
ESCALATION_PATH = os.path.join(DATA_DIR, "escalation_needed.json")
BATCH_SUMMARY_DIR = os.path.join(DATA_DIR, "batch_summaries")

# ─── Safety Guardrail ────────────────────────────────────────────────
PROTECTED_STRING = "Geoeconomic Architecture of a New Middle East"

# ─── User-Agent ──────────────────────────────────────────────────────
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/125.0.0.0 Safari/537.36 "
    "IMECRadar/2.0 (Research Bot; +https://imec.international)"
)

# ─── Cloudflare / Block Detection Patterns ───────────────────────────
BLOCK_SIGNATURES = [
    "cloudflare",
    "cf-browser-verification",
    "cf-chl-bypass",
    "just a moment",
    "checking your browser",
    "ray id",
    "attention required",
    "access denied",
    "enable javascript",
    "please turn javascript on",
]

# ─── Keyword Dictionaries ────────────────────────────────────────────

GEO_ANCHORS = [
    "mundra", "kandla", "india",
    "jebel ali", "fujairah", "uae", "united arab emirates", "dubai", "abu dhabi",
    "riyadh", "dammam", "saudi arabia", "saudi",
    "jordan", "amman",
    "haifa", "israel",
    "piraeus", "marseille", "trieste", "greece", "italy", "france",
    "middle east", "europe", "corridor", "g20",
]

VETO_MARKERS = [
    "belgium", "leuven", "semiconductor", "nanoelectronics",
    "chip fabrication", "vlsi", "imec.be",
]

TRANSPORT_KEYWORDS = [
    "rail", "railway", "ship-to-rail", "maritime", "port", "ports",
    "logistics", "shipping", "trade route", "transit", "multimodal",
    "transportation", "freight", "cargo", "container",
]

ENERGY_KEYWORDS = [
    "green hydrogen", "hydrogen", "electricity interconnector",
    "pipeline", "pipelines", "energy grid", "solar", "renewable",
    "energy pillar", "clean energy", "power cable", "energy",
]

DIGITAL_KEYWORDS = [
    "undersea cable", "submarine cable", "blue-raman", "fiber optic",
    "data sovereignty", "digital corridor", "telecom", "5g",
    "digital pillar", "data center", "digital",
]

COMPETITOR_CORRIDORS = [
    "instc", "international north-south", "cpec",
    "china-pakistan", "belt and road", "bri", "development road",
    "iraq.*corridor", "rival corridor", "competing corridor",
]

COMPARATIVE_CONTEXT = [
    "compar", "alternative", "rival", "versus", "vs", "counter",
    "compete", "competition", "corridor war", "strategic trajectory",
    "counterbalance", "counterweight", "response to",
]


# ═══════════════════════════════════════════════════════════════════════
# FAST SCRAPER
# ═══════════════════════════════════════════════════════════════════════

class FastScraper:
    """
    Speed-first content extractor using requests + BeautifulSoup.
    Bypasses browser automation for ~80% of academic/news sites.
    """

    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": USER_AGENT,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
        })
        self._robots_cache: dict[str, RobotFileParser | None] = {}
        self._domain_timestamps: dict[str, float] = {}

    def _url_hash(self, url: str) -> str:
        """Generate a stable hash for cache keys."""
        return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]

    def _check_robots(self, url: str) -> bool:
        """Check robots.txt for crawl permission. Defaults to True on failure."""
        try:
            parsed = urlparse(url)
            base = f"{parsed.scheme}://{parsed.netloc}"
            if base not in self._robots_cache:
                rp = RobotFileParser()
                rp.set_url(f"{base}/robots.txt")
                rp.read()
                self._robots_cache[base] = rp
            rp = self._robots_cache[base]
            return rp.can_fetch(USER_AGENT, url) if rp else True
        except Exception:
            return True  # Fail open — don't block on robots.txt errors

    def _rate_limit(self, url: str):
        """Enforce per-domain rate limiting."""
        domain = urlparse(url).netloc
        last_hit = self._domain_timestamps.get(domain, 0)
        elapsed = time.time() - last_hit
        if elapsed < RATE_LIMIT_DELAY:
            time.sleep(RATE_LIMIT_DELAY - elapsed)
        self._domain_timestamps[domain] = time.time()

    def _detect_block(self, html: str) -> bool:
        """Detect Cloudflare challenges and JS-only gates."""
        html_lower = html.lower()
        return any(sig in html_lower for sig in BLOCK_SIGNATURES)

    def _extract_text(self, html: str) -> str:
        """Extract meaningful text from HTML using BeautifulSoup."""
        soup = BeautifulSoup(html, "lxml")

        # Remove noise elements
        for tag in soup(["script", "style", "nav", "footer", "header",
                         "aside", "iframe", "noscript", "form"]):
            tag.decompose()

        # Prioritize article / main content
        main = soup.find("article") or soup.find("main") or soup.find("body")
        if main is None:
            return ""

        text = main.get_text(separator=" ", strip=True)
        # Collapse whitespace
        text = re.sub(r"\s+", " ", text).strip()
        return text

    def fetch(self, url: str) -> dict:
        """
        Attempt fast-path content retrieval.

        Returns:
            {
                "status": "ok" | "blocked" | "error" | "robots_denied",
                "text": str,           # extracted page text
                "snippet": str,        # first 500 chars
                "status_code": int,
                "fetch_method": "fast",
                "error": str | None,
            }
        """
        result = {
            "status": "error",
            "text": "",
            "snippet": "",
            "status_code": 0,
            "fetch_method": "fast",
            "error": None,
        }

        # ── robots.txt check ──
        if not self._check_robots(url):
            result["status"] = "robots_denied"
            result["error"] = "Blocked by robots.txt"
            return result

        # ── Rate limiting ──
        self._rate_limit(url)

        try:
            resp = self.session.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)
            result["status_code"] = resp.status_code

            # ── HTTP errors ──
            if resp.status_code == 403:
                result["status"] = "blocked"
                result["error"] = "HTTP 403 Forbidden — likely requires JS or auth"
                return result

            if resp.status_code >= 400:
                result["status"] = "error"
                result["error"] = f"HTTP {resp.status_code}"
                return result

            html = resp.text

            # ── Cloudflare / JS gate detection ──
            if self._detect_block(html):
                result["status"] = "blocked"
                result["error"] = "Cloudflare challenge or JS-only gate detected"
                return result

            # ── Extract text ──
            text = self._extract_text(html)

            if len(text) < 50:
                result["status"] = "blocked"
                result["error"] = "Empty or near-empty body — likely JS-rendered"
                return result

            result["status"] = "ok"
            result["text"] = text
            result["snippet"] = text[:SNIPPET_LENGTH]
            return result

        except requests.exceptions.Timeout:
            result["status"] = "error"
            result["error"] = f"Timeout after {REQUEST_TIMEOUT}s"
            return result

        except requests.exceptions.ConnectionError as e:
            result["status"] = "error"
            result["error"] = f"Connection error: {str(e)[:100]}"
            return result

        except Exception as e:
            result["status"] = "error"
            result["error"] = f"Unexpected: {str(e)[:100]}"
            return result


# ═══════════════════════════════════════════════════════════════════════
# INTELLIGENCE CACHE
# ═══════════════════════════════════════════════════════════════════════

class IntelligenceCache:
    """24-hour TTL cache for audit results keyed by URL hash."""

    def __init__(self, path: str):
        self.path = path
        self.data: dict = {}
        self._load()

    def _load(self):
        if os.path.exists(self.path):
            try:
                with open(self.path, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
            except (json.JSONDecodeError, IOError):
                self.data = {}

    def save(self):
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump(self.data, f, indent=2, ensure_ascii=False)

    def _hash(self, url: str) -> str:
        return hashlib.sha256(url.encode("utf-8")).hexdigest()[:16]

    def get(self, url: str) -> dict | None:
        """Return cached record if valid (< 24 hours), else None."""
        key = self._hash(url)
        if key not in self.data:
            return None

        entry = self.data[key]
        cached_time = datetime.fromisoformat(entry["cached_at"])
        if datetime.now(timezone.utc) - cached_time > timedelta(hours=CACHE_TTL_HOURS):
            del self.data[key]
            return None

        return entry

    def put(self, url: str, record: dict, snippet: str):
        """Store an audit record in cache."""
        key = self._hash(url)
        self.data[key] = {
            "url": url,
            "record": record,
            "snippet": snippet,
            "cached_at": datetime.now(timezone.utc).isoformat(),
        }


# ═══════════════════════════════════════════════════════════════════════
# SCORING ENGINE (unchanged logic, enhanced with deep text)
# ═══════════════════════════════════════════════════════════════════════

def _count_matches(text: str, keywords: list[str]) -> int:
    count = 0
    for kw in keywords:
        pattern = kw if ("." in kw or "*" in kw) else re.escape(kw)
        if re.search(pattern, text):
            count += 1
    return count


def score_geographic(text: str) -> tuple[float, str]:
    veto_hits = _count_matches(text, VETO_MARKERS)
    geo_hits = _count_matches(text, GEO_ANCHORS)

    if veto_hits > 0 and geo_hits < 3:
        return 0.0, f"VETO: Belgian/semiconductor markers ({veto_hits}) without corridor context (geo={geo_hits})"

    if geo_hits == 0:
        return 0.5, "No geographic anchors found; generic reference only"
    elif geo_hits < 3:
        return min(geo_hits * 1.0, 2.0), f"Partial geo anchors: {geo_hits} nodes matched"
    else:
        return min(geo_hits * 0.6, 4.0), f"Strong geographic grounding: {geo_hits} nodes matched"


def score_pillars(text: str) -> tuple[float, str]:
    transport = _count_matches(text, TRANSPORT_KEYWORDS)
    energy = _count_matches(text, ENERGY_KEYWORDS)
    digital = _count_matches(text, DIGITAL_KEYWORDS)

    pillars_hit = sum(1 for p in [transport, energy, digital] if p > 0)
    total_kw = transport + energy + digital
    pillar_names = ["Transport", "Energy", "Digital"]
    pillar_counts = [transport, energy, digital]

    if pillars_hit == 0:
        return 0.5, "No pillar alignment detected"
    elif pillars_hit == 1:
        idx = pillar_counts.index(max(pillar_counts))
        return min(1.5 + total_kw * 0.2, 3.0), f"Single pillar ({pillar_names[idx]}): {total_kw} keywords"
    elif pillars_hit == 2:
        return min(2.5 + total_kw * 0.15, 3.5), f"Two pillars covered: {total_kw} keywords"
    else:
        return min(3.0 + total_kw * 0.1, 4.0), f"All three pillars covered: {total_kw} keywords"


def score_comparative(text: str) -> tuple[float, str]:
    competitor_hits = _count_matches(text, COMPETITOR_CORRIDORS)
    context_hits = _count_matches(text, COMPARATIVE_CONTEXT)

    if competitor_hits == 0:
        return 1.0, "No competing corridor mentioned; standalone IMEC analysis"

    if context_hits > 0:
        return min(1.5 + context_hits * 0.25, 2.0), \
            f"Comparative framing present: {competitor_hits} corridors in {context_hits} comparative contexts"
    else:
        return 0.5, f"Competing corridor mentioned ({competitor_hits}) WITHOUT comparative framing — possible thematic drift"


def audit_source(source: dict, deep_text: str = "", snippet: str = "",
                 fetch_method: str = "metadata-only") -> dict:
    """Score a single source. Uses deep_text from scraper if available."""
    # Build searchable text blob — combine metadata + deep content
    metadata_text = " ".join([
        (source.get("title") or ""),
        (source.get("summary") or ""),
        (source.get("category") or ""),
        (source.get("publisher") or ""),
        (source.get("url") or ""),
    ])

    # If deep text is available, use it as primary scoring surface
    combined = f"{metadata_text} {deep_text}".lower()

    geo_score, geo_reason = score_geographic(combined)
    pillar_score, pillar_reason = score_pillars(combined)
    comp_score, comp_reason = score_comparative(combined)

    total = round(geo_score + pillar_score + comp_score, 2)

    is_protected = PROTECTED_STRING.lower() in combined

    if is_protected:
        action = "KEEP"
        decision = "Protected by safety guardrail (contains protected string)"
    elif total > 7.5:
        action = "KEEP"
        decision = "AUTO-KEEP: High confidence IMEC relevance"
    elif total >= 4.0:
        action = "REVIEW"
        decision = "Ambiguous: Requires manual review"
    else:
        action = "REJECT"
        decision = "AUTO-REJECT: Nominal duplicate or thematic drift"

    return {
        "id": source.get("id", "unknown"),
        "title": source.get("title", "")[:120],
        "url": source.get("url", ""),
        "total_score": total,
        "breakdown": {
            "geographic": {"score": geo_score, "max": 4.0, "reason": geo_reason},
            "pillars": {"score": pillar_score, "max": 4.0, "reason": pillar_reason},
            "comparative": {"score": comp_score, "max": 2.0, "reason": comp_reason},
        },
        "action": action,
        "decision": decision,
        "fetch_method": fetch_method,
        "snippet_of_proof": snippet[:SNIPPET_LENGTH] if snippet else metadata_text[:SNIPPET_LENGTH],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════════════════
# BATCH INTELLIGENCE SUMMARY
# ═══════════════════════════════════════════════════════════════════════

def write_batch_summary(batch_num: int, records: list[dict], output_dir: str):
    """Generate a Batch Intelligence Summary artifact every N sources."""
    os.makedirs(output_dir, exist_ok=True)
    filename = f"batch_{batch_num:03d}_summary.md"
    filepath = os.path.join(output_dir, filename)

    kept = [r for r in records if r["action"] == "KEEP"]
    review = [r for r in records if r["action"] == "REVIEW"]
    rejected = [r for r in records if r["action"] == "REJECT"]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(f"# Batch {batch_num} — Intelligence Summary\n\n")
        f.write(f"_Generated: {datetime.now(timezone.utc).isoformat()}_\n\n")
        f.write(f"| Metric | Count |\n|---|---|\n")
        f.write(f"| ✅ KEPT | {len(kept)} |\n")
        f.write(f"| 🔍 REVIEW | {len(review)} |\n")
        f.write(f"| 🗑️ REJECTED | {len(rejected)} |\n\n")

        if kept:
            f.write("## High-Confidence Sources\n\n")
            for r in kept:
                f.write(f"- **[{r['id']}]** {r['title']} — Score: {r['total_score']}/10 ({r['fetch_method']})\n")
            f.write("\n")

        if rejected:
            f.write("## Rejected Sources\n\n")
            for r in rejected[:5]:
                f.write(f"- **[{r['id']}]** {r['title'][:60]}... — {r['decision']}\n")
            f.write("\n")

    print(f"   📊 Batch {batch_num} summary → {filename}")
    return filepath


# ═══════════════════════════════════════════════════════════════════════
# MAIN ORCHESTRATOR
# ═══════════════════════════════════════════════════════════════════════

def process_source(source: dict, scraper: FastScraper, cache: IntelligenceCache) -> dict:
    """Process a single source: check cache → fast scrape → score."""
    url = source.get("url", "")

    # ── Check cache first ──
    cached = cache.get(url)
    if cached:
        record = cached["record"]
        record["fetch_method"] = "cached"
        return record

    # ── Fast-path scrape ──
    fetch_result = scraper.fetch(url) if url else {
        "status": "error", "text": "", "snippet": "",
        "fetch_method": "fast", "error": "No URL", "status_code": 0,
    }

    if fetch_result["status"] == "ok":
        record = audit_source(
            source,
            deep_text=fetch_result["text"],
            snippet=fetch_result["snippet"],
            fetch_method="fast",
        )
        cache.put(url, record, fetch_result["snippet"])
    elif fetch_result["status"] in ("blocked", "robots_denied"):
        # Score with metadata only; flag for escalation
        record = audit_source(
            source,
            deep_text="",
            snippet="",
            fetch_method=f"escalation-needed ({fetch_result['error']})",
        )
        record["_needs_escalation"] = True
        record["_escalation_reason"] = fetch_result["error"]
    else:
        # Error — score with metadata only
        record = audit_source(
            source,
            deep_text="",
            snippet="",
            fetch_method=f"metadata-only ({fetch_result.get('error', 'unknown')})",
        )

    return record


def main():
    start_time = time.time()

    # ── Load sources ──
    if not os.path.exists(SOURCES_PATH):
        print(f"❌ Sources file not found: {SOURCES_PATH}")
        sys.exit(1)

    with open(SOURCES_PATH, "r", encoding="utf-8") as f:
        sources = json.load(f)

    print("╔══════════════════════════════════════════════════════════════╗")
    print("║  📡 IMEC Radar — Source Gatekeeper v2.0                    ║")
    print("║  ⚡ High-Speed Batch Auditing Engine                       ║")
    print("╠══════════════════════════════════════════════════════════════╣")
    print(f"║  Sources: {len(sources):>6}   │  Workers: {BATCH_SIZE}   │  Cache TTL: {CACHE_TTL_HOURS}h  ║")
    print(f"║  Timestamp: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC'):<43}║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()

    scraper = FastScraper()
    cache = IntelligenceCache(CACHE_PATH)

    kept = []
    review = []
    rejected = []
    audit_log = []
    escalation_list = []
    batch_records = []
    batch_num = 0

    processed = 0
    total = len(sources)

    # ── Parallel processing in batches ──
    for batch_start in range(0, total, BATCH_SIZE):
        batch = sources[batch_start:batch_start + BATCH_SIZE]
        futures = {}

        with ThreadPoolExecutor(max_workers=BATCH_SIZE) as executor:
            for src in batch:
                future = executor.submit(process_source, src, scraper, cache)
                futures[future] = src

            for future in as_completed(futures):
                src = futures[future]
                try:
                    record = future.result()
                except Exception as e:
                    record = audit_source(src, fetch_method=f"error ({str(e)[:50]})")

                audit_log.append(record)
                batch_records.append(record)

                if record.get("_needs_escalation"):
                    escalation_list.append({
                        "id": record["id"],
                        "url": record["url"],
                        "reason": record.get("_escalation_reason", "Unknown"),
                        "metadata_score": record["total_score"],
                    })

                if record["action"] == "KEEP":
                    kept.append(src)
                elif record["action"] == "REVIEW":
                    review.append(src)
                else:
                    rejected.append(src)

                processed += 1

        # ── Progress indicator ──
        pct = int(processed / total * 100)
        bar_filled = pct // 5
        bar = "█" * bar_filled + "░" * (20 - bar_filled)
        elapsed = time.time() - start_time
        rate = processed / elapsed if elapsed > 0 else 0
        print(f"\r   [{bar}] {pct:>3}% ({processed}/{total}) — {rate:.1f} src/s", end="", flush=True)

        # ── Batch summary every 10 sources ──
        if len(batch_records) >= BATCH_REPORT_INTERVAL:
            batch_num += 1
            write_batch_summary(batch_num, batch_records, BATCH_SUMMARY_DIR)
            batch_records = []

    # ── Final partial batch ──
    if batch_records:
        batch_num += 1
        write_batch_summary(batch_num, batch_records, BATCH_SUMMARY_DIR)

    print()  # newline after progress bar

    elapsed_total = time.time() - start_time

    # ── Summary ──
    print()
    print("╔══════════════════════════════════════════════════════════════╗")
    print("║                    AUDIT RESULTS                           ║")
    print("╠══════════════════════════════════════════════════════════════╣")
    print(f"║  ✅ KEPT:       {len(kept):>5} sources (score > 7.5)              ║")
    print(f"║  🔍 REVIEW:     {len(review):>5} sources (score 4.0 – 7.5)         ║")
    print(f"║  🗑️  REJECTED:   {len(rejected):>5} sources (score < 4.0)             ║")
    print(f"║  ⚠️  ESCALATION: {len(escalation_list):>5} sources (need Browser Subagent)  ║")
    print(f"║  ⏱️  Time:       {elapsed_total:>5.1f}s ({processed/elapsed_total:.1f} src/s)               ║")
    print("╚══════════════════════════════════════════════════════════════╝")
    print()

    # ── Cache stats ──
    cache_hits = sum(1 for r in audit_log if r.get("fetch_method") == "cached")
    fast_hits = sum(1 for r in audit_log if r.get("fetch_method") == "fast")
    print(f"   Cache hits: {cache_hits} │ Fast fetches: {fast_hits} │ Escalations: {len(escalation_list)}")

    # ── Write outputs ──

    # 1. Clean sources.json (kept only)
    with open(SOURCES_PATH, "w", encoding="utf-8") as f:
        json.dump(kept, f, indent=2, ensure_ascii=False)
    print(f"   📄 Updated sources.json → {len(kept)} entries")

    # 2. Review needed
    with open(REVIEW_PATH, "w", encoding="utf-8") as f:
        json.dump(review, f, indent=2, ensure_ascii=False)
    print(f"   📋 Wrote review_needed.json → {len(review)} entries")

    # 3. Trash
    with open(TRASH_PATH, "w", encoding="utf-8") as f:
        json.dump(rejected, f, indent=2, ensure_ascii=False)
    print(f"   🗑️  Wrote trash.json → {len(rejected)} entries")

    # 4. Escalation list
    with open(ESCALATION_PATH, "w", encoding="utf-8") as f:
        json.dump(escalation_list, f, indent=2, ensure_ascii=False)
    print(f"   ⚠️  Wrote escalation_needed.json → {len(escalation_list)} entries")

    # 5. Audit log
    # Remove internal flags before writing
    clean_log = []
    for r in audit_log:
        clean = {k: v for k, v in r.items() if not k.startswith("_")}
        clean_log.append(clean)
    with open(AUDIT_LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(clean_log, f, indent=2, ensure_ascii=False)
    print(f"   📊 Wrote audit_log.json → {len(clean_log)} records")

    # 6. Cache
    cache.save()
    print(f"   💾 Saved audit_cache.json → {len(cache.data)} cached entries")

    # 7. Verified intel markdown
    with open(VERIFIED_PATH, "w", encoding="utf-8") as f:
        f.write("# IMEC Radar — Verified Intelligence\n\n")
        f.write(f"_Generated: {datetime.now(timezone.utc).isoformat()}_\n\n")
        f.write(f"**{len(kept)}** sources verified with score > 7.5\n\n")
        f.write(f"**Processing:** {elapsed_total:.1f}s @ {processed/elapsed_total:.1f} src/s "
                f"| Cache hits: {cache_hits} | Fast: {fast_hits} | Escalations: {len(escalation_list)}\n\n")
        f.write("---\n\n")
        for rec in clean_log:
            if rec["action"] == "KEEP":
                f.write(f"### [{rec['id']}] {rec['title']}\n")
                f.write(f"- **Score:** {rec['total_score']}/10.0 ({rec['fetch_method']})\n")
                f.write(f"- **Geographic:** {rec['breakdown']['geographic']['score']}/4.0 — "
                        f"{rec['breakdown']['geographic']['reason']}\n")
                f.write(f"- **Pillars:** {rec['breakdown']['pillars']['score']}/4.0 — "
                        f"{rec['breakdown']['pillars']['reason']}\n")
                f.write(f"- **Comparative:** {rec['breakdown']['comparative']['score']}/2.0 — "
                        f"{rec['breakdown']['comparative']['reason']}\n")
                f.write(f"- **Decision:** {rec['decision']}\n")
                if rec.get("snippet_of_proof"):
                    f.write(f"- **Snippet:** _{rec['snippet_of_proof'][:200]}..._\n")
                f.write("\n")
    print(f"   📝 Wrote verified_intel.md → {len(kept)} entries")

    # ── Top rejections ──
    if rejected:
        print("\n   🔎 Sample rejections:")
        for rec in sorted([r for r in clean_log if r["action"] == "REJECT"],
                          key=lambda x: x["total_score"])[:3]:
            print(f"      [{rec['id']}] Score {rec['total_score']}: "
                  f"{rec['title'][:70]}...")
            print(f"         → {rec['decision']}")

    # ── Escalation prompt ──
    if escalation_list:
        print(f"\n   ⚠️  {len(escalation_list)} sources need Browser Subagent verification.")
        print(f"      See: escalation_needed.json")

    print(f"\n✅ Audit complete in {elapsed_total:.1f}s. {batch_num} batch summaries generated.")


if __name__ == "__main__":
    main()
