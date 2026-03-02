import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { DailyAggregate } from "../lib/aggregateByDay";
import styles from "../styles/weather-card.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  dailyAggregates: DailyAggregate[];
}

export default function WeeklyTemperatureChart({ dailyAggregates }: Props) {
  const labels = dailyAggregates.map((d) => {
    const date = new Date(d.date);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  });

  const data = {
    labels,
    datasets: [
      {
        label: "High (°C)",
        data: dailyAggregates.map((d) => d.temperature_max),
        borderColor: "#EF5350",
        backgroundColor: "rgba(239, 83, 80, 0.1)",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#EF5350",
      },
      {
        label: "Avg (°C)",
        data: dailyAggregates.map((d) => d.temperature_celsius),
        borderColor: "#FFD93D",
        backgroundColor: "rgba(255, 217, 61, 0.1)",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#FFD93D",
      },
      {
        label: "Low (°C)",
        data: dailyAggregates.map((d) => d.temperature_min),
        borderColor: "#64B5F6",
        backgroundColor: "rgba(100, 181, 246, 0.1)",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#64B5F6",
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
      tooltip: {
        callbacks: {
          label(ctx: any) {
            return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}°C`;
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
      <div className={styles.chartTitle}>7-Day Temperature</div>
      <Line data={data} options={options} />
    </div>
  );
}
