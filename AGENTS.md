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
  rekapitulasi, laporan presensi bulanan per pegawai (PDF A4), impor jadwal
  CSV/XLSX, serta hapus grup shift kosong.
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

**Urutan migrasi wajib:** `01 → 02 → ... → 19`, satu per satu. Jangan mengulang
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
| Laporan bulanan | `src/pages/admin/LaporanBulanan.jsx`, `src/components/laporan/*` | Kop instansi, tabel harian, tanda tangan; cetak A4 portrait |
| Halaman | `src/pages/**` | `admin/` untuk portal Super Admin/kepala |
| Database | `supabase/migrations/01–19` | Skema, RLS, RPC, seed |
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
| I-025 | 2026-10-26 22:40 | "karna warna backgroundnya diubah menjadi bitu banyak tombol yang seperti melayang di pojok kanan atas [Image 1] seperti ini, tombol grub di pojok kanan atas terlalu jauh di pojok kanan, [Image 2] muat ulang dll, [Image 3] tahun hari libur juga, kemudian tulisan rsud aji muhammad idris di bawah tulisan menu yang dipilih dihilangkan saja[Image 4]" | Memindahkan tombol aksi `KepalaHalaman` agar menempel dekat judul halaman (tidak lagi di pojok kanan), merapikan kontrol Tahun Hari Libur menjadi satu baris, menghapus subtitle rumah sakit di topbar Super Admin, dan menyisakan nama unit kerja di topbar Kepala Ruangan; verifikasi build base `/` dan `/PRESISI-AMI/` | selesai | 2026-10-26 22:40 — Aksi dekat judul & subtitle topbar |
| I-026 | 2026-10-26 23:45 | "malah tambah aneh menurut saya, buat aja dia tetap di pojok kanan cuma posisinya paskan di luar kotak daftar, jadwal shift kembalikan posisinya ke kanan, data pegawai perbaiki ke kanan atas daftar, tambah grub shift masukkan ke dalam kotak daftar posisikan di kanan atas kotak ,master shift buka jadwal dan tombol shift masukkan kedalam kotak di pojok kanan atas daftar, hari libur masukkan kedalam kotak tambah hari libur di kanan atas sejajar dengan font, koreksi presesnsi tombol muat sejajarkan dengan audit trial, dinas & sakit pindahkan muat ulang dan catat dinas ke kanan atas kotak daftar , cuti juga samakan dengan dinas & sakit , rekapitulasi laporan pindahkan tombol ekspor dan  cetak ke kanan atas luar kota filter, verifikasi perangkat tombol muat pindahkan ke samping tombol semua" | Menggantikan pendekatan I-025: `KepalaHalaman` dikembalikan ke judul kiri/aksi kanan; aksi dipindah per halaman ke header kartu daftar (Data Pegawai, Grup Shift, Master Shift, Pengajuan Dinas & Sakit/Cuti), ke kartu Tambah Hari Libur (Tahun), ke baris tab setelah Audit Trail (Koreksi) dan setelah Semua (Verifikasi), dan ke atas kotak filter (Rekapitulasi); `TabBar` mendapat prop `aksi` | selesai | 2026-10-26 23:50 — Penempatan aksi per halaman |
| I-027 | 2026-10-26 23:50 | "kerjakan" | Mengeksekusi I-026, memperbarui dokumen audit, dan menjalankan build base `/` serta `/PRESISI-AMI/` | selesai | 2026-10-26 23:50 — Penempatan aksi per halaman |
| I-028 | 2026-10-27 00:03 | "commit dan push" | Memverifikasi `npm run build` (lulus 7,84 dtk), memperbarui dokumen audit, lalu commit penempatan aksi per halaman + subtitle topbar + aset logo kop, dan push ke `origin/main` | selesai | 2026-10-27 00:03 — Commit & push aksi per halaman |
| I-032 | 2026-10-27 01:03 | "sudah succses run dua2nya" | Konfirmasi migrasi 19 dan `verifikasi_19.sql` berhasil dijalankan di project Supabase yang benar; memperbarui Status Terkini `progress.md`; tidak ada perubahan kode | selesai | 2026-10-27 01:03 — Migrasi 19 & verifikasi 19 berhasil |
| I-031 | 2026-10-27 01:02 | "maaf ternyata sebelumnya saya masuk ke project yang salah makanya di awal eror" | Klarifikasi akar masalah: ERROR 42883 terjadi karena SQL Editor dibuka pada project Supabase yang salah. Pengecekan tabel pada migrasi 19 menahan eksekusi di project tanpa `pegawai`/`presensi`. Tidak ada perubahan kode; arahkan menjalankan migrasi 19 + verifikasi 19 di project yang cocok dengan `VITE_SUPABASE_URL` | selesai | 2026-10-27 01:02 — Klarifikasi project Supabase |
| I-030 | 2026-10-27 00:58 | "migrasi 19 saya jalankan dan eror di supabae" + `[Image 1]` (ERROR 42883: `public.is_superadmin()` does not exist) | Membuat migrasi 19 mandiri: pengecekan tabel, pembuatan ulang `is_superadmin()` sesuai migrasi 02, fungsi laporan memakai pengecekan role langsung; sinkron `schema.sql`, `verifikasi_19.sql`, dan dokumen audit | selesai (menunggu migrasi dijalankan ulang) | 2026-10-27 00:58 — Perbaikan migrasi 19 |
| I-029 | 2026-10-27 (WITA) | "atasan saya meminta agar ditambahkan bisa mencetak rekapan absensi setiap pegawai di bulan itu untuk laporan di akhir bulan jadi setiap kepala ruangan termasuk admin bisa mencetak laporan presensi bulanan setiap pegawai, tinggal itu yang kita tambahkan, semua bentuk laporan itu dicetak dalam bentuk PDF, dengan tanda tangan di kanan bawahnya, logo kutai yang sebelumnya saya upload itu akan menjadi logo kop laporan" + "format cetakan per pegawai isinya seperti apa bentuk tabel dan isinya" + "jarak tidak perlu, footer kecil boleh ditambakan contoh Dicetak melalui PRESISI-AMI" + "ini tulisan di dalam kop, font times now rowman, samakan persis bold dan ukuran fontnya" + "ya mulai kerjakan" | Menambahkan halaman Laporan Bulanan per Pegawai untuk Super Admin dan Kepala Ruangan: kop dua logo (Kutai kiri, RSUD kanan) + teks instansi Times New Roman, tabel harian (tanpa kolom jarak), ringkasan kehadiran, tanda tangan tunggal kanan bawah (Muara Badak, Kepala Ruangan, NIP kosong), footer "Dicetak melalui PRESISI-AMI", cetak satu pegawai/semua pegawai unit, PDF lewat dialog cetak A4 portrait, migrasi 19 (akses baca presensi unit oleh kepala ruangan), verifikasi 19, rute/menu, dan dokumen audit | selesai (belum diverifikasi cetak manual) | 2026-10-27 — Laporan presensi bulanan per pegawai |
| I-033 | 2026-10-27 09:03 | "ubah titik kordinat  rumah sakit menjadi -0.23795851007230442, 117.41438417546158" | Mengubah koordinat pusat RSUD AMI di klien (`src/config/constants.js`) dan server (`schema.sql` + migrasi 20 yang mendefinisikan ulang `submit_presensi`), serta menambah `verifikasi_20.sql` | selesai | 2026-10-27 09:03 — Koordinat RSUD AMI diperbarui |
| I-034 | 2026-10-27 09:20 | "-0.23781156083888882, 117.41437950820705 ubah lokasi titik gps rumah sakit" | Mengoreksi titik koordinat RSUD AMI di klien (`src/config/constants.js`), migrasi 20, seluruh definisi `submit_presensi` pada `schema.sql`, dan `verifikasi_20.sql`; verifikasi `npm run build` | selesai | 2026-10-27 09:20 — Koordinat RSUD AMI dikoreksi |
| I-035 | 2026-10-27 09:39 | "sudah saya run dan succses" | Konfirmasi migrasi 20 dan `verifikasi_20.sql` berhasil dijalankan di Supabase; pembaruan status dokumen audit; tidak ada perubahan kode | selesai | 2026-10-27 09:39 — Migrasi 20 & verifikasi 20 berhasil |
| I-036 | 2026-10-27 09:53 | "commit dan push" | Commit `fc772c1` (laporan presensi bulanan per pegawai, migrasi 19–20, verifikasi 19–20, koordinat RSUD AMI baru, dokumen audit) dan push ke `origin/main`; pembaruan status dokumen audit | selesai | 2026-10-27 09:53 — Commit & push laporan bulanan + koordinat |

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
  menu akun, animasi navigasi), dan commit `fd2d64a` (sidebar rapat dan latar
  portal biru) yang di-push 2026-10-26 22:25, commit `dbe0b2a`
  (sinkronisasi status dokumen), serta commit `c4fe733` (penempatan aksi per
  halaman, `KepalaHalaman` judul kiri/aksi kanan, subtitle topbar dihapus, dan
  aset `src/assets/logo kutai kartanegara.png`) yang di-commit/di-push
  2026-10-27 00:03, serta commit `e542c6c` (sinkronisasi dokumen audit), dan
  commit `fc772c1` (laporan presensi bulanan per pegawai + migrasi 19,
  koordinat RSUD AMI baru + migrasi 20) yang di-push 2026-10-27 09:53.
- **Deploy:** GitHub Pages lewat `.github/workflows/deploy.yml`; URL live
  `https://rantemario905-source.github.io/PRESISI-AMI/`; base path
  `/PRESISI-AMI/`; secrets `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
  Setiap push ke `main` otomatis build + deploy.
- Timezone aplikasi: `Asia/Makassar` (WITA, UTC+8).
- `dist/` dan `.env` sudah diabaikan Git.
