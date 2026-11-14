# AGENTS.md — PRESISI AMI

Panduan kerja untuk agen AI di repo ini. **Baca file ini dan `progress.md` sebelum
mulai bekerja.** Dokumen ini juga menjadi **ledger instruksi user** untuk audit.

---

## 1. Ringkasan Proyek

Aplikasi absensi pegawai non-ASN RSUD Aji Muhammad Idris.

- **Frontend:** React 18 + Vite 7 + Tailwind CSS 3 + React Router 7.
- **Backend:** Supabase (Postgres, Auth, Storage, RPC `SECURITY DEFINER`).
- **Fitur inti:** geofencing 120 m, anti Fake GPS, device binding satu perangkat
  aktif per pegawai, presensi shift/reguler dengan jendela waktu (masuk dibuka
  1 jam sebelum jam masuk, pulang dibuka tepat waktu dan ditutup 2 jam setelah
  jam pulang), jam kerja reguler khusus per unit, jadwal shift, hari libur di
  laporan bulanan, keterlambatan per menit penuh (floor), Alfa otomatis,
  Dinas/Sakit/Cuti/Izin, pengaduan presensi masuk/pulang, koreksi presensi,
  rekapitulasi, laporan presensi bulanan per pegawai (PDF A4), impor jadwal
  Excel (.xlsx), tukar shift teraudit & cetak jadwal F4 landscape, hapus grup
  shift kosong, pengecualian radius untuk pegawai tertentu (tanpa mengubah
  aturan 120 m bagi pegawai lain), serta kepala unit multi-unit dan kepala ASN
  tanpa baris pegawai.
- **Peran:** `pegawai`, `superadmin`, dan penugasan `kepala_unit` (satu unit satu
  kepala, satu kepala boleh banyak unit). Kepala ASN memakai metadata
  `jenis_akun = kepala_asn` dan tidak dicatat di `public.pegawai`.
- **Bahasa:** UI, dokumentasi, dan komentar ditulis dalam **Bahasa Indonesia**.

---

## 2. Perintah Proyek

```bash
npm install          # pasang dependensi
npm run dev          # development → http://localhost:5173
npm run lint         # ESLint seluruh repo
npm test             # uji dasar node:test
npm run build        # build produksi (verifikasi utama)
npm run preview      # pratinjau hasil build
```

- Verifikasi kode = `npm run lint`, `npm test`, lalu `npm run build`.
- Workflow deploy menjalankan lint dan test sebelum build; kegagalan memblokir deploy.
- Verifikasi DB = jalankan `supabase/verifikasi_*.sql` di Supabase SQL Editor dan
  pastikan semua hasil `true`.
- Skrip bantu (butuh Secret key, jangan pernah di-commit):
  `node scripts/impor-akun.mjs ...`, `node scripts/verifikasi-impor.mjs ...`.

