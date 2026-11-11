import test from 'node:test'
import assert from 'node:assert/strict'
import { varianJenisIzin, varianStatusKehadiran } from '../src/utils/status.js'

test('jenis ketidakhadiran memakai warna berbeda', () => {
  assert.equal(varianJenisIzin('Sakit'), 'sakit')
  assert.equal(varianJenisIzin('Cuti'), 'cuti')
  assert.equal(varianJenisIzin('Dinas Luar'), 'dinas')
  assert.equal(varianJenisIzin('Izin'), 'izin')
  assert.equal(varianJenisIzin('Lainnya'), 'info')
})

test('status kehadiran mengikuti varian jenis', () => {
  assert.equal(varianStatusKehadiran('Sakit'), 'sakit')
  assert.equal(varianStatusKehadiran('Cuti'), 'cuti')
  assert.equal(varianStatusKehadiran('Dinas Luar'), 'dinas')
  assert.equal(varianStatusKehadiran('Izin'), 'izin')
  assert.equal(varianStatusKehadiran('Hadir'), 'sukses')
  assert.equal(varianStatusKehadiran('Alfa'), 'bahaya')
})
