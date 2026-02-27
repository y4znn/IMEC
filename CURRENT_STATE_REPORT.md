# IMEC Research Platform: System State & UI Architecture Report

This report provides a comprehensive audit of the current architecture, design system, and technical implementations across the next.js application.

## 1. Global Design System & CSS

**Color Palette:**
The application enforces a strict, deep "Enterprise Minimalism" aesthetic utilizing Tailwind CSS color scales overriding pure blacks and deep zincs:
- **Backgrounds:** Pure `bg-black`, `bg-zinc-950`
- **Containers/Surfaces:** `bg-zinc-900/40`, `bg-zinc-900/60`, `bg-zinc-900/80`
- **Borders:** Thin, barely visible contours via `border-white/5` and `border-zinc-800/40`
- **Text Hierarchies:** `text-zinc-100` (Headers), `text-zinc-200` (Sub-headers), `text-zinc-400` (Body), `text-zinc-500`/`text-zinc-600` (Muted metadata).

**Typography:**
- UI and System Elements: **Inter** (sans-serif) driven by `font-sans` with `tracking-tight` modifications.
- Academic/Thesis Elements: **Playfair Display** (serif) utilized for sophisticated headers (e.g., dossier profile, globe title overlay).

**Glassmorphism Formulation:**
Calculated combinations achieve the "photorealistic" enterprise blur:
- Base layers: `bg-zinc-900/40` with `backdrop-blur-xl` and `border-white/5` (approx. 2-5% opacity border).
- Elevated layers (e.g., Modals/Side Panels): `bg-zinc-900/60` or `/80` paired with `backdrop-blur-3xl`, `border-white/10`, and `shadow-2xl`.
- A global radial gradient overlays the root (`layout.tsx`) representing a subtle blue hue: `radial-gradient(ellipse 60% 40% at 50% 30%, rgba(30, 64, 175, 0.04) 0%, transparent 70%)`.

**Iconography:**
- Exclusively leveraging `lucide-react`.
- Stroke widths are predominantly `strokeWidth={1.2}` or `1.0` to maintain delicate, razor-thin visual weight, avoiding "cartoony" blockiness.

---

## 2. Page Architecture & Routing

**Page 1: The War Cloud / Node-Link Database (`app/page.tsx`)**
- Renders the primary `NodeDatabase.tsx` interactive component spanning the viewport.
- Replaced the prior Scrollytelling content with an interactive intelligence network database.
- Features a floating glassmorphic Search & Filter Bar (filtering by Framework, Actor, Energy, Shock, etc.), a slide-in detailed Dossier panel for specific node intel, and a custom Physics Control panel.

**Page 2: The 3D Globe (`app/maps/page.tsx`)**
- Leverages the persistent `GlobeView.tsx` background component mounted statically in `layout.tsx` to handle 3D rendering continuously.
- The `app/maps/page.tsx` file provides the contextual UI overlay map dashboard logic ("Data-Hologram" tooltip) layered over the interactive globe pointer space.

**Page 3: The Executive Bento Box CV (`app/dossier/page.tsx`)**
- A sophisticated 3-column "Bento Grid" mapped with CSS Grid.
- Employs `framer-motion` for stagger-delayed loading (`initial={{ opacity: 0, scale: 0.98 }}`, etc.).
- Composed of modular profile data: Thesis Synthesis card, Profile Card, Education, Publications, and Research Focus tags layered on glassmorphic plates.

---

## 3. 3D Map Specifics (Page 2)

**Rendering Engine:** 
Utilizes `react-globe.gl` dynamically loaded via `GlobeView.tsx`.

**Globe Properties:**
- `backgroundColor="rgba(0,0,0,0)"` (transparent logic allowing root background visibility).
- Textures: `earth-dark.jpg` base and `earth-topology.png` bump map.
- Atmosphere Enabled (`showAtmosphere={true}`, color: `#ffffff`, altitude: `0.1`).
- `OrbitControls` are actively bound to the globe via the `handleGlobeReady` ref callback:
  - `autoRotate = true` with `autoRotateSpeed = 0.5`
  - `enableZoom = true` (`minDistance = 150`, `maxDistance = 400`, `zoomSpeed = 0.6`).

**Corridor Formulations (Arcs):**
- **IMEC:** Solid, continuous glowing steel-blue line.
  - Color: `rgba(56, 189, 248, 0.9)` (`#38bdf8`)
  - `arcStroke`: `0.6`
- **Blue-Raman:** Fast-moving dashed purple fiber-optic line.
  - Color: `rgba(192, 132, 252, 0.9)` (`#c084fc`)
  - `arcStroke`: `0.4`
  - Pattern: `dashLength=0.1`, `dashGap=0.1`, `animateTime=1200`
- **DRP & INSTC:** Static, dotted representations.
  - DRP Color: `rgba(217, 119, 6, 0.7)` (Muted amber) / INSTC Color: `rgba(225, 29, 72, 0.7)` (Rose)
  - `arcStroke`: `0.3`
  - Pattern: `dashLength=0.05`, `dashGap=0.05`

**3D HTML Labels:**
- Yes, active. Floating coordinates explicitly generated via `htmlElementsData` pushing native DOM elements into 3D space (`htmlAltitude={() => 0.05}`). Formatted natively in glassmorphism arrays mapping string colors back to the arcs.

---

## 4. Data & Physics Engine (Page 1)

**Data Injection:**
- Successfully integrated the structured `thesisData` taxonomy inside `NodeDatabase.tsx`. All node paradigms exactly map the 36-node array grouping logic specified (Actors, Framework, Logistics, Digital, Energy, Shock, Rival) traversing via 35 active link instances.

**Physics Engine Settings (`react-force-graph-2d` bindings via D3):**
- **Inertia:** `d3AlphaDecay={0.01}`, `d3VelocityDecay={0.2}`.
- **D3 Mechanics Array:** The interface exposes 3 configurable dynamic states using `d3-force` engine simulations directly:
  1. **Repulsion Force (Charge):** Default `-400` bounds from `-1000` to `-50`.
  2. **Link Distance:** Default `60px` bounded strictly from `10` to `300`.
  3. **Collision Radius:** Default `25px` bounded loosely from `5` to `100`.
- **Graphical Triggers:** Selecting nodes recenters canvas view matrices (`fgRef.current.centerAt` / `.zoom`). Hover actions natively override default paths with `#22d3ee` (cyan) colors and activate directional particles traveling spanning associated node links (`linkDirectionalParticles={1}`). Nodes dim to `#18181b` when out of targeted view states.
