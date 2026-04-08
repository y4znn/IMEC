import { useMemo } from 'react';
import { PathLayer } from '@deck.gl/layers';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { PathStyleExtension, DataFilterExtension } from '@deck.gl/extensions';

import type { LayerConfig } from '@/components/GlobalStatsOverlay';

interface TooltipPayload {
  x: number;
  y: number;
  mandate: string;
  entity: string;
  veracity: number;
  customBody?: string;
}

interface RailwayData {
  name: string;
  entity: string;
  mandate: string;
  color: number[];
  path: [number, number][];
  veracityScore: number;
}

interface DataCenterData {
  coordinates: [number, number];
  entity: string;
  facility: string;
  mandate: string;
  veracityScore: number;
}

interface TelecomTripData {
  name: string;
  entity: string;
  owner?: string;
  mandate: string;
  color: [number, number, number] | [number, number, number, number];
  sourceColor: [number, number, number, number];
  targetColor: [number, number, number, number];
  path: [number, number][];
  timestamps: number[];
  coordinates: [number, number][];
}

interface PickingInfo<T = unknown> {
  object?: T;
  x: number;
  y: number;
}

interface HexPickingInfo {
  object?: {
    points: { source: { city?: string } }[];
  };
  x: number;
  y: number;
}

interface UseImecLayersProps {
  layers: LayerConfig;
  hydratedRailways: RailwayData[];
  hydratedProposed: RailwayData[];
  hydratedMissing: RailwayData[];
  hydratedDataCenters: DataCenterData[];
  telecomTrips: TelecomTripData[];
  currentTime: number;
  setTooltip: (tooltip: TooltipPayload | null) => void;
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
      new HexagonLayer<DataCenterData>({
        id: 'hex-datacenters',
        data: hydratedDataCenters,
        getPosition: (d: DataCenterData) => d.coordinates,
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
        onHover: (info: HexPickingInfo) => {
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
      new TripsLayer<TelecomTripData>({
        id: 'trips-telecom',
        data: telecomTrips,
        getPath: (d: TelecomTripData) => d.path,
        getTimestamps: (d: TelecomTripData) => d.timestamps,
        getColor: (d: TelecomTripData) => {
          const isBlue = d.name.includes('Blue');
          const isActive = layers.subseaTelecom && (isBlue ? layers.blueCable : layers.ramanCable);
          return isActive ? d.color as [number, number, number] : [0, 0, 0, 0] as [number, number, number, number];
        },
        opacity: layers.subseaTelecom ? 1.0 : 0.0,
        widthMinPixels: 2,
        rounded: true,
        trailLength: 500, // length of the animated packet trail
        currentTime: currentTime,
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
      new PathLayer<TelecomTripData>({
        id: 'path-telecom-backbone',
        data: telecomTrips,
        getPath: (d: TelecomTripData) => d.coordinates, // Just the flat array
        getColor: (d: TelecomTripData) => {
          const isBlue = d.name.includes('Blue');
          const isActive = layers.subseaTelecom && (isBlue ? layers.blueCable : layers.ramanCable);
          return isActive ? [...d.color, 40] as [number, number, number, number] : [0, 0, 0, 0];
        },
        getWidth: () => layers.subseaTelecom ? 1 : 0,
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
        onHover: (info: PickingInfo<TelecomTripData>) => {
          if (info.object) {
            const isBlue = info.object.name.includes('Blue');
            const isActive = layers.subseaTelecom && (isBlue ? layers.blueCable : layers.ramanCable);
            if (!isActive) {
              setTooltip(null);
              return true;
            }
            const tooltipText = isBlue
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
      new PathLayer<RailwayData>({
        id: 'path-railways-existing',
        data: hydratedRailways,
        visible: true,
        getPath: (d: RailwayData) => d.path,
        getColor: (d: RailwayData) => layers.railways ? [...d.color, 255] as [number, number, number, number] : [0, 0, 0, 0],
        getWidth: () => layers.railways ? 3 : 0,
        // @ts-expect-error DataFilterExtension accessor
        getFilterValue: (d: RailwayData) => d.veracityScore,
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
        onHover: (info: PickingInfo<RailwayData>) => {
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
      new PathLayer<RailwayData>({
        id: 'path-railways-proposed',
        data: hydratedProposed,
        visible: true,
        getPath: (d: RailwayData) => d.path,
        getColor: (d: RailwayData) => layers.railways ? [...d.color, 180] as [number, number, number, number] : [0, 0, 0, 0],
        getWidth: () => layers.railways ? 3 : 0,
        // @ts-expect-error DataFilterExtension accessor
        getFilterValue: (d: RailwayData) => d.veracityScore,
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
        onHover: (info: PickingInfo<RailwayData>) => {
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
      new PathLayer<RailwayData>({
        id: 'path-railways-missing',
        data: hydratedMissing,
        visible: true,
        getPath: (d: RailwayData) => d.path,
        getColor: () => layers.railways ? [71, 85, 105, 255] as [number, number, number, number] : [0, 0, 0, 0],
        getWidth: () => layers.railways ? 3 : 0,
        // @ts-expect-error DataFilterExtension accessor
        getFilterValue: (d: RailwayData) => d.veracityScore,
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
        onHover: (info: PickingInfo<RailwayData>) => {
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
