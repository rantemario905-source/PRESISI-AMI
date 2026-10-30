/**
 * ==========================================================================
 * Pegawai — Riwayat Dinas & Sakit / Cuti (READ-ONLY)
 * --------------------------------------------------------------------------
 * Pegawai TIDAK dapat mengajukan, mengubah, atau menghapus pengajuan.
 * Pencatatan dilakukan kepala ruangan atau Super Admin. Persetujuan oleh
 * Super Admin. Halaman ini hanya menampilkan riwayat dan dokumen.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { ambilDokumenUrl } from '../services/leaveService.js'
import { ambilIzinSaya } from '../services/izinPegawaiService.js'
import { formatTanggalRingkas } from '../utils/format.js'
import { labelJenis } from '../utils/izin.js'
import { labelStatusIzin, varianStatusIzin } from '../utils/status.js'
import { Alert, Badge, Spinner, TabBar } from '../components/ui/index.js'
import BarAtas from '../components/BarAtas.jsx'

const TAB = [
  { nilai: 'dinas-sakit', label: 'Dinas & Sakit' },
  { nilai: 'cuti', label: 'Cuti' },
]

export default function IzinSaya() {
  const { profil, keluar } = useAuth()
  const [tab, setTab] = useState('dinas-sakit')
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [dokumenMembuka, setDokumenMembuka] = useState(null)

  const muat = useCallback(async () => {
    if (!profil) return
    setMemuat(true)
    try {
      const data = await ambilIzinSaya(profil.id)
      setDaftar(data)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat riwayat ketidakhadiran.')
    } finally {
      setMemuat(false)
    }
  }, [profil])

  useEffect(() => {
    muat()
  }, [muat])

  const tersaring = useMemo(
    () =>
      daftar.filter((item) =>
        tab === 'cuti' ? item.jenis === 'Cuti' : item.jenis !== 'Cuti',
      ),
    [daftar, tab],
  )

  const ringkasan = useMemo(
    () => ({
      menunggu: daftar.filter((b) => b.status === 'menunggu').length,
      disetujui: daftar.filter((b) => b.status === 'disetujui').length,
    }),
    [daftar],
  )

  const lihatDokumen = async (path) => {
    if (!path) return
    const jendela = window.open('about:blank', '_blank')
    if (jendela) jendela.opener = null
    setDokumenMembuka(path)
    try {
      const url = await ambilDokumenUrl(path)
      if (!url) throw new Error('Dokumen tidak tersedia.')
      if (jendela) jendela.location.replace(url)
      else window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      if (jendela) jendela.close()
      setGalat(err.message || 'Gagal membuka dokumen.')
    } finally {
      setDokumenMembuka(null)
    }
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <BarAtas onKeluar={keluar} />

      <main
        id="konten"
        className="pb-navigasi mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6"
      >
        <div className="mb-4 sm:mb-5">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
            Dinas, Sakit &amp; Cuti Saya
          </h1>
          <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
            Riwayat ini dicatat oleh kepala ruangan atau Super Admin. Halaman bersifat baca saja.
          </p>
        </div>

        {galat && (
          <Alert variant="bahaya" title="Gagal" className="mb-4">
            {galat}
          </Alert>
        )}

        <section className="kartu mb-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Ringkasan</h2>
              <p className="text-xs text-slate-500">{daftar.length} pengajuan tercatat</p>
            </div>
            <div className="mt-2 flex gap-2 sm:mt-0">
              <span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-800">
                Menunggu: {ringkasan.menunggu}
              </span>
              <span className="rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold text-green-800">
                Disetujui: {ringkasan.disetujui}
              </span>
            </div>
          </div>
        </section>

        <TabBar daftar={TAB} nilai={tab} onChange={setTab} label="Kategori ketidakhadiran" />

        <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
          <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
            <h2 className="text-sm font-bold text-slate-800">
              Riwayat {tab === 'cuti' ? 'Cuti' : 'Dinas & Sakit'}
            </h2>
            <p className="text-xs text-slate-500">
              {tersaring.length} pengajuan pada kategori ini
            </p>
          </div>

          {memuat ? (
            <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
              <Spinner /> Memuat riwayat…
            </div>
          ) : tersaring.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="text-sm font-semibold text-slate-600">Belum ada pengajuan</p>
              <p className="mt-1 text-xs text-slate-400">
                Hubungi kepala ruangan atau Super Admin bila ada ketidakhadiran yang perlu dicatat.
              </p>
            </div>
          ) : (
            <>
              {/* HP: kartu */}
              <div className="space-y-2.5 p-3 sm:hidden">
                {tersaring.map((baris) => (
                  <article
                    key={baris.grup_id}
                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Badge variant="info">{labelJenis(baris.jenis)}</Badge>
                      <Badge variant={varianStatusIzin(baris.status)}>
                        {labelStatusIzin(baris.status)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-[13px] font-bold text-slate-800">
                      {formatTanggalRingkas(baris.tanggal_mulai)} —{' '}
                      {formatTanggalRingkas(baris.tanggal_selesai)}
                    </p>
                    {baris.alasan && (
                      <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-500">
                        {baris.alasan}
                      </p>
                    )}

                    {baris.dokumen_path && (
                      <button
                        type="button"
                        onClick={() => lihatDokumen(baris.dokumen_path)}
                        disabled={dokumenMembuka === baris.dokumen_path}
                        className="mt-2 text-xs font-semibold text-sky-700 underline disabled:opacity-50"
                      >
                        {dokumenMembuka === baris.dokumen_path
                          ? 'Membuka dokumen…'
                          : 'Lihat dokumen'}
                      </button>
                    )}

                    {baris.catatan_admin && (
                      <p className="mt-2 rounded-lg bg-white px-2.5 py-2 text-[11px] leading-relaxed text-slate-600 ring-1 ring-slate-200">
                        <span className="font-semibold">Catatan admin:</span>{' '}
                        {baris.catatan_admin}
                      </p>
                    )}
                    {baris.alasan_pembatalan && (
                      <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-[11px] leading-relaxed text-red-700">
                        <span className="font-semibold">Alasan batal:</span>{' '}
                        {baris.alasan_pembatalan}
                      </p>
                    )}
                  </article>
                ))}
              </div>

              {/* Desktop: tabel */}
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Jenis</th>
                      <th className="px-5 py-3 font-semibold">Periode</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Keterangan</th>
                      <th className="px-5 py-3 font-semibold">Dokumen</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tersaring.map((baris) => (
                      <tr key={baris.grup_id} className="align-top hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <Badge variant="info">{labelJenis(baris.jenis)}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                          {formatTanggalRingkas(baris.tanggal_mulai)}
                          <br />
                          s.d. {formatTanggalRingkas(baris.tanggal_selesai)}
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={varianStatusIzin(baris.status)}>
                            {labelStatusIzin(baris.status)}
                          </Badge>
                        </td>
                        <td className="max-w-[240px] px-5 py-3 text-xs text-slate-600">
                          {baris.alasan || '—'}
                          {baris.catatan_admin && (
                            <p className="mt-1 text-[11px] font-semibold text-slate-500">
                              Catatan admin: {baris.catatan_admin}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs">
                          {baris.dokumen_path ? (
                            <button
                              type="button"
                              onClick={() => lihatDokumen(baris.dokumen_path)}
                              disabled={dokumenMembuka === baris.dokumen_path}
                              className="font-semibold text-sky-700 hover:underline disabled:opacity-50"
                            >
                              {dokumenMembuka === baris.dokumen_path ? 'Membuka…' : 'Lihat'}
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
