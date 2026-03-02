import { useChat } from "../hooks/useChat";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import Spinner from "./Spinner";
import styles from "../styles/chat.module.css";

export default function ChatWindow() {
  const { messages, isLoading, thinkingStatus, sendMessage } = useChat();

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <span className={styles.headerIcon}>&#9925;</span>
        <span className={styles.headerTitle}>Weather Assistant</span>
      </div>

      <MessageList messages={messages} />

      {isLoading && <Spinner status={thinkingStatus} />}

      <ChatInput onSend={sendMessage} disabled={isLoading} />
    </div>
  );
}
