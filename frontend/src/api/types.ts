/** A single part inside an SSE event's content */
export interface Part {
  text?: string;
  functionCall?: {
    name: string;
    args: Record<string, unknown>;
  };
  functionResponse?: {
    name: string;
    response: Record<string, unknown>;
  };
}

/** Raw SSE event from the ADK /run_sse endpoint */
export interface SSEEvent {
  content?: {
    parts?: Part[];
    role?: string;
  };
  author?: string;
  actions?: {
    stateDelta?: Record<string, unknown>;
  };
}

/** Hourly weather entry from get_weather_forecast / get_historical_weather */
export interface HourlyEntry {
  time: string;
  temperature_celsius: number;
  relative_humidity_percent: number;
  wind_speed_knots: number;
  wind_gusts_knots: number;
  wind_direction_degrees: number;
  surface_pressure_hpa: number;
  weather_code: number;
  conditions: string;
}

/** Response shape from get_weather_forecast / get_historical_weather */
export interface DailyWeatherData {
  timezone: string;
  focus?: "all" | "wind" | "temperature" | "humidity" | "pressure";
  data: HourlyEntry[];
}

/** Response shape from get_monthly_stats */
export interface MonthlyStatsData {
  timezone: string;
  period: {
    year: number;
    month: number | null;
    start_date: string;
    end_date: string;
  };
  days_in_period: number;
  avg_temperature_celsius: number;
  avg_high_celsius: number;
  avg_low_celsius: number;
  total_precipitation_mm: number;
  rainy_days: number;
}

/** Classified tool response attached to a chat message */
export type ToolResponseData =
  | { type: "daily"; data: DailyWeatherData }
  | { type: "monthly"; data: MonthlyStatsData };

/** A single message in the chat */
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolData?: ToolResponseData;
  isStreaming?: boolean;
}
