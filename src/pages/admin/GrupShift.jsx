/**
 * ==========================================================================
 * Super Admin — Grup Shift
 * --------------------------------------------------------------------------
 * Master grup/unit. Rename grup otomatis memperbarui unit_kerja seluruh
 * pegawai di dalamnya (foreign key ON UPDATE CASCADE). Grup kosong tetap
 * dapat dibuat dan dipakai pada Data Pegawai/Jadwal Shift.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  SEKSI_SHIFT,
  ambilGrupShift,
  hapusGrupShift,
  tambahGrupShift,
  ubahGrupShift,
} from '../../services/groupShiftService.js'
import { ambilSemuaPegawai } from '../../services/pegawaiService.js'
import { Alert, Badge, Button, Modal, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const FORM_KOSONG = {
  namaLama: null,
  nama: '',
  // Grup baru harus dipetakan eksplisit oleh Super Admin.
  seksi: 'Belum ditentukan',
}

export default function GrupShift() {
  const [daftar, setDaftar] = useState([])
  const [pegawai, setPegawai] = useState([])
  const [cari, setCari] = useState('')
  const [filterSeksi, setFilterSeksi] = useState('semua')
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_KOSONG)
  const [menyimpan, setMenyimpan] = useState(false)
  const [galatModal, setGalatModal] = useState(null)

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      const [dataGrup, dataPegawai] = await Promise.all([
        ambilGrupShift(),
        ambilSemuaPegawai(),
      ])
      setDaftar(dataGrup)
      setPegawai(dataPegawai)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat grup shift.')
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    muat()
  }, [muat])

  const jumlahPegawai = useMemo(() => {
    const peta = new Map()
    for (const p of pegawai) {
      peta.set(p.unit_kerja, (peta.get(p.unit_kerja) ?? 0) + 1)
    }
    return peta
  }, [pegawai])

  const opsiSeksi = useMemo(
    () => [...new Set([...SEKSI_SHIFT, ...daftar.map((g) => g.seksi)])],
    [daftar],
  )

  const tersaring = useMemo(() => {
    const kata = cari.trim().toLowerCase()
    return daftar.filter((g) => {
      const cocokNama = !kata || g.nama.toLowerCase().includes(kata)
      const cocokSeksi = filterSeksi === 'semua' || g.seksi === filterSeksi
      return cocokNama && cocokSeksi
    })
  }, [daftar, cari, filterSeksi])

  const belumSeksi = daftar.filter((g) => g.seksi === 'Belum ditentukan').length

  function bukaTambah() {
    setForm(FORM_KOSONG)
    setGalatModal(null)
    setPesan(null)
    setModal(true)
  }

  function bukaUbah(grup) {
    setForm({
      namaLama: grup.nama,
      nama: grup.nama,
      seksi: grup.seksi,
    })
    setGalatModal(null)
    setPesan(null)
    setModal(true)
  }

  async function simpan(event) {
    event.preventDefault()
    setMenyimpan(true)
    setGalatModal(null)
    setPesan(null)
    try {
      if (form.nama.trim().length < 2) {
        throw new Error('Nama grup minimal 2 karakter.')
      }

      if (form.namaLama) {
        const hasil = await ubahGrupShift({
          namaLama: form.namaLama,
          namaBaru: form.nama,
          seksi: form.seksi,
        })
        const jumlah = hasil?.jumlah_pegawai ?? 0
        setPesan(
          `Grup "${form.namaLama}" diubah menjadi "${hasil?.nama_baru ?? form.nama}". ${jumlah} pegawai diperbarui otomatis.`,
        )
      } else {
        await tambahGrupShift({ nama: form.nama, seksi: form.seksi })
        setPesan(`Grup "${form.nama.trim()}" berhasil ditambahkan.`)
      }

      setModal(false)
      await muat()
    } catch (err) {
      setGalatModal(err.message || 'Gagal menyimpan grup shift.')
    } finally {
      setMenyimpan(false)
    }
  }

  async function hapus(grup) {
    const jumlah = jumlahPegawai.get(grup.nama) ?? 0
    if (jumlah > 0) {
      setGalat(
        `Grup "${grup.nama}" masih memiliki ${jumlah} pegawai. Pindahkan pegawai terlebih dahulu.`,
      )
      return
    }
    if (!window.confirm(`Hapus grup "${grup.nama}"?`)) return

    setGalat(null)
    setPesan(null)
    try {
      await hapusGrupShift(grup.nama)
      setPesan(`Grup "${grup.nama}" dihapus.`)
      await muat()
    } catch (err) {
      setGalat(err.message || 'Gagal menghapus grup.')
    }
  }

  return (
    <>
      <KepalaHalaman
        judul="Grup Shift"
        deskripsi="Kelola grup/unit dan seksinya. Rename grup otomatis memperbarui unit pegawai tanpa memutus jadwal."
        aksi={
          <Button size="sm" onClick={bukaTambah}>
            + Grup
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
      {belumSeksi > 0 && (
        <Alert variant="peringatan" title="Seksi belum lengkap" className="mb-4">
          {belumSeksi} grup masih berstatus “Belum ditentukan”. Lengkapi seksinya agar
          filter pada Jadwal Shift dan laporan lebih rapi.
        </Alert>
      )}

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-kartu sm:grid-cols-2 sm:p-4 lg:max-w-2xl">
        <div>
          <label className="label-input" htmlFor="cari-grup">
            Cari Grup
          </label>
          <input
            id="cari-grup"
            className="input-dasar"
            placeholder="Ketik nama grup…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
        <div>
          <label className="label-input" htmlFor="filter-seksi-grup">
            Seksi
          </label>
          <select
            id="filter-seksi-grup"
            className="input-dasar"
            value={filterSeksi}
            onChange={(e) => setFilterSeksi(e.target.value)}
          >
            <option value="semua">Semua seksi</option>
            {opsiSeksi.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Daftar Grup</h2>
            <p className="text-xs text-slate-500">
              {tersaring.length} dari {daftar.length} grup
            </p>
          </div>
        </div>

        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat grup shift…
          </div>
        ) : tersaring.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Tidak ada grup yang cocok.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {tersaring.map((grup) => {
                const jumlah = jumlahPegawai.get(grup.nama) ?? 0
                return (
                  <article key={grup.nama} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-slate-800">
                          {grup.nama}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {grup.seksi}
                        </p>
                      </div>
                      <Badge variant={jumlah ? 'info' : 'netral'}>
                        {jumlah} pegawai
                      </Badge>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="sekunder"
                        onClick={() => bukaUbah(grup)}
                      >
                        Ubah / Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="bahayaLembut"
                        onClick={() => hapus(grup)}
                        disabled={jumlah > 0 || grup.nama === 'Belum ditentukan'}
                        title={
                          grup.nama === 'Belum ditentukan'
                            ? 'Grup bawaan tidak dapat dihapus'
                            : jumlah > 0
                              ? 'Pindahkan pegawai terlebih dahulu'
                              : 'Hapus grup'
                        }
                      >
                        Hapus
                      </Button>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Grup / Unit</th>
                    <th className="px-5 py-3 font-semibold">Seksi</th>
                    <th className="px-5 py-3 text-center font-semibold">Pegawai</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tersaring.map((grup) => {
                    const jumlah = jumlahPegawai.get(grup.nama) ?? 0
                    return (
                      <tr key={grup.nama} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-semibold text-slate-800">
                          {grup.nama}
                        </td>
                        <td className="px-5 py-3 text-xs text-slate-600">
                          {grup.seksi === 'Belum ditentukan' ? (
                            <Badge variant="peringatan">{grup.seksi}</Badge>
                          ) : (
                            grup.seksi
                          )}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <Badge variant={jumlah ? 'info' : 'netral'}>
                            {jumlah}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="sekunder"
                              onClick={() => bukaUbah(grup)}
                            >
                              Ubah
                            </Button>
                            <Button
                              size="sm"
                              variant="bahayaLembut"
                              onClick={() => hapus(grup)}
                              disabled={
                                jumlah > 0 || grup.nama === 'Belum ditentukan'
                              }
                              title={
                                grup.nama === 'Belum ditentukan'
                                  ? 'Grup bawaan tidak dapat dihapus'
                                  : jumlah > 0
                                    ? 'Pindahkan pegawai terlebih dahulu'
                                    : 'Hapus grup'
                              }
                            >
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <Modal
        terbuka={modal}
        onTutup={() => setModal(false)}
        judul={form.namaLama ? 'Ubah / Rename Grup' : 'Tambah Grup Shift'}
      >
        <form onSubmit={simpan} className="space-y-4">
          {galatModal && (
            <Alert variant="bahaya" title="Gagal Menyimpan">
              {galatModal}
            </Alert>
          )}

          <div>
            <label className="label-input" htmlFor="grup-nama">
              Nama Grup / Unit
            </label>
            <input
              id="grup-nama"
              className="input-dasar"
              value={form.nama}
              onChange={(e) => setForm((l) => ({ ...l, nama: e.target.value }))}
              placeholder="Contoh: IGD"
              required
            />
            {form.namaLama && (
              <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                Rename akan mengubah unit kerja {jumlahPegawai.get(form.namaLama) ?? 0}{' '}
                pegawai di grup ini secara otomatis.
              </p>
            )}
          </div>

          <div>
            <label className="label-input" htmlFor="grup-seksi">
              Seksi
            </label>
            <select
              id="grup-seksi"
              className="input-dasar"
              value={form.seksi}
              onChange={(e) =>
                setForm((l) => ({ ...l, seksi: e.target.value }))
              }
              required
            >
              {opsiSeksi.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="aksi-modal">
            <Button variant="sekunder" onClick={() => setModal(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={menyimpan}>
              {menyimpan ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
