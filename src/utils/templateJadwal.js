/**
 * ==========================================================================
 * Template jadwal shift (CSV & Excel)
 * --------------------------------------------------------------------------
 * Template berisi seluruh pegawai shift pada satu unit/bulan. Jadwal yang
 * sudah ada ikut diisi. Sel kosong atau "LIBUR" berarti jadwal dihapus.
 *
 * Semua isi file tetap divalidasi ulang di server melalui RPC
 * `impor_jadwal_shift`; file tidak dipercaya begitu saja.
 * ==========================================================================
 */
import { formatTanggalRingkas, namaBulan } from './format.js'
import { unduhCsv } from './csv.js'

export const VERSI_TEMPLATE_JADWAL = 1
export const BATAS_UKURAN_TEMPLATE = 2 * 1024 * 1024
export const BATAS_BARIS_IMPOR = 10000
export const KODE_LIBUR = 'LIBUR'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ALIAS_LIBUR = new Set(['libur', 'l', 'off', 'kosong', '-', '—'])
const ALIAS_SHIFT = { p: 'pagi', s: 'siang', m: 'malam' }

function teks(nilai) {
  if (nilai === null || nilai === undefined) return ''
  return String(nilai).replace(/\u00a0/g, ' ').trim()
}

function kunci(nilai) {
  return teks(nilai).toLocaleLowerCase('id-ID')
}

function angkaHari(nilai) {
  if (nilai instanceof Date && !Number.isNaN(nilai.getTime())) {
    return nilai.getUTCDate()
  }
  const angka = Number(teks(nilai))
  return Number.isInteger(angka) && angka >= 1 && angka <= 31 ? angka : null
}

function amankanSel(nilai) {
  const isi = teks(nilai)
  if (!isi) return ''
  // Cegah teks dari data pengguna dieksekusi sebagai formula saat dibuka
  // di Excel. UUID, angka, dan nama shift normal tidak terpengaruh.
  return /^[=+\-@]/.test(isi) ? `'${isi}` : isi
}

function csvBaris(nilai) {
  return nilai
    .map((sel) => {
      const isi = amankanSel(sel)
      return /[";\n\r]/.test(isi) ? `"${isi.replace(/"/g, '""')}"` : isi
    })
    .join(';')
}

function unduhBlob(blob, namaFile) {
  const url = URL.createObjectURL(blob)
  const tautan = document.createElement('a')
  tautan.href = url
  tautan.download = namaFile
  document.body.appendChild(tautan)
  tautan.click()
  document.body.removeChild(tautan)
  URL.revokeObjectURL(url)
}

function labelTanggal(tanggal) {
  if (!tanggal.length) return '—'
  if (tanggal.length === 1) return formatTanggalRingkas(tanggal[0])
  return `${formatTanggalRingkas(tanggal[0])} s.d. ${formatTanggalRingkas(
    tanggal[tanggal.length - 1],
  )}`
}

function barisMeta(data) {
  return [
    'PRESISI AMI — TEMPLATE JADWAL SHIFT',
    `Unit: ${data.unitKerja}`,
    `Periode: ${data.periode} (${namaBulan(data.periode)})`,
    `Versi: ${VERSI_TEMPLATE_JADWAL}`,
    `Tanggal dapat diubah: ${labelTanggal(data.tanggal)}`,
    'Petunjuk: isi sel dengan nama shift yang tersedia atau LIBUR. Jangan mengubah kolom user_id, nama, unit_kerja, dan tanggal.',
    'Sel kosong atau LIBUR berarti libur/hapus. Jangan menambah/menghapus baris pegawai.',
  ]
}

function barisHeader(data) {
  return [
    'user_id',
    'nama',
    'unit_kerja',
    ...data.tanggal.map((tanggal) => Number(tanggal.slice(8, 10))),
  ]
}

function daftarPetunjuk(data) {
  return [
    'PETUNJUK TEMPLATE JADWAL SHIFT',
    '',
    `Unit: ${data.unitKerja}`,
    `Periode: ${data.periode} (${namaBulan(data.periode)})`,
    `Tanggal dapat diubah: ${labelTanggal(data.tanggal)}`,
    '',
    '1. Isi setiap sel tanggal dengan nama shift yang tersedia, misalnya Pagi, Siang, atau Malam.',
    '2. Tulis LIBUR atau kosongkan sel bila pegawai libur/tidak dijadwalkan.',
    '3. Jangan mengubah kolom user_id, nama, unit_kerja, dan nomor tanggal.',
    '4. Jangan menambah atau menghapus baris pegawai. Unduh ulang template bila ada pegawai baru.',
    '5. Setelah selesai, simpan file dan impor kembali melalui tombol Template & Impor.',
    '6. Impor bersifat semua-atau-tidak-sama-sekali. Jika ada satu kesalahan, tidak ada jadwal yang diubah.',
  ]
}

/**
 * Menyusun data template dari jadwal yang sudah dimuat di halaman.
 * @param {{
 *   unitKerja: string,
 *   periode: string,
 *   tanggal: string[],
 *   pegawai: Array<{id: string, nama: string, unit_kerja?: string}>,
 *   jadwalMap: Map<string, object>,
 *   master: Array<{id: string, nama_shift: string}>,
 * }} params
 */
export function buatTemplateJadwal({
  unitKerja,
  periode,
  tanggal,
  pegawai,
  jadwalMap,
  master,
}) {
  const masterMap = new Map(master.map((shift) => [shift.id, shift]))
  const baris = pegawai.map((orang) => ({
    user_id: orang.id,
    nama: orang.nama,
    unit_kerja: orang.unit_kerja ?? unitKerja,
    nilai: tanggal.map((tgl) => {
      const jadwal = jadwalMap.get(`${orang.id}|${tgl}`)
      const shift =
        jadwal?.shift_master ??
        (jadwal?.shift_id ? masterMap.get(jadwal.shift_id) : null)
      return shift?.nama_shift ?? KODE_LIBUR
    }),
  }))

  return {
    versi: VERSI_TEMPLATE_JADWAL,
    unitKerja,
    periode,
    tanggal,
    baris,
  }
}

export function namaFileTemplate(unitKerja, periode, ekstensi) {
  const unitAman = String(unitKerja ?? 'unit')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  return `jadwal-shift_${unitAman || 'unit'}_${periode}.${ekstensi}`
}

/** Unduh template CSV (UTF-8 BOM, pemisah titik koma). */
export function unduhTemplateCsv(data) {
  const baris = [
    ...barisMeta(data).map((teksBaris) => csvBaris([teksBaris])),
    csvBaris(barisHeader(data)),
    ...data.baris.map((item) =>
      csvBaris([
        item.user_id,
        item.nama,
        item.unit_kerja,
        ...item.nilai,
      ]),
    ),
  ]
  const blob = new Blob([`\uFEFF${baris.join('\r\n')}\r\n`], {
    type: 'text/csv;charset=utf-8;',
  })
  unduhBlob(blob, namaFileTemplate(data.unitKerja, data.periode, 'csv'))
}

/** Unduh template XLSX dengan sheet Jadwal dan Petunjuk. */
export async function unduhTemplateXlsx(data) {
  const { default: writeExcelFile } = await import(
    'write-excel-file/universal'
  )
  const metaLines = barisMeta(data)
  const meta = [
    [{ value: metaLines[0], fontWeight: 'bold', fontSize: 13 }],
    ...metaLines.slice(1).map((teksBaris) => [teksBaris]),
    [],
  ]
  const header = barisHeader(data).map((nilai, index) => ({
    value: nilai,
    fontWeight: 'bold',
    backgroundColor: '#E2E8F0',
    align: index >= 3 ? 'center' : 'left',
    borderColor: '#CBD5E1',
    borderStyle: 'thin',
  }))
  const isi = data.baris.map((item) => [
    item.user_id,
    item.nama,
    item.unit_kerja,
    ...item.nilai.map((nilai) =>
      nilai === KODE_LIBUR
        ? { value: nilai, align: 'center', textColor: '#64748B' }
        : { value: nilai, align: 'center' },
    ),
  ])
  const kolom = [
    { width: 40 },
    { width: 30 },
    { width: 24 },
    ...data.tanggal.map(() => ({ width: 7 })),
  ]

  const blob = await writeExcelFile([
    {
      data: [...meta, header, ...isi],
      sheet: 'Jadwal',
      columns: kolom,
    },
    {
      data: daftarPetunjuk(data).map((teksBaris, index) =>
        index === 0
          ? [{ value: teksBaris, fontWeight: 'bold', fontSize: 13 }]
          : [teksBaris],
      ),
      sheet: 'Petunjuk',
      columns: [{ width: 110 }],
    },
  ]).toBlob()

  unduhBlob(blob, namaFileTemplate(data.unitKerja, data.periode, 'xlsx'))
}

/* ------------------------------ Pembacaan ------------------------------- */

function deteksiPemisah(teksCsv) {
  const baris = teksCsv.split(/\r?\n/).slice(0, 30)
  const contoh =
    baris.find((item) => /^"?user_id"?\s*[;,\t]/i.test(item.trim())) ?? ''
  const langsung = contoh.trim().match(/^"?user_id"?\s*([;,\t])/i)
  if (langsung) return langsung[1]

  const pilihan = [
    [';', (contoh.match(/;/g) ?? []).length],
    [',', (contoh.match(/,/g) ?? []).length],
    ['\t', (contoh.match(/\t/g) ?? []).length],
  ].sort((a, b) => b[1] - a[1])
  return pilihan[0][1] > 0 ? pilihan[0][0] : ';'
}

/** Parser CSV sederhana yang mendukung tanda kutip dan baris multiline. */
export function parseCsv(teksCsv) {
  const isi = String(teksCsv ?? '').replace(/^\uFEFF/, '')
  const pemisah = deteksiPemisah(isi)
  const hasil = []
  let baris = []
  let sel = ''
  let dalamKutip = false

  for (let i = 0; i < isi.length; i += 1) {
    const karakter = isi[i]
    if (dalamKutip) {
      if (karakter === '"') {
        if (isi[i + 1] === '"') {
          sel += '"'
          i += 1
        } else {
          dalamKutip = false
        }
      } else {
        sel += karakter
      }
    } else if (karakter === '"') {
      dalamKutip = true
    } else if (karakter === pemisah) {
      baris.push(sel)
      sel = ''
    } else if (karakter === '\n') {
      baris.push(sel)
      hasil.push(baris)
      baris = []
      sel = ''
    } else if (karakter !== '\r') {
      sel += karakter
    }
  }

  if (sel !== '' || baris.length) {
    baris.push(sel)
    hasil.push(baris)
  }

  while (
    hasil.length &&
    hasil[hasil.length - 1].every((nilai) => teks(nilai) === '')
  ) {
    hasil.pop()
  }
  return hasil
}

function ambilMeta(rows, label) {
  const pola = new RegExp(`^${label}\\s*:\\s*(.+)$`, 'i')
  for (const row of rows) {
    for (const sel of row) {
      const cocok = teks(sel).match(pola)
      if (cocok) return cocok[1].trim()
    }
  }
  return ''
}

function cariShift(nilai, masterMap, duplikat) {
  const k = kunci(nilai)
  if (masterMap.has(k)) {
    return duplikat.has(k) ? null : masterMap.get(k)
  }
  const alias = ALIAS_SHIFT[k]
  if (alias && masterMap.has(alias) && !duplikat.has(alias)) {
    return masterMap.get(alias)
  }
  return null
}

function bacaXlsx(file) {
  return import('read-excel-file/universal').then(async ({ default: readExcelFile }) => {
    const sheets = await readExcelFile(file)
    if (!Array.isArray(sheets) || !sheets.length) {
      throw new Error('File Excel tidak memiliki sheet data.')
    }
    const sheet =
      sheets.find((item) => kunci(item.sheet) === 'jadwal') ?? sheets[0]
    return Array.isArray(sheet?.data) ? sheet.data : []
  })
}

/**
 * Membaca CSV/XLSX dan mengembalikan baris aksi serta error per baris.
 * @param {File} file
 * @param {{
 *   unitKerja: string,
 *   periode: string,
 *   tanggal: string[],
 *   pegawai: Array<{id: string, nama: string, unit_kerja?: string}>,
 *   master: Array<{id: string, nama_shift: string}>,
 * }} konteks
 */
export async function bacaTemplateJadwal(file, konteks) {
  if (!file) throw new Error('Pilih file template terlebih dahulu.')
  if (file.size > BATAS_UKURAN_TEMPLATE) {
    throw new Error(
      `Ukuran file terlalu besar. Maksimal ${
        BATAS_UKURAN_TEMPLATE / (1024 * 1024)
      } MB.`,
    )
  }

  const nama = kunci(file.name)
  let rows
  if (nama.endsWith('.csv')) {
    rows = parseCsv(await file.text())
  } else if (nama.endsWith('.xlsx')) {
    try {
      rows = await bacaXlsx(file)
    } catch (err) {
      throw new Error(
        err?.message?.includes('sheet')
          ? err.message
          : 'File Excel tidak dapat dibaca. Pastikan file tidak rusak dan berformat .xlsx.',
      )
    }
  } else {
    throw new Error('Format file harus CSV (.csv) atau Excel (.xlsx).')
  }

  if (rows.length > BATAS_BARIS_IMPOR + 100) {
    throw new Error('Jumlah baris file terlalu banyak.')
  }

  return parseTemplateRows(rows, konteks)
}

function hasilError(errors, meta = {}) {
  return { baris: [], errors, meta }
}

/** Memproses baris mentah (dari CSV maupun XLSX). */
export function parseTemplateRows(rows, konteks) {
  const data = rows.map((row) => (Array.isArray(row) ? row : []))
  const errors = []
  const idxHeader = data.findIndex((row) =>
    row.some((sel) => kunci(sel) === 'user_id'),
  )

  if (idxHeader < 0) {
    return hasilError([
      {
        baris: 0,
        pesan:
          'Header user_id tidak ditemukan. Gunakan template yang diunduh dari aplikasi.',
      },
    ])
  }

  const metaRows = data.slice(0, idxHeader)
  const metaUnit = ambilMeta(metaRows, 'Unit(?:\\s+Kerja)?')
  const metaPeriodeRaw = ambilMeta(metaRows, 'Periode')
  const metaPeriode = (metaPeriodeRaw.match(/\d{4}-\d{2}/) ?? [''])[0]
  const metaVersiRaw = ambilMeta(metaRows, 'Versi')
  const metaVersi = Number(metaVersiRaw)

  if (!metaUnit) {
    errors.push({ baris: 0, pesan: 'Baris "Unit" tidak ditemukan di template.' })
  }
  if (!metaPeriode) {
    errors.push({
      baris: 0,
      pesan: 'Baris "Periode" (YYYY-MM) tidak ditemukan di template.',
    })
  }
  if (!Number.isInteger(metaVersi) || metaVersi < 1) {
    errors.push({ baris: 0, pesan: 'Versi template tidak valid.' })
  } else if (metaVersi > VERSI_TEMPLATE_JADWAL) {
    errors.push({
      baris: 0,
      pesan:
        'Versi template lebih baru dari aplikasi. Muat ulang aplikasi lalu unduh template baru.',
    })
  }
  if (metaUnit && kunci(metaUnit) !== kunci(konteks.unitKerja)) {
    errors.push({
      baris: 0,
      pesan: `Template ini untuk unit ${metaUnit}, bukan ${konteks.unitKerja}.`,
    })
  }
  if (metaPeriode && metaPeriode !== konteks.periode) {
    errors.push({
      baris: 0,
      pesan: `Template ini untuk periode ${metaPeriode}, bukan ${konteks.periode}.`,
    })
  }
  if (errors.length) {
    return hasilError(errors, {
      unit: metaUnit,
      periode: metaPeriode,
      versi: metaVersi,
    })
  }

  const header = data[idxHeader].map(teks)
  const idxUserId = header.findIndex((sel) => kunci(sel) === 'user_id')
  const idxNama = header.findIndex((sel) => kunci(sel) === 'nama')
  const idxUnit = header.findIndex((sel) => kunci(sel) === 'unit_kerja')

  const petaHari = new Map()
  for (let i = 0; i < header.length; i += 1) {
    if (i === idxUserId || i === idxNama || i === idxUnit) continue
    const hari = angkaHari(header[i])
    if (!hari) continue
    if (petaHari.has(hari)) {
      errors.push({
        baris: idxHeader + 1,
        pesan: `Kolom tanggal ${hari} muncul lebih dari sekali.`,
      })
      continue
    }
    petaHari.set(hari, i)
  }

  const tanggalSet = new Set(konteks.tanggal)
  for (const tanggal of konteks.tanggal) {
    const hari = Number(tanggal.slice(8, 10))
    if (!petaHari.has(hari)) {
      errors.push({
        baris: idxHeader + 1,
        pesan: `Kolom tanggal ${hari} tidak ditemukan di template.`,
      })
    }
  }
  for (const hari of petaHari.keys()) {
    const tanggal = `${konteks.periode}-${String(hari).padStart(2, '0')}`
    if (!tanggalSet.has(tanggal)) {
      errors.push({
        baris: idxHeader + 1,
        pesan: `Tanggal ${hari} tidak dapat diubah untuk unit/periode ini. Unduh ulang template agar kolom tanggal sesuai.`,
      })
    }
  }
  if (errors.length) {
    return hasilError(errors, {
      unit: metaUnit,
      periode: metaPeriode,
      versi: metaVersi,
    })
  }

  const masterMap = new Map()
  const masterDuplikat = new Set()
  for (const shift of konteks.master) {
    const k = kunci(shift.nama_shift)
    if (masterMap.has(k)) masterDuplikat.add(k)
    else masterMap.set(k, shift)
  }

  const pegawaiMap = new Map(
    konteks.pegawai.map((orang) => [kunci(orang.id), orang]),
  )
  const terlihat = new Set()
  const baris = []

  for (let i = idxHeader + 1; i < data.length; i += 1) {
    const row = data[i]
    if (row.every((sel) => teks(sel) === '')) continue

    const userId = kunci(row[idxUserId])
    if (!userId) {
      errors.push({
        baris: i + 1,
        pesan: 'user_id kosong. Jangan menambah baris tanpa user_id.',
      })
      continue
    }
    if (!UUID_RE.test(userId)) {
      errors.push({ baris: i + 1, pesan: 'user_id tidak valid.' })
      continue
    }
    if (terlihat.has(userId)) {
      errors.push({
        baris: i + 1,
        pesan: `user_id ${userId} muncul lebih dari sekali.`,
      })
      continue
    }
    terlihat.add(userId)

    const orang = pegawaiMap.get(userId)
    if (!orang) {
      errors.push({
        baris: i + 1,
        pesan:
          'Pegawai tidak ditemukan sebagai pegawai shift di unit ini. Unduh ulang template.',
      })
      continue
    }

    if (idxUnit >= 0 && teks(row[idxUnit])) {
      if (kunci(row[idxUnit]) !== kunci(konteks.unitKerja)) {
        errors.push({
          baris: i + 1,
          pesan: `Unit kerja pegawai ${orang.nama} tidak sesuai.`,
        })
        continue
      }
    }

    for (const tanggal of konteks.tanggal) {
      const hari = Number(tanggal.slice(8, 10))
      const kolom = petaHari.get(hari)
      const nilai = teks(row[kolom])
      const k = kunci(nilai)

      if (!nilai || ALIAS_LIBUR.has(k)) {
        baris.push({
          user_id: userId,
          tanggal,
          shift_id: null,
          aksi: 'hapus',
        })
        continue
      }

      const shift = cariShift(nilai, masterMap, masterDuplikat)
      if (!shift) {
        errors.push({
          baris: i + 1,
          tanggal,
          pesan: `Shift "${nilai}" tidak dikenal. Gunakan nama shift yang tersedia atau LIBUR.`,
        })
        continue
      }

      baris.push({
        user_id: userId,
        tanggal,
        shift_id: shift.id,
        aksi: 'simpan',
      })
    }
  }

  if (!terlihat.size) {
    errors.push({
      baris: 0,
      pesan: 'Tidak ada baris pegawai yang dapat dibaca dari template.',
    })
  }
  for (const orang of konteks.pegawai) {
    if (!terlihat.has(kunci(orang.id))) {
      errors.push({
        baris: 0,
        pesan: `Pegawai ${orang.nama} tidak ada di file. Jangan menghapus baris pegawai; unduh ulang template.`,
      })
    }
  }
  if (baris.length > BATAS_BARIS_IMPOR) {
    errors.push({
      baris: 0,
      pesan: `Jumlah sel jadwal terlalu banyak (maksimal ${BATAS_BARIS_IMPOR}).`,
    })
  }

  return {
    baris,
    errors,
    meta: {
      unit: metaUnit,
      periode: metaPeriode,
      versi: metaVersi,
      jumlahPegawai: terlihat.size,
    },
  }
}

/**
 * Membandingkan hasil template dengan jadwal yang sedang tampil.
 * Hanya perubahan yang dikirim ke server.
 */
export function hitungPerubahanTemplate(baris, konteks) {
  const perubahan = []
  let dibuat = 0
  let diperbarui = 0
  let dihapus = 0
  let tetap = 0

  for (const item of baris) {
    const lamaRow = konteks.jadwalMap.get(
      `${item.user_id}|${item.tanggal}`,
    )
    const lama =
      lamaRow?.shift_master?.nama_shift ??
      (lamaRow?.shift_id
        ? konteks.masterMap.get(lamaRow.shift_id)?.nama_shift
        : null) ??
      null
    const baru =
      item.aksi === 'hapus'
        ? null
        : konteks.masterMap.get(item.shift_id)?.nama_shift ?? null

    if (lama === baru) {
      tetap += 1
      continue
    }

    const nama =
      konteks.pegawaiMap.get(item.user_id)?.nama ?? item.user_id
    perubahan.push({ ...item, nama, lama, baru })

    if (!lama && baru) dibuat += 1
    else if (lama && baru) diperbarui += 1
    else if (lama && !baru) dihapus += 1
  }

  return {
    perubahan,
    dibuat,
    diperbarui,
    dihapus,
    tetap,
    total: perubahan.length,
  }
}

/** Unduh laporan error hasil pembacaan template. */
export function unduhLaporanErrorJadwal(errors, namaFile = 'error-jadwal.csv') {
  unduhCsv(namaFile, errors, [
    { label: 'Baris', nilai: 'baris' },
    { label: 'Tanggal', nilai: 'tanggal' },
    { label: 'Pesan', nilai: 'pesan' },
  ])
}
