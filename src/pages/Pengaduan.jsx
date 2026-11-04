/**
 * ==========================================================================
 * Pegawai - Pengaduan Presensi (absen pulang terlewat)
 * --------------------------------------------------------------------------
 * Pegawai mengajukan pengaduan untuk presensi yang sudah masuk tetapi belum
 * memiliki jam pulang (maksimal 7 hari). Foto bukti wajib. Kepala unit yang
 * menyetujui, Super Admin hanya melihat riwayat.
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  ambilDokumenPengaduanUrl,
  ambilPengaduanSaya,
  ambilPresensiBisaDiadukan,
} from '../services/pengaduanService.js'
import {
  formatJam,
  formatTanggalRingkas,
} from '../utils/format.js'
import { BATAS_HARI_PENGADUAN } from '../utils/pengaduan.js'
import {
  Alert,
  Badge,
  Button,
  Modal,
  Spinner,
  TombolMuatUlang,
} from '../components/ui/index.js'
import BarAtas from '../components/BarAtas.jsx'
import FormPengaduan from '../components/pengaduan/FormPengaduan.jsx'
import DaftarPengaduan from '../components/pengaduan/DaftarPengaduan.jsx'

export default function Pengaduan() {
  const { profil, keluar } = useAuth()
  const [presensi, setPresensi] = useState([])
  const [riwayat, setRiwayat] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [pilih, setPilih] = useState(null)

  const muat = useCallback(async () => {
    if (!profil?.id) return
    setMemuat(true)
    try {
      const [bisa, aduan] = await Promise.all([
        ambilPresensiBisaDiadukan(profil.id),
        ambilPengaduanSaya(),
      ])
      setPresensi(bisa)
      setRiwayat(aduan)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat pengaduan.')
    } finally {
      setMemuat(false)
    }
  }, [profil])

  useEffect(() => {
    muat()
  }, [muat])

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
    <div className="min-h-[100dvh] bg-slate-50">
      <BarAtas onKeluar={keluar} />

      <main
        id="konten"
        className="pb-navigasi mx-auto w-full max-w-5xl px-4 pt-4 sm:px-6 sm:pt-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Pengaduan Presensi
            </h1>
            <p className="mt-0.5 text-[13px] leading-relaxed text-slate-500 sm:text-sm">
              Laporkan absen pulang yang terlewat, maksimal {BATAS_HARI_PENGADUAN}{' '}
              hari setelah tanggal presensi.
            </p>
          </div>
          <TombolMuatUlang onClick={muat} memuat={memuat} />
        </div>

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
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat data…
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
              <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
                <h2 className="text-sm font-bold text-slate-800">
                  Presensi Bisa Diadukan
                </h2>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Belum ada jam pulang.
                </p>
              </div>

              {presensi.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-slate-500">
                  Tidak ada presensi yang perlu diadukan saat ini.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {presensi.map((baris) => (
                    <div
                      key={baris.id}
                      className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-slate-800">
                          {formatTanggalRingkas(baris.tanggal)}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          Masuk {formatJam(baris.jam_masuk)} ·{' '}
                          {baris.status_kehadiran}
                        </p>
                      </div>
                      {baris.pengaduanMenunggu ? (
                        <Badge variant="peringatan">Menunggu persetujuan</Badge>
                      ) : (
                        <Button size="sm" onClick={() => setPilih(baris)}>
                          Ajukan Pengaduan
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
              <div className="border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
                <h2 className="text-sm font-bold text-slate-800">
                  Riwayat Pengaduan Saya
                </h2>
                <p className="text-[11px] text-slate-500 sm:text-xs">
                  Status dan catatan dari Kepala Unit.
                </p>
              </div>
              <DaftarPengaduan
                daftar={riwayat}
                onLihatFoto={lihatFoto}
                pesanKosong="Belum ada pengaduan."
              />
            </section>
          </div>
        )}
      </main>

      <Modal
        terbuka={Boolean(pilih)}
        onTutup={() => setPilih(null)}
        judul="Ajukan Pengaduan Absen Pulang"
      >
        {pilih && (
          <FormPengaduan
            presensi={pilih}
            userId={profil?.id}
            onBatal={() => setPilih(null)}
            onSelesai={selesai}
          />
        )}
      </Modal>
    </div>
  )
}
