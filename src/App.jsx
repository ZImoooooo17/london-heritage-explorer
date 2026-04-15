import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import HeritagePopup from "./components/HeritagePopup";
import { heritageSites } from "./data/heritageSites";
import { getRoute } from "./services/api";

const PLACE_OPTIONS = [
  {
    id: "camden",
    label: "Camden Town",
    routeText: "Camden Town, London",
  },
  {
    id: "ucl",
    label: "UCL",
    routeText: "UCL, Gower Street, WC1",
  },
];

function findPlace(value) {
  if (!value) return null;

  const normalized = String(value).trim().toLowerCase();

  return (
    PLACE_OPTIONS.find((place) => place.id === normalized) ||
    PLACE_OPTIONS.find((place) => place.label.toLowerCase() === normalized) ||
    PLACE_OPTIONS.find((place) => place.routeText.toLowerCase() === normalized) ||
    null
  );
}

function normalizePlaceLabel(value, fallbackLabel) {
  const matched = findPlace(value);
  return matched ? matched.label : fallbackLabel;
}

function getRouteTextFromLabel(label, fallbackRouteText) {
  const matched = findPlace(label);
  return matched ? matched.routeText : fallbackRouteText;
}

export default function App() {
  const [activeTab, setActiveTab] = useState("Journey");
  const [start, setStart] = useState("Camden Town");
  const [end, setEnd] = useState("UCL");
  const [travelMode, setTravelMode] = useState("walk");
  const [routeType, setRouteType] = useState("direct");
  const [timeMinutes, setTimeMinutes] = useState(120);

  const [selectedSite, setSelectedSite] = useState(null);
  const [showPopup, setShowPopup] = useState(true);

  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const startRouteText = useMemo(() => {
    return getRouteTextFromLabel(start, "Camden Town, London");
  }, [start]);

  const endRouteText = useMemo(() => {
    return getRouteTextFromLabel(end, "UCL, Gower Street, WC1");
  }, [end]);

  const handleSafeStartChange = (value) => {
    setStart((prev) => normalizePlaceLabel(value, prev));
  };

  const handleSafeEndChange = (value) => {
    setEnd((prev) => normalizePlaceLabel(value, prev));
  };

  const handleTimeChange = (delta) => {
    setTimeMinutes((prev) => Math.max(30, Math.min(300, prev + delta)));
  };

  const handleSelectSite = (site) => {
    setSelectedSite(site);
    setShowPopup(true);
  };

  useEffect(() => {
    let cancelled = false;

    async function loadRoute() {
      try {
        setLoading(true);
        setError("");

        const data = await getRoute({
          startText: startRouteText,
          endText: endRouteText,
          travelMode,
          routeType,
          availableTime: timeMinutes,
        });

        if (!cancelled) {
          setRouteData(data);
        }
      } catch (err) {
        console.error("App loadRoute error:", err);

        if (!cancelled) {
          setError("Could not load route.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRoute();

    return () => {
      cancelled = true;
    };
  }, [startRouteText, endRouteText, travelMode, routeType, timeMinutes]);

  useEffect(() => {
    if (!routeData?.stops?.length) {
      setSelectedSite(null);
      return;
    }

    const selectedStillExists = routeData.stops.some(
      (site) => site.id === selectedSite?.id
    );

    if (!selectedStillExists) {
      setSelectedSite(routeData.stops[0]);
      setShowPopup(true);
    }
  }, [routeData, selectedSite]);

  const stats = useMemo(() => {
    const distanceMeters = Number(routeData?.summary?.distance ?? 0);
    const durationSeconds = Number(routeData?.summary?.duration ?? 0);

    return {
      stops: routeData?.stops?.length ?? 0,
      time: Math.round(durationSeconds / 60),
      distanceKm: distanceMeters / 1000,
    };
  }, [routeData]);

  return (
    <div className="app">
<Sidebar
  activeTab={activeTab}
  setActiveTab={setActiveTab}
  start={start}
  setStart={handleSafeStartChange}
  end={end}
  setEnd={handleSafeEndChange}
  travelMode={travelMode}
  setTravelMode={setTravelMode}
  routeType={routeType}
  setRouteType={setRouteType}
  timeMinutes={timeMinutes}
  handleTimeChange={handleTimeChange}
  stats={{
    stops: routeData?.stops?.length ?? 0,
    time: Math.round(Number(routeData?.summary?.duration ?? 0) / 60),
    distance: (Number(routeData?.summary?.distance ?? 0) / 1000).toFixed(1),
  }}
/>

      <main className="map-area">
        {loading && <div className="route-status">Calculating route...</div>}
        {error && <div className="route-status route-error">{error}</div>}

        {routeData?.meta?.source && (
          <div className="route-status">
            Source: {routeData.meta.source}
            {routeData?.meta?.error ? ` | Error: ${routeData.meta.error}` : ""}
          </div>
        )}

        <MapView
          routeType={routeType}
          heritageSites={heritageSites}
          routeData={routeData}
          routeStops={routeData?.stops || []}
          selectedSite={selectedSite}
          showPopup={showPopup}
          onSelectSite={handleSelectSite}
        />

        <HeritagePopup
          site={selectedSite}
          showPopup={showPopup}
          onClose={() => setShowPopup(false)}
        />
      </main>
    </div>
  );
}