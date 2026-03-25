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

function visibilityColor(km: number): string {
  if (km < 1) return "rgba(244, 67, 54, 0.9)";
  if (km < 5) return "rgba(255, 152, 0, 0.9)";
  return "rgba(76, 175, 80, 0.9)";
}

export default function VisibilityChart({ entries }: Props) {
  const hasData = entries.some((e) => e.visibility_km != null);
  if (!hasData) return null;

  const labels = entries.map((e) => {
    const d = new Date(e.time);
    return `${d.getHours().toString().padStart(2, "0")}:00`;
  });

  const values = entries.map((e) => e.visibility_km ?? 0);
  const minVis = Math.min(...values);

  const data = {
    labels,
    datasets: [
      {
        label: "Visibility (km)",
        data: values,
        borderColor: "rgba(129, 199, 132, 0.9)",
        backgroundColor: "rgba(129, 199, 132, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 2,
        pointBackgroundColor: values.map(visibilityColor),
        segment: {
          borderColor: (ctx: any) => {
            const val = ctx.p1.parsed.y;
            return visibilityColor(val);
          },
        },
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
          label: (ctx: any) => {
            const km = ctx.parsed.y;
            let level = "Good";
            if (km < 1) level = "Fog / Very Poor";
            else if (km < 5) level = "Poor";
            return `${km.toFixed(1)} km (${level})`;
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
        ticks: {
          color: "rgba(255,255,255,0.6)",
          font: { size: 10 },
          callback: (v: string | number) => `${v} km`,
        },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
  };

  return (
    <div className={styles.chartSection}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div className={styles.chartTitle} style={{ margin: 0 }}>Visibility</div>
        <div style={{ fontSize: 13, color: visibilityColor(minVis), fontWeight: 500 }}>
          Min: {minVis.toFixed(1)} km
        </div>
      </div>
      <Line data={data} options={options} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, fontSize: 10, opacity: 0.8 }}>
        {[
          { label: "Fog (<1 km)", color: "rgba(244, 67, 54, 0.8)" },
          { label: "Poor (1-5 km)", color: "rgba(255, 152, 0, 0.8)" },
          { label: "Good (>5 km)", color: "rgba(76, 175, 80, 0.8)" },
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
