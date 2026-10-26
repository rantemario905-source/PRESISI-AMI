# AGENTS.md — PRESISI AMI

Panduan kerja untuk agen AI di repo ini. **Baca file ini dan `progress.md` sebelum
mulai bekerja.** Dokumen ini juga menjadi **ledger instruksi user** untuk audit.

---

## 1. Ringkasan Proyek

Aplikasi absensi pegawai non-ASN RSUD Aji Muhammad Idris.

- **Frontend:** React 18 + Vite 5 + Tailwind CSS 3 + React Router 6.
- **Backend:** Supabase (Postgres, Auth, Storage, RPC `SECURITY DEFINER`).
- **Fitur inti:** geofencing 100 m, anti Fake GPS, device binding satu perangkat
  aktif per pegawai, presensi shift/reguler dengan jendela waktu (masuk 20 menit
  sebelum jam masuk, pulang 1 menit setelah jam pulang), jadwal shift, hari
  libur, keterlambatan, Alfa otomatis, Dinas/Sakit/Cuti, koreksi presensi,
  rekapitulasi, impor jadwal CSV/XLSX, serta hapus grup shift kosong.
- **Peran:** `pegawai`, `superadmin`, dan status `kepala_ruangan` (bukan role
  terpisah).
- **Bahasa:** UI, dokumentasi, dan komentar ditulis dalam **Bahasa Indonesia**.

---

## 2. Perintah Proyek

```bash
npm install          # pasang dependensi
npm run dev          # development → http://localhost:5173
npm run build        # build produksi (verifikasi utama)
npm run preview      # pratinjau hasil build
```

- **Tidak ada** `lint` maupun `test` di `package.json`. Jangan mengarang perintah.
- Verifikasi kode = `npm run build`.
- Verifikasi DB = jalankan `supabase/verifikasi_*.sql` di Supabase SQL Editor dan
  pastikan semua hasil `true`.
- Skrip bantu (butuh Secret key, jangan pernah di-commit):
  `node scripts/impor-akun.mjs ...`, `node scripts/verifikasi-impor.mjs ...`.

**Urutan migrasi wajib:** `01 → 02 → ... → 18`, satu per satu. Jangan mengulang
migrasi lama bila tidak diperlukan. `supabase/schema.sql` adalah gabungan
seluruh migrasi untuk instalasi sekali jalan.

---

## 3. Peta Arsitektur

| Area | Lokasi | Catatan |
|---|---|---|
| Entry & router | `src/main.jsx`, `src/App.jsx` | Pemisahan rute per peran |
| Konfigurasi | `src/config/constants.js` | Koordinat RSUD AMI, radius, zona waktu |
| Klien Supabase | `src/utils/supabaseClient.js` | Membaca `VITE_*` dari `.env` |
| Akses data | `src/services/*.js` | Satu service per domain |
| Konteks auth | `src/context/AuthContext.jsx` | Sesi, profil, peran |
| Geofencing | `src/utils/geofencing.js` | Haversine + anti mock location |
| Device binding | `src/utils/deviceHelper.js` | UUID di `localStorage` |
| UI dasar | `src/components/ui/*` | Button, Badge, Alert, Modal, TabBar, dll. |
| Layout | `src/components/layout/*` | Portal admin & kepala ruangan |
| Halaman | `src/pages/**` | `admin/` untuk portal Super Admin/kepala |
| Database | `supabase/migrations/01–18` | Skema, RLS, RPC, seed |
| Verifikasi DB | `supabase/verifikasi_*.sql` | Pemeriksaan pasca-migrasi |
| Cron Alfa | `supabase/jadwal_alfa.sql` | Opsional, butuh `pg_cron` |

---

## 4. Aturan Wajib

1. **Jangan commit atau push** kecuali user memerintahkan secara eksplisit.
   Setelah tugas selesai, biarkan perubahan di working tree agar user dapat
   menguji lokal terlebih dahulu.
2. **Jangan menyentuh `.env`** dan jangan pernah menulis secret/API key ke repo,
   log, atau dokumen.
3. **Koordinat pusat ada di dua tempat:** `src/config/constants.js` dan
   `supabase/schema.sql` (fungsi `submit_presensi`). Ubah keduanya bila berubah.
4. **Bucket `dokumen-izin` tetap privat.** Jangan mengubah policy menjadi publik.
5. **Validasi server adalah sumber kebenaran.** Jangan memindahkan aturan keamanan
   (jarak, jadwal, peran, duplikasi) hanya ke klien.
6. **Jangan mengaktifkan Alfa otomatis** sebelum jadwal lengkap dan hari libur
   terisi. Tidak ada finalisasi bulanan; sel kosong berarti belum dijadwalkan.
