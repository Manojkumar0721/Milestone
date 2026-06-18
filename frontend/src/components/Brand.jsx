// App logo + wordmark — the journey-path-to-flag motif in a gradient tile.
export default function Brand({ size = 38 }) {
  return (
    <div className="brand-block">
      <span className="logo" aria-hidden="true">
        <svg viewBox="0 0 40 40" width={size} height={size}>
          <defs>
            <linearGradient id="logoG" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#6366f1" />
              <stop offset="1" stopColor="#f472b6" />
            </linearGradient>
          </defs>
          <rect width="40" height="40" rx="11" fill="url(#logoG)" />
          <path
            d="M11 30 C 19 27, 16 18, 22 15 S 27 10, 29 10"
            fill="none"
            stroke="#fff"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.95"
          />
          <circle cx="11" cy="30" r="2.6" fill="#fff" />
          <circle cx="29" cy="10" r="3.6" fill="#fff" />
        </svg>
      </span>
      <div className="brand-text">
        <div className="brand-name">Milestone</div>
        <div className="tagline">Reach the finish line</div>
      </div>
    </div>
  )
}
