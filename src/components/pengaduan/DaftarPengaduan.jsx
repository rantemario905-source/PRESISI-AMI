/**
 * Daftar pengaduan presensi. Dipakai pegawai (riwayat), kepala unit
 * (persetujuan), dan Super Admin (persetujuan).
 */
import { formatJam, formatTanggalRingkas } from '../../utils/format.js'
import { labelStatusIzin, varianStatusIzin } from '../../utils/status.js'
import { Badge, Button } from '../ui/index.js'

const LABEL_JENIS = {
  masuk: 'Absen masuk',
  pulang: 'Absen pulang',
}

function waktuPengaduan(baris) {
  const waktu = []
  if (baris.jenis === 'masuk') {
    if (baris.jam_masuk_diajukan) {
      waktu.push(['Diajukan', formatJam(baris.jam_masuk_diajukan)])
    }
    if (baris.jam_masuk) waktu.push(['Tercatat', formatJam(baris.jam_masuk)])
    if (baris.jam_masuk_disetujui) {
      waktu.push(['Disetujui', formatJam(baris.jam_masuk_disetujui)])
    }
    return waktu
  }

  if (baris.jam_masuk) waktu.push(['Masuk', formatJam(baris.jam_masuk)])
  if (baris.jam_pulang_diajukan) {
    waktu.push(['Diajukan', formatJam(baris.jam_pulang_diajukan)])
  }
  if (baris.jam_pulang_disetujui) {
    waktu.push(['Disetujui', formatJam(baris.jam_pulang_disetujui)])
  }
  return waktu
}

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
        const meta = [
          LABEL_JENIS[baris.jenis] ?? 'Pengaduan',
          formatTanggalRingkas(baris.tanggal),
          baris.unit_kerja,
        ].filter(Boolean)
        const waktu = waktuPengaduan(baris)
        const keputusan = baris.diputuskan_pada
          ? `${baris.status === 'disetujui' ? 'Disetujui' : 'Diputuskan'} ${
              baris.pemutus_nama ?? '—'
            } · ${formatTanggalRingkas(baris.diputuskan_pada)}`
          : ''

        return (
          <article key={baris.id} className="px-4 py-3.5 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-800 sm:text-sm">
                  {baris.pegawai_nama ?? '—'}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {meta.join(' · ')}
                </p>
              </div>
              <Badge variant={varianStatusIzin(baris.status)}>
                {labelStatusIzin(baris.status)}
              </Badge>
            </div>

            {waktu.length > 0 && (
              <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                {waktu.map(([label, nilai]) => (
                  <span key={label}>
                    <span className="text-slate-400">{label}</span>{' '}
                    <b className="font-semibold tabular-nums">{nilai}</b>
                  </span>
                ))}
              </p>
            )}

            {baris.alasan && (
              <p
                className="mt-2 line-clamp-2 border-l-2 border-slate-200 pl-2.5 text-[12px] leading-relaxed text-slate-600"
                title={baris.alasan}
              >
                {baris.alasan}
              </p>
            )}

            {baris.catatan_admin && (
              <p className="mt-1.5 line-clamp-1 text-[11px] text-slate-500">
                Catatan: {baris.catatan_admin}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 truncate text-[10px] text-slate-400">
                {keputusan || (menunggu ? 'Menunggu keputusan' : '')}
              </p>
              <div className="flex items-center gap-3">
                {baris.dokumen_path && (
                  <button
                    type="button"
                    onClick={() => onLihatFoto?.(baris)}
                    className="text-[11px] font-semibold text-sky-700 hover:underline"
                  >
                    Lihat Foto
                  </button>
                )}
                {bolehPutuskan && menunggu && baris.user_id !== idSaya && (
                  <Button size="sm" onClick={() => onPutuskan?.(baris)}>
                    Tinjau
                  </Button>
                )}
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
