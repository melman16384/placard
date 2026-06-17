export function WiringDiagram() {
  // 8 connections between Pi Zero GPIO and Waveshare eInk HAT
  const conns = [
    { pin: 1,  gpio: '3.3V',    sig: 'VCC',  note: 'Power',       color: '#ef4444' },
    { pin: 6,  gpio: 'GND',     sig: 'GND',  note: 'Ground',      color: '#6b7280' },
    { pin: 11, gpio: 'GPIO17',  sig: 'RST',  note: 'Reset',       color: '#10b981' },
    { pin: 18, gpio: 'GPIO24',  sig: 'BUSY', note: 'Busy signal', color: '#f59e0b' },
    { pin: 19, gpio: 'GPIO10',  sig: 'DIN',  note: 'SPI MOSI',    color: '#3b82f6' },
    { pin: 22, gpio: 'GPIO25',  sig: 'DC',   note: 'Data/Cmd',    color: '#8b5cf6' },
    { pin: 23, gpio: 'GPIO11',  sig: 'CLK',  note: 'SPI Clock',   color: '#3b82f6' },
    { pin: 24, gpio: 'GPIO8',   sig: 'CS',   note: 'SPI CS/CE0',  color: '#3b82f6' },
  ]

  const rowH = 38
  const startY = 88
  const ys = conns.map((_, i) => startY + i * rowH)
  const totalH = startY + conns.length * rowH + 20

  const piRight = 240
  const dispLeft = 480

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 720 ${totalH}`}
        className="w-full rounded-xl border border-gray-200 bg-gray-50"
        style={{ fontFamily: "'JetBrains Mono', 'Fira Mono', monospace" }}
      >
        {/* ── Pi Zero 2 W board ── */}
        <rect x="15" y="20" width={piRight - 15} height={totalH - 30} rx="10" fill="#0f172a" />
        <rect x="22" y="27" width={piRight - 29} height={totalH - 44} rx="7" fill="#1e3a5f" opacity="0.4" />

        {/* Board label */}
        <text x="122" y="46" textAnchor="middle" fill="#93c5fd" fontSize="12" fontWeight="700">Raspberry Pi Zero 2 W</text>
        <text x="122" y="61" textAnchor="middle" fill="#475569" fontSize="9">40-Pin GPIO Header</text>

        {/* GPIO pin rows */}
        {conns.map(({ pin, gpio, color }, i) => {
          const y = ys[i]
          return (
            <g key={i}>
              {/* pin number badge */}
              <rect x="22" y={y - 13} width="34" height="20" rx="4" fill={color} opacity="0.15" />
              <text x="39" y={y + 1} textAnchor="middle" fill={color} fontSize="10" fontWeight="700">
                {pin}
              </text>
              {/* gpio label */}
              <text x="64" y={y + 1} fill="#cbd5e1" fontSize="10">
                {gpio}
              </text>
              {/* connector dot on right edge of board */}
              <circle cx={piRight} cy={y} r="5" fill={color} />
            </g>
          )
        })}

        {/* ── Wire traces ── */}
        {conns.map(({ color }, i) => {
          const y = ys[i]
          const midX = (piRight + dispLeft) / 2
          return (
            <g key={i}>
              <line x1={piRight} y1={y} x2={midX - 10} y2={y} stroke={color} strokeWidth="2" opacity="0.7" />
              <line x1={midX + 10} y1={y} x2={dispLeft} y2={y} stroke={color} strokeWidth="2" opacity="0.7" />
              {/* small label in center */}
              <rect x={midX - 18} y={y - 9} width="36" height="14" rx="3" fill="#f8fafc" />
              <text x={midX} y={y + 1} textAnchor="middle" fill={color} fontSize="9" fontWeight="700">
                {conns[i].sig}
              </text>
            </g>
          )
        })}

        {/* ── Waveshare eInk HAT ── */}
        <rect x={dispLeft} y="20" width={720 - dispLeft - 15} height={totalH - 30} rx="10" fill="#0f172a" />
        <rect x={dispLeft + 7} y="27" width={720 - dispLeft - 29} height={totalH - 44} rx="7" fill="#14532d" opacity="0.35" />

        {/* Display label */}
        <text x={dispLeft + 108} y="46" textAnchor="middle" fill="#86efac" fontSize="12" fontWeight="700">Waveshare 7.5″ HAT</text>
        <text x={dispLeft + 108} y="61" textAnchor="middle" fill="#475569" fontSize="9">eInk V2 · 800 × 480 px · SPI</text>

        {/* Display connector pins */}
        {conns.map(({ sig, note, color }, i) => {
          const y = ys[i]
          return (
            <g key={i}>
              {/* connector dot on left edge */}
              <circle cx={dispLeft} cy={y} r="5" fill={color} />
              {/* signal label */}
              <text x={dispLeft + 14} y={y + 1} fill={color} fontSize="10" fontWeight="700">{sig}</text>
              {/* note */}
              <text x={dispLeft + 52} y={y + 1} fill="#94a3b8" fontSize="9">{note}</text>
            </g>
          )
        })}

        {/* SPI bus brace on Pi side */}
        <line x1="205" y1={ys[4] - 8} x2="205" y2={ys[7] + 8} stroke="#3b82f6" strokeWidth="1.5" opacity="0.4" />
        <text x="210" y={ys[5] + 22} fill="#3b82f6" fontSize="8" opacity="0.7">SPI0</text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-600 px-1">
        {[
          { color: '#ef4444', label: 'Stromversorgung (3.3V)' },
          { color: '#6b7280', label: 'Masse (GND)' },
          { color: '#3b82f6', label: 'SPI-Bus (MOSI / CLK / CS)' },
          { color: '#10b981', label: 'Reset (RST)' },
          { color: '#8b5cf6', label: 'Daten/Befehl (DC)' },
          { color: '#f59e0b', label: 'Busy-Signal' },
        ].map(({ color, label }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
            {label}
          </span>
        ))}
      </div>

      {/* PiSugar connection note */}
      <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <strong>PiSugar 3 (optional):</strong> Verbindet sich über <strong>Pogo-Pins</strong> auf der Rückseite des Pi Zero — kein GPIO-Kabel nötig.
        Kommunikation intern über I²C (SDA = Pin 3, SCL = Pin 5). Das HAT und die PiSugar können gleichzeitig genutzt werden.
      </div>
    </div>
  )
}
