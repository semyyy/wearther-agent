# 🌤️ Spécification Fonctionnelle -- Avatar Dynamique selon la Météo

## 1. 🎯 Objectif

Afficher **le même homme (avatar unique)** dans l'écran météo.\
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
    -   Température
    -   Précipitation
    -   Soleil / UV
-   Règles simples avec priorités
-   Système de calques (layers)

### 🚀 V1

-   Gestion avancée du vent
-   Gestion détaillée neige
-   Mode nuit
-   Animations (fade transition)
-   Effets visuels (pluie / neige animée)

------------------------------------------------------------------------

## 3. 📡 Données d'Entrée (Contrat météo)

``` ts
{
  temp_c: number,
  condition_code: "CLEAR" | "CLOUDS" | "RAIN" | "DRIZZLE" | "THUNDER" | "SNOW" | "FOG" | "WINDY",
  precip_probability: number,
  wind_kph: number,
  uv_index: number,
  is_day: boolean
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
4.  Accessoires tête
5.  Lunettes
6.  Accessoires main
7.  Effets

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

## 6. ⚖️ Priorités

1.  Neige / Froid extrême
2.  Pluie + Vent fort
3.  Pluie
4.  Soleil / UV
5.  Température

------------------------------------------------------------------------

## 7. 🧱 Objet de Sortie

``` ts
type Look = {
  bottom: "short" | "pants",
  top: "tshirt" | "sweater" | "coat" | "raincoat",
  head: "none" | "cap" | "beanie" | "hood",
  eyes: "none" | "sunglasses",
  hand: "none" | "umbrella",
  effects?: ("rain" | "snow")[]
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
  UV_CAP: 7
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

### Effets (optionnel)

-   fx_rain.png
-   fx_snow.png

------------------------------------------------------------------------

## 10. 🧪 Tests

  Cas                   Input                           Résultat Attendu
  --------------------- ------------------------------- ------------------
  30°C, clear, UV 8     Short + Lunettes + Casquette    
  22°C, clouds          Pantalon + T-shirt              
  28°C, rain, wind 10   Short + Parapluie               
  15°C, rain, wind 35   Pantalon + Pull + Imperméable   
  1°C, snow             Manteau + Bonnet                
  12°C, fog             Pantalon + Pull                 

------------------------------------------------------------------------

# ✅ Résultat Attendu

Un système : - Stable - Paramétrable - Évolutif - Séparant logique
métier et UI - Facilement extensible

------------------------------------------------------------------------

## 11. 🗣️ Règle de Réponse de l'Agent (LLM)

Lorsqu'une question sur la météo est posée, le système (via le Coordinator Agent) doit :
1.  Répondre par **une seule et unique phrase**.
2.  Afficher l'avatar avec les vêtements adaptés à la situation décrite.
3.  Afficher les graphiques / la carte météo (WeatherCard ou WeatherFocusCard) associés à la demande.
