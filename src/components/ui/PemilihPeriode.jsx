/**
 * Pemilih rentang tanggal bergaya kalender.
 * Minggu dimulai Senin; semua perhitungan memakai string "YYYY-MM-DD".
 */
import { useEffect, useMemo, useState } from 'react'
import { formatTanggal, formatTanggalRingkas, hariIni, namaBulan } from '../../utils/format.js'
import {
  NAMA_HARI,
  geserBulan,
  jumlahHari,
  matriksBulan,
  periodeDariTanggal,
  tanggalValid,
} from '../../utils/kalender.js'

export default function PemilihPeriode({
  mulai,
  selesai,
  onChange,
  label = 'Periode',
  className = '',
}) {
  const hariIniNilai = hariIni()
  const [bulanTampil, setBulanTampil] = useState(
    () => periodeDariTanggal(mulai) || periodeDariTanggal(hariIniNilai),
  )
  const [aktif, setAktif] = useState('selesai')

  useEffect(() => {
    const periode = periodeDariTanggal(mulai)
    if (periode) setBulanTampil(periode)
  }, [mulai])

  const sel = useMemo(() => matriksBulan(bulanTampil), [bulanTampil])
  const total = jumlahHari(mulai, selesai)
  const petunjuk =
    aktif === 'mulai' ? 'Pilih tanggal mulai' : 'Pilih tanggal selesai'

  const pilihHari = (tanggal) => {
    if (!tanggalValid(tanggal)) return

    if (aktif === 'mulai') {
      const akhir = selesai && selesai >= tanggal ? selesai : tanggal
      onChange?.({ mulai: tanggal, selesai: akhir })
      setAktif('selesai')
      return
    }

    if (!mulai || tanggal < mulai) {
      onChange?.({ mulai: tanggal, selesai: mulai || tanggal })
      setAktif('selesai')
      return
    }

    onChange?.({ mulai, selesai: tanggal })
    setAktif('mulai')
  }

  const pilihHariIni = () => {
    onChange?.({ mulai: hariIniNilai, selesai: hariIniNilai })
    setBulanTampil(periodeDariTanggal(hariIniNilai))
    setAktif('selesai')
  }

  return (
    <div className={`rounded-2xl border border-slate-200 bg-gradient-to-b from-sky-50/80 via-white to-white p-3 ${className}`}>
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-600 text-white shadow-sm">
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 11h18" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-bold leading-tight text-slate-800">{label}</p>
            <p className="text-[11px] leading-tight text-slate-500">{petunjuk}</p>
          </div>
        </div>
        <span
          aria-live="polite"
          className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-sky-700 ring-1 ring-sky-200"
        >
          {total > 0 ? `${total} hari` : 'Belum lengkap'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setAktif('mulai')}
          aria-pressed={aktif === 'mulai'}
          className={`min-h-[54px] min-w-0 rounded-xl border px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            aktif === 'mulai'
              ? 'border-sky-500 bg-white ring-1 ring-sky-200'
              : 'border-slate-200 bg-white/80 hover:bg-white'
          }`}
        >
          <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
            Mulai
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-bold text-slate-800">
            {formatTanggalRingkas(mulai)}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setAktif('selesai')}
          aria-pressed={aktif === 'selesai'}
          className={`min-h-[54px] min-w-0 rounded-xl border px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
            aktif === 'selesai'
              ? 'border-sky-500 bg-white ring-1 ring-sky-200'
              : 'border-slate-200 bg-white/80 hover:bg-white'
          }`}
        >
          <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
            Selesai
          </span>
          <span className="mt-0.5 block truncate text-[13px] font-bold text-slate-800">
            {formatTanggalRingkas(selesai)}
          </span>
        </button>
      </div>

      <div className="mt-3 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setBulanTampil((nilai) => geserBulan(nilai, -1) || nilai)}
            aria-label="Bulan sebelumnya"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <p className="text-[13px] font-bold text-slate-800">{namaBulan(bulanTampil)}</p>
          <button
            type="button"
            onClick={() => setBulanTampil((nilai) => geserBulan(nilai, 1) || nilai)}
            aria-label="Bulan berikutnya"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1" aria-hidden="true">
          {NAMA_HARI.map((hari) => (
            <span
              key={hari}
              className={`py-1 text-center text-[10px] font-bold uppercase tracking-wide ${
                hari === 'Min' ? 'text-rose-400' : 'text-slate-400'
              }`}
            >
              {hari}
            </span>
          ))}
        </div>

        <div className="mt-0.5 grid grid-cols-7 gap-1">
          {sel.map(({ tanggal, diBulanIni, akhirPekan }) => {
            const ujung = tanggal === mulai || tanggal === selesai
            const dalamRentang =
              mulai && selesai && tanggal >= mulai && tanggal <= selesai
            const adalahHariIni = tanggal === hariIniNilai

            return (
              <button
                key={tanggal}
                type="button"
                disabled={!diBulanIni}
                onClick={() => pilihHari(tanggal)}
                aria-label={formatTanggal(tanggal)}
                aria-pressed={ujung}
                className={`flex aspect-square w-full items-center justify-center rounded-lg text-[12px] font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                  !diBulanIni
                    ? 'cursor-default text-slate-300'
                    : ujung
                      ? 'bg-sky-600 text-white shadow-sm'
                      : dalamRentang
                        ? 'bg-sky-100 text-sky-800 hover:bg-sky-200'
                        : adalahHariIni
                          ? 'bg-white text-sky-700 ring-1 ring-sky-400 hover:bg-sky-50'
                          : akhirPekan
                            ? 'text-rose-500 hover:bg-slate-100'
                            : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {Number(tanggal.slice(8, 10))}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-[10px] leading-relaxed text-slate-400">
          Klik tanggal mulai lalu tanggal selesai.
        </p>
        <button
          type="button"
          onClick={pilihHariIni}
          className="min-h-[36px] shrink-0 rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-sky-700 ring-1 ring-sky-200 transition-colors hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          Hari ini
        </button>
      </div>
    </div>
  )
}
