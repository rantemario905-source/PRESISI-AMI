/**
 * Daftar pengaduan presensi. Dipakai pegawai (riwayat), kepala unit
 * (persetujuan), dan Super Admin (persetujuan).
 */
import {
  formatJam,
  formatTanggal,
  formatTanggalRingkas,
} from '../../utils/format.js'
import { labelStatusIzin, varianStatusIzin } from '../../utils/status.js'
import { Badge, Button } from '../ui/index.js'

export default function DaftarPengaduan({
  daftar = [],
  bolehPutuskan = false,
  idSaya = null,
  onPutuskan,
  onLihatFoto,
  pesanKosong = 'Belum ada pengaduan.',
}) {
  if (daftar.length === 0) {
    return (
      <div className="px-4 py-12 text-center text-sm text-slate-500">
        {pesanKosong}
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {daftar.map((baris) => {
        const menunggu = baris.status === 'menunggu'
        return (
          <article key={baris.id} className="px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold text-slate-800 sm:text-sm">
                  {baris.pegawai_nama ?? '—'}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {baris.unit_kerja ?? '—'} ·{' '}
                  {formatTanggalRingkas(baris.tanggal)}
                </p>
              </div>
              <Badge variant={varianStatusIzin(baris.status)}>
                {labelStatusIzin(baris.status)}
              </Badge>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600 sm:max-w-md">
              <p>
                Masuk:{' '}
                <b className="font-semibold">
                  {baris.jam_masuk ? formatJam(baris.jam_masuk) : '—'}
                </b>
              </p>
              <p>
                Diajukan:{' '}
                <b className="font-semibold">
                  {baris.jam_pulang_diajukan
                    ? formatJam(baris.jam_pulang_diajukan)
                    : '—'}
                </b>
              </p>
              {baris.jam_pulang_disetujui && (
                <p className="col-span-2">
                  Disetujui:{' '}
                  <b className="font-semibold">
                    {formatJam(baris.jam_pulang_disetujui)}
                  </b>
                </p>
              )}
            </div>

            <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-[12px] leading-relaxed text-slate-700">
              {baris.alasan}
            </p>

            {baris.catatan_admin && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500">
                Catatan: {baris.catatan_admin}
              </p>
            )}

            {baris.diputuskan_pada && (
              <p className="mt-1.5 text-[10px] text-slate-400">
                {baris.status === 'disetujui' ? 'Disetujui' : 'Diputuskan'} oleh{' '}
                {baris.pemutus_nama ?? '—'} ·{' '}
                {formatTanggal(baris.diputuskan_pada)}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap gap-2">
              {baris.dokumen_path && (
                <Button
                  type="button"
                  variant="sekunder"
                  size="sm"
                  onClick={() => onLihatFoto?.(baris)}
                >
                  Lihat Foto
                </Button>
              )}
              {bolehPutuskan && menunggu && baris.user_id !== idSaya && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => onPutuskan?.(baris)}
                >
                  Tinjau Pengaduan
                </Button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}
