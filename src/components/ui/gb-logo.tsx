interface GBLogoProps {
  className?: string;
  size?: number;
  showStars?: boolean;
}

export function GBLogo({ className, size = 32, showStars = true }: GBLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="gbGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E91E8F" />
          <stop offset="100%" stopColor="#7B2CBF" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect x="0.5" y="0.5" width="31" height="31" rx="7" fill="#12111B" stroke="url(#gbGrad)" strokeWidth="1" />

      {/* Gift box bow */}
      <path
        d="M16 6 L14 9 L12 7 L12 11 L16 9 L20 11 L20 7 L18 9 Z"
        fill="url(#gbGrad)"
      />
      <rect x="15.5" y="5" width="1" height="7" rx="0.5" fill="#F8F7FC" />

      {/* G letter */}
      <path
        d="M13 12 C13 11.5 13.5 11 14 11 L18 11 C18.5 11 19 11.5 19 12 L19 14 L14 14 L14 22 L18 22 C18.5 22 19 21.5 19 21 L19 18 L16.5 18"
        stroke="url(#gbGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* B letter */}
      <path
        d="M20 11 L20 23 M20 11 L24 11 C25.5 11 26 12 26 13.5 C26 15 25.5 16 24 16 L20 16 M20 16 L25 16 C26.5 16 27 17 27 18.5 C27 20 26.5 21 25 21 L20 21"
        stroke="url(#gbGrad)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Heart cutout in B bottom loop */}
      <path
        d="M22.5 18 C22.5 17.5 23 17 23.5 17 C24 17 24.5 17.5 24.5 18 C24.5 19 23.5 20 23.5 20 C23.5 20 22.5 19 22.5 18Z"
        fill="#12111B"
        stroke="url(#gbGrad)"
        strokeWidth="0.5"
      />

      {/* Sparkle stars */}
      {showStars && (
        <>
          <path
            d="M5 5 L6 8 L9 9 L6 10 L5 13 L4 10 L1 9 L4 8Z"
            fill="#F4C542"
          />
          <path
            d="M23 4 L23.8 6 L26 6.5 L23.8 7 L23 9 L22.2 7 L20 6.5 L22.2 6Z"
            fill="#F4C542"
          />
          <path
            d="M10 2 L10.6 3.4 L12 4 L10.6 4.6 L10 6 L9.4 4.6 L8 4 L9.4 3.4Z"
            fill="#F4C542"
          />
        </>
      )}
    </svg>
  );
}
