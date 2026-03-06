# UI Data Visualization Specifications

This document describes how weather data is visualized in the frontend application.

## 1. Chat Interface

The main interaction point is a chat-like interface where user messages and assistant responses are displayed.

### Components:
- **`MessageBubble.tsx`**: Renders individual chat messages.
- **`WeatherCard.tsx`**: Renders general weather data.
- **`MonthlyStatsCard.tsx`**: Renders monthly climate statistics.
- **`WeatherFocusCard.tsx`**: Renders focused data for a single weather parameter.

## 2. Visualization Logic

### Charts
The application uses **Chart.js** via **react-chartjs-2** for all data visualizations.

#### Temperature & Precipitation Chart (`WeatherTemperatureChart.tsx` - legacy/example logic)
- **Line Chart**: Shows temperature trends.
- **Bar Chart**: Shows precipitation (rainfall) in millimeters (mm).
- **Axes**: Double Y-axis configuration (one for temperature and one for precipitation).

#### Wind Chart (`WindChart.tsx`)
- Visualizes wind speed and gusts.
- **Units**: Knots (kt).
- **Color Coding**: Wind speeds are color-coded based on severity (Calm, Light, Moderate, Strong, Very Strong, Extreme).

## 3. Data Processing

- **Daily Aggregation**: The frontend often receives hourly data. It uses `aggregateByDay.ts` to calculate daily averages, maximums, and minimums when displaying a weekly view.
- **Weather Icons**: Numerical weather codes (WMO) are mapped to icon groups (e.g., "sunny", "cloudy", "rainy") using `weatherCodes.ts`.
