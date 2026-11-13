import logoAplikasi from '../assets/logo-aplikasi.png'

export default function LogoAplikasi({ className = 'h-16 w-16' }) {
  return (
    <img
      src={logoAplikasi}
      alt="Logo PRESISI AMI"
      className={`object-contain ${className}`}
    />
  )
}
