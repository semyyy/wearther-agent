import type { ChatMessage } from "../api/types";
import WeatherCard from "./WeatherCard";
import MonthlyStatsCard from "./MonthlyStatsCard";
import styles from "../styles/chat.module.css";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`${styles.messageRow} ${
        isUser ? styles.messageRowUser : styles.messageRowAssistant
      }`}
    >
      <div>
        <div
          className={`${styles.bubble} ${
            isUser ? styles.bubbleUser : styles.bubbleAssistant
          }`}
        >
          {message.text || (message.isStreaming ? "..." : "")}
        </div>

        {message.toolData && (
          <div className={styles.widgetWrapper}>
            {message.toolData.type === "daily" && (
              <WeatherCard data={message.toolData.data} />
            )}
            {message.toolData.type === "monthly" && (
              <MonthlyStatsCard data={message.toolData.data} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
