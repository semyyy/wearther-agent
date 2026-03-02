# Weather Assistant

Multi-agent weather assistant built with Google ADK and a React frontend.

## Prerequisites

- Node.js 18+
- A Google AI API key in `.env` (`GOOGLE_API_KEY=...`)

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
