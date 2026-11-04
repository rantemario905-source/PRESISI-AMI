/**
 * ==========================================================================
 * Kepala Unit - Persetujuan Pengaduan Presensi
 * --------------------------------------------------------------------------
 * Kepala unit hanya melihat pengaduan pegawai pada unit yang dikelola.
 * Setujui (jam pulang boleh disesuaikan) atau tolak dengan catatan wajib.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  ambilDaftarPengaduan,
  ambilDokumenPengaduanUrl,
} from '../../services/pengaduanService.js'
import {
  Alert,
  PencarianNama,
  Spinner,
  TabBar,
  TombolMuatUlang,
} from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'
import DaftarPengaduan from '../../components/pengaduan/DaftarPengaduan.jsx'
import ModalPutusanPengaduan from '../../components/pengaduan/ModalPutusanPengaduan.jsx'

const TAB = [
  { nilai: 'menunggu', label: 'Menunggu' },
  { nilai: 'disetujui', label: 'Disetujui' },
  { nilai: 'ditolak', label: 'Ditolak' },
  { nilai: 'semua', label: 'Semua' },
]

export default function PengaduanKepala() {
  const { profil } = useAuth()
  const [tab, setTab] = useState('menunggu')
  const [unit, setUnit] = useState('semua')
  const [cari, setCari] = useState('')
  const [daftar, setDaftar] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [pilih, setPilih] = useState(null)

  const units = useMemo(
    () => (Array.isArray(profil?.unit_dikelola) ? profil.unit_dikelola : []),
    [profil],
  )

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      const data = await ambilDaftarPengaduan({ unit, status: tab })
      setDaftar(data)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat pengaduan.')
    } finally {
      setMemuat(false)
    }
  }, [unit, tab])

  useEffect(() => {
    muat()
  }, [muat])

  const tersaring = useMemo(() => {
    const kata = cari.trim().toLowerCase()
    if (!kata) return daftar
    return daftar.filter((baris) =>
      `${baris.pegawai_nama ?? ''} ${baris.unit_kerja ?? ''}`
        .toLowerCase()
        .includes(kata),
    )
  }, [cari, daftar])

  const lihatFoto = async (baris) => {
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

  const selesai = (pesanBaru) => {
    setPilih(null)
    setPesan(pesanBaru)
    muat()
  }

  return (
    <>
      <KepalaHalaman
        judul="Pengaduan Presensi"
        deskripsi="Tinjau pengaduan absen pulang unit Anda."
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

      <TabBar
        daftar={TAB}
        nilai={tab}
        onChange={(nilai) => {
          setPesan(null)
          setTab(nilai)
        }}
        label="Status pengaduan"
        aksi={<TombolMuatUlang onClick={muat} memuat={memuat} />}
      />

      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex w-full flex-col gap-2 sm:max-w-xl sm:flex-row">
          <PencarianNama
            nilai={cari}
            onChange={setCari}
            placeholder="Cari nama pegawai atau unit…"
            className="w-full sm:max-w-xs"
          />
          {units.length > 1 && (
            <div className="w-full sm:max-w-[220px]">
              <label className="label-input" htmlFor="pengaduan-unit">
                Unit
              </label>
              <select
                id="pengaduan-unit"
                className="input-dasar"
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
              >
                <option value="semua">Semua unit saya</option>
                {units.map((nama) => (
                  <option key={nama} value={nama}>
                    {nama}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <p className="text-[11px] font-semibold text-slate-500 sm:text-xs">
          {cari
            ? `${tersaring.length} dari ${daftar.length} pengaduan`
            : `${daftar.length} pengaduan`}
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat pengaduan…
          </div>
        ) : tersaring.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <p className="text-sm font-semibold text-slate-600">
              Tidak ada pengaduan
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Pengaduan pegawai pada unit Anda akan muncul di sini.
            </p>
          </div>
        ) : (
          <DaftarPengaduan
            daftar={tersaring}
            bolehPutuskan
            idSaya={profil?.id}
            onPutuskan={setPilih}
            onLihatFoto={lihatFoto}
          />
        )}
      </section>

      {pilih && (
        <ModalPutusanPengaduan
          baris={pilih}
          onTutup={() => setPilih(null)}
          onSelesai={selesai}
        />
      )}
    </>
  )
}
