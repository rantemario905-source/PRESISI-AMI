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
import { Alert, Badge, Button, Modal, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const STATUS = ['Hadir', 'Izin', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi']

export default function KoreksiPresensi() {
  const [tab, setTab] = useState('data')
  const [periode, setPeriode] = useState(periodeBulanIni())
  const [unit, setUnit] = useState('semua')
  const [units, setUnits] = useState([])
  const [daftar, setDaftar] = useState([])
  const [audit, setAudit] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
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
    setForm({
      jamMasuk: formatJamInput(baris.jam_masuk),
      jamPulang: formatJamInput(baris.jam_pulang),
      status: baris.status_kehadiran,
      alasan: '',
    })
  }

  const simpan = async (event) => {
    event.preventDefault()
    setGalat(null)
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
      setGalat(err.message || 'Gagal menyimpan koreksi.')
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <>
      <KepalaHalaman
        judul="Koreksi Presensi & Audit Trail"
        deskripsi="Perbaiki data presensi dengan alasan wajib — seluruh perubahan terekam."
        aksi={
          <Button variant="sekunder" size="sm" onClick={muat} disabled={memuat}>
            Muat ulang
          </Button>
        }
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTab('data')}
          className={`rounded-lg px-3.5 py-2 text-xs font-bold ${
            tab === 'data' ? 'bg-sky-600 text-white shadow-sm' : 'border border-slate-300 bg-white text-slate-600'
          }`}
        >
          Data Presensi
        </button>
        <button
          type="button"
          onClick={() => setTab('audit')}
          className={`rounded-lg px-3.5 py-2 text-xs font-bold ${
            tab === 'audit' ? 'bg-sky-600 text-white shadow-sm' : 'border border-slate-300 bg-white text-slate-600'
          }`}
        >
          Audit Trail
        </button>
      </div>

      {tab === 'data' && (
        <>
          <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-kartu sm:grid-cols-2 lg:max-w-xl">
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
              <div className="py-14 text-center text-sm text-slate-500">
                Tidak ada data presensi pada periode & unit ini.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[940px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Tanggal</th>
                      <th className="px-5 py-3 font-semibold">Pegawai</th>
                      <th className="px-5 py-3 font-semibold">Masuk</th>
                      <th className="px-5 py-3 font-semibold">Pulang</th>
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
                        <td className="px-5 py-3">
                          <Badge variant={varianStatusKehadiran(baris.status_kehadiran)}>
                            {baris.status_kehadiran}
                          </Badge>
                        </td>
                        <td className="max-w-[240px] px-5 py-3 text-xs text-slate-500">
                          {baris.dikoreksi_oleh ? (
                            <span className="font-semibold text-amber-700">Dikoreksi: {baris.alasan_koreksi}</span>
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
            )}
          </section>
        </>
      )}

      {tab === 'audit' && (
        <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-bold text-slate-800">Audit Trail Koreksi</h2>
            <p className="text-xs text-slate-500">100 koreksi terakhir beserta admin pelaksana</p>
          </div>

          {audit.length === 0 ? (
            <div className="py-14 text-center text-sm text-slate-500">Belum ada koreksi tercatat.</div>
          ) : (
            <div className="overflow-x-auto">
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
                        {baris.presensi?.tanggal ? formatTanggalRingkas(baris.presensi.tanggal) : '—'}
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-slate-700">
                        {baris.pegawai?.nama ?? '—'}
                      </td>
                      <td className="max-w-[280px] px-5 py-3 text-xs text-slate-600">{baris.alasan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <Modal terbuka={Boolean(pilih)} onTutup={() => setPilih(null)} judul="Koreksi Presensi">
        {pilih && (
          <form onSubmit={simpan} className="space-y-4">
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

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
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
