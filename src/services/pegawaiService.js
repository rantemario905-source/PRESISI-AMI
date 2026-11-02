/**
 * ==========================================================================
 * Service: Data Pegawai (untuk selector & filter admin)
 * ==========================================================================
 */
import { supabase } from '../utils/supabaseClient.js'

/**
 * Ambil daftar pegawai.
 * @param {{ hanyaPegawai?: boolean, unitKerja?: string|null }} opsi
 *        default hanya role 'pegawai'; kepala ruangan otomatis dibatasi RLS
 */
export async function ambilSemuaPegawai({ hanyaPegawai = true, unitKerja = null } = {}) {
  let kueri = supabase
    .from('pegawai')
    .select('id, nama, unit_kerja, role, kepala_ruangan, pola_kerja')
    .order('nama')
  if (hanyaPegawai) kueri = kueri.eq('role', 'pegawai')
  if (unitKerja) kueri = kueri.eq('unit_kerja', unitKerja)

  const { data, error } = await kueri
  if (error) throw error
  return data ?? []
}

/**
 * Daftar pegawai untuk form Dinas & Sakit / Cuti.
 * RPC lintas unit; bila migrasi 23 belum dijalankan, jatuh kembali ke
 * pembacaan biasa yang dibatasi RLS (hanya unit sendiri).
 */
export async function ambilPegawaiIzin() {
  const { data, error } = await supabase.rpc('daftar_pegawai_izin')
  if (error) {
    const pesan = String(error.message || '')
    if (error.code === 'PGRST202' || /does not exist|Could not find/i.test(pesan)) {
      return ambilSemuaPegawai()
    }
    throw error
  }
  return data ?? []
}

/** Daftar unit kerja dari master grup (termasuk grup kosong), terurut. */
export async function ambilUnitKerja() {
  const { data, error } = await supabase
    .from('grup_shift')
    .select('nama')
    .order('nama')

  if (error) throw error
  return (data ?? []).map((g) => g.nama)
}

const KOLOM_PEGAWAI =
  'id, nama, unit_kerja, role, kepala_ruangan, pola_kerja, dibuat_pada'

/**
 * Kolom `bebas_radius` baru tersedia setelah migrasi 28. Bila migrasi belum
 * dijalankan, daftar tetap dimuat dengan pengecualian radius dianggap mati
 * agar menu Data Pegawai tidak ikut rusak.
 */
async function ambilDaftarPegawai() {
  const denganRadius = await supabase
    .from('pegawai')
    .select(`${KOLOM_PEGAWAI}, bebas_radius`)
    .eq('role', 'pegawai')
    .order('nama')

  if (!denganRadius.error) return denganRadius.data ?? []

  const pesan = String(denganRadius.error.message || '')
  const kolomBelumAda =
    denganRadius.error.code === '42703' || /bebas_radius/i.test(pesan)
  if (!kolomBelumAda) throw denganRadius.error

  const tanpaRadius = await supabase
    .from('pegawai')
    .select(KOLOM_PEGAWAI)
    .eq('role', 'pegawai')
    .order('nama')

  if (tanpaRadius.error) throw tanpaRadius.error
  return (tanpaRadius.data ?? []).map((p) => ({ ...p, bebas_radius: false }))
}

/**
 * Data pegawai non-ASN + ringkasan status perangkatnya (khusus Super Admin).
 * Akun ber-role superadmin tidak ditampilkan karena bukan pegawai.
 * Status perangkat: 'approved' | 'pending' | 'rejected' | 'none'.
 */
export async function ambilDataPegawai() {
  const [hasilPegawai, hasilPerangkat] = await Promise.all([
    ambilDaftarPegawai(),
    supabase.from('perangkat').select('user_id, status'),
  ])

  if (hasilPerangkat.error) throw hasilPerangkat.error

  const statusPerUser = new Map()
  for (const baris of hasilPerangkat.data ?? []) {
    if (!statusPerUser.has(baris.user_id)) statusPerUser.set(baris.user_id, [])
    statusPerUser.get(baris.user_id).push(baris.status)
  }

  return hasilPegawai.map((p) => {
    const daftarStatus = statusPerUser.get(p.id) ?? []
    const statusPerangkat = daftarStatus.includes('approved')
      ? 'approved'
      : daftarStatus.includes('pending')
        ? 'pending'
        : daftarStatus.length
          ? 'rejected'
          : 'none'

    return { ...p, statusPerangkat }
  })
}

/**
 * Perbarui nama, unit kerja, dan pola kerja lewat RPC yang dilindungi.
 * Status kepala tidak lagi diubah dari sini; server menghitung ulang cache
 * kepala_ruangan dari tabel kepala_unit. Role Super Admin tidak diubah.
 * @param {{ id: string, nama: string, unitKerja: string, polaKerja: 'shift'|'reguler', bebasRadius?: boolean }} params
 */
export async function perbaruiPegawai({ id, nama, unitKerja, polaKerja, bebasRadius = false }) {
  const { data, error } = await supabase.rpc('perbarui_pegawai_dan_jadwal', {
    p_id: id,
    p_nama: nama,
    p_unit_kerja: unitKerja,
    p_kepala_ruangan: false,
    p_pola_kerja: polaKerja,
    p_bebas_radius: Boolean(bebasRadius),
  })

  if (error) {
    const pesan = String(error.message || '')
    if (
      error.code === 'PGRST202' ||
      /perbarui_pegawai_dan_jadwal|p_bebas_radius/i.test(pesan)
    ) {
      throw new Error(
        'Fitur pengecualian radius belum aktif di server. Jalankan migrasi 28 terlebih dahulu.',
      )
    }
    throw error
  }
  return data
}
