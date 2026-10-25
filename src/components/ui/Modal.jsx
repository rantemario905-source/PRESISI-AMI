/**
 * Dialog modal baku (overlay + panel). Di HP tampil sebagai bottom sheet
 * dengan safe area; di desktop sebagai dialog tengah.
 */
import { useEffect, useId } from 'react'

export default function Modal({ terbuka, onTutup, judul, children, lebar = 'max-w-lg' }) {
  const idJudul = useId()

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
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 sm:items-center sm:p-4"
      onClick={onTutup}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={idJudul}
        className={`max-h-[92dvh] w-full ${lebar} overflow-y-auto overscroll-contain rounded-t-3xl bg-white shadow-xl sm:max-h-[90vh] sm:rounded-2xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 rounded-t-3xl border-b border-slate-200 bg-white/95 backdrop-blur sm:rounded-t-2xl">
          <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
            <h3 id={idJudul} className="text-[15px] font-bold text-slate-800 sm:text-base">
              {judul}
            </h3>
            <button
              type="button"
              onClick={onTutup}
              aria-label="Tutup"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:h-10 sm:w-10"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:px-5 sm:pb-4">
          {children}
        </div>
      </div>
    </div>
  )
}
