/**
 * ==========================================================================
 * Halaman Dashboard Pegawai — halaman absensi utama (`/`)
 * --------------------------------------------------------------------------
 * Bertugas: memuat data (profil, shift, status perangkat, presensi hari ini,
 * riwayat) lalu menyusunnya dari komponen kartu terpisah.
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { ambilDeviceToken, infoPerangkat } from '../utils/deviceHelper.js'
import {
  ajukanVerifikasiPerangkat,
  ambilStatusPerangkat,
} from '../services/deviceService.js'
import {
  ambilJadwalHariIni,
  ambilPresensiHariIni,
  ambilRiwayatPresensi,
} from '../services/attendanceService.js'
import { formatTanggal } from '../utils/format.js'
import { NAMA_APLIKASI } from '../config/constants.js'
import { Alert, LayarMemuat } from '../components/ui/index.js'
import KartuProfil from '../components/kartu/KartuProfil.jsx'
import KartuShift from '../components/kartu/KartuShift.jsx'
import KartuStatusPerangkat from '../components/kartu/KartuStatusPerangkat.jsx'
import KartuRiwayat from '../components/kartu/KartuRiwayat.jsx'
import PanelAbsen from '../components/PanelAbsen.jsx'
import BarAtas from '../components/BarAtas.jsx'

export default function Dashboard() {
  const { profil, keluar } = useAuth()

  const [memuatData, setMemuatData] = useState(true)
  const [galatData, setGalatData] = useState(null)
  const [statusPerangkat, setStatusPerangkat] = useState('belum_terdaftar')
  const [presensi, setPresensi] = useState(null)
  const [jadwal, setJadwal] = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [sedangMengajukan, setSedangMengajukan] = useState(false)
  const [pesanAjukan, setPesanAjukan] = useState(null)

  const deviceToken = ambilDeviceToken()

  const muatData = useCallback(async () => {
    if (!profil) return
    setMemuatData(true)
    setGalatData(null)
    try {
      const [status, dataPresensi, dataJadwal, dataRiwayat] = await Promise.all([
        ambilStatusPerangkat(profil.id, deviceToken),
        ambilPresensiHariIni(profil.id),
        ambilJadwalHariIni(profil.id),
        ambilRiwayatPresensi(profil.id, 7),
      ])
      setStatusPerangkat(status.status)
      setPresensi(dataPresensi)
      setJadwal(dataJadwal)
      setRiwayat(dataRiwayat)
    } catch (err) {
      setGalatData(err?.message || 'Gagal memuat data dashboard.')
    } finally {
      setMemuatData(false)
    }
  }, [profil, deviceToken])

  useEffect(() => {
    muatData()
  }, [muatData])

  /** Ajukan device_token ini ke database dengan status pending */
  async function tanganiAjukanPerangkat() {
    setSedangMengajukan(true)
    setPesanAjukan(null)
    try {
      await ajukanVerifikasiPerangkat({
        userId: profil.id,
        deviceToken,
        infoPerangkat: infoPerangkat(),
      })
      setPesanAjukan({
        tipe: 'sukses',
        teks: 'Pengajuan perangkat terkirim. Menunggu persetujuan Admin IT.',
      })
      await muatData()
    } catch (err) {
      setPesanAjukan({
        tipe: 'bahaya',
        teks: err?.message || 'Gagal mengajukan verifikasi perangkat.',
      })
    } finally {
      setSedangMengajukan(false)
    }
  }

  if (!profil) return <LayarMemuat label="Memuat profil…" />

  return (
    <div className="min-h-screen bg-slate-50">
      <BarAtas onKeluar={keluar} />

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {/* Sapaan + tanggal */}
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-slate-800">
            Halo, {profil.nama.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-slate-500">
            {NAMA_APLIKASI} — {formatTanggal(new Date().toISOString(), { weekday: undefined })}
          </p>
        </div>

        {galatData && (
          <Alert variant="bahaya" title="Gagal Memuat Data" className="mb-5">
            {galatData}{' '}
            <button className="font-bold underline" onClick={muatData}>
              Coba lagi
            </button>
          </Alert>
        )}

        {pesanAjukan && (
          <Alert variant={pesanAjukan.tipe} className="mb-5">
            {pesanAjukan.teks}
          </Alert>
        )}

        {memuatData ? (
          <div className="kartu flex justify-center py-12">
            <LayarMemuatDalam />
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            {/* Kolom kiri: profil, shift, riwayat */}
            <div className="space-y-5 lg:col-span-2">
              <div className="grid gap-5 sm:grid-cols-2">
                <KartuProfil profil={profil} />
                <KartuShift jadwal={jadwal} />
              </div>

              <PanelAbsen
                statusPerangkat={statusPerangkat}
                presensi={presensi}
                deviceToken={deviceToken}
                onBerhasil={muatData}
              />

              <KartuRiwayat riwayat={riwayat} />
            </div>

            {/* Kolom kanan: status perangkat */}
            <div className="space-y-5">
              <KartuStatusPerangkat
                status={statusPerangkat}
                sedangMengajukan={sedangMengajukan}
                onAjukan={tanganiAjukanPerangkat}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/** Spinner kecil untuk area dashboard */
function LayarMemuatDalam() {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-slate-500">
      <svg className="h-7 w-7 animate-spin text-sky-600" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-sm">Memuat data presensi…</span>
    </div>
  )
}
