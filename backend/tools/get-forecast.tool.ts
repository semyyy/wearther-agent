import { FunctionTool, getLogger, ToolContext } from "@google/adk";
import { z } from "zod";
import { describeWeatherCode } from "../lib/weather-codes.js";
import { fetchForecast, fetchAirQuality } from "../lib/weather-api.js";

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
      const [data, aqData] = await Promise.all([
        fetchForecast(latitude, longitude),
        fetchAirQuality(latitude, longitude).catch(() => null),
      ]);
      const hourly = data.hourly;
      const daily = data.daily;
      const aqHourly = aqData?.hourly;

      if (!hourly || !hourly.time) {
        logger.warn(`[get_weather_forecast] No forecast data in API response`);
        return { error: "No forecast data available for this location." };
      }

      logger.debug(`[get_weather_forecast] Received ${hourly.time.length} hourly entries, timezone=${data.timezone}`);

      // Build sunrise/sunset lookup by date
      const sunTimes: Record<string, { sunrise: string; sunset: string }> = {};
      if (daily?.time) {
        for (let d = 0; d < daily.time.length; d++) {
          sunTimes[daily.time[d]] = {
            sunrise: daily.sunrise[d],
            sunset: daily.sunset[d],
          };
        }
      }

      // Build AQ lookup by time
      const aqByTime: Record<string, { pm2_5: number; pm10: number; no2: number; ozone: number; aqi: number }> = {};
      if (aqHourly?.time) {
        for (let a = 0; a < aqHourly.time.length; a++) {
          aqByTime[aqHourly.time[a]] = {
            pm2_5: aqHourly.pm2_5[a] ?? 0,
            pm10: aqHourly.pm10[a] ?? 0,
            no2: aqHourly.nitrogen_dioxide[a] ?? 0,
            ozone: aqHourly.ozone[a] ?? 0,
            aqi: aqHourly.european_aqi[a] ?? 0,
          };
        }
      }

      let entries = hourly.time.map((time: string, i: number) => {
        const dateKey = time.slice(0, 10);
        const sun = sunTimes[dateKey];
        const aq = aqByTime[time] ?? { pm2_5: 0, pm10: 0, no2: 0, ozone: 0, aqi: 0 };
        return {
          time,
          temperature_celsius: hourly.temperature_2m[i],
          feels_like_celsius: hourly.apparent_temperature?.[i] ?? hourly.temperature_2m[i],
          relative_humidity_percent: hourly.relative_humidity_2m[i],
          dew_point_celsius: hourly.dew_point_2m?.[i] ?? null,
          cloud_cover_percent: hourly.cloud_cover?.[i] ?? null,
          visibility_km: hourly.visibility?.[i] != null ? hourly.visibility[i] / 1000 : null,
          wind_speed_knots: hourly.wind_speed_10m[i],
          wind_direction_degrees: hourly.wind_direction_10m[i],
          wind_gusts_knots: hourly.wind_gusts_10m[i] ?? hourly.wind_speed_10m[i],
          surface_pressure_hpa: hourly.surface_pressure[i],
          precipitation_mm: hourly.precipitation[i],
          precipitation_probability: hourly.precipitation_probability[i] ?? 0,
          uv_index: hourly.uv_index[i] ?? 0,
          is_day: hourly.is_day[i] === 1,
          weather_code: hourly.weather_code[i],
          conditions: describeWeatherCode(hourly.weather_code[i]),
          air_quality: aq,
          sunrise: sun?.sunrise ?? null,
          sunset: sun?.sunset ?? null,
        };
      });

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
        focus: focus,
        data: entries,
      };
    } catch (e: any) {
      return { error: e.message };
    }
  },
});
