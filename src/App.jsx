import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import { heritageSites } from "./data/heritageSites";

const DEFAULT_TAB = "Journey";
const DEFAULT_START = "St Pancras Old Church";
const DEFAULT_END = "Senate House";
const MIN_TIME = 30;
const MAX_TIME = 240;
const TIME_STEP = 30;

function normalizeRouteType(routeType) {
  const value = String(routeType || "").toLowerCase();
  return value === "direct" ? "direct" : "adventure";
}

function normalizeTravelMode(travelMode) {
  const value = String(travelMode || "").toLowerCase();
  return value === "cycle" ? "cycle" : "walk";
}

function findSiteByName(name) {
  return heritageSites.find((site) => site.name === name) || null;
}

function estimateDistanceKm(startSite, endSite, routeType) {
  if (!startSite || !endSite) return routeType === "adventure" ? 4.8 : 2.6;

  const latKm = (startSite.lat - endSite.lat) * 111;
  const lngKm = (startSite.lng - endSite.lng) * 69;
  const straightLineKm = Math.sqrt(latKm ** 2 + lngKm ** 2);

  const routeMultiplier = routeType === "adventure" ? 1.45 : 1.12;
  return Math.max(1.2, straightLineKm * routeMultiplier);
}

function estimateDurationMinutes(distanceKm, travelMode) {
  const speedKmh = travelMode === "cycle" ? 14 : 4.8;
  return Math.round((distanceKm / speedKmh) * 60);
}

function buildStats(startSite, endSite, travelMode, routeType, timeMinutes) {
  const distanceKm = estimateDistanceKm(startSite, endSite, routeType);
  const estimatedDuration = estimateDurationMinutes(distanceKm, travelMode);

  const durationMinutes =
    routeType === "adventure"
      ? Math.max(
          estimatedDuration,
          Math.min(timeMinutes, estimatedDuration + 25)
        )
      : estimatedDuration;

  return {
    distance: `${distanceKm.toFixed(1)} km`,
    durationMinutes,
    sourceLabel: "Mapbox",
  };
}

export default function App() {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const [start, setStart] = useState(DEFAULT_START);
  const [end, setEnd] = useState(DEFAULT_END);
  const [travelMode, setTravelMode] = useState("walk");
  const [routeType, setRouteType] = useState("adventure");
  const [timeMinutes, setTimeMinutes] = useState(90);
  const [selectedHeritage, setSelectedHeritage] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true);

  const safeRouteType = useMemo(
    () => normalizeRouteType(routeType),
    [routeType]
  );
  const safeTravelMode = useMemo(
    () => normalizeTravelMode(travelMode),
    [travelMode]
  );

  const locations = useMemo(
    () => heritageSites.map((site) => site.name),
    []
  );

  const startSite = useMemo(() => findSiteByName(start), [start]);
  const endSite = useMemo(() => findSiteByName(end), [end]);

  const stats = useMemo(() => {
    return buildStats(
      startSite,
      endSite,
      safeTravelMode,
      safeRouteType,
      timeMinutes
    );
  }, [startSite, endSite, safeTravelMode, safeRouteType, timeMinutes]);

  function handleTimeChange(delta) {
    setTimeMinutes((prev) => {
      const next = prev + delta;
      return Math.min(MAX_TIME, Math.max(MIN_TIME, next));
    });
  }

  function handleStartChange(nextStart) {
    if (!nextStart || nextStart === end) return;
    setStart(nextStart);
  }

  function handleEndChange(nextEnd) {
    if (!nextEnd || nextEnd === start) return;
    setEnd(nextEnd);
  }

  function swapLocations() {
    setStart(end);
    setEnd(start);
  }

  useEffect(() => {
    if (!["Journey", "Landmarks"].includes(activeTab)) {
      setActiveTab("Journey");
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedHeritage) {
      setIsPanelOpen(false);
    }
  }, [selectedHeritage]);

  useEffect(() => {
    setIsPanelOpen(true);
  }, [activeTab]);

  useEffect(() => {
    setSelectedHeritage(null);
  }, [start, end, safeRouteType, safeTravelMode, timeMinutes]);

  return (
    <div className="app-shell">
      <div className={`panel-shell ${isPanelOpen ? "open" : "closed"}`}>
        <button
          type="button"
          className="panel-toggle"
          onClick={() => setIsPanelOpen((prev) => !prev)}
          aria-label={isPanelOpen ? "Close controls" : "Open controls"}
        >
          {isPanelOpen ? "Close" : "Journey"}
        </button>

        {isPanelOpen ? (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            start={start}
            setStart={handleStartChange}
            end={end}
            setEnd={handleEndChange}
            swapLocations={swapLocations}
            travelMode={safeTravelMode}
            setTravelMode={setTravelMode}
            routeType={safeRouteType}
            setRouteType={setRouteType}
            timeMinutes={timeMinutes}
            handleTimeChange={handleTimeChange}
            timeStep={TIME_STEP}
            stats={stats}
            locations={locations}
            selectedHeritage={selectedHeritage}
            onSelectHeritage={setSelectedHeritage}
          />
        ) : null}
      </div>

      <main className="map-panel">
        <MapView
          startSite={startSite}
          endSite={endSite}
          heritageSites={heritageSites}
          travelMode={safeTravelMode}
          routeType={safeRouteType}
          timeMinutes={timeMinutes}
          stats={stats}
          onSelectHeritage={setSelectedHeritage}
          selectedHeritage={selectedHeritage}
          sourceLabel={stats.sourceLabel}
        />
      </main>
    </div>
  );
}