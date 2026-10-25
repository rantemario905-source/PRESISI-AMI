#!/usr/bin/env node
/**
 * Verifikasi hasil impor akun + uji login akun pertama.
 * Pemakaian:
 *   node scripts/verifikasi-impor.mjs <hasil-impor.csv> --secret-file <path>
 */
import fs from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function bacaEnv() {
  const env = {}
  try {
    for (const line of fs.readFileSync('.env', 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {}
  return env
}

function parseCsv(teks) {
  const baris = []
  let sel = ''
  let dalamKutip = false
  let aktif = []
  for (let i = 0; i < teks.length; i += 1) {
    const ch = teks[i]
    if (dalamKutip) {
      if (ch === '"') {
        if (teks[i + 1] === '"') {
          sel += '"'
          i += 1
        } else dalamKutip = false
      } else sel += ch
    } else if (ch === '"') dalamKutip = true
    else if (ch === ',') {
      aktif.push(sel)
      sel = ''
    } else if (ch === '\n') {
      aktif.push(sel)
      baris.push(aktif)
      aktif = []
      sel = ''
    } else if (ch !== '\r') sel += ch
  }
  if (sel !== '' || aktif.length) {
    aktif.push(sel)
    baris.push(aktif)
  }
  return baris
}

async function main() {
  const args = process.argv.slice(2)
  const file = args.find((a) => !a.startsWith('--'))
  const indexSecret = args.indexOf('--secret-file')
  if (!file) throw new Error('Sertakan file hasil impor sebagai argumen.')
  const secretFile = indexSecret >= 0 ? args[indexSecret + 1] : ''
  if (!secretFile) throw new Error('Sertakan --secret-file <path>.')

  const env = bacaEnv()
  const url = env.VITE_SUPABASE_URL
  const anon = env.VITE_SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tidak ada di .env.')

  const secret = fs.readFileSync(secretFile, 'utf8').trim()
  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let page = 1
  const users = []
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(`listUsers: ${error.message}`)
    const batch = data?.users ?? []
    users.push(...batch)
    if (batch.length === 0) break
    page += 1
  }

  const { data: profil, error: errProfil } = await admin
    .from('pegawai')
    .select('id, nama, unit_kerja, role')
  if (errProfil) throw new Error(`pegawai: ${errProfil.message}`)

  const ids = new Set(profil.map((p) => p.id))
  const tanpaProfil = users.filter((u) => !ids.has(u.id))
  const belumKonfirmasi = users.filter((u) => !u.email_confirmed_at && !u.confirmed_at)
  const roles = profil.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] ?? 0) + 1
    return acc
  }, {})

  console.log('Total akun Auth      :', users.length)
  console.log('Total baris pegawai  :', profil.length)
  console.log('Akun tanpa profil    :', tanpaProfil.length)
  console.log('Belum konfirmasi     :', belumKonfirmasi.length)
  console.log('Jumlah role          :', roles)
  console.log('Jumlah unit kerja    :', new Set(profil.map((p) => p.unit_kerja)).size)

  const rows = parseCsv(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
  const header = rows[0].map((h) => h.trim().toLowerCase())
  const idx = {
    nama: header.indexOf('nama'),
    email: header.indexOf('email'),
    password: header.indexOf('password'),
    status: header.indexOf('status'),
    catatan: header.indexOf('catatan'),
  }
  const data = rows.slice(1).filter((r) => String(r[idx.status] ?? '').trim() === 'dibuat')
  const catatanBerisi = data.filter((r) => String(r[idx.catatan] ?? '').trim() !== '')
  console.log('\nBaris hasil "dibuat":', data.length)
  console.log('Baris dengan catatan masalah:', catatanBerisi.length)

  const byEmail = new Map(users.map((u) => [String(u.email || '').toLowerCase(), u]))
  const byId = new Map(profil.map((p) => [p.id, p]))
  let emailHilang = 0
  let profilHilang = 0
  let namaBeda = 0
  let unitBeda = 0
  let roleBeda = 0
  for (const row of data) {
    const email = String(row[idx.email] ?? '').trim().toLowerCase()
    const nama = String(row[idx.nama] ?? '').trim()
    const user = byEmail.get(email)
    if (!user) {
      emailHilang += 1
      continue
    }
    const p = byId.get(user.id)
    if (!p) {
      profilHilang += 1
      continue
    }
    const meta = user.user_metadata || {}
    if (p.nama !== nama || meta.nama !== nama) namaBeda += 1
    if (meta.unit_kerja && p.unit_kerja !== meta.unit_kerja) unitBeda += 1
    if (p.role !== 'pegawai') roleBeda += 1
  }
  console.log('Email hasil impor tidak ditemukan:', emailHilang)
  console.log('Profil hasil impor tidak ditemukan:', profilHilang)
  console.log('Nama tidak cocok          :', namaBeda)
  console.log('Unit kerja tidak cocok    :', unitBeda)
  console.log('Role bukan pegawai        :', roleBeda)

  const contoh = data[0]
  const klien = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: login, error: errLogin } = await klien.auth.signInWithPassword({
    email: String(contoh[idx.email]).trim(),
    password: String(contoh[idx.password]).trim(),
  })
  if (errLogin) {
    console.log('\nUji login            : GAGAL —', errLogin.message)
    return
  }

  const { data: profilLogin } = await klien
    .from('pegawai')
    .select('nama, unit_kerja, role')
    .eq('id', login.user.id)
    .maybeSingle()

  console.log('Uji login            : BERHASIL')
  console.log('  email              :', login.user.email)
  console.log('  profil terbaca     :', profilLogin ? 'ya' : 'tidak')
  if (profilLogin) {
    console.log('  nama               :', profilLogin.nama)
    console.log('  unit kerja         :', profilLogin.unit_kerja)
    console.log('  role               :', profilLogin.role)
  }
  await klien.auth.signOut()
}

main().catch((error) => {
  console.error('GAGAL:', error.message)
  process.exitCode = 1
})
