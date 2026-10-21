/**
 * ==========================================================================
 * Ekspor data ke file CSV (kompatibel Excel, pemisah titik koma).
 * ==========================================================================
 */

/**
 * @param {string} namaFile - nama file unduhan, mis. "rekap-2026-10.csv"
 * @param {Array<object>} baris - data baris
 * @param {Array<{label: string, nilai: string|Function}>} kolom - definisi kolom;
 *        `nilai` boleh berupa nama properti atau fungsi (baris) => nilai
 */
export function unduhCsv(namaFile, baris, kolom) {
  const aman = (nilai) => {
    const teks = nilai === null || nilai === undefined ? '' : String(nilai)
    return /[";\n\r]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks
  }

  const kepala = kolom.map((k) => aman(k.label)).join(';')
  const isiBaris = baris.map((barisData) =>
    kolom
      .map((k) => aman(typeof k.nilai === 'function' ? k.nilai(barisData) : barisData[k.nilai]))
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
