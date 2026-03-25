import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { HourlyEntry } from "../api/types";
import styles from "../styles/weather-card.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

interface Props {
  entries: HourlyEntry[];
}

export default function WeatherHourlyChart({ entries }: Props) {
  const labels = entries.map((e) => {
    const d = new Date(e.time);
    return `${d.getHours().toString().padStart(2, "0")}:00`;
  });

  const data = {
    labels,
    datasets: [
      {
        label: "Temperature (°C)",
        data: entries.map((e) => e.temperature_celsius),
        borderColor: "#FFD93D",
        backgroundColor: "rgba(255, 217, 61, 0.2)",
        yAxisID: "y",
        tension: 0.3,
        pointRadius: 2,
      },
      {
        label: "Feels Like (°C)",
        data: entries.map((e) => e.feels_like_celsius ?? e.temperature_celsius),
        borderColor: "#FF8A65",
        backgroundColor: "rgba(255, 138, 101, 0.1)",
        borderDash: [5, 3],
        yAxisID: "y",
        tension: 0.3,
        pointRadius: 1,
      },
      {
        label: "Humidity (%)",
        data: entries.map((e) => e.relative_humidity_percent),
        borderColor: "#64B5F6",
        backgroundColor: "rgba(100, 181, 246, 0.2)",
        yAxisID: "y1",
        tension: 0.3,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        labels: { color: "rgba(255,255,255,0.8)", font: { size: 11 } },
      },
    },
    scales: {
      x: {
        ticks: { color: "rgba(255,255,255,0.6)", font: { size: 10 } },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        type: "linear" as const,
        position: "left" as const,
        ticks: {
          color: "#FFD93D",
          font: { size: 10 },
          callback: (v: string | number) => `${v}°`,
        },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y1: {
        type: "linear" as const,
        position: "right" as const,
        ticks: {
          color: "#64B5F6",
          font: { size: 10 },
          callback: (v: string | number) => `${v}%`,
        },
        grid: { drawOnChartArea: false },
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <div className={styles.chartSection}>
      <div className={styles.chartTitle}>Hourly Breakdown</div>
      <Line data={data} options={options} />
    </div>
  );
}
