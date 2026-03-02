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

export default function WeatherHumidityChart({ entries, mode }: Props) {
    const labels = entries.map((e) => {
        const d = new Date(e.time);
        if (mode === "hourly") {
            return `${d.getHours().toString().padStart(2, "0")}:00`;
        }
        return d.toLocaleDateString(undefined, { weekday: "short" });
    });

    const data = {
        labels,
        datasets: [
            {
                label: "Humidity (%)",
                data: entries.map((e) => e.relative_humidity_percent),
                borderColor: "#64B5F6",
                backgroundColor: "rgba(100, 181, 246, 0.2)",
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
                    color: "#64B5F6",
                    font: { size: 10 },
                    callback: (v: string | number) => `${v}%`,
                },
                grid: { color: "rgba(255,255,255,0.1)" },
            },
        },
    };

    return (
        <div className={styles.chartSection}>
            <div className={styles.chartTitle} style={{ color: "#64B5F6" }}>Humidity Trend (%)</div>
            <Line data={data} options={options} />
        </div>
    );
}
