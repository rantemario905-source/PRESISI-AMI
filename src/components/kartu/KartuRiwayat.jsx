/**
 * Tabel riwayat presensi terakhir milik pegawai.
 */
import { Link } from 'react-router-dom'
import { formatJarak, formatJam, formatTanggalRingkas } from '../../utils/format.js'
import Badge from '../ui/Badge.jsx'

const VARIASI_STATUS = {
  Hadir: 'sukses',
  Izin: 'info',
  Sakit: 'info',
  Cuti: 'netral',
  'Dinas Luar': 'peringatan',
  Alfa: 'bahaya',
  Koreksi: 'peringatan',
}

export default function KartuRiwayat({ riwayat }) {
  return (
    <section className="kartu">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Riwayat Presensi Terakhir
        </h3>
        <Link to="/riwayat" className="text-xs font-semibold text-sky-700 hover:underline">
          Lihat semua →
        </Link>
      </div>

      {!riwayat?.length ? (
        <p className="py-6 text-center text-sm text-slate-500">Belum ada riwayat presensi.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-3 py-2 font-semibold">Tanggal</th>
                <th className="px-3 py-2 font-semibold">Masuk</th>
                <th className="px-3 py-2 font-semibold">Pulang</th>
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
                  <td className="px-3 py-2.5 text-slate-600">{formatJam(baris.jam_masuk)}</td>
                  <td className="px-3 py-2.5 text-slate-600">{formatJam(baris.jam_pulang)}</td>
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
      )}
    </section>
  )
}
