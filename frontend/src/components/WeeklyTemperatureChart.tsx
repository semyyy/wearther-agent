import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  BarElement,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import type { DailyAggregate } from "../lib/aggregateByDay";
import styles from "../styles/weather-card.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
  BarElement
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
        type: "line" as const,
        label: "High (°C)",
        data: dailyAggregates.map((d) => d.temperature_max),
        borderColor: "#EF5350",
        backgroundColor: "rgba(239, 83, 80, 0.1)",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#EF5350",
        yAxisID: "y",
      },
      {
        type: "line" as const,
        label: "Avg (°C)",
        data: dailyAggregates.map((d) => d.temperature_celsius),
        borderColor: "#FFD93D",
        backgroundColor: "rgba(255, 217, 61, 0.1)",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#FFD93D",
        yAxisID: "y",
      },
      {
        type: "line" as const,
        label: "Low (°C)",
        data: dailyAggregates.map((d) => d.temperature_min),
        borderColor: "#64B5F6",
        backgroundColor: "rgba(100, 181, 246, 0.1)",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#64B5F6",
        yAxisID: "y",
      },
      {
        type: "bar" as const,
        label: "Pluie (mm)",
        data: dailyAggregates.map((d) => d.precipitation_sum_mm),
        backgroundColor: "rgba(33, 150, 243, 0.4)",
        borderColor: "rgba(33, 150, 243, 0.8)",
        borderWidth: 1,
        yAxisID: "y1",
        borderRadius: 2,
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
            const unit = ctx.dataset.yAxisID === "y1" ? "mm" : "°C";
            return `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(1)}${unit}`;
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
        type: "linear" as const,
        position: "left" as const,
        ticks: {
          color: "rgba(255,255,255,0.6)",
          font: { size: 10 },
          callback: (v: string | number) => `${v}°`,
        },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y1: {
        type: "linear" as const,
        position: "right" as const,
        beginAtZero: true,
        display: true,
        grid: { drawOnChartArea: false },
        ticks: {
          color: "#4FC3F7",
          font: { size: 10 },
          callback: (v: string | number) => `${v}mm`,
        },
        title: {
          display: true,
          text: "mm",
          color: "#4FC3F7",
          font: { size: 10 },
        },
      },
    },
  };

  return (
    <div className={styles.chartSection}>
      <div className={styles.chartTitle}>7-Day Temperature & Rain</div>
      <Chart type="bar" data={data} options={options as any} />
    </div>
  );
}
