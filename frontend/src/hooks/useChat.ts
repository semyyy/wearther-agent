import { useCallback, useRef, useState } from "react";
import { createSession, sendMessageSSE } from "../api/adkClient.js";
import type { ChatMessage, ToolResponseData } from "../api/types.js";
import { detectResponseType } from "../lib/detectResponseType.js";
import { createLogger } from "../lib/logger.js";

const log = createLogger("chat");

let messageCounter = 0;
function nextId() {
  return `msg-${++messageCounter}`;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinkingStatus, setThinkingStatus] = useState("");
  const [latestToolData, setLatestToolData] = useState<ToolResponseData | undefined>();

  const userIdRef = useRef(`user-${Date.now()}`);
  const sessionIdRef = useRef<string | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setThinkingStatus("Connecting...");

    // Auto-create session on first message
    if (!sessionIdRef.current) {
      try {
        log.info("Creating new session");
        const session = await createSession(userIdRef.current);
        sessionIdRef.current = session.id;
        log.info("Session ready", session.id);
      } catch (err) {
        log.error("Failed to create session", err);
        setIsLoading(false);
        setThinkingStatus("");
        return;
      }
    }

    // Add user message
    const userMsg: ChatMessage = { id: nextId(), role: "user", text: trimmed };
    const assistantId = nextId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      text: "",
      isStreaming: true,
    };

    log.info("User message sent", trimmed.slice(0, 80));
    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    let accumulatedText = "";
    let toolData: ToolResponseData | undefined;

    try {
      const stream = sendMessageSSE(
        userIdRef.current,
        sessionIdRef.current!,
        trimmed
      );

      for await (const event of stream) {
        const parts = event.content?.parts ?? [];

        for (const part of parts) {
          // Function call → show thinking status
          if (part.functionCall) {
            const name = part.functionCall.name;
            log.info("Function call", name);
            if (name === "geocode_city") {
              setThinkingStatus("Looking up location...");
            } else if (name === "get_weather_forecast") {
              setThinkingStatus("Fetching forecast...");
            } else if (name === "get_historical_weather") {
              setThinkingStatus("Fetching historical data...");
            } else if (name === "get_monthly_stats") {
              setThinkingStatus("Calculating statistics...");
            } else if (name === "transfer_to_agent") {
              setThinkingStatus("Thinking...");
            } else if (name === "get_city_weather") {
              setThinkingStatus("Fetching weather...");
            } else {
              setThinkingStatus("Processing...");
            }
          }

          // Function response → detect widget data
          if (part.functionResponse) {
            const detected = detectResponseType(
              part.functionResponse.name,
              part.functionResponse.response
            );
            if (detected) {
              log.info("Function response", part.functionResponse.name, "type:", detected.type);
              toolData = detected;
            }
          }

          // Text from coordinator → accumulate into assistant message
          if (part.text && event.author === "coordinator") {
            log.debug("Coordinator text chunk", part.text.length, "chars");
            accumulatedText += part.text;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, text: accumulatedText }
                  : m
              )
            );
          }
        }
      }
    } catch (err) {
      log.error("SSE stream error", err);
      if (!accumulatedText) {
        accumulatedText = "Sorry, something went wrong. Please try again.";
      }
    }

    // Finalize the assistant message
    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantId
          ? {
            ...m,
            text: accumulatedText,
            toolData,
            isStreaming: false,
          }
          : m
      )
    );

    if (toolData) {
      setLatestToolData(toolData);
    }

    log.info("Response finalized", accumulatedText.length, "chars", toolData ? `widget:${toolData.type}` : "no widget");
    setIsLoading(false);
    setThinkingStatus("");
  }, []);

  return { messages, isLoading, thinkingStatus, sendMessage, latestToolData };
}
