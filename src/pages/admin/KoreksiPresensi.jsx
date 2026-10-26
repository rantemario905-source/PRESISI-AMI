/**
 * ==========================================================================
 * Super Admin — Koreksi Presensi & Audit Trail
 * --------------------------------------------------------------------------
 * Setiap koreksi WAJIB menyertakan alasan. Perubahan dicatat pada tabel
 * audit (koreksi_presensi) oleh RPC `koreksi_presensi`.
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import {
  ambilAuditKoreksi,
  ambilPresensiPeriode,
  simpanKoreksi,
} from '../../services/correctionService.js'
import { ambilUnitKerja } from '../../services/pegawaiService.js'
import {
  akhirBulan,
  formatJam,
  formatJamInput,
  formatTanggal,
  formatTanggalRingkas,
  gabungTanggalJam,
  periodeBulanIni,
} from '../../utils/format.js'
import { varianStatusKehadiran } from '../../utils/status.js'
import { Alert, Badge, Button, Modal, Spinner, TabBar } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const STATUS = ['Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi']
const TAB = [
  { nilai: 'data', label: 'Data Presensi' },
  { nilai: 'audit', label: 'Audit Trail' },
]

/** "20:02 WITA" → "20:02" untuk kartu HP */
const jamSingkat = (iso) => (iso ? formatJam(iso).replace(' WITA', '') : '—')

