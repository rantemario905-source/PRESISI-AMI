import test from 'node:test'
import assert from 'node:assert/strict'
import {
  akhirBulan,
  daftarTanggal,
  formatJam,
  formatJarak,
  gabungTanggalJam,
  inisialNama,
  namaBulan,
} from '../src/utils/format.js'

test('formatJarak menampilkan meter dan kilometer', () => {
  assert.equal(formatJarak(0), '0 m')
  assert.equal(formatJarak(85), '85 m')
  assert.equal(formatJarak(1000), '1,00 km')
  assert.equal(formatJarak(1234), '1,23 km')
  assert.equal(formatJarak(null), '—')
})

test('inisialNama mengambil maksimal dua inisial', () => {
  assert.equal(inisialNama('Budi Santoso'), 'BS')
  assert.equal(inisialNama('Siti'), 'S')
  assert.equal(inisialNama('  '), '')
})

test('daftarTanggal inklusif dan menolak rentang terbalik', () => {
  assert.deepEqual(daftarTanggal('2026-10-30', '2026-11-02'), [
    '2026-10-30',
    '2026-10-31',
    '2026-11-01',
    '2026-11-02',
  ])
  assert.deepEqual(daftarTanggal('2026-11-02', '2026-10-30'), [])
  assert.deepEqual(daftarTanggal('', '2026-10-30'), [])
})

test('akhirBulan dan namaBulan menangani periode valid', () => {
  assert.equal(akhirBulan('2026-02'), '2026-02-28')
  assert.equal(akhirBulan('2026-12'), '2026-12-31')
  assert.equal(akhirBulan('2026-13'), '')
  assert.equal(namaBulan('2026-10'), 'Oktober 2026')
  assert.equal(namaBulan('salah'), '—')
})

test('gabungTanggalJam membentuk ISO WITA', () => {
  assert.equal(gabungTanggalJam('2026-10-30', '07:15'), '2026-10-30T07:15:00+08:00')
  assert.equal(gabungTanggalJam('2026-10-30'), '2026-10-30T00:00:00+08:00')
  assert.equal(gabungTanggalJam('', '07:15'), null)
})

test('formatJam memakai WITA', () => {
  assert.equal(formatJam('2026-10-30T23:15:00.000Z'), '07:15 WITA')
  assert.equal(formatJam(null), '—')
})
