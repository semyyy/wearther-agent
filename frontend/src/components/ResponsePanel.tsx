import { useMemo } from "react";
import type { ToolResponseData } from "../api/types";
import WeatherAvatar from "./WeatherAvatar";
import { determineAvatarScenario, type WeatherParams } from "../lib/avatarLogic";
import styles from "../styles/layout.module.css";

interface Props {
  text: string;
  isLoading: boolean;
  thinkingStatus: string;
  toolData?: ToolResponseData;
}

export default function ResponsePanel({ text, isLoading, thinkingStatus, toolData }: Props) {
  const scenario = useMemo(() => {
    if (!toolData || toolData.type !== "daily" || !toolData.data.data.length) {
      return null;
    }
    const entries = toolData.data.data;
    const hero =
      entries.find((e) => new Date(e.time).getHours() === 12) ?? entries[0];

    const params: WeatherParams = {
      temp_c: hero.temperature_celsius,
      condition_code: hero.weather_code,
      precip_probability: hero.precipitation_probability ?? 0,
      wind_kph: hero.wind_speed_knots * 1.852,
      uv_index: hero.uv_index ?? 0,
      is_day: hero.is_day !== undefined ? hero.is_day : true,
    };
    return determineAvatarScenario(params);
  }, [toolData]);

  return (
    <div className={styles.responsePanel}>
      <div className={styles.panelHeader}>
        <span className={styles.panelIcon}>&#128172;</span>
        <span className={styles.panelTitle}>Response</span>
      </div>
      <div className={styles.responseContent}>
        {/* Avatar — always visible */}
        <div className={styles.avatarSection}>
          {scenario ? (
            <WeatherAvatar scenario={scenario} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <span className={styles.avatarPlaceholderIcon}>&#9925;</span>
            </div>
          )}
        </div>

        {/* Text response */}
        {isLoading && (
          <div className={styles.thinkingStatus}>
            <span className={styles.thinkingDot} />
            <span className={styles.thinkingDot} />
            <span className={styles.thinkingDot} />
            <span className={styles.thinkingText}>{thinkingStatus}</span>
          </div>
        )}
        {text ? (
          <p className={styles.responseText}>{text}</p>
        ) : (
          !isLoading && (
            <p className={styles.placeholder}>
              Ask a weather question to see the response here.
            </p>
          )
        )}
      </div>
    </div>
  );
}
