import { useEffect, useId, useRef, useState } from 'react'
import { inisialNama } from '../../utils/format.js'

export default function MenuAkun({ nama, peran, onKeluar }) {
  const [terbuka, setTerbuka] = useState(false)
  const [menutup, setMenutup] = useState(false)
  const idMenu = useId()
  const wadahRef = useRef(null)
  const tombolRef = useRef(null)
  const tampil = terbuka || menutup

  useEffect(() => {
    if (!tampil) return undefined

    const tanganiPointer = (event) => {
      if (wadahRef.current?.contains(event.target)) return
      setTerbuka(false)
      setMenutup(true)
    }
    const tanganiTombol = (event) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      setTerbuka(false)
      setMenutup(true)
      tombolRef.current?.focus()
    }

    document.addEventListener('pointerdown', tanganiPointer)
    document.addEventListener('keydown', tanganiTombol)
    return () => {
      document.removeEventListener('pointerdown', tanganiPointer)
      document.removeEventListener('keydown', tanganiTombol)
    }
  }, [tampil])

  const keluar = () => {
    setTerbuka(false)
    setMenutup(true)
    onKeluar?.()
  }

  return (
    <div ref={wadahRef} className="relative">
      <button
        ref={tombolRef}
        type="button"
        onClick={() => {
          if (terbuka) {
            setTerbuka(false)
            setMenutup(true)
            return
          }
          setMenutup(false)
          setTerbuka(true)
        }}
        aria-haspopup="menu"
        aria-expanded={terbuka}
        aria-controls={idMenu}
        aria-label="Menu akun"
        className="flex min-h-[44px] items-center gap-2 rounded-xl px-1.5 text-right transition-colors hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:min-h-[38px]"
      >
        <span className="hidden min-w-0 md:block">
          <span className="block max-w-[180px] truncate text-sm font-bold text-slate-800">
            {nama}
          </span>
          <span className="block text-[11px] font-semibold text-sky-600">{peran}</span>
        </span>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-extrabold text-sky-700 ring-1 ring-sky-200">
          {inisialNama(nama ?? '')}
        </span>
      </button>

      {tampil && (
        <div
          id={idMenu}
          role="menu"
          aria-hidden={!terbuka}
          onAnimationEnd={(event) => {
            if (event.target !== event.currentTarget) return
            if (event.animationName === 'dropdown-keluar' && !terbuka) setMenutup(false)
          }}
          className={`absolute right-0 top-full z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl ${
            terbuka ? 'animate-dropdown-masuk' : 'pointer-events-none animate-dropdown-keluar'
          }`}
        >
          <div className="border-b border-slate-100 px-3 py-2.5 md:hidden">
            <p className="truncate text-sm font-bold text-slate-800">{nama}</p>
            <p className="text-[11px] font-semibold text-sky-600">{peran}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            tabIndex={terbuka ? 0 : -1}
            onClick={keluar}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 focus:outline-none focus-visible:bg-rose-50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-rose-500"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <path d="M16 17l5-5-5-5M21 12H9" />
            </svg>
            Keluar
          </button>
        </div>
      )}
    </div>
  )
}
