import type { HourlyEntry } from "../api/types.js";

export interface DailyAggregate {
  date: string;
  time: string;
  temperature_celsius: number;
  temperature_max: number;
  temperature_min: number;
  feels_like_celsius: number;
  relative_humidity_percent: number;
  dew_point_celsius: number | null;
  cloud_cover_percent: number | null;
  visibility_km: number | null;
  wind_speed_knots: number;
  wind_speed_min: number;
  wind_speed_max: number;
  wind_gusts_max: number;
  wind_direction_degrees: number;
  weather_code: number;
  conditions: string;
  surface_pressure_hpa: number;
  precipitation_sum_mm: number;
  uv_index_max: number;
}

/** Groups hourly entries by date and produces one aggregate per day */
export function aggregateByDay(entries: HourlyEntry[]): DailyAggregate[] {
  const grouped = new Map<string, HourlyEntry[]>();

  for (const entry of entries) {
    const date = entry.time.slice(0, 10); // "YYYY-MM-DD"
    let group = grouped.get(date);
    if (!group) {
      group = [];
      grouped.set(date, group);
    }
    group.push(entry);
  }

  const result: DailyAggregate[] = [];

  for (const [date, group] of grouped) {
    const temps = group.map((e) => e.temperature_celsius);
    const feelsLike = group.map((e) => e.feels_like_celsius ?? e.temperature_celsius);
    const humidities = group.map((e) => e.relative_humidity_percent);
    const dewPoints = group.map((e) => e.dew_point_celsius).filter((v): v is number => v != null);
    const cloudCovers = group.map((e) => e.cloud_cover_percent).filter((v): v is number => v != null);
    const visibilities = group.map((e) => e.visibility_km).filter((v): v is number => v != null);
    const speeds = group.map((e) => e.wind_speed_knots);
    const gusts = group.map((e) => e.wind_gusts_knots ?? e.wind_speed_knots);
    const pressures = group.map((e) => e.surface_pressure_hpa);
    const rain = group.map((e) => e.precipitation_mm);
    const uvs = group.map((e) => e.uv_index ?? 0);

    // Circular mean for wind direction via atan2
    let sinSum = 0;
    let cosSum = 0;
    for (const e of group) {
      const rad = (e.wind_direction_degrees * Math.PI) / 180;
      sinSum += Math.sin(rad);
      cosSum += Math.cos(rad);
    }
    const meanDir =
      ((Math.atan2(sinSum / group.length, cosSum / group.length) * 180) /
        Math.PI +
        360) %
      360;

    // Most common weather code
    const codeCounts = new Map<number, number>();
    for (const e of group) {
      codeCounts.set(e.weather_code, (codeCounts.get(e.weather_code) ?? 0) + 1);
    }
    let dominantCode = group[0].weather_code;
    let maxCount = 0;
    for (const [code, count] of codeCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantCode = code;
      }
    }

    const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

    result.push({
      date,
      time: `${date}T12:00`,
      temperature_celsius: Math.round(avg(temps) * 10) / 10,
      temperature_max: Math.max(...temps),
      temperature_min: Math.min(...temps),
      feels_like_celsius: Math.round(avg(feelsLike) * 10) / 10,
      relative_humidity_percent: Math.round(avg(humidities)),
      dew_point_celsius: dewPoints.length ? Math.round(avg(dewPoints) * 10) / 10 : null,
      cloud_cover_percent: cloudCovers.length ? Math.round(avg(cloudCovers)) : null,
      visibility_km: visibilities.length ? Math.round(Math.min(...visibilities) * 10) / 10 : null,
      wind_speed_knots: Math.round(avg(speeds) * 10) / 10,
      wind_speed_min: Math.min(...speeds),
      wind_speed_max: Math.max(...speeds),
      wind_gusts_max: Math.max(...gusts),
      wind_direction_degrees: Math.round(meanDir),
      weather_code: dominantCode,
      conditions: group.find((e) => e.weather_code === dominantCode)?.conditions ?? "",
      surface_pressure_hpa: Math.round(avg(pressures) * 10) / 10,
      precipitation_sum_mm: Math.round(rain.reduce((a, b) => a + b, 0) * 10) / 10,
      uv_index_max: Math.max(...uvs),
    });
  }

  return result;
}
