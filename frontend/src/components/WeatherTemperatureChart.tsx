import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import type { HourlyEntry } from "../api/types";
import type { DailyAggregate } from "../lib/aggregateByDay";
import styles from "../styles/weather-card.module.css";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip
);

interface Props {
    entries: (HourlyEntry | DailyAggregate)[];
    mode: "hourly" | "daily";
}

export default function WeatherTemperatureChart({ entries, mode }: Props) {
    const labels = entries.map((e) => {
        const d = new Date(e.time);
        if (mode === "hourly") {
            return `${d.getHours().toString().padStart(2, "0")}:00`;
        }
        return d.toLocaleDateString(undefined, { weekday: "short" });
    });

    const temperatureData = entries.map((e) => {
        if (mode === "daily" && "temperature_max" in e) {
            return (e as DailyAggregate).temperature_max;
        }
        return (e as any).temperature_celsius;
    });

    const data = {
        labels,
        datasets: [
            {
                label: mode === "daily" ? "Max Temperature (°C)" : "Temperature (°C)",
                data: temperatureData,
                borderColor: "#FFD93D",
                backgroundColor: "rgba(255, 217, 61, 0.2)",
                yAxisID: "y",
                tension: 0.4,
                pointRadius: 2,
                fill: true,
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
            legend: { display: false },
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
        },
    };

    return (
        <div className={styles.chartSection}>
            <div className={styles.chartTitle} style={{ color: "#FFD93D" }}>Temperature Trend (°C)</div>
            <Line data={data} options={options} />
        </div>
    );
}
