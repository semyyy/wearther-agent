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

## Stop

Press `Ctrl+C` in each terminal to stop the respective process.

## Example queries

| Query | Widget |
|---|---|
| What's the weather in Paris today? | Weather card with hourly chart |
| How was the weather in Tokyo on 2025-12-25? | Historical weather card |
| Total rainfall in Tunis in January 2026? | Monthly stats with bar chart |
