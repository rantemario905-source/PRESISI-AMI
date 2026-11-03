/**
 * Form koreksi presensi.
 * State form disimpan di komponen ini agar mengetik alasan tidak memicu
 * render ulang daftar presensi di halaman induk.
 */
import { useMemo, useState } from 'react'
import { simpanKoreksi } from '../../services/correctionService.js'
import {
  formatJam,
  formatJamInput,
  formatTanggal,
  formatTanggalPanjang,
} from '../../utils/format.js'
import { susunWaktuKoreksi } from '../../utils/koreksiPresensi.js'
import { Alert, Button } from '../ui/index.js'

const STATUS = ['Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi']

export default function FormKoreksiPresensi({ baris, onBatal, onSelesai }) {
  const [form, setForm] = useState({
    jamMasuk: formatJamInput(baris.jam_masuk),
    jamPulang: formatJamInput(baris.jam_pulang),
    status: baris.status_kehadiran,
    alasan: '',
  })
  const [menyimpan, setMenyimpan] = useState(false)
  const [galat, setGalat] = useState(null)

  const pratinjau = useMemo(
    () =>
      susunWaktuKoreksi({
        tanggal: baris.tanggal,
        jamMasuk: form.jamMasuk,
        jamPulang: form.jamPulang,
        masukAsli: baris.jam_masuk,
        pulangAsli: baris.jam_pulang,
      }),
    [baris, form.jamMasuk, form.jamPulang],
  )

  const simpan = async (event) => {
    event.preventDefault()
    setGalat(null)

    try {
      if (form.alasan.trim().length < 5) {
        throw new Error('Alasan koreksi wajib diisi minimal 5 karakter.')
      }
      if (form.jamPulang && !form.jamMasuk) {
        throw new Error('Jam pulang tidak boleh diisi jika jam masuk kosong.')
      }

      const { jamMasukIso, jamPulangIso } = susunWaktuKoreksi({
        tanggal: baris.tanggal,
        jamMasuk: form.jamMasuk,
        jamPulang: form.jamPulang,
        masukAsli: baris.jam_masuk,
        pulangAsli: baris.jam_pulang,
      })

      setMenyimpan(true)
      await simpanKoreksi({
        presensiId: baris.id,
        jamMasuk: jamMasukIso,
        jamPulang: jamPulangIso,
        status: form.status,
        alasan: form.alasan.trim(),
      })
      onSelesai?.('Koreksi presensi tersimpan dan tercatat pada audit trail.')
    } catch (err) {
      setGalat(err.message || 'Gagal menyimpan koreksi.')
      setMenyimpan(false)
    }
  }

  return (
    <form onSubmit={simpan} className="space-y-4">
      {galat && (
        <Alert variant="bahaya" title="Gagal Menyimpan">
          {galat}
        </Alert>
      )}

      <div className="rounded-xl bg-slate-50 p-3 text-sm">
        <p className="font-bold text-slate-800">{baris.pegawai?.nama}</p>
        <p className="text-xs text-slate-500">
          {formatTanggal(baris.tanggal)} · {baris.pegawai?.unit_kerja}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="label-input" htmlFor="koreksi-masuk">
            Jam Masuk
          </label>
          <input
            id="koreksi-masuk"
            type="time"
            className="input-dasar"
            value={form.jamMasuk}
            onChange={(e) => setForm((l) => ({ ...l, jamMasuk: e.target.value }))}
          />
        </div>
        <div>
          <label className="label-input" htmlFor="koreksi-pulang">
            Jam Pulang
          </label>
          <input
            id="koreksi-pulang"
            type="time"
            className="input-dasar"
            value={form.jamPulang}
            onChange={(e) => setForm((l) => ({ ...l, jamPulang: e.target.value }))}
          />
        </div>
      </div>

      {pratinjau && (pratinjau.jamMasukIso || pratinjau.jamPulangIso) && (
        <div className="rounded-xl border border-sky-100 bg-sky-50/70 px-3 py-2.5 text-[11px] leading-relaxed text-sky-900">
          {pratinjau.jamMasukIso && (
            <p>
              Masuk:{' '}
              <span className="font-semibold">
                {formatTanggalPanjang(pratinjau.jamMasukIso)},{' '}
                {formatJam(pratinjau.jamMasukIso)}
              </span>
            </p>
          )}
          {pratinjau.jamPulangIso && (
            <p>
              Pulang:{' '}
              <span className="font-semibold">
                {formatTanggalPanjang(pratinjau.jamPulangIso)},{' '}
                {formatJam(pratinjau.jamPulangIso)}
              </span>
            </p>
          )}
          {pratinjau.pulangLintasHari && (
            <p className="mt-1 font-medium text-sky-800">
              Jam pulang otomatis dihitung H+1 karena shift malam.
            </p>
          )}
        </div>
      )}

      <div>
        <label className="label-input" htmlFor="koreksi-status">
          Status Kehadiran
        </label>
        <select
          id="koreksi-status"
          className="input-dasar"
          value={form.status}
          onChange={(e) => setForm((l) => ({ ...l, status: e.target.value }))}
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label-input" htmlFor="koreksi-alasan">
          Alasan Koreksi <span className="text-red-600">*</span>
        </label>
        <textarea
          id="koreksi-alasan"
          className="input-dasar min-h-[90px]"
          placeholder="Contoh: pegawai lupa absen pulang karena pergantian shift."
          value={form.alasan}
          onChange={(e) => setForm((l) => ({ ...l, alasan: e.target.value }))}
          required
        />
        <p className="mt-1 text-[11px] text-slate-400">
          Minimal 5 karakter. Alasan akan tersimpan permanen di audit trail.
        </p>
      </div>

      <div className="aksi-modal">
        <Button variant="sekunder" onClick={onBatal}>
          Batal
        </Button>
        <Button type="submit" disabled={menyimpan}>
          {menyimpan ? 'Menyimpan…' : 'Simpan Koreksi'}
        </Button>
      </div>
    </form>
  )
}
