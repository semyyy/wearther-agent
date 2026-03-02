import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import type { HourlyEntry } from "../api/types";
import type { DailyAggregate } from "../lib/aggregateByDay";
import styles from "../styles/weather-card.module.css";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Tooltip,
    Legend
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

    const precipData = entries.map((e) => {
        if (mode === "daily" && "precipitation_sum_mm" in e) {
            return (e as DailyAggregate).precipitation_sum_mm;
        }
        return (e as any).precipitation_mm;
    });

    const data = {
        labels,
        datasets: [
            {
                type: "line" as const,
                label: "Humidity (%)",
                data: entries.map((e) => e.relative_humidity_percent),
                borderColor: "#64B5F6",
                backgroundColor: "rgba(100, 181, 246, 0.2)",
                yAxisID: "y",
                tension: 0.4,
                pointRadius: 2,
                fill: true,
            },
            {
                type: "bar" as const,
                label: "Pluie (mm)",
                data: precipData,
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
            <div className={styles.chartTitle} style={{ color: "#64B5F6" }}>
                {mode === "daily" ? "Daily Humidity & Rain" : "Hourly Humidity & Rain"}
            </div>
            <Chart type="bar" data={data} options={options as any} />
        </div>
    );
}
