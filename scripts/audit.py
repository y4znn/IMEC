#!/usr/bin/env python3
"""
IMEC Radar — Source Gatekeeper Audit Script
============================================
Weighted scoring engine to verify sources in sources.json against
the India-Middle East-Europe Economic Corridor thesis.

Scoring:
  - Geographic Anchor  (40% → max 4.0)
  - Pillar Alignment   (40% → max 4.0)
  - Comparative Relevance (20% → max 2.0)

Thresholds:
  > 7.5  → AUTO-KEEP  (verified_intel.md)
  4 – 7.5 → REVIEW   (review_needed.json)
  < 4    → REJECT    (trash.json)
"""

import json
import os
import re
import sys
from datetime import datetime, timezone

# ─── Paths ───────────────────────────────────────────────────────────
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
DATA_DIR = os.path.join(PROJECT_ROOT, "public", "data")

SOURCES_PATH = os.path.join(DATA_DIR, "sources.json")
VERIFIED_PATH = os.path.join(DATA_DIR, "verified_intel.md")
REVIEW_PATH = os.path.join(DATA_DIR, "review_needed.json")
TRASH_PATH = os.path.join(DATA_DIR, "trash.json")
AUDIT_LOG_PATH = os.path.join(DATA_DIR, "audit_log.json")

# ─── Safety Guardrail ────────────────────────────────────────────────
PROTECTED_STRING = "Geoeconomic Architecture of a New Middle East"

# ─── Keyword Dictionaries ────────────────────────────────────────────

# Geographic anchors — primary IMEC corridor nodes
GEO_ANCHORS = [
    # India
    "mundra", "kandla", "india",
    # UAE
    "jebel ali", "fujairah", "uae", "united arab emirates", "dubai", "abu dhabi",
    # Saudi Arabia
    "riyadh", "dammam", "saudi arabia", "saudi",
    # Transit
    "jordan", "amman",
    # Israel
    "haifa", "israel",
    # EU terminals
    "piraeus", "marseille", "trieste", "greece", "italy", "france",
    # Broader corridor terms
    "middle east", "europe", "corridor", "g20",
]

# Veto triggers — Belgian imec / semiconductor noise
VETO_MARKERS = [
    "belgium", "leuven", "semiconductor", "nanoelectronics",
    "chip fabrication", "vlsi", "imec.be",
]

# Pillar keywords
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

# Comparative corridor keywords (only valid in comparative context)
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


def _count_matches(text: str, keywords: list[str]) -> int:
    """Count how many distinct keywords appear in text."""
    count = 0
    for kw in keywords:
        if re.search(re.escape(kw) if "." not in kw and "*" not in kw else kw, text):
            count += 1
    return count


def score_geographic(text: str) -> tuple[float, str]:
    """Score geographic anchor presence (max 4.0)."""
    # Check for veto first
    veto_hits = _count_matches(text, VETO_MARKERS)
    geo_hits = _count_matches(text, GEO_ANCHORS)

    if veto_hits > 0 and geo_hits < 3:
        return 0.0, f"VETO: Belgian/semiconductor markers ({veto_hits}) without corridor context (geo={geo_hits})"

    if geo_hits == 0:
        return 0.5, "No geographic anchors found; generic reference only"
    elif geo_hits < 3:
        score = min(geo_hits * 1.0, 2.0)
        return score, f"Partial geo anchors: {geo_hits} nodes matched"
    else:
        score = min(geo_hits * 0.6, 4.0)
        return score, f"Strong geographic grounding: {geo_hits} nodes matched"


def score_pillars(text: str) -> tuple[float, str]:
    """Score pillar alignment (max 4.0)."""
    transport = _count_matches(text, TRANSPORT_KEYWORDS)
    energy = _count_matches(text, ENERGY_KEYWORDS)
    digital = _count_matches(text, DIGITAL_KEYWORDS)

    pillars_hit = sum(1 for p in [transport, energy, digital] if p > 0)
    total_kw = transport + energy + digital

    if pillars_hit == 0:
        return 0.5, "No pillar alignment detected"
    elif pillars_hit == 1:
        score = min(1.5 + total_kw * 0.2, 3.0)
        return score, f"Single pillar ({['Transport','Energy','Digital'][[transport,energy,digital].index(max(transport,energy,digital))]}): {total_kw} keywords"
    elif pillars_hit == 2:
        score = min(2.5 + total_kw * 0.15, 3.5)
        return score, f"Two pillars covered: {total_kw} keywords"
    else:
        score = min(3.0 + total_kw * 0.1, 4.0)
        return score, f"All three pillars covered: {total_kw} keywords"


def score_comparative(text: str) -> tuple[float, str]:
    """Score comparative relevance (max 2.0)."""
    competitor_hits = _count_matches(text, COMPETITOR_CORRIDORS)
    context_hits = _count_matches(text, COMPARATIVE_CONTEXT)

    if competitor_hits == 0:
        # No competitor mention — neutral, give base score
        return 1.0, "No competing corridor mentioned; standalone IMEC analysis"

    if context_hits > 0:
        score = min(1.5 + context_hits * 0.25, 2.0)
        return score, f"Comparative framing present: {competitor_hits} corridors in {context_hits} comparative contexts"
    else:
        return 0.5, f"Competing corridor mentioned ({competitor_hits}) WITHOUT comparative framing — possible thematic drift"


