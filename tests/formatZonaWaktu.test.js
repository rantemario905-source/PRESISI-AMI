import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'

test('namaBulan tetap Oktober 2026 meski zona waktu perangkat negatif', () => {
  const skrip = `
    import { namaBulan } from './src/utils/format.js'
    process.stdout.write(namaBulan('2026-10'))
  `
  const keluaran = execFileSync(
    process.execPath,
    ['--input-type=module', '-e', skrip],
    {
      cwd: process.cwd(),
      env: { ...process.env, TZ: 'America/Los_Angeles' },
      encoding: 'utf8',
    },
  )

  assert.equal(keluaran, 'Oktober 2026')
})
