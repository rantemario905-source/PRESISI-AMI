/**
 * ==========================================================================
 * Halaman Dinas & Sakit / Cuti
 * --------------------------------------------------------------------------
 * Dipakai dua mode:
 *   - mode="superadmin" → semua unit, dapat menyetujui/menolak/membatalkan.
 *   - mode="kepala"     → hanya unit sendiri, mencatat & mengubah pengajuan
 *                         yang masih menunggu. Tidak dapat menyetujui.
 *
 * Semua penyimpanan lewat RPC. Dokumen Sakit & Dinas Luar wajib diunggah
 * SEBELUM entri disimpan. Cuti boleh tanpa dokumen.
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  ambilDaftarIzin,
  ambilDokumenUrl,
  batalkanIzinGrup,
  catatIzinGrup,
  hapusDokumenIzin,
  putuskanIzinGrup,
  ubahIzinGrup,
  unggahDokumenIzin,
} from '../../services/leaveService.js'
import { ambilSemuaPegawai } from '../../services/pegawaiService.js'
import { buatIdGrup, siapkanDokumenIzin } from '../../utils/dokumenIzin.js'
import { formatTanggalRingkas, hariIni } from '../../utils/format.js'
import { labelJenis } from '../../utils/izin.js'
import { labelStatusIzin, varianStatusIzin } from '../../utils/status.js'
import { Alert, Badge, Button, Modal, Spinner, TabBar } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const TAB = [
  { nilai: 'semua', label: 'Semua' },
  { nilai: 'menunggu', label: 'Menunggu' },
  { nilai: 'disetujui', label: 'Disetujui' },
  { nilai: 'ditolak', label: 'Ditolak' },
  { nilai: 'dibatalkan', label: 'Dibatalkan' },
]

const FORM_KOSONG = {
  grupId: null,
  jenis: 'Sakit',
  singleId: '',
  userIds: [],
  tanggalMulai: hariIni(),
  tanggalSelesai: hariIni(),
  keterangan: '',
  dokumenLama: null,
  dokumenBaru: null,
}

function formatUkuran(byte) {
  if (!byte || Number.isNaN(Number(byte))) return '—'
  if (byte < 1024) return `${byte} B`
  if (byte < 1024 * 1024) return `${Math.round(byte / 1024)} KB`
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`
}

function namaAnggota(grup) {
  const nama = (grup.anggota ?? []).map((p) => p?.nama).filter(Boolean)
  if (!nama.length) return '—'
  return nama.join(', ')
}

function unitAnggota(grup) {
  const unit = [...new Set((grup.anggota ?? []).map((p) => p?.unit_kerja).filter(Boolean))]
  return unit.join(', ')
}

function dokumenWajib(jenis) {
  return jenis !== 'Cuti'
}

export default function PengajuanIzin({ mode = 'superadmin', kategori = 'dinas-sakit' }) {
  const adalahKepala = mode === 'kepala'
  const { profil } = useAuth()
  const konteksKepala = useOutletContext()
  const unitKepala = adalahKepala
    ? konteksKepala?.unitAktif || profil?.unit_kerja || ''
    : ''
  const jenisTersedia = kategori === 'cuti' ? ['Cuti'] : ['Sakit', 'Dinas Luar']
  const judulKategori = kategori === 'cuti' ? 'Cuti' : 'Dinas & Sakit'

  const [tab, setTab] = useState('semua')
  const [daftar, setDaftar] = useState([])
  const [pegawai, setPegawai] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [menyimpan, setMenyimpan] = useState(false)
  const [memprosesDokumen, setMemprosesDokumen] = useState(false)

  const [modalForm, setModalForm] = useState(false)
  const [form, setForm] = useState(FORM_KOSONG)
  const [galatForm, setGalatForm] = useState(null)
  const [previewDokumen, setPreviewDokumen] = useState(null)

  const [aksi, setAksi] = useState(null)
  const [catatan, setCatatan] = useState('')
  const [batal, setBatal] = useState(null)
  const [alasanBatal, setAlasanBatal] = useState('')
  const [dokumenMembuka, setDokumenMembuka] = useState(null)

  const muat = useCallback(
    async (status = tab) => {
      setMemuat(true)
      try {
        const data = await ambilDaftarIzin({ kategori, status })
        setDaftar(data)
        setGalat(null)
      } catch (err) {
        setGalat(err.message || 'Gagal memuat data pengajuan.')
      } finally {
        setMemuat(false)
      }
    },
    [kategori, tab],
  )

  useEffect(() => {
    muat(tab)
  }, [muat, tab])

  useEffect(() => {
    ambilSemuaPegawai({
      unitKerja: adalahKepala ? unitKepala : null,
    })
      .then((data) => {
        setPegawai(data)
        setForm((lama) => ({
          ...lama,
          singleId: lama.singleId || data[0]?.id || '',
        }))
      })
      .catch(() => setPegawai([]))
  }, [adalahKepala, unitKepala])

  useEffect(
    () => () => {
      if (previewDokumen) URL.revokeObjectURL(previewDokumen)
    },
    [previewDokumen],
  )

  const bukaFormBaru = () => {
    const hari = hariIni()
    setForm({
      ...FORM_KOSONG,
      jenis: jenisTersedia[0],
      singleId: pegawai[0]?.id ?? '',
      tanggalMulai: hari,
      tanggalSelesai: hari,
    })
    setPreviewDokumen(null)
    setGalatForm(null)
    setPesan(null)
    setModalForm(true)
  }

  const bukaFormUbah = (grup) => {
    setForm({
      grupId: grup.grup_id,
      jenis: grup.jenis,
      singleId: grup.pegawai_ids?.[0] ?? '',
      userIds: grup.jenis === 'Dinas Luar' ? [...(grup.pegawai_ids ?? [])] : [],
      tanggalMulai: grup.tanggal_mulai,
      tanggalSelesai: grup.tanggal_selesai,
      keterangan: grup.alasan ?? '',
      dokumenLama: grup.dokumen_path
        ? {
            path: grup.dokumen_path,
            nama: grup.dokumen_nama,
            tipe: grup.dokumen_tipe,
            ukuran: grup.dokumen_ukuran,
          }
        : null,
      dokumenBaru: null,
    })
    setPreviewDokumen(null)
    setGalatForm(null)
    setPesan(null)
    setModalForm(true)
  }

  const pilihDokumen = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setGalatForm(null)
    setMemprosesDokumen(true)
    try {
      const siap = await siapkanDokumenIzin(file)
      if (previewDokumen) URL.revokeObjectURL(previewDokumen)
      setForm((lama) => ({ ...lama, dokumenBaru: siap }))
      setPreviewDokumen(URL.createObjectURL(siap.file))
    } catch (err) {
      setGalatForm(err.message || 'Dokumen tidak valid.')
      setForm((lama) => ({ ...lama, dokumenBaru: null }))
      if (previewDokumen) URL.revokeObjectURL(previewDokumen)
      setPreviewDokumen(null)
    } finally {
      setMemprosesDokumen(false)
    }
  }

  const togglePegawaiDinas = (id) => {
    setForm((lama) => {
      const sudah = lama.userIds.includes(id)
      if (sudah) return { ...lama, userIds: lama.userIds.filter((x) => x !== id) }
      if (lama.userIds.length >= 4) return lama
      return { ...lama, userIds: [...lama.userIds, id] }
    })
  }

  const simpan = async (event) => {
    event.preventDefault()
    setGalatForm(null)
    setPesan(null)

    const userIds =
      form.jenis === 'Dinas Luar'
        ? form.userIds
        : form.singleId
          ? [form.singleId]
          : []

    if (!form.jenis) {
      setGalatForm('Pilih jenis ketidakhadiran.')
      return
    }
    if (!userIds.length) {
      setGalatForm('Pilih pegawai terlebih dahulu.')
      return
    }
    if (form.jenis === 'Dinas Luar' && userIds.length > 4) {
      setGalatForm('Dinas Luar maksimal 4 pegawai per grup.')
      return
    }
    if (form.tanggalSelesai < form.tanggalMulai) {
      setGalatForm('Tanggal selesai tidak boleh sebelum tanggal mulai.')
      return
    }

    const punyaDokumen = Boolean(form.dokumenBaru || form.dokumenLama?.path)
    if (dokumenWajib(form.jenis) && !punyaDokumen) {
      setGalatForm('Dokumen wajib diunggah untuk Sakit dan Dinas Luar.')
      return
    }

    setMenyimpan(true)
    const grupId = form.grupId || buatIdGrup()
    let unggahan = null
    let tersimpan = false

    try {
      if (form.dokumenBaru) {
        unggahan = await unggahDokumenIzin({ grupId, file: form.dokumenBaru.file })
      }

      const data = {
        grupId,
        jenis: form.jenis,
        userIds,
        tanggalMulai: form.tanggalMulai,
        tanggalSelesai: form.tanggalSelesai,
        keterangan: form.keterangan,
        dokumen: unggahan,
      }

      if (form.grupId) {
        await ubahIzinGrup(data)
        tersimpan = true
        if (unggahan && form.dokumenLama?.path && form.dokumenLama.path !== unggahan.path) {
          await hapusDokumenIzin(form.dokumenLama.path)
        }
        setPesan('Pengajuan berhasil diperbarui dan tetap menunggu persetujuan Super Admin.')
      } else {
        await catatIzinGrup(data)
        tersimpan = true
        setPesan('Pengajuan berhasil dicatat. Menunggu persetujuan Super Admin.')
      }

      setModalForm(false)
      setTab('menunggu')
      await muat('menunggu')
    } catch (err) {
      // Hapus file baru HANYA bila RPC gagal. Jika RPC sudah sukses tetapi
      // pemuatan ulang gagal, file tersebut sudah tertaut ke pengajuan.
      if (!tersimpan && unggahan?.path) await hapusDokumenIzin(unggahan.path)
      if (tersimpan) {
        setModalForm(false)
        setGalat(
          `Pengajuan sudah tersimpan, tetapi daftar gagal dimuat ulang: ${
            err.message || 'coba muat ulang halaman.'
          }`,
        )
      } else {
        setGalatForm(err.message || 'Gagal menyimpan pengajuan.')
      }
    } finally {
      setMenyimpan(false)
    }
  }

  const lihatDokumen = async (path) => {
    if (!path) return
    const jendela = window.open('about:blank', '_blank')
    setDokumenMembuka(path)
    try {
      const url = await ambilDokumenUrl(path)
      if (!url) throw new Error('Dokumen tidak tersedia.')
      if (jendela) jendela.location.href = url
      else window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      if (jendela) jendela.close()
      setGalat(err.message || 'Gagal membuka dokumen.')
    } finally {
      setDokumenMembuka(null)
    }
  }

  const bukaAksi = (grup, status) => {
    setCatatan('')
    setAksi({ grup, status })
  }

  const kirimAksi = async () => {
    if (!aksi) return
    setGalat(null)
    setPesan(null)
    try {
      await putuskanIzinGrup({
        grupId: aksi.grup.grup_id,
        status: aksi.status,
        catatan,
      })
      setPesan(
        aksi.status === 'disetujui'
          ? 'Pengajuan disetujui. Presensi seluruh anggota grup telah ditandai.'
          : 'Pengajuan ditolak.',
      )
      setAksi(null)
      await muat(tab)
    } catch (err) {
      setGalat(err.message || 'Gagal memproses pengajuan.')
    }
  }

  const bukaBatal = (grup) => {
    setAlasanBatal('')
    setBatal(grup)
  }

  const kirimBatal = async () => {
    if (!batal) return
    setGalat(null)
    setPesan(null)
    try {
      await batalkanIzinGrup({ grupId: batal.grup_id, alasan: alasanBatal })
      setPesan(
        batal.status === 'disetujui'
          ? 'Persetujuan dibatalkan dan penanda presensi otomatis dibersihkan.'
          : 'Pengajuan dibatalkan.',
      )
      setBatal(null)
      await muat(tab)
    } catch (err) {
      setGalat(err.message || 'Gagal membatalkan pengajuan.')
    }
  }

  const perluDokumen = form.jenis !== 'Cuti'
  const adaDokumen = Boolean(form.dokumenBaru || form.dokumenLama?.path)
  const bolehSimpan =
    !menyimpan &&
    !memprosesDokumen &&
    (!perluDokumen || adaDokumen) &&
    (form.jenis === 'Dinas Luar' ? form.userIds.length > 0 : Boolean(form.singleId))

  const totalGrup = daftar.length
  const totalPegawai = daftar.reduce((n, g) => n + (g.jumlah_anggota || 1), 0)

  return (
    <>
      <KepalaHalaman
        judul={adalahKepala ? `${judulKategori} Unit Saya` : `Pengajuan ${judulKategori}`}
        deskripsi={
          adalahKepala
            ? `Catat dan kelola ${judulKategori.toLowerCase()} untuk pegawai di unit ${unitKepala || 'Anda'}. Persetujuan dilakukan Super Admin.`
            : `Catat ${judulKategori.toLowerCase()} atas nama pegawai, periksa dokumen, lalu setujui atau tolak.`
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

      {adalahKepala && (
        <Alert variant="info" className="mb-4">
          Anda dapat mencatat dan mengubah pengajuan yang masih <strong>Menunggu</strong>. Tombol
          setujui/tolak hanya tersedia untuk Super Admin.
        </Alert>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2 sm:max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-kartu">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Grup</p>
          <p className="mt-0.5 text-xl font-extrabold tabular-nums text-slate-800">{totalGrup}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-kartu">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Pegawai</p>
          <p className="mt-0.5 text-xl font-extrabold tabular-nums text-slate-800">{totalPegawai}</p>
        </div>
      </div>

      <TabBar
        daftar={TAB}
        nilai={tab}
        onChange={setTab}
        label={`Status pengajuan ${judulKategori}`}
      />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">
              Daftar Pengajuan {judulKategori}
            </h2>
            <p className="text-[11px] text-slate-500 sm:text-xs">
              {daftar.length} pengajuan
            </p>
          </div>
          <div className="aksi-halaman">
            <Button variant="sekunder" size="sm" onClick={() => muat(tab)} disabled={memuat}>
              Muat ulang
            </Button>
            <Button size="sm" onClick={bukaFormBaru} disabled={!pegawai.length}>
              + Catat {judulKategori}
            </Button>
          </div>
        </div>

        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat pengajuan…
          </div>
        ) : daftar.length === 0 ? (
          <div className="px-4 py-14 text-center text-sm text-slate-500">
            Belum ada pengajuan pada kategori ini.
          </div>
        ) : (
          <>
            {/* HP: kartu per grup */}
            <div className="divide-y divide-slate-100 md:hidden">
              {daftar.map((grup) => (
                <article key={grup.grup_id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-snug text-slate-800">
                        {namaAnggota(grup)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">{unitAnggota(grup)}</p>
                    </div>
                    <Badge variant={varianStatusIzin(grup.status)}>
                      {labelStatusIzin(grup.status)}
                    </Badge>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="info">{labelJenis(grup.jenis)}</Badge>
                    <span className="text-xs font-semibold text-slate-600">
                      {formatTanggalRingkas(grup.tanggal_mulai)} –{' '}
                      {formatTanggalRingkas(grup.tanggal_selesai)}
                    </span>
                    {grup.jenis === 'Dinas Luar' && (
                      <span className="text-[11px] font-semibold text-slate-400">
                        {grup.jumlah_anggota} pegawai
                      </span>
                    )}
                  </div>

                  {grup.alasan && (
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-slate-500">
                      {grup.alasan}
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    {grup.dokumen_path ? (
                      <button
                        type="button"
                        onClick={() => lihatDokumen(grup.dokumen_path)}
                        disabled={dokumenMembuka === grup.dokumen_path}
                        className="font-semibold text-sky-700 underline disabled:opacity-50"
                      >
                        {dokumenMembuka === grup.dokumen_path ? 'Membuka…' : 'Lihat dokumen'}
                      </button>
                    ) : (
                      <span className={grup.jenis === 'Cuti' ? 'text-slate-400' : 'font-semibold text-red-600'}>
                        {grup.jenis === 'Cuti' ? 'Tanpa dokumen' : 'Dokumen belum ada'}
                      </span>
                    )}
                  </div>

                  {grup.catatan_admin && (
                    <p className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs leading-relaxed text-slate-600">
                      <span className="font-semibold">Catatan admin:</span> {grup.catatan_admin}
                    </p>
                  )}
                  {grup.alasan_pembatalan && (
                    <p className="mt-2 rounded-lg bg-red-50 px-2.5 py-2 text-xs leading-relaxed text-red-700">
                      <span className="font-semibold">Alasan batal:</span> {grup.alasan_pembatalan}
                    </p>
                  )}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {grup.status === 'menunggu' && (
                      <>
                        <Button size="sm" variant="sekunder" onClick={() => bukaFormUbah(grup)}>
                          Ubah
                        </Button>
                        <Button size="sm" variant="bahayaLembut" onClick={() => bukaBatal(grup)}>
                          Batalkan
                        </Button>
                        {!adalahKepala && (
                          <>
                            <Button size="sm" variant="sukses" onClick={() => bukaAksi(grup, 'disetujui')}>
                              Setujui
                            </Button>
                            <Button
                              size="sm"
                              variant="bahayaLembut"
                              onClick={() => bukaAksi(grup, 'ditolak')}
                            >
                              Tolak
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    {grup.status === 'disetujui' && !adalahKepala && (
                      <Button
                        size="sm"
                        variant="bahayaLembut"
                        className="col-span-2"
                        onClick={() => bukaBatal(grup)}
                      >
                        Batalkan Persetujuan
                      </Button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop: tabel per grup */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Pegawai</th>
                    <th className="px-5 py-3 font-semibold">Jenis</th>
                    <th className="px-5 py-3 font-semibold">Periode</th>
                    <th className="px-5 py-3 font-semibold">Keterangan</th>
                    <th className="px-5 py-3 font-semibold">Dokumen</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {daftar.map((grup) => (
                    <tr key={grup.grup_id} className="align-top hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <p className="max-w-[260px] font-semibold text-slate-800">
                          {namaAnggota(grup)}
                        </p>
                        <p className="text-xs text-slate-500">{unitAnggota(grup)}</p>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant="info">{labelJenis(grup.jenis)}</Badge>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-600">
                        {formatTanggalRingkas(grup.tanggal_mulai)}
                        <br />
                        s.d. {formatTanggalRingkas(grup.tanggal_selesai)}
                      </td>
                      <td className="max-w-[220px] px-5 py-3 text-xs text-slate-600">
                        {grup.alasan || '—'}
                        {grup.catatan_admin && (
                          <p className="mt-1 text-[11px] font-semibold text-slate-500">
                            Catatan admin: {grup.catatan_admin}
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-3 text-xs">
                        {grup.dokumen_path ? (
                          <button
                            type="button"
                            className="font-semibold text-sky-700 hover:underline disabled:opacity-50"
                            onClick={() => lihatDokumen(grup.dokumen_path)}
                            disabled={dokumenMembuka === grup.dokumen_path}
                          >
                            {dokumenMembuka === grup.dokumen_path ? 'Membuka…' : 'Lihat'}
                          </button>
                        ) : (
                          <span className={grup.jenis === 'Cuti' ? 'text-slate-400' : 'font-semibold text-red-600'}>
                            {grup.jenis === 'Cuti' ? 'Opsional' : 'Belum ada'}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={varianStatusIzin(grup.status)}>
                          {labelStatusIzin(grup.status)}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          {grup.status === 'menunggu' && (
                            <Button size="sm" variant="sekunder" onClick={() => bukaFormUbah(grup)}>
                              Ubah
                            </Button>
                          )}
                          {grup.status === 'menunggu' && (
                            <Button size="sm" variant="bahayaLembut" onClick={() => bukaBatal(grup)}>
                              Batalkan
                            </Button>
                          )}
                          {grup.status === 'menunggu' && !adalahKepala && (
                            <>
                              <Button size="sm" variant="sukses" onClick={() => bukaAksi(grup, 'disetujui')}>
                                Setujui
                              </Button>
                              <Button
                                size="sm"
                                variant="bahayaLembut"
                                onClick={() => bukaAksi(grup, 'ditolak')}
                              >
                                Tolak
                              </Button>
                            </>
                          )}
                          {grup.status === 'disetujui' && !adalahKepala && (
                            <Button size="sm" variant="bahayaLembut" onClick={() => bukaBatal(grup)}>
                              Batalkan
                            </Button>
                          )}
                          {grup.status !== 'menunggu' && grup.status !== 'disetujui' && (
                            <span className="text-xs text-slate-400">Selesai</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Form catat / ubah */}
      <Modal
        terbuka={modalForm}
        onTutup={() => setModalForm(false)}
        judul={form.grupId ? `Ubah Pengajuan ${judulKategori}` : `Catat ${judulKategori}`}
        lebar="max-w-xl"
      >
        <form onSubmit={simpan} className="space-y-3.5">
          {galatForm && (
            <Alert variant="bahaya" title="Gagal Menyimpan">
              {galatForm}
            </Alert>
          )}

          {jenisTersedia.length > 1 && (
            <div>
              <label className="label-input" htmlFor="izin-jenis">
                Jenis
              </label>
              <select
                id="izin-jenis"
                className="input-dasar"
                value={form.jenis}
                onChange={(e) =>
                  setForm((lama) => ({
                    ...lama,
                    jenis: e.target.value,
                    userIds: e.target.value === 'Dinas Luar' ? lama.userIds : [],
                  }))
                }
              >
                {jenisTersedia.map((jenis) => (
                  <option key={jenis} value={jenis}>
                    {jenis}
                  </option>
                ))}
              </select>
            </div>
          )}

          {form.jenis === 'Dinas Luar' ? (
            <div>
              <div className="flex items-end justify-between gap-2">
                <label className="label-input mb-0">Pegawai (maks. 4)</label>
                <span className="mb-1.5 text-[11px] font-semibold text-slate-500">
                  {form.userIds.length}/4 dipilih
                </span>
              </div>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-300 bg-white p-2">
                {pegawai.length === 0 ? (
                  <p className="px-2 py-4 text-center text-xs text-slate-500">
                    Tidak ada pegawai pada unit ini.
                  </p>
                ) : (
                  pegawai.map((p) => {
                    const dicentang = form.userIds.includes(p.id)
                    const penuh = form.userIds.length >= 4 && !dicentang
                    return (
                      <label
                        key={p.id}
                        className={`flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm ${
                          penuh ? 'cursor-not-allowed opacity-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="h-5 w-5 shrink-0 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                          checked={dicentang}
                          disabled={penuh}
                          onChange={() => togglePegawaiDinas(p.id)}
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-slate-700">{p.nama}</span>
                          <span className="block truncate text-[11px] text-slate-400">{p.unit_kerja}</span>
                        </span>
                      </label>
                    )
                  })
                )}
              </div>
            </div>
          ) : (
            <div>
              <label className="label-input" htmlFor="izin-pegawai">
                Pegawai
              </label>
              <select
                id="izin-pegawai"
                className="input-dasar"
                value={form.singleId}
                onChange={(e) => setForm((lama) => ({ ...lama, singleId: e.target.value }))}
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
          )}

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
                onChange={(e) => setForm((lama) => ({ ...lama, tanggalMulai: e.target.value }))}
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
                min={form.tanggalMulai}
                value={form.tanggalSelesai}
                onChange={(e) => setForm((lama) => ({ ...lama, tanggalSelesai: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <label className="label-input" htmlFor="izin-keterangan">
              Keterangan (opsional)
            </label>
            <textarea
              id="izin-keterangan"
              className="input-dasar min-h-[80px]"
              placeholder="Contoh: cuti tahunan, surat dokter, tugas dinas luar kota."
              value={form.keterangan}
              onChange={(e) => setForm((lama) => ({ ...lama, keterangan: e.target.value }))}
            />
          </div>

          <div>
            <label className="label-input" htmlFor="izin-dokumen">
              Dokumen {perluDokumen ? <span className="text-red-600">*</span> : '(opsional)'}
            </label>
            <input
              id="izin-dokumen"
              type="file"
              accept="image/jpeg,image/png"
              onChange={pilihDokumen}
              className="block w-full text-sm text-slate-600 file:mr-3 file:min-h-[44px] file:rounded-xl file:border-0 file:bg-sky-50 file:px-3.5 file:py-2 file:text-sm file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
            />
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {perluDokumen
                ? 'Wajib JPG/JPEG atau PNG, maksimal 1 MB. Dokumen harus ada sebelum pengajuan disimpan.'
                : 'Opsional JPG/JPEG atau PNG, maksimal 1 MB.'}
            </p>

            {memprosesDokumen && (
              <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                <Spinner /> Memeriksa dan mengompres dokumen…
              </p>
            )}

            {previewDokumen && form.dokumenBaru && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-2.5">
                <img
                  src={previewDokumen}
                  alt="Pratinjau dokumen"
                  className="max-h-48 w-full rounded-lg object-contain"
                />
                <p className="mt-1.5 truncate text-[11px] font-semibold text-slate-600">
                  {form.dokumenBaru.nama} · {formatUkuran(form.dokumenBaru.ukuran)}
                </p>
              </div>
            )}

            {!form.dokumenBaru && form.dokumenLama?.path && (
              <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <p className="truncate font-semibold">Dokumen tersimpan: {form.dokumenLama.nama || 'dokumen'}</p>
                <button
                  type="button"
                  className="mt-1 font-semibold text-sky-700 underline"
                  onClick={() => lihatDokumen(form.dokumenLama.path)}
                >
                  Lihat dokumen saat ini
                </button>
              </div>
            )}
          </div>

          {perluDokumen && !adaDokumen && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
              Tombol Simpan aktif setelah dokumen JPG/PNG berhasil dipilih.
            </p>
          )}

          <div className="aksi-modal">
            <Button variant="sekunder" onClick={() => setModalForm(false)} disabled={menyimpan}>
              Batal
            </Button>
            <Button type="submit" disabled={!bolehSimpan}>
              {menyimpan ? 'Menyimpan…' : form.grupId ? 'Simpan Perubahan' : 'Simpan Pengajuan'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Setujui / tolak */}
      <Modal
        terbuka={Boolean(aksi)}
        onTutup={() => setAksi(null)}
        judul={aksi?.status === 'disetujui' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
      >
        <p className="mb-3 text-[13px] leading-relaxed text-slate-600">
          Pengajuan <strong>{labelJenis(aksi?.grup?.jenis)}</strong> untuk{' '}
          <strong>{aksi ? namaAnggota(aksi.grup) : ''}</strong> (
          {aksi
            ? `${formatTanggalRingkas(aksi.grup.tanggal_mulai)} – ${formatTanggalRingkas(aksi.grup.tanggal_selesai)}`
            : ''}
          ).
        </p>

        {aksi?.status === 'disetujui' && aksi?.grup?.jenis !== 'Cuti' && !aksi?.grup?.dokumen_path && (
          <Alert variant="bahaya" className="mb-3">
            Dokumen wajib belum ada. Unggah dokumen terlebih dahulu melalui tombol Ubah.
          </Alert>
        )}

        {aksi?.status === 'disetujui' && (
          <Alert variant="info" className="mb-3">
            Presensi seluruh pegawai pada rentang tanggal tersebut akan otomatis ditandai. Presensi
            yang sudah memiliki jam masuk tidak akan diubah.
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
              ? 'Contoh: disetujui, dokumen lengkap.'
              : 'Contoh: dokumen tidak sesuai.'
          }
        />

        <div className="aksi-modal">
          <Button variant="sekunder" onClick={() => setAksi(null)}>
            Batal
          </Button>
          <Button
            variant={aksi?.status === 'disetujui' ? 'sukses' : 'bahaya'}
            onClick={kirimAksi}
            disabled={
              aksi?.status === 'disetujui' &&
              aksi?.grup?.jenis !== 'Cuti' &&
              !aksi?.grup?.dokumen_path
            }
          >
            {aksi?.status === 'disetujui' ? 'Setujui Pengajuan' : 'Tolak Pengajuan'}
          </Button>
        </div>
      </Modal>

      {/* Batalkan */}
      <Modal terbuka={Boolean(batal)} onTutup={() => setBatal(null)} judul="Batalkan Pengajuan">
        <p className="mb-3 text-[13px] leading-relaxed text-slate-600">
          Batalkan pengajuan <strong>{labelJenis(batal?.jenis)}</strong> untuk{' '}
          <strong>{batal ? namaAnggota(batal) : ''}</strong>?
          {batal?.status === 'disetujui' && (
            <span className="mt-1 block text-red-700">
              Persetujuan yang sudah berjalan akan dibatalkan dan penanda presensi otomatis
              dibersihkan.
            </span>
          )}
        </p>
        <label className="label-input" htmlFor="alasan-batal">
          Alasan Pembatalan (opsional)
        </label>
        <textarea
          id="alasan-batal"
          className="input-dasar min-h-[80px]"
          value={alasanBatal}
          onChange={(e) => setAlasanBatal(e.target.value)}
          placeholder="Contoh: surat dinas dibatalkan oleh unit."
        />
        <div className="aksi-modal">
          <Button variant="sekunder" onClick={() => setBatal(null)}>
            Kembali
          </Button>
          <Button variant="bahaya" onClick={kirimBatal}>
            Ya, Batalkan
          </Button>
        </div>
      </Modal>
    </>
  )
}
