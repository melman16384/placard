# eInk-Display / Raspberry Pi

Vollständige Hardware-Bauanleitung mit interaktivem Schaltplan: **https://DEINE_DOMAIN.de/guide**

Diese Seite fasst die technischen Details für Entwickler zusammen.

---

## Hardware pro Display

| Komponente | Modell | Bezug | Preis (ca.) |
|---|---|---|---|
| Mikrocontroller | Raspberry Pi Zero 2 WH (mit Pins) | Reichelt, BerryBase | ~€ 20 |
| eInk-Display | Waveshare 7.5″ e-Paper HAT V2 (800×480, SW) | BerryBase, Eckstein | ~€ 55–65 |
| SD-Karte | 16 GB microSD Class 10 | Beliebig | ~€ 6 |
| Netzteil | USB-C 5V/2,5A | BerryBase, Reichelt | ~€ 10 |
| Gehäuse | Waveshare Pi Zero Case oder 3D-Druck | waveshare.com | ~€ 10–15 |

**Akku-Option:** PiSugar 3 (1 200 mAh, ~12–13h) für Zero 2W — oder USB-Powerbank 10 000 mAh (Always-on) für ~4–5 Tage. Kabelgebunden ist für Dauerinstallationen empfohlen.

> **Achtung:** PiSugar 3 **Plus** (5 000 mAh) passt NICHT zum Pi Zero — nur für Pi 4B/3B.

---

## Schaltplan — GPIO-Verbindungen

Das HAT steckt direkt auf den 40-Pin-Header. Keine einzelnen Kabel nötig.

| Pi-Pin | GPIO | HAT-Signal | Beschreibung |
|---|---|---|---|
| 1 | 3.3V | VCC | Stromversorgung |
| 6 | GND | GND | Masse |
| 11 | GPIO17 | RST | Display Reset |
| 18 | GPIO24 | BUSY | Busy-Signal (HAT → Pi) |
| 19 | GPIO10 (MOSI) | DIN | SPI Daten |
| 22 | GPIO25 | DC | Data / Command Select |
| 23 | GPIO11 (SCLK) | CLK | SPI Takt |
| 24 | GPIO8 (CE0) | CS | SPI Chip Select |

SPI-Bus: SPI0 (`/dev/spidev0.0`)

---

## Software-Stack auf dem Pi

| Schicht | Technologie |
|---|---|
| OS | Raspberry Pi OS Lite 64-bit |
| Sprache | Python 3 |
| Display-Treiber | waveshare_epd (epd7in5_V2) |
| HTTP-Client | requests |
| Bildverarbeitung | Pillow (PIL) |
| Prozessmanager | systemd |

---

## Display-API-Antwort

Der Pi fragt alle 60 Sekunden `/api/display/{roomId}` ab:

```json
{
  "room": {
    "id": "clxxx",
    "name": "Konferenzraum A",
    "capacity": 12,
    "floor": "2",
    "color": "#3B82F6",
    "msEmail": "kr-a@firma.de"
  },
  "source": "exchange",
  "isOccupied": true,
  "currentBooking": {
    "id": "...",
    "title": "Projektmeeting",
    "startTime": "2026-06-17T09:00:00Z",
    "endTime": "2026-06-17T10:00:00Z"
  },
  "upcomingBookings": [
    {
      "title": "Standup",
      "startTime": "2026-06-17T11:00:00Z",
      "endTime": "2026-06-17T11:30:00Z"
    }
  ]
}
```

---

## Raum-ID herausfinden

1. Admin-Panel → **Räume**
2. In der Zeile des gewünschten Raums auf **Display** klicken
3. ID aus der URL kopieren: `/display/**clxxxxxxxxxx**`
4. In der systemd-Service-Datei bei `Environment=ROOM_ID=` eintragen

---

## systemd-Service

Datei: `/etc/systemd/system/room-display.service`

```ini
[Unit]
Description=Raum-Display (eInk)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /home/pi/room_display.py
Restart=always
RestartSec=30
User=pi
Environment=ROOM_ID=clxxxxxxxxxx
Environment=SERVER_URL=https://DEINE_DOMAIN.de
Environment=INTERVAL=300
Environment=TZ=Europe/Berlin

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable room-display
sudo systemctl start room-display
journalctl -u room-display -f   # Logs beobachten
```

---

## Fehlersuche

| Problem | Ursache | Lösung |
|---|---|---|
| Display bleibt weiß | SPI nicht aktiviert | `raspi-config` → Interface Options → SPI |
| `ModuleNotFoundError: waveshare_epd` | Treiber fehlt | `pip3 install . --break-system-packages` in e-Paper/RaspberryPi_JetsonNano/python |
| „Verbindungsfehler" auf Display | WLAN/Server nicht erreichbar | `ping DEINE_DOMAIN.de` |
| Geisterbilder (alte Pixel) | Kein Full-Refresh | `epd.Clear()` vor erstem Display-Aufruf |
| ZIF-Kabel-Problem | Klemme nicht geschlossen | Klemme öffnen, Kabel neu einführen (goldene Kontakte von Riegel weg) |
