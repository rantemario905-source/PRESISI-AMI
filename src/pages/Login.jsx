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
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { konfigurasiLengkap } from '../utils/supabaseClient.js'
import { Alert, Button, LayarMemuat, Spinner } from '../components/ui/index.js'
import LogoRSUD from '../components/LogoRSUD.jsx'
import { NAMA_APLIKASI, DESKRIPSI_APLIKASI, NAMA_RUMAH_SAKIT } from '../config/constants.js'

export default function Login() {
  const { sesi, profil, memuat, masuk, galat } = useAuth()
  const navigate = useNavigate()
  const lokasi = useLocation()

  const [email, setEmail] = useState('')
  const [kataSandi, setKataSandi] = useState('')
  const [tampilSandi, setTampilSandi] = useState(false)
  const [proses, setProses] = useState(false)
  const [pesanGalat, setPesanGalat] = useState(null)

  // Sudah login → langsung ke halaman sesuai peran
  useEffect(() => {
    if (sesi && profil) {
      navigate(profil.role === 'superadmin' ? '/superadmin-portal' : '/', { replace: true })
    }
  }, [sesi, profil, navigate])

  if (memuat) return <LayarMemuat label="Memeriksa sesi…" />

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
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-8 sm:py-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-sky-100 via-sky-50/60 to-transparent"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-md">
        {/* Kepala: identitas rumah sakit */}
        <div className="mb-5 flex flex-col items-center text-center sm:mb-6">
          <LogoRSUD className="h-16 w-16 drop-shadow-sm sm:h-20 sm:w-20" />
          <h1 className="mt-3 text-xl font-extrabold tracking-tight text-slate-900 sm:mt-4 sm:text-2xl">
            {NAMA_APLIKASI}
          </h1>
          <p className="mt-1 max-w-xs text-[13px] font-medium leading-relaxed text-slate-500 sm:text-sm">
            {DESKRIPSI_APLIKASI}
          </p>
          <p className="mt-3 rounded-full bg-sky-600 px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white sm:text-xs">
            {NAMA_RUMAH_SAKIT}
          </p>
        </div>

        {/* Kartu login */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-kartu sm:p-6">
          <h2 className="text-lg font-bold text-slate-800">Masuk ke Akun Anda</h2>
          <p className="mb-5 mt-1 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
            Gunakan email terdaftar untuk mengakses sistem presensi.
          </p>

          {!konfigurasiLengkap && (
            <Alert variant="peringatan" title="Konfigurasi Belum Lengkap" className="mb-4">
              File <code className="font-mono text-xs">.env</code> belum diisi. Salin{' '}
              <code className="font-mono text-xs">.env.example</code> menjadi{' '}
              <code className="font-mono text-xs">.env</code>, lalu isi{' '}
              <code className="font-mono text-xs">VITE_SUPABASE_URL</code> dan{' '}
              <code className="font-mono text-xs">VITE_SUPABASE_ANON_KEY</code>, kemudian jalankan
              ulang aplikasi.
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
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                enterKeyHint="next"
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
              <div className="relative">
                <input
                  id="kataSandi"
                  name="password"
                  type={tampilSandi ? 'text' : 'password'}
                  autoComplete="current-password"
                  enterKeyHint="go"
                  className="input-dasar pr-12"
                  placeholder="••••••••"
                  value={kataSandi}
                  onChange={(e) => setKataSandi(e.target.value)}
                  disabled={proses}
                  required
                />
                <button
                  type="button"
                  onClick={() => setTampilSandi((l) => !l)}
                  aria-label={tampilSandi ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  aria-pressed={tampilSandi}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition-colors hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
                >
                  {tampilSandi ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" />
                      <path d="M10.6 10.6a2 2 0 002.8 2.8" />
                      <path d="M9.9 5.2A10.8 10.8 0 0112 5c5.5 0 9 5.2 9 7 0 .7-.3 1.6-.9 2.5M6.2 6.2C4 7.8 3 9.8 3 12c0 1.8 3.5 7 9 7 1.4 0 2.6-.3 3.7-.9" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-5 w-5"
                      aria-hidden="true"
                    >
                      <path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
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

        <p className="mt-5 text-center text-[11px] leading-relaxed text-slate-400 sm:text-xs">
          Lupa kata sandi? Hubungi Admin IT untuk reset akun.
        </p>
      </div>
    </div>
  )
}
