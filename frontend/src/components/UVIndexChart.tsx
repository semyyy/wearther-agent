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

function uvColor(uv: number): string {
  if (uv <= 2) return "rgba(76, 175, 80, 0.6)";
  if (uv <= 5) return "rgba(255, 235, 59, 0.6)";
  if (uv <= 7) return "rgba(255, 152, 0, 0.6)";
  if (uv <= 10) return "rgba(244, 67, 54, 0.6)";
  return "rgba(156, 39, 176, 0.6)";
}

export default function UVIndexChart({ entries }: Props) {
  // Filter to daytime hours only
  const dayEntries = entries.filter((e) => e.is_day);
  if (!dayEntries.length) return null;

  const labels = dayEntries.map((e) => {
    const d = new Date(e.time);
    return `${d.getHours().toString().padStart(2, "0")}:00`;
  });

  const uvValues = dayEntries.map((e) => e.uv_index);
  const maxUV = Math.max(...uvValues);

  const data = {
    labels,
    datasets: [
      {
        label: "UV Index",
        data: uvValues,
        borderColor: "#FF9800",
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return "rgba(255, 152, 0, 0.2)";
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, "rgba(76, 175, 80, 0.3)");
          gradient.addColorStop(0.4, "rgba(255, 235, 59, 0.3)");
          gradient.addColorStop(0.6, "rgba(255, 152, 0, 0.3)");
          gradient.addColorStop(0.8, "rgba(244, 67, 54, 0.3)");
          gradient.addColorStop(1, "rgba(156, 39, 176, 0.3)");
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: uvValues.map(uvColor),
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
            const uv = ctx.parsed.y;
            let level = "Low";
            if (uv > 10) level = "Extreme";
            else if (uv > 7) level = "Very High";
            else if (uv > 5) level = "High";
            else if (uv > 2) level = "Moderate";
            return `UV ${uv} (${level})`;
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
        max: Math.max(11, maxUV + 1),
        ticks: { color: "rgba(255,255,255,0.6)", font: { size: 10 }, stepSize: 1 },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
  };

  return (
    <div className={styles.chartSection}>
      <div className={styles.chartTitle}>UV Index</div>
      <Line data={data} options={options} />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, fontSize: 10, opacity: 0.8 }}>
        {[
          { label: "Low (0-2)", color: "rgba(76, 175, 80, 0.8)" },
          { label: "Moderate (3-5)", color: "rgba(255, 235, 59, 0.8)" },
          { label: "High (6-7)", color: "rgba(255, 152, 0, 0.8)" },
          { label: "Very High (8-10)", color: "rgba(244, 67, 54, 0.8)" },
          { label: "Extreme (11+)", color: "rgba(156, 39, 176, 0.8)" },
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
