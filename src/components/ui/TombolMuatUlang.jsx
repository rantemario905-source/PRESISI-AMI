/** Tombol muat ulang dengan ikon refresh dan status proses. */
import Button from './Button.jsx'

export default function TombolMuatUlang({
  onClick,
  memuat = false,
  label = 'Muat ulang',
  size = 'sm',
  className = '',
  ...props
}) {
  return (
    <Button
      variant="lembut"
      size={size}
      onClick={onClick}
      disabled={memuat}
      aria-label={memuat ? 'Sedang memuat ulang data' : label}
      className={`group ${className}`}
      {...props}
    >
      {memuat ? (
        <svg
          className="h-4 w-4 shrink-0 animate-spin"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <svg
          className="h-4 w-4 shrink-0 transition-transform duration-300 group-hover:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 11a8.1 8.1 0 00-14.9-4.7L3 9" />
          <path d="M3 4v5h5" />
          <path d="M4 13a8.1 8.1 0 0014.9 4.7L21 15" />
          <path d="M21 20v-5h-5" />
        </svg>
      )}
      <span>{memuat ? 'Memuat…' : label}</span>
    </Button>
  )
}
