/**
 * ==========================================================================
 * Panel Absensi — tombol "Absen Hadir" & "Absen Pulang"
 * --------------------------------------------------------------------------
 * Alur saat tombol diklik:
 *   1. Minta izin lokasi browser (Geolocation API, enableHighAccuracy: true)
 *   2. Validasi mock location + radius 50 m (utils/geofencing.js)
 *   3. Kirim ke RPC server `submit_presensi` (validasi ulang di server)
 *   4. Notifikasi sukses / gagal + jarak aktual
 * ==========================================================================
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { MAX_RADIUS_METERS } from '../config/constants.js'
import { dapatkanLokasi, periksaLokasi } from '../utils/geofencing.js'
import { kirimPresensi } from '../services/attendanceService.js'
import { formatJam, formatJarak, formatTanggalRingkas, hariIni } from '../utils/format.js'
import { statusTanpaAbsen } from '../utils/izin.js'
import {
  bukaAbsenMasuk,
  bukaAbsenPulang,
  formatJamBuka,
  tutupAbsenMasuk,
  tutupAbsenPulang,
} from '../utils/jadwalAbsen.js'
import Alert from './ui/Alert.jsx'
import Button from './ui/Button.jsx'
import Spinner from './ui/Spinner.jsx'

function IkonMasuk() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
      <path d="M10 17l5-5-5-5M15 12H3" />
    </svg>
  )
}

function IkonPulang() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

/**
 * Shift malam kemarin masih berjalan bila jadwalnya lintas hari dan jam
 * selesainya (WITA) belum terlewati. Server tetap menjadi penentu akhir.
 */
function malamKemarinBerlangsung(jadwal) {
  if (
    !jadwal ||
    jadwal.pola_kerja !== 'shift' ||
    jadwal.terjadwal !== true ||
    jadwal.boleh_absen === false ||
    !jadwal.tanggal ||
    !jadwal.jam_mulai ||
    !jadwal.jam_selesai
  ) {
    return false
  }
  if (jadwal.jam_selesai > jadwal.jam_mulai) return false

  const selesai =
    new Date(`${jadwal.tanggal}T${jadwal.jam_selesai}+08:00`).getTime() +
    86_400_000
  return Number.isFinite(selesai) && Date.now() <= selesai
}

function IkonCentang() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

