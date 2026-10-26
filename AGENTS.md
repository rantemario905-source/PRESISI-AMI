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
| I-013 | 2026-10-26 14:21 | "saya mau mengganti logo aplikasi dengan logo yang sudah sudah saya masukkan di folder assets dengan nama file logo-rsud-ami.png jadi logo di menu login dan portal aplikasi pegawai dan super admin diganti dengan logo itu, untuk menjadi logo resmi aplikasi" | Mengganti logo SVG sementara dengan `src/assets/logo-rsud-ami.png` di login, header pegawai, sidebar Super Admin, dan sidebar kepala ruangan; verifikasi `npm run build` | selesai | 2026-10-26 — Logo resmi RSUD AMI |
| I-014 | 2026-10-26 14:35 | "di sidebar kiri ada tulisan superadmin, hilangkan saja agar rapih agar tulisan presisi ami RSUD Aji Muhammad Idris turun kebawah agar lebih rapih [Image 1] [Image 2] dan buat agar logo aplikasi berubah juga di logo di atas [Image 3]" | Menghapus label "Super Admin" dari header sidebar dan mengganti favicon tab/apple-touch-icon dengan logo resmi; verifikasi build base `/` dan `/PRESISI-AMI/` | selesai | 2026-10-26 14:35 — Favicon logo resmi & rapikan sidebar |
| I-015 | 2026-10-26 14:56 | "gantitulisan dashboard utama menjadi dashboard saja, Total Pegawai Non-ASN menjadi total pegawai, Pegawai dengan peran pegawai ganti menjadi Non ASN, sudah absen pulang dihilangkan saja di dashboard dan sesuaikan lagi uinya agar rapih, Perlu verifikasi Admin IT ganti menjadi perlu Verifikasi" | Menyusun rencana perubahan label dashboard dan kartu statistik; direvisi oleh I-016 sebelum eksekusi | direvisi | 2026-10-26 14:56 — Penyesuaian label dashboard |
| I-016 | 2026-10-26 14:56 | "kemudian pada dashboard tulisan Sudah absen masuk ganti menjadi menjadi tanggal hari ini , dan rencana hapus sudah absen pulang tidak perlu , pertahankan saja" | Membatalkan penghapusan kartu **Sudah Absen Pulang** dan query `sudahPulang`; mengganti subtitle **Hadir Hari Ini** menjadi tanggal aktual | selesai | 2026-10-26 14:56 — Penyesuaian label dashboard |
| I-017 | 2026-10-26 14:56 | "tanggal aktual" | Menetapkan format tanggal aktual WITA, mis. `26 Oktober 2026`, untuk subtitle kartu **Hadir Hari Ini** | selesai | 2026-10-26 14:56 — Penyesuaian label dashboard |
| I-018 | 2026-10-26 14:56 | "kerjakan" | Menerapkan perubahan label dashboard, memperbarui dokumentasi audit, dan menjalankan build base `/` serta `/PRESISI-AMI/` | selesai | 2026-10-26 14:56 — Penyesuaian label dashboard |
| I-019 | 2026-10-26 15:07 | "Presensi hari ini lengkap ganti menjadi tanggal juga" | Mengganti subtitle kartu **Sudah Absen Pulang** menjadi tanggal aktual WITA, sama dengan kartu **Hadir Hari Ini** | selesai | 2026-10-26 15:07 — Tanggal kartu pulang & menu akun avatar |
| I-020 | 2026-10-26 15:07 | "dan juga tombol keluar dihilangkan saja, masukkan ke tombol keluar di avatar user di kanan atas jadi ketika user klik avatar di pojok kanan atas akan muncul layout tombol keluar agar lebih rapih, sesuaikan juga dengan tampilan mobile" | Membuat komponen `MenuAkun`, menghapus tombol Keluar mandiri di header portal pegawai/Super Admin/kepala ruangan, dan menampilkan logout lewat dropdown avatar yang responsif di HP | selesai | 2026-10-26 15:07 — Tanggal kartu pulang & menu akun avatar |
| I-021 | 2026-10-26 15:17 | "tutup juga, terapkan" | Menambahkan animasi buka (160 ms) dan tutup (140 ms) pada dropdown avatar, menahan elemen saat animasi tutup lalu melepasnya dari DOM; fokus kembali ke avatar saat Esc; verifikasi build base `/` dan `/PRESISI-AMI/` | selesai | 2026-10-26 15:17 — Animasi buka/tutup menu akun |
| I-022 | 2026-10-26 15:31 | "maksud saya menu di portal super admin di sidebar kiri ada banyak menu data & struktur dan yang lainnya itu ketika di klik dan menampilkan menu buat animasi bergulis ke bawah" | Menambahkan animasi gulir buka/tutup pada submenu grup sidebar Super Admin memakai transisi `grid-template-rows` + opacity/translate; submenu tertutup tidak dapat difokuskan; verifikasi build base `/` dan `/PRESISI-AMI/` | selesai | 2026-10-26 15:31 — Animasi submenu sidebar Super Admin |
| I-023 | 2026-10-26 22:05 | "itu adalah logo untuk kop rsudami itu nanti kita kerjakan, [Image 1] kemudian saya minta di menu sidebar kiri portal superadmin dan kepala ruangan agar lebih mepet dan rapih lagi karna saya liat jarak pilihan tiap menu itu terlalu berjarak [Image 2] dan buat agar background dashboard dibuat background agar sedikit rapih dengan warna biru muda transparan dan menu dibawahnya dibuat sedikit lebih rapat agar kelihatan rapih" + "lnjut" | Merapatkan jarak vertikal menu sidebar Super Admin dan Kepala Ruangan (rapat sedang, target sentuh 38–40 px); menambahkan latar gradasi biru muda transparan khusus halaman Dashboard Super Admin; aset `logo kutai kartanegara.png` disimpan untuk pekerjaan kop RSUD AMI berikutnya; verifikasi build base `/` dan `/PRESISI-AMI/` | selesai | 2026-10-26 22:05 — Sidebar rapat & latar dashboard |
| I-024 | 2026-10-26 22:20 | "berikan background latar biru untuk semua menu seperti dashboard yang barusan kamu kerjakan" | Menerapkan latar gradasi biru muda transparan ke seluruh halaman portal Super Admin dan Kepala Ruangan, bukan hanya Dashboard; verifikasi build base `/` dan `/PRESISI-AMI/` | selesai | 2026-10-26 22:20 — Latar biru semua menu portal |

