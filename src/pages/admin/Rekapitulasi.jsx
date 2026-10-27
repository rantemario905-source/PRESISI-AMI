/**
 * ==========================================================================
 * Super Admin — Rekapitulasi & Cetak Laporan
 * --------------------------------------------------------------------------
 * Rekap bulanan per unit kerja: ringkasan per pegawai atau detail harian.
 * Dilengkapi ekspor CSV dan cetak (print) laporan akhir bulan.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ambilRekapBulanan } from '../../services/reportService.js'
import { ambilUnitKerja } from '../../services/pegawaiService.js'
import {
  formatJam,
  formatJarak,
  formatTanggalRingkas,
  namaBulan,
  periodeBulanIni,
} from '../../utils/format.js'
import { unduhCsv } from '../../utils/csv.js'
import { varianStatusKehadiran } from '../../utils/status.js'
import { NAMA_RUMAH_SAKIT } from '../../config/constants.js'
import { Alert, Badge, Button, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const KOLOM_STATUS = ['Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi']

export default function Rekapitulasi() {
  const [periode, setPeriode] = useState(periodeBulanIni())
  const [unit, setUnit] = useState('semua')
  const [units, setUnits] = useState([])
  const [tampilan, setTampilan] = useState('ringkasan')
  const [data, setData] = useState({ pegawai: [], presensi: [] })
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)

  useEffect(() => {
    ambilUnitKerja()
      .then(setUnits)
      .catch(() => setUnits([]))
  }, [])

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      const hasil = await ambilRekapBulanan({ periode, unit })
      setData(hasil)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat rekapitulasi.')
    } finally {
      setMemuat(false)
    }
  }, [periode, unit])

  useEffect(() => {
    muat()
  }, [muat])

  /** Ringkasan per pegawai: hitungan tiap status kehadiran. */
  const ringkasan = useMemo(() => {
    const peta = new Map()
    data.pegawai.forEach((p) => {
      peta.set(p.id, {
        ...p,
        hitungan: Object.fromEntries(KOLOM_STATUS.map((s) => [s, 0])),
        total: 0,
        terlambat: 0,
        totalMenitTerlambat: 0,
      })
    })

    data.presensi.forEach((baris) => {
      const entri = peta.get(baris.user_id)
      if (!entri) return
      if (entri.hitungan[baris.status_kehadiran] !== undefined) {
        entri.hitungan[baris.status_kehadiran] += 1
      }
      entri.total += 1
      const menit = Number(baris.menit_terlambat ?? 0)
      if (menit > 0) {
        entri.terlambat += 1
        entri.totalMenitTerlambat += menit
      }
    })

    return [...peta.values()]
  }, [data])

  const ekspor = () => {
    if (tampilan === 'ringkasan') {
      unduhCsv(
        `rekap-presensi-${periode}${unit === 'semua' ? '' : `-${unit}`}.csv`,
        ringkasan,
        [
          { label: 'Nama', nilai: 'nama' },
          { label: 'Unit Kerja', nilai: 'unit_kerja' },
          ...KOLOM_STATUS.map((s) => ({ label: s, nilai: (b) => b.hitungan[s] })),
          { label: 'Terlambat (kali)', nilai: 'terlambat' },
          { label: 'Total Menit Terlambat', nilai: 'totalMenitTerlambat' },
          { label: 'Total Tercatat', nilai: 'total' },
        ],
      )
    } else {
      unduhCsv(
        `detail-presensi-${periode}${unit === 'semua' ? '' : `-${unit}`}.csv`,
        data.presensi,
        [
          { label: 'Tanggal', nilai: (b) => b.tanggal },
          { label: 'Nama', nilai: (b) => b.pegawai?.nama ?? '' },
          { label: 'Unit Kerja', nilai: (b) => b.pegawai?.unit_kerja ?? '' },
          { label: 'Jam Masuk', nilai: (b) => (b.jam_masuk ? formatJam(b.jam_masuk) : '') },
          { label: 'Jam Pulang', nilai: (b) => (b.jam_pulang ? formatJam(b.jam_pulang) : '') },
          { label: 'Status', nilai: 'status_kehadiran' },
          { label: 'Menit Terlambat', nilai: (b) => b.menit_terlambat ?? 0 },
          { label: 'Jarak Masuk (m)', nilai: (b) => b.jarak_masuk ?? '' },
        ],
      )
    }
  }

  const judulUnit = unit === 'semua' ? 'Semua Unit Kerja' : unit

  return (
    <>
      <div className="tanpa-cetak">
        <KepalaHalaman
          judul="Rekapitulasi & Cetak Laporan"
          deskripsi="Laporan absensi bulanan per unit kerja, termasuk rekap keterlambatan."
        />

        {galat && (
          <Alert variant="bahaya" title="Gagal" className="mb-4">
            {galat}
          </Alert>
        )}

        <div className="mb-2 flex justify-end">
          <div className="aksi-halaman">
            <Button variant="sekunder" size="sm" onClick={ekspor} disabled={memuat}>
              Ekspor CSV
            </Button>
            <Button variant="utama" size="sm" onClick={() => window.print()} disabled={memuat}>
              Cetak PDF
            </Button>
          </div>
        </div>

        <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-kartu sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
          <div>
            <label className="label-input" htmlFor="rekap-periode">
              Bulan Laporan
            </label>
            <input
              id="rekap-periode"
              type="month"
              className="input-dasar"
              value={periode}
              onChange={(e) =>
                setPeriode(e.target.value || periodeBulanIni())
              }
            />
          </div>
          <div>
            <label className="label-input" htmlFor="rekap-unit">
              Unit Kerja
            </label>
            <select
              id="rekap-unit"
              className="input-dasar"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              <option value="semua">Semua unit</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-input" htmlFor="rekap-tampilan">
              Tampilan
            </label>
            <select
              id="rekap-tampilan"
              className="input-dasar"
              value={tampilan}
              onChange={(e) => setTampilan(e.target.value)}
            >
              <option value="ringkasan">Ringkasan per Pegawai</option>
              <option value="detail">Detail Harian</option>
            </select>
          </div>
          <div className="flex items-end">
            <div className="w-full rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-600">
              <p className="font-semibold text-slate-700">{namaBulan(periode)}</p>
              <p>
                {ringkasan.length} pegawai · {data.presensi.length} catatan
              </p>
            </div>
          </div>
        </div>
      </div>

      {memuat ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Spinner /> Menyusun rekapitulasi…
        </div>
      ) : (
        <section className="area-cetak rounded-2xl border border-slate-200 bg-white p-5 shadow-kartu">
          {/* Kepala laporan (selalu tampil, khususnya saat dicetak) */}
          <div className="mb-5 border-b border-slate-300 pb-4 text-center">
            <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-800">
              {NAMA_RUMAH_SAKIT}
            </h2>
            <h3 className="text-sm font-bold uppercase text-slate-700">Laporan Presensi Bulanan</h3>
            <p className="mt-1 text-xs text-slate-600">
              Periode: {namaBulan(periode)} · Unit: {judulUnit}
            </p>
          </div>

          {tampilan === 'ringkasan' ? (
            ringkasan.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-500">
                Tidak ada pegawai pada unit ini.
              </p>
            ) : (
              <>
                {/* HP: kartu ringkasan per pegawai */}
                <div className="space-y-2 md:hidden print:hidden">
                  {ringkasan.map((baris) => (
                    <article
                      key={baris.id}
                      className="rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-slate-800">
                            {baris.nama}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">{baris.unit_kerja}</p>
                        </div>
                        <Badge variant="info">{baris.total} total</Badge>
                      </div>

                      <div className="mt-2 grid grid-cols-4 gap-1.5">
                        {KOLOM_STATUS.map((s) => (
                          <div
                            key={s}
                            className="rounded-lg bg-white px-1 py-1.5 text-center ring-1 ring-slate-200"
                          >
                            <p className="text-[8px] font-bold uppercase leading-tight tracking-wide text-slate-400">
                              {s}
                            </p>
                            <p className="mt-0.5 text-xs font-extrabold tabular-nums text-slate-800">
                              {baris.hitungan[s] || '–'}
                            </p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[10px] font-semibold text-slate-500">
                        Terlambat:{' '}
                        <b className="text-amber-700">
                          {baris.terlambat} kali
                        </b>{' '}
                        · {baris.totalMenitTerlambat} menit
                      </p>
                    </article>
                  ))}
                </div>

                {/* Desktop & cetak: tabel */}
                <div className="hidden overflow-x-auto md:block print:block">
                  <table className="w-full min-w-[980px] text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">No</th>
                        <th className="px-3 py-2.5 font-semibold">Nama Pegawai</th>
                        <th className="px-3 py-2.5 font-semibold">Unit Kerja</th>
                        {KOLOM_STATUS.map((s) => (
                          <th key={s} className="px-3 py-2.5 text-center font-semibold">
                            {s}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 text-center font-semibold">Terlambat</th>
                        <th className="px-3 py-2.5 text-center font-semibold">Menit</th>
                        <th className="px-3 py-2.5 text-center font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ringkasan.map((baris, indeks) => (
                        <tr key={baris.id}>
                          <td className="px-3 py-2 text-xs text-slate-500">{indeks + 1}</td>
                          <td className="px-3 py-2 font-semibold text-slate-800">{baris.nama}</td>
                          <td className="px-3 py-2 text-xs text-slate-600">{baris.unit_kerja}</td>
                          {KOLOM_STATUS.map((s) => (
                            <td key={s} className="px-3 py-2 text-center text-slate-700">
                              {baris.hitungan[s] || '–'}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center text-amber-700">
                            {baris.terlambat || '–'}
                          </td>
                          <td className="px-3 py-2 text-center text-slate-600">
                            {baris.totalMenitTerlambat || '–'}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-slate-800">
                            {baris.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )
          ) : data.presensi.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              Tidak ada catatan presensi pada periode ini.
            </p>
          ) : (
            <>
              {/* HP: kartu detail harian */}
              <div className="space-y-2 md:hidden print:hidden">
                {data.presensi.map((baris) => (
                  <article
                    key={baris.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-slate-800">
                          {baris.pegawai?.nama ?? '—'}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {formatTanggalRingkas(baris.tanggal)} ·{' '}
                          {baris.pegawai?.unit_kerja ?? '—'}
                        </p>
                      </div>
                      <Badge variant={varianStatusKehadiran(baris.status_kehadiran)}>
                        {baris.status_kehadiran}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span>
                        Masuk{' '}
                        <b className="font-semibold tabular-nums text-slate-800">
                          {baris.jam_masuk ? formatJam(baris.jam_masuk) : '—'}
                        </b>
                      </span>
                      <span>
                        Pulang{' '}
                        <b className="font-semibold tabular-nums text-slate-800">
                          {baris.jam_pulang ? formatJam(baris.jam_pulang) : '—'}
                        </b>
                      </span>
                      <span>
                        Jarak <b className="font-semibold text-slate-800">{formatJarak(baris.jarak_masuk)}</b>
                      </span>
                      {Number(baris.menit_terlambat) > 0 && (
                        <span className="font-semibold text-amber-700">
                          Terlambat {baris.menit_terlambat} mnt
                        </span>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop & cetak: tabel */}
              <div className="hidden overflow-x-auto md:block print:block">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5 font-semibold">Tanggal</th>
                      <th className="px-3 py-2.5 font-semibold">Nama</th>
                      <th className="px-3 py-2.5 font-semibold">Unit</th>
                      <th className="px-3 py-2.5 font-semibold">Masuk</th>
                      <th className="px-3 py-2.5 font-semibold">Pulang</th>
                      <th className="px-3 py-2.5 font-semibold">Status</th>
                      <th className="px-3 py-2.5 text-center font-semibold">Terlambat</th>
                      <th className="px-3 py-2.5 font-semibold">Jarak</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.presensi.map((baris) => (
                      <tr key={baris.id}>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">
                          {formatTanggalRingkas(baris.tanggal)}
                        </td>
                        <td className="px-3 py-2 font-semibold text-slate-800">
                          {baris.pegawai?.nama ?? '—'}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {baris.pegawai?.unit_kerja ?? '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {baris.jam_masuk ? formatJam(baris.jam_masuk) : '—'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                          {baris.jam_pulang ? formatJam(baris.jam_pulang) : '—'}
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant={varianStatusKehadiran(baris.status_kehadiran)}>
                            {baris.status_kehadiran}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 text-center text-xs tabular-nums">
                          {Number(baris.menit_terlambat) > 0 ? (
                            <span className="font-semibold text-amber-700">
                              {baris.menit_terlambat} mnt
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {formatJarak(baris.jarak_masuk)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Blok tanda tangan khusus cetak */}
          <div className="mt-8 hidden grid-cols-2 gap-8 text-center text-xs text-slate-700 print:grid">
            <div>
              <p>Mengetahui,</p>
              <p className="font-semibold">Kepala Bidang / Unit</p>
              <div className="h-16" />
              <p className="border-t border-slate-400 pt-1 font-semibold">
                ............................................
              </p>
            </div>
            <div>
              <p>Dicetak pada {formatTanggalRingkas(new Date().toISOString())},</p>
              <p className="font-semibold">Admin IT / Kepegawaian</p>
              <div className="h-16" />
              <p className="border-t border-slate-400 pt-1 font-semibold">
                ............................................
              </p>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
