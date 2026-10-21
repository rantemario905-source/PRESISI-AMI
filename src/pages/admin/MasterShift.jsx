/**
 * ==========================================================================
 * Super Admin — Master Shift & Jadwal Shift
 * --------------------------------------------------------------------------
 * Dua bagian: (1) master shift (Pagi/Siang/Malam), (2) penjadwalan shift
 * per pegawai maupun serentak untuk satu unit kerja.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ambilJadwalRentang,
  ambilMasterShift,
  hapusJadwal,
  hapusMasterShift,
  simpanJadwalMassal,
  simpanMasterShift,
} from '../../services/shiftService.js'
import { ambilSemuaPegawai } from '../../services/pegawaiService.js'
import {
  akhirBulan,
  daftarTanggal,
  formatTanggalRingkas,
  hariIni,
  periodeBulanIni,
} from '../../utils/format.js'
import { Alert, Button, Modal, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const FORM_MASTER_KOSONG = { id: null, nama_shift: '', jam_mulai: '07:00', jam_selesai: '14:00' }

export default function MasterShift() {
  const [master, setMaster] = useState([])
  const [pegawai, setPegawai] = useState([])
  const [jadwal, setJadwal] = useState([])
  const [periode, setPeriode] = useState(periodeBulanIni())
  const [memuat, setMemuat] = useState(true)
  const [memuatJadwal, setMemuatJadwal] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)

  const [modalMaster, setModalMaster] = useState(false)
  const [formMaster, setFormMaster] = useState(FORM_MASTER_KOSONG)
  const [menyimpan, setMenyimpan] = useState(false)

  const [formJadwal, setFormJadwal] = useState({
    mode: 'pegawai',
    pegawaiId: '',
    unit: '',
    shiftId: '',
    mulai: hariIni(),
    selesai: hariIni(),
  })

  const unitKerja = useMemo(
    () => [...new Set(pegawai.map((p) => p.unit_kerja).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'id')),
    [pegawai],
  )

  const muatData = useCallback(async () => {
    try {
      const [dataMaster, dataPegawai] = await Promise.all([ambilMasterShift(), ambilSemuaPegawai()])
      setMaster(dataMaster)
      setPegawai(dataPegawai)
      setFormJadwal((lama) => ({
        ...lama,
        shiftId: lama.shiftId || dataMaster[0]?.id || '',
        pegawaiId: lama.pegawaiId || dataPegawai[0]?.id || '',
        unit: lama.unit || dataPegawai[0]?.unit_kerja || '',
      }))
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat data shift.')
    } finally {
      setMemuat(false)
    }
  }, [])

  const muatJadwal = useCallback(async () => {
    setMemuatJadwal(true)
    try {
      const data = await ambilJadwalRentang(`${periode}-01`, akhirBulan(periode))
      setJadwal(data)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat jadwal shift.')
    } finally {
      setMemuatJadwal(false)
    }
  }, [periode])

  useEffect(() => {
    muatData()
  }, [muatData])

  useEffect(() => {
    muatJadwal()
  }, [muatJadwal])

  /* ------------------------------ Master ------------------------------- */

  const bukaTambahMaster = () => {
    setFormMaster(FORM_MASTER_KOSONG)
    setModalMaster(true)
  }

  const bukaUbahMaster = (baris) => {
    setFormMaster({
      id: baris.id,
      nama_shift: baris.nama_shift,
      jam_mulai: String(baris.jam_mulai).slice(0, 5),
      jam_selesai: String(baris.jam_selesai).slice(0, 5),
    })
    setModalMaster(true)
  }

  const simpanMaster = async (event) => {
    event.preventDefault()
    setMenyimpan(true)
    setGalat(null)
    setPesan(null)
    try {
      await simpanMasterShift(formMaster)
      setModalMaster(false)
      setPesan('Master shift berhasil disimpan.')
      await muatData()
    } catch (err) {
      setGalat(err.message || 'Gagal menyimpan master shift.')
    } finally {
      setMenyimpan(false)
    }
  }

  const hapusMaster = async (baris) => {
    if (
      !window.confirm(
        `Hapus shift "${baris.nama_shift}"? Seluruh jadwal yang memakai shift ini juga akan terhapus.`,
      )
    )
      return
    setGalat(null)
    setPesan(null)
    try {
      await hapusMasterShift(baris.id)
      setPesan('Master shift dihapus.')
      await Promise.all([muatData(), muatJadwal()])
    } catch (err) {
      setGalat(err.message || 'Gagal menghapus shift.')
    }
  }

  /* ------------------------------ Jadwal ------------------------------- */

  const simpanJadwal = async (event) => {
    event.preventDefault()
    setMenyimpan(true)
    setGalat(null)
    setPesan(null)
    try {
      if (!formJadwal.shiftId) throw new Error('Pilih shift terlebih dahulu.')
      if (!formJadwal.mulai || !formJadwal.selesai) throw new Error('Lengkapi rentang tanggal jadwal.')
      if (formJadwal.selesai < formJadwal.mulai) throw new Error('Tanggal selesai tidak boleh sebelum tanggal mulai.')

      let userIds = []
      if (formJadwal.mode === 'pegawai') {
        if (!formJadwal.pegawaiId) throw new Error('Pilih pegawai terlebih dahulu.')
        userIds = [formJadwal.pegawaiId]
      } else {
        userIds = pegawai.filter((p) => p.unit_kerja === formJadwal.unit).map((p) => p.id)
        if (!userIds.length) throw new Error('Tidak ada pegawai pada unit yang dipilih.')
      }

      const jumlah = await simpanJadwalMassal({
        userIds,
        shiftId: formJadwal.shiftId,
        mulai: formJadwal.mulai,
        selesai: formJadwal.selesai,
      })

      setPesan(`${jumlah} baris jadwal berhasil disimpan.`)
      await muatJadwal()
    } catch (err) {
      setGalat(err.message || 'Gagal menyimpan jadwal.')
    } finally {
      setMenyimpan(false)
    }
  }

  const hapusSatuJadwal = async (baris) => {
    if (!window.confirm(`Hapus jadwal ${baris.pegawai?.nama} pada ${formatTanggalRingkas(baris.tanggal)}?`))
      return
    setGalat(null)
    setPesan(null)
    try {
      await hapusJadwal(baris.id)
      setPesan('Jadwal dihapus.')
      await muatJadwal()
    } catch (err) {
      setGalat(err.message || 'Gagal menghapus jadwal.')
    }
  }

  const jumlahHari = useMemo(
    () => daftarTanggal(formJadwal.mulai, formJadwal.selesai).length,
    [formJadwal.mulai, formJadwal.selesai],
  )

  return (
    <>
      <KepalaHalaman
        judul="Master & Jadwal Shift"
        deskripsi="Atur pola shift dan terapkan jadwal ke pegawai atau unit kerja."
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

      {memuat ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Spinner /> Memuat data…
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-5">
          {/* Master shift */}
          <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu xl:col-span-2">
            <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Master Shift</h2>
                <p className="text-xs text-slate-500">Pola jam kerja yang dapat dijadwalkan</p>
              </div>
              <Button size="sm" onClick={bukaTambahMaster}>
                + Shift
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[380px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Nama</th>
                    <th className="px-5 py-3 font-semibold">Jam</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {master.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-10 text-center text-sm text-slate-500">
                        Belum ada master shift. Tambahkan shift Pagi/Siang/Malam.
                      </td>
                    </tr>
                  ) : (
                    master.map((baris) => (
                      <tr key={baris.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-3 font-semibold text-slate-800">{baris.nama_shift}</td>
                        <td className="px-5 py-3 text-xs text-slate-600">
                          {String(baris.jam_mulai).slice(0, 5)} – {String(baris.jam_selesai).slice(0, 5)}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="sekunder" onClick={() => bukaUbahMaster(baris)}>
                              Ubah
                            </Button>
                            <Button size="sm" variant="bahayaLembut" onClick={() => hapusMaster(baris)}>
                              Hapus
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Form jadwal */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-kartu xl:col-span-3">
            <h2 className="text-sm font-bold text-slate-800">Terapkan Jadwal Shift</h2>
            <p className="mb-4 text-xs text-slate-500">
              Jadwal yang sudah ada pada tanggal yang sama akan diperbarui.
            </p>

            <form onSubmit={simpanJadwal} className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="mode"
                    value="pegawai"
                    checked={formJadwal.mode === 'pegawai'}
                    onChange={(e) => setFormJadwal((l) => ({ ...l, mode: e.target.value }))}
                  />
                  Satu pegawai
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="radio"
                    name="mode"
                    value="unit"
                    checked={formJadwal.mode === 'unit'}
                    onChange={(e) => setFormJadwal((l) => ({ ...l, mode: e.target.value }))}
                  />
                  Semua pegawai di unit
                </label>
              </div>

              {formJadwal.mode === 'pegawai' ? (
                <div>
                  <label className="label-input" htmlFor="jadwal-pegawai">
                    Pegawai
                  </label>
                  <select
                    id="jadwal-pegawai"
                    className="input-dasar"
                    value={formJadwal.pegawaiId}
                    onChange={(e) => setFormJadwal((l) => ({ ...l, pegawaiId: e.target.value }))}
                  >
                    <option value="">— pilih pegawai —</option>
                    {pegawai.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nama} — {p.unit_kerja}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="label-input" htmlFor="jadwal-unit">
                    Unit Kerja
                  </label>
                  <select
                    id="jadwal-unit"
                    className="input-dasar"
                    value={formJadwal.unit}
                    onChange={(e) => setFormJadwal((l) => ({ ...l, unit: e.target.value }))}
                  >
                    <option value="">— pilih unit —</option>
                    {unitKerja.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-400">
                    {pegawai.filter((p) => p.unit_kerja === formJadwal.unit).length} pegawai akan dijadwalkan.
                  </p>
                </div>
              )}

              <div>
                <label className="label-input" htmlFor="jadwal-shift">
                  Shift
                </label>
                <select
                  id="jadwal-shift"
                  className="input-dasar"
                  value={formJadwal.shiftId}
                  onChange={(e) => setFormJadwal((l) => ({ ...l, shiftId: e.target.value }))}
                >
                  <option value="">— pilih shift —</option>
                  {master.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama_shift} ({String(s.jam_mulai).slice(0, 5)}–{String(s.jam_selesai).slice(0, 5)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="label-input" htmlFor="jadwal-mulai">
                    Tanggal Mulai
                  </label>
                  <input
                    id="jadwal-mulai"
                    type="date"
                    className="input-dasar"
                    value={formJadwal.mulai}
                    onChange={(e) => setFormJadwal((l) => ({ ...l, mulai: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="label-input" htmlFor="jadwal-selesai">
                    Tanggal Selesai
                  </label>
                  <input
                    id="jadwal-selesai"
                    type="date"
                    className="input-dasar"
                    value={formJadwal.selesai}
                    onChange={(e) => setFormJadwal((l) => ({ ...l, selesai: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <p className="text-xs text-slate-500">{jumlahHari} hari akan dijadwalkan.</p>
                <Button type="submit" disabled={menyimpan || master.length === 0}>
                  {menyimpan ? 'Menyimpan…' : 'Simpan Jadwal'}
                </Button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Daftar jadwal bulan terpilih */}
      <section className="mt-5 rounded-2xl border border-slate-200 bg-white shadow-kartu">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Jadwal Bulan Terpilih</h2>
            <p className="text-xs text-slate-500">Hapus jadwal yang tidak diperlukan</p>
          </div>
          <input
            type="month"
            className="input-dasar max-w-[190px]"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
            aria-label="Pilih bulan jadwal"
          />
        </div>

        {memuatJadwal ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
            <Spinner /> Memuat jadwal…
          </div>
        ) : jadwal.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500">Belum ada jadwal pada bulan ini.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-5 py-3 font-semibold">Pegawai</th>
                  <th className="px-5 py-3 font-semibold">Unit</th>
                  <th className="px-5 py-3 font-semibold">Shift</th>
                  <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jadwal.map((baris) => (
                  <tr key={baris.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-3 text-slate-700">{formatTanggalRingkas(baris.tanggal)}</td>
                    <td className="px-5 py-3 font-semibold text-slate-800">{baris.pegawai?.nama ?? '—'}</td>
                    <td className="px-5 py-3 text-xs text-slate-500">{baris.pegawai?.unit_kerja ?? '—'}</td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
                        {baris.shift_master?.nama_shift ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Button size="sm" variant="bahayaLembut" onClick={() => hapusSatuJadwal(baris)}>
                        Hapus
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        terbuka={modalMaster}
        onTutup={() => setModalMaster(false)}
        judul={formMaster.id ? 'Ubah Master Shift' : 'Tambah Master Shift'}
      >
        <form onSubmit={simpanMaster} className="space-y-4">
          <div>
            <label className="label-input" htmlFor="nama-shift">
              Nama Shift
            </label>
            <input
              id="nama-shift"
              className="input-dasar"
              placeholder="Contoh: Pagi"
              value={formMaster.nama_shift}
              onChange={(e) => setFormMaster((l) => ({ ...l, nama_shift: e.target.value }))}
              required
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-input" htmlFor="jam-mulai-shift">
                Jam Mulai
              </label>
              <input
                id="jam-mulai-shift"
                type="time"
                className="input-dasar"
                value={formMaster.jam_mulai}
                onChange={(e) => setFormMaster((l) => ({ ...l, jam_mulai: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label-input" htmlFor="jam-selesai-shift">
                Jam Selesai
              </label>
              <input
                id="jam-selesai-shift"
                type="time"
                className="input-dasar"
                value={formMaster.jam_selesai}
                onChange={(e) => setFormMaster((l) => ({ ...l, jam_selesai: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button variant="sekunder" onClick={() => setModalMaster(false)}>
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