def audit_source(source: dict) -> dict:
    """Score a single source and return an audit record."""
    # Build searchable text blob
    text = " ".join([
        (source.get("title") or ""),
        (source.get("summary") or ""),
        (source.get("category") or ""),
        (source.get("publisher") or ""),
        (source.get("url") or ""),
    ]).lower()

    geo_score, geo_reason = score_geographic(text)
    pillar_score, pillar_reason = score_pillars(text)
    comp_score, comp_reason = score_comparative(text)

    total = round(geo_score + pillar_score + comp_score, 2)

    # Determine action
    is_protected = PROTECTED_STRING.lower() in text

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
        "total_score": total,
        "breakdown": {
            "geographic": {"score": geo_score, "max": 4.0, "reason": geo_reason},
            "pillars": {"score": pillar_score, "max": 4.0, "reason": pillar_reason},
            "comparative": {"score": comp_score, "max": 2.0, "reason": comp_reason},
        },
        "action": action,
        "decision": decision,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


def main():
    # ── Load sources ──
    if not os.path.exists(SOURCES_PATH):
        print(f"❌ Sources file not found: {SOURCES_PATH}")
        sys.exit(1)

    with open(SOURCES_PATH, "r", encoding="utf-8") as f:
        sources = json.load(f)

    print(f"📡 IMEC Radar — Source Gatekeeper Audit")
    print(f"   Loaded {len(sources)} sources from sources.json")
    print(f"   Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print("─" * 60)

    kept = []
    review = []
    rejected = []
    audit_log = []

    for src in sources:
        record = audit_source(src)
        audit_log.append(record)

        if record["action"] == "KEEP":
            kept.append(src)
        elif record["action"] == "REVIEW":
            review.append(src)
        else:
            rejected.append(src)

    # ── Summary ──
    print(f"\n✅ KEPT:     {len(kept)} sources (score > 7.5)")
    print(f"🔍 REVIEW:   {len(review)} sources (score 4.0 – 7.5)")
    print(f"🗑️  REJECTED: {len(rejected)} sources (score < 4.0)")
    print("─" * 60)

    # ── Write outputs ──

    # 1. Clean sources.json (kept only)
    with open(SOURCES_PATH, "w", encoding="utf-8") as f:
        json.dump(kept, f, indent=2, ensure_ascii=False)
    print(f"📄 Updated sources.json → {len(kept)} entries")

    # 2. Review needed
    with open(REVIEW_PATH, "w", encoding="utf-8") as f:
        json.dump(review, f, indent=2, ensure_ascii=False)
    print(f"📋 Wrote review_needed.json → {len(review)} entries")

    # 3. Trash
    with open(TRASH_PATH, "w", encoding="utf-8") as f:
        json.dump(rejected, f, indent=2, ensure_ascii=False)
    print(f"🗑️  Wrote trash.json → {len(rejected)} entries")

    # 4. Audit log
    with open(AUDIT_LOG_PATH, "w", encoding="utf-8") as f:
        json.dump(audit_log, f, indent=2, ensure_ascii=False)
    print(f"📊 Wrote audit_log.json → {len(audit_log)} records")

    # 5. Verified intel markdown
    with open(VERIFIED_PATH, "w", encoding="utf-8") as f:
        f.write("# IMEC Radar — Verified Intelligence\n\n")
        f.write(f"_Generated: {datetime.now(timezone.utc).isoformat()}_\n\n")
        f.write(f"**{len(kept)}** sources verified with score > 7.5\n\n")
        f.write("---\n\n")
        for rec in audit_log:
            if rec["action"] == "KEEP":
                f.write(f"### [{rec['id']}] {rec['title']}\n")
                f.write(f"- **Score:** {rec['total_score']}/10.0\n")
                f.write(f"- **Geographic:** {rec['breakdown']['geographic']['score']}/4.0 — {rec['breakdown']['geographic']['reason']}\n")
                f.write(f"- **Pillars:** {rec['breakdown']['pillars']['score']}/4.0 — {rec['breakdown']['pillars']['reason']}\n")
                f.write(f"- **Comparative:** {rec['breakdown']['comparative']['score']}/2.0 — {rec['breakdown']['comparative']['reason']}\n")
                f.write(f"- **Decision:** {rec['decision']}\n\n")
    print(f"📝 Wrote verified_intel.md → {len(kept)} entries")

    # ── Print top 5 rejections for visibility ──
    if rejected:
        print("\n🔎 Sample rejections:")
        for rec in sorted([r for r in audit_log if r["action"] == "REJECT"], key=lambda x: x["total_score"])[:5]:
            print(f"   [{rec['id']}] Score {rec['total_score']}: {rec['title'][:80]}...")
            print(f"      → {rec['decision']}")

    print("\n✅ Audit complete.")


if __name__ == "__main__":
    main()
