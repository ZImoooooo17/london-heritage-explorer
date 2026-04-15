import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import HeritagePopup from "./components/HeritagePopup";
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

function getAdventureStopCount(timeMinutes) {
  if (timeMinutes <= 30) return 2;
  if (timeMinutes <= 60) return 3;
  if (timeMinutes <= 90) return 4;
  if (timeMinutes <= 120) return 5;
  return heritageSites.length;
}

function getVisibleHeritageSites(start, end, routeType, timeMinutes) {
  const startSite = findSiteByName(start);
  const endSite = findSiteByName(end);

  if (!startSite || !endSite) return heritageSites;

  const coreSites = heritageSites.filter(
    (site) =>
      site.name === start ||
      site.name === end ||
      site.name === "British Museum"
  );

  if (routeType === "direct") {
    return coreSites;
  }

  const maxStops = getAdventureStopCount(timeMinutes);

  const additionalSites = heritageSites.filter(
    (site) => site.name !== start && site.name !== end
  );

  return [startSite, ...additionalSites.slice(0, Math.max(0, maxStops - 2)), endSite];
}

function buildStats(startSite, endSite, travelMode, routeType, timeMinutes, visibleSites) {
  const distanceKm = estimateDistanceKm(startSite, endSite, routeType);
  const estimatedDuration = estimateDurationMinutes(distanceKm, travelMode);

  const durationMinutes =
    routeType === "adventure"
      ? Math.max(estimatedDuration, Math.min(timeMinutes, estimatedDuration + 25))
      : estimatedDuration;

  const heritageStops = visibleSites.length;

  const urbanFeatures =
    routeType === "adventure"
      ? 10 + heritageStops * 3
      : 5 + heritageStops * 2;

  return {
    distance: `${distanceKm.toFixed(1)} km`,
    durationMinutes,
    heritageStops,
    urbanFeatures,
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

  const safeRouteType = useMemo(() => normalizeRouteType(routeType), [routeType]);
  const safeTravelMode = useMemo(() => normalizeTravelMode(travelMode), [travelMode]);

  const locations = useMemo(() => heritageSites.map((site) => site.name), []);

  const startSite = useMemo(() => findSiteByName(start), [start]);
  const endSite = useMemo(() => findSiteByName(end), [end]);

  const visibleHeritageSites = useMemo(() => {
    return getVisibleHeritageSites(start, end, safeRouteType, timeMinutes);
  }, [start, end, safeRouteType, timeMinutes]);

  const stats = useMemo(() => {
    return buildStats(
      startSite,
      endSite,
      safeTravelMode,
      safeRouteType,
      timeMinutes,
      visibleHeritageSites
    );
  }, [
    startSite,
    endSite,
    safeTravelMode,
    safeRouteType,
    timeMinutes,
    visibleHeritageSites,
  ]);

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
    if (!selectedHeritage) return;

    const stillVisible = visibleHeritageSites.some(
      (site) => site.name === selectedHeritage.name
    );

    if (!stillVisible) {
      setSelectedHeritage(null);
    }
  }, [selectedHeritage, visibleHeritageSites]);

  useEffect(() => {
    if (!["Journey", "Landmarks", "Saved"].includes(activeTab)) {
      setActiveTab("Journey");
    }
  }, [activeTab]);

  return (
    <div className="app-shell">
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
        visibleHeritageSites={visibleHeritageSites}
        selectedHeritage={selectedHeritage}
        onSelectHeritage={setSelectedHeritage}
      />

      <main className="map-panel">
        <MapView
          startSite={startSite}
          endSite={endSite}
          heritageSites={visibleHeritageSites}
          travelMode={safeTravelMode}
          routeType={safeRouteType}
          timeMinutes={timeMinutes}
          stats={stats}
          onSelectHeritage={setSelectedHeritage}
          selectedHeritage={selectedHeritage}
          sourceLabel={stats.sourceLabel}
        />

        <HeritagePopup
          site={selectedHeritage}
          onClose={() => setSelectedHeritage(null)}
        />
      </main>
    </div>
  );
}