import type { ChatMessage } from "../api/types";
import styles from "../styles/chat.module.css";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`${styles.messageRow} ${isUser ? styles.messageRowUser : styles.messageRowAssistant}`}
    >
      <div
        className={`${styles.bubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}
      >
        {message.text || (message.isStreaming ? "..." : "")}
      </div>
    </div>
  );
}