export default function KoreksiPresensi() {
  const [tab, setTab] = useState('data')
  const [periode, setPeriode] = useState(periodeBulanIni())
  const [unit, setUnit] = useState('semua')
  const [units, setUnits] = useState([])
  const [daftar, setDaftar] = useState([])
  const [audit, setAudit] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [galatModal, setGalatModal] = useState(null)
  const [pesan, setPesan] = useState(null)

  const [pilih, setPilih] = useState(null)
  const [form, setForm] = useState({ jamMasuk: '', jamPulang: '', status: 'Hadir', alasan: '' })
  const [menyimpan, setMenyimpan] = useState(false)

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      const data = await ambilPresensiPeriode({
        mulai: `${periode}-01`,
        selesai: akhirBulan(periode),
        unit,
      })
      setDaftar(data)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat data presensi.')
    } finally {
      setMemuat(false)
    }
  }, [periode, unit])

  useEffect(() => {
    muat()
  }, [muat])

  useEffect(() => {
    ambilUnitKerja()
      .then(setUnits)
      .catch(() => setUnits([]))
  }, [])

  useEffect(() => {
    if (tab !== 'audit') return
    ambilAuditKoreksi()
      .then(setAudit)
      .catch((err) => setGalat(err.message || 'Gagal memuat audit trail.'))
  }, [tab, pesan])

  const bukaKoreksi = (baris) => {
    setPilih(baris)
    setGalatModal(null)
    setForm({
      jamMasuk: formatJamInput(baris.jam_masuk),
      jamPulang: formatJamInput(baris.jam_pulang),
      status: baris.status_kehadiran,
      alasan: '',
    })
  }

  const simpan = async (event) => {
    event.preventDefault()
    setGalatModal(null)
    setPesan(null)

    try {
      if (form.alasan.trim().length < 5) {
        throw new Error('Alasan koreksi wajib diisi minimal 5 karakter.')
      }
      if (form.jamPulang && !form.jamMasuk) {
        throw new Error('Jam pulang tidak boleh diisi jika jam masuk kosong.')
      }

      const jamMasuk = form.jamMasuk ? gabungTanggalJam(pilih.tanggal, form.jamMasuk) : null
      const jamPulang = form.jamPulang ? gabungTanggalJam(pilih.tanggal, form.jamPulang) : null

      if (jamMasuk && jamPulang && jamPulang <= jamMasuk) {
        throw new Error('Jam pulang harus lebih lambat dari jam masuk.')
      }

      setMenyimpan(true)
      await simpanKoreksi({
        presensiId: pilih.id,
        jamMasuk,
        jamPulang,
        status: form.status,
        alasan: form.alasan.trim(),
      })
      setPilih(null)
      setPesan('Koreksi presensi tersimpan dan tercatat pada audit trail.')
      await muat()
    } catch (err) {
      setGalatModal(err.message || 'Gagal menyimpan koreksi.')
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <>
      <KepalaHalaman
        judul="Koreksi Presensi & Audit Trail"
        deskripsi="Perbaiki data presensi dengan alasan wajib — seluruh perubahan terekam."
      />

      {pesan && (
        <Alert variant="sukses" className="mb-4">
          {pesan}
        </Alert>
      )}
      {galat && (
        <Alert variant="bahaya" title="Gagal" className="mb-4">
          {galat}
        </Alert>
      )}

      <TabBar
        daftar={TAB}
        nilai={tab}
        onChange={setTab}
        label="Jenis data koreksi"
        aksi={
          <Button variant="sekunder" size="sm" onClick={muat} disabled={memuat}>
            Muat ulang
          </Button>
        }
      />

      {tab === 'data' && (
        <>
          <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-kartu sm:grid-cols-2 sm:p-4 lg:max-w-xl">
            <div>
              <label className="label-input" htmlFor="koreksi-periode">
                Bulan
              </label>
              <input
                id="koreksi-periode"
                type="month"
                className="input-dasar"
                value={periode}
                onChange={(e) => setPeriode(e.target.value)}
              />
            </div>
            <div>
              <label className="label-input" htmlFor="koreksi-unit">
                Unit Kerja
              </label>
              <select
                id="koreksi-unit"
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
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
            {memuat ? (
              <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                <Spinner /> Memuat presensi…
              </div>
            ) : daftar.length === 0 ? (
              <div className="px-4 py-14 text-center text-sm text-slate-500">
                Tidak ada data presensi pada periode &amp; unit ini.
              </div>
            ) : (
              <>
                {/* HP: kartu presensi */}
                <div className="divide-y divide-slate-100 md:hidden">
                  {daftar.map((baris) => (
                    <article key={baris.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-bold text-slate-800">
                            {baris.pegawai?.nama ?? '—'}
                          </p>
                          <p className="truncate text-[11px] text-slate-500">
                            {baris.pegawai?.unit_kerja ?? '—'} ·{' '}
                            {formatTanggalRingkas(baris.tanggal)}
                          </p>
                        </div>
                        <Badge variant={varianStatusKehadiran(baris.status_kehadiran)}>
                          {baris.status_kehadiran}
                        </Badge>
                      </div>

                      <div className="mt-2.5 grid grid-cols-2 divide-x divide-slate-200 rounded-lg bg-slate-50 py-2 text-center">
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
                      </div>

                      {Number(baris.menit_terlambat) > 0 && (
                        <p className="mt-2 text-[11px] font-semibold text-amber-700">
                          Terlambat {baris.menit_terlambat} menit
                        </p>
                      )}

                      {baris.dikoreksi_oleh && (
                        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-800">
                          <span className="font-semibold">Dikoreksi:</span>{' '}
                          {baris.alasan_koreksi}
                        </p>
                      )}

                      <Button
                        size="sm"
                        variant="sekunder"
                        className="mt-3 w-full"
                        onClick={() => bukaKoreksi(baris)}
                      >
                        Koreksi Presensi
                      </Button>
                    </article>
                  ))}
                </div>

                {/* Desktop: tabel */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[940px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-5 py-3 font-semibold">Tanggal</th>
                        <th className="px-5 py-3 font-semibold">Pegawai</th>
                        <th className="px-5 py-3 font-semibold">Masuk</th>
                        <th className="px-5 py-3 font-semibold">Pulang</th>
                        <th className="px-5 py-3 font-semibold">Terlambat</th>
                        <th className="px-5 py-3 font-semibold">Status</th>
                        <th className="px-5 py-3 font-semibold">Keterangan</th>
                        <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {daftar.map((baris) => (
                        <tr key={baris.id} className="align-top hover:bg-slate-50/70">
                          <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                            {formatTanggalRingkas(baris.tanggal)}
                          </td>
                          <td className="px-5 py-3">
                            <p className="font-semibold text-slate-800">{baris.pegawai?.nama ?? '—'}</p>
                            <p className="text-xs text-slate-500">{baris.pegawai?.unit_kerja ?? '—'}</p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-slate-700">
                            {baris.jam_masuk ? formatJam(baris.jam_masuk) : '—'}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3 text-slate-700">
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
                          <td className="px-5 py-3">
                            <Badge variant={varianStatusKehadiran(baris.status_kehadiran)}>
                              {baris.status_kehadiran}
                            </Badge>
                          </td>
                          <td className="max-w-[240px] px-5 py-3 text-xs text-slate-500">
                            {baris.dikoreksi_oleh ? (
                              <span className="font-semibold text-amber-700">
                                Dikoreksi: {baris.alasan_koreksi}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button size="sm" variant="sekunder" onClick={() => bukaKoreksi(baris)}>
                              Koreksi
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}

      {tab === 'audit' && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
          <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
            <h2 className="text-sm font-bold text-slate-800">Audit Trail Koreksi</h2>
            <p className="text-[11px] text-slate-500 sm:text-xs">
              100 koreksi terakhir beserta admin pelaksana
            </p>
          </div>

          {audit.length === 0 ? (
            <div className="px-4 py-14 text-center text-sm text-slate-500">
              Belum ada koreksi tercatat.
            </div>
          ) : (
            <>
              {/* HP: kartu audit */}
              <div className="divide-y divide-slate-100 md:hidden">
                {audit.map((baris) => (
                  <article key={baris.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-slate-800">
                          {baris.presensi?.pegawai?.nama ?? '—'}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {baris.presensi?.pegawai?.unit_kerja ?? '—'}
                        </p>
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">
                        {baris.presensi?.tanggal
                          ? formatTanggalRingkas(baris.presensi.tanggal)
                          : '—'}
                      </span>
                    </div>

                    <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600">
                      {baris.alasan}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                      <span>
                        Oleh <b className="font-semibold text-slate-600">{baris.pegawai?.nama ?? '—'}</b>
                      </span>
                      <span>{formatTanggal(baris.waktu_koreksi)}</span>
                    </div>
                  </article>
                ))}
              </div>

              {/* Desktop: tabel */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Waktu Koreksi</th>
                      <th className="px-5 py-3 font-semibold">Pegawai</th>
                      <th className="px-5 py-3 font-semibold">Tanggal Presensi</th>
                      <th className="px-5 py-3 font-semibold">Admin</th>
                      <th className="px-5 py-3 font-semibold">Alasan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {audit.map((baris) => (
                      <tr key={baris.id} className="align-top hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                          {formatTanggal(baris.waktu_koreksi)}
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-800">
                            {baris.presensi?.pegawai?.nama ?? '—'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {baris.presensi?.pegawai?.unit_kerja ?? '—'}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                          {baris.presensi?.tanggal
                            ? formatTanggalRingkas(baris.presensi.tanggal)
                            : '—'}
                        </td>
                        <td className="px-5 py-3 text-xs font-semibold text-slate-700">
                          {baris.pegawai?.nama ?? '—'}
                        </td>
                        <td className="max-w-[280px] px-5 py-3 text-xs text-slate-600">
                          {baris.alasan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}

      <Modal terbuka={Boolean(pilih)} onTutup={() => setPilih(null)} judul="Koreksi Presensi">
        {pilih && (
          <form onSubmit={simpan} className="space-y-4">
            {galatModal && (
              <Alert variant="bahaya" title="Gagal Menyimpan">
                {galatModal}
              </Alert>
            )}

            <div className="rounded-xl bg-slate-50 p-3 text-sm">
              <p className="font-bold text-slate-800">{pilih.pegawai?.nama}</p>
              <p className="text-xs text-slate-500">
                {formatTanggal(pilih.tanggal)} · {pilih.pegawai?.unit_kerja}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="label-input" htmlFor="koreksi-masuk">
                  Jam Masuk
                </label>
                <input
                  id="koreksi-masuk"
                  type="time"
                  className="input-dasar"
                  value={form.jamMasuk}
                  onChange={(e) => setForm((l) => ({ ...l, jamMasuk: e.target.value }))}
                />
              </div>
              <div>
                <label className="label-input" htmlFor="koreksi-pulang">
                  Jam Pulang
                </label>
                <input
                  id="koreksi-pulang"
                  type="time"
                  className="input-dasar"
                  value={form.jamPulang}
                  onChange={(e) => setForm((l) => ({ ...l, jamPulang: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <label className="label-input" htmlFor="koreksi-status">
                Status Kehadiran
              </label>
              <select
                id="koreksi-status"
                className="input-dasar"
                value={form.status}
                onChange={(e) => setForm((l) => ({ ...l, status: e.target.value }))}
              >
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-input" htmlFor="koreksi-alasan">
                Alasan Koreksi <span className="text-red-600">*</span>
              </label>
              <textarea
                id="koreksi-alasan"
                className="input-dasar min-h-[90px]"
                placeholder="Contoh: pegawai lupa absen pulang karena pergantian shift."
                value={form.alasan}
                onChange={(e) => setForm((l) => ({ ...l, alasan: e.target.value }))}
                required
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Minimal 5 karakter. Alasan akan tersimpan permanen di audit trail.
              </p>
            </div>

            <div className="aksi-modal">
              <Button variant="sekunder" onClick={() => setPilih(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={menyimpan}>
                {menyimpan ? 'Menyimpan…' : 'Simpan Koreksi'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
