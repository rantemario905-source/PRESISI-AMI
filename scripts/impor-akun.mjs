#!/usr/bin/env node
/**
 * ==========================================================================
 * Impor Akun Pegawai Massal — PRESISI AMI
 * --------------------------------------------------------------------------
 * Membuat akun login (Supabase Auth) sekaligus mengisi nama lengkap + gelar
 * dan unit kerja pada tabel public.pegawai.
 *
 * Kebutuhan:
 *   • File CSV UTF-8 dengan kolom: nama, email, unit kerja
 *   • Kolom password opsional (bila kosong, dibuat otomatis)
 *   • Secret key Supabase (Dashboard → Project Settings → API → Secret keys,
 *     atau legacy service_role key). JANGAN pernah di-commit.
 *
 * Contoh pemakaian:
 *   node scripts/impor-akun.mjs data-pegawai.csv --dry-run
 *   node scripts/impor-akun.mjs data-pegawai.csv --secret-file C:\rahasia\secret.txt
 *
 * File hasil impor berisi password awal. Distribusikan lewat jalur aman,
 * lalu hapus file tersebut.
 * ==========================================================================
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const ALIAS_KOLOM = {
  nama: ['nama', 'nama lengkap', 'nama pegawai', 'name', 'full name'],
  email: ['email', 'e-mail', 'alamat email', 'email login'],
  unit_kerja: ['unit kerja', 'unit_kerja', 'unit', 'instalasi', 'ruangan'],
  password: ['password', 'sandi', 'kata sandi', 'password awal'],
}

const HURUF_PASSWORD = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'

function bacaArgumen() {
  const argv = process.argv.slice(2)
  const opsi = { file: '', secretFile: '', dryRun: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dry-run') opsi.dryRun = true
    else if (arg === '--secret-file') {
      opsi.secretFile = argv[i + 1] ?? ''
      i += 1
    } else if (!arg.startsWith('--') && !opsi.file) opsi.file = arg
    else throw new Error(`Argumen tidak dikenal: ${arg}`)
  }
  return opsi
}

/** Baca VITE_SUPABASE_URL dari .env tanpa menyentuh nilainya di log. */
function bacaEnvLokal() {
  const hasil = {}
  try {
    const teks = fs.readFileSync(path.resolve('.env'), 'utf8')
    for (const baris of teks.split(/\r?\n/)) {
      const cocok = baris.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/)
      if (!cocok) continue
      hasil[cocok[1]] = cocok[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    // .env tidak wajib ada bila URL diberikan lewat environment variable.
  }
  return hasil
}

function ambilUrlSupabase() {
  const env = bacaEnvLokal()
  return (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    env.VITE_SUPABASE_URL ||
    ''
  )
}

function ambilSecretKey(opsi) {
  if (process.env.SUPABASE_SECRET_KEY) return process.env.SUPABASE_SECRET_KEY.trim()
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
  if (opsi.secretFile) {
    const teks = fs.readFileSync(path.resolve(opsi.secretFile), 'utf8').trim()
    if (!teks) throw new Error('File secret kosong.')
    return teks.split(/\r?\n/)[0].trim()
  }
  return ''
}

function deteksiPemisah(teks) {
  const barisHeader = teks.split(/\r?\n/).find((baris) => baris.trim()) ?? ''
  const koma = (barisHeader.match(/,/g) ?? []).length
  const titikKoma = (barisHeader.match(/;/g) ?? []).length
  return titikKoma > koma ? ';' : ','
}

/** Parser CSV sederhana yang mendukung tanda kutip, koma di dalam nama, dan newline. */
function parseCsv(teks, pemisah) {
  const baris = []
  let sel = ''
  let dalamKutip = false
  let barisAktif = []

  for (let i = 0; i < teks.length; i += 1) {
    const karakter = teks[i]
    if (dalamKutip) {
      if (karakter === '"') {
        if (teks[i + 1] === '"') {
          sel += '"'
          i += 1
        } else {
          dalamKutip = false
        }
      } else {
        sel += karakter
      }
    } else if (karakter === '"') {
      dalamKutip = true
    } else if (karakter === pemisah) {
      barisAktif.push(sel)
      sel = ''
    } else if (karakter === '\n') {
      barisAktif.push(sel)
      baris.push(barisAktif)
      barisAktif = []
      sel = ''
    } else if (karakter !== '\r') {
      sel += karakter
    }
  }

  if (sel !== '' || barisAktif.length > 0) {
    barisAktif.push(sel)
    baris.push(barisAktif)
  }
  return baris.filter((isi) => isi.some((sel) => String(sel).trim() !== ''))
}

function normalisasiHeader(nilai) {
  return String(nilai ?? '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

function cariKolom(header, alias) {
  return header.findIndex((judul) => alias.includes(judul))
}

function buatPassword() {
  let password = 'Ami-'
  for (let i = 0; i < 8; i += 1) {
    password += HURUF_PASSWORD[crypto.randomInt(HURUF_PASSWORD.length)]
  }
  return password
}

function validasiEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function kutipCsv(nilai) {
  const teks = String(nilai ?? '')
  return /[",;\r\n]/.test(teks) ? `"${teks.replace(/"/g, '""')}"` : teks
}

function tulisHasil(file, hasil) {
  const stempel = new Date()
    .toLocaleString('sv-SE', { timeZone: 'Asia/Makassar' })
    .replace(/[: ]/g, '-')
  const lokasi = path.join(path.dirname(path.resolve(file)), `hasil-impor-${stempel}.csv`)
  const kolom = ['nama', 'email', 'password', 'status', 'catatan']
  const isi = [
    kolom.join(','),
    ...hasil.map((baris) => kolom.map((k) => kutipCsv(baris[k])).join(',')),
  ]
  fs.writeFileSync(lokasi, `\uFEFF${isi.join('\r\n')}`, 'utf8')
  return lokasi
}

async function main() {
  const opsi = bacaArgumen()
  if (!opsi.file) {
    throw new Error(
      'Pemakaian: node scripts/impor-akun.mjs <data-pegawai.csv> [--dry-run] [--secret-file <path>]',
    )
  }

  const lokasiFile = path.resolve(opsi.file)
  if (!fs.existsSync(lokasiFile)) throw new Error(`File tidak ditemukan: ${lokasiFile}`)

  const teks = fs.readFileSync(lokasiFile, 'utf8').replace(/^\uFEFF/, '')
  const pemisah = deteksiPemisah(teks)
  const baris = parseCsv(teks, pemisah)
  if (baris.length < 2) throw new Error('CSV kosong atau hanya berisi header.')

  const header = baris[0].map(normalisasiHeader)
  const kolom = {
    nama: cariKolom(header, ALIAS_KOLOM.nama),
    email: cariKolom(header, ALIAS_KOLOM.email),
    unit: cariKolom(header, ALIAS_KOLOM.unit_kerja),
    password: cariKolom(header, ALIAS_KOLOM.password),
  }

  if (kolom.nama < 0 || kolom.email < 0) {
    throw new Error(
      'Kolom "nama" dan "email" wajib ada. Header terbaca: ' + header.join(', '),
    )
  }

  const kandidat = []
  const galat = []
  const peringatan = []
  const emailTerpakai = new Set()

  baris.slice(1).forEach((isi, indeks) => {
    const nomorBaris = indeks + 2
    const nama = String(isi[kolom.nama] ?? '').replace(/\s+/g, ' ').trim()
    const email = String(isi[kolom.email] ?? '').trim().toLowerCase()
    const unit = kolom.unit >= 0 ? String(isi[kolom.unit] ?? '').trim() : ''
    const passwordInput = kolom.password >= 0 ? String(isi[kolom.password] ?? '').trim() : ''

    if (!nama || nama.length < 2) {
      galat.push(`Baris ${nomorBaris}: nama kosong atau terlalu pendek.`)
      return
    }
    if (!email || !validasiEmail(email)) {
      galat.push(`Baris ${nomorBaris}: email tidak valid (${email || 'kosong'}).`)
      return
    }
    if (emailTerpakai.has(email)) {
      galat.push(`Baris ${nomorBaris}: email duplikat di CSV (${email}).`)
      return
    }
    if (!unit) {
      peringatan.push(`Baris ${nomorBaris}: unit kerja kosong, memakai "Belum ditentukan".`)
    }

    let password = passwordInput
    if (password) {
      if (password.length < 6) {
        galat.push(`Baris ${nomorBaris}: password minimal 6 karakter.`)
        return
      }
      if (password.length < 8) {
        peringatan.push(`Baris ${nomorBaris}: password kurang dari 8 karakter.`)
      }
    } else {
      password = buatPassword()
    }

    emailTerpakai.add(email)
    kandidat.push({
      nama,
      email,
      unit_kerja: unit || 'Belum ditentukan',
      password,
    })
  })

  console.log(`File          : ${lokasiFile}`)
  console.log(`Pemisah CSV   : "${pemisah}"`)
  console.log(`Baris data    : ${baris.length - 1}`)
  console.log(`Valid         : ${kandidat.length}`)

  if (peringatan.length > 0) {
    console.log(`\nPeringatan (${peringatan.length}):`)
    peringatan.slice(0, 20).forEach((pesan) => console.log(`  • ${pesan}`))
    if (peringatan.length > 20) console.log(`  … dan ${peringatan.length - 20} lainnya`)
  }

  if (galat.length > 0) {
    console.log(`\nKesalahan (${galat.length}) — tidak ada akun yang dibuat:`)
    galat.forEach((pesan) => console.log(`  ✕ ${pesan}`))
    process.exitCode = 1
    return
  }

  if (opsi.dryRun) {
    console.log('\nMode uji (--dry-run): tidak ada akun yang dibuat.')
    console.log('Contoh data yang akan diproses:')
    kandidat.slice(0, 5).forEach((barisData) => {
      console.log(`  • ${barisData.nama} <${barisData.email}> — ${barisData.unit_kerja}`)
    })
    if (kandidat.length > 5) console.log(`  … dan ${kandidat.length - 5} lainnya`)
    return
  }

  const url = ambilUrlSupabase()
  const secret = ambilSecretKey(opsi)
  if (!url) throw new Error('VITE_SUPABASE_URL tidak ditemukan di .env.')
  if (!secret) {
    throw new Error(
      'Secret key belum diberikan. Set environment SUPABASE_SECRET_KEY atau gunakan --secret-file.',
    )
  }

  const admin = createClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  console.log('\nMengambil daftar akun yang sudah ada…')
  const emailTerdaftar = new Set()
  let halaman = 1
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page: halaman, perPage: 1000 })
    if (error) throw new Error(`Gagal mengambil daftar akun: ${error.message}`)
    const daftar = data?.users ?? []
    daftar.forEach((user) => {
      if (user.email) emailTerdaftar.add(user.email.toLowerCase())
    })
    if (daftar.length === 0) break
    halaman += 1
  }
  console.log(`Akun terdaftar: ${emailTerdaftar.size}`)

  const hasil = []
  let dibuat = 0
  let dilewati = 0
  let gagal = 0

  for (const barisData of kandidat) {
    if (emailTerdaftar.has(barisData.email)) {
      dilewati += 1
      hasil.push({ ...barisData, password: '', status: 'dilewati', catatan: 'Email sudah terdaftar' })
      continue
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: barisData.email,
      password: barisData.password,
      email_confirm: true,
      user_metadata: { nama: barisData.nama, unit_kerja: barisData.unit_kerja },
    })

    if (error) {
      gagal += 1
      hasil.push({ ...barisData, status: 'gagal', catatan: error.message })
      console.log(`  ✕ ${barisData.email} — ${error.message}`)
      continue
    }

    const user = data?.user
    let catatan = ''
    if (user) {
      const { error: errorProfil } = await admin
        .from('pegawai')
        .upsert(
          { id: user.id, nama: barisData.nama, unit_kerja: barisData.unit_kerja },
          { onConflict: 'id' },
        )
      if (errorProfil) {
        catatan = `Akun dibuat, profil gagal diperbarui: ${errorProfil.message}`
      }
    }

    dibuat += 1
    hasil.push({ ...barisData, status: 'dibuat', catatan })
    if (dibuat % 10 === 0 || dibuat === kandidat.length) {
      console.log(`  … ${dibuat} akun dibuat`)
    }

    // Jeda kecil agar tidak membebani Auth API.
    await new Promise((resolve) => setTimeout(resolve, 150))
  }

  const lokasiHasil = tulisHasil(lokasiFile, hasil)

  console.log('\n================ RINGKASAN ================')
  console.log(`Dibuat   : ${dibuat}`)
  console.log(`Dilewati : ${dilewati} (email sudah terdaftar)`)
  console.log(`Gagal    : ${gagal}`)
  console.log(`File hasil: ${lokasiHasil}`)
  console.log('File hasil berisi password awal — distribusikan dengan aman lalu hapus.')
  console.log('===========================================')

  if (gagal > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(`\nGAGAL: ${error.message}`)
  process.exitCode = 1
})
