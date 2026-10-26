/**
 * ==========================================================================
 * Service: Pengelolaan Perangkat (Device Binding)
 * --------------------------------------------------------------------------
 * Status perangkat diambil dari perangkat aktif milik user:
 *   - 'belum_terdaftar'        : belum ada perangkat aktif dan token ini baru
 *   - 'pending'                : token ini menunggu persetujuan Admin IT
 *   - 'approved'               : token ini perangkat resmi
 *   - 'rejected'               : token ini pernah ditolak, boleh diajukan ulang
 *   - 'terikat_perangkat_lain' : akun sudah punya perangkat approved lain
 *   - 'pending_perangkat_lain' : pengajuan perangkat lain sedang menunggu
 *
 * Aturan: satu pegawai hanya boleh memiliki satu perangkat aktif
 * (pending/approved). Perangkat lain harus direset Admin IT.
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

const PESAN_TERIKAT =
  'Akun ini sudah terikat pada perangkat lain. Hubungi Admin IT untuk reset perangkat.'

function galatPerangkat(error) {
  if (error?.code === '23505') {
    return new Error(PESAN_TERIKAT)
  }
  return error
}

/** Ambil status perangkat milik user untuk device_token tertentu */
export async function ambilStatusPerangkat(userId, deviceToken) {
  const { data: aktif, error: galatAktif } = await supabase
    .from('perangkat')
    .select(
      'id, device_token, status, diajukan_pada, disetujui_pada, catatan, info_perangkat',
    )
    .eq('user_id', userId)
    .in('status', ['approved', 'pending'])
    .order('diajukan_pada', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (galatAktif) throw galatAktif

  if (aktif) {
    if (aktif.device_token === deviceToken) {
      return { status: aktif.status, data: aktif }
    }
    return {
      status:
        aktif.status === 'approved'
          ? 'terikat_perangkat_lain'
          : 'pending_perangkat_lain',
      data: aktif,
    }
  }

  const { data: milikToken, error: galatToken } = await supabase
    .from('perangkat')
    .select(
      'id, device_token, status, diajukan_pada, disetujui_pada, catatan, info_perangkat',
    )
    .eq('user_id', userId)
    .eq('device_token', deviceToken)
    .maybeSingle()

  if (galatToken) throw galatToken

  if (milikToken?.status === 'rejected') {
    return { status: 'rejected', data: milikToken }
  }

  return { status: 'belum_terdaftar', data: null }
}

/**
 * Ajukan verifikasi perangkat (menyimpan token dengan status pending).
 * Ditolak bila user sudah memiliki perangkat aktif lain.
 */
export async function ajukanVerifikasiPerangkat({ userId, deviceToken, infoPerangkat }) {
  const statusAktif = await ambilStatusPerangkat(userId, deviceToken)

  if (
    statusAktif.status === 'terikat_perangkat_lain' ||
    statusAktif.status === 'pending_perangkat_lain'
  ) {
    throw new Error(PESAN_TERIKAT)
  }

  const { data, error } = await supabase
    .from('perangkat')
    .upsert(
      {
        user_id: userId,
        device_token: deviceToken,
        info_perangkat: infoPerangkat,
        status: 'pending',
        diajukan_pada: new Date().toISOString(),
        disetujui_pada: null,
        disetujui_oleh: null,
        catatan: null,
      },
      { onConflict: 'user_id,device_token' },
    )
    .select('id, status, diajukan_pada')
    .single()

  if (error) throw galatPerangkat(error)
  return data
}

/** Daftar riwayat perangkat milik user (untuk riwayat audit perangkat) */
export async function ambilRiwayatPerangkat(userId) {
  const { data, error } = await supabase
    .from('perangkat')
    .select('id, device_token, status, diajukan_pada, disetujui_pada, info_perangkat')
    .eq('user_id', userId)
    .order('diajukan_pada', { ascending: false })

  if (error) throw error
  return data ?? []
}
