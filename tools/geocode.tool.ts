import { FunctionTool, getLogger, ToolContext } from "@google/adk";
import { z } from "zod";

const logger = getLogger();

export const geocodeTool = new FunctionTool({
  name: "geocode_city",
  description:
    "Resolves a city name to geographic coordinates (latitude and longitude). Returns the best match with city name, country, latitude, and longitude. Caches results so repeated lookups are instant.",
  parameters: z.object({
    city: z.string().describe("The name of the city to geocode, e.g. 'Paris' or 'Tokyo'"),
  }),
  execute: async ({ city }, toolContext?: ToolContext) => {
    const cacheKey = `geocode:${city.toLowerCase()}`;

    // Check session state cache
    if (toolContext) {
      const cached = toolContext.state.get<string>(cacheKey);
      if (cached) {
        logger.info(`[geocode_city] Cache hit for "${city}"`);
        return JSON.parse(cached as string);
      }
    }

    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;

    logger.info(`[geocode_city] Geocoding city="${city}"`);
    logger.debug(`[geocode_city] Request URL: ${url}`);

    const res = await fetch(url);
    if (!res.ok) {
      logger.error(`[geocode_city] API error: ${res.status} ${res.statusText}`);
      return { error: `Geocoding API error: ${res.status} ${res.statusText}` };
    }

    const data = await res.json();

    if (!data.results || data.results.length === 0) {
      logger.warn(`[geocode_city] No results found for city="${city}"`);
      return { error: `Could not find coordinates for "${city}". Please check the city name.` };
    }

    const result = data.results[0];
    const location = {
      city: result.name,
      country: result.country,
      latitude: result.latitude,
      longitude: result.longitude,
      timezone: result.timezone,
    };

    logger.info(`[geocode_city] Resolved "${city}" -> ${result.name}, ${result.country} (${result.latitude}, ${result.longitude})`);

    // Cache in session state for future lookups
    if (toolContext) {
      toolContext.state.set(cacheKey, JSON.stringify(location));
      logger.debug(`[geocode_city] Cached result in session state key="${cacheKey}"`);
    }

    return location;
  },
});
