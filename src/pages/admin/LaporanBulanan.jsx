/**
 * ==========================================================================
 * Laporan Presensi Bulanan per Pegawai
 * --------------------------------------------------------------------------
 * Dipakai Super Admin dan Kepala Ruangan. Menampilkan pratinjau A4 portrait
 * per pegawai dengan kop dua logo, ringkasan kehadiran, tabel harian, dan
 * satu blok tanda tangan di kanan bawah. PDF dihasilkan lewat dialog cetak.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { ambilLaporanBulanan } from '../../services/reportService.js'
import { ambilUnitKerja } from '../../services/pegawaiService.js'
import { namaBulan, periodeBulanIni } from '../../utils/format.js'
import { kelompokkanPresensi } from '../../utils/laporan.js'
import { Alert, Button, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'
import LembarLaporan from '../../components/laporan/LembarLaporan.jsx'

const DATA_KOSONG = { pegawai: [], presensi: [], alasanIzin: {} }

export default function LaporanBulanan({ mode = 'superadmin' }) {
  const { profil } = useAuth()
  const konteksKepala = useOutletContext()
  const modeKepala = mode === 'kepala'
  const unitAktifKepala = konteksKepala?.unitAktif || profil?.unit_kerja || ''

  const [periode, setPeriode] = useState(periodeBulanIni())
  const [unit, setUnit] = useState(modeKepala ? unitAktifKepala : '')
  const [units, setUnits] = useState([])
  const [pegawaiId, setPegawaiId] = useState('')
  const [cakupan, setCakupan] = useState('satu')
  const [data, setData] = useState(DATA_KOSONG)
  const [memuat, setMemuat] = useState(!modeKepala)
  const [galat, setGalat] = useState(null)
  const [waktuCetak, setWaktuCetak] = useState(() => new Date().toISOString())

  useEffect(() => {
    if (modeKepala) {
      const daftar = Array.isArray(profil?.unit_dikelola) ? profil.unit_dikelola : []
      setUnits(daftar)
      setUnit((lama) => (daftar.includes(lama) ? lama : unitAktifKepala || daftar[0] || ''))
      return
    }
    ambilUnitKerja()
      .then((daftar) => {
        setUnits(daftar)
        setUnit((lama) => lama || daftar[0] || '')
      })
      .catch(() => setUnits([]))
  }, [modeKepala, profil, unitAktifKepala])

  useEffect(() => {
    if (!modeKepala) return
    if (unitAktifKepala) setUnit(unitAktifKepala)
  }, [modeKepala, unitAktifKepala])

  const ubahUnit = (nilai) => {
    setUnit(nilai)
    if (modeKepala) konteksKepala?.pilihUnit?.(nilai)
  }

  const muat = useCallback(async () => {
    if (!unit) {
      setData(DATA_KOSONG)
      setGalat(null)
      setMemuat(false)
      return
    }
    setMemuat(true)
    try {
      const hasil = await ambilLaporanBulanan({ periode, unit })
      setData(hasil)
      setGalat(null)
    } catch (err) {
      setData(DATA_KOSONG)
      setGalat(err.message || 'Gagal memuat laporan presensi.')
    } finally {
      setMemuat(false)
    }
  }, [periode, unit])

  useEffect(() => {
    muat()
  }, [muat])

  useEffect(() => {
    const masihAda = data.pegawai.some((p) => p.id === pegawaiId)
    if (!masihAda) setPegawaiId(data.pegawai[0]?.id ?? '')
  }, [data.pegawai, pegawaiId])

  const petaPresensi = useMemo(() => kelompokkanPresensi(data.presensi), [data.presensi])

  const daftarCetak = useMemo(() => {
    if (cakupan === 'semua') return data.pegawai
    const terpilih = data.pegawai.find((p) => p.id === pegawaiId)
    return terpilih ? [terpilih] : []
  }, [cakupan, data.pegawai, pegawaiId])

  const cetak = () => {
    setWaktuCetak(new Date().toISOString())
    window.setTimeout(() => window.print(), 80)
  }

  const jumlahCatatan = data.presensi.length

  return (
    <>
      <style>{`@media print { @page { size: A4 portrait; margin: 12mm 13mm; } }`}</style>

      <div className="tanpa-cetak">
        <KepalaHalaman
          judul="Laporan Bulanan Pegawai"
          deskripsi={
            modeKepala
              ? 'Cetak laporan presensi bulanan setiap pegawai di unit kerja Anda dalam bentuk PDF.'
              : 'Cetak laporan presensi bulanan setiap pegawai per unit kerja dalam bentuk PDF.'
          }
        />

        {galat && (
          <Alert variant="bahaya" title="Gagal" className="mb-4">
            {galat}
          </Alert>
        )}

        {modeKepala && units.length === 0 && (
          <Alert variant="info" title="Belum ada unit yang dikelola" className="mb-4">
            Hubungi Super Admin untuk menetapkan unit yang Anda kelola.
          </Alert>
        )}

        <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-kartu sm:p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="label-input" htmlFor="laporan-periode">
                Bulan Laporan
              </label>
              <input
                id="laporan-periode"
                type="month"
                className="input-dasar"
                value={periode}
                onChange={(e) => setPeriode(e.target.value || periodeBulanIni())}
              />
            </div>

            <div>
              <label className="label-input" htmlFor="laporan-unit">
                Unit Kerja
              </label>
              <select
                id="laporan-unit"
                className="input-dasar"
                value={unit}
                onChange={(e) => ubahUnit(e.target.value)}
                disabled={modeKepala && units.length <= 1}
              >
                {units.length === 0 && <option value="">Belum ada unit</option>}
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-input" htmlFor="laporan-pegawai">
                Pegawai
              </label>
              <select
                id="laporan-pegawai"
                className="input-dasar"
                value={pegawaiId}
                onChange={(e) => setPegawaiId(e.target.value)}
                disabled={memuat || cakupan === 'semua' || data.pegawai.length === 0}
              >
                {data.pegawai.length === 0 && <option value="">Belum ada pegawai</option>}
                {data.pegawai.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label-input" htmlFor="laporan-cakupan">
                Cetak Untuk
              </label>
              <select
                id="laporan-cakupan"
                className="input-dasar"
                value={cakupan}
                onChange={(e) => setCakupan(e.target.value)}
                disabled={memuat || data.pegawai.length === 0}
              >
                <option value="satu">Pegawai terpilih</option>
                <option value="semua">Semua pegawai unit ({data.pegawai.length})</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] leading-relaxed text-slate-500">
              Pada dialog cetak pilih <b>Simpan sebagai PDF</b> dengan ukuran kertas <b>A4</b>.
              {' '}
              {namaBulan(periode)} · {data.pegawai.length} pegawai · {jumlahCatatan} catatan.
            </p>
            <div className="aksi-halaman">
              <Button variant="sekunder" size="sm" onClick={muat} disabled={memuat}>
                Muat ulang
              </Button>
              <Button size="sm" onClick={cetak} disabled={memuat || daftarCetak.length === 0}>
                Cetak PDF
              </Button>
            </div>
          </div>
        </section>
      </div>

      {memuat ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Spinner /> Menyusun laporan…
        </div>
      ) : daftarCetak.length === 0 ? (
        <div className="tanpa-cetak rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center shadow-kartu">
          <p className="text-sm font-semibold text-slate-600">Belum ada pegawai untuk dicetak</p>
          <p className="mt-1 text-xs text-slate-400">
            Pilih unit kerja lain atau lengkapi data pegawai terlebih dahulu.
          </p>
        </div>
      ) : (
        <div className="area-laporan">
          {daftarCetak.map((p, indeks) => (
            <LembarLaporan
              key={p.id}
              pegawai={p}
              presensi={petaPresensi.get(p.id) ?? []}
              alasanIzin={data.alasanIzin}
              periode={periode}
              halaman={indeks + 1}
              totalHalaman={daftarCetak.length}
              waktuCetak={waktuCetak}
            />
          ))}
        </div>
      )}
    </>
  )
}
