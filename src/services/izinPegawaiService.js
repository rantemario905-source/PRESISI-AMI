/**
 * ==========================================================================
 * Service: Riwayat Dinas & Sakit / Cuti milik pegawai
 * --------------------------------------------------------------------------
 * Halaman pegawai bersifat READ-ONLY. Pegawai tidak dapat mengajukan,
 * mengubah, atau menghapus pengajuan. Pencatatan dilakukan oleh kepala
 * ruangan atau Super Admin; persetujuan oleh Super Admin.
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'
import { kelompokkanIzin } from '../utils/izin.js'

const KOLOM =
  'id, grup_id, user_id, jenis, tanggal_mulai, tanggal_selesai, alasan, status, ' +
  'dokumen_path, dokumen_nama, dokumen_tipe, dokumen_ukuran, catatan_admin, ' +
  'alasan_pembatalan, dibuat_pada, disetujui_pada'

/** Riwayat pengajuan milik pegawai, dikelompokkan per grup Dinas. */
export async function ambilIzinSaya(userId) {
  if (!userId) return []

  const { data, error } = await supabase
    .from('izin_cuti')
    .select(KOLOM)
    .eq('user_id', userId)
    .order('dibuat_pada', { ascending: false })

  if (error) throw error
  return kelompokkanIzin(data ?? [])
}
