/** Kotak notifikasi (alert) dengan ikon untuk pesan sukses/galat/info. */
const VARIASI = {
  sukses: { wadah: 'bg-green-100 border-green-200 text-green-800', ikon: '✓' },
  bahaya: { wadah: 'bg-red-100 border-red-200 text-red-800', ikon: '✕' },
  peringatan: { wadah: 'bg-amber-100 border-amber-200 text-amber-800', ikon: '!' },
  info: { wadah: 'bg-sky-100 border-sky-200 text-sky-800', ikon: 'i' },
}

export default function Alert({ variant = 'info', title, children, className = '' }) {
  const v = VARIASI[variant] ?? VARIASI.info
  return (
    <div role="alert" className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${v.wadah} ${className}`}>
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/70 text-xs font-bold"
      >
        {v.ikon}
      </span>
      <div>
        {title && <p className="font-bold">{title}</p>}
        {typeof children === 'string' ? <p>{children}</p> : children}
      </div>
    </div>
  )
}
