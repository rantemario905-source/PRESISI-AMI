import test from 'node:test'
import assert from 'node:assert/strict'
import {
  pecahTanggal,
  tanggalISO,
  periodeDariTanggal,
  geserBulan,
  indeksHariSenin,
  matriksBulan,
  jumlahHari,
  geserTanggal,
} from '../src/utils/kalender.js'

test('pecahTanggal menerima tanggal valid dan menolak tanggal rusak', () => {
  assert.deepEqual(pecahTanggal('2026-11-04'), { tahun: 2026, bulan: 11, hari: 4 })
  assert.equal(pecahTanggal('2026-02-29'), null)
  assert.equal(pecahTanggal('2024-02-29')?.hari, 29)
  assert.equal(pecahTanggal('2026-13-01'), null)
  assert.equal(pecahTanggal(''), null)
  assert.equal(pecahTanggal(null), null)
})

test('tanggalISO dan periodeDariTanggal menjaga format', () => {
  assert.equal(tanggalISO(2026, 11, 4), '2026-11-04')
  assert.equal(tanggalISO(2026, 1, 9), '2026-01-09')
  assert.equal(periodeDariTanggal('2026-07-31'), '2026-07')
  assert.equal(periodeDariTanggal('rusak'), '')
})

test('geserBulan melewati batas tahun', () => {
  assert.equal(geserBulan('2026-01', -1), '2025-12')
  assert.equal(geserBulan('2026-12', 1), '2027-01')
  assert.equal(geserBulan('2026-07', 5), '2026-12')
  assert.equal(geserBulan('2026-13', 0), '')
})

test('matriksBulan dimulai Senin dan mencakup seluruh hari', () => {
  const sel = matriksBulan('2026-11')
  assert.equal(sel.length % 7, 0)
  assert.equal(sel[0].tanggal, '2026-10-26')
  assert.equal(sel[0].diBulanIni, false)
  assert.equal(sel.filter((s) => s.diBulanIni).length, 30)
  assert.equal(sel.find((s) => s.tanggal === '2026-11-01')?.diBulanIni, true)
  assert.equal(indeksHariSenin('2026-11-04'), 2)
  assert.deepEqual(matriksBulan('rusak'), [])
})

test('jumlahHari menghitung rentang inklusif', () => {
  assert.equal(jumlahHari('2026-11-04', '2026-11-04'), 1)
  assert.equal(jumlahHari('2026-11-01', '2026-11-04'), 4)
  assert.equal(jumlahHari('2026-11-04', '2026-11-01'), 0)
  assert.equal(jumlahHari('', '2026-11-01'), 0)
})

test('geserTanggal aman untuk lintas bulan dan tahun', () => {
  assert.equal(geserTanggal('2026-11-01', -1), '2026-10-31')
  assert.equal(geserTanggal('2026-12-31', 1), '2027-01-01')
  assert.equal(geserTanggal('rusak', 1), '')
})
