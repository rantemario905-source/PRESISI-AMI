/**
 * ==========================================================================
 * Super Admin — Pengajuan Izin / Cuti / Sakit / Dinas Luar
 * --------------------------------------------------------------------------
 * Admin dapat mencatat surat atas nama pegawai dan memproses persetujuan.
 * Persetujuan otomatis menandai presensi pada rentang tanggal terkait.
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import {
  ambilDaftarIzin,
  catatIzin,
  putuskanIzin,
} from '../../services/leaveService.js'
import { ambilSemuaPegawai } from '../../services/pegawaiService.js'
import { formatTanggalRingkas, hariIni } from '../../utils/format.js'
import { labelStatusIzin, varianStatusIzin } from '../../utils/status.js'
import { Alert, Badge, Button, Modal, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const JENIS = ['Izin', 'Sakit', 'Cuti', 'Dinas Luar']
const TAB = [
  { nilai: 'semua', label: 'Semua' },
  { nilai: 'menunggu', label: 'Menunggu' },
  { nilai: 'disetujui', label: 'Disetujui' },
  { nilai: 'ditolak', label: 'Ditolak' },
]

const FORM_KOSONG = {
  userId: '',
  jenis: 'Izin',
  tanggalMulai: hariIni(),
  tanggalSelesai: hariIni(),
  alasan: '',
}

export default function PengajuanIzin() {
  const [tab, setTab] = useState('semua')
  const [daftar, setDaftar] = useState([])
  const [pegawai, setPegawai] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [menyimpan, setMenyimpan] = useState(false)

  const [modalCatat, setModalCatat] = useState(false)
  const [form, setForm] = useState(FORM_KOSONG)

  const [aksi, setAksi] = useState(null) // { baris, status: 'disetujui'|'ditolak' }
  const [catatan, setCatatan] = useState('')

  const muat = useCallback(async (status = tab) => {
    setMemuat(true)
    try {
      const data = await ambilDaftarIzin(status)
      setDaftar(data)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat data izin/cuti.')
    } finally {
      setMemuat(false)
    }
  }, [tab])

  useEffect(() => {
    muat(tab)
  }, [tab, muat])

  useEffect(() => {
    ambilSemuaPegawai()
      .then((data) => {
        setPegawai(data)
        setForm((l) => ({ ...l, userId: l.userId || data[0]?.id || '' }))
      })
      .catch(() => setPegawai([]))
  }, [])

  const bukaCatat = () => {
    setForm({ ...FORM_KOSONG, userId: pegawai[0]?.id ?? '' })
    setModalCatat(true)
  }

  const simpanCatat = async (event) => {
    event.preventDefault()
    setGalat(null)
    setPesan(null)
    setMenyimpan(true)
    try {
      if (!form.userId) throw new Error('Pilih pegawai terlebih dahulu.')
      if (form.tanggalSelesai < form.tanggalMulai) {
        throw new Error('Tanggal selesai tidak boleh sebelum tanggal mulai.')
      }
      if (form.alasan.trim().length < 5) throw new Error('Alasan wajib diisi minimal 5 karakter.')

      await catatIzin({
        userId: form.userId,
        jenis: form.jenis,
        tanggalMulai: form.tanggalMulai,
        tanggalSelesai: form.tanggalSelesai,
        alasan: form.alasan,
      })
      setModalCatat(false)
      setPesan('Surat izin berhasil dicatat dengan status menunggu.')
      setTab('menunggu')
      await muat('menunggu')
    } catch (err) {
      setGalat(err.message || 'Gagal mencatat surat izin.')
    } finally {
      setMenyimpan(false)
    }
  }

  const bukaAksi = (baris, status) => {
    setCatatan('')
    setAksi({ baris, status })
  }

  const kirimAksi = async () => {
    if (!aksi) return
    const { baris, status } = aksi
    setAksi(null)
    setGalat(null)
    setPesan(null)
    try {
      await putuskanIzin({ id: baris.id, status, catatan })
      setPesan(
        status === 'disetujui'
          ? 'Pengajuan disetujui. Presensi pada rentang tanggal terkait telah ditandai.'
          : 'Pengajuan ditolak.',
      )
      await muat(tab)
    } catch (err) {
      setGalat(err.message || 'Gagal memproses pengajuan.')
    }
  }

  return (
    <>
      <KepalaHalaman
        judul="Pengajuan Izin / Cuti / Dinas Luar"
        deskripsi="Catat surat pegawai dan proses persetujuannya."
        aksi={
          <>
            <Button variant="sekunder" size="sm" onClick={() => muat(tab)} disabled={memuat}>
              Muat ulang
            </Button>
            <Button size="sm" onClick={bukaCatat}>
              + Catat Surat
            </Button>
          </>
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

      <div className="mb-4 flex flex-wrap gap-2">
        {TAB.map((item) => (
          <button
            key={item.nilai}
            type="button"
            onClick={() => setTab(item.nilai)}
            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
              tab === item.nilai
                ? 'bg-sky-600 text-white shadow-sm'
                : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat pengajuan…
          </div>
        ) : daftar.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-500">
            Belum ada pengajuan pada kategori ini.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Pegawai</th>
                  <th className="px-5 py-3 font-semibold">Jenis</th>
                  <th className="px-5 py-3 font-semibold">Periode</th>
                  <th className="px-5 py-3 font-semibold">Alasan</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {daftar.map((baris) => (
                  <tr key={baris.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{baris.pegawai?.nama ?? '—'}</p>
                      <p className="text-xs text-slate-500">{baris.pegawai?.unit_kerja ?? '—'}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant="info">{baris.jenis}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                      {formatTanggalRingkas(baris.tanggal_mulai)}
                      <br />
                      s.d. {formatTanggalRingkas(baris.tanggal_selesai)}
                    </td>
                    <td className="max-w-[240px] px-5 py-3 text-xs text-slate-600">
                      {baris.alasan}
                      {baris.catatan_admin && (
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                          Catatan admin: {baris.catatan_admin}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={varianStatusIzin(baris.status)}>
                        {labelStatusIzin(baris.status)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {baris.status === 'menunggu' ? (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="sukses" onClick={() => bukaAksi(baris, 'disetujui')}>
                            Setujui
                          </Button>
                          <Button size="sm" variant="bahayaLembut" onClick={() => bukaAksi(baris, 'ditolak')}>
                            Tolak
                          </Button>
                        </div>
                      ) : (
                        <p className="text-right text-xs text-slate-400">Selesai diproses</p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal catat surat */}
      <Modal terbuka={modalCatat} onTutup={() => setModalCatat(false)} judul="Catat Surat Izin / Cuti">
        <form onSubmit={simpanCatat} className="space-y-4">
          <div>
            <label className="label-input" htmlFor="izin-pegawai">
              Pegawai
            </label>
            <select
              id="izin-pegawai"
              className="input-dasar"
              value={form.userId}
              onChange={(e) => setForm((l) => ({ ...l, userId: e.target.value }))}
              required
            >
              <option value="">— pilih pegawai —</option>
              {pegawai.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama} — {p.unit_kerja}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-input" htmlFor="izin-jenis">
              Jenis
            </label>
            <select
              id="izin-jenis"
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-input" htmlFor="izin-mulai">
                Tanggal Mulai
              </label>
              <input
                id="izin-mulai"
                type="date"
                className="input-dasar"
                value={form.tanggalMulai}
                onChange={(e) => setForm((l) => ({ ...l, tanggalMulai: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label-input" htmlFor="izin-selesai">
                Tanggal Selesai
              </label>
              <input
                id="izin-selesai"
                type="date"
                className="input-dasar"
                value={form.tanggalSelesai}
                onChange={(e) => setForm((l) => ({ ...l, tanggalSelesai: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="label-input" htmlFor="izin-alasan">
              Alasan / Keterangan
            </label>
            <textarea
              id="izin-alasan"
              className="input-dasar min-h-[90px]"
              placeholder="Contoh: cuti tahunan, surat dokter, tugas dinas luar kota."
              value={form.alasan}
              onChange={(e) => setForm((l) => ({ ...l, alasan: e.target.value }))}
              required
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="sekunder" onClick={() => setModalCatat(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={menyimpan}>
              {menyimpan ? 'Menyimpan…' : 'Simpan Surat'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal setujui / tolak */}
      <Modal
        terbuka={Boolean(aksi)}
        onTutup={() => setAksi(null)}
        judul={aksi?.status === 'disetujui' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
      >
        <p className="mb-3 text-sm text-slate-600">
          Pengajuan <strong>{aksi?.baris?.jenis}</strong> atas nama{' '}
          <strong>{aksi?.baris?.pegawai?.nama}</strong> (
          {aksi?.baris ? `${formatTanggalRingkas(aksi.baris.tanggal_mulai)} – ${formatTanggalRingkas(aksi.baris.tanggal_selesai)}` : ''}
          ).
        </p>

        {aksi?.status === 'disetujui' && (
          <Alert variant="info" className="mb-3">
            Presensi pada rentang tanggal tersebut akan otomatis ditandai. Presensi yang sudah memiliki
            jam masuk tidak akan diubah.
          </Alert>
        )}

        <label className="label-input" htmlFor="catatan-aksi">
          Catatan Admin (opsional)
        </label>
        <textarea
          id="catatan-aksi"
          className="input-dasar min-h-[80px]"
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder={
            aksi?.status === 'disetujui'
              ? 'Contoh: disetujui, surat lengkap.'
              : 'Contoh: surat tidak dilampirkan.'
          }
        />

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="sekunder" onClick={() => setAksi(null)}>
            Batal
          </Button>
          <Button variant={aksi?.status === 'disetujui' ? 'sukses' : 'bahaya'} onClick={kirimAksi}>
            {aksi?.status === 'disetujui' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
          </Button>
        </div>
      </Modal>
    </>
  )
}
