import test from 'node:test'
import assert from 'node:assert/strict'
import { ambilSemuaHalaman } from '../src/utils/paginasi.js'

function buatData(jumlah) {
  return Array.from({ length: jumlah }, (_, i) => ({ id: i + 1 }))
}

function buatKueriPalsu(data, batasServer) {
  let panggilan = 0

  return {
    jumlahPanggilan: () => panggilan,
    buat: () => ({
      range(dari, sampai) {
        panggilan += 1
        const akhir = Math.min(sampai + 1, dari + batasServer, data.length)
        return Promise.resolve({ data: data.slice(dari, akhir), error: null })
      },
    }),
  }
}

test('paginasi membaca seluruh data melewati batas 1000 baris', async () => {
  const data = buatData(1064)
  const palsu = buatKueriPalsu(data, 500)

  const hasil = await ambilSemuaHalaman(palsu.buat)

  assert.equal(hasil.length, 1064)
  assert.equal(palsu.jumlahPanggilan(), 4)
  assert.deepEqual(hasil[0], { id: 1 })
  assert.deepEqual(hasil[1063], { id: 1064 })
})

test('paginasi tetap benar bila server membatasi lebih kecil dari ukuran halaman', async () => {
  const data = buatData(1064)
  const palsu = buatKueriPalsu(data, 300)

  const hasil = await ambilSemuaHalaman(palsu.buat, 500)

  assert.equal(hasil.length, 1064)
  assert.equal(palsu.jumlahPanggilan(), 5)
})

test('paginasi berhenti pada halaman kosong', async () => {
  const palsu = buatKueriPalsu([], 500)

  const hasil = await ambilSemuaHalaman(palsu.buat)

  assert.deepEqual(hasil, [])
  assert.equal(palsu.jumlahPanggilan(), 1)
})

test('paginasi meneruskan error Supabase', async () => {
  await assert.rejects(
    () =>
      ambilSemuaHalaman(() => ({
        range: () =>
          Promise.resolve({ data: null, error: new Error('gagal membaca') }),
      })),
    /gagal membaca/,
  )
})
