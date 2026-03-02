import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { MonthlyStatsData } from "../api/types";
import styles from "../styles/monthly-stats.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  data: MonthlyStatsData;
}

const MONTH_NAMES = [
  "",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function MonthlyStatsCard({ data }: Props) {
  const periodLabel = data.period.month
    ? `${MONTH_NAMES[data.period.month]} ${data.period.year}`
    : `${data.period.year}`;

  const chartData = {
    labels: ["Avg Low", "Avg Temp", "Avg High"],
    datasets: [
      {
        label: "Temperature (°C)",
        data: [
          data.avg_low_celsius,
          data.avg_temperature_celsius,
          data.avg_high_celsius,
        ],
        backgroundColor: ["#64B5F6", "#FFD93D", "#EF5350"],
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y" as const,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<"bar">) =>
            `${(ctx.parsed.x ?? 0).toFixed(1)}°C`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (v: string | number) => `${v}°C`,
          font: { size: 11 },
        },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      y: {
        ticks: { font: { size: 11 } },
        grid: { display: false },
      },
    },
  };

  return (
    <div className={styles.card}>
      <div className={styles.title}>Climate Statistics</div>
      <div className={styles.subtitle}>
        {periodLabel} &middot; {data.days_in_period} days
      </div>

      <div className={styles.grid}>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {data.avg_temperature_celsius.toFixed(1)}°C
          </div>
          <div className={styles.statLabel}>Avg Temperature</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>
            {data.total_precipitation_mm.toFixed(1)} mm
          </div>
          <div className={styles.statLabel}>Total Rainfall</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{data.rainy_days}</div>
          <div className={styles.statLabel}>Rainy Days</div>
        </div>
        <div className={styles.stat}>
          <div className={styles.statValue}>{data.days_in_period}</div>
          <div className={styles.statLabel}>Days in Period</div>
        </div>
      </div>

      <div className={styles.chartSection}>
        <div className={styles.chartTitle}>Temperature Range</div>
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
