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

/**
 * Data pegawai non-ASN + ringkasan status perangkatnya (khusus Super Admin).
 * Akun ber-role superadmin tidak ditampilkan karena bukan pegawai.
 * Status perangkat: 'approved' | 'pending' | 'rejected' | 'none'.
 */
export async function ambilDataPegawai() {
  const [hasilPegawai, hasilPerangkat] = await Promise.all([
    supabase
      .from('pegawai')
      .select('id, nama, unit_kerja, role, kepala_ruangan, pola_kerja, dibuat_pada')
      .eq('role', 'pegawai')
      .order('nama'),
    supabase.from('perangkat').select('user_id, status'),
  ])

  if (hasilPegawai.error) throw hasilPegawai.error
  if (hasilPerangkat.error) throw hasilPerangkat.error

  const statusPerUser = new Map()
  for (const baris of hasilPerangkat.data ?? []) {
    if (!statusPerUser.has(baris.user_id)) statusPerUser.set(baris.user_id, [])
    statusPerUser.get(baris.user_id).push(baris.status)
  }

  return (hasilPegawai.data ?? []).map((p) => {
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
 * @param {{ id: string, nama: string, unitKerja: string, polaKerja: 'shift'|'reguler' }} params
 */
export async function perbaruiPegawai({ id, nama, unitKerja, polaKerja }) {
  const { data, error } = await supabase.rpc('perbarui_pegawai_dan_jadwal', {
    p_id: id,
    p_nama: nama,
    p_unit_kerja: unitKerja,
    p_kepala_ruangan: false,
    p_pola_kerja: polaKerja,
  })

  if (error) throw error
  return data
}
