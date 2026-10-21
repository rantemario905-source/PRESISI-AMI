/**
 * Logo sementara RSUD AMI (SVG geometris mengikuti skema warna logo:
 * lingkaran biru + palang kesehatan + garis hijau).
 * Ganti dengan file asli di /public/logo-ami.png bila logo resmi tersedia:
 *   <img src="/logo-ami.png" alt="Logo RSUD AMI" />
 */
export default function LogoRSUD({ className = 'h-16 w-16' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Logo RSUD AMI">
      <circle cx="60" cy="60" r="56" fill="#0284c7" />
      <circle cx="60" cy="60" r="56" fill="none" stroke="#0c4a6e" strokeWidth="4" />
      {/* Palang kesehatan */}
      <rect x="50" y="26" width="20" height="68" rx="6" fill="#ffffff" />
      <rect x="26" y="50" width="68" height="20" rx="6" fill="#ffffff" />
      {/* Aksen hijau (akses) */}
      <path
        d="M28 88 C 44 104, 76 104, 92 88"
        fill="none"
        stroke="#16a34a"
        strokeWidth="9"
        strokeLinecap="round"
      />
    </svg>
  )
}
