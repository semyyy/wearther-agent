import type { ChatMessage } from "../api/types";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import Spinner from "./Spinner";
import layoutStyles from "../styles/layout.module.css";
import styles from "../styles/chat.module.css";

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  thinkingStatus: string;
  onSend: (text: string) => void;
}

export default function ChatWindow({ messages, isLoading, thinkingStatus, onSend }: Props) {
  return (
    <div className={layoutStyles.chatPanel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelIcon}>&#128488;</span>
        <span className={styles.panelTitle}>Chat</span>
      </div>

      <MessageList messages={messages} />

      {isLoading && <Spinner status={thinkingStatus} />}

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
