import { heritageSites } from "../data/heritageSites";

const directGeometry = [
  { x: 120, y: 560 },
  { x: 180, y: 500 },
  { x: 240, y: 430 },
  { x: 300, y: 360 },
  { x: 360, y: 290 },
  { x: 430, y: 210 },
];

const adventureGeometry = [
  { x: 120, y: 560 },
  { x: 170, y: 500 },
  { x: 230, y: 420 },
  { x: 280, y: 340 },
  { x: 360, y: 330 },
  { x: 430, y: 250 },
  { x: 520, y: 120 },
];

function pickSites(indexes) {
  return indexes.map((i) => heritageSites[i]).filter(Boolean);
}

export async function getRoute({
  start,
  end,
  mode = "walk",
  routeType = "direct",
  availableTime = 120,
}) {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const directStops = pickSites([2, 4]);
  const adventureCandidates = pickSites([0, 1, 2, 4]);

  const maxAdventureStops = Math.max(
    2,
    Math.min(adventureCandidates.length, Math.floor(availableTime / 30))
  );

  const adventureStops = adventureCandidates.slice(0, maxAdventureStops);

  const baseRoute =
    routeType === "adventure"
      ? {
          geometry: adventureGeometry,
          stops: adventureStops,
          distanceKm: 2.0,
          durationMin: 96,
        }
      : {
          geometry: directGeometry,
          stops: directStops,
          distanceKm: 1.6,
          durationMin: 24,
        };

  const adjustedDuration =
    mode === "cycle"
      ? Math.round(baseRoute.durationMin * 0.65)
      : baseRoute.durationMin;

  return {
    ...baseRoute,
    start,
    end,
    mode,
    routeType,
    availableTime,
    durationMin: adjustedDuration,
  };
}