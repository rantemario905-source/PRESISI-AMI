/**
 * ==========================================================================
 * Jadwal Shift — Super Admin & Kepala Ruangan (grid per grup)
 * --------------------------------------------------------------------------
 * Satu grup/unit dipilih, lalu jadwal diatur per pegawai dan per tanggal.
 * Hanya pegawai pola Shift yang ditampilkan. Pegawai Reguler memakai jam
 * kerja tetap dan tidak perlu dijadwalkan di sini.
 *
 * Mode kepala ruangan: unit terkunci ke unit sendiri, hanya tanggal besok
 * dan seterusnya, serta tidak dapat menulis setelah bulan difinalisasi.
 * ==========================================================================
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ambilFinalJadwal,
  ambilJadwalRentang,
  ambilMasterShift,
  finalisasiJadwal,
  hapusJadwalSel,
  imporJadwalShift,
  simpanJadwalBanyak,
  simpanJadwalMassal,
  simpanJadwalSel,
} from '../../services/shiftService.js'
import { ambilSemuaPegawai } from '../../services/pegawaiService.js'
import { ambilGrupShift } from '../../services/groupShiftService.js'
import { ambilHariLiburRentang } from '../../services/hariLiburService.js'
import { useAuth } from '../../context/AuthContext.jsx'
import {
  akhirBulan,
  daftarTanggal,
  formatJam,
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
  unduhTemplateCsv,
  unduhTemplateXlsx,
} from '../../utils/templateJadwal.js'
import { Alert, Badge, Button, Modal, Spinner } from '../../components/ui/index.js'
import KepalaHalaman from '../../components/admin/KepalaHalaman.jsx'

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

function tanggalBesok() {
  const [tahun, bulan, hari] = hariIni().split('-').map(Number)
  return new Date(Date.UTC(tahun, bulan - 1, hari + 1)).toISOString().slice(0, 10)
}

export default function JadwalShift({ mode = 'admin' }) {
  const { profil } = useAuth()
  const modeKepala = mode === 'kepala'
  const unitKepala = profil?.unit_kerja ?? ''

  const [master, setMaster] = useState([])
  const [grup, setGrup] = useState([])
  const [pegawai, setPegawai] = useState([])
  const [jadwal, setJadwal] = useState([])
  const [liburMap, setLiburMap] = useState(new Map())
  const [finalJadwal, setFinalJadwal] = useState(null)
  const [memuatFinal, setMemuatFinal] = useState(false)
  const [memprosesFinal, setMemprosesFinal] = useState(false)

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
  const [modalCepat, setModalCepat] = useState(false)
  const [menyimpanCepat, setMenyimpanCepat] = useState(false)
  const [galatCepat, setGalatCepat] = useState(null)
  const [formCepat, setFormCepat] = useState({
    shiftId: '',
    mode: 'grup',
    pegawaiId: '',
    mulai: `${periodeBulanIni()}-01`,
    selesai: akhirBulan(periodeBulanIni()),
  })

  const [modalTemplate, setModalTemplate] = useState(false)
  const [memuatTemplate, setMemuatTemplate] = useState(false)
  const [membacaTemplate, setMembacaTemplate] = useState(false)
  const [mengimporTemplate, setMengimporTemplate] = useState(false)
  const [hasilTemplate, setHasilTemplate] = useState(null)
  const [galatTemplate, setGalatTemplate] = useState(null)
  const [namaFileImpor, setNamaFileImpor] = useState('')
  const fileTemplateRef = useRef(null)

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

  const muatJadwal = useCallback(async () => {
    if (!periodeValid(periode)) {
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
        ambilJadwalRentang(`${periode}-01`, akhir),
        ambilHariLiburRentang(`${periode}-01`, akhir),
      ])
      setJadwal(dataJadwal)
      setLiburMap(new Map(dataLibur.map((h) => [h.tanggal, h.nama])))
    } catch (err) {
      setGalat(err.message || 'Gagal memuat jadwal shift.')
    } finally {
      setMemuatJadwal(false)
    }
  }, [periode])

  const muatFinal = useCallback(async () => {
    if (!grupNama || !periodeValid(periode)) {
      setFinalJadwal(null)
      setMemuatFinal(false)
      return
    }
    setMemuatFinal(true)
    setFinalJadwal(null)
    try {
      const data = await ambilFinalJadwal(grupNama, `${periode}-01`)
      setFinalJadwal(data)
    } catch (err) {
      setGalat(err.message || 'Gagal memuat status finalisasi jadwal.')
    } finally {
      setMemuatFinal(false)
    }
  }, [grupNama, periode])

  useEffect(() => {
    muatAwal()
  }, [muatAwal])

  useEffect(() => {
    muatJadwal()
  }, [muatJadwal])

  useEffect(() => {
    muatFinal()
  }, [muatFinal])

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

  const pegawaiMobile = pegawaiGrup.find((p) => p.id === pegawaiMobileId)
  const finalTerkunci = modeKepala && Boolean(finalJadwal)
  const periodeMasaDepan = !modeKepala || periode >= periodeBulanIni()
  const bolehFinalisasi = periodeMasaDepan

  const tanggalTemplate = useMemo(() => {
    if (!modeKepala) return tanggalList
    if (memuatFinal || finalTerkunci) return []
    return tanggalList.filter((tanggal) => tanggal > hariIni())
  }, [modeKepala, memuatFinal, finalTerkunci, tanggalList])

  const bisaTemplate =
    Boolean(grupNama) &&
    pegawaiGrup.length > 0 &&
    master.length > 0 &&
    tanggalTemplate.length > 0 &&
    !memuat &&
    !memuatJadwal &&
    !memuatFinal &&
    (!modeKepala || (periodeMasaDepan && !finalTerkunci))

  function alasanTemplate() {
    if (memuat || memuatJadwal || memuatFinal) return 'Memuat data jadwal…'
    if (!grupNama) return 'Pilih grup/unit terlebih dahulu.'
    if (!pegawaiGrup.length) return 'Tidak ada pegawai shift di grup ini.'
    if (!master.length) return 'Master shift belum tersedia.'
    if (modeKepala && finalTerkunci) {
      return 'Jadwal bulan ini sudah final. Hubungi Super Admin untuk koreksi.'
    }
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
    if (memuatFinal || finalTerkunci) return false
    return tanggal > hariIni()
  }

  function alasanTerkunci(tanggal) {
    if (memuatFinal) {
      return 'Memuat status finalisasi jadwal…'
    }
    if (finalTerkunci) {
      return 'Jadwal bulan ini sudah final. Hubungi Super Admin untuk koreksi.'
    }
    if (modeKepala && tanggal <= hariIni()) {
      return 'Tanggal hari ini dan sebelumnya hanya dapat diubah Super Admin.'
    }
    return undefined
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
        'Tanggal ini tidak dapat diubah dari portal kepala ruangan.'
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
    if (modeKepala && finalTerkunci) {
      setGalat('Jadwal bulan ini sudah final. Hubungi Super Admin untuk koreksi.')
      return
    }
    if (modeKepala && periode < periodeBulanIni()) {
      setGalat('Jadwal bulan yang sudah lewat hanya dapat diubah Super Admin.')
      return
    }

    const sumber = geserBulan(periode, -1)
    const konfirmasi = window.confirm(
      `Salin pola jadwal ${namaBulan(sumber)} ke ${namaBulan(periode)} untuk ${pegawaiGrup.length} pegawai shift di ${grupNama}? Jadwal pada tanggal yang sama akan ditimpa. Tanggal tanpa jadwal sumber tidak diubah.${
        modeKepala ? ' Hanya tanggal setelah hari ini yang akan diisi.' : ''
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
        ? barisBaru.filter((baris) => baris.tanggal > hariIni())
        : barisBaru

      if (!barisTersalin.length) {
        setGalat(
          modeKepala
            ? 'Tidak ada tanggal setelah hari ini yang dapat disalin. Pilih bulan berikutnya.'
            : 'Tidak ada jadwal yang dapat disalin.',
        )
        return
      }

      const jumlah = await simpanJadwalBanyak(barisTersalin)
      setPesan(
        `${jumlah} baris jadwal disalin dari ${namaBulan(sumber)} ke ${namaBulan(periode)}.${
          modeKepala ? ' Tanggal hari ini dan sebelumnya dilewati.' : ''
        }`,
      )
      await muatJadwal()
    } catch (err) {
      setGalat(err.message || 'Gagal menyalin pola jadwal.')
    } finally {
      setMenyalin(false)
    }
  }

  function bukaCepat() {
    if (modeKepala && finalTerkunci) {
      setGalat('Jadwal bulan ini sudah final. Hubungi Super Admin untuk koreksi.')
      return
    }
    if (modeKepala && periode < periodeBulanIni()) {
      setGalat('Jadwal bulan yang sudah lewat hanya dapat diubah Super Admin.')
      return
    }
    const bulan = periodeValid(periode) ? periode : periodeBulanIni()
    let mulai = `${bulan}-01`
    if (modeKepala) {
      const besok = tanggalBesok()
      if (besok > akhirBulan(bulan)) {
        setGalat(
          'Tidak ada tanggal tersisa di bulan ini. Pilih bulan berikutnya untuk mengisi jadwal.',
        )
        return
      }
      // Bulan berjalan mulai besok; bulan berikutnya mulai tanggal 1.
      mulai = besok > `${bulan}-01` ? besok : `${bulan}-01`
    }
    setFormCepat({
      shiftId: master[0]?.id ?? '',
      mode: 'grup',
      pegawaiId: pegawaiGrup[0]?.id ?? '',
      mulai,
      selesai: akhirBulan(bulan),
    })
    setGalatCepat(null)
    setModalCepat(true)
  }

  async function simpanCepat(event) {
    event.preventDefault()
    setMenyimpanCepat(true)
    setGalatCepat(null)
    try {
      if (modeKepala && finalTerkunci) {
        throw new Error(
          'Jadwal bulan ini sudah final. Hubungi Super Admin untuk koreksi.',
        )
      }
      if (!formCepat.shiftId) throw new Error('Pilih shift terlebih dahulu.')
      if (!formCepat.mulai || !formCepat.selesai) {
        throw new Error('Lengkapi rentang tanggal.')
      }
      if (modeKepala && formCepat.mulai <= hariIni()) {
        throw new Error(
          'Untuk kepala ruangan, tanggal mulai minimal besok. Hari ini dan tanggal lampau hanya dapat diubah Super Admin.',
        )
      }
      if (formCepat.selesai < formCepat.mulai) {
        throw new Error('Tanggal selesai tidak boleh sebelum tanggal mulai.')
      }

      const userIds =
        formCepat.mode === 'grup'
          ? pegawaiGrup.map((p) => p.id)
          : [formCepat.pegawaiId]

      if (!userIds.length || !userIds[0]) {
        throw new Error('Pilih pegawai/grup tujuan.')
      }

      const jumlah = await simpanJadwalMassal({
        userIds,
        shiftId: formCepat.shiftId,
        mulai: formCepat.mulai,
        selesai: formCepat.selesai,
      })

      setModalCepat(false)
      setPesan(`${jumlah} baris jadwal berhasil disimpan.`)
      await muatJadwal()
    } catch (err) {
      setGalatCepat(err.message || 'Gagal menyimpan jadwal.')
    } finally {
      setMenyimpanCepat(false)
    }
  }

  async function ubahFinalisasi() {
    if (!grupNama || !periodeValid(periode)) return
    if (modeKepala && periode < periodeBulanIni()) {
      setGalat('Jadwal bulan yang sudah lewat hanya dapat difinalisasi Super Admin.')
      return
    }
    const akanFinal = !finalJadwal
    if (!akanFinal && modeKepala) return

    const konfirmasi = window.confirm(
      akanFinal
        ? `Finalisasi jadwal ${grupNama} untuk ${namaBulan(periode)}? Setelah final, sel kosong dianggap libur dan kepala ruangan tidak dapat mengubah jadwal lagi.`
        : `Buka finalisasi jadwal ${grupNama} untuk ${namaBulan(periode)}? Kepala ruangan dapat mengubah jadwal lagi setelah dibuka.`,
    )
    if (!konfirmasi) return

    setMemprosesFinal(true)
    setGalat(null)
    setPesan(null)
    try {
      await finalisasiJadwal({
        unitKerja: grupNama,
        periode: `${periode}-01`,
        final: akanFinal,
      })
      setPesan(
        akanFinal
          ? `Jadwal ${grupNama} ${namaBulan(periode)} berhasil difinalisasi.`
          : `Finalisasi jadwal ${grupNama} ${namaBulan(periode)} dibuka kembali.`,
      )
      await muatFinal()
    } catch (err) {
      setGalat(err.message || 'Gagal memproses finalisasi jadwal.')
    } finally {
      setMemprosesFinal(false)
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

  async function unduhTemplate(format) {
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
      if (format === 'xlsx') await unduhTemplateXlsx(data)
      else unduhTemplateCsv(data)
      setPesan(
        `Template ${format === 'xlsx' ? 'Excel' : 'CSV'} ${grupNama} ${namaBulan(periode)} berhasil diunduh.`,
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
        } diubah, ${ringkasan?.dihapus ?? 0} dihapus.`,
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

  const jumlahHariCepat = daftarTanggal(
    formCepat.mulai,
    formCepat.selesai,
  ).length
  const jumlahPegawaiCepat =
    formCepat.mode === 'grup'
      ? pegawaiGrup.length
      : formCepat.pegawaiId
        ? 1
        : 0

  return (
    <>
      <KepalaHalaman
        judul="Jadwal Shift"
        deskripsi={
          modeKepala
            ? 'Atur jadwal shift unit Anda untuk tanggal besok dan seterusnya. Gunakan Template & Impor untuk mengisi banyak tanggal sekaligus.'
            : 'Atur jadwal pegawai shift per grup. Klik sel untuk mengubah satu tanggal, atau gunakan Template & Impor/Isi Cepat/Salin Bulan Lalu.'
        }
        aksi={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Button
              variant="sekunder"
              size="sm"
              className="w-full sm:w-auto"
              onClick={bukaModalTemplate}
              disabled={!bisaTemplate || memuatTemplate || membacaTemplate}
              title={!bisaTemplate ? alasanTemplate() : undefined}
            >
              Template &amp; Impor
            </Button>
            <Button
              variant="sekunder"
              size="sm"
              className="w-full sm:w-auto"
              onClick={salinPola}
              disabled={
                memuat ||
                menyalin ||
                !pegawaiGrup.length ||
                finalTerkunci ||
                memuatFinal ||
                !periodeMasaDepan
              }
            >
              {menyalin ? 'Menyalin…' : 'Salin Bulan Lalu'}
            </Button>
            <Button
              variant="utama"
              size="sm"
              className="w-full sm:w-auto"
              onClick={bukaCepat}
              disabled={
                memuat ||
                !master.length ||
                finalTerkunci ||
                memuatFinal ||
                !periodeMasaDepan
              }
            >
              Isi Cepat
            </Button>
            {(!modeKepala || !finalJadwal) && (
              <Button
                variant={finalJadwal ? 'sekunder' : 'utama'}
                size="sm"
                className="w-full sm:w-auto"
                onClick={ubahFinalisasi}
                disabled={
                  memprosesFinal ||
                  memuatFinal ||
                  !grupNama ||
                  !pegawaiGrup.length ||
                  !bolehFinalisasi
                }
                title={
                  !bolehFinalisasi
                    ? 'Jadwal bulan lampau hanya dapat difinalisasi Super Admin.'
                    : undefined
                }
              >
                {memprosesFinal
                  ? 'Memproses…'
                  : finalJadwal
                    ? 'Buka Finalisasi'
                    : 'Finalisasi Jadwal'}
              </Button>
            )}
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

          {modeKepala && finalJadwal && (
            <Alert variant="sukses" title="Jadwal sudah final" className="mb-4">
              Sel kosong berarti libur. Jadwal final tidak dapat diubah dari
              portal kepala ruangan
              {finalJadwal.final_pada
                ? ` sejak ${formatTanggalRingkas(finalJadwal.final_pada)}`
                : ''}
              . Hubungi Super Admin untuk koreksi.
            </Alert>
          )}

          {modeKepala && !finalJadwal && !memuatFinal && (
            <Alert
              variant="info"
              title={periodeMasaDepan ? 'Jadwal belum final' : 'Jadwal bulan lampau'}
              className="mb-4"
            >
              {periodeMasaDepan ? (
                <>
                  Sel kosong masih dianggap belum diatur. Setelah selesai menyusun
                  jadwal, tekan <b>Finalisasi Jadwal</b>. Setelah final, sel kosong
                  berarti libur.
                </>
              ) : (
                <>
                  Bulan ini sudah lewat. Jadwal hanya dapat dilihat; koreksi dan
                  finalisasi dilakukan Super Admin.
                </>
              )}
            </Alert>
          )}

          {!memuatJadwal &&
            !memuatFinal &&
            pegawaiGrup.length > 0 &&
            pegawaiTanpaJadwal.length > 0 && (
            <Alert
              variant={finalJadwal ? 'peringatan' : 'info'}
              title="Kelengkapan jadwal"
              className="mb-4"
            >
              {pegawaiTanpaJadwal.length} pegawai shift belum memiliki jadwal
              pada bulan ini.{' '}
              {finalJadwal
                ? 'Jadwal sudah final; sel kosong berarti libur. Pastikan hal ini memang disengaja.'
                : periodeMasaDepan
                  ? 'Lengkapi jadwal mereka sebelum finalisasi.'
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
                    <Badge variant={finalJadwal ? 'sukses' : 'peringatan'}>
                      {memuatFinal
                        ? 'Memuat status…'
                        : finalJadwal
                          ? 'Final'
                          : 'Belum final'}
                    </Badge>
                    {finalJadwal?.final_pada && (
                      <span className="text-[10px] text-slate-400">
                        {formatJam(finalJadwal.final_pada)}
                      </span>
                    )}
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

      {/* Modal isi cepat */}
      <Modal
        terbuka={modalCepat}
        onTutup={() => setModalCepat(false)}
        judul="Isi Cepat Jadwal Shift"
      >
        <form onSubmit={simpanCepat} className="space-y-4">
          {galatCepat && (
            <Alert variant="bahaya" title="Gagal Menyimpan">
              {galatCepat}
            </Alert>
          )}

          <div>
            <label className="label-input" htmlFor="cepat-shift">
              Shift
            </label>
            <select
              id="cepat-shift"
              className="input-dasar"
              value={formCepat.shiftId}
              onChange={(e) =>
                setFormCepat((l) => ({ ...l, shiftId: e.target.value }))
              }
              required
            >
              <option value="">— pilih shift —</option>
              {master.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nama_shift} ({jamPendek(s.jam_mulai)}–{jamPendek(s.jam_selesai)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label
              className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                formCepat.mode === 'grup'
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-300 bg-white text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="mode-cepat"
                value="grup"
                className="h-4 w-4 accent-sky-600"
                checked={formCepat.mode === 'grup'}
                onChange={(e) =>
                  setFormCepat((l) => ({ ...l, mode: e.target.value }))
                }
              />
              Semua pegawai shift di grup
            </label>
            <label
              className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                formCepat.mode === 'pegawai'
                  ? 'border-sky-500 bg-sky-50 text-sky-700'
                  : 'border-slate-300 bg-white text-slate-600'
              }`}
            >
              <input
                type="radio"
                name="mode-cepat"
                value="pegawai"
                className="h-4 w-4 accent-sky-600"
                checked={formCepat.mode === 'pegawai'}
                onChange={(e) =>
                  setFormCepat((l) => ({ ...l, mode: e.target.value }))
                }
              />
              Satu pegawai
            </label>
          </div>

          {formCepat.mode === 'pegawai' && (
            <div>
              <label className="label-input" htmlFor="cepat-pegawai">
                Pegawai
              </label>
              <select
                id="cepat-pegawai"
                className="input-dasar"
                value={formCepat.pegawaiId}
                onChange={(e) =>
                  setFormCepat((l) => ({ ...l, pegawaiId: e.target.value }))
                }
                required
              >
                <option value="">— pilih pegawai —</option>
                {pegawaiGrup.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label-input" htmlFor="cepat-mulai">
                Tanggal Mulai
              </label>
              <input
                id="cepat-mulai"
                type="date"
                className="input-dasar"
                value={formCepat.mulai}
                onChange={(e) =>
                  setFormCepat((l) => ({ ...l, mulai: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="label-input" htmlFor="cepat-selesai">
                Tanggal Selesai
              </label>
              <input
                id="cepat-selesai"
                type="date"
                className="input-dasar"
                value={formCepat.selesai}
                onChange={(e) =>
                  setFormCepat((l) => ({ ...l, selesai: e.target.value }))
                }
                required
              />
            </div>
          </div>

          <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-500">
            {jumlahHariCepat} hari × {jumlahPegawaiCepat} pegawai ={' '}
            <b className="text-slate-700">
              {jumlahHariCepat * jumlahPegawaiCepat} baris
            </b>
            . Jadwal pada tanggal yang sama akan ditimpa. Isi Cepat mengisi semua
            tanggal pada rentang, termasuk akhir pekan; gunakan Salin Bulan Lalu
            untuk pola bergilir.
          </p>

          <div className="aksi-modal">
            <Button variant="sekunder" onClick={() => setModalCepat(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={menyimpanCepat}>
              {menyimpanCepat ? 'Menyimpan…' : 'Simpan Jadwal'}
            </Button>
          </div>
        </form>
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
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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
                  <li>Unduh template CSV atau Excel untuk unit dan bulan ini.</li>
                  <li>Isi setiap sel tanggal dengan nama shift, atau LIBUR.</li>
                  <li>Simpan file, lalu pilih file di bawah untuk melihat preview.</li>
                  <li>Periksa perubahan, lalu tekan Impor.</li>
                </ol>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  variant="sekunder"
                  className="w-full"
                  onClick={() => unduhTemplate('csv')}
                  disabled={memuatTemplate || membacaTemplate}
                >
                  {memuatTemplate ? 'Menyiapkan…' : 'Unduh CSV'}
                </Button>
                <Button
                  variant="sekunder"
                  className="w-full"
                  onClick={() => unduhTemplate('xlsx')}
                  disabled={memuatTemplate || membacaTemplate}
                >
                  {memuatTemplate ? 'Menyiapkan…' : 'Unduh Excel (.xlsx)'}
                </Button>
              </div>

              <p className="text-xs leading-relaxed text-slate-500">
                Template berisi {pegawaiGrup.length} pegawai shift dan{' '}
                {tanggalTemplate.length} tanggal yang dapat diubah. File CSV
                memakai UTF-8 dan pemisah titik koma agar cocok dengan Excel
                Indonesia.
              </p>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-sm font-bold text-slate-800">
                  Sudah diisi?
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Pilih file CSV atau XLSX. Ukuran maksimal{' '}
                  {BATAS_UKURAN_TEMPLATE / (1024 * 1024)} MB. File dibaca di
                  perangkat Anda; isinya tidak diunggah ke Storage.
                </p>
                <Button
                  variant="utama"
                  className="mt-2 w-full sm:w-auto"
                  onClick={() => fileTemplateRef.current?.click()}
                  disabled={membacaTemplate || memuatTemplate}
                >
                  {membacaTemplate ? 'Membaca file…' : 'Pilih File CSV / Excel'}
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
                  <table className="w-full min-w-[520px] text-left text-xs">
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
                        namaFileTemplate(grupNama, periode, 'error.csv'),
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
                Impor hanya mengubah jadwal shift. Status finalisasi, presensi,
                dan aturan Alfa tidak berubah.
              </p>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
