/**
 * ==========================================================================
 * Super Admin — Hari Libur
 * --------------------------------------------------------------------------
 * Hari libur nasional/cuti bersama diinput manual. Pegawai reguler tidak
 * diwajibkan absen pada tanggal ini. Pegawai shift tetap mengikuti jadwal.
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import {
  ambilHariLibur,
  hapusHariLibur,
  tambahHariLibur,
} from '../../services/hariLiburService.js'
import { formatTanggal, hariIni } from '../../utils/format.js'
import { Alert, Badge, Button, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const FORM_KOSONG = { tanggal: '', nama: '' }

export default function HariLibur() {
  const [tahun, setTahun] = useState(hariIni().slice(0, 4))
  const [daftar, setDaftar] = useState([])
  const [form, setForm] = useState(FORM_KOSONG)
  const [memuat, setMemuat] = useState(true)
  const [menyimpan, setMenyimpan] = useState(false)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)

  const muat = useCallback(async () => {
    if (!/^\d{4}$/.test(String(tahun))) {
      setDaftar([])
      setMemuat(false)
      return
    }
    setMemuat(true)
    try {
      const data = await ambilHariLibur(tahun)
      setDaftar(data)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat hari libur.')
    } finally {
      setMemuat(false)
    }
  }, [tahun])

  useEffect(() => {
    muat()
  }, [muat])

  async function tambah(event) {
    event.preventDefault()
    setMenyimpan(true)
    setGalat(null)
    setPesan(null)
    try {
      if (!form.tanggal) throw new Error('Pilih tanggal libur.')
      if (form.nama.trim().length < 2) {
        throw new Error('Nama hari libur minimal 2 karakter.')
      }
      await tambahHariLibur({
        tanggal: form.tanggal,
        nama: form.nama,
      })
      setPesan(`Hari libur ${formatTanggal(form.tanggal)} disimpan.`)
      setForm(FORM_KOSONG)
      const tahunBaru = form.tanggal.slice(0, 4)
      if (tahunBaru !== tahun) {
        setTahun(tahunBaru)
      } else {
        await muat()
      }
    } catch (err) {
      setGalat(err.message || 'Gagal menyimpan hari libur.')
    } finally {
      setMenyimpan(false)
    }
  }

  async function hapus(baris) {
    if (!window.confirm(`Hapus hari libur "${baris.nama}" (${baris.tanggal})?`)) {
      return
    }
    setGalat(null)
    setPesan(null)
    try {
      await hapusHariLibur(baris.tanggal)
      setPesan(`Hari libur "${baris.nama}" dihapus.`)
      await muat()
    } catch (err) {
      setGalat(err.message || 'Gagal menghapus hari libur.')
    }
  }

  return (
    <>
      <KepalaHalaman
        judul="Hari Libur"
        deskripsi="Input hari libur nasional/cuti bersama. Absensi pegawai reguler dikunci pada tanggal ini; pegawai shift tetap mengikuti jadwal."
        aksi={
          <div className="flex items-end gap-2">
            <div>
              <label className="label-input" htmlFor="tahun-libur">
                Tahun
              </label>
              <input
                id="tahun-libur"
                type="number"
                min="2020"
                max="2100"
                className="input-dasar w-[110px]"
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
              />
            </div>
          </div>
        }
      />

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

      <section className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-kartu sm:p-5">
        <h2 className="text-sm font-bold text-slate-800">Tambah Hari Libur</h2>
        <p className="mb-3 mt-0.5 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
          Tanggal yang sudah ada akan diperbarui namanya.
        </p>
        <form onSubmit={tambah} className="grid gap-3 sm:grid-cols-[170px_1fr_auto]">
          <div>
            <label className="label-input" htmlFor="tanggal-libur">
              Tanggal
            </label>
            <input
              id="tanggal-libur"
              type="date"
              className="input-dasar"
              value={form.tanggal}
              onChange={(e) =>
                setForm((l) => ({ ...l, tanggal: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="label-input" htmlFor="nama-libur">
              Nama Hari Libur
            </label>
            <input
              id="nama-libur"
              className="input-dasar"
              placeholder="Contoh: Hari Raya Idul Fitri"
              value={form.nama}
              onChange={(e) =>
                setForm((l) => ({ ...l, nama: e.target.value }))
              }
              required
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full sm:w-auto" disabled={menyimpan}>
              {menyimpan ? 'Menyimpan…' : 'Tambah'}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Hari Libur {tahun}
            </h2>
            <p className="text-xs text-slate-500">{daftar.length} tanggal</p>
          </div>
          <Badge variant="info">Zona WITA</Badge>
        </div>

        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat hari libur…
          </div>
        ) : daftar.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Belum ada hari libur pada tahun {tahun}.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {daftar.map((baris) => (
                <article key={baris.tanggal} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-bold text-slate-800">
                        {baris.nama}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {formatTanggal(baris.tanggal)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="bahayaLembut"
                      onClick={() => hapus(baris)}
                    >
                      Hapus
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Tanggal</th>
                    <th className="px-5 py-3 font-semibold">Nama</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daftar.map((baris) => (
                    <tr key={baris.tanggal} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 text-slate-700">
                        {formatTanggal(baris.tanggal)}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {baris.nama}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button
                          size="sm"
                          variant="bahayaLembut"
                          onClick={() => hapus(baris)}
                        >
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  )
}
