/**
 * Daftar presensi pada halaman Koreksi Presensi.
 * Dibatasi dengan memo agar tidak ikut dirender ulang saat form koreksi berubah.
 */
import { memo } from 'react'
import { formatJam, formatTanggalRingkas } from '../../utils/format.js'
import { varianStatusKehadiran } from '../../utils/status.js'
import { bersihkanAlasanKoreksi } from '../../utils/laporan.js'
import { Badge, Button } from '../ui/index.js'

const jamSingkat = (iso) => (iso ? formatJam(iso).replace(' WITA', '') : '—')

function DaftarPresensiKoreksi({ daftar, onKoreksi }) {
  return (
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
                {bersihkanAlasanKoreksi(baris.alasan_koreksi)}
              </p>
            )}

            <Button
              size="sm"
              variant="sekunder"
              className="mt-3 w-full"
              onClick={() => onKoreksi(baris)}
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
                      Dikoreksi: {bersihkanAlasanKoreksi(baris.alasan_koreksi)}
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
                <td className="px-5 py-3 text-right">
                  <Button size="sm" variant="sekunder" onClick={() => onKoreksi(baris)}>
                    Koreksi
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default memo(DaftarPresensiKoreksi)
