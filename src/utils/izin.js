/**
 * Utilitas bersama untuk pengajuan Dinas & Sakit / Cuti.
 *
 * Satu grup Dinas Luar terdiri dari beberapa baris izin_cuti dengan grup_id
 * yang sama. Helper di sini menyatukan baris-baris tersebut agar UI tidak
 * menampilkan satu pegawai per baris.
 */

export const JENIS_DINAS_SAKIT = ['Sakit', 'Dinas Luar']
export const JENIS_CUTI = ['Cuti']

export const KATEGORI = {
  'dinas-sakit': {
    label: 'Dinas & Sakit',
    judul: 'Dinas & Sakit',
    jenis: JENIS_DINAS_SAKIT,
  },
  cuti: {
    label: 'Cuti',
    judul: 'Cuti',
    jenis: JENIS_CUTI,
  },
}

export function jenisUntukKategori(kategori) {
  return KATEGORI[kategori]?.jenis ?? [...JENIS_DINAS_SAKIT, ...JENIS_CUTI]
}

export function labelJenis(jenis) {
  if (jenis === 'Dinas Luar') return 'Dinas Luar'
  return jenis
}

/**
 * Mengubah baris izin_cuti menjadi daftar grup.
 * Baris pertama grup dipakai sebagai data utama; seluruh pegawai
 * dikumpulkan pada properti `anggota`.
 *
 * @param {Array<object>} baris
 * @returns {Array<object>}
 */
export function kelompokkanIzin(baris = []) {
  const peta = new Map()

  for (const item of baris) {
    const kunci = item.grup_id ?? item.id
    let grup = peta.get(kunci)

    if (!grup) {
      grup = {
        ...item,
        id: item.id,
        grup_id: kunci,
        anggota: [],
        jumlah_anggota: 0,
        pegawai_ids: [],
      }
      peta.set(kunci, grup)
    }

    if (item.user_id && !grup.pegawai_ids.includes(item.user_id)) {
      grup.pegawai_ids.push(item.user_id)
      grup.anggota.push(item.pegawai ?? { id: item.user_id, nama: item.nama_pegawai })
    }

    // Urutan tampilan: grup terbaru lebih dulu.
    if (item.dibuat_pada && (!grup.dibuat_pada || item.dibuat_pada > grup.dibuat_pada)) {
      grup.dibuat_pada = item.dibuat_pada
    }
  }

  return [...peta.values()]
    .map((grup) => ({
      ...grup,
      jumlah_anggota: grup.anggota.length,
      anggota: grup.anggota.sort((a, b) =>
        String(a?.nama ?? '').localeCompare(String(b?.nama ?? ''), 'id'),
      ),
    }))
    .sort((a, b) => String(b.dibuat_pada ?? '').localeCompare(String(a.dibuat_pada ?? '')))
}

/** Rangkuman jumlah pengajuan per status untuk kartu statistik. */
export function ringkasanStatus(grup = []) {
  const hasil = { menunggu: 0, disetujui: 0, ditolak: 0, dibatalkan: 0 }
  for (const item of grup) {
    if (hasil[item.status] !== undefined) hasil[item.status] += 1
  }
  return hasil
}
