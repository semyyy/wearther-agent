import { useEffect, useRef } from "react";
import type { ChatMessage } from "../api/types";
import MessageBubble from "./MessageBubble";
import styles from "../styles/chat.module.css";

interface Props {
  messages: ChatMessage[];
}

export default function MessageList({ messages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className={styles.messageList}>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
