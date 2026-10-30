import test from 'node:test'
import assert from 'node:assert/strict'
import {
  bukaAbsenMasuk,
  bukaAbsenPulang,
  formatJamBuka,
  formatJamJadwal,
  jadwalLintasHari,
  tutupAbsenPulang,
} from '../src/utils/jadwalAbsen.js'

const reguler = {
  terjadwal: true,
  boleh_absen: true,
  tanggal: '2026-10-30',
  jam_mulai: '08:00:00',
  jam_selesai: '16:30:00',
}

const malam = {
  terjadwal: true,
  boleh_absen: true,
  tanggal: '2026-10-30',
  jam_mulai: '20:00:00',
  jam_selesai: '08:00:00',
}

test('absensi reguler: masuk 1 jam sebelum, pulang 16.31 sampai 18.30', () => {
  assert.equal(bukaAbsenMasuk(reguler).toISOString(), '2026-10-29T23:00:00.000Z')
  assert.equal(bukaAbsenPulang(reguler).toISOString(), '2026-10-30T08:31:00.000Z')
  assert.equal(tutupAbsenPulang(reguler).toISOString(), '2026-10-30T10:30:00.000Z')
})

test('shift malam: jadwal lintas hari dihitung pada tanggal selesai', () => {
  assert.equal(jadwalLintasHari(malam), true)
  assert.equal(bukaAbsenMasuk(malam).toISOString(), '2026-10-30T11:00:00.000Z')
  assert.equal(bukaAbsenPulang(malam).toISOString(), '2026-10-31T00:01:00.000Z')
  assert.equal(tutupAbsenPulang(malam).toISOString(), '2026-10-31T02:00:00.000Z')
})

test('jadwal tidak tersedia atau terkunci menghasilkan null', () => {
  assert.equal(bukaAbsenMasuk({ terjadwal: false }), null)
  assert.equal(bukaAbsenPulang({ terjadwal: true, boleh_absen: false }), null)
  assert.equal(tutupAbsenPulang({ terjadwal: false }), null)
})

test('format jam WITA dan jam jadwal', () => {
  assert.equal(formatJamBuka(new Date('2026-10-29T23:00:00.000Z')), '07:00')
  assert.equal(formatJamJadwal('08:00:00'), '08:00')
  assert.equal(formatJamJadwal(null), '')
})