7. **Migrasi bertahap** dan jangan mengubah migrasi yang sudah dijalankan di
   produksi; buat migrasi baru.
8. **Placeholder & teks UI dalam Bahasa Indonesia.** Jangan menambah komentar kode
   kecuali diminta.
9. **Verifikasi sebelum klaim selesai:** jalankan `npm run build` bila mengubah
   kode, dan sebutkan bukti/keluarannya.
10. **Perbarui dokumentasi audit** setiap selesai tugas (lihat bagian 6).

**Alur Git (wajib):** pekerjaan selesai → perubahan **tetap lokal** → user uji
lokal → perbaiki bila ada temuan → **commit/push hanya setelah perintah user**.
Larangan ini berlaku juga untuk pembaruan `progress.md` dan `AGENTS.md`.

---

## 5. Protokol Kerja (WAJIB)

1. **Awal sesi:** baca `progress.md` → bagian **Status Terkini** dan entri log
   terakhir. Jangan mengulang pekerjaan yang sudah tercatat selesai.
2. **Sebelum eksekusi:** catat instruksi user baru di **Log Instruksi User**
   (bagian 7) dengan ID berurutan.
3. **Saat bekerja:** ikuti konvensi file/folder yang ada; jangan mengubah gaya
   kode secara sepihak.
4. **Setelah selesai:** tambahkan entri di `progress.md` (Log Kronologis) dan
   perbarui Status Terkini + backlog — **tanpa commit/push**. Laporkan file yang
   berubah dan tunggu perintah user.
5. **Commit/push hanya bila user memerintahkan.** Sebelum itu, verifikasi lokal
   (`npm run build` dan/atau uji manual) dan perbaiki temuan.
6. **Klaim "selesai"/"lulus" hanya dengan bukti** perintah verifikasi dan
   hasilnya. Bila belum dijalankan, tulis "belum diverifikasi".
7. Bila user meminta sesuatu yang bertentangan dengan aturan keamanan di atas,
   tolak dengan singkat dan tawarkan alternatif.

---

## 6. Format Update `progress.md`

- Entri baru diletakkan **di atas** entri lama pada Log Kronologis.
- Judul: `### YYYY-MM-DD HH:mm WITA — <ringkasan>`.
- Isi minimal: **Perubahan**, **File**, **Verifikasi**, **Catatan/risiko**.
- Tandai entri hasil rekonstruksi dengan `(rekonstruksi)` dan kesimpulan tak
  langsung dengan `(inferred)`.
- Jangan menghapus riwayat. Koreksi ditambahkan sebagai catatan.

---

## 7. Log Instruksi User (Audit)

> Instruksi dicatat **verbatim** (teks asli) beserta ringkasan tindakan.
> ID berurutan: `I-001`, `I-002`, dst. Jangan mengubah entri lama.

