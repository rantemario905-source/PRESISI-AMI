# AGENTS.md — PRESISI AMI

Panduan kerja untuk agen AI di repo ini. **Baca file ini dan `progress.md` sebelum
mulai bekerja.** Dokumen ini juga menjadi **ledger instruksi user** untuk audit.

---

## 1. Ringkasan Proyek

Aplikasi absensi pegawai non-ASN RSUD Aji Muhammad Idris.

- **Frontend:** React 18 + Vite 7 + Tailwind CSS 3 + React Router 7.
- **Backend:** Supabase (Postgres, Auth, Storage, RPC `SECURITY DEFINER`).
- **Fitur inti:** geofencing 50 m, anti Fake GPS, device binding satu perangkat
  aktif per pegawai, presensi shift/reguler dengan jendela waktu (masuk dibuka
  1 jam sebelum jam masuk, pulang dibuka 1 menit setelah dan ditutup 2 jam
  setelah jam pulang), jam kerja reguler khusus per unit, jadwal shift, hari
  libur, keterlambatan, Alfa otomatis, Dinas/Sakit/Cuti, koreksi presensi,
  rekapitulasi, laporan presensi bulanan per pegawai (PDF A4), impor jadwal
  CSV/XLSX, hapus grup shift kosong, serta kepala unit multi-unit dan kepala ASN
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
npm run build        # build produksi (verifikasi utama)
npm run preview      # pratinjau hasil build
```

- **Tidak ada** `lint` maupun `test` di `package.json`. Jangan mengarang perintah.
- Verifikasi kode = `npm run build`.
- Verifikasi DB = jalankan `supabase/verifikasi_*.sql` di Supabase SQL Editor dan
  pastikan semua hasil `true`.
- Skrip bantu (butuh Secret key, jangan pernah di-commit):
  `node scripts/impor-akun.mjs ...`, `node scripts/verifikasi-impor.mjs ...`.

**Urutan migrasi wajib:** `01 → 02 → ... → 27`, satu per satu. Jangan mengulang
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
| Database | `supabase/migrations/01–24` | Skema, RLS, RPC, seed |
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
  `a9a59ac` (Dinas Luar lintas unit + migrasi 23, radius 50 meter + migrasi 24,
  perapian UI mobile dashboard & riwayat) di-commit dan di-push 2026-10-28.
- **Kepala unit (2026-10-28, sudah di-commit & di-push):** tabel `kepala_unit`
  menjadi sumber kebenaran penugasan (satu unit satu kepala, satu kepala boleh
  banyak unit). Kode, migrasi **22**, `verifikasi_22.sql`, `schema.sql`, dan
  `cleanup_data_uji.sql` sudah masuk repo; **migrasi 22 sudah dijalankan di
  Supabase** (laporan user 2026-10-28); `verifikasi_22.sql` belum dikonfirmasi.
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
  belum dikonfirmasi. Kepala unit dapat mencatat Dinas Luar untuk
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
  user 2026-10-29), `verifikasi_26.sql` belum dikonfirmasi.
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
  `verifikasi_27.sql` belum dikonfirmasi. Tampilan jam Admisi di akun pegawai
  sudah diuji dan berubah (laporan user 2026-10-29).
- **Radius absensi (2026-10-28, sudah di-commit & di-push):** radius geofencing
  kini **50 meter**
  di klien (`MAX_RADIUS_METERS`) dan server (migrasi **24** yang mendefinisikan
  ulang `submit_presensi`, plus `schema.sql`). `verifikasi_24.sql` memeriksa
  radius 50 m dipakai dan radius 100 m hilang. Migrasi 24 **sudah dijalankan**
  di Supabase (laporan user 2026-10-28), sehingga server memakai radius 50 m;
  `verifikasi_24.sql` belum dikonfirmasi.
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
- Timezone aplikasi: `Asia/Makassar` (WITA, UTC+8).
- `dist/` dan `.env` sudah diabaikan Git.
