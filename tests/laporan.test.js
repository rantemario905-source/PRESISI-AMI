import test from 'node:test'
import assert from 'node:assert/strict'
import {
  bersihkanAlasanKoreksi,
  kelasStatusLaporan,
  labelShift,
  ringkasKehadiran,
  susunBarisLaporan,
} from '../src/utils/laporan.js'

const JAM_KERJA_NORMAL = {
  global: { 1: false, 2: false, 3: false, 4: false, 5: false, 6: true, 7: true },
  unit: {},
}

const presensiHadir = (tanggal) => ({
  id: `p-${tanggal}`,
  user_id: 'u1',
  tanggal,
  jam_masuk: `${tanggal}T08:00:00+08:00`,
  jam_pulang: null,
  status_kehadiran: 'Hadir',
  menit_terlambat: 0,
})

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

test('kelasStatusLaporan memberi warna untuk semua status dan Libur', () => {
  assert.equal(kelasStatusLaporan('Hadir'), 'status-hadir')
  assert.equal(kelasStatusLaporan('Alfa'), 'status-alfa')
  assert.equal(kelasStatusLaporan('Sakit'), 'status-sakit')
  assert.equal(kelasStatusLaporan('Cuti'), 'status-cuti')
  assert.equal(kelasStatusLaporan('Dinas Luar'), 'status-dinas')
  assert.equal(kelasStatusLaporan('Izin'), 'status-izin')
  assert.equal(kelasStatusLaporan('Koreksi'), 'status-koreksi')
  assert.equal(kelasStatusLaporan('Libur'), 'status-libur')
  assert.equal(kelasStatusLaporan(''), '')
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

test('susunBarisLaporan menampilkan status Izin sebagai presensi nyata', () => {
  const baris = susunBarisLaporan({
    periode: '2026-11',
    presensi: [
      {
        id: 'p-izin',
        user_id: 'u1',
        tanggal: '2026-11-03',
        status_kehadiran: 'Izin',
        menit_terlambat: 0,
      },
    ],
    jamKerja: JAM_KERJA_NORMAL,
    userId: 'u1',
    unitKerja: 'UGD',
    polaKerja: 'reguler',
  })

  const tanggal = baris.find((item) => item.tanggal === '2026-11-03')
  assert.equal(tanggal.libur, false)
  assert.equal(tanggal.baris.status_kehadiran, 'Izin')
})

test('susunBarisLaporan menampilkan semua tanggal dan menandai akhir pekan libur', () => {
  const baris = susunBarisLaporan({
    periode: '2026-11',
    presensi: [presensiHadir('2026-11-02')],
    jamKerja: JAM_KERJA_NORMAL,
    userId: 'u1',
    unitKerja: 'UGD',
    polaKerja: 'reguler',
  })

  assert.equal(baris.length, 30)
  assert.equal(baris[0].tanggal, '2026-11-01')
  assert.equal(baris[0].libur, true)
  assert.equal(baris[0].baris, null)
  assert.equal(baris[1].tanggal, '2026-11-02')
  assert.equal(baris[1].libur, false)
  assert.equal(baris[1].baris.status_kehadiran, 'Hadir')
  assert.equal(baris[5].tanggal, '2026-11-06')
  assert.equal(baris[5].libur, false)
  assert.equal(baris[5].baris, null)
  assert.equal(baris[6].tanggal, '2026-11-07')
  assert.equal(baris[6].libur, true)
})

test('susunBarisLaporan memakai override jam kerja unit', () => {
  const baris = susunBarisLaporan({
    periode: '2026-11',
    jamKerja: {
      global: JAM_KERJA_NORMAL.global,
      unit: { ADMISI: { 6: false } },
    },
    userId: 'u1',
    unitKerja: 'ADMISI',
    polaKerja: 'reguler',
  })

  assert.equal(baris[5].tanggal, '2026-11-06')
  assert.equal(baris[5].libur, false)
  assert.equal(baris[6].tanggal, '2026-11-07')
  assert.equal(baris[6].libur, false)
  assert.equal(baris[0].libur, true)
})

test('susunBarisLaporan menandai hari libur nasional', () => {
  const baris = susunBarisLaporan({
    periode: '2026-11',
    hariLibur: { '2026-11-10': 'Cuti Bersama' },
    jamKerja: JAM_KERJA_NORMAL,
    userId: 'u1',
    unitKerja: 'UGD',
    polaKerja: 'reguler',
  })

  const tanggalLibur = baris.find((item) => item.tanggal === '2026-11-10')
  assert.equal(tanggalLibur.libur, true)
  assert.equal(tanggalLibur.namaLibur, 'Cuti Bersama')
  assert.equal(tanggalLibur.baris, null)
})

test('susunBarisLaporan menampilkan presensi nyata walau hari libur', () => {
  const baris = susunBarisLaporan({
    periode: '2026-11',
    presensi: [presensiHadir('2026-11-08')],
    hariLibur: { '2026-11-08': 'Libur' },
    jamKerja: JAM_KERJA_NORMAL,
    userId: 'u1',
    unitKerja: 'UGD',
    polaKerja: 'reguler',
  })

  const tanggal = baris.find((item) => item.tanggal === '2026-11-08')
  assert.equal(tanggal.libur, false)
  assert.equal(tanggal.baris.status_kehadiran, 'Hadir')
})

test('susunBarisLaporan mengabaikan baris Alfa pada hari libur', () => {
  const baris = susunBarisLaporan({
    periode: '2026-11',
    presensi: [
      {
        id: 'p-alfa',
        user_id: 'u1',
        tanggal: '2026-11-01',
        status_kehadiran: 'Alfa',
        menit_terlambat: 0,
      },
    ],
    jamKerja: JAM_KERJA_NORMAL,
    userId: 'u1',
    unitKerja: 'UGD',
    polaKerja: 'reguler',
  })

  const tanggal = baris.find((item) => item.tanggal === '2026-11-01')
  assert.equal(tanggal.libur, true)
  assert.equal(tanggal.baris, null)
})

test('susunBarisLaporan menandai shift tanpa jadwal sebagai libur', () => {
  const baris = susunBarisLaporan({
    periode: '2026-11',
    jadwal: { 'u2|2026-11-01': 'Pagi' },
    jamKerja: JAM_KERJA_NORMAL,
    userId: 'u2',
    unitKerja: 'UGD',
    polaKerja: 'shift',
  })

  assert.equal(baris[0].tanggal, '2026-11-01')
  assert.equal(baris[0].libur, false)
  assert.equal(baris[0].shift, 'Pagi')
  assert.equal(baris[1].tanggal, '2026-11-02')
  assert.equal(baris[1].libur, true)
  assert.equal(baris[1].shift, null)
})

test('susunBarisLaporan mengembalikan daftar kosong untuk periode tidak valid', () => {
  assert.deepEqual(susunBarisLaporan({ periode: '2026-13' }), [])
  assert.deepEqual(susunBarisLaporan({}), [])
})
