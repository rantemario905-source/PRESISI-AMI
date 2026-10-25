/**
 * ==========================================================================
 * Pegawai — Riwayat & Rekap Presensi Bulanan
 * --------------------------------------------------------------------------
 * Menampilkan ringkasan status kehadiran dan detail harian milik pegawai.
 * Data Sakit/Cuti/Dinas Luar yang disetujui otomatis ikut tampil.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { ambilRiwayatBulanan } from '../services/riwayatService.js'
import {
  formatJam,
  formatJarak,
  formatTanggalRingkas,
  namaBulan,
  periodeBulanIni,
} from '../utils/format.js'
import { varianStatusKehadiran } from '../utils/status.js'
import { Alert, Badge, Button, Spinner } from '../components/ui/index.js'
import BarAtas from '../components/BarAtas.jsx'

const STATUS = [
  { nama: 'Hadir', warna: 'bg-green-50 text-green-800' },
  { nama: 'Sakit', warna: 'bg-sky-50 text-sky-800' },
  { nama: 'Cuti', warna: 'bg-slate-100 text-slate-700' },
  { nama: 'Dinas Luar', warna: 'bg-amber-50 text-amber-800' },
  { nama: 'Alfa', warna: 'bg-red-50 text-red-800' },
  { nama: 'Koreksi', warna: 'bg-amber-50 text-amber-800' },
]

/** "20:02 WITA" → "20:02" agar pas di kartu ringkas */
const jamSingkat = (iso) => (iso ? formatJam(iso).replace(' WITA', '') : '—')

export default function RiwayatSaya() {
  const { profil, keluar } = useAuth()
  const [periode, setPeriode] = useState(periodeBulanIni())
  const [riwayat, setRiwayat] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)

  const muat = useCallback(async () => {
    if (!profil) return
    setMemuat(true)
    try {
      const data = await ambilRiwayatBulanan(profil.id, periode)
      setRiwayat(data)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat riwayat presensi.')
    } finally {
      setMemuat(false)
    }
  }, [profil, periode])

  useEffect(() => {
    muat()
  }, [muat])

  const hitungan = useMemo(() => {
    const hasil = Object.fromEntries(STATUS.map((s) => [s.nama, 0]))
    for (const baris of riwayat) {
      if (hasil[baris.status_kehadiran] !== undefined) hasil[baris.status_kehadiran] += 1
    }
    return hasil
  }, [riwayat])

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <BarAtas onKeluar={keluar} />

      <main
        id="konten"
        className="pb-navigasi mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6"
      >
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Riwayat &amp; Rekap Presensi
            </h1>
            <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
              Ringkasan kehadiran Anda pada {namaBulan(periode)}.
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <label className="label-input" htmlFor="riwayat-periode">
              Bulan
            </label>
            <input
              id="riwayat-periode"
              type="month"
              className="input-dasar w-full sm:max-w-[190px]"
              value={periode}
              onChange={(e) =>
                setPeriode(e.target.value || periodeBulanIni())
              }
            />
          </div>
        </div>

        {galat && (
          <Alert variant="bahaya" title="Gagal" className="mb-4">
            {galat}
          </Alert>
        )}

        {/* Ringkasan status */}
        <div className="mb-4 grid grid-cols-3 gap-2 sm:mb-5 sm:grid-cols-6">
          {STATUS.map((s) => (
            <div
              key={s.nama}
              className={`rounded-xl border border-slate-200 px-1.5 py-2.5 text-center shadow-kartu sm:px-2 ${s.warna}`}
            >
              <p className="text-[9px] font-bold uppercase leading-tight tracking-wide text-slate-500 sm:text-[10px]">
                {s.nama}
              </p>
              <p className="mt-1 text-lg font-extrabold tabular-nums leading-none sm:text-xl">
                {hitungan[s.nama]}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Detail Harian</h2>
              <p className="text-xs text-slate-500">{riwayat.length} catatan presensi</p>
            </div>
            <Button variant="sekunder" size="sm" onClick={muat} disabled={memuat}>
              Muat ulang
            </Button>
          </div>

          {memuat ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
              <Spinner /> Memuat riwayat…
            </div>
          ) : riwayat.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-semibold text-slate-600">Belum ada catatan pada bulan ini</p>
              <p className="mt-1 text-xs text-slate-400">
                Pilih bulan lain atau lakukan absensi terlebih dahulu.
              </p>
            </div>
          ) : (
            <>
              {/* HP: kartu harian */}
              <div className="space-y-2.5 p-3 sm:hidden">
                {riwayat.map((baris) => (
                  <article
                    key={baris.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[13px] font-bold text-slate-800">
                        {formatTanggalRingkas(baris.tanggal)}
                      </p>
                      <Badge variant={varianStatusKehadiran(baris.status_kehadiran)}>
                        {baris.status_kehadiran}
                      </Badge>
                    </div>

                    <div className="mt-2.5 grid grid-cols-3 divide-x divide-slate-200 rounded-lg bg-white py-2 text-center ring-1 ring-slate-200">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Masuk
                        </p>
                        <p className="mt-0.5 text-[13px] font-bold tabular-nums text-slate-800">
                          {jamSingkat(baris.jam_masuk)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Pulang
                        </p>
                        <p className="mt-0.5 text-[13px] font-bold tabular-nums text-slate-800">
                          {jamSingkat(baris.jam_pulang)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                          Jarak
                        </p>
                        <p className="mt-0.5 text-[13px] font-bold text-slate-800">
                          {formatJarak(baris.jarak_masuk)}
                        </p>
                      </div>
                    </div>

                    {Number(baris.menit_terlambat) > 0 && (
                      <p className="mt-2 text-[11px] font-semibold text-amber-700">
                        Terlambat {baris.menit_terlambat} menit
                      </p>
                    )}

                    {baris.alasan_koreksi && (
                      <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800">
                        <span className="font-semibold">Koreksi:</span> {baris.alasan_koreksi}
                      </p>
                    )}
                  </article>
                ))}
              </div>

              {/* Desktop: tabel */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Tanggal</th>
                      <th className="px-5 py-3 font-semibold">Jam Masuk</th>
                      <th className="px-5 py-3 font-semibold">Jam Pulang</th>
                      <th className="px-5 py-3 font-semibold">Terlambat</th>
                      <th className="px-5 py-3 font-semibold">Jarak</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {riwayat.map((baris) => (
                      <tr key={baris.id} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-3 font-medium text-slate-700">
                          {formatTanggalRingkas(baris.tanggal)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-600">
                          {baris.jam_masuk ? formatJam(baris.jam_masuk) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 tabular-nums text-slate-600">
                          {baris.jam_pulang ? formatJam(baris.jam_pulang) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs tabular-nums">
                          {Number(baris.menit_terlambat) > 0 ? (
                            <span className="font-semibold text-amber-700">
                              {baris.menit_terlambat} mnt
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-slate-600">{formatJarak(baris.jarak_masuk)}</td>
                        <td className="px-5 py-3">
                          <Badge variant={varianStatusKehadiran(baris.status_kehadiran)}>
                            {baris.status_kehadiran}
                          </Badge>
                        </td>
                        <td className="max-w-[220px] px-5 py-3 text-xs text-slate-500">
                          {baris.alasan_koreksi || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
