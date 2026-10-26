import { useProgres } from '../../context/ProgressContext.jsx'

export default function BilahProgres() {
  const { tampil, progres } = useProgres()

  return (
    <div
      role="progressbar"
      aria-label="Memuat halaman"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(progres)}
      aria-hidden={!tampil}
      className={`pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] transition-opacity duration-200 ${
        tampil ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        style={{ width: `${progres}%` }}
        className="h-full rounded-r-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.85)] transition-[width] duration-200 ease-out"
      />
    </div>
  )
}
