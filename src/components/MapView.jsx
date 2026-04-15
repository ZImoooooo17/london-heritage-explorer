import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import {
  trees,
  busStops,
  signals,
  benches,
  lamps,
} from "../data/mapFeatures";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const LONDON_CENTER = [-0.131, 51.5205];

function createHeritageMarker(isActive = false, isEndpoint = false) {
  const el = document.createElement("button");
  el.type = "button";
  el.className = `heritage-marker${isActive ? " active" : ""}${
    isEndpoint ? " endpoint" : ""
  }`;
  el.setAttribute("aria-label", "Heritage site marker");
  return el;
}

function createFeatureMarker(type) {
  const el = document.createElement("div");
  el.className = `map-feature-marker ${type}`;
  return el;
}

function featureCollectionFromDirections(data) {
  return {
    type: "Feature",
    properties: {},
    geometry: data.routes[0].geometry,
  };
}

function buildFallbackRoute(
  startSite,
  endSite,
  routeType = "direct",
  visibleHeritageSites = []
) {
  if (!startSite || !endSite) {
    return {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [],
      },
    };
  }

  const coordinates = [[startSite.lng, startSite.lat]];

  if (routeType === "adventure" && visibleHeritageSites.length > 2) {
    const middleSites = visibleHeritageSites.filter(
      (site) => site.name !== startSite.name && site.name !== endSite.name
    );

    middleSites.slice(0, 3).forEach((site) => {
      coordinates.push([site.lng, site.lat]);
    });
  }

  coordinates.push([endSite.lng, endSite.lat]);

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates,
    },
  };
}

function getFeatureGroups(routeType) {
  if (routeType === "adventure") {
    return [
      { key: "tree", label: "Trees", items: trees.slice(0, 6), type: "tree" },
      { key: "bus", label: "Bus stops", items: busStops.slice(0, 5), type: "bus" },
      { key: "signal", label: "Signals", items: signals.slice(0, 4), type: "signal" },
      { key: "bench", label: "Benches", items: benches.slice(0, 4), type: "bench" },
      { key: "lamp", label: "Lamps", items: lamps.slice(0, 5), type: "lamp" },
    ];
  }

  return [
    { key: "tree", label: "Trees", items: trees.slice(0, 3), type: "tree" },
    { key: "bus", label: "Bus stops", items: busStops.slice(0, 2), type: "bus" },
    { key: "signal", label: "Signals", items: signals.slice(0, 2), type: "signal" },
    { key: "bench", label: "Benches", items: benches.slice(0, 1), type: "bench" },
    { key: "lamp", label: "Lamps", items: lamps.slice(0, 2), type: "lamp" },
  ];
}

function getRoutePaint(routeType) {
  if (routeType === "adventure") {
    return {
      color: "#5B4FE5",
      width: 7,
      opacity: 0.95,
      dasharray: [2, 1.4],
      glowOpacity: 0.18,
    };
  }

  return {
    color: "#2F6BFF",
    width: 5,
    opacity: 0.94,
    dasharray: [1, 0],
    glowOpacity: 0.14,
  };
}

function getNarrativeCopy(routeType, travelMode) {
  const modeLabel = travelMode === "cycle" ? "cycle" : "walk";

  if (routeType === "adventure") {
    return {
      title: "Story-rich journey",
      description: `This ${modeLabel} route expands across the corridor to include more heritage stops, encouraging a slower and more exploratory reading of the city.`,
    };
  }

  return {
    title: "Fast heritage connection",
    description: `This ${modeLabel} route prioritises a shorter and clearer connection between the selected landmarks while preserving a minimal heritage narrative.`,
  };
}

