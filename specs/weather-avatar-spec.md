# 🌤️ Spécification Fonctionnelle -- Avatar Dynamique selon la Météo

## 1. 🎯 Objectif

Afficher **le même homme (avatar unique)** sympathique, un peu rigolo, cartoon dans l'écran météo.\
Son apparence évolue automatiquement en fonction des conditions météo :

-   Température\
-   Pluie\
-   Vent\
-   Soleil / UV\
-   Neige

Éléments dynamiques :

-   Short / Pantalon\
-   T-shirt / Pull / Manteau / Imperméable\
-   Lunettes de soleil\
-   Casquette / Bonnet\
-   Parapluie

**Règle d'or absolue** : L'avatar DOIT obligatoirement avoir l'habit qui correspond à la situation de la météo. 
Par exemple :
- S'il fait chaud : il doit être habillé en short.
- S'il pleut : il porte un parapluie (ou un imperméable s'il y a trop de vent).
- S'il neige : il porte un manteau et un bonnet.
- Toutes les situations météorologiques possibles (chaud, froid, pluie, neige, soleil) doivent être traitées et se refléter visiblement sur la combinaison de vêtements de l'avatar.

------------------------------------------------------------------------

## 2. 📦 Périmètre

### ✅ MVP

-   1 avatar unique
-   Gestion basée sur :
    -   Température (avec feels_like)
    -   Précipitation
    -   Soleil / UV
    -   Couverture nuageuse
-   Règles simples avec priorités
-   Système de calques (layers)

### 🚀 V1

-   Gestion avancée du vent
-   Gestion détaillée neige
-   Mode nuit
-   Animations (fade transition)
-   Effets visuels (pluie / neige animée)
-   Qualité de l'air (masque anti-pollution)
-   Visibilité / Brouillard (écharpe, effets visuels)
-   Éphémérides (lever/coucher soleil, phases de lune)
-   Point de rosée (anticipation brouillard)

------------------------------------------------------------------------

## 3. 📡 Données d'Entrée (Contrat météo)

``` ts
{
  temp_c: number,
  feels_like_c: number,
  condition_code: "CLEAR" | "CLOUDS" | "RAIN" | "DRIZZLE" | "THUNDER" | "SNOW" | "FOG" | "WINDY",
  precip_probability: number,
  wind_kph: number,
  uv_index: number,
  is_day: boolean,
  cloud_cover_pct: number,
  visibility_km: number,
  dew_point_c: number,
  air_quality: {
    pm2_5: number,
    pm10: number,
    no2: number,
    ozone: number,
    aqi_index: number
  },
  ephemeris: {
    sunrise: string,       // ISO time "HH:mm"
    sunset: string,        // ISO time "HH:mm"
    moon_phase: "new" | "waxing_crescent" | "first_quarter" | "waxing_gibbous" | "full" | "waning_gibbous" | "last_quarter" | "waning_crescent"
  }
}
```

------------------------------------------------------------------------

## 4. 🧩 Architecture Visuelle

### 🎨 Approche recommandée : système de calques

L'avatar est composé de :

1.  man_base.png
2.  Calques superposés :
    -   Haut
    -   Bas
    -   Accessoires tête
    -   Lunettes
    -   Accessoire main
    -   Effets météo

### 🔢 Ordre de Superposition

1.  Base
2.  Haut
3.  Bas
4.  Cou (écharpe)
5.  Accessoires tête
6.  Lunettes / Masque
7.  Accessoires main
8.  Effets (pluie / neige / brouillard)

------------------------------------------------------------------------

## 5. 🧠 Règles Métier

### 5.1 Température

  Température   Bas        Haut
  ------------- ---------- ---------
  ≥ 26°C        Short      T-shirt
  18--25°C      Pantalon   T-shirt
  10--17°C      Pantalon   Pull
  \< 10°C       Pantalon   Manteau

------------------------------------------------------------------------

### 5.2 Pluie

Déclencheur : - condition_code ∈ {RAIN, DRIZZLE, THUNDER} OU -
precip_probability ≥ 40%

Règles : - wind_kph ≥ 25 → Imperméable / Capuche - Sinon → Parapluie

------------------------------------------------------------------------

### 5.3 Soleil / UV

Déclencheur : - is_day == true - ET (condition_code == CLEAR OU uv_index
≥ 6)

Actions : - Lunettes de soleil - Casquette si uv_index ≥ 7

