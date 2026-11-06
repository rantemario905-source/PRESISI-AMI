import KopLaporan from './KopLaporan.jsx'
import BlokTandaTangan from './BlokTandaTangan.jsx'
import {
  formatJam,
  formatTanggalHari,
  formatTanggalPanjang,
  namaBulan,
} from '../../utils/format.js'
import {
  STATUS_KEHADIRAN,
  labelPolaKerja,
  labelShift,
  ringkasKehadiran,
} from '../../utils/laporan.js'

const jamSingkat = (iso) => (iso ? formatJam(iso).replace(' WITA', '') : '—')

export default function LembarLaporan({
  pegawai,
  presensi = [],
  jadwal = {},
  periode,
  waktuCetak,
}) {
  const ringkasan = ringkasKehadiran(presensi)
  const polaShift = pegawai.pola_kerja !== 'reguler'
  const jumlahKolom = polaShift ? 7 : 6
  const shiftHari = (baris) =>
    labelShift(jadwal[`${baris.user_id}|${baris.tanggal}`])

  return (
    <article className="lembar-laporan">
      <KopLaporan />

      <h1 className="judul-laporan">LAPORAN PRESENSI BULANAN PEGAWAI</h1>

      <dl className="meta-laporan">
        <div className="meta-item">
          <dt>Nama Pegawai</dt>
          <dd>{pegawai.nama}</dd>
        </div>
        <div className="meta-item">
          <dt>Unit / Instalasi</dt>
          <dd>{pegawai.unit_kerja}</dd>
        </div>
        <div className="meta-item">
          <dt>Periode</dt>
          <dd>{namaBulan(periode)}</dd>
        </div>
        <div className="meta-item">
          <dt>Pola Kerja</dt>
          <dd>{labelPolaKerja(pegawai.pola_kerja)}</dd>
        </div>
      </dl>

      <div className="ringkasan-laporan">
        <p className="ringkasan-status">
          {STATUS_KEHADIRAN.map((status) => (
            <span key={status}>
              {status}: {ringkasan.hitungan[status]}
            </span>
          ))}
        </p>
        <p>
          {`Terlambat: ${ringkasan.terlambat} kali (${ringkasan.totalMenitTerlambat} menit) · Total hari tercatat: ${ringkasan.total}`}
        </p>
      </div>

      <table className="tabel-laporan">
        <colgroup>
          <col style={{ width: '6%' }} />
          <col style={{ width: polaShift ? '21%' : '26%' }} />
          {polaShift && <col style={{ width: '14%' }} />}
          <col style={{ width: polaShift ? '13%' : '17%' }} />
          <col style={{ width: polaShift ? '13%' : '17%' }} />
          <col style={{ width: polaShift ? '16%' : '17%' }} />
          <col style={{ width: '17%' }} />
        </colgroup>
        <thead>
          <tr>
            <th>No</th>
            <th>Hari / Tanggal</th>
            {polaShift && <th>Shift</th>}
            <th>Jam Masuk</th>
            <th>Jam Pulang</th>
            <th>Status</th>
            <th>Terlambat</th>
          </tr>
        </thead>
        <tbody>
          {presensi.length === 0 ? (
            <tr>
              <td colSpan={jumlahKolom} className="kosong">
                Belum ada catatan presensi pada periode ini.
              </td>
            </tr>
          ) : (
            presensi.map((baris, indeks) => (
              <tr key={baris.id}>
                <td className="tengah">{indeks + 1}</td>
                <td>{formatTanggalHari(baris.tanggal)}</td>
                {polaShift && (
                  <td className="tengah">{shiftHari(baris)}</td>
                )}
                <td className="tengah">{jamSingkat(baris.jam_masuk)}</td>
                <td className="tengah">{jamSingkat(baris.jam_pulang)}</td>
                <td className="tengah">{baris.status_kehadiran}</td>
                <td className="tengah">
                  {Number(baris.menit_terlambat) > 0
                    ? `${baris.menit_terlambat} mnt`
                    : '—'}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <BlokTandaTangan waktuCetak={waktuCetak} />

      <div className="footer-laporan">
        <span>Dicetak melalui PRESISI-AMI, {formatTanggalPanjang(waktuCetak)}</span>
      </div>
    </article>
  )
}