export default function MapView({
  startSite,
  endSite,
  heritageSites = [],
  travelMode = "walk",
  routeType = "direct",
  timeMinutes = 90,
  stats = null,
  onSelectHeritage,
  selectedHeritage,
  sourceLabel = "Mapbox",
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const heritageMarkersRef = useRef([]);
  const featureMarkersRef = useRef([]);
  const [mapReady, setMapReady] = useState(false);

  const [activePopupSite, setActivePopupSite] = useState(null);
  const [visibleLayers, setVisibleLayers] = useState({
    heritage: true,
    bus: true,
    tree: true,
    bench: true,
    signal: true,
    lamp: false,
  });

  const routeProfile = useMemo(
    () => (travelMode === "cycle" ? "cycling" : "walking"),
    [travelMode]
  );

  const featureGroups = useMemo(() => getFeatureGroups(routeType), [routeType]);
  const routePaint = useMemo(() => getRoutePaint(routeType), [routeType]);
  const narrativeCopy = useMemo(
    () => getNarrativeCopy(routeType, travelMode),
    [routeType, travelMode]
  );

  const visibleHeritageSites = useMemo(() => {
    if (!startSite || !endSite) return heritageSites;

    if (routeType === "direct") {
      const filtered = heritageSites.filter(
        (site) =>
          site.name === startSite.name ||
          site.name === endSite.name ||
          site.priority === "primary" ||
          site.featured === true
      );

      return filtered.length >= 2 ? filtered : heritageSites.slice(0, 3);
    }

    return heritageSites;
  }, [heritageSites, routeType, startSite, endSite]);

  useEffect(() => {
    if (!MAPBOX_TOKEN || mapRef.current || !mapContainerRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: LONDON_CENTER,
      zoom: 12.8,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    map.on("load", () => {
      map.addSource("route", {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: [],
          },
        },
      });

      map.addLayer({
        id: "route-line-glow",
        type: "line",
        source: "route",
        paint: {
          "line-color": routePaint.color,
          "line-width": routePaint.width + 6,
          "line-opacity": routePaint.glowOpacity,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      });

      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        paint: {
          "line-color": routePaint.color,
          "line-width": routePaint.width,
          "line-opacity": routePaint.opacity,
          "line-dasharray": routePaint.dasharray,
        },
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
      });

      setMapReady(true);
    });

    mapRef.current = map;

    return () => {
      heritageMarkersRef.current.forEach((marker) => marker.remove());
      featureMarkersRef.current.forEach((marker) => marker.remove());

      heritageMarkersRef.current = [];
      featureMarkersRef.current = [];

      setMapReady(false);
      map.remove();
      mapRef.current = null;
    };
  }, [routePaint]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!map.getLayer("route-line") || !map.getLayer("route-line-glow")) return;

    map.setPaintProperty("route-line-glow", "line-color", routePaint.color);
    map.setPaintProperty(
      "route-line-glow",
      "line-width",
      routePaint.width + 6
    );
    map.setPaintProperty(
      "route-line-glow",
      "line-opacity",
      routePaint.glowOpacity
    );

    map.setPaintProperty("route-line", "line-color", routePaint.color);
    map.setPaintProperty("route-line", "line-width", routePaint.width);
    map.setPaintProperty("route-line", "line-opacity", routePaint.opacity);
    map.setPaintProperty("route-line", "line-dasharray", routePaint.dasharray);
  }, [routePaint, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    heritageMarkersRef.current.forEach((marker) => marker.remove());
    heritageMarkersRef.current = [];

    if (!visibleLayers.heritage) return;

    visibleHeritageSites.forEach((site) => {
      const isActive = selectedHeritage?.id === site.id;
      const isEndpoint =
        site.name === startSite?.name || site.name === endSite?.name;

      const el = createHeritageMarker(isActive, isEndpoint);

      el.addEventListener("click", () => {
        onSelectHeritage?.(site);
        setActivePopupSite(site);
      });

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([site.lng, site.lat])
        .addTo(map);

      heritageMarkersRef.current.push(marker);
    });
  }, [
    visibleHeritageSites,
    selectedHeritage,
    onSelectHeritage,
    startSite,
    endSite,
    mapReady,
    visibleLayers.heritage,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    featureMarkersRef.current.forEach((marker) => marker.remove());
    featureMarkersRef.current = [];

    featureGroups.forEach(({ items, type, key }) => {
      if (!visibleLayers[key]) return;

      items.forEach((item) => {
        const el = createFeatureMarker(type);

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: "center",
        })
          .setLngLat([item.lng, item.lat])
          .addTo(map);

        featureMarkersRef.current.push(marker);
      });
    });
  }, [featureGroups, mapReady, visibleLayers]);

  useEffect(() => {
    const focusSite = selectedHeritage || activePopupSite;
    const map = mapRef.current;
    if (!map || !mapReady || !focusSite) return;

    map.flyTo({
      center: [focusSite.lng, focusSite.lat],
      zoom: 14.4,
      offset: [140, 0],
      duration: 800,
      essential: true,
    });
  }, [selectedHeritage, activePopupSite, mapReady]);

  useEffect(() => {
    if (selectedHeritage) {
      setActivePopupSite(selectedHeritage);
    }
  }, [selectedHeritage]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !startSite || !endSite) return;

    const controller = new AbortController();

    async function loadRoute() {
      try {
        let coordinatesForDirections = `${startSite.lng},${startSite.lat};${endSite.lng},${endSite.lat}`;

        if (routeType === "adventure" && visibleHeritageSites.length > 2) {
          const viaSites = visibleHeritageSites
            .filter(
              (site) => site.name !== startSite.name && site.name !== endSite.name
            )
            .slice(0, 3);

          if (viaSites.length > 0) {
            coordinatesForDirections = [
              `${startSite.lng},${startSite.lat}`,
              ...viaSites.map((site) => `${site.lng},${site.lat}`),
              `${endSite.lng},${endSite.lat}`,
            ].join(";");
          }
        }

        const url =
          `https://api.mapbox.com/directions/v5/mapbox/${routeProfile}/` +
          `${coordinatesForDirections}` +
          `?alternatives=false&geometries=geojson&overview=full&steps=false&access_token=${MAPBOX_TOKEN}`;

        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("Failed to fetch directions");

        const data = await response.json();
        if (!data.routes?.length) throw new Error("No route returned");

        const routeGeoJSON = featureCollectionFromDirections(data);
        const source = map.getSource("route");

        if (source) {
          source.setData(routeGeoJSON);
        }

        const bounds = new mapboxgl.LngLatBounds();
        routeGeoJSON.geometry.coordinates.forEach((coord) => bounds.extend(coord));

        visibleHeritageSites.forEach((site) => {
          bounds.extend([site.lng, site.lat]);
        });

        map.fitBounds(bounds, {
          padding: { top: 100, right: 120, bottom: 110, left: 120 },
          maxZoom: 14,
          duration: 900,
        });
      } catch (error) {
        if (error.name === "AbortError") return;

        const fallbackRoute = buildFallbackRoute(
          startSite,
          endSite,
          routeType,
          visibleHeritageSites
        );

        const source = map.getSource("route");
        if (source) {
          source.setData(fallbackRoute);
        }

        const bounds = new mapboxgl.LngLatBounds();
        fallbackRoute.geometry.coordinates.forEach((coord) => bounds.extend(coord));
        visibleHeritageSites.forEach((site) =>
          bounds.extend([site.lng, site.lat])
        );

        map.fitBounds(bounds, {
          padding: { top: 100, right: 120, bottom: 110, left: 120 },
          maxZoom: 14,
          duration: 900,
        });

        console.error(error);
      }
    }

    loadRoute();

    return () => controller.abort();
  }, [
    startSite,
    endSite,
    visibleHeritageSites,
    routeProfile,
    routeType,
    mapReady,
  ]);

  const popupSite = activePopupSite || selectedHeritage;

  return (
    <div className="map-view">
      <div className="map-meta">
        <span>Source: {sourceLabel}</span>
      </div>

      <div className="map-overlay top-right">
        <div className="map-badge">
          <strong>
            {routeType === "adventure" ? "Adventure Route" : "Direct Route"}
          </strong>
          <span>{travelMode === "cycle" ? "Cycle" : "Walk"}</span>
        </div>
      </div>

      <div className="map-overlay bottom-left">
        <div className="map-legend">
          <div className="legend-title">Layers</div>

          <button
            type="button"
            className={`legend-toggle ${visibleLayers.heritage ? "active" : ""}`}
            onClick={() =>
              setVisibleLayers((prev) => ({
                ...prev,
                heritage: !prev.heritage,
              }))
            }
          >
            <span className="legend-row">
              <span className="legend-dot heritage" />
              <span>Heritage</span>
            </span>
          </button>

          <button
            type="button"
            className={`legend-toggle ${visibleLayers.bus ? "active" : ""}`}
            onClick={() =>
              setVisibleLayers((prev) => ({
                ...prev,
                bus: !prev.bus,
              }))
            }
          >
            <span className="legend-row">
              <span className="legend-dot bus" />
              <span>Bus stops</span>
            </span>
          </button>

          <button
            type="button"
            className={`legend-toggle ${visibleLayers.tree ? "active" : ""}`}
            onClick={() =>
              setVisibleLayers((prev) => ({
                ...prev,
                tree: !prev.tree,
              }))
            }
          >
            <span className="legend-row">
              <span className="legend-dot tree" />
              <span>Trees</span>
            </span>
          </button>

          <button
            type="button"
            className={`legend-toggle ${visibleLayers.bench ? "active" : ""}`}
            onClick={() =>
              setVisibleLayers((prev) => ({
                ...prev,
                bench: !prev.bench,
              }))
            }
          >
            <span className="legend-row">
              <span className="legend-dot bench" />
              <span>Benches</span>
            </span>
          </button>

          <button
            type="button"
            className={`legend-toggle ${visibleLayers.signal ? "active" : ""}`}
            onClick={() =>
              setVisibleLayers((prev) => ({
                ...prev,
                signal: !prev.signal,
              }))
            }
          >
            <span className="legend-row">
              <span className="legend-dot signal" />
              <span>Signals</span>
            </span>
          </button>

          <button
            type="button"
            className={`legend-toggle ${visibleLayers.lamp ? "active" : ""}`}
            onClick={() =>
              setVisibleLayers((prev) => ({
                ...prev,
                lamp: !prev.lamp,
              }))
            }
          >
            <span className="legend-row">
              <span className="legend-dot lamp" />
              <span>Lamps</span>
            </span>
          </button>
        </div>
      </div>

      <div className="map-overlay bottom-right">
        <div className="map-story-card">
          <h4>{narrativeCopy.title}</h4>
          <p>{narrativeCopy.description}</p>

          <div className="story-stats">
            <span>{stats?.distance || "—"}</span>
            <span>{stats?.heritageStops || visibleHeritageSites.length} stops</span>
            <span>{stats?.durationText || `${timeMinutes} min`}</span>
          </div>
        </div>
      </div>

      {popupSite ? (
        <div className="heritage-popup">
          <button
            type="button"
            className="popup-close"
            onClick={() => setActivePopupSite(null)}
            aria-label="Close story popup"
          >
            ×
          </button>

          <div className="popup-num">
            {Math.max(
              1,
              visibleHeritageSites.findIndex(
                (site) => site.id === popupSite.id || site.name === popupSite.name
              ) + 1
            )}
          </div>

          <div className="popup-img">Story stop</div>
          <div className="popup-meta">Heritage stop</div>
          <div className="popup-name">{popupSite.name}</div>
          <div className="popup-desc">
            {popupSite.description ||
              "This stop adds historical context to the route and helps frame the journey as a spatial story rather than a simple connection."}
          </div>

          <button
            type="button"
            className="popup-link"
            onClick={() => onSelectHeritage?.(popupSite)}
          >
            Focus this stop
          </button>
        </div>
      ) : null}

      <div ref={mapContainerRef} className="mapbox-map" />
    </div>
  );
}