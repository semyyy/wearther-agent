import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type Plugin,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { HourlyEntry } from "../api/types";
import type { DailyAggregate } from "../lib/aggregateByDay";
import { windSpeedColor, getWindBands, degreesToCardinal, kmhToKnots } from "../lib/windColors";
import styles from "../styles/weather-card.module.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface Props {
  entries: (HourlyEntry | DailyAggregate)[];
  mode: "hourly" | "daily";
}

/** Custom plugin: draws rotated arrow triangles above each bar */
const windArrowPlugin: Plugin<"bar"> = {
  id: "windArrows",
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const ctx = chart.ctx;
    const directions: number[] = (chart.options as any)._windDirections ?? [];

    meta.data.forEach((bar, i) => {
      const dir = directions[i];
      if (dir == null) return;

      const x = bar.x;
      const y = bar.y - 14; // above the bar
      // Arrow points where wind blows TO (meteorological direction + 180)
      const angle = ((dir + 180) * Math.PI) / 180;
      const size = 6;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, -size);
      ctx.lineTo(-size * 0.5, size * 0.5);
      ctx.lineTo(size * 0.5, size * 0.5);
      ctx.closePath();
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.fill();
      ctx.restore();
    });
  },
};

export default function WindChart({ entries, mode }: Props) {
  const labels = entries.map((e) => {
    if (mode === "hourly") {
      const d = new Date(e.time);
      return `${d.getHours().toString().padStart(2, "0")}:00`;
    }
    const d = new Date(e.time);
    return d.toLocaleDateString(undefined, { weekday: "short" });
  });

  const speedsKnots = entries.map((e) => {
    const kmh =
      mode === "daily" && "wind_speed_max" in e
        ? (e as DailyAggregate).wind_speed_max
        : e.wind_speed_kmh;
    return kmhToKnots(kmh);
  });
  const directions = entries.map((e) => e.wind_direction_degrees);
  const barColors = speedsKnots.map((s) => windSpeedColor(s));

  const data: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: mode === "daily" ? "Max Wind (kt)" : "Wind Speed (kt)",
        data: speedsKnots,
        backgroundColor: barColors,
        borderRadius: 3,
      },
    ],
  };

  const options: ChartOptions<"bar"> = {
    responsive: true,
    layout: { padding: { top: 20 } },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label(ctx: any) {
            const i = ctx.dataIndex;
            const speed = speedsKnots[i];
            const dir = directions[i];
            const cardinal = degreesToCardinal(dir);
            return `${speed} kt ${cardinal} (${dir}°)`;
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
          callback: (v: string | number) => `${v}`,
        },
        grid: { color: "rgba(255,255,255,0.1)" },
        title: {
          display: true,
          text: "kt",
          color: "rgba(255,255,255,0.6)",
          font: { size: 10 },
        },
      },
    },
    // Stash directions so the plugin can read them
    _windDirections: directions,
  } as any;

  const bands = getWindBands();

  const minSpeed = speedsKnots.length > 0 ? Math.min(...speedsKnots) : 0;
  const maxSpeed = speedsKnots.length > 0 ? Math.max(...speedsKnots) : 0;

  return (
    <div className={styles.chartSection}>
      <div className={styles.chartTitle} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{mode === "hourly" ? "Hourly Wind" : "Daily Wind"}</span>
        <span style={{ fontSize: "0.85em", opacity: 0.8, fontWeight: "normal" }}>
          Min: {minSpeed} kt | Max: {maxSpeed} kt
        </span>
      </div>
      <Bar data={data} options={options} plugins={[windArrowPlugin]} />
      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          marginTop: 8,
          fontSize: 10,
          opacity: 0.8,
        }}
      >
        {bands.map((b) => (
          <span key={b.label} style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: b.color,
                display: "inline-block",
              }}
            />
            {b.label} ({b.max} kt)
          </span>
        ))}
      </div>
    </div>
  );
}
