import { getLogger } from "@google/adk";

const logger = getLogger();

export async function fetchGeocode(city: string) {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
    )}&count=1&language=en&format=json`;

    logger.info(`[weather-api] Geocoding city="${city}"`);
    logger.debug(`[weather-api] Request URL: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
        logger.error(`[weather-api] API error: ${res.status} ${res.statusText}`);
        throw new Error(`Geocoding API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
}

export async function fetchForecast(
    latitude: number,
    longitude: number,
    timezone = "auto"
) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure,wind_gusts_10m,precipitation&wind_speed_unit=kn&timezone=${timezone}`;

    logger.info(
        `[weather-api] Fetching forecast for (${latitude}, ${longitude})`
    );
    logger.debug(`[weather-api] Request URL: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
        logger.error(`[weather-api] API error: ${res.status} ${res.statusText}`);
        throw new Error(`Forecast API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
}

export async function fetchHistorical(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    timezone = "auto"
) {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,surface_pressure,wind_gusts_10m,precipitation&wind_speed_unit=kn&timezone=${timezone}`;

    logger.info(
        `[weather-api] Fetching historical data for (${latitude}, ${longitude}), range=${startDate} to ${endDate}`
    );
    logger.debug(`[weather-api] Request URL: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
        logger.error(`[weather-api] API error: ${res.status} ${res.statusText}`);
        throw new Error(`Historical weather API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
}

export async function fetchMonthlyStats(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    timezone = "auto"
) {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=${timezone}`;

    logger.info(
        `[weather-api] Fetching stats for (${latitude}, ${longitude}), range=${startDate} to ${endDate}`
    );
    logger.debug(`[weather-api] Request URL: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
        logger.error(`[weather-api] API error: ${res.status} ${res.statusText}`);
        throw new Error(`Archive API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data;
}
