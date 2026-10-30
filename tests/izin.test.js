import test from 'node:test'
import assert from 'node:assert/strict'
import { kelompokkanIzin, ringkasanStatus } from '../src/utils/izin.js'

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
