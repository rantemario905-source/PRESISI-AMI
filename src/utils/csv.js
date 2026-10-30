/**
 * ==========================================================================
 * Ekspor data ke file CSV (kompatibel Excel, pemisah titik koma).
 * ==========================================================================
 */

const POLA_FORMULA = /^[=+\-@\t\r\n]/

export function amankanSelCsv(nilai) {
  const teks = nilai === null || nilai === undefined ? '' : String(nilai)
  const isi =
    typeof nilai === 'string' && POLA_FORMULA.test(teks) ? `'${teks}` : teks
  return /[";\n\r]/.test(isi) ? `"${isi.replace(/"/g, '""')}"` : isi
}

/**
 * @param {string} namaFile - nama file unduhan, mis. "rekap-2026-10.csv"
 * @param {Array<object>} baris - data baris
 * @param {Array<{label: string, nilai: string|Function}>} kolom - definisi kolom;
 *        `nilai` boleh berupa nama properti atau fungsi (baris) => nilai
 */
export function unduhCsv(namaFile, baris, kolom) {
  const kepala = kolom.map((k) => amankanSelCsv(k.label)).join(';')
  const isiBaris = baris.map((barisData) =>
    kolom
      .map((k) => amankanSelCsv(typeof k.nilai === 'function' ? k.nilai(barisData) : barisData[k.nilai]))
      .join(';'),
  )

  // BOM agar Excel mengenali UTF-8 dengan benar
  const isi = `\uFEFF${[kepala, ...isiBaris].join('\r\n')}`
  const blob = new Blob([isi], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const tautan = document.createElement('a')
  tautan.href = url
  tautan.download = namaFile
  document.body.appendChild(tautan)
  tautan.click()
  document.body.removeChild(tautan)
  URL.revokeObjectURL(url)
}
