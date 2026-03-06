# Project Specifications Overview

This document provides a high-level overview of the Wearther Agent project specifications.

## System Architecture

The project is divided into two main components:

1.  **Backend (ADK-based Agents)**:
    - Built using the Google Agent Development Kit (ADK).
    - Orchestrates multiple specialized agents to handle user weather queries.
    - Interfaces with external weather and geocoding APIs.
2.  **Frontend (React/Vite)**:
    - Provides a modern web interface for interacting with the agents.
    - Visualizes weather data using custom charts (Chart.js) and widgets.
    - Communicates with the backend via Server-Sent Events (SSE).

## Main Components

- **Coordinator Agent**: The entry point for all user requests, responsible for delegating tasks to sub-agents.
- **Location Agent**: Specialized in resolving city names to geographic coordinates.
- **Weather Agent**: Handles all weather-related data fetching (forecasts, historical, and climate statistics).
- **Weather API Library**: A centralized library for all raw `fetch` calls to Open-Meteo.

## Technical Stack

- **Language**: TypeScript
- **Backend Framework**: Google ADK
- **Frontend Framework**: React, Vite
- **Data Visualization**: Chart.js, react-chartjs-2
- **Styling**: CSS Modules
- **External APIs**: Open-Meteo (Geocoding, Forecast, Archive)
