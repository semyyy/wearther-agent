import type { HourlyEntry } from "../api/types";
import styles from "../styles/weather-card.module.css";

interface Props {
  entries: HourlyEntry[];
}

export default function EphemerisCard({ entries }: Props) {
  // Get sunrise/sunset from the first entry that has them
  const withSun = entries.find((e) => e.sunrise && e.sunset);
  if (!withSun) return null;

  const sunrise = withSun.sunrise!;
  const sunset = withSun.sunset!;

  // Parse times
  const sunriseTime = sunrise.includes("T") ? sunrise.split("T")[1].slice(0, 5) : sunrise;
  const sunsetTime = sunset.includes("T") ? sunset.split("T")[1].slice(0, 5) : sunset;

  // Calculate day duration
  const [srH, srM] = sunriseTime.split(":").map(Number);
  const [ssH, ssM] = sunsetTime.split(":").map(Number);
  const dayMinutes = (ssH * 60 + ssM) - (srH * 60 + srM);
  const dayHours = Math.floor(dayMinutes / 60);
  const dayMins = dayMinutes % 60;
  const nightMinutes = 1440 - dayMinutes;
  const nightHours = Math.floor(nightMinutes / 60);
  const nightMins = nightMinutes % 60;

  // Sun position on arc (0 = sunrise, 1 = sunset)
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const sunriseMinutes = srH * 60 + srM;
  const sunsetMinutes = ssH * 60 + ssM;
  let sunPosition = 0;
  const isNow = currentMinutes >= sunriseMinutes && currentMinutes <= sunsetMinutes;
  if (isNow) {
    sunPosition = (currentMinutes - sunriseMinutes) / (sunsetMinutes - sunriseMinutes);
  }

  // SVG arc
  const arcWidth = 280;
  const arcHeight = 100;
  const cx = arcWidth / 2;
  const cy = arcHeight;
  const rx = (arcWidth - 40) / 2;
  const ry = arcHeight - 20;

  // Sun position on arc
  const sunAngle = Math.PI * (1 - sunPosition);
  const sunX = cx + rx * Math.cos(sunAngle);
  const sunY = cy - ry * Math.sin(sunAngle);

  return (
    <div className={styles.chartSection}>
      <div className={styles.chartTitle}>Ephemeris</div>

      {/* Sun arc */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0 16px" }}>
        <svg width={arcWidth} height={arcHeight + 20} viewBox={`0 0 ${arcWidth} ${arcHeight + 20}`}>
          {/* Horizon line */}
          <line x1="10" y1={cy} x2={arcWidth - 10} y2={cy} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

          {/* Arc path */}
          <path
            d={`M 20 ${cy} A ${rx} ${ry} 0 0 1 ${arcWidth - 20} ${cy}`}
            fill="none"
            stroke="rgba(255, 193, 7, 0.3)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Traveled arc (filled) */}
          {isNow && (
            <path
              d={`M 20 ${cy} A ${rx} ${ry} 0 0 1 ${sunX} ${sunY}`}
              fill="none"
              stroke="rgba(255, 193, 7, 0.8)"
              strokeWidth="2"
            />
          )}

          {/* Sun circle */}
          {isNow && (
            <>
              <circle cx={sunX} cy={sunY} r="12" fill="rgba(255, 193, 7, 0.3)" />
              <circle cx={sunX} cy={sunY} r="7" fill="#FFC107" />
            </>
          )}

          {/* Sunrise label */}
          <text x="20" y={cy + 16} fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="start">
            {sunriseTime}
          </text>

          {/* Sunset label */}
          <text x={arcWidth - 20} y={cy + 16} fill="rgba(255,255,255,0.7)" fontSize="11" textAnchor="end">
            {sunsetTime}
          </text>

          {/* Day duration at top center */}
          <text x={cx} y="16" fill="rgba(255,255,255,0.9)" fontSize="12" fontWeight="600" textAnchor="middle">
            {dayHours}h {dayMins}m daylight
          </text>
        </svg>
      </div>

      {/* Info row */}
      <div style={{ display: "flex", justifyContent: "space-around", fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>{"\u{1F305}"}</div>
          <div style={{ fontWeight: 600 }}>{sunriseTime}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Sunrise</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>{"\u{1F307}"}</div>
          <div style={{ fontWeight: 600 }}>{sunsetTime}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Sunset</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 20, marginBottom: 4 }}>{"\u{1F319}"}</div>
          <div style={{ fontWeight: 600 }}>{nightHours}h {nightMins}m</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Night</div>
        </div>
      </div>
    </div>
  );
}
