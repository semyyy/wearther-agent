import { useMemo } from "react";
import type { ChatMessage } from "../api/types";
import WeatherAvatar from "./WeatherAvatar";
import { determineAvatarScenario, type WeatherParams } from "../lib/avatarLogic";
import styles from "../styles/chat.module.css";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  const scenario = useMemo(() => {
    if (isUser || !message.toolData || message.toolData.type !== "daily") return null;
    const entries = message.toolData.data.data;
    if (!entries.length) return null;
    const hero =
      entries.find((e) => new Date(e.time).getHours() === 12) ?? entries[0];
    const params: WeatherParams = {
      temp_c: hero.temperature_celsius,
      feels_like_c: hero.feels_like_celsius ?? hero.temperature_celsius,
      condition_code: hero.weather_code,
      precip_probability: hero.precipitation_probability ?? 0,
      wind_kph: hero.wind_speed_knots * 1.852,
      uv_index: hero.uv_index ?? 0,
      is_day: hero.is_day !== undefined ? hero.is_day : true,
      cloud_cover_pct: hero.cloud_cover_percent ?? null,
      visibility_km: hero.visibility_km ?? null,
      dew_point_c: hero.dew_point_celsius ?? null,
      aqi_index: hero.air_quality?.aqi ?? 0,
    };
    return determineAvatarScenario(params);
  }, [isUser, message.toolData]);

  if (isUser) {
    return (
      <div className={`${styles.messageRow} ${styles.messageRowUser}`}>
        <div className={`${styles.bubble} ${styles.bubbleUser}`}>
          {message.text}
        </div>
      </div>
    );
  }

  // Assistant message
  return (
    <div className={`${styles.messageRow} ${styles.messageRowAssistant}`}>
      <div className={`${styles.bubble} ${styles.bubbleAssistant} ${scenario ? styles.bubbleWithAvatar : ""}`}>
        {scenario && (
          <div className={styles.avatarInline}>
            <WeatherAvatar scenario={scenario} />
          </div>
        )}
        <div className={styles.assistantText}>
          {message.text || (message.isStreaming ? "..." : "")}
        </div>
      </div>
    </div>
  );
}
