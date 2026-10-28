/**
 * Kartu jadwal kerja hari ini.
 * Mendukung pola Reguler, Shift, Libur, dan Belum dijadwalkan.
 */
import Badge from '../ui/Badge.jsx'

const VARIASI_SHIFT = {
  reguler: 'info',
  pagi: 'info',
  siang: 'peringatan',
  malam: 'netral',
}

function kunciShift(nama) {
  return String(nama ?? '').trim().toLowerCase()
}

function formatJamWaktu(jam) {
  // "07:30:00" → "07.30"
  return String(jam ?? '').slice(0, 5).replace(':', '.')
}

export default function KartuShift({ jadwal }) {
  const pola = jadwal?.pola_kerja ?? 'shift'
  const libur = Boolean(jadwal?.libur)
  const terjadwal = Boolean(jadwal?.terjadwal)
  const namaShift = jadwal?.nama_shift
  const namaLibur = jadwal?.nama_hari_libur

  const label = libur
    ? 'Libur'
    : terjadwal
      ? pola === 'reguler'
        ? 'Reguler'
        : namaShift || 'Shift'
      : 'Belum dijadwalkan'

  const variasi = libur
    ? 'netral'
    : VARIASI_SHIFT[kunciShift(namaShift)] ?? (terjadwal ? 'info' : 'peringatan')

  return (
    <section className="kartu">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-sm">
          Jadwal Kerja Hari Ini
        </h3>
        <Badge variant={variasi}>{label}</Badge>
      </div>

      {libur ? (
        <div>
          <p className="text-[13px] font-semibold text-slate-700 sm:text-sm">
            {jadwal?.alasan === 'akhir_pekan' ? 'Akhir pekan — libur.' : 'Hari libur.'}
          </p>
          {namaLibur && (
            <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
              {namaLibur}
            </p>
          )}
          <p className="mt-1.5 text-[12px] leading-relaxed text-slate-500">
            Absensi tidak diperlukan pada hari ini.
          </p>
        </div>
      ) : terjadwal ? (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="rounded-xl bg-sky-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Mulai</p>
              <p className="mt-0.5 text-lg font-extrabold tabular-nums text-sky-700 sm:text-xl">
                {formatJamWaktu(jadwal?.jam_mulai)}
              </p>
            </div>
            <div className="text-slate-300" aria-hidden="true">
              →
            </div>
            <div className="rounded-xl bg-green-50 px-3 py-2.5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Selesai</p>
              <p className="mt-0.5 text-lg font-extrabold tabular-nums text-green-700 sm:text-xl">
                {formatJamWaktu(jadwal?.jam_selesai)}
              </p>
            </div>
          </div>
          {pola !== 'reguler' && (
            <p className="mt-2.5 text-[12px] leading-relaxed text-slate-500">
              {jadwal?.jam_selesai <= jadwal?.jam_mulai
                ? 'Shift malam berakhir pada pagi hari berikutnya.'
                : 'Absensi mengikuti jadwal shift yang ditetapkan.'}
            </p>
          )}
          {namaLibur && (
            <p className="mt-1 text-[11px] font-semibold text-amber-700">
              Catatan: {namaLibur} — Anda tetap dijadwalkan shift.
            </p>
          )}
        </>
      ) : (
        <div>
          <p className="text-[13px] font-semibold text-slate-700 sm:text-sm">
            Belum ada jadwal shift.
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
            {jadwal?.pesan_jadwal ||
              'Hubungi Kepala Ruangan atau Super Admin untuk penjadwalan shift.'}
          </p>
        </div>
      )}

      {!libur && jadwal?.boleh_absen === false && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-[11px] font-semibold text-amber-800">
          Absensi dikunci untuk jadwal hari ini.
        </p>
      )}
    </section>
  )
}
