'use client'

import { useState } from 'react'
import { CopyButton } from './CopyButton'

const TABS = [
  { id: 'letsencrypt', label: "Let's Encrypt" },
  { id: 'cloudflare',  label: 'Cloudflare' },
  { id: 'own',         label: 'Eigenes Zertifikat' },
  { id: 'selfsigned',  label: 'Selbstsigniert' },
] as const

type TabId = typeof TABS[number]['id']

const NGINX_SSL_LETSENCRYPT = `server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name DEINE_DOMAIN.de;

    ssl_certificate     /etc/letsencrypt/live/DEINE_DOMAIN.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DEINE_DOMAIN.de/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    location / {
        proxy_pass         http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}`

const NGINX_SSL_CUSTOM = `server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name DEINE_DOMAIN.de;

    ssl_certificate     /etc/ssl/room-booking/fullchain.pem;
    ssl_certificate_key /etc/ssl/room-booking/privkey.pem;
    ssl_dhparam         /etc/ssl/room-booking/dhparam.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache   shared:SSL:10m;
    ssl_session_timeout 1d;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;

    location / {
        proxy_pass         http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}`

export function SslTabs() {
  const [active, setActive] = useState<TabId>('letsencrypt')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 mb-4 border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors -mb-px border-b-2 ${
              active === tab.id
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Let's Encrypt */}
      {active === 'letsencrypt' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Für öffentliche Server mit echter Domain. Kostenlos, automatisch erneuerbar. <strong>Empfohlen.</strong></p>

          <p className="text-sm text-gray-700 font-medium">1. Certbot ausführen:</p>
          <div className="relative">
            <CopyButton text="sudo certbot --nginx -d DEINE_DOMAIN.de" />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{`sudo certbot --nginx -d DEINE_DOMAIN.de`}</pre>
          </div>

          <p className="text-xs text-gray-500">Certbot ergänzt die SSL-Zeilen in der Nginx-Konfiguration automatisch. Danach die nginx-Konfiguration mit diesen Zeilen prüfen:</p>
          <div className="relative">
            <CopyButton text={NGINX_SSL_LETSENCRYPT} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{NGINX_SSL_LETSENCRYPT}</pre>
          </div>

          <p className="text-sm text-gray-700 font-medium">2. Automatische Erneuerung prüfen:</p>
          <div className="relative">
            <CopyButton text="sudo certbot renew --dry-run" />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{`sudo certbot renew --dry-run\nsystemctl status certbot.timer`}</pre>
          </div>
        </div>
      )}

      {/* Cloudflare */}
      {active === 'cloudflare' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Server läuft hinter Cloudflare-Proxy (oranges Wolken-Icon im DNS). Cloudflare handelt das Client-SSL.</p>

          <p className="text-sm text-gray-700 font-medium">1. Origin-Zertifikat im Cloudflare Dashboard erstellen:</p>
          <ol className="text-sm text-gray-600 space-y-1 list-decimal ml-5">
            <li>Cloudflare Dashboard → Domain → <strong>SSL/TLS → Ursprungsserver</strong></li>
            <li><strong>Zertifikat erstellen</strong> → Laufzeit wählen → PEM-Format</li>
            <li>Beide Dateien herunterladen</li>
          </ol>

          <p className="text-sm text-gray-700 font-medium">2. Zertifikat auf den Server kopieren:</p>
          <div className="relative">
            <CopyButton text={`sudo mkdir -p /etc/ssl/room-booking\nsudo nano /etc/ssl/room-booking/fullchain.pem   # Zertifikat einfügen\nsudo nano /etc/ssl/room-booking/privkey.pem    # Privaten Schlüssel einfügen\nsudo chmod 600 /etc/ssl/room-booking/privkey.pem`} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{`sudo mkdir -p /etc/ssl/room-booking
sudo nano /etc/ssl/room-booking/fullchain.pem   # Zertifikat einfügen
sudo nano /etc/ssl/room-booking/privkey.pem    # Privaten Schlüssel einfügen
sudo chmod 600 /etc/ssl/room-booking/privkey.pem`}</pre>
          </div>

          <p className="text-sm text-gray-700 font-medium">3. Nginx-Konfiguration:</p>
          <div className="relative">
            <CopyButton text={NGINX_SSL_CUSTOM} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{NGINX_SSL_CUSTOM}</pre>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800">
            <strong>Wichtig:</strong> Cloudflare SSL-Modus auf <strong>Full (strict)</strong> setzen (SSL/TLS → Übersicht).
          </div>
        </div>
      )}

      {/* Eigenes Zertifikat */}
      {active === 'own' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Zertifikat von einer kommerziellen CA (DigiCert, Sectigo, DFN) oder interner Unternehmens-CA.</p>

          <p className="text-sm text-gray-700 font-medium">1. Fullchain aus Zertifikat + CA-Bundle zusammenbauen:</p>
          <p className="text-xs text-gray-500">Reihenfolge: erst dein Zertifikat, dann die Zwischenzertifikate der CA.</p>
          <div className="relative">
            <CopyButton text={`sudo mkdir -p /etc/ssl/room-booking\nsudo bash -c 'cat deine-domain.crt ca-bundle.crt > /etc/ssl/room-booking/fullchain.pem'\nsudo cp deine-domain.key /etc/ssl/room-booking/privkey.pem\nsudo chmod 600 /etc/ssl/room-booking/privkey.pem`} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{`sudo mkdir -p /etc/ssl/room-booking
sudo bash -c 'cat deine-domain.crt ca-bundle.crt > /etc/ssl/room-booking/fullchain.pem'
sudo cp deine-domain.key /etc/ssl/room-booking/privkey.pem
sudo chmod 600 /etc/ssl/room-booking/privkey.pem`}</pre>
          </div>

          <p className="text-sm text-gray-700 font-medium">2. DH-Parameter generieren (einmalig, ~2 Min):</p>
          <div className="relative">
            <CopyButton text="sudo openssl dhparam -out /etc/ssl/room-booking/dhparam.pem 2048" />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{`sudo openssl dhparam -out /etc/ssl/room-booking/dhparam.pem 2048`}</pre>
          </div>

          <p className="text-sm text-gray-700 font-medium">3. Nginx-Konfiguration:</p>
          <div className="relative">
            <CopyButton text={NGINX_SSL_CUSTOM} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{NGINX_SSL_CUSTOM}</pre>
          </div>

          <p className="text-sm text-gray-700 font-medium">4. Zertifikat verifizieren:</p>
          <div className="relative">
            <CopyButton text={`openssl s_client -connect DEINE_DOMAIN.de:443 -servername DEINE_DOMAIN.de < /dev/null 2>/dev/null \\\n  | openssl x509 -noout -subject -issuer -dates`} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{`openssl s_client -connect DEINE_DOMAIN.de:443 -servername DEINE_DOMAIN.de < /dev/null 2>/dev/null \\
  | openssl x509 -noout -subject -issuer -dates`}</pre>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-800">
            <strong>Ablaufdatum notieren:</strong>{' '}
            <code>openssl x509 -enddate -noout -in /etc/ssl/room-booking/fullchain.pem</code>
            {' '}— Erneuerung mind. 30 Tage vorher einplanen.
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium">Privaten Schlüssel ist passwortgeschützt?</summary>
            <div className="mt-2 space-y-2">
              <p className="text-xs text-gray-500">Falls der Schlüssel beim Nginx-Start nach einem Passwort fragt, muss es entfernt werden:</p>
              <div className="relative">
                <CopyButton text="sudo openssl rsa -in deine-domain.key -out /etc/ssl/room-booking/privkey.pem" />
                <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{`# Prüfen ob verschlüsselt (Zeile "Proc-Type: 4,ENCRYPTED" → ja):
head -2 deine-domain.key

# Passwort entfernen (wird einmalig abgefragt):
sudo openssl rsa -in deine-domain.key -out /etc/ssl/room-booking/privkey.pem
sudo chmod 600 /etc/ssl/room-booking/privkey.pem`}</pre>
              </div>
            </div>
          </details>
        </div>
      )}

      {/* Selbstsigniert */}
      {active === 'selfsigned' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">Für interne Umgebungen oder hinter Cloudflare (als Origin-Zertifikat). Browser zeigen eine Sicherheitswarnung.</p>

          <div className="relative">
            <CopyButton text={`sudo mkdir -p /etc/ssl/room-booking\nsudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \\\n  -keyout /etc/ssl/room-booking/privkey.pem \\\n  -out    /etc/ssl/room-booking/fullchain.pem \\\n  -subj   "/CN=DEINE_DOMAIN.de"\nsudo chmod 600 /etc/ssl/room-booking/privkey.pem`} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{`sudo mkdir -p /etc/ssl/room-booking
sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \\
  -keyout /etc/ssl/room-booking/privkey.pem \\
  -out    /etc/ssl/room-booking/fullchain.pem \\
  -subj   "/CN=DEINE_DOMAIN.de"
sudo chmod 600 /etc/ssl/room-booking/privkey.pem`}</pre>
          </div>

          <p className="text-sm text-gray-700 font-medium">Nginx-Konfiguration (ohne dhparam):</p>
          <div className="relative">
            <CopyButton text={NGINX_SSL_CUSTOM.replace('\n    ssl_dhparam         /etc/ssl/room-booking/dhparam.pem;', '')} />
            <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{NGINX_SSL_CUSTOM.replace('\n    ssl_dhparam         /etc/ssl/room-booking/dhparam.pem;', '')}</pre>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <CopyButton text="sudo nginx -t && sudo systemctl reload nginx" />
          <pre className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-xs overflow-x-auto pr-12">{`sudo nginx -t && sudo systemctl reload nginx`}</pre>
        </div>
      </div>
    </div>
  )
}
