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
  ambilJadwalKemarin,
  ambilPresensiRingkas,
  ambilRiwayatPresensi,
} from '../services/attendanceService.js'
import { formatTanggal, inisialNama } from '../utils/format.js'
import { Alert, LayarMemuat } from '../components/ui/index.js'
import KartuProfil from '../components/kartu/KartuProfil.jsx'
import KartuShift from '../components/kartu/KartuShift.jsx'
import KartuStatusPerangkat from '../components/kartu/KartuStatusPerangkat.jsx'
import KartuRiwayat from '../components/kartu/KartuRiwayat.jsx'
import PanelAbsen from '../components/PanelAbsen.jsx'
import BarAtas from '../components/BarAtas.jsx'
import MenuKepala from '../components/MenuKepala.jsx'

export default function Dashboard() {
  const { profil, keluar, apakahKepalaRuangan } = useAuth()

  const [memuatData, setMemuatData] = useState(true)
  const [galatData, setGalatData] = useState(null)
  const [statusPerangkat, setStatusPerangkat] = useState('belum_terdaftar')
  const [perangkatAktif, setPerangkatAktif] = useState(null)
  const [presensi, setPresensi] = useState(null)
  const [presensiKemarin, setPresensiKemarin] = useState(null)
  const [jadwal, setJadwal] = useState(null)
  const [jadwalKemarin, setJadwalKemarin] = useState(null)
  const [riwayat, setRiwayat] = useState([])
  const [sedangMengajukan, setSedangMengajukan] = useState(false)
  const [pesanAjukan, setPesanAjukan] = useState(null)

  const deviceToken = ambilDeviceToken()

  const muatData = useCallback(async () => {
    if (!profil) return
    setMemuatData(true)
    setGalatData(null)
    try {
      const [status, dataPresensi, dataJadwal, dataJadwalKemarin, dataRiwayat] =
        await Promise.all([
          ambilStatusPerangkat(profil.id, deviceToken),
          ambilPresensiRingkas(profil.id),
          ambilJadwalHariIni(profil.id),
          ambilJadwalKemarin(profil.id),
          ambilRiwayatPresensi(profil.id, 7),
        ])
      setStatusPerangkat(status.status)
      setPerangkatAktif(status.data)
      setPresensi(dataPresensi.hariIni)
      setPresensiKemarin(dataPresensi.kemarinTerbuka)
      setJadwal(dataJadwal)
      setJadwalKemarin(dataJadwalKemarin)
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
    <div className="min-h-[100dvh] bg-slate-50">
      <BarAtas onKeluar={keluar} />

      <main
        id="konten"
        className="pb-navigasi mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6"
      >
        {/* Sapaan + identitas ringkas */}
        <div className="mb-4 flex items-center gap-3 sm:mb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-extrabold text-white shadow-sm sm:h-12 sm:w-12 sm:text-base">
            {inisialNama(profil.nama)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-700 sm:text-[11px]">
              Selamat datang
            </p>
            <h1 className="text-base font-extrabold leading-snug text-slate-900 sm:text-xl">
              Halo, {profil.nama}
            </h1>
            <p className="text-[11px] leading-snug text-slate-500 sm:text-xs">
              {profil.unit_kerja} · {formatTanggal(new Date().toISOString())}
            </p>
          </div>
        </div>

        {galatData && (
          <Alert variant="bahaya" title="Gagal Memuat Data" className="mb-4">
            {galatData}{' '}
            <button type="button" className="font-bold underline" onClick={muatData}>
              Coba lagi
            </button>
          </Alert>
        )}

        {pesanAjukan && (
          <Alert variant={pesanAjukan.tipe} className="mb-4">
            {pesanAjukan.teks}
          </Alert>
        )}

        {memuatData ? (
          <div className="kartu flex justify-center py-14">
            <LayarMemuatDalam />
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {apakahKepalaRuangan && (
              <MenuKepala unitKerja={profil.unit_kerja} />
            )}

            {/* Bila perangkat belum disetujui, tampilkan peringatan setelah menu unit */}
            {statusPerangkat !== 'approved' && (
              <KartuStatusPerangkat
                status={statusPerangkat}
                perangkatAktif={perangkatAktif}
                sedangMengajukan={sedangMengajukan}
                onAjukan={tanganiAjukanPerangkat}
              />
            )}

            <PanelAbsen
              statusPerangkat={statusPerangkat}
              presensi={presensi}
              presensiKemarin={presensiKemarin}
              jadwal={jadwal}
              jadwalKemarin={jadwalKemarin}
              deviceToken={deviceToken}
              onBerhasil={muatData}
            />

            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-3 lg:gap-5">
              <div className="order-1 lg:col-start-3 lg:row-start-1">
                <KartuShift jadwal={jadwal} />
              </div>

              <div className="order-2 lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
                <KartuRiwayat riwayat={riwayat} />
              </div>

              <div className="order-3 space-y-4 lg:col-start-3 lg:row-start-2">
                {statusPerangkat === 'approved' && (
                  <KartuStatusPerangkat
                    status={statusPerangkat}
                    perangkatAktif={perangkatAktif}
                    sedangMengajukan={sedangMengajukan}
                    onAjukan={tanganiAjukanPerangkat}
                  />
                )}

                <div className="hidden lg:block">
                  <KartuProfil profil={profil} />
                </div>
              </div>
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
      <svg className="h-7 w-7 animate-spin text-sky-600" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-sm">Memuat data presensi…</span>
    </div>
  )
}
