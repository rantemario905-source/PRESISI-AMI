import { PENANDA_TANGAN_LAPORAN } from '../../config/constants.js'
import { formatTanggalPanjang } from '../../utils/format.js'

export default function BlokTandaTangan({ waktuCetak }) {
  return (
    <div className="ttd-laporan">
      <p>Muara Badak, {formatTanggalPanjang(waktuCetak)}</p>
      <p>{PENANDA_TANGAN_LAPORAN.jabatan},</p>
      <div className="ttd-ruang" aria-hidden="true" />
      <p className="ttd-nama">{PENANDA_TANGAN_LAPORAN.nama}</p>
      <p className="ttd-nip">NIP. {PENANDA_TANGAN_LAPORAN.nip}</p>
    </div>
  )
}