---

## 8. Fakta Lingkungan

- OS: Windows, shell **PowerShell 5.1**. Gunakan `;` atau `if ($?) { ... }`, bukan
  `&&`. Gunakan `workdir`, jangan `cd`.
- Repo: branch `main`; remote `origin` =
  `https://github.com/rantemario905-source/PRESISI-AMI.git`; commit fitur
  `2c8a775` (Fase 4-8 + UI), commit dokumen audit `4739c4a`, commit
  `c21ecf9` (migrasi 15-17, jendela absen, satu perangkat), commit
  `6343111` (hapus grup kosong, grup sistem), commit `7e32c0e` (sinkronisasi
  dokumen audit), commit `900e916` (bilah progres navigasi), commit
  `4938341` (sinkronisasi dokumen audit), dan commit `cb80100` (logo resmi,
  menu akun, animasi navigasi). Working tree berisi perapian jarak sidebar
  Super Admin/kepala ruangan dan latar biru muda pada seluruh halaman portal
  Super Admin/kepala ruangan yang belum di-commit, serta aset baru
  `src/assets/logo kutai kartanegara.png` (untracked) untuk kop RSUD AMI yang
  akan dikerjakan terpisah.
- **Deploy:** GitHub Pages lewat `.github/workflows/deploy.yml`; URL live
  `https://rantemario905-source.github.io/PRESISI-AMI/`; base path
  `/PRESISI-AMI/`; secrets `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
  Setiap push ke `main` otomatis build + deploy.
- Timezone aplikasi: `Asia/Makassar` (WITA, UTC+8).
- `dist/` dan `.env` sudah diabaikan Git.
