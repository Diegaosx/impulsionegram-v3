// Brand icons not available in lucide-react.
interface IconProps {
  className?: string;
}

export function TikTokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

// X (formerly Twitter) logo.
export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Kwai's official line mark (two heads + rounded body + play notch), from the
// uploaded kwai-svgrepo-com.svg. Rendered as strokes in currentColor with a
// thicker stroke so it stays legible at small sizes.
export function KwaiIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="m20.8501,42.5h13.4776c2.9774,0,5.391-2.4137,5.391-5.391v-7.7644c0-2.9774-2.4137-5.391-5.391-5.391h-13.4776c-2.9774,0-5.391,2.4137-5.391,5.391v7.7644c0,2.9774,2.4137,5.391,5.391,5.391Z" />
      <circle cx="18.3283" cy="13.2606" r="7.7606" />
      <circle cx="32.9039" cy="14.2064" r="6.8149" />
      <path d="m15.4591,30.5937l-4.4824-2.5879c-1.198-.6917-2.6955.1729-2.6955,1.5563v7.3526c0,1.3833,1.4975,2.2479,2.6955,1.5563l4.4824-2.5879" />
    </svg>
  );
}
