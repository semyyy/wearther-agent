# Agent Specifications

This document details the roles and responsibilities of the agents in the Wearther Agent system.

## 1. Coordinator Agent (`backend/agents/coordinator.ts`)

The Coordinator Agent is the lead manager of the system.

- **Objective**: Handle user weather queries by coordinating specialized sub-agents.
- **Role**: Entry point for the user, manages the overall conversation flow.
- **Constraints**: Always respond with only **one sentence**. The response must automatically trigger the display of the weather avatar with the right clothes and the charts associated with the user's demand.
- **Memory**: Caches geocoding results and keeps track of recent weather data in the session state.

## 2. Location Agent (`backend/agents/location-agent.ts`)

- **Objective**: Resolve geographic location requests.
- **Tool used**: `geocode_city`
- **Output**: Returns latitude, longitude, and country for a given city name.

## 3. Weather Agent (`backend/agents/weather-agent.ts`)

- **Objective**: Retrieve specific weather information.
- **Workflow**:
  - Uses **`get_weather_forecast`** for current or future weather.
  - Uses **`get_historical_weather`** for any date in the past.
  - Uses **`get_monthly_stats`** for monthly or yearly climate statistics.
- **Capability**: Can provide focused data on wind, temperature, humidity, or pressure.

## Agent Workflow

1.  User query (e.g., "What's the weather in London?") is received by the **Coordinator Agent**.
2.  Coordinator calls the **Location Agent** to find the coordinates for London.
3.  Once the location is resolved, the Coordinator calls the **Weather Agent** with those coordinates.
4.  The Weather Agent returns the data, and the Coordinator compiles a final friendly response.
