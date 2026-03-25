import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { HourlyEntry } from "../api/types";
import styles from "../styles/weather-card.module.css";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface Props {
  entries: HourlyEntry[];
}

export default function DewPointChart({ entries }: Props) {
  const hasData = entries.some((e) => e.dew_point_celsius != null);
  if (!hasData) return null;

  const labels = entries.map((e) => {
    const d = new Date(e.time);
    return `${d.getHours().toString().padStart(2, "0")}:00`;
  });

  const temps = entries.map((e) => e.temperature_celsius);
  const dewPoints = entries.map((e) => e.dew_point_celsius ?? 0);
  const fogRiskZones = entries.map((e) => {
    if (e.dew_point_celsius == null) return false;
    return Math.abs(e.temperature_celsius - e.dew_point_celsius) <= 2;
  });

  // Count fog risk hours
  const fogRiskCount = fogRiskZones.filter(Boolean).length;

  const data = {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: temps,
        borderColor: "#FFD93D",
        backgroundColor: "rgba(255, 217, 61, 0.1)",
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: "Dew Point (°C)",
        data: dewPoints,
        borderColor: "#64B5F6",
        borderDash: [5, 3],
        backgroundColor: "rgba(100, 181, 246, 0.1)",
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { labels: { color: "rgba(255,255,255,0.8)", font: { size: 11 } } },
      tooltip: {
        callbacks: {
          afterBody: (items: any[]) => {
            if (!items.length) return "";
            const i = items[0].dataIndex;
            const diff = temps[i] - dewPoints[i];
            const risk = fogRiskZones[i] ? " - FOG RISK" : "";
            return `Spread: ${diff.toFixed(1)}°C${risk}`;
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
        ticks: {
          color: "rgba(255,255,255,0.6)",
          font: { size: 10 },
          callback: (v: string | number) => `${v}°`,
        },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
  };

  return (
    <div className={styles.chartSection}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div className={styles.chartTitle} style={{ margin: 0 }}>Dew Point / Fog Risk</div>
        {fogRiskCount > 0 && (
          <div style={{ fontSize: 12, color: "#EF5350", fontWeight: 600 }}>
            {fogRiskCount}h fog risk
          </div>
        )}
      </div>
      <Line data={data} options={options} />
      <div style={{ marginTop: 8, fontSize: 10, opacity: 0.8, color: "rgba(255,255,255,0.7)" }}>
        Fog risk when temp - dew point spread ≤ 2°C
      </div>
    </div>
  );
}
