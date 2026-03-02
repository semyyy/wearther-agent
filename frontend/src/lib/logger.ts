const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVELS;

const DEFAULT_LEVEL: Level = import.meta.env.DEV ? "debug" : "info";

function pad(n: number, len = 2) {
  return String(n).padStart(len, "0");
}

function timestamp() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

export function createLogger(tag: string, minLevel: Level = DEFAULT_LEVEL) {
  const threshold = LEVELS[minLevel];

  function emit(level: Level, args: unknown[]) {
    if (LEVELS[level] < threshold) return;
    const prefix = `[${timestamp()}] [${level.toUpperCase()}] [${tag}]`;
    const method = level === "debug" ? "log" : level;
    (console as any)[method](prefix, ...args);
  }

  return {
    debug: (...args: unknown[]) => emit("debug", args),
    info: (...args: unknown[]) => emit("info", args),
    warn: (...args: unknown[]) => emit("warn", args),
    error: (...args: unknown[]) => emit("error", args),
  };
}
