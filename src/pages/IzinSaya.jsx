/**
 * ==========================================================================
 * Pegawai — Izin / Cuti / Sakit / Dinas Luar
 * --------------------------------------------------------------------------
 * Pegawai mengajukan sendiri; pengajuan tidak dapat dibatalkan setelah
 * dikirim. Persetujuan diproses Super Admin.
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  ajukanIzinSaya,
  ambilIzinSaya,
} from '../services/izinPegawaiService.js'
import { formatTanggalRingkas, hariIni } from '../utils/format.js'
import { labelStatusIzin, varianStatusIzin } from '../utils/status.js'
import { Alert, Badge, Button, Spinner } from '../components/ui/index.js'
import BarAtas from '../components/BarAtas.jsx'

const JENIS = ['Izin', 'Sakit', 'Cuti', 'Dinas Luar']

const FORM_KOSONG = {
  jenis: 'Izin',
  tanggalMulai: hariIni(),
  tanggalSelesai: hariIni(),
  alasan: '',
}

export default function IzinSaya() {
  const { profil, keluar } = useAuth()
  const [daftar, setDaftar] = useState([])
  const [form, setForm] = useState(FORM_KOSONG)
  const [memuat, setMemuat] = useState(true)
  const [menyimpan, setMenyimpan] = useState(false)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)

  const muat = useCallback(async () => {
    if (!profil) return
    setMemuat(true)
    try {
      const data = await ambilIzinSaya(profil.id)
      setDaftar(data)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat data izin/cuti.')
    } finally {
      setMemuat(false)
    }
  }, [profil])

  useEffect(() => {
    muat()
  }, [muat])

  const kirim = async (event) => {
    event.preventDefault()
    setGalat(null)
    setPesan(null)
    setMenyimpan(true)
    try {
      if (form.tanggalSelesai < form.tanggalMulai) {
        throw new Error('Tanggal selesai tidak boleh sebelum tanggal mulai.')
      }
      if (form.alasan.trim().length < 5) {
        throw new Error('Alasan wajib diisi minimal 5 karakter.')
      }

      await ajukanIzinSaya({
        userId: profil.id,
        jenis: form.jenis,
        tanggalMulai: form.tanggalMulai,
        tanggalSelesai: form.tanggalSelesai,
        alasan: form.alasan,
      })

      setPesan('Pengajuan terkirim. Menunggu persetujuan Super Admin.')
      setForm({ ...FORM_KOSONG })
      await muat()
    } catch (err) {
      setGalat(err.message || 'Gagal mengirim pengajuan.')
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <BarAtas onKeluar={keluar} />

      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-slate-800">Izin &amp; Cuti Saya</h1>
          <p className="text-sm text-slate-500">
            Ajukan surat izin, sakit, cuti, atau dinas luar. Persetujuan diproses Super Admin.
          </p>
        </div>

        {pesan && (
          <Alert variant="sukses" className="mb-4">
            {pesan}
          </Alert>
        )}
        {galat && (
          <Alert variant="bahaya" title="Gagal" className="mb-4">
            {galat}
          </Alert>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Form pengajuan */}
          <section className="kartu h-fit lg:col-span-1">
            <h2 className="text-sm font-bold text-slate-800">Buat Pengajuan</h2>
            <p className="mb-4 text-xs text-slate-500">
              Pastikan tanggal dan alasan sudah benar. Pengajuan tidak dapat dibatalkan setelah dikirim.
            </p>

            <form onSubmit={kirim} className="space-y-3">
              <div>
                <label className="label-input" htmlFor="jenis-izin">
                  Jenis
                </label>
                <select
                  id="jenis-izin"
                  className="input-dasar"
                  value={form.jenis}
                  onChange={(e) => setForm((l) => ({ ...l, jenis: e.target.value }))}
                >
                  {JENIS.map((j) => (
                    <option key={j} value={j}>
                      {j}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label-input" htmlFor="mulai-izin">
                  Tanggal Mulai
                </label>
                <input
                  id="mulai-izin"
                  type="date"
                  className="input-dasar"
                  value={form.tanggalMulai}
                  onChange={(e) => setForm((l) => ({ ...l, tanggalMulai: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label-input" htmlFor="selesai-izin">
                  Tanggal Selesai
                </label>
                <input
                  id="selesai-izin"
                  type="date"
                  className="input-dasar"
                  value={form.tanggalSelesai}
                  onChange={(e) => setForm((l) => ({ ...l, tanggalSelesai: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label-input" htmlFor="alasan-izin">
                  Alasan / Keterangan
                </label>
                <textarea
                  id="alasan-izin"
                  className="input-dasar min-h-[90px]"
                  placeholder="Contoh: cuti tahunan, surat dokter, tugas dinas luar kota."
                  value={form.alasan}
                  onChange={(e) => setForm((l) => ({ ...l, alasan: e.target.value }))}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={menyimpan}>
                {menyimpan ? 'Mengirim…' : 'Kirim Pengajuan'}
              </Button>
            </form>
          </section>

          {/* Riwayat pengajuan */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu lg:col-span-2">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-800">Riwayat Pengajuan</h2>
              <p className="text-xs text-slate-500">Seluruh pengajuan Anda beserta statusnya</p>
            </div>

            {memuat ? (
              <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                <Spinner /> Memuat pengajuan…
              </div>
            ) : daftar.length === 0 ? (
              <div className="py-14 text-center">
                <p className="text-sm font-semibold text-slate-600">Belum ada pengajuan</p>
                <p className="mt-1 text-xs text-slate-400">
                  Pengajuan yang Anda kirim akan muncul di sini.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-semibold">Jenis</th>
                      <th className="px-5 py-3 font-semibold">Periode</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                      <th className="px-5 py-3 font-semibold">Catatan Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {daftar.map((baris) => (
                      <tr key={baris.id} className="align-top hover:bg-slate-50/70">
                        <td className="px-5 py-3">
                          <Badge variant="info">{baris.jenis}</Badge>
                          <p className="mt-1 max-w-[220px] text-xs text-slate-500">{baris.alasan}</p>
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
                        <td className="max-w-[180px] px-5 py-3 text-xs text-slate-500">
                          {baris.catatan_admin || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
