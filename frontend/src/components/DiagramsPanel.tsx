import type { ToolResponseData } from "../api/types";
import WeatherCard from "./WeatherCard";
import WeatherFocusCard from "./WeatherFocusCard";
import MonthlyStatsCard from "./MonthlyStatsCard";
import styles from "../styles/layout.module.css";

interface Props {
  toolData?: ToolResponseData;
}

export default function DiagramsPanel({ toolData }: Props) {
  return (
    <div className={styles.diagramsPanel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelIcon}>&#128200;</span>
        <span className={styles.panelTitle}>Diagrams</span>
      </div>
      <div className={styles.diagramsContent}>
        {toolData ? (
          <>
            {toolData.type === "daily" && (
              toolData.data.focus && toolData.data.focus !== "all" ? (
                <WeatherFocusCard data={toolData.data} />
              ) : (
                <WeatherCard data={toolData.data} />
              )
            )}
            {toolData.type === "monthly" && (
              <MonthlyStatsCard data={toolData.data} />
            )}
          </>
        ) : (
          <p className={styles.placeholder}>
            Weather charts and visualizations will appear here.
          </p>
        )}
      </div>
    </div>
  );
}
