import { useMemo } from "react";
import type { DailyWeatherData } from "../api/types";
import { getIconGroup, describeWeatherCode } from "../lib/weatherCodes";
import { aggregateByDay } from "../lib/aggregateByDay";
import WeatherIcon from "./WeatherIcon";
import WeatherHourlyChart from "./WeatherHourlyChart";
import WindChart from "./WindChart";
import WeeklyTemperatureChart from "./WeeklyTemperatureChart";
import WeatherAvatar from "./WeatherAvatar";
import { determineAvatarScenario, WeatherParams } from "../lib/avatarLogic";
import styles from "../styles/weather-card.module.css";

interface Props {
  data: DailyWeatherData;
}

export default function WeatherCard({ data }: Props) {
  const entries = data.data;
  if (!entries.length) return null;

  const uniqueDates = useMemo(() => {
    const dates = new Set(entries.map((e) => e.time.slice(0, 10)));
    return dates.size;
  }, [entries]);

  const isWeekly = uniqueDates > 3;

  const dailyAggregates = useMemo(
    () => (isWeekly ? aggregateByDay(entries) : []),
    [entries, isWeekly]
  );

  // Use the midday entry (or first available) as the "hero" value
  const hero =
    entries.find((e) => new Date(e.time).getHours() === 12) ?? entries[0];
  const iconGroup = getIconGroup(hero.weather_code);

  const heroWeatherParams: WeatherParams = {
    temp_c: hero.temperature_celsius,
    condition_code: hero.weather_code,
    precip_probability: hero.precipitation_probability ?? 0,
    wind_kph: hero.wind_speed_knots * 1.852,
    uv_index: hero.uv_index ?? 0,
    is_day: hero.is_day !== undefined ? hero.is_day : true,
  };
  const scenario = determineAvatarScenario(heroWeatherParams);

  if (isWeekly) {
    return (
      <div className={styles.card}>
        <div className={styles.hero} style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className={styles.iconWrap}>
              <WeatherIcon group={iconGroup} />
            </div>
            <div className={styles.heroInfo}>
              <div className={styles.temperature}>{uniqueDates}-Day Forecast</div>
              <div className={styles.conditions}>
                {describeWeatherCode(hero.weather_code)}
              </div>
            </div>
          </div>

          <WeatherAvatar scenario={scenario} />
        </div>

        <WeeklyTemperatureChart dailyAggregates={dailyAggregates} />
        <WindChart entries={dailyAggregates} mode="daily" />
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.hero} style={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div className={styles.iconWrap}>
            <WeatherIcon group={iconGroup} />
          </div>
          <div className={styles.heroInfo}>
            <div className={styles.temperature}>
              {Math.round(hero.temperature_celsius)}°C
            </div>
            <div className={styles.conditions}>
              {describeWeatherCode(hero.weather_code)}
            </div>
          </div>
        </div>

        <WeatherAvatar scenario={scenario} />
      </div>

      <div className={styles.details}>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Humidity</span>
          <span>{hero.relative_humidity_percent}%</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Wind</span>
          <span>{hero.wind_speed_knots} kt</span>
        </div>
        <div className={styles.detailItem}>
          <span className={styles.detailLabel}>Time</span>
          <span>
            {new Date(hero.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {entries.length > 1 && (
        <>
          <WeatherHourlyChart entries={entries} />
          <WindChart entries={entries} mode="hourly" />
        </>
      )}
    </div>
  );
}
