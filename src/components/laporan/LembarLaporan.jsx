import KopLaporan from './KopLaporan.jsx'
import BlokTandaTangan from './BlokTandaTangan.jsx'
import {
  formatJam,
  formatTanggalHari,
  formatTanggalPanjang,
  namaBulan,
} from '../../utils/format.js'
import { STATUS_KEHADIRAN, labelPolaKerja, ringkasKehadiran } from '../../utils/laporan.js'

const jamSingkat = (iso) => (iso ? formatJam(iso).replace(' WITA', '') : '—')

export default function LembarLaporan({
  pegawai,
  presensi = [],
  alasanIzin = {},
  periode,
  namaKepala,
  halaman,
  totalHalaman,
  waktuCetak,
}) {
  const ringkasan = ringkasKehadiran(presensi)
  const keterangan = (baris) =>
    baris.alasan_koreksi || alasanIzin[`${baris.user_id}|${baris.tanggal}`] || '—'

  return (
    <article className="lembar-laporan">
      <KopLaporan />

      <h1 className="judul-laporan">LAPORAN PRESENSI BULANAN PEGAWAI</h1>

      <table className="meta-laporan">
        <thead>
          <tr>
            <th>Nama Pegawai</th>
            <th>Unit / Instalasi</th>
            <th>Periode</th>
            <th>Pola Kerja</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{pegawai.nama}</td>
            <td>{pegawai.unit_kerja}</td>
            <td>{namaBulan(periode)}</td>
            <td>{labelPolaKerja(pegawai.pola_kerja)}</td>
          </tr>
        </tbody>
      </table>

      <div className="ringkasan-laporan">
        <p>
          {STATUS_KEHADIRAN.map((status) => `${status}: ${ringkasan.hitungan[status]}`).join(
            '   ·   ',
          )}
        </p>
        <p>
          Terlambat: {ringkasan.terlambat} kali ({ringkasan.totalMenitTerlambat} menit) · Total
          hari tercatat: {ringkasan.total}
        </p>
      </div>

      <table className="tabel-laporan">
        <colgroup>
          <col style={{ width: '7%' }} />
          <col style={{ width: '25%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '12%' }} />
          <col style={{ width: '11%' }} />
          <col style={{ width: '23%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>No</th>
            <th>Hari / Tanggal</th>
            <th>Jam Masuk</th>
            <th>Jam Pulang</th>
            <th>Status</th>
            <th>Terlambat</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {presensi.length === 0 ? (
            <tr>
              <td colSpan={7} className="kosong">
                Belum ada catatan presensi pada periode ini.
              </td>
            </tr>
          ) : (
            presensi.map((baris, indeks) => (
              <tr key={baris.id}>
                <td className="tengah">{indeks + 1}</td>
                <td>{formatTanggalHari(baris.tanggal)}</td>
                <td className="tengah">{jamSingkat(baris.jam_masuk)}</td>
                <td className="tengah">{jamSingkat(baris.jam_pulang)}</td>
                <td className="tengah">{baris.status_kehadiran}</td>
                <td className="tengah">
                  {Number(baris.menit_terlambat) > 0
                    ? `${baris.menit_terlambat} mnt`
                    : '—'}
                </td>
                <td>{keterangan(baris)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <BlokTandaTangan waktuCetak={waktuCetak} namaKepala={namaKepala} />

      <div className="footer-laporan">
        <span>
          Dicetak melalui PRESISI-AMI, {formatTanggalPanjang(waktuCetak)}{' '}
          {formatJam(waktuCetak)}
        </span>
        <span>
          Halaman {halaman} dari {totalHalaman}
        </span>
      </div>
    </article>
  )
}
