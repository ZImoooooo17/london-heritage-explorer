import { useEffect, useMemo } from "react";

function hexToRgba(hex, alpha = 1) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function splitRouteBySteps(routeCoordinates = [], narrativeSteps = []) {
  if (!routeCoordinates.length || !narrativeSteps.length) return [];

  const totalSteps = narrativeSteps.length;
  const totalSegments = routeCoordinates.length - 1;
  if (totalSegments <= 0) return [];

  return narrativeSteps.map((step, index) => {
    const startIndex = Math.floor((index / totalSteps) * totalSegments);
    const endIndex =
      index === totalSteps - 1
        ? routeCoordinates.length
        : Math.floor(((index + 1) / totalSteps) * totalSegments) + 1;

    const coordinates = routeCoordinates.slice(startIndex, Math.max(endIndex, startIndex + 2));

    return {
      ...step,
      coordinates,
    };
  }).filter((step) => step.coordinates.length >= 2);
}

function getStepStyle(stepType, isActive = false) {
  const styles = {
    start: {
      color: "#7c3aed",
      width: isActive ? 7 : 5,
      opacity: isActive ? 0.95 : 0.78,
      dasharray: [0.8, 1.2],
    },
    orientation: {
      color: "#8b5cf6",
      width: isActive ? 7 : 5,
      opacity: isActive ? 0.95 : 0.74,
      dasharray: [1, 1.6],
    },
    intensity: {
      color: "#5b21b6",
      width: isActive ? 8 : 6,
      opacity: isActive ? 0.98 : 0.88,
      dasharray: [1.2, 1.1],
    },
    transition: {
      color: "#9333ea",
      width: isActive ? 7 : 5,
      opacity: isActive ? 0.95 : 0.72,
      dasharray: [0.6, 1.8],
    },
    arrival: {
      color: "#4c1d95",
      width: isActive ? 8 : 6,
      opacity: isActive ? 0.98 : 0.86,
      dasharray: [1.4, 1],
    },
  };

  return styles[stepType] || styles.transition;
}

export default function SegmentLayer({
  map,
  mapReady,
  currentRoute,
  narrativeSteps = [],
  selectedNarrativeStep,
}) {
  const segmentedSteps = useMemo(() => {
    const routeCoordinates = currentRoute?.geometry?.coordinates || [];
    return splitRouteBySteps(routeCoordinates, narrativeSteps);
  }, [currentRoute, narrativeSteps]);

  useEffect(() => {
    if (!map || !mapReady) return;
    if (!map.getSource("route")) return;

    segmentedSteps.forEach((step) => {
      const lineId = `segment-line-${step.id}`;
      const haloId = `segment-halo-${step.id}`;
      const sourceId = `segment-source-${step.id}`;

      const existingLine = map.getLayer(lineId);
      const existingHalo = map.getLayer(haloId);
      const existingSource = map.getSource(sourceId);

      const isActive = selectedNarrativeStep?.id === step.id;
      const style = getStepStyle(step.type, isActive);

      const feature = {
        type: "Feature",
        properties: {
          id: step.id,
          stepType: step.type,
        },
        geometry: {
          type: "LineString",
          coordinates: step.coordinates,
        },
      };

      if (!existingSource) {
        map.addSource(sourceId, {
          type: "geojson",
          data: feature,
        });

        map.addLayer({
          id: haloId,
          type: "line",
          source: sourceId,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": style.color,
            "line-width": style.width + 10,
            "line-opacity": isActive ? 0.18 : 0.08,
            "line-blur": 1.2,
          },
        });

        map.addLayer({
          id: lineId,
          type: "line",
          source: sourceId,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": style.color,
            "line-width": style.width,
            "line-opacity": style.opacity,
            "line-dasharray": style.dasharray,
          },
        });
      } else {
        existingSource.setData(feature);

        if (existingHalo) {
          map.setPaintProperty(haloId, "line-color", style.color);
          map.setPaintProperty(haloId, "line-width", style.width + 10);
          map.setPaintProperty(haloId, "line-opacity", isActive ? 0.18 : 0.08);
        }

        if (existingLine) {
          map.setPaintProperty(lineId, "line-color", style.color);
          map.setPaintProperty(lineId, "line-width", style.width);
          map.setPaintProperty(lineId, "line-opacity", style.opacity);
          map.setPaintProperty(lineId, "line-dasharray", style.dasharray);
        }
      }
    });

    return () => {
      segmentedSteps.forEach((step) => {
        const lineId = `segment-line-${step.id}`;
        const haloId = `segment-halo-${step.id}`;
        const sourceId = `segment-source-${step.id}`;

        if (map.getLayer(lineId)) map.removeLayer(lineId);
        if (map.getLayer(haloId)) map.removeLayer(haloId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
      });
    };
  }, [map, mapReady, segmentedSteps, selectedNarrativeStep]);

  useEffect(() => {
    if (!map || !mapReady) return;

    segmentedSteps.forEach((step) => {
      const pointId = `segment-point-${step.id}`;
      const pointSourceId = `segment-point-source-${step.id}`;
      const pointCoordinates = step.coordinates?.[0];
      if (!pointCoordinates) return;

      const isActive = selectedNarrativeStep?.id === step.id;
      const style = getStepStyle(step.type, isActive);

      const pointFeature = {
        type: "Feature",
        properties: {
          id: step.id,
          label: step.order,
          stepType: step.type,
        },
        geometry: {
          type: "Point",
          coordinates: pointCoordinates,
        },
      };

      if (!map.getSource(pointSourceId)) {
        map.addSource(pointSourceId, {
          type: "geojson",
          data: pointFeature,
        });

        map.addLayer({
          id: pointId,
          type: "circle",
          source: pointSourceId,
          paint: {
            "circle-radius": isActive ? 9 : 7,
            "circle-color": style.color,
            "circle-stroke-color": "#ffffff",
            "circle-stroke-width": 2,
            "circle-opacity": 0.98,
          },
        });
      } else {
        map.getSource(pointSourceId).setData(pointFeature);
        map.setPaintProperty(pointId, "circle-radius", isActive ? 9 : 7);
        map.setPaintProperty(pointId, "circle-color", style.color);
      }
    });

    return () => {
      segmentedSteps.forEach((step) => {
        const pointId = `segment-point-${step.id}`;
        const pointSourceId = `segment-point-source-${step.id}`;
        if (map.getLayer(pointId)) map.removeLayer(pointId);
        if (map.getSource(pointSourceId)) map.removeSource(pointSourceId);
      });
    };
  }, [map, mapReady, segmentedSteps, selectedNarrativeStep]);

  return null;
}