# Map Interactivity Standards

1. **Strictly MapLibre GL JS**: All geospatial web renderings must exclusively use MapLibre GL JS. The use of Mapbox GL JS and referencing Mapbox APIs or SDKs is strictly forbidden.
2. **Camera Constraints**: Any smooth map panning, zooming, or cinematic navigation must use MapLibre's `flyTo` or `easeTo` methods to ensure optimal and performant UX transitions. Do not snap the viewport directly.
