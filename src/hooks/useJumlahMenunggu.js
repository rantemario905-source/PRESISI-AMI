/**
 * Jumlah pengajuan yang menunggu keputusan, untuk badge menu sidebar.
 *
 * Dihitung di server lewat `count` (bukan menarik seluruh baris) dan sudah
 * dibatasi RLS: kepala unit hanya menghitung unit yang dikelolanya, Super Admin
 * menghitung semua. Pengaduan milik sendiri tidak dihitung karena tidak boleh
 * diputuskan sendiri.
 *
 * Badge hanya pelengkap, jadi galat jaringan diabaikan dan angka terakhir
 * dipertahankan.
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../utils/supabaseClient.js'
import { jenisUntukKategori } from '../utils/izin.js'

const AWAL = { pengaduan: 0, dinasSakit: 0, cuti: 0, izin: 0, perangkat: 0 }
const JEDA_MUAT = 60_000

export function useJumlahMenunggu() {
  const { profil } = useAuth()
  const { pathname } = useLocation()
  const [jumlah, setJumlah] = useState(AWAL)
  const userId = profil?.id

  useEffect(() => {
    if (!supabase || !userId) return undefined
    let aktif = true

    const hitungIzin = (kategori) =>
      supabase
        .from('izin_cuti')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'menunggu')
        .in('jenis', jenisUntukKategori(kategori))

    async function muat() {
      try {
        const [pengaduan, dinasSakit, cuti, izin, perangkat] = await Promise.all([
          supabase
            .from('pengaduan_presensi')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'menunggu')
            .neq('user_id', userId),
          hitungIzin('dinas-sakit'),
          hitungIzin('cuti'),
          hitungIzin('izin'),
          supabase
            .from('perangkat')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending'),
        ])

        if (!aktif) return
        const hasil = [pengaduan, dinasSakit, cuti, izin, perangkat]
        if (hasil.some((baris) => baris.error)) return

        setJumlah({
          pengaduan: pengaduan.count ?? 0,
          dinasSakit: dinasSakit.count ?? 0,
          cuti: cuti.count ?? 0,
          izin: izin.count ?? 0,
          perangkat: perangkat.count ?? 0,
        })
      } catch {
        // Badge hanya pelengkap; angka terakhir tetap dipakai.
      }
    }

    muat()
    const timer = setInterval(muat, JEDA_MUAT)
    return () => {
      aktif = false
      clearInterval(timer)
    }
  }, [userId, pathname])

  return jumlah
}
