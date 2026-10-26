/**
 * ==========================================================================
 * Super Admin — Pengaturan Presensi
 * --------------------------------------------------------------------------
 * Mengatur kapan Alfa otomatis dijalankan. Mode transisi shift sudah
 * dihapus: pegawai shift wajib memiliki jadwal sebelum dapat absen.
 * Alfa dihitung setelah jam kerja masing-masing pegawai berakhir, bukan
 * pada jam tetap 03.00.
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ambilPengaturanPresensi,
  jalankanAlfa,
  simpanPengaturanPresensi,
} from '../../services/pengaturanService.js'
import { formatJam, hariIni } from '../../utils/format.js'
import { Alert, Badge, Button, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

export default function PengaturanPresensi() {
  const [pengaturan, setPengaturan] = useState({
    alfaOtomatis: false,
    alfaMulai: '',
  })
  const [diperbaruiPada, setDiperbaruiPada] = useState(null)
  const [memuat, setMemuat] = useState(true)
  const [menyimpan, setMenyimpan] = useState(false)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)

  const [tanggalAlfa, setTanggalAlfa] = useState(hariIni())
  const [menjalankan, setMenjalankan] = useState(false)
  const [hasilAlfa, setHasilAlfa] = useState(null)

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      const data = await ambilPengaturanPresensi()
      if (data) {
        setPengaturan({
          alfaOtomatis: Boolean(data.alfa_otomatis),
          alfaMulai: data.alfa_mulai ?? '',
        })
        setDiperbaruiPada(data.diperbarui_pada ?? null)
      }
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat pengaturan presensi.')
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    muat()
  }, [muat])

  async function simpan(event) {
    event.preventDefault()
    setMenyimpan(true)
    setGalat(null)
    setPesan(null)
    setHasilAlfa(null)
    try {
      if (pengaturan.alfaOtomatis && !pengaturan.alfaMulai) {
        throw new Error(
          'Isi tanggal mulai Alfa agar presensi lama tidak tiba-tiba ditandai Alfa.',
        )
      }

      await simpanPengaturanPresensi(pengaturan)
      setPesan('Pengaturan presensi berhasil disimpan.')
      await muat()
    } catch (err) {
      setGalat(err.message || 'Gagal menyimpan pengaturan.')
    } finally {
      setMenyimpan(false)
    }
  }

  async function prosesAlfa(tanggal) {
    if (
      !window.confirm(
        tanggal
          ? `Buat data Alfa untuk tanggal ${tanggal}? Hanya pegawai yang jam kerjanya sudah berakhir dan belum memiliki presensi yang akan diproses.`
          : 'Buat data Alfa untuk hari ini dan kemarin? Proses ini aman diulang dan tidak akan menggandakan data.',
      )
    ) {
      return
    }

    setMenjalankan(true)
    setGalat(null)
    setPesan(null)
    setHasilAlfa(null)
    try {
      const jumlah = await jalankanAlfa(tanggal)
      setHasilAlfa(
        jumlah > 0
          ? `${jumlah} data Alfa baru dibuat.`
          : 'Tidak ada data Alfa baru. Pastikan Alfa otomatis aktif dan jam kerja sudah berakhir.',
      )
      await muat()
    } catch (err) {
      setGalat(err.message || 'Gagal menjalankan proses Alfa.')
    } finally {
      setMenjalankan(false)
    }
  }

  return (
    <>
      <KepalaHalaman
        judul="Pengaturan Presensi"
        deskripsi="Atur kapan Alfa otomatis dijalankan dan lengkapi persiapan jadwal."
        aksi={
          <Button size="sm" variant="sekunder" onClick={muat} disabled={memuat}>
            Muat ulang
          </Button>
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

      {memuat ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Spinner /> Memuat pengaturan…
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <section className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 shadow-kartu sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">Jadwal shift wajib</h2>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 sm:text-xs">
                    Tidak ada mode transisi. Pegawai shift yang belum dijadwalkan
                    tidak dapat absen dan tidak akan dibuatkan Alfa. Pastikan
                    jadwal sudah lengkap sebelum periode berjalan.
                  </p>
                </div>
                <Badge variant="info">Terkunci</Badge>
              </div>
              <Link
                to="/superadmin-portal/jadwal-shift"
                className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-sky-200 bg-white px-3 text-[12px] font-bold text-sky-700 hover:bg-sky-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
              >
                Buka Jadwal Shift
                <span aria-hidden="true">→</span>
              </Link>
            </section>

            <form onSubmit={simpan} className="space-y-4">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-kartu sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-800">Alfa Otomatis</h2>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
                      Alfa dibuat setelah jam kerja pegawai berakhir, termasuk
                      shift malam setelah jam shiftnya berakhir keesokan harinya.
                    </p>
                  </div>
                  <Badge variant={pengaturan.alfaOtomatis ? 'sukses' : 'netral'}>
                    {pengaturan.alfaOtomatis ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>

                <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 accent-sky-600"
                    checked={pengaturan.alfaOtomatis}
                    onChange={(e) =>
                      setPengaturan((l) => ({
                        ...l,
                        alfaOtomatis: e.target.checked,
                      }))
                    }
                  />
                  <span>
                    <span className="block text-[13px] font-semibold text-slate-800">
                      Aktifkan pembuatan Alfa otomatis
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                      Gunakan tanggal mulai agar presensi sebelum masa penerapan tidak
                      ikut ditandai Alfa.
                    </span>
                  </span>
                </label>

                <div className="mt-3">
                  <label className="label-input" htmlFor="alfa-mulai">
                    Alfa berlaku mulai
                  </label>
                  <input
                    id="alfa-mulai"
                    type="date"
                    className="input-dasar"
                    value={pengaturan.alfaMulai}
                    onChange={(e) =>
                      setPengaturan((l) => ({ ...l, alfaMulai: e.target.value }))
                    }
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    Wajib diisi sebelum Alfa diaktifkan. Tanggal sebelum ini tidak
                    akan ditandai Alfa.
                  </p>
                </div>
              </section>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[11px] text-slate-400">
                  {diperbaruiPada
                    ? `Terakhir diperbarui ${formatJam(diperbaruiPada)}`
                    : 'Belum pernah diperbarui'}
                </p>
                <Button type="submit" disabled={menyimpan} className="w-full sm:w-auto">
                  {menyimpan ? 'Menyimpan…' : 'Simpan Pengaturan'}
                </Button>
              </div>
            </form>
          </div>

          <section className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-kartu sm:p-5">
            <h2 className="text-sm font-bold text-slate-800">Jalankan Alfa Manual</h2>
            <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500 sm:text-xs">
              Berguna untuk mengisi data yang terlewat. Proses hanya berjalan bila
              Alfa otomatis aktif dan tanggal sudah melewati jam kerja.
            </p>

            {!pengaturan.alfaOtomatis && (
              <Alert variant="peringatan" className="mt-3">
                Aktifkan “Alfa otomatis” lalu simpan sebelum menjalankan proses manual.
              </Alert>
            )}

            {hasilAlfa && (
              <Alert variant="info" className="mt-3">
                {hasilAlfa}
              </Alert>
            )}

            <div className="mt-4">
              <label className="label-input" htmlFor="alfa-tanggal">
                Tanggal proses
              </label>
              <input
                id="alfa-tanggal"
                type="date"
                className="input-dasar"
                value={tanggalAlfa}
                onChange={(e) => setTanggalAlfa(e.target.value)}
              />
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Button
                variant="sekunder"
                onClick={() => prosesAlfa(tanggalAlfa)}
                disabled={!pengaturan.alfaOtomatis || menjalankan || !tanggalAlfa}
              >
                {menjalankan ? 'Memproses…' : 'Proses tanggal'}
              </Button>
              <Button
                onClick={() => prosesAlfa(null)}
                disabled={!pengaturan.alfaOtomatis || menjalankan}
              >
                {menjalankan ? 'Memproses…' : 'Hari ini & kemarin'}
              </Button>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                Agar berjalan otomatis
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                Aktifkan Supabase Cron, lalu jalankan file{' '}
                <code className="rounded bg-white px-1 py-0.5 text-[10px] text-slate-700 ring-1 ring-slate-200">
                  supabase/jadwal_alfa.sql
                </code>
                . Cron memanggil fungsi setiap 15 menit dan tidak akan menggandakan
                data Alfa.
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  )
}
