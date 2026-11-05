/**
 * Form pengaduan absen masuk / pulang. Foto bukti wajib dan dikompres
 * sebelum unggah.
 */
import { useEffect, useState } from 'react'
import {
  formatJam,
  formatJamInput,
  formatTanggalRingkas,
  gabungTanggalJam,
} from '../../utils/format.js'
import { susunWaktuPengaduan } from '../../utils/pengaduan.js'
import {
  ajukanPengaduan,
  hapusDokumenPengaduan,
  unggahDokumenPengaduan,
} from '../../services/pengaduanService.js'
import { Alert, Button } from '../ui/index.js'

const jamPendek = (nilai) => (nilai ? String(nilai).slice(0, 5) : '—')

export default function FormPengaduan({ presensi, userId, onBatal, onSelesai }) {
  const jenisMasuk = presensi.jenis === 'masuk'
  const koreksiMasuk = jenisMasuk && Boolean(presensi.jam_masuk)
  const labelJam = jenisMasuk ? 'Jam masuk' : 'Jam pulang'
  const jamTercatat = koreksiMasuk ? formatJamInput(presensi.jam_masuk) : ''
  const [jam, setJam] = useState('')
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

    if (!jam) {
      setGalat(`${labelJam} wajib diisi.`)
      return
    }
    if (koreksiMasuk && jam >= jamTercatat) {
      setGalat(
        `Jam masuk harus lebih awal dari jam tercatat (${formatJam(
          presensi.jam_masuk,
        )}).`,
      )
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

    const jamIso = jenisMasuk
      ? gabungTanggalJam(presensi.tanggal, jam)
      : susunWaktuPengaduan({
          tanggal: presensi.tanggal,
          jamMasuk: formatJamInput(presensi.jam_masuk),
          jamPulang: jam,
        }).jamPulangIso

    if (!jamIso) {
      setGalat(`${labelJam} tidak valid.`)
      return
    }
    if (new Date(jamIso).getTime() > Date.now()) {
      setGalat(`${labelJam} tidak boleh melewati waktu sekarang.`)
      return
    }

    setMenyimpan(true)
    let path = null
    try {
      const unggah = await unggahDokumenPengaduan({ userId, file: berkas })
      path = unggah.path
      await ajukanPengaduan({
        jenis: presensi.jenis,
        tanggal: presensi.tanggal,
        jam: jamIso,
        alasan: alasan.trim(),
        dokumenPath: path,
      })
      onSelesai?.(
        jenisMasuk
          ? koreksiMasuk
            ? 'Pengaduan koreksi jam masuk terkirim dan menunggu persetujuan Kepala Unit.'
            : 'Pengaduan absen masuk terkirim dan menunggu persetujuan Kepala Unit.'
          : 'Pengaduan absen pulang terkirim dan menunggu persetujuan Kepala Unit.',
      )
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
          {jenisMasuk
            ? koreksiMasuk
              ? `Koreksi jam masuk · tercatat ${formatJam(presensi.jam_masuk)}`
              : `Absen masuk · ${presensi.nama_shift ?? 'Reguler'} ${jamPendek(
                  presensi.jam_mulai,
                )}–${jamPendek(presensi.jam_selesai)}`
            : `Absen pulang · masuk ${formatJam(presensi.jam_masuk)}${
                presensi.status_kehadiran ? ` · ${presensi.status_kehadiran}` : ''
              }`}
        </p>
      </div>

      <div>
        <label className="label-input" htmlFor="pengaduan-jam">
          {jenisMasuk ? 'Jam Masuk Sebenarnya' : 'Jam Pulang Seharusnya'}
        </label>
        <input
          id="pengaduan-jam"
          type="time"
          className="input-dasar"
          value={jam}
          onChange={(event) => setJam(event.target.value)}
          required
        />
        <p className="mt-1 text-[11px] text-slate-500">
          {jenisMasuk
            ? koreksiMasuk
              ? `Harus lebih awal dari jam tercatat (${formatJam(
                  presensi.jam_masuk,
                )}).`
              : 'Isi jam saat Anda benar-benar masuk.'
            : 'Waktu Anda selesai bertugas. Shift malam dihitung H+1.'}
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
          Minimal 10 karakter.
        </p>
      </div>

      <div>
        <span className="label-input">Foto Bukti (wajib)</span>
        <label
          htmlFor="pengaduan-foto"
          className="flex min-h-[44px] cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 transition-colors hover:border-sky-400 hover:bg-sky-50"
        >
          <span className="flex min-w-0 items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5 shrink-0 text-slate-400"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span className="truncate">{berkas ? berkas.name : 'Pilih foto'}</span>
          </span>
          <span className="shrink-0 text-xs font-semibold text-sky-700">
            {berkas ? 'Ganti' : 'Pilih'}
          </span>
        </label>
        <input
          id="pengaduan-foto"
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only"
          onChange={(event) => setBerkas(event.target.files?.[0] ?? null)}
          required
        />
        <p className="mt-1 text-[11px] text-slate-500">
          JPG/PNG, otomatis dikompres hingga maks. 1 MB.
        </p>
        {pratinjau && (
          <img
            src={pratinjau}
            alt="Pratinjau foto bukti"
            className="mt-2 max-h-44 w-full rounded-xl border border-slate-200 object-contain"
          />
        )}
      </div>

      <div className="aksi-modal">
        <Button
          type="button"
          variant="sekunder"
          onClick={onBatal}
          disabled={menyimpan}
        >
          Batal
        </Button>
        <Button type="submit" disabled={menyimpan}>
          {menyimpan ? 'Mengirim...' : 'Kirim Pengaduan'}
        </Button>
      </div>
    </form>
  )
}
