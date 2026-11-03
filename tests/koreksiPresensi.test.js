import test from 'node:test'
import assert from 'node:assert/strict'
import { susunWaktuKoreksi } from '../src/utils/koreksiPresensi.js'

const wita = (nilai) => Date.parse(`${nilai}+08:00`)

test('koreksi reguler tetap pada hari yang sama', () => {
  const hasil = susunWaktuKoreksi({
    tanggal: '2026-11-02',
    jamMasuk: '08:00',
    jamPulang: '16:00',
  })
  assert.equal(Date.parse(hasil.jamMasukIso), wita('2026-11-02T08:00:00'))
  assert.equal(Date.parse(hasil.jamPulangIso), wita('2026-11-02T16:00:00'))
  assert.equal(hasil.pulangLintasHari, false)
})

test('shift malam 20.31 → 08.00 tercatat pulang H+1', () => {
  const hasil = susunWaktuKoreksi({
    tanggal: '2026-11-02',
    jamMasuk: '20:31',
    jamPulang: '08:00',
  })
  assert.equal(Date.parse(hasil.jamMasukIso), wita('2026-11-02T20:31:00'))
  assert.equal(Date.parse(hasil.jamPulangIso), wita('2026-11-03T08:00:00'))
  assert.equal(hasil.pulangLintasHari, true)
})

test('timestamp pulang H+1 yang tidak diubah dipertahankan', () => {
  const masukAsli = '2026-11-02T20:31:00+08:00'
  const pulangAsli = '2026-11-03T08:00:00+08:00'
  const hasil = susunWaktuKoreksi({
    tanggal: '2026-11-02',
    jamMasuk: '20:31',
    jamPulang: '08:00',
    masukAsli,
    pulangAsli,
  })
  assert.equal(hasil.jamMasukIso, masukAsli)
  assert.equal(hasil.jamPulangIso, pulangAsli)
  assert.equal(hasil.pulangLintasHari, true)
})

test('absen masuk setelah tengah malam tidak bergeser', () => {
  const masukAsli = '2026-11-03T00:30:00+08:00'
  const hasil = susunWaktuKoreksi({
    tanggal: '2026-11-02',
    jamMasuk: '00:30',
    jamPulang: '08:00',
    masukAsli,
  })
  assert.equal(hasil.jamMasukIso, masukAsli)
  assert.equal(Date.parse(hasil.jamPulangIso), wita('2026-11-03T08:00:00'))
  assert.equal(hasil.pulangLintasHari, true)
})

test('jam pulang yang sama tetap digeser ke hari berikutnya', () => {
  const hasil = susunWaktuKoreksi({
    tanggal: '2026-11-02',
    jamMasuk: '20:31',
    jamPulang: '20:31',
  })
  assert.equal(Date.parse(hasil.jamPulangIso), wita('2026-11-03T20:31:00'))
})

test('tanpa jam pulang menghasilkan pulang kosong', () => {
  const hasil = susunWaktuKoreksi({
    tanggal: '2026-11-02',
    jamMasuk: '20:31',
    jamPulang: '',
  })
  assert.equal(hasil.jamPulangIso, null)
  assert.equal(hasil.pulangLintasHari, false)
})
