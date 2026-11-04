/**
 * Form pengaduan absen pulang. Foto bukti wajib dan dikompres sebelum unggah.
 */
import { useEffect, useState } from 'react'
import {
  formatJam,
  formatJamInput,
  formatTanggalRingkas,
} from '../../utils/format.js'
import { susunWaktuPengaduan } from '../../utils/pengaduan.js'
import {
  ajukanPengaduan,
  hapusDokumenPengaduan,
  unggahDokumenPengaduan,
} from '../../services/pengaduanService.js'
import { Alert, Button } from '../ui/index.js'

export default function FormPengaduan({ presensi, userId, onBatal, onSelesai }) {
  const [jamPulang, setJamPulang] = useState('')
  const [alasan, setAlasan] = useState('')
  const [berkas, setBerkas] = useState(null)
  const [pratinjau, setPratinjau] = useState('')
  const [menyimpan, setMenyimpan] = useState(false)
  const [galat, setGalat] = useState(null)

  useEffect(() => {
    if (!berkas) {
      setPratinjau('')
      return undefined
    }
    const url = URL.createObjectURL(berkas)
    setPratinjau(url)
    return () => URL.revokeObjectURL(url)
  }, [berkas])

  const simpan = async (event) => {
    event.preventDefault()
    setGalat(null)

    if (!jamPulang) {
      setGalat('Jam pulang wajib diisi.')
      return
    }
    if (alasan.trim().length < 10) {
      setGalat('Alasan pengaduan wajib diisi minimal 10 karakter.')
      return
    }
    if (!berkas) {
      setGalat('Foto bukti wajib dipilih.')
      return
    }

    const { jamPulangIso } = susunWaktuPengaduan({
      tanggal: presensi.tanggal,
      jamMasuk: formatJamInput(presensi.jam_masuk),
      jamPulang,
    })

    if (!jamPulangIso) {
      setGalat('Jam pulang tidak valid.')
      return
    }
    if (new Date(jamPulangIso).getTime() > Date.now()) {
      setGalat('Jam pulang tidak boleh melewati waktu sekarang.')
      return
    }

    setMenyimpan(true)
    let path = null
    try {
      const unggah = await unggahDokumenPengaduan({ userId, file: berkas })
      path = unggah.path
      await ajukanPengaduan({
        presensiId: presensi.id,
        jamPulang: jamPulangIso,
        alasan: alasan.trim(),
        dokumenPath: path,
      })
      onSelesai?.('Pengaduan terkirim dan menunggu persetujuan Kepala Unit.')
    } catch (err) {
      if (path) await hapusDokumenPengaduan(path)
      setGalat(err.message || 'Gagal mengirim pengaduan.')
      setMenyimpan(false)
    }
  }

  return (
    <form onSubmit={simpan} className="space-y-4">
      {galat && (
        <Alert variant="bahaya" title="Gagal Mengirim">
          {galat}
        </Alert>
      )}

      <div className="rounded-xl bg-slate-50 p-3 text-sm">
        <p className="font-bold text-slate-800">
          {formatTanggalRingkas(presensi.tanggal)}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          Jam masuk {formatJam(presensi.jam_masuk)}
          {presensi.status_kehadiran ? ` · ${presensi.status_kehadiran}` : ''}
        </p>
      </div>

      <div>
        <label className="label-input" htmlFor="pengaduan-jam-pulang">
          Jam Pulang Seharusnya
        </label>
        <input
          id="pengaduan-jam-pulang"
          type="time"
          className="input-dasar"
          value={jamPulang}
          onChange={(event) => setJamPulang(event.target.value)}
          required
        />
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          Isi jam saat Anda benar-benar selesai bertugas. Untuk shift malam,
          tanggal pulang otomatis dihitung H+1.
        </p>
      </div>

      <div>
        <label className="label-input" htmlFor="pengaduan-alasan">
          Alasan
        </label>
        <textarea
          id="pengaduan-alasan"
          className="input-dasar"
          rows={3}
          value={alasan}
          onChange={(event) => setAlasan(event.target.value)}
          placeholder="Contoh: merujuk pasien / observasi pasien"
          required
        />
        <p className="mt-1 text-[11px] text-slate-500">
          Minimal 10 karakter. Jelaskan alasan Anda tidak dapat absen pulang.
        </p>
      </div>

      <div>
        <label className="label-input" htmlFor="pengaduan-foto">
          Foto Bukti (wajib)
        </label>
        <input
          id="pengaduan-foto"
          type="file"
          accept="image/jpeg,image/png"
          className="input-dasar"
          onChange={(event) => setBerkas(event.target.files?.[0] ?? null)}
          required
        />
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
          JPG/PNG, otomatis dikompres hingga maksimal 1 MB.
        </p>
        {pratinjau && (
          <img
            src={pratinjau}
            alt="Pratinjau foto bukti"
            className="mt-2 max-h-44 rounded-xl border border-slate-200 object-contain"
          />
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="sekunder"
          onClick={onBatal}
          disabled={menyimpan}
        >
          Batal
        </Button>
        <Button type="submit" disabled={menyimpan}>
          {menyimpan ? 'Mengirim…' : 'Kirim Pengaduan'}
        </Button>
      </div>
    </form>
  )
}
