import { LlmAgent, getLogger } from "@google/adk";
import { getModel } from "../lib/llm-provider.js";
import { geocodeTool } from "../tools/geocode.tool.js";

const logger = getLogger();
const model = getModel();

logger.info(`[location_agent] Initializing with model=${model}`);

export const locationAgent = new LlmAgent({
  name: "location_agent",
  model,
  description: "Resolves city names to geographic coordinates (latitude/longitude) using geocoding.",
  instruction: `You are a location resolution specialist. Your job is to convert city names into geographic coordinates.

When the user or coordinator asks about a location:
1. Use the geocode_city tool to look up the city's coordinates.
2. Return the city name, country, latitude, longitude, and timezone.
3. If the city is not found, let the user know and suggest checking the spelling.

Always transfer back to the coordinator after completing your task by using transfer_to_agent("coordinator").`,
  tools: [geocodeTool],
  outputKey: "last_location",
});
