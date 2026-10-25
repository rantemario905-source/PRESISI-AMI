/**
 * ==========================================================================
 * Super Admin — Dashboard Utama
 * --------------------------------------------------------------------------
 * Statistik ringkas + pemantauan presensi hari ini secara real-time
 * (Supabase Realtime pada tabel presensi, dengan tombol muat ulang manual).
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../../utils/supabaseClient.js'
import { ambilPresensiHariIni, ambilStatistik } from '../../services/adminDashboardService.js'
import { formatJarak, formatJam, formatTanggal } from '../../utils/format.js'
import { varianStatusKehadiran } from '../../utils/status.js'
import { Alert, Badge, Button, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'
import KartuStatistik from '../../components/admin/KartuStatistik.jsx'

/** "20:02 WITA" → "20:02" untuk tampilan ringkas di HP */
const jamSingkat = (iso) => (iso ? formatJam(iso).replace(' WITA', '') : '—')

export default function DashboardUtama() {
  const [statistik, setStatistik] = useState(null)
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)

  const muat = useCallback(async () => {
    try {
      const [stat, presensi] = await Promise.all([ambilStatistik(), ambilPresensiHariIni()])
      setStatistik(stat)
      setDaftar(presensi)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat data dashboard.')
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    muat()
  }, [muat])

  // Pemantauan real-time: setiap perubahan pada tabel presensi memicu muat ulang
  useEffect(() => {
    let pewaktu
    const kanal = supabase
      .channel('monitor-presensi-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presensi' }, () => {
        clearTimeout(pewaktu)
        pewaktu = setTimeout(muat, 600)
      })
      .subscribe()

    return () => {
      clearTimeout(pewaktu)
      supabase.removeChannel(kanal)
    }
  }, [muat])

  return (
    <>
      <KepalaHalaman
        judul="Dashboard Utama"
        deskripsi={`Pemantauan presensi ${formatTanggal(new Date(), { weekday: undefined })}`}
        aksi={
          <Button variant="sekunder" size="sm" onClick={muat} disabled={memuat}>
            {memuat ? 'Memuat…' : 'Muat ulang'}
          </Button>
        }
      />

      {galat && (
        <Alert variant="bahaya" title="Terjadi kesalahan" className="mb-4">
          {galat}
        </Alert>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2.5 sm:mb-5 sm:gap-4 xl:grid-cols-4">
        <KartuStatistik
          label="Total Pegawai Non-ASN"
          nilai={statistik?.totalPegawai ?? '—'}
          keterangan="Pegawai dengan peran pegawai"
          ikon="👥"
          warna="sky"
        />
        <KartuStatistik
          label="Hadir Hari Ini"
          nilai={statistik?.hadirHariIni ?? '—'}
          keterangan="Sudah absen masuk"
          ikon="✅"
          warna="green"
        />
        <KartuStatistik
          label="Sudah Absen Pulang"
          nilai={statistik?.sudahPulang ?? '—'}
          keterangan="Presensi hari ini lengkap"
          ikon="🏁"
          warna="slate"
        />
        <KartuStatistik
          label="Perangkat Menunggu"
          nilai={statistik?.pendingPerangkat ?? '—'}
          keterangan="Perlu verifikasi Admin IT"
          ikon="📱"
          warna="amber"
        />
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Pemantauan Presensi Hari Ini</h2>
            <p className="text-[11px] text-slate-500 sm:text-xs">
              Diperbarui otomatis saat ada absensi baru
            </p>
          </div>
          <Badge variant="info">{daftar.length} catatan</Badge>
        </div>

        {memuat && !statistik ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat data…
          </div>
        ) : daftar.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-slate-600">Belum ada presensi hari ini</p>
            <p className="mt-1 text-xs text-slate-400">Data akan muncul otomatis saat pegawai absen.</p>
          </div>
        ) : (
          <>
            {/* HP: daftar kartu */}
            <div className="divide-y divide-slate-100 md:hidden">
              {daftar.map((baris) => {
                const lokasi = baris.lokasi_masuk
                return (
                  <article key={baris.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-slate-800">
                          {baris.pegawai?.nama ?? '—'}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
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
                        <b className="font-bold tabular-nums text-slate-800">
                          {jamSingkat(baris.jam_masuk)}
                        </b>
                      </span>
                      <span>
                        Pulang{' '}
                        <b className="font-bold tabular-nums text-slate-800">
                          {jamSingkat(baris.jam_pulang)}
                        </b>
                      </span>
                      {lokasi?.lat && lokasi?.lng && (
                        <a
                          href={`https://www.google.com/maps?q=${lokasi.lat},${lokasi.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="font-bold text-sky-700 hover:underline"
                        >
                          Peta · {formatJarak(baris.jarak_masuk)}
                        </a>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Desktop: tabel */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Pegawai</th>
                    <th className="px-5 py-3 font-semibold">Jam Masuk</th>
                    <th className="px-5 py-3 font-semibold">Jam Pulang</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Lokasi Masuk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daftar.map((baris) => {
                    const lokasi = baris.lokasi_masuk
                    return (
                      <tr key={baris.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-800">{baris.pegawai?.nama ?? '—'}</p>
                          <p className="text-xs text-slate-500">{baris.pegawai?.unit_kerja ?? '—'}</p>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-medium tabular-nums text-slate-700">
                          {formatJam(baris.jam_masuk)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 font-medium tabular-nums text-slate-700">
                          {baris.jam_pulang ? (
                            formatJam(baris.jam_pulang)
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={varianStatusKehadiran(baris.status_kehadiran)}>
                            {baris.status_kehadiran}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          {lokasi?.lat && lokasi?.lng ? (
                            <div className="space-y-0.5">
                              <a
                                href={`https://www.google.com/maps?q=${lokasi.lat},${lokasi.lng}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-sky-700 hover:underline"
                              >
                                Lihat peta
                              </a>
                              <p className="text-[11px] text-slate-400">
                                {formatJarak(baris.jarak_masuk)} dari titik pusat
                              </p>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  )
}
