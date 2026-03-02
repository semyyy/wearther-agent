import type { SSEEvent } from "./types";
import { createLogger } from "../lib/logger";

const log = createLogger("sse");
const BASE = "/api";
const APP_NAME = "agent";

/** Create a new ADK session for a user */
export async function createSession(
  userId: string
): Promise<{ id: string }> {
  log.info("Creating session for user", userId);
  const res = await fetch(
    `${BASE}/apps/${APP_NAME}/users/${userId}/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: {} }),
    }
  );
  if (!res.ok) {
    log.error("Session creation failed", res.status);
    throw new Error(`Failed to create session: ${res.status}`);
  }
  const data = await res.json();
  log.info("Session created", data.id);
  return data;
}

/**
 * Send a message via the ADK /run_sse endpoint and yield parsed SSE events.
 * The ADK streams newline-delimited JSON prefixed with "data: ".
 */
export async function* sendMessageSSE(
  userId: string,
  sessionId: string,
  message: string
): AsyncGenerator<SSEEvent> {
  const res = await fetch(`${BASE}/run_sse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      appName: APP_NAME,
      userId,
      sessionId,
      newMessage: {
        role: "user",
        parts: [{ text: message }],
      },
      streaming: true,
    }),
  });

  log.info("SSE stream starting", { userId, sessionId });

  if (!res.ok) {
    log.error("SSE request failed", res.status);
    throw new Error(`SSE request failed: ${res.status}`);
  }
  if (!res.body) {
    log.error("No response body");
    throw new Error("No response body");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    // Keep the last (possibly incomplete) line in the buffer
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const json = trimmed.slice(6);
      if (json === "[DONE]") {
        log.info("SSE stream ended ([DONE])");
        return;
      }
      try {
        const parsed = JSON.parse(json) as SSEEvent;
        log.debug("SSE event", parsed.author, parsed.content?.parts?.length ?? 0, "parts");
        yield parsed;
      } catch {
        log.warn("Malformed SSE line", json.slice(0, 120));
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim().startsWith("data: ")) {
    const json = buffer.trim().slice(6);
    if (json !== "[DONE]") {
      try {
        const parsed = JSON.parse(json) as SSEEvent;
        log.debug("SSE event (trailing)", parsed.author);
        yield parsed;
      } catch {
        log.warn("Malformed trailing SSE line", json.slice(0, 120));
      }
    }
  }
}
