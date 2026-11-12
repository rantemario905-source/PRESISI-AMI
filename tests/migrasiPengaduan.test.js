import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const baca = (p) =>
  readFileSync(new URL(`../supabase/${p}`, import.meta.url), 'utf8')

const migrasi = baca('migrations/42_pengaduan_pulang_setelah_jendela.sql')
const schema = baca('schema.sql')

/** Ambil definisi fungsi terakhir dari sebuah berkas SQL. */
function ambilFungsi(sql, nama) {
  const awal = sql.lastIndexOf(`create or replace function public.${nama}(`)
  assert.ok(awal >= 0, `fungsi ${nama} tidak ditemukan`)
  const akhir = sql.indexOf('\n$$;', awal)
  assert.ok(akhir > awal, `penutup $$; ${nama} tidak ditemukan`)
  return sql.slice(awal, akhir + 4)
}

// PL/pgSQL membaca `THEN` milik CASE di dalam kondisi IF sebagai penutup IF,
// sehingga migrasi 42 gagal dengan "syntax error at end of input".
test('migrasi 42 tidak memakai CASE di dalam kondisi IF', () => {
  for (const berkas of [migrasi, schema]) {
    assert.doesNotMatch(berkas, /^\s+(and|or)\s+case\s*$/m)
  }
})

test('schema.sql identik dengan migrasi 42 untuk kedua RPC pengaduan', () => {
  for (const nama of ['ajukan_pengaduan_presensi', 'kandidat_pengaduan_presensi']) {
    assert.equal(
      ambilFungsi(schema, nama),
      ambilFungsi(migrasi, nama),
      `${nama} di schema.sql berbeda dengan migrasi 42`,
    )
  }
})

test('helper batas absen pulang sama di migrasi 42 dan schema.sql', () => {
  const helper = 'hitung_batas_absen_pulang'
  assert.equal(
    ambilFungsi(schema, helper),
    ambilFungsi(migrasi, helper),
    `${helper} di schema.sql berbeda dengan migrasi 42`,
  )
  assert.match(ambilFungsi(migrasi, helper), /interval '2 hours'/)
  assert.match(ambilFungsi(migrasi, helper), /interval '1 day'/)
})

test('kandidat absen pulang memakai batas tutup, bukan langsung tampil', () => {
  const kandidat = ambilFungsi(migrasi, 'kandidat_pengaduan_presensi')
  assert.match(kandidat, /v_dibuka := case/)
  assert.match(kandidat, /and v_dibuka/)
  assert.match(kandidat, /now\(\) >= v_tutup/)
})

test('pengajuan absen pulang ditolak server sebelum batas', () => {
  const ajukan = ambilFungsi(migrasi, 'ajukan_pengaduan_presensi')
  assert.match(ajukan, /now\(\) < v_tutup/)
  assert.match(ajukan, /baru dapat diajukan setelah pukul/)
})