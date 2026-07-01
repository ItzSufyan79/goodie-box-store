interface GBLogoProps {
  className?: string;
  size?: number;
}

export function GBLogo({ className, size = 28 }: GBLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="28" height="28" rx="6" className="fill-primary" />
      <text
        x="14"
        y="19"
        textAnchor="middle"
        className="fill-primary-foreground"
        fontSize="16"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        GB
      </text>
    </svg>
  );
}
