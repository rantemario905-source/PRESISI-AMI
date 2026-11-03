/**
 * ==========================================================================
 * Super Admin — Koreksi Presensi & Audit Trail
 * --------------------------------------------------------------------------
 * Setiap koreksi WAJIB menyertakan alasan. Perubahan dicatat pada tabel
 * audit (koreksi_presensi) oleh RPC `koreksi_presensi`.
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { ambilAuditKoreksi, ambilPresensiPeriode } from '../../services/correctionService.js'
import { ambilUnitKerja } from '../../services/pegawaiService.js'
import {
  akhirBulan,
  formatTanggal,
  formatTanggalRingkas,
  periodeBulanIni,
} from '../../utils/format.js'
import { Alert, Button, Modal, Spinner, TabBar } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'
import DaftarPresensiKoreksi from '../../components/admin/DaftarPresensiKoreksi.jsx'
import FormKoreksiPresensi from '../../components/admin/FormKoreksiPresensi.jsx'

const TAB = [
  { nilai: 'data', label: 'Data Presensi' },
  { nilai: 'audit', label: 'Audit Trail' },
]

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

  const bukaKoreksi = useCallback((baris) => {
    setPilih(baris)
  }, [])

  const tutupKoreksi = useCallback(() => {
    setPilih(null)
  }, [])

  const selesaiKoreksi = useCallback(
    async (pesanBaru) => {
      setPilih(null)
      setPesan(pesanBaru)
      await muat()
    },
    [muat],
  )

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
              <DaftarPresensiKoreksi daftar={daftar} onKoreksi={bukaKoreksi} />
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

      <Modal terbuka={Boolean(pilih)} onTutup={tutupKoreksi} judul="Koreksi Presensi">
        {pilih && (
          <FormKoreksiPresensi
            key={pilih.id}
            baris={pilih}
            onBatal={tutupKoreksi}
            onSelesai={selesaiKoreksi}
          />
        )}
      </Modal>
    </>
  )
}
