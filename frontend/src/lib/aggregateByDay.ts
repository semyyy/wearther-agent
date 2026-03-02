import type { HourlyEntry } from "../api/types";

export interface DailyAggregate {
  date: string;
  time: string;
  temperature_celsius: number;
  temperature_max: number;
  temperature_min: number;
  relative_humidity_percent: number;
  wind_speed_kmh: number;
  wind_speed_max: number;
  wind_direction_degrees: number;
  weather_code: number;
  conditions: string;
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
    const humidities = group.map((e) => e.relative_humidity_percent);
    const speeds = group.map((e) => e.wind_speed_kmh);

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
      relative_humidity_percent: Math.round(avg(humidities)),
      wind_speed_kmh: Math.round(avg(speeds) * 10) / 10,
      wind_speed_max: Math.max(...speeds),
      wind_direction_degrees: Math.round(meanDir),
      weather_code: dominantCode,
      conditions: group.find((e) => e.weather_code === dominantCode)?.conditions ?? "",
    });
  }

  return result;
}
