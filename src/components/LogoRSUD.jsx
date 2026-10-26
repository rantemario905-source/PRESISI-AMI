import logoRSUD from '../assets/logo-rsud-ami.png'

export default function LogoRSUD({ className = 'h-16 w-16' }) {
  return (
    <img
      src={logoRSUD}
      alt="Logo RSUD Aji Muhammad Idris"
      className={`object-contain ${className}`}
    />
  )
}
