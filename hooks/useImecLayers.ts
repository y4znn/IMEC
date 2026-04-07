import { useMemo } from 'react';
import { ArcLayer, PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { PathStyleExtension } from '@deck.gl/extensions';

import {
  SUBSEA_CABLES,
  EXISTING_RAILWAYS,
  PROPOSED_RAILWAYS,
  MISSING_RAILWAYS,
  DATA_CENTERS,
} from '@/data/imec-geo-constants';

import type { SubseaCable, RailwayPath, DataCenterPoint } from '@/data/imec-geo-constants';
import type { LayerConfig } from '@/components/GlobalStatsOverlay';

interface UseImecLayersProps {
  layers: LayerConfig;
  intelArticles: any[];
  calculateVeracity: (entity: string, name: string) => number;
  setTooltip: (tooltip: any | null) => void;
}

export function useImecLayers({ layers, intelArticles, calculateVeracity, setTooltip }: UseImecLayersProps) {
  return useMemo(() => {
    return [
      // ArcLayer — Subsea cables
      new ArcLayer<SubseaCable>({
        id: 'arc-cables',
        // Instead of filtering, render all and animate via updates:
        data: SUBSEA_CABLES,
        visible: true,
        getSourcePosition: (d: SubseaCable) => d.source,
        getTargetPosition: (d: SubseaCable) => d.target,
        
        // Triggers and Transitions mapped
        getSourceColor: (d: SubseaCable) => {
          let isBlue = d.name.includes('Blue');
          let isActive = layers.subseaTelecom && (isBlue ? layers.blueCable : layers.ramanCable);
          return isActive ? d.sourceColor : [...d.sourceColor.slice(0, 3), 0] as [number, number, number, number];
        },
        getTargetColor: (d: SubseaCable) => {
          let isBlue = d.name.includes('Blue');
          let isActive = layers.subseaTelecom && (isBlue ? layers.blueCable : layers.ramanCable);
          return isActive ? d.targetColor : [...d.targetColor.slice(0, 3), 0] as [number, number, number, number];
        },
        getWidth: (d: SubseaCable) => {
          let isBlue = d.name.includes('Blue');
          let isActive = layers.subseaTelecom && (isBlue ? layers.blueCable : layers.ramanCable);
          return isActive ? 3 : 0;
        },
        updateTriggers: {
          getSourceColor: [layers.subseaTelecom, layers.blueCable, layers.ramanCable],
          getTargetColor: [layers.subseaTelecom, layers.blueCable, layers.ramanCable],
          getWidth: [layers.subseaTelecom, layers.blueCable, layers.ramanCable],
        },
        transitions: {
          getSourceColor: { duration: 500 },
          getTargetColor: { duration: 500 },
          getWidth: { duration: 500 },
        },
        getHeight: 0.4,
        greatCircle: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 0, 0, 50],
        onHover: (info: any) => {
          if (info.object) {
            let isBlue = info.object.name.includes('Blue');
            let isActive = layers.subseaTelecom && (isBlue ? layers.blueCable : layers.ramanCable);
            if (!isActive) {
              setTooltip(null);
              return;
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
        },
      }),

      // PathLayer — Existing Railways (solid)
      new PathLayer<RailwayPath>({
        id: 'path-railways-existing',
        data: EXISTING_RAILWAYS,
        visible: true,
        getPath: (d: RailwayPath) => d.path,
        getColor: (d: RailwayPath) => layers.railways ? [...d.color, 255] as [number, number, number, number] : [...d.color, 0] as [number, number, number, number],
        getWidth: (d: RailwayPath) => layers.railways ? 3 : 0,
        updateTriggers: {
          getColor: [layers.railways],
          getLineColor: [layers.railways],
          getWidth: [layers.railways],
        },
        transitions: {
          getColor: { duration: 500 },
          getLineColor: { duration: 500 },
          getWidth: { duration: 500 },
        },
        widthMinPixels: 0,
        widthMaxPixels: 6,
        pickable: true,
        jointRounded: false, // strictly 0px flat joins
        capRounded: false,
        onHover: (info: any) => {
          if (info.object && layers.railways) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || 'UNKNOWN',
              veracity: calculateVeracity(info.object.entity, info.object.name),
            });
          } else {
            setTooltip(null);
          }
        },
      }),

      // PathLayer — Proposed Railways (dashed)
      new (PathLayer as any)({
        id: 'path-railways-proposed',
        data: PROPOSED_RAILWAYS,
        visible: true,
        getPath: (d: RailwayPath) => d.path,
        getColor: (d: RailwayPath) => layers.railways ? [...d.color, 180] as [number, number, number, number] : [...d.color, 0] as [number, number, number, number],
        getWidth: (d: RailwayPath) => layers.railways ? 3 : 0,
        updateTriggers: {
          getColor: [layers.railways],
          getLineColor: [layers.railways],
          getWidth: [layers.railways],
        },
        transitions: {
          getColor: { duration: 500 },
          getLineColor: { duration: 500 },
          getWidth: { duration: 500 },
        },
        widthMinPixels: 0,
        widthMaxPixels: 5,
        getDashArray: [8, 4],
        dashJustified: true,
        pickable: true,
        jointRounded: false,
        capRounded: false,
        extensions: [new PathStyleExtension({ dash: true })],
        onHover: (info: any) => {
          if (info.object && layers.railways) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || 'UNKNOWN',
              veracity: calculateVeracity(info.object.entity, info.object.name),
            });
          } else {
            setTooltip(null);
          }
        },
      }),

      // PathLayer — Missing Railways (Ghost Gray Dash)
      new (PathLayer as any)({
        id: 'path-railways-missing',
        data: MISSING_RAILWAYS,
        visible: true,
        getPath: (d: RailwayPath) => d.path,
        getColor: (d: RailwayPath) => layers.railways ? [...d.color, 255] as [number, number, number, number] : [...d.color, 0] as [number, number, number, number],
        getWidth: (d: RailwayPath) => layers.railways ? 3 : 0,
        updateTriggers: {
          getColor: [layers.railways],
          getLineColor: [layers.railways],
          getWidth: [layers.railways],
        },
        transitions: {
          getColor: { duration: 500 },
          getLineColor: { duration: 500 },
          getWidth: { duration: 500 },
        },
        widthMinPixels: 0,
        widthMaxPixels: 5,
        getDashArray: [6, 6],
        dashJustified: true,
        pickable: true,
        jointRounded: false,
        capRounded: false,
        extensions: [new PathStyleExtension({ dash: true })],
        onHover: (info: any) => {
          if (info.object && layers.railways) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || 'UNKNOWN',
              veracity: calculateVeracity(info.object.entity, info.object.name),
            });
          } else {
            setTooltip(null);
          }
        },
      }),

      // ScatterplotLayer — Data Centers
      new ScatterplotLayer<DataCenterPoint>({
        id: 'scatter-datacenters',
        data: DATA_CENTERS,
        visible: true,
        getPosition: (d: DataCenterPoint) => d.position,
        getFillColor: (d: DataCenterPoint) => layers.geopolitical ? [0, 0, 0, 200] : [0, 0, 0, 0],
        getLineColor: (d: DataCenterPoint) => layers.geopolitical ? [0, 0, 0, 255] : [0, 0, 0, 0],
        getRadius: (d: DataCenterPoint) => layers.geopolitical ? 12000 : 0,
        updateTriggers: {
          getFillColor: [layers.geopolitical],
          getLineColor: [layers.geopolitical],
          getRadius: [layers.geopolitical],
        },
        transitions: {
          getFillColor: { duration: 500 },
          getLineColor: { duration: 500 },
          getRadius: { duration: 500 },
        },
        radiusMinPixels: 0,
        radiusMaxPixels: 16,
        lineWidthMinPixels: 1,
        stroked: true,
        filled: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: [0, 0, 0, 120],
        onHover: (info: any) => {
          if (info.object && layers.geopolitical) {
            setTooltip({
              x: info.x,
              y: info.y,
              mandate: info.object.mandate || 'N/A',
              entity: info.object.entity || info.object.facility || 'UNKNOWN',
              veracity: calculateVeracity(info.object.entity || info.object.facility, info.object.facility),
            });
          } else {
            setTooltip(null);
          }
        },
      }),

    ];
  }, [layers, intelArticles, calculateVeracity, setTooltip]);
}
