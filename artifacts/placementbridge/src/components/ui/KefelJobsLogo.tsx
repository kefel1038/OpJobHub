import React from "react";

interface KefelJobsLogoProps {
  /**
   * The logo variant to display:
   * - "full": Icon + Text + Thin Line Separator + Subtitle
   * - "icon": Icon only ("Kj")
   * - "horizontal": Icon + Text only (compact)
   */
  variant?: "full" | "icon" | "horizontal";
  /** Height of the logo (width scales proportionally) */
  height?: number | string;
  /** Custom classes for outer container */
  className?: string;
  /** Custom color styling */
  accentColor?: string;
}

export function KefelJobsLogo({
  variant = "full",
  height = 40,
  className = "",
  accentColor = "#FF6B35",
}: KefelJobsLogoProps) {
  // Orange gradient for the letter K and tie
  const primaryOrange = accentColor;
  const redOrangeDot = "#FF3C00"; // Red-orange dot for the letter j

  if (variant === "icon") {
    return (
      <svg
        viewBox="0 0 110 110"
        height={height}
        className={`w-auto select-none ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="kj-orange-grad" x1="14" y1="22" x2="74.5" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFA07A" />
            <stop offset="50%" stopColor={primaryOrange} />
            <stop offset="100%" stopColor="#E04A00" />
          </linearGradient>
        </defs>

        {/* Orange K (incorporates gradient for premium sleek look) */}
        <path
          d="M 14,22 H 28 V 51.5 L 53.5,23.5 C 54.5,22.5 56,22 57.5,22 H 74.5 C 77.5,22 78.5,25 76,27.5 L 43.5,60 L 77.5,88.5 C 80,91 79,92 75.5,92 H 59 C 57.5,92 56,91 55,90 L 28,66.5 V 92 H 14 V 22 Z"
          fill="url(#kj-orange-grad)"
        />

        {/* Letter j body: dynamic text color class (fill="currentColor") to support light/dark modes automatically */}
        <path
          d="M 81,32 H 92 V 78 C 92,89 83,96 71,96 C 59,96 50,91.5 45.5,84 C 44.5,82.5 45,80.5 47,80.5 H 56 C 58,80.5 59.5,81.5 60.5,83 C 62.5,86 66.5,88 71,88 C 76.5,88 81,84.5 81,78 V 32 Z"
          fill="currentColor"
          className="text-foreground"
        />

        {/* Dot of letter j */}
        <circle cx="86.5" cy="14" r="6.5" fill={redOrangeDot} />

        {/* Orange necktie inside the letter j */}
        {/* Tie Knot */}
        <polygon points="83,38 90,38 86.5,43.5" fill={primaryOrange} />
        {/* Tie Body */}
        <polygon points="86.5,43.5 89,48 89,61 86.5,67 84,61 84,48" fill={primaryOrange} />
      </svg>
    );
  }

  if (variant === "horizontal") {
    return (
      <svg
        viewBox="0 0 350 110"
        height={height}
        className={`w-auto select-none ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="kj-orange-grad-horiz" x1="14" y1="22" x2="74.5" y2="92" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFA07A" />
            <stop offset="50%" stopColor={primaryOrange} />
            <stop offset="100%" stopColor="#E04A00" />
          </linearGradient>
        </defs>

        <g transform="translate(5, 5)">
          {/* Orange K */}
          <path
            d="M 14,22 H 28 V 51.5 L 53.5,23.5 C 54.5,22.5 56,22 57.5,22 H 74.5 C 77.5,22 78.5,25 76,27.5 L 43.5,60 L 77.5,88.5 C 80,91 79,92 75.5,92 H 59 C 57.5,92 56,91 55,90 L 28,66.5 V 92 H 14 V 22 Z"
            fill="url(#kj-orange-grad-horiz)"
          />

          {/* Letter j body */}
          <path
            d="M 81,32 H 92 V 78 C 92,89 83,96 71,96 C 59,96 50,91.5 45.5,84 C 44.5,82.5 45,80.5 47,80.5 H 56 C 58,80.5 59.5,81.5 60.5,83 C 62.5,86 66.5,88 71,88 C 76.5,88 81,84.5 81,78 V 32 Z"
            fill="currentColor"
            className="text-foreground"
          />

          {/* Dot of letter j */}
          <circle cx="86.5" cy="14" r="6.5" fill={redOrangeDot} />

          {/* Orange necktie */}
          <polygon points="83,38 90,38 86.5,43.5" fill={primaryOrange} />
          <polygon points="86.5,43.5 89,48 89,61 86.5,67 84,61 84,48" fill={primaryOrange} />
        </g>

        {/* Typographic brand text */}
        <text
          x="120"
          y="72"
          fontFamily="'Space Grotesk', 'Inter', sans-serif"
          fontSize="44"
          fontWeight="900"
          letterSpacing="1"
          className="text-foreground fill-current"
        >
          KEFEL
          <tspan fill={primaryOrange}> JOBS</tspan>
        </text>
      </svg>
    );
  }

  // Full variant (Icon + Text + Line Separator + Subtitle)
  return (
    <svg
      viewBox="0 0 460 116"
      height={height}
      className={`w-auto select-none ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="kj-orange-grad-full" x1="14" y1="22" x2="74.5" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFA07A" />
          <stop offset="50%" stopColor={primaryOrange} />
          <stop offset="100%" stopColor="#E04A00" />
        </linearGradient>
      </defs>

      <g transform="translate(5, 5)">
        {/* Orange K */}
        <path
          d="M 14,22 H 28 V 51.5 L 53.5,23.5 C 54.5,22.5 56,22 57.5,22 H 74.5 C 77.5,22 78.5,25 76,27.5 L 43.5,60 L 77.5,88.5 C 80,91 79,92 75.5,92 H 59 C 57.5,92 56,91 55,90 L 28,66.5 V 92 H 14 V 22 Z"
          fill="url(#kj-orange-grad-full)"
        />

        {/* Letter j body */}
        <path
          d="M 81,32 H 92 V 78 C 92,89 83,96 71,96 C 59,96 50,91.5 45.5,84 C 44.5,82.5 45,80.5 47,80.5 H 56 C 58,80.5 59.5,81.5 60.5,83 C 62.5,86 66.5,88 71,88 C 76.5,88 81,84.5 81,78 V 32 Z"
          fill="currentColor"
          className="text-foreground"
        />

        {/* Dot of letter j */}
        <circle cx="86.5" cy="14" r="6.5" fill={redOrangeDot} />

        {/* Orange necktie */}
        <polygon points="83,38 90,38 86.5,43.5" fill={primaryOrange} />
        <polygon points="86.5,43.5 89,48 89,61 86.5,67 84,61 84,48" fill={primaryOrange} />
      </g>

      {/* Typographic brand text */}
      <text
        x="120"
        y="65"
        fontFamily="'Space Grotesk', 'Inter', sans-serif"
        fontSize="44"
        fontWeight="900"
        letterSpacing="1"
        className="text-foreground fill-current"
      >
        KEFEL
        <tspan fill={primaryOrange}> JOBS</tspan>
      </text>

      {/* Horizontal divider line */}
      <line
        x1="120"
        y1="76"
        x2="450"
        y2="76"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-foreground opacity-20"
      />

      {/* Brand Subtitle */}
      <text
        x="124"
        y="96"
        fontFamily="'Inter', sans-serif"
        fontSize="14.5"
        fontWeight="500"
        letterSpacing="4.5"
        className="text-foreground fill-current opacity-70"
      >
        Opportunities. Connections. Success.
      </text>
    </svg>
  );
}
