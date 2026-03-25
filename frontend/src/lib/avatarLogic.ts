/**
 * Avatar logic — determines the weather scenario key
 * based on meteorological data and the spec priority rules.
 *
 * Priority:
 *  1. Snow / Extreme Cold
 *  2. Air Quality (AQI > 150)
 *  3. Rain + Wind (strong)
 *  4. Rain (light wind)
 *  5. Visibility / Fog
 *  6. Sun / UV (modulated by cloud cover)
 *  7. Temperature (based on feels_like)
 */

export type AvatarScenario =
    | "hot_sunny"
    | "mild_cloudy"
    | "warm_rainy"
    | "cool_rainy_windy"
    | "cold_snow"
    | "cool_dry"
    | "foggy"
    | "pollution";

export interface WeatherParams {
    temp_c: number;
    feels_like_c: number;
    condition_code: number; // WMO code
    precip_probability: number;
    wind_kph: number;
    uv_index: number;
    is_day: boolean;
    cloud_cover_pct: number | null;
    visibility_km: number | null;
    dew_point_c: number | null;
    aqi_index: number;
}

const CONFIG = {
    HOT_TEMP: 26,
    MILD_TEMP: 18,
    COOL_TEMP: 10,
    RAIN_PROB_THRESHOLD: 40,
    WIND_UMBRELLA_LIMIT: 25,
    UV_SUNGLASSES: 6,
    UV_CAP: 7,
    AQI_MASK_LIGHT: 100,
    AQI_MASK_HEAVY: 150,
    VISIBILITY_FOG_KM: 1,
    DEW_POINT_FOG_DELTA: 2,
    CLOUD_CLEAR_MAX: 20,
    CLOUD_PARTIAL_MAX: 70,
};

export { CONFIG as AVATAR_CONFIG };

/** Drizzle (51-57), Rain (61-67, 80-82), Thunderstorm (95-99) */
function isRainyCode(code: number): boolean {
    return (
        (code >= 51 && code <= 57) ||
        (code >= 61 && code <= 67) ||
        (code >= 80 && code <= 82) ||
        (code >= 95 && code <= 99)
    );
}

/** Snow fall (71-77), Snow showers (85-86) */
function isSnowyCode(code: number): boolean {
    return (code >= 71 && code <= 77) || (code >= 85 && code <= 86);
}

/** Clear / mainly clear (0-1) */
function isClearCode(code: number): boolean {
    return code <= 1;
}

/** Fog codes (45, 48) */
function isFogCode(code: number): boolean {
    return code === 45 || code === 48;
}

export interface AvatarLook {
    scenario: AvatarScenario;
    bottom: "short" | "pants";
    top: "tshirt" | "sweater" | "coat" | "raincoat";
    head: "none" | "cap" | "beanie" | "hood";
    eyes: "none" | "sunglasses";
    hand: "none" | "umbrella";
    face: "none" | "mask_light" | "mask_heavy";
    neck: "none" | "scarf_up";
    effects: ("rain" | "snow" | "fog")[];
}

/** Determine clothing based on effective temperature */
function getClothingByTemp(effectiveTemp: number): { bottom: "short" | "pants"; top: "tshirt" | "sweater" | "coat" } {
    if (effectiveTemp >= CONFIG.HOT_TEMP) return { bottom: "short", top: "tshirt" };
    if (effectiveTemp >= CONFIG.MILD_TEMP) return { bottom: "pants", top: "tshirt" };
    if (effectiveTemp >= CONFIG.COOL_TEMP) return { bottom: "pants", top: "sweater" };
    return { bottom: "pants", top: "coat" };
}

