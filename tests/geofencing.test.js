import test from 'node:test'
import assert from 'node:assert/strict'
import { RSUD_AMI } from '../src/config/constants.js'
import { haversineMeter, periksaLokasi } from '../src/utils/geofencing.js'

function posisi(lat, lng, akurasi = 10) {
  return { coords: { latitude: lat, longitude: lng, accuracy: akurasi } }
}

test('haversineMeter menghitung jarak dasar', () => {
  assert.equal(
    haversineMeter(RSUD_AMI.lat, RSUD_AMI.lng, RSUD_AMI.lat, RSUD_AMI.lng),
    0,
  )
  const jarak = haversineMeter(RSUD_AMI.lat, RSUD_AMI.lng, RSUD_AMI.lat + 0.001, RSUD_AMI.lng)
  assert.ok(jarak > 110 && jarak < 112)
})

test('periksaLokasi menerima posisi di pusat rumah sakit', () => {
  const hasil = periksaLokasi(posisi(RSUD_AMI.lat, RSUD_AMI.lng))
  assert.equal(hasil.valid, true)
  assert.equal(hasil.kode, 'VALID')
  assert.ok(hasil.jarak < 1)
})

test('periksaLokasi menolak lokasi di luar radius 50 meter', () => {
  const hasil = periksaLokasi(posisi(RSUD_AMI.lat + 0.001, RSUD_AMI.lng))
  assert.equal(hasil.valid, false)
  assert.equal(hasil.kode, 'LUAR_RADIUS')
})

test('periksaLokasi menolak Fake GPS dan akurasi tidak wajar', () => {
  assert.equal(
    periksaLokasi({ coords: { ...posisi(RSUD_AMI.lat, RSUD_AMI.lng).coords, isMocked: true } }).kode,
    'MOCK_LOCATION',
  )
  assert.equal(periksaLokasi(posisi(RSUD_AMI.lat, RSUD_AMI.lng, 0)).kode, 'MOCK_LOCATION')
  assert.equal(periksaLokasi(posisi(RSUD_AMI.lat, RSUD_AMI.lng, 60)).kode, 'AKURASI_BURUK')
  assert.equal(periksaLokasi(posisi(RSUD_AMI.lat, RSUD_AMI.lng, null)).kode, 'AKURASI_TIDAK_SAH')
})

test('periksaLokasi menolak data lokasi yang tidak lengkap', () => {
  assert.equal(periksaLokasi(null).kode, 'LOKASI_TIDAK_SAH')
  assert.equal(periksaLokasi({ coords: { latitude: 'x', longitude: 1 } }).kode, 'LOKASI_TIDAK_SAH')
})
