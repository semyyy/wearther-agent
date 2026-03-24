import { useChat } from "./hooks/useChat";
import ChatWindow from "./components/ChatWindow";
import ResponsePanel from "./components/ResponsePanel";
import DiagramsPanel from "./components/DiagramsPanel";
import styles from "./styles/layout.module.css";
import "./App.css";

export default function App() {
  const { messages, isLoading, thinkingStatus, sendMessage, latestResponse, latestToolData } = useChat();

  return (
    <div className={styles.appLayout}>
      <header className={styles.appHeader}>
        <span className={styles.appHeaderIcon}>&#9925;</span>
        <span className={styles.appHeaderTitle}>Weather Assistant</span>
      </header>

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        thinkingStatus={thinkingStatus}
        onSend={sendMessage}
      />

      <ResponsePanel
        text={latestResponse}
        isLoading={isLoading}
        thinkingStatus={thinkingStatus}
        toolData={latestToolData}
      />

      <DiagramsPanel toolData={latestToolData} />
    </div>
  );
}
