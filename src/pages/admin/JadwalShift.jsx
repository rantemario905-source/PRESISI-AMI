/**
 * ==========================================================================
 * Jadwal Shift — Super Admin & Kepala Ruangan (grid per grup)
 * --------------------------------------------------------------------------
 * Satu grup/unit dipilih, lalu jadwal diatur per pegawai dan per tanggal.
 * Hanya pegawai pola Shift yang ditampilkan. Pegawai Reguler memakai jam
 * kerja tetap dan tidak perlu dijadwalkan di sini.
 *
 * Mode kepala ruangan: unit terkunci ke unit sendiri dan hanya tanggal hari
 * ini (WITA) serta seterusnya. Setiap perubahan sel langsung disimpan.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  ambilJadwalRentang,
  ambilMasterShift,
  hapusJadwalSel,
  imporJadwalShift,
  simpanJadwalBanyak,
  simpanJadwalSel,
  tukarShift,
} from '../../services/shiftService.js'
import { ambilSemuaPegawai } from '../../services/pegawaiService.js'
import { ambilGrupShift } from '../../services/groupShiftService.js'
import { ambilHariLiburRentang } from '../../services/hariLiburService.js'
import { ambilNamaKepalaUnit } from '../../services/kepalaUnitService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  akhirBulan,
  daftarTanggal,
  formatTanggal,
  formatTanggalRingkas,
  hariIni,
  namaBulan,
  periodeBulanIni,
} from '../../utils/format.js'
import {
  BATAS_UKURAN_TEMPLATE,
  bacaTemplateJadwal,
  buatTemplateJadwal,
  hitungPerubahanTemplate,
  namaFileTemplate,
  unduhLaporanErrorJadwal,
  unduhTemplateXlsx,
} from '../../utils/templateJadwal.js'
import { susunMatriksJadwal } from '../../utils/jadwalCetak.js'
import { Alert, Badge, Button, Modal, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'
import LembarJadwal from '../../components/laporan/LembarJadwal.jsx'

const HARI = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

const KELAS_SHIFT = {
  pagi: 'bg-sky-100 text-sky-800 ring-sky-200 hover:bg-sky-200',
  siang: 'bg-amber-100 text-amber-800 ring-amber-200 hover:bg-amber-200',
  malam: 'bg-indigo-100 text-indigo-800 ring-indigo-200 hover:bg-indigo-200',
}

function kunciShift(nama) {
  return String(nama ?? '').trim().toLowerCase()
}

function hariDari(tanggal) {
  return HARI[new Date(`${tanggal}T00:00:00Z`).getUTCDay()]
}

function angkaTanggal(tanggal) {
  return Number(tanggal.slice(8, 10))
}

function akhirPekan(tanggal) {
  const hari = new Date(`${tanggal}T00:00:00Z`).getUTCDay()
  return hari === 0 || hari === 6
}

function periodeValid(periode) {
  return /^\d{4}-\d{2}$/.test(String(periode ?? ''))
}

function geserBulan(periode, selisih) {
  if (!periodeValid(periode)) return periodeBulanIni()
  const [tahun, bulan] = periode.split('-').map(Number)
  const tanggal = new Date(Date.UTC(tahun, bulan - 1 + selisih, 1))
  return tanggal.toISOString().slice(0, 7)
}

function singkatanShift(nama) {
  const kunci = kunciShift(nama)
  if (kunci === 'pagi') return 'P'
  if (kunci === 'siang') return 'S'
  if (kunci === 'malam') return 'M'
  return String(nama ?? '?').slice(0, 2).toUpperCase()
}

function jamPendek(jam) {
  return String(jam ?? '').slice(0, 5)
}

export default function JadwalShift({ mode = 'admin' }) {
  const { profil } = useAuth()
  const konteksKepala = useOutletContext()
  const modeKepala = mode === 'kepala'
  const unitKepala = modeKepala
    ? konteksKepala?.unitAktif || profil?.unit_kerja || ''
    : ''

  const [master, setMaster] = useState([])
  const [grup, setGrup] = useState([])
  const [pegawai, setPegawai] = useState([])
  const [jadwal, setJadwal] = useState([])
  const [liburMap, setLiburMap] = useState(new Map())

  const [periode, setPeriode] = useState(periodeBulanIni())
  const [seksi, setSeksi] = useState('semua')
  const [grupNama, setGrupNama] = useState('')

  const [memuat, setMemuat] = useState(true)
  const [memuatJadwal, setMemuatJadwal] = useState(true)
  const [galat, setGalat] = useState(null)
  const [pesan, setPesan] = useState(null)

  const [pilihSel, setPilihSel] = useState(null)
  const [menyimpanSel, setMenyimpanSel] = useState(false)
  const [menyimpanSelKey, setMenyimpanSelKey] = useState(null)
  const [galatModal, setGalatModal] = useState(null)
  const [menyalin, setMenyalin] = useState(false)

  const [pegawaiMobileId, setPegawaiMobileId] = useState('')

  const [modalTemplate, setModalTemplate] = useState(false)
  const [memuatTemplate, setMemuatTemplate] = useState(false)
  const [membacaTemplate, setMembacaTemplate] = useState(false)
  const [mengimporTemplate, setMengimporTemplate] = useState(false)
  const [hasilTemplate, setHasilTemplate] = useState(null)
  const [galatTemplate, setGalatTemplate] = useState(null)
  const [namaFileImpor, setNamaFileImpor] = useState('')
  const fileTemplateRef = useRef(null)

  const [modalTukar, setModalTukar] = useState(false)
  const [menyimpanTukar, setMenyimpanTukar] = useState(false)
  const [galatTukar, setGalatTukar] = useState(null)
  const [formTukar, setFormTukar] = useState({
    tanggal: hariIni(),
    pegawaiA: '',
    pegawaiB: '',
    alasan: '',
  })
  const [waktuCetak, setWaktuCetak] = useState(() => new Date().toISOString())
  const [namaKepala, setNamaKepala] = useState('')

  const muatAwal = useCallback(async () => {
    setMemuat(true)
    try {
      const opsiPegawai = modeKepala ? { unitKerja: unitKepala } : undefined
      const [dataMaster, dataGrup, dataPegawai] = await Promise.all([
        ambilMasterShift(),
        ambilGrupShift(),
        ambilSemuaPegawai(opsiPegawai),
      ])
      setMaster(dataMaster)
      setGrup(
        modeKepala
          ? dataGrup.filter((g) => g.nama === unitKepala)
          : dataGrup,
      )
      setPegawai(dataPegawai)
      setGalat(null)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat data jadwal shift.')
    } finally {
      setMemuat(false)
    }
  }, [modeKepala, unitKepala])

  const pegawaiGrup = useMemo(
    () =>
      pegawai
        .filter(
          (p) =>
            p.unit_kerja === grupNama && (p.pola_kerja ?? 'shift') === 'shift',
        )
        .sort((a, b) => a.nama.localeCompare(b.nama, 'id')),
    [pegawai, grupNama],
  )

  const idPegawaiGrup = useMemo(
    () => pegawaiGrup.map((p) => p.id),
    [pegawaiGrup],
  )

  const muatJadwal = useCallback(async () => {
    if (
      !periodeValid(periode) ||
      !grupNama ||
      idPegawaiGrup.length === 0
    ) {
      setJadwal([])
      setLiburMap(new Map())
      setMemuatJadwal(false)
      return
    }
    setMemuatJadwal(true)
    setJadwal([])
    setLiburMap(new Map())
    try {
      const akhir = akhirBulan(periode)
      const [dataJadwal, dataLibur] = await Promise.all([
        ambilJadwalRentang(`${periode}-01`, akhir, {
          userIds: idPegawaiGrup,
        }),
        ambilHariLiburRentang(`${periode}-01`, akhir),
      ])
      setJadwal(dataJadwal)
      setLiburMap(new Map(dataLibur.map((h) => [h.tanggal, h.nama])))
    } catch (err) {
      setGalat(err.message || 'Gagal memuat jadwal shift.')
    } finally {
      setMemuatJadwal(false)
    }
  }, [periode, grupNama, idPegawaiGrup])

  useEffect(() => {
    muatAwal()
  }, [muatAwal])

  useEffect(() => {
    muatJadwal()
  }, [muatJadwal])

  const grupTersaring = useMemo(() => {
    if (modeKepala) return grup.filter((g) => g.nama === unitKepala)
    return seksi === 'semua' ? grup : grup.filter((g) => g.seksi === seksi)
  }, [grup, seksi, modeKepala, unitKepala])

  useEffect(() => {
    if (modeKepala) {
      setGrupNama(unitKepala)
      return
    }
    if (!grupTersaring.some((g) => g.nama === grupNama)) {
      const adaPegawaiShift = (g) =>
        pegawai.some(
          (p) =>
            p.unit_kerja === g.nama && (p.pola_kerja ?? 'shift') === 'shift',
        )
      const kandidat =
        grupTersaring.find(adaPegawaiShift) ?? grupTersaring[0] ?? null
      setGrupNama(kandidat?.nama ?? '')
    }
  }, [grupTersaring, grupNama, pegawai, modeKepala, unitKepala])

  useEffect(() => {
    if (!pegawaiGrup.some((p) => p.id === pegawaiMobileId)) {
      setPegawaiMobileId(pegawaiGrup[0]?.id ?? '')
    }
  }, [pegawaiGrup, pegawaiMobileId])

  const pegawaiTanpaJadwal = useMemo(() => {
    if (!pegawaiGrup.length) return []
    const punyaJadwal = new Set(jadwal.map((baris) => baris.user_id))
    return pegawaiGrup.filter((p) => !punyaJadwal.has(p.id))
  }, [pegawaiGrup, jadwal])

  const tanggalList = useMemo(
    () =>
      periodeValid(periode)
        ? daftarTanggal(`${periode}-01`, akhirBulan(periode))
        : [],
    [periode],
  )

  const jadwalMap = useMemo(() => {
    const peta = new Map()
    for (const baris of jadwal) {
      peta.set(`${baris.user_id}|${baris.tanggal}`, baris)
    }
    return peta
  }, [jadwal])

  const masterMap = useMemo(
    () => new Map(master.map((s) => [s.id, s])),
    [master],
  )

  const pegawaiMap = useMemo(
    () => new Map(pegawaiGrup.map((p) => [p.id, p])),
    [pegawaiGrup],
  )

  const matriksJadwal = useMemo(
    () => susunMatriksJadwal({ pegawai: pegawaiGrup, jadwal, periode }),
    [pegawaiGrup, jadwal, periode],
  )

  const pegawaiMobile = pegawaiGrup.find((p) => p.id === pegawaiMobileId)
  const periodeMasaDepan = !modeKepala || periode >= periodeBulanIni()

  const tanggalTemplate = useMemo(() => {
    if (!modeKepala) return tanggalList
    return tanggalList.filter((tanggal) => tanggal >= hariIni())
  }, [modeKepala, tanggalList])

  const bisaTemplate =
    Boolean(grupNama) &&
    pegawaiGrup.length > 0 &&
    master.length > 0 &&
    tanggalTemplate.length > 0 &&
    !memuat &&
    !memuatJadwal &&
    (!modeKepala || periodeMasaDepan)

  function alasanTemplate() {
    if (memuat || memuatJadwal) return 'Memuat data jadwal…'
    if (!grupNama) return 'Pilih grup/unit terlebih dahulu.'
    if (!pegawaiGrup.length) return 'Tidak ada pegawai shift di grup ini.'
    if (!master.length) return 'Master shift belum tersedia.'
    if (modeKepala && !periodeMasaDepan) {
      return 'Bulan lampau hanya dapat dikelola Super Admin.'
    }
    if (!tanggalTemplate.length) {
      return 'Tidak ada tanggal yang dapat diubah. Pilih bulan berikutnya.'
    }
    return undefined
  }

  function bolehUbahTanggal(tanggal) {
    if (!modeKepala) return true
    return tanggal >= hariIni()
  }

  function alasanTerkunci(tanggal) {
    if (modeKepala && tanggal < hariIni()) {
      return 'Tanggal sebelum hari ini hanya dapat diubah Super Admin.'
    }
    return undefined
  }

  function bukaTukar() {
    setGalatTukar(null)
    setFormTukar({
      tanggal: hariIni(),
      pegawaiA: pegawaiGrup[0]?.id ?? '',
      pegawaiB: pegawaiGrup[1]?.id ?? '',
      alasan: '',
    })
    setModalTukar(true)
  }

  function tutupTukar() {
    if (menyimpanTukar) return
    setModalTukar(false)
  }

  async function simpanTukar() {
    const { tanggal, pegawaiA, pegawaiB, alasan } = formTukar
    if (!tanggal || !pegawaiA || !pegawaiB || pegawaiA === pegawaiB) {
      setGalatTukar('Pilih tanggal dan dua pegawai yang berbeda.')
      return
    }
    if (modeKepala && tanggal < hariIni()) {
      setGalatTukar('Tanggal sebelum hari ini hanya dapat ditukar Super Admin.')
      return
    }
    setMenyimpanTukar(true)
    setGalatTukar(null)
    setGalat(null)
    setPesan(null)
    try {
      await tukarShift({ pegawaiA, pegawaiB, tanggal, alasan })
      setModalTukar(false)
      setPesan('Jadwal shift berhasil ditukar.')
      await muatJadwal()
    } catch (err) {
      setGalatTukar(err.message || 'Gagal menukar jadwal shift.')
    } finally {
      setMenyimpanTukar(false)
    }
  }

  async function cetakJadwal() {
    if (!pegawaiGrup.length) return
    let kepala = modeKepala ? profil?.nama ?? '' : ''
    try {
      const nama = await ambilNamaKepalaUnit(grupNama)
      if (nama) kepala = nama
    } catch {
      // Fallback: nama profil untuk kepala, titik-titik untuk Super Admin.
    }
    setNamaKepala(kepala)
    setWaktuCetak(new Date().toISOString())
    window.setTimeout(() => window.print(), 80)
  }

  function bukaSel(p, tanggal) {
    if (!bolehUbahTanggal(tanggal)) return
    setPilihSel({
      userId: p.id,
      nama: p.nama,
      tanggal,
      shiftId: jadwalMap.get(`${p.id}|${tanggal}`)?.shift_id ?? '',
    })
    setGalatModal(null)
    setPesan(null)
  }

  async function simpanSel({ userId, nama, tanggal, shiftId, tutup = true }) {
    if (!bolehUbahTanggal(tanggal)) {
      const teks =
        alasanTerkunci(tanggal) ||
        'Tanggal ini tidak dapat diubah dari portal Kepala Unit.'
      setGalat(teks)
      setGalatModal(teks)
      return
    }
    setMenyimpanSel(true)
    setGalat(null)
    setGalatModal(null)
    setPesan(null)
    try {
      if (shiftId) {
        await simpanJadwalSel({ userId, tanggal, shiftId })
      } else {
        await hapusJadwalSel(userId, tanggal)
      }

      const shiftBaris = shiftId ? masterMap.get(shiftId) : null
      setJadwal((lama) => {
        const tanpa = lama.filter(
          (b) => !(b.user_id === userId && b.tanggal === tanggal),
        )
        if (!shiftId) return tanpa
        return [
          ...tanpa,
          {
            user_id: userId,
            tanggal,
            shift_id: shiftId,
            shift_master: shiftBaris,
          },
        ]
      })

      setPesan(
        shiftId
          ? `Jadwal ${nama} pada ${formatTanggalRingkas(tanggal)} disimpan.`
          : `Jadwal ${nama} pada ${formatTanggalRingkas(tanggal)} dikosongkan.`,
      )
      if (tutup) setPilihSel(null)
    } catch (err) {
      const teks = err.message || 'Gagal menyimpan jadwal.'
      setGalat(teks)
      setGalatModal(teks)
    } finally {
      setMenyimpanSel(false)
      setMenyimpanSelKey(null)
    }
  }

  async function ubahSelMobile(tanggal, shiftId) {
    if (!pegawaiMobile || !bolehUbahTanggal(tanggal)) return
    setMenyimpanSelKey(`${pegawaiMobile.id}|${tanggal}`)
    await simpanSel({
      userId: pegawaiMobile.id,
      nama: pegawaiMobile.nama,
      tanggal,
      shiftId,
      tutup: false,
    })
  }

  async function salinPola() {
    if (!pegawaiGrup.length) {
      setGalat('Tidak ada pegawai shift pada grup ini.')
      return
    }
    if (!periodeValid(periode)) {
      setGalat('Pilih bulan terlebih dahulu.')
      return
    }
    if (modeKepala && periode < periodeBulanIni()) {
      setGalat('Jadwal bulan yang sudah lewat hanya dapat diubah Super Admin.')
      return
    }

    const sumber = geserBulan(periode, -1)
    const konfirmasi = window.confirm(
      `Salin pola jadwal ${namaBulan(sumber)} ke ${namaBulan(periode)} untuk ${pegawaiGrup.length} pegawai shift di ${grupNama}? Jadwal pada tanggal yang sama akan ditimpa. Tanggal tanpa jadwal sumber tidak diubah.${
        modeKepala ? ' Hanya tanggal hari ini dan seterusnya yang akan diisi.' : ''
      }`,
    )
    if (!konfirmasi) return

    setMenyalin(true)
    setGalat(null)
    setPesan(null)
    try {
      const dataSumber = await ambilJadwalRentang(
        `${sumber}-01`,
        akhirBulan(sumber),
        { userIds: idPegawaiGrup },
      )
      const idPegawai = new Set(pegawaiGrup.map((p) => p.id))
      const peta = new Map()
      for (const baris of dataSumber) {
        if (!idPegawai.has(baris.user_id)) continue
        peta.set(
          `${baris.user_id}|${angkaTanggal(baris.tanggal)}`,
          baris.shift_id,
        )
      }

      if (!peta.size) {
        setGalat(
          `Tidak ada jadwal pada ${namaBulan(sumber)} untuk grup ${grupNama}.`,
        )
        return
      }

      const barisBaru = []
      for (const tanggal of tanggalList) {
        for (const p of pegawaiGrup) {
          const shiftId = peta.get(`${p.id}|${angkaTanggal(tanggal)}`)
          if (shiftId) {
            barisBaru.push({ user_id: p.id, tanggal, shift_id: shiftId })
          }
        }
      }

      const barisTersalin = modeKepala
        ? barisBaru.filter((baris) => baris.tanggal >= hariIni())
        : barisBaru

      if (!barisTersalin.length) {
        setGalat(
          modeKepala
            ? 'Tidak ada tanggal hari ini atau setelahnya yang dapat disalin. Pilih bulan berikutnya.'
            : 'Tidak ada jadwal yang dapat disalin.',
        )
        return
      }

      const jumlah = await simpanJadwalBanyak(barisTersalin)
      setPesan(
        `${jumlah} baris jadwal disalin dari ${namaBulan(sumber)} ke ${namaBulan(periode)}.${
          modeKepala ? ' Tanggal sebelum hari ini dilewati.' : ''
        }`,
      )
      await muatJadwal()
    } catch (err) {
      setGalat(err.message || 'Gagal menyalin pola jadwal.')
    } finally {
      setMenyalin(false)
    }
  }

  function bukaModalTemplate() {
    if (!bisaTemplate) {
      setGalat(alasanTemplate() || 'Template belum dapat digunakan.')
      return
    }
    setGalatTemplate(null)
    setHasilTemplate(null)
    setNamaFileImpor('')
    setModalTemplate(true)
    if (fileTemplateRef.current) fileTemplateRef.current.value = ''
  }

  function tutupModalTemplate() {
    if (mengimporTemplate) return
    setModalTemplate(false)
    setHasilTemplate(null)
    setGalatTemplate(null)
    setNamaFileImpor('')
  }

  async function unduhTemplate() {
    if (!bisaTemplate) {
      setGalatTemplate(alasanTemplate() || 'Template belum dapat digunakan.')
      return
    }
    setMemuatTemplate(true)
    setGalatTemplate(null)
    try {
      const data = buatTemplateJadwal({
        unitKerja: grupNama,
        periode,
        tanggal: tanggalTemplate,
        pegawai: pegawaiGrup,
        jadwalMap,
        master,
      })
      await unduhTemplateXlsx(data)
      setPesan(
        `Template Excel ${grupNama} ${namaBulan(periode)} berhasil diunduh.`,
      )
    } catch (err) {
      setGalatTemplate(err.message || 'Gagal mengunduh template.')
    } finally {
      setMemuatTemplate(false)
    }
  }

  async function bacaFileTemplate(event) {
    const file = event.target.files?.[0] ?? null
    event.target.value = ''
    if (!file) return
    if (!bisaTemplate) {
      setGalatTemplate(alasanTemplate() || 'Template belum dapat digunakan.')
      return
    }

    setMembacaTemplate(true)
    setGalatTemplate(null)
    setHasilTemplate(null)
    setNamaFileImpor(file.name)
    try {
      const hasil = await bacaTemplateJadwal(file, {
        unitKerja: grupNama,
        periode,
        tanggal: tanggalTemplate,
        pegawai: pegawaiGrup,
        master,
      })
      const rekap = hitungPerubahanTemplate(hasil.baris, {
        jadwalMap,
        masterMap,
        pegawaiMap,
      })
      setHasilTemplate({ ...hasil, ...rekap })
    } catch (err) {
      setGalatTemplate(err.message || 'Gagal membaca file template.')
    } finally {
      setMembacaTemplate(false)
      if (fileTemplateRef.current) fileTemplateRef.current.value = ''
    }
  }

  async function terapkanTemplate() {
    if (
      !hasilTemplate ||
      hasilTemplate.errors.length > 0 ||
      hasilTemplate.perubahan.length === 0 ||
      mengimporTemplate
    ) {
      return
    }
    const rincianHapus =
      hasilTemplate.dihapus > 0
        ? ` ${hasilTemplate.dihapus} jadwal akan dihapus.`
        : ''
    if (
      !window.confirm(
        `Impor ${hasilTemplate.total} perubahan jadwal ${grupNama} ${namaBulan(periode)}?${rincianHapus}`,
      )
    ) {
      return
    }

    setMengimporTemplate(true)
    setGalatTemplate(null)
    try {
      const ringkasan = await imporJadwalShift({
        unitKerja: grupNama,
        periode: `${periode}-01`,
        baris: hasilTemplate.perubahan.map((item) => ({
          user_id: item.user_id,
          tanggal: item.tanggal,
          shift_id: item.shift_id,
          aksi: item.aksi,
        })),
      })
      setModalTemplate(false)
      setHasilTemplate(null)
      setNamaFileImpor('')
      setPesan(
        `Impor jadwal selesai: ${ringkasan?.dibuat ?? 0} dibuat, ${
          ringkasan?.diperbarui ?? 0
        } diubah, ${ringkasan?.dihapus ?? 0} dihapus, ${
          ringkasan?.dilewati ?? 0
        } dilewati.`,
      )
      await muatJadwal()
    } catch (err) {
      setGalatTemplate(err.message || 'Gagal mengimpor jadwal.')
    } finally {
      setMengimporTemplate(false)
    }
  }

  function pilihFileLagi() {
    setHasilTemplate(null)
    setGalatTemplate(null)
    setNamaFileImpor('')
    fileTemplateRef.current?.click()
  }

  return (
    <>
      <style>{`@media print { @page { size: 330mm 215mm; margin: 8mm; } }`}</style>

      <div className="tanpa-cetak">
      <KepalaHalaman
        judul="Jadwal Shift"
        deskripsi="Atur jadwal shift per grup."
        aksi={
<div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Button
              variant="templat"
              size="sm"
              className="w-full sm:w-auto"
              onClick={bukaModalTemplate}
              disabled={!bisaTemplate || memuatTemplate || membacaTemplate}
              title={!bisaTemplate ? alasanTemplate() : undefined}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M12 12v6m0 0-2.5-2.5M12 18l2.5-2.5" />
              </svg>
              Template &amp; Impor
            </Button>
            <Button
              variant="salin"
              size="sm"
              className="w-full sm:w-auto"
              onClick={salinPola}
              disabled={
                memuat ||
                menyalin ||
                !pegawaiGrup.length ||
                !periodeMasaDepan
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <rect x="8" y="8" width="12" height="12" rx="2" />
                <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
              </svg>
              {menyalin ? 'Menyalin...' : 'Salin Bulan Lalu'}
            </Button>
            <Button
              variant="tukar"
              size="sm"
              className="w-full sm:w-auto"
              onClick={bukaTukar}
              disabled={memuatJadwal || pegawaiGrup.length < 2 || !grupNama}
              title={
                pegawaiGrup.length < 2
                  ? 'Butuh minimal dua pegawai shift di unit ini.'
                  : undefined
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M7 7h11l-3-3" />
                <path d="M17 17H6l3 3" />
              </svg>
              Tukar Shift
            </Button>
            <Button
              variant="utama"
              size="sm"
              className="w-full sm:w-auto"
              onClick={cetakJadwal}
              disabled={memuatJadwal || pegawaiGrup.length === 0 || !grupNama}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M6 9V3h12v6" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" rx="1" />
              </svg>
              Cetak Jadwal
            </Button>
          </div>
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

      {memuat ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Spinner /> Memuat data jadwal…
        </div>
      ) : (
        <>
          <section
            className={`mb-4 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-kartu sm:p-4 ${
              modeKepala ? 'sm:grid-cols-2' : 'sm:grid-cols-3'
            }`}
          >
            {modeKepala ? (
              <div>
                <p className="label-input">Unit Kerja</p>
                <p className="mt-1 flex min-h-[42px] items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                  {unitKepala || 'Belum ditentukan'}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="label-input" htmlFor="jadwal-seksi">
                    Seksi
                  </label>
                  <select
                    id="jadwal-seksi"
                    className="input-dasar"
                    value={seksi}
                    onChange={(e) => setSeksi(e.target.value)}
                  >
                    <option value="semua">Semua seksi</option>
                    {[...new Set(grup.map((g) => g.seksi))].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-input" htmlFor="jadwal-grup">
                    Grup / Unit
                  </label>
                  <select
                    id="jadwal-grup"
                    className="input-dasar"
                    value={grupNama}
                    onChange={(e) => setGrupNama(e.target.value)}
                  >
                    {grupTersaring.map((g) => (
                      <option key={g.nama} value={g.nama}>
                        {g.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="label-input" htmlFor="jadwal-periode">
                Bulan
              </label>
              <input
                id="jadwal-periode"
                type="month"
                className="input-dasar"
                value={periode}
                onChange={(e) =>
                  setPeriode(e.target.value || periodeBulanIni())
                }
              />
            </div>
          </section>

          {modeKepala && (
            <Alert
              variant="info"
              title={periodeMasaDepan ? 'Jadwal tersimpan otomatis' : 'Jadwal bulan lampau'}
              className="mb-4"
            >
              {periodeMasaDepan ? (
                <>
                  Setiap perubahan sel langsung disimpan. Sel kosong berarti belum
                  dijadwalkan, bukan libur. Tanggal hari ini dan seterusnya dapat
                  diubah.
                </>
              ) : (
                <>
                  Bulan ini sudah lewat. Jadwal hanya dapat dilihat; koreksi
                  dilakukan Super Admin.
                </>
              )}
            </Alert>
          )}

          {!memuatJadwal &&
            pegawaiGrup.length > 0 &&
            pegawaiTanpaJadwal.length > 0 && (
            <Alert variant="info" title="Kelengkapan jadwal" className="mb-4">
              {pegawaiTanpaJadwal.length} pegawai shift belum memiliki jadwal
              pada bulan ini.{' '}
              {periodeMasaDepan
                ? 'Lengkapi jadwal mereka bila diperlukan.'
                : 'Bulan ini sudah lewat; lengkapi melalui Super Admin.'}
            </Alert>
          )}

          {grupTersaring.length === 0 ? (
            <Alert variant="peringatan" title="Grup shift belum tersedia">
              {modeKepala
                ? `Unit kerja ${unitKepala || 'Anda'} belum terdaftar di Grup Shift. Hubungi Super Admin.`
                : grup.length === 0
                  ? 'Tambahkan grup terlebih dahulu di menu Grup Shift.'
                  : `Belum ada grup pada seksi ${seksi}. Pilih seksi lain atau lengkapi Grup Shift.`}
            </Alert>
          ) : pegawaiGrup.length === 0 ? (
            <Alert variant="info" title="Tidak ada pegawai shift">
              Grup {grupNama || '—'} tidak memiliki pegawai dengan pola Shift. Ubah pola
              kerja pegawai di menu Data Pegawai bila perlu.
            </Alert>
          ) : (
            <section className="rounded-2xl border border-slate-200 bg-white shadow-kartu">
              <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5 sm:py-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    {grupNama} ·{' '}
                    {namaBulan(
                      periodeValid(periode) ? periode : periodeBulanIni(),
                    )}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <p className="text-[11px] text-slate-500 sm:text-xs">
                      {pegawaiGrup.length} pegawai shift · {tanggalList.length} tanggal
                    </p>
                    <Badge variant="info">Simpan otomatis</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="sekunder"
                    onClick={() => setPeriode(geserBulan(periode, -1))}
                    aria-label="Bulan sebelumnya"
                  >
                    ‹
                  </Button>
                  <Button
                    size="sm"
                    variant="sekunder"
                    onClick={() => setPeriode(periodeBulanIni())}
                  >
                    Bulan Ini
                  </Button>
                  <Button
                    size="sm"
                    variant="sekunder"
                    onClick={() => setPeriode(geserBulan(periode, 1))}
                    aria-label="Bulan berikutnya"
                  >
                    ›
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-2.5 text-[11px] sm:px-5">
                {master.map((s) => (
                  <span
                    key={s.id}
                    className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset ${
                      KELAS_SHIFT[kunciShift(s.nama_shift)] ??
                        'bg-slate-100 text-slate-700 ring-slate-200'
                    }`}
                  >
                    {singkatanShift(s.nama_shift)} · {s.nama_shift}{' '}
                    {jamPendek(s.jam_mulai)}–{jamPendek(s.jam_selesai)}
                  </span>
                ))}
              </div>

              {memuatJadwal ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
                  <Spinner /> Memuat jadwal…
                </div>
              ) : (
                <>
                  {/* Desktop/tablet: grid */}
                  <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[1180px] border-separate border-spacing-0 text-left text-xs">
                      <thead>
                        <tr>
                          <th className="sticky left-0 z-20 min-w-[160px] border-b border-r border-slate-200 bg-slate-50 px-3 py-2.5 font-semibold text-slate-600">
                            Pegawai
                          </th>
                          {tanggalList.map((tanggal) => {
                            const hariLibur = liburMap.get(tanggal)
                            const weekend = akhirPekan(tanggal)
                            const iniHariIni = tanggal === hariIni()
                            return (
                              <th
                                key={tanggal}
                                className={`min-w-[38px] border-b border-slate-200 px-1 py-1.5 text-center font-semibold ${
                                  iniHariIni
                                    ? 'bg-sky-100 text-sky-800'
                                    : hariLibur
                                      ? 'bg-red-50 text-red-700'
                                      : weekend
                                        ? 'bg-slate-100 text-slate-500'
                                        : 'bg-slate-50 text-slate-600'
                                }`}
                                title={hariLibur || undefined}
                              >
                                <span className="block text-[10px] uppercase leading-none">
                                  {hariDari(tanggal)}
                                </span>
                                <span className="mt-0.5 block text-[11px] tabular-nums leading-none">
                                  {angkaTanggal(tanggal)}
                                </span>
                              </th>
                            )
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {pegawaiGrup.map((p) => (
                          <tr key={p.id} className="group">
                            <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-3 py-2 group-hover:bg-slate-50">
                              <p className="truncate text-[12px] font-semibold text-slate-800">
                                {p.nama}
                              </p>
                              <p className="truncate text-[10px] text-slate-400">
                                {p.unit_kerja}
                              </p>
                            </td>
                            {tanggalList.map((tanggal) => {
                              const baris = jadwalMap.get(`${p.id}|${tanggal}`)
                              const nama = baris?.shift_master?.nama_shift
                              const hariLibur = liburMap.get(tanggal)
                              const weekend = akhirPekan(tanggal)
                              const terkunci = !bolehUbahTanggal(tanggal)
                              return (
                                <td
                                  key={tanggal}
                                  className={`border-b border-slate-100 px-0.5 py-1 text-center ${
                                    hariLibur
                                      ? 'bg-red-50/40'
                                      : weekend
                                        ? 'bg-slate-50/40'
                                        : ''
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={() => bukaSel(p, tanggal)}
                                    disabled={terkunci}
                                    className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-[10px] font-bold ring-1 ring-inset transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:cursor-not-allowed disabled:opacity-40 ${
                                      nama
                                        ? KELAS_SHIFT[kunciShift(nama)] ??
                                          'bg-slate-100 text-slate-700 ring-slate-200 hover:bg-slate-200'
                                        : 'text-slate-300 ring-transparent hover:bg-sky-50 hover:text-sky-600'
                                    }`}
                                    aria-label={`Atur jadwal ${p.nama} tanggal ${formatTanggalRingkas(tanggal)}`}
                                    title={
                                      terkunci
                                        ? alasanTerkunci(tanggal)
                                        : nama
                                          ? `${nama} (${jamPendek(
                                              baris?.shift_master?.jam_mulai,
                                            )}–${jamPendek(baris?.shift_master?.jam_selesai)})`
                                          : 'Klik untuk mengatur shift'
                                    }
                                  >
                                    {nama ? singkatanShift(nama) : '+'}
                                  </button>
                                </td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* HP: pilih pegawai, lalu daftar tanggal */}
                  <div className="md:hidden">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <label className="label-input" htmlFor="jadwal-pegawai-mobile">
                        Pegawai
                      </label>
                      <select
                        id="jadwal-pegawai-mobile"
                        className="input-dasar"
                        value={pegawaiMobileId}
                        onChange={(e) => setPegawaiMobileId(e.target.value)}
                      >
                        {pegawaiGrup.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nama}
                          </option>
                        ))}
                      </select>
                      {pegawaiMobile && (
                        <p className="mt-1.5 text-[11px] text-slate-400">
                          {pegawaiMobile.nama} · {pegawaiMobile.unit_kerja}
                        </p>
                      )}
                    </div>

                    <div className="divide-y divide-slate-100">
                      {tanggalList.map((tanggal) => {
                        const baris = jadwalMap.get(
                          `${pegawaiMobile?.id}|${tanggal}`,
                        )
                        const hariLibur = liburMap.get(tanggal)
                        const weekend = akhirPekan(tanggal)
                        const kunciSimpan = `${pegawaiMobile?.id}|${tanggal}`
                        const terkunci = !bolehUbahTanggal(tanggal)
                        return (
                          <div
                            key={tanggal}
                            className={`flex items-center gap-2 px-4 py-2.5 ${
                              hariLibur
                                ? 'bg-red-50/40'
                                : weekend
                                  ? 'bg-slate-50/60'
                                  : ''
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-slate-700">
                                {hariDari(tanggal)}, {formatTanggalRingkas(tanggal)}
                              </p>
                              {hariLibur && (
                                <p className="truncate text-[10px] font-semibold text-red-600">
                                  {hariLibur}
                                </p>
                              )}
                            </div>
                            <select
                              className="input-dasar w-[8.5rem] shrink-0 py-2 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                              value={baris?.shift_id ?? ''}
                              disabled={
                                terkunci || menyimpanSelKey === kunciSimpan
                              }
                              title={terkunci ? alasanTerkunci(tanggal) : undefined}
                              onChange={(e) =>
                                ubahSelMobile(tanggal, e.target.value)
                              }
                              aria-label={`Shift ${pegawaiMobile?.nama} tanggal ${formatTanggalRingkas(tanggal)}`}
                            >
                              <option value="">— libur —</option>
                              {master.map((s) => (
                                <option key={s.id} value={s.id}>
                                  {s.nama_shift}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </section>
          )}
        </>
      )}

      {/* Modal satu sel (desktop) */}
      <Modal
        terbuka={Boolean(pilihSel)}
        onTutup={() => setPilihSel(null)}
        judul="Atur Jadwal Shift"
      >
        {pilihSel && (
          <div className="space-y-4">
            <div>
              <p className="font-bold text-slate-800">{pilihSel.nama}</p>
              <p className="text-xs text-slate-500">
                {formatTanggal(pilihSel.tanggal)}
              </p>
            </div>

            {galatModal && (
              <Alert variant="bahaya" title="Gagal Menyimpan">
                {galatModal}
              </Alert>
            )}

            <div className="space-y-2">
              {master.map((s) => {
                const dipilih = pilihSel.shiftId === s.id
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={menyimpanSel}
                    onClick={() =>
                      simpanSel({
                        userId: pilihSel.userId,
                        nama: pilihSel.nama,
                        tanggal: pilihSel.tanggal,
                        shiftId: s.id,
                      })
                    }
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 ${
                      dipilih
                        ? 'border-sky-500 bg-sky-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-sm font-bold text-slate-800">
                      {s.nama_shift}
                    </span>
                    <span className="text-xs tabular-nums text-slate-500">
                      {jamPendek(s.jam_mulai)}–{jamPendek(s.jam_selesai)}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="aksi-modal">
              <Button
                variant="bahayaLembut"
                onClick={() =>
                  simpanSel({
                    userId: pilihSel.userId,
                    nama: pilihSel.nama,
                    tanggal: pilihSel.tanggal,
                    shiftId: '',
                  })
                }
                disabled={menyimpanSel}
              >
                Kosongkan / Libur
              </Button>
              <Button variant="sekunder" onClick={() => setPilihSel(null)}>
                Batal
              </Button>
            </div>
          </div>
        )}
      </Modal>

{/* Modal template & impor */}
      <Modal
        terbuka={modalTemplate}
        onTutup={tutupModalTemplate}
        judul="Template & Impor Jadwal"
        lebar="max-w-2xl"
      >
        <div className="space-y-4">
          <input
            ref={fileTemplateRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            tabIndex={-1}
            onChange={bacaFileTemplate}
          />

          {galatTemplate && (
            <Alert variant="bahaya" title="Gagal">
              {galatTemplate}
            </Alert>
          )}

          {!hasilTemplate ? (
            <>
              <div className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-3 text-[13px] leading-relaxed text-sky-900">
                <p className="font-bold">Cara memakai template</p>
                <ol className="mt-1 list-decimal space-y-1 pl-4">
                  <li>Unduh template Excel untuk unit dan bulan ini.</li>
                  <li>Isi setiap sel tanggal dengan nama shift, atau LIBUR.</li>
                  <li>Simpan file, lalu pilih file di bawah untuk melihat preview.</li>
                  <li>Periksa perubahan, lalu tekan Impor.</li>
                </ol>
              </div>

              <Button
                variant="sekunder"
                className="w-full sm:w-auto"
                onClick={unduhTemplate}
                disabled={memuatTemplate || membacaTemplate}
              >
                {memuatTemplate ? 'Menyiapkan…' : 'Unduh Excel (.xlsx)'}
              </Button>

              <p className="text-xs leading-relaxed text-slate-500">
                Template berisi {pegawaiGrup.length} pegawai shift dan{' '}
                {tanggalTemplate.length} tanggal yang dapat diubah, dengan sheet
                Jadwal dan Petunjuk.
              </p>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-bold text-slate-800">
                  Sudah diisi?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Pilih file Excel (.xlsx). Ukuran maksimal{' '}
                  {BATAS_UKURAN_TEMPLATE / (1024 * 1024)} MB. File dibaca di
                  perangkat Anda; isinya tidak diunggah ke Storage.
                </p>
                <Button
                  variant="utama"
                  className="mt-2 w-full sm:w-auto"
                  onClick={() => fileTemplateRef.current?.click()}
                  disabled={membacaTemplate || memuatTemplate}
                >
                  {membacaTemplate ? 'Membaca file…' : 'Pilih File Excel'}
                </Button>
              </div>

              <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
                Sel kosong atau LIBUR berarti jadwal dihapus. Impor bersifat
                semua-atau-tidak-sama-sekali: jika ada satu kesalahan, tidak ada
                jadwal yang diubah.
              </p>
            </>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" className="max-w-full truncate">
                  File: {namaFileImpor}
                </Badge>
                <Badge variant="sukses">{hasilTemplate.dibuat} dibuat</Badge>
                <Badge variant="info">
                  {hasilTemplate.diperbarui} diubah
                </Badge>
                <Badge variant="bahaya">{hasilTemplate.dihapus} dihapus</Badge>
                <Badge variant="netral">{hasilTemplate.tetap} tetap</Badge>
              </div>

              {hasilTemplate.errors.length > 0 && (
                <Alert
                  variant="bahaya"
                  title={`${hasilTemplate.errors.length} kesalahan ditemukan`}
                >
                  <ul className="mt-1 max-h-48 space-y-1 overflow-y-auto pr-1 text-xs leading-relaxed">
                    {hasilTemplate.errors.slice(0, 20).map((error, index) => (
                      <li key={`${error.baris}-${index}`} className="break-words">
                        <b>
                          {error.baris ? `Baris ${error.baris}` : 'File'}
                        </b>
                        {error.tanggal
                          ? ` · ${formatTanggalRingkas(error.tanggal)}`
                          : ''}
                        : {error.pesan}
                      </li>
                    ))}
                  </ul>
                  {hasilTemplate.errors.length > 20 && (
                    <p className="mt-2 text-xs">
                      Menampilkan 20 dari {hasilTemplate.errors.length} error.
                      Unduh laporan error untuk melihat semuanya.
                    </p>
                  )}
                </Alert>
              )}

              {hasilTemplate.errors.length === 0 &&
                hasilTemplate.perubahan.length === 0 && (
                  <Alert variant="info" title="Tidak ada perubahan">
                    Jadwal di file sama dengan jadwal yang tersimpan.
                  </Alert>
                )}

              {hasilTemplate.perubahan.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="tabel-data w-full min-w-[520px] text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Pegawai</th>
                        <th className="px-3 py-2 font-semibold">Tanggal</th>
                        <th className="px-3 py-2 font-semibold">Lama</th>
                        <th className="px-3 py-2 font-semibold">Baru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {hasilTemplate.perubahan.slice(0, 40).map((item) => (
                        <tr key={`${item.user_id}|${item.tanggal}`}>
                          <td className="max-w-[180px] truncate px-3 py-2 font-semibold text-slate-700">
                            {item.nama}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                            {formatTanggalRingkas(item.tanggal)}
                          </td>
                          <td className="px-3 py-2">
                            {item.lama ? (
                              <Badge variant="netral">{item.lama}</Badge>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {item.baru ? (
                              <Badge variant="info">{item.baru}</Badge>
                            ) : (
                              <Badge variant="bahaya">Libur</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {hasilTemplate.perubahan.length > 40 && (
                    <p className="border-t border-slate-100 px-3 py-2 text-[11px] text-slate-500">
                      Menampilkan 40 dari {hasilTemplate.perubahan.length}{' '}
                      perubahan.
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                <Button
                  variant="sekunder"
                  className="w-full sm:w-auto"
                  onClick={pilihFileLagi}
                  disabled={mengimporTemplate}
                >
                  Pilih File Lain
                </Button>
                {hasilTemplate.errors.length > 0 && (
                  <Button
                    variant="bahayaLembut"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      unduhLaporanErrorJadwal(
                        hasilTemplate.errors,
                        namaFileTemplate(grupNama, periode, 'error.xlsx'),
                      ).catch((err) =>
                        setGalatTemplate(
                          err.message || 'Gagal mengunduh laporan error.',
                        ),
                      )
                    }
                    disabled={mengimporTemplate}
                  >
                    Unduh Laporan Error
                  </Button>
                )}
                <Button
                  variant="utama"
                  className="w-full sm:w-auto"
                  onClick={terapkanTemplate}
                  disabled={
                    mengimporTemplate ||
                    hasilTemplate.errors.length > 0 ||
                    hasilTemplate.perubahan.length === 0
                  }
                >
                  {mengimporTemplate
                    ? 'Mengimpor…'
                    : `Impor ${hasilTemplate.perubahan.length} Perubahan`}
                </Button>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-500">
                Impor hanya mengubah jadwal shift. Presensi dan aturan Alfa
                tidak berubah.
              </p>
            </>
          )}
        </div>
      </Modal>

      {/* Modal tukar shift */}
      <Modal terbuka={modalTukar} onTutup={tutupTukar} judul="Tukar Shift">
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-slate-500">
            Pilih tanggal dan dua pegawai shift. Jadwal keduanya saling ditukar
            dan tercatat untuk audit pada laporan bulanan.
          </p>

          {galatTukar && (
            <Alert variant="bahaya" title="Gagal Menukar">
              {galatTukar}
            </Alert>
          )}

          <div>
            <label className="label-input" htmlFor="tukar-tanggal">
              Tanggal
            </label>
            <input
              id="tukar-tanggal"
              type="date"
              className="input-dasar"
              value={formTukar.tanggal}
              onChange={(e) =>
                setFormTukar((f) => ({ ...f, tanggal: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="label-input" htmlFor="tukar-a">
              Pegawai 1
            </label>
            <select
              id="tukar-a"
              className="input-dasar"
              value={formTukar.pegawaiA}
              onChange={(e) =>
                setFormTukar((f) => ({ ...f, pegawaiA: e.target.value }))
              }
            >
              <option value="">Pilih pegawai</option>
              {pegawaiGrup.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-input" htmlFor="tukar-b">
              Pegawai 2
            </label>
            <select
              id="tukar-b"
              className="input-dasar"
              value={formTukar.pegawaiB}
              onChange={(e) =>
                setFormTukar((f) => ({ ...f, pegawaiB: e.target.value }))
              }
            >
              <option value="">Pilih pegawai</option>
              {pegawaiGrup.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nama}
                </option>
              ))}
            </select>
          </div>

          {formTukar.pegawaiA && formTukar.pegawaiB && (
            <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs leading-relaxed text-sky-900">
              {pegawaiMap.get(formTukar.pegawaiA)?.nama ?? 'Pegawai 1'}:{' '}
              <b>
                {jadwalMap.get(`${formTukar.pegawaiA}|${formTukar.tanggal}`)
                  ?.shift_master?.nama_shift ?? 'tidak ada jadwal'}
              </b>
              {' · '}
              {pegawaiMap.get(formTukar.pegawaiB)?.nama ?? 'Pegawai 2'}:{' '}
              <b>
                {jadwalMap.get(`${formTukar.pegawaiB}|${formTukar.tanggal}`)
                  ?.shift_master?.nama_shift ?? 'tidak ada jadwal'}
              </b>
            </p>
          )}

          <div>
            <label className="label-input" htmlFor="tukar-alasan">
              Alasan (opsional)
            </label>
            <textarea
              id="tukar-alasan"
              className="input-dasar"
              rows={2}
              value={formTukar.alasan}
              onChange={(e) =>
                setFormTukar((f) => ({ ...f, alasan: e.target.value }))
              }
              placeholder="Contoh: keperluan keluarga"
            />
          </div>

          <div className="aksi-modal">
            <Button variant="sekunder" onClick={tutupTukar} disabled={menyimpanTukar}>
              Batal
            </Button>
            <Button variant="utama" onClick={simpanTukar} disabled={menyimpanTukar}>
              {menyimpanTukar ? 'Menyimpan...' : 'Tukar Shift'}
            </Button>
          </div>
        </div>
      </Modal>
      </div>

      <div className="hanya-cetak">
        <LembarJadwal
          unit={grupNama}
          periode={periode}
          matriks={matriksJadwal}
          namaKepala={namaKepala}
          waktuCetak={waktuCetak}
        />
      </div>
    </>
  )
}
