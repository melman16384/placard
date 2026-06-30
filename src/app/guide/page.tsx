import { PrintButton } from './PrintButton'
import { WiringDiagram } from './WiringDiagram'

export default function GuidePage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://DEIN-SERVER'

  return (
    <div className="bg-white">
      <div className="no-print max-w-3xl mx-auto px-8 pt-8 pb-0 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Display Bauanleitung</h2>
          <p className="text-sm text-gray-400 mt-1">Raspberry Pi Zero 2W + Waveshare 7,5″ eInk-Display</p>
        </div>
        <PrintButton />
      </div>

      <div className="max-w-3xl mx-auto px-8 py-8 text-gray-900 guide-content">

        <h1>Raum-Display Bauanleitung</h1>
        <p className="lead">
          Joan-Ersatz mit Raspberry Pi Zero 2 W + Waveshare 7,5″ eInk-Display.
          Die Displays fragen alle 5 Minuten die Middleware ab und zeigen Raumbelegung und Termine an.
        </p>

        <hr />

        {/* System overview */}
        <h2>Systemübersicht</h2>
        <div className="arch-box">
          <div className="arch-row">
            <span className="arch-node blue">Exchange Online</span>
            <span className="arch-arrow">→</span>
            <span className="arch-node slate">Microsoft Graph API</span>
            <span className="arch-arrow">→</span>
            <span className="arch-node blue">Middleware Server</span>
          </div>
          <div className="arch-row mt-2">
            <span className="arch-node green">Pi Zero 2 W (WLAN)</span>
            <span className="arch-arrow">→</span>
            <span className="arch-node slate">/api/display/[id]</span>
            <span className="arch-arrow">→</span>
            <span className="arch-node green">eInk Display</span>
          </div>
        </div>
        <p>Der Raspberry Pi ist passiver Client — er fragt nur ab, schreibt nichts in Exchange. Buchungen vom Display aus (Ad-hoc) laufen über denselben Middleware-Endpunkt.</p>

        <hr />

        {/* BOM */}
        <h2>1. Stückliste pro Display</h2>

        <h3>Variante A — Kabelgebunden (empfohlen)</h3>
        <p>Für Räume mit Steckdose am Türrahmen. Kein Akkupflege nötig.</p>
        <table>
          <thead><tr><th>Komponente</th><th>Modell</th><th>Bezugsquelle</th><th>Preis (ca.)</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>Mikrocontroller</strong></td>
              <td>Raspberry Pi Zero 2 WH<br /><small>(mit vorlötierten Pins)</small></td>
              <td>Reichelt, BerryBase</td>
              <td>~€ 20</td>
            </tr>
            <tr>
              <td><strong>eInk-Display</strong></td>
              <td>Waveshare 7.5″ e-Paper HAT V2<br /><small>800 × 480 px, Schwarz/Weiß, SPI</small></td>
              <td>BerryBase, Eckstein, direkt waveshare.com</td>
              <td>~€ 55–65</td>
            </tr>
            <tr>
              <td><strong>SD-Karte</strong></td>
              <td>16 GB microSD, Class 10 / A1</td>
              <td>Amazon, Reichelt</td>
              <td>~€ 6</td>
            </tr>
            <tr>
              <td><strong>Netzteil</strong></td>
              <td>USB-C 5V/2,5A (z.B. offizielles Pi-Netzteil)</td>
              <td>BerryBase, Reichelt</td>
              <td>~€ 10</td>
            </tr>
            <tr>
              <td><strong>Gehäuse</strong></td>
              <td>Waveshare Pi Zero Case oder 3D-Druck (STL unter <em>Abschnitt 4</em>)</td>
              <td>waveshare.com, Eigenproduktion</td>
              <td>~€ 10–15</td>
            </tr>
            <tr className="total-row">
              <td><strong>Gesamt</strong></td><td /><td />
              <td><strong>~€ 101–116</strong></td>
            </tr>
          </tbody>
        </table>

        <h3>Variante B — Akkubetrieb</h3>
        <p>
          <strong>Wichtig:</strong> Der <em>PiSugar 3 Plus</em> (5000 mAh) passt <strong>nicht</strong> zum Pi Zero —
          er ist für Pi 3B/4B. Für den Zero 2W gibt es zwei praktische Optionen:
        </p>
        <table>
          <thead><tr><th>Option</th><th>Kapazität</th><th>Laufzeit (bei ~15 mA Ø)</th><th>Preis</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>PiSugar 3</strong><br /><small>(Pogo-Pin, Zero-Formfaktor)</small></td>
              <td>1 200 mAh</td>
              <td>~3–4 Tage</td>
              <td>~€ 37</td>
            </tr>
            <tr>
              <td><strong>USB-Powerbank 10 000 mAh</strong><br /><small>über USB-C an Pi Zero</small></td>
              <td>10 000 mAh</td>
              <td>~3–4 Wochen</td>
              <td>~€ 15–25</td>
            </tr>
          </tbody>
        </table>
        <p>Für echten Dauerbetrieb über mehrere Wochen empfiehlt sich eine <strong>USB-Powerbank mit Always-on-Funktion</strong> (kein Auto-Abschalten bei Niedriglast). Empfehlung: Anker 733 oder ähnliches Modell mit Always-on.</p>

        <h3>5 Displays im Überblick</h3>
        <table>
          <thead><tr><th>Artikel</th><th>Stück</th><th>Einzelpreis</th><th>Gesamt</th></tr></thead>
          <tbody>
            <tr><td>Raspberry Pi Zero 2 WH</td><td>5</td><td>€ 20</td><td>€ 100</td></tr>
            <tr><td>Waveshare 7.5″ eInk HAT V2</td><td>5</td><td>€ 60</td><td>€ 300</td></tr>
            <tr><td>microSD 16 GB</td><td>5</td><td>€ 6</td><td>€ 30</td></tr>
            <tr><td>USB-C Netzteil 5V/2,5A</td><td>5</td><td>€ 10</td><td>€ 50</td></tr>
            <tr><td>Gehäuse / Halterung</td><td>5</td><td>€ 12</td><td>€ 60</td></tr>
            <tr className="total-row">
              <td><strong>Gesamt (kabelgebunden)</strong></td><td></td><td></td><td><strong>€ 540</strong></td>
            </tr>
          </tbody>
        </table>

        <hr />

        {/* Wiring Diagram */}
        <h2>2. Schaltplan — GPIO-Verdrahtung</h2>
        <p>
          Das eInk-HAT wird direkt auf den 40-Pin-Header gesteckt — es ist <strong>kein einzelnes Kabel nötig</strong>.
          Der Schaltplan zeigt, welche Pins intern verbunden werden:
        </p>

        <div className="no-print">
          <WiringDiagram />
        </div>

        {/* Print version of wiring */}
        <div className="print-only wiring-table">
          <table>
            <thead><tr><th>Pi Pin</th><th>Funktion</th><th>HAT-Anschluss</th><th>Beschreibung</th></tr></thead>
            <tbody>
              <tr><td>Pin 1</td><td>3.3V</td><td>VCC</td><td>Stromversorgung 3,3V</td></tr>
              <tr><td>Pin 6</td><td>GND</td><td>GND</td><td>Masse</td></tr>
              <tr><td>Pin 11</td><td>GPIO17</td><td>RST</td><td>Display Reset</td></tr>
              <tr><td>Pin 18</td><td>GPIO24</td><td>BUSY</td><td>Busy-Signal (HAT → Pi)</td></tr>
              <tr><td>Pin 19</td><td>GPIO10 (MOSI)</td><td>DIN</td><td>SPI Daten</td></tr>
              <tr><td>Pin 22</td><td>GPIO25</td><td>DC</td><td>Daten / Befehl</td></tr>
              <tr><td>Pin 23</td><td>GPIO11 (SCLK)</td><td>CLK</td><td>SPI Takt</td></tr>
              <tr><td>Pin 24</td><td>GPIO8 (CE0)</td><td>CS</td><td>SPI Chip Select</td></tr>
            </tbody>
          </table>
        </div>

        <div className="tip">
          <strong>PiSugar 3 (Akku-Option):</strong> Verbindet sich über <strong>Pogo-Pins</strong> auf der Rückseite — kein Löten, keine Kabel.
          Einfach Pi Zero auf das PiSugar-Board aufstecken. HAT und PiSugar funktionieren gleichzeitig.
        </div>

        <hr />

        {/* Assembly */}
        <h2>3. Hardware-Zusammenbau</h2>
        <ol>
          <li>
            <strong>Pi Zero 2 WH bereitstellen.</strong> Prüfen ob GPIO-Pins bereits gelötet sind (WH = with Header). Ohne Header muss vor dem Aufstecken des HAT gelötet werden.
          </li>
          <li>
            <strong>(Optional) PiSugar 3 zuerst aufstecken.</strong> Den Pi Zero auf das PiSugar-Board legen und mit den vier Schrauben befestigen. Die Pogo-Pins müssen auf die goldenen Kontakte des Pi Zero treffen.
          </li>
          <li>
            <strong>eInk-HAT auf den GPIO-Header stecken.</strong> Das HAT hat eine Aussparung für den Pi Zero. Auf die Ausrichtung achten — Pin 1 des Headers ist mit einem Dreieck markiert.
          </li>
          <li>
            <strong>Display-Flachbandkabel anschließen.</strong> Das Flachbandkabel von der eInk-Platte in den ZIF-Connector auf dem HAT einstecken, dann die Klemme zudrücken.
          </li>
          <li>
            <strong>SD-Karte einsetzen</strong> (noch nicht, erst nach Schritt 4 beschreiben).
          </li>
          <li>
            <strong>Im Gehäuse montieren.</strong> Für Wandmontage empfehlen sich doppelseitiges Klebeband (3M VHB) oder Schrauben durch die Rückwand.
          </li>
        </ol>

        <hr />

        {/* OS Setup */}
        <h2>4. Betriebssystem einrichten</h2>

        <h3>4.1 Raspberry Pi OS Lite schreiben</h3>
        <ol>
          <li>
            <strong>Raspberry Pi Imager</strong> herunterladen: <code>raspberrypi.com/software</code>
          </li>
          <li>
            Gerät: <code>Raspberry Pi Zero 2 W</code><br />
            OS: <code>Raspberry Pi OS Lite (64-bit)</code> — kein Desktop nötig
          </li>
          <li>
            Zahnrad-Icon (⚙) öffnen und konfigurieren:
            <ul>
              <li>Hostname: z.B. <code>display-raum-a</code></li>
              <li>WLAN-SSID und Passwort eintragen</li>
              <li>SSH aktivieren, Benutzername/Passwort setzen</li>
            </ul>
          </li>
          <li>Auf microSD schreiben → in Pi einsetzen → einschalten</li>
        </ol>

        <h3>4.2 Erster SSH-Login</h3>
        <pre>{`# Pi-IP im Router-Interface nachschauen, dann:
ssh pi@display-raum-a.local

# System aktualisieren
sudo apt update && sudo apt full-upgrade -y
sudo apt install -y python3-pip python3-pil python3-requests git libopenjp2-7`}</pre>

        <h3>4.3 SPI und I²C aktivieren</h3>
        <pre>{`sudo raspi-config
# → Interface Options → SPI → Enable
# → Interface Options → I2C → Enable  (nur wenn PiSugar 3 verwendet)
sudo reboot`}</pre>

        <hr />

        {/* Software */}
        <h2>5. Waveshare-Bibliothek installieren</h2>
        <pre>{`git clone --depth=1 https://github.com/waveshare/e-Paper.git
cd e-Paper/RaspberryPi_JetsonNano/python
sudo pip3 install . --break-system-packages
cd ~`}</pre>
        <p>Die Bibliothek enthält den Treiber für alle Waveshare-Displays. Für das 7.5″ V2 wird <code>epd7in5_V2</code> verwendet.</p>

        <h3>5.1 Treiber testen</h3>
        <pre>{`python3 - <<'EOF'
from waveshare_epd import epd7in5_V2
epd = epd7in5_V2.EPD()
epd.init()
epd.Clear()
epd.sleep()
print("Display OK")
EOF`}</pre>

        <hr />

        {/* Script */}
        <h2>6. Display-Script</h2>
        <p>
          Die Raum-ID findest du im Admin-Panel: <strong>Räume → Display-Link</strong> (letzter Teil der URL).
        </p>

        <pre>{`sudo nano /home/pi/room_display.py`}</pre>

        <pre>{`#!/usr/bin/env python3
"""Room display script for Waveshare 7.5" eInk HAT V2 on Raspberry Pi Zero 2 W."""
import os
import sys
import time
import logging
import requests
from datetime import datetime, timezone
from zoneinfo import ZoneInfo
from PIL import Image, ImageDraw, ImageFont

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("room-display")

ROOM_ID    = os.environ.get("ROOM_ID", "")
SERVER_URL = os.environ.get("SERVER_URL", "`}{appUrl}{`")
INTERVAL   = int(os.environ.get("INTERVAL", "300"))   # Sekunden
TIMEZONE   = os.environ.get("TZ", "Europe/Berlin")

if not ROOM_ID:
    log.error("ROOM_ID nicht gesetzt! Bitte als Umgebungsvariable übergeben.")
    sys.exit(1)

# Schriftpfade — erstes gefundenes wird verwendet
FONT_PATHS = [
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf",
]
FONT_PATHS_REG = [p.replace("Bold", "Regular").replace("-Bold", "") for p in FONT_PATHS]

def load_font(paths, size):
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            continue
    return ImageFont.load_default()

def fetch_data():
    try:
        r = requests.get(
            f"{SERVER_URL}/api/display/{ROOM_ID}",
            timeout=15,
            headers={"Accept": "application/json"},
        )
        r.raise_for_status()
        return r.json()
    except requests.exceptions.ConnectionError:
        log.warning("Netzwerkfehler — kein WLAN?")
    except requests.exceptions.Timeout:
        log.warning("Server antwortet nicht (Timeout)")
    except Exception as e:
        log.error("Fehler beim Abrufen: %s", e)
    return None

def fmt_time(iso: str) -> str:
    """ISO-Zeit → 'HH:MM' in lokaler Zeitzone."""
    try:
        dt = datetime.fromisoformat(iso.replace("Z", "+00:00"))
        return dt.astimezone(ZoneInfo(TIMEZONE)).strftime("%H:%M")
    except Exception:
        return iso[11:16]

def render(data):
    from waveshare_epd import epd7in5_V2

    epd = epd7in5_V2.EPD()
    epd.init()

    W, H = epd.width, epd.height   # 800 × 480
    img  = Image.new("1", (W, H), 255)   # 1-bit, white background
    draw = ImageDraw.Draw(img)

    fBig  = load_font(FONT_PATHS,     64)
    fMed  = load_font(FONT_PATHS,     30)
    fSm   = load_font(FONT_PATHS_REG, 22)
    fXs   = load_font(FONT_PATHS_REG, 18)
    fMono = load_font(FONT_PATHS_REG, 20)

    now_local = datetime.now(ZoneInfo(TIMEZONE))

    # ── Fehlerfall ────────────────────────────────────────────────
    if data is None:
        draw.text((30, 30),  "Verbindungsfehler", font=fMed, fill=0)
        draw.text((30, 80),  f"Letzter Versuch: {now_local.strftime('%H:%M')}", font=fSm, fill=0)
        draw.text((30, 115), f"Server: {SERVER_URL}", font=fXs, fill=0)
        epd.display(epd.getbuffer(img))
        epd.sleep()
        return

    room     = data.get("room", {})
    name     = room.get("name", "Raum")
    floor    = room.get("floor") or ""
    occupied = data.get("isOccupied", False)
    current  = data.get("currentBooking")
    upcoming = data.get("upcomingBookings", [])

    # ── Raumname + Trennlinie ──────────────────────────────────────
    draw.text((30, 20), name, font=fMed, fill=0)
    if floor:
        draw.text((30, 58), f"Etage {floor}", font=fXs, fill=0)
    draw.line([(0, 82), (W, 82)], fill=0, width=3)

    # ── Status-Block ───────────────────────────────────────────────
    if occupied and current:
        # Schwarzes Banner = BELEGT
        draw.rectangle([(0, 83), (W, 220)], fill=0)
        draw.text((30, 92), "BELEGT", font=fBig, fill=255)
        title = current.get("title", "—")
        if len(title) > 38:
            title = title[:37] + "…"
        draw.text((30, 165), title, font=fSm, fill=255)

        s = fmt_time(current["startTime"])
        e = fmt_time(current["endTime"])
        draw.text((30, 200), f"{s} – {e}", font=fXs, fill=255)
    else:
        draw.text((30, 100), "VERFÜGBAR", font=fBig, fill=0)
        if not upcoming:
            draw.text((30, 175), "Keine weiteren Termine heute.", font=fSm, fill=0)

    # ── Kommende Termine ───────────────────────────────────────────
    y = 240
    draw.text((30, y), "Nächste Termine:", font=fSm, fill=0)
    y += 36

    for b in upcoming[:5]:
        s  = fmt_time(b["startTime"])
        e  = fmt_time(b["endTime"])
        tl = b.get("title", "—")
        if len(tl) > 40:
            tl = tl[:39] + "…"
        draw.text((30,  y), f"▸ {s}–{e}", font=fMono, fill=0)
        draw.text((210, y), tl,             font=fMono, fill=0)
        y += 28
        if y > 445:
            break

    # ── Zeitstempel unten rechts ───────────────────────────────────
    ts = now_local.strftime("%d.%m.%Y  %H:%M")
    draw.text((W - 220, H - 26), ts, font=fXs, fill=0)

    epd.display(epd.getbuffer(img))
    epd.sleep()   # Strom sparen — Display hält Bild ohne Strom
    log.info("Display aktualisiert — %s", "BELEGT" if occupied else "VERFÜGBAR")

# ── Hauptschleife ──────────────────────────────────────────────────
log.info("Starte Raum-Display für Raum-ID=%s", ROOM_ID)
while True:
    try:
        render(fetch_data())
    except Exception as e:
        log.error("Unerwarteter Fehler: %s", e)
    time.sleep(INTERVAL)`}</pre>

        <hr />

        {/* Systemd */}
        <h2>7. Autostart via systemd</h2>
        <pre>{`sudo nano /etc/systemd/system/room-display.service`}</pre>
        <pre>{`[Unit]
Description=Raum-Display (eInk)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /home/pi/room_display.py
Restart=always
RestartSec=30
User=pi
Environment=ROOM_ID=DEINE_RAUM_ID_HIER
Environment=SERVER_URL=`}{appUrl}{`
Environment=INTERVAL=300
Environment=TZ=Europe/Berlin

[Install]
WantedBy=multi-user.target`}</pre>

        <pre>{`sudo systemctl daemon-reload
sudo systemctl enable room-display
sudo systemctl start room-display

# Log beobachten:
journalctl -u room-display -f`}</pre>

        <hr />

        {/* PiSugar */}
        <h2>8. PiSugar 3 — Akku-Software (optional)</h2>
        <p>
          Falls die <strong>PiSugar 3</strong> verwendet wird, die Verwaltungssoftware installieren:
        </p>
        <pre>{`curl -s https://cdn.pisugar.com/release/pisugar-power-manager.sh | sudo bash`}</pre>
        <p>Danach Webinterface: <code>http://[pi-ip]:8421</code> — zeigt Akkustand, Ladestand und erlaubt geplante Weckzeiten.</p>
        <table>
          <thead><tr><th>Kommando</th><th>Beschreibung</th></tr></thead>
          <tbody>
            <tr><td><code>pisugar-cli get battery</code></td><td>Akkustand in %</td></tr>
            <tr><td><code>pisugar-cli get battery_voltage</code></td><td>Spannung in mV</td></tr>
            <tr><td><code>pisugar-cli get charging</code></td><td>Wird geladen: true/false</td></tr>
          </tbody>
        </table>

        <hr />

        {/* Power math */}
        <h2>9. Akkuberechnung</h2>
        <table>
          <thead><tr><th>Zustand</th><th>Strom</th><th>Anteil (5-Min-Zyklus)</th><th>Ø-Verbrauch</th></tr></thead>
          <tbody>
            <tr><td>Aktiv — Abruf + Render (~15 Sek.)</td><td>280–350 mA</td><td>5 %</td><td>~16 mA</td></tr>
            <tr><td>Idle — WLAN verbunden, Python läuft (~285 Sek.)</td><td>80–120 mA</td><td>95 %</td><td>~95 mA</td></tr>
            <tr className="total-row"><td><strong>Gesamt Durchschnitt</strong></td><td></td><td></td><td><strong>~95 mA</strong></td></tr>
          </tbody>
        </table>
        <div className="tip">
          <strong>Hinweis:</strong> Echter Deep Sleep (Systemabschaltung) würde den Verbrauch auf ~5 mA senken
          und damit mit 10 000 mAh eine Laufzeit von ~80 Tagen ermöglichen — erfordert aber RTC-Weckzeit
          über PiSugar 3 und ist komplexer einzurichten. Für die meisten Installationen ist das Netzgerät
          (Variante A) die einfachste und zuverlässigste Lösung.
        </div>
        <table>
          <thead><tr><th>Stromquelle</th><th>Kapazität</th><th>Laufzeit (bei ~95 mA Ø)</th></tr></thead>
          <tbody>
            <tr><td>Netzteil (kabelgebunden)</td><td>unbegrenzt</td><td>dauerhaft</td></tr>
            <tr><td>USB-Powerbank 10 000 mAh (Always-on)</td><td>10 000 mAh</td><td>~4–5 Tage</td></tr>
            <tr><td>PiSugar 3 (1 200 mAh)</td><td>1 200 mAh</td><td>~12–13 Stunden</td></tr>
          </tbody>
        </table>

        <hr />

        {/* Room ID */}
        <h2>10. Raum-ID herausfinden</h2>
        <ol>
          <li>Admin-Panel öffnen → <strong>Räume</strong></li>
          <li>In der Zeile des gewünschten Raums auf <strong>Display</strong> klicken</li>
          <li>Die ID aus der URL kopieren: <code>/display/<strong>clxxxxxxxxxxx</strong></code></li>
          <li>ID in der systemd-Service-Datei bei <code>Environment=ROOM_ID=</code> eintragen</li>
          <li><code>sudo systemctl restart room-display</code></li>
        </ol>

        <hr />

        {/* Troubleshooting */}
        <h2>11. Fehlersuche</h2>
        <table>
          <thead><tr><th>Problem</th><th>Ursache</th><th>Lösung</th></tr></thead>
          <tbody>
            <tr>
              <td>Display bleibt weiß</td>
              <td>SPI nicht aktiviert oder falsches Display-Modell</td>
              <td><code>sudo raspi-config</code> → SPI aktivieren; sicherstellen dass <code>epd7in5_V2</code> verwendet wird</td>
            </tr>
            <tr>
              <td><code>ModuleNotFoundError: waveshare_epd</code></td>
              <td>Bibliothek nicht installiert</td>
              <td>Schritt 5 wiederholen: <code>pip3 install . --break-system-packages</code></td>
            </tr>
            <tr>
              <td>„Verbindungsfehler" auf Display</td>
              <td>WLAN oder Server nicht erreichbar</td>
              <td><code>ping {new URL(appUrl).hostname}</code>; WLAN-Credentials prüfen</td>
            </tr>
            <tr>
              <td>Kein systemd-Start</td>
              <td>ROOM_ID fehlt oder Python-Pfad falsch</td>
              <td><code>journalctl -u room-display -n 50</code> für Details</td>
            </tr>
            <tr>
              <td>Display „geistert" (alte Pixel sichtbar)</td>
              <td>Kein Full-Refresh gemacht</td>
              <td><code>epd.Clear()</code> vor erstem <code>epd.display()</code> aufrufen</td>
            </tr>
            <tr>
              <td>Flachbandkabel-Fehler</td>
              <td>ZIF-Klemme nicht richtig geschlossen</td>
              <td>Klemme öffnen, Kabel neu einführen (goldene Kontakte zeigen weg vom ZIF-Riegel)</td>
            </tr>
          </tbody>
        </table>

      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white; }
          .guide-content { padding: 0; }
        }
        .print-only { display: none; }

        .guide-content h1 { font-size: 1.8rem; font-weight: 800; margin-bottom: 0.5rem; color: #111; }
        .guide-content .lead { font-size: 1.05rem; color: #555; margin-bottom: 1.5rem; line-height: 1.7; }
        .guide-content h2 { font-size: 1.2rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 0.75rem; color: #1d4ed8; border-bottom: 2px solid #dbeafe; padding-bottom: 0.3rem; }
        .guide-content h3 { font-size: 1rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem; color: #374151; }
        .guide-content p { color: #374151; line-height: 1.7; margin-bottom: 0.75rem; }
        .guide-content ol, .guide-content ul { padding-left: 1.5rem; color: #374151; line-height: 1.9; margin-bottom: 0.75rem; }
        .guide-content li { margin-bottom: 0.2rem; }
        .guide-content pre { background: #0f172a; color: #e2e8f0; padding: 1rem 1.25rem; border-radius: 0.6rem; font-size: 0.76rem; overflow-x: auto; margin: 0.75rem 0; white-space: pre; line-height: 1.6; }
        .guide-content code { background: #f1f5f9; color: #0f172a; padding: 0.1rem 0.35rem; border-radius: 0.25rem; font-size: 0.85em; }
        .guide-content pre code { background: none; color: inherit; padding: 0; }
        .guide-content table { width: 100%; border-collapse: collapse; margin: 0.75rem 0 1.25rem; font-size: 0.875rem; }
        .guide-content th { background: #eff6ff; color: #1e40af; font-weight: 600; text-align: left; padding: 0.55rem 0.75rem; border: 1px solid #bfdbfe; font-size: 0.8rem; }
        .guide-content td { padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; color: #374151; vertical-align: top; }
        .guide-content td small { color: #6b7280; font-size: 0.8em; display: block; margin-top: 2px; }
        .guide-content tr:nth-child(even) td { background: #f9fafb; }
        .guide-content .total-row td { background: #f0fdf4 !important; font-weight: 700; color: #166534; }
        .guide-content hr { border: none; border-top: 1px solid #e5e7eb; margin: 2rem 0; }
        .guide-content .tip { background: #fefce8; border-left: 4px solid #fbbf24; padding: 0.75rem 1rem; border-radius: 0 0.5rem 0.5rem 0; color: #713f12; font-size: 0.9rem; margin: 1rem 0; line-height: 1.6; }

        .arch-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.75rem; padding: 1rem 1.25rem; margin: 0.75rem 0 1rem; }
        .arch-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem; }
        .arch-node { padding: 0.3rem 0.75rem; border-radius: 9999px; font-size: 0.8rem; font-weight: 600; }
        .arch-node.blue { background: #dbeafe; color: #1e40af; }
        .arch-node.green { background: #dcfce7; color: #166534; }
        .arch-node.slate { background: #f1f5f9; color: #475569; }
        .arch-arrow { color: #94a3b8; font-size: 1rem; }
        .mt-2 { margin-top: 0.5rem; }
      `}</style>
    </div>
  )
}