| ID | Waktu (WITA) | Instruksi User (verbatim) | Tindakan | Status | Ref `progress.md` |
|---|---|---|---|---|---|
| I-001 | 2026-10-25 12:10 | "saya arahkan kamu untuk mencacat semua progress pekerjaan kita di progress.md dan mencacat perintah saya ke kamu di agnets agar semua pekerjaan kita bisa teraudit dan tercatata dengan rapih jadi kamu nanti tinggal saya ingatkan untuk melihat progress terakhir di file md tersebut agar tidak bingung" | Membaca repo & README; menyusun rencana; membuat `progress.md` + `AGENTS.md`; rekonstruksi Fase 1–8 dan UI navigasi | selesai | 2026-10-25 12:23 — Audit trail |
| I-002 | 2026-10-25 12:18 | "setuju" | Menyetujui rencana (rekonstruksi lengkap, verbatim + ringkasan, tautan README) | selesai | 2026-10-25 12:23 — Audit trail |
| I-003 | 2026-10-25 12:23 | "kerjakan" | Eksekusi pembuatan `progress.md`, `AGENTS.md`, dan tautan di `README.md` | selesai | 2026-10-25 12:23 — Audit trail |
| I-004 | 2026-10-25 12:37 | "selanjutnya kita commit dan push ke githup untuk masuk tahap deploying" | Review perubahan, commit seluruh pekerjaan Fase 4–8 + UI + dokumen audit, lalu push ke GitHub | selesai | 2026-10-25 12:48 — Push ke GitHub berhasil |
| I-005 | 2026-10-25 12:55 | "tahap 1 sudah selesai, deploy vercel tidak perlu cukup menggunakan github langsung sjaa" | Mengganti target deploy ke GitHub Pages: workflow Actions, base path, basename router, fallback 404 | selesai | 2026-10-25 13:19 — Deploy GitHub Pages aktif |
| I-006 | 2026-10-25 13:00 | "GitHub Pages (Recommended)" (jawaban pilihan) | Menyetujui GitHub Pages sebagai target deploy | selesai | 2026-10-25 13:01 — Konfigurasi deploy GitHub Pages |
| I-007 | 2026-10-25 14:04 | "sudah saya coba dan berhasil semua, cuma saya akan kasih perintah ke kamu bahwa kamu tidak boleh commit dan push ke github sbeelum saya perintahkan karna saya mau tes local dulu jika ada kerjaan selesai baru jika fix baru commit dan push" | Menetapkan alur Git baru: perubahan ditahan lokal, user uji dulu, commit/push hanya setelah perintah eksplisit; memperbarui `AGENTS.md` + `progress.md` tanpa commit | selesai | 2026-10-25 14:04 — Aturan commit/push & uji perangkat |
| I-008 | 2026-10-25 14:2x | Instruksi sesi yang terputus (teks verbatim tidak tersimpan): hapus finalisasi jadwal + terapkan satu perangkat aktif per pegawai `(rekonstruksi dari TODO panel & diff working tree)` | Membuat migrasi 15 & 16, verifikasi 15 & 16, menyesuaikan schema/cleanup/frontend/dokumen | berjalan → dilanjutkan pada I-009 | 2026-10-26 — Migrasi 15–16 |
| I-009 | 2026-10-26 | "kemarin pekerjaan terhenti karna limit kamu lanjutkan pekerjaan yang belum selesai kemarin" | Melanjutkan pekerjaan I-008: cek diff, perbaiki mojibake, lengkapi dokumen, jalankan `npm run build` | selesai | 2026-10-26 — Migrasi 15–16 |
| I-010 | 2026-10-26 | "sudah testing absen dan kita set akan jam absen masuk baru bisa di klik 15 menit sebelum jam terlambat semisal jam 8 pagi pegawai baru bisa absen 20 menit sebelum jam 8 dan mengisi jam pulang baru bisa di isi sebelum jam pulang lewat emisal jam pulnag 16:30 absen pulang baru bisa di isi di jam 16:31" | Menambahkan jendela waktu absensi (klarifikasi user: masuk dibuka 20 menit sebelum jam masuk; pulang dibuka 16.31 untuk jam pulang 16.30; berlaku reguler & shift termasuk lintas hari): validasi klien + server, pesan jam buka, migrasi 17 | selesai | 2026-10-26 — Jendela waktu absensi |
| I-011 | 2026-10-26 12:07 | "buka akses hapus grub karna ada grub yang kosong yang harus di hapus atau hilangkan atau perbaikan grub kedepannya" | Mengaktifkan hapus grup kosong; grup sistem "Belum ditentukan" disembunyikan bila tanpa pegawai (UI), migrasi 18 dan verifikasi 18 | selesai | 2026-10-26 — Hapus grup kosong |
| I-012 | 2026-10-26 13:45 | "oke sudah jelas, selanjutnya tambahkan loading bar di atas seperti website pada umumnya yang berwarna biru muda, ketika membuka menu, masuk login dan yang lainnnya" | Menambahkan bilah progres biru muda di atas layar untuk navigasi rute, login, logout, dan muat ulang profil; verifikasi `npm run build` | selesai | 2026-10-26 — Bilah progres navigasi |

---

## 8. Fakta Lingkungan

- OS: Windows, shell **PowerShell 5.1**. Gunakan `;` atau `if ($?) { ... }`, bukan
  `&&`. Gunakan `workdir`, jangan `cd`.
- Repo: branch `main`; remote `origin` =
  `https://github.com/rantemario905-source/PRESISI-AMI.git`; commit fitur
  `2c8a775` (Fase 4-8 + UI), commit dokumen audit `4739c4a`, commit
  `c21ecf9` (migrasi 15-17, jendela absen, satu perangkat), commit
  `6343111` (hapus grup kosong, grup sistem), dan commit `7e32c0e`
  (sinkronisasi dokumen audit) yang di-push 2026-10-26 13:19. Working tree
  berisi perubahan bilah progres yang belum di-commit.
- **Deploy:** GitHub Pages lewat `.github/workflows/deploy.yml`; URL live
  `https://rantemario905-source.github.io/PRESISI-AMI/`; base path
  `/PRESISI-AMI/`; secrets `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
  Setiap push ke `main` otomatis build + deploy.
- Timezone aplikasi: `Asia/Makassar` (WITA, UTC+8).
- `dist/` dan `.env` sudah diabaikan Git.