------------------------------------------------------------------------

### 5.4 Neige / Froid Extrême

Déclencheur : - condition_code == SNOW OU - temp_c ≤ 2

Actions : - Bonnet - Manteau - Pas de parapluie

------------------------------------------------------------------------

### 5.5 Température Ressentie ("Feels like")

La température ressentie (`feels_like_c`) remplace `temp_c` pour le choix des vêtements lorsqu'elle est disponible.
Elle combine l'effet du vent (wind chill) et de l'humidité (heat index).

Règle : - Utiliser `feels_like_c` au lieu de `temp_c` dans les seuils du §5.1 pour déterminer le haut et le bas.
- Exemple : si `temp_c = 12°C` mais `feels_like_c = 7°C` → l'avatar porte un Manteau (seuil < 10°C).

------------------------------------------------------------------------

### 5.6 Qualité de l'Air

Déclencheur : - `air_quality.aqi_index` ≥ 100 (catégorie "Mauvais pour les groupes sensibles" et au-delà)

Actions :
- `aqi_index` 100–150 → Masque anti-pollution (léger)
- `aqi_index` > 150 → Masque anti-pollution (renforcé)

Note : Open-Meteo propose une API dédiée pour les indices de pollution (PM2.5, PM10, NO2, ozone).

------------------------------------------------------------------------

### 5.7 Visibilité & Brouillard

Déclencheur : - `visibility_km` < 1 OU (`condition_code == FOG`)

Actions :
- Écharpe remontée / col relevé (indicateur visuel de brouillard)
- Pas de lunettes de soleil (même si UV élevé)

Complément : le Point de Rosée (`dew_point_c`) peut être utilisé pour anticiper le brouillard :
- Si `dew_point_c` est proche de `temp_c` (écart ≤ 2°C) et `wind_kph` < 10 → risque de brouillard.

------------------------------------------------------------------------

### 5.8 Couverture Nuageuse

La valeur `cloud_cover_pct` permet d'affiner le comportement soleil/UV (§5.3) :

- `cloud_cover_pct` ≤ 20% → Ciel clair : règles soleil/UV appliquées normalement
- `cloud_cover_pct` 21–70% → Partiellement nuageux : lunettes de soleil si UV ≥ 6, pas de casquette
- `cloud_cover_pct` > 70% → Couvert : pas de lunettes de soleil, pas de casquette (sauf pluie)

------------------------------------------------------------------------

### 5.9 Éphémérides

Les données `ephemeris.sunrise` et `ephemeris.sunset` permettent de déterminer `is_day` de manière précise.

Utilisation :
- Affichage des heures de lever/coucher du soleil dans la réponse de l'agent.
- `ephemeris.moon_phase` : affichée dans la réponse en mode nuit (V1), influence potentielle sur l'ambiance visuelle de l'avatar (fond/effets).

------------------------------------------------------------------------

## 6. ⚖️ Priorités

1.  Neige / Froid extrême
2.  Qualité de l'air (AQI > 150)
3.  Pluie + Vent fort
4.  Pluie
5.  Visibilité / Brouillard
6.  Soleil / UV (modulé par couverture nuageuse)
7.  Température (basée sur feels_like_c)

------------------------------------------------------------------------

## 7. 🧱 Objet de Sortie

``` ts
type Look = {
  bottom: "short" | "pants",
  top: "tshirt" | "sweater" | "coat" | "raincoat",
  head: "none" | "cap" | "beanie" | "hood",
  eyes: "none" | "sunglasses",
  hand: "none" | "umbrella",
  face: "none" | "mask_light" | "mask_heavy",
  neck: "none" | "scarf_up",
  effects?: ("rain" | "snow" | "fog")[]
}
```

------------------------------------------------------------------------

## 8. ⚙️ Configuration

``` ts
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
  CLOUD_PARTIAL_MAX: 70
}
```

------------------------------------------------------------------------

## 9. 🎭 Assets

### Base

-   man_base.png

### Tops

-   top_tshirt.png
-   top_sweater.png
-   top_coat.png
-   top_raincoat.png

### Bottoms

-   bottom_short.png
-   bottom_pants.png

### Accessoires

-   access_sunglasses.png
-   access_cap.png
-   access_beanie.png
-   access_umbrella.png

### Visage / Cou

-   face_mask_light.png
-   face_mask_heavy.png
-   neck_scarf_up.png

