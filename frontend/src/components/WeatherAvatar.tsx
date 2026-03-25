import type { AvatarScenario } from "../lib/avatarLogic";
import styles from "./WeatherAvatar.module.css";

const AVATAR_IMAGES: Record<AvatarScenario, string> = {
    hot_sunny: "/assets/avatar/avatar_hot_sunny.png",
    mild_cloudy: "/assets/avatar/avatar_mild_cloudy.png",
    warm_rainy: "/assets/avatar/avatar_warm_rainy.png",
    cool_rainy_windy: "/assets/avatar/avatar_cool_rainy_windy.png",
    cold_snow: "/assets/avatar/avatar_cold_snow.png",
    cool_dry: "/assets/avatar/avatar_cool_dry.png",
    foggy: "/assets/avatar/avatar_foggy.png",
    pollution: "/assets/avatar/avatar_pollution.png",
};

const AVATAR_ALT: Record<AvatarScenario, string> = {
    hot_sunny: "Short, t-shirt, lunettes de soleil et casquette",
    mild_cloudy: "Pantalon et t-shirt",
    warm_rainy: "Avec un parapluie",
    cool_rainy_windy: "Imperméable jaune et capuche",
    cold_snow: "Manteau d'hiver, bonnet et écharpe",
    cool_dry: "Pull vert et pantalon",
    foggy: "Écharpe remontée dans le brouillard",
    pollution: "Masque anti-pollution",
};

interface Props {
    scenario: AvatarScenario;
}

export default function WeatherAvatar({ scenario }: Props) {
    return (
        <div className={styles.avatarContainer}>
            <img
                src={AVATAR_IMAGES[scenario]}
                alt={AVATAR_ALT[scenario]}
                className={styles.avatarImage}
                onError={(e) => {
                    // Fallback to mild_cloudy if specific avatar image is missing
                    const img = e.currentTarget;
                    if (!img.src.endsWith("avatar_mild_cloudy.png")) {
                        img.src = AVATAR_IMAGES.mild_cloudy;
                    }
                }}
            />
        </div>
    );
}
