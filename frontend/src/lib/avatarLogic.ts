/**
 * Avatar logic — determines the weather scenario key
 * based on meteorological data and the spec priority rules.
 *
 * Priority:
 *  1. Snow / Extreme Cold
 *  2. Rain + Wind (strong)
 *  3. Rain (light wind)
 *  4. Sun / UV
 *  5. Temperature
 */

export type AvatarScenario =
    | "hot_sunny"
    | "mild_cloudy"
    | "warm_rainy"
    | "cool_rainy_windy"
    | "cold_snow"
    | "cool_dry";

export interface WeatherParams {
    temp_c: number;
    condition_code: number; // WMO code
    precip_probability: number;
    wind_kph: number;
    uv_index: number;
    is_day: boolean;
}

const CONFIG = {
    HOT_TEMP: 26,
    MILD_TEMP: 18,
    COOL_TEMP: 10,
    RAIN_PROB_THRESHOLD: 40,
    WIND_UMBRELLA_LIMIT: 25,
    UV_SUNGLASSES: 6,
    UV_CAP: 7,
};

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

export function determineAvatarScenario(params: WeatherParams): AvatarScenario {
    const { temp_c, condition_code, precip_probability, wind_kph, uv_index, is_day } = params;

    // Priority 1 — Snow / Extreme Cold (≤2°C or snow code)
    if (isSnowyCode(condition_code) || temp_c <= 2) {
        return "cold_snow";
    }

    // Priority 2/3 — Rain
    const isRaining = isRainyCode(condition_code) || precip_probability >= CONFIG.RAIN_PROB_THRESHOLD;
    if (isRaining) {
        // Priority 2 — Rain + strong wind → raincoat
        if (wind_kph >= CONFIG.WIND_UMBRELLA_LIMIT) {
            return "cool_rainy_windy";
        }
        // Priority 3 — Rain with light wind → umbrella
        return "warm_rainy";
    }

    // Priority 4 — Sun / UV
    if (is_day && (isClearCode(condition_code) || uv_index >= CONFIG.UV_SUNGLASSES)) {
        if (temp_c >= CONFIG.HOT_TEMP) {
            return "hot_sunny";
        }
    }

    // Priority 5 — Temperature baseline
    if (temp_c >= CONFIG.HOT_TEMP) {
        return "hot_sunny";
    }
    if (temp_c >= CONFIG.MILD_TEMP) {
        return "mild_cloudy";
    }
    if (temp_c >= CONFIG.COOL_TEMP) {
        return "cool_dry";
    }

    // Very cold but not snowing → cold_snow (coat + beanie)
    return "cold_snow";
}
