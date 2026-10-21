/**
 * Dialog modal baku (overlay + panel). Menutup dengan klik latar atau Esc.
 */
import { useEffect } from 'react'

export default function Modal({ terbuka, onTutup, judul, children, lebar = 'max-w-lg' }) {
  useEffect(() => {
    if (!terbuka) return undefined
    const tanganiTombol = (event) => {
      if (event.key === 'Escape') onTutup?.()
    }
    document.addEventListener('keydown', tanganiTombol)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', tanganiTombol)
      document.body.style.overflow = ''
    }
  }, [terbuka, onTutup])

  if (!terbuka) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onClick={onTutup}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        className={`max-h-[92vh] w-full ${lebar} overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-bold text-slate-800">{judul}</h3>
          <button
            type="button"
            onClick={onTutup}
            aria-label="Tutup"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
