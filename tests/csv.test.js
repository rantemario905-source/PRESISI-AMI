import test from 'node:test'
import assert from 'node:assert/strict'
import { amankanSelCsv } from '../src/utils/csv.js'

test('amankanSelCsv mengamankan sel berawalan formula', () => {
  assert.equal(amankanSelCsv('=2+2'), "'=2+2")
  assert.equal(amankanSelCsv('+CMD'), "'+CMD")
  assert.equal(amankanSelCsv('-1'), "'-1")
  assert.equal(amankanSelCsv('@SUM'), "'@SUM")
})

test('amankanSelCsv tidak mengubah angka asli', () => {
  assert.equal(amankanSelCsv(-1), '-1')
  assert.equal(amankanSelCsv(42), '42')
})

test('amankanSelCsv mengosongkan null dan undefined', () => {
  assert.equal(amankanSelCsv(null), '')
  assert.equal(amankanSelCsv(undefined), '')
})

test('amankanSelCsv mengapit sel yang memuat pemisah atau kutip', () => {
  assert.equal(amankanSelCsv('teks;koma'), '"teks;koma"')
  assert.equal(amankanSelCsv('baris\nbaru'), '"baris\nbaru"')
  assert.equal(amankanSelCsv('kata "kutip"'), '"kata ""kutip"""')
})

test('amankanSelCsv menggabungkan proteksi formula dan pengapitan', () => {
  assert.equal(amankanSelCsv('=A1;B1'), '"\'=A1;B1"')
})
