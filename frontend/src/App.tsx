import { useChat } from "./hooks/useChat";
import ChatWindow from "./components/ChatWindow";
import DiagramsPanel from "./components/DiagramsPanel";
import styles from "./styles/layout.module.css";
import "./App.css";

export default function App() {
  const { messages, isLoading, thinkingStatus, sendMessage, latestToolData } = useChat();

  return (
    <div className={styles.appLayout}>
      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        thinkingStatus={thinkingStatus}
        onSend={sendMessage}
      />

      <DiagramsPanel toolData={latestToolData} />
    </div>
  );
}
