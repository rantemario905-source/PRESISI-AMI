/**
 * ==========================================================================
 * Super Admin — Kepala Unit
 * --------------------------------------------------------------------------
 * Menetapkan satu atau beberapa unit kepada seorang kepala. Satu unit hanya
 * boleh memiliki satu kepala. Kepala non-ASN memakai akun pegawai yang sudah
 * ada; kepala ASN memakai akun login bertanda `jenis_akun = kepala_asn` dan
 * tidak dihitung sebagai pegawai.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { ambilDataPegawai, ambilUnitKerja } from '../../services/pegawaiService.js'
import {
  ambilAkunKepalaAsn,
  ambilDaftarKepalaUnit,
  simpanKepalaUnit,
} from '../../services/kepalaUnitService.js'
import { Alert, Badge, Button, Modal, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

const FORM_KOSONG = { userId: '', nama: '', jenis: 'non_asn', units: [] }

export default function KepalaUnit() {
  const { profil } = useAuth()
  const [daftar, setDaftar] = useState([])
  const [pegawai, setPegawai] = useState([])
  const [akunAsn, setAkunAsn] = useState([])
  const [units, setUnits] = useState([])
  const [memuat, setMemuat] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)

  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(FORM_KOSONG)
  const [cariUnit, setCariUnit] = useState('')
  const [galatModal, setGalatModal] = useState(null)
  const [menyimpan, setMenyimpan] = useState(false)

  const adalahSuperadmin = profil?.role === 'superadmin'

  const muat = useCallback(async () => {
    setMemuat(true)
    try {
      const [dataKepala, dataPegawai, dataAsn, dataUnit] = await Promise.all([
        ambilDaftarKepalaUnit(),
        ambilDataPegawai(),
        ambilAkunKepalaAsn(),
        ambilUnitKerja(),
      ])
      setDaftar(dataKepala)
      setPegawai(dataPegawai)
      setAkunAsn(dataAsn)
      setUnits(dataUnit)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat data kepala unit.')
    } finally {
      setMemuat(false)
    }
  }, [])

  useEffect(() => {
    muat()
  }, [muat])

  const kandidat = useMemo(() => {
    const peta = new Map()
    for (const p of pegawai.filter((item) => item.role === 'pegawai')) {
      peta.set(p.id, {
        userId: p.id,
        nama: p.nama,
        email: null,
        jenis: 'non_asn',
        unit: p.unit_kerja,
      })
    }
    for (const a of akunAsn) {
      if (!peta.has(a.user_id)) {
        peta.set(a.user_id, {
          userId: a.user_id,
          nama: a.nama,
          email: a.email,
          jenis: 'asn',
          unit: null,
        })
      }
    }
    for (const k of daftar) {
      if (!peta.has(k.user_id)) {
        peta.set(k.user_id, {
          userId: k.user_id,
          nama: k.nama,
          email: k.email,
          jenis: k.jenis ?? 'asn',
          unit: null,
        })
      }
    }
    return [...peta.values()]
  }, [pegawai, akunAsn, daftar])

  const kepalaPerUnit = useMemo(() => {
    const peta = new Map()
    for (const k of daftar) {
      for (const unit of k.unit_dikelola ?? []) peta.set(unit, k.nama)
    }
    return peta
  }, [daftar])

  const unitTersaring = useMemo(() => {
    const kata = cariUnit.trim().toLowerCase()
    if (!kata) return units
    return units.filter((u) => u.toLowerCase().includes(kata))
  }, [units, cariUnit])

  const ubahKandidat = (userId) => {
    const data = kandidat.find((k) => k.userId === userId)
    if (!data) {
      setForm(FORM_KOSONG)
      return
    }
    const kepala = daftar.find((k) => k.user_id === userId)
    setForm({
      userId,
      nama: data.nama ?? '',
      jenis: data.jenis,
      units: kepala?.unit_dikelola ?? (data.unit ? [data.unit] : []),
    })
  }

  const bukaTambah = () => {
    setForm(FORM_KOSONG)
    setCariUnit('')
    setGalatModal(null)
    setModal(true)
  }

  const bukaAtur = (kepala) => {
    setForm({
      userId: kepala.user_id,
      nama: kepala.nama ?? '',
      jenis: kepala.jenis ?? 'non_asn',
      units: kepala.unit_dikelola ?? [],
    })
    setCariUnit('')
    setGalatModal(null)
    setModal(true)
  }

  const alihkanUnit = (unit) => {
    setForm((lama) => {
      const ada = lama.units.includes(unit)
      return {
        ...lama,
        units: ada ? lama.units.filter((u) => u !== unit) : [...lama.units, unit],
      }
    })
  }

  const simpan = async (event) => {
    event.preventDefault()
    setGalatModal(null)
    setMenyimpan(true)
    try {
      if (!form.userId) throw new Error('Pilih akun kepala unit terlebih dahulu.')
      if (form.jenis === 'asn' && form.units.length > 0 && form.nama.trim().length < 2) {
        throw new Error('Nama kepala ASN minimal 2 karakter.')
      }

      const kepalaLama = daftar.find((k) => k.user_id === form.userId)
      const jumlahLama = kepalaLama?.unit_dikelola?.length ?? 0
      if (form.units.length === 0 && jumlahLama > 0) {
        const yakin = window.confirm(
          `Lepas seluruh unit dari ${kepalaLama.nama}? Akun tetap dapat login sebagai pegawai.`,
        )
        if (!yakin) {
          setMenyimpan(false)
          return
        }
      }

      const hasil = await simpanKepalaUnit({
        userId: form.userId,
        units: form.units,
        nama: form.jenis === 'asn' ? form.nama.trim() : null,
      })

      const diganti = hasil?.kepala_diganti
      setPesan(
        form.units.length === 0
          ? `${kepalaLama?.nama ?? form.nama} tidak lagi mengelola unit.`
          : `${form.units.length} unit disimpan${diganti ? `. Kepala sebelumnya diganti: ${diganti}.` : '.'}`,
      )
      setModal(false)
      await muat()
    } catch (err) {
      setGalatModal(err.message || 'Gagal menyimpan penugasan kepala unit.')
    } finally {
      setMenyimpan(false)
    }
  }

  if (!adalahSuperadmin) {
    return (
      <Alert variant="bahaya" title="Akses ditolak">
        Halaman ini hanya dapat dibuka Super Admin.
      </Alert>
    )
  }

  return (
    <>
      <KepalaHalaman
        judul="Kepala Unit"
        deskripsi="Tetapkan kepala untuk setiap unit. Satu unit hanya memiliki satu kepala; satu kepala boleh mengelola beberapa unit. Kepala ASN tidak dihitung sebagai pegawai."
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
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3.5 sm:px-5 sm:py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Daftar Kepala Unit</h2>
            <p className="text-xs text-slate-500">
              {daftar.length} kepala · {units.length} unit tersedia
            </p>
          </div>
          <div className="aksi-halaman">
            <Button size="sm" onClick={bukaTambah}>
              + Tugaskan Kepala
            </Button>
          </div>
        </div>

        {memuat ? (
          <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
            <Spinner /> Memuat kepala unit…
          </div>
        ) : daftar.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-slate-600">Belum ada kepala unit</p>
            <p className="mt-1 text-xs text-slate-400">
              Tugaskan akun pegawai atau akun kepala ASN ke unit kerjanya.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {daftar.map((kepala) => (
              <li
                key={kepala.user_id}
                className="flex flex-wrap items-start justify-between gap-3 px-4 py-3.5 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{kepala.nama}</p>
                    <Badge variant={kepala.jenis === 'asn' ? 'info' : 'netral'}>
                      {kepala.jenis === 'asn' ? 'ASN' : 'Non-ASN'}
                    </Badge>
                  </div>
                  {kepala.email && (
                    <p className="mt-0.5 truncate text-[11px] text-slate-400">{kepala.email}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(kepala.unit_dikelola ?? []).map((unit) => (
                      <span
                        key={unit}
                        className="rounded-md bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-800"
                      >
                        {unit}
                      </span>
                    ))}
                  </div>
                </div>
                <Button variant="sekunder" size="sm" onClick={() => bukaAtur(kepala)}>
                  Atur unit
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal
        terbuka={modal}
        onTutup={() => (menyimpan ? null : setModal(false))}
        judul="Penugasan Kepala Unit"
      >
        <form onSubmit={simpan} className="space-y-4">
          {galatModal && <Alert variant="bahaya">{galatModal}</Alert>}

          <div>
            <label className="label-input" htmlFor="kepala-akun">
              Akun Kepala
            </label>
            <select
              id="kepala-akun"
              className="input-dasar"
              value={form.userId}
              onChange={(e) => ubahKandidat(e.target.value)}
              required
            >
              <option value="">Pilih akun…</option>
              {kandidat.filter((k) => k.jenis === 'non_asn').length > 0 && (
                <optgroup label="Pegawai Non-ASN">
                  {kandidat
                    .filter((k) => k.jenis === 'non_asn')
                    .map((k) => (
                      <option key={k.userId} value={k.userId}>
                        {k.nama}
                        {k.unit ? ` — ${k.unit}` : ''}
                      </option>
                    ))}
                </optgroup>
              )}
              {kandidat.filter((k) => k.jenis === 'asn').length > 0 && (
                <optgroup label="Akun Kepala ASN">
                  {kandidat
                    .filter((k) => k.jenis === 'asn')
                    .map((k) => (
                      <option key={k.userId} value={k.userId}>
                        {k.nama}
                        {k.email ? ` — ${k.email}` : ''}
                      </option>
                    ))}
                </optgroup>
              )}
            </select>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
              Akun kepala ASN dibuat lewat Supabase Dashboard dengan metadata{' '}
              <code>jenis_akun: kepala_asn</code>.
            </p>
          </div>

          {form.jenis === 'asn' && (
            <div>
              <label className="label-input" htmlFor="kepala-nama">
                Nama untuk Tanda Tangan
              </label>
              <input
                id="kepala-nama"
                className="input-dasar"
                value={form.nama}
                onChange={(e) => setForm((l) => ({ ...l, nama: e.target.value }))}
                placeholder="Nama lengkap kepala unit"
                required={form.units.length > 0}
              />
            </div>
          )}

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="label-input mb-0" htmlFor="kepala-cari-unit">
                Unit yang Dikelola
              </label>
              <span className="text-[11px] text-slate-400">{form.units.length} dipilih</span>
            </div>
            <input
              id="kepala-cari-unit"
              className="input-dasar mt-1.5"
              value={cariUnit}
              onChange={(e) => setCariUnit(e.target.value)}
              placeholder="Cari unit…"
            />
            <div className="mt-2 max-h-60 space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {unitTersaring.length === 0 ? (
                <p className="px-1 py-3 text-center text-xs text-slate-400">
                  Tidak ada unit yang cocok.
                </p>
              ) : (
                unitTersaring.map((unit) => {
                  const pemilik = kepalaPerUnit.get(unit)
                  const milikSendiri = (form.units ?? []).includes(unit)
                  return (
                    <label
                      key={unit}
                      className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                        checked={milikSendiri}
                        onChange={() => alihkanUnit(unit)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium text-slate-700">
                          {unit}
                        </span>
                        {pemilik && (
                          <span className="block text-[11px] text-amber-700">
                            Kepala saat ini: {pemilik}
                            {milikSendiri ? ' (akan tetap)' : ' (akan diganti)'}
                          </span>
                        )}
                      </span>
                    </label>
                  )
                })
              )}
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-400">
              Kosongkan semua centang lalu simpan untuk melepas penugasan.
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="sekunder"
              size="sm"
              onClick={() => setModal(false)}
              disabled={menyimpan}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={menyimpan}>
              {menyimpan ? 'Menyimpan…' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
