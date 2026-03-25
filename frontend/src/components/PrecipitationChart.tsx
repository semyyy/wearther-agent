import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  LineController,
  BarController,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import type { HourlyEntry } from "../api/types";
import styles from "../styles/weather-card.module.css";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement,
  LineElement, Tooltip, Legend, LineController, BarController
);

interface Props {
  entries: HourlyEntry[];
}

function precipColor(mm: number): string {
  if (mm <= 0) return "rgba(100, 181, 246, 0.3)";
  if (mm < 1) return "rgba(100, 181, 246, 0.6)";
  if (mm < 5) return "rgba(66, 165, 245, 0.8)";
  return "rgba(30, 136, 229, 0.9)";
}

export default function PrecipitationChart({ entries }: Props) {
  const labels = entries.map((e) => {
    const d = new Date(e.time);
    return `${d.getHours().toString().padStart(2, "0")}:00`;
  });

  const precipValues = entries.map((e) => e.precipitation_mm);
  const probValues = entries.map((e) => e.precipitation_probability);
  const totalPrecip = Math.round(precipValues.reduce((a, b) => a + b, 0) * 10) / 10;
  const maxProb = Math.max(...probValues);

  const data = {
    labels,
    datasets: [
      {
        type: "bar" as const,
        label: "Precipitation (mm)",
        data: precipValues,
        backgroundColor: precipValues.map(precipColor),
        borderRadius: 3,
        yAxisID: "y",
        order: 2,
      },
      {
        type: "line" as const,
        label: "Probability (%)",
        data: probValues,
        borderColor: "rgba(255, 183, 77, 0.9)",
        backgroundColor: "rgba(255, 183, 77, 0.1)",
        tension: 0.3,
        pointRadius: 1,
        borderWidth: 2,
        yAxisID: "y1",
        order: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: { mode: "index" as const, intersect: false },
    plugins: {
      legend: { labels: { color: "rgba(255,255,255,0.8)", font: { size: 11 } } },
    },
    scales: {
      x: {
        ticks: { color: "rgba(255,255,255,0.6)", font: { size: 10 } },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        type: "linear" as const,
        position: "left" as const,
        min: 0,
        ticks: {
          color: "#64B5F6",
          font: { size: 10 },
          callback: (v: string | number) => `${v} mm`,
        },
        grid: { color: "rgba(255,255,255,0.1)" },
        title: { display: true, text: "mm/h", color: "rgba(255,255,255,0.5)", font: { size: 10 } },
      },
      y1: {
        type: "linear" as const,
        position: "right" as const,
        min: 0,
        max: 100,
        ticks: {
          color: "#FFB74D",
          font: { size: 10 },
          callback: (v: string | number) => `${v}%`,
        },
        grid: { drawOnChartArea: false },
        title: { display: true, text: "Prob.", color: "rgba(255,255,255,0.5)", font: { size: 10 } },
      },
    },
  };

  return (
    <div className={styles.chartSection}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div className={styles.chartTitle} style={{ margin: 0 }}>Precipitation</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>
          Total: <span style={{ color: "#64B5F6" }}>{totalPrecip} mm</span> |
          Max prob: <span style={{ color: "#FFB74D" }}>{maxProb}%</span>
        </div>
      </div>
      <Chart type="bar" data={data} options={options} />
    </div>
  );
}
