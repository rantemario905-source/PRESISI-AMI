/**
 * ==========================================================================
 * Service: Pengaduan Presensi (absen pulang terlewat)
 * --------------------------------------------------------------------------
 * Pengajuan, persetujuan kepala unit, dan riwayat semuanya lewat RPC
 * SECURITY DEFINER. Penulisan langsung ke tabel tidak tersedia bagi klien.
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'
import {
  MAKS_UKURAN_DOKUMEN,
  buatIdGrup,
  siapkanDokumenIzin,
} from '../utils/dokumenIzin.js'
import { hariIni } from '../utils/format.js'
import { batasAwalPengaduan } from '../utils/pengaduan.js'

const BUCKET = 'dokumen-izin'

/** Presensi milik pegawai yang masih bisa diadukan. */
export async function ambilPresensiBisaDiadukan(userId) {
  const batas = batasAwalPengaduan(hariIni())
  if (!userId || !batas) return []

  const { data, error } = await supabase
    .from('presensi')
    .select('id, user_id, tanggal, jam_masuk, jam_pulang, status_kehadiran')
    .eq('user_id', userId)
    .is('jam_pulang', null)
    .not('jam_masuk', 'is', null)
    .in('status_kehadiran', ['Hadir', 'Koreksi'])
    .gte('tanggal', batas)
    .lte('tanggal', hariIni())
    .order('tanggal', { ascending: false })

  if (error) throw error

  const { data: menunggu, error: galatMenunggu } = await supabase
    .from('pengaduan_presensi')
    .select('presensi_id')
    .eq('user_id', userId)
    .eq('status', 'menunggu')

  if (galatMenunggu) throw galatMenunggu

  const setMenunggu = new Set((menunggu ?? []).map((baris) => baris.presensi_id))
  return (data ?? []).map((baris) => ({
    ...baris,
    pengaduanMenunggu: setMenunggu.has(baris.id),
  }))
}

/** Riwayat pengaduan milik pegawai yang sedang login. */
export async function ambilPengaduanSaya() {
  const { data, error } = await supabase.rpc('daftar_pengaduan_presensi', {
    p_saya: true,
  })
  if (error) throw error
  return Array.isArray(data) ? data : []
}

/** Daftar pengaduan sesuai peran (kepala unit / Super Admin). */
export async function ambilDaftarPengaduan({ unit = 'semua', status = 'semua' } = {}) {
  const { data, error } = await supabase.rpc('daftar_pengaduan_presensi', {
    p_unit: unit,
    p_status: status,
  })
  if (error) throw error
  return Array.isArray(data) ? data : []
}

/** Kirim pengaduan (foto wajib sudah diunggah lebih dulu). */
export async function ajukanPengaduan({
  presensiId,
  jamPulang,
  alasan,
  dokumenPath,
}) {
  const { data, error } = await supabase.rpc('ajukan_pengaduan_presensi', {
    p_presensi_id: presensiId,
    p_jam_pulang: jamPulang,
    p_alasan: alasan,
    p_dokumen_path: dokumenPath,
  })
  if (error) throw error
  return data
}

/** Keputusan kepala unit: setujui atau tolak pengaduan. */
export async function putuskanPengaduan({
  id,
  setuju,
  jamPulang = null,
  catatan = null,
}) {
  const { data, error } = await supabase.rpc('putuskan_pengaduan_presensi', {
    p_id: id,
    p_setuju: setuju,
    p_jam_pulang: jamPulang,
    p_catatan: catatan,
  })
  if (error) throw error
  return data
}

/** Unggah foto bukti ke bucket privat dengan prefix pengaduan/<user_id>/. */
export async function unggahDokumenPengaduan({ userId, file }) {
  if (!userId) throw new Error('Akun pengguna tidak ditemukan.')
  if (!file) throw new Error('Foto bukti wajib dipilih.')

  const siap = await siapkanDokumenIzin(file)
  if (siap.ukuran > MAKS_UKURAN_DOKUMEN) {
    throw new Error('Ukuran foto bukti maksimal 1 MB.')
  }

  const ekstensi = siap.tipe === 'image/png' ? 'png' : 'jpg'
  const path = `pengaduan/${userId}/${buatIdGrup()}.${ekstensi}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, siap.file, {
    contentType: siap.tipe,
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw error
  return { path, nama: siap.nama, tipe: siap.tipe, ukuran: siap.ukuran }
}

/** Hapus foto best-effort bila penyimpanan pengaduan gagal. */
export async function hapusDokumenPengaduan(path) {
  if (!path) return
  const { error } = await supabase.storage.from(BUCKET).remove([path])
  if (error) console.warn('Gagal menghapus foto pengaduan:', error.message)
}

/** URL bertanda tangan untuk melihat foto pengaduan. */
export async function ambilDokumenPengaduanUrl(path, detik = 3600) {
  if (!path) return null
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, detik)
  if (error) throw error
  return data?.signedUrl ?? null
}
