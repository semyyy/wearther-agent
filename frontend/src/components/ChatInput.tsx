import { useState, type FormEvent, type KeyboardEvent } from "react";
import styles from "../styles/chat.module.css";

interface Props {
  onSend: (text: string) => void;
  disabled: boolean;
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  return (
    <form className={styles.inputBar} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        placeholder="Ask about the weather..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
      <button
        className={styles.sendButton}
        type="submit"
        disabled={disabled || !value.trim()}
      >
        Send
      </button>
    </form>
  );
}
