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
  kelasStatusLaporan,
  labelPolaKerja,
  labelShift,
  ringkasKehadiran,
  susunBarisLaporan,
} from '../../utils/laporan.js'

const jamSingkat = (iso) => (iso ? formatJam(iso).replace(' WITA', '') : '—')
const JAM_KERJA_KOSONG = { global: {}, unit: {} }

export default function LembarLaporan({
  pegawai,
  presensi = [],
  jadwal = {},
  hariLibur = {},
  jamKerja = JAM_KERJA_KOSONG,
  periode,
  waktuCetak,
}) {
  const barisLaporan = susunBarisLaporan({
    periode,
    presensi,
    jadwal,
    hariLibur,
    jamKerja,
    userId: pegawai.id,
    unitKerja: pegawai.unit_kerja,
    polaKerja: pegawai.pola_kerja,
  })
  const presensiTampil = barisLaporan.filter((hari) => hari.baris).map((hari) => hari.baris)
  const ringkasan = ringkasKehadiran(presensiTampil)
  const jumlahLibur = barisLaporan.filter((hari) => hari.libur).length
  const polaShift = pegawai.pola_kerja !== 'reguler'
  const jumlahKolom = polaShift ? 7 : 6

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
          {`Terlambat: ${ringkasan.terlambat} kali (${ringkasan.totalMenitTerlambat} menit) · Total hari tercatat: ${ringkasan.total} · Libur: ${jumlahLibur} hari`}
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
          {barisLaporan.length === 0 ? (
            <tr>
              <td colSpan={jumlahKolom} className="kosong">
                Belum ada data pada periode ini.
              </td>
            </tr>
          ) : (
            barisLaporan.map((hari) => {
              const baris = hari.baris
              const status = hari.libur
                ? 'Libur'
                : (baris?.status_kehadiran ?? '—')
              const terlambat = Number(baris?.menit_terlambat) > 0
                ? `${baris.menit_terlambat} mnt`
                : '—'

              return (
                <tr key={hari.tanggal}>
                  <td className="tengah">{hari.nomor}</td>
                  <td>{formatTanggalHari(hari.tanggal)}</td>
                  {polaShift && (
                    <td className="tengah">{labelShift(hari.shift)}</td>
                  )}
                  <td className="tengah">{jamSingkat(baris?.jam_masuk)}</td>
                  <td className="tengah">{jamSingkat(baris?.jam_pulang)}</td>
                  <td className={`tengah ${kelasStatusLaporan(status)}`}>{status}</td>
                  <td className="tengah">{terlambat}</td>
                </tr>
              )
            })
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
