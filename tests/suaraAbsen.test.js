import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mainkanLonceng,
  NADA_SUKSES,
  JEDA_NADA,
  DURASI_LONCENG,
} from '../src/utils/suaraAbsen.js'

test('mainkanLonceng tidak melempar galat di luar browser', () => {
  assert.doesNotThrow(() => mainkanLonceng())
})

test('nada sukses menaik dan denting terakhir terdengar jelas', () => {
  assert.equal(NADA_SUKSES.length, 4)
  for (let i = 1; i < NADA_SUKSES.length; i += 1) {
    assert.ok(NADA_SUKSES[i] > NADA_SUKSES[i - 1], 'nada harus menaik')
  }
  assert.equal(JEDA_NADA, 100)
  assert.ok(DURASI_LONCENG >= 600 && DURASI_LONCENG <= 900)
})
