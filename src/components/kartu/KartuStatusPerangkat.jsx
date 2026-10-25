/**
 * Kartu status perangkat (Device Binding).
 * Tiga kondisi utama: belum terdaftar, menunggu, disetujui (+ ditolak).
 */
import Alert from '../ui/Alert.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'

const STATUS = {
  belum_terdaftar: {
    varian: 'peringatan',
    label: 'Belum Terdaftar',
    pesan:
      'Perangkat ini belum dikenali sistem (perangkat baru atau cache browser terhapus). Ajukan verifikasi agar Admin IT dapat menyetujui perangkat Anda.',
    aksi: 'Ajukan Verifikasi Perangkat',
  },
  pending: {
    varian: 'peringatan',
    label: 'Menunggu Persetujuan',
    pesan: 'Perangkat Anda sedang menunggu persetujuan Admin IT. Tombol absen terkunci sampai disetujui.',
    aksi: null,
  },
  approved: {
    varian: 'sukses',
    label: 'Terverifikasi',
    pesan: 'Perangkat ini sudah disetujui. Anda dapat melakukan absensi masuk dan pulang.',
    aksi: null,
  },
  rejected: {
    varian: 'bahaya',
    label: 'Ditolak',
    pesan: 'Pengajuan perangkat ditolak Admin IT. Ajukan ulang bila Anda merasa ini keliru.',
    aksi: 'Ajukan Ulang Verifikasi',
  },
}

export default function KartuStatusPerangkat({ status, sedangMengajukan, onAjukan }) {
  const info = STATUS[status] ?? STATUS.belum_terdaftar

  return (
    <section className="kartu">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-sm">
          Status Perangkat
        </h3>
        <Badge variant={info.varian}>{info.label}</Badge>
      </div>

      <Alert variant={info.varian === 'sukses' ? 'sukses' : info.varian} className="mb-4">
        {info.pesan}
      </Alert>

      {info.aksi && (
        <Button
          variant="utama"
          size="md"
          className="w-full"
          onClick={onAjukan}
          disabled={sedangMengajukan}
        >
          {sedangMengajukan ? 'Mengirim Pengajuan…' : info.aksi}
        </Button>
      )}
    </section>
  )
}
