/** Tombol baku aplikasi dengan beberapa varian warna. */
const VARIASI = {
  utama: 'bg-sky-600 hover:bg-sky-700 text-white shadow-sm',
  sukses: 'bg-green-600 hover:bg-green-700 text-white shadow-sm',
  sekunder: 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50',
  lembut: 'bg-sky-50 text-sky-700 hover:bg-sky-100',
  bahaya: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
  bahayaLembut: 'bg-red-50 text-red-700 hover:bg-red-100',
}

const UKURAN = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
}

const DASAR =
  'inline-flex items-center justify-center gap-2 font-semibold transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

export default function Button({
  variant = 'utama',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button',
  children,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`${DASAR} ${VARIASI[variant] ?? VARIASI.utama} ${UKURAN[size] ?? UKURAN.md} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