export function determineAvatarLook(params: WeatherParams): AvatarLook {
    const {
        feels_like_c, condition_code, precip_probability,
        wind_kph, uv_index, is_day, cloud_cover_pct,
        visibility_km, dew_point_c, aqi_index, temp_c,
    } = params;

    // Use feels_like for clothing decisions
    const effectiveTemp = feels_like_c;
    const clothing = getClothingByTemp(effectiveTemp);

    const look: AvatarLook = {
        scenario: "mild_cloudy",
        bottom: clothing.bottom,
        top: clothing.top,
        head: "none",
        eyes: "none",
        hand: "none",
        face: "none",
        neck: "none",
        effects: [],
    };

    // Priority 1 — Snow / Extreme Cold
    if (isSnowyCode(condition_code) || effectiveTemp <= 2) {
        look.scenario = "cold_snow";
        look.top = "coat";
        look.bottom = "pants";
        look.head = "beanie";
        look.effects = isSnowyCode(condition_code) ? ["snow"] : [];
        // AQI mask overlay
        if (aqi_index > CONFIG.AQI_MASK_HEAVY) look.face = "mask_heavy";
        else if (aqi_index >= CONFIG.AQI_MASK_LIGHT) look.face = "mask_light";
        return look;
    }

    // Priority 2 — Severe Air Quality
    if (aqi_index > CONFIG.AQI_MASK_HEAVY) {
        look.scenario = "pollution";
        look.face = "mask_heavy";
        // still use temp-based clothing
        return look;
    }

    // Priority 3/4 — Rain
    const isRaining = isRainyCode(condition_code) || precip_probability >= CONFIG.RAIN_PROB_THRESHOLD;
    if (isRaining) {
        look.effects.push("rain");
        if (wind_kph >= CONFIG.WIND_UMBRELLA_LIMIT) {
            look.scenario = "cool_rainy_windy";
            look.top = "raincoat";
            look.head = "hood";
        } else {
            look.scenario = "warm_rainy";
            look.hand = "umbrella";
        }
        if (aqi_index >= CONFIG.AQI_MASK_LIGHT) look.face = aqi_index > CONFIG.AQI_MASK_HEAVY ? "mask_heavy" : "mask_light";
        return look;
    }

    // Priority 5 — Visibility / Fog
    const isFoggy = isFogCode(condition_code) ||
        (visibility_km != null && visibility_km < CONFIG.VISIBILITY_FOG_KM) ||
        (dew_point_c != null && Math.abs(temp_c - dew_point_c) <= CONFIG.DEW_POINT_FOG_DELTA && wind_kph < 10);
    if (isFoggy) {
        look.scenario = "foggy";
        look.neck = "scarf_up";
        look.eyes = "none"; // no sunglasses in fog
        look.effects.push("fog");
        if (aqi_index >= CONFIG.AQI_MASK_LIGHT) look.face = aqi_index > CONFIG.AQI_MASK_HEAVY ? "mask_heavy" : "mask_light";
        return look;
    }

    // Priority 6 — Sun / UV (modulated by cloud cover)
    const cloudPct = cloud_cover_pct ?? 0;
    if (is_day && (isClearCode(condition_code) || uv_index >= CONFIG.UV_SUNGLASSES)) {
        if (cloudPct <= CONFIG.CLOUD_CLEAR_MAX) {
            // Clear sky — full sun rules
            if (uv_index >= CONFIG.UV_SUNGLASSES) look.eyes = "sunglasses";
            if (uv_index >= CONFIG.UV_CAP) look.head = "cap";
        } else if (cloudPct <= CONFIG.CLOUD_PARTIAL_MAX) {
            // Partially cloudy — sunglasses if UV high, no cap
            if (uv_index >= CONFIG.UV_SUNGLASSES) look.eyes = "sunglasses";
        }
        // cloudPct > 70% → overcast, no sunglasses/cap

        if (effectiveTemp >= CONFIG.HOT_TEMP) {
            look.scenario = "hot_sunny";
        }
    }

    // Priority 7 — Temperature baseline scenario
    if (look.scenario === "mild_cloudy") {
        if (effectiveTemp >= CONFIG.HOT_TEMP) look.scenario = "hot_sunny";
        else if (effectiveTemp >= CONFIG.MILD_TEMP) look.scenario = "mild_cloudy";
        else if (effectiveTemp >= CONFIG.COOL_TEMP) look.scenario = "cool_dry";
        else look.scenario = "cold_snow";
    }

    // AQI light mask overlay
    if (aqi_index >= CONFIG.AQI_MASK_LIGHT) look.face = aqi_index > CONFIG.AQI_MASK_HEAVY ? "mask_heavy" : "mask_light";

    return look;
}

/** Backward-compatible helper that returns just the scenario key */
export function determineAvatarScenario(params: WeatherParams): AvatarScenario {
    return determineAvatarLook(params).scenario;
}
