/** Tombol baku aplikasi dengan beberapa varian warna. */
const VARIASI = {
  utama: 'bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white shadow-sm',
  sukses: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white shadow-sm',
  sekunder:
    'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 active:bg-slate-100',
  lembut: 'bg-sky-50 text-sky-700 hover:bg-sky-100 active:bg-sky-200',
  bahaya: 'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
  bahayaLembut: 'bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-200',
}

const UKURAN = {
  sm: 'min-h-[44px] px-3.5 py-2 text-xs rounded-lg sm:min-h-[36px] sm:px-3 sm:py-1.5',
  md: 'min-h-[44px] px-4 py-2.5 text-sm rounded-xl',
  lg: 'min-h-[54px] px-5 py-3 text-[15px] sm:text-base rounded-xl',
}

const DASAR =
  'inline-flex min-w-0 select-none items-center justify-center gap-2 text-center font-semibold leading-tight ' +
  'transition-[background-color,color,box-shadow,transform] duration-150 active:scale-[0.98] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100'

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
