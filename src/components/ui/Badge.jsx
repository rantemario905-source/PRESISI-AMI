/** Label status kecil (badge) dengan varian warna. */
const VARIASI = {
  sukses: 'bg-green-100 text-green-800',
  bahaya: 'bg-red-100 text-red-800',
  peringatan: 'bg-amber-100 text-amber-800',
  info: 'bg-sky-100 text-sky-800',
  netral: 'bg-slate-100 text-slate-700',
}

export default function Badge({ variant = 'netral', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold sm:px-2.5 sm:text-xs ${
        VARIASI[variant] ?? VARIASI.netral
      } ${className}`}
    >
      {children}
    </span>
  )
}
