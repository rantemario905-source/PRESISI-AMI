/**
 * ==========================================================================
 * Kartu Status Perangkat (Device Binding)
 * --------------------------------------------------------------------------
 * Tiga kondisi sesuai spesifikasi:
 *   a. belum terdaftar → tombol "Ajukan Verifikasi Perangkat" (status pending)
 *   b. pending         → pesan menunggu persetujuan Admin IT, absen terkunci
 *   c. approved        → absen aktif (kartu menampilkan status sah)
 *   (+ rejected        → bisa diajukan ulang)
 * ==========================================================================
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
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">Status Perangkat</h3>
        <Badge variant={info.varian}>{info.label}</Badge>
      </div>

      <Alert variant={info.varian === 'sukses' ? 'sukses' : info.varian} className="mb-4">
        {info.pesan}
      </Alert>

      {info.aksi && (
        <Button
          variant="utama"
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
