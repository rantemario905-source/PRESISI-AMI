import { formatTanggalPanjang } from '../../utils/format.js'

export default function BlokTandaTangan({ waktuCetak, namaKepala }) {
  return (
    <div className="ttd-laporan">
      <p>Muara Badak, {formatTanggalPanjang(waktuCetak)}</p>
      <p>Kepala Ruangan,</p>
      <div className="ttd-ruang" aria-hidden="true" />
      <p className="ttd-nama">{namaKepala || '................................'}</p>
      <p className="ttd-nip">NIP. ........................................</p>
    </div>
  )
}
