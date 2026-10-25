/**
 * ==========================================================================
 * Super Admin — Data Pegawai
 * --------------------------------------------------------------------------
 * Melihat pegawai non-ASN, memperbarui nama/unit kerja/status kepala ruangan,
 * serta memantau status perangkat. Akun Super Admin tidak ditampilkan karena
 * bukan pegawai. Satu unit hanya boleh memiliki satu kepala ruangan.
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
  const [filterPola, setFilterPola] = useState('semua')
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [menyimpan, setMenyimpan] = useState(false)

  const [pilih, setPilih] = useState(null)
  const [form, setForm] = useState({
    nama: '',
    unitKerja: '',
    kepalaRuangan: false,
    polaKerja: 'shift',
  })

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
      const cocokPola = filterPola === 'semua' || (p.pola_kerja ?? 'shift') === filterPola
      return cocokNama && cocokUnit && cocokPola
    })
  }, [daftar, cari, filterUnit, filterPola])

  const kepalaUnitLain = useMemo(() => {
    if (!pilih || !form.kepalaRuangan) return null
    const unit = form.unitKerja.trim().toLowerCase()
    if (!unit) return null
    return (
      daftar.find(
        (p) =>
          p.id !== pilih.id &&
          p.kepala_ruangan &&
          (p.unit_kerja ?? '').trim().toLowerCase() === unit,
      ) ?? null
    )
  }, [daftar, form.kepalaRuangan, form.unitKerja, pilih])

  const bukaUbah = (baris) => {
    setPilih(baris)
    setForm({
      nama: baris.nama,
      unitKerja: baris.unit_kerja,
      kepalaRuangan: Boolean(baris.kepala_ruangan),
      polaKerja: baris.pola_kerja ?? 'shift',
    })
  }

  const simpan = async (event) => {
    event.preventDefault()
    setGalat(null)
    setPesan(null)
    setMenyimpan(true)
    try {
      if (form.nama.trim().length < 2) throw new Error('Nama pegawai minimal 2 karakter.')
      if (form.unitKerja.trim().length < 2) throw new Error('Unit kerja wajib diisi.')

      const namaBaru = form.nama.trim()
      const unitBaru = form.unitKerja.trim()
      const pindahUnit = (pilih.unit_kerja ?? '').trim() !== unitBaru

      const hasil = await perbaruiPegawai({
        id: pilih.id,
        nama: form.nama,
        unitKerja: form.unitKerja,
        kepalaRuangan: form.kepalaRuangan,
        polaKerja: form.polaKerja,
      })

      let pesanBaru = `Data ${namaBaru} berhasil diperbarui.`
      if (form.kepalaRuangan && hasil?.kepala_sebelumnya) {
        pesanBaru = `${namaBaru} sekarang menjadi Kepala Ruangan ${unitBaru}. Status kepala ${hasil.kepala_sebelumnya} dilepas otomatis.`
      } else if (form.kepalaRuangan && (!pilih.kepala_ruangan || pindahUnit)) {
        pesanBaru = `${namaBaru} sekarang menjadi Kepala Ruangan ${unitBaru}.`
      } else if (!form.kepalaRuangan && pilih.kepala_ruangan) {
        pesanBaru = `Status Kepala Ruangan ${namaBaru} dicabut.`
      } else if (form.polaKerja !== (pilih.pola_kerja ?? 'shift')) {
        pesanBaru = `Pola kerja ${namaBaru} diubah menjadi ${
          form.polaKerja === 'reguler' ? 'Reguler' : 'Shift'
        }.`
      }

      setPilih(null)
      setPesan(pesanBaru)
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
        deskripsi="Kelola nama, grup/unit, pola kerja (Reguler/Shift), dan kepala ruangan pegawai non-ASN. Akun Super Admin tidak ditampilkan."
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

      <div className="mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-kartu sm:grid-cols-3 sm:p-4 lg:max-w-3xl">
        <div>
          <label className="label-input" htmlFor="cari-pegawai">
            Cari Nama
          </label>
          <input
            id="cari-pegawai"
            name="cari-pegawai"
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
            name="filter-unit-pegawai"
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
        <div>
          <label className="label-input" htmlFor="filter-pola-pegawai">
            Pola Kerja
          </label>
          <select
            id="filter-pola-pegawai"
            name="filter-pola-pegawai"
            className="input-dasar"
            value={filterPola}
            onChange={(e) => setFilterPola(e.target.value)}
          >
            <option value="semua">Semua pola</option>
            <option value="shift">Shift</option>
            <option value="reguler">Reguler</option>
          </select>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Daftar Pegawai</h2>
            <p className="text-xs text-slate-500">
              {tersaring.length} dari {daftar.length} akun
            </p>
          </div>
        </div>

        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat data pegawai…
          </div>
        ) : tersaring.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Tidak ada pegawai yang cocok dengan pencarian.
          </div>
        ) : (
          <>
            {/* HP: kartu pegawai */}
            <div className="divide-y divide-slate-100 md:hidden">
              {tersaring.map((baris) => {
                const status = STATUS_PERANGKAT[baris.statusPerangkat] ?? STATUS_PERANGKAT.none
                return (
                  <article key={baris.id} className="px-4 py-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-bold text-slate-800">{baris.nama}</p>
                        <p className="truncate text-[11px] text-slate-500">{baris.unit_kerja}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-1">
                        <Badge variant={baris.kepala_ruangan ? 'peringatan' : 'netral'}>
                          {baris.kepala_ruangan ? 'Kepala Ruangan' : 'Pegawai'}
                        </Badge>
                        <Badge variant={baris.pola_kerja === 'reguler' ? 'info' : 'netral'}>
                          {baris.pola_kerja === 'reguler' ? 'Reguler' : 'Shift'}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <span className="text-[10px] text-slate-400">
                        Terdaftar {formatTanggalRingkas(formatTanggalInput(baris.dibuat_pada))}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="sekunder"
                      className="mt-3 w-full"
                      onClick={() => bukaUbah(baris)}
                    >
                      Ubah Data
                    </Button>
                  </article>
                )
              })}
            </div>

            {/* Desktop: tabel */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Nama</th>
                    <th className="px-5 py-3 font-semibold">Unit Kerja</th>
                    <th className="px-5 py-3 font-semibold">Pola</th>
                    <th className="px-5 py-3 font-semibold">Peran</th>
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
                          <Badge variant={baris.pola_kerja === 'reguler' ? 'info' : 'netral'}>
                            {baris.pola_kerja === 'reguler' ? 'Reguler' : 'Shift'}
                          </Badge>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={baris.kepala_ruangan ? 'peringatan' : 'netral'}>
                            {baris.kepala_ruangan ? 'Kepala Ruangan' : 'Pegawai'}
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
          </>
        )}
      </section>

      <Modal terbuka={Boolean(pilih)} onTutup={() => setPilih(null)} judul="Ubah Data Pegawai">
        {pilih && (
          <form onSubmit={simpan} className="space-y-4">
            <div>
              <label className="label-input" htmlFor="ubah-peran">
                Peran
              </label>
              <select
                id="ubah-peran"
                name="peran"
                className="input-dasar"
                value={form.kepalaRuangan ? 'kepala_ruangan' : 'pegawai'}
                onChange={(e) =>
                  setForm((l) => ({ ...l, kepalaRuangan: e.target.value === 'kepala_ruangan' }))
                }
                required
              >
                <option value="pegawai">Pegawai</option>
                <option value="kepala_ruangan">Kepala Ruangan</option>
              </select>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Satu unit hanya boleh memiliki satu kepala ruangan. Jika unit sudah punya kepala,
                statusnya akan dipindahkan otomatis setelah disimpan.
              </p>
            </div>

            {form.kepalaRuangan && kepalaUnitLain && (
              <Alert variant="peringatan" title="Kepala ruangan dipindahkan">
                Unit {form.unitKerja.trim()} sudah memiliki kepala ruangan: {kepalaUnitLain.nama}.
                Jika disimpan, status kepala dipindahkan ke {form.nama.trim() || pilih.nama} dan{' '}
                {kepalaUnitLain.nama} kembali menjadi Pegawai.
              </Alert>
            )}

            <div>
              <label className="label-input" htmlFor="ubah-nama">
                Nama Lengkap
              </label>
              <input
                id="ubah-nama"
                name="nama"
                className="input-dasar"
                autoComplete="off"
                value={form.nama}
                onChange={(e) => setForm((l) => ({ ...l, nama: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label-input" htmlFor="ubah-unit">
                Grup / Unit Kerja
              </label>
              <select
                id="ubah-unit"
                name="unit-kerja"
                className="input-dasar"
                value={form.unitKerja}
                onChange={(e) => setForm((l) => ({ ...l, unitKerja: e.target.value }))}
                required
              >
                <option value="">— pilih grup —</option>
                {units.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Daftar grup dikelola di menu Grup Shift. Rename grup akan memperbarui unit
                seluruh pegawai di dalamnya.
              </p>
            </div>

            <div>
              <label className="label-input" htmlFor="ubah-pola">
                Pola Kerja
              </label>
              <select
                id="ubah-pola"
                name="pola-kerja"
                className="input-dasar"
                value={form.polaKerja}
                onChange={(e) => setForm((l) => ({ ...l, polaKerja: e.target.value }))}
                required
              >
                <option value="shift">Shift — mengikuti jadwal per tanggal</option>
                <option value="reguler">Reguler — Senin–Jumat, jam kantor</option>
              </select>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                Reguler: Senin–Kamis 08.00–16.30, Jumat 08.00–16.00, Sabtu–Minggu libur.
                Pegawai shift hanya dijadwalkan lewat menu Jadwal Shift.
              </p>
            </div>

            <div className="aksi-modal">
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
