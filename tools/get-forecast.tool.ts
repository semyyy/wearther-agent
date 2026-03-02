import { FunctionTool, getLogger, ToolContext } from "@google/adk";
import { z } from "zod";
import { describeWeatherCode } from "../lib/weather-codes.js";

const logger = getLogger();

export const getForecastTool = new FunctionTool({
  name: "get_weather_forecast",
  description:
    "Fetches the weather forecast for a location using latitude and longitude. Returns hourly data for the next 7 days including temperature, humidity, wind speed, and weather conditions. Use this for current weather or future forecasts (up to 7 days ahead).",
  parameters: z.object({
    latitude: z.number().describe("Latitude of the location"),
    longitude: z.number().describe("Longitude of the location"),
    date: z
      .string()
      .optional()
      .describe(
        "Optional specific date in YYYY-MM-DD format to filter results. If omitted, returns all available forecast data."
      ),
    hour: z
      .number()
      .optional()
      .describe(
        "Optional hour (0-23) to filter results to a specific time. Only used if date is also provided."
      ),
  }),
  execute: async ({ latitude, longitude, date, hour }, toolContext?: ToolContext) => {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code&timezone=auto`;

    logger.info(`[get_weather_forecast] Fetching forecast for (${latitude}, ${longitude}), date=${date ?? "all"}, hour=${hour ?? "all"}`);
    logger.debug(`[get_weather_forecast] Request URL: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
      logger.error(`[get_weather_forecast] API error: ${res.status} ${res.statusText}`);
      return { error: `Forecast API error: ${res.status} ${res.statusText}` };
    }

    const data = await res.json();
    const hourly = data.hourly;

    if (!hourly || !hourly.time) {
      logger.warn(`[get_weather_forecast] No forecast data in API response`);
      return { error: "No forecast data available for this location." };
    }

    logger.debug(`[get_weather_forecast] Received ${hourly.time.length} hourly entries, timezone=${data.timezone}`);

    let entries = hourly.time.map((time: string, i: number) => ({
      time,
      temperature_celsius: hourly.temperature_2m[i],
      relative_humidity_percent: hourly.relative_humidity_2m[i],
      wind_speed_kmh: hourly.wind_speed_10m[i],
      wind_direction_degrees: hourly.wind_direction_10m[i],
      weather_code: hourly.weather_code[i],
      conditions: describeWeatherCode(hourly.weather_code[i]),
    }));

    if (date) {
      entries = entries.filter((e: { time: string }) => e.time.startsWith(date));
      logger.debug(`[get_weather_forecast] Filtered to date=${date}: ${entries.length} entries`);
    }

    if (date && hour !== undefined) {
      const hourStr = hour.toString().padStart(2, "0");
      const target = `${date}T${hourStr}:00`;
      entries = entries.filter((e: { time: string }) => e.time === target);
      logger.debug(`[get_weather_forecast] Filtered to hour=${hourStr}: ${entries.length} entries`);
    }

    if (entries.length === 0) {
      logger.warn(`[get_weather_forecast] No data after filtering for date=${date}, hour=${hour}`);
      return { error: `No forecast data available for ${date}${hour !== undefined ? ` at ${hour}:00` : ""}. The forecast API covers up to 7 days ahead.` };
    }

    logger.info(`[get_weather_forecast] Returning ${entries.length} entries`);

    // Store last forecast in session state
    if (toolContext) {
      toolContext.state.set("last_forecast", JSON.stringify({
        latitude, longitude, date, hour, timezone: data.timezone,
        summary: entries[0],
      }));
      logger.debug(`[get_weather_forecast] Stored last forecast in session state`);
    }

    return {
      timezone: data.timezone,
      data: entries,
    };
  },
});
