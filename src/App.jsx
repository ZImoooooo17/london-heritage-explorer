import { useEffect, useMemo, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import HeritagePopup from "./components/HeritagePopup";
import { heritageSites } from "./data/heritageSites";
import { getRoute } from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("Journey");
  const [start, setStart] = useState("9 Approach Road, Camden");
  const [end, setEnd] = useState("UCL, Gower Street, WC1");
  const [travelMode, setTravelMode] = useState("walk");
  const [routeType, setRouteType] = useState("adventure");
  const [timeMinutes, setTimeMinutes] = useState(120);

  const [selectedSite, setSelectedSite] = useState(null);
  const [showPopup, setShowPopup] = useState(true);

  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          start,
          end,
          mode: travelMode,
          routeType,
          availableTime: timeMinutes,
        });

        if (!cancelled) {
          setRouteData(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Could not load route.");
        }
        console.error(err);
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
  }, [start, end, travelMode, routeType, timeMinutes]);

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
    return {
      stops: routeData?.stops?.length ?? 0,
      time: routeData?.durationMin ?? 0,
      distance: routeData?.distanceKm?.toFixed(1) ?? "0.0",
    };
  }, [routeData]);

  return (
    <div className="app">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        start={start}
        setStart={setStart}
        end={end}
        setEnd={setEnd}
        travelMode={travelMode}
        setTravelMode={setTravelMode}
        routeType={routeType}
        setRouteType={setRouteType}
        timeMinutes={timeMinutes}
        handleTimeChange={handleTimeChange}
        stats={stats}
      />

      <main className="map-area">
        {loading && <div className="route-status">Calculating route...</div>}
        {error && <div className="route-status route-error">{error}</div>}

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