import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

function createStepMarker(step, isActive = false) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `segment-step-marker${isActive ? " active" : ""}`;
  el.setAttribute("aria-label", step?.title || "Story step");

  const num = document.createElement("span");
  num.className = "segment-step-marker__num";
  num.textContent = step?.order ?? "";

  el.appendChild(num);
  return el;
}

export default function SegmentLayer({
  map,
  segments = [],
  selectedNarrativeStep = null,
  onSelectNarrativeStep,
  onSelectHeritage,
}) {
  const markersRef = useRef([]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    segments.forEach((segment, index) => {
      const site = segment?.heritage;
      if (!site?.lng || !site?.lat) return;

      const isActive =
        selectedNarrativeStep?.id === segment.id ||
        selectedNarrativeStep?.heritage?.id === site.id;

      const el = createStepMarker(
        {
          order: index + 1,
          title: segment.title,
        },
        isActive
      );

      el.addEventListener("click", () => {
        if (typeof onSelectNarrativeStep === "function") {
          onSelectNarrativeStep({
            id: segment.id,
            order: index + 1,
            type: segment.type,
            title: segment.title,
            heritage: segment.heritage,
          });
        }

        if (typeof onSelectHeritage === "function" && segment.heritage) {
          onSelectHeritage(segment.heritage);
        }
      });

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([site.lng, site.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [map, segments, selectedNarrativeStep, onSelectNarrativeStep, onSelectHeritage]);

  return null;
}