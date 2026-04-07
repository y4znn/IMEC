# Design System: IMEC Radar Intelligence Platform
**Project ID:** imec-radar-web

## 1. Visual Theme & Atmosphere
The IMEC Radar Intelligence Platform embodies a **Light Academic / Enterprise Minimalist** aesthetic with subtle brutalist and data-journalism undertones. The atmosphere is stark, highly performant, and purposeful. It favors extreme clarity and high-density data presentation over decorative flourishes. The design removes visual noise to focus entirely on geopolitical architecture, real-time intelligence feeds, and forensic data verification. Motion is restricted primarily to entry-only animations to maintain a sense of static confidence.

## 2. Color Palette & Roles

* **Paper Off-White** (`#F9FAFB`): Used for the application's primary backdrop. It provides a soft, document-like foundation that reduces eye strain compared to stark white.
* **Pure Minimalist White** (`#FFFFFF` or `rgba(255, 255, 255, 1)`): Used for card backgrounds and container fills to create subtle, flat elevation against the off-white background.
* **Deep Slate Charcoal** (`#374151`): The primary text color. It provides crisp readability while being less aggressive than pure black.
* **Architectural Grey Border** (`rgba(0, 0, 0, 0.1)`): Used for structural boundaries, card borders, and input outlines. On hover, this darkens slightly to `rgba(0, 0, 0, 0.2)` to indicate interactivity without using shadows.
* **Pitch Black** (`#000000`): Used for high-contrast interactive elements, such as brutalist scrollbar thumbs and form range sliders.
* **Alert & Forensic Colors** (Amber `rgba(251, 191, 36, 1)`, Blue `rgba(96, 165, 250, 1)`, Red `rgba(248, 113, 113, 1)`): Applied sparingly in dark-mode semantic toasts (`bg-950/90`) to deliver alerts or status changes.

## 3. Typography Rules

* **Sans-Serif (Primary UI):** `Inter` stack (or system sans-serif). Used for all main UI components, buttons, labels, and standard text. It offers a clean, neutral voice.
* **Serif (Editorial):** `Fraunces` stack. Injected to provide an academic, editorial, or narrative tone.
* **Monospace (Data Identifiers):** `JetBrains Mono` or `IBM Plex Mono`. Reserved exclusively for data tokens, IDs, geopolitical coordinates, pulse scores, and financial figures. It imparts a forensic, terminal-like precision.

## 4. Component Stylings

* **Cards/Containers:** Strictly brutalist with **sharp, squared-off edges** (`radius: 0`). Backgrounds are pure white with a 1px solid translucent black border. Overlapping and drop-shadows are entirely rejected in favor of flat borders. On hover, the border darkens dynamically, but the container remains flat (`box-shadow: none`).
* **Buttons:** Minimalist, favoring sharp corners, icon-centric alignments (using Lucide icons), and flat structural backgrounds. Micro-interactions rely on subtle background opacity shifts or border darkening. 
* **Inputs/Forms:** Range sliders and inputs embrace the brutalist vibe—flat dark tracks, squared-off black thumbs, and no decorative browser-default rounding.
* **Scrollbars:** Custom brutalist styling featuring a sleek grey track and a harsh, geometric `Pitch Black` thumb with zero border radius.
* **Toasts & Feedback:** Dark, glassmorphism containers (`bg-X-950/90` with `backdrop-blur`) that smoothly slide in from the right. Sharp contrast with the light UI creates immediate user attention.

## 5. Layout Principles

* **Density and Spacing:** The layout supports a high-density intelligence feed. Whitespace is mathematically tight, relying on thin 1px borders rather than expansive padding to separate modular sections.
* **Grid Alignment:** Highly structured, rigid CSS grids and flexbox columns anchor the design. Sidebars, intelligence pulses, and chronological feeds live in distinct, unyielding panels.
* **Motion constraints:** Animations are deliberately understated. We strictly employ entry-only transitions such as `slide-in-from-bottom-4` or `fade-up`. Holographic or CRT-like micro-animations (e.g., `scanline`) may be used to reinforce the live-terminal aura on specific data visualizations.
