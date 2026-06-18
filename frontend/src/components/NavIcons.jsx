// Minimal stroke icons for the mobile tab bar. They use currentColor so they
// inherit the tab's active/inactive color, and stay light and clean.
const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: { display: 'block' },
}

export default function NavIcon({ name }) {
  switch (name) {
    // winding path → finish point: mirrors the journey-map / logo motif
    case 'journey':
      return (
        <svg {...base}>
          <path d="M6 18c3.6-.7 3-5.6 6-6.6S17.4 6.4 18 6" />
          <circle cx="6" cy="18" r="1.7" fill="currentColor" stroke="none" />
          <circle cx="18" cy="6" r="2.1" />
        </svg>
      )
    // checklist
    case 'roadmap':
      return (
        <svg {...base}>
          <path d="M3.5 6.2l1.4 1.4L7.4 5" />
          <line x1="11" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      )
    // trending up
    case 'momentum':
      return (
        <svg {...base}>
          <polyline points="3 16.5 9 10.5 13 14.5 21 6.5" />
          <polyline points="15 6.5 21 6.5 21 12.5" />
        </svg>
      )
    // target
    case 'goals':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      )
    default:
      return null
  }
}
