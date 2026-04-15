const tabs = ["Journey", "Landmarks", "Saved"];

const placeOptions = ["Camden Town", "UCL"];

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${m} min`;
}

export default function Sidebar({
  activeTab,
  setActiveTab,
  start,
  setStart,
  end,
  setEnd,
  travelMode,
  setTravelMode,
  routeType,
  setRouteType,
  timeMinutes,
  handleTimeChange,
  stats,
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="app-title">London</div>
        <div className="app-subtitle">Heritage Explorer</div>
      </div>

      <div className="tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`tab ${activeTab === tab ? "active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="panel">
        <div className="field-label">Start</div>
        <div className="field-input">
          <select value={start} onChange={(e) => setStart(e.target.value)}>
            {placeOptions.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
          <div className="pin pin-start" />
        </div>

        <div className="field-label">End</div>
        <div className="field-input field-input-last">
          <select value={end} onChange={(e) => setEnd(e.target.value)}>
            {placeOptions.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
          <div className="pin pin-end" />
        </div>
      </div>

      <div className="panel">
        <div className="section-title">Travel mode</div>
        <div className="segmented">
          <button
            className={travelMode === "walk" ? "active" : ""}
            onClick={() => setTravelMode("walk")}
          >
            Walk
          </button>
          <button
            className={travelMode === "cycle" ? "active" : ""}
            onClick={() => setTravelMode("cycle")}
          >
            Cycle
          </button>
        </div>

        <div className="section-title">Route type</div>
        <div className="segmented segmented-bottom">
          <button
            className={routeType === "direct" ? "active" : ""}
            onClick={() => setRouteType("direct")}
          >
            Direct
          </button>
          <button
            className={routeType === "adventure" ? "active" : ""}
            onClick={() => setRouteType("adventure")}
          >
            Adventure
          </button>
        </div>

        <div className={`time-box ${routeType === "direct" ? "disabled" : ""}`}>
          <div className="section-title section-title-tight">Available time</div>
          <div className="time-row">
            <div className="time-controls">
              <button
                className="time-btn"
                onClick={() => handleTimeChange(-30)}
                disabled={routeType === "direct"}
              >
                −
              </button>
              <div className="time-display">{formatTime(timeMinutes)}</div>
              <button
                className="time-btn"
                onClick={() => handleTimeChange(30)}
                disabled={routeType === "direct"}
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="legend-title">Map legend</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-dot ld-heritage" />
            Heritage sites
          </div>
          <div className="legend-item">
            <div className="legend-dot ld-tree" />
            Trees
          </div>
          <div className="legend-item">
            <div className="legend-dot ld-bus" />
            Bus stops
          </div>
          <div className="legend-item">
            <div className="legend-dot ld-signal" />
            Signals
          </div>
          <div className="legend-item">
            <div className="legend-square ld-bench" />
            Benches
          </div>
          <div className="legend-item">
            <div className="legend-dot ld-lamp" />
            Street lamps
          </div>
        </div>
      </div>

      <div className="route-info">
  <div className="route-stats">
    <div className="stat-card">
      <div className="stat-val">{stats.stops}</div>
      <div className="stat-lbl">Heritage stops</div>
    </div>
    <div className="stat-card">
      <div className="stat-val">{formatTime(stats.time)}</div>
      <div className="stat-lbl">Est. time</div>
    </div>
    <div className="stat-card">
      <div className="stat-val">{stats.distance} km</div>
      <div className="stat-lbl">Distance</div>
    </div>
  </div>

  <div className="route-note">Route updates automatically</div>
</div>
    </aside>
  );
}