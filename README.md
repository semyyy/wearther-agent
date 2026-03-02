# Weather Assistant

Multi-agent weather assistant built with Google ADK and a React frontend.

## Configuration

Before starting, you need to set up your environment variables. 

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and add your **Google AI API key**:
   ```env
   GOOGLE_API_KEY=your_actual_key_here
   ```

You can also configure the `MODEL` (e.g., `gemini-2.0-flash`) and `LOG_LEVEL` if needed.

## Install

```bash
# Backend dependencies
npm install

# Frontend dependencies
cd frontend && npm install
```

## Start

You need two terminals — one for the backend API and one for the frontend dev server.

**Terminal 1 — Backend (port 8000):**

```bash
npx adk web -h localhost -p 8000
```

**Terminal 2 — Frontend (port 5173):**

```bash
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

### Testing the Backend

You can also test the backend multi-agent logic separately (without the main frontend) using the built-in development UI:
- **URL**: http://localhost:8000/dev-ui

## Stop

Press `Ctrl+C` in each terminal to stop the respective process.

## Example queries

The assistant intelligently adapts its UI based on your request.

| Query Type | Example | Result / UI Widget |
|---|---|---|
| **General** | "What's the weather in Paris today?" | Full **Weather Card** + Hourly Charts |
| **Historical** | "How was the weather in Tokyo on 2024-12-25?" | **Historical Card** for that specific date |
| **Monthly Stats** | "Total rainfall in Tunis in January 2026?" | **Monthly Stats Card** with BAR chart |
| **Yearly Stats** | "Average temperature in New York in 2024?" | **Monthly Stats Card** for the whole year |
| **Temperature Focus**| "Show me only the temperature in London" | **Focus Card**: Temperature + Large Scale Chart |
| **Wind Focus** | "What is the wind in Marseille right now?" | **Focus Card**: Wind (Knots) + **Min/Max Gusts** |
| **Pressure Focus** | "What's the atmospheric pressure in Berlin?" | **Focus Card**: Surface Pressure (hPa) Trend |
| **Humidity Focus** | "How humid is it in Singapore?" | **Focus Card**: Humidity (%) Hourly Trend |

### Pro-tip
You can combine locations and dates naturally. If you don't specify a date, it assumes "today". For historical dates, use the `YYYY-MM-DD` format or relative terms like "yesterday" or "last month".
