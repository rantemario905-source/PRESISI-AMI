import KopLaporan from './KopLaporan.jsx'
import { formatTanggalPanjang, namaBulan } from '../../utils/format.js'
import { kelasShift, singkatShift } from '../../utils/jadwalCetak.js'

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export default function LembarJadwal({
  unit,
  periode,
  matriks = [],
  namaKepala = '',
  waktuCetak,
}) {
  return (
    <article className="lembar-jadwal">
      <KopLaporan />

      <h1 className="judul-laporan">JADWAL SHIFT PEGAWAI</h1>

      <dl className="meta-laporan meta-jadwal">
        <div className="meta-item">
          <dt>Unit / Instalasi</dt>
          <dd>{unit || '—'}</dd>
        </div>
        <div className="meta-item">
          <dt>Periode</dt>
          <dd>{namaBulan(periode)}</dd>
        </div>
      </dl>

      <table className="tabel-jadwal">
        <thead>
          <tr>
            <th className="kolom-no">No</th>
            <th className="kolom-nama">Nama Pegawai</th>
            {matriks[0]?.sel.map((h) => (
              <th key={h.tanggal}>
                <span className="tgl-nomor">{h.nomor}</span>
                <span className="tgl-hari">{HARI[h.hari]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matriks.length === 0 ? (
            <tr>
              <td className="kosong" colSpan={(matriks[0]?.sel.length ?? 0) + 2}>
                Belum ada pegawai shift pada unit ini.
              </td>
            </tr>
          ) : (
            matriks.map((baris, indeks) => (
              <tr key={baris.pegawai.id}>
                <td className="tengah">{indeks + 1}</td>
                <td className="nama-pegawai">{baris.pegawai.nama}</td>
                {baris.sel.map((sel) => (
                  <td
                    key={sel.tanggal}
                    className={`sel-shift sel-${kelasShift(sel.shift?.nama_shift)}`}
                  >
                    {singkatShift(sel.shift?.nama_shift)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="legenda-jadwal">
        <span className="legenda-item">
          <span className="legenda-warna sel-pagi" aria-hidden="true" /> Pagi
        </span>
        <span className="legenda-item">
          <span className="legenda-warna sel-siang" aria-hidden="true" /> Siang
        </span>
        <span className="legenda-item">
          <span className="legenda-warna sel-malam" aria-hidden="true" /> Malam
        </span>
      </div>

      <div className="ttd-laporan ttd-jadwal">
        <p>Muara Badak, {formatTanggalPanjang(waktuCetak)}</p>
        <p>Kepala Unit,</p>
        <div className="ttd-ruang" aria-hidden="true" />
        <p className="ttd-nama">{namaKepala || '............................'}</p>
      </div>

      <div className="footer-laporan">
        <span>Dicetak melalui PRESISI-AMI, {formatTanggalPanjang(waktuCetak)}</span>
      </div>
    </article>
  )
}
