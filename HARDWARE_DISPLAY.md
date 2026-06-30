# Raum-Display Bauplan — Raspberry Pi + eInk

## Ziel
Joan-ähnliches Raumdisplay mit mindestens 1 Woche Akkulaufzeit.
Zeigt Belegungsstatus, aktuelle Buchung und Tagesplan.

---

## Empfohlene Hardware pro Display

| Komponente | Empfehlung | Preis (ca.) |
|---|---|---|
| **Mikrocontroller** | Raspberry Pi Zero 2 W | ~18 € |
| **eInk-Display** | Waveshare 7.5" e-Paper HAT (800×480, B/W) | ~35 € |
| **Akku** | PiSugar 3 Plus (5000 mAh, direkt auf Pi) | ~35 € |
| **Gehäuse** | 3D-gedruckt oder Waveshare Pi Zero Case | ~5–15 € |
| **microSD** | 16 GB Class 10 | ~6 € |
| **Gesamtkosten** | | **~100–110 € / Display** |

---

## Akkulaufzeit-Berechnung

### Strategie: Deep Sleep zwischen Aktualisierungen
- eInk-Displays verbrauchen Strom **nur beim Bildwechsel** (kein Standby-Verbrauch)
- Pi Zero 2 W im Deep Sleep: ~3 mA
- Pi Zero 2 W aktiv: ~350 mA für ~10 Sekunden zum Aktualisieren

### Berechnung bei 5-Minuten-Intervall:
```
Aktiv:    350 mA × (10s / 300s) =  ~11.7 mA Durchschnitt
Sleep:      3 mA × (290s / 300s) = ~2.9 mA Durchschnitt
Gesamt:                           ~14.6 mA
Akku:     5000 mAh / 14.6 mA     = ~342 Stunden ≈ 14 Tage ✓
```

---

## Software — Display-Client (Python)

```python
#!/usr/bin/env python3
# /home/pi/room_display.py

import time
import requests
import json
from datetime import datetime
from PIL import Image, ImageDraw, ImageFont
import subprocess

ROOM_ID = "DEINE_RAUM_ID_HIER"
SERVER_URL = "https://DEINE_DOMAIN.de"
UPDATE_INTERVAL = 300  # 5 Minuten

def fetch_room_data():
    try:
        res = requests.get(
            f"{SERVER_URL}/api/display/{ROOM_ID}",
            timeout=10
        )
        return res.json()
    except Exception as e:
        return None

def render_display(data):
    from waveshare_epd import epd7in5_V2  # Waveshare 7.5" V2
    
    epd = epd7in5_V2.EPD()
    epd.init()
    
    img = Image.new('1', (epd.width, epd.height), 255)
    draw = ImageDraw.Draw(img)
    
    try:
        font_large = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf', 48)
        font_medium = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', 28)
        font_small = ImageFont.truetype('/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf', 20)
    except:
        font_large = ImageFont.load_default()
        font_medium = font_large
        font_small = font_large
    
    if data is None:
        draw.text((10, 10), "Verbindungsfehler", font=font_large, fill=0)
        epd.display(epd.getbuffer(img))
        epd.sleep()
        return
    
    room_name = data.get('room', {}).get('name', 'Raum')
    is_occupied = data.get('isOccupied', False)
    current = data.get('currentBooking')
    upcoming = data.get('upcomingBookings', [])
    
    # Header: Raumname
    draw.text((20, 15), room_name, font=font_large, fill=0)
    draw.line([(20, 75), (780, 75)], fill=0, width=2)
    
    # Status
    status_text = "BELEGT" if is_occupied else "FREI"
    status_y = 90
    if is_occupied:
        draw.rectangle([(20, status_y), (780, status_y + 70)], fill=0)
        draw.text((30, status_y + 10), status_text, font=font_large, fill=255)
        if current:
            draw.text((30, status_y + 10), f"{status_text} — {current['title']}", font=font_large, fill=255)
    else:
        draw.text((20, status_y), status_text, font=font_large, fill=0)
    
    # Heutige Buchungen
    y = 200
    draw.text((20, y), "Heute:", font=font_medium, fill=0)
    y += 40
    
    for booking in upcoming[:5]:
        start = datetime.fromisoformat(booking['startTime'].replace('Z', '+00:00'))
        end = datetime.fromisoformat(booking['endTime'].replace('Z', '+00:00'))
        time_str = f"{start.strftime('%H:%M')}–{end.strftime('%H:%M')}"
        line = f"  {time_str}  {booking['title']}"
        draw.text((20, y), line, font=font_small, fill=0)
        y += 30
    
    # Uhrzeit unten rechts
    now = datetime.now()
    time_str = now.strftime('%H:%M')
    draw.text((680, 440), time_str, font=font_medium, fill=0)
    
    epd.display(epd.getbuffer(img))
    epd.sleep()  # WICHTIG: Display schlafen lassen spart Energie

def main():
    while True:
        data = fetch_room_data()
        render_display(data)
        
        # Pi in Deep Sleep versetzen (via systemd oder rtcwake)
        # Alternativ: einfach schlafen (mehr Verbrauch)
        time.sleep(UPDATE_INTERVAL)

if __name__ == "__main__":
    main()
```

