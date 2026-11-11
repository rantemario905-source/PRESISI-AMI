import test from 'node:test'
import assert from 'node:assert/strict'
import {
  jenisUntukKategori,
  kelompokkanIzin,
  ringkasanStatus,
  statusTanpaAbsen,
} from '../src/utils/izin.js'

test('kelompokkanIzin menyatukan baris dengan grup_id yang sama', () => {
  const hasil = kelompokkanIzin([
    {
      id: 'a',
      grup_id: 'g-1',
      user_id: 'u-2',
      status: 'menunggu',
      dibuat_pada: '2026-10-30T08:00:00Z',
      pegawai: { id: 'u-2', nama: 'Budi' },
    },
    {
      id: 'b',
      grup_id: 'g-1',
      user_id: 'u-1',
      status: 'menunggu',
      dibuat_pada: '2026-10-30T09:00:00Z',
      pegawai: { id: 'u-1', nama: 'Ani' },
    },
  ])

  assert.equal(hasil.length, 1)
  assert.equal(hasil[0].grup_id, 'g-1')
  assert.equal(hasil[0].jumlah_anggota, 2)
  assert.deepEqual(hasil[0].pegawai_ids, ['u-2', 'u-1'])
  assert.deepEqual(
    hasil[0].anggota.map((anggota) => anggota.nama),
    ['Ani', 'Budi'],
  )
  assert.equal(hasil[0].dibuat_pada, '2026-10-30T09:00:00Z')
})

test('kelompokkanIzin memakai id bila grup_id tidak ada', () => {
  const hasil = kelompokkanIzin([
    { id: 'x', user_id: 'u-1', nama_pegawai: 'Ani' },
    { id: 'x', user_id: 'u-1', nama_pegawai: 'Ani' },
  ])

  assert.equal(hasil.length, 1)
  assert.equal(hasil[0].jumlah_anggota, 1)
  assert.deepEqual(hasil[0].anggota, [{ id: 'u-1', nama: 'Ani' }])
})

test('jenisUntukKategori memisahkan Izin dari Cuti dan Dinas & Sakit', () => {
  assert.deepEqual(jenisUntukKategori('izin'), ['Izin'])
  assert.deepEqual(jenisUntukKategori('cuti'), ['Cuti'])
  assert.deepEqual(jenisUntukKategori('dinas-sakit'), ['Sakit', 'Dinas Luar'])
})

test('ringkasanStatus menghitung status yang dikenal saja', () => {
  const hasil = ringkasanStatus([
    { status: 'menunggu' },
    { status: 'disetujui' },
    { status: 'disetujui' },
    { status: 'ditolak' },
    { status: 'dibatalkan' },
    { status: 'lainnya' },
  ])

  assert.deepEqual(hasil, {
    menunggu: 1,
    disetujui: 2,
    ditolak: 1,
    dibatalkan: 1,
  })
})

test('statusTanpaAbsen mengenali Sakit, Cuti, Dinas Luar, dan Izin', () => {
  for (const status of ['Sakit', 'Cuti', 'Dinas Luar', 'Izin']) {
    assert.equal(statusTanpaAbsen({ status_kehadiran: status, jam_masuk: null }), status)
  }
})

test('statusTanpaAbsen mengabaikan status yang sudah punya jam masuk', () => {
  assert.equal(
    statusTanpaAbsen({
      status_kehadiran: 'Sakit',
      jam_masuk: '2026-11-06T00:30:00+08:00',
    }),
    null,
  )
})

test('statusTanpaAbsen tidak menganggap Hadir atau Alfa sebagai izin', () => {
  assert.equal(statusTanpaAbsen({ status_kehadiran: 'Hadir' }), null)
  assert.equal(statusTanpaAbsen({ status_kehadiran: 'Alfa' }), null)
  assert.equal(statusTanpaAbsen(null), null)
})
