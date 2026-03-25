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

export default function CloudCoverChart({ entries }: Props) {
  const hasData = entries.some((e) => e.cloud_cover_percent != null);
  if (!hasData) return null;

  const labels = entries.map((e) => {
    const d = new Date(e.time);
    return `${d.getHours().toString().padStart(2, "0")}:00`;
  });

  const values = entries.map((e) => e.cloud_cover_percent ?? 0);
  const avgCloud = Math.round(values.reduce((a, b) => a + b, 0) / values.length);

  const data = {
    labels,
    datasets: [
      {
        label: "Cloud Cover (%)",
        data: values,
        borderColor: "rgba(176, 190, 197, 0.9)",
        backgroundColor: (ctx: any) => {
          const chart = ctx.chart;
          const { ctx: canvasCtx, chartArea } = chart;
          if (!chartArea) return "rgba(176, 190, 197, 0.2)";
          const gradient = canvasCtx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
          gradient.addColorStop(0, "rgba(176, 190, 197, 0.05)");
          gradient.addColorStop(1, "rgba(176, 190, 197, 0.4)");
          return gradient;
        },
        fill: true,
        tension: 0.4,
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
          label: (ctx: any) => {
            const pct = ctx.parsed.y;
            let sky = "Clear";
            if (pct > 70) sky = "Overcast";
            else if (pct > 20) sky = "Partly Cloudy";
            return `${pct}% (${sky})`;
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
        max: 100,
        ticks: {
          color: "rgba(255,255,255,0.6)",
          font: { size: 10 },
          callback: (v: string | number) => `${v}%`,
        },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
  };

  let skyIcon = "\u2600\uFE0F"; // sun
  if (avgCloud > 70) skyIcon = "\u2601\uFE0F"; // cloud
  else if (avgCloud > 20) skyIcon = "\u26C5"; // sun behind cloud

  return (
    <div className={styles.chartSection}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div className={styles.chartTitle} style={{ margin: 0 }}>Cloud Cover</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
          {skyIcon} Avg: {avgCloud}%
        </div>
      </div>
      <Line data={data} options={options} />
      <div style={{ display: "flex", gap: 12, marginTop: 8, fontSize: 10, opacity: 0.8 }}>
        <span>0-20%: Clear</span>
        <span>21-70%: Partly Cloudy</span>
        <span>71-100%: Overcast</span>
      </div>
    </div>
  );
}
