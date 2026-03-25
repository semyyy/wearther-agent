import type { ChatMessage } from "../api/types";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import Spinner from "./Spinner";
import layoutStyles from "../styles/layout.module.css";

interface Props {
  messages: ChatMessage[];
  isLoading: boolean;
  thinkingStatus: string;
  onSend: (text: string) => void;
}

export default function ChatWindow({ messages, isLoading, thinkingStatus, onSend }: Props) {
  return (
    <div className={layoutStyles.chatPanel}>
      <MessageList messages={messages} />

      {isLoading && <Spinner status={thinkingStatus} />}

      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
