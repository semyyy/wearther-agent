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

## 11. 🖥️ Layout de l'Interface

L'interface principale est divisée en **2 zones distinctes** :

- La zone **Chat** (~25%) inclut l'avatar directement dans les réponses du chat.
- La zone **Diagrammes occupe 75% de la largeur** de l'écran (zone principale).
- ⚠️ **Le panel Réponse séparé est supprimé.** L'avatar et la réponse de l'agent sont intégrés directement dans le flux de conversation du chat.

```
┌──────────────────────────────────────────────────────────────────┐
│                         HEADER / Navbar                          │
├────────────┬─────────────────────────────────────────────────────┤
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
├────────────┴─────────────────────────────────────────────────────┤
│                        FOOTER (optionnel)                        │
└──────────────────────────────────────────────────────────────────┘
```

### 11.1 Zone Chat (gauche, ~25%)

- Zone de conversation / saisie de l'utilisateur
- Historique des messages envoyés
- Input texte en bas de la zone
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
- Affiche les graphiques météo (température, humidité, vent, précipitations)
- Affiche les cartes météo (WeatherCard, WeatherFocusCard)
- Zone scrollable indépendamment pour parcourir les différents graphiques
- Les visualisations se mettent à jour automatiquement en fonction de la réponse de l'agent

### 11.4 Comportement responsive

- Sur écran large (>= 1280px) : 2 zones côte à côte (25% | 75%)
- Sur écran moyen (768px-1279px) : 2 lignes — Chat en haut, Diagrammes pleine largeur en bas
- Sur mobile (< 768px) : Empilement vertical (Chat -> Diagrammes)

------------------------------------------------------------------------

## 12. 🗣️ Règle de Réponse de l'Agent (LLM)

Lorsqu'une question sur la météo est posée, le système (via le Coordinator Agent) doit :
1.  Répondre avec un **message bien formaté et agréable** directement dans le chat (cf. §11.2) : texte structuré, icônes, mise en forme claire.
2.  **Répondre dans la langue de la demande** : si l'utilisateur pose sa question en français, la réponse est en français ; en anglais, la réponse est en anglais ; etc.
3.  Afficher l'avatar avec les vêtements adaptés à la situation décrite, **intégré dans le message du chat** (cf. §11.1).
4.  Afficher les graphiques / la carte météo (WeatherCard ou WeatherFocusCard) associés à la demande (zone Diagrammes 75%, cf. §11.3).
