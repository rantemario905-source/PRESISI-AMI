/**
 * ==========================================================================
 * Error Boundary — mencegah layar putih saat halaman gagal dirender
 * --------------------------------------------------------------------------
 * Menangkap error render/lifecycle (termasuk kegagalan memuat chunk halaman
 * akibat deploy baru) lalu menampilkan pemulihan yang ramah. Bila error
 * berasal dari modul yang gagal diunduh, halaman dimuat ulang otomatis sekali.
 * ==========================================================================
 */
import { Component } from 'react'
import { adalahGalatMuatModul, muatUlangSekali } from '../utils/pemulihanHalaman.js'
import { Button, TombolMuatUlang } from './ui/index.js'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { galat: null, galatModul: false }
    this.muatUlang = this.muatUlang.bind(this)
    this.kembaliKeBeranda = this.kembaliKeBeranda.bind(this)
  }

  static getDerivedStateFromError(galat) {
    return { galat, galatModul: adalahGalatMuatModul(galat) }
  }

  componentDidCatch(galat, info) {
    if (this.state.galatModul) muatUlangSekali()
    console.error('[PRESISI AMI] Halaman gagal dirender:', galat, info?.componentStack)
  }

  muatUlang() {
    try {
      window.location.reload()
    } catch {
      /* abaikan */
    }
  }

  kembaliKeBeranda() {
    try {
      window.location.assign(import.meta.env.BASE_URL || '/')
    } catch {
      /* abaikan */
    }
  }

  render() {
    const { galat, galatModul } = this.state
    if (!galat) return this.props.children

    const judul = galatModul ? 'Halaman gagal dimuat' : 'Terjadi kesalahan'
    const pesan = galatModul
      ? 'Koneksi terputus atau aplikasi baru saja diperbarui. Muat ulang halaman untuk melanjutkan.'
      : 'Halaman ini mengalami gangguan. Coba muat ulang; bila masih terjadi, hubungi Admin IT.'
    const bingkai = this.props.kompak
      ? 'kartu w-full max-w-md p-5 text-center'
      : 'kartu w-full max-w-md p-6 text-center'

    return (
      <main
        className={
          this.props.kompak
            ? 'flex w-full items-center justify-center py-10'
            : 'flex min-h-[100dvh] items-center justify-center bg-slate-50 p-4'
        }
      >
        <section className={bingkai} role="alert" aria-live="assertive">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.3 3.9L2.4 18a2 2 0 001.7 3h15.8a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
            </svg>
          </div>

          <h1 className="mt-3 text-lg font-extrabold text-slate-900">{judul}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-600 sm:text-sm">{pesan}</p>

          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <Button variant="sekunder" onClick={this.kembaliKeBeranda}>
              Kembali ke beranda
            </Button>
            <TombolMuatUlang onClick={this.muatUlang} />
          </div>

          {galat?.message && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-[11px] font-semibold text-slate-500">
                Detail teknis
              </summary>
              <p className="mt-1 break-words rounded-lg bg-slate-50 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-slate-500">
                {String(galat.message)}
              </p>
            </details>
          )}
        </section>
      </main>
    )
  }
}