### Effets (optionnel)

-   fx_rain.png
-   fx_snow.png
-   fx_fog.png

------------------------------------------------------------------------

## 10. 🧪 Tests

  Cas                                        Input                                              Résultat Attendu
  ------------------------------------------ -------------------------------------------------- ------------------------------------
  30°C, clear, UV 8                          Short + Lunettes + Casquette                       ✅
  22°C, clouds                               Pantalon + T-shirt                                 ✅
  28°C, rain, wind 10                        Short + Parapluie                                  ✅
  15°C, rain, wind 35                        Pantalon + Pull + Imperméable                      ✅
  1°C, snow                                  Manteau + Bonnet                                   ✅
  12°C, fog                                  Pantalon + Pull                                    ✅
  12°C feels_like 7°C, clear                 Pantalon + Manteau (feels_like < 10)               ✅
  25°C, AQI 120                              Masque léger                                       ✅
  25°C, AQI 180                              Masque renforcé                                    ✅
  10°C, fog, visibility 0.5km               Pantalon + Pull + Écharpe + pas de lunettes        ✅
  22°C, clear, cloud_cover 50%              Pantalon + T-shirt + Lunettes (UV≥6) sans casquette✅
  22°C, clear, cloud_cover 90%              Pantalon + T-shirt, pas de lunettes                ✅
  8°C, dew_point 7°C, wind 5kph            Pantalon + Manteau + Écharpe (risque brouillard)   ✅

------------------------------------------------------------------------

# ✅ Résultat Attendu

Un système : - Stable - Paramétrable - Évolutif - Séparant logique
métier et UI - Facilement extensible

------------------------------------------------------------------------

## 11. 🖥️ Layout de l'Interface

L'interface principale est divisée en **2 zones distinctes**, **sans headers superflus** :

- **Pas de header global** "Weather Assistant" : l'espace est entièrement dédié au contenu.
- **Pas de header "Chat"** ni de header "Diagrams" : les zones parlent d'elles-mêmes, les headers sont supprimés pour maximiser l'espace utile.
- La zone **Chat** (~25%) inclut l'avatar directement dans les réponses du chat.
- La zone **Diagrammes occupe 75% de la largeur** de l'écran (zone principale).
- ⚠️ **Le panel Réponse séparé est supprimé.** L'avatar et la réponse de l'agent sont intégrés directement dans le flux de conversation du chat.

```
┌────────────┬─────────────────────────────────────────────────────┐
│            │                                                     │
│   CHAT     │              DIAGRAMMES                             │
│   (~25%)   │              (75% écran)                            │
│            │                                                     │
│  Messages  │  - Graphiques météo                                 │
│  utilisat. │  - WeatherCard                                      │
│            │  - Carte / Charts                                   │
│  [Avatar]  │                                                     │
│  Réponse   │                                                     │
│  formatée  │                                                     │
│  de l'agent│                                                     │
│            │                                                     │
│  [Input]   │                                                     │
└────────────┴─────────────────────────────────────────────────────┘
```

### 11.0 Suppression des headers

- **Header global (Navbar)** : **SUPPRIMÉ**. Il prenait de la place inutilement. L'application est immersive et plein écran.
- **Header "Chat"** (icône + titre "Chat") : **SUPPRIMÉ**. La zone chat est identifiable par son contenu (messages + input).
- **Header "Diagrams"** (icône + titre "Diagrams") : **SUPPRIMÉ**. La zone diagrammes est identifiable par ses graphiques.
- L'espace récupéré est redistribué au contenu (messages, graphiques).

### 11.1 Zone Chat (gauche, ~25%)

- Zone de conversation / saisie de l'utilisateur
- Historique des messages envoyés
- Input texte en bas de la zone
- **Pas de header** : le chat commence directement par les messages
- **L'avatar est affiché directement dans chaque réponse de l'agent** (au-dessus du texte de réponse), avec les vêtements adaptés à la météo (cf. §5)
- L'avatar se met à jour à chaque nouvelle réponse météo

### 11.2 Format des réponses dans le Chat

Les réponses de l'agent dans le chat doivent être **bien formatées et agréables à lire** :
- L'**avatar** apparaît en tête de la réponse (inline dans le message)
- Le texte de réponse est **structuré et visuellement clair** : utilisation de mise en forme (gras, icônes météo, couleurs) pour rendre la lecture agréable
- Ton **sympathique et engageant**, cohérent avec le style cartoon de l'avatar
- Informations complémentaires (résumé météo, alertes) affichées de manière concise et lisible