export default function PanelAbsen({
  statusPerangkat,
  presensi,
  presensiKemarin,
  jadwal,
  jadwalKemarin,
  deviceToken,
  bebasRadius = false,
  onBerhasil,
}) {
  const [proses, setProses] = useState(null) // 'masuk' | 'pulang' | null
  const [hasil, setHasil] = useState(null) // { tipe: 'sukses'|'galat', pesan }
  const [sekarang, setSekarang] = useState(() => Date.now())

  // Perbarui status tombol saat jendela waktu absensi terbuka.
  useEffect(() => {
    const timer = setInterval(() => setSekarang(Date.now()), 15_000)
    return () => clearInterval(timer)
  }, [])

  const perangkatTerkunci = statusPerangkat !== 'approved'
  const jadwalTerkunci = jadwal?.boleh_absen === false

  const kemarinTerbuka =
    Boolean(presensiKemarin?.jam_masuk) && !presensiKemarin?.jam_pulang
  const batasPulangKemarin = tutupAbsenPulang(jadwalKemarin)
  const kemarinTerlewat =
    kemarinTerbuka &&
    Boolean(batasPulangKemarin) &&
    sekarang >= batasPulangKemarin.getTime()
  const kemarinMasihBisaPulang = kemarinTerbuka && !kemarinTerlewat

  const presensiAktif = kemarinMasihBisaPulang ? presensiKemarin : presensi
  const sudahMasuk = Boolean(presensiAktif?.jam_masuk)
  const sudahPulang = Boolean(presensiAktif?.jam_pulang)
  const statusIzin = statusTanpaAbsen(presensi)
  const izinHariIni = Boolean(statusIzin) && presensiAktif === presensi
  const shiftMalamTerbuka =
    Boolean(presensiAktif?.tanggal) &&
    presensiAktif.tanggal !== hariIni() &&
    !sudahPulang
  const malamKemarinAktif =
    !sudahMasuk && !sudahPulang && malamKemarinBerlangsung(jadwalKemarin)

  const jadwalMasuk = malamKemarinAktif ? jadwalKemarin : jadwal
  const bukaMasuk = bukaAbsenMasuk(jadwalMasuk)
  const batasMasuk = tutupAbsenMasuk(jadwalMasuk)
  const masukBelumDibuka =
    !sudahMasuk &&
    !izinHariIni &&
    Boolean(bukaMasuk) &&
    sekarang < bukaMasuk.getTime()
  const masukTerlewat =
    !sudahMasuk &&
    !sudahPulang &&
    !izinHariIni &&
    Boolean(batasMasuk) &&
    sekarang >= batasMasuk.getTime()

  const jadwalPulang =
    presensiAktif?.tanggal && presensiAktif.tanggal === jadwalKemarin?.tanggal
      ? jadwalKemarin
      : jadwal
  const bukaPulang = bukaAbsenPulang(jadwalPulang)
  const batasPulang = tutupAbsenPulang(jadwalPulang)
  const pulangBelumDibuka =
    sudahMasuk && !sudahPulang && Boolean(bukaPulang) && sekarang < bukaPulang.getTime()
  const pulangTerlewat =
    sudahMasuk &&
    !sudahPulang &&
    Boolean(batasPulang) &&
    sekarang >= batasPulang.getTime()

  const lupaPulang = kemarinTerlewat || pulangTerlewat
  const tanggalLupaPulang = kemarinTerlewat
    ? presensiKemarin?.tanggal
    : presensiAktif?.tanggal

  const terkunciMasuk =
    perangkatTerkunci ||
    izinHariIni ||
    (jadwalTerkunci && !malamKemarinAktif) ||
    masukBelumDibuka ||
    masukTerlewat
  const terkunciPulang =
    perangkatTerkunci || izinHariIni || pulangBelumDibuka || pulangTerlewat

  const isLibur = Boolean(
    jadwal?.libur ||
      jadwal?.alasan === 'akhir_pekan' ||
      jadwal?.alasan === 'libur_jadwal' ||
      jadwal?.alasan === 'hari_libur'
  )

  let judulLibur = 'Libur Hari Ini 🌟'
  let pesanLibur = 'Tidak perlu absen hari ini.'
  if (jadwal?.alasan === 'akhir_pekan') {
    judulLibur = 'Akhir Pekan 🌴'
    pesanLibur = 'Hari ini libur. Selamat beristirahat.'
  } else if (jadwal?.alasan === 'hari_libur') {
    judulLibur = 'Hari Libur Nasional 🎉'
    pesanLibur = jadwal?.nama_hari_libur
      ? `Hari libur "${jadwal.nama_hari_libur}".`
      : 'Hari ini libur nasional.'
  } else if (jadwal?.libur || jadwal?.alasan === 'libur_jadwal') {
    judulLibur = 'Libur Hari Ini 🌟'
    pesanLibur = 'Tidak ada jadwal kerja hari ini.'
  } else if (jadwal?.pesan_jadwal) {
    pesanLibur = jadwal.pesan_jadwal
  }

  /** "20:02" tanpa akhiran WITA, agar pas di kartu jam */
  const jamSingkat = (iso) => (iso ? formatJam(iso).replace(' WITA', '') : '--:--')

  const judulStatus = sudahPulang
    ? 'Presensi hari ini lengkap'
    : sudahMasuk
      ? shiftMalamTerbuka
        ? 'Presensi kemarin masih terbuka'
        : 'Sudah absen masuk'
      : izinHariIni
        ? statusIzin
        : malamKemarinAktif
          ? 'Shift malam kemarin'
          : masukTerlewat
            ? 'Alfa Hari Ini'
            : 'Belum absen hari ini'

  const deskripsiStatus = sudahMasuk
    ? sudahPulang
      ? 'Absensi hari ini sudah lengkap.'
      : shiftMalamTerbuka
        ? `Presensi ${formatTanggalRingkas(
            presensiAktif.tanggal,
          )} belum ditutup. Absen pulang setelah shift selesai.`
        : pulangTerlewat
          ? ''
          : 'Absen pulang sebelum meninggalkan area rumah sakit.'
    : izinHariIni
      ? ''
      : malamKemarinAktif
        ? `Shift malam ${formatTanggalRingkas(
            jadwalKemarin.tanggal,
          )} masih berlangsung. Absen masuk dicatat untuk tanggal tersebut.`
        : masukTerlewat
          ? 'Anda tercatat Alfa hari ini.'
          : bebasRadius
            ? 'Absen bisa dilakukan dari luar area rumah sakit.'
            : 'Absen hanya bisa dilakukan di dalam area rumah sakit.'

  /** Aksi absen: geolokasi → validasi → RPC server */
  async function jalankanAbsen(tipe) {
    setProses(tipe)
    setHasil(null)

    try {
      // 1. Ambil posisi GPS presisi tinggi
      const posisi = await dapatkanLokasi()

      // 2. Validasi klien: mock location + radius (bebas radius boleh di luar area)
      const cek = periksaLokasi(posisi, { abaikanRadius: bebasRadius })
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
      const diLuarRadius =
        cek.kode === 'VALID_LUAR_RADIUS' || data?.di_luar_radius === true
      setHasil({
        tipe: 'sukses',
        pesan: `${data?.pesan ?? 'Absensi berhasil dicatat.'} Jam ${jam}, jarak ${
          data?.jarak != null ? formatJarak(Number(data.jarak)) : formatJarak(cek.jarak)
        } dari rumah sakit${diLuarRadius ? ' (di luar area)' : ''}.`,
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
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-kartu">
      <div
        className={`bg-gradient-to-br px-4 pb-4 pt-4 text-white sm:px-5 ${
          masukTerlewat
            ? 'from-rose-600 to-rose-700'
            : sudahPulang
              ? 'from-green-600 to-green-700'
              : 'from-sky-600 to-sky-700'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/70">
              {shiftMalamTerbuka
                ? 'Presensi Aktif'
                : izinHariIni
                  ? 'Status Hari Ini'
                  : 'Presensi Hari Ini'}
            </p>
            <h3 className="mt-0.5 text-base font-extrabold leading-tight sm:text-lg">
              {judulStatus}
            </h3>
            {Number(presensiAktif?.menit_terlambat) > 0 && (
              <p className="mt-1 inline-flex rounded-full bg-amber-400/25 px-2 py-0.5 text-[10px] font-bold text-white ring-1 ring-inset ring-amber-200/40">
                Terlambat {presensiAktif.menit_terlambat} menit
              </p>
            )}
          </div>
          {!izinHariIni && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold sm:text-[11px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-3.5 w-3.5"
                aria-hidden="true"
              >
                <path d="M12 21s7-5.1 7-11a7 7 0 10-14 0c0 5.9 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              {bebasRadius ? 'Bebas Radius' : `Radius ${MAX_RADIUS_METERS} m`}
            </span>
          )}
        </div>

        <div className="mt-3.5 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-inset ring-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Masuk</p>
            <p className="mt-0.5 text-2xl font-extrabold tabular-nums leading-none">
              {jamSingkat(presensiAktif?.jam_masuk)}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2.5 ring-1 ring-inset ring-white/10">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-white/70">Pulang</p>
            <p className="mt-0.5 text-2xl font-extrabold tabular-nums leading-none">
              {jamSingkat(presensiAktif?.jam_pulang)}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {deskripsiStatus && (
          <p className="mb-4 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
            {deskripsiStatus}
          </p>
        )}

        {masukTerlewat && (
          <Link
            to="/pengaduan"
            className="mb-4 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-600"
          >
            Ajukan Pengaduan Absen Masuk
          </Link>
        )}

        {jadwalTerkunci && !sudahMasuk && !malamKemarinAktif && !izinHariIni && (
          <Alert
            variant={isLibur ? 'sukses' : 'peringatan'}
            title={isLibur ? judulLibur : 'Absensi Dikunci'}
            className="mb-4"
          >
            <p>{pesanLibur}</p>
            <p className="mt-1 text-[11px] font-medium opacity-85">
              Jika jadwal tidak sesuai, hubungi Kepala Unit/IT.
            </p>
          </Alert>
        )}

        {malamKemarinAktif && (
          <Alert variant="info" title="Shift Malam Kemarin" className="mb-4">
            Jadwal shift malam kemarin masih berlangsung. Absen masuk akan dicatat
            pada tanggal {formatTanggalRingkas(jadwalKemarin.tanggal)}.
          </Alert>
        )}

        {lupaPulang && (
          <Alert variant="peringatan" title="Lupa Absen Pulang" className="mb-4">
            Presensi {formatTanggalRingkas(tanggalLupaPulang)} belum ada jam pulang.
            Ajukan pengaduan agar dilengkapi Kepala Unit.
            <Link
              to="/pengaduan"
              className="mt-2.5 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-bold text-white hover:bg-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              Ajukan Pengaduan
            </Link>
          </Alert>
        )}

        {masukBelumDibuka && !jadwalTerkunci && (
          <Alert variant="info" title="Absen Masuk Belum Dibuka" className="mb-4">
            Absen masuk dibuka pukul <b>{formatJamBuka(bukaMasuk)} WITA</b>.
          </Alert>
        )}

        {pulangBelumDibuka && !lupaPulang && (
          <Alert variant="info" title="Absen Pulang Belum Dibuka" className="mb-4">
            Absen pulang dibuka pukul <b>{formatJamBuka(bukaPulang)} WITA</b>.
          </Alert>
        )}

        {hasil && (
          <Alert
            variant={hasil.tipe === 'sukses' ? 'sukses' : 'bahaya'}
            className="mb-4"
          >
            {hasil.pesan}
          </Alert>
        )}

        {izinHariIni ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center">
            <p className="text-sm font-bold text-slate-700">Tidak perlu absen hari ini</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              variant="utama"
              size="lg"
              className="min-h-[56px] w-full text-sm font-extrabold uppercase tracking-wide"
              disabled={terkunciMasuk || sudahMasuk || proses !== null}
              onClick={() => jalankanAbsen('masuk')}
            >
              {proses === 'masuk' ? (
                <>
                  <Spinner className="h-4 w-4" /> Memeriksa Lokasi…
                </>
              ) : sudahMasuk ? (
                <>
                  <IkonCentang /> Sudah Absen Hadir
                </>
              ) : masukTerlewat ? (
                <>
                  <IkonMasuk /> Alfa Hari Ini
                </>
              ) : masukBelumDibuka ? (
                <>
                  <IkonMasuk /> Dibuka {formatJamBuka(bukaMasuk)}
                </>
              ) : (
                <>
                  <IkonMasuk /> Absen Hadir
                </>
              )}
            </Button>

            <Button
              variant="sukses"
              size="lg"
              className="min-h-[56px] w-full text-sm font-extrabold uppercase tracking-wide"
              disabled={terkunciPulang || !sudahMasuk || sudahPulang || proses !== null}
              onClick={() => jalankanAbsen('pulang')}
            >
              {proses === 'pulang' ? (
                <>
                  <Spinner className="h-4 w-4" /> Memeriksa Lokasi…
                </>
              ) : sudahPulang ? (
                <>
                  <IkonCentang /> Sudah Absen Pulang
                </>
              ) : pulangTerlewat ? (
                <>
                  <IkonPulang /> Batas Pulang Terlewat
                </>
              ) : pulangBelumDibuka ? (
                <>
                  <IkonPulang /> Dibuka {formatJamBuka(bukaPulang)}
                </>
              ) : (
                <>
                  <IkonPulang /> Absen Pulang
                </>
              )}
            </Button>
          </div>
        )}

        {!sudahMasuk && !terkunciMasuk && (
          <p className="mt-2.5 text-center text-[11px] text-slate-400">
            Absen pulang aktif setelah absen hadir.
          </p>
        )}

        {!izinHariIni && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] leading-relaxed text-slate-400 sm:text-[11px]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3.5 w-3.5 shrink-0"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            Lokasi dan perangkat diverifikasi otomatis.
          </p>
        )}
      </div>
    </section>
  )
}
