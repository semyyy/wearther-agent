/** Converts km/h to knots */
export function kmhToKnots(kmh: number): number {
  return Math.round(kmh * 0.539957 * 10) / 10;
}

/** Wind speed color bands in knots */
const WIND_BANDS = [
  { max: 5, color: "#64B5F6", label: "Calm" },
  { max: 11, color: "#66BB6A", label: "Light" },
  { max: 19, color: "#FFD93D", label: "Moderate" },
  { max: 27, color: "#FFA726", label: "Strong" },
  { max: 40, color: "#EF5350", label: "Very Strong" },
  { max: Infinity, color: "#AB47BC", label: "Extreme" },
] as const;

/** Returns hex color for a given wind speed in knots */
export function windSpeedColor(speedKnots: number): string {
  for (const band of WIND_BANDS) {
    if (speedKnots < band.max) return band.color;
  }
  return WIND_BANDS[WIND_BANDS.length - 1].color;
}

/** Returns all wind bands for legend rendering */
export function getWindBands() {
  return WIND_BANDS.map((b) => ({
    color: b.color,
    label: b.label,
    max: b.max === Infinity ? "40+" : `<${b.max}`,
  }));
}

const CARDINALS = [
  "N", "NNE", "NE", "ENE",
  "E", "ESE", "SE", "SSE",
  "S", "SSW", "SW", "WSW",
  "W", "WNW", "NW", "NNW",
] as const;

/** Converts degrees (0-360) to a 16-point cardinal direction string */
export function degreesToCardinal(deg: number): string {
  const idx = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
  return CARDINALS[idx];
}
