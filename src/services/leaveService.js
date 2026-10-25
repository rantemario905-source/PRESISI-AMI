/**
 * ==========================================================================
 * Service: Dinas & Sakit / Cuti
 * --------------------------------------------------------------------------
 * Semua penulisan melalui RPC SECURITY DEFINER:
 *   - catat_izin_grup
 *   - ubah_izin_grup
 *   - putuskan_izin_grup
 *   - batalkan_izin_grup
 *
 * Tidak ada insert/update langsung ke tabel izin_cuti. Pembatasan unit kerja
 * kepala ruangan, validasi dokumen, dan penandaan presensi dilakukan di server.
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'
import { kelompokkanIzin, jenisUntukKategori } from '../utils/izin.js'
import { MAKS_UKURAN_DOKUMEN, buatIdGrup } from '../utils/dokumenIzin.js'

const BUCKET = 'dokumen-izin'
const KOLOM_IZIN =
  'id, grup_id, user_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status, ' +
  'dokumen_path, dokumen_nama, dokumen_tipe, dokumen_ukuran, catatan_admin, ' +
  'alasan_pembatalan, dibuat_oleh, dibuat_pada, disetujui_pada, ' +
  'pegawai:pegawai!izin_cuti_user_id_fkey ( id, nama, unit_kerja )'

/**
 * Daftar pengajuan yang sudah dikelompokkan per grup Dinas.
 *
 * @param {{ kategori?: 'dinas-sakit'|'cuti'|'semua', status?: 'semua'|'menunggu'|'disetujui'|'ditolak'|'dibatalkan' }} opsi
 * @returns {Promise<Array<object>>}
 */
export async function ambilDaftarIzin({ kategori = 'semua', status = 'semua' } = {}) {
  let kueri = supabase
    .from('izin_cuti')
    .select(KOLOM_IZIN)
    .order('dibuat_pada', { ascending: false })

  const jenis = jenisUntukKategori(kategori)
  if (kategori !== 'semua') kueri = kueri.in('jenis', jenis)
  if (status !== 'semua') kueri = kueri.eq('status', status)

  const { data, error } = await kueri
  if (error) throw error
  return kelompokkanIzin(data ?? [])
}

/**
 * Unggah dokumen ke bucket privat. Path selalu diawali grup_id agar RPC dapat
 * memverifikasi bahwa file memang milik grup tersebut.
 *
 * @param {{ grupId: string, file: File }} params
 */
export async function unggahDokumenIzin({ grupId, file }) {
  if (!grupId) throw new Error('ID grup tidak tersedia.')
  if (!file) throw new Error('File dokumen belum dipilih.')

  const tipeMentah = String(file.type || '').toLowerCase()
  const tipe = tipeMentah === 'image/jpg' ? 'image/jpeg' : tipeMentah
  if (!['image/jpeg', 'image/png'].includes(tipe)) {
    throw new Error('Dokumen harus berupa JPG/JPEG atau PNG.')
  }
  if (file.size > MAKS_UKURAN_DOKUMEN) {
    throw new Error('Ukuran dokumen maksimal 1 MB.')
  }

  const ekstensi = tipe === 'image/png' ? 'png' : 'jpg'
  const path = `${grupId}/${buatIdGrup()}.${ekstensi}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: tipe,
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error

  return {
    path,
    nama: file.name,
    tipe,
    ukuran: file.size,
  }
}

/** Hapus file best-effort (mis. upload berhasil tetapi penyimpanan DB gagal). */
export async function hapusDokumenIzin(path) {
  if (!path) return
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) {
    // Jangan menggagalkan alur utama; file yatim dapat dibersihkan Admin IT.
    console.warn('Gagal menghapus dokumen izin:', error.message)
  }
}

/** URL bertanda tangan untuk melihat dokumen privat. */
export async function ambilDokumenUrl(path, detik = 3600) {
  if (!path) return null
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, detik)
  if (error) throw error
  return data?.signedUrl ?? null
}

/**
 * Catat pengajuan baru (status menunggu).
 *
 * @param {{ grupId: string, jenis: string, userIds: string[], tanggalMulai: string, tanggalSelesai: string, keterangan?: string, dokumen?: { path: string, nama: string, tipe: string, ukuran: number }|null }} params
 */
export async function catatIzinGrup({
  grupId,
  jenis,
  userIds,
  tanggalMulai,
  tanggalSelesai,
  keterangan = '',
  dokumen = null,
}) {
  const { data, error } = await supabase.rpc('catat_izin_grup', {
    p_grup_id: grupId,
    p_jenis: jenis,
    p_user_ids: userIds,
    p_tanggal_mulai: tanggalMulai,
    p_tanggal_selesai: tanggalSelesai,
    p_keterangan: keterangan || null,
    p_dokumen_path: dokumen?.path ?? null,
    p_dokumen_nama: dokumen?.nama ?? null,
    p_dokumen_tipe: dokumen?.tipe ?? null,
    p_dokumen_ukuran: dokumen?.ukuran ?? null,
  })
  if (error) throw error
  return data
}

/**
 * Ubah pengajuan selama masih menunggu.
 * `dokumen` null berarti pertahankan dokumen lama (khusus edit).
 */
export async function ubahIzinGrup({
  grupId,
  jenis,
  userIds,
  tanggalMulai,
  tanggalSelesai,
  keterangan = '',
  dokumen = null,
}) {
  const { data, error } = await supabase.rpc('ubah_izin_grup', {
    p_grup_id: grupId,
    p_jenis: jenis,
    p_user_ids: userIds,
    p_tanggal_mulai: tanggalMulai,
    p_tanggal_selesai: tanggalSelesai,
    p_keterangan: keterangan || null,
    p_dokumen_path: dokumen?.path ?? null,
    p_dokumen_nama: dokumen?.nama ?? null,
    p_dokumen_tipe: dokumen?.tipe ?? null,
    p_dokumen_ukuran: dokumen?.ukuran ?? null,
  })
  if (error) throw error
  return data
}

/** Setujui / tolak seluruh anggota grup (khusus Super Admin). */
export async function putuskanIzinGrup({ grupId, status, catatan = '' }) {
  const { data, error } = await supabase.rpc('putuskan_izin_grup', {
    p_grup_id: grupId,
    p_status: status,
    p_catatan: catatan || null,
  })
  if (error) throw error
  return data
}

/** Batalkan pengajuan (soft-delete) sesuai kewenangan di server. */
export async function batalkanIzinGrup({ grupId, alasan = '' }) {
  const { data, error } = await supabase.rpc('batalkan_izin_grup', {
    p_grup_id: grupId,
    p_alasan: alasan || null,
  })
  if (error) throw error
  return data
}
