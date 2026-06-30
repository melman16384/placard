# Placard — Brand Identity

## Name

**Placard** — englisch/französisch für *Aushang*, *Schild*, *Anschlag*.

Ein Placard ist wortwörtlich ein Schild, das an einer Tür oder Wand befestigt wird, um Information öffentlich auszuhängen — genau das, was dieses System physisch tut. Das eInk-Display an der Besprechungsraumtür *ist* ein Placard.

Der Name ist kurz, international verständlich, in keiner relevanten Software-Kategorie als Marke vergeben und funktioniert auf Deutsch wie auf Englisch.

---

## Logo

Das Logomark besteht aus einem abgerundeten Rechteck mit einem Blau-Violett-Verlauf. Innen: drei horizontale Linien (stehen für Kalenderinhalte auf dem Display) und ein grüner Status-Dot oben rechts (zeigt Verfügbarkeit an).

Das Logo ist als React-Komponente implementiert und rendert als SVG in beliebiger Größe ohne Qualitätsverlust.

**Datei:** `src/components/PlacardLogo.tsx`

```tsx
// Verwendung
import { PlacardLogo } from '@/components/PlacardLogo'

<PlacardLogo size={32} />   // Navbar
<PlacardLogo size={56} />   // Login-Seite
```

**Favicon:** `public/favicon.svg` — vereinfachte Version desselben Marks für Browser-Tabs.

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

Diese Farben werden nicht überschrieben — sie bleiben als Tailwind-Standard.

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
| Card-Border | `blue-100` → `#E5E7FF` | Leicht getönte Ränder |

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

## Implementierung

| Datei | Inhalt |
|---|---|
| `src/app/globals.css` | Blue-Palette-Override, Page-Background (`#F8F9FF`) |
| `src/components/PlacardLogo.tsx` | SVG-Logomark als React-Komponente |
| `public/favicon.svg` | Browser-Tab-Icon (32×32 SVG) |
| `src/app/layout.tsx` | Favicon-Referenz, Seitentitel |
| `src/components/Navbar.tsx` | Logo + Wortmarke in der Navigationsleiste |
| `src/app/(auth)/login/page.tsx` | Logo-Einstieg auf der Login-Seite |
