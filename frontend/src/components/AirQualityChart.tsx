import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { HourlyEntry } from "../api/types";
import styles from "../styles/weather-card.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  entries: HourlyEntry[];
}

function aqiColor(aqi: number): string {
  if (aqi <= 50) return "rgba(76, 175, 80, 0.8)";
  if (aqi <= 100) return "rgba(255, 235, 59, 0.8)";
  if (aqi <= 150) return "rgba(255, 152, 0, 0.8)";
  if (aqi <= 200) return "rgba(244, 67, 54, 0.8)";
  if (aqi <= 300) return "rgba(156, 39, 176, 0.8)";
  return "rgba(121, 85, 72, 0.8)";
}

function aqiLabel(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy (Sensitive)";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

export default function AirQualityChart({ entries }: Props) {
  const hasAQ = entries.some((e) => e.air_quality && e.air_quality.aqi > 0);
  if (!hasAQ) return null;

  // Current/latest AQI for gauge display
  const hero = entries.find((e) => new Date(e.time).getHours() === 12) ?? entries[0];
  const currentAQI = hero.air_quality?.aqi ?? 0;

  const labels = entries.map((e) => {
    const d = new Date(e.time);
    return `${d.getHours().toString().padStart(2, "0")}:00`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: "AQI",
        data: entries.map((e) => e.air_quality?.aqi ?? 0),
        backgroundColor: entries.map((e) => aqiColor(e.air_quality?.aqi ?? 0)),
        borderRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const aqi = ctx.parsed.y;
            return `AQI: ${aqi} (${aqiLabel(aqi)})`;
          },
          afterLabel: (ctx: any) => {
            const e = entries[ctx.dataIndex];
            if (!e.air_quality) return "";
            return [
              `PM2.5: ${e.air_quality.pm2_5} ug/m3`,
              `PM10: ${e.air_quality.pm10} ug/m3`,
              `NO2: ${e.air_quality.no2} ug/m3`,
              `O3: ${e.air_quality.ozone} ug/m3`,
            ].join("\n");
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "rgba(255,255,255,0.6)", font: { size: 10 } },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        min: 0,
        ticks: { color: "rgba(255,255,255,0.6)", font: { size: 10 } },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
  };

  // Pollutant detail bars
  const pollutants = [
    { label: "PM2.5", value: hero.air_quality?.pm2_5 ?? 0, max: 75, unit: "ug/m3", color: "#EF5350" },
    { label: "PM10", value: hero.air_quality?.pm10 ?? 0, max: 150, unit: "ug/m3", color: "#FF7043" },
    { label: "NO2", value: hero.air_quality?.no2 ?? 0, max: 200, unit: "ug/m3", color: "#AB47BC" },
    { label: "O3", value: hero.air_quality?.ozone ?? 0, max: 240, unit: "ug/m3", color: "#42A5F5" },
  ];

  return (
    <div className={styles.chartSection}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div className={styles.chartTitle} style={{ margin: 0 }}>Air Quality (AQI)</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: aqiColor(currentAQI) }}>
          {currentAQI} - {aqiLabel(currentAQI)}
        </div>
      </div>

      {/* Pollutant detail bars */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
        {pollutants.map((p) => (
          <div key={p.label} style={{ background: "rgba(0,0,0,0.2)", borderRadius: 6, padding: "8px 10px" }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>
              {p.label}: {p.value} {p.unit}
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: 3, height: 6, overflow: "hidden" }}>
              <div style={{
                width: `${Math.min(100, (p.value / p.max) * 100)}%`,
                height: "100%",
                background: p.color,
                borderRadius: 3,
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        ))}
      </div>

      <Bar data={data} options={options} />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, fontSize: 10, opacity: 0.8 }}>
        {[
          { label: "Good (0-50)", color: "rgba(76, 175, 80, 0.8)" },
          { label: "Moderate (51-100)", color: "rgba(255, 235, 59, 0.8)" },
          { label: "Unhealthy* (101-150)", color: "rgba(255, 152, 0, 0.8)" },
          { label: "Unhealthy (151-200)", color: "rgba(244, 67, 54, 0.8)" },
          { label: "Very Unhealthy (201+)", color: "rgba(156, 39, 176, 0.8)" },
        ].map((b) => (
          <span key={b.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: b.color, display: "inline-block" }} />
            {b.label}
          </span>
        ))}
      </div>
    </div>
  );
}
