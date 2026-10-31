import test from 'node:test'
import assert from 'node:assert/strict'
import { parseTemplateRows } from '../src/utils/templateJadwal.js'

function uuid(nomor) {
  return `00000000-0000-4000-8000-${String(nomor).padStart(12, '0')}`
}

function tanggalNovember2026() {
  return Array.from(
    { length: 30 },
    (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`,
  )
}

function buatKonteks(jumlahPegawai = 35) {
  const tanggal = tanggalNovember2026()
  const pegawai = Array.from({ length: jumlahPegawai }, (_, i) => ({
    id: uuid(i + 1),
    nama: `Pegawai ${i + 1}`,
    unit_kerja: 'UNIT UJI',
  }))
  return {
    unitKerja: 'UNIT UJI',
    periode: '2026-11',
    tanggal,
    pegawai,
    master: [
      {
        id: '11111111-1111-4111-8111-111111111111',
        nama_shift: 'Pagi',
      },
    ],
  }
}

function buatBaris(konteks, kolomTanggal = konteks.tanggal.map((t) => Number(t.slice(8, 10)))) {
  const header = ['user_id', 'nama', 'unit_kerja', ...kolomTanggal]
  const rows = [
    ['PRESISI AMI — TEMPLATE JADWAL SHIFT'],
    [`Unit: ${konteks.unitKerja}`],
    [`Periode: ${konteks.periode}`],
    ['Versi: 1'],
    header,
  ]

  for (const orang of konteks.pegawai) {
    rows.push([
      orang.id,
      orang.nama,
      orang.unit_kerja,
      ...konteks.tanggal.map(() => 'Pagi'),
    ])
  }

  return rows
}

test('template 35 pegawai x 30 hari terbaca lengkap termasuk tanggal 1 dan 2', () => {
  const konteks = buatKonteks(35)
  const hasil = parseTemplateRows(buatBaris(konteks), konteks)

  assert.equal(hasil.errors.length, 0)
  assert.equal(hasil.baris.length, 35 * 30)
  assert.ok(
    hasil.baris.some(
      (baris) =>
        baris.tanggal === '2026-11-01' && baris.user_id === konteks.pegawai[0].id,
    ),
  )
  assert.ok(
    hasil.baris.some(
      (baris) =>
        baris.tanggal === '2026-11-02' && baris.user_id === konteks.pegawai[0].id,
    ),
  )
})

test('header tanggal tidak dikenali dilaporkan sebagai error', () => {
  const konteks = buatKonteks(2)
  const kolom = konteks.tanggal.map((t) => Number(t.slice(8, 10)))
  kolom[0] = '1-Nov'

  const hasil = parseTemplateRows(buatBaris(konteks, kolom), konteks)

  assert.ok(
    hasil.errors.some((error) => error.pesan.includes('Kolom "1-Nov" tidak dikenali')),
  )
})
