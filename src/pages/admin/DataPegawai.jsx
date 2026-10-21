/**
 * ==========================================================================
 * Super Admin — Data Pegawai
 * --------------------------------------------------------------------------
 * Melihat seluruh pegawai, memperbarui nama & unit kerja, serta memantau
 * status perangkat. Role hanya ditampilkan (read-only) — promosi Super Admin
 * tetap dilakukan lewat SQL oleh Admin IT.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ambilDataPegawai,
  ambilUnitKerja,
  perbaruiPegawai,
} from '../../services/pegawaiService.js'
import { formatTanggalInput, formatTanggalRingkas } from '../../utils/format.js'
import { Alert, Badge, Button, Modal, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const STATUS_PERANGKAT = {
  approved: { label: 'Disetujui', variant: 'sukses' },
  pending: { label: 'Menunggu', variant: 'peringatan' },
  rejected: { label: 'Ditolak', variant: 'bahaya' },
  none: { label: 'Belum ada', variant: 'netral' },
}

export default function DataPegawai() {
  const [daftar, setDaftar] = useState([])
  const [units, setUnits] = useState([])
  const [cari, setCari] = useState('')
  const [filterUnit, setFilterUnit] = useState('semua')
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [menyimpan, setMenyimpan] = useState(false)

  const [pilih, setPilih] = useState(null)
  const [form, setForm] = useState({ nama: '', unitKerja: '' })

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      const [dataPegawai, dataUnit] = await Promise.all([ambilDataPegawai(), ambilUnitKerja()])
      setDaftar(dataPegawai)
      setUnits(dataUnit)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat data pegawai.')
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    muat()
  }, [muat])

  const tersaring = useMemo(() => {
    const kata = cari.trim().toLowerCase()
    return daftar.filter((p) => {
      const cocokNama = !kata || p.nama.toLowerCase().includes(kata)
      const cocokUnit = filterUnit === 'semua' || p.unit_kerja === filterUnit
      return cocokNama && cocokUnit
    })
  }, [daftar, cari, filterUnit])

  const bukaUbah = (baris) => {
    setPilih(baris)
    setForm({ nama: baris.nama, unitKerja: baris.unit_kerja })
  }

  const simpan = async (event) => {
    event.preventDefault()
    setGalat(null)
    setPesan(null)
    setMenyimpan(true)
    try {
      if (form.nama.trim().length < 2) throw new Error('Nama pegawai minimal 2 karakter.')
      if (form.unitKerja.trim().length < 2) throw new Error('Unit kerja wajib diisi.')

      await perbaruiPegawai({
        id: pilih.id,
        nama: form.nama,
        unitKerja: form.unitKerja,
      })
      setPilih(null)
      setPesan(`Data ${form.nama.trim()} berhasil diperbarui.`)
      await muat()
    } catch (err) {
      setGalat(err.message || 'Gagal menyimpan data pegawai.')
    } finally {
      setMenyimpan(false)
    }
  }

  return (
    <>
      <KepalaHalaman
        judul="Data Pegawai"
        deskripsi="Kelola nama dan unit kerja pegawai non-ASN. Role hanya dapat diubah lewat SQL Admin IT."
        aksi={
          <Button variant="sekunder" size="sm" onClick={muat} disabled={memuat}>
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

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-kartu sm:grid-cols-2 lg:max-w-2xl">
        <div>
          <label className="label-input" htmlFor="cari-pegawai">
            Cari Nama
          </label>
          <input
            id="cari-pegawai"
            className="input-dasar"
            placeholder="Ketik nama pegawai…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
          />
        </div>
        <div>
          <label className="label-input" htmlFor="filter-unit-pegawai">
            Unit Kerja
          </label>
          <select
            id="filter-unit-pegawai"
            className="input-dasar"
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
          >
            <option value="semua">Semua unit</option>
            {units.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Daftar Pegawai</h2>
            <p className="text-xs text-slate-500">{tersaring.length} dari {daftar.length} akun</p>
          </div>
        </div>

        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat data pegawai…
          </div>
        ) : tersaring.length === 0 ? (
          <div className="py-14 text-center text-sm text-slate-500">
            Tidak ada pegawai yang cocok dengan pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Nama</th>
                  <th className="px-5 py-3 font-semibold">Unit Kerja</th>
                  <th className="px-5 py-3 font-semibold">Role</th>
                  <th className="px-5 py-3 font-semibold">Perangkat</th>
                  <th className="px-5 py-3 font-semibold">Terdaftar</th>
                  <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tersaring.map((baris) => {
                  const status = STATUS_PERANGKAT[baris.statusPerangkat] ?? STATUS_PERANGKAT.none
                  return (
                    <tr key={baris.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3">
                        <p className="font-semibold text-slate-800">{baris.nama}</p>
                      </td>
                      <td className="px-5 py-3">
                        {baris.unit_kerja === 'Belum ditentukan' ? (
                          <Badge variant="peringatan">Belum ditentukan</Badge>
                        ) : (
                          <span className="text-slate-600">{baris.unit_kerja}</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={baris.role === 'superadmin' ? 'info' : 'netral'}>
                          {baris.role === 'superadmin' ? 'Super Admin' : 'Pegawai'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {formatTanggalRingkas(formatTanggalInput(baris.dibuat_pada))}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="sekunder" onClick={() => bukaUbah(baris)}>
                          Ubah
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal terbuka={Boolean(pilih)} onTutup={() => setPilih(null)} judul="Ubah Data Pegawai">
        {pilih && (
          <form onSubmit={simpan} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Role akun (tidak dapat diubah dari aplikasi)</p>
              <p className="text-sm font-bold text-slate-800">
                {pilih.role === 'superadmin' ? 'Super Admin' : 'Pegawai'}
              </p>
            </div>

            <div>
              <label className="label-input" htmlFor="ubah-nama">
                Nama Lengkap
              </label>
              <input
                id="ubah-nama"
                className="input-dasar"
                value={form.nama}
                onChange={(e) => setForm((l) => ({ ...l, nama: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label-input" htmlFor="ubah-unit">
                Unit Kerja
              </label>
              <input
                id="ubah-unit"
                className="input-dasar"
                list="daftar-unit"
                placeholder="Contoh: IGD, Ranap, Poli Umum"
                value={form.unitKerja}
                onChange={(e) => setForm((l) => ({ ...l, unitKerja: e.target.value }))}
                required
              />
              <datalist id="daftar-unit">
                {units.map((u) => (
                  <option key={u} value={u} />
                ))}
              </datalist>
              <p className="mt-1 text-[11px] text-slate-400">
                Pilih unit yang sudah ada atau ketik unit baru.
              </p>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <Button variant="sekunder" onClick={() => setPilih(null)}>
                Batal
              </Button>
              <Button type="submit" disabled={menyimpan}>
                {menyimpan ? 'Menyimpan…' : 'Simpan Perubahan'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
