/**
 * ==========================================================================
 * AuthContext — Sesi login, profil, dan peran aktif
 * --------------------------------------------------------------------------
 * Menyediakan: sesi, profil (id/nama/unit/role), status memuat,
 * serta fungsi masuk() dan keluar() ke seluruh aplikasi.
 * ==========================================================================
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '../utils/supabaseClient.js'
import { masuk as masukAuth, keluar as keluarAuth, ambilProfil, dengarkanSesi } from '../services/authService.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [sesi, setSesi] = useState(null)
  const [profil, setProfil] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)

  useEffect(() => {
    // Belum ada kredensial Supabase → jangan inisialisasi sesi
    if (!supabase) {
      setMemuat(false)
      return undefined
    }

    // onAuthStateChange langsung mengirim INITIAL_SESSION saat langganan dibuat
    const langganan = dengarkanSesi(async (session) => {
      setSesi(session)
      if (session) {
        try {
          const data = await ambilProfil(session.user.id)
          setProfil(data)
        } catch (err) {
          setProfil(null)
          setGalat(err.message || 'Gagal memuat profil pegawai.')
        }
      } else {
        setProfil(null)
      }
      setMemuat(false)
    })
    return () => langganan.unsubscribe()
  }, [])

  /** Login lalu muat profil. @returns profil untuk keputusan redirect */
  const masuk = useCallback(async (email, password) => {
    setGalat(null)
    const user = await masukAuth(email, password)
    const data = await ambilProfil(user.id)
    setSesi({ user })
    setProfil(data)
    return data
  }, [])

  const keluar = useCallback(async () => {
    try {
      await keluarAuth()
    } finally {
      setSesi(null)
      setProfil(null)
    }
  }, [])

  const nilai = useMemo(
    () => ({
      sesi,
      profil,
      memuat,
      galat,
      masuk,
      keluar,
      apakahSuperadmin: profil?.role === 'superadmin',
    }),
    [sesi, profil, memuat, galat, masuk, keluar],
  )

  return <AuthContext.Provider value={nilai}>{children}</AuthContext.Provider>
}

/** Hook akses konteks autentikasi */
export function useAuth() {
  const konteks = useContext(AuthContext)
  if (!konteks) throw new Error('useAuth harus dipakai di dalam <AuthProvider>')
  return konteks
}
