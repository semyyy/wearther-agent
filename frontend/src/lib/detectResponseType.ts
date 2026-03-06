import type {
  DailyWeatherData,
  MonthlyStatsData,
  ToolResponseData,
} from "../api/types.js";

const DAILY_TOOLS = ["get_weather_forecast", "get_historical_weather", "get_city_weather"];
const MONTHLY_TOOLS = ["get_monthly_stats"];

/**
 * Classify a tool response by the tool name that produced it.
 * Returns null if the tool isn't one we render widgets for.
 */
export function detectResponseType(
  toolName: string,
  response: Record<string, unknown>
): ToolResponseData | null {
  if (DAILY_TOOLS.includes(toolName) && response.data) {
    return { type: "daily", data: response as unknown as DailyWeatherData };
  }
  if (MONTHLY_TOOLS.includes(toolName) && response.period) {
    return { type: "monthly", data: response as unknown as MonthlyStatsData };
  }
  return null;
}
