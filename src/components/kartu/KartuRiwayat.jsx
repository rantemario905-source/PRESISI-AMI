/**
 * Riwayat presensi terakhir milik pegawai.
 * Di HP tampil sebagai daftar kartu; di layar lebar sebagai tabel.
 */
import { Link } from 'react-router-dom'
import { formatJarak, formatJam, formatTanggalRingkas } from '../../utils/format.js'
import Badge from '../ui/Badge.jsx'

const VARIASI_STATUS = {
  Hadir: 'sukses',
  Sakit: 'info',
  Cuti: 'netral',
  'Dinas Luar': 'peringatan',
  Alfa: 'bahaya',
  Koreksi: 'peringatan',
}

export default function KartuRiwayat({ riwayat }) {
  return (
    <section className="kartu">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-sm">
          Riwayat Presensi Terakhir
        </h3>
        <Link
          to="/riwayat"
          className="flex min-h-[44px] items-center px-1 text-xs font-semibold text-sky-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
        >
          Lihat semua →
        </Link>
      </div>

      {!riwayat?.length ? (
        <p className="py-6 text-center text-sm text-slate-500">Belum ada riwayat presensi.</p>
      ) : (
        <>
          {/* HP: kartu ringkas */}
          <div className="space-y-2 sm:hidden">
            {riwayat.map((baris) => (
              <article
                key={baris.id}
                className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[13px] font-bold text-slate-800">
                    {formatTanggalRingkas(baris.tanggal)}
                  </p>
                  <Badge variant={VARIASI_STATUS[baris.status_kehadiran] ?? 'netral'}>
                    {baris.status_kehadiran}
                  </Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                  <span>
                    Masuk <b className="font-semibold tabular-nums text-slate-700">{formatJam(baris.jam_masuk)}</b>
                  </span>
                  <span>
                    Pulang <b className="font-semibold tabular-nums text-slate-700">{formatJam(baris.jam_pulang)}</b>
                  </span>
                  <span>
                    Jarak <b className="font-semibold text-slate-700">{formatJarak(baris.jarak_masuk)}</b>
                  </span>
                  {Number(baris.menit_terlambat) > 0 && (
                    <span className="font-semibold text-amber-700">
                      Terlambat {baris.menit_terlambat} mnt
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>

          {/* Desktop: tabel */}
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-3 py-2 font-semibold">Tanggal</th>
                  <th className="px-3 py-2 font-semibold">Masuk</th>
                  <th className="px-3 py-2 font-semibold">Pulang</th>
                  <th className="px-3 py-2 font-semibold">Terlambat</th>
                  <th className="px-3 py-2 font-semibold">Jarak</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.map((baris) => (
                  <tr key={baris.id} className="border-b border-slate-100 last:border-0">
                    <td className="whitespace-nowrap px-3 py-2.5 font-medium text-slate-700">
                      {formatTanggalRingkas(baris.tanggal)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-600">
                      {formatJam(baris.jam_masuk)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-slate-600">
                      {formatJam(baris.jam_pulang)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                      {Number(baris.menit_terlambat) > 0 ? (
                        <span className="text-xs font-semibold text-amber-700">
                          {baris.menit_terlambat} mnt
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{formatJarak(baris.jarak_masuk)}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={VARIASI_STATUS[baris.status_kehadiran] ?? 'netral'}>
                        {baris.status_kehadiran}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
