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
import { windSpeedColor, getWindBands, degreesToCardinal } from "../lib/windColors";
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
      const y = bar.y - 14; // bar.y is the top of the floating bar (max)
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

/** Custom plugin: draws min/max labels on/above bars */
const windDataLabelsPlugin: Plugin<"bar"> = {
  id: "windDataLabels",
  afterDatasetsDraw(chart) {
    const meta = chart.getDatasetMeta(0);
    if (!meta?.data?.length) return;

    const ctx = chart.ctx;
    const sustains: number[] = (chart.options as any)._sustains ?? [];
    const gusts: number[] = (chart.options as any)._gusts ?? [];

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.font = "bold 9px sans-serif";

    meta.data.forEach((bar, i) => {
      const gust = gusts[i];
      const sustain = sustains[i];
      if (gust == null || sustain == null) return;

      const x = bar.x;
      const yTop = bar.y; // Max (Gust)
      const yBottom = (bar as any).base; // Min (Sustain)

      // Draw Gust (Max) value on top
      ctx.fillStyle = "#fff";
      ctx.fillText(`${gust}`, x, yTop - 18); // above the arrow

      // Draw Sustain (Min/Avg) value at the base of the bar
      if (gust !== sustain) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
        ctx.font = "9px sans-serif";
        // If the bar is tall enough, draw inside at the bottom, otherwise below
        const height = yBottom - yTop;
        const labelY = height > 15 ? yBottom - 4 : yBottom + 12;
        ctx.fillText(`${sustain}`, x, labelY);
      }
    });
    ctx.restore();
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

  const minSpeedKnots = entries.map((e) => {
    return mode === "daily" && "wind_speed_min" in e
      ? (e as DailyAggregate).wind_speed_min
      : (e as any).wind_speed_knots;
  });

  const maxGustsKnots = entries.map((e) => {
    return mode === "daily" && "wind_gusts_max" in e
      ? (e as DailyAggregate).wind_gusts_max
      : ("wind_gusts_knots" in e ? (e as any).wind_gusts_knots : (e as any).wind_speed_knots);
  });

  const directions = entries.map((e) => e.wind_direction_degrees);
  const barColors = maxGustsKnots.map((g) => windSpeedColor(g));

  const data: ChartData<"bar"> = {
    labels,
    datasets: [
      {
        label: "Wind Range (kt)",
        // Floating bars: [min, max]
        data: entries.map((_, i) => [minSpeedKnots[i], maxGustsKnots[i]] as any),
        backgroundColor: barColors,
        borderRadius: 3,
        borderSkipped: false, // Ensure both ends are rounded if desired (or at least drawn)
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
            const min = minSpeedKnots[i];
            const max = maxGustsKnots[i];
            const dir = directions[i];
            const cardinal = degreesToCardinal(dir);
            return `${min}-${max} kt ${cardinal} (${dir}°)`;
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
    // Stash data for plugins
    _windDirections: directions,
    _sustains: minSpeedKnots,
    _gusts: maxGustsKnots,
  } as any;

  const bands = getWindBands();

  const minSpeed = minSpeedKnots.length > 0 ? Math.min(...minSpeedKnots) : 0;
  const maxSpeed = maxGustsKnots.length > 0 ? Math.max(...maxGustsKnots) : 0;

  return (
    <div className={styles.chartSection}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div className={styles.chartTitle} style={{ margin: 0 }}>
          {mode === "hourly" ? "Hourly Wind (kt)" : "Daily Wind (kt)"}
        </div>
        <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.9)", fontWeight: 500, paddingBottom: 2 }}>
          Min: <span style={{ color: "#64B5F6" }}>{minSpeed}</span> | Max: <span style={{ color: "#EF5350" }}>{maxSpeed}</span>
        </div>
      </div>
      <Bar data={data} options={options} plugins={[windArrowPlugin, windDataLabelsPlugin]} />
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
