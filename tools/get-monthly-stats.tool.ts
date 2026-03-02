import { FunctionTool, getLogger, ToolContext } from "@google/adk";
import { z } from "zod";

const logger = getLogger();

function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export const getMonthlyStatsTool = new FunctionTool({
  name: "get_monthly_stats",
  description:
    "Fetches monthly or yearly climate statistics for a location. Returns average temperature, average high/low, total precipitation, and rainy day count. Use this when the user asks about climate averages, total rainfall, or general weather stats for a month or year.",
  parameters: z.object({
    latitude: z.number().describe("Latitude of the location"),
    longitude: z.number().describe("Longitude of the location"),
    year: z.number().describe("The year to query (e.g. 2024)"),
    month: z
      .number()
      .min(1)
      .max(12)
      .optional()
      .describe("Month number (1-12). Omit for full-year stats."),
  }),
  execute: async ({ latitude, longitude, year, month }, toolContext?: ToolContext) => {
    const startDate = month
      ? `${year}-${String(month).padStart(2, "0")}-01`
      : `${year}-01-01`;
    const endDate = month
      ? `${year}-${String(month).padStart(2, "0")}-${lastDayOfMonth(year, month)}`
      : `${year}-12-31`;

    const cacheKey = `monthly_stats_${latitude}_${longitude}_${year}_${month ?? "full"}`;

    if (toolContext) {
      const cached = toolContext.state.get(cacheKey);
      if (cached) {
        logger.info(`[get_monthly_stats] Cache hit for ${cacheKey}`);
        return JSON.parse(cached as string);
      }
    }

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    logger.info(`[get_monthly_stats] Fetching stats for (${latitude}, ${longitude}), range=${startDate} to ${endDate}`);
    logger.debug(`[get_monthly_stats] Request URL: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
      logger.error(`[get_monthly_stats] API error: ${res.status} ${res.statusText}`);
      return { error: `Archive API error: ${res.status} ${res.statusText}` };
    }

    const data = await res.json();
    const daily = data.daily;

    if (!daily || !daily.time || daily.time.length === 0) {
      logger.warn(`[get_monthly_stats] No daily data in API response for range ${startDate} to ${endDate}`);
      return { error: `No climate data available for the requested period.` };
    }

    logger.debug(`[get_monthly_stats] Received ${daily.time.length} daily entries`);

    const maxTemps: number[] = daily.temperature_2m_max;
    const minTemps: number[] = daily.temperature_2m_min;
    const precip: number[] = daily.precipitation_sum;

    const validDays = maxTemps.filter((v: number | null) => v !== null).length;
    if (validDays === 0) {
      logger.warn(`[get_monthly_stats] All temperature values are null`);
      return { error: `No valid temperature data for the requested period.` };
    }

    const avgHigh = maxTemps.reduce((sum: number, v: number) => sum + (v ?? 0), 0) / validDays;
    const avgLow = minTemps.reduce((sum: number, v: number) => sum + (v ?? 0), 0) / validDays;
    const avgTemp = (avgHigh + avgLow) / 2;
    const totalPrecip = precip.reduce((sum: number, v: number) => sum + (v ?? 0), 0);
    const rainyDays = precip.filter((v: number) => v != null && v > 0).length;

    const round = (n: number) => Math.round(n * 10) / 10;

    const result = {
      timezone: data.timezone,
      period: { year, month: month ?? null, start_date: startDate, end_date: endDate },
      days_in_period: daily.time.length,
      avg_temperature_celsius: round(avgTemp),
      avg_high_celsius: round(avgHigh),
      avg_low_celsius: round(avgLow),
      total_precipitation_mm: round(totalPrecip),
      rainy_days: rainyDays,
    };

    logger.info(`[get_monthly_stats] Returning stats: avgTemp=${result.avg_temperature_celsius}°C, precip=${result.total_precipitation_mm}mm, rainyDays=${rainyDays}`);

    if (toolContext) {
      toolContext.state.set(cacheKey, JSON.stringify(result));
      logger.debug(`[get_monthly_stats] Cached result under key=${cacheKey}`);
    }

    return result;
  },
});
