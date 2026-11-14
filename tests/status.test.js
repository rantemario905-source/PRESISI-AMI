import test from 'node:test'
import assert from 'node:assert/strict'
import { labelStatusKehadiran, varianJenisIzin, varianStatusKehadiran } from '../src/utils/status.js'

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

test('hari yang dikoreksi tetap berlabel Hadir', () => {
  assert.equal(labelStatusKehadiran({ status_kehadiran: 'Hadir' }), 'Hadir')
  assert.equal(
    labelStatusKehadiran({
      status_kehadiran: 'Hadir',
      alasan_koreksi: 'Pengaduan disetujui oleh Kepala Unit: lupa absen pulang',
    }),
    'Hadir',
  )
  assert.equal(
    labelStatusKehadiran({ status_kehadiran: 'Hadir', dikoreksi_oleh: 'uuid-admin' }),
    'Hadir',
  )
  assert.equal(labelStatusKehadiran({ status_kehadiran: 'Alfa' }), 'Alfa')
  assert.equal(labelStatusKehadiran(null), '—')
})
