export const UKURAN_HALAMAN = 500

const BATAS_HALAMAN = 200

export async function ambilSemuaHalaman(buatKueri, ukuran = UKURAN_HALAMAN) {
  const semua = []
  let dari = 0

  for (let halaman = 0; halaman < BATAS_HALAMAN; halaman += 1) {
    const { data, error } = await buatKueri().range(dari, dari + ukuran - 1)
    if (error) throw error

    const isi = data ?? []
    if (!isi.length) return semua

    semua.push(...isi)
    dari += isi.length
  }

  throw new Error('Data terlalu banyak untuk dimuat sekaligus.')
}
