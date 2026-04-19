export default function NarrativePanel({
  stats,
  visibleHeritageSites = [],
  narrativeSteps = [],
  selectedHeritage,
  selectedNarrativeStep,
  onSelectStep,
  startSite,
  endSite,
  safeTravelMode = "walk",
  safeRouteType = "exploratory",
  onClose,
}) {
  const title =
    safeRouteType === "adventure"
      ? "Exploratory spatial story"
      : "Guided heritage route";

  const summaryText =
    safeRouteType === "adventure"
      ? "This route moves beyond the most direct path, using landmarks and everyday spatial cues to turn routine travel into a more interpretive urban experience."
      : "This route links heritage stops through a clearer and more structured journey, helping users follow cultural landmarks with less ambiguity.";

  const currentStep =
    selectedNarrativeStep || narrativeSteps[0] || null;

  const currentStop =
    currentStep?.heritage ||
    selectedHeritage ||
    visibleHeritageSites[0] ||
    null;

  return (
    <div className="narrative-panel">
      <div className="narrative-panel__inner">
        <section className="narrative-section">
          <div className="section-head">
            <h4>Journey narrative</h4>
            <button
              type="button"
              className="panel-close-button"
              onClick={onClose}
              aria-label="Close story panel"
            >
              ×
            </button>
          </div>

          <div className="narrative-kicker">Story on demand</div>
          <h3 className="narrative-title">{title}</h3>
          <p className="narrative-summary">{summaryText}</p>

          <div className="narrative-stats">
            <span>{safeTravelMode === "cycle" ? "Cycle" : "Walk"}</span>
            <span>{stats?.timeLabel || "1h"}</span>
            <span>{visibleHeritageSites.length} stops</span>
            <span>{stats?.cueCount || 0} cues</span>
          </div>

          <div className="narrative-route-line">
            <strong>{startSite?.name || "Start"}</strong>
            <span>→</span>
            <strong>{endSite?.name || "End"}</strong>
          </div>
        </section>

        <section className="narrative-section">
          <div className="section-head">
            <h4>Story timeline</h4>
            <span>{narrativeSteps.length} parts</span>
          </div>

          <div className="story-steps">
            {narrativeSteps.map((step) => {
              const isActive = currentStep?.id === step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  className={`story-step ${isActive ? "active" : ""}`}
                  onClick={() => onSelectStep?.(step)}
                >
                  <div className="story-step__top">
                    <span className="story-step__num">{step.order}</span>
                    <span className="story-step__type">
                      {step.type === "start"
                        ? "Start"
                        : step.type === "arrival"
                        ? "End"
                        : step.type === "orientation"
                        ? "Orientation"
                        : step.type === "intensity"
                        ? "Intensity"
                        : "Transition"}
                    </span>
                  </div>

                  <div className="story-step__title">{step.title}</div>

                  <div className="story-step__meta">
                    <span>{step.durationLabel}</span>
                    <span>{step.cueCount} cues</span>
                  </div>

                  <p className="story-step__text">{step.text}</p>
                </button>
              );
            })}
          </div>
        </section>

        {currentStop ? (
          <section className="narrative-section">
            <div className="section-head">
              <h4>Current stop</h4>
            </div>

            <div className="detail-card">
              <div className="detail-card__meta">
                {currentStep?.type || "Heritage stop"}
              </div>
              <h5 className="detail-card__title">{currentStop.name}</h5>
              <div className="detail-card__period">
                {currentStop.period || currentStop.category || "Heritage stop"}
              </div>
              <p className="detail-card__description">
                {currentStep?.text ||
                  currentStop.description ||
                  currentStop.shortDescription ||
                  "This stop anchors the current part of the route and helps translate movement through the city into a more legible spatial story."}
              </p>

              {currentStep?.cues?.length ? (
                <div className="detail-card__cues">
                  {currentStep.cues.slice(0, 4).map((cue, index) => (
                    <span key={`${cue.type || cue.label}-${index}`} className="detail-cue">
                      {cue.label || cue.type}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}