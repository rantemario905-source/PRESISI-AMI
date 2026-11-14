import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { RSUD_AMI, MAX_RADIUS_METERS } from '../src/config/constants.js'
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

test('periksaLokasi menolak lokasi di luar radius 120 meter', () => {
  const hasil = periksaLokasi(posisi(RSUD_AMI.lat + 0.0011, RSUD_AMI.lng))
  assert.equal(hasil.valid, false)
  assert.equal(hasil.kode, 'LUAR_RADIUS')
})

test('periksaLokasi menerima lokasi ±95 meter (kasus kantor belakang)', () => {
  const hasil = periksaLokasi(posisi(RSUD_AMI.lat + 0.00085, RSUD_AMI.lng))
  assert.equal(hasil.valid, true)
  assert.equal(hasil.kode, 'VALID')
  assert.ok(hasil.jarak > 90 && hasil.jarak < 100)
})

test('batas 120 meter: 119 m diterima, 121 m ditolak', () => {
  assert.equal(periksaLokasi(posisi(RSUD_AMI.lat + 0.00107, RSUD_AMI.lng)).kode, 'VALID')
  assert.equal(periksaLokasi(posisi(RSUD_AMI.lat + 0.00109, RSUD_AMI.lng)).kode, 'LUAR_RADIUS')
})

test('periksaLokasi mengizinkan luar radius untuk pegawai dengan pengecualian', () => {
  const hasil = periksaLokasi(posisi(RSUD_AMI.lat + 0.002, RSUD_AMI.lng), {
    abaikanRadius: true,
  })
  assert.equal(hasil.valid, true)
  assert.equal(hasil.kode, 'VALID_LUAR_RADIUS')
  assert.ok(hasil.jarak > 200)
})

test('pengecualian radius tidak mematikan deteksi Fake GPS', () => {
  assert.equal(
    periksaLokasi(
      { coords: { ...posisi(RSUD_AMI.lat + 0.001, RSUD_AMI.lng).coords, isMocked: true } },
      { abaikanRadius: true },
    ).kode,
    'MOCK_LOCATION',
  )
  assert.equal(
    periksaLokasi(posisi(RSUD_AMI.lat + 0.001, RSUD_AMI.lng, 60), {
      abaikanRadius: true,
    }).kode,
    'AKURASI_BURUK',
  )
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

test('radius klien dan server sama-sama 120 meter', () => {
  assert.equal(MAX_RADIUS_METERS, 120)

  const baca = (p) => readFileSync(new URL(`../supabase/${p}`, import.meta.url), 'utf8')
  const migrasi = baca('migrations/44_radius_120_meter.sql')
  const schema = baca('schema.sql')

  const awalMigrasi = migrasi.indexOf('create or replace function public.submit_presensi(')
  assert.ok(awalMigrasi >= 0, 'submit_presensi tidak ditemukan di migrasi 44')
  assert.match(migrasi.slice(awalMigrasi), /v_jarak > 120/)
  assert.doesNotMatch(migrasi.slice(awalMigrasi), /v_jarak > 80/)

  const akhirSchema = schema.lastIndexOf('create or replace function public.submit_presensi(')
  assert.ok(akhirSchema >= 0, 'submit_presensi tidak ditemukan di schema.sql')
  assert.match(schema.slice(akhirSchema), /v_jarak > 120/)
  assert.doesNotMatch(schema.slice(akhirSchema), /v_jarak > 80|v_jarak > 50/)
})
