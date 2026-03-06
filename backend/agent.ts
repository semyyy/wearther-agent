import { initFileLogger } from "./lib/file-logger.js";
initFileLogger();

import "dotenv/config";
import { LogLevel, setLogLevel, LoggingPlugin, getLogger } from "@google/adk";
import { getProviderInfo } from "./lib/llm-provider.js";
import { coordinator } from "./agents/coordinator.js";

const logLevelMap: Record<string, LogLevel> = {
  DEBUG: LogLevel.DEBUG,
  INFO: LogLevel.INFO,
  WARN: LogLevel.WARN,
  ERROR: LogLevel.ERROR,
};

const level = logLevelMap[process.env.LOG_LEVEL?.toUpperCase() ?? ""] ?? LogLevel.INFO;
setLogLevel(level);

const logger = getLogger();
logger.info(`[agent] Log level set to ${LogLevel[level]}`);
logger.info(`[agent] Provider: ${getProviderInfo()}`);

export const rootAgent = coordinator;
export const plugins = [new LoggingPlugin()];
