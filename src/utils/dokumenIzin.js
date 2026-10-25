/**
 * Validasi, kompresi, dan penamaan dokumen izin.
 *
 * Aturan:
 * - Hanya JPG/JPEG/PNG.
 * - Hasil akhir maksimal 1 MB; ditargetkan sekitar 900–950 KB.
 * - PDF, HEIC, dan format lain ditolak.
 * - Sisi server tetap memeriksa bucket, MIME, ukuran, dan keberadaan file.
 */

export const MAKS_UKURAN_DOKUMEN = 1048576
export const TARGET_UKURAN_DOKUMEN = 950 * 1024
export const TIPE_DOKUMEN_DIIZINKAN = ['image/jpeg', 'image/jpg', 'image/png']

const EKSTENSI = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
}

export function namaFileAman(nama = 'dokumen') {
  return String(nama)
    .replace(/[^\w.\-() ]+/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120)
}

export function tipeDokumenValid(tipe) {
  return TIPE_DOKUMEN_DIIZINKAN.includes(String(tipe).toLowerCase())
}

/**
 * Menyiapkan file untuk diunggah. File kecil yang sudah valid dipakai apa
 * adanya; file besar dikompres dengan canvas sampai di bawah batas.
 *
 * @param {File} file
 * @returns {Promise<{ file: File, nama: string, tipe: string, ukuran: number }>}
 */
export async function siapkanDokumenIzin(file) {
  if (!(file instanceof File)) {
    throw new Error('Pilih file dokumen terlebih dahulu.')
  }

  const tipeAsli = String(file.type || '').toLowerCase()
  if (!tipeDokumenValid(tipeAsli)) {
    throw new Error('Dokumen harus berupa JPG/JPEG atau PNG. PDF dan HEIC tidak didukung.')
  }
  // Sebagian browser lama memakai MIME nonstandar image/jpg.
  const tipe = tipeAsli === 'image/jpg' ? 'image/jpeg' : tipeAsli
  if (file.size <= 0) {
    throw new Error('File dokumen kosong atau tidak valid.')
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Ukuran file asli terlalu besar. Pilih gambar di bawah 15 MB.')
  }

  if (file.size <= TARGET_UKURAN_DOKUMEN) {
    // File kecil tetap diperiksa agar gambar raksasa (mis. 500 KB tetapi
    // 5000 px) ikut diperkecil sesuai batas sisi terpanjang.
    const dimensi = await dimensiGambar(file)
    if (Math.max(dimensi.lebar, dimensi.tinggi) <= 2000) {
      const fileFinal =
        tipe === file.type
          ? file
          : new File([file], file.name, { type: tipe, lastModified: file.lastModified })
      return {
        file: fileFinal,
        nama: namaFileAman(file.name || `dokumen.${EKSTENSI[tipe] ?? 'jpg'}`),
        tipe,
        ukuran: file.size,
      }
    }
  }

  const blob = await kompresGambar(file)
  if (!blob || blob.size > MAKS_UKURAN_DOKUMEN) {
    throw new Error('Dokumen tetap lebih dari 1 MB setelah dikompres. Pilih gambar lain.')
  }

  const dasar = (file.name || 'dokumen').replace(/\.[^.]+$/, '')
  const nama = `${namaFileAman(dasar)}.jpg`
  return {
    file: new File([blob], nama, { type: 'image/jpeg', lastModified: Date.now() }),
    nama,
    tipe: 'image/jpeg',
    ukuran: blob.size,
  }
}

/** Kompres bertahap: turunkan kualitas lalu dimensi sampai lolos batas. */
async function kompresGambar(file) {
  const gambar = await muatGambar(file)
  const percobaan = [
    [1800, 0.85],
    [1800, 0.72],
    [1600, 0.72],
    [1400, 0.7],
    [1200, 0.68],
    [1000, 0.65],
  ]

  let hasil = null
  for (const [sisiMaks, kualitas] of percobaan) {
    hasil = await gambarKeJpeg(gambar, sisiMaks, kualitas)
    if (hasil && hasil.size <= TARGET_UKURAN_DOKUMEN) break
  }

  if (!hasil || hasil.size > MAKS_UKURAN_DOKUMEN) {
    throw new Error('Gambar tidak dapat dikompres di bawah 1 MB. Pilih gambar lain.')
  }
  return hasil
}

async function dimensiGambar(file) {
  const gambar = await muatGambar(file)
  return {
    lebar: gambar.naturalWidth || gambar.width || 0,
    tinggi: gambar.naturalHeight || gambar.height || 0,
  }
}

function muatGambar(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const gambar = new Image()
    gambar.onload = () => {
      URL.revokeObjectURL(url)
      resolve(gambar)
    }
    gambar.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('File gambar tidak dapat dibaca. Coba JPG/PNG lain.'))
    }
    gambar.src = url
  })
}

function gambarKeJpeg(gambar, sisiMaks, kualitas) {
  return new Promise((resolve, reject) => {
    const sisiTerpanjang = Math.max(gambar.naturalWidth || gambar.width, gambar.naturalHeight || gambar.height)
    const rasio = sisiTerpanjang > sisiMaks ? sisiMaks / sisiTerpanjang : 1
    const lebar = Math.max(1, Math.round((gambar.naturalWidth || gambar.width) * rasio))
    const tinggi = Math.max(1, Math.round((gambar.naturalHeight || gambar.height) * rasio))

    const kanvas = document.createElement('canvas')
    kanvas.width = lebar
    kanvas.height = tinggi
    const konteks = kanvas.getContext('2d')
    if (!konteks) {
      reject(new Error('Browser tidak mendukung pemrosesan gambar.'))
      return
    }

    // Latar putih agar PNG transparan tidak menjadi hitam saat diubah ke JPEG.
    konteks.fillStyle = '#ffffff'
    konteks.fillRect(0, 0, lebar, tinggi)
    konteks.drawImage(gambar, 0, 0, lebar, tinggi)

    kanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Gagal mengompres gambar.'))
      },
      'image/jpeg',
      kualitas,
    )
  })
}

/** UUID v4 untuk grup, dengan fallback browser lama. */
export function buatIdGrup() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()

  const byte = new Uint8Array(16)
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(byte)
  } else {
    for (let i = 0; i < byte.length; i += 1) byte[i] = Math.floor(Math.random() * 256)
  }
  byte[6] = (byte[6] & 0x0f) | 0x40
  byte[8] = (byte[8] & 0x3f) | 0x80
  const hex = [...byte].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}
