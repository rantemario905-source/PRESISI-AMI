/**
 * ==========================================================================
 * Pegawai — Riwayat & Rekap Presensi Bulanan
 * --------------------------------------------------------------------------
 * Menampilkan ringkasan status kehadiran dan detail harian milik pegawai.
 * Data izin/cuti yang disetujui otomatis ikut tampil (ditandai di presensi).
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
  { nama: 'Hadir', warna: 'bg-green-100 text-green-800' },
  { nama: 'Izin', warna: 'bg-sky-100 text-sky-800' },
  { nama: 'Sakit', warna: 'bg-sky-100 text-sky-800' },
  { nama: 'Cuti', warna: 'bg-slate-100 text-slate-700' },
  { nama: 'Dinas Luar', warna: 'bg-amber-100 text-amber-800' },
  { nama: 'Alfa', warna: 'bg-red-100 text-red-800' },
  { nama: 'Koreksi', warna: 'bg-amber-100 text-amber-800' },
]

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
    <div className="min-h-screen bg-slate-50">
      <BarAtas onKeluar={keluar} />

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-800">Riwayat &amp; Rekap Presensi</h1>
            <p className="text-sm text-slate-500">
              Ringkasan kehadiran Anda pada {namaBulan(periode)}.
            </p>
          </div>
          <div>
            <label className="label-input" htmlFor="riwayat-periode">
              Bulan
            </label>
            <input
              id="riwayat-periode"
              type="month"
              className="input-dasar max-w-[190px]"
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
            />
          </div>
        </div>

        {galat && (
          <Alert variant="bahaya" title="Gagal" className="mb-4">
            {galat}
          </Alert>
        )}

        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {STATUS.map((s) => (
            <div
              key={s.nama}
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center shadow-kartu"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                {s.nama}
              </p>
              <p className={`mx-auto mt-1.5 w-fit rounded-full px-2.5 py-0.5 text-sm font-extrabold ${s.warna}`}>
                {hitungan[s.nama]}
              </p>
            </div>
          ))}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
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
            <div className="py-14 text-center">
              <p className="text-sm font-semibold text-slate-600">Belum ada catatan pada bulan ini</p>
              <p className="mt-1 text-xs text-slate-400">Pilih bulan lain atau lakukan absensi terlebih dahulu.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tanggal</th>
                    <th className="px-5 py-3 font-semibold">Jam Masuk</th>
                    <th className="px-5 py-3 font-semibold">Jam Pulang</th>
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
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {baris.jam_masuk ? formatJam(baris.jam_masuk) : '—'}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {baris.jam_pulang ? formatJam(baris.jam_pulang) : '—'}
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
          )}
        </section>
      </main>
    </div>
  )
}
