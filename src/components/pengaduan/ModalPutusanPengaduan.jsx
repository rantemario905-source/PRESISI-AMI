/**
 * Modal keputusan kepala unit: setujui (jam pulang boleh disesuaikan) atau
 * tolak dengan catatan wajib.
 */
import { useState } from 'react'
import {
  formatJam,
  formatJamInput,
  formatTanggalRingkas,
  gabungTanggalJam,
} from '../../utils/format.js'
import { susunWaktuPengaduan } from '../../utils/pengaduan.js'
import {
  ambilDokumenPengaduanUrl,
  putuskanPengaduan,
} from '../../services/pengaduanService.js'
import { Alert, Button, Modal } from '../ui/index.js'

export default function ModalPutusanPengaduan({ baris, onTutup, onSelesai }) {
  const jenisMasuk = baris.jenis === 'masuk'
  const koreksiMasuk = jenisMasuk && Boolean(baris.jam_masuk)
  const jamTercatat = koreksiMasuk ? formatJamInput(baris.jam_masuk) : ''
  const [jam, setJam] = useState(() =>
    formatJamInput(
      jenisMasuk ? baris.jam_masuk_diajukan : baris.jam_pulang_diajukan,
    ),
  )
  const [catatan, setCatatan] = useState('')
  const [memproses, setMemproses] = useState(false)
  const [galat, setGalat] = useState(null)

  const lihatFoto = async () => {
    if (!baris.dokumen_path) return
    const jendela = window.open('about:blank', '_blank')
    if (jendela) jendela.opener = null
    setGalat(null)
    try {
      const url = await ambilDokumenPengaduanUrl(baris.dokumen_path)
      if (!url) throw new Error('Foto bukti tidak tersedia.')
      if (jendela) jendela.location.replace(url)
      else window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      if (jendela) jendela.close()
      setGalat(err.message || 'Gagal membuka foto bukti.')
    }
  }

  const putuskan = async (setuju) => {
    setGalat(null)

    if (!setuju && catatan.trim().length < 5) {
      setGalat('Catatan penolakan wajib diisi minimal 5 karakter.')
      return
    }

    const labelJam = jenisMasuk ? 'Jam masuk' : 'Jam pulang'
    let jamIso = null
    if (setuju) {
      if (!jam) {
        setGalat(`${labelJam} wajib diisi.`)
        return
      }
      if (koreksiMasuk && jam >= jamTercatat) {
        setGalat(
          `Jam masuk harus lebih awal dari jam tercatat (${formatJam(
            baris.jam_masuk,
          )}).`,
        )
        return
      }
      jamIso = jenisMasuk
        ? gabungTanggalJam(baris.tanggal, jam)
        : susunWaktuPengaduan({
            tanggal: baris.tanggal,
            jamMasuk: formatJamInput(baris.jam_masuk),
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
    }

    setMemproses(true)
    try {
      const hasil = await putuskanPengaduan({
        id: baris.id,
        setuju,
        jamMasuk: jenisMasuk ? jamIso : null,
        jamPulang: jenisMasuk ? null : jamIso,
        catatan: catatan.trim() || null,
      })
      onSelesai?.(hasil?.pesan ?? 'Pengaduan berhasil diputuskan.')
    } catch (err) {
      setGalat(err.message || 'Gagal memproses pengaduan.')
      setMemproses(false)
    }
  }

  return (
    <Modal terbuka onTutup={onTutup} judul="Tinjau Pengaduan">
      <div className="space-y-4">
        {galat && (
          <Alert variant="bahaya" title="Gagal">
            {galat}
          </Alert>
        )}

        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="font-bold text-slate-800">{baris.pegawai_nama}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {baris.unit_kerja} · {formatTanggalRingkas(baris.tanggal)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            {jenisMasuk
              ? koreksiMasuk
                ? `Koreksi jam masuk · tercatat ${formatJam(
                    baris.jam_masuk,
                  )} · diajukan ${formatJam(baris.jam_masuk_diajukan)}`
                : `Pengaduan absen masuk · diajukan ${formatJam(
                    baris.jam_masuk_diajukan,
                  )}`
              : `Pengaduan absen pulang · masuk ${formatJam(
                  baris.jam_masuk,
                )} · diajukan ${formatJam(baris.jam_pulang_diajukan)}`}
          </p>
        </div>

        <div>
          <p className="label-input">Alasan Pegawai</p>
          <p className="rounded-xl border border-slate-200 px-3 py-2.5 text-[13px] leading-relaxed text-slate-700">
            {baris.alasan}
          </p>
        </div>

        {baris.dokumen_path && (
          <Button type="button" variant="sekunder" size="sm" onClick={lihatFoto}>
            Lihat Foto Bukti
          </Button>
        )}

        <div>
          <label className="label-input" htmlFor="putusan-jam">
            {jenisMasuk ? 'Jam Masuk Disetujui' : 'Jam Pulang Disetujui'}
          </label>
          <input
            id="putusan-jam"
            type="time"
            className="input-dasar"
            value={jam}
            onChange={(event) => setJam(event.target.value)}
          />
          <p className="mt-1 text-[11px] text-slate-500">
            {jenisMasuk
              ? koreksiMasuk
                ? `Harus lebih awal dari jam tercatat (${formatJam(
                    baris.jam_masuk,
                  )}).`
                : 'Boleh disesuaikan sebelum disetujui.'
              : 'Boleh disesuaikan sebelum disetujui. Shift malam otomatis H+1.'}
          </p>
        </div>

        <div>
          <label className="label-input" htmlFor="putusan-catatan">
            Catatan
          </label>
          <textarea
            id="putusan-catatan"
            className="input-dasar"
            rows={2}
            value={catatan}
            onChange={(event) => setCatatan(event.target.value)}
            placeholder="Wajib diisi bila menolak pengaduan"
          />
        </div>

        <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="sekunder"
            onClick={onTutup}
            disabled={memproses}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="bahayaLembut"
            onClick={() => putuskan(false)}
            disabled={memproses}
          >
            {memproses ? 'Memproses…' : 'Tolak'}
          </Button>
          <Button
            type="button"
            onClick={() => putuskan(true)}
            disabled={memproses}
          >
            {memproses ? 'Memproses…' : 'Setujui'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
