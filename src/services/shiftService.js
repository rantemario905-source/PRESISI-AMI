/**
 * ==========================================================================
 * Service: Master Shift & Jadwal Shift
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'
import { daftarTanggal } from '../utils/format.js'
import { ambilSemuaHalaman } from '../utils/paginasi.js'

/* ------------------------------- Master -------------------------------- */

export async function ambilMasterShift() {
  const { data, error } = await supabase
    .from('shift_master')
    .select('id, nama_shift, jam_mulai, jam_selesai')
    .order('jam_mulai')

  if (error) throw error
  return data ?? []
}

export async function simpanMasterShift({ id, nama_shift, jam_mulai, jam_selesai }) {
  const baris = { nama_shift: nama_shift.trim(), jam_mulai, jam_selesai }

  const { error } = id
    ? await supabase.from('shift_master').update(baris).eq('id', id)
    : await supabase.from('shift_master').insert(baris)

  if (error) throw error
}

export async function hapusMasterShift(id) {
  const { error } = await supabase.from('shift_master').delete().eq('id', id)
  if (error) throw error
}

/* ------------------------------- Jadwal -------------------------------- */

/** Jadwal shift pada rentang tanggal (inklusif), lengkap dengan nama shift & pegawai */
export async function ambilJadwalRentang(mulai, selesai, { userIds } = {}) {
  if (Array.isArray(userIds) && userIds.length === 0) return []

  const buatKueri = () => {
    let kueri = supabase
      .from('jadwal_shift')
      .select(
        'id, user_id, tanggal, shift_id, shift_master ( id, nama_shift, jam_mulai, jam_selesai ), pegawai:pegawai!jadwal_shift_user_id_fkey ( nama, unit_kerja )',
      )
      .gte('tanggal', mulai)
      .lte('tanggal', selesai)

    if (userIds?.length) kueri = kueri.in('user_id', userIds)

    return kueri
      .order('tanggal', { ascending: true })
      .order('user_id', { ascending: true })
  }

  return ambilSemuaHalaman(buatKueri)
}

/**
 * Simpan jadwal untuk banyak pegawai & banyak tanggal sekaligus.
 * @param {{ userIds: string[], shiftId: string, mulai: string, selesai: string }} params
 * @returns {Promise<number>} jumlah baris jadwal yang ditulis
 */
export async function simpanJadwalMassal({ userIds, shiftId, mulai, selesai }) {
  const tanggal = daftarTanggal(mulai, selesai)
  if (!userIds?.length) throw new Error('Pilih minimal satu pegawai.')
  if (!tanggal.length) throw new Error('Rentang tanggal tidak valid.')

  const baris = userIds.flatMap((userId) =>
    tanggal.map((tgl) => ({ user_id: userId, tanggal: tgl, shift_id: shiftId })),
  )

  const { error } = await supabase
    .from('jadwal_shift')
    .upsert(baris, { onConflict: 'user_id,tanggal' })

  if (error) throw error
  return baris.length
}

export async function hapusJadwal(id) {
  const { error } = await supabase.from('jadwal_shift').delete().eq('id', id)
  if (error) throw error
}

/** Simpan/ubah satu sel jadwal (satu pegawai, satu tanggal). */
export async function simpanJadwalSel({ userId, tanggal, shiftId }) {
  if (!userId || !tanggal || !shiftId) throw new Error('Data jadwal belum lengkap.')
  const { error } = await supabase
    .from('jadwal_shift')
    .upsert(
      { user_id: userId, tanggal, shift_id: shiftId },
      { onConflict: 'user_id,tanggal' },
    )
  if (error) throw error
}

/** Hapus jadwal satu pegawai pada satu tanggal. */
export async function hapusJadwalSel(userId, tanggal) {
  const { error } = await supabase
    .from('jadwal_shift')
    .delete()
    .eq('user_id', userId)
    .eq('tanggal', tanggal)
  if (error) throw error
}

/** Simpan banyak baris jadwal sekaligus (dipakai untuk salin pola). */
export async function simpanJadwalBanyak(baris) {
  if (!baris?.length) return 0
  const { error } = await supabase
    .from('jadwal_shift')
    .upsert(baris, { onConflict: 'user_id,tanggal' })
  if (error) throw error
  return baris.length
}

/**
 * Impor perubahan jadwal dari template CSV/XLSX.
 * Server memvalidasi ulang unit, tanggal, dan shift.
 */
export async function imporJadwalShift({ unitKerja, periode, baris }) {
  const { data, error } = await supabase.rpc('impor_jadwal_shift', {
    p_unit: unitKerja,
    p_periode: periode,
    p_baris: baris,
  })
  if (error) throw error
  return data
}
