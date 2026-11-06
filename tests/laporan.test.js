import test from 'node:test'
import assert from 'node:assert/strict'
import {
  bersihkanAlasanKoreksi,
  labelShift,
  ringkasKehadiran,
} from '../src/utils/laporan.js'

test('labelShift menampilkan nama shift atau tanda kosong', () => {
  assert.equal(labelShift('Pagi'), 'Pagi')
  assert.equal(labelShift('Malam'), 'Malam')
  assert.equal(labelShift(null), '—')
  assert.equal(labelShift(''), '—')
})

test('bersihkanAlasanKoreksi membuang awalan persetujuan dan catatan', () => {
  assert.equal(
    bersihkanAlasanKoreksi('Pengaduan disetujui oleh Kepala Unit: Lupa absen'),
    'Lupa absen',
  )
  assert.equal(
    bersihkanAlasanKoreksi(
      'Pengaduan absen masuk disetujui oleh presisiadmin: HP mati',
    ),
    'HP mati',
  )
  assert.equal(
    bersihkanAlasanKoreksi('Koreksi jam masuk disetujui oleh Suriami: Datang 07.50'),
    'Datang 07.50',
  )
  assert.equal(
    bersihkanAlasanKoreksi('Pengaduan disetujui oleh Kepala Unit: Lupa | disetujui'),
    'Lupa',
  )
  assert.equal(bersihkanAlasanKoreksi('Izin Ke BANK BPD'), 'Izin Ke BANK BPD')
  assert.equal(bersihkanAlasanKoreksi('   '), '')
  assert.equal(bersihkanAlasanKoreksi(null), '')
})

test('ringkasKehadiran menghitung status dan keterlambatan', () => {
  const hasil = ringkasKehadiran([
    { status_kehadiran: 'Hadir', menit_terlambat: 0 },
    { status_kehadiran: 'Hadir', menit_terlambat: 3 },
    { status_kehadiran: 'Alfa', menit_terlambat: null },
  ])
  assert.equal(hasil.hitungan.Hadir, 2)
  assert.equal(hasil.hitungan.Alfa, 1)
  assert.equal(hasil.terlambat, 1)
  assert.equal(hasil.totalMenitTerlambat, 3)
  assert.equal(hasil.total, 3)
})
