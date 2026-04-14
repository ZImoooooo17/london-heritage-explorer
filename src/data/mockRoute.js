export const mockDirectRoute = {
    mode: "walk",
    routeType: "direct",
    distanceKm: 1.6,
    durationMin: 24,
    geometry: [
      { x: 120, y: 560 },
      { x: 180, y: 500 },
      { x: 240, y: 430 },
      { x: 300, y: 360 },
      { x: 360, y: 290 },
      { x: 430, y: 210 },
    ],
    stops: [
      {
        id: 1,
        name: "British Museum",
        description: "A major civic and cultural landmark.",
        x: 300,
        y: 360,
      },
    ],
  };
  
  export const mockAdventureRoute = {
    mode: "walk",
    routeType: "adventure",
    distanceKm: 2.0,
    durationMin: 96,
    geometry: [
      { x: 120, y: 560 },
      { x: 170, y: 500 },
      { x: 230, y: 420 },
      { x: 280, y: 340 },
      { x: 360, y: 330 },
      { x: 430, y: 250 },
      { x: 520, y: 120 },
    ],
    stops: [
      {
        id: 1,
        name: "St Pancras Old Church",
        description: "One of the oldest Christian sites in England.",
        x: 170,
        y: 500,
      },
      {
        id: 2,
        name: "Camden Lock",
        description: "A historic canal-side area shaped by trade.",
        x: 280,
        y: 340,
      },
      {
        id: 3,
        name: "British Museum",
        description: "A major civic and cultural landmark.",
        x: 360,
        y: 330,
      },
      {
        id: 4,
        name: "UCL Area Heritage Stop",
        description: "A final heritage-oriented stop near the destination.",
        x: 430,
        y: 250,
      },
    ],
  };