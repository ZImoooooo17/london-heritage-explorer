import { useMemo, useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import MapView from "./components/MapView";
import HeritagePopup from "./components/HeritagePopup";
import { heritageSites } from "./data/heritageSites";

export default function App() {
  const [activeTab, setActiveTab] = useState("Journey");
  const [start, setStart] = useState("9 Approach Road, Camden");
  const [end, setEnd] = useState("UCL, Gower Street, WC1");
  const [travelMode, setTravelMode] = useState("walk");
  const [routeType, setRouteType] = useState("adventure");
  const [timeMinutes, setTimeMinutes] = useState(120);
  const [selectedSite, setSelectedSite] = useState(heritageSites[4]);
  const [showPopup, setShowPopup] = useState(true);

  const stats = useMemo(() => {
    const stops =
      routeType === "adventure" ? Math.min(8, Math.floor(timeMinutes / 25)) : 2;

    const time =
      travelMode === "walk"
        ? Math.round(timeMinutes * 0.8)
        : Math.round(timeMinutes * 0.5);

    const distance =
      travelMode === "walk"
        ? (stops * 0.5).toFixed(1)
        : (stops * 0.8).toFixed(1);

    return { stops, time, distance };
  }, [travelMode, routeType, timeMinutes]);

  const handleTimeChange = (delta) => {
    setTimeMinutes((prev) => Math.max(30, Math.min(300, prev + delta)));
  };

  const handleSelectSite = (site) => {
    setSelectedSite(site);
    setShowPopup(true);
  };

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
        <MapView
          routeType={routeType}
          heritageSites={heritageSites}
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