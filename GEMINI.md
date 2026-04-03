# IMEC Radar Intelligence Platform — Project Blueprint

## Goal
Maintaining the IMEC Radar as a professional, live intelligence terminal. Prioritize minimalist UI standards and real-time data accuracy.

## Architecture
- **Frontend**: Next.js App Router, Tailwind CSS, Sans-serif typography.
- **Data Engine**: Python-based Harvester (`scripts/harvest.py`) and Gatekeeper (`scripts/audit.py`).
- **Intelligence Volume**: 11.3M+ strategic sources indexed across the Three Pillars (Transport, Energy, Digital).

## Design System
- **Typography**: `font-sans` for main UI, `font-mono` for data identifiers.
- **Motion**: Entry-only animations (`animate-in fade-in slide-in-from-bottom-4`).
- **Aesthetic**: Light Academic / Enterprise Minimalist.

## Operational Standards
- **Real-time Accuracy**: The `IntelligencePulse` card must reflect the latest harvest totals.
- **Minimalism**: Reduce label density. Personal identifiers are removed to focus on geoeconomic architecture.
- **Source Verification**: All entries must pass the Weighted Scoring Engine (> 7.5 threshold for AUTO-KEEP).