### 11.3 Zone Diagrammes (droite, **75% de l'écran**)

- **Occupe 75% de la largeur** de l'écran pour maximiser la lisibilité des graphiques
- **Pas de header** : les graphiques commencent directement, sans titre "Diagrams" en haut
- Affiche les graphiques météo (température, humidité, vent, précipitations)
- Affiche les cartes météo (WeatherCard, WeatherFocusCard)
- Zone scrollable indépendamment pour parcourir les différents graphiques
- Les visualisations se mettent à jour automatiquement en fonction de la réponse de l'agent

### 11.5 Diagrammes par Type de Donnée

Chaque type de donnée météo dispose de son **propre diagramme dédié** dans la zone Diagrammes (75%).
Les diagrammes sont affichés dans une grille responsive et se mettent à jour en temps réel.

#### 11.5.1 Température & Température Ressentie

- **Type** : Line Chart (double courbe)
- **Courbe 1** : `temp_c` — trait plein
- **Courbe 2** : `feels_like_c` — trait pointillé
- **Axe X** : Heures (vue journée) ou Jours (vue semaine)
- **Axe Y** : °C
- **Couleurs** : dégradé bleu (froid) → orange → rouge (chaud)
- **Zones colorées** : bandes horizontales pour les seuils (< 10°C bleu, 10-17°C vert, 18-25°C jaune, ≥ 26°C rouge)
- **Tooltip** : température exacte + feels_like + écart

#### 11.5.2 Précipitations

- **Type** : Bar Chart (barres verticales) + Line overlay
- **Barres** : quantité de précipitations (mm/h)
- **Ligne superposée** : `precip_probability` (%)
- **Axe X** : Heures / Jours
- **Axe Y gauche** : mm/h
- **Axe Y droit** : % probabilité
- **Couleurs barres** : bleu clair (bruine) → bleu foncé (forte pluie) → blanc (neige)
- **Icônes** : gouttes / flocons selon `condition_code`

#### 11.5.3 Vent

- **Type** : Line Chart + flèches directionnelles
- **Courbe** : `wind_kph`
- **Axe X** : Heures / Jours
- **Axe Y** : km/h
- **Seuils visuels** : ligne pointillée à 25 km/h (seuil parapluie/imperméable)
- **Flèches** : direction du vent affichée à intervalles réguliers sur la courbe
- **Couleurs** : vert (calme) → jaune (modéré) → rouge (fort, ≥ 25 km/h)

#### 11.5.4 Indice UV

- **Type** : Area Chart (courbe remplie)
- **Courbe** : `uv_index` au fil de la journée
- **Axe X** : Heures (06h–20h, calé sur sunrise/sunset)
- **Axe Y** : Index UV (0–11+)
- **Zones colorées** :
  - 0–2 : vert (faible)
  - 3–5 : jaune (modéré)
  - 6–7 : orange (élevé) — seuil lunettes
  - 8–10 : rouge (très élevé) — seuil casquette
  - 11+ : violet (extrême)
- **Marqueurs** : lignes pointillées aux seuils CONFIG (UV_SUNGLASSES=6, UV_CAP=7)

#### 11.5.5 Qualité de l'Air (AQI)

- **Type** : Gauge Chart (jauge circulaire) + Bar Chart détaillé
- **Jauge** : `aqi_index` global avec zones colorées :
  - 0–50 : vert (bon)
  - 51–100 : jaune (modéré)
  - 101–150 : orange (mauvais pour sensibles) — seuil masque léger
  - 151–200 : rouge (mauvais) — seuil masque renforcé
  - 201–300 : violet (très mauvais)
  - 300+ : marron (dangereux)
- **Barres détaillées** : 4 barres horizontales pour PM2.5, PM10, NO2, Ozone avec seuils OMS
- **Source** : API Open-Meteo Air Quality

#### 11.5.6 Couverture Nuageuse

- **Type** : Area Chart (courbe remplie semi-transparente)
- **Courbe** : `cloud_cover_pct` (0–100%)
- **Axe X** : Heures / Jours
- **Axe Y** : % couverture
- **Zones** :
  - 0–20% : fond clair (ciel dégagé)
  - 21–70% : fond gris léger (partiellement nuageux)
  - 71–100% : fond gris foncé (couvert)
