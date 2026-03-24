import { useMemo } from "react";
import type { DailyWeatherData } from "../api/types";
import { aggregateByDay } from "../lib/aggregateByDay";
import WindChart from "./WindChart";
import styles from "../styles/weather-card.module.css";

interface Props {
    data: DailyWeatherData;
}

export default function WeatherFocusCard({ data }: Props) {
    const entries = data.data;
    const focus = data.focus;

    const uniqueDates = useMemo(() => {
        const dates = new Set(entries.map((e) => e.time.slice(0, 10)));
        return dates.size;
    }, [entries]);

    const isDaily = uniqueDates > 3;
    const chartEntries = useMemo(() => isDaily ? aggregateByDay(entries) : entries, [entries, isDaily]);
    const mode = isDaily ? "daily" : "hourly";

    if (!entries.length || !focus || focus === "all") return null;

    const hero =
        entries.find((e) => new Date(e.time).getHours() === 12) ?? entries[0];

    let title = "";
    let value = "";
    let ChartComponent = null;

    switch (focus) {
        case "temperature":
            title = "Temperature";
            value = `${Math.round(hero.temperature_celsius)}°C`;
            break;
        case "wind":
            title = "Wind Speed";
            value = `${hero.wind_speed_knots} kt`;
            ChartComponent = <WindChart entries={chartEntries} mode={mode} />;
            break;
        case "humidity":
            title = "Humidity";
            value = `${hero.relative_humidity_percent}%`;
            break;
        case "pressure":
            title = "Surface Pressure";
            value = `${Math.round(hero.surface_pressure_hpa)} hPa`;
            break;
    }

    return (
        <div className={styles.card}>
            <div className={styles.hero} style={{ marginBottom: "16px" }}>
                <div className={styles.heroInfo}>
                    <div className={styles.conditions} style={{ marginTop: 0, marginBottom: "4px", color: "var(--color-text-muted)" }}>
                        {title} Focus
                    </div>
                    <div className={styles.temperature}>
                        {value}
                    </div>
                </div>
            </div>

            <div className={styles.details} style={{ padding: "12px 16px" }}>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Time</span>
                    <span>
                        {new Date(hero.time).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </span>
                </div>
                <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Conditions</span>
                    <span>{hero.conditions}</span>
                </div>
            </div>

            {entries.length > 1 && ChartComponent}
        </div>
    );
}
