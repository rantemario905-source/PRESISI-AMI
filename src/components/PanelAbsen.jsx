/**
 * ==========================================================================
 * Panel Absensi — tombol "ABSEN HADIR" & "ABSEN PULANG"
 * --------------------------------------------------------------------------
 * Alur saat tombol diklik:
 *   1. Minta izin lokasi browser (Geolocation API, enableHighAccuracy: true)
 *   2. Validasi mock location + radius 100 m (utils/geofencing.js)
 *   3. Kirim ke RPC server `submit_presensi` (validasi ulang di server)
 *   4. Notifikasi sukses / gagal + jarak aktual
 * ==========================================================================
 */
import { useState } from 'react'
import { dapatkanLokasi, periksaLokasi } from '../utils/geofencing.js'
import { kirimPresensi } from '../services/attendanceService.js'
import { formatJam, formatJarak } from '../utils/format.js'
import Alert from './ui/Alert.jsx'
import Button from './ui/Button.jsx'
import Spinner from './ui/Spinner.jsx'

export default function PanelAbsen({ statusPerangkat, presensi, deviceToken, onBerhasil }) {
  const [proses, setProses] = useState(null) // 'masuk' | 'pulang' | null
  const [hasil, setHasil] = useState(null) // { tipe: 'sukses'|'galat', pesan }

  const terkunci = statusPerangkat !== 'approved'
  const sudahMasuk = Boolean(presensi?.jam_masuk)
  const sudahPulang = Boolean(presensi?.jam_pulang)

  /** Aksi absen: geolokasi → validasi → RPC server */
  async function jalankanAbsen(tipe) {
    setProses(tipe)
    setHasil(null)

    try {
      // 1. Ambil posisi GPS presisi tinggi
      const posisi = await dapatkanLokasi()

      // 2. Validasi klien: mock location + radius
      const cek = periksaLokasi(posisi)
      if (!cek.valid) {
        setHasil({ tipe: 'galat', pesan: cek.pesan })
        return
      }

      // 3. Kirim ke server (divalidasi ulang oleh RPC)
      const data = await kirimPresensi({
        deviceToken,
        tipe,
        lat: cek.koordinat.lat,
        lng: cek.koordinat.lng,
        akurasi: cek.akurasi,
        isMocked: posisi.coords.isMocked === true,
      })

      // 4. Notifikasi sukses
      const jam = data?.waktu ? formatJam(data.waktu) : ''
      setHasil({
        tipe: 'sukses',
        pesan: `${data?.pesan ?? 'Absensi berhasil dicatat.'} Jam ${jam}, jarak ${
          data?.jarak != null ? formatJarak(Number(data.jarak)) : formatJarak(cek.jarak)
        } dari rumah sakit.`,
      })
      onBerhasil?.()
    } catch (err) {
      setHasil({
        tipe: 'galat',
        pesan: err?.message || 'Terjadi kesalahan saat absensi. Coba lagi.',
      })
    } finally {
      setProses(null)
    }
  }

  return (
    <section className="kartu">
      <h3 className="mb-1 text-base font-bold text-slate-800">Presensi Hari Ini</h3>
      <p className="mb-4 text-sm text-slate-500">
        {sudahMasuk
          ? `Sudah absen masuk pukul ${formatJam(presensi.jam_masuk)}${
              sudahPulang ? ` — sudah absen pulang pukul ${formatJam(presensi.jam_pulang)}` : ''
            }.`
          : 'Pastikan Anda berada di dalam area rumah sakit (radius 100 m) sebelum absen.'}
      </p>

      {terkunci && (
        <Alert variant="peringatan" title="Tombol Absen Terkunci" className="mb-4">
          Hanya perangkat yang sudah disetujui Admin IT yang dapat melakukan absensi.
        </Alert>
      )}

      {hasil && (
        <Alert variant={hasil.tipe === 'sukses' ? 'sukses' : 'bahaya'} className="mb-4">
          {hasil.pesan}
        </Alert>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Button
          variant="utama"
          size="lg"
          className="w-full"
          disabled={terkunci || sudahMasuk || proses !== null}
          onClick={() => jalankanAbsen('masuk')}
        >
          {proses === 'masuk' ? (
            <>
              <Spinner className="h-4 w-4" /> Memeriksa Lokasi…
            </>
          ) : sudahMasuk ? (
            'SUDAH ABSEN HADIR ✓'
          ) : (
            'ABSEN HADIR'
          )}
        </Button>

        <Button
          variant="sukses"
          size="lg"
          className="w-full"
          disabled={terkunci || !sudahMasuk || sudahPulang || proses !== null}
          onClick={() => jalankanAbsen('pulang')}
        >
          {proses === 'pulang' ? (
            <>
              <Spinner className="h-4 w-4" /> Memeriksa Lokasi…
            </>
          ) : sudahPulang ? (
            'SUDAH ABSEN PULANG ✓'
          ) : !sudahMasuk ? (
            'ABSEN PULANG (kunci: absen hadir dulu)'
          ) : (
            'ABSEN PULANG'
          )}
        </Button>
      </div>
    </section>
  )
}
