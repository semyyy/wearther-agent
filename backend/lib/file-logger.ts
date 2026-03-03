import { mkdirSync, statSync, renameSync, appendFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOG_DIR = join(__dirname, "..", "logs");
const LOG_FILE = join(LOG_DIR, "app.log");
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function ensureLogDir() {
  mkdirSync(LOG_DIR, { recursive: true });
}

function rotateIfNeeded() {
  try {
    const stats = statSync(LOG_FILE);
    if (stats.size >= MAX_SIZE) {
      renameSync(LOG_FILE, `${LOG_FILE}.1`);
    }
  } catch {
    // File doesn't exist yet — nothing to rotate
  }
}

function writeToFile(level: string, args: unknown[]) {
  rotateIfNeeded();
  const timestamp = new Date().toISOString();
  const message = args
    .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
    .join(" ");
  appendFileSync(LOG_FILE, `[${timestamp}] [${level}] ${message}\n`);
}

export function initFileLogger() {
  ensureLogDir();

  const originalLog = console.log;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  const originalError = console.error;

  console.log = (...args: unknown[]) => {
    originalLog(...args);
    writeToFile("LOG", args);
  };

  console.info = (...args: unknown[]) => {
    originalInfo(...args);
    writeToFile("INFO", args);
  };

  console.warn = (...args: unknown[]) => {
    originalWarn(...args);
    writeToFile("WARN", args);
  };

  console.error = (...args: unknown[]) => {
    originalError(...args);
    writeToFile("ERROR", args);
  };
}
