import { useMemo } from 'react';
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
// @ts-ignore
import { TripsLayer } from '@deck.gl/geo-layers';
import { PathStyleExtension, DataFilterExtension } from '@deck.gl/extensions';

import type { LayerConfig } from '@/components/GlobalStatsOverlay';

interface UseImecLayersProps {
  layers: LayerConfig;
  hydratedRailways: any[];
  hydratedProposed: any[];
  hydratedMissing: any[];
  hydratedDataCenters: any[];
  telecomTrips: any[];
  currentTime: number;
  setTooltip: (tooltip: any | null) => void;
}

export function useImecLayers({
  layers,
  hydratedRailways,
  hydratedProposed,
  hydratedMissing,
  hydratedDataCenters,
  telecomTrips,
  currentTime,
  setTooltip,
}: UseImecLayersProps) {
  return useMemo(() => {
    return [
      // HexagonLayer — Data Centers (3D)
      new HexagonLayer<any>({
        id: 'hex-datacenters',
        data: hydratedDataCenters,
        getPosition: (d: any) => d.coordinates,
        visible: true,
        extruded: true,
        gpuAggregation: true,
        elevationScale: 50,
        radius: 20000,
        // Deep Ink Theme:
        colorRange: [
          [20, 20, 20],
          [40, 40, 40],
          [60, 60, 60],
          [80, 80, 80],
          [100, 100, 100],
          [120, 120, 120]
        ],
        getColorWeight: () => 1,
        getElevationWeight: () => 1,
        coverage: 0.8,
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 0, 0, 255],
        opacity: layers.geopolitical ? 1.0 : 0.0,
        updateTriggers: {
          opacity: [layers.geopolitical]
        },
        transitions: {
          opacity: { duration: 500 }
        },
        onHover: (info: any) => {
          if (info.object && layers.geopolitical) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: 'DATA CENTER',
              entity: info.object.points[0].source.city || 'UNKNOWN',
              veracity: 10.0,
            });
          } else {
            setTooltip(null);
          }
          return true;
        },
      }),

      // TripsLayer — Telecom Cables (Packets Flowing)
      new TripsLayer<any>({
        id: 'trips-telecom',
        data: telecomTrips,
        getPath: (d: any) => d.path,
        getTimestamps: (d: any) => d.timestamps,
        getColor: (d: any) => {
          let isBlue = d.name.includes('Blue');
          let isActive = layers.subseaTelecom && (isBlue ? layers.blueCable : layers.ramanCable);
          return isActive ? d.color : [0, 0, 0, 0];
        },
        opacity: layers.subseaTelecom ? 1.0 : 0.0,
        widthMinPixels: 2,
        rounded: true,
        trailLength: 500, // length of the animated packet trail
        currentTime: currentTime,
        shadowEnabled: false,
        updateTriggers: {
          getColor: [layers.subseaTelecom, layers.blueCable, layers.ramanCable],
          opacity: [layers.subseaTelecom]
        },
        transitions: {
          getColor: { duration: 500 },
          opacity: { duration: 500 }
        },
      }),

      // STATIC PATHLAYER FOR TELECOM BACKBONE (Under the trips)
      new PathLayer<any>({
        id: 'path-telecom-backbone',
        data: telecomTrips,
        getPath: (d: any) => d.coordinates, // Just the flat array
        getColor: (d: any) => {
          let isBlue = d.name.includes('Blue');
          let isActive = layers.subseaTelecom && (isBlue ? layers.blueCable : layers.ramanCable);
          return isActive ? [...d.color, 40] as [number, number, number, number] : [0, 0, 0, 0];
        },
        getWidth: (d: any) => layers.subseaTelecom ? 1 : 0,
        widthMinPixels: 1,
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 0, 0, 255],
        updateTriggers: {
          getColor: [layers.subseaTelecom, layers.blueCable, layers.ramanCable],
          getLineColor: [layers.subseaTelecom, layers.blueCable, layers.ramanCable],
          getWidth: [layers.subseaTelecom, layers.blueCable, layers.ramanCable],
        },
        transitions: {
          getColor: { duration: 500 },
          getWidth: { duration: 500 },
        },
        onHover: (info: any) => {
          if (info.object) {
            let isBlue = info.object.name.includes('Blue');
            let isActive = layers.subseaTelecom && (isBlue ? layers.blueCable : layers.ramanCable);
            if (!isActive) {
              setTooltip(null);
              return true;
            }
            let tooltipText = isBlue
              ? "Route: Italy/France/Greece to Israel | Capacity: 218 Tbps | Fiber Pairs: 16 | Strategic Role: Bypasses Egypt/Suez chokepoint."
              : "Route: Jordan/Saudi Arabia/Oman to India | Capacity: 218 Tbps | Length: ~11,700 km | Partners: Google, Omantel, Sparkle.";
            
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || info.object.owner || 'UNKNOWN',
              veracity: 10.0,
              customBody: tooltipText,
            });
          } else {
            setTooltip(null);
          }
          return true;
        },
      }),

      // PathLayer — Existing Railways
      new (PathLayer as any)({
        id: 'path-railways-existing',
        data: hydratedRailways,
        visible: true,
        getPath: (d: any) => d.path,
        getColor: (d: any) => layers.railways ? [...d.color, 255] as [number, number, number, number] : [0, 0, 0, 0],
        getWidth: (d: any) => layers.railways ? 3 : 0,
        getFilterValue: (d: any) => d.veracityScore,
        filterRange: [layers.veracityFilter, 10],
        extensions: [new DataFilterExtension({ filterSize: 1 })],
        updateTriggers: {
          getColor: [layers.railways],
          getLineColor: [layers.railways],
          getWidth: [layers.railways],
          getFilterValue: [layers.veracityFilter],
        },
        transitions: {
          getColor: { duration: 500 },
          getWidth: { duration: 500 },
        },
        widthMinPixels: 0,
        widthMaxPixels: 6,
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 0, 0, 255],
        jointRounded: false,
        capRounded: false,
        onHover: (info: any) => {
          if (info.object && layers.railways) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || 'UNKNOWN',
              veracity: info.object.veracityScore,
            });
          } else {
            setTooltip(null);
          }
        },
      }),

      // PathLayer — Proposed Railways
      new (PathLayer as any)({
        id: 'path-railways-proposed',
        data: hydratedProposed,
        visible: true,
        getPath: (d: any) => d.path,
        getColor: (d: any) => layers.railways ? [...d.color, 180] as [number, number, number, number] : [0, 0, 0, 0],
        getWidth: (d: any) => layers.railways ? 3 : 0,
        getFilterValue: (d: any) => d.veracityScore,
        filterRange: [layers.veracityFilter, 10],
        getDashArray: [8, 4],
        dashJustified: true,
        extensions: [new PathStyleExtension({ dash: true }), new DataFilterExtension({ filterSize: 1 })],
        updateTriggers: {
          getColor: [layers.railways],
          getLineColor: [layers.railways],
          getWidth: [layers.railways],
          getFilterValue: [layers.veracityFilter],
        },
        transitions: {
          getColor: { duration: 500 },
          getWidth: { duration: 500 },
        },
        widthMinPixels: 0,
        widthMaxPixels: 5,
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 0, 0, 255],
        jointRounded: false,
        capRounded: false,
        onHover: (info: any) => {
          if (info.object && layers.railways) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || 'UNKNOWN',
              veracity: info.object.veracityScore,
            });
          } else {
            setTooltip(null);
          }
        },
      }),

      // PathLayer — Missing Railways
      new (PathLayer as any)({
        id: 'path-railways-missing',
        data: hydratedMissing,
        visible: true,
        getPath: (d: any) => d.path,
        getColor: (d: any) => layers.railways ? [71, 85, 105, 255] as [number, number, number, number] : [0, 0, 0, 0],
        getWidth: (d: any) => layers.railways ? 3 : 0,
        getFilterValue: (d: any) => d.veracityScore,
        filterRange: [layers.veracityFilter, 10],
        getDashArray: [6, 6],
        dashJustified: true,
        extensions: [new PathStyleExtension({ dash: true }), new DataFilterExtension({ filterSize: 1 })],
        updateTriggers: {
          getColor: [layers.railways],
          getLineColor: [layers.railways],
          getWidth: [layers.railways],
          getFilterValue: [layers.veracityFilter],
        },
        transitions: {
          getColor: { duration: 500 },
          getWidth: { duration: 500 },
        },
        widthMinPixels: 0,
        widthMaxPixels: 5,
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 0, 0, 255],
        jointRounded: false,
        capRounded: false,
        onHover: (info: any) => {
          if (info.object && layers.railways) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || 'UNKNOWN',
              veracity: info.object.veracityScore,
            });
          } else {
            setTooltip(null);
          }
        },
      }),

    ];
  }, [layers, hydratedDataCenters, hydratedRailways, hydratedProposed, hydratedMissing, telecomTrips, currentTime, setTooltip]);
}
