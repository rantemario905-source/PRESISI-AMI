/**
 * ==========================================================================
 * Super Admin — Master Shift
 * --------------------------------------------------------------------------
 * Mengelola daftar shift (Pagi/Siang/Malam). Penugasan jadwal per pegawai
 * dilakukan di menu Jadwal Shift.
 * ==========================================================================
 */
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ambilMasterShift,
  hapusMasterShift,
  simpanMasterShift,
} from '../../services/shiftService.js'
import { Alert, Badge, Button, Modal, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const FORM_KOSONG = {
  id: null,
  nama_shift: '',
  jam_mulai: '07:30',
  jam_selesai: '14:30',
}

export default function MasterShift() {
  const [master, setMaster] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [galatModal, setGalatModal] = useState(null)
  const [pesan, setPesan] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_KOSONG)
  const [menyimpan, setMenyimpan] = useState(false)

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      const data = await ambilMasterShift()
      setMaster(data)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat master shift.')
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    muat()
  }, [muat])

  function bukaTambah() {
    setForm(FORM_KOSONG)
    setGalatModal(null)
    setPesan(null)
    setModal(true)
  }

  function bukaUbah(baris) {
    setForm({
      id: baris.id,
      nama_shift: baris.nama_shift,
      jam_mulai: String(baris.jam_mulai).slice(0, 5),
      jam_selesai: String(baris.jam_selesai).slice(0, 5),
    })
    setGalatModal(null)
    setPesan(null)
    setModal(true)
  }

  async function simpan(event) {
    event.preventDefault()
    setMenyimpan(true)
    setGalatModal(null)
    try {
      await simpanMasterShift(form)
      setModal(false)
      setPesan('Master shift berhasil disimpan.')
      await muat()
    } catch (err) {
      setGalatModal(err.message || 'Gagal menyimpan master shift.')
    } finally {
      setMenyimpan(false)
    }
  }

  async function hapus(baris) {
    if (
      !window.confirm(
        `Hapus shift "${baris.nama_shift}"? Seluruh jadwal yang memakai shift ini juga akan terhapus.`,
      )
    ) {
      return
    }
    setGalat(null)
    setPesan(null)
    try {
      await hapusMasterShift(baris.id)
      setPesan('Master shift dihapus.')
      await muat()
    } catch (err) {
      setGalat(err.message || 'Gagal menghapus shift.')
    }
  }

  return (
    <>
      <KepalaHalaman
        judul="Master Shift"
        deskripsi="Daftar pola jam shift yang dapat dipakai pada Jadwal Shift. Shift yang melewati tengah malam (contoh Malam 21.30–07.30) didukung absen pulang lintas hari."
        aksi={
          <>
            <Link
              to="/superadmin-portal/jadwal-shift"
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 sm:min-h-[36px]"
            >
              Buka Jadwal Shift
            </Link>
            <Button size="sm" onClick={bukaTambah}>
              + Shift
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

      <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Daftar Master Shift</h2>
            <p className="text-[11px] text-slate-500 sm:text-xs">
              {master.length} shift terdaftar
            </p>
          </div>
        </div>

        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat master shift…
          </div>
        ) : master.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            Belum ada master shift. Tambahkan shift Pagi/Siang/Malam.
          </div>
        ) : (
          <>
            <div className="divide-y divide-slate-100 md:hidden">
              {master.map((baris) => (
                <article key={baris.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold text-slate-800">{baris.nama_shift}</p>
                    <Badge variant="info">
                      {String(baris.jam_mulai).slice(0, 5)} –{' '}
                      {String(baris.jam_selesai).slice(0, 5)}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="sekunder"
                      onClick={() => bukaUbah(baris)}
                    >
                      Ubah
                    </Button>
                    <Button
                      size="sm"
                      variant="bahayaLembut"
                      onClick={() => hapus(baris)}
                    >
                      Hapus
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Nama</th>
                    <th className="px-5 py-3 font-semibold">Jam</th>
                    <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {master.map((baris) => (
                    <tr key={baris.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 font-semibold text-slate-800">
                        {baris.nama_shift}
                      </td>
                      <td className="px-5 py-3 text-xs tabular-nums text-slate-600">
                        {String(baris.jam_mulai).slice(0, 5)} –{' '}
                        {String(baris.jam_selesai).slice(0, 5)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="sekunder"
                            onClick={() => bukaUbah(baris)}
                          >
                            Ubah
                          </Button>
                          <Button
                            size="sm"
                            variant="bahayaLembut"
                            onClick={() => hapus(baris)}
                          >
                            Hapus
                          </Button>
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

      <Modal
        terbuka={modal}
        onTutup={() => setModal(false)}
        judul={form.id ? 'Ubah Master Shift' : 'Tambah Master Shift'}
      >
        <form onSubmit={simpan} className="space-y-4">
          {galatModal && (
            <Alert variant="bahaya" title="Gagal Menyimpan">
              {galatModal}
            </Alert>
          )}

          <div>
            <label className="label-input" htmlFor="nama-shift">
              Nama Shift
            </label>
            <input
              id="nama-shift"
              className="input-dasar"
              placeholder="Contoh: Pagi"
              value={form.nama_shift}
              onChange={(e) =>
                setForm((l) => ({ ...l, nama_shift: e.target.value }))
              }
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
                value={form.jam_mulai}
                onChange={(e) =>
                  setForm((l) => ({ ...l, jam_mulai: e.target.value }))
                }
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
                value={form.jam_selesai}
                onChange={(e) =>
                  setForm((l) => ({ ...l, jam_selesai: e.target.value }))
                }
                required
              />
            </div>
          </div>
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-500">
            Jika jam selesai lebih kecil dari jam mulai, shift dianggap melewati
            tengah malam (contoh Malam 21.30–07.30).
          </p>
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
