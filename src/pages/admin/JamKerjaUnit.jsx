/**
 * ==========================================================================
 * Super Admin — Jam Kerja Unit
 * --------------------------------------------------------------------------
 * Mengatur jam kerja reguler khusus per unit. Unit tanpa pengaturan khusus
 * memakai jam kerja global (Senin-Jumat 08.00-16.30/16.00).
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { ambilGrupShift } from '../../services/groupShiftService.js'
import {
  ambilJamKerjaUnit,
  hapusJamKerjaUnit,
  simpanJamKerjaUnit,
} from '../../services/jamKerjaService.js'
import { Alert, Badge, Button, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

export default function JamKerjaUnit() {
  const [daftarUnit, setDaftarUnit] = useState([])
  const [unit, setUnit] = useState('')
  const [baris, setBaris] = useState([])
  const [khusus, setKhusus] = useState(false)
  const [memuatUnit, setMemuatUnit] = useState(true)
  const [memuat, setMemuat] = useState(false)
  const [menyimpan, setMenyimpan] = useState(false)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)

  useEffect(() => {
    let aktif = true
    ;(async () => {
      try {
        const data = await ambilGrupShift()
        if (!aktif) return
        setDaftarUnit(data)
        const awal =
          data.find((grup) => grup.nama === 'ADMISI RAWAT JALAN')?.nama ??
          data[0]?.nama ??
          ''
        setUnit(awal)
      } catch (err) {
        if (aktif) setGalat(err.message || 'Gagal memuat daftar unit.')
      } finally {
        if (aktif) setMemuatUnit(false)
      }
    })()
    return () => {
      aktif = false
    }
  }, [])

  const muat = useCallback(async (namaUnit) => {
    if (!namaUnit) {
      setBaris([])
      return
    }
    setMemuat(true)
    setGalat(null)
    try {
      const hasil = await ambilJamKerjaUnit(namaUnit)
      setBaris(hasil.baris)
      setKhusus(hasil.khusus)
    } catch (err) {
      setBaris([])
      setGalat(err.message || 'Gagal memuat jam kerja unit.')
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    setPesan(null)
    muat(unit)
  }, [unit, muat])

  function ubahBaris(hari, perubahan) {
    setBaris((lama) =>
      lama.map((item) =>
        item.hari === hari ? { ...item, ...perubahan } : item,
      ),
    )
  }

  async function simpan() {
    setGalat(null)
    setPesan(null)
    try {
      for (const item of baris) {
        if (item.libur) continue
        if (!item.jam_mulai || !item.jam_selesai) {
          throw new Error(`Lengkapi jam kerja hari ${item.nama_hari}.`)
        }
        if (item.jam_mulai >= item.jam_selesai) {
          throw new Error(
            `Jam selesai hari ${item.nama_hari} harus setelah jam mulai.`,
          )
        }
      }

      setMenyimpan(true)
      await simpanJamKerjaUnit(unit, baris)
      setPesan(`Jam kerja unit ${unit} berhasil disimpan.`)
      await muat(unit)
    } catch (err) {
      setGalat(err.message || 'Gagal menyimpan jam kerja unit.')
    } finally {
      setMenyimpan(false)
    }
  }

  async function kembalikanGlobal() {
    if (
      !window.confirm(
        `Kembalikan jam kerja ${unit} ke pengaturan global? Pengaturan khusus unit ini akan dihapus.`,
      )
    ) {
      return
    }
    setGalat(null)
    setPesan(null)
    try {
      setMenyimpan(true)
      await hapusJamKerjaUnit(unit)
      setPesan(`Jam kerja ${unit} kembali mengikuti pengaturan global.`)
      await muat(unit)
    } catch (err) {
      setGalat(err.message || 'Gagal mengembalikan jam kerja global.')
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <>
      <KepalaHalaman
        judul="Jam Kerja Unit"
        deskripsi="Atur jam kerja reguler khusus per unit. Unit yang tidak diatur di sini otomatis memakai jam kerja global. Pegawai pola Shift tetap mengikuti jadwal shift."
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

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0 flex-1 sm:max-w-sm">
            <label className="label-input" htmlFor="unit-jam-kerja">
              Unit Kerja
            </label>
            {memuatUnit ? (
              <div className="flex min-h-[44px] items-center gap-2 text-sm text-slate-500">
                <Spinner /> Memuat unit…
              </div>
            ) : (
              <select
                id="unit-jam-kerja"
                className="input-dasar"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {daftarUnit.map((grup) => (
                  <option key={grup.nama} value={grup.nama}>
                    {grup.nama}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={khusus ? 'info' : 'netral'}>
              {khusus ? 'Khusus unit' : 'Mengikuti global'}
            </Badge>
            <Button
              size="sm"
              variant="sekunder"
              onClick={kembalikanGlobal}
              disabled={!khusus || menyimpan || !unit}
            >
              Kembalikan ke Global
            </Button>
            <Button
              size="sm"
              onClick={simpan}
              disabled={menyimpan || memuat || !baris.length}
            >
              {menyimpan ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </div>

        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat jam kerja…
          </div>
        ) : !daftarUnit.length ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Belum ada unit kerja. Tambahkan melalui menu Grup Shift.
          </div>
        ) : (
          <>
            <div className="border-b border-slate-100 bg-sky-50/60 px-4 py-2.5 text-[11px] leading-relaxed text-slate-600 sm:px-5 sm:text-xs">
              Jam ini berlaku untuk pegawai <strong>Reguler</strong> di unit{' '}
              <strong>{unit || '—'}</strong>. Jam masuk, batas absen pulang, dan
              Alfa otomatis mengikuti pengaturan ini.
            </div>

            <div className="divide-y divide-slate-100">
              {baris.map((item) => (
                <div
                  key={item.hari}
                  className="grid grid-cols-2 items-center gap-2 px-4 py-3 sm:grid-cols-[120px_1fr_1fr_130px] sm:px-5"
                >
                  <div className="col-span-2 flex items-center justify-between gap-2 sm:col-span-1 sm:justify-start">
                    <span className="text-sm font-semibold text-slate-800">
                      {item.nama_hari}
                    </span>
                    {item.khusus && <Badge variant="info">Khusus</Badge>}
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-slate-500 sm:hidden">
                      Jam masuk
                    </span>
                    <input
                      type="time"
                      className="input-dasar"
                      value={item.jam_mulai}
                      disabled={item.libur || menyimpan}
                      aria-label={`Jam masuk ${item.nama_hari}`}
                      onChange={(e) =>
                        ubahBaris(item.hari, { jam_mulai: e.target.value })
                      }
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-[11px] font-medium text-slate-500 sm:hidden">
                      Jam selesai
                    </span>
                    <input
                      type="time"
                      className="input-dasar"
                      value={item.jam_selesai}
                      disabled={item.libur || menyimpan}
                      aria-label={`Jam selesai ${item.nama_hari}`}
                      onChange={(e) =>
                        ubahBaris(item.hari, { jam_selesai: e.target.value })
                      }
                    />
                  </label>

                  <label className="col-span-2 flex min-h-[44px] cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 sm:col-span-1 sm:min-h-[36px]">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      checked={item.libur}
                      disabled={menyimpan}
                      onChange={(e) =>
                        ubahBaris(item.hari, { libur: e.target.checked })
                      }
                    />
                    <span className="text-sm font-medium text-slate-700">Libur</span>
                  </label>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 px-4 py-3 text-[11px] leading-relaxed text-slate-500 sm:px-5 sm:text-xs">
              Contoh: unit ADMISI RAWAT JALAN diatur Senin–Jumat 07.00–15.00 dan
              Sabtu–Minggu libur. Jam kerja global tetap 08.00–16.30 (Jumat
              08.00–16.00).
            </div>
          </>
        )}
      </section>
    </>
  )
}
