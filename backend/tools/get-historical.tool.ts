import { FunctionTool, getLogger, ToolContext } from "@google/adk";
import { z } from "zod";
import { describeWeatherCode } from "../lib/weather-codes.js";
import { fetchHistorical } from "../lib/weather-api.js";

const logger = getLogger();

export const getHistoricalTool = new FunctionTool({
  name: "get_historical_weather",
  description:
    "Fetches historical weather data for a past date at a specific location. Use this tool when the user asks about weather on a date that has already passed. Requires latitude, longitude, and the date.",
  parameters: z.object({
    latitude: z.number().describe("Latitude of the location"),
    longitude: z.number().describe("Longitude of the location"),
    date: z.string().describe("The past date in YYYY-MM-DD format"),
    hour: z
      .number()
      .optional()
      .describe("Optional hour (0-23) to filter results to a specific time"),
    focus: z
      .enum(["all", "wind", "temperature", "humidity", "pressure"])
      .optional()
      .default("all")
      .describe(
        "If the user asks ONLY for wind, temperature, humidity, or pressure, set this focus. Defaults to 'all'."
      ),
  }),
  execute: async ({ latitude, longitude, date, hour, focus }, toolContext?: ToolContext) => {

    try {
      const data = await fetchHistorical(latitude, longitude, date, date);
      const hourly = data.hourly;

      if (!hourly || !hourly.time) {
        logger.warn(`[get_historical_weather] No historical data in API response for date=${date}`);
        return { error: `No historical weather data available for ${date}.` };
      }

      logger.debug(`[get_historical_weather] Received ${hourly.time.length} hourly entries, timezone=${data.timezone}`);

      let entries = hourly.time.map((time: string, i: number) => ({
        time,
        temperature_celsius: hourly.temperature_2m[i],
        relative_humidity_percent: hourly.relative_humidity_2m[i],
        wind_speed_knots: hourly.wind_speed_10m[i],
        wind_direction_degrees: hourly.wind_direction_10m[i],
        wind_gusts_knots: hourly.wind_gusts_10m[i] ?? hourly.wind_speed_10m[i],
        surface_pressure_hpa: hourly.surface_pressure[i],
        precipitation_mm: hourly.precipitation[i],
        weather_code: hourly.weather_code[i],
        conditions: describeWeatherCode(hourly.weather_code[i]),
      }));

      if (hour !== undefined) {
        const hourStr = hour.toString().padStart(2, "0");
        const target = `${date}T${hourStr}:00`;
        entries = entries.filter((e: { time: string }) => e.time === target);
        logger.debug(`[get_historical_weather] Filtered to hour=${hourStr}: ${entries.length} entries`);
      }

      if (entries.length === 0) {
        logger.warn(`[get_historical_weather] No data after filtering for date=${date}, hour=${hour}`);
        return { error: `No historical data found for ${date}${hour !== undefined ? ` at ${hour}:00` : ""}.` };
      }

      logger.info(`[get_historical_weather] Returning ${entries.length} entries`);

      // Store last historical query in session state
      if (toolContext) {
        toolContext.state.set("last_historical", JSON.stringify({
          latitude, longitude, date, hour, timezone: data.timezone,
          summary: entries[0],
        }));
        logger.debug(`[get_historical_weather] Stored last historical query in session state`);
      }

      return {
        timezone: data.timezone,
        focus: focus,
        data: entries,
      };
    } catch (e: any) {
      return { error: e.message };
    }
  },
});
