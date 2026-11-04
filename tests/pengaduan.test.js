import test from 'node:test'
import assert from 'node:assert/strict'
import {
  batasAwalPengaduan,
  dalamBatasPengaduan,
  susunWaktuPengaduan,
} from '../src/utils/pengaduan.js'

test('pengaduan menerima tanggal hari ini sampai 7 hari ke belakang', () => {
  assert.equal(dalamBatasPengaduan('2026-11-04', '2026-11-04'), true)
  assert.equal(dalamBatasPengaduan('2026-10-28', '2026-11-04'), true)
  assert.equal(dalamBatasPengaduan('2026-10-27', '2026-11-04'), false)
  assert.equal(dalamBatasPengaduan('2026-11-05', '2026-11-04'), false)
})

test('batas awal pengaduan dihitung tujuh hari sebelum hari acuan', () => {
  assert.equal(batasAwalPengaduan('2026-11-04'), '2026-10-28')
  assert.equal(batasAwalPengaduan('bukan-tanggal'), null)
})

test('jam pulang pengaduan shift malam otomatis H+1', () => {
  const hasil = susunWaktuPengaduan({
    tanggal: '2026-11-03',
    jamMasuk: '20:00',
    jamPulang: '07:10',
  })

  assert.ok(hasil.jamPulangIso)
  assert.equal(hasil.pulangLintasHari, true)
  assert.equal(new Date(hasil.jamPulangIso).toISOString(), '2026-11-03T23:10:00.000Z')
})

test('jam pulang pengaduan reguler tetap di tanggal yang sama', () => {
  const hasil = susunWaktuPengaduan({
    tanggal: '2026-11-03',
    jamMasuk: '07:00',
    jamPulang: '15:05',
  })

  assert.equal(hasil.pulangLintasHari, false)
  assert.match(hasil.jamPulangIso, /^2026-11-03T15:05/)
})
