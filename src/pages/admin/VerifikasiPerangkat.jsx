/**
 * ==========================================================================
 * Super Admin — Verifikasi & Reset Perangkat
 * --------------------------------------------------------------------------
 * Menyetujui/menolak pengajuan device binding dan mereset perangkat aktif.
 * Kebijakan: tepat 1 perangkat aktif per pegawai (dijaga RPC server).
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import {
  ambilDaftarPerangkat,
  resetPerangkat,
  setujuiPerangkat,
  tolakPerangkat,
} from '../../services/adminDeviceService.js'
import { formatTanggal } from '../../utils/format.js'
import { labelStatusPerangkat, varianStatusPerangkat } from '../../utils/status.js'
import { Alert, Badge, Button, Modal, Spinner, TabBar } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const TAB = [
  { nilai: 'pending', label: 'Menunggu' },
  { nilai: 'approved', label: 'Disetujui' },
  { nilai: 'rejected', label: 'Ditolak' },
  { nilai: 'semua', label: 'Semua' },
]

export default function VerifikasiPerangkat() {
  const [tab, setTab] = useState('pending')
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [diproses, setDiproses] = useState(null)

  const [modalTolak, setModalTolak] = useState(null)
  const [catatanTolak, setCatatanTolak] = useState('')

  const muat = useCallback(async (status = tab) => {
    setMemuat(true)
    try {
      const data = await ambilDaftarPerangkat(status)
      setDaftar(data)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat daftar perangkat.')
    } finally {
      setMemuat(false)
    }
  }, [tab])

  useEffect(() => {
    muat(tab)
  }, [tab, muat])

  const jalankan = async (id, aksi, sukses) => {
    setDiproses(id)
    setGalat(null)
    setPesan(null)
    try {
      await aksi()
      setPesan(sukses)
      await muat(tab)
    } catch (err) {
      setGalat(err.message || 'Aksi gagal diproses.')
    } finally {
      setDiproses(null)
    }
  }

  const setujui = (baris) => {
    if (!window.confirm(`Setujui perangkat atas nama ${baris.pegawai?.nama}?`)) return
    jalankan(baris.id, () => setujuiPerangkat(baris.id), 'Perangkat berhasil disetujui.')
  }

  const reset = (baris) => {
    if (
      !window.confirm(
        `Reset perangkat ${baris.pegawai?.nama}? Perangkat lama tidak dapat dipakai absen lagi dan pegawai dapat mengajukan perangkat baru.`,
      )
    )
      return
    jalankan(baris.id, () => resetPerangkat(baris.user_id), 'Perangkat berhasil direset.')
  }

  const bukaTolak = (baris) => {
    setCatatanTolak('')
    setModalTolak(baris)
  }

  const kirimTolak = () => {
    if (!modalTolak) return
    const id = modalTolak.id
    setModalTolak(null)
    jalankan(id, () => tolakPerangkat(id, catatanTolak), 'Pengajuan perangkat ditolak.')
  }

  const aksiUntuk = (baris) => (
    <>
      {baris.status === 'pending' && (
        <>
          <Button
            size="sm"
            variant="sukses"
            className="flex-1 sm:flex-none"
            onClick={() => setujui(baris)}
            disabled={diproses === baris.id}
          >
            Setujui
          </Button>
          <Button
            size="sm"
            variant="bahayaLembut"
            className="flex-1 sm:flex-none"
            onClick={() => bukaTolak(baris)}
            disabled={diproses === baris.id}
          >
            Tolak
          </Button>
        </>
      )}
      {baris.status === 'approved' && (
        <Button
          size="sm"
          variant="bahayaLembut"
          className="flex-1 sm:flex-none"
          onClick={() => reset(baris)}
          disabled={diproses === baris.id}
        >
          Reset Perangkat
        </Button>
      )}
      {baris.status === 'rejected' && (
        <span className="text-xs text-slate-400">Tidak ada aksi</span>
      )}
    </>
  )

  return (
    <>
      <KepalaHalaman
        judul="Verifikasi & Reset Perangkat"
        deskripsi="Setiap pegawai hanya boleh memiliki satu perangkat aktif. Untuk mengganti perangkat, reset perangkat lama terlebih dahulu, lalu pegawai mengajukan dari perangkat baru."
        aksi={
          <Button variant="sekunder" size="sm" onClick={() => muat(tab)} disabled={memuat}>
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

      <TabBar daftar={TAB} nilai={tab} onChange={setTab} label="Status perangkat" />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat perangkat…
          </div>
        ) : daftar.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-slate-600">Tidak ada data pada kategori ini</p>
            <p className="mt-1 text-xs text-slate-400">Pengajuan pegawai akan muncul di sini.</p>
          </div>
        ) : (
          <>
            {/* HP: kartu perangkat */}
            <div className="divide-y divide-slate-100 md:hidden">
              {daftar.map((baris) => (
                <article key={baris.id} className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-bold text-slate-800">
                        {baris.pegawai?.nama ?? '—'}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {baris.pegawai?.unit_kerja ?? '—'}
                      </p>
                    </div>
                    <Badge variant={varianStatusPerangkat(baris.status)}>
                      {labelStatusPerangkat(baris.status)}
                    </Badge>
                  </div>

                  <dl className="mt-2 space-y-1 text-[11px]">
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-slate-400">Diajukan</dt>
                      <dd className="min-w-0 text-slate-600">{formatTanggal(baris.diajukan_pada)}</dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-slate-400">Perangkat</dt>
                      <dd className="min-w-0 break-words text-slate-600">
                        {baris.info_perangkat || 'Tidak ada informasi'}
                      </dd>
                    </div>
                    <div className="flex gap-2">
                      <dt className="w-16 shrink-0 text-slate-400">Token</dt>
                      <dd className="min-w-0 break-all font-mono text-[10px] text-slate-400">
                        {baris.device_token}
                      </dd>
                    </div>
                    {baris.catatan && (
                      <div className="flex gap-2">
                        <dt className="w-16 shrink-0 text-slate-400">Catatan</dt>
                        <dd className="min-w-0 text-slate-600">{baris.catatan}</dd>
                      </div>
                    )}
                  </dl>

                  <div className="mt-3 flex gap-2">{aksiUntuk(baris)}</div>
                </article>
              ))}
            </div>

            {/* Desktop: tabel */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Pegawai</th>
                    <th className="px-5 py-3 font-semibold">Info Perangkat</th>
                    <th className="px-5 py-3 font-semibold">Diajukan</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Catatan</th>
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
                      <td className="max-w-[260px] px-5 py-3">
                        <p className="truncate text-xs text-slate-600" title={baris.info_perangkat ?? ''}>
                          {baris.info_perangkat || 'Tidak ada informasi'}
                        </p>
                        <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">
                          {baris.device_token}
                        </p>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-600">
                        {formatTanggal(baris.diajukan_pada)}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={varianStatusPerangkat(baris.status)}>
                          {labelStatusPerangkat(baris.status)}
                        </Badge>
                      </td>
                      <td className="max-w-[200px] px-5 py-3 text-xs text-slate-500">
                        {baris.catatan || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">{aksiUntuk(baris)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <Modal
        terbuka={Boolean(modalTolak)}
        onTutup={() => setModalTolak(null)}
        judul="Tolak Pengajuan Perangkat"
      >
        <p className="mb-3 text-[13px] leading-relaxed text-slate-600">
          Pengajuan atas nama <strong>{modalTolak?.pegawai?.nama}</strong> akan ditolak.
        </p>
        <label className="label-input" htmlFor="catatan-tolak">
          Catatan (opsional)
        </label>
        <textarea
          id="catatan-tolak"
          className="input-dasar min-h-[90px]"
          placeholder="Contoh: perangkat terindikasi bukan milik pegawai."
          value={catatanTolak}
          onChange={(e) => setCatatanTolak(e.target.value)}
        />
        <div className="aksi-modal">
          <Button variant="sekunder" onClick={() => setModalTolak(null)}>
            Batal
          </Button>
          <Button variant="bahaya" onClick={kirimTolak}>
            Tolak Pengajuan
          </Button>
        </div>
      </Modal>
    </>
  )
}
