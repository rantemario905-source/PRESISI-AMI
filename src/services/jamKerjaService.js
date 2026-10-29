/**
 * ==========================================================================
 * Service: Jam Kerja Reguler per Unit
 * --------------------------------------------------------------------------
 * Membaca override jam kerja unit (fallback ke jam global) dan menyimpan
 * pengaturan 7 hari. Hanya Super Admin yang dapat menulis (RLS).
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

export const NAMA_HARI = [
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
  'Minggu',
]

function potongJam(nilai) {
  return nilai ? String(nilai).slice(0, 5) : ''
}

/** Jam kerja efektif satu unit: override unit bila ada, selain itu global. */
export async function ambilJamKerjaUnit(unit) {
  if (!unit) throw new Error('Pilih unit terlebih dahulu.')

  const [override, global] = await Promise.all([
    supabase
      .from('jam_kerja_unit')
      .select('hari, jam_mulai, jam_selesai, libur')
      .eq('unit_kerja', unit)
      .order('hari'),
    supabase
      .from('jam_kerja_reguler')
      .select('hari, jam_mulai, jam_selesai, libur')
      .order('hari'),
  ])

  if (override.error) throw override.error
  if (global.error) throw global.error
  if (!global.data?.length) {
    throw new Error('Aturan jam kerja global belum tersedia. Hubungi Admin IT.')
  }

  const petaOverride = new Map(
    (override.data ?? []).map((baris) => [baris.hari, baris]),
  )

  const baris = global.data.map((acuan) => {
    const khusus = petaOverride.get(acuan.hari)
    return {
      hari: acuan.hari,
      nama_hari: NAMA_HARI[acuan.hari - 1],
      jam_mulai: potongJam(khusus ? khusus.jam_mulai : acuan.jam_mulai),
      jam_selesai: potongJam(khusus ? khusus.jam_selesai : acuan.jam_selesai),
      libur: khusus ? khusus.libur : acuan.libur,
      khusus: Boolean(khusus),
    }
  })

  return { baris, khusus: (override.data ?? []).length > 0 }
}

/** Simpan 7 baris override unit (upsert atomik dalam satu permintaan). */
export async function simpanJamKerjaUnit(unit, baris) {
  if (!unit) throw new Error('Pilih unit terlebih dahulu.')

  const data = baris.map((item) => ({
    unit_kerja: unit,
    hari: item.hari,
    jam_mulai: item.libur ? null : item.jam_mulai,
    jam_selesai: item.libur ? null : item.jam_selesai,
    libur: item.libur,
  }))

  const { error } = await supabase
    .from('jam_kerja_unit')
    .upsert(data, { onConflict: 'unit_kerja,hari' })

  if (error) throw error
}

/** Hapus override unit sehingga kembali memakai jam kerja global. */
export async function hapusJamKerjaUnit(unit) {
  if (!unit) throw new Error('Pilih unit terlebih dahulu.')

  const { error } = await supabase
    .from('jam_kerja_unit')
    .delete()
    .eq('unit_kerja', unit)

  if (error) throw error
}
