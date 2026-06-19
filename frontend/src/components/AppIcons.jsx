// Modern minimal icons for the install / "get the app" surfaces. The line
// icons inherit currentColor and match the stroke style of NavIcons; the Apple
// mark is a filled brand glyph. Sized via the `size` prop.
const stroke = (size) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  style: { display: 'block' },
})

export default function AppIcon({ name, size = 24 }) {
  switch (name) {
    // download → tray: the "get the app" action
    case 'download':
      return (
        <svg {...stroke(size)}>
          <path d="M12 3v11" />
          <path d="M8 10l4 4 4-4" />
          <path d="M5 16.5v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
        </svg>
      )
    // smartphone
    case 'mobile':
      return (
        <svg {...stroke(size)}>
          <rect x="7" y="2.5" width="10" height="19" rx="2.6" />
          <line x1="10.4" y1="18.4" x2="13.6" y2="18.4" />
        </svg>
      )
    // laptop
    case 'laptop':
      return (
        <svg {...stroke(size)}>
          <rect x="5" y="4.5" width="14" height="10" rx="1.6" />
          <path d="M2.5 18.5h19" />
        </svg>
      )
    // Apple brand glyph (filled)
    case 'apple':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block' }}>
          <path
            fill="currentColor"
            d="M17.05 12.54c-.03-2.59 2.11-3.83 2.21-3.9-1.2-1.76-3.08-2-3.74-2.02-1.6-.16-3.11.94-3.92.94-.81 0-2.05-.92-3.38-.9-1.74.03-3.34 1.01-4.24 2.57-1.81 3.14-.46 7.79 1.3 10.34.86 1.25 1.89 2.65 3.23 2.6 1.3-.05 1.79-.84 3.35-.84 1.55 0 2 .84 3.37.81 1.39-.02 2.27-1.27 3.12-2.52.98-1.45 1.38-2.85 1.4-2.92-.03-.01-2.7-1.04-2.73-4.12z"
          />
          <path
            fill="currentColor"
            d="M14.94 5.17c.71-.87 1.2-2.07 1.06-3.27-1.03.04-2.28.69-3.01 1.55-.66.77-1.24 1.99-1.09 3.17 1.15.09 2.32-.58 3.04-1.45z"
          />
        </svg>
      )
    default:
      return null
  }
}
