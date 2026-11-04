/** Kolom pencarian nama dengan tombol hapus. */
import { useId } from 'react'

export default function PencarianNama({
  nilai = '',
  onChange,
  label = 'Cari nama',
  placeholder = 'Cari nama pegawai…',
  className = '',
}) {
  const id = useId()
  const terisi = Boolean(nilai)

  return (
    <div className={`relative min-w-0 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400"
        aria-hidden="true"
      >
        <svg
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3.5-3.5" />
        </svg>
      </span>
      <input
        id={id}
        type="text"
        inputMode="search"
        autoComplete="off"
        className="input-dasar pl-10 pr-11"
        placeholder={placeholder}
        value={nilai}
        onChange={(event) => onChange?.(event.target.value)}
      />
      {terisi && (
        <button
          type="button"
          onClick={() => onChange?.('')}
          aria-label="Hapus pencarian nama"
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-slate-400 transition-colors hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  )
}