- **Icônes** : soleil / soleil-nuage / nuage selon le palier

#### 11.5.7 Visibilité

- **Type** : Line Chart
- **Courbe** : `visibility_km`
- **Axe X** : Heures / Jours
- **Axe Y** : km (échelle log si nécessaire pour distinguer les faibles valeurs)
- **Seuil critique** : ligne rouge pointillée à 1 km (seuil brouillard)
- **Zone danger** : fond rouge semi-transparent sous 1 km
- **Couleurs** : rouge (< 1 km) → orange (1–5 km) → vert (> 5 km)

#### 11.5.8 Point de Rosée

- **Type** : Line Chart (double courbe)
- **Courbe 1** : `temp_c` — trait plein
- **Courbe 2** : `dew_point_c` — trait pointillé bleu
- **Zone de risque** : quand l'écart temp – dew_point ≤ 2°C, zone surlignée en gris (risque brouillard)
- **Axe X** : Heures / Jours
- **Axe Y** : °C
- **Tooltip** : temp, dew_point, écart, indicateur "risque brouillard" si applicable

#### 11.5.9 Éphémérides

- **Type** : Arc / Timeline visuel
- **Arc solaire** : demi-cercle montrant la trajectoire du soleil entre `sunrise` et `sunset`
  - Position actuelle du soleil sur l'arc
  - Durée du jour affichée au centre
  - Heures de lever / coucher aux extrémités
- **Phase de lune** : icône visuelle de la phase (`moon_phase`) avec libellé
- **Données** : prochains lever/coucher, durée nuit, % illumination lune

#### 11.5.10 Disposition des Diagrammes

```
┌─────────────────────────────────────────────────────────────┐
│                    ZONE DIAGRAMMES (75%)                     │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  Température & Ressentie│  │  Précipitations          │  │
│  │  (Line Chart)           │  │  (Bar + Line)            │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  Vent                   │  │  Indice UV               │  │
│  │  (Line + Flèches)      │  │  (Area Chart)            │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  Qualité de l'Air (AQI) │  │  Couverture Nuageuse     │  │
│  │  (Gauge + Barres)       │  │  (Area Chart)            │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  Visibilité             │  │  Point de Rosée          │  │
│  │  (Line Chart)           │  │  (Line Chart double)     │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Éphémérides (Arc solaire + Phase de lune)            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### 11.5.11 Règles d'affichage

- Les diagrammes sont affichés en **grille 2 colonnes** sur écran large
- Sur tablette : **1 colonne**
- Chaque diagramme possède un **header** avec titre + icône + valeur actuelle
- **Affichage conditionnel** : seuls les diagrammes pertinents à la réponse de l'agent sont affichés
  - Exemple : si la question porte sur "est-ce qu'il va pleuvoir ?", afficher en priorité Précipitations + Vent + Couverture Nuageuse
  - L'agent décide quels diagrammes afficher via le champ `diagrams` dans sa réponse
- **Période** : chaque diagramme supporte les vues Journée (24h) et Semaine (7j), synchronisées
- **Interactivité** : hover/tooltip sur chaque point de donnée, zoom possible

### 11.4 Comportement responsive

- Sur écran large (>= 1280px) : 2 zones côte à côte (25% | 75%), sans aucun header
- Sur écran moyen (768px-1279px) : 2 lignes — Chat en haut, Diagrammes pleine largeur en bas, sans headers
- Sur mobile (< 768px) : Empilement vertical (Chat -> Diagrammes), sans headers
- L'application occupe 100% de la hauteur de l'écran (full viewport)

------------------------------------------------------------------------

## 12. 🗣️ Règle de Réponse de l'Agent (LLM)

Lorsqu'une question sur la météo est posée, le système (via le Coordinator Agent) doit :
1.  Répondre avec un **message bien formaté et agréable** directement dans le chat (cf. §11.2) : texte structuré, icônes, mise en forme claire.
2.  **Répondre dans la langue de la demande** : si l'utilisateur pose sa question en français, la réponse est en français ; en anglais, la réponse est en anglais ; etc.
3.  Afficher l'avatar avec les vêtements adaptés à la situation décrite, **intégré dans le message du chat** (cf. §11.1).
4.  Afficher les graphiques / la carte météo (WeatherCard ou WeatherFocusCard) associés à la demande (zone Diagrammes 75%, cf. §11.3).
