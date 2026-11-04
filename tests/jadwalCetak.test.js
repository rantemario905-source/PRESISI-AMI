import test from 'node:test'
import assert from 'node:assert/strict'
import {
  kelasShift,
  singkatShift,
  daftarHariBulan,
  susunMatriksJadwal,
} from '../src/utils/jadwalCetak.js'
import { PENANDA_TANGAN_LAPORAN } from '../src/config/constants.js'

test('kelasShift mengenali Pagi, Siang, dan Malam', () => {
  assert.equal(kelasShift('Pagi'), 'pagi')
  assert.equal(kelasShift('Siang'), 'siang')
  assert.equal(kelasShift('Malam'), 'malam')
  assert.equal(kelasShift('Shift Khusus'), 'lain')
  assert.equal(kelasShift(null), 'lain')
})

test('singkatShift memakai 3 huruf pertama', () => {
  assert.equal(singkatShift('Pagi'), 'PAG')
  assert.equal(singkatShift('malam'), 'MAL')
  assert.equal(singkatShift('  '), '—')
})

test('daftarHariBulan mengikuti jumlah hari bulan', () => {
  assert.equal(daftarHariBulan('2026-11').length, 30)
  assert.equal(daftarHariBulan('2026-02').length, 28)
  assert.equal(daftarHariBulan('2024-02').length, 29)
  assert.deepEqual(daftarHariBulan('rusak'), [])
  const november = daftarHariBulan('2026-11')
  assert.equal(november[0].tanggal, '2026-11-01')
  assert.equal(november[0].akhirPekan, true)
})

test('susunMatriksJadwal memetakan shift per pegawai dan tanggal', () => {
  const pegawai = [{ id: 'a', nama: 'A' }, { id: 'b', nama: 'B' }]
  const jadwal = [
    { user_id: 'a', tanggal: '2026-11-01', shift_master: { nama_shift: 'Pagi' } },
    { user_id: 'b', tanggal: '2026-11-02', shift_master: { nama_shift: 'Malam' } },
  ]
  const matriks = susunMatriksJadwal({ pegawai, jadwal, periode: '2026-11' })
  assert.equal(matriks.length, 2)
  assert.equal(matriks[0].sel.length, 30)
  assert.equal(matriks[0].sel[0].shift?.nama_shift, 'Pagi')
  assert.equal(matriks[0].sel[1].shift, null)
  assert.equal(matriks[1].sel[1].shift?.nama_shift, 'Malam')
})

test('PENANDA_TANGAN_LAPORAN tetap utuh untuk laporan bulanan', () => {
  assert.equal(PENANDA_TANGAN_LAPORAN.jabatan, 'Kasubbag Tata Usaha')
})
