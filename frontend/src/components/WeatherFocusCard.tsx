import type { DailyWeatherData } from "../api/types";
import { kmhToKnots } from "../lib/windColors";
import WeatherTemperatureChart from "./WeatherTemperatureChart";
import WeatherHumidityChart from "./WeatherHumidityChart";
import WeatherPressureChart from "./WeatherPressureChart";
import WindChart from "./WindChart";
import styles from "../styles/weather-card.module.css";

interface Props {
    data: DailyWeatherData;
}

export default function WeatherFocusCard({ data }: Props) {
    const entries = data.data;
    if (!entries.length || !data.focus || data.focus === "all") return null;

    // Use the midday entry (or first available) as the "hero" value
    const hero =
        entries.find((e) => new Date(e.time).getHours() === 12) ?? entries[0];

    const focus = data.focus;

    let title = "";
    let value = "";
    let ChartComponent = null;

    switch (focus) {
        case "temperature":
            title = "Temperature";
            value = `${Math.round(hero.temperature_celsius)}°C`;
            ChartComponent = <WeatherTemperatureChart entries={entries} />;
            break;
        case "wind":
            title = "Wind";
            value = `${kmhToKnots(hero.wind_speed_kmh)} kt`;
            ChartComponent = <WindChart entries={entries} mode="hourly" />;
            break;
        case "humidity":
            title = "Humidity";
            value = `${hero.relative_humidity_percent}%`;
            ChartComponent = <WeatherHumidityChart entries={entries} />;
            break;
        case "pressure":
            title = "Surface Pressure";
            value = `${Math.round(hero.surface_pressure_hpa)} hPa`;
            ChartComponent = <WeatherPressureChart entries={entries} />;
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