**Urutan migrasi wajib:** `01 → 02 → ... → 42`, satu per satu. Jangan mengulang
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
| Database | `supabase/migrations/01–42` | Skema, RLS, RPC, seed |
| Verifikasi DB | `supabase/verifikasi_*.sql` | Pemeriksaan pasca-migrasi (09–42) |
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
| I-037 | 2026-10-27 09:57 | "-0.23805651650343132, 117.41442516465149 kordinatnya ubah lagi" | Mengubah koordinat RSUD AMI di klien (`src/config/constants.js`), `schema.sql`, serta membuat migrasi 21 + `verifikasi_21.sql` (migrasi 20 tidak diubah karena sudah dijalankan); verifikasi `npm run build` | selesai | 2026-10-27 09:57 — Koordinat RSUD AMI diubah lagi |
| I-038 | 2026-10-27 09:59 | "commit dan push" | Commit `28a900f` (koordinat RSUD AMI terbaru, migrasi 21, verifikasi 21, dokumen audit) dan push ke `origin/main`; pembaruan status dokumen audit | selesai | 2026-10-27 09:59 — Commit & push migrasi 21 |
| I-039 | 2026-10-27 (WITA) | "saya beli domain di rumahweb.com bagaimana cara menggunakannya" | Meneliti panduan DNS Rumahweb dan GitHub Pages; menyusun rencana pemasangan domain `presisiami.my.id` (4 A record GitHub + CNAME `www`, custom domain, HTTPS, Supabase Auth); tidak ada perubahan kode | selesai | 2026-10-27 10:31 — Custom domain presisiami.my.id |
| I-040 | 2026-10-27 10:31 | "kerjakan" | Mengubah `VITE_BASE_PATH` menjadi `/`, menambah `public/CNAME`, memperbarui README serta dokumen audit; verifikasi build base `/`; belum di-commit/di-push | selesai | 2026-10-27 10:31 — Custom domain presisiami.my.id |
| I-041 | 2026-10-27 10:36 | "commit dan push" | Commit `11d35ab` (custom domain `presisiami.my.id`, `VITE_BASE_PATH` → `/`, `public/CNAME`, dokumen audit) dan push ke `origin/main`; verifikasi live domain, `www`, aset, dan fallback SPA; pembaruan status dokumen audit | selesai | 2026-10-27 10:36 — Commit & push custom domain + verifikasi live |
| I-042 | 2026-10-27 10:39 | "sudah semuanya dan migrasi 21" | Konfirmasi migrasi 21 dijalankan, Supabase Auth diperbarui, dan Enforce HTTPS diaktifkan; pembaruan dokumen audit. Pengecekan mandiri: HTTPS live, tetapi HTTP apex masih 200 tanpa redirect | selesai | 2026-10-27 10:39 — Migrasi 21, Supabase Auth, dan HTTPS |
| I-043 | 2026-10-27 (WITA) | "oke saya mau mememulai golive testing untuk beberapa pegawai, bagaimana caranya menghapus semua data testing" | Meninjau `supabase/cleanup_data_uji.sql` dan mendata tabel transaksi vs master; menyiapkan rencana pembersihan sebelum go-live | selesai | 2026-10-27 10:54 — Pembersihan data uji |
| I-044 | 2026-10-27 10:54 | "maksud saya menghapus data testing pegawai yang sudah ada 92 pegawia jangan di hapus yang di hapus itu data presensi shift dan yang lainnya kecuali data pegawia grub dan yang lainnya" | Memperbarui `supabase/cleanup_data_uji.sql`: hanya menghapus data transaksi (presensi, koreksi, izin, jadwal, jadwal final, perangkat), mempertahankan 92 pegawai/grup/master shift, dan menambah pembatalan otomatis bila jumlah data master berubah | selesai | 2026-10-27 10:54 — Pembersihan data uji |
| I-045 | 2026-10-27 11:02 | "sql sudah jalan" | Konfirmasi `supabase/cleanup_data_uji.sql` dijalankan; data transaksi terhapus dan data pegawai/grup/master dipertahankan; pembaruan dokumen audit; tidak ada perubahan kode | selesai | 2026-10-27 11:02 — Data uji dibersihkan |
| I-046 | 2026-10-27 (WITA) | "oke sekarang kita perbaiki kop [Image 1] , RUMAH SAKIT UMUM DAERAH AJI MUHAMMAD IDRIS buat menjadi 1 baris, dan perkecil sedikit font kop yang di bold, rapikahkan lagi isi kita diskusikan, izin dihapus saja dari laporan" | Kop dibuat satu baris dengan `white-space: nowrap` dan ukuran bold 12/13/14pt; identitas pegawai menjadi grid 2x2; ringkasan dirapikan; `Izin` dihapus dari ringkasan; lebar kolom tabel disesuaikan | selesai | 2026-10-27 11:41 — Kop & isi laporan dirapikan |
| I-047 | 2026-10-27 (WITA) | "dan buat keterangan koreksi tidak perlu di masukkan di laporan, cukup keterangan sakit,cuti,dinasluar,alfa" | `alasan_koreksi` dihapus dari query laporan; Keterangan hanya diisi alasan Sakit/Cuti/Dinas Luar, label `Alfa`, dan `—` untuk Hadir/Koreksi | selesai | 2026-10-27 11:41 — Kop & isi laporan dirapikan |
| I-048 | 2026-10-27 (WITA) | "pada footer jam tidak perlu dicantumkan" | Footer laporan hanya menampilkan tanggal cetak, jam dihilangkan | selesai | 2026-10-27 11:41 — Kop & isi laporan dirapikan |
| I-049 | 2026-10-27 (WITA) | "kerjakan" | Menjalankan perubahan I-046–I-048 dan `npm run build` (lulus 7,49 dtk); memperbarui dokumen audit | selesai | 2026-10-27 11:41 — Kop & isi laporan dirapikan |
| I-050 | 2026-10-27 12:04 | "ukuran logo rsud diperbesar lagi, pakan ukurannya dengan logo kutai, [Image 1] , kemudian identitas pegawai buat agar data mereka keluar setelah titik dua : Nama Pegawai: M Maulid , atau titik duanya disejajarkan di tngah antara keduanya" | Tinggi kedua logo kop disamakan 20 mm; label identitas dibuat selebar isinya dan nilai langsung mengikuti titik dua; `npm run build` lulus 8,95 dtk | selesai | 2026-10-27 12:04 — Logo & identitas laporan dirapikan |
| I-051 | 2026-10-27 12:10 | "logo rekapitulasi dan laporan bedakan" | Ikon menu **Laporan Bulanan** dibedakan menjadi dokumen, sedangkan **Rekapitulasi Laporan** tetap grafik; `npm run build` lulus 6,78 dtk | selesai | 2026-10-27 12:10 — Ikon menu laporan dibedakan |
| I-052 | 2026-10-28 (WITA) | Instruksi awal sesi yang terputus (teks verbatim tidak tersimpan): kepala unit multi-unit dan kepala ASN tanpa baris pegawai `(rekonstruksi dari TODO panel sesi 2026-10-28)` | Membuat migrasi 22 + `verifikasi_22.sql` (tabel `kepala_unit`, `profil_saya()`, RPC penugasan, policy `unit_dikelola()`), menyinkronkan `schema.sql` dan `cleanup_data_uji.sql`, menambah halaman **Kepala Unit** + service, serta menyesuaikan auth, routing, portal kepala (unit aktif), Data Pegawai, jadwal, pengajuan izin, dan laporan/tanda tangan | selesai (kode); migrasi 22 belum dijalankan | 2026-10-28 09:11 — Kepala unit multi-unit & kepala ASN |
| I-053 | 2026-10-28 09:11 | "[Image 1] lanjutkan pekerjaan yang sempat terhenti" | Melanjutkan I-052: memeriksa diff, melengkapi README/AGENTS/progress, lalu menjalankan `npm run build` (lulus 8,72 dtk) | selesai | 2026-10-28 09:11 — Kepala unit multi-unit & kepala ASN |
| I-054 | 2026-10-28 (WITA) | "COMMIT DAN PUSH" | Memverifikasi `npm run build` (lulus 6,77 dtk), memperbarui dokumen audit, lalu commit `18a497d` + push pekerjaan kepala unit multi-unit & kepala ASN (migrasi 22, halaman Kepala Unit, auth/RPC/RLS, laporan) | selesai | 2026-10-28 — Commit & push kepala unit |
| I-056 | 2026-10-28 (WITA) | "pekerjaan terakhir belum selesai karna forceclode identifikasi pekerjaan terakhir dan lanjutkan" | Mengidentifikasi pekerjaan terakhir sebagai I-055 (penanda tangan laporan Kasubbag Tata Usaha + menu Absensi kepala ASN); memeriksa diff, menghapus helper `namaKepalaUnit` yang tidak terpakai di `src/utils/laporan.js`, menjalankan `npm run build` (lulus 6,95 dtk), dan memperbarui dokumen audit | selesai | 2026-10-28 — Lanjutan penanda tangan laporan |
| I-057 | 2026-10-28 (WITA) | "commit dan push" | Memverifikasi `npm run build` (lulus 6,95 dtk), lalu commit `69cc041` (penanda tangan laporan Kasubbag Tata Usaha + menu kepala ASN, helper `namaKepalaUnit` dihapus) beserta sinkronisasi dokumen audit, dan push ke `origin/main` | selesai | 2026-10-28 — Lanjutan penanda tangan laporan |
| I-055 | 2026-10-28 11:42 | "migrasi sudah saya jalankan dan ada arahan dari direktur untuk semua pegawai penanda tangan laporannya itu Kasubbag Tata Usaha Suriami,SKM.,m.Kes dengan NIP.197312302007012011, dan juga tombol kembali ke absensi untuk kapala ruangan asn dihilangkan saja [Image 1]" + klarifikasi: menu Absensi dihilangkan **hanya untuk kepala ASN** dan nama ditulis **Suriami, SKM., M.Kes** | Menyeragamkan penanda tangan laporan menjadi Kasubbag Tata Usaha (Suriami, SKM., M.Kes; NIP. 197312302007012011) untuk semua pegawai; menyembunyikan “Kembali ke Absensi” (sidebar) dan tab Absensi (navigasi bawah HP) untuk `sumber_akun = kepala_asn`; menghapus `ambilNamaKepalaUnit` yang tidak terpakai; memperbarui README + dokumen audit; `npm run build` lulus 6,90 dtk | selesai | 2026-10-28 11:42 — Penanda tangan laporan & menu kepala ASN |
| I-058 | 2026-10-28 (WITA) | "[Image 1] plan sebelumnya terhenti karna forceclose, bisa kamu lanjut?" + "resikonya seperti apa" + "otomatis dicabut" + "kerjakan" | Melanjutkan rencana Dinas Luar lintas unit: migrasi **23** (FK `dibuat_oleh`/`dibatalkan_oleh` ke `auth.users`, `daftar_pegawai_izin()`, `bisa_akses_grup()`, `bisa_kelola_izin_grup()`, policy baca grup, `bisa_baca_dokumen()` dengan pemilik file dibatasi, RPC catat/ubah/batal lintas unit), `verifikasi_23.sql`, sinkronisasi `schema.sql`, selector pegawai lintas unit di `PengajuanIzin.jsx`, policy baca profil anggota grup, dan tombol aksi berbasis RPC; `npm run build` lulus 5,24 dtk (percobaan awal 8,15 dtk) | selesai (kode); migrasi 23 belum dijalankan | 2026-10-28 — Dinas Luar lintas unit |
| I-059 | 2026-10-28 (WITA) | "cek status pekerjaan terakhir kemudian lanjutkan" | Meninjau ulang pekerjaan terakhir (I-058: Dinas Luar lintas unit) — memeriksa migrasi 23, `verifikasi_23.sql`, sinkronisasi `schema.sql`, service klien, dan `PengajuanIzin.jsx`; tidak ditemukan sisa pekerjaan kode; menjalankan `npm run build` (lulus 21,92 dtk) dan memperbarui dokumen audit. Langkah tersisa hanya menjalankan migrasi 23 + verifikasi 23 di Supabase | selesai (tinjauan); migrasi 23 belum dijalankan | 2026-10-28 — Lanjutan Dinas Luar lintas unit |
| I-060 | 2026-10-28 (WITA) | "[Image 1] [Image 2] perlu sedikit modifikasi ui agar lebih rapih di tampilan mobil, pada image pertama pilihan bulannya itu di tampilan mobile terlalu besar yang mmebuatnya melebar dari layar hp, kemudian di gambar kedua, tulisan jam kerja reguler senin-kamis 08.00-16.30, jumat 08.00-16.00 dihapus saja, tukar posisi status perangkat dengan riwayat presensi terakhir, dan text pada status perangkat dihilangkan saja, cukup status perangkat terverifikasi, dan tulisan text ketika login menggunakan device yang berbeda dipersingkat saja agar lebih profesioanl" | Membatasi lebar pemilih bulan di Riwayat ke 190 px agar tidak melebar di HP; menghapus keterangan jam kerja reguler dari kartu Jadwal Kerja; menukar urutan kartu di Dashboard pegawai menjadi Jadwal → Riwayat → Status Perangkat (desktop tetap dua kolom); menampilkan status perangkat terverifikasi ringkas tanpa teks; mempersingkat pesan perangkat berbeda di kartu status dan Panel Absen; `npm run build` lulus 6,50 dtk | selesai | 2026-10-28 — Perapian UI mobile dashboard & riwayat |
| I-061 | 2026-10-28 (WITA) | "ubah radius menjadi 50 meter saja" | Mengubah radius geofencing dari 100 m menjadi 50 m di klien (`MAX_RADIUS_METERS`) dan server (`submit_presensi`); membuat migrasi **24** + `verifikasi_24.sql`; menyinkronkan seluruh definisi `submit_presensi` di `schema.sql`; memperbarui komentar teknis, label radius di Panel Absen, dan dokumentasi; `npm run build` lulus 7,10 dtk | selesai (kode); migrasi 24 belum dijalankan | 2026-10-28 — Radius absensi 50 meter |
| I-062 | 2026-10-28 (WITA) | "commit dan push" | Memverifikasi `npm run build` (lulus 7,10 dtk) dan memperbarui dokumen audit, lalu commit pekerjaan Dinas Luar lintas unit (migrasi 23), radius 50 meter (migrasi 24), perapian UI mobile dashboard & riwayat, serta push ke `origin/main` | selesai | 2026-10-28 — Commit & push radius 50 meter + UI mobile |
| I-063 | 2026-10-28 (WITA) | "sudah dijalankan" | Konfirmasi migrasi **23** dan **24** sudah dijalankan di Supabase; radius server kini 50 m; memperbarui dokumen audit; tidak ada perubahan kode | selesai (verifikasi 23–24 belum dikonfirmasi) | 2026-10-28 — Migrasi 23 & 24 dijalankan |
| I-064 | 2026-10-29 (WITA) | "kerjakan" (setelah keputusan: batas pulang akhir hari kerja, shift malam sampai 12.00 siang, tetap dua tombol, baris kemarin diabaikan setelah batas) | Menerapkan batas akhir absen pulang: klien (`tutupAbsenPulang`, pemisahan presensi hari ini/kemarin, tombol pulang mati otomatis + info koreksi) dan server (migrasi **25**, `verifikasi_25.sql`, sinkron `schema.sql`); `npm run build` lulus 6,82 dtk (percobaan pertama 23,39 dtk) | selesai (kode); migrasi 25 sudah dijalankan, digantikan migrasi 26 | 2026-10-29 11:46 — Batas akhir absen pulang |
| I-065 | 2026-10-29 15:03 | "ya setuju" + "kerjakan" (menyetujui rencana: masuk dibuka 1 jam sebelum, pulang ditutup 2 jam setelah jam pulang) | Menerapkan jendela absen baru: klien (`MENIT_AWAL_ABSEN_MASUK = 60`, `MENIT_TUTUP_ABSEN_PULANG = 120`, `tutupAbsenPulang`, teks `PanelAbsen`) dan server (migrasi **26**, `verifikasi_26.sql`, sinkron `schema.sql`); `npm run build` lulus 8,90 dtk; uji Node helper reguler 07.00/16.31/18.30 dan shift malam 19.00/08.01/10.00 (H+1) | selesai (kode); migrasi 26 sudah dijalankan (laporan user 2026-10-29) | 2026-10-29 15:03 — Jendela absen baru |
| I-066 | 2026-10-29 (WITA) | "hari kerja admisi rawat jalan itu reguler tanpa shift, cuma jam kerjanya yang sedikit lebih cepat, Jam masuk 7.00-15.00 senin-jumat jam kerja sama" + "1. ya satu unit yang sama yaitu unit Admisi Rawat Jalan, 2. ADMISI RAWAT JALAN 3.superadmin saja" + "kerjakan" | Menambahkan jam kerja reguler per unit: tabel `jam_kerja_unit`, seed ADMISI RAWAT JALAN Senin–Jumat 07.00–15.00, konversi pegawai unit tersebut menjadi Reguler, override `jadwal_kerja`/`proses_alfa_otomatis` (fallback global), RLS Super Admin, migrasi **27**, `verifikasi_27.sql`, halaman/menu **Jam Kerja Unit**, service, route; `npm run build` lulus 16,74 dtk (ulang 7,58 dtk) | selesai (kode); migrasi 27 sudah dijalankan (laporan user 2026-10-29) | 2026-10-29 19:29 — Jam kerja reguler per unit |
| I-067 | 2026-10-29 20:41 | "sebelum kita lanjut  commit dan push dulu sisa pekerjaan sebelumn rencana keamanan kita rencanakan" | Memverifikasi build, mencatat laporan migrasi 26–27 sudah dijalankan, lalu commit `6a7430e` dan push sisa pekerjaan jendela absen baru, jam kerja unit, migrasi 25–27, dan dokumen audit | selesai | 2026-10-29 20:41 — Commit & push sisa pekerjaan |
| I-068 | 2026-10-29 (WITA) | "sudah saya uji sampai jam admisi sudah berubah di akunnya" | Mencatat uji tampilan jam Admisi berhasil; melanjutkan **Step 2** keamanan: pengaman formula CSV (`amankanSelCsv`), regex template jadwal, dan `window.opener`/`location.replace` di halaman dokumen | selesai (kode); belum di-commit | 2026-10-29 — Step 2 pengamanan CSV & dokumen |
| I-069 | 2026-10-30 09:35 | "lanjutkan pekerjaan yang sempat terhenti kemarin tentang keamanan" (lampiran screenshot sesi Step 2/Step 3) | Melanjutkan **Step 3** keamanan: memverifikasi upgrade dependensi (Vite 7.3.7, `@vitejs/plugin-react` 5.2.0, React Router 7.18.5), Node CI 22, kecocokan lockfile, `npm audit` 0 kerentanan, build produksi + pratinjau SPA, serta menyinkronkan README/AGENTS/progress | selesai (kode); belum di-commit | 2026-10-30 09:35 — Step 3 upgrade dependensi |
| I-070 | 2026-10-30 10:00 | "ya setuju" (menyetujui rencana Step 4: CSP meta + `Referrer-Policy` + Enforce HTTPS; Cloudflare opsional) | Menambahkan CSP produksi lewat plugin Vite (`script-src 'self'`, `connect-src` self + Supabase, `frame-src 'none'`, dll.), meta referrer, dan catatan Enforce HTTPS/batas GitHub Pages; verifikasi build, `404.html`, uji headless bahwa script inline diblokir, serta verifikasi HTTP/`www` **301** ke HTTPS | selesai (kode); belum di-commit | 2026-10-30 10:00 — Step 4 CSP meta & referrer |
| I-071 | 2026-10-30 22:13 | "verifikasi sudah saya jalankan dan sudah testing dan aman sudah masuk rencana golive" | Mencatat laporan user bahwa seluruh `verifikasi_*.sql` sudah dijalankan, uji manual aman, dan go-live masuk rencana; memperbarui Status Terkini, status migrasi 22–27, status deploy, langkah go-live, serta fakta lingkungan. Tidak ada perubahan kode. Catatan: Step 2–4 sudah di-commit `1fec429` + sinkronisasi dokumen `260f3c2` dan di-push ke `origin/main` | selesai (dokumen); belum di-commit | 2026-10-30 22:13 — Verifikasi SQL & uji go-live |
| I-072 | 2026-10-30 23:01 | "SUDAH CLEAN UP DATA UJI" | Mencatat `supabase/cleanup_data_uji.sql` sudah dijalankan: data transaksi dibersihkan, 92 pegawai/grup/master shift dipertahankan; memperbarui status data uji, sisa langkah go-live, dan backlog. Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-10-30 23:01 — Cleanup data uji |
| I-073 | 2026-10-30 23:04 | "sudah sya lengkapi data operasional, jadwal dinas dan pemetaan pegawai" | Mencatat data operasional sudah dilengkapi: jadwal dinas dan pemetaan pegawai terisi; memperbarui Status Terkini, langkah go-live (tinggal Alfa otomatis + `pg_cron`), dan backlog. Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-10-30 23:04 — Data operasional lengkap |
| I-074 | 2026-10-30 23:06 | "arahkan langkah aktivasi Alfa otomatis + pg_cron" | Menyusun panduan aktivasi: isi tanggal mulai + aktifkan di **Pengaturan Presensi**, uji manual, aktifkan ekstensi `pg_cron`, jalankan `supabase/jadwal_alfa.sql`, lalu verifikasi `cron.job`/`cron.job_run_details` dan data Alfa. Tidak ada perubahan kode | selesai (panduan) | 2026-10-30 23:06 — Panduan aktivasi Alfa & pg_cron |
| I-075 | 2026-10-30 23:23 | "sudah saya aktifkan alfa otomatis di setting" | Mencatat Alfa otomatis sudah diaktifkan lewat **Pengaturan Presensi**; cron `presisi-alfa-otomatis` sudah aktif dan sukses. Menyusun langkah verifikasi pembentukan Alfa setelah jam kerja serta memperbarui Status Terkini/backlog. Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-10-30 23:23 — Alfa otomatis diaktifkan |
| I-076 | 2026-10-30 23:28 | "oke apa yang perlu saya lakukan, hari ini tgl 30 dan saya set alfa otomatis tanggal 1, pg cron belum saya jalankan" | Memberikan checklist: `alfa_mulai` **1 November 2026**; tidak perlu Alfa manual sebelum tanggal itu; pastikan ekstensi `pg_cron` aktif dan `jadwal_alfa.sql` dijalankan **sebelum 1 November** pada project Supabase yang benar. Tidak ada perubahan kode | selesai (panduan) | 2026-10-30 23:23 — Alfa otomatis diaktifkan |
| I-077 | 2026-10-30 23:30 | "[Image 1]" (screenshot Database Extensions) | Mengonfirmasi ekstensi **pg_cron 1.6.4** sudah aktif di project ABSENSI PEGAWAI; job `presisi-alfa-otomatis` sudah terdaftar dan aktif. Tidak ada perubahan kode | selesai (verifikasi) | 2026-10-30 23:30 — pg_cron terkonfirmasi aktif |
| I-078 | 2026-10-30 23:33 | "tanggal 1 november itu hari senin" | Mengoreksi panduan: 1 November dianggap hari kerja (Senin), sehingga Alfa reguler pertama dapat muncul pada 1 November setelah jam kerja berakhir, bukan ditunda ke 2 November. Alfa mengikuti `alfa_mulai` dan jam kerja, bukan asumsi nama hari. Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-10-30 23:33 — Koreksi hari 1 November |
| I-079 | 2026-10-30 23:45 | "commit dan push, kemudian b-8 dan b-9, baru mulai kerjakan yang lain" | Commit & push pembaruan dokumen audit I-071–I-078 (`5b9ac5e`), lalu mengerjakan **B-8** (ESLint + 24 uji `node:test` + CI lint/test) dan **B-9** (`.env.example` placeholder); `npm run lint`, `npm test`, dan `npm run build` lulus | selesai | 2026-10-30 23:59 — B-8 lint/uji dasar & B-9 `.env.example` |
| I-080 | 2026-10-30 23:59 | "sebelum commit cek indikasi bug dulu" | Audit pra-commit B-8/B-9: menemukan bug zona waktu pada `namaBulan()` (zona perangkat negatif membuat Oktober tampil September), memperbaikinya dengan `timeZone: Asia/Makassar` + uji regresi child process `TZ=America/Los_Angeles`, dan memperkuat penanganan `message` non-string di `templateJadwal.js`; `npm run lint` bersih, `npm test` 24/24 (Node 24 & 22.13), `npm run build` lulus | selesai | 2026-10-30 23:59 — Cek bug pra-commit B-8/B-9 |
| I-081 | 2026-10-31 00:10 | "commit dan push" | Memverifikasi staged diff tanpa rahasia, commit `42cb317` “PRESISI AMI: lint, uji dasar, dan perbaikan bug zona waktu”, lalu push ke `origin/main` (`5b9ac5e..42cb317`); menyinkronkan dokumen audit | selesai | 2026-10-31 00:10 — B-8/B-9 di-commit & di-push |
| I-082 | 2026-10-31 12:07 | "koreksi saya semalam tentang tanggal 1 itu ternyata kamu sudah benar kalau tanggal 1 november 2026 itu hari minggu" | Mengoreksi kembali panduan I-078: **1 November 2026 adalah hari Minggu** (diverifikasi `Get-Date -Date '2026-11-01' -Format dddd` → `Sunday`), sehingga Alfa reguler pertama diperkirakan muncul **Senin 2 November 2026** setelah jam kerja berakhir, kecuali ada pegawai shift yang dijadwalkan pada akhir pekan. Status Terkini dan catatan I-078 di `progress.md` diberi koreksi lanjutan; tidak ada perubahan kode | selesai | 2026-10-31 12:07 — Koreksi hari 1 November (Minggu) |
| I-083 | 2026-10-31 12:37 | "kerjakan" | Melaksanakan rencana perbaikan jadwal tanggal 1–2 yang tidak tampil: akar masalah batas 1000 baris Supabase pada `ambilJadwalRentang` tanpa paginasi dan tanpa filter unit. Menambahkan `src/utils/paginasi.js`, memfilter jadwal ke pegawai unit aktif + paginasi, menerapkan paginasi pada rekap/laporan/koreksi/izin, memperketat header template, menampilkan `dilewati`, serta menambah uji paginasi dan template. Tidak ada migrasi DB dan tidak perlu impor ulang | selesai (uji manual 2026-10-31 lulus) | 2026-10-31 12:37 — Paginasi jadwal 1000 baris |
| I-084 | 2026-10-31 12:53 | "OKE SAYA CEK SUDAH MUNCUL SEMUA" | Mencatat konfirmasi user bahwa uji manual jadwal berhasil: seluruh tanggal, termasuk 1–2 November 2026, sudah muncul setelah perbaikan paginasi. Menutup B-25 dan memperbarui Status Terkini; tidak ada perubahan kode | selesai | 2026-10-31 12:53 — Uji manual paginasi jadwal lulus |
| I-085 | 2026-10-31 13:20 | "commit dan push" | Memverifikasi `npm run lint`, `npm test` (30/30), dan `npm run build` (13,18 dtk); memeriksa staged diff tanpa rahasia; commit `22c2bab` “PRESISI AMI: paginasi data jadwal dan laporan” lalu push ke `origin/main`; menyinkronkan dokumen audit | selesai | 2026-10-31 13:20 — Commit & push paginasi data |
| I-086 | 2026-10-31 15:10 | "pada hari libur shift dan hari libur kerja reguler [Image 1] kita buat pesan yang singkat untuk pegawai yang libur dengan warna hijau dengan emoticon yang menarik , contohnya pesan hari ini libur istirahatlah yang cukup, dan pesan kecil dibawahnya jika jadwal tidak sesuai hubungi Kepala Unit/IT" + "kalau akhir Pekan, Contoh, Nikmati Akhir Pekan Anda" + "ya terapkan , pastikan tidak ada bug, dan juga pastikan uinya rapih di mobile" | Memperbarui `PanelAbsen.jsx` untuk menampilkan pesan libur (akhir pekan, hari libur nasional, libur shift) dengan varian alert hijau (`variant="sukses"`), emoticon menarik (“Nikmati Akhir Pekan Anda! 🌴”, “Hari Libur Nasional 🎉”, “Jadwal Libur Hari Ini 🌟”), ucapan istirahat, serta catatan kecil *“Jika jadwal tidak sesuai, hubungi Kepala Unit/IT.”*; verifikasi `npm run lint`, `npm test` (30/30), `npm run build` lulus | selesai (lokal) | 2026-10-31 15:10 — Pesan libur ramah & hijau |
| I-087 | 2026-10-31 15:35 | "[Image 1] notifikasi status perangkat lain ubah menjadi, Kamu Menggunakan Perangkat/Browser Yang berbeda dengan yang terdaftar, tulisan kecil dibawahnya Reset Perangkat Hub Tim IT, jadi tidak perlu cantumkan perangkat aktif" | Memperbarui `KartuStatusPerangkat.jsx` dan `PanelAbsen.jsx` untuk mengubah teks status `terikat_perangkat_lain` menjadi *“Kamu Menggunakan Perangkat/Browser Yang berbeda dengan yang terdaftar”* dengan catatan kecil *“Reset Perangkat Hub Tim IT”*, serta menghapus rincian perangkat aktif; verifikasi `npm run lint`, `npm test` (30/30), `npm run build` lulus | selesai (lokal) | 2026-10-31 15:35 — Pemberitahuan perangkat berbeda & reset |
| I-088 | 2026-11-01 17:58 | "hari ini minggu dan sudah golive, pegawai sudah mulai absen masuk dan pulang dari tadi" + "catat konfirmasi go live" | Mencatat konfirmasi **go-live produksi dimulai Minggu, 1 November 2026** dan pegawai sudah absen masuk/pulang; memperbarui Status Terkini, tabel status (baris Go-live), backlog B-24 (selesai) + B-26 (pantau Alfa pertama), entri Log Kronologis, serta koreksi catatan commit `f332efb`. Tidak ada perubahan kode; dokumen ditahan di working tree | selesai (dokumen); belum di-commit | 2026-11-01 17:58 — Go-live produksi dimulai |
| I-089 | 2026-11-01 17:58 | "direktur ingin jika dr yang on call contohnya dr spesialis poliklinik di unit instalasi non rawat inap bisa absen di rumah,dia tidak terkena radius 50 meter jadi dia bisa absen di rumah dengan jam kerja reguler, bagaimana kita mmebuat sistemnya tanpa mengganggu sistem radius yang sudah berjalan,tanpa terjadinya bug dan eror pada aplikasi" + "kerjakan dan setelah pekerjaan selesai pastikan tidak ada bug yang mempengaruhi sistem yang lain" + jawaban: per pegawai, tetap jam reguler, Super Admin saja | Menambahkan pengecualian radius per pegawai: kolom `pegawai.bebas_radius` + audit, `submit_presensi` hanya menolak radius bila flag mati (validasi lain tetap), `profil_saya()` mengirim flag, RPC Data Pegawai + checkbox/badge **Bebas Radius**, opsi `abaikanRadius` pada geofencing dengan penanda riwayat, migrasi **28** + `verifikasi_28.sql`, sinkron `schema.sql`; `npm run lint` bersih, `npm test` **32/32**, `npm run build` lulus 8,46 dtk (ulang 8,69 dtk) | selesai (kode); migrasi 28 belum dijalankan | 2026-11-01 18:13 — Pengecualian radius pegawai tertentu |
| I-090 | 2026-11-01 18:40 | "ya sinkronkan semua yang masih menyebutkan oncall, karna perintah saya terakhir untuk tidak menyebutkan on call pada pegawai yang tidak terkana batas lokasi, sama persis pegawai reguler biasa cuma mereka bedanya bisa absen dimana aja" | Menyinkronkan istilah menjadi **Bebas Radius** / **pegawai tertentu**: nama file migrasi `28_bebas_radius_oncall.sql` → `28_bebas_radius.sql` (sesuai file nyata) di `schema.sql` dan dokumen; label/badge lama dihapus; penjelasan menegaskan pegawai tersebut tetap pegawai reguler biasa dan hanya berbeda karena boleh absen di mana saja; verifikasi ulang `npm run lint`, `npm test`, `npm run build` | selesai (dokumen; kode tidak berubah) | 2026-11-01 18:55 — Sinkronisasi istilah bebas radius |
| I-091 | 2026-11-02 08:55 | "sudah saya run dan succses" | Mencatat migrasi **28** dan `verifikasi_28.sql` sudah dijalankan serta lulus di Supabase; flag **Bebas Radius** kini aktif di server. Memperbarui Status Terkini, tabel status migrasi/verifikasi, catatan lingkungan, dan backlog (sisa uji manual). Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-11-02 08:55 — Migrasi 28 & verifikasi 28 berhasil |
| I-092 | 2026-11-02 09:43 | "kalau beigut kita tidak perlu mengubah apapun dulu, commit dan push pekerjaan terakhir" | Menahan rencana perbaikan akurasi GPS setelah temuan jarak 130 m; memverifikasi `npm run lint`, `npm test`, `npm run build`; meng-commit pekerjaan **Bebas Radius** + migrasi 28 + dokumen audit dan push ke `origin/main` | selesai | 2026-11-02 09:43 — Commit & push bebas radius |
| I-093 | 2026-11-03 12:07 | "lanjutkan pekerjaan terakhir yang terhenti[Image 1]  karena crash" | Melanjutkan pekerjaan koreksi presensi shift malam H+1 yang terhenti: helper `susunWaktuKoreksi`, pratinjau + penanda H+1 di `KoreksiPresensi.jsx`, uji unit, dan dokumen audit; `npm run lint` bersih, `npm test` 38/38, `npm run build` lulus 8,29 dtk | selesai (kode; belum di-commit) | 2026-11-03 12:07 — Koreksi presensi shift malam H+1 |
| I-094 | 2026-11-03 13:29 | "kerjakan 1-3 saja" (menyetujui Langkah 1–3 rencana perbaikan lag mengetik alasan koreksi) | Langkah 1: cache `Intl.DateTimeFormat` level modul di `src/utils/format.js`. Langkah 2: memisahkan form koreksi ke `FormKoreksiPresensi.jsx` agar state ketikan tidak merender daftar. Langkah 3: memisahkan daftar ke `DaftarPresensiKoreksi.jsx` dengan `React.memo` dan `onKoreksi` stabil. `npm run lint` bersih, `npm test` 38/38, `npm run build` lulus 8,37 dtk | selesai (kode; belum di-commit) | 2026-11-03 13:29 — Perbaikan lag ketik alasan koreksi |
| I-095 | 2026-11-03 15:55 | "ada kasus user mobile yang white screen seperti ini, dan juga kadang sekali sekali saya di laptop juga merasakan ketika membuka menu menu, cari tau kemungkina bug nya dan lakukan perbaikan" + jawaban: "1. ya normal lagi setelah refresh 2.a" | Mendiagnosis white screen: tidak ada Error Boundary, chunk lama 404 setelah deploy (GitHub Pages `max-age=600`), formatter tanggal bisa melempar `RangeError`, dan `localStorage` kepala belum diamankan. Perbaikan: `ErrorBoundary` root/rute/halaman, pemulihan otomatis sekali (`?perbarui` + guard 30 detik), listener `vite:preloadError`, fallback statis `index.html`, formatter tanggal aman, `localStorage` `try/catch`. `npm run lint` bersih, `npm test` **46/46**, `npm run build` lulus 7,78 dtk (ulang 14,87 dtk); uji headless login render dan fallback statis tampil. Catatan: I-093/I-094 ternyata sudah masuk commit `089b4e7` | selesai (kode); belum di-commit | 2026-11-03 15:55 — Ketahanan halaman & anti white screen |
| I-096 | 2026-11-04 11:11 | "kemudian aplikasi saat ini menghitung terlambat contoh di jam reguler, jika masuk di jam 8.00 saya terlambat 1 menit, ubah aturan itu, harusnya terlambat jika sudah 8.01, dan jam pulang ubah agat terbuka di jam pas waktu pulang semisal 16.30 sudah terbuka" | Mengubah aturan keterlambatan menjadi per menit penuh (`floor`): 08.00.59 = 0 menit, 08.01 = 1 menit (sebelumnya `ceil` 08.00.01 = 1 menit). Absen pulang dibuka tepat pada jam pulang (16.30), bukan 16.31, dan tetap ditutup 2 jam setelahnya. Perubahan di `constants.js` (`MENIT_JEDA_ABSEN_PULANG = 0`), `jadwalAbsen.js`, teks `PanelAbsen.jsx`, uji `jadwalAbsen.test.js`, migrasi **29** + `verifikasi_29.sql`, sinkron `schema.sql` dan README; `npm run lint` bersih, `npm test` **46/46**, `npm run build` lulus 8,95 dtk | selesai (kode); migrasi 29 belum dijalankan | 2026-11-04 11:11 — Toleransi keterlambatan & jam pulang tepat waktu |
| I-097 | 2026-11-04 11:18 | "ada beberapa pegawia kemarin yang absen masuk di jam 8.00, sudah saya run migrasi dan verif, tapi saya lihat mereka masih erhitung terlambat di sistem" + jawaban: "Sejak go-live 1 Nov 2026 (Recommended)" + "ya kerjakan" | Menjelaskan bahwa migrasi 29 hanya mengubah perhitungan absensi/koreksi berikutnya; baris presensi lama masih menyimpan `menit_terlambat` hasil `ceil`. Membuat migrasi **30** (`30_hitung_ulang_menit_terlambat.sql`) yang menghitung ulang data sejak **1 November 2026** memakai `hitung_menit_terlambat()` (floor), hanya baris ber-`jam_masuk`, idempoten, tanpa mengubah jadwal/status/perangkat; menambah `verifikasi_30.sql`; memperbarui README + dokumen audit. Catatan: migrasi 29 dan verifikasi 29 dilaporkan sudah dijalankan user 2026-11-04 | selesai (kode); migrasi 30 belum dijalankan | 2026-11-04 11:18 — Hitung ulang menit terlambat data lama |
| I-098 | 2026-11-04 11:22 | "sudah saya jalankan dan berhasil" | Mencatat konfirmasi migrasi **30** dan verifikasinya sudah dijalankan dan berhasil; `menit_terlambat` data sejak 1 November 2026 sudah dihitung ulang. Memperbarui status migrasi/verifikasi, backlog B-33 (selesai), dan entri log. Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-11-04 11:22 — Migrasi 30 berhasil dijalankan |
| I-099 | 2026-11-04 11:24 | "sudah tidak terlambat, sekarang commit dan push" | Memverifikasi `npm run lint` (bersih), `npm test` (**46/46**), `npm run build` (lulus **7,12 dtk**); memeriksa staged diff tanpa rahasia; commit `17d8efb` (ketahanan halaman/anti white screen, toleransi keterlambatan, jam pulang tepat waktu, migrasi 29–30, verifikasi 29–30, uji, README) lalu push ke `origin/main` (`089b4e7..17d8efb`); menyinkronkan dokumen audit | selesai | 2026-11-04 11:24 — Commit & push ketahanan halaman + toleransi terlambat |
| I-100 | 2026-11-04 (WITA) | Instruksi sesi (teks verbatim tidak tersimpan pada ringkasan konteks): perbaikan UI — tombol muat ulang, kalender periode Cuti/Dinas-Sakit, warna berbeda per jenis, filter nama, dan pengajuan Super Admin langsung disetujui `(rekonstruksi)`; klarifikasi: muat ulang = **tombol** (bukan layar), kalender dipakai di form **dan** daftar, warna Sakit rose, Dinas Luar violet, Cuti teal, perubahan Super Admin atas pengajuan menunggu juga langsung disetujui, lalu "kerjakan pastikan tidak ada bug dan sistem yang rusak" | Menambahkan `TombolMuatUlang`, `PencarianNama`, `PemilihPeriode`, `TampilanPeriode`, utilitas `kalender.js`, varian warna `sakit`/`cuti`/`dinas`; menerapkan filter nama + reload di Verifikasi Perangkat/Koreksi Presensi, reload di halaman admin/pegawai/ErrorBoundary, kalender di form dan tampilan daftar; membuat migrasi **31** + `verifikasi_31.sql` agar Super Admin langsung menyetujui dan menandai presensi; sinkron `schema.sql`, README, dan dokumen audit | selesai | 2026-11-04 11:46 — Perapian UI & ACC otomatis Super Admin |
| I-101 | 2026-11-04 13:42 | "sudah saya run dan succses, commit dan push" | Mencatat migrasi **31** dan `verifikasi_31.sql` sudah dijalankan dan lulus; memverifikasi `npm run lint`, `npm test` **54/54**, `npm run build`; meng-commit pekerjaan perapian UI & ACC otomatis Super Admin (komponen UI baru, filter nama, pemilih/tampilan periode, warna jenis izin, migrasi 31) beserta dokumen audit dan push ke `origin/main` | selesai | 2026-11-04 13:42 — Migrasi 31 dijalankan & commit/push perapian UI |
| I-102 | 2026-11-04 (WITA) | "untuk sistem tukaran shift untuk pola kerja shift, ada beberapa pegawai yang sering tukar2an shift bagaimana caranya agar teraudit di akhir bulan nanti ketika di cetak, dan bagaimana sistem di jadwal shift ketika ada yang mau tukaran apa perlu kita buatkan sistemnya atau bagaimana, kita diskusikan terlebih dahulu" + jawaban: "Kepala/Super Admin mencatat", "Satu tanggal, dua pegawai", "Kolom shift + blok riwayat tukar"; lalu "1. ya 2. ya 3.optional 4.cukup laporan dulu, dan tambahan buatkan tombol cetak juga di jadwal shift jadi ketika akhir bulan bisa di cetak kepala ruangan, buat formatnya sederhana dengan penanda tangan kepala ruangan di bawahnya dan kop seperti biasanya, dengan format landscape, kertas f4, berikan warna untuk membedakan pagi siang malam" | Mendiskusikan lalu membangun fitur tukar shift teraudit: tabel `tukar_shift` + RPC `tukar_shift()` (migrasi **32**), tombol + modal Tukar Shift di Jadwal Shift, kolom Shift + blok Riwayat Tukar di laporan bulanan, serta tombol Cetak Jadwal F4 landscape berwarna dengan tanda tangan kepala ruangan | selesai (kode); migrasi 32 belum dijalankan | 2026-11-04 14:31 — Tukar shift teraudit & cetak jadwal shift |
| I-103 | 2026-11-04 14:31 | "tidak perlu menggunakan nip cukup nama saja, kerjakan sekarang, pastikan tidak ada bug dan sistem yang sudah ada terganggu/eror" | Menjalankan rencana I-102 tanpa NIP (tanda tangan kepala cukup nama); verifikasi `npm run lint` bersih, `npm test` **62/62**, `npm run build` lulus **16,38 dtk** | selesai (kode); migrasi 32 belum dijalankan | 2026-11-04 14:31 — Tukar shift teraudit & cetak jadwal shift |
| I-104 | 2026-11-04 15:01 | "lanjutkan pekerjaan terakhir yang terhenti karena forceclose, cek jangan sampai ada yang tertinggal" | Mengaudit ulang pekerjaan I-102/I-103: semua bagian (migrasi 32, verifikasi 32, sinkron schema, RPC/UI Tukar Shift, cetak jadwal F4, laporan Shift + Riwayat Tukar, uji, dokumen) sudah lengkap; menjalankan ulang `npm run lint` (bersih), `npm test` (**62/62**), `npm run build` (lulus **14,14 dtk**) | selesai (verifikasi); migrasi 32 belum dijalankan | 2026-11-04 15:01 — Lanjutan pasca forceclose: audit tukar shift & cetak jadwal |
| I-105 | 2026-11-04 15:08 | "sudah saya jalankan dan succses migration 32 dan verif 32" | Mencatat migrasi **32** dan `verifikasi_32.sql` sudah dijalankan dan lulus; tabel `tukar_shift`, RPC `tukar_shift()`, dan RLS aktif sehingga Tukar Shift + riwayat tukar berfungsi; memperbarui Status Terkini, tabel migrasi (baris 32), backlog B-36, README, dan dokumen audit. Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-11-04 15:08 — Migrasi 32 & verifikasi 32 berhasil |
| I-106 | 2026-11-04 15:29 | "ya seutuju, kerjakan, pastikan tidak ada bug, dan kerusakan pada sistem yang sudah ada" | Mematikan posisi footer laporan di dasar kertas (pratinjau + cetak) lewat flex kolom + `margin-top:auto`; menghapus teks **Halaman X dari Y** dan prop terkait; menjadikan kolom **Shift** hanya untuk pegawai berpola Shift (`pola_kerja !== 'reguler'`), pegawai Reguler memakai 7 kolom tanpa Shift. Verifikasi `npm run lint` bersih, `npm test` **62/62**, `npm run build` lulus **14,43 dtk** | selesai (kode; belum di-commit) | 2026-11-04 15:29 — Footer dipatok & kolom Shift khusus shift |
| I-107 | 2026-11-04 15:35 | "kerjkaan" (menyetujui rencana penyeimbangan lebar kolom tabel laporan) | Menambah `table-layout: fixed` pada `.tabel-laporan` dan menyeimbangkan proporsi kolom: Reguler 6/21/12/12/11/10/28%, Shift 5/18/16/10/10/10/10/21%; verifikasi `npm run lint` bersih, `npm test` **62/62**, `npm run build` lulus **15,76 dtk** | selesai (kode; belum di-commit) | 2026-11-04 15:35 — Seimbangkan lebar kolom tabel laporan |
| I-108 | 2026-11-04 15:55 | "dijadikan exel" (menyetujui rencana: footer Jadwal Shift dipatok + hapus CSV, termasuk laporan error jadi Excel) | Memakai flex kolom pada `.lembar-jadwal` + tinggi cetak `calc(215mm - 17mm)` agar footer di dasar kertas; menghapus opsi/impor CSV di Jadwal Shift (template wajib `.xlsx`, file `.csv` ditolak), menghapus `unduhTemplateCsv`/`parseCsv`/`deteksiPemisah`/`csvBaris`, mengubah laporan error menjadi `.xlsx`, memperbarui teks arahan modal + sheet Petunjuk + README/AGENTS; verifikasi `npm run lint` bersih, `npm test` **63/63**, `npm run build` lulus **11,08 dtk** | selesai (kode; belum di-commit) | 2026-11-04 15:55 — Footer jadwal dipatok & impor jadwal hanya Excel |
| I-109 | 2026-11-04 16:15 | "pilih A" (menyetujui opsi A: pakai RPC `nama_kepala_unit` tanpa migrasi) | Memperbaiki nama tanda tangan cetak jadwal: `cetakJadwal()` tidak lagi memakai `profil.nama`/`daftar_kepala_unit().nama`, melainkan RPC `nama_kepala_unit(unit)` via `ambilNamaKepalaUnit()`; kepala ASN memakai `nama_kepala`, kepala non-ASN memakai `pegawai.nama`. Verifikasi `npm run lint` bersih, `npm test` **63/63**, `npm run build` lulus **11,79 dtk**; tanpa migrasi DB | selesai (kode; belum di-commit) | 2026-11-04 16:15 — Nama tanda tangan cetak jadwal |
| I-110 | 2026-11-04 16:22 | "ya terapkan kita lihat hasilnya" (menyetujui rencana mengecilkan tabel cetak jadwal) | Mengecilkan kolom/rapatkan tabel cetak jadwal agar UGD satu halaman F4: nama 58 mm, No 7 mm, font 7 pt, padding 0,6×0,5 mm, hari 5,5 pt, legenda 2 mm, tanda tangan 4 mm/ruang 10 mm. Verifikasi `npm run lint` bersih, `npm test` **63/63**, `npm run build` lulus **7,68 dtk** | selesai (kode; belum di-commit) | 2026-11-04 16:22 — Cetak jadwal UGD jadi satu halaman |
| I-111 | 2026-11-04 17:12 | "ya kerjakn, pastikan tidak ada bug dan eror sistem yang sudah ada, lakukan pengecekan ulang dan perbaiki jika ada eror atau indikasi bug" | Melanjutkan rencana **Pengaduan Presensi** (absen pulang terlewat) yang sempat terhenti: migrasi **33** (`pengaduan_presensi`, RPC ajukan/putuskan/daftar, RLS, policy foto `pengaduan/<user_id>/`), `verifikasi_33.sql`, sinkron `schema.sql`; halaman pegawai `/pengaduan`, halaman kepala `/kepala-ruangan/pengaduan`, tab baca-saja **Riwayat Pengaduan** di Koreksi Presensi, tombol di Panel Absen, menu sidebar/navigasi, service + helper + uji. Audit ulang: `schema.sql` identik migrasi 33, tombol persetujuan disembunyikan untuk pengaduan milik kepala sendiri. `npm run lint` bersih, `npm test` **67/67**, `npm run build` lulus **7,47 dtk** | selesai (kode); migrasi 33 belum dijalankan | 2026-11-04 17:12 — Pengaduan absen pulang |
| I-112 | 2026-11-04 17:35 | "migrasi 33 sudah saya jalankan uji, b-35 juga sudah, b-26 alfa otomatis sudah jalan" | Mencatat konfirmasi migrasi **33** + `verifikasi_33.sql` sudah dijalankan dan diuji, **B-35** selesai, dan **B-26** Alfa otomatis sudah berjalan; memperbarui Status Terkini, backlog (B-26/B-35/B-38/B-39 selesai), dan Log Kronologis. Tidak ada perubahan kode | selesai; commit `c1e56f7` + push | 2026-11-04 17:35 — Konfirmasi migrasi 33, B-26, B-35, B-38, B-39 |
| I-113 | 2026-11-04 (WITA) | "cek statsu pekerjaan terkahir yang terhenti akrena forceclose dan lanjutkan tanpa ada yang terlewat" | Memeriksa `git status`/reflog/objek dangling, isi `progress.md` + backlog, dan kelengkapan migrasi 01–33 serta `verifikasi_*.sql`. Working tree bersih; pekerjaan terakhir (**Pengaduan Presensi**, migrasi 33) sudah di-commit `c1e56f7` dan dokumen `3718cb1`. Menjalankan ulang `npm run lint`, `npm test` **67/67**, `npm run build` lulus **10,68 dtk**. Tidak ada pekerjaan kode yang tertinggal; sisa hanya uji manual B-28/B-29/B-30/B-31/B-37 | selesai (verifikasi) | 2026-11-04 — Cek status pasca forceclose |
| I-114 | 2026-11-04 (WITA) | "apakah kamu bisa mengecek dan memperbarui ui atau text yang ai slop di aplikasi saya ini" + "kerjakan pastikan tidak ada bug dan eror" + jawaban: emoji libur **1 per pesan**, deskripsi halaman **pendek 1 baris**, cakupan **pegawai + admin**, istilah **Kepala Unit + Anda** | Membersihkan teks UI bergaya AI slop: sapaan dobel di Dashboard, peringatan perangkat duplikat di PanelAbsen, emoji libur berlebih, filler di KartuShift, teks developer `.env` di Login, deskripsi dokumentasi 13 halaman admin dipendekkan 1 baris, pengulangan penjelasan Alfa di Pengaturan Presensi, Alert duplikat di Pengajuan Izin, label `v2.0`, serta penyeragaman "Kepala Ruangan" → "Kepala Unit" dan "Kamu" → "Anda". Tanpa perubahan logika/DB | selesai (kode) | 2026-11-04 — Pembersihan teks UI |
| I-115 | 2026-11-04 (WITA) | "kenapa tombol absen hadir masih menyala ... harusnya ketika pegawai sudah tidak absen masuk sampai jam pulang tombol absen masuk itu tidak aktif ... dan juga kita buat agar, super admin bisa acc pengaduan pegawai" + jawaban: tutup **tepat jam pulang**, Super Admin tidak melakukan pengaduan, hapus baris 30 Okt setelah dicek, ACC di **tab Riwayat Pengaduan** | Menutup tombol Absen Masuk pada jam selesai jadwal (klien; server sudah menolak), menambah `tutupAbsenMasuk()` + uji; migrasi **34** agar `putuskan_pengaduan_presensi` mengizinkan Super Admin (tetap tanpa ACC sendiri), sinkron `schema.sql` + `verifikasi_34.sql`; mengaktifkan ACC/Tolak di tab **Riwayat Pengaduan** (`KoreksiPresensi.jsx`) | selesai (kode); migrasi 34 belum dijalankan | 2026-11-04 — Tutup absen masuk & ACC pengaduan Super Admin |
| I-116 | 2026-11-04 (WITA) | "lanjutkan pekerjaan yang sempat terhenti karena limit usage, cari tau pekerjaan terakhirnya sampai mana dan lanjutkan, jangan sampai ad ayang terlewat, dan pastikan tidak ada bug dan eror" | Melanjutkan I-115: kode sudah lengkap, sisa hanya teks dokumen yang masih menyebut Super Admin "baca-saja" pada pengaduan; disinkronkan di `DaftarPengaduan.jsx`, `Pengaduan.jsx`, README, AGENTS, dan `progress.md` (Status Terkini, tabel migrasi 33/34, commit terbaru, jumlah uji 68, backlog B-40/B-41) | selesai (dokumen); migrasi 34 belum dijalankan | 2026-11-04 20:05 — Lanjutan pasca limit |
| I-117 | 2026-11-04 (WITA) | "sudah saya run migrasi 34" | Mencatat migrasi **34** sudah dijalankan di Supabase (ACC pengaduan oleh Super Admin aktif); memperbarui Status Terkini, tabel migrasi 34, tabel verifikasi, backlog B-40, dan Log Kronologis. Tidak ada perubahan kode. Sisa: `verifikasi_34.sql` dan uji manual ACC Super Admin/B-41 | selesai (dokumen) | 2026-11-04 20:15 — Migrasi 34 dijalankan |
| I-118 | 2026-11-04 (WITA) | "ui tombolnya masih sederhana, buat agar bisa dibedakan dengan logo dan warna" | `TabBar` diberi ikon garis + warna per kategori (Data Presensi sky, Audit Trail amber, Riwayat Pengaduan violet, Menunggu amber, Disetujui emerald, Ditolak rose, Dibatalkan/Semua slate, Dinas & Sakit rose, Cuti teal) dengan alias `pending/approved/rejected`; lint bersih, `npm test` 68/68, build lulus 9,41 dtk | selesai (kode); belum di-commit | 2026-11-04 20:45 — Tab berwarna & berikon |

