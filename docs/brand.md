# Placard — Brand Identity

## Name

**Placard** — englisch/französisch für *Aushang*, *Schild*, *Anschlag*.

Ein Placard ist wortwörtlich ein Schild, das an einer Tür oder Wand befestigt wird, um Information öffentlich auszuhängen — genau das, was dieses System physisch tut. Das eInk-Display an der Besprechungsraumtür *ist* ein Placard.

Der Name ist kurz, international verständlich, in keiner relevanten Software-Kategorie als Marke vergeben und funktioniert auf Deutsch wie auf Englisch.

---

## Logo

Das Logomark besteht aus einem abgerundeten Rechteck mit einem Blau-Violett-Verlauf. Innen: drei horizontale Linien (stehen für Kalenderinhalte auf dem Display) und ein grüner Status-Dot oben rechts (zeigt Verfügbarkeit an).

### Varianten

#### Standard — Farbig horizontal

![Placard Logo horizontal farbig](brand/logo-horizontal.svg)

> Standardversion für helle Hintergründe — README, Dokumentation, Präsentationen.

[Download logo-horizontal.svg](brand/logo-horizontal.svg)

---

#### Logomark — Icon only

![Placard Logomark](brand/logo-mark.svg)

> Für kleine Flächen: App-Icon, Favicons, quadratische Platzhalter.

[Download logo-mark.svg](brand/logo-mark.svg)

---

#### Weiß — Für farbige oder dunkle Hintergründe

> *Vorschau auf passendem Hintergrund:*

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="brand/logo-white.svg">
  <img src="brand/logo-white.svg" alt="Placard Logo weiß" style="background: linear-gradient(135deg, #6B75FF, #9B6BF5); padding: 20px; border-radius: 12px; display: block;">
</picture>

[Download logo-white.svg](brand/logo-white.svg)

---

#### Monochrom — Für Druck / Einzelfarbe

![Placard Logo monochrom](brand/logo-mono.svg)

> Für einfarbigen Druck, Stempel, dunkle Siebdruck-Anwendungen.

[Download logo-mono.svg](brand/logo-mono.svg)

---

### In der App

Das Logo ist als React-Komponente implementiert und rendert als SVG in beliebiger Größe verlustfrei.

**Datei:** `src/components/PlacardLogo.tsx`

```tsx
import { PlacardLogo } from '@/components/PlacardLogo'

<PlacardLogo size={28} />   // Navbar
<PlacardLogo size={56} />   // Login-Seite
```

**Favicon:** `public/favicon.svg`

---

## Farbpalette

### Primärfarbe

| Token | Hex | Verwendung |
|---|---|---|
| `blue-500` | `#5B65F5` | Akzente, Links, Focus-Ringe |
| `blue-600` | `#4A55E8` | Primäre Buttons, aktive Nav-Links |
| `blue-700` | `#3A44D4` | Hover auf Buttons |

Die Tailwind-`blue-*`-Palette wurde in `globals.css` auf die Markenfarbe überschrieben — alle bestehenden `bg-blue-*`, `text-blue-*`, `border-blue-*` Klassen im gesamten UI nehmen automatisch diese Werte an.

### Logo-Gradient

| Stop | Hex |
|---|---|
| Start (0 %) | `#6B75FF` — helles Indigo |
| Ende (100 %) | `#9B6BF5` — Violett |

### Vollständige Blue-Skala

| Tailwind-Klasse | Hex | Rolle |
|---|---|---|
| `blue-50` | `#F2F3FF` | Hover-Hintergründe |
| `blue-100` | `#E5E7FF` | Aktive Nav-Hintergründe, Badges |
| `blue-200` | `#CACFFF` | Borders, Trennlinien |
| `blue-300` | `#A8AEFF` | Dekorative Akzente |
| `blue-400` | `#8088FF` | Icons, sekundäre Akzente |
| `blue-500` | `#5B65F5` | Primärfarbe |
| `blue-600` | `#4A55E8` | Buttons, CTAs |
| `blue-700` | `#3A44D4` | Hover-Zustände |
| `blue-800` | `#2B34B0` | — |
| `blue-900` | `#1D2480` | — |

### Statusfarben

| Status | Tailwind | Hex | Bedeutung |
|---|---|---|---|
| Verfügbar | `green-500` | `#22C55E` | Raum frei |
| Belegt | `red-500` | `#EF4444` | Raum besetzt |
| Bald frei | `amber-500` | `#F59E0B` | Buchung endet bald |
| Logo-Dot | — | `#22C55E` | Aktiver Status-Indikator |

### Hintergrund & Oberfläche

| Rolle | Hex | Beschreibung |
|---|---|---|
| Page-Background | `#F8F9FF` | Minimal blau getönt, kein totes Grau |
| Card-Surface | `#FFFFFF` | Weiße Karten auf dem Hintergrund |
| Card-Border | `#E5E7FF` | Leicht getönte Ränder (`blue-100`) |

---

## Typografie

Schriftart: **Geist** (by Vercel), Variable Font.

Eingebunden über `next/font/google` in `src/app/layout.tsx`. Kein System-Fallback-Abhängigkeit im Build.

---

## Ton & Ansprache

Placard ist ein Infrastruktur-Tool für Büros. Die Sprache im Frontend ist:

- **Deutsch** (Zielgruppe: deutschsprachige Unternehmen)
- **Direkt und knapp** — keine Marketing-Sprache
- **Technisch präzise** wo nötig (Raum-IDs, API-Pfade)
- Keine Emojis in der UI

---

## Repository

[https://github.com/melman16384/placard](https://github.com/melman16384/placard)

---

## Implementierung

| Datei | Inhalt |
|---|---|
| `src/app/globals.css` | Blue-Palette-Override, Page-Background (`#F8F9FF`) |
| `src/components/PlacardLogo.tsx` | SVG-Logomark als React-Komponente |
| `public/favicon.svg` | Browser-Tab-Icon (32×32 SVG) |
| `docs/brand/logo-horizontal.svg` | Farbiges Logo mit Wortmarke |
| `docs/brand/logo-mark.svg` | Farbiges Logomark ohne Wortmarke |
| `docs/brand/logo-white.svg` | Weiße Version für dunkle Hintergründe |
| `docs/brand/logo-mono.svg` | Monochrome Version für Druck |
| `src/app/layout.tsx` | Favicon-Referenz, Seitentitel |
| `src/components/Navbar.tsx` | Logo + Wortmarke in der Navigationsleiste |
| `src/app/(auth)/login/page.tsx` | Logo-Einstieg auf der Login-Seite |