---

## API-Endpoint für Displays

Ich empfehle einen dedizierten Display-Endpoint hinzuzufügen:

```
GET /api/display/[roomId]
→ Gibt zurück: { room, isOccupied, currentBooking, upcomingBookings }
```

---

## Setup Raspberry Pi Zero 2 W

```bash
# 1. Raspberry Pi OS Lite (64-bit) installieren

# 2. System aktualisieren
sudo apt update && sudo apt upgrade -y

# 3. Python-Deps installieren
sudo apt install -y python3-pip python3-pil python3-requests

# 4. Waveshare eInk Library
git clone https://github.com/waveshare/e-Paper.git
cd e-Paper/RaspberryPi_JetsonNano/python
sudo pip3 install .

# 5. Display-Script installieren
sudo cp room_display.py /home/pi/
sudo chmod +x /home/pi/room_display.py

# 6. Autostart via systemd
sudo tee /etc/systemd/system/room-display.service > /dev/null <<EOF
[Unit]
Description=Room Display
After=network.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/room_display.py
Restart=always
User=pi
Environment=ROOM_ID=DEINE_RAUM_ID

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable room-display
sudo systemctl start room-display
```

---

## Maximale Energieeffizienz (Ziel: 2+ Wochen)

Für noch längere Laufzeit:

1. **rtcwake** statt `time.sleep()` — Pi schaltet wirklich ab:
   ```bash
   sudo rtcwake -m mem -s 300  # 5 Min schlafen
   ```

2. **WiFi nur zum Abrufen**: WiFi einschalten → Daten holen → WiFi aus → Bild rendern → Sleep

3. **Display-Variante**: Waveshare 4.2" (kleiner, weniger Energie)

4. **Alternative MCU**: ESP32 mit eInk — kein Linux, noch sparsamer, aber kein Python

---

## Stückliste für 5 Displays

| Pos | Artikel | Anzahl | Preis |
|---|---|---|---|
| Raspberry Pi Zero 2 W | [pimoroni.com] | 5 | 90 € |
| Waveshare 7.5" eInk HAT | [waveshare.com] | 5 | 175 € |
| PiSugar 3 Plus 5000mAh | [pisugar.com] | 5 | 175 € |
| 16GB microSD | Amazon | 5 | 30 € |
| Gehäuse (3D-Druck) | selbst | 5 | ~25 € |
| **Gesamt** | | | **~495 €** |

---

## Display-URL für jeden Raum

Nach dem Anlegen eines Raums im Admin-Panel:
```
https://DEINE_DOMAIN.de/display/[RAUM-ID]
```

Diese URL auf dem Raspberry Pi als `ROOM_ID` eintragen.
Die Seite ist öffentlich zugänglich (kein Login nötig).
