import test from 'node:test'
import assert from 'node:assert/strict'
import {
  keteranganPresensi,
  ringkasKehadiran,
  labelShift,
  ringkasTukar,
} from '../src/utils/laporan.js'

test('labelShift menyusun nama dan jam shift', () => {
  assert.equal(
    labelShift({ nama_shift: 'Pagi', jam_mulai: '07:30:00', jam_selesai: '14:30:00' }),
    'Pagi 07:30–14:30',
  )
  assert.equal(labelShift({ nama_shift: 'Siang' }), 'Siang')
  assert.equal(labelShift(null), '—')
})

test('ringkasTukar membaca sudut pandang pegawai', () => {
  const tukar = [
    {
      id: 't1',
      tanggal: '2026-11-05',
      pegawai_a: 'a',
      pegawai_b: 'b',
      alasan: 'keluarga',
      orang_a: { nama: 'Andi' },
      orang_b: { nama: 'Budi' },
      pencatat: { nama: 'Kepala' },
      sa_lama: { nama_shift: 'Pagi' },
      sb_lama: { nama_shift: 'Malam' },
      sa_baru: { nama_shift: 'Malam' },
      sb_baru: { nama_shift: 'Pagi' },
    },
  ]

  const sudutA = ringkasTukar(tukar, 'a')
  assert.equal(sudutA.length, 1)
  assert.equal(sudutA[0].rekan, 'Budi')
  assert.equal(sudutA[0].asal, 'Pagi')
  assert.equal(sudutA[0].baru, 'Malam')

  const sudutB = ringkasTukar(tukar, 'b')
  assert.equal(sudutB[0].rekan, 'Andi')
  assert.equal(sudutB[0].asal, 'Malam')
  assert.equal(sudutB[0].baru, 'Pagi')

  assert.deepEqual(ringkasTukar(tukar, 'c'), [])
})

test('keteranganPresensi memprioritaskan alasan koreksi', () => {
  assert.equal(
    keteranganPresensi({
      status_kehadiran: 'Koreksi',
      alasan_koreksi: 'Lupa absen pulang karena pergantian shift.',
    }),
    'Lupa absen pulang karena pergantian shift.',
  )
  assert.equal(
    keteranganPresensi({
      status_kehadiran: 'Hadir',
      alasan_koreksi: 'Pengaduan disetujui oleh Kepala Unit: lupa absen masuk.',
    }),
    'Pengaduan disetujui oleh Kepala Unit: lupa absen masuk.',
  )
})

test('keteranganPresensi memakai alasan izin, Alfa, tukar, dan fallback', () => {
  assert.equal(
    keteranganPresensi(
      { user_id: 'u1', tanggal: '2026-11-04', status_kehadiran: 'Sakit' },
      { alasanIzin: { 'u1|2026-11-04': 'Demam' } },
    ),
    'Demam',
  )
  assert.equal(keteranganPresensi({ status_kehadiran: 'Alfa' }), 'Alfa')
  assert.equal(
    keteranganPresensi(
      { tanggal: '2026-11-05', status_kehadiran: 'Hadir' },
      { rekanTukar: new Map([['2026-11-05', 'Budi']]) },
    ),
    'Tukar dengan Budi',
  )
  assert.equal(keteranganPresensi({ status_kehadiran: 'Hadir' }), '—')
  assert.equal(
    keteranganPresensi({ status_kehadiran: 'Koreksi', alasan_koreksi: '   ' }),
    '—',
  )
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
