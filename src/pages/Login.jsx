/**
 * ==========================================================================
 * Halaman Login — seluruh staf RSUD AMI (pegawai & super admin)
 * --------------------------------------------------------------------------
 * Setelah berhasil, pengguna diarahkan sesuai peran:
 *   pegawai   → /
 *   superadmin→ /superadmin-portal
 * ==========================================================================
 */
import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { konfigurasiLengkap } from '../utils/supabaseClient.js'
import { Alert, Button, Spinner } from '../components/ui/index.js'
import LogoRSUD from '../components/LogoRSUD.jsx'
import { NAMA_APLIKASI, DESKRIPSI_APLIKASI, NAMA_RUMAH_SAKIT } from '../config/constants.js'

export default function Login() {
  const { sesi, profil, memuat, masuk, galat } = useAuth()
  const navigate = useNavigate()
  const lokasi = useLocation()

  const [email, setEmail] = useState('')
  const [kataSandi, setKataSandi] = useState('')
  const [proses, setProses] = useState(false)
  const [pesanGalat, setPesanGalat] = useState(null)

  // Sudah login → langsung ke halaman sesuai peran
  useEffect(() => {
    if (sesi && profil) {
      navigate(profil.role === 'superadmin' ? '/superadmin-portal' : '/', { replace: true })
    }
  }, [sesi, profil, navigate])

  if (memuat) return null

  async function tanganiSubmit(event) {
    event.preventDefault()
    setPesanGalat(null)

    if (!email.trim() || !kataSandi) {
      setPesanGalat('Email dan kata sandi wajib diisi.')
      return
    }

    setProses(true)
    try {
      const data = await masuk(email.trim(), kataSandi)

      // Tujuan awal hanya dipakai bila masih berada di area peran yang sama.
      // Ini mencegah Superadmin terlempar ke rute pegawai (dan sebaliknya).
      const beranda = data?.role === 'superadmin' ? '/superadmin-portal' : '/'
      const dari = lokasi.state?.dari
      const dariSesuaiPeran =
        dari &&
        (data?.role === 'superadmin' ? dari.startsWith('/superadmin-portal') : dari === '/')

      navigate(dariSesuaiPeran ? dari : beranda, { replace: true })
    } catch (err) {
      // Pesan Supabase sengaja dibuat ramah & umum (tidak membocorkan detail akun)
      const pesan = err?.message || ''
      setPesanGalat(
        pesan.includes('Invalid login credentials')
          ? 'Email atau kata sandi salah. Periksa kembali data Anda.'
          : pesan.includes('Email not confirmed')
            ? 'Email belum dikonfirmasi. Hubungi Admin IT untuk konfirmasi akun.'
            : pesan || 'Gagal masuk. Coba beberapa saat lagi.',
      )
    } finally {
      setProses(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Kepala: identitas rumah sakit */}
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoRSUD className="h-20 w-20" />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-800">{NAMA_APLIKASI}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">{DESKRIPSI_APLIKASI}</p>
          <p className="mt-3 rounded-full bg-sky-600 px-4 py-1 text-xs font-bold uppercase tracking-wider text-white">
            {NAMA_RUMAH_SAKIT}
          </p>
        </div>

        {/* Kartu login */}
        <div className="kartu">
          <h2 className="mb-1 text-lg font-bold text-slate-800">Masuk ke Akun Anda</h2>
          <p className="mb-5 text-sm text-slate-500">
            Gunakan email terdaftar untuk mengakses sistem presensi.
          </p>

          {!konfigurasiLengkap && (
            <Alert variant="peringatan" title="Konfigurasi Belum Lengkap" className="mb-4">
              File <code className="font-mono text-xs">.env</code> belum diisi. Salin{' '}
              <code className="font-mono text-xs">.env.example</code> menjadi{' '}
              <code className="font-mono text-xs">.env</code>, lalu isi{' '}
              <code className="font-mono text-xs">VITE_SUPABASE_URL</code> dan{' '}
              <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code>, kemudian jalankan ulang
              aplikasi.
            </Alert>
          )}

          {(pesanGalat || galat) && (
            <Alert variant="bahaya" title="Gagal Masuk" className="mb-4">
              {pesanGalat || galat}
            </Alert>
          )}

          <form onSubmit={tanganiSubmit} noValidate>
            <div className="mb-4">
              <label htmlFor="email" className="label-input">
                Alamat Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input-dasar"
                placeholder="nama@rsud-ami.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={proses}
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="kataSandi" className="label-input">
                Kata Sandi
              </label>
              <input
                id="kataSandi"
                type="password"
                autoComplete="current-password"
                className="input-dasar"
                placeholder="••••••••"
                value={kataSandi}
                onChange={(e) => setKataSandi(e.target.value)}
                disabled={proses}
                required
              />
            </div>

            <Button type="submit" variant="utama" size="lg" className="w-full" disabled={proses}>
              {proses ? (
                <>
                  <Spinner className="h-4 w-4" /> Memverifikasi…
                </>
              ) : (
                'Masuk'
              )}
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Lupa kata sandi? Hubungi Admin IT untuk reset akun.
        </p>
      </div>
    </div>
  )
}