| I-119 | 2026-11-04 (WITA) | "commit dan push" | Memverifikasi `npm run lint` (bersih), `npm test` 68/68, `npm run build` (lulus 7,60 dtk); memastikan staged diff tanpa rahasia; commit `07f340e` (tutup absen masuk tepat jam selesai, ACC pengaduan Super Admin + migrasi 34 & verifikasi 34, TabBar berwarna & berikon, sinkronisasi dokumen) lalu push ke `origin/main` (`a9279f9..07f340e`) | selesai | 2026-11-04 21:00 — Commit & push tutup absen masuk |

| I-120 | 2026-11-04 (WITA) | "harusnya notifikasinya bukan seperti ini ... ketika jam absen masuk sudah lewat yang artinya saya sudah alfa, tidak perlu penjelasan absen masuk ditutup, ubah menjadi penjelasan kamu alfa di hari ini, gunakan bahasa yang tidak ai slop" + "ya untuk alfa ubah gradasi jadi merah" + jawaban: **Anda tanpa saran koreksi** | `PanelAbsen` memakai judul/deskripsi/label **"Alfa Hari Ini"**, gradasi header merah (rose), Alert "Absen Masuk Ditutup" dihapus; logika & server tidak berubah | selesai (kode); commit `0d3a902` + push 2026-11-04 | 2026-11-04 21:30 — Notifikasi Alfa |
| I-121 | 2026-11-05 11:23 | "verifikasi 34 sudah, tombol absen masuk nonaktif juga sudah jalan, bebas radius juga sudah jalan, dan kasus meleset tidak usah di ungkit lagi kita anggap kesalahan device user, white screen setelah deploy sudah aman, tukar shift, laoporan, cetak f4 sudah aman" | Mencatat konfirmasi seluruh sisa uji manual pasca go-live: `verifikasi_34.sql` lulus, tombol Absen Masuk nonaktif berjalan, pegawai Bebas Radius berjalan, kasus GPS meleset ditutup (kesalahan perangkat pengguna), fallback white screen aman, serta tukar shift + laporan + cetak F4 aman. Menutup B-28, B-29, B-30, B-31, B-37, B-40, B-41; memperbarui Status Terkini + Log Kronologis. Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-11-05 11:23 — Konfirmasi uji manual pasca go-live |
| I-122 | 2026-11-05 12:05 | "oke fix, [Image 1] dan juga tampilan pengaduan masih beranakan dan tidak rapih, di tampilan mobil masih tidak pas, [Image 2] , revisi lagi tampilan dan uinya agar lebih rapih dan profesional tanpa ai slop" | Merapikan `PanelAbsen`: satu Alert **"Lupa Absen Pulang"** + tombol Ajukan Pengaduan blok penuh (dua Alert panjang digabung), alert Absen Masuk/Pulang Belum Dibuka dipersingkat dan tidak bertumpuk, deskripsi kontradiktif dihapus. Merapikan halaman `/pengaduan`: deskripsi ringkas, baris presensi satu baris dengan tombol **Ajukan** ringkas, form memakai pemilih foto bergaya (dropzone) + baris aksi `.aksi-modal`. Verifikasi lint bersih, `npm test` 68/68, build lulus 9,43 dtk | selesai (kode); belum di-commit | 2026-11-05 12:05 — Perapian panel lupa absen pulang & halaman pengaduan |
| I-123 | 2026-11-05 12:39 | "pada laporan bulanan status yang dirubah karena karena koreksi menjadi koreksi[Image 1] seperti pada gambar cuma keterangannya juga harusnya muncul alasan koreksinya kemarin apa" + "kerjakan, pastikan tidak ada bug dan eror, dan anti ai slop" | Menampilkan `presensi.alasan_koreksi` di kolom **Keterangan** Laporan Presensi Bulanan untuk semua baris terkoreksi (termasuk status `Hadir` hasil pengaduan), ditampilkan penuh. Menambah `keteranganPresensi()` di `utils/laporan.js` (prioritas koreksi → Alfa → izin → tukar → `—`), mengambil `alasan_koreksi` di `reportService.ambilLaporanBulanan()`, memakai helper di `LembarLaporan.jsx`, dan menambah 2 uji. Sebagian mengembalikan keputusan I-047 | selesai (kode); belum di-commit | 2026-11-05 12:39 — Alasan koreksi di laporan bulanan |
| I-124 | 2026-11-05 13:13 | "lanjutkan" (melanjutkan rencana Pengaduan multi-jenis Fase 1 yang disetujui: absen masuk + pulang; hari ini boleh; tombol di Panel Alfa; status `Hadir` + terlambat tercatat) | Menambahkan migrasi **35** + `verifikasi_35.sql`: `pengaduan_presensi.jenis`, `presensi_id`/`jam_pulang_diajukan` boleh kosong, `jam_masuk_diajukan/disetujui`, index tunggu per `(user_id,tanggal,jenis)`, RPC `ajukan`/`putuskan` baru, `kandidat_pengaduan_presensi()`, dan `daftar` yang memuat jenis. Klien: service, halaman pengaduan, form, daftar, modal putusan, dan tombol **Ajukan Pengaduan** di Panel Absen saat Alfa. Lint bersih, `npm test` 70/70, build lulus 8,38 dtk | selesai (kode); migrasi 35 belum dijalankan; belum di-commit | 2026-11-05 13:13 — Pengaduan multi-jenis absen masuk + pulang |
| I-125 | 2026-11-05 13:42 | "jika kasusnya pegawai yang datang 7.50 tapi karena aplikasi eror atau ada urgensi dia baru bisa absen di jam 8.30 apakah bisa di adukan agar absennya di koreksi?" + "kerjakan pastikan ui rapih dan anti ai slop, pastikan tidak ada bug dan eror" | Menambahkan **migrasi 36** + `verifikasi_36.sql`: jendela validasi pengaduan masuk disamakan dengan tombol absen (**60 menit sebelum** jam masuk s/d jam selesai), pengaduan `masuk` boleh **mengoreksi jam yang sudah tercatat** hanya ke arah **lebih awal**, status hasil koreksi `Koreksi`, `menit_terlambat` dihitung ulang, dan `kandidat` menampilkan baris koreksi untuk presensi yang terlambat. Klien: label **"Koreksi jam masuk · tercatat HH:MM"**, validasi/penjelasan di form & modal putusan, baris **"Tercatat"** di riwayat. Lint bersih, `npm test` 70/70, build lulus 9,34 dtk | selesai (kode); migrasi 36 belum dijalankan; belum di-commit | 2026-11-05 13:42 — Koreksi jam masuk lewat pengaduan |
| I-126 | 2026-11-05 13:48 | "data testing sebelum golive masih ada, apakah bisa dihapus semua data testing itu, karena data asli golive itu di tanggal 1 november sebelum itu cuma testing" | Membuat `supabase/hapus_data_testing.sql`: menghapus transaksi bertanggal **sebelum 1 November 2026** (presensi, koreksi, pengaduan, izin, jadwal shift, tukar shift) dan mempertahankan data sejak go-live, akun pegawai, grup, master shift, jam kerja, hari libur, pengaturan, serta perangkat terdaftar. Transaksional + query verifikasi; foto bukti storage tidak ikut (blok opsional). README + dokumen audit diperbarui. Skrip **belum dijalankan** | selesai (skrip); belum dijalankan; belum di-commit | 2026-11-05 13:48 — Skrip hapus data testing sebelum go-live |
| I-127 | 2026-11-05 14:06 | "sudha saya jalankan datanya sudah hilang tapi kenapa di pengaduan masih ada" + "kerjkan" | Mencatat `hapus_data_testing.sql` sudah dijalankan dan data go-live utuh (verifikasi user). Menjelaskan bahwa 29–30 Oktober bukan sisa data, melainkan kandidat baru dari `kandidat_pengaduan_presensi()` karena tanggal itu tidak punya baris presensi setelah pembersihan. Menambahkan **migrasi 37** + `verifikasi_37.sql`: kandidat, pengajuan, dan keputusan pengaduan dibatasi sejak **1 November 2026**; kandidat koreksi 2–3 November (data go-live) tetap tampil. Sinkron `schema.sql`; README + dokumen audit diperbarui. Lint bersih, `npm test` 70/70, build lulus 10,46 dtk | selesai (kode); migrasi 37 belum dijalankan; belum di-commit | 2026-11-05 14:06 — Batasi pengaduan sebelum go-live |
| I-128 | 2026-11-05 14:13 | "sudah saya jalankan dan sudah hilang" | Mencatat migrasi **37** sudah dijalankan di Supabase dan kandidat pengaduan sebelum 1 November 2026 (29–30 Oktober) sudah hilang; kandidat data go-live tetap tampil. Memperbarui Status Terkini, tabel migrasi 37, dan Log Kronologis. Tidak ada perubahan kode | selesai (dokumen); `verifikasi_37.sql` belum dikonfirmasi; belum di-commit | 2026-11-05 14:13 — Migrasi 37 dijalankan |
| I-129 | 2026-11-05 14:29 | "commit dan push" | Memverifikasi ulang `npm run lint` (bersih), `npm test` **70/70**, `npm run build` (lulus **11,01 dtk**); memastikan staged diff tanpa rahasia; commit `c14ea34` (pengaduan absen masuk/pulang, koreksi jam masuk, batas pengaduan sejak go-live, skrip hapus data testing, alasan koreksi laporan, perapian UI; migrasi 35–37 + verifikasi 35–37) lalu push ke `origin/main` (`5672fa0..c14ea34`) | selesai | 2026-11-05 14:29 — Commit & push pengaduan masuk/pulang + koreksi jam masuk |
| I-130 | 2026-11-05 14:59 | "pada pengaduan, tidak perlu mencantumkan pengaduan disetujui oleh, cukup isi keterangannya saja" + "dan tambahan apakah bisa ketengan itu hanya tampil untuk dinas luar, cuti, sakit, dan pengaduan , pada koreksi presensi yang dilakukan super admin tidak perlu ditampilkan keteranagnnya karena statusnya masih terhitung hadir..." + "kerjakan pastikan tidak ada bug dan eror pada sistem" | Kolom **Keterangan** laporan bulanan kini hanya memuat alasan **Sakit/Cuti/Dinas Luar** (dari `izin_cuti`) dan **pengaduan disetujui** (dari `pengaduan_presensi.alasan`), tanpa awalan "disetujui oleh …". Koreksi manual Super Admin, label Alfa, dan tukar shift tidak lagi tampil di Keterangan. Tambah `bersihkanAlasanKoreksi()` dan pakai di Riwayat Saya & Koreksi Presensi (alasan manual tetap tampil, awalan/catatan dibersihkan). Lint bersih, `npm test` **71/71**, build lulus **9,99 dtk** | selesai (kode); belum di-commit | 2026-11-05 14:59 — Keterangan laporan hanya izin & pengaduan |
| I-131 | 2026-11-05 15:09 | "riwayat tukar shift dicatat oleh kolomnya dihilangkan saja, jadi kolom alasan jadi lebih lebar" + "kerjakan sekarang" | Menghapus kolom **Dicatat Oleh** pada blok Riwayat Tukar Shift laporan bulanan dan melebarkan kolom **Alasan** (38%) dengan `table-layout: fixed` + `<colgroup>`; data `pencatat` tidak lagi di-query/diringkas. Lint bersih, `npm test` **71/71**, build lulus **9,85 dtk** | selesai (kode); belum di-commit | 2026-11-05 15:09 — Kolom Dicatat Oleh dihapus |
| I-132 | 2026-11-05 15:25 | "kenapa jadi seperti ini, pastikan nama rekan tukar menjadi 1 baris saja, kolom alasan terlalu besar, jadi kolom nama itu menyesuaikan panjang dari nama setiap pegawai" | Mengembalikan `.tabel-tukar` ke `table-layout: auto`; kolom Tanggal/Rekan Tukar/Shift Asal/Shift Pengganti `white-space: nowrap` agar nama **satu baris**, kolom **Alasan** dibatasi 18%. Lint bersih, `npm test` **71/71**, build lulus **11,64 dtk** | selesai (kode); belum di-commit | 2026-11-05 15:25 — Lebar kolom riwayat tukar |
| I-133 | 2026-11-05 15:29 | "Riwayat Tukar Shift Bulan Ini ganti menjadi riwayat tukar shift" | Mengganti judul blok laporan bulanan dari "Riwayat Tukar Shift Bulan Ini" menjadi **"Riwayat Tukar Shift"**. Lint bersih, `npm test` **71/71**, build lulus **7,88 dtk** | selesai (kode); belum di-commit | 2026-11-05 15:29 — Judul riwayat tukar disederhanakan |
| I-134 | 2026-11-05 16:18 | "lanjutkan keputusan question di atas sesuai kesepakatan kita" (rapikan dokumen + commit & push; `verifikasi_36.sql` dan `verifikasi_37.sql` sudah dijalankan) | Menyinkronkan `README.md` (pohon migrasi 01–37, verifikasi 34–37, `hapus_data_testing.sql`), `AGENTS.md` (fakta pengaduan multi-jenis/koreksi jam masuk/keterangan laporan), dan `progress.md` (status laporan, migrasi 36–37, verifikasi). Membersihkan fixtur uji yang tidak terpakai. Lint bersih, `npm test` **71/71**, build lulus **16,32 dtk** | selesai (dokumen & uji); siap commit & push | 2026-11-05 16:18 — Sinkronisasi dokumen & konfirmasi verifikasi 36–37 |
| I-135 | 2026-11-06 14:29 | "lanjutkan" | Melanjutkan penghapusan blok **Riwayat Tukar Shift** dan kolom **Shift** dari Laporan Presensi Bulanan agar laporan sama untuk pegawai Reguler dan Shift. Membersihkan query `jadwal`/`tukar` di `reportService.js`, `DATA_KOSONG`/prop `LaporanBulanan.jsx`, helper `labelShift`/`ringkasTukar` + uji, serta CSS `.blok-tukar`/`.tabel-tukar`. Data `jadwal_shift` dan `tukar_shift` tetap utuh. Lint bersih, `npm test` **69/69**, build lulus **14,92 dtk** | selesai (kode & dokumen); di-commit `f1511a2` + push | 2026-11-06 14:29 — Laporan bulanan tanpa kolom Shift & riwayat tukar |
| I-136 | 2026-11-06 (WITA) | "kemudian kolom keterangan pada laporan bulanan dihilangkan saja jadi reguler dan shift keterangannya dihilangkan saja, dan pada pola kerja shift ditambahkan kolom shift, dimana isinya itu shift mereka dihari itu semisal arinda belan kolom shift tgl 1 itu dia pagi jadi di kolom shift itu terisi pagi sesuai pada hari itu, apakah kamu paham?" + "kerjakan, pastikan tidak ad abug dan eror" | Menghapus kolom **Keterangan** dari laporan bulanan untuk semua pola kerja dan menambahkan kolom **Shift** setelah hari/tanggal khusus pegawai **Shift**, berisi nama shift hari itu dari `jadwal_shift` (`—` bila tidak ada jadwal). `reportService.js` kembali mengambil peta jadwal dan berhenti mengambil alasan izin/pengaduan; helper `labelShift()` ditambahkan, `keteranganPresensi()` dihapus. Lint bersih, `npm test` **68/68**, build lulus **7,77 dtk** | selesai (kode & dokumen); di-commit `f1511a2` + push | 2026-11-06 — Keterangan dihapus & kolom Shift untuk pegawai shift |
| I-137 | 2026-11-06 16:57 | "commit dan push" | Memverifikasi `npm run lint` (bersih), `npm test` **68/68**, `npm run build` (lulus **11,68 dtk**); memastikan staged diff tanpa rahasia; commit `f1511a2` (laporan bulanan tanpa Riwayat Tukar Shift & kolom Keterangan, kolom Shift untuk pegawai shift) lalu push ke `origin/main` (`c531502..f1511a2`) | selesai | 2026-11-06 16:57 — Commit & push laporan bulanan |
| I-138 | 2026-11-06 17:59 | "[Image 1] saya sudah terhitung sakit di hari ini dilaporan juga sudah sakit, tetapi di tampilan aplikasi saya masih terhitung alfa ketika sudah melewati jam pulang, lakukan perbaikan dimana ketika pegawai yang dinas, cuti, sakit, dihari itu tidak terjadi lagi hal seperti ini," + "kerjakan" | Menambahkan `statusTanpaAbsen()` untuk membaca status final **Sakit/Cuti/Dinas Luar/Izin** dari baris `presensi` tanpa `jam_masuk`; `PanelAbsen` menampilkan status tersebut, menyembunyikan Alfa, tombol pengaduan, tombol absen, badge radius, dan catatan lokasi. Shift malam kemarin yang masih terbuka tetap dapat dipulangkan. Lint bersih, `npm test` **71/71**, build lulus **8,76 dtk** | selesai (kode & dokumen); di-commit `5e48fa0` + push | 2026-11-06 17:59 — Panel absen mengenali izin |
| I-139 | 2026-11-06 18:22 | "commit dan push" | Memverifikasi `npm run lint` (bersih), `npm test` **71/71**, `npm run build` (lulus **8,76 dtk**); memastikan staged diff tanpa rahasia; commit `5e48fa0` (panel absen mengenali Sakit/Cuti/Dinas Luar) lalu push ke `origin/main` (`5a3f163..5e48fa0`) | selesai | 2026-11-06 18:22 — Commit & push panel absen izin |
| I-140 | 2026-11-06 18:28 | "[Image 1] sudah berubah tapi keterangannnya sangat ai slop , berulang, tidak perlu absen hari ini cukup 1 kali saja, status cukup sakit saj, tidak perlu sakit hari ini, status sakit sudah tercatat, tidak perlu absen hari ini dihapus saja" | Menghapus pengulangan pada kartu status izin `PanelAbsen`: judul cukup nama status (**Sakit**, bukan **Sakit Hari Ini**), deskripsi **Status … sudah tercatat. Tidak perlu absen hari ini.** dihapus, dan pesan **Tidak perlu absen hari ini** hanya tampil satu kali sebagai aksi. Lint bersih, `npm test` **71/71**, build lulus **8,62 dtk** | selesai (kode); di-commit `79a1368` + push | 2026-11-06 18:28 — Ringkas teks status izin |
| I-141 | 2026-11-06 18:31 | "commit dan push" | Memastikan staged diff hanya berisi ringkasan teks status izin tanpa rahasia; commit `79a1368` (judul status izin, hapus deskripsi berulang) lalu push ke `origin/main` (`c417a4e..79a1368`) | selesai | 2026-11-06 18:31 — Commit & push ringkas teks status izin |
| I-142 | 2026-11-11 | "oke selanjutnya kita perbaiki untuk cetakan laporan bulanan, dimana saat ini hanya merekap tanggal kehadiran pegawai, jadi hari libur mereka itu tidak masuk di rekapan, direktur ingin rekapannya tetap kelihatan ketika hari libur tapi tercatat libur" + "kerjakan pastikan tidak ada bug dan eror"; pilihan: semua tanggal 1–akhir bulan, hari kerja tanpa catatan "—", shift tanpa jadwal Libur, status "Libur" + ringkasan jumlah | Menampilkan seluruh tanggal bulan di laporan bulanan; libur akhir pekan/hari libur nasional/unit dan shift tanpa jadwal berstatus **Libur**, hari kerja tanpa catatan **—**, ringkasan menambah jumlah libur; data jam kerja unit + `hari_libur` dibaca klien (tanpa migrasi DB) | selesai (kode) | 2026-11-11 — Hari libur di laporan bulanan |
| I-143 | 2026-11-11 | "kerjakan pastikan tidak ada bug dan eror pada sistem" (melanjutkan rencana: status laporan berwarna + jenis **Izin** baru) | Menambahkan jenis **Izin** sebagai tab/menu baru (satu pegawai, dokumen wajib, alur persetujuan sama seperti Sakit/Cuti), warna per status pada sel Status laporan bulanan, migrasi 38 + `verifikasi_38.sql`, sinkron `schema.sql`, util/status/badge/riwayat/rute/menu, dan uji; lint bersih, `npm test` **81/81**, build lulus **8,44 dtk** | selesai (kode); migrasi 38 belum dijalankan | 2026-11-11 — Jenis Izin & warna status laporan |
| I-144 | 2026-11-11 | "ada pekerjaan yang belum selesai karena force close, cari tau progress pekerjan sebelumnya sudah sampai mana dan lanjutkan tanpa ada yang terlewat, pastikan tidak ada bug dan eror pada sistem" | Mengaudit pekerjaan I-142/I-143: memastikan migrasi 38 identik dengan `schema.sql`, diff RPC hanya menambah `Izin`, melengkapi label navigasi **Dinas, Cuti & Izin**, menyinkronkan `README.md` dan tabel Aspek/backlog `progress.md` (B-44/B-45); lint bersih, `npm test` **81/81**, build lulus **6,74 dtk** | selesai (audit kode & dokumen); migrasi 38 belum dijalankan | 2026-11-11 15:15 — Audit pasca force close I-142/I-143 |
| I-145 | 2026-11-11 15:21 | "migrasi sudah saya jalankan" | Mencatat migrasi **38** (`38_jenis_izin.sql`) sudah dijalankan di Supabase; constraint jenis Izin dan RPC server aktif. Memperbarui Status Terkini, tabel migrasi/verifikasi, backlog B-44, serta log; tidak ada perubahan kode. Sisa: `verifikasi_38.sql` dan uji manual Izin | selesai (dokumen) | 2026-11-11 15:21 — Migrasi 38 dijalankan |
| I-146 | 2026-11-11 15:25 | "commit dan push" | Memverifikasi `npm run lint` bersih, `npm test` **81/81**, `npm run build` lulus **9,07 dtk**; memastikan staged diff tanpa rahasia; commit **`d27493e`** (hari libur di laporan bulanan, jenis Izin, warna status, migrasi 38 + `verifikasi_38.sql`, label navigasi, dokumen audit) lalu push ke `origin/main` | selesai | 2026-11-11 15:25 — Commit & push hari libur laporan + jenis Izin |
| I-147 | 2026-11-11 15:30 | "verifikasi 38 sudah saya jalankan" | Mencatat `verifikasi_38.sql` sudah dijalankan dan lulus; constraint jenis Izin dan RPC server terkonfirmasi. Memperbarui Status Terkini, tabel migrasi/verifikasi, dan backlog B-44; tidak ada perubahan kode. Sisa: uji manual Izin | selesai (dokumen); belum di-commit | 2026-11-11 15:30 — Verifikasi 38 dijalankan |
| I-148 | 2026-11-11 15:42 | "lanjutkan pekerjaan terakhir yaitu update agenst dan progress,[Image 1]" + "kerjakankerjakan" | Melanjutkan pembaruan AGENTS.md dan progress.md yang terhenti: sinkronisasi Fakta Lingkungan AGENTS.md (commit d27493e, 79a1368, 5e48fa0, jenis Izin, hari libur laporan, migrasi 38 + verifikasi 38), tabel aspek progress.md, serta verifikasi build & test | selesai (dokumen); belum di-commit | 2026-11-11 15:42 — Sinkronisasi AGENTS.md & progress.md |
| I-149 | 2026-11-11 16:10 | "kerjakan" (menyetujui: rapikan 5 komentar usang + `npm run build`) | Menambahkan **Izin** pada komentar usang di `src/App.jsx`, `src/utils/izin.js` (2 baris), `src/services/leaveService.js`, dan `src/components/layout/SidebarKepala.jsx`; `npm run lint` bersih, `npm test` **81/81**, `npm run build` lulus **12,78 dtk**. Sisa: uji manual Izin (B-45) | selesai (kode); belum di-commit | 2026-11-11 16:10 — Rapikan komentar usang daftar jenis |
| I-150 | 2026-11-11 16:20 | "sudah saya uji dan berhasil" | Mencatat uji manual jenis **Izin** lulus (Kepala Unit `menunggu`, Super Admin `disetujui`, absensi/Alfa/pengaduan ditolak pada hari Izin, warna status laporan benar); menutup backlog **B-45** dan memperbarui Status Terkini. Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-11-11 16:20 — Uji manual jenis Izin lulus |
| I-151 | 2026-11-11 17:20 | "Ubah Logika Status: Pastikan status akhir setelah proses approve koreksi mengubah status absensi harian kembali menjadi Hadir ... karna saat ini hari yang sudah dikoreksi tidak dihitung hadir oleh sistem" + pilihan: label **Hadir (Koreksi)**, **normalkan semua** data lama | Menjadikan status akhir presensi terkoreksi **Hadir** (trigger migrasi **39** + backfill), label tampilan **Hadir (Koreksi)** di laporan/rekap/riwayat, menghapus `Koreksi` dari pilihan status & kolom rekap, sinkron `schema.sql` + `verifikasi_39.sql`; `npm run lint` bersih, `npm test` **82/82**, `npm run build` lulus **8,63 dtk**. Migrasi 39 belum dijalankan | selesai (kode); migrasi 39 belum dijalankan | 2026-11-11 17:20 — Status Hadir setelah koreksi |
| I-152 | 2026-11-11 17:40 | "sudah saya run migrasi dan verifikasi dan berhasil" | Mencatat migrasi **39** dan `verifikasi_39.sql` sudah dijalankan dan berhasil; presensi terkoreksi berstatus **Hadir** di server dan data lama `Koreksi` dinormalkan. Memperbarui Status Terkini, tabel migrasi, backlog **B-46**. Tidak ada perubahan kode. Sisa: uji manual satu pengaduan disetujui | selesai (dokumen); belum di-commit | 2026-11-11 17:40 — Migrasi 39 dijalankan |
| I-153 | 2026-11-11 18:05 | "statusnya sudah berubah di laporan, kemudian pada hari libur kita coba kita beri warna hitam merge dari kolom jam masuk sampai kolom terlambat, dan dengan font putih garis miring di tengah 'Libur Shift / Off'" + pilihan: reguler **"Libur / Off"** & shift **"Libur Shift / Off"**, huruf **miring** | Menggabungkan sel Jam Masuk–Terlambat pada baris libur laporan bulanan (`colSpan={4}`), latar hitam + teks putih miring, label berbeda per pola kerja; `npm run lint` bersih, `npm test` **82/82**, `npm run build` lulus **7,33 dtk** | selesai (kode); belum di-commit | 2026-11-11 18:05 — Baris libur di laporan bulanan |
| I-154 | 2026-11-11 18:35 | "[Image 1] SEPERTINYA warna hitamnya tidak hitam pekat, dan juga fontnya ganti menjadi times now roman tanpa bold, dan apakah bisa dibuat ketika libur 2 hari itu otomatis merge 2 baris menjadi 1 yang jadinya textnya juga cukup 1 saja, kemudian untuk pola reguler, merge kolomnya sampai pada kolom shift" + pilihan: reguler tetap Jam Masuk–Terlambat, dua baris tetap, hanya sel hitam digabung | Sel libur jadi hitam pekat `#000000`, font Times New Roman miring non-bold, libur berurutan digabung `rowSpan` dengan satu teks (`tandaiLiburBerurutan()`); `npm run lint` bersih, `npm test` **83/83**, `npm run build` lulus **8,08 dtk** | selesai (kode); belum di-commit | 2026-11-11 18:35 — Penyempurnaan sel libur laporan |
| I-155 | 2026-11-11 18:55 | "[Image 1] [Image 2] sepertinya warna hitam pekatnya diganti menjadi warna abu2 saja, dengan font hitam, dan untuk pola kerja shift mergenya warnanya dari kolom shift, saya liat belum berubah, dan text pada 2 hari libur masih belum di tengah kolom" | Sel libur jadi abu-abu `#e5e7eb` + teks hitam, `vertical-align: middle` agar teks tepat di tengah sel gabungan, dan pola shift menggabung mulai kolom **Shift** (`colSpan=5`); `npm run lint` bersih, `npm test` **83/83**, `npm run build` lulus **10,13 dtk** | selesai (kode); belum di-commit | 2026-11-11 18:55 — Warna & cakupan sel libur |
| I-156 | 2026-11-11 19:00 | "coba buat abunya sedikit lebih pekat lagi" | Mengubah latar sel libur laporan bulanan `#e5e7eb` → **`#cbd5e1`**; `npm run build` lulus **7,06 dtk** | selesai (kode); belum di-commit | 2026-11-11 19:00 — Abu sel libur diperpekat |
| I-157 | 2026-11-11 19:10 | "[Image 1] kemudian pada header kolom no, hari, sampai terlambat, buat menjadi biru seperti pada logo rsud [Image 2]" | Header tabel laporan bulanan jadi biru logo RSUD `#1a6fb5` dengan teks putih; `npm run build` lulus **7,22 dtk** | selesai (kode); belum di-commit | 2026-11-11 19:10 — Header tabel laporan biru |
| I-158 | 2026-11-11 19:25 | "[Image 1] pada pemilihan pegawai di menu cuti,sakit,dinasluar,izin tambahkan searching pegawai dengan typing agar memudahkan pencarian nama ketika usulan" + "kerjakanpastikan tidak ada bug dan eror" | Pemilihan pegawai tunggal jadi combobox berketik (filter nama/unit, Enter/Esc, tombol kosongkan) dan daftar centang Dinas Luar diberi `PencarianNama`; `npm run lint` bersih, `npm test` **83/83**, `npm run build` lulus **7,36 dtk** | selesai (kode); belum di-commit | 2026-11-11 19:25 — Pencarian pegawai pengajuan izin |
| I-159 | 2026-11-11 20:45 | "[Image 1] saya mau ketika hari libur di input oleh admin ... berwarna merah terang dengan font putih merge seperti hari libur biasa, dengan tulisan sesuai inputan di aplikasi semisal Hari Raya Idul Fitri / Hari Pahlawan Nasional, untuk reguler, karena untuk pola shift tetap masuk ..." | Libur nasional di laporan bulanan pegawai reguler tampil sebagai sel gabungan merah `#dc2626` + teks putih berisi nama liburnya; `jenisLibur` (`nasional`/`mingguan`/`shift`) + `rowSpan` hanya untuk jenis sama; `npm run lint` bersih, `npm test` **85/85**, `npm run build` lulus **12,61 dtk** | selesai (kode); belum di-commit | 2026-11-11 20:45 — Libur nasional merah di laporan |
| I-160 | 2026-11-11 21:05 | "kemudian ada indikasi bug pada pengaduan dimana pengaduan salah satu unit tidak bisa di setujui kepala unitnya dengan notif gagal anda tidak berhak melihat jadwal pegawai ini.[Image 1] , cari karna sebelumnya tidak pernah ada kasus seperti ini" + "kerjakan" | Akar masalah: `jadwal_kerja` masih memakai aturan lama `pegawai.kepala_ruangan` + unit tunggal sehingga kepala unit (via `kepala_unit`, multi-unit/kepala ASN) ditolak saat `putuskan_pengaduan_presensi` memanggilnya. Migrasi **40** mengganti pengecekan ke `bisa_lihat_presensi(p_user)`, ditambah `verifikasi_40.sql`, sinkron `schema.sql` + README; lint bersih, `npm test` **85/85**, `npm run build` lulus **7,89 dtk** | selesai (kode); migrasi 40 belum dijalankan | 2026-11-11 21:05 — Perbaikan hak akses jadwal kepala unit |
| I-161 | 2026-11-11 21:20 | "sudah sayajalankan migrasi dan verifikasinya" | Mencatat migrasi **40** dan `verifikasi_40.sql` sudah dijalankan; `jadwal_kerja` kini mengenali kepala unit lewat `kepala_unit` (`bisa_lihat_presensi`). Memperbarui Status Terkini, tabel migrasi 40, dan backlog **B-47**. Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-11-11 21:20 — Migrasi 40 dijalankan |
| I-162 | 2026-11-12 | "commit dan push" | Memverifikasi `npm run lint` bersih, `npm test` **85/85**, `npm run build` lulus **19,14 dtk**; commit **`27525d1`** (status Hadir setelah koreksi + migrasi 39, laporan libur berwarna & header biru, pencarian pegawai pengajuan izin, hak akses `jadwal_kerja` + migrasi 40, verifikasi 39–40) lalu push ke `origin/main` (`3f0c13f..27525d1`) | selesai | 2026-11-12 — Commit & push sesi 11 November |
| I-163 | 2026-11-12 09:02 | "[Image 1] sebelum saya commit perubahan barusan, ada laporan dari kepala unit kalau tidak bisa tukar shift dengan notif seperti pada gambar" + "tapi barusan saya tukar sendiri dengan akun admin dan berhasil setelah commit barusan, apa tetap perlu kita perbaiki?" + "kerjakan pastikan tidak ada bug dan eror" | Akar masalah FK audit: `jadwal_shift.dibuat_oleh`/`diperbarui_oleh` dan `tukar_shift.dibuat_oleh` diisi `auth.uid()` tetapi ber-FK ke `public.pegawai`, sehingga kepala unit ASN (tanpa baris `pegawai`) gagal; akun admin berhasil karena punya baris. Migrasi **41** mengarahkan ketiga FK ke `auth.users`, ditambah `verifikasi_41.sql`, sinkron `schema.sql` + README; lint bersih, `npm test` **85/85**, `npm run build` lulus | selesai (kode); migrasi 41 belum dijalankan | 2026-11-12 09:02 — Perbaikan FK audit Tukar Shift |
| I-164 | 2026-11-12 09:05 | "commit dan push" | Memverifikasi `npm run lint` bersih, `npm test` **85/85**, `npm run build` lulus **8,72 dtk**; memastikan staged diff tanpa rahasia; commit **`dc12aa8`** (FK audit `jadwal_shift`/`tukar_shift` → `auth.users`, migrasi 41 + `verifikasi_41.sql`, sinkron `schema.sql`/README) lalu push ke `origin/main` (`c48e64c..dc12aa8`) | selesai | 2026-11-12 09:05 — Commit & push perbaikan FK audit Tukar Shift |
| I-165 | 2026-11-12 09:06 | "sudah jalankan migration dan verifikasi, uji coba belum ada karena beum ada testing" | Mencatat migrasi **41** dan `verifikasi_41.sql` sudah dijalankan; FK audit `jadwal_shift`/`tukar_shift` kini ke `auth.users`. Uji manual ditunda karena belum ada kasus tukar shift. Memperbarui Status Terkini, tabel migrasi 41, dan backlog **B-48**. Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-11-12 09:06 — Migrasi 41 dijalankan |
| I-166 | 2026-11-12 09:29 | "3 bagian sekalian kerjakan dengan rapih dengan anti ai slop, sesuaikan dengan tampilan mobile, pastikan tidak ada bug dan eror" (melanjutkan permintaan perapian daftar pengaduan dan tabel Dinas & Sakit/Cuti/Izin) | Merapikan tiga bagian: (1) tabel Dinas & Sakit/Cuti/Izin — periode satu baris 190 px, padding rapat, keterangan 2 baris; (2) daftar pengaduan — meta/jam/alasan/footer padat dengan **Lihat Foto** & **Tinjau**, filter Unit+Status digabung ke toolbar, Alert biru dihapus; (3) konsistensi tabel admin lewat kelas `.tabel-data` (pemisah kolom tipis, tanpa Rekapitulasi). Menambahkan `formatRentangRingkas()` + uji, `TampilanPeriode` satu baris, dan judul modal pengaduan sesuai jenis. Lint bersih, `npm test` **86/86**, build lulus **10,09 dtk** | selesai (kode); belum di-commit | 2026-11-12 09:29 — Perapian UI pengaduan, periode, dan tabel admin |
| I-167 | 2026-11-12 09:54 | "[Image 1] pengaduan absen pulang user sudah muncul pada saat baru absen pagi, sebelum jam pulang sudah tutup dan kosong, harusnya baru muncul setelah pegawai tidak absen pulang sampai jam absen pulang tertutup, ubah logikanya" + "kerjakan pastikan tidak ada bug dan eror" | Membuat migrasi **42** (helper `hitung_batas_absen_pulang()` = jam selesai jadwal + 2 jam, shift malam H+1) yang dipakai `kandidat_pengaduan_presensi()` dan `ajukan_pengaduan_presensi()`: kandidat absen pulang hanya muncul setelah jendela absen pulang tertutup, pengajuan sebelum batas ditolak server, dan tanpa jadwal hanya untuk tanggal lampau. Menambah `verifikasi_42.sql`, menyinkronkan `schema.sql` (kedua RPC identik dengan migrasi 42), dan menjelaskan batas tersebut di halaman Pengaduan. Lint bersih, `npm test` **86/86**, build lulus **9,65 dtk** | selesai (kode); migrasi 42 belum dijalankan; belum di-commit | 2026-11-12 09:54 — Pengaduan absen pulang setelah jendela tutup |
| I-168 | 2026-11-12 10:25 | "[Image 1] migrasi 42 eror" (ERROR 42601: `syntax error at end of input` pada `when v_tutup is not null then now() >= v_tutup`) + "sebelum saya jalankan migrasinya kamu sudah pastikan tidak ada bug dan eror nantinya?" | Memperbaiki galat sintaks: `CASE` di dalam kondisi `IF` dibaca PL/pgSQL sebagai penutup `IF`. Kandidat kini menghitung `v_dibuka boolean` lebih dulu lalu `IF ... and v_dibuka`; `schema.sql` disinkronkan. Menguji **seluruh isi** migrasi 42 + `verifikasi_42.sql` di Postgres asli (PGlite/WASM): tereksekusi tanpa galat, **19/19 pemeriksaan `true`**, dan **16 uji perilaku** lulus (kandidat pulang sebelum/sesudah batas, tepat di batas, tanpa jadwal, tanggal lampau, penolakan & penerimaan server, helper reguler 18.30 dan shift malam 10.00 H+1). Menambah `tests/migrasiPengaduan.test.js` (5 uji) untuk mencegah regresi `CASE`-di-`IF` dan ketidaksinkronan `schema.sql`. Lint bersih, `npm test` **91/91**, build lulus **7,30 dtk** | selesai (kode + uji SQL); migrasi 42 belum dijalankan; belum di-commit | 2026-11-12 10:53 — Perbaikan galat sintaks migrasi 42 + uji SQL |
| I-169 | 2026-11-12 11:08 | "sudah saya jalankan migrasi 42 dan succses, kemudian verifikasi sudah dengan hasil semuanya true" | Mencatat migrasi **42** berhasil dijalankan di Supabase dan `verifikasi_42.sql` menghasilkan **semua `true`**; server kini menolak pengaduan absen pulang sebelum batas tutup (jam selesai jadwal + 2 jam, shift malam H+1) dan kandidatnya tidak lagi muncul sejak absen pagi. Memperbarui Status Terkini, tabel migrasi 42, backlog **B-50** (selesai) dan **B-51** (uji manual). Tidak ada perubahan kode | selesai (dokumen); belum di-commit | 2026-11-12 11:08 — Migrasi 42 dijalankan & verifikasi lulus |
| I-170 | 2026-11-12 11:17 | "commit dan push" | Memverifikasi `npm run lint` bersih, `npm test` **91/91**, `npm run build` lulus **9,96 dtk**; memastikan staged diff & berkas baru tanpa kredensial; commit **`6ac6f2c`** (migrasi 42 pengaduan absen pulang setelah jendela tutup, `verifikasi_42.sql`, sinkron `schema.sql`, `tests/migrasiPengaduan.test.js`, perapian UI pengaduan/periode/tabel admin, dokumen audit) lalu push ke `origin/main` (`2fa718a..6ac6f2c`); `git fetch` mengonfirmasi `origin/main` = `6ac6f2c` | selesai | 2026-11-12 11:20 - Commit & push `6ac6f2c` |
| I-171 | 2026-11-13 (WITA) | "saya berencana mengganti logo favicon dan logo aplikasi presisi ami" + jawaban: "Belum ada, akan saya taruh", "semuanya kecuali log kop jangan diganti", "Ya, pakai logo baru", "Logo v2 + deskripsi + badge", "Rename ke LogoAplikasi", "Ubah ke #1170B3" | Menerapkan logo baru: `logo-aplikasi.png` untuk header pegawai + sidebar Super Admin/Kepala Unit (komponen `LogoRSUD.jsx` di-rename `LogoAplikasi.jsx`), `logo-aplikasi.v2.png` khusus halaman login (judul `h1` jadi `sr-only` agar tidak dobel), dan kop laporan **tetap** `logo-rsud-ami.png`. Favicon: `public/favicon.ico` (multi-ukuran), `favicon-32x32.png`, `apple-touch-icon.png` (180 px, latar putih) dibuat dari `logo-aplikasi.png`; `favicon.svg` dihapus; `theme-color` menjadi `#1170B3`. Lint bersih, `npm test` **91/91**, build lulus **8,60 dtk** | selesai (kode); belum di-commit | 2026-11-13 09:49 - Logo aplikasi PRESISI AMI & favicon baru |
| I-172 | 2026-11-13 (WITA) | "[Image 1] Presensi Sistem Informasi Staf Integrasi dan RSUD Aji Muhammad Idris, dihapus saja, sisakan logo di atas, dan ukuran lebarnya sesuai dengan luas kotak login" | Menghapus deskripsi (`DESKRIPSI_APLIKASI`) dan badge rumah sakit (`NAMA_RUMAH_SAKIT`) dari kepala halaman login; logo `logo-aplikasi.v2.png` memakai `w-full` sehingga selebar kartu login (`max-w-md` = 448 px); `h1` "PRESISI AMI" tetap `sr-only`; import yang tak terpakai dibuang. Lint bersih, `npm test` **91/91**, build lulus **8,44 dtk** | selesai (kode); belum di-commit | 2026-11-13 09:58 - Kepala halaman login logo selebar kartu |
| I-173 | 2026-11-13 (WITA) | "[Image 1] sya kurang puas dengan hasilnya, apa perlu kita redisgn untuk menyesuaikan logo yang baru ini,[Image 2] agar cocok di mobile dan deskop" + jawaban: "A — Satu kartu (Recommended)", "rekomendasikan yang mana" (dipilih: tetap logo v2), "Gradasi penuh (Recommended)" | Redesign `Login.jsx` menjadi **satu kartu**: logo v2 di dalam kartu (`w-48 sm:w-56`), garis pemisah tipis, judul + form di bawahnya; latar gradasi biru muda penuh layar menggantikan pita 256 px; padding kartu dirapikan. Logika login tidak berubah. Diuji headless pada viewport 320/375/390/768/1440 px: `scrollWidth` = lebar viewport (tanpa overflow), kartu 288–448 px. Lint bersih, `npm test` **91/91**, build lulus **10,95 dtk** | selesai (kode); belum di-commit | 2026-11-13 10:10 - Redesign login satu kartu |
| I-174 | 2026-11-13 (WITA) | "[Image 1] saya masih tidak suka dengan hasilnya, apak perlu kita redesign bentuk menu login agar bisa menyesuaikan dengan logo baru kita, mengubah bentuk , tata letak. bagaimana menurutmu?" + jawaban: "Opsi 1 — Split screen (Recommended)", "Render pratinjau dulu (Recommended)" + "dibawahnya lupa kata sandi ganti menjadi Lupa kata sandi? Hubungi Admin/IT" + "Sistem Absensi Pegawai Non-ASN RSUD AMI diganti Sistem Absensi Pegawai RSUD AMI" | Redesign `Login.jsx` menjadi **split screen**: desktop grid 2 kolom (panel biru `#1170B3` + plakat putih berisi logo v2 + teks "Sistem Absensi Pegawai RSUD AMI"/form kanan), mobile pita biru + kartu menumpuk `-mt-10`. Footer menjadi **"Lupa kata sandi? Hubungi Admin/IT"**. Logika login tidak berubah. Uji headless 320/375/390/768/1024/1440 px: `scrollWidth` = viewport, titik pecah 1024 px bersih. Lint bersih, `npm test` **91/91**, build lulus **10,46 dtk** | selesai (kode); belum di-commit | 2026-11-13 10:35 - Redesign login split screen |
| I-175 | 2026-11-13 (WITA) | "[Image 1] pada tampilan mobile masih banyak ruang kosong dibawah kartu login, [Image 2] pada deskop hapus 'Sistem Absensi Pegawai RSUD AMI' dan kartu berikan gradasi biru di pinggiran kartu login, dan logo di kiri itu lebih besarkan lagi ukurannya sedikit" | Pita biru mobile dibuat `flex-1` (mengisi tinggi layar) dengan plakat logo (`w-44 sm:w-56`) + teks "Sistem Absensi Pegawai RSUD AMI", sehingga tidak ada ruang kosong di bawah kartu; kartu tetap menumpuk `-mt-10`. Desktop: teks panel kiri dihapus, logo `w-56` → `w-64`, kartu diberi **gradient border** biru 3 px lewat kelas `.kartu-login` di `index.css` (`border: 3px solid transparent` + `background-clip: padding-box, border-box`, `#0f66a3 → #1170b3 → #5fb8ec`). Uji headless 320/375/390/768/1024/1440 px tanpa luberan. Lint bersih, `npm test` **91/91**, build lulus **7,07 dtk** | selesai (kode); belum di-commit | 2026-11-13 11:08 - Pita mobile penuh & kartu berbingkai gradasi |
| I-176 | 2026-11-13 (WITA) | "pada tmpilan mobil tulisan Sistem Absensi Pegawai RSUD AMI ganti menjadi ---Presensi SIstem InformaSI RSUD AMI--- , dan untuk deskop [Image 1] bagian warna biru itu digeser lagi ke kanan agar lebih luas warna biru, dan logo dibagian biru itu besarkan lagi 20/30%" | Teks pita biru mobile menjadi **"Presensi Sistem Informasi RSUD AMI"**; grid desktop `lg:grid-cols-2` → **`lg:grid-cols-[1.3fr_1fr]`** (panel biru ±57%: 579 px di 1024, 814 px di 1440); padding panel form `lg:px-10` → `lg:px-8`; logo panel biru `w-64` → **`w-80`** (+25%). Uji headless 320/375/390/768/1024/1440 px tanpa luberan. Lint bersih, `npm test` **91/91**, build lulus **9,40 dtk** | selesai (kode); belum di-commit | 2026-11-13 11:17 - Panel biru lebih luas, logo +25%, teks mobile |
| I-177 | 2026-11-13 11:27 | "commit dan push" | Memverifikasi `npm run lint` (bersih), `npm test` **91/91**, `npm run build` (lulus **8,55 dtk**); memastikan staged diff tanpa kredensial; commit **`981113e`** (logo aplikasi baru + favicon + redesign login split screen, panel biru `1.3fr : 1`, logo `w-80`, `.kartu-login`, teks mobile "Presensi Sistem Informasi RSUD AMI"; `LogoRSUD.jsx` dihapus, `LogoAplikasi.jsx` ditambahkan; kop laporan tidak berubah) lalu push ke `origin/main` (`ef548cd..981113e`); `git fetch` mengonfirmasi `HEAD` = `origin/main` = `981113e` | selesai | 2026-11-13 11:27 - Commit & push logo aplikasi + redesign login |
| I-178 | 2026-11-13 (WITA) | "radius dtambahkan menjadi 80 meter" | Menaikkan radius geofencing dari 50 m menjadi **80 meter** di klien (`MAX_RADIUS_METERS`) dan teks radius terkait; membuat migrasi **43** (`43_radius_80_meter.sql`) yang mendefinisikan ulang `submit_presensi` dengan `v_jarak > 80` + pesan "radius 80 meter", `verifikasi_43.sql`, dan sinkron `schema.sql`; menambah 2 uji radius; `npm run lint` bersih, `npm test` **93/93**, `npm run build` lulus | selesai (kode); migrasi 43 belum dijalankan | 2026-11-13 11:43 - Radius absensi 80 meter |
| I-179 | 2026-11-13 11:55 | "commit dan push" | Memverifikasi `npm run lint` (bersih), `npm test` **93/93**, `npm run build` (lulus **8,13 dtk**); memastikan staged diff tanpa kredensial; commit **`4c1f1b0`** (radius absensi 80 m: migrasi 43 + `verifikasi_43.sql`, sinkron `schema.sql`, `MAX_RADIUS_METERS`, uji, dokumen audit) lalu push ke `origin/main` (`981113e..4c1f1b0`) | selesai | 2026-11-13 11:43 - Radius absensi 80 meter |
| I-180 | 2026-11-14 (WITA) | "kantor belakang jaraknya 94 meter dari titik pusat, jadi radius 80 masih terlalu kecil, ubah jadi 120 meter, dan tambahkan animasi centang + suara lonceng saat absen berhasil" + "kerjakan pastikan tidak ada bug dan eror pada sistem, pastikan semuanya fitur dan menu tidak ada gangguan" | Menaikkan radius geofencing 80 m → **120 meter** di klien (`MAX_RADIUS_METERS`) dan server (migrasi **44** `44_radius_120_meter.sql` + `verifikasi_44.sql`, sinkron `schema.sql`; migrasi 43 tidak diubah karena sudah dijalankan). Menambahkan overlay konfirmasi absensi berhasil: `AbsenBerhasil.jsx` (portal, tirai 25 %, centang 72 px, satu baris teks, tutup otomatis ±1,4 dtk, ketuk/`Esc`, hormati `prefers-reduced-motion`), `src/utils/suaraAbsen.js` (`mainkanLonceng()` Web Audio: C6→G6, ±290 ms), keyframe `absen-*` di `index.css`, dan integrasi di `PanelAbsen.jsx` (auto-scroll ke pesan gagal). Uji: radius 120 m (tolak 121 m, terima 95 m, batas 119/121, kesesuaian klien↔migrasi 44↔`schema.sql`) + `tests/suaraAbsen.test.js`. `npm run lint` bersih, `npm test` **95/95**, `npm run build` lulus **10,45 dtk** | selesai (kode); migrasi 44 belum dijalankan; belum di-commit | 2026-11-14 - Radius 120 m & konfirmasi absen berhasil |
| I-181 | 2026-11-14 (WITA) | "migrasi dan verifikasi sudah saya jalankan selanjutnya commit dan push" | Mencatat migrasi **44** dan `verifikasi_44.sql` sudah dijalankan user (server radius 120 m aktif); memverifikasi `npm run lint` (bersih), `npm test` **95/95**, `npm run build` (lulus **10,40 dtk**); commit radius 120 m + overlay konfirmasi absen berhasil (`AbsenBerhasil.jsx`, `suaraAbsen.js`, keyframe `index.css`) beserta migrasi 44, `verifikasi_44.sql`, `schema.sql`, uji, dan dokumen audit lalu push ke `origin/main` sebagai commit **`091a56e`** | selesai | 2026-11-14 - Commit & push radius 120 m |
| I-182 | 2026-11-14 (WITA) | "sudah commit dan saya testing tida ada animasi centang yang muncul cuma ada suara lonceng" + "dan loncengnya terlalu sederhana, cuma suara kecil dan singkat ... yang saya mau suara seperti suara checkout pesanan yang berhasil atau transfer yang berhasil, selaras dengan animasi centangnya" + "kerjakan" | Akar masalah overlay tidak tampil: `onBerhasil={muatData}` membuat `setMemuatData(true)` sehingga Dashboard mengganti `PanelAbsen` dengan spinner dan meng-unmount overlay tepat setelah sukses (lonceng tetap bunyi karena Web Audio di luar React). Perbaikan: `muatData` menerima opsi `{ senyap: true }` (tidak menyalakan spinner) dan `onBerhasil` memakai muat ulang senyap. Lonceng dirombak menjadi chime 4 nada naik **E5–G#5–B5–E6**, jeda 100 ms, harmonik 2× tipis (bell, bukan beep), volume puncak 0.2, denting terakhir sampai ±700 ms — selaras dengan centang (gambar 120–470 ms). Uji ditambah (nada menaik, durasi 600–900 ms). `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **8,82 dtk** | selesai (kode); di-commit **`f56d0c3`** & di-push 2026-11-14 | 2026-11-14 - Perbaikan overlay & lonceng sukses |
| I-183 | 2026-11-14 (WITA) | "apakah ada opsi suara lain yang lebih nyaman di dengar, dan modern" + "coba opsi a dulu" | Menerapkan **opsi A "marimba/kalimba"**: `NADA_SUKSES` menjadi **G5–B5–D6** (783,99/987,77/1174,66 Hz), jeda 140 ms, harmonik **3×** tipis 0.10, decay 0,40/0,40/0,55 dtk (total ±830 ms), volume puncak 0.16, plus `BiquadFilter` lowpass 5 kHz dan `DynamicsCompressor` agar lembut saat nada bertumpuk. Hanya `src/utils/suaraAbsen.js` + uji yang berubah; overlay, Dashboard, dan server tidak disentuh. `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **11,16 dtk** | selesai (kode); di-commit **`4606459`** & di-push 2026-11-14 | 2026-11-14 - Lonceng opsi A marimba |
| I-184 | 2026-11-14 (WITA) | "ganti kembali dengan suara sebelumnnya, langsung commmit dan push" | Mengembalikan nada konfirmasi ke versi sebelum opsi marimba (commit `f56d0c3`): **E5–G#5–B5–E6**, jeda 100 ms, harmonik 2× tipis 0.22, volume puncak 0.2, denting terakhir ±700 ms; `src/utils/suaraAbsen.js` dan `tests/suaraAbsen.test.js` dikembalikan dengan `git checkout f56d0c3 -- ...`. Versi marimba (commit `4606459`) tetap ada di riwayat. `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **9,62 dtk** | selesai; di-commit **`290ff41`** & di-push 2026-11-14 | 2026-11-14 - Kembali ke nada 4 nada |
| I-185 | 2026-11-14 (WITA) | "[Image 1] tampilan radius 120 m itu membuat seolah2 itu adalah posisi mereka sekarang, apakah kamu sependapat, apakah perlu kita ubah?" + "jika dihapus tampilannya akan kosong, adakah saran yang lebih baik kita letakkan disitu" + "oke opsi 1, tampilannya seperti apa" + "kerjakan dan langsung commit dan push" | Badge **"Radius 120 m"** di header `PanelAbsen` diganti **jam berjalan WITA** (`formatJam(new Date(sekarang).toISOString())`, ikon jam, `tabular-nums`, diperbarui tiap 15 dtk oleh `setInterval` yang sudah ada) karena badge lama terbaca sebagai posisi pengguna. Info radius dipindah ke baris catatan bawah: *"Lokasi dan perangkat diverifikasi otomatis · area absensi 120 m"*, dan kalimat radius tidak ditampilkan untuk pegawai **Bebas Radius**. Tanpa perubahan logika absen/server. `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **9,13 dtk** | selesai; di-commit **`ac6a8fa`** & di-push 2026-11-14 | 2026-11-14 - Jam WITA menggantikan badge radius |
| I-186 | 2026-11-14 (WITA) | "tulisan kecil area absensi 120 meter dihapus saja, langsung commit dan push" | Menghapus akhiran *"· area absensi 120 m"* pada baris catatan `PanelAbsen` sehingga tersisa *"Lokasi dan perangkat diverifikasi otomatis."*; import `MAX_RADIUS_METERS` yang menjadi tidak terpakai dibuang. Logika absen/server tidak berubah. `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **8,81 dtk** | selesai; di-commit **`43cb31f`** & di-push 2026-11-14 | 2026-11-14 - Hapus teks area absensi |
| I-187 | 2026-11-14 (WITA) | "[Image 1] hadir (koreksi) kita ubah saja menjadi hadir semua meskipun sudah dikoreksi agar rekapan lebih rapih, kemudian warna libur/off ganti menjadi warna abu2 seperti pada gambar ini [Image 2] dengan font arial, kemudian pada footer [Image 3] ubah warnanya menjadi biru seperti warna header kolom." + keputusan: "(1) semua (2) #808080 (3) seragamkan semua warna biru untuk jadwal dan laporan" | `labelStatusKehadiran()` disederhanakan menjadi `baris?.status_kehadiran || '—'` sehingga laporan bulanan, rekapitulasi, dan riwayat menampilkan **Hadir** tanpa akhiran *(Koreksi)*; sel **Libur / Off** menjadi abu **`#808080`** dengan font **Arial** non-miring dan huruf direnggangkan (`letter-spacing: 0.1em`) (libur nasional merah tidak berubah); `.footer-laporan` berwarna biru header **`#1a6fb5`** sehingga footer laporan bulanan dan cetak jadwal F4 seragam. Uji `tests/status.test.js` diperbarui. `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **10,20 dtk** | selesai (kode); di-commit **`b0b96a5`** & di-push 2026-11-14 | 2026-11-14 - Status Hadir, abu libur, footer biru |
| I-188 | 2026-11-14 (WITA) | "sudah berubah tapi warnanya tidak cocok jadi saya tidak suka, kembalikan sesuai warna sebelumnya, kemudain untuk font Libur / Off kembalikan menjadi times nor roman" | Mengembalikan sel **Libur / Off** ke abu **`#cbd5e1`** + font **Times New Roman** (Arial & `#808080` dibatalkan); teks tetap tidak miring dan `letter-spacing: 0.1em`. Label **Hadir** dan footer biru `#1a6fb5` tetap. `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **9,53 dtk** | selesai (kode); di-commit **`b0b96a5`** & di-push 2026-11-14 | 2026-11-14 - Kembalikan abu & font Times |
| I-189 | 2026-11-14 (WITA) | "[Image 1] kemudian untuk menu2 koreksi presensi, dinas,sakir, cuti,izin dan verifikasi, kepala unit dan admin harus membuka menunya untuk melihat apakah ada daftar yang masuk atau tidak, apakah perlu kita buatkan notifikasi atau tampilan di samping menu dengan angka berwarna biru atau merah di sebalah nama menunya..." + keputusan: "(1) biru (2) hanya untuk pengaduan menunggu (3) sidebar aja dulu" | Menambahkan badge jumlah pengajuan menunggu di sidebar: hook `useJumlahMenunggu()` menghitung lewat `count` head-only (pengaduan selain milik sendiri, Dinas & Sakit, Cuti, Izin, perangkat pending), dibatasi RLS, diperbarui tiap 60 dtk dan setiap pindah menu, galat diabaikan. `SidebarAdmin` memetakan menu → angka; `SidebarKepala` memakai kunci `tugas` per item. Badge biru `#1a6fb5`, disembunyikan bila 0, dibatasi `99+`, ada teks `sr-only`. Tanpa migrasi DB. `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **9,60 dtk** | selesai; di-commit **`4ac8edf`** & di-push 2026-11-15 | 2026-11-14 - Badge jumlah menunggu di sidebar |
| I-190 | 2026-11-14 (WITA) | "sudah saya uji dan berhasil, kemudian pada tampilan menu pengaduan presensi, masih ada ui yang berantakan pada portal kepala unit di bagian menu pengaduan [Image 1] , tampilan filter cari pegawai dan unit tidak sejajar dan icon yang berantakan, lakukan analisa dan perbaikan" | Baris filter `/kepala-ruangan/pengaduan` dijadikan satu baris flex (`sm:items-center`), label "Unit" dihapus diganti `aria-label` sehingga input cari dan select sejajar, counter `sm:ml-auto`, ikon `TombolMuatUlang` diganti satu panah melingkar. `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **8,30 dtk** | selesai; di-commit **`4ac8edf`** & di-push 2026-11-15 | 2026-11-14 - Perapian filter Pengaduan Presensi |
| I-191 | 2026-11-15 (WITA) | "[Image 1] kemudian pada cetakan jadwal shift , ubah posisi Periode agar berada di bawah Unit/Instalasi" | `LembarJadwal.jsx` memakai varian `.meta-jadwal` (grid 1 kolom, `gap 0.6mm`, `margin-bottom 1.5mm`) sehingga **Periode** berada tepat di bawah **Unit / Instalasi** pada cetak jadwal F4; laporan presensi bulanan tetap 2 kolom. `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **12,25 dtk** | selesai; di-commit **`4ac8edf`** & di-push 2026-11-15 | 2026-11-15 - Posisi Periode cetak jadwal |

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
  koordinat RSUD AMI baru + migrasi 20) yang di-push 2026-10-27 09:53, serta
  commit `f13301d` (sinkronisasi dokumen audit), dan commit `28a900f`
  (koordinat RSUD AMI diubah lagi + migrasi 21) yang di-push 2026-10-27 09:59,
  serta commit `11d35ab` (custom domain `presisiami.my.id`) yang di-push
  2026-10-27 10:36. Koordinat terbaru
  `-0.23805651650343132, 117.41442516465149` sudah di-commit dan migrasi 21
  **sudah dijalankan di Supabase** (klaim user 2026-10-27 10:39). Commit terbaru
  **`4ac8edf`** (badge jumlah menunggu di sidebar admin & kepala unit, perapian
  filter Pengaduan Presensi, posisi **Periode** di bawah Unit / Instalasi pada
  cetak jadwal F4) di-push 2026-11-15; sebelumnya
  **`fe5418e`** (sinkronisasi dokumen audit `b0b96a5`); sebelumnya
  **`b0b96a5`** (label **Hadir** tanpa *(Koreksi)*, sel **Libur / Off** kembali
  `#cbd5e1` + Times New Roman non-miring dengan huruf renggang, footer laporan
  biru `#1a6fb5`) di-push 2026-11-14;
  sebelumnya **`ac6a8fa`** (badge **Radius 120 m** di header Panel Absen diganti **jam
  berjalan WITA**; info radius dipindah ke catatan bawah) di-push 2026-11-14;
  sebelumnya **`290ff41`** (kembali ke nada konfirmasi **4 nada E5–G#5–B5–E6**; opsi marimba
  `4606459` tetap di riwayat) di-push 2026-11-14; sebelumnya
  **`4bb7388`** (sinkronisasi dokumen audit `4606459`); sebelumnya
  **`4606459`** (nada konfirmasi absen opsi **marimba** G5–B5–D6, harmonik tipis,
  lowpass + kompresor) di-push 2026-11-14; sebelumnya
  **`f56d0c3`** (perbaikan overlay centang yang hilang karena muat ulang Dashboard
  + lonceng konfirmasi 4 nada E5–G#5–B5–E6) di-push 2026-11-14; sebelumnya
  **`091a56e`** (radius absensi **120 meter**: migrasi 44 + `verifikasi_44.sql`,
  sinkron `schema.sql`, `MAX_RADIUS_METERS`, overlay konfirmasi absen berhasil
  `AbsenBerhasil.jsx` + `suaraAbsen.js` + keyframe `index.css`) di-push
  2026-11-14; sebelumnya **`4c1f1b0`** (radius absensi **80 meter**: migrasi 43 +
  `verifikasi_43.sql`, sinkron `schema.sql`, `MAX_RADIUS_METERS`) di-push
  2026-11-13; sebelumnya **`981113e`** (logo aplikasi baru + favicon baru +
  redesign halaman login split
  screen; `LogoRSUD.jsx` diganti `LogoAplikasi.jsx`; kop laporan tidak berubah)
  di-push 2026-11-13; sebelumnya **`ef548cd`** (sinkronisasi dokumen audit commit
  `6ac6f2c`); sebelumnya **`dc12aa8`** (FK audit `jadwal_shift`/`tukar_shift` → `auth.users`, migrasi 41 +
  `verifikasi_41.sql`) di-push 2026-11-12; sebelumnya **`27525d1`** (status Hadir
  setelah koreksi + migrasi 39, laporan libur berwarna
  & header biru, pencarian pegawai pengajuan izin, hak akses `jadwal_kerja` +
  migrasi 40, verifikasi 39–40) di-push 2026-11-12; sebelumnya
  **`d27493e`** (hari libur di laporan bulanan, jenis Izin, warna status laporan,
  migrasi 38 + `verifikasi_38.sql`) dengan commit sinkronisasi dokumen audit
  **`8af366e`** di-push 2026-11-11; sebelumnya commit **`79a1368`** (ringkas teks
  status izin di panel absen; sinkronisasi `8415fb9`) dan **`5e48fa0`** (panel
  absen mengenali status sakit, cuti, dan dinas luar; sinkronisasi `c417a4e`)
  di-push 2026-11-06; sebelumnya commit **`f1511a2`** (laporan bulanan tanpa
  Riwayat Tukar Shift dan kolom Keterangan; kolom Shift untuk pegawai Shift;
  sinkronisasi `5a3f163`) di-push 2026-11-06; sebelumnya `c531502`, `b8ababb`,
  dan `c14ea34` (pengaduan absen masuk/pulang, koreksi jam masuk, batas
  pengaduan sejak go-live, skrip `hapus_data_testing.sql`, perapian UI
  pengaduan; migrasi 35–37) di-push 2026-11-05; sebelumnya `5672fa0` dan
  `0d3a902` (sinkronisasi dokumen & notifikasi Alfa). Commit
  `c1e56f7` (pengaduan absen pulang, migrasi 33) di-push 2026-11-04; sebelumnya
  `de0a389` (tukar shift teraudit, laporan bulanan, cetak jadwal) dan
  `35d28c8` (perapian UI & persetujuan otomatis Super Admin) di-push
  2026-11-04; sebelumnya `17d8efb` (ketahanan halaman/anti white screen, toleransi keterlambatan, jam
  pulang tepat waktu, migrasi 29–30) di-push 2026-11-04; sebelumnya `089b4e7`
  (koreksi presensi shift malam H+1 dan lag ketik alasan koreksi) dan
  `5b9ac5e` (sinkronisasi dokumen audit I-071–I-078) di-push 2026-10-30;
  sebelumnya `260f3c2` (sinkronisasi dokumen audit) dan `1fec429` (pengaman
  formula CSV & `window.opener`, upgrade Vite 7/React Router 7, CSP produksi +
  `Referrer-Policy`) di-commit dan di-push 2026-10-30; sebelumnya `6a7430e`
  (jendela absen baru, jam kerja unit, migrasi 25–27) dan `a9a59ac`
  (Dinas Luar lintas unit + migrasi 23, radius 50 meter + migrasi 24,
  perapian UI mobile dashboard & riwayat).
- **Kepala unit (2026-10-28, sudah di-commit & di-push):** tabel `kepala_unit`
  menjadi sumber kebenaran penugasan (satu unit satu kepala, satu kepala boleh
  banyak unit). Kode, migrasi **22**, `verifikasi_22.sql`, `schema.sql`, dan
  `cleanup_data_uji.sql` sudah masuk repo; **migrasi 22 sudah dijalankan di
  Supabase** (laporan user 2026-10-28); `verifikasi_22.sql` lulus (laporan user
  2026-10-30).
  Kepala ASN memakai metadata `jenis_akun = kepala_asn` dan tidak dicatat di
  `public.pegawai`.
- **Penanda tangan laporan (2026-10-28, sudah di-commit & di-push):** seluruh
  laporan
  presensi bulanan per pegawai ditandatangani **Kasubbag Tata Usaha, Suriami,
  SKM., M.Kes, NIP. 197312302007012011** (konstanta
  `PENANDA_TANGAN_LAPORAN` di `src/config/constants.js`). Nama kepala unit tidak
  lagi dipakai di laporan. Akun kepala ASN tidak menampilkan menu **Kembali ke
  Absensi** (sidebar) maupun tab **Absensi** (navigasi bawah HP).
- **Dinas Luar lintas unit (2026-10-28, sudah di-commit & di-push):** migrasi
  **23**, `verifikasi_23.sql`, dan sinkronisasi `schema.sql` sudah dibuat; migrasi
  23 **sudah dijalankan** di Supabase (laporan user 2026-10-28), `verifikasi_23.sql`
  lulus (laporan user 2026-10-30). Kepala unit dapat mencatat Dinas Luar untuk
  pegawai lintas unit; Sakit/Cuti tetap per unit. Pembuat grup dapat membaca
  seluruh grup dan dokumennya hanya selama masih menjabat kepala unit. FK
  `izin_cuti.dibuat_oleh`/`dibatalkan_oleh` kini mengacu ke `auth.users` agar
  kepala ASN dapat mencatat.
- **Jendela absen (2026-10-29, sudah dijalankan):** absen masuk dibuka **1 jam (60 menit)**
  sebelum jam masuk; absen pulang dibuka 1 menit setelah jam pulang dan ditutup
  **2 jam (120 menit)** setelah jam pulang untuk semua pola kerja, termasuk
  shift malam lintas hari (dihitung pada tanggal selesai). Tombol mati otomatis
  setelah batas; panel memakai baris hari ini sehingga absen masuk tetap bisa,
  dan presensi yang terlewat diselesaikan lewat koreksi Super Admin. Kode ada di
  `src/config/constants.js` (`MENIT_AWAL_ABSEN_MASUK = 60`,
  `MENIT_TUTUP_ABSEN_PULANG = 120`), `src/utils/jadwalAbsen.js`
  (`tutupAbsenPulang`), `src/components/PanelAbsen.jsx`,
  `src/services/attendanceService.js`, serta migrasi **26** +
  `verifikasi_26.sql`. Migrasi **25** sudah dijalankan tetapi aturannya
  digantikan migrasi 26; **migrasi 26 sudah dijalankan** di Supabase (laporan
  user 2026-10-29), `verifikasi_26.sql` lulus (laporan user 2026-10-30).
  `verifikasi_17.sql` dan `verifikasi_25.sql` kini historis.
- **Jam kerja reguler per unit (2026-10-29, sudah dijalankan):** tabel `jam_kerja_unit`
  menyimpan override per unit per hari dengan fallback ke `jam_kerja_reguler`
  global. Seed `ADMISI RAWAT JALAN`: Senin–Jumat **07.00–15.00**, Sabtu–Minggu
  libur; pegawai unit ini yang masih Shift diubah menjadi **Reguler** oleh
  migrasi. `jadwal_kerja` dan `proses_alfa_otomatis` memakai override; hanya
  pegawai pola **Reguler** yang terpengaruh, pegawai Shift tetap memakai
  `shift_master`/`jadwal_shift`. Menu **Jam Kerja Unit** hanya ada di portal
  Super Admin, dengan RLS baca untuk semua pegawai login dan tulis hanya
  `is_superadmin()`. Kode ada di migrasi **27** + `verifikasi_27.sql`,
  `src/pages/admin/JamKerjaUnit.jsx`, dan `src/services/jamKerjaService.js`.
  **Migrasi 27 sudah dijalankan** di Supabase (laporan user 2026-10-29);
  `verifikasi_27.sql` lulus (laporan user 2026-10-30). Tampilan jam Admisi di akun pegawai
  sudah diuji dan berubah (laporan user 2026-10-29).
- **Radius absensi (2026-11-14):** radius geofencing kini **120 meter** di klien
  (`MAX_RADIUS_METERS` di `src/config/constants.js`) dan server. Migrasi **44**
  (`44_radius_120_meter.sql`) mendefinisikan ulang `submit_presensi` — isinya
  sama dengan migrasi 43 kecuali angka radius (`v_jarak > 120`, pesan "radius
  120 meter"). Alasan: area kantor belakang berjarak ±94 m dari titik pusat
  sehingga tidak terjangkau pada 80 m. `schema.sql` disinkronkan dan
  `verifikasi_44.sql` memeriksa radius 120 m dipakai, radius 80 m hilang,
  akurasi 50 m + `bebas_radius` + koordinat tetap. **Migrasi 43** (80 m) dan
  **migrasi 44** (120 m) **sudah dijalankan** di Supabase; `verifikasi_44.sql`
  lulus (laporan user 2026-11-14). File 43 dan `verifikasi_43.sql` kini
  historis; radius 50 m (migrasi 24) bahkan lebih lama.
- **Deploy:** GitHub Pages lewat `.github/workflows/deploy.yml`; URL live
  `https://presisiami.my.id/` (custom domain, DNS di Rumahweb); base path `/`;
  `public/CNAME` berisi `presisiami.my.id`; `www` redirect ke domain utama;
  **Enforce HTTPS aktif** (dicentang di Settings → Pages) dan diverifikasi
  2026-10-30 10:06 WITA: `http://presisiami.my.id` → **301** `https://`,
  `www` (HTTP/HTTPS) → **301** ke apex HTTPS; DNS apex 4 A record GitHub Pages,
  `www` CNAME ke `rantemario905-source.github.io`. UI sempat menampilkan
  "DNS Check in Progress" meski resolusi DNS sudah benar. CSP produksi
  disisipkan sebagai `<meta>` oleh `vite.config.js` hanya saat build (Step 4),
  sedangkan HSTS/`frame-ancestors`/`Permissions-Policy` belum aktif karena
  GitHub Pages tidak mendukung header HTTP kustom. Node CI **22**; secrets
  `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
  Setiap push ke `main` otomatis build + deploy.
- **Go-live (2026-10-30):** user melaporkan seluruh `supabase/verifikasi_*.sql`
  sudah dijalankan, uji manual aman, go-live sudah masuk rencana, dan
  `supabase/cleanup_data_uji.sql` **sudah dijalankan** (transaksi dibersihkan,
  92 pegawai/grup/master shift dipertahankan), dan **data operasional sudah
  dilengkapi** (jadwal dinas serta pemetaan pegawai, laporan 2026-10-30 23:04).
  Tidak ada perubahan kode. **Alfa otomatis sudah diaktifkan** (laporan user
  2026-10-30 23:23) dan cron `presisi-alfa-otomatis` aktif; sisa langkah:
  verifikasi pembentukan Alfa pertama dan pantau pasca go-live.
- **Go-live produksi (2026-11-01):** go-live **sudah dimulai Minggu,
  1 November 2026** dan pegawai sudah melakukan absen masuk serta pulang
  (laporan user 2026-11-01 17:58). Absen di akhir pekan hanya sah untuk pegawai
  shift yang memiliki `jadwal_shift`; pegawai reguler tetap diblokir server
  dengan pesan "Hari libur ... Anda tidak dijadwalkan shift". Sisa pekerjaan:
  verifikasi pembentukan Alfa otomatis pertama setelah jam kerja hari kerja
  pertama dan pemantauan operasional pasca go-live.
- **Paginasi data (2026-10-31, sudah di-commit `22c2bab`):** jadwal tanggal 1–2
  tidak tampil karena `ambilJadwalRentang` membaca seluruh unit tanpa paginasi
  dan terpotong batas **1000 baris** Supabase (total November 2026 = 1064).
  `src/utils/paginasi.js` membaca per halaman 500; `ambilJadwalRentang` kini
  dibatasi `userIds` unit aktif dan diurutkan stabil. Paginasi juga diterapkan
  pada rekap/laporan, koreksi, dan daftar izin. Parser template menolak header
  tanggal tak dikenal dan ringkasan impor menampilkan `dilewati`. Tidak ada
  migrasi DB dan tidak perlu impor ulang; `npm run lint` bersih, `npm test`
  **30/30**, `npm run build` lulus **15,01 dtk** (ulang 10,67 dtk). Uji manual
  user 2026-10-31 12:53: seluruh tanggal termasuk 1–2 November sudah muncul.
- **Pengecualian radius tertentu (2026-11-01):** kolom `pegawai.bebas_radius`
  (default `false`) + audit `bebas_radius_diubah_pada`/`_oleh`, diatur Super
  Admin dari **Data Pegawai**. `submit_presensi` tetap menghitung/menyimpan
  jarak dan menandai `lokasi_masuk/pulang.di_luar_radius`, tetapi hanya menolak
  radius bila flag mati; validasi perangkat, anti Fake GPS, akurasi, jadwal,
  jendela absen, dan aturan hari libur tidak berubah. Klien memakai
  `periksaLokasi(pos, { abaikanRadius })` hanya untuk tampilan; server tetap
  otoritatif. Migrasi **28** dan `verifikasi_28.sql` **sudah dijalankan** di
  Supabase dan verifikasi lulus (laporan user 2026-11-02), sehingga flag
  **Bebas Radius** aktif di server. Sisa: uji manual satu pegawai bebas radius
  absen dari luar area dan satu pegawai biasa tetap ditolak di luar 50 m.
- **Ketahanan halaman (2026-11-03, belum di-commit):** `ErrorBoundary` root
  (`src/main.jsx`), per-rute (`src/App.jsx`), dan per-halaman portal admin/kepala;
  kegagalan chunk dipulihkan otomatis sekali lewat `?perbarui` + guard 30 detik
  (`src/utils/pemulihanHalaman.js`) dan listener `vite:preloadError`. `index.html`
  memiliki fallback statis untuk browser yang gagal memuat JS. Penyebab utama
  white screen: chunk hash lama **404** setelah deploy sementara HTML masih
  di-cache (`Cache-Control: max-age=600` di GitHub Pages). Formatter tanggal di
  `src/utils/format.js` mengembalikan `—` untuk nilai tidak valid.
- **Toleransi keterlambatan & jam pulang (2026-11-04, belum di-commit):**
  keterlambatan dihitung server per menit penuh (`floor`): 08.00.59 = 0 menit,
  08.01 = 1 menit; `hitung_menit_terlambat` memakai aturan sama untuk koreksi.
  Absen pulang dibuka tepat pada jam pulang (16.30) dan ditutup 2 jam setelahnya.
  Kode klien: `MENIT_JEDA_ABSEN_PULANG = 0` di `src/config/constants.js`,
  `bukaAbsenPulang()` menambahkan 0, teks `PanelAbsen.jsx` diperbarui. Server:
  migrasi **29** + `verifikasi_29.sql` (dijalankan user 2026-11-04), dan
  `schema.sql` disinkronkan. Verifikasi lokal: lint bersih, `npm test` **46/46**,
  `npm run build` lulus 8,95 dtk.
- **Backfill menit terlambat (2026-11-04, sudah dijalankan):** migrasi **29**
  tidak mengubah baris presensi lama, sehingga absen 08.00.xx sebelum migrasi
  tetap terbaca terlambat. Migrasi **30** + `verifikasi_30.sql` menghitung ulang
  `menit_terlambat` sejak go-live **1 November 2026** dengan
  `hitung_menit_terlambat()` (floor); hanya baris ber-`jam_masuk`, idempoten.
  Migrasi 30 dan verifikasinya **sudah dijalankan dan berhasil** (laporan user
  2026-11-04 11:22).
- **Perapian UI & ACC otomatis (2026-11-04, belum di-commit):** komponen baru
  `TombolMuatUlang`, `PencarianNama`, `PemilihPeriode`, `TampilanPeriode`, serta
  utilitas `src/utils/kalender.js`. Tombol muat ulang diterapkan di dashboard,
  data pegawai, pengaturan, laporan, verifikasi perangkat, koreksi, pengajuan
  izin, riwayat, dan ErrorBoundary. Filter nama tersedia di Verifikasi Perangkat
  dan Koreksi Presensi (data + audit). Warna jenis: Sakit rose, Dinas Luar
  violet, Cuti teal, dipusatkan di `varianJenisIzin()`/`varianStatusKehadiran()`.
  Migrasi **31** membuat `catat_izin_grup`/`ubah_izin_grup` otomatis memanggil
  `putuskan_izin_grup` saat pemanggil Super Admin, sehingga pengajuan baru atau
  perubahan atas pengajuan menunggu langsung `disetujui`; pengajuan kepala
  ruangan tetap `menunggu`. Verifikasi lokal: `npm run lint` bersih,
  `npm test` **54/54**, dan `npm run build` lulus **9,65 dtk**.
  Migrasi 31 dan `verifikasi_31.sql` **sudah dijalankan** di Supabase
  (laporan user 2026-11-04); ACC otomatis Super Admin aktif.
- **Tukar shift & cetak jadwal (2026-11-04, belum di-commit):** tabel
  `tukar_shift` + RPC `tukar_shift()` (migrasi **32**, `verifikasi_32.sql`,
  sinkron `schema.sql`) menukar dua baris `jadwal_shift` pada satu tanggal
  secara atomik dan mencatat riwayat (shift asal/pengganti, alasan, pelaku).
  Kepala unit hanya untuk unit yang dikelola pada tanggal hari ini/setelahnya;
  Super Admin bebas termasuk tanggal lampau. RLS baca: Super Admin, kepala
  unit, pegawai yang terlibat; tulis hanya lewat RPC. UI: tombol **Tukar
  Shift** + modal di `JadwalShift.jsx`. Laporan bulanan per pegawai tidak
  memakai kolom **Keterangan** dan tidak menampilkan blok **Riwayat Tukar
  Shift**; pegawai **Shift** memiliki kolom **Shift** berisi nama shift hari
  itu (Pagi/Siang/Malam, `—` bila tidak ada jadwal), sedangkan pegawai
  **Reguler** tanpa kolom Shift. Data tukar tetap tersimpan di `tukar_shift`
  untuk audit. Tombol **Cetak Jadwal** mencetak
  F4 landscape berwarna (Pagi sky, Siang amber, Malam indigo) dengan kop dan
  tanda tangan Kepala Ruangan (nama saja) melalui `LembarJadwal.jsx`,
  `utils/jadwalCetak.js`, dan gaya cetak di `index.css`. Verifikasi lokal
  terbaru 2026-11-06: `npm run lint` bersih, `npm test` **68/68**, `npm run
  build` lulus **7,77 dtk**. Migrasi 32 dan `verifikasi_32.sql` **sudah
  dijalankan dan lulus** di Supabase (laporan user 2026-11-04); Tukar Shift
  aktif. Sisa: uji manual tampilan laporan Reguler/Shift, lalu commit/push
  menunggu perintah.
- **Pengaduan presensi (2026-11-04, sudah dijalankan; commit `c1e56f7`):** pegawai yang lupa absen
  pulang mengajukan lewat `/pengaduan` (jam pulang, alasan min. 10 karakter, foto
  bukti JPG/PNG wajib ≤ 1 MB, maks. 7 hari, shift malam H+1). Kepala unit
  memutuskan di `/kepala-ruangan/pengaduan` (jam pulang boleh disesuaikan;
  penolakan wajib catatan; tidak boleh menyetujui pengaduan sendiri). Persetujuan
  mengisi `presensi.jam_pulang`, status **Koreksi**, dan `alasan_koreksi`; Super
  Admin juga dapat memutuskan di **Koreksi Presensi → Riwayat Pengaduan**
  (migrasi **34**, tanpa ACC pengaduan sendiri). Tabel
  `pengaduan_presensi` + RPC `ajukan_pengaduan_presensi`,
  `putuskan_pengaduan_presensi`, `daftar_pengaduan_presensi`,
  `validasi_dokumen_pengaduan` ada di migrasi **33** (+ `verifikasi_33.sql`,
  sinkron `schema.sql`); foto memakai bucket privat `dokumen-izin` prefix
  `pengaduan/<user_id>/`. Verifikasi lokal: lint bersih, `npm test` **67/67**,
  `npm run build` lulus 7,47 dtk. **Migrasi 33 dan `verifikasi_33.sql` sudah
  dijalankan dan diuji** (laporan user 2026-11-04 17:35), dan **migrasi 34 sudah
  dijalankan** (laporan user 2026-11-04) sehingga Super Admin dapat memutuskan
  pengaduan; `verifikasi_34.sql` lulus (laporan user 2026-11-05). Pada laporan
  yang sama user juga mengonfirmasi **B-35** (uji komponen UI baru) dan **B-26**
  (Alfa otomatis pertama) sudah berjalan. *(Diperluas menjadi absen masuk +
  pulang dan koreksi jam masuk lewat migrasi 35–37; lihat butir berikutnya.)*
- **Pengaduan multi-jenis & koreksi jam masuk (2026-11-05):** pengaduan mencakup
  **absen masuk** dan **absen pulang** dalam satu alur (migrasi **35**), dapat
  **mengoreksi jam masuk** yang sudah tercatat hanya ke jam lebih awal dengan
  jendela 60 menit sebelum jam masuk (migrasi **36**), dan dibatasi sejak
  **1 November 2026** agar tanggal lama tanpa baris presensi tidak muncul lagi
  (migrasi **37**). `kandidat_pengaduan_presensi()` menghasilkan daftar kandidat;
  persetujuan absen masuk mengisi/membuat `jam_masuk`, menghitung
  `menit_terlambat`, dan menandai `Hadir` (koreksi jam → `Koreksi`). Foto bukti
  wajib, maks. 7 hari, tidak boleh memutuskan pengaduan sendiri. Kode klien:
  `Pengaduan.jsx`, `FormPengaduan.jsx`, `DaftarPengaduan.jsx`,
  `ModalPutusanPengaduan.jsx`, `pengaduanService.js`. Migrasi 35–37 dan
  `verifikasi_33..37.sql` **sudah dijalankan** (laporan user 2026-11-05).
- **Tabel laporan bulanan (2026-11-06):** kolom **Keterangan** tidak dicetak.
  Pegawai **Reguler** memakai kolom hari/tanggal, jam masuk, jam pulang, status,
  dan terlambat. Pegawai **Shift** mendapat kolom **Shift** setelah hari/tanggal
  berisi nama shift hari itu (`—` bila tidak ada jadwal). Data diambil dari
  `jadwal_shift` sehingga mengikuti hasil Tukar Shift. Helper:
  `labelShift()` dan `labelPolaKerja()` di `src/utils/laporan.js`;
  `bersihkanAlasanKoreksi()` tetap dipakai di layar Riwayat Saya dan Koreksi
  Presensi. Tidak ada migrasi DB. Header tabel (No s/d Terlambat) berlatar biru
  logo RSUD `#1a6fb5` dengan teks putih (`.tabel-laporan thead th`).
- **Panel Absen & status izin (2026-11-06):** `statusTanpaAbsen()` di
  `src/utils/izin.js` membaca baris `presensi` hari ini tanpa `jam_masuk` dengan
  status **Sakit/Cuti/Dinas Luar/Izin**; `PanelAbsen` menampilkan status itu dan
  tidak menampilkan Alfa, pengaduan, tombol absen, badge radius, atau catatan
  lokasi. Shift malam kemarin yang masih terbuka tetap dapat dipulangkan.
  `submit_presensi` dan `proses_alfa_otomatis` sudah menolak/mengecualikan status
  izin, sehingga perbaikan ini hanya di klien dan tidak memerlukan migrasi.
- **Hari libur di laporan bulanan (2026-11-11, sudah di-commit `d27493e`):**
  Laporan Presensi Bulanan merekap seluruh tanggal 1–akhir bulan. Presensi
  nyata tetap ditampilkan; hari libur (akhir pekan/libur unit, hari libur
  nasional, dan shift tanpa jadwal) ditampilkan sebagai satu sel gabungan
  (Jam Masuk–Terlambat, `colSpan={4}`, pola shift `colSpan={5}` mulai kolom
  Shift) berlatar **abu `#cbd5e1`** dengan teks hitam **Times New Roman** non-miring
  (sejak 2026-11-14, I-187/I-188) dan huruf direnggangkan, teks tepat di tengah sel
  (`vertical-align: middle`); libur
  berurutan digabung `rowSpan` sehingga teks hanya muncul sekali:
  **"Libur / Off"** untuk pegawai reguler dan **"Libur Shift / Off"** untuk
  pegawai shift. Hari libur yang diinput admin (`hari_libur`) tampil **merah
  `#dc2626` dengan teks putih berisi nama liburnya** (mis. `Hari Raya Idul
  Fitri`) untuk pegawai reguler; penggabungan `rowSpan` hanya untuk
  `jenisLibur` yang sama (`nasional`/`mingguan`/`shift`). Hari kerja tanpa
  catatan kehadiran berstatus **—**; ringkasan
  kehadiran menambah baris jumlah libur. Data jam kerja unit dan `hari_libur`
  dibaca di klien tanpa migrasi DB.
- **Jenis Izin & warna status laporan (2026-11-11, sudah di-commit `d27493e`):**
  Menu dan tab **Izin** mandiri untuk mencatat ketidakhadiran berizin (satu
  pegawai, bukti file wajib, alur persetujuan sama seperti Sakit/Cuti: pengajuan
  Kepala Unit `menunggu`, Super Admin langsung `disetujui`). Sel status pada
  laporan bulanan kini berwarna per status (Hadir hijau, Alfa merah, Sakit rose,
  Cuti teal, Dinas Luar violet, Izin sky, Koreksi amber, Libur slate). Server
  menolak absensi, proses Alfa otomatis, dan pengaduan presensi pada hari
  berstatus Izin. Migrasi **38** dan `verifikasi_38.sql` **sudah dijalankan dan
  lulus** di Supabase (laporan user 2026-11-11 15:30). Sisa: uji manual alur
  Izin dan warna status laporan.
- **Status Hadir setelah koreksi (2026-11-11, belum di-commit):** presensi yang
  dikoreksi (koreksi manual Super Admin maupun pengaduan disetujui) berakhir
  berstatus **Hadir** dan terhitung hadir di rekapitulasi serta laporan bulanan.
  Migrasi **39** memasang trigger `trg_normalisasi_status_koreksi` (`Koreksi` →
  `Hadir`) dan mem-backfill data lama; jejak koreksi tetap di `dikoreksi_oleh`,
  `alasan_koreksi`, `koreksi_presensi`, dan `pengaduan_presensi`. Tampilan
  memakai `labelStatusKehadiran()` yang **sejak 2026-11-14 (I-187) hanya
  mengembalikan `status_kehadiran`** — baris terkoreksi tampil **Hadir** tanpa
  akhiran `(Koreksi)` agar rekap dan laporan lebih rapi
  (`src/utils/status.js`). Migrasi 39 dan `verifikasi_39.sql` **sudah dijalankan
  dan berhasil** di Supabase (laporan user 2026-11-11 17:40); data lama `Koreksi`
  sudah dinormalkan. Sisa: uji manual satu pengaduan disetujui.
- **Hak akses jadwal untuk kepala unit (2026-11-11, sudah dijalankan):** migrasi
  **40** mendefinisikan ulang `public.jadwal_kerja` agar pengecekan memakai
  `public.bisa_lihat_presensi(p_user)` (Super Admin, diri sendiri, atau kepala
  unit pengelola unit pegawai lewat tabel `kepala_unit`, termasuk multi-unit dan
  kepala ASN). Sebelumnya fungsi memakai aturan lama `pegawai.kepala_ruangan` +
  unit kerja sama, sehingga kepala unit gagal menyetujui pengaduan dengan pesan
  "Anda tidak berhak melihat jadwal pegawai ini." (dipanggil dari
  `putuskan_pengaduan_presensi`). Isi fungsi lain tidak berubah; `schema.sql`
  disinkronkan dan `verifikasi_40.sql` ditambahkan. **Migrasi 40 dan
  `verifikasi_40.sql` sudah dijalankan** di Supabase (laporan user 2026-11-11
  21:20), sehingga kepala unit dapat menyetujui pengaduan pegawai unit yang
  dikelola. Sisa: uji Setujui satu pengaduan dari akun kepala unit.
- **FK audit Tukar Shift (2026-11-12, sudah dijalankan):** Tukar Shift oleh
  kepala unit ASN gagal dengan
  `insert or update on table "jadwal_shift" violates foreign key constraint
  "jadwal_shift_diperbarui_oleh_fkey"` karena `jadwal_shift.dibuat_oleh`,
  `jadwal_shift.diperbarui_oleh` (trigger `set_audit_jadwal_shift`), dan
  `tukar_shift.dibuat_oleh` (RPC `tukar_shift`) diisi `auth.uid()` tetapi ber-FK
  ke `public.pegawai` — akun admin berhasil karena punya baris `pegawai`.
  Migrasi **41** mengarahkan ketiga FK ke `auth.users` (pola `izin_cuti`
  migrasi 23 dan `pengaduan_presensi`), plus `verifikasi_41.sql`; `schema.sql`
  disinkronkan. **Migrasi 41 dan `verifikasi_41.sql` sudah dijalankan** di
  Supabase (laporan user 2026-11-12 09:06). Sisa: uji Tukar Shift dari akun
  kepala unit ASN begitu ada kasus nyata (belum ada testing).
- **Pengaduan absen pulang setelah jendela tutup (2026-11-12, belum dijalankan):**
  kandidat **absen pulang** tidak lagi muncul begitu pegawai absen masuk pagi.
  Migrasi **42** menambahkan helper `public.hitung_batas_absen_pulang(p_tanggal,
  p_jam_mulai, p_jam_selesai)` = jam selesai jadwal **+ 2 jam**
  (`MENIT_TUTUP_ABSEN_PULANG = 120`), shift malam (jam selesai ≤ jam mulai)
  dihitung **H+1**. Helper dipakai `kandidat_pengaduan_presensi()` (kandidat baru
  ditawarkan setelah `now() >= batas`; tanpa jadwal hanya untuk tanggal lampau)
  dan `ajukan_pengaduan_presensi()` (pengajuan jenis `pulang` sebelum batas
  ditolak dengan pesan "Pengaduan absen pulang baru dapat diajukan setelah pukul
  % WITA."). Panel Absen memang sudah memakai `tutupAbsenPulang()`, sehingga
  perbaikan ini menyelaraskan daftar kandidat di halaman Pengaduan. Kandidat
  absen masuk/koreksi jam masuk tidak berubah. `schema.sql` disinkronkan (kedua
  RPC identik dengan migrasi 42) dan `verifikasi_42.sql` ditambahkan.
  **Migrasi 42 belum dijalankan** di Supabase. Verifikasi lokal 2026-11-12:
  `npm run lint` bersih, `npm test` **86/86**, `npm run build` lulus **9,65 dtk**.
  **Galat sintaks sudah diperbaiki (2026-11-12 10:53):** versi pertama migrasi
  memakai `CASE` di dalam kondisi `IF`, dianggap PL/pgSQL sebagai penutup `IF`
  sehingga muncul `ERROR 42601: syntax error at end of input`. Kandidat kini
  menghitung `v_dibuka boolean` lebih dulu. Seluruh isi migrasi 42 diuji di
  Postgres asli (PGlite/WASM): tereksekusi tanpa galat, `verifikasi_42.sql`
  **19/19 `true`**, dan **16 uji perilaku** lulus; `tests/migrasiPengaduan.test.js`
  menjaga regresi ini (`npm test` **91/91**).
  **Migrasi 42 sudah dijalankan** di Supabase dan `verifikasi_42.sql` menghasilkan
  **semua `true`** (laporan user 2026-11-12 11:08), sehingga server kini menolak
  pengaduan absen pulang sebelum batas tutup dan kandidatnya tidak lagi muncul
  sejak pegawai absen pagi. Sisa: uji manual satu pegawai.
- **Logo aplikasi & favicon (2026-11-13, belum di-commit):** logo PRESISI AMI
  `src/assets/logo-aplikasi.png` (591×591, jam biru `#1170B3` + daun hijau
  `#88BD41`) dipakai di header pegawai serta sidebar Super Admin dan Kepala Unit
  lewat komponen `src/components/LogoAplikasi.jsx` (pengganti `LogoRSUD.jsx`).
  Halaman login memakai versi lengkap `src/assets/logo-aplikasi.v2.png`
  (1594×588, memuat "PRESISI AMI" dan "Absensi Online RSUD AMI") di dalam
  **plakat putih** — bukan langsung di atas latar biru, karena tulisan logo
  berwarna biru. Tata letak **split screen**: desktop (≥1024 px) grid
  **`1.3fr : 1`** (kolom biru ±57%) dengan panel kiri `#1170B3` berisi plakat logo
  saja (`w-80`, tanpa teks) dan panel kanan putih berisi kartu form yang memakai
  **bingkai gradasi biru** 3 px (kelas `.kartu-login` di `index.css`); mobile
  memakai pita biru `flex-1` yang mengisi sisa tinggi layar, berisi plakat logo
  (`w-44 sm:w-56`) + teks "Presensi Sistem Informasi RSUD AMI", dengan kartu form
  menumpuk (`-mt-10`) di batas pita. Footer kartu berbunyi "Lupa kata sandi?
  Hubungi Admin/IT". Deskripsi aplikasi dan badge rumah sakit sudah dihapus.
  `h1` "PRESISI AMI" tetap ada sebagai `sr-only` agar struktur judul tidak
  hilang. **Kop laporan tidak berubah** — `KopLaporan.jsx` tetap memakai
  `logo-rsud-ami.png`. Favicon: `public/favicon.ico` (3 ukuran, dari
  `src/assets/favicon.ico`), `favicon-32x32.png` (32×32 transparan), dan
  `apple-touch-icon.png` (180×180, latar putih); `favicon.svg` dihapus.
  `theme-color` menjadi `#1170B3`. Tanpa migrasi DB. Uji headless viewport
  320/375/390/768/1024/1440 px: tanpa luberan horizontal (kartu 288–448 px,
  panel kiri 579–814 px).
- Timezone aplikasi: `Asia/Makassar` (WITA, UTC+8).
- `dist/` dan `.env` sudah diabaikan Git.
