/**
 * Kartu status perangkat (Device Binding).
 * Kondisi: belum terdaftar, menunggu, disetujui, ditolak, atau terikat ke
 * perangkat lain. Satu pegawai hanya boleh punya satu perangkat aktif.
 */
import Alert from '../ui/Alert.jsx'
import Badge from '../ui/Badge.jsx'
import Button from '../ui/Button.jsx'

const STATUS = {
  belum_terdaftar: {
    varian: 'peringatan',
    label: 'Belum Terdaftar',
    pesan: 'Perangkat ini belum terdaftar. Ajukan verifikasi agar dapat disetujui Admin IT.',
    aksi: 'Ajukan Verifikasi Perangkat',
  },
  pending: {
    varian: 'peringatan',
    label: 'Menunggu Persetujuan',
    pesan: 'Menunggu persetujuan Admin IT. Tombol absen aktif setelah disetujui.',
    aksi: null,
  },
  approved: {
    varian: 'sukses',
    label: 'Terverifikasi',
    pesan: null,
    aksi: null,
  },
  rejected: {
    varian: 'bahaya',
    label: 'Ditolak',
    pesan: 'Pengajuan perangkat ditolak. Ajukan ulang bila perlu.',
    aksi: 'Ajukan Ulang Verifikasi',
  },
  terikat_perangkat_lain: {
    varian: 'bahaya',
    label: 'Perangkat Lain',
    pesan: 'Kamu Menggunakan Perangkat/Browser Yang berbeda dengan yang terdaftar',
    aksi: null,
  },
  pending_perangkat_lain: {
    varian: 'peringatan',
    label: 'Menunggu di Perangkat Lain',
    pesan: 'Pengajuan perangkat lain sedang menunggu persetujuan Admin IT.',
    aksi: null,
  },
}

export default function KartuStatusPerangkat({
  status,
  perangkatAktif,
  sedangMengajukan,
  onAjukan,
}) {
  const info = STATUS[status] ?? STATUS.belum_terdaftar
  const infoAktif = perangkatAktif?.info_perangkat

  if (status === 'approved') {
    return (
      <section className="kartu">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-sm">
            Status Perangkat
          </h3>
          <Badge variant="sukses">Terverifikasi</Badge>
        </div>
      </section>
    )
  }

  return (
    <section className="kartu">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 sm:text-sm">
          Status Perangkat
        </h3>
        <Badge variant={info.varian}>{info.label}</Badge>
      </div>

      <Alert variant={info.varian === 'sukses' ? 'sukses' : info.varian} className="mb-4">
        <p>{info.pesan}</p>
        {status === 'terikat_perangkat_lain' ? (
          <p className="mt-1 text-[11px] font-medium opacity-85">
            Reset Perangkat Hub Tim IT
          </p>
        ) : (
          infoAktif && (
            <span className="mt-2 block text-[11px] font-semibold opacity-80">
              Perangkat aktif: {infoAktif}
            </span>
          )
        )}
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
