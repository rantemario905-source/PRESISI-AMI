/**
 * Kartu jadwal shift kerja hari ini
 * (Pagi / Siang / Malam / Non-Shift).
 */
import Badge from '../ui/Badge.jsx'

const VARIASI_SHIFT = {
  Pagi: 'info',
  Siang: 'peringatan',
  Malam: 'netral',
  'Non-Shift': 'netral',
}

function formatJamWaktu(jam) {
  // "07:00:00" → "07.00"
  return String(jam ?? '').slice(0, 5).replace(':', '.')
}

export default function KartuShift({ jadwal }) {
  const shift = jadwal?.shift_master
  const namaShift = shift?.nama_shift ?? 'Non-Shift'

  return (
    <section className="kartu">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Jadwal Shift Hari Ini</h3>
        <Badge variant={VARIASI_SHIFT[namaShift] ?? 'netral'}>{namaShift}</Badge>
      </div>

      {shift ? (
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-sky-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold text-slate-500">Mulai</p>
            <p className="text-xl font-extrabold text-sky-700">{formatJamWaktu(shift.jam_mulai)}</p>
          </div>
          <div className="text-slate-400" aria-hidden="true">
            →
          </div>
          <div className="rounded-xl bg-green-50 px-4 py-3 text-center">
            <p className="text-xs font-semibold text-slate-500">Selesai</p>
            <p className="text-xl font-extrabold text-green-700">{formatJamWaktu(shift.jam_selesai)}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Anda tidak dijadwalkan shift hari ini <span className="font-semibold">(Non-Shift)</span>.
        </p>
      )}
    </section>
  )
}
