import KopLaporan from './KopLaporan.jsx'
import BlokTandaTangan from './BlokTandaTangan.jsx'
import {
  formatJam,
  formatTanggalHari,
  formatTanggalPanjang,
  namaBulan,
} from '../../utils/format.js'
import {
  STATUS_BERALASAN,
  STATUS_KEHADIRAN,
  labelPolaKerja,
  labelShift,
  ringkasKehadiran,
  ringkasTukar,
} from '../../utils/laporan.js'

const jamSingkat = (iso) => (iso ? formatJam(iso).replace(' WITA', '') : '—')

export default function LembarLaporan({
  pegawai,
  presensi = [],
  alasanIzin = {},
  jadwal = {},
  tukar = [],
  periode,
  waktuCetak,
}) {
  const ringkasan = ringkasKehadiran(presensi)
  const polaShift = pegawai.pola_kerja !== 'reguler'
  const tukarPegawai = ringkasTukar(tukar, pegawai.id)
  const rekanTukar = new Map(tukarPegawai.map((t) => [t.tanggal, t.rekan]))
  const keterangan = (baris) => {
    if (baris.status_kehadiran === 'Alfa') return 'Alfa'
    if (STATUS_BERALASAN.includes(baris.status_kehadiran)) {
      return alasanIzin[`${baris.user_id}|${baris.tanggal}`] || '—'
    }
    if (rekanTukar.has(baris.tanggal)) {
      return `Tukar dengan ${rekanTukar.get(baris.tanggal)}`
    }
    return '—'
  }

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
          {polaShift ? (
            <>
              <col style={{ width: '5%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '21%' }} />
            </>
          ) : (
            <>
              <col style={{ width: '6%' }} />
              <col style={{ width: '21%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '28%' }} />
            </>
          )}
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
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {presensi.length === 0 ? (
            <tr>
              <td colSpan={polaShift ? 8 : 7} className="kosong">
                Belum ada catatan presensi pada periode ini.
              </td>
            </tr>
          ) : (
            presensi.map((baris, indeks) => (
              <tr key={baris.id}>
                <td className="tengah">{indeks + 1}</td>
                <td>{formatTanggalHari(baris.tanggal)}</td>
                {polaShift && (
                  <td className="tengah">
                    {labelShift(jadwal[`${baris.user_id}|${baris.tanggal}`])}
                  </td>
                )}
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

      {tukarPegawai.length > 0 && (
        <div className="blok-tukar">
          <p className="judul-tukar">Riwayat Tukar Shift Bulan Ini</p>
          <table className="tabel-tukar">
            <thead>
              <tr>
                <th>No</th>
                <th>Tanggal</th>
                <th>Rekan Tukar</th>
                <th>Shift Asal</th>
                <th>Shift Pengganti</th>
                <th>Alasan</th>
                <th>Dicatat Oleh</th>
              </tr>
            </thead>
            <tbody>
              {tukarPegawai.map((t, indeks) => (
                <tr key={t.id}>
                  <td className="tengah">{indeks + 1}</td>
                  <td>{formatTanggalHari(t.tanggal)}</td>
                  <td>{t.rekan}</td>
                  <td className="tengah">{t.asal}</td>
                  <td className="tengah">{t.baru}</td>
                  <td>{t.alasan || '—'}</td>
                  <td>{t.pencatat}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <BlokTandaTangan waktuCetak={waktuCetak} />

      <div className="footer-laporan">
        <span>Dicetak melalui PRESISI-AMI, {formatTanggalPanjang(waktuCetak)}</span>
      </div>
    </article>
  )
}
