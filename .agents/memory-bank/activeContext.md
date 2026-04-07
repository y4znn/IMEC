# Active Technical Context

## Core Constraints
1. **MapLibre GL JS Exclusive**: Exclude any calls, dependencies, or references to Mapbox SDKs/APIs.
2. **No Dark Mode / No Glassmorphism**: Maintain a strictly light-themed, flat UI. Forbid use of `backdrop-filter`, dark backgrounds, and chaotic gradients in the DOM.
3. **CartoDB Positron Basemap**: Enforce a pure light/grayscale basemap ensuring visual prominence for serialized data layers.
4. **Vector Serialization strictness**: All GeoJSON geometries correctly formatted to `[Longitude, Latitude]`.

## Architectural Component Standards
- **Sidebar (UI)**: Pure flat-design `<aside>` on the left acting as a hierarchical control panel with customized SVG/CSS toggle switch components.
- **Layer Styles (Advanced MapLibre)**:
  - **Railway**: Charcoal/slate-gray (`#4a4a4a`) `line-dasharray` LineString.
  - **Subsea Cables**: MapLibre `line-gradient` configured dynamically across the source (`lineMetrics: true`) rendering from teal to magenta using ColorBrewer-inspired aesthetics.
  - **Data Centers**: Code-driven dynamic SVG `maplibregl.Marker`s scaling implicitly via native CSS transforms.
- **Navigation**: Map transitions must exclusively utilize `map.flyTo()` or `map.easeTo()` for smooth performance.
