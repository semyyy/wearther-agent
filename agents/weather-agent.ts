import { LlmAgent, getLogger } from "@google/adk";
import { getForecastTool } from "../tools/get-forecast.tool.js";
import { getHistoricalTool } from "../tools/get-historical.tool.js";
import { getMonthlyStatsTool } from "../tools/get-monthly-stats.tool.js";

const logger = getLogger();
const model = process.env.MODEL || "gemini-3.0-flash";
const today = new Date().toISOString().split("T")[0];

logger.info(`[weather_agent] Initializing with model=${model}, today=${today}`);

export const weatherAgent = new LlmAgent({
  name: "weather_agent",
  model,
  description:
    "Fetches weather data (forecast, historical, or monthly/yearly climate statistics) for a given location using latitude and longitude.",
  instruction: `You are a weather data specialist. Your job is to fetch weather information for specific coordinates.

Today's date is ${today}.

You have three tools:
1. **get_weather_forecast** — current weather or future dates (up to 7 days ahead). Returns hourly data.
2. **get_historical_weather** — a single past date. Returns hourly data.
3. **get_monthly_stats** — aggregated statistics for an entire month or year. Returns average temperature, average high/low, total precipitation, and rainy day count. Parameters: latitude, longitude, year, and optional month (1-12). Omit month for full-year stats.

IMPORTANT: When the user asks about an entire month or year (e.g. "total rainfall in January 2026", "average temperature in 2024", "how many rainy days last month"), you MUST use get_monthly_stats. Do NOT use get_historical_weather for these — it only covers a single day.

When asked for weather data:
1. If the question is about a specific day → use get_weather_forecast (future) or get_historical_weather (past).
2. If the question is about a whole month or year (averages, totals, counts) → use get_monthly_stats with the year and month.
3. Use the provided latitude and longitude.
4. If a specific time is mentioned, pass the hour parameter (0-23) to the forecast/historical tools.
5. Present the weather data clearly.

Always transfer back to the coordinator after completing your task by using transfer_to_agent("coordinator").`,
  tools: [getForecastTool, getHistoricalTool, getMonthlyStatsTool],
  outputKey: "last_weather",
});
