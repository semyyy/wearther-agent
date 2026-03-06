# External API Integration (Weather API)

All communications with external data providers are handled through a dedicated library to maintain clean separation.

## Data Provider: Open-Meteo

The project utilizes the [Open-Meteo API](https://open-meteo.com/) for all weather and geocoding data.

### Central Library (`backend/lib/weather-api.ts`)

This module encapsulates all raw `fetch` calls.

#### 1. Geocoding API
- **Function**: `fetchGeocode(city)`
- **Endpoint**: `https://geocoding-api.open-meteo.com/v1/search`
- **Purpose**: Translates a string (city name) into coordinates.

#### 2. Forecast API
- **Function**: `fetchForecast(lat, lon, timezone)`
- **Endpoint**: `https://api.open-meteo.com/v1/forecast`
- **Parameters**: `hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure,wind_gusts_10m,precipitation`
- **Units**: Wind speed in knots (`kn`).

#### 3. Historical Data (Archive API)
- **Function**: `fetchHistorical(lat, lon, start_date, end_date, timezone)`
- **Endpoint**: `https://archive-api.open-meteo.com/v1/archive`
- **Purpose**: For retrieving weather data from the past.

#### 4. Monthly/Climate Statistics
- **Function**: `fetchMonthlyStats(lat, lon, start_date, end_date, timezone)`
- **Endpoint**: `https://archive-api.open-meteo.com/v1/archive`
- **Purpose**: Calculates averages, high/low temperatures, and precipitation totals via daily parameters.
