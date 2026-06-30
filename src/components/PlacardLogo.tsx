interface PlacardLogoProps {
  size?: number
  className?: string
}

export function PlacardLogo({ size = 32, className }: PlacardLogoProps) {
  const id = `placard-grad-${size}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Placard"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6B75FF" />
          <stop offset="100%" stopColor="#9B6BF5" />
        </linearGradient>
      </defs>

      {/* Card / display body */}
      <rect width="48" height="48" rx="12" fill={`url(#${id})`} />

      {/* Content lines — represent scheduled info on the sign */}
      <rect x="9"  y="13" width="20" height="3"   rx="1.5" fill="white" />
      <rect x="9"  y="20" width="14" height="2.5" rx="1.25" fill="white" fillOpacity="0.65" />
      <rect x="9"  y="26" width="18" height="2.5" rx="1.25" fill="white" fillOpacity="0.65" />
      <rect x="9"  y="32" width="11" height="2.5" rx="1.25" fill="white" fillOpacity="0.4" />

      {/* Status indicator — top right */}
      <circle cx="37" cy="13.5" r="5.5" fill="#22C55E" fillOpacity="0.25" />
      <circle cx="37" cy="13.5" r="3.5" fill="#22C55E" />
    </svg>
  )
}
