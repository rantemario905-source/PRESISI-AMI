import test from 'node:test'
import assert from 'node:assert/strict'
import { mainkanLonceng } from '../src/utils/suaraAbsen.js'

test('mainkanLonceng tidak melempar galat di luar browser', () => {
  assert.doesNotThrow(() => mainkanLonceng())
})
