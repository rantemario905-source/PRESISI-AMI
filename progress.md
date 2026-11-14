# Progress PRESISI AMI

> **Cara pakai:** sebelum mulai bekerja, baca **Status Terkini** dan **entri log terakhir**.
> Setelah selesai bekerja, tambahkan entri baru di **Log Kronologis** dan perbarui
> **Status Terkini**. Dokumen ini bersifat **append-only** untuk entri log — jangan
> menghapus atau menulis ulang riwayat.

| Item | Nilai |
|---|---|
| Proyek | PRESISI AMI — Presensi Sistem Informasi Staf Integrasi RSUD Aji Muhammad Idris |
| Stack | React 18 (Vite) + Tailwind CSS 3 + Supabase (Postgres, Auth, Storage, RPC) |
| Repo | `D:\TRAE\PRESISI AMI` (branch `main`) |
| Terakhir diperbarui | 2026-11-14 WITA (radius absensi 120 meter + konfirmasi absen berhasil di-commit & di-push) |
| Dokumen terkait | [`README.md`](README.md), [`AGENTS.md`](AGENTS.md) |

---

## 0. Konvensi

- **Zona waktu:** `Asia/Makassar` (WITA, UTC+8).
- **Format waktu:** `YYYY-MM-DD HH:mm WITA`.
- **Label `(rekonstruksi)`:** entri yang disusun ulang dari README, isi file, dan
  timestamp file — bukan catatan langsung saat kejadian. Jamnya adalah perkiraan
  berdasarkan `LastWriteTime`.
- **Label `(inferred)`:** kesimpulan yang diturunkan dari bukti tidak langsung
  (mis. nama file/mtime), belum dikonfirmasi pemilik proyek.
- **Status kode:** `selesai` / `berjalan` / `belum`.
- **Status DB:** `terpasang` / `belum` / `tidak diketahui` — hanya dapat dipastikan
  lewat Supabase SQL Editor, bukan dari repo.
- **Alur Git:** perubahan **ditahan di working tree** untuk diuji user; `commit`
  dan `push` hanya dilakukan setelah perintah eksplisit. Ini termasuk perubahan
  dokumen audit.
- Satu entri log = satu unit pekerjaan bermakna. Sertakan file yang berubah,
  cara verifikasi, dan risiko/utang teknis.

---

## 1. Status Terkini

**Pekerjaan terbaru (2026-11-14):** **perbaikan overlay centang & lonceng sukses**.
Overlay centang sebelumnya tidak pernah tampil karena `onBerhasil={muatData}` di
`Dashboard.jsx` menyalakan `setMemuatData(true)` sehingga `PanelAbsen` di-unmount
tepat setelah absen sukses (lonceng tetap bunyi karena Web Audio berjalan di luar
React). Kini `muatData` menerima opsi `{ senyap: true }` dan `onBerhasil` memakai
muat ulang senyap, sehingga panel tetap terpasang dan overlay sempat tampil.
Lonceng diubah menjadi chime 4 nada naik E5–G#5–B5–E6 (jeda 100 ms, harmonik 2×
tipis, volume 0.2, denting akhir ±700 ms) agar terdengar seperti konfirmasi
transaksi berhasil dan selaras dengan animasi centang.

**Pekerjaan sebelumnya (2026-11-14):** **radius absensi 120 meter + konfirmasi absen
berhasil**. Radius dinaikkan dari 80 m menjadi **120 meter** karena area kantor
belakang berjarak ±94 m dari titik pusat. Klien memakai
`MAX_RADIUS_METERS = 120`; server memakai migrasi **44**
(`supabase/migrations/44_radius_120_meter.sql`) yang mendefinisikan ulang
`submit_presensi` — isi fungsi identik migrasi 43 kecuali angka radius
(`v_jarak > 120`, pesan "radius 120 meter"). `schema.sql` disinkronkan dan
`verifikasi_44.sql` ditambahkan. Absen sukses kini menampilkan overlay singkat
(`AbsenBerhasil.jsx`: tirai 25 %, centang hijau, satu baris teks, tutup otomatis
±1,4 dtk, bisa ditutup ketuk/`Esc`, hormati `prefers-reduced-motion`) dan nada
lonceng Web Audio (`src/utils/suaraAbsen.js`). Absen gagal tetap Alert merah
menetap dengan auto-scroll. Migrasi **44 sudah dijalankan** dan
`verifikasi_44.sql` lulus (laporan user 2026-11-14); pekerjaan lalu di-commit &
di-push.

**Pekerjaan sebelumnya (2026-11-13 11:43):** **radius absensi 80 meter**. Migrasi
**43** menaikkan radius 50 m → 80 m; migrasi ini **sudah dijalankan** di Supabase
dan `verifikasi_43.sql` lulus, lalu di-commit **`4c1f1b0`** (2026-11-13 11:55).

**Pekerjaan sebelumnya (2026-11-13 11:27):** **commit & push** pekerjaan logo aplikasi
+ favicon baru + redesign halaman login (split screen, panel biru `1.3fr : 1`,
logo `w-80`, kartu berbingkai gradasi, teks mobile "Presensi Sistem Informasi
RSUD AMI") sebagai commit **`981113e`** ke `origin/main`.

**Pekerjaan sebelumnya (2026-11-13 11:17):** **penyesuaian proporsi login**. Desktop:
kolom biru diperlebar dari 50% menjadi **`1.3fr : 1`** (±57% layar), plakat logo
diperbesar `w-64` → **`w-80`** (+25%), padding panel kanan `px-10` → `px-8` agar
kartu tetap lega. Mobile: teks di pita biru menjadi **"Presensi Sistem Informasi
RSUD AMI"**. Logika login tidak berubah; diuji 320/375/390/768/1024/1440 px tanpa
luberan.

**Pekerjaan sebelumnya (2026-11-13 11:08):** **penyempurnaan halaman login**. Mobile:
pita biru dibuat `flex-1` (mengisi tinggi layar) dengan plakat logo + teks
"Sistem Absensi Pegawai RSUD AMI", sehingga tidak ada lagi ruang kosong di bawah
kartu; kartu tetap menumpuk `-mt-10` di batas pita. Desktop: teks di panel kiri
**dihapus**, plakat logo diperbesar (`w-64`), dan kartu form diberi **bingkai
gradasi biru** (3 px, `.kartu-login`). Logika login tidak berubah; diuji visual
320/375/390/768/1024/1440 px tanpa luberan.

**Pekerjaan sebelumnya (2026-11-13 10:35):** **redesign halaman login — split screen**.
Desktop (≥1024 px) memakai dua kolom: panel kiri biru brand `#1170B3` berisi
**plakat putih** dengan `logo-aplikasi.v2.png` (`w-56`) dan teks
"Sistem Absensi Pegawai RSUD AMI", panel kanan putih berisi kartu form
(`max-w-sm`, `xl` 26 rem). Mobile (<1024 px) memakai pita biru di atas dengan
plakat logo (`w-44 sm:w-52`) dan kartu form menumpuk `-mt-10`. Teks footer
menjadi "Lupa kata sandi? Hubungi Admin/IT" dan tetap di bawah kartu. Logika
login tidak berubah. Diuji visual 320/375/390/768/1024/1440 px: tanpa luberan
horizontal.

**Pekerjaan sebelumnya (2026-11-13 10:10):** **redesign halaman login — satu kartu**.
Logo, judul, dan form kini berada dalam **satu kartu putih** (`max-w-md`): logo
v2 di tengah selebar 192 px (HP) / 224 px (desktop), garis pemisah tipis, lalu
"Masuk ke Akun Anda" dan form. Latar gradasi biru muda dipasang **penuh layar**
(menggantikan pita gradasi 256 px). Tanpa perubahan logika. Diuji visual di
viewport 320/375/390/768/1440 px: tidak ada luberan horizontal, kartu 288–448 px.

**Pekerjaan sebelumnya (2026-11-13 09:58):** **kepala halaman login dirapikan**.
Deskripsi "Presensi Sistem Informasi Staf Integrasi" dan badge "RSUD Aji Muhammad
Idris" dihapus; kepala halaman kini hanya berisi logo `logo-aplikasi.v2.png`
dengan lebar **penuh mengikuti kartu login** (`w-full`, `max-w-md` = 448 px).
`h1` "PRESISI AMI" tetap ada sebagai `sr-only`. Import `DESKRIPSI_APLIKASI` dan
`NAMA_RUMAH_SAKIT` dibuang dari `Login.jsx`. Tanpa migrasi DB.

**Pekerjaan sebelumnya (2026-11-13 09:49):** **logo aplikasi PRESISI AMI & favicon
baru**. Logo resmi aplikasi diganti ke `src/assets/logo-aplikasi.png` (ikon jam
biru + daun hijau) di header pegawai serta sidebar Super Admin dan Kepala Unit,
sedangkan `src/assets/logo-aplikasi.v2.png` (versi lengkap dengan tulisan
"PRESISI AMI") dipakai khusus **halaman login**. Favicon tab (`favicon.ico`
multi-ukuran), `favicon-32x32.png`, dan `apple-touch-icon.png` dibuat dari logo
yang sama; `theme-color` menjadi `#1170B3`. **Kop laporan tidak diubah** — tetap
memakai `src/assets/logo-rsud-ami.png`. Komponen `LogoRSUD.jsx` di-rename menjadi
`LogoAplikasi.jsx`. Tanpa migrasi DB. Sisa: uji visual di browser.

**Pekerjaan sebelumnya (2026-11-12 11:20):** **commit & push `6ac6f2c`**. Seluruh
pekerjaan pengaduan absen pulang setelah jendela tutup (migrasi 42), perapian UI
pengaduan/periode/tabel admin, dan dokumen audit sudah di-push ke `origin/main`
(`2fa718a..6ac6f2c`). Sisa: uji manual kandidat pulang sebelum/sesudah batas.

**Pekerjaan sebelumnya (2026-11-12 11:08):** **migrasi 42 dijalankan & lulus
verifikasi**. User melaporkan `42_pengaduan_pulang_setelah_jendela.sql` berhasil
dijalankan di Supabase dan `verifikasi_42.sql` menghasilkan **semua `true`**.
Sejak saat itu kandidat **absen pulang** hanya ditawarkan setelah jendela absen
pulang tertutup (jam selesai jadwal + 2 jam; shift malam H+1) dan server menolak
pengajuan sebelum batas. Sisa: uji manual satu pegawai (kandidat pulang kosong
sebelum jam tutup, muncul sesudahnya).

**Pekerjaan sebelumnya (2026-11-12 10:53):** **perbaikan galat sintaks migrasi 42 +
uji SQL nyata**. Migrasi 42 sempat gagal di Supabase dengan
`ERROR 42601: syntax error at end of input` pada `when v_tutup is not null then
now() >= v_tutup` karena PL/pgSQL membaca `THEN` milik `CASE` di dalam kondisi
`IF` sebagai penutup `IF`. Kandidat kini menghitung `v_dibuka boolean` lebih dulu
lalu `IF ... and v_dibuka`. Migrasi 42 dijalankan **utuh** di Postgres asli
(PGlite/WASM) bersama `verifikasi_42.sql`: seluruh file tereksekusi dan **19
pemeriksaan verifikasi `true`**, plus **16 uji perilaku** lulus (kandidat pulang
muncul/tidak muncul sesuai batas, penolakan server sebelum batas, helper reguler
16.30 → 18.30 dan shift malam 20.00–08.00 → 10.00 H+1, tanggal lampau tetap
muncul, absen masuk tidak terpengaruh). Ditambahkan `tests/migrasiPengaduan.test.js`
(5 uji) agar regresi `CASE`-di-`IF` dan ketidaksinkronan `schema.sql` terdeteksi.
**Migrasi 42 belum dijalankan** di Supabase.

**Pekerjaan sebelumnya (2026-11-12 09:54):** **pengaduan absen pulang baru muncul
setelah jendela absen pulang tertutup**. Sebelumnya baris "absen pulang" di
halaman Pengaduan langsung muncul begitu pegawai absen masuk pagi. Migrasi
**42** menambahkan helper `hitung_batas_absen_pulang()` (jam selesai jadwal +
2 jam, shift malam H+1) yang dipakai `kandidat_pengaduan_presensi()` dan
`ajukan_pengaduan_presensi()`, sehingga kandidat baru ditawarkan setelah batas
dan pengajuan sebelum batas ditolak server. Bila jadwal tidak tersedia,
kandidat pulang hanya muncul untuk tanggal lampau. Sinkron `schema.sql` +
`verifikasi_42.sql`; **migrasi 42 belum dijalankan**.

**Pekerjaan sebelumnya (2026-11-12 09:29):** **perapian UI pengaduan, periode, dan
tabel admin**. `TampilanPeriode` kini satu baris (`09 Nov – 13 Nov 2026`) lewat
helper `formatRentangRingkas()`; daftar pengaduan dibuat padat (satu baris meta,
satu baris waktu, alasan maks. 2 baris dengan garis kiri tipis, footer berisi
info keputusan + **Lihat Foto**/**Tinjau**); filter Unit + Status tab Riwayat
Pengaduan digabung ke toolbar pencarian dan Alert biru dihapus; tabel data admin
memakai kelas `.tabel-data` (pemisah kolom tipis) kecuali Rekapitulasi; tabel
Dinas & Sakit/Cuti/Izin memakai periode satu baris selebar 190 px, padding lebih
rapat, dan keterangan 2 baris. Tanpa perubahan logika/DB.

**Pekerjaan sebelumnya (2026-11-12 09:06):** **migrasi 41 dijalankan**. User
melaporkan `41_audit_jadwal_shift_auth_users.sql` dan `verifikasi_41.sql` sudah
dijalankan, sehingga FK audit `jadwal_shift`/`tukar_shift` kini mengarah ke
`auth.users` dan Tukar Shift oleh kepala unit ASN tidak lagi tertahan FK. Uji
manual belum dilakukan karena belum ada kasus tukar shift yang perlu diuji.
Tidak ada perubahan kode; dokumen audit diperbarui.

**Pekerjaan sebelumnya (2026-11-12 09:05):** **commit & push `dc12aa8`** —
perbaikan FK audit Tukar Shift (migrasi **41**) sudah di-push ke `origin/main`.
Sisa: jalankan migrasi 41 + `verifikasi_41.sql`, lalu uji Tukar Shift dari akun
kepala unit ASN yang sebelumnya gagal.

**Pekerjaan sebelumnya (2026-11-12 09:02):** **perbaikan Tukar Shift kepala unit**
— galat `insert or update on table "jadwal_shift" violates foreign key
constraint "jadwal_shift_diperbarui_oleh_fkey"` muncul karena kolom audit
`jadwal_shift.dibuat_oleh`/`diperbarui_oleh` dan `tukar_shift.dibuat_oleh`
ber-FK ke `public.pegawai`, padahal diisi `auth.uid()`. Kepala unit ASN tidak
punya baris `pegawai`, sehingga gagal (akun admin berhasil karena punya baris).
Dibuat migrasi **41** yang mengarahkan ketiga FK ke `auth.users`, plus
`verifikasi_41.sql`, sinkron `schema.sql` dan README. **Migrasi 41 belum
dijalankan.** Tidak ada perubahan klien.

**Pekerjaan sebelumnya (2026-11-12):** **commit & push `27525d1`** — seluruh
pekerjaan sesi 11 November 2026 (status Hadir setelah koreksi + migrasi 39,
laporan bulanan: sel libur abu & libur nasional merah, header tabel biru,
pencarian pegawai pada pengajuan izin, perbaikan `jadwal_kerja` + migrasi 40)
sudah di-push ke
`origin/main`. Sisa: uji manual Setujui pengaduan dari akun kepala unit dan
pratinjau/cetak laporan.

**Pekerjaan sebelumnya (2026-11-11 21:20):** **migrasi 40 dijalankan**. User
melaporkan `40_jadwal_kerja_hak_akses.sql` dan `verifikasi_40.sql` sudah
dijalankan, sehingga `jadwal_kerja` kini mengenali kepala unit lewat
`kepala_unit` (`bisa_lihat_presensi`). Tidak ada perubahan kode; dokumen audit
diperbarui. Sisa: uji Setujui satu pengaduan dari akun kepala unit.

**Pekerjaan sebelumnya (2026-11-11 21:05):** **perbaikan galat persetujuan pengaduan
kepala unit**. Akar masalah: `jadwal_kerja` masih memakai aturan lama
(`pegawai.kepala_ruangan` + unit kerja sama) semenjak penugasan kepala pindah ke
tabel `kepala_unit` (migrasi 22), sehingga `putuskan_pengaduan_presensi` gagal
dengan pesan "Anda tidak berhak melihat jadwal pegawai ini." Dibuat migrasi
**40** yang mengganti pengecekan menjadi `bisa_lihat_presensi(p_user)`, plus
`verifikasi_40.sql`, sinkron `schema.sql` dan README. **Migrasi 40 belum
dijalankan.**

**Pekerjaan sebelumnya (2026-11-11 20:45):** **libur nasional merah di laporan**.
Hari libur yang diinput admin tampil di laporan bulanan pegawai **reguler**
sebagai sel gabungan **merah `#dc2626` + teks putih** berisi **nama liburnya**.
Akhir pekan/libur unit tetap abu "Libur / Off"; pola shift tidak terpengaruh.
Verifikasi: `npm run lint` bersih, `npm test` **85/85**, `npm run build` lulus
**12,61 dtk**.

**Pekerjaan sebelumnya (2026-11-11 19:25):** **pencarian pegawai pada pengajuan
izin**. Pemilihan pegawai tunggal (Cuti/Sakit/Izin) kini combobox berketik
(memfilter nama/unit, `Enter` memilih hasil pertama, `Esc`/klik luar menutup,
tombol × mengosongkan), dan daftar centang **Dinas Luar** mendapat kolom
`PencarianNama`. Verifikasi: `npm run lint` bersih, `npm test` **83/83**,
`npm run build` lulus **7,36 dtk**.

**Pekerjaan sebelumnya (2026-11-11 19:10):** **header tabel laporan biru**. Latar
`thead` tabel laporan bulanan menjadi biru logo RSUD `#1a6fb5` dengan teks putih
(sebelumnya abu `#f3f4f6`). Verifikasi: `npm run build` lulus **7,22 dtk**.

**Pekerjaan sebelumnya (2026-11-11 19:00):** **abu sel libur diperpekat**. Latar sel
libur laporan bulanan diubah dari `#e5e7eb` menjadi **`#cbd5e1`** (satu tingkat
lebih pekat), teks tetap hitam. Verifikasi: `npm run build` lulus **7,06 dtk**
(perubahan CSS saja; lint & uji tidak terpengaruh).

**Pekerjaan sebelumnya (2026-11-11 18:55):** **warna & cakupan sel libur**. Sel
libur memakai latar **abu-abu `#e5e7eb`** dengan teks **hitam** miring (Times New
Roman, non-bold) dan teks kini benar-benar di tengah sel gabungan
(`vertical-align: middle`). Untuk pola **shift**, sel gabungan dimulai dari
**kolom Shift** (`colSpan=5`); pola reguler tetap 4 kolom (Jam Masuk–Terlambat).
Verifikasi: `npm run lint` bersih, `npm test` **83/83**, `npm run build` lulus
**10,13 dtk**.

**Pekerjaan sebelumnya (2026-11-11 18:35):** **penyempurnaan sel libur laporan**.
Latar sel libur menjadi **hitam pekat** (`#000000`), font **Times New Roman
miring tanpa bold**. Hari libur berurutan (mis. Sabtu+Minggu) kini digabung satu
sel dengan `rowSpan` sehingga teks **"Libur / Off"** / **"Libur Shift / Off"**
hanya muncul sekali; kolom No dan Hari/Tanggal tetap dua baris. Verifikasi:
`npm run lint` bersih, `npm test` **83/83**, `npm run build` lulus **8,08 dtk**.

**Pekerjaan sebelumnya (2026-11-11 18:05):** **baris libur di laporan bulanan**.
Baris libur tidak lagi menampilkan `—` per kolom: sel Jam Masuk sampai Terlambat
digabung menjadi satu sel hitam, teks putih miring **"Libur / Off"** (pegawai
reguler) atau **"Libur Shift / Off"** (pegawai shift). Kolom No, Hari/Tanggal, dan
Shift tetap di luar gabungan. Verifikasi: `npm run lint` bersih, `npm test`
**82/82**, `npm run build` lulus **7,33 dtk**. Sisa: uji manual cetak laporan.

**Pekerjaan sebelumnya (2026-11-11 17:40):** **migrasi 39 dijalankan**. User
melaporkan `39_status_hadir_setelah_koreksi.sql` dan `verifikasi_39.sql` sudah
dijalankan dan berhasil, sehingga presensi terkoreksi berstatus **Hadir** di
server dan data lama `Koreksi` sudah dinormalkan. Sisa: uji manual satu
pengaduan disetujui. Tidak ada perubahan kode; dokumen audit diperbarui.

**Pekerjaan sebelumnya (2026-11-11 17:20):** **status kembali Hadir setelah
koreksi**. Presensi yang dikoreksi (koreksi manual Super Admin maupun pengaduan
yang disetujui) kini tetap berstatus **Hadir** sehingga terhitung hadir di
rekapitulasi dan laporan bulanan; jejak koreksi tetap di `dikoreksi_oleh`,
`alasan_koreksi`, `koreksi_presensi`, dan `pengaduan_presensi`. Tampilan
menuliskan **Hadir (Koreksi)**. Migrasi **39** (trigger normalisasi + backfill)
dan `verifikasi_39.sql` dibuat — **belum dijalankan**. Verifikasi:
`npm run lint` bersih, `npm test` **82/82**, `npm run build` lulus **8,63 dtk**.

**Pekerjaan sebelumnya (2026-11-11 16:20):** **uji manual jenis Izin lulus**. User
melaporkan uji manual berhasil: alur Izin (Kepala Unit `menunggu`, Super Admin
langsung `disetujui`), penolakan absensi/Alfa/pengaduan pada hari Izin, dan warna
status di laporan bulanan berjalan. Menutup **B-45**; tidak ada perubahan kode,
hanya dokumen audit. Sisa: commit/push menunggu perintah.

**Pekerjaan sebelumnya (2026-11-11 16:10):** **rapikan komentar usang**. Lima
komentar kode yang masih menulis daftar jenis lama (tanpa **Izin**) diperbarui:
`src/App.jsx`, `src/utils/izin.js` (2 baris), `src/services/leaveService.js`
(tipe JSDoc `kategori`), dan `src/components/layout/SidebarKepala.jsx`. Tidak ada
perubahan logika. Verifikasi: `npm run lint` bersih, `npm test` **81/81**,
`npm run build` lulus **12,78 dtk**. Sisa: uji manual Izin (B-45) dan
commit/push menunggu perintah.

**Pekerjaan sebelumnya (2026-11-11 15:30):** **verifikasi 38 dijalankan**. User
melaporkan `supabase/verifikasi_38.sql` sudah dijalankan; constraint dan RPC
server untuk jenis **Izin** terkonfirmasi. Sisa hanya uji manual: catat Izin
(Kepala Unit `menunggu`, Super Admin langsung `disetujui`), pastikan absensi/Alfa/
pengaduan ditolak pada hari Izin, lalu cek warna status di laporan bulanan. Tidak
ada perubahan kode; dokumen audit diperbarui (belum di-commit).

**Pekerjaan sebelumnya (2026-11-11 15:25):** **commit & push**. Seluruh pekerjaan
hari libur di laporan bulanan, jenis **Izin**, warna status laporan, dan migrasi
**38** sudah di-commit **`d27493e`** dan di-push ke `origin/main`. Verifikasi:
`npm run lint` bersih, `npm test` **81/81**, `npm run build` lulus **9,07 dtk**.

**Pekerjaan sebelumnya (2026-11-11 15:21):** **migrasi 38 dijalankan**. User
melaporkan `supabase/migrations/38_jenis_izin.sql` sudah dijalankan di Supabase,
sehingga constraint jenis **Izin**, `submit_presensi`, `proses_alfa_otomatis`,
koreksi presensi, dan RPC pengaduan memakai aturan Izin di server. Sisa:
`verifikasi_38.sql` belum dikonfirmasi dan uji manual Izin belum dilakukan.
Tidak ada perubahan kode; dokumen audit diperbarui.

**Pekerjaan sebelumnya (2026-11-11 15:00):** **jenis Izin dan warna status
laporan**. Menu **Izin** tersedia untuk Super Admin dan Kepala Unit dengan alur
sama seperti Sakit/Cuti (satu pegawai, dokumen wajib, persetujuan Super Admin;
pencatatan Super Admin langsung disetujui). Pegawai melihat riwayat Izin pada
tab tersendiri. Sel status pada laporan bulanan kini berwarna: Hadir hijau, Alfa
merah, Sakit rose, Cuti teal, Dinas Luar violet, Izin biru muda, Koreksi amber,
dan Libur abu-abu. Server menolak absensi, Alfa otomatis, dan pengaduan pada hari
berstatus Izin. Migrasi **38** + `verifikasi_38.sql` dibuat; migrasi **38 sudah
dijalankan** (laporan user 2026-11-11 15:21). Verifikasi: `npm run lint` bersih, `npm test` **81/81**, `npm run
build` lulus **8,44 dtk**. Belum di-commit (menunggu perintah).

**Pekerjaan sebelumnya (2026-11-11 12:09):** **hari libur ikut tampil di Laporan
Presensi Bulanan**. Tabel kini memuat seluruh tanggal 1–akhir bulan: presensi
nyata tetap ditampilkan, hari libur (akhir pekan/libur unit, `hari_libur`
nasional, dan shift tanpa jadwal) berstatus **Libur**, sedangkan hari kerja tanpa
catatan berstatus **—**. Ringkasan menambah jumlah hari libur. Data `hari_libur`,
`jam_kerja_reguler`, dan override `jam_kerja_unit` dibaca klien; tidak ada
migrasi DB. Verifikasi: `npm run lint` bersih, `npm test` **78/78**, `npm run
build` lulus **22,26 dtk**. Belum di-commit (menunggu perintah).

**Pekerjaan sebelumnya (2026-11-06 18:28):** **teks status izin di Panel Absen
diringkas**. Judul kartu cukup nama status (**Sakit/Cuti/Dinas Luar**), bukan
“… Hari Ini”; deskripsi “Status … sudah tercatat. Tidak perlu absen hari ini.”
dihapus; pesan **Tidak perlu absen hari ini** hanya tampil satu kali sebagai
aksi. Verifikasi: `npm run lint` bersih, `npm test` **71/71**, `npm run build`
lulus **8,62 dtk**. Di-commit **`79a1368`** dan di-push ke `origin/main`
2026-11-06 18:31.

**Pekerjaan sebelumnya (2026-11-06 17:59):** **Panel Absen tidak lagi menampilkan
Alfa palsu untuk pegawai berstatus Sakit, Cuti, atau Dinas Luar**. Status final
tersebut dibaca dari baris `presensi` hari ini yang tidak memiliki `jam_masuk`;
panel menampilkan judul dan keterangan status, menonaktifkan tombol absen serta
pengaduan, dan menyembunyikan pesan radius/lokasi yang tidak relevan. Shift malam
kemarin yang masih terbuka tetap dapat dipulangkan. Proses Alfa otomatis di
server sudah mengecualikan status izin, sehingga perbaikan ini hanya di klien.
Verifikasi: `npm run lint` bersih, `npm test` **71/71**, `npm run build` lulus
**8,76 dtk**. Di-commit **`5e48fa0`** dan di-push ke `origin/main` 2026-11-06
18:22.

**Pekerjaan sebelumnya (2026-11-06 16:33):** **kolom Keterangan dihapus dan kolom
Shift ditambahkan untuk pegawai pola Shift**. Laporan pegawai **Reguler** memakai
kolom No, Hari/Tanggal, Jam Masuk, Jam Pulang, Status, dan Terlambat. Pegawai
**Shift** mendapat kolom **Shift** setelah Hari/Tanggal berisi nama shift pada
hari itu (Pagi/Siang/Malam); jika tidak ada jadwal tampil `—`. `reportService.js`
kembali mengambil peta `jadwal_shift` (hanya pegawai shift) dan berhenti
mengambil alasan izin/pengaduan; `labelShift()` ditambahkan dan
`keteranganPresensi()` dihapus. Data `jadwal_shift`/`tukar_shift` tetap utuh.
Verifikasi: `npm run lint` bersih, `npm test` **68/68**, `npm run build` lulus
**7,77 dtk**. Di-commit **`f1511a2`** dan di-push ke `origin/main` 2026-11-06
16:57.

**Pekerjaan sebelumnya (2026-11-06 14:29):** **Laporan Presensi Bulanan tanpa kolom
Shift dan tanpa blok Riwayat Tukar Shift**. Tabel laporan waktu itu sama untuk
pegawai Reguler dan Shift: hari/tanggal, jam masuk, jam pulang, status,
terlambat. Data `jadwal_shift` dan `tukar_shift` **tetap tersimpan**; menu
**Tukar Shift** dan auditnya tidak berubah. Query `jadwal`/`tukar` di
`reportService.js`, prop di `LaporanBulanan.jsx`, helper
`labelShift`/`ringkasTukar` + uji, serta CSS blok tukar dibersihkan.
Verifikasi: `npm run lint` bersih, `npm test` **69/69**, `npm run build` lulus
**14,92 dtk**.

**Pekerjaan sebelumnya (2026-11-05 16:18):** **verifikasi 36–37 dikonfirmasi dan
dokumen disinkronkan**. User menyatakan `verifikasi_36.sql` dan
`verifikasi_37.sql` sudah dijalankan. `README.md` (pohon migrasi 01–37 +
verifikasi 34–37 + `hapus_data_testing.sql`), `AGENTS.md` (fakta pengaduan
multi-jenis, koreksi jam masuk, keterangan laporan), dan `progress.md` (status
laporan & migrasi) diperbarui. Sisa parameter `rekanTukar`/`pencatat` yang tidak
terpakai di `tests/laporan.test.js` dibersihkan. Verifikasi: `npm run lint`
bersih, `npm test` **71/71**, `npm run build` lulus **16,32 dtk**.

**Pekerjaan sebelumnya (2026-11-05 15:29):** **judul "Riwayat Tukar Shift Bulan Ini"
disederhanakan menjadi "Riwayat Tukar Shift"** pada laporan bulanan. Verifikasi:
`npm run lint` bersih, `npm test` **71/71**, `npm run build` lulus **7,88 dtk**.

**Pekerjaan sebelumnya (2026-11-05 15:25):** **lebar kolom Riwayat Tukar Shift
disesuaikan**. Akibat `table-layout: fixed` + kolom Alasan 38%, nama rekan tukar
terpotong ke banyak baris. Tabel kembali ke `table-layout: auto`; kolom
**Tanggal, Rekan Tukar, Shift Asal, Shift Pengganti** memakai `white-space: nowrap`
sehingga nama tetap **satu baris** selebar namanya, dan **Alasan** dibatasi 18%
agar tidak mendominasi. Verifikasi: `npm run lint` bersih, `npm test` **71/71**,
`npm run build` lulus **11,64 dtk**.

**Pekerjaan sebelumnya (2026-11-05 15:09):** **kolom "Dicatat Oleh" di Riwayat Tukar
Shift dihapus** pada laporan bulanan; kolom **Alasan** dilebarkan (38%) dengan
`table-layout: fixed` dan proporsi kolom tetap. Data `pencatat` juga tidak lagi
di-query/diringkas. Verifikasi: `npm run lint` bersih, `npm test` **71/71**,
`npm run build` lulus **9,85 dtk**.

**Pekerjaan sebelumnya (2026-11-05 14:59):** **keterangan laporan hanya izin &
pengaduan**. Kolom **Keterangan** Laporan Presensi Bulanan kini hanya memuat
alasan **Sakit/Cuti/Dinas Luar** dan **pengaduan yang disetujui** (diambil dari
`pengaduan_presensi.alasan`, tanpa awalan "disetujui oleh …"). Koreksi manual
Super Admin, label **Alfa**, dan **tukar shift** tidak lagi tampil di Keterangan
(riwayat tukar tetap punya blok sendiri). Penyebab keluhan: baris "Izin Ke BANK
BPD" berstatus `Hadir` berasal dari koreksi manual, bukan izin. Layar **Riwayat
Saya** dan **Koreksi Presensi** tetap menampilkan alasan koreksi, tetapi awalan
persetujuan dan catatan admin dibersihkan lewat `bersihkanAlasanKoreksi()`.
Tanpa migrasi DB. Verifikasi: `npm run lint` bersih, `npm test` **71/71**,
`npm run build` lulus **9,99 dtk**.

**Pekerjaan sebelumnya (2026-11-05 14:29):** **commit & push** `c14ea34` —
pengaduan absen masuk/pulang, koreksi jam masuk, batas pengaduan sejak go-live,
skrip pembersihan data testing, alasan koreksi di laporan bulanan, dan perapian
UI pengaduan. Verifikasi sebelum commit: `npm run lint` bersih, `npm test`
**70/70**, `npm run build` lulus **11,01 dtk**. GitHub Actions otomatis
build + deploy ke `presisiami.my.id`.

**Pekerjaan sebelumnya (2026-11-05 14:13):** **migrasi 37 dijalankan** — user
menjalankan `37_batasi_pengaduan_sebelum_golive.sql` dan kandidat pengaduan
sebelum 1 November 2026 (29–30 Oktober) **sudah hilang** dari halaman Pengaduan;
kandidat data go-live (2–3 November) tetap tampil. Tidak ada perubahan kode.
Sisa: `verifikasi_37.sql` belum dikonfirmasi, dan semua perubahan belum
di-commit.

**Pekerjaan sebelumnya (2026-11-05 14:06):** **batasi pengaduan sebelum go-live** —
migrasi **37** mengganti `kandidat_pengaduan_presensi()`,
`ajukan_pengaduan_presensi()`, dan `putuskan_pengaduan_presensi()` agar hanya
memproses tanggal sejak **1 November 2026**. Ini memperbaiki tampilan Pengaduan
yang masih menampilkan 29–30 Oktober: hari kerja lama itu tidak punya baris
presensi setelah data testing dihapus, sehingga generator kandidat
menganggapnya "belum absen masuk". Data go-live (2–3 November) tetap tampil.
`verifikasi_37.sql` dibuat; **migrasi 37 belum dijalankan**. Verifikasi lokal:
lint bersih, `npm test` **70/70**, `npm run build` lulus **10,46 dtk**.

**Pekerjaan sebelumnya (2026-11-05 13:48):** **skrip hapus data testing sebelum
go-live** — `supabase/hapus_data_testing.sql` menghapus transaksi bertanggal
**sebelum 1 November 2026** (presensi, koreksi, pengaduan, izin, jadwal shift,
tukar shift) dan mempertahankan seluruh data sejak **1 November 2026**, akun
pegawai, grup, master shift, jam kerja, hari libur, pengaturan, serta perangkat
terdaftar. **Belum dijalankan** di Supabase. Tidak ada perubahan kode aplikasi.

**Pekerjaan sebelumnya (2026-11-05 13:42):** **koreksi jam masuk lewat pengaduan** —
jenis pengaduan `masuk` kini juga menangani jam masuk yang **sudah tercatat**
(mis. absen 08.30 padahal datang 07.50). Migrasi **36** mengganti fungsi
`ajukan_pengaduan_presensi`, `putuskan_pengaduan_presensi`, dan
`kandidat_pengaduan_presensi`: jendela validasi disamakan dengan tombol absen
(**60 menit sebelum jam masuk** s/d jam selesai), koreksi hanya boleh ke jam
**lebih awal**, status hasil koreksi `Koreksi`, dan `menit_terlambat` dihitung
ulang. UI menandai baris **"Koreksi jam masuk · tercatat HH:MM"** dan memberi
validasi/penjelasan di form serta modal putusan. `verifikasi_36.sql` dibuat;
**migrasi 36 belum dijalankan** di Supabase. Verifikasi lokal: lint bersih,
`npm test` **70/70**, `npm run build` lulus **9,34 dtk**.

**Pekerjaan sebelumnya (2026-11-05 13:13):** **pengaduan multi-jenis (absen masuk +
pulang)** — Fase 1. `pengaduan_presensi` kini punya `jenis` (`masuk`/`pulang`),
`presensi_id` boleh kosong, dan kolom `jam_masuk_diajukan/disetujui`. RPC
`ajukan_pengaduan_presensi` (5 parameter baru), `putuskan_pengaduan_presensi`
(menambah `p_jam_masuk`), dan `kandidat_pengaduan_presensi()` (7 hari terakhir)
ditambahkan; `daftar_pengaduan_presensi` memuat jenis dan join presensi lewat
`(user_id, tanggal)`. Persetujuan absen masuk mengisi/membuat jam masuk,
menghitung `menit_terlambat`, dan menandai `Hadir` dengan jejak koreksi. UI
pengaduan (pegawai & kepala unit), form, daftar, modal putusan, dan tombol
**Ajukan Pengaduan** di Panel Absen saat Alfa ikut disesuaikan. Migrasi **35** +
`verifikasi_35.sql` dibuat; **belum dijalankan** di Supabase. Verifikasi lokal:
`npm run lint` bersih, `npm test` **70/70**, `npm run build` lulus **8,38 dtk**.

**Pekerjaan sebelumnya (2026-11-05 12:39):** **alasan koreksi di laporan bulanan** —
kolom **Keterangan** pada Laporan Presensi Bulanan kini menampilkan `presensi.alasan_koreksi`
untuk semua baris yang pernah dikoreksi (termasuk status `Hadir` hasil pengaduan),
menggantikan `—`. Alasan ditampilkan penuh (membungkus di kolom). Logika dipindah
ke `keteranganPresensi()` di `utils/laporan.js` dan diuji. Ini mengembalikan sebagian
keputusan I-047 khusus untuk alasan koreksi. Tanpa migrasi DB. Verifikasi:
`npm run lint` bersih, `npm test` **70/70**, `npm run build` lulus **9,13 dtk**.

**Pekerjaan sebelumnya (2026-11-05 12:05):** **perapian panel lupa absen pulang & halaman
pengaduan**. `PanelAbsen` kini menampilkan satu Alert **"Lupa Absen Pulang"** dengan
tombol Ajukan Pengaduan blok penuh (menggantikan dua Alert panjang bertumpuk);
teks alert "Absen Masuk/Pulang Belum Dibuka" dipersingkat. Halaman `/pengaduan`
meringkas deskripsi, menata baris presensi satu baris (tombol **Ajukan** ringkas
di kanan), dan memakai pemilih foto bergaya (dropzone) pada form. Tanpa ubah
logika/server. Verifikasi: `npm run lint` bersih, `npm test` **68/68**,
`npm run build` lulus **9,43 dtk**.

**Pekerjaan sebelumnya (2026-11-05 11:23):** **konfirmasi uji manual pasca go-live** —
user menyatakan `verifikasi_34.sql` sudah dijalankan, tombol Absen Masuk nonaktif
sudah berjalan, pegawai Bebas Radius sudah berjalan, kasus GPS meleset dianggap
kesalahan perangkat pengguna (tidak diungkit lagi), fallback white screen setelah
deploy sudah aman, serta tukar shift + laporan + cetak F4 sudah aman. Dengan ini
seluruh item backlog uji manual (B-28, B-29, B-30, B-31, B-37, B-40, B-41)
ditutup. Tidak ada perubahan kode; dokumen audit ditahan di working tree.

**Pekerjaan sebelumnya (2026-11-04 21:35):** **commit & push** `0d3a902` —
notifikasi Alfa saat absen masuk terlewat. Sebelumnya pada 21:30: saat jam absen
masuk terlewat, panel tidak lagi menjelaskan teknis "Absen Masuk Ditutup". Judul,
deskripsi, dan label tombol kini **"Alfa Hari Ini"** / "Anda tercatat Alfa hari
ini." dengan gradasi header **merah** (rose). Alert teknis dihapus. Verifikasi
lokal: `npm run lint` bersih, `npm test` **68/68**, `npm run build` lulus
**9,35 dtk**.

**Pekerjaan sebelumnya (2026-11-04 21:00):** **commit & push** `07f340e` —
tutup absen masuk tepat jam selesai, ACC pengaduan Super Admin (migrasi 34),
tab berwarna & berikon, serta sinkronisasi dokumen. Verifikasi sebelum commit:
`npm run lint` bersih, `npm test` **68/68**, `npm run build` lulus **7,60 dtk**.
GitHub Actions otomatis build + deploy ke `presisiami.my.id`.

**Pekerjaan sebelumnya (2026-11-04 20:45):** **tab berwarna & berikon** — `TabBar`
kini otomatis memberi ikon dan warna per kategori (Data Presensi sky, Audit Trail
amber, Riwayat Pengaduan violet, Menunggu amber, Disetujui emerald, Ditolak rose,
Dibatalkan slate, Dinas & Sakit rose, Cuti teal) sehingga mudah dibedakan.
Verifikasi lokal: `npm run lint` bersih, `npm test` **68/68**, `npm run build`
lulus **9,41 dtk**.

**Pekerjaan sebelumnya (2026-11-04 20:15):** **migrasi 34 dijalankan** — Super Admin
kini dapat memutuskan pengaduan di server. Sebelumnya pada 19:30: **tutup absen
masuk tepat jam pulang** dan **Super Admin dapat memutuskan pengaduan**. Klien kini memakai
`tutupAbsenMasuk()` sehingga tombol Absen Hadir nonaktif setelah jam selesai
jadwal (server sudah menolak sejak migrasi 29). Migrasi **34** mengizinkan
`is_superadmin()` pada `putuskan_pengaduan_presensi` tanpa cek unit, tetap
melarang memutuskan pengaduan sendiri; tab **Riwayat Pengaduan** di Koreksi
Presensi kini menampilkan tombol Tinjau untuk Super Admin. Verifikasi lokal:
`npm run lint` bersih, `npm test` **68/68**, `npm run build` lulus **8,65 dtk**.
Migrasi 34 **sudah dijalankan** di Supabase (laporan user 2026-11-04); status
`verifikasi_34.sql` **belum dikonfirmasi**.

**Pekerjaan sebelumnya (2026-11-04 18:40):** **pembersihan teks UI bergaya AI slop**
di portal pegawai dan admin. Sapaan dobel Dashboard dihapus, peringatan perangkat
yang tampil dua kali diringkas ke satu kartu, emoji pesan libur dibatasi satu per
pesan, filler di KartuShift/PanelAbsen dihapus, teks developer `.env` di Login
hanya tampil saat mode pengembangan, deskripsi 13 halaman admin dipendekkan jadi
satu baris, pengulangan penjelasan Alfa di Pengaturan Presensi dikompres, Alert
duplikat di Pengajuan Izin dihapus, label `v2.0` dihapus, serta istilah
**Kepala Ruangan → Kepala Unit** dan **Kamu → Anda** diseragamkan. Tanpa
perubahan logika, DB, atau teks resmi laporan bulanan. Verifikasi: `npm run lint`
bersih, `npm test` **67/67**, `npm run build` lulus **12,33 dtk**. Di-commit
`fe2d0e6` dan di-push ke `origin/main`.

**Pekerjaan sebelumnya (2026-11-04 17:12):** **Pengaduan Presensi** (absen pulang
terlewat) untuk semua pola kerja: pegawai mengajukan lewat `/pengaduan` dengan
jam pulang, alasan min. 10 karakter, dan **foto bukti wajib** (JPG/PNG maks.
1 MB) dalam **7 hari**; kepala unit menyetujui/menolak di
`/kepala-ruangan/pengaduan` (jam pulang boleh disesuaikan, tolak wajib catatan,
tidak boleh menyetujui pengaduan sendiri); persetujuan mengisi `jam_pulang` dan
status **Koreksi**; Kepala Unit memutuskan di
**Koreksi Presensi → Riwayat Pengaduan** dan Super Admin dapat menyetujui/menolak
dari tab yang sama (tidak dapat memutuskan pengaduan sendiri). Kode memakai RPC `SECURITY DEFINER`
dan tabel `pengaduan_presensi` (migrasi **33**) dengan foto di bucket privat
`dokumen-izin` prefix `pengaduan/<user_id>/`. Verifikasi lokal: `npm run lint`
bersih, `npm test` **67/67**, `npm run build` lulus **7,47 dtk**. **Migrasi 33
dan `verifikasi_33.sql` sudah dijalankan serta diuji** (laporan user
2026-11-04 17:35). Pada laporan yang sama user juga mengonfirmasi **B-35**
(komponen UI baru) dan **B-26** (Alfa otomatis pertama) sudah berjalan.
  Perubahan kode sudah **di-commit `c1e56f7`** dan di-push ke `origin/main`.

**Ringkasan:** seluruh fitur inti (Fase 1–8 + penyempurnaan UI navigasi) sudah ada
di kode, live di GitHub Pages, dan **login, verifikasi perangkat, serta absensi
sudah berhasil diuji**. Pekerjaan terbaru: **migrasi 15 (hapus finalisasi jadwal)**,
**migrasi 16 (satu perangkat aktif per pegawai)**, **migrasi 17 (jendela waktu
absen: masuk dibuka 20 menit sebelum jam masuk, pulang dibuka 1 menit setelah jam
pulang)**, dan **migrasi 18 (hapus grup kosong; grup sistem "Belum ditentukan"
disembunyikan bila tanpa pegawai)** beserta penyesuaian frontend dan dokumen —
migrasi 15–18 sudah di-commit dan di-push (15–17 `c21ecf9`, 18 `6343111`), serta
**migrasi 18 sudah dijalankan di Supabase** (terlihat dari pesan server baru).
Penyempurnaan terbaru: **favicon dan apple-touch-icon memakai logo resmi**, label
**Super Admin** di header sidebar dihapus, **label dashboard disederhanakan**
(“Dashboard”, “Total Pegawai”, “Non ASN”, tanggal aktual, dan “Perlu Verifikasi”),
serta **tombol Keluar dipindahkan ke menu avatar** di kanan atas (responsif HP)
dengan **animasi buka/tutup halus**, serta **animasi gulir submenu sidebar** Super Admin, dan **perapian jarak menu
sidebar** Super Admin/kepala ruangan plus **latar biru muda transparan pada
seluruh halaman portal** Super Admin dan Kepala Ruangan, serta **posisi tombol
aksi per halaman** (kembali ke kanan dan ditempatkan pada kartu/baris yang
relevan) dan **subtitle rumah sakit di topbar dihapus**. Pekerjaan terbaru
(2026-10-27): **laporan presensi bulanan per pegawai** untuk Super Admin dan
Kepala Ruangan dengan kop dua logo (Kutai + RSUD, Times New Roman), tabel harian,
ringkasan kehadiran, tanda tangan Kepala Ruangan kanan bawah, footer
“Dicetak melalui PRESISI-AMI”, serta **migrasi 19** agar kepala ruangan dapat
membaca presensi unitnya. **Migrasi 19 dan verifikasi 19 sudah berhasil
dijalankan** (laporan user 2026-10-27 01:03). Pekerjaan terbaru
(2026-10-27): **titik koordinat RSUD AMI diperbarui** menjadi
`-0.23805651650343132, 117.41442516465149` di klien (`src/config/constants.js`)
dan server (migrasi **21** yang mendefinisikan ulang `submit_presensi`, plus
`schema.sql`), disertai `supabase/verifikasi_21.sql`. **Migrasi 20 dan
verifikasi 20 sudah berhasil dijalankan** (laporan user 2026-10-27 09:39);
migrasi **21 sudah dijalankan** di Supabase (klaim user 2026-10-27 10:39).
Pekerjaan terbaru (2026-10-28): **kepala unit multi-unit & kepala ASN** — tabel
`kepala_unit` menjadi sumber kebenaran penugasan (satu unit satu kepala, satu
kepala boleh banyak unit), kepala ASN memakai metadata `jenis_akun = kepala_asn`
tanpa baris `pegawai`, RPC `profil_saya()`/penugasan kepala, halaman **Kepala
Unit** di portal Super Admin, pemilih unit aktif di portal kepala, serta policy
RLS berbasis `unit_dikelola()`. **Migrasi 22 sudah dijalankan** di Supabase
(laporan user 2026-10-28). Pekerjaan terbaru (2026-10-28): **penanda tangan
laporan diseragamkan** menjadi Kasubbag Tata Usaha, Suriami, SKM., M.Kes
(NIP. 197312302007012011) untuk seluruh pegawai, serta **menu “Kembali ke
Absensi” disembunyikan bagi kepala ASN** (sidebar dan navigasi bawah HP).
Pekerjaan terbaru (2026-10-28): **Dinas Luar lintas unit** — kepala unit dapat
mencatat Dinas Luar untuk pegawai lintas unit, sedangkan Sakit/Cuti tetap per
unit. Pembuat grup dapat membaca seluruh grup dan dokumennya selama masih
menjabat kepala unit; akses otomatis dicabut saat jabatan berakhir. FK
`dibuat_oleh`/`dibatalkan_oleh` dipindah ke `auth.users` agar kepala ASN dapat
mencatat. Migrasi **23** **sudah dijalankan** (laporan user 2026-10-28).
Pekerjaan terbaru (2026-10-28): **radius absensi diubah menjadi 50 meter**
(klien `MAX_RADIUS_METERS`, migrasi **24** yang **sudah dijalankan**,
`schema.sql`, `verifikasi_24.sql`), disertai perapian UI mobile dashboard dan
riwayat. Pekerjaan terbaru (2026-10-29): **batas akhir absen pulang** versi pertama
(migrasi **25**, sudah dijalankan) kemudian **digantikan aturan sosialisasi**
(migrasi **26**, sudah dijalankan; laporan user 2026-10-29): **absen masuk dibuka 1 jam sebelum jam
masuk** dan **absen pulang ditutup 2 jam setelah jam pulang** untuk semua pola
kerja (reguler dan shift, termasuk shift malam lintas hari). Setelah batas
lewat, tombol Absen Pulang mati, panel memakai baris hari ini sehingga absen
masuk tetap dapat dilakukan, dan presensi yang terlanjur belum ditutup
diselesaikan lewat koreksi Super Admin. Aturan diterapkan di klien
(`MENIT_AWAL_ABSEN_MASUK = 60`, `MENIT_TUTUP_ABSEN_PULANG = 120`,
`tutupAbsenPulang`, pemisahan presensi hari ini/kemarin) dan server (migrasi
**26**). Pekerjaan terbaru: **jam kerja reguler khusus per unit** (migrasi
**27**, sudah dijalankan; laporan user 2026-10-29). Unit `ADMISI RAWAT JALAN` memakai Senin–Jumat
07.00–15.00 dan libur Sabtu–Minggu tanpa mengubah jam global unit lain; pegawai
unit tersebut yang masih Shift dikonversi menjadi Reguler oleh migrasi, dan
tersedia menu **Jam Kerja Unit** khusus Super Admin; **tampilan jam Admisi di
akun pegawai sudah diuji dan berubah** (laporan user 2026-10-29). **Seluruh
verifikasi SQL 09–27 sudah dijalankan dan uji manual dinyatakan aman, serta
go-live sudah masuk rencana** (laporan user 2026-10-30). Data uji **sudah
dibersihkan** (laporan 2026-10-30 23:01) dan **data operasional sudah
dilengkapi** — jadwal dinas dan pemetaan pegawai (laporan 2026-10-30 23:04),
serta **Alfa otomatis sudah diaktifkan** dan cron aktif (laporan 2026-10-30
23:23). **Go-live sudah dieksekusi pada Minggu, 1 November 2026** dan pegawai
sudah mulai absen masuk serta pulang (laporan user 2026-11-01 17:58). Yang
tersisa: verifikasi pembentukan Alfa otomatis pertama setelah jam kerja hari
kerja pertama dan pemantauan pasca go-live. **Step 2 keamanan** (pengaman formula CSV dan
pemisahan `window.opener` dokumen) sudah diuji user tanpa error, lalu **Step 3
keamanan** menaikkan dependensi ke **Vite 7.3.7**, **`@vitejs/plugin-react`
5.2.0**, dan **React Router 7.18.5** dengan Node CI **22**; build produksi dan
pratinjau SPA lulus serta `npm audit` bersih. **Step 4 keamanan** menambahkan
**CSP produksi** lewat `<meta>` (disisipkan plugin Vite saat build), **meta
`Referrer-Policy`**, dan catatan **Enforce HTTPS**; uji headless memastikan
script inline diblokir dan aplikasi tetap render. **Enforce HTTPS GitHub Pages
sudah aktif dan terverifikasi** (HTTP apex/`www` 301 ke HTTPS). Step 2–4 sudah
**di-commit `1fec429` dan di-push** ke `origin/main` 2026-10-30; deploy GitHub
Actions berjalan otomatis. Cloudflare (header HTTP penuh) belum dipakai.
Pekerjaan terbaru (2026-10-30 23:45): **B-8** menambahkan **ESLint** dan **24 uji
dasar** memakai `node:test` (CSV, format, geofencing, izin, jadwal absen), serta
menjalankan lint/test sebelum build di CI; **B-9** mengganti nilai asli
`.env.example` dengan placeholder. Perubahan ini sudah **di-commit `42cb317`**
dan di-push ke `origin/main` pada 2026-10-31 00:09. Pekerjaan terbaru
(2026-10-31 12:37): **memperbaiki jadwal tanggal 1–2 November yang tidak tampil
setelah impor**. Akar masalahnya adalah `ambilJadwalRentang` membaca seluruh
unit tanpa paginasi sehingga terpotong batas **1000 baris** Supabase (total
November 2026 = 1064); data di DB sudah benar. Ditambahkan
`src/utils/paginasi.js` (halaman 500), jadwal dibatasi ke pegawai unit aktif,
paginasi diterapkan pada rekap/laporan/koreksi/izin, parser template menolak
header tak dikenal, dan ringkasan impor menampilkan `dilewati`. Tidak ada
migrasi DB dan tidak perlu impor ulang; `npm run lint` bersih, `npm test`
**30/30**, `npm run build` lulus **15,01 dtk** (ulang 10,67 dtk). Uji manual
user 2026-10-31 12:53: seluruh tanggal termasuk 1–2 November sudah muncul.
Perbaikan ini sudah **di-commit `22c2bab`** dan di-push ke `origin/main` pada
2026-10-31 13:20. Pesan libur hijau dan pemberitahuan perangkat berbeda
(`PanelAbsen`, `KartuStatusPerangkat`) sudah **di-commit `f332efb`** dan
di-push ke `origin/main` pada 2026-10-31. **Go-live produksi dimulai
Minggu, 1 November 2026**: pegawai sudah melakukan absen masuk dan pulang
(laporan user 2026-11-01 17:58); yang dipantau tersisa adalah pembentukan Alfa
otomatis pertama pada hari kerja pertama setelah jam kerja berakhir.
Pekerjaan terbaru (2026-11-01 18:13): **pengecualian radius untuk pegawai
tertentu** (mis. dokter spesialis yang bertugas dari rumah) — flag **per
pegawai** `bebas_radius` (default `false`) yang hanya dapat diaktifkan Super
Admin lewat **Data Pegawai**; `submit_presensi` tetap menghitung/menyimpan
jarak tetapi hanya menolak radius 50 m bila flag mati. Validasi perangkat,
anti Fake GPS, akurasi GPS, jadwal, jendela absen, serta aturan Sabtu/Minggu/hari
libur **tidak berubah**, sehingga pegawai lain tetap terkena radius 50 m.
Migrasi **28** dan `verifikasi_28.sql` **sudah dijalankan** di Supabase dan
verifikasi lulus (laporan user 2026-11-02), sehingga flag **Bebas Radius**
aktif di server; sisa hanya uji manual absen dari luar area.

Pekerjaan terbaru (2026-11-03): **koreksi presensi shift malam otomatis H+1** —
helper `susunWaktuKoreksi` mempertahankan timestamp asli bila jam tidak diubah
(termasuk absen masuk setelah tengah malam) dan menggeser jam pulang ke hari
berikutnya bila tidak lebih lambat dari jam masuk, sehingga koreksi shift malam
(mis. masuk 20.31, pulang 08.00) tidak lagi ditolak. Form koreksi menampilkan
pratinjau tanggal/jam dan penanda **H+1**. `npm run lint` bersih, `npm test`
**38/38**, `npm run build` lulus **8,29 dtk**.

Penyempurnaan terbaru (2026-11-03 13:29): **lag mengetik alasan koreksi
diperbaiki**. Penyebab: state form berada di komponen induk sehingga setiap
ketikan merender ulang seluruh daftar (mobile + desktop), dan setiap baris
membuat `Intl.DateTimeFormat` baru (benchmark 1.600 formatter baru = 271 ms vs
cache 4 ms). Perbaikan: formatter di-cache level modul, form dipisah ke
`FormKoreksiPresensi.jsx`, dan daftar dipisah ke `DaftarPresensiKoreksi.jsx`
dengan `React.memo`. `npm run lint` bersih, `npm test` **38/38**, `npm run build`
lulus **8,37 dtk**.

Pekerjaan terbaru (2026-11-03 15:55): **ketahanan halaman terhadap white screen**.
Akar masalah: tidak ada Error Boundary sehingga error render atau kegagalan
mengunduh chunk halaman memutihkan seluruh aplikasi; GitHub Pages mengirim
`Cache-Control: max-age=600` untuk `index.html`/aset dan mengembalikan **404**
untuk chunk hash lama, sehingga perangkat yang masih memegang HTML lama gagal
membuka menu setelah deploy. Perbaikan: `ErrorBoundary` di root, per-rute, dan
per-halaman portal; pemulihan otomatis sekali dengan penanda `?perbarui` +
guard 30 detik; listener `vite:preloadError`; fallback statis di `index.html`;
formatter tanggal mengembalikan `—` untuk nilai tidak valid; pembacaan
`localStorage` unit kepala diamankan. `npm run lint` bersih, `npm test`
**46/46**, `npm run build` lulus **7,78 dtk** (ulang 14,87 dtk).

Pekerjaan terbaru (2026-11-04 11:11): **toleransi keterlambatan dan jam pulang
tepat waktu**. Keterlambatan kini dihitung per menit penuh (`floor`): masuk
pukul 08.00.59 masih 0 menit, sedangkan 08.01 dihitung 1 menit (sebelumnya
08.00.01 sudah dianggap 1 menit karena `ceil`). Absen pulang dibuka tepat pada
jam pulang jadwal (16.30 sudah bisa), bukan 1 menit setelahnya, dan tetap
ditutup 2 jam setelah jam pulang. Perubahan diterapkan di klien
(`MENIT_JEDA_ABSEN_PULANG = 0`, teks Panel Absen, uji) dan server lewat migrasi
**29** + `verifikasi_29.sql`. `npm run lint` bersih, `npm test` **46/46**,
`npm run build` lulus **8,95 dtk**.

Penyusulan terbaru (2026-11-04 11:18): **data presensi lama belum ikut
dihitung ulang**. User melaporkan pegawai yang absen masuk pukul 08.00 kemarin
masih terbaca terlambat meskipun migrasi dan verifikasi 29 sudah dijalankan.
Penyebab: migrasi 29 hanya mengubah fungsi untuk absensi/koreksi berikutnya,
sedangkan baris `presensi` lama menyimpan `menit_terlambat` hasil aturan `ceil`.
Perbaikan data disiapkan di migrasi **30** (hitung ulang sejak go-live
`2026-11-01`, hanya baris ber-`jam_masuk`, idempoten) + `verifikasi_30.sql`;
migrasi 30 **sudah dijalankan dan berhasil** (laporan user 2026-11-04 11:22).

Pekerjaan terbaru (2026-11-04 11:46 WITA, belum di-commit): **perapian UI dan
persetujuan otomatis Super Admin**. Ditambahkan komponen bersama
`TombolMuatUlang`, `PencarianNama`, `PemilihPeriode`, dan `TampilanPeriode`
serta utilitas `src/utils/kalender.js`; tombol muat ulang diterapkan di
dashboard, data pegawai, pengaturan, laporan, verifikasi perangkat, koreksi,
pengajuan izin, riwayat, dan ErrorBoundary; filter nama tersedia di Verifikasi
Perangkat dan Koreksi Presensi; pemilih/tampilan periode dipakai di form dan
daftar Cuti/Dinas-Sakit. Warna jenis izin dipusatkan di
`varianJenisIzin()`/`varianStatusKehadiran()` (Sakit rose, Dinas Luar violet,
Cuti teal). Migrasi **31** membuat `catat_izin_grup`/`ubah_izin_grup` langsung
menyetujui pengajuan yang dicatat atau diubah Super Admin, sehingga presensi
terkait langsung ditandai; pengajuan kepala ruangan tetap `menunggu`.
`npm run lint` bersih, `npm test` **54/54**, dan `npm run build` lulus
**9,65 dtk**. Migrasi **31** dan `verifikasi_31.sql` **sudah dijalankan** di
Supabase dan lulus (laporan user 2026-11-04 13:42), sehingga pengajuan Super
Admin langsung `disetujui`.

Pekerjaan terbaru (2026-11-04 14:31 WITA, belum di-commit): **tukar shift
teraudit dan cetak jadwal shift**. Ditambahkan tombol **Tukar Shift** di menu
Jadwal Shift (kepala unit/Super Admin): modal memilih tanggal + dua pegawai,
server menukar dua baris `jadwal_shift` secara atomik lewat RPC `tukar_shift`
dan mencatat riwayat ke tabel baru `tukar_shift`. Laporan bulanan per pegawai
kini punya kolom **Shift** (shift terjadwal) dan blok **Riwayat Tukar Shift**
(tanggal, rekan, shift asal→pengganti, alasan, dicatat oleh); keterangan baris
tukar otomatis berisi “Tukar dengan &lt;nama&gt;”. Ditambahkan pula tombol
**Cetak Jadwal** di menu Jadwal Shift: lembar **F4 landscape** berwarna per
shift (Pagi sky, Siang amber, Malam indigo) dengan kop instansi dan tanda
tangan **Kepala Ruangan** (nama saja). Migrasi **32** (`32_tukar_shift.sql`) +
`verifikasi_32.sql` **sudah dijalankan dan lulus** (laporan user 2026-11-04),
sehingga **Tukar Shift** dan riwayatnya aktif di server. `npm run lint`
bersih, `npm test` **62/62**, dan `npm run build` lulus **16,38 dtk** (uji
lanjutan 14,14 dtk).

| Aspek | Status | Bukti |
|---|---|---|
| Kode aplikasi | Selesai sampai Fase 10 + UI navigasi + migrasi 15-38 | `src/`, `supabase/migrations/01-38` |
| Commit Git | **`d27493e`** - hari libur laporan, jenis Izin, warna status, migrasi 38; sebelumnya `8415fb9` sinkronisasi dokumen audit | `git log` |
| Perubahan lokal | **Bersih** - semua perubahan sudah di-commit dan di-push (`main...origin/main`) | `git status` |
| Migrasi DB 01–18 | **Sudah dijalankan** — verifikasi 09–18 lulus | laporan user 2026-10-30 |
| Migrasi DB 19 | **Sudah dijalankan** di project yang benar | laporan user 2026-10-27 01:03 |
| Migrasi DB 20 | **Sudah dijalankan** — koordinat server migrasi 20 aktif | laporan user 2026-10-27 09:39 |
| Migrasi DB 21 | **Sudah dijalankan** (klaim user 2026-10-27 10:39) | `supabase/migrations/21_koordinat_rsud.sql` |
| Migrasi DB 22 | **Sudah dijalankan**; verifikasi 22 lulus (laporan user 2026-10-30) | `supabase/migrations/22_kepala_unit_multi_unit.sql`, `verifikasi_22.sql` |
| Migrasi DB 23 | **Sudah dijalankan**; verifikasi 23 lulus (laporan user 2026-10-30) | `supabase/migrations/23_dinas_luar_lintas_unit.sql`, `verifikasi_23.sql` |
| Migrasi DB 24 | **Sudah dijalankan**; radius server 50 m; verifikasi 24 lulus (laporan user 2026-10-30) | `supabase/migrations/24_radius_50_meter.sql`, `verifikasi_24.sql` |
| Migrasi DB 25 | **Sudah dijalankan** (laporan user 2026-10-29); aturannya digantikan migrasi 26 | `supabase/migrations/25_batas_absen_pulang.sql`, `verifikasi_25.sql` |
| Migrasi DB 26 | **Sudah dijalankan**; jendela absen baru berlaku di server; verifikasi 26 lulus (laporan user 2026-10-30) | `supabase/migrations/26_batas_absen_baru.sql`, `verifikasi_26.sql` |
| Migrasi DB 27 | **Sudah dijalankan**; jam kerja per unit dan menu **Jam Kerja Unit** aktif; verifikasi 27 lulus (laporan user 2026-10-30) | `supabase/migrations/27_jam_kerja_unit.sql`, `verifikasi_27.sql` |
| Migrasi DB 28 | **Sudah dijalankan**; verifikasi 28 lulus (laporan user 2026-11-02); flag **Bebas Radius** aktif di server | `supabase/migrations/28_bebas_radius.sql`, `verifikasi_28.sql` |
| Migrasi DB 29 | **Sudah dijalankan** (laporan user 2026-11-04) — toleransi keterlambatan per menit penuh dan jam pulang tepat waktu; verifikasi 29 dijalankan user | `supabase/migrations/29_toleransi_terlambat_dan_jam_pulang.sql`, `verifikasi_29.sql` |
| Migrasi DB 30 | **Sudah dijalankan** (laporan user 2026-11-04) — `menit_terlambat` data lama sejak 1 November 2026 sudah dihitung ulang | `supabase/migrations/30_hitung_ulang_menit_terlambat.sql`, `verifikasi_30.sql` |
| Migrasi DB 31 | **Sudah dijalankan**; `verifikasi_31.sql` lulus (laporan user 2026-11-04) — pengajuan Sakit/Dinas Luar/Cuti yang dicatat atau diubah Super Admin langsung `disetujui` dan presensi ditandai; pengajuan kepala ruangan tetap `menunggu` | `supabase/migrations/31_auto_setujui_superadmin.sql`, `verifikasi_31.sql` |
| Migrasi DB 32 | **Sudah dijalankan**; `verifikasi_32.sql` lulus (laporan user 2026-11-04) — tabel `tukar_shift`, RPC `tukar_shift()`, dan RLS aktif; **Tukar Shift** berfungsi dan riwayat tukar tersimpan untuk audit | `supabase/migrations/32_tukar_shift.sql`, `verifikasi_32.sql` |
| Migrasi DB 33 | **Sudah dijalankan**; `verifikasi_33.sql` lulus (laporan user 2026-11-04) — tabel `pengaduan_presensi`, RPC pengaduan, dan RLS aktif | `supabase/migrations/33_pengaduan_presensi.sql`, `verifikasi_33.sql` |
| Migrasi DB 34 | **Sudah dijalankan** (laporan user 2026-11-04) — Super Admin dapat menyetujui/menolak pengaduan; `verifikasi_34.sql` lulus (laporan user 2026-11-05) | `supabase/migrations/34_superadmin_putuskan_pengaduan.sql`, `verifikasi_34.sql` |
| Migrasi DB 35 | **Sudah dijalankan** (laporan user 2026-11-05) — pengaduan absen masuk + pulang aktif | `supabase/migrations/35_pengaduan_masuk.sql`, `verifikasi_35.sql` |
| Migrasi DB 36 | **Sudah dijalankan** — koreksi jam masuk aktif; `verifikasi_36.sql` lulus (laporan user 2026-11-05) | `supabase/migrations/36_koreksi_jam_masuk.sql`, `verifikasi_36.sql` |
| Migrasi DB 37 | **Sudah dijalankan** — kandidat pengaduan sebelum 1 November 2026 hilang; `verifikasi_37.sql` lulus (laporan user 2026-11-05) | `supabase/migrations/37_batasi_pengaduan_sebelum_golive.sql`, `verifikasi_37.sql` |
| Migrasi DB 38 | **Sudah dijalankan** (laporan user 2026-11-11 15:21) — jenis **Izin** aktif di server; `verifikasi_38.sql` lulus (laporan user 2026-11-11 15:30) | `supabase/migrations/38_jenis_izin.sql`, `verifikasi_38.sql` |
| Migrasi DB 39 | **Sudah dijalankan** (laporan user 2026-11-11 17:40) — trigger `trg_normalisasi_status_koreksi` aktif dan data lama `Koreksi` dinormalkan; `verifikasi_39.sql` lulus | `supabase/migrations/39_status_hadir_setelah_koreksi.sql`, `verifikasi_39.sql` |
| Migrasi DB 40 | **Sudah dijalankan** (laporan user 2026-11-11 21:20) — `jadwal_kerja` memakai `bisa_lihat_presensi()` sehingga kepala unit (multi-unit/kepala ASN) dapat melihat jadwal pegawai unit yang dikelola; `verifikasi_40.sql` dijalankan | `supabase/migrations/40_jadwal_kerja_hak_akses.sql`, `verifikasi_40.sql` |
| Migrasi DB 41 | **Sudah dijalankan** (laporan user 2026-11-12 09:06) — FK audit `jadwal_shift.dibuat_oleh`, `jadwal_shift.diperbarui_oleh`, dan `tukar_shift.dibuat_oleh` mengarah ke `auth.users`; `verifikasi_41.sql` dijalankan. Uji Tukar Shift kepala unit ASN belum ada kasus | `supabase/migrations/41_audit_jadwal_shift_auth_users.sql`, `verifikasi_41.sql` |
| Migrasi DB 42 | **Sudah dijalankan** (laporan user 2026-11-12 11:08) — kandidat & pengajuan **absen pulang** baru aktif setelah jendela absen pulang tertutup (jam selesai jadwal + 2 jam, shift malam H+1); helper `hitung_batas_absen_pulang()`; `verifikasi_42.sql` **semua `true`**. Sisa: uji manual kandidat pulang sebelum/sesudah batas | `supabase/migrations/42_pengaduan_pulang_setelah_jendela.sql`, `verifikasi_42.sql` |
| Migrasi DB 43 | **Sudah dijalankan** (laporan user 2026-11-13) — radius absensi 80 m pada `submit_presensi`; digantikan migrasi 44 | `supabase/migrations/43_radius_80_meter.sql`, `verifikasi_43.sql` |
| Migrasi DB 44 | **Sudah dijalankan** (laporan user 2026-11-14) — radius absensi **120 m** pada `submit_presensi` (isi sama dengan migrasi 43, hanya angka radius); `verifikasi_44.sql` lulus | `supabase/migrations/44_radius_120_meter.sql`, `verifikasi_44.sql` |
| Data uji | **Sudah dibersihkan ulang setelah uji** — transaksi dihapus, 92 pegawai/grup/master shift dipertahankan | `supabase/cleanup_data_uji.sql`, laporan user 2026-10-30 23:01 |
| Data testing sebelum go-live | **Sudah dijalankan** (laporan user 2026-11-05) — transaksi sebelum 1 November 2026 terhapus; data go-live utuh | `supabase/hapus_data_testing.sql` |
| Data operasional | **Lengkap** — jadwal dinas dan pemetaan pegawai sudah diisi | laporan user 2026-10-30 23:04 |
| Go-live | **Sudah berjalan sejak Minggu, 1 November 2026** — pegawai absen masuk dan pulang; absen akhir pekan hanya untuk pegawai shift yang dijadwalkan | laporan user 2026-11-01 17:58 |
| Koordinat RSUD AMI | **Ada di kode** — `-0.23805651650343132, 117.41442516465149` di klien dan schema | `src/config/constants.js`, `supabase/schema.sql`, migrasi 21 |
| Radius absensi | **120 meter aktif** — klien `MAX_RADIUS_METERS = 120`; server migrasi 44 sudah dijalankan (sebelumnya 80 m dari migrasi 43) | `src/config/constants.js`, `supabase/migrations/44_radius_120_meter.sql`, `verifikasi_44.sql` |
| Skrip `supabase/verifikasi_*.sql` | **Verifikasi 09-42 dijalankan user** (42 dilaporkan 2026-11-12, semua `true`); migrasi 43 dijalankan 2026-11-13; **migrasi 44 + `verifikasi_44.sql` dijalankan & lulus** (laporan user 2026-11-14) | laporan user, `supabase/verifikasi_44.sql` |
| Build produksi | **Lulus** - base `/` **6,74 dtk** (audit I-142/I-143); sebelumnya 7,77 dtk (kolom Shift pegawai shift) | `npm run build` 2026-11-11 |
| Dependensi frontend | **Diperbarui & di-commit** — Vite 7.3.7, `@vitejs/plugin-react` 5.2.0, React Router 7.18.5; Node CI 22; lockfile sinkron; `npm audit` 0 kerentanan | `package.json`, `package-lock.json`, `.github/workflows/deploy.yml` |
| Header keamanan (CSP) | **Ada di kode & di-commit** — CSP produksi via `<meta>`: `script-src 'self'`, `connect-src` self + `*.supabase.co`, `frame-src 'none'`, `form-action 'self'`, `object-src 'none'`, `base-uri 'self'`; meta referrer; hanya saat build. Uji headless: script inline diblokir, halaman render | `vite.config.js`, `index.html` |
| Batas GitHub Pages | **Enforce HTTPS aktif & terverifikasi** (2026-10-30 10:06 WITA): HTTP apex dan `www` **301** ke HTTPS/apex. Namun HSTS, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, dan `Permissions-Policy` tetap belum aktif karena memerlukan header HTTP; Cloudflare/proxy opsional | `curl -I` HTTP/HTTPS apex & `www`, 2026-10-30 |
| Kepala unit multi-unit | **Ada di kode** — tabel `kepala_unit` (satu unit satu kepala, boleh multi-unit), halaman **Kepala Unit**, pemilih unit aktif di portal kepala, kepala ASN tanpa baris `pegawai`, RPC `profil_saya()`/`simpan_kepala_unit()`, policy `unit_dikelola()` | migrasi 22, `KepalaUnit.jsx`, `kepalaUnitService.js`, `AuthContext.jsx`, `authService.js`, `PortalKepalaLayout.jsx` |
| Jendela waktu absen | **Ada di kode** — masuk dibuka 1 jam sebelum; pulang dibuka tepat pada jam pulang hingga 2 jam setelahnya (semua pola, termasuk shift malam) | migrasi 29, `PanelAbsen.jsx`, `jadwalAbsen.js` |
| Toleransi keterlambatan | **Aktif di server (migrasi 29 dijalankan 2026-11-04)** — per menit penuh: 08.00.59 = 0 menit, 08.01 = 1 menit; koreksi memakai aturan sama; data lama sudah dihitung ulang (migrasi 30) | migrasi 29–30, `hitung_menit_terlambat`, `submit_presensi` |
| Jam kerja per unit | **Ada di kode** — override jam reguler per unit dengan fallback global; ADMISI RAWAT JALAN 07.00–15.00 Senin–Jumat; menu Super Admin; tampilan jam di akun pegawai sudah diuji dan berubah | migrasi 27, `JamKerjaUnit.jsx`, `jamKerjaService.js`, `jadwal_kerja`, `proses_alfa_otomatis` |
| Pengecualian radius pegawai tertentu | **Aktif** — flag `pegawai.bebas_radius` per pegawai (Super Admin); pegawai tersebut tetap pegawai reguler biasa dan hanya berbeda karena boleh absen di mana saja. `submit_presensi` tetap mencatat jarak dan hanya melewati penolakan radius bila flag aktif; validasi lain tidak berubah; opsi `abaikanRadius` hanya untuk tampilan | migrasi 28, `verifikasi_28.sql`, `geofencing.js`, `PanelAbsen.jsx`, `DataPegawai.jsx`, `pegawaiService.js` |
| Koreksi presensi shift malam | **Ada di kode & sudah di-commit `089b4e7`** — jam pulang otomatis digeser ke H+1 bila tidak lebih lambat dari jam masuk; timestamp asli dipertahankan bila jam tidak diubah; form menampilkan pratinjau tanggal/jam dan penanda H+1 | `src/utils/koreksiPresensi.js`, `src/components/admin/FormKoreksiPresensi.jsx`, `tests/koreksiPresensi.test.js` |
| Ketahanan halaman (anti white screen) | **Ada di kode & sudah di-commit `17d8efb`** — ErrorBoundary root/rute/halaman portal, muat ulang otomatis sekali saat chunk gagal (`?perbarui` + guard 30 detik), listener `vite:preloadError`, fallback statis di `index.html`, formatter tanggal aman untuk nilai rusak, `localStorage` kepala diamankan | `src/components/ErrorBoundary.jsx`, `src/utils/pemulihanHalaman.js`, `src/main.jsx`, `src/App.jsx`, `PortalAdminLayout.jsx`, `PortalKepalaLayout.jsx`, `index.html`, `format.js` |
| Keamanan ekspor CSV | **Ada di kode & di-commit** — sel string berawalan `=`, `+`, `-`, `@`, tab, CR, atau LF diberi apostrof sebelum escaping (ekspor Rekapitulasi) | `src/utils/csv.js` |
| Buka dokumen izin | **Ada di kode & di-commit** — tab dokumen memutus `window.opener` dan memakai `location.replace` agar tidak membuka halaman Supabase dengan konteks pembuka | `src/pages/IzinSaya.jsx`, `src/pages/admin/PengajuanIzin.jsx` |
| Hapus grup kosong | **Ada di kode** — semua grup 0 pegawai; "Belum ditentukan" (akun sistem) disembunyikan bila kosong | migrasi 18, `GrupShift.jsx` |
| Bilah progres | **Ada di kode** — bilah biru muda di atas layar saat navigasi, login, logout, dan muat ulang profil | `ProgressContext.jsx`, `BilahProgres.jsx`, `PengamatRute.jsx` |
| Logo aplikasi | **Ada di kode** — logo PRESISI AMI (`logo-aplikasi.png`) di header pegawai serta sidebar admin/kepala unit; versi lengkap (`logo-aplikasi.v2.png`) khusus halaman login; favicon tab & apple-touch-icon dari logo yang sama. Kop laporan tetap `logo-rsud-ami.png` | `src/assets/logo-aplikasi.png`, `src/assets/logo-aplikasi.v2.png`, `LogoAplikasi.jsx`, `favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png` |
| Dashboard admin | **Ada di kode** — “Dashboard”, “Total Pegawai” (Non ASN), “Hadir Hari Ini” dan “Sudah Absen Pulang” dengan tanggal aktual, “Perlu Verifikasi” | `DashboardUtama.jsx`, `SidebarAdmin.jsx`, `PortalAdminLayout.jsx` |
| Menu akun | **Ada di kode** — avatar kanan atas membuka menu **Keluar** dengan animasi buka/tutup di portal pegawai, Super Admin, dan kepala ruangan; tampil di desktop dan HP | `MenuAkun.jsx`, `BarAtas.jsx`, `PortalAdminLayout.jsx`, `PortalKepalaLayout.jsx`, `tailwind.config.js` |
| Animasi sidebar | **Ada di kode** — submenu grup Super Admin dibuka/tutup dengan animasi gulir; grup aktif terbuka otomatis; submenu tertutup tidak dapat difokuskan | `SidebarAdmin.jsx` |
| Kerapatan sidebar | **Ada di kode** — jarak menu Super Admin dan Kepala Ruangan dirapatkan (rapat sedang, target sentuh 38–40 px) | `SidebarAdmin.jsx`, `SidebarKepala.jsx` |
| Latar Dashboard | **Ada di kode** — gradasi biru muda transparan pada seluruh halaman portal Super Admin dan Kepala Ruangan | `PortalAdminLayout.jsx`, `PortalKepalaLayout.jsx` |
| Aksi halaman | **Ada di kode** — tombol aksi kembali di kanan; aksi spesifik dipindah ke header kartu daftar, kartu Tambah Hari Libur (Tahun), baris tab Koreksi/Verifikasi, dan atas kotak filter Rekapitulasi | `KepalaHalaman.jsx`, `TabBar.jsx`, `DataPegawai.jsx`, `GrupShift.jsx`, `MasterShift.jsx`, `HariLibur.jsx`, `KoreksiPresensi.jsx`, `VerifikasiPerangkat.jsx`, `PengajuanIzin.jsx`, `Rekapitulasi.jsx` |
| Subtitle topbar | **Ada di kode** — portal Super Admin tanpa subtitle; portal Kepala Ruangan hanya nama unit kerja | `PortalAdminLayout.jsx`, `PortalKepalaLayout.jsx` |
| Laporan bulanan per pegawai | **Ada di kode** - Super Admin pilih unit, kepala unit memakai unit aktif; satu pegawai atau semua pegawai unit; seluruh tanggal 1-akhir bulan tampil, hari libur berstatus **Libur**, sel Status berwarna per status (termasuk Izin dan Libur); kop dua logo satu baris, tabel harian tanpa kolom Keterangan, pegawai Shift memakai kolom Shift, penanda tangan Kasubbag Tata Usaha (Suriami, SKM., M.Kes; NIP. 197312302007012011), footer bertanggal tanpa jam; cetak PDF A4 portrait | migrasi 19 & 22, `LaporanBulanan.jsx`, `reportService.js`, `utils/laporan.js`, `components/laporan/*`, `index.css` |
| Penanda tangan laporan | **Ada di kode** — Kasubbag Tata Usaha, Suriami, SKM., M.Kes, NIP. 197312302007012011 untuk semua pegawai | `src/config/constants.js`, `BlokTandaTangan.jsx` |
| Menu kepala ASN | **Ada di kode** — “Kembali ke Absensi” (sidebar) dan tab Absensi (navigasi bawah HP) disembunyikan bila `sumber_akun = kepala_asn` | `PortalKepalaLayout.jsx`, `SidebarKepala.jsx` |
| Dinas Luar lintas unit | **Ada di kode** — kepala unit dapat memilih pegawai lintas unit untuk Dinas Luar; Sakit/Cuti tetap per unit; pembuat grup membaca grup + dokumennya selama menjabat; akses dicabut otomatis saat jabatan berakhir; kepala ASN dapat mencatat (FK ke `auth.users`) | migrasi 23, `PengajuanIzin.jsx`, `leaveService.js`, `pegawaiService.js`, `verifikasi_23.sql` |
| Lint/unit test | **Tersedia** - ESLint (`npm run lint`) bersih dan **81 uji** `node:test` (`npm test`) lulus | `eslint.config.js`, `tests/`, `package.json`, `.github/workflows/deploy.yml` |
| Paginasi data | **Ada di kode & di-commit `22c2bab`** — helper halaman 500; jadwal shift dibatasi unit aktif; rekap/laporan, koreksi, dan daftar izin memakai paginasi; parser template menolak header tak dikenal; uji manual user 2026-10-31 lulus (tanggal 1–2 muncul) | `src/utils/paginasi.js`, `shiftService.js`, `reportService.js`, `correctionService.js`, `leaveService.js`, `templateJadwal.js` |
| Alfa otomatis | **Aktif mulai 1 November 2026** — diaktifkan lewat Pengaturan Presensi; **pg_cron 1.6.4 aktif** dan job `presisi-alfa-otomatis` terdaftar/aktif tiap 15 menit; menunggu pembentukan Alfa pertama (1 November 2026 hari Minggu, sehingga Alfa reguler diperkirakan muncul Senin 2 November) | migrasi 12/27, `PengaturanPresensi.jsx`, `supabase/jadwal_alfa.sql`, laporan user 2026-10-30 |
| Deploy GitHub Pages | **Aktif** — `https://presisiami.my.id/` live dengan base `/`; `www` redirect ke domain utama; Enforce HTTPS aktif, HTTP apex/`www` **301** ke HTTPS (diverifikasi 2026-10-30) | workflow run `40439173719` sukses |
| Supabase Auth | **Diklaim sudah diperbarui** ke domain baru (Site URL + Redirect URLs) | laporan user 2026-10-27 10:39 |
| Uji login live | **Lulus** — Super Admin (desktop) + pegawai (mobile) | Laporan user 2026-10-25 13:37 |
| Uji perangkat & absensi | **Lulus** — verifikasi perangkat, radius, akurasi, duplikasi | Laporan user 2026-10-25 14:04 |
| Verifikasi & uji go-live | **Lulus** — seluruh `verifikasi_*.sql` dijalankan, uji manual aman, go-live masuk rencana | laporan user 2026-10-30 22:13 |

**Pekerjaan terakhir:** mengembalikan tata letak `KepalaHalaman` ke judul
kiri/aksi kanan, lalu memindahkan tombol aksi per halaman ke header kartu daftar,
kartu **Tambah Hari Libur** (Tahun), baris tab **Koreksi**/**Verifikasi**, dan
atas kotak filter **Rekapitulasi**; subtitle **RSUD Aji Muhammad Idris** tetap
dihapus dari topbar (2026-10-26; **sudah di-commit dan di-push** ke
`origin/main` pada 2026-10-27 00:03). Aset
`src/assets/logo kutai kartanegara.png` ikut di-commit untuk pekerjaan kop RSUD
AMI berikutnya dan belum dipakai di UI.

**Pekerjaan terakhir (2026-10-27, sudah di-commit `fc772c1`):** menambahkan halaman
**Laporan Bulanan per Pegawai** untuk Super Admin (`/superadmin-portal/laporan`)
dan Kepala Ruangan (`/kepala-ruangan/laporan`). Lembar A4 portrait memuat kop
Pemerintah Kutai Kartanegara + RSUD AMI (dua logo, Times New Roman), identitas
pegawai, tabel harian tanpa kolom jarak, ringkasan kehadiran, tanda tangan
Kepala Ruangan kanan bawah, dan footer “Dicetak melalui PRESISI-AMI” + nomor
halaman. Aset `logo kutai kartanegara.png` di-rename menjadi
`logo-kutai-kartanegara.png` dan dipakai sebagai logo kop kiri. Migrasi **19**
menambahkan `bisa_lihat_presensi(uuid)` + policy baca presensi unit untuk kepala
ruangan.

**Pekerjaan terakhir (2026-10-27 11:41 WITA, belum di-commit):** merapikan
laporan presensi bulanan. Kop RSUD dibuat satu baris dengan `white-space: nowrap`
dan font bold 12/13/14pt; identitas pegawai menjadi grid 2x2; ringkasan tanpa
`Izin`; kolom Keterangan hanya diisi alasan Sakit/Cuti/Dinas Luar, label `Alfa`,
dan `—` untuk Hadir/Koreksi (alasan koreksi tidak dicetak); footer hanya
menampilkan tanggal cetak tanpa jam. `npm run build` lulus 7,49 dtk.

**Pekerjaan terakhir (2026-10-27 12:04 WITA, belum di-commit):** tinggi kedua
logo kop disamakan menjadi 20 mm sehingga logo RSUD tampil sebanding dengan logo
Kutai. Label identitas pegawai tidak lagi memakai lebar tetap; nilai langsung
mengikuti titik dua (`Nama Pegawai: ...`). `npm run build` lulus 8,95 dtk.

**Pekerjaan terakhir (2026-10-27 12:10 WITA, belum di-commit):** ikon menu
**Laporan Bulanan** di sidebar Super Admin dibedakan dari **Rekapitulasi
Laporan**. Laporan Bulanan memakai ikon dokumen, sedangkan Rekapitulasi tetap
memakai ikon grafik. `npm run build` lulus 6,78 dtk.

**Pekerjaan terakhir (2026-10-28 09:11 WITA, belum di-commit):** **kepala unit
multi-unit & kepala ASN**. Tabel `kepala_unit` menjadi sumber kebenaran (satu
unit satu kepala, satu kepala boleh banyak unit); kepala ASN memakai metadata
`jenis_akun = kepala_asn` tanpa baris `public.pegawai`; `profil_saya()` menjadi
sumber profil (termasuk `unit_dikelola`); Super Admin mendapat halaman **Kepala
Unit**; portal kepala menampilkan pemilih unit aktif; seluruh policy/RPC
memakai `unit_dikelola()`/`bisa_kelola_unit()`; Data Pegawai tidak lagi mengubah
status kepala; laporan bulanan memakai nama kepala unit dari RPC. Migrasi **22**
dan `verifikasi_22.sql` disiapkan tetapi **belum dijalankan** di Supabase.
`npm run build` lulus 8,72 dtk.

**Pekerjaan terakhir (2026-10-28, sudah di-commit & di-push):** seluruh
perubahan kepala unit multi-unit & kepala ASN di-commit dan di-push atas perintah
user. `npm run build` lulus 6,77 dtk. User melaporkan migrasi **22 sudah
dijalankan** pada 2026-10-28.

**Pekerjaan terakhir (2026-10-28 11:42 WITA, belum di-commit):** atas arahan
direktur, **semua laporan presensi pegawai ditandatangani Kasubbag Tata Usaha,
Suriami, SKM., M.Kes (NIP. 197312302007012011)**, menggantikan nama kepala unit.
Selain itu, tombol **Kembali ke Absensi** di sidebar dan tab **Absensi** di
navigasi bawah HP **disembunyikan untuk akun kepala ASN** (`sumber_akun =
kepala_asn`); kepala non-ASN dan pegawai biasa tidak berubah. `npm run build`
lulus (lihat log entri terbaru).

**Pekerjaan terakhir (2026-10-28, lanjutan setelah force close, belum di-commit):**
pekerjaan I-055 dipastikan sudah lengkap di working tree, lalu dirapikan dengan
menghapus helper `namaKepalaUnit` di `src/utils/laporan.js` yang tidak lagi
dipakai setelah penanda tangan laporan diseragamkan. `npm run build` lulus
**6,95 dtk**. Seluruh perubahan sudah di-commit `69cc041` dan di-push ke
`origin/main` atas perintah user.

**Pekerjaan terakhir (2026-10-30 22:13 WITA):** user melaporkan seluruh
`supabase/verifikasi_*.sql` sudah dijalankan, pengujian manual aman, dan
**go-live sudah masuk rencana**. Tidak ada perubahan kode; hanya pembaruan
dokumen audit. Pemeriksaan live: `https://presisiami.my.id/` HTTP 200 dengan
meta CSP dan Referrer terpasang.

**Pekerjaan terakhir (2026-10-30 23:01 WITA):** user melaporkan
`supabase/cleanup_data_uji.sql` sudah dijalankan. Data transaksi dibersihkan
dan data master (92 pegawai, grup, serta master shift) dipertahankan. Tidak ada
perubahan kode; hanya pembaruan dokumen audit.

**Pekerjaan terakhir (2026-10-30 23:04 WITA):** user melaporkan data operasional
sudah dilengkapi, meliputi jadwal dinas dan pemetaan pegawai. Tidak ada
perubahan kode; hanya pembaruan dokumen audit.

**Pekerjaan terakhir (2026-10-30 23:23 WITA):** user mengaktifkan **Alfa
otomatis** lewat Pengaturan Presensi dengan **`alfa_mulai` 1 November 2026**.
Screenshot Supabase menunjukkan job `presisi-alfa-otomatis` aktif tiap 15 menit
dan `succeeded`; pada 23:30 user mengonfirmasi ekstensi **`pg_cron` 1.6.4 aktif**
di project ABSENSI PEGAWAI. Status cron selesai; tinggal menunggu pembentukan
Alfa pertama. Tidak ada perubahan kode; hanya pembaruan dokumen audit.

**Pekerjaan terakhir (2026-10-31 12:37 WITA, di-commit `22c2bab`):** memperbaiki
jadwal dinas tanggal 1–2 November 2026 yang tidak tampil setelah impor. Data
sudah masuk database (total November 1064 baris); UI terpotong karena
`ambilJadwalRentang` mengambil seluruh unit tanpa paginasi dan batas Supabase
1000 baris. Perbaikan: helper paginasi halaman 500, filter jadwal ke pegawai
unit aktif, paginasi rekap/laporan/koreksi/izin, validasi header template, dan
ringkasan `dilewati`. Tidak perlu impor ulang atau migrasi DB. `npm run lint`
bersih, `npm test` 30/30, `npm run build` lulus 15,01 dtk. Uji manual user
2026-10-31 12:53: seluruh tanggal termasuk 1–2 November sudah muncul.

**Langkah berikutnya yang disarankan (go-live):**
1. Tidak ada tindakan cron lagi sebelum 1 November; biarkan job berjalan.
2. Setelah 1 November: verifikasi pembentukan Alfa pertama. **1 November 2026
   adalah hari Minggu** (dikoreksi user 2026-10-31; terverifikasi `Get-Date` →
   `Sunday`), sehingga pegawai reguler baru diperkirakan tercatat Alfa pada
   **Senin 2 November 2026** setelah jam kerja berakhir; pegawai shift yang
   dijadwalkan pada akhir pekan dapat menyusul setelah shiftnya selesai:
   `select tanggal, count(*) from public.presensi where status_kehadiran = 'Alfa' group by tanggal order by tanggal desc;`
3. Setelah go-live, pantau login, verifikasi perangkat, absensi masuk/pulang,
   pengajuan izin, dan cetak laporan; catat temuan di `progress.md`.

---

## 2. Ringkasan per Fase

> Semua baris di bawah **(rekonstruksi)** dari README + isi repo. Status DB tidak
> dapat dipastikan dari repo.

| Fase | Cakupan | Artefak utama | Status kode | Status DB | Verifikasi |
|---|---|---|---|---|---|
| 1 | Fondasi, skema 7 tabel, RLS, login, geofencing 100 m, Fake GPS, device binding, halaman absensi pegawai | `src/config/constants.js`, `src/utils/geofencing.js`, `src/utils/deviceHelper.js`, `migrations/01–06` | selesai | tidak diketahui | `verifikasi_*` tidak ada untuk fase ini |
| 2 | Portal Super Admin: dashboard, verifikasi perangkat, RPC admin, realtime | `migrations/07_admin_rpc.sql`, `src/pages/admin/DashboardUtama.jsx`, `VerifikasiPerangkat.jsx`, `src/services/admin*Service.js` | selesai | tidak diketahui | tidak ada skrip khusus |
| 3 | Data Pegawai: ubah nama & unit kerja tanpa ubah role | `migrations/08_pegawai.sql`, `src/pages/admin/DataPegawai.jsx`, `src/services/pegawaiService.js` | selesai | tidak diketahui | tidak ada skrip khusus |
| 4 | Dinas & Sakit/Cuti: kepala ruangan, grup Dinas 1–4 pegawai, dokumen wajib, bucket privat, status `dibatalkan` | `migrations/09_dinas_sakit_cuti.sql`, `src/utils/izin.js`, `dokumenIzin.js`, `src/services/leaveService.js`, `izinPegawaiService.js`, `src/pages/IzinSaya.jsx`, `src/pages/admin/PengajuanIzin.jsx` | selesai | tidak diketahui | `supabase/verifikasi_09.sql` |
| 5 | Pengaturan kepala ruangan dari Data Pegawai (satu kepala per unit) | `migrations/11_kepala_ruangan.sql`, `migrations/10_kelola_role.sql` (opsional, tidak dipakai UI), `src/context/AuthContext.jsx`, `src/components/ProtectedRoute.jsx` | selesai | tidak diketahui | `supabase/verifikasi_11.sql`, `verifikasi_10.sql` |
| 6 | Pola kerja Reguler/Shift, grup shift + seksi, jam reguler, hari libur, keterlambatan, Alfa otomatis | `migrations/12_pola_kerja_jadwal_alfa.sql`, `supabase/jadwal_alfa.sql`, `src/pages/admin/GrupShift.jsx`, `HariLibur.jsx`, `PengaturanPresensi.jsx`, `src/services/groupShiftService.js`, `hariLiburService.js`, `pengaturanService.js` | selesai | tidak diketahui | `supabase/verifikasi_12.sql` |
| 7 | Kepala ruangan kelola jadwal unit, audit jadwal, finalisasi bulanan, hapus mode transisi | `migrations/13_kepala_jadwal_final.sql`, `src/components/layout/PortalKepalaLayout.jsx`, `SidebarKepala.jsx`, `src/components/MenuKepala.jsx`, `src/pages/admin/JadwalShift.jsx` | selesai (finalisasi dihapus oleh migrasi 15) | tidak diketahui | `supabase/verifikasi_13.sql` (berlaku sebelum migrasi 15) |
| 8 | Impor massal jadwal shift CSV/XLSX, validasi ulang di server, atomik | `migrations/14_impor_jadwal_shift.sql`, `src/utils/templateJadwal.js`, `src/services/shiftService.js`, `src/pages/admin/JadwalShift.jsx` | selesai | tidak diketahui | `supabase/verifikasi_14.sql` (berlaku sebelum migrasi 15) |
| 9 | Tanpa finalisasi jadwal; kepala ruangan boleh mengubah mulai hari ini; satu perangkat aktif per pegawai | `migrations/15_hapus_finalisasi_jadwal.sql`, `migrations/16_satu_perangkat.sql`, `src/services/deviceService.js`, `src/services/shiftService.js`, `JadwalShift.jsx`, `KartuStatusPerangkat.jsx`, `PanelAbsen.jsx`, `Dashboard.jsx` | selesai | tidak diketahui | `supabase/verifikasi_15.sql`, `verifikasi_16.sql` |
| 10 | Jendela waktu absensi: masuk 20 menit sebelum jam masuk, pulang 1 menit setelah jam pulang (reguler & shift, termasuk lintas hari) | `migrations/17_batas_waktu_absen.sql`, `src/config/constants.js`, `src/utils/jadwalAbsen.js`, `src/components/PanelAbsen.jsx` | selesai | tidak diketahui | `supabase/verifikasi_17.sql` |
| 11 | Hapus grup shift kosong; grup sistem "Belum ditentukan" disembunyikan bila tanpa pegawai | `migrations/18_hapus_grup_kosong.sql`, `src/pages/admin/GrupShift.jsx` | selesai | sudah dijalankan | `supabase/verifikasi_18.sql` |
| 12 | Bilah progres biru muda saat navigasi, login, logout, dan muat ulang profil | `src/context/ProgressContext.jsx`, `src/components/ui/BilahProgres.jsx`, `src/components/PengamatRute.jsx`, `src/pages/Login.jsx`, `src/components/ProtectedRoute.jsx`, `src/App.jsx`, `src/main.jsx` | selesai | - | build lulus; uji manual belum tercatat |
| 13 | Logo resmi RSUD AMI di login, header pegawai, sidebar Super Admin, dan kepala ruangan | `src/assets/logo-rsud-ami.png`, `src/components/LogoRSUD.jsx`, `src/components/layout/SidebarAdmin.jsx`, `src/components/layout/SidebarKepala.jsx` | selesai | - | build lulus; uji visual belum tercatat |
| 14 | Favicon/tab dan apple-touch-icon memakai logo resmi; label "Super Admin" dihapus dari header sidebar | `index.html`, `public/favicon-32x32.png`, `public/apple-touch-icon.png`, `src/components/layout/SidebarAdmin.jsx` | selesai | - | build lulus (base `/` dan `/PRESISI-AMI/`); uji visual belum tercatat |
| 15 | Label dashboard disederhanakan: Dashboard, Total Pegawai, Non ASN, tanggal aktual pada Hadir dan Sudah Absen Pulang, Perlu Verifikasi | `src/pages/admin/DashboardUtama.jsx`, `src/components/layout/SidebarAdmin.jsx`, `src/components/layout/PortalAdminLayout.jsx` | selesai | - | build lulus (base `/` dan `/PRESISI-AMI/`); uji visual belum tercatat |
| 16 | Menu akun avatar di kanan atas untuk **Keluar**; tombol Keluar mandiri dihapus dari header; responsif desktop/HP | `src/components/layout/MenuAkun.jsx`, `src/components/BarAtas.jsx`, `src/components/layout/PortalAdminLayout.jsx`, `src/components/layout/PortalKepalaLayout.jsx` | selesai | - | build lulus (base `/` dan `/PRESISI-AMI/`); uji visual belum tercatat |
| 17 | Sidebar Super Admin/kepala ruangan lebih rapat; latar Dashboard biru muda transparan; aset logo kop RSUD AMI disimpan untuk pekerjaan berikutnya | `src/components/layout/SidebarAdmin.jsx`, `src/components/layout/SidebarKepala.jsx`, `src/components/layout/PortalAdminLayout.jsx`, `src/assets/logo kutai kartanegara.png` | selesai | - | build lulus (base `/` dan `/PRESISI-AMI/`); uji visual belum tercatat |
| 18 | Latar biru muda transparan diterapkan ke seluruh halaman portal Super Admin dan Kepala Ruangan | `src/components/layout/PortalAdminLayout.jsx`, `src/components/layout/PortalKepalaLayout.jsx` | selesai | - | build lulus (base `/` dan `/PRESISI-AMI/`); uji visual belum tercatat |
| 19 | Tombol aksi menempel dekat judul; kontrol Tahun Hari Libur satu baris; subtitle rumah sakit di topbar dihapus, kepala ruangan hanya nama unit | `src/components/admin/KepalaHalaman.jsx`, `src/pages/admin/HariLibur.jsx`, `src/components/layout/PortalAdminLayout.jsx`, `src/components/layout/PortalKepalaLayout.jsx` | selesai (digantikan fase 20) | - | build lulus (base `/` dan `/PRESISI-AMI/`); uji visual belum tercatat |
| 20 | Aksi per halaman: kembali ke kanan; tombol daftar di header kartu, Tahun di kartu Hari Libur, Muat ulang di baris tab Koreksi/Verifikasi, Ekspor/Cetak di atas kotak filter Rekapitulasi | `KepalaHalaman.jsx`, `TabBar.jsx`, `DataPegawai.jsx`, `GrupShift.jsx`, `MasterShift.jsx`, `HariLibur.jsx`, `KoreksiPresensi.jsx`, `VerifikasiPerangkat.jsx`, `PengajuanIzin.jsx`, `Rekapitulasi.jsx` | selesai | - | build lulus (base `/` dan `/PRESISI-AMI/`); uji visual belum tercatat |
| UI | Penyempurnaan navigasi: tab bar, navigasi bawah mobile, menu kepala, layout portal | `src/components/ui/TabBar.jsx`, `src/components/NavigasiBawah.jsx`, `src/components/BarAtas.jsx`, `src/components/MenuKepala.jsx`, `src/components/layout/PortalKepalaLayout.jsx`, `src/index.css`, `src/pages/Dashboard.jsx` | selesai `(inferred)` | — | build lulus; uji manual belum tercatat |

**Catatan:** README sudah diperbarui ke Fase 1–8 + migrasi 15–18. `verifikasi_13`
dan `verifikasi_14` kini **tidak valid** setelah migrasi 15 dan digantikan
`verifikasi_15`/`verifikasi_16`, ditambah `verifikasi_17` untuk batas waktu absen
dan `verifikasi_18` untuk hapus grup kosong.

---

## 3. Log Kronologis Pekerjaan

### 2026-11-14 WITA — Jam WITA menggantikan badge radius

**Perubahan**
- Badge kanan header `PanelAbsen` yang semula **"Radius 120 m" / "Bebas Radius"**
  diganti **jam berjalan WITA** (`formatJam(new Date(sekarang).toISOString())`)
  dengan ikon jam dan `tabular-nums`. Alasan: badge lama terbaca sebagai posisi
  pengguna, padahal itu angka aturan tetap.
- Jam memakai state `sekarang` yang sudah ada dan diperbarui tiap 15 detik —
  tidak ada interval baru.
- Info radius dipindah ke baris catatan bawah: *"Lokasi dan perangkat
  diverifikasi otomatis · area absensi 120 m"*; untuk pegawai **Bebas Radius**
  akhiran radius tidak ditampilkan.
- Logika absen, jendela waktu, dan server tidak berubah.

**File**
- `src/components/PanelAbsen.jsx`, `AGENTS.md`, `progress.md`

**Verifikasi**
- `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **9,13 dtk**.

**Catatan/risiko**
- Di-commit & di-push atas perintah user (2026-11-14).

### 2026-11-14 WITA — Kembali ke nada 4 nada (E5–G#5–B5–E6)

**Perubahan**
- Atas permintaan user, nada konfirmasi absen dikembalikan ke versi sebelum
  opsi marimba (commit `f56d0c3`): 4 nada naik **E5–G#5–B5–E6**, jeda 100 ms,
  harmonik 2× tipis 0.22, volume puncak 0.2, denting terakhir ±700 ms.
- `src/utils/suaraAbsen.js` dan `tests/suaraAbsen.test.js` dikembalikan dengan
  `git checkout f56d0c3 -- ...`; versi marimba (`4606459`) tetap di riwayat.
- Overlay, Dashboard, dan server tidak berubah.

**File**
- `src/utils/suaraAbsen.js`, `tests/suaraAbsen.test.js`, `AGENTS.md`, `progress.md`

**Verifikasi**
- `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **9,62 dtk**.

**Catatan/risiko**
- Langsung di-commit **`290ff41`** & di-push atas perintah user (2026-11-14).

### 2026-11-14 WITA — Lonceng opsi A (marimba/kalimba)

**Perubahan**
- Nada sukses diganti menjadi **G5–B5–D6** (marimba), jeda 140 ms, harmonik
  3× tipis (0.10), decay 0,40/0,40/0,55 dtk, volume puncak 0.16.
- Ditambah `BiquadFilter` lowpass 5 kHz + `DynamicsCompressor` agar nada lembut
  saat bertumpuk dan tidak tajam di speaker HP.
- Overlay, Dashboard, dan server tidak berubah.

**File**
- `src/utils/suaraAbsen.js`, `tests/suaraAbsen.test.js`, `AGENTS.md`, `progress.md`

**Verifikasi**
- `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **11,16 dtk**.
- Uji dengar menunggu user; bila masih kurang pas tersedia opsi B (bell
  ding-dong) dan C (glass sparkle).

**Catatan/risiko**
- Di-commit **`4606459`** dan di-push ke `origin/main` pada 2026-11-14.

### 2026-11-14 WITA — Perbaikan overlay centang & lonceng sukses

**Perubahan**
- Akar masalah overlay tidak tampil: `Dashboard.jsx` memakai
  `onBerhasil={muatData}`, dan `muatData()` selalu `setMemuatData(true)` sehingga
  `PanelAbsen` (beserta overlay portalnya) di-unmount tepat setelah absen
  sukses; lonceng tetap bunyi karena Web Audio tidak bergantung pada React.
- `muatData` kini menerima `{ senyap: true }` → tidak menyalakan spinner dan
  tidak mereset `memuatData`; `onBerhasil` memakai muat ulang senyap sehingga
  panel tetap terpasang dan overlay sempat tampil ±1,4 dtk.
- `src/utils/suaraAbsen.js` dirombak: chime 4 nada naik **E5–G#5–B5–E6**, jeda
  100 ms, sine + harmonik 2× (0.22) agar berbunyi seperti bell/glockenspiel,
  volume puncak 0.2, denting terakhir meredup sampai ±700 ms. Ekspor
  `NADA_SUKSES`, `JEDA_NADA`, `DURASI_LONCENG` untuk uji.

**File**
- `src/utils/suaraAbsen.js`, `src/pages/Dashboard.jsx`,
  `tests/suaraAbsen.test.js`, `AGENTS.md`, `progress.md`

**Verifikasi**
- `npm run lint` bersih, `npm test` **96/96**, `npm run build` lulus **8,82 dtk**.
- Uji manual (suara + centang + panel langsung berubah) menunggu user.

**Catatan/risiko**
- Di-commit **`f56d0c3`** dan di-push ke `origin/main` pada 2026-11-14.

### 2026-11-14 WITA — Radius absensi 120 meter & konfirmasi absen berhasil

**Perubahan**
- Radius geofencing dinaikkan **80 m → 120 meter** karena area kantor belakang
  berjarak ±94 m dari titik pusat. Klien `MAX_RADIUS_METERS = 120`; teks radius
  di komentar `geofencing.js`, `attendanceService.js`, `PanelAbsen.jsx`, dan
  `DataPegawai.jsx` disesuaikan.
- Migrasi **44** (`44_radius_120_meter.sql`) dibuat dari badan migrasi 43 dengan
  `v_jarak > 120`, pesan *"Anda berada di luar radius 120 meter"*, dan comment
  `bebas_radius` 120 m. Migrasi 43 **tidak diubah** karena sudah dijalankan.
- `verifikasi_44.sql` memeriksa radius 120 m dipakai, radius 80 m hilang,
  akurasi 50 m + `bebas_radius` + koordinat tetap, serta hak `authenticated`/`anon`.
- `schema.sql` disinkronkan: header radius 120 m, comment `bebas_radius` 120 m,
  blok MIGRASI 44 di akhir; definisi terakhir **identik** dengan migrasi 44
  (line ending dikembalikan ke CRLF).
- Absen berhasil kini menampilkan **overlay konfirmasi**: `AbsenBerhasil.jsx`
  (portal karena panel `overflow-hidden`, tirai `bg-slate-900/25`, kartu putih,
  centang hijau 72 px, satu baris teks, tutup otomatis ±1,4 dtk, bisa ditutup
  ketuk/`Esc`) dan nada lonceng `mainkanLonceng()` di `src/utils/suaraAbsen.js`
  (Web Audio C6→G6, gain 0.12, ±290 ms, tanpa berkas audio). Keyframe
  `absen-tirai`/`absen-kartu`/`absen-centang` + blok `prefers-reduced-motion`
  ditambahkan ke `src/index.css`.
- `PanelAbsen.jsx`: state `berhasil`, `refHasil` + auto-scroll saat galat,
  memanggil overlay & lonceng hanya saat sukses. Absen gagal tetap Alert merah
  menetap.

**File**
- `src/config/constants.js`, `src/utils/geofencing.js`,
  `src/services/attendanceService.js`, `src/pages/admin/DataPegawai.jsx`
- `src/components/PanelAbsen.jsx`, `src/components/AbsenBerhasil.jsx` (baru),
  `src/utils/suaraAbsen.js` (baru), `src/index.css`
- `supabase/migrations/44_radius_120_meter.sql` (baru), `supabase/verifikasi_44.sql` (baru),
  `supabase/schema.sql`
- `tests/geofencing.test.js`, `tests/suaraAbsen.test.js` (baru)
- `README.md`, `AGENTS.md`, `progress.md`

**Verifikasi**
- `npm run lint` bersih.
- `npm test` **95/95** lulus (uji radius 120 m: tolak 121 m, terima 95 m, batas
  119/121 m, bebas radius 222 m, kesesuaian klien ↔ migrasi 44 ↔ `schema.sql`).
- `npm run build` lulus **10,45 dtk**.
- Uji PGlite/WASM tidak dipakai (RAM tidak cukup); kesetaraan migrasi 44 dengan
  migrasi 43 diverifikasi struktural (normalisasi 120→80 **identik**).

**Catatan/risiko**
- Migrasi 44 **sudah dijalankan** di Supabase dan `verifikasi_44.sql` lulus
  (laporan user 2026-11-14), sehingga server memakai radius 120 m.
- Pekerjaan di-commit **`091a56e`** dan di-push ke `origin/main` pada 2026-11-14.

### 2026-11-13 11:43 WITA — Radius absensi 80 meter

**Perubahan**
- Radius geofencing dinaikkan **50 m → 80 m** di klien
  (`MAX_RADIUS_METERS` di `src/config/constants.js`) beserta teks radius pada
  `geofencing.js`, `attendanceService.js`, `PanelAbsen.jsx`, dan
  `DataPegawai.jsx`.
- Migrasi **43** (`supabase/migrations/43_radius_80_meter.sql`) mendefinisikan
  ulang `submit_presensi`: `v_jarak > 80`, pesan *"Anda berada di luar radius 80
  meter…"*, dan `di_luar_radius` dihitung dengan 80 m. Isi fungsi identik dengan
  migrasi 38 kecuali angka radius.
- `supabase/schema.sql` disinkronkan (definisi terakhir = migrasi 43, header dan
  komentar `bebas_radius` menjadi 80 m).
- `supabase/verifikasi_43.sql` memeriksa radius 80 m dipakai, radius 50 m hilang,
  akurasi 50 m dan `bebas_radius` tetap, koordinat tetap, serta hak eksekusi
  `authenticated`/`anon`.

**File**
- `src/config/constants.js`, `src/utils/geofencing.js`,
  `src/services/attendanceService.js`, `src/components/PanelAbsen.jsx`,
  `src/pages/admin/DataPegawai.jsx`, `tests/geofencing.test.js`,
  `supabase/migrations/43_radius_80_meter.sql` (baru), `supabase/schema.sql`,
  `supabase/verifikasi_43.sql` (baru), `README.md`, `AGENTS.md`, `progress.md`.

**Verifikasi**
- `npm run lint` bersih (exit 0).
- `npm test` **93/93** lulus (2 uji radius baru: 67 m diterima, 81 m ditolak,
  plus uji kesesuaian angka radius klien vs migrasi 43 + `schema.sql`).
- `npm run build` lulus **8,13 dtk** (exit 0).
- Uji PGlite/WASM tidak dapat dijalankan (RAM bebas 2,2 GB →
  `WebAssembly.instantiate(): Out of memory`), diganti uji struktural: migrasi 43
  dinormalisasi (`80 → 50`) **identik** dengan definisi `submit_presensi`
  migrasi 38, dan definisi terakhir `schema.sql` **identik** dengan migrasi 43.
- Di-commit **`4c1f1b0`** lalu di-push ke `origin/main` (`981113e..4c1f1b0`);
  `git rev-parse` mengonfirmasi `HEAD` = `origin/main` = `4c1f1b0`.

**Catatan/risiko**
- Migrasi 43 belum dijalankan di Supabase; selama belum, server masih menolak
  jarak > 50 m. Jalankan migrasi 43 lalu `verifikasi_43.sql`.
- Tidak ada backfill: baris presensi lama tetap menyimpan `jarak_masuk`/
  `jarak_pulang` dan `di_luar_radius` sesuai radius saat itu.
- Pegawai **Bebas Radius** tidak terpengaruh.

### 2026-11-13 11:27 WITA — Commit & push logo aplikasi + redesign login

**Perubahan**
- Meng-commit seluruh pekerjaan logo aplikasi baru, favicon baru, dan redesign
  halaman login (I-171 s/d I-176) sebagai commit **`981113e`** dengan pesan
  *“PRESISI AMI: logo aplikasi baru dan redesign halaman login”*, lalu push ke
  `origin/main` (`ef548cd..981113e`).
- Isi commit: `src/components/LogoAplikasi.jsx` (baru), penghapusan
  `src/components/LogoRSUD.jsx`, pemakaian logo di `BarAtas.jsx`,
  `SidebarAdmin.jsx`, `SidebarKepala.jsx`; aset `logo-aplikasi.png`,
  `logo-aplikasi.v2.png`, `favicon.ico`; `public/favicon.ico`,
  `favicon-32x32.png`, `apple-touch-icon.png`, `favicon.svg` dihapus;
  `index.html` (favicon + `theme-color #1170B3`); `src/pages/Login.jsx`
  (split screen, panel biru `1.3fr : 1`, logo `w-80`, teks mobile
  “Presensi Sistem Informasi RSUD AMI”); `src/index.css` (`.kartu-login`);
  dokumen audit `README.md`, `AGENTS.md`, `progress.md`.

**File**
- `AGENTS.md`, `README.md`, `index.html`, `progress.md`, `public/*` (favicon),
  `src/assets/*` (logo & favicon), `src/components/LogoAplikasi.jsx`,
  `src/components/BarAtas.jsx`, `src/components/layout/SidebarAdmin.jsx`,
  `src/components/layout/SidebarKepala.jsx`, `src/index.css`,
  `src/pages/Login.jsx`.

**Verifikasi**
- `npm run lint` bersih (exit 0).
- `npm test` **91/91** lulus, 0 gagal.
- `npm run build` lulus **8,55 dtk** (exit 0).
- Diff staged diperiksa: hanya aset gambar, komponen, CSS, halaman login, dan
  dokumen — tidak ada `.env`, kunci, atau kredensial.
- `git fetch` + `git rev-parse`: `HEAD` = `origin/main` =
  `981113e0f5ca7ea4eb3cfdba71912ecccd733408`; `git status` bersih
  (`## main...origin/main`).

**Catatan/risiko**
- Deploy GitHub Pages otomatis berjalan dari push ini; favicon baru butuh
  hard-refresh di browser yang sudah menyimpan ikon lama.
- Pekerjaan ini tidak menyentuh logika login maupun kop laporan.
- **Sinkronisasi dokumen (belum di-commit):** `README.md` masih menyebut status
  pengaduan disetujui = **Koreksi** dan Super Admin hanya membaca riwayat;
  dikoreksi menjadi status **Hadir** (migrasi 39) dan Super Admin dapat
  memutuskan (migrasi 34). `AGENTS.md` Fakta Lingkungan mencatat commit
  terbaru `981113e`.

### 2026-11-13 11:17 WITA — Login: panel biru lebih luas, logo +25%, teks mobile

**Perubahan**
- **Desktop:** grid diubah dari `lg:grid-cols-2` menjadi
  **`lg:grid-cols-[1.3fr_1fr]`** sehingga kolom biru ±57% layar (1440 px: 814 px;
  1024 px: 579 px). Padding panel form `lg:px-10` → `lg:px-8` agar kartu tetap
  lega di 1024 px (381 px).
- **Logo panel biru:** `w-64` (256 px) → **`w-80`** (320 px), ≈ **+25%**;
  plakat putih tetap `px-8 py-7`.
- **Mobile:** teks di pita biru diganti dari "Sistem Absensi Pegawai RSUD AMI"
  menjadi **"Presensi Sistem Informasi RSUD AMI"**.
- Tidak ada perubahan state, validasi, `Alert`, tombol lihat sandi, bilah
  progres, atau alur `masuk()`.

**File**
- `src/pages/Login.jsx`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih (exit 0); `npm test` **91/91** lulus; `npm run build`
  lulus **9,40 dtk** (exit 0).
- **Uji visual headless:**

  | Viewport | `scrollWidth` | Kartu | Panel biru | Hasil |
  |---|---|---|---|---|
  | 320 px | 320 | 288 px | tidak tampil | aman |
  | 375 px | 375 | 343 px | tidak tampil | aman |
  | 390 px | 390 | 358 px | tidak tampil | aman |
  | 768 px | 768 | 448 px | tidak tampil | aman |
  | 1024 px | 1024 | 381 px | 579 px | aman |
  | 1440 px | 1440 | 416 px | 814 px | aman |

  Tidak ada luberan horizontal; teks baru tetap terbaca satu baris di 320 px.
- Tidak ada migrasi DB.

**Catatan/risiko**
- Tulisan "--Presensi Sistem Informasi RSUD AMI--" pada instruksi user
  ditafsirkan sebagai penekanan, bukan bagian teks; teks dipasang tanpa tanda
  hubung.
- Uji visual di perangkat asli belum dilakukan user.

### 2026-11-13 11:08 WITA — Login: pita mobile penuh & kartu berbingkai gradasi

**Perubahan**
- **Mobile:** pita biru diganti menjadi `flex flex-1 flex-col items-center
  justify-center` sehingga mengisi sisa tinggi layar; isi pita = plakat logo
  (`w-44 sm:w-56`) + teks **"Sistem Absensi Pegawai RSUD AMI"**
  (`text-white/85`). Kartu tetap menumpuk `-mt-10` di batas pita, sehingga
  ruang kosong di bawah kartu hilang.
- **Desktop:** teks "Sistem Absensi Pegawai RSUD AMI" di panel kiri **dihapus**;
  plakat logo diperbesar (logo `w-56` → `w-64`, padding plakat `px-8 py-7`).
- **Kartu form:** kelas baru `.kartu-login` (`src/index.css`) — pada
  `min-width: 1024px` memakai teknik *gradient border*
  (`border: 3px solid transparent` + dua lapis `background-image`,
  `background-clip: padding-box, border-box`) dengan gradasi
  `#0f66a3 → #1170b3 → #5fb8ec`; di bawah 1024 px tetap kartu putih bergaris
  `slate-200` seperti sebelumnya.
- Struktur pembungkus dirapikan: `w-full px-4 pb-8 lg:px-0 lg:pb-0` + inner
  `mx-auto ... max-w-md lg:max-w-sm xl:max-w-[26rem]`.
- Tidak ada perubahan state, validasi, `Alert`, tombol lihat sandi, bilah
  progres, atau alur `masuk()`.

**File**
- `src/pages/Login.jsx`, `src/index.css`, `progress.md`, `AGENTS.md`,
  `README.md`.

**Verifikasi**
- `npm run lint` bersih (exit 0); `npm test` **91/91** lulus; `npm run build`
  lulus **7,07 dtk** (exit 0).
- **Uji visual headless (Chrome 157 + puppeteer-core):**

  | Viewport | `scrollWidth` | Kartu | Panel kiri | Kartu mulai (y) | Hasil |
  |---|---|---|---|---|---|
  | 320 px | 320 | 288 px | tidak tampil | 403 | aman |
  | 375 px | 375 | 343 px | tidak tampil | 415 | aman |
  | 390 px | 390 | 358 px | tidak tampil | 447 | aman |
  | 768 px | 768 | 448 px | tidak tampil | 508 | aman |
  | 1024 px | 1024 | 384 px | 512 px | 174 | aman |
  | 1440 px | 1440 | 416 px | 720 px | 264 | aman |

  Tidak ada luberan horizontal; footer "Lupa kata sandi? Hubungi Admin/IT"
  berada di dasar area kartu sehingga tidak ada ruang kosong menganga.
- Tidak ada migrasi DB.

**Catatan/risiko**
- Pita biru mobile kini mengisi sisa tinggi (di 375×812 ≈ 55% layar); bila
  terasa terlalu dominan, cukup beri `sm:max-h-[…]` pada pita.
- Gradient border memakai CSS kustom di `index.css` (bukan utilitas Tailwind)
  agar tidak menambah elemen pembungkus di `Login.jsx`.
- Uji visual di perangkat asli belum dilakukan user.

### 2026-11-13 10:35 WITA — Redesign halaman login: split screen

**Perubahan**
- `src/pages/Login.jsx` diubah menjadi **split screen**:
  - **Desktop (≥1024 px):** `lg:grid lg:grid-cols-2`. Panel kiri
    `bg-[#1170B3]` dengan ornamen blur hijau `#88BD41/20` dan putih `10%`
    (`aria-hidden`), berisi **plakat putih** (`rounded-2xl px-7 py-6`) dengan
    `logo-aplikasi.v2.png` (`w-56`), lalu teks
    **"Sistem Absensi Pegawai RSUD AMI"** (`text-white/85`).
  - **Mobile (<1024 px):** pita biru `bg-[#1170B3] px-4 pb-16 pt-10` dengan
    plakat logo (`w-44 sm:w-52`); kartu form menumpuk `-mt-10`.
  - Kartu form: `max-w-md` (mobile) / `max-w-sm` (lg) / `26rem` (xl), latar putih,
    `shadow-kartu` + border `slate-200`.
  - Footer **"Lupa kata sandi? Hubungi Admin/IT"** tetap **di bawah kartu**
    (sebelumnya: "Lupa kata sandi? Hubungi Admin IT untuk reset akun.").
  - `h1` "PRESISI AMI" tetap `sr-only`; logo `alt=""`.
- Tidak ada perubahan state, validasi, `Alert`, tombol lihat sandi, bilah
  progres, atau alur `masuk()`.

**File**
- `src/pages/Login.jsx`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih; `npm test` **91/91** lulus; `npm run build` lulus
  **10,46 dtk**.
- **Uji visual headless (Chrome 157 + puppeteer-core, viewport sesungguhnya):**

  | Viewport | `scrollWidth` | Kartu | Panel kiri | Hasil |
  |---|---|---|---|---|
  | 320 px | 320 | 288 px | tidak tampil | aman |
  | 375 px | 375 | 343 px | tidak tampil | aman |
  | 390 px | 390 | 358 px | tidak tampil | aman |
  | 768 px | 768 | 416 px | tidak tampil | aman |
  | 1024 px | 1024 | 384 px | 512 px | aman |
  | 1440 px | 1440 | 416 px | 720 px | aman |

  Tidak ada luberan horizontal di semua ukuran; titik pecah 1024 px bersih
  (panel biru muncul, form pindah ke kolom kanan, pita mobile hilang).
- Tidak ada migrasi DB.

**Catatan/risiko**
- Logo v2 berlatar transparan dengan tulisan biru, sehingga di panel biru
  ditempatkan di **plakat putih** agar tetap kontras (tanpa perlu versi putih).
- Panel kanan pada layar sangat lebar menyisakan ruang kosong; ini konsekuensi
  desain split screen dan bisa diisi ilustrasi bila diminta.
- Uji visual di perangkat asli belum dilakukan user.

### 2026-11-13 10:10 WITA — Redesign halaman login: satu kartu

**Perubahan**
- `src/pages/Login.jsx` disusun ulang menjadi **satu kartu putih** (`max-w-md`):
  logo `logo-aplikasi.v2.png` di tengah (`w-48 sm:w-56`), garis pemisah tipis
  `h-px bg-slate-200` (`my-4 sm:my-5`), lalu judul **Masuk ke Akun Anda** dan
  form.
- Latar halaman memakai gradasi biru muda **penuh layar**
  (`bg-gradient-to-b from-sky-100 via-sky-50 to-slate-100`) pada kontainer
  `min-h-[100dvh]`; pita gradasi absolut setinggi 256 px dihapus.
- Padding kartu dirapikan: `px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6`.
- `h1` "PRESISI AMI" tetap `sr-only`; gambar logo `alt=""`.
- Tidak ada perubahan state, validasi, `Alert`, tombol, atau alur login.

**File**
- `src/pages/Login.jsx`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih; `npm test` **91/91** lulus; `npm run build` lulus
  **10,95 dtk**.
- **Uji visual headless (Chrome + puppeteer-core, viewport sesungguhnya):**

  | Viewport | scrollWidth | Lebar kartu | Hasil |
  |---|---|---|---|
  | 320 px | 320 | 288 px (16–304) | tidak meluber |
  | 375 px | 375 | 343 px (16–359) | tidak meluber |
  | 390 px | 390 | 358 px (16–374) | tidak meluber |
  | 768 px | 768 | 448 px (160–608) | tidak meluber |
  | 1440 px | 1440 | 448 px (496–944) | tidak meluber |

  Tangkapan layar 320/375/390/768/1440 diperiksa: logo, garis pemisah, judul,
  dan form tersusun rapi tanpa terpotong.
- Tidak ada migrasi DB.

**Catatan/risiko**
- Tangkapan pertama dengan `chrome --headless --window-size=375` sempat tampak
  terpotong; itu artefak batas lebar jendela Chrome di Windows (layout dirender
  ±500 px lalu dipotong). Pengukuran `scrollWidth` via puppeteer memastikan tidak
  ada overflow nyata.
- Uji visual di perangkat asli belum dilakukan user.

### 2026-11-13 09:58 WITA — Kepala halaman login: logo selebar kartu, teks & badge dihapus

**Perubahan**
- `src/pages/Login.jsx`: menghapus paragraf deskripsi
  (`DESKRIPSI_APLIKASI` — "Presensi Sistem Informasi Staf Integrasi") dan badge
  biru rumah sakit (`NAMA_RUMAH_SAKIT` — "RSUD Aji Muhammad Idris") dari kepala
  halaman login.
- Logo `logo-aplikasi.v2.png` kini memakai `w-full` sehingga lebarnya mengikuti
  kartu login (`max-w-md` = 448 px; tinggi otomatis ±165 px, rasio 2,71:1).
- `h1` "PRESISI AMI" tetap ada sebagai `sr-only` agar struktur judul halaman
  tidak hilang; gambar tetap `alt=""` agar tidak terbaca ganda.
- Import `DESKRIPSI_APLIKASI` dan `NAMA_RUMAH_SAKIT` dibuang dari `Login.jsx`.

**File**
- `src/pages/Login.jsx`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih; `npm test` **91/91** lulus; `npm run build` lulus
  **8,44 dtk**.
- `grep` memastikan `DESKRIPSI_APLIKASI`/`NAMA_RUMAH_SAKIT` tidak lagi dipakai di
  `Login.jsx`.
- Tidak ada migrasi DB.

**Catatan/risiko**
- Logo selebar 448 px membuat tinggi kepala halaman ±165 px; bila terasa terlalu
  besar di HP, cukup batasi `max-w` pada gambar.
- Uji visual di browser belum dilakukan user.

### 2026-11-13 09:49 WITA — Logo aplikasi PRESISI AMI & favicon baru

**Perubahan**
- Logo aplikasi diganti dari `logo-rsud-ami.png` (lambang RSUD) ke **logo
  PRESISI AMI** `src/assets/logo-aplikasi.png` (ikon jam biru + daun hijau,
  591×591) untuk header pegawai, sidebar Super Admin, dan sidebar Kepala Unit.
- **Halaman login** memakai versi lengkap `src/assets/logo-aplikasi.v2.png`
  (1594×588, memuat tulisan "PRESISI AMI" dan "Absensi Online RSUD AMI").
  Judul `h1` "PRESISI AMI" tidak lagi ditampilkan agar tidak dobel, tetapi tetap
  ada sebagai `sr-only` untuk pembaca layar. Deskripsi dan badge rumah sakit
  dipertahankan.
- Komponen `src/components/LogoRSUD.jsx` di-rename menjadi
  `src/components/LogoAplikasi.jsx` (alt: "Logo PRESISI AMI").
- **Favicon**: `public/favicon.ico` (multi-ukuran 16/32/48, dari
  `src/assets/favicon.ico`), `public/favicon-32x32.png` (32×32, latar
  transparan), dan `public/apple-touch-icon.png` (180×180, latar putih, isi 84%)
  dibuat dari `logo-aplikasi.png`. `public/favicon.svg` dihapus karena tidak
  dirujuk.
- `index.html`: menambah `<link rel="icon" href="%BASE_URL%favicon.ico"
  sizes="any" />`, dan `theme-color` `#0284c7` → **`#1170B3`** (biru dominan logo).
- **Kop laporan tidak berubah**: `KopLaporan.jsx` tetap memakai
  `logo-rsud-ami.png`, sesuai keputusan user.

**File**
- Baru: `src/components/LogoAplikasi.jsx`, `public/favicon.ico`.
- Diubah: `src/pages/Login.jsx`, `src/components/BarAtas.jsx`,
  `src/components/layout/SidebarAdmin.jsx`,
  `src/components/layout/SidebarKepala.jsx`, `index.html`,
  `public/favicon-32x32.png`, `public/apple-touch-icon.png`, `README.md`,
  `progress.md`, `AGENTS.md`.
- Dihapus: `src/components/LogoRSUD.jsx`, `public/favicon.svg`.

**Verifikasi**
- `npm run lint` bersih; `npm test` **91/91** lulus; `npm run build` lulus
  **8,60 dtk**.
- `dist/` berisi `favicon.ico` (4.870 B), `favicon-32x32.png` (1.817 B),
  `apple-touch-icon.png` (10.100 B); `dist/index.html` memuat ketiga tautan ikon
  dan `theme-color #1170B3`.
- Hasil build memuat `logo-aplikasi-*.png`, `logo-aplikasi.v2-*.png`, dan
  `logo-rsud-ami-*.png`; `logo-rsud-ami` hanya diimpor `KopLaporan.jsx`.
- Tidak ada migrasi DB.

**Catatan/risiko**
- Browser meng-cache favicon sangat agresif; uji dengan **hard refresh**
  (Ctrl+Shift+R) atau mode incognito. Setelah deploy, GitHub Pages juga
  menyimpan `Cache-Control: max-age=600`.
- Uji visual (login, header, dua sidebar, ikon tab) belum dilakukan user.

### 2026-11-12 11:20 WITA — Commit & push `6ac6f2c`

**Perubahan**
- Commit `6ac6f2c` “PRESISI AMI: pengaduan absen pulang setelah jendela tutup”
  berisi 23 berkas (1.155 insertions, 249 deletions): migrasi **42** +
  `verifikasi_42.sql`, sinkron `schema.sql`, `tests/migrasiPengaduan.test.js`,
  perapian UI pengaduan/periode/tabel admin, serta dokumen audit
  (`README.md`, `AGENTS.md`, `progress.md`).
- Push ke `origin/main` (`2fa718a..6ac6f2c`).

**File**
- 23 berkas pada commit `6ac6f2c`.

**Verifikasi**
- `npm run lint` bersih, `npm test` **91/91**, `npm run build` lulus **9,96 dtk**.
- Pemeriksaan staged diff & berkas baru: tidak ada kredensial, token, atau
  service key.
- `git fetch` pasca-push: `origin/main` = **`6ac6f2c`**, working tree bersih.

**Catatan/risiko**
- Migrasi 42 sudah dijalankan user dan `verifikasi_42.sql` semua `true`.
- Sisa uji manual: kandidat absen pulang kosong sebelum jam tutup, muncul
  sesudahnya (reguler & shift malam).

### 2026-11-12 11:08 WITA — Migrasi 42 dijalankan & verifikasi lulus

**Perubahan**
- User menjalankan `42_pengaduan_pulang_setelah_jendela.sql` di Supabase: **berhasil**.
- `verifikasi_42.sql` dijalankan: **semua pemeriksaan `true`**.
- Berlaku di server sejak saat ini: kandidat **absen pulang** hanya muncul setelah
  `now() >= jam_selesai jadwal + 2 jam` (shift malam H+1), dan
  `ajukan_pengaduan_presensi()` menolak pengajuan jenis `pulang` sebelum batas.

**File**
- Tidak ada perubahan kode pada entri ini; `progress.md` dan `AGENTS.md` diperbarui.

**Verifikasi**
- Laporan user 2026-11-12: migrasi 42 sukses, `verifikasi_42.sql` semua `true`.
- Sebelumnya (2026-11-12 10:53) diuji di Postgres asli (PGlite): 19/19 verifikasi
  `true`, 16/16 uji perilaku lulus; `npm run lint` bersih, `npm test` **91/91**,
  `npm run build` lulus **7,18 dtk**.

**Catatan/risiko**
- Sisa uji manual: buka `/pengaduan` sebagai pegawai yang sudah absen masuk —
  sebelum jam tutup daftar kandidat pulang harus **kosong**, sesudahnya **muncul**.
- Pengaduan absen pulang yang sudah terlanjur dikirim sebelum migrasi tetap dapat
  diputuskan Kepala Unit seperti biasa.

### 2026-11-12 10:53 WITA — Perbaikan galat sintaks migrasi 42 + uji SQL nyata

**Perubahan**
- Memperbaiki `ERROR 42601: syntax error at end of input` pada migrasi 42.
  Penyebab: `CASE ... END` dipakai di dalam **kondisi `IF`** — PL/pgSQL membaca
  `THEN` milik `CASE` sebagai penutup `IF`, sehingga sisa ekspresi menjadi
  statement liar. Kandidat sekarang menghitung variabel `v_dibuka boolean`
  (`v_dibuka := case ... end;`) lalu memakai `IF ... and v_dibuka`.
- `schema.sql` disinkronkan dengan definisi terbaru.

**File**
- `supabase/migrations/42_pengaduan_pulang_setelah_jendela.sql`,
  `supabase/schema.sql`, `tests/migrasiPengaduan.test.js` (baru),
  `progress.md`, `AGENTS.md`.

**Verifikasi**
- **Uji Postgres asli (PGlite/WASM, bukan tafsir manual):**
  - Seluruh isi file migrasi 42 dieksekusi tanpa galat (termasuk `do` guard,
    `begin/commit`, `revoke`/`grant`).
  - `verifikasi_42.sql` dijalankan: **semua 19 baris `true`**.
  - **16 uji perilaku lulus:** `hitung_batas_absen_pulang` reguler 16.30 → 18.30,
    shift malam 20.00–08.00 → 10.00 H+1, jam kosong → `null`; kandidat pulang
    **tidak muncul** sebelum batas dan **muncul** setelahnya (termasuk tepat di
    batas `now() >= v_tutup`); tanpa jadwal hari ini → tidak muncul, tanggal
    lampau → tetap muncul; `ajukan_pengaduan_presensi` menolak sebelum batas
    ("Pengaduan absen pulang baru dapat diajukan setelah pukul HH:MM WITA.")
    dan menerima setelah batas; kandidat absen masuk tidak berubah.
- `npm run lint` bersih, `npm test` **91/91** (bertambah 5 uji migrasi),
  `npm run build` lulus **7,30 dtk**.

**Catatan/risiko**
- Uji PGlite memakai stub `jadwal_kerja()`/`validasi_dokumen_pengaduan()` dan
  tabel minimal, bukan skema penuh; yang divalidasi adalah sintaks PL/pgSQL dan
  logika kedua RPC.
- Migrasi 42 **belum dijalankan** di Supabase. Setelah dijalankan, lanjutkan
  `verifikasi_42.sql` lalu uji manual kandidat pulang.

### 2026-11-12 09:54 WITA — Pengaduan absen pulang setelah jendela tutup

**Perubahan**
- Kandidat **absen pulang** tidak lagi muncul begitu pegawai absen masuk pagi.
  Baris baru ditawarkan setelah jendela absen pulang tertutup, yaitu jam selesai
  jadwal + 2 jam (`MENIT_TUTUP_ABSEN_PULANG = 120`), dengan shift malam
  (jam selesai ≤ jam mulai) dihitung H+1.
- Helper baru `public.hitung_batas_absen_pulang(p_tanggal, p_jam_mulai,
  p_jam_selesai)` (immutable) dipakai `kandidat_pengaduan_presensi()` dan
  `ajukan_pengaduan_presensi()` agar aturan klien/server konsisten.
- Server tetap sumber kebenaran: pengajuan jenis `pulang` sebelum batas ditolak
  dengan pesan "Pengaduan absen pulang baru dapat diajukan setelah pukul % WITA."
- Bila jadwal kerja tidak tersedia, kandidat pulang hanya muncul untuk tanggal
  lampau (bukan hari ini). Kandidat absen masuk/koreksi jam masuk tidak berubah.
- Subjudul daftar kandidat di halaman Pengaduan menjelaskan kapan pengaduan
  absen pulang dibuka.

**File**
- `supabase/migrations/42_pengaduan_pulang_setelah_jendela.sql` (baru),
  `supabase/verifikasi_42.sql` (baru), `supabase/schema.sql` (helper + kedua RPC
  disamakan dengan migrasi 42), `src/pages/Pengaduan.jsx`, `README.md`,
  `AGENTS.md`, `progress.md`.

**Verifikasi**
- `npm run lint` bersih, `npm test` **86/86**, `npm run build` lulus **9,65 dtk**.
- Fungsi `ajukan_pengaduan_presensi` (219 baris) dan `kandidat_pengaduan_presensi`
  (135 baris) di `schema.sql` diperiksa identik dengan migrasi 42.
- Uji DB belum dilakukan: migrasi 42 + `verifikasi_42.sql` belum dijalankan.

**Catatan/risiko**
- Pengaduan absen pulang yang sudah terlanjur dikirim sebelum migrasi tetap bisa
  diputuskan Kepala Unit seperti biasa.
- Panel Absen sudah memakai `tutupAbsenPulang()`, sehingga tombol
  **Ajukan Pengaduan** memang baru tampil setelah jendela tutup; perbaikan ini
  menyelaraskan daftar kandidat di halaman Pengaduan.
- Perubahan ditahan di working tree sampai user memerintahkan commit/push.

### 2026-11-12 09:29 WITA — Perapian UI pengaduan, periode, dan tabel admin

**Perubahan**
- `TampilanPeriode` menjadi satu baris dengan ikon kalender inline kecil dan
  jumlah hari di bawahnya; rentang memakai helper baru
  `formatRentangRingkas()` (satu hari, satu tahun, lintas tahun).
- Daftar pengaduan dirapikan: satu baris meta (jenis · tanggal · unit), satu
  baris waktu (Diajukan/Tercatat/Disetujui), alasan maks. 2 baris dengan garis
  kiri tipis, catatan admin satu baris, dan footer berisi info keputusan +
  **Lihat Foto** (tautan) serta **Tinjau** (tombol kecil).
- Tab Riwayat Pengaduan di Koreksi Presensi: filter Unit + Status digabung ke
  toolbar pencarian dan Alert biru panjang dihapus.
- Tabel Dinas & Sakit/Cuti/Izin: kolom Periode 190 px, padding `px-4`, keterangan
  `line-clamp-2` + `title`, catatan admin satu baris.
- Kelas `.tabel-data` di `src/index.css` menambahkan pemisah tipis antarkolom;
  diterapkan pada tabel Data Pegawai, Grup Shift, Master Shift, Hari Libur,
  Verifikasi Perangkat, Pengajuan Izin, Koreksi/Audit Trail, Dashboard, preview
  impor Jadwal Shift, dan daftar presensi koreksi. Rekapitulasi dikecualikan
  karena dipakai untuk cetak.
- Modal pengaduan pegawai memakai judul sesuai jenis (absen masuk/pulang).

**File**
- `src/utils/format.js`, `tests/format.test.js`,
  `src/components/ui/TampilanPeriode.jsx`,
  `src/components/pengaduan/DaftarPengaduan.jsx`,
  `src/pages/Pengaduan.jsx`, `src/pages/admin/KoreksiPresensi.jsx`,
  `src/pages/admin/PengajuanIzin.jsx`, `src/index.css`, serta kelas tabel di
  `DataPegawai`, `GrupShift`, `MasterShift`, `HariLibur`, `JadwalShift`,
  `DashboardUtama`, `VerifikasiPerangkat`, `DaftarPresensiKoreksi`.

**Verifikasi**
- `npm run lint` bersih, `npm test` **86/86**, `npm run build` lulus
  **10,09 dtk**. Uji manual tampilan belum dilakukan.

**Catatan/risiko**
- Murni tampilan; tidak ada perubahan RPC, status, atau migrasi DB.
- Perubahan ditahan di working tree sampai user memerintahkan commit/push.

### 2026-11-12 09:06 WITA — Migrasi 41 dijalankan

**Perubahan**
- User melaporkan `supabase/migrations/41_audit_jadwal_shift_auth_users.sql` dan
  `supabase/verifikasi_41.sql` sudah dijalankan.
- FK `jadwal_shift.dibuat_oleh`, `jadwal_shift.diperbarui_oleh`, dan
  `tukar_shift.dibuat_oleh` kini mengarah ke `auth.users`, sehingga Tukar Shift
  oleh kepala unit ASN tidak lagi tertahan foreign key.
- Uji manual belum dilakukan karena belum ada kasus tukar shift yang perlu diuji.
- Memperbarui Status Terkini, tabel migrasi baris 41, dan backlog **B-48**.

**File**
- `progress.md`, `AGENTS.md` (dokumen saja).

**Verifikasi**
- Laporan user 2026-11-12 09:06. Tidak ada perubahan kode; verifikasi lokal
  terakhir tetap lint bersih, `npm test` 85/85, build lulus.

**Catatan/risiko**
- Sisa: uji Tukar Shift dari akun kepala unit ASN begitu ada kasus nyata.
- Perubahan dokumen ini belum di-commit.

### 2026-11-12 09:05 WITA — Commit & push perbaikan FK audit Tukar Shift

**Perubahan**
- Memverifikasi ulang `npm run lint` (bersih), `npm test` **85/85**, `npm run build`
  lulus **8,72 dtk**; memastikan staged diff tanpa rahasia.
- Commit **`dc12aa8`** "PRESISI AMI: FK audit jadwal dan tukar shift mengacu ke
  auth.users (migrasi 41)" lalu push ke `origin/main` (`c48e64c..dc12aa8`).
- Isi commit: migrasi **41** (FK `jadwal_shift.dibuat_oleh`,
  `jadwal_shift.diperbarui_oleh`, `tukar_shift.dibuat_oleh` → `auth.users`),
  `verifikasi_41.sql`, sinkron `schema.sql`, README, dan dokumen audit.

**File**
- 6 file: `supabase/migrations/41_audit_jadwal_shift_auth_users.sql`,
  `supabase/verifikasi_41.sql`, `supabase/schema.sql`, `README.md`,
  `AGENTS.md`, `progress.md`.

**Verifikasi**
- Lint bersih, `npm test` 85/85, `npm run build` lulus 8,72 dtk.
- Push berhasil: `c48e64c..dc12aa8 main -> main`.

**Catatan/risiko**
- Sisa: jalankan migrasi 41 + `verifikasi_41.sql`, lalu uji Tukar Shift dari akun
  kepala unit ASN yang sebelumnya gagal.

### 2026-11-12 09:02 WITA — Perbaikan FK audit Tukar Shift (migrasi 41)

**Perubahan**
- Laporan kepala unit: Tukar Shift gagal dengan galat
  `insert or update on table "jadwal_shift" violates foreign key constraint
  "jadwal_shift_diperbarui_oleh_fkey"`. Akun admin berhasil karena memiliki baris
  `public.pegawai`, sedangkan kepala unit **ASN** hanya punya metadata
  `jenis_akun = kepala_asn`.
- Akar masalah: trigger `set_audit_jadwal_shift()` mengisi
  `dibuat_oleh`/`diperbarui_oleh = auth.uid()`, dan RPC `tukar_shift()` mengisi
  `tukar_shift.dibuat_oleh = auth.uid()`, tetapi ketiga kolom ber-FK ke
  `public.pegawai(id)`.
- Migrasi **41** mengarahkan ketiga FK ke `auth.users(id)` (pola sama dengan
  `izin_cuti` migrasi 23 dan `pengaduan_presensi`); hanya definisi FK berubah,
  data lama tetap valid karena berisi UUID akun.
- Sinkron `supabase/schema.sql` (3 FK + komentar urutan migrasi), tambah
  `supabase/verifikasi_41.sql`, perbarui `README.md`.

**File**
- `supabase/migrations/41_audit_jadwal_shift_auth_users.sql` (baru),
  `supabase/verifikasi_41.sql` (baru), `supabase/schema.sql`, `README.md`,
  `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih, `npm test` **85/85**, `npm run build` lulus.
- `verifikasi_41.sql` **belum dijalankan** — menunggu migrasi 41.

**Catatan/risiko**
- Tanpa migrasi 41, kepala unit ASN tetap tidak bisa Tukar Shift (dan setiap
  perubahan/penambahan `jadwal_shift` oleh mereka juga gagal di FK yang sama).
- Sisa: jalankan migrasi 41 + verifikasi 41, lalu uji Tukar Shift dari akun
  kepala unit terkait.

### 2026-11-12 WITA — Commit & push sesi 11 November

**Perubahan**
- Memverifikasi `npm run lint` (bersih), `npm test` **85/85**, `npm run build`
  lulus **19,14 dtk**; memastikan staged diff tanpa rahasia.
- Commit **`27525d1`** "PRESISI AMI: status Hadir setelah koreksi, laporan libur
  berwarna, pencarian pegawai izin, dan hak akses jadwal kepala unit" lalu push
  ke `origin/main` (`3f0c13f..27525d1`).
- Isi commit: status **Hadir** setelah koreksi + migrasi **39**; laporan bulanan
  (sel libur abu `#cbd5e1`, libur nasional merah `#dc2626` + nama libur, header
  tabel biru `#1a6fb5`, `rowSpan` per jenis libur); pencarian pegawai berketik di
  pengajuan izin; perbaikan `jadwal_kerja` + migrasi **40**; `verifikasi_39/40`;
  sinkron `schema.sql`, `README.md`, `AGENTS.md`.

**File**
- Seluruh perubahan sesi (19 file) + dokumen audit.

**Verifikasi**
- Lint bersih, `npm test` 85/85, `npm run build` lulus 19,14 dtk.
- Push berhasil: `3f0c13f..27525d1 main -> main`.

**Catatan/risiko**
- Sisa uji manual: Setujui satu pengaduan dari akun kepala unit, pratinjau/cetak
  laporan bulanan (reguler & shift).

### 2026-11-11 21:20 WITA — Migrasi 40 dijalankan

**Perubahan**
- User melaporkan `supabase/migrations/40_jadwal_kerja_hak_akses.sql` dan
  `supabase/verifikasi_40.sql` sudah dijalankan.
- `jadwal_kerja` kini memakai `bisa_lihat_presensi(p_user)`, sehingga kepala
  unit (multi-unit maupun kepala ASN lewat tabel `kepala_unit`) dapat melihat
  jadwal pegawai unit yang dikelola — jalur persetujuan pengaduan presensi
  kembali normal.
- Memperbarui Status Terkini, tabel migrasi baris 40, dan backlog **B-47**.

**File**
- `progress.md`, `AGENTS.md`.

**Verifikasi**
- Laporan user 2026-11-11 21:20 (migrasi + verifikasi dijalankan). Tidak ada
  perubahan kode.

**Catatan/risiko**
- Sisa: uji Setujui satu pengaduan dari akun kepala unit yang sebelumnya gagal
  (mis. pengaduan KASIR UGD 9 November 2026).
- Perubahan dokumen ini belum di-commit.

### 2026-11-11 21:05 WITA — Perbaikan hak akses jadwal untuk kepala unit

**Perubahan**
- Akar masalah galat **"Anda tidak berhak melihat jadwal pegawai ini."** saat
  kepala unit menyetujui pengaduan: `jadwal_kerja` masih memakai aturan lama
  `pegawai.kepala_ruangan` + unit kerja sama, padahal sejak migrasi 22 penugasan
  kepala ada di tabel `kepala_unit` (multi-unit, kepala ASN tanpa baris pegawai).
  `putuskan_pengaduan_presensi` memanggil `jadwal_kerja` pegawai pengadu,
  sehingga penolakan muncul walau `bisa_kelola_unit` sudah lolos.
- Migrasi **40** mendefinisikan ulang `public.jadwal_kerja` dengan pengecekan
  `public.bisa_lihat_presensi(p_user)`; isi fungsi lain tidak berubah.
- Sinkron `supabase/schema.sql`, tambah `supabase/verifikasi_40.sql`, perbarui
  tabel migrasi & pohon file `README.md`.

**File**
- `supabase/migrations/40_jadwal_kerja_hak_akses.sql` (baru),
  `supabase/verifikasi_40.sql` (baru), `supabase/schema.sql`, `README.md`,
  `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih, `npm test` **85/85**, `npm run build` lulus **7,89 dtk**
  (tidak ada perubahan klien).
- `verifikasi_40.sql` **belum dijalankan** — menunggu migrasi 40.

**Catatan/risiko**
- Tanpa migrasi 40, kepala unit tetap gagal menyetujui pengaduan.
- Sisa: jalankan migrasi 40 + verifikasi 40, lalu uji Setujui pengaduan dari akun
  kepala unit terkait.

### 2026-11-11 20:45 WITA — Libur nasional merah di laporan

**Perubahan**
- Hari libur yang diinput admin (`hari_libur`) kini tampil di Laporan Presensi
  Bulanan pegawai **reguler** sebagai sel gabungan **merah terang `#dc2626`**
  dengan **teks putih** berisi **nama liburnya** (mis. `Hari Raya Idul Fitri`).
- `susunBarisLaporan()` menandai `jenisLibur`: `nasional` (nama hari libur),
  `mingguan` (akhir pekan/libur unit), `shift` (shift tanpa jadwal).
- `tandaiLiburBerurutan()` hanya menggabung `rowSpan` untuk jenis yang sama,
  sehingga libur nasional tidak menyatu dengan akhir pekan di sebelahnya.
- Pola **shift tidak berubah**: tanggal merah tidak memengaruhi jadwal mereka;
  `Libur Shift / Off` hanya bila tidak ada jadwal.

**File**
- `src/utils/laporan.js`, `src/components/laporan/LembarLaporan.jsx`,
  `src/index.css`, `tests/laporan.test.js`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih.
- `npm test` **85/85** lulus (2 uji baru: pemisahan jenis libur & rowSpan
  campuran).
- `npm run build` lulus **12,61 dtk**.

**Catatan/risiko**
- Presensi nyata pada tanggal libur tetap menang (baris presensi ditampilkan).
- Sisa: uji manual pratinjau + cetak (reguler dengan libur nasional).

### 2026-11-11 19:25 WITA — Pencarian pegawai pada pengajuan izin

**Perubahan**
- `PengajuanIzin.jsx`: pemilihan pegawai tunggal (Cuti/Sakit/Izin) tidak lagi
  `<select>`, melainkan combobox berketik — input memfilter `pegawaiTampil`
  berdasarkan nama atau unit, hasil tampil di daftar menggantung (`max-h-60`),
  `Enter` memilih hasil pertama, `Esc`/klik luar menutup, tombol × mengosongkan.
  Nilai `form.singleId` dan validasinya tidak berubah.
- Daftar centang **Dinas Luar** mendapat kolom `PencarianNama` (komponen yang
  sudah ada) untuk memfilter nama/unit; pesan kosong membedakan "belum ada
  pegawai" dan "nama tidak ditemukan".
- Pencarian direset saat modal ditutup.

**File**
- `src/pages/admin/PengajuanIzin.jsx`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih.
- `npm test` **83/83** lulus.
- `npm run build` lulus **7,36 dtk**.

**Catatan/risiko**
- Sisa: uji manual pencarian di form Cuti/Sakit/Izin dan Dinas Luar.

### 2026-11-11 19:10 WITA — Header tabel laporan biru

**Perubahan**
- Header tabel Laporan Presensi Bulanan (No s/d Terlambat) berlatar **biru logo
  RSUD `#1a6fb5`** dengan teks putih (sebelumnya abu `#f3f4f6` teks hitam).

**File**
- `src/index.css`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run build` lulus **7,22 dtk** (hanya CSS).

**Catatan/risiko**
- `print-color-adjust: exact` sudah aktif sehingga biru ikut tercetak.
- Sisa: uji manual pratinjau + cetak, lalu commit/push menunggu perintah.

### 2026-11-11 19:00 WITA — Abu sel libur diperpekat

**Perubahan**
- Latar sel gabungan libur pada laporan bulanan: `#e5e7eb` → **`#cbd5e1`**
  (lebih pekat), teks tetap hitam miring Times New Roman.

**File**
- `src/index.css`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run build` lulus **7,06 dtk** (hanya CSS; `npm run lint`/`npm test` tidak
  terpengaruh — terakhir lulus 83/83).

**Catatan/risiko**
- Sisa: uji manual pratinjau + cetak, lalu commit/push menunggu perintah.

### 2026-11-11 18:55 WITA — Warna & cakupan sel libur

**Perubahan**
- Sel libur: latar **abu-abu `#e5e7eb`**, teks **hitam**, Times New Roman miring
  non-bold, `vertical-align: middle` sehingga teks tepat di tengah sel gabungan
  (sebelumnya menempel di atas karena `vertical-align: top`).
- Pola **shift**: sel gabungan dimulai dari **kolom Shift** (`colSpan={5}`,
  Shift + Jam Masuk + Jam Pulang + Status + Terlambat). Pola **reguler** tetap
  4 kolom (Jam Masuk–Terlambat).

**File**
- `src/components/laporan/LembarLaporan.jsx`, `src/index.css`,
  `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih.
- `npm test` **83/83** lulus.
- `npm run build` lulus **10,13 dtk**.

**Catatan/risiko**
- Sisa: uji manual pratinjau + cetak (reguler dan shift).

### 2026-11-11 18:35 WITA — Penyempurnaan sel libur laporan

**Perubahan**
- Sel libur memakai **hitam pekat** `#000000` (sebelumnya `#111827` yang
  kebiruan) dan font **Times New Roman, miring, tidak bold**, teks putih rata
  tengah.
- Hari libur berurutan digabung satu sel memakai `rowSpan` (helper
  `tandaiLiburBerurutan()` di `src/utils/laporan.js`), sehingga teks
  **"Libur / Off"** (reguler) atau **"Libur Shift / Off"** (shift) hanya muncul
  sekali. Kolom No dan Hari/Tanggal tetap dua baris; cakupan kolom merge tidak
  berubah (Jam Masuk → Terlambat).

**File**
- `src/components/laporan/LembarLaporan.jsx`, `src/index.css`,
  `src/utils/laporan.js`, `tests/laporan.test.js`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih.
- `npm test` **83/83** lulus (tambah uji `tandaiLiburBerurutan`).
- `npm run build` lulus **8,08 dtk**.

**Catatan/risiko**
- `rowSpan` pada baris libur di batas halaman cetak bisa terpotong; aturan
  `break-inside: avoid` pada `tr` tetap berlaku.
- Sisa: uji manual pratinjau + cetak laporan (reguler dan shift).

### 2026-11-11 18:05 WITA — Baris libur di laporan bulanan

**Perubahan**
- Baris libur pada Laporan Presensi Bulanan digabung: sel **Jam Masuk, Jam
  Pulang, Status, dan Terlambat** menjadi satu sel (`colSpan={4}`) berlatar
  hitam dengan teks putih miring.
- Teks: **"Libur / Off"** untuk pegawai reguler, **"Libur Shift / Off"** untuk
  pegawai shift. Kolom No, Hari/Tanggal, dan Shift tetap terpisah.
- Ringkasan `Libur: N hari` dan seluruh data/query tidak berubah.

**File**
- `src/components/laporan/LembarLaporan.jsx`, `src/index.css`,
  `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih.
- `npm test` **82/82** lulus.
- `npm run build` lulus **7,33 dtk**.

**Catatan/risiko**
- Latar hitam memakai tinta cukup banyak saat dicetak; `print-color-adjust:
  exact` sudah aktif sehingga warna ikut tercetak.
- Sisa: uji manual pratinjau + cetak laporan (reguler dan shift).

### 2026-11-11 17:40 WITA — Migrasi 39 dijalankan

**Perubahan**
- User melaporkan `supabase/migrations/39_status_hadir_setelah_koreksi.sql` dan
  `supabase/verifikasi_39.sql` sudah dijalankan dan berhasil.
- Status presensi terkoreksi kini **Hadir** di server; baris lama berstatus
  `Koreksi` sudah dinormalkan menjadi `Hadir`.
- Memperbarui Status Terkini, tabel migrasi, backlog **B-46**, dan Log Instruksi
  User.

**File**
- `progress.md`, `AGENTS.md`.

**Verifikasi**
- Laporan user 2026-11-11 17:40 (migrasi + verifikasi 39 lulus). Tidak ada
  perubahan kode.

**Catatan/risiko**
- Sisa: uji manual satu pengaduan yang disetujui → status `Hadir` dan terhitung
  di kolom Hadir rekapitulasi/laporan.
- Perubahan dokumen ini belum di-commit.

### 2026-11-11 17:20 WITA — Status Hadir setelah koreksi

**Perubahan**
- Presensi yang dikoreksi tidak lagi berstatus `Koreksi`: approve pengaduan
  (pulang maupun koreksi jam masuk) dan koreksi manual berakhir sebagai
  **`Hadir`**, sehingga terhitung hadir pada rekapitulasi & laporan bulanan.
- Jejak koreksi tetap terpisah: `dikoreksi_oleh`, `alasan_koreksi`, tabel
  `koreksi_presensi`, dan `pengaduan_presensi` (audit trail tidak berubah).
- Migrasi **39**: trigger `trg_normalisasi_status_koreksi` (setiap
  `Koreksi` → `Hadir`) + backfill baris lama `Koreksi` yang punya jam masuk.
  `schema.sql` disinkronkan; `verifikasi_39.sql` ditambahkan.
- Klien: `labelStatusKehadiran()` menampilkan **Hadir (Koreksi)** di laporan
  bulanan, rekapitulasi, dan riwayat pegawai (warna tetap hijau); `Koreksi`
  dihapus dari pilihan status form koreksi, kolom rekap, ringkasan laporan, dan
  daftar kartu riwayat. `reportService` kembali mengambil `alasan_koreksi`.

**File**
- `supabase/migrations/39_status_hadir_setelah_koreksi.sql` (baru),
  `supabase/verifikasi_39.sql` (baru), `supabase/schema.sql`,
- `src/utils/status.js`, `src/utils/laporan.js`,
  `src/components/laporan/LembarLaporan.jsx`,
  `src/components/admin/FormKoreksiPresensi.jsx`,
  `src/pages/admin/Rekapitulasi.jsx`, `src/pages/RiwayatSaya.jsx`,
  `src/services/reportService.js`, `tests/status.test.js`,
- `README.md`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih.
- `npm test` **82/82** lulus (tambah uji `labelStatusKehadiran`).
- `npm run build` lulus **8,63 dtk**.
- Migrasi 39 **belum dijalankan** di Supabase.

**Catatan/risiko**
- Selama migrasi 39 belum dijalankan, server masih menulis `Koreksi`; tampilan
  klien akan menampilkan "Koreksi" biasa (label baru hanya untuk `Hadir`).
- Nilai `Koreksi` tetap sah di constraint untuk data historis, tetapi trigger
  memastikan tidak ada nilai baru yang tersimpan.

### 2026-11-11 16:20 WITA — Uji manual jenis Izin lulus

**Perubahan**
- User melaporkan uji manual **jenis Izin** berhasil: pencatatan Kepala Unit
  berstatus `menunggu`, pencatatan Super Admin langsung `disetujui`, absensi/
  Alfa otomatis/pengaduan ditolak pada hari Izin, dan warna status tampil benar
  di laporan bulanan.
- Menutup backlog **B-45**; memperbarui Status Terkini dan Log Instruksi User.

**File**
- `progress.md`, `AGENTS.md`.

**Verifikasi**
- Laporan user 2026-11-11 16:20. Tidak ada perubahan kode.

**Catatan/risiko**
- Tidak ada utang teknis tersisa untuk jenis Izin.
- Perubahan dokumen ini belum di-commit.

### 2026-11-11 16:10 WITA — Rapikan komentar usang daftar jenis

**Perubahan**
- Menambahkan **Izin** pada lima komentar dokumentasi yang masih memakai daftar
  jenis lama: `src/App.jsx` (riwayat `/izin-saya`), `src/utils/izin.js` (header
  utilitas dan `statusTanpaAbsen`), `src/services/leaveService.js` (tipe JSDoc
  `kategori`), dan `src/components/layout/SidebarKepala.jsx` (isi menu).
- Tidak ada perubahan logika, UI, atau skema DB.

**File**
- `src/App.jsx`, `src/utils/izin.js`, `src/services/leaveService.js`,
  `src/components/layout/SidebarKepala.jsx`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih.
- `npm test` **81/81** lulus.
- `npm run build` lulus **12,78 dtk**.

**Catatan/risiko**
- Hanya komentar; risiko regresi nol.
- Sisa pekerjaan: uji manual jenis Izin (B-45); commit/push menunggu perintah.

### 2026-11-11 15:30 WITA — Verifikasi 38 dijalankan

**Perubahan**
- User melaporkan `supabase/verifikasi_38.sql` sudah dijalankan dan lulus,
  sehingga constraint jenis **Izin** dan RPC server terkonfirmasi.
- Memperbarui Status Terkini, tabel migrasi/verifikasi, dan backlog B-44.

**File**
- `progress.md`, `AGENTS.md`.

**Verifikasi**
- Laporan user 2026-11-11 15:30. Tidak ada perubahan kode.

**Catatan/risiko**
- Sisa: uji manual Izin (Kepala Unit menunggu, Super Admin menyetujui, absensi/
  Alfa/pengaduan ditolak pada hari Izin, warna status di laporan bulanan).
- Perubahan dokumen ini belum di-commit.

### 2026-11-11 15:25 WITA — Commit & push hari libur laporan + jenis Izin

**Perubahan**
- Memverifikasi `npm run lint` bersih, `npm test` **81/81**, dan `npm run build`
  lulus **9,07 dtk**.
- Memastikan staged diff tidak memuat rahasia, lalu commit **`d27493e`**
  (hari libur di laporan bulanan, jenis **Izin**, warna status laporan, migrasi
  38 + `verifikasi_38.sql`, label navigasi, dan dokumen audit) dan push ke
  `origin/main`.

**File**
- Seluruh perubahan I-142/I-143/I-144/I-145 yang sebelumnya ditahan lokal.

**Verifikasi**
- `npm run lint`, `npm test` **81/81**, `npm run build` **9,07 dtk**.

**Catatan/risiko**
- `verifikasi_38.sql` dan uji manual Izin masih pending.

### 2026-11-11 15:21 WITA — Migrasi 38 dijalankan

**Perubahan**
- User melaporkan `supabase/migrations/38_jenis_izin.sql` sudah dijalankan di
  Supabase. Constraint `izin_cuti.jenis` dan `presensi.status_kehadiran` kini
  menerima **Izin**, dan `submit_presensi`, `proses_alfa_otomatis`,
  `koreksi_presensi`, serta RPC pengaduan memakai aturan Izin.
- Memperbarui Status Terkini, tabel migrasi/verifikasi, dan backlog (B-44).

**File**
- `progress.md`, `AGENTS.md`.

**Verifikasi**
- Tidak ada perubahan kode; verifikasi kode terakhir tetap `npm run lint` bersih,
  `npm test` **81/81**, `npm run build` lulus **6,74 dtk**.

**Catatan/risiko**
- `verifikasi_38.sql` belum dikonfirmasi dijalankan; disarankan menjalankannya
  dan memastikan semua hasil `true`.
- Uji manual Izin (Kepala Unit menunggu, Super Admin menyetujui, warna status di
  laporan) masih pending.

### 2026-11-11 15:15 WITA — Audit pasca force close I-142/I-143

**Perubahan**
- Memastikan pekerjaan terakhir (hari libur di laporan dan jenis **Izin** +
  warna status) sudah lengkap: migrasi 38 identik dengan bagian yang
  ditambahkan ke `schema.sql`, dan definisi RPC berbeda dari versi sebelumnya
  hanya pada penambahan `Izin`.
- Menyamakan label navigasi pegawai menjadi **Dinas, Cuti & Izin** agar sesuai
  isi halaman riwayat.
- Menyinkronkan dokumen: pohon migrasi/verifikasi di `README.md` dan tabel Aspek
  di `progress.md` (migrasi 01-38, verifikasi 38, build 8,11 dtk, 81 uji).

**File**
- `src/components/BarAtas.jsx`, `README.md`, `progress.md`, `AGENTS.md`.

**Verifikasi**
- `npm run lint` bersih.
- `npm test` **81/81** lulus.
- `npm run build` lulus **6,74 dtk**.

**Catatan/risiko**
- Migrasi **38** dan `verifikasi_38.sql` masih **belum dijalankan** di Supabase;
  menu Izin dan status Izin di server baru aktif setelah migrasi dijalankan.
- Sisa uji manual: catat Izin sebagai Kepala Unit (menunggu), setujui Super
  Admin, lalu cek status Izin berwarna di laporan bulanan.

### 2026-11-11 15:00 WITA — Jenis Izin & warna status laporan

**Perubahan**
- Menambahkan jenis **Izin** sebagai menu/tab terpisah di portal Super Admin dan
  Kepala Unit; satu pegawai per pengajuan, dokumen wajib, dan alur persetujuan
  sama seperti Sakit/Cuti.
- Riwayat pegawai mendapat tab **Izin**; koreksi presensi dan ringkasan riwayat
  mengenali status Izin.
- Sel **Status** laporan bulanan diberi warna per status, termasuk **Libur**.
- Server: constraint `izin_cuti.jenis` dan `presensi.status_kehadiran` menerima
  Izin; `submit_presensi`, `proses_alfa_otomatis`, dan RPC pengaduan menolak
  status Izin agar tidak ditimpa.

**File**
- `supabase/migrations/38_jenis_izin.sql`, `supabase/verifikasi_38.sql`,
  `supabase/schema.sql`
- `src/utils/izin.js`, `src/utils/status.js`, `src/utils/laporan.js`
- `src/components/ui/Badge.jsx`, `src/components/laporan/LembarLaporan.jsx`,
  `src/index.css`
- `src/pages/admin/PengajuanIzin.jsx`, `src/pages/IzinSaya.jsx`,
  `src/pages/RiwayatSaya.jsx`, `src/components/admin/FormKoreksiPresensi.jsx`
- `src/App.jsx`, `src/components/layout/SidebarAdmin.jsx`,
  `src/components/layout/SidebarKepala.jsx`, `src/components/MenuKepala.jsx`,
  `src/components/NavigasiBawah.jsx`
- `tests/izin.test.js`, `tests/status.test.js`, `tests/laporan.test.js`,
  `README.md`, `AGENTS.md`

**Verifikasi**
- `npm run lint` bersih.
- `npm test` **81/81** lulus.
- `NODE_OPTIONS=--max-old-space-size=4096 npm run build` lulus **8,44 dtk**.

**Catatan/risiko**
- Migrasi **38** dan `verifikasi_38.sql` belum dijalankan di Supabase; menu Izin
  baru berfungsi setelah migrasi dijalankan.
- Perlu uji manual: catat Izin sebagai Kepala Unit (menunggu), setujui sebagai
  Super Admin, lalu cetak laporan bulanan dan pastikan status Izin berwarna.

### 2026-11-11 12:09 WITA — Hari libur di laporan bulanan

- **Perubahan:** Laporan Presensi Bulanan menampilkan seluruh tanggal pada
  periode, bukan hanya tanggal yang memiliki catatan presensi. Hari libur
  (akhir pekan atau libur unit, `hari_libur`, dan pegawai shift tanpa
  `jadwal_shift`) berstatus **Libur**; hari kerja tanpa catatan berstatus
  **—**; presensi nyata (Hadir/Koreksi/Sakit/Cuti/Dinas Luar) tetap didahulukan
  dan baris Alfa pada hari libur diabaikan. Ringkasan menambah jumlah hari
  libur. Data jam kerja global/override unit dan hari libur dibaca langsung
  dari klien (tanpa migrasi DB).
- **File:** `src/services/reportService.js`, `src/utils/laporan.js`,
  `src/components/laporan/LembarLaporan.jsx`,
  `src/pages/admin/LaporanBulanan.jsx`, `tests/laporan.test.js`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **78/78**; `npm run build`
  lulus **22,26 dtk** (dengan `NODE_OPTIONS=--max-old-space-size=4096` karena
  percobaan pertama kehabisan heap).
- **Catatan/risiko:** pegawai shift yang jadwalnya belum diimpor akan terbaca
  **Libur** (sesuai keputusan user); uji cetak manual A4 portrait belum
  dilakukan. Belum di-commit.

### 2026-11-06 18:31 WITA — Commit & push ringkas teks status izin

- **Perubahan:** meng-commit dan mem-push ringkasan teks kartu status izin
  `PanelAbsen` (judul hanya nama status, deskripsi berulang dihapus, pesan
  “Tidak perlu absen hari ini” tinggal satu).
- **File:** `AGENTS.md`, `progress.md`, `src/components/PanelAbsen.jsx`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **71/71**; `npm run build`
  lulus **8,62 dtk**. Commit `79a1368` di-push ke `origin/main`
  (`c417a4e..79a1368`).
- **Catatan/risiko:** uji manual tampilan di perangkat pegawai belum dilakukan.

### 2026-11-06 18:28 WITA — Ringkas teks status izin

- **Perubahan:** judul kartu status izin `PanelAbsen` kini hanya nama status
  (**Sakit**, bukan “Sakit Hari Ini”); deskripsi “Status … sudah tercatat. Tidak
  perlu absen hari ini.” dihapus; pesan **Tidak perlu absen hari ini** tinggal
  satu kali pada blok aksi.
- **File:** `src/components/PanelAbsen.jsx`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **71/71**; `npm run build`
  lulus **8,62 dtk**.
- **Catatan/risiko:** perubahan hanya teks/tampilan; tanpa migrasi. Belum
  di-commit dan belum diuji manual di perangkat.

### 2026-11-06 18:22 WITA — Commit & push panel absen izin

- **Perubahan:** memverifikasi ulang lalu meng-commit dan mem-push perbaikan
  `PanelAbsen` agar Sakit/Cuti/Dinas Luar tidak lagi ditampilkan sebagai Alfa,
  beserta helper `statusTanpaAbsen()`, uji, dan dokumentasi audit.
- **File:** `AGENTS.md`, `README.md`, `progress.md`,
  `src/components/PanelAbsen.jsx`, `src/utils/izin.js`, `tests/izin.test.js`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **71/71**; `npm run build`
  lulus **8,76 dtk**. Commit `5e48fa0` di-push ke `origin/main`
  (`5a3f163..5e48fa0`).
- **Catatan/risiko:** uji manual status Sakit/Cuti/Dinas setelah jam pulang pada
  perangkat pegawai belum dilakukan.

### 2026-11-06 17:59 WITA — Panel absen mengenali Sakit/Cuti/Dinas

- **Perubahan:** `PanelAbsen` membaca `presensi.status_kehadiran` hari ini dan
  tidak lagi menganggap ketiadaan `jam_masuk` sebagai Alfa bila statusnya
  **Sakit**, **Cuti**, **Dinas Luar**, atau **Izin** lama. Panel menampilkan
  judul `${status} Hari Ini`, keterangan bahwa tidak perlu absen, menyembunyikan
  tombol absen/pengaduan serta badge radius dan catatan lokasi. Shift malam
  kemarin yang masih terbuka tetap dapat dipulangkan. Alfa normal tetap tampil
  untuk pegawai tanpa izin.
- **File:** `src/components/PanelAbsen.jsx`, `src/utils/izin.js`,
  `tests/izin.test.js`, `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **71/71** lulus;
  `npm run build` lulus **8,76 dtk**.
- **Catatan/risiko:** tanpa migrasi DB karena `submit_presensi` dan
  `proses_alfa_otomatis` sudah menganggap status izin final. Uji manual status
  Sakit/Cuti/Dinas setelah jam pulang pada perangkat pegawai belum dilakukan.

### 2026-11-06 16:57 WITA — Commit & push laporan bulanan

- **Perubahan:** memverifikasi ulang lalu meng-commit dan mem-push pekerjaan
  laporan bulanan: blok **Riwayat Tukar Shift** dan kolom **Keterangan** dihapus,
  kolom **Shift** ditambahkan khusus pegawai pola Shift, serta dokumentasi audit
  disinkronkan.
- **File:** `AGENTS.md`, `README.md`, `progress.md`,
  `src/components/laporan/LembarLaporan.jsx`, `src/index.css`,
  `src/pages/admin/LaporanBulanan.jsx`, `src/services/reportService.js`,
  `src/utils/laporan.js`, `tests/laporan.test.js`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **68/68**; `npm run build`
  lulus **11,68 dtk**. Commit `f1511a2` di-push ke `origin/main`
  (`c531502..f1511a2`).
- **Catatan/risiko:** uji manual cetak satu pegawai Reguler dan satu pegawai
  Shift belum dilakukan.

### 2026-11-06 16:33 WITA — Keterangan dihapus & kolom Shift untuk pegawai shift

- **Perubahan:** kolom **Keterangan** dihapus dari laporan bulanan untuk semua
  pola kerja. Pegawai **Shift** mendapat kolom **Shift** setelah Hari/Tanggal
  berisi nama shift hari itu dari `jadwal_shift` (`Pagi`/`Siang`/`Malam`, `—`
  bila tidak ada jadwal). Pegawai **Reguler** tetap 6 kolom tanpa Shift.
  `reportService.js` kembali mengambil peta jadwal khusus pegawai shift dan
  berhenti mengambil alasan izin/pengaduan; `LembarLaporan.jsx` memakai prop
  `jadwal`; `labelShift()` ditambahkan dan `keteranganPresensi()` dihapus.
- **File:** `src/services/reportService.js`,
  `src/components/laporan/LembarLaporan.jsx`,
  `src/pages/admin/LaporanBulanan.jsx`, `src/utils/laporan.js`,
  `tests/laporan.test.js`, `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **68/68** lulus;
  `npm run build` lulus **7,77 dtk**.
- **Catatan/risiko:** tidak ada perubahan DB dan tidak ada data yang dihapus.
  Shift yang ditampilkan mengikuti `jadwal_shift` terkini, sehingga hasil
  **Tukar Shift** ikut tercermin. Alasan rinci Sakit/Cuti/Dinas/pengaduan tidak
  lagi tercetak karena kolom Keterangan dihapus; status kehadiran tetap tampil.
  Uji manual cetak satu pegawai Reguler dan satu pegawai Shift belum dilakukan.

### 2026-11-06 14:29 WITA — Laporan bulanan tanpa kolom Shift & riwayat tukar

- **Perubahan:** Laporan Presensi Bulanan dibuat sama untuk pegawai **Reguler**
  dan **Shift**. Kolom **Shift** pada tabel harian dan blok **Riwayat Tukar
  Shift** dihapus. `LembarLaporan.jsx` tidak lagi memakai prop `jadwal`/`tukar`
  atau helper `labelShift`/`ringkasTukar`; `reportService.js` berhenti mengambil
  `jadwal_shift` dan `tukar_shift`; `DATA_KOSONG`/prop di `LaporanBulanan.jsx`
  dibersihkan; CSS `.blok-tukar`/`.judul-tukar`/`.tabel-tukar` dihapus.
- **File:** `src/components/laporan/LembarLaporan.jsx`,
  `src/pages/admin/LaporanBulanan.jsx`, `src/services/reportService.js`,
  `src/utils/laporan.js`, `src/index.css`, `tests/laporan.test.js`, `README.md`,
  `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **69/69** lulus;
  `npm run build` lulus **14,92 dtk**.
- **Catatan/risiko:** tidak ada perubahan DB dan tidak ada data yang dihapus.
  Tabel `tukar_shift` serta `jadwal_shift` tetap utuh; menu **Tukar Shift** dan
  riwayat audit di database tetap berfungsi. Laporan tidak lagi menampilkan
  jejak tukar, sesuai keputusan user.

### 2026-11-05 16:18 WITA — Verifikasi 36–37 dikonfirmasi & dokumen disinkronkan

- **Perubahan:** user mengonfirmasi `verifikasi_36.sql` dan `verifikasi_37.sql`
  sudah dijalankan (semua pemeriksaan lulus). Dokumen audit disinkronkan:
  `README.md` memuat pohon `migrations/ 01–37`, `verifikasi_34..37.sql`, dan
  `hapus_data_testing.sql`; `AGENTS.md` memuat fakta pengaduan multi-jenis,
  koreksi jam masuk, dan aturan Keterangan laporan; `progress.md` memperbarui
  status laporan bulanan (Keterangan tanpa Alfa), migrasi 36/37, dan tabel
  verifikasi. Fixtur `pencatat` yang tidak terpakai dihapus dari uji.
- **File:** `README.md`, `AGENTS.md`, `progress.md`, `tests/laporan.test.js`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **71/71** lulus;
  `npm run build` lulus **16,32 dtk**.
- **Catatan/risiko:** tanpa perubahan kode aplikasi maupun DB.

### 2026-11-05 15:29 WITA — Judul riwayat tukar disederhanakan

- **Perubahan:** judul blok **"Riwayat Tukar Shift Bulan Ini"** pada laporan
  bulanan disederhanakan menjadi **"Riwayat Tukar Shift"**.
- **File:** `src/components/laporan/LembarLaporan.jsx`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **71/71** lulus;
  `npm run build` lulus **7,88 dtk**.
- **Catatan/risiko:** hanya teks; tidak ada perubahan DB/logika.

### 2026-11-05 15:25 WITA — Lebar kolom Riwayat Tukar Shift disesuaikan

- **Perubahan:** memperbaiki tampilan blok **Riwayat Tukar Shift** pada laporan
  bulanan. Setelah kolom "Dicatat Oleh" dihapus, `table-layout: fixed` + kolom
  Alasan 38% membuat nama rekan tukar terpotong menjadi banyak baris. Tabel
  dikembalikan ke `table-layout: auto`; kolom **Tanggal**, **Rekan Tukar**,
  **Shift Asal**, dan **Shift Pengganti** memakai `white-space: nowrap` sehingga
  nama tampil satu baris selebar namanya, sedangkan **Alasan** dibatasi 18%
  agar tidak terlalu lebar.
- **File:** `src/components/laporan/LembarLaporan.jsx`, `src/index.css`,
  `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **71/71** lulus;
  `npm run build` lulus **11,64 dtk**.
- **Catatan/risiko:** tanpa perubahan DB. Nama yang sangat panjang bisa membuat
  tabel melebar; teks alasan panjang akan membungkus di kolomnya.

### 2026-11-05 15:09 WITA — Kolom "Dicatat Oleh" di riwayat tukar dihapus

- **Perubahan:** pada blok **Riwayat Tukar Shift** di laporan bulanan, kolom
  **Dicatat Oleh** dihapus dan kolom **Alasan** dilebarkan (38%). Tabel memakai
  `table-layout: fixed` dengan `<colgroup>` proporsi tetap agar lebar konsisten.
  Data `pencatat` tidak lagi di-query (`reportService`) maupun diringkas
  (`ringkasTukar`), sehingga payload lebih ringan.
- **File:** `src/components/laporan/LembarLaporan.jsx`, `src/utils/laporan.js`,
  `src/services/reportService.js`, `src/index.css`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **71/71** lulus;
  `npm run build` lulus **9,85 dtk**.
- **Catatan/risiko:** tanpa perubahan DB. Data pencatat tetap tersimpan di tabel
  `tukar_shift`; hanya tidak ditampilkan di laporan.

### 2026-11-05 14:59 WITA — Keterangan laporan hanya izin & pengaduan

- **Perubahan:** kolom **Keterangan** laporan bulanan kini hanya berisi alasan
  **Sakit/Cuti/Dinas Luar** (dari `izin_cuti`) dan **pengaduan yang disetujui**
  (dari `pengaduan_presensi.alasan`). Alasan tidak lagi diambil dari
  `presensi.alasan_koreksi`, sehingga **koreksi manual Super Admin** (mis.
  "Izin Ke BANK BPD" pada status `Hadir`), label **Alfa**, dan **tukar shift**
  tidak tampil di Keterangan. Riwayat tukar tetap punya blok sendiri. Awalan
  "Pengaduan/Koreksi jam masuk disetujui oleh …: " dan catatan admin juga
  dibersihkan di layar **Riwayat Saya** dan **Koreksi Presensi** lewat
  `bersihkanAlasanKoreksi()`, agar yang tampil hanya alasan asli.
- **File:** `src/utils/laporan.js`, `src/services/reportService.js`,
  `src/components/laporan/LembarLaporan.jsx`, `src/pages/admin/LaporanBulanan.jsx`,
  `src/pages/RiwayatSaya.jsx`, `src/components/admin/DaftarPresensiKoreksi.jsx`,
  `tests/laporan.test.js`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **71/71** lulus (uji baru
  `bersihkanAlasanKoreksi` dan aturan Keterangan); `npm run build` lulus
  **9,99 dtk**.
- **Catatan/risiko:** tanpa perubahan DB/migrasi. Pengaduan yang disetujui
  menampilkan alasan asli pegawai; bila ada pengaduan masuk dan pulang pada
  tanggal yang sama, alasannya digabung dengan ` · `. Perlu uji cetak manual.

### 2026-11-05 14:29 WITA — Commit & push pengaduan masuk/pulang + koreksi jam masuk

- **Perubahan:** memverifikasi ulang (`npm run lint` bersih, `npm test` **70/70**,
  `npm run build` lulus **11,01 dtk**), memastikan staged diff tanpa rahasia,
  lalu commit `c14ea34` "PRESISI AMI: pengaduan absen masuk/pulang, koreksi jam
  masuk, dan pembersihan data uji" dan push ke `origin/main`
  (`5672fa0..c14ea34`). Isi commit: pengaduan multi-jenis, koreksi jam masuk,
  batas pengaduan sejak 1 November 2026, skrip `hapus_data_testing.sql`, alasan
  koreksi di laporan bulanan, perapian UI pengaduan, migrasi 35–37, verifikasi
  35–37, serta dokumen audit.
- **File:** 23 file (16 modifikasi + 7 baru).
- **Verifikasi:** lint/test/build lulus sebelum commit; `git status` bersih
  setelah push (`main...origin/main`).
- **Catatan/risiko:** deploy GitHub Pages berjalan otomatis. `verifikasi_36.sql`
  dan `verifikasi_37.sql` belum dikonfirmasi dijalankan; uji perangkat untuk
  koreksi jam masuk belum dicatat.

### 2026-11-05 14:13 WITA — Migrasi 37 dijalankan

- **Perubahan:** user menjalankan `supabase/migrations/37_batasi_pengaduan_sebelum_golive.sql`
  di Supabase. Kandidat pengaduan sebelum **1 November 2026** (29–30 Oktober)
  hilang dari halaman **Pengaduan**; kandidat data go-live (2–3 November) tetap
  tampil. Tidak ada perubahan kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** konfirmasi user (2026-11-05); `npm run lint`, `npm test` 70/70,
  dan `npm run build` tetap berlaku dari pekerjaan sebelumnya.
- **Catatan/risiko:** `verifikasi_37.sql` belum dikonfirmasi dijalankan. Semua
  perubahan di working tree masih **belum di-commit**.

### 2026-11-05 14:06 WITA — Batasi pengaduan sebelum go-live

- **Perubahan:** menambahkan migrasi **37** yang mengganti tiga fungsi pengaduan
  agar hanya berlaku untuk tanggal sejak go-live **1 November 2026**:
  `kandidat_pengaduan_presensi()` melewati tanggal sebelum batas (menghilangkan
  29–30 Oktober), `ajukan_pengaduan_presensi()` menolak pengajuan sebelum batas,
  dan `putuskan_pengaduan_presensi()` menolak memproses pengaduan lama. Penyebab
  tampilan 29–30 Oktober bukan sisa data: setelah penghapusan, tanggal itu tidak
  punya baris presensi sehingga dianggap kandidat "belum absen masuk". Kandidat
  koreksi jam masuk 2–3 November (data go-live) tetap tampil sesuai keputusan.
- **File:** `supabase/migrations/37_batasi_pengaduan_sebelum_golive.sql`,
  `supabase/verifikasi_37.sql`, `supabase/schema.sql`, `README.md`,
  `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **70/70** lulus;
  `npm run build` lulus **10,46 dtk**.
- **Catatan/risiko:** migrasi **37** dan `verifikasi_37.sql` **belum dijalankan**.
  Tanpa migrasi ini kandidat 29–30 Oktober masih muncul sampai tanggal itu keluar
  dari jendela 7 hari. Tanpa perubahan klien.

### 2026-11-05 13:48 WITA — Skrip hapus data testing sebelum go-live

- **Perubahan:** menambahkan `supabase/hapus_data_testing.sql` untuk menghapus
  **hanya** transaksi bertanggal sebelum **1 November 2026** (cutover go-live):
  `pengaduan_presensi`, `koreksi_presensi` (audit milik presensi lama),
  `presensi`, `izin_cuti` yang seluruh rentangnya sebelum cutover,
  `jadwal_shift`, dan `tukar_shift`. Data sejak 1 November 2026, akun pegawai,
  grup/unit, master shift, jam kerja, hari libur, pengaturan presensi, dan
  perangkat terdaftar **dipertahankan** (pegawai tidak perlu daftar ulang).
  Skrip transaksional, menampilkan jumlah terhapus, dan menyertakan query
  verifikasi (hitungan sebelum cutover harus 0). Foto bukti di bucket
  `dokumen-izin` tidak ikut terhapus; blok opsional disediakan (dikomentari).
- **File:** `supabase/hapus_data_testing.sql`, `README.md`, `progress.md`,
  `AGENTS.md`.
- **Verifikasi:** tidak ada perubahan kode; `npm run lint`, `npm test` (70/70),
  dan `npm run build` tetap berlaku dari pekerjaan sebelumnya. Skrip SQL **belum
  dijalankan**.
- **Catatan/risiko:** jalankan di luar jam operasional dan **backup** dulu.
  Skrip tidak menghapus pegawai/grup/master; jika `cleanup_data_uji.sql` pernah
  dipakai, skrip ini tetap aman dijalankan. Data uji bertanggal ≥ 1 November
  2026 (jika ada) tidak terhapus.

### 2026-11-05 13:42 WITA — Koreksi jam masuk lewat pengaduan

- **Perubahan:** pengaduan jenis `masuk` kini juga dapat **mengoreksi jam masuk
  yang sudah tercatat** (mis. datang 07.50 tetapi baru bisa absen 08.30).
  Migrasi **36** mengganti tiga fungsi: (1) jendela validasi jam masuk disamakan
  dengan tombol absen — dibuka **60 menit sebelum jam masuk** sampai jam selesai
  (termasuk H+1 shift malam), sehingga jam 07.50 untuk jadwal 08.00 diterima;
  (2) `ajukan` hanya menerima koreksi bila presensi berstatus `Hadir`, belum
  pernah dikoreksi, dan jam yang diajukan **lebih awal** dari jam tercatat;
  (3) persetujuan mengganti jam masuk, menghitung ulang `menit_terlambat`,
  mengubah status menjadi `Koreksi`, dan menyimpan jejak koreksi;
  (4) `kandidat` menampilkan baris koreksi untuk presensi yang saat ini
  terlambat (`menit_terlambat > 0`) dan belum dikoreksi. UI: label
  **"Koreksi jam masuk · tercatat HH:MM"**, helper/validasi di form dan modal
  putusan, serta baris **"Tercatat"** di riwayat.
- **File:** `supabase/migrations/36_koreksi_jam_masuk.sql`,
  `supabase/verifikasi_36.sql`, `supabase/schema.sql`,
  `src/pages/Pengaduan.jsx`, `src/components/pengaduan/FormPengaduan.jsx`,
  `src/components/pengaduan/ModalPutusanPengaduan.jsx`,
  `src/components/pengaduan/DaftarPengaduan.jsx`, `README.md`, `progress.md`,
  `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **70/70** lulus;
  `npm run build` lulus **9,34 dtk**.
- **Catatan/risiko:** migrasi **36** dan `verifikasi_36.sql` **belum dijalankan**
  di Supabase. Koreksi hanya ke arah lebih awal; pengaduan yang sudah pernah
  dikoreksi ditolak. Tidak ada perubahan tabel/kolom. Belum ada uji perangkat.

### 2026-11-05 13:13 WITA — Pengaduan multi-jenis: absen masuk + pulang

- **Perubahan:** memperluas pengaduan presensi agar mencakup **absen masuk** dan
  **absen pulang** (Fase 1). Skema `pengaduan_presensi`: kolom `jenis`
  (`masuk`/`pulang`, baris lama otomatis `pulang`), `presensi_id` dan
  `jam_pulang_diajukan` boleh kosong, tambah `jam_masuk_diajukan`/`jam_masuk_disetujui`,
  serta index tunggu per `(user_id, tanggal, jenis)`. RPC: `ajukan_pengaduan_presensi`
  kini menerima `jenis/tanggal/jam`; `putuskan_pengaduan_presensi` menambah
  `p_jam_masuk` (Kepala Unit/Super Admin, tetap tidak boleh memutuskan sendiri);
  RPC baru `kandidat_pengaduan_presensi()` mengembalikan tanggal 7 hari terakhir
  yang bisa diadukan; `daftar_pengaduan_presensi()` memuat jenis dan join presensi
  lewat `(user_id, tanggal)`. Persetujuan absen masuk mengisi/membuat baris
  presensi (`Hadir`), menghitung `menit_terlambat` dari jadwal, dan menyimpan
  jejak koreksi. Klien: service, halaman pengaduan, form (jam masuk/pulang),
  daftar, modal putusan, dan tombol **Ajukan Pengaduan** di Panel Absen saat Alfa.
- **File:** `supabase/migrations/35_pengaduan_masuk.sql`, `supabase/verifikasi_35.sql`,
  `supabase/schema.sql`, `supabase/cleanup_data_uji.sql`,
  `src/services/pengaduanService.js`, `src/pages/Pengaduan.jsx`,
  `src/components/pengaduan/FormPengaduan.jsx`,
  `src/components/pengaduan/DaftarPengaduan.jsx`,
  `src/components/pengaduan/ModalPutusanPengaduan.jsx`,
  `src/components/PanelAbsen.jsx`, `src/pages/admin/PengaduanKepala.jsx`,
  `README.md`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **70/70** lulus;
  `npm run build` lulus **8,38 dtk**.
- **Catatan/risiko:** migrasi **35** dan `verifikasi_35.sql` **belum dijalankan**
  di Supabase; sebelum itu fitur absen masuk tidak berfungsi (RPC lama sudah
  diganti). Wajib foto bukti + persetujuan Kepala Unit; jam harus di dalam jendela
  jadwal dan maksimal 7 hari. Belum ada uji perangkat.

### 2026-11-05 12:39 WITA — Alasan koreksi di laporan bulanan

- **Perubahan:** kolom **Keterangan** pada Laporan Presensi Bulanan kini menampilkan
  alasan koreksi (`presensi.alasan_koreksi`) untuk semua baris yang pernah dikoreksi,
  termasuk baris berstatus `Hadir` hasil pengaduan, menggantikan tanda `—`. Alasan
  ditampilkan penuh dan membungkus di kolom. Logika keterangan dipindahkan dari
  komponen ke `keteranganPresensi()` agar teruji. Prioritas: alasan koreksi → Alfa →
  alasan izin (Sakit/Cuti/Dinas Luar) → tukar shift → `—`. Ini mengembalikan sebagian
  keputusan I-047 yang sebelumnya menghapus alasan koreksi dari laporan.
- **File:** `src/services/reportService.js`, `src/utils/laporan.js`,
  `src/components/laporan/LembarLaporan.jsx`, `tests/laporan.test.js`,
  `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **70/70** lulus (2 uji baru untuk
  `keteranganPresensi`); `npm run build` lulus **9,13 dtk**.
- **Catatan/risiko:** tanpa perubahan DB/RPC. Alasan pengaduan yang panjang
  (mis. "Pengaduan disetujui oleh …: …") akan membungkus beberapa baris; belum diuji
  cetak manual di perangkat.

### 2026-11-05 12:05 WITA — Perapian panel lupa absen pulang & halaman pengaduan

- **Perubahan:** merapikan tampilan `PanelAbsen` dan halaman `/pengaduan`. (1) Dua
  Alert panjang untuk lupa absen pulang ("Presensi Kemarin Belum Ditutup" dan
  "Batas Absen Pulang Terlewat") digabung menjadi satu Alert **"Lupa Absen Pulang"**
  dengan satu kalimat dan tombol **Ajukan Pengaduan** blok penuh. (2) Alert
  "Absen Pulang Belum Dibuka" disembunyikan saat alert lupa tampil dan teksnya
  dipersingkat; "Absen Masuk Belum Dibuka" juga dipersingkat. (3) Deskripsi panel
  tidak lagi menampilkan kalimat "Absen pulang sebelum meninggalkan area..." saat
  batas pulang terlewat. (4) Halaman pengaduan: deskripsi dipersingkat, baris
  presensi ditata satu baris dengan tombol **Ajukan** ringkas, badge menunggu
  disingkat. (5) Form pengaduan memakai pemilih foto bergaya (dropzone) menggantikan
  input file bawaan, helper text dipersingkat, dan baris aksi memakai `.aksi-modal`.
- **File:** `src/components/PanelAbsen.jsx`, `src/pages/Pengaduan.jsx`,
  `src/components/pengaduan/FormPengaduan.jsx`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **68/68** lulus;
  `npm run build` lulus **9,43 dtk**.
- **Catatan/risiko:** hanya tampilan; tidak ada perubahan logika, RPC, atau DB.
  Uji visual di perangkat belum dilakukan.

### 2026-11-05 11:23 WITA — Konfirmasi uji manual pasca go-live

- **Perubahan:** user mengonfirmasi seluruh sisa uji manual pasca go-live:
  `verifikasi_34.sql` lulus; tombol **Absen Masuk** nonaktif setelah jam selesai
  jadwal berjalan; pegawai **Bebas Radius** dapat absen di luar area berjalan;
  kasus GPS meleset dianggap kesalahan perangkat pengguna (tidak diungkit lagi,
  B-29 ditutup); fallback **white screen** setelah deploy aman; serta **tukar
  shift**, laporan bulanan, dan **cetak F4 landscape** aman. Tidak ada perubahan
  kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** konfirmasi manual user (2026-11-05); verifikasi lokal terakhir
  tetap berlaku (lint bersih, `npm test` **68/68**, build lulus).
- **Catatan/risiko:** tidak ada sisa item backlog uji manual; dokumen ditahan di
  working tree sampai perintah commit/push.

### 2026-11-04 21:35 WITA — Commit & push notifikasi Alfa

- **Perubahan:** memverifikasi ulang (`npm run lint` bersih, `npm test` **68/68**,
  `npm run build` lulus **7,77 dtk**), memastikan staged diff tanpa rahasia, lalu
  commit `0d3a902` "PRESISI AMI: notifikasi Alfa saat absen masuk terlewat" dan
  push ke `origin/main` (`22c9415..0d3a902`).
- **File:** 3 file (`PanelAbsen.jsx`, `progress.md`, `AGENTS.md`).
- **Verifikasi:** `git status -sb` bersih (`main...origin/main`).
- **Catatan/risiko:** deploy GitHub Pages otomatis; uji visual di perangkat belum.

### 2026-11-04 21:30 WITA — Notifikasi Alfa menggantikan "Absen Masuk Ditutup"

- **Perubahan:** ketika jam absen masuk terlewat, `PanelAbsen` tidak lagi
  menampilkan penjelasan teknis. Judul status, deskripsi, dan label tombol masuk
  menjadi **"Alfa Hari Ini"** / **"Anda tercatat Alfa hari ini."**; gradasi header
  berubah menjadi **merah** (`from-rose-600 to-rose-700`) dengan prioritas
  Alfa > lengkap > normal; Alert "Absen Masuk Ditutup" dihapus karena duplikatif.
  Logika penguncian tombol (`terkunciMasuk`) dan server tidak diubah — Alfa tetap
  dibentuk `proses_alfa_otomatis`.
- **File:** `src/components/PanelAbsen.jsx`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **68/68** lulus;
  `npm run build` lulus **9,35 dtk**.
- **Catatan/risiko:** hanya tampilan; pegawai libur dan shift malam kemarin tidak
  terpengaruh karena `masukTerlewat` memerlukan jadwal hari ini. Uji visual di
  perangkat belum dilakukan.

### 2026-11-04 21:00 WITA — Commit & push tutup absen masuk + ACC pengaduan

- **Perubahan:** memverifikasi ulang (`npm run lint` bersih, `npm test` **68/68**,
  `npm run build` lulus **7,60 dtk**), memastikan staged diff tanpa rahasia, lalu
  commit `07f340e` "PRESISI AMI: tutup absen masuk, ACC pengaduan Super Admin,
  tab berwarna" dan push ke `origin/main` (`a9279f9..07f340e`). Isi commit:
  tutup tombol Absen Masuk pada jam selesai jadwal (klien), migrasi 34 + verifikasi 34
  untuk ACC pengaduan Super Admin, `TabBar` berwarna & berikon, serta sinkronisasi
  dokumen audit.
- **File:** 13 file (11 modifikasi + 2 baru: migrasi 34 & `verifikasi_34.sql`).
- **Verifikasi:** lint/test/build lulus sebelum commit; `git status -sb` bersih
  (`main...origin/main`).
- **Catatan/risiko:** deploy GitHub Pages berjalan otomatis; uji manual perangkat
  untuk B-40 (ACC Super Admin) dan B-41 (tombol Absen Masuk nonaktif) masih belum.

### 2026-11-04 20:45 WITA — Tab berwarna & berikon

- **Perubahan:** `TabBar` kini menampilkan ikon garis dan warna berbeda per
  kategori: Data Presensi (sky, ikon dokumen), Audit Trail (amber, ikon jam),
  Riwayat Pengaduan (violet, ikon balon), Menunggu/Pending (amber), Disetujui
  (emerald, centang), Ditolak (rose, silang), Dibatalkan (slate), Semua (slate),
  Dinas & Sakit (rose), Cuti (teal). Nilai tak dikenal memakai gaya lama
  (sky aktif / putih diam). Alias `pending`/`approved`/`rejected` dipetakan agar
  Verifikasi Perangkat ikut berwarna.
- **File:** `src/components/ui/TabBar.jsx`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **68/68** lulus;
  `npm run build` lulus **9,41 dtk**.
- **Catatan/risiko:** hanya tampilan; tanpa perubahan logika maupun DB. Uji visual
  di perangkat belum dilakukan.

- **Catatan/risiko:** tidak ada perubahan logika. Migrasi **34** dan
  `verifikasi_34.sql` saat itu belum dijalankan (B-40); uji manual
  tombol Absen Masuk nonaktif (B-41) juga belum.

### 2026-11-04 20:15 WITA — Migrasi 34 dijalankan

- **Perubahan:** user menjalankan `supabase/migrations/34_superadmin_putuskan_pengaduan.sql`
  di Supabase. Fungsi `putuskan_pengaduan_presensi` kini mengizinkan Super Admin
  (tanpa cek unit, tetap menolak pengaduan sendiri). Dokumen audit diperbarui:
  Status Terkini, tabel migrasi 34, tabel verifikasi, dan backlog B-40.
- **File:** `progress.md`.
- **Verifikasi:** tidak ada perubahan kode; verifikasi lokal sebelumnya tetap
  berlaku (lint bersih, `npm test` 68/68, build lulus).
- **Catatan/risiko:** `verifikasi_34.sql` **belum dikonfirmasi** dijalankan, dan
  uji manual ACC Super Admin serta tombol Absen Masuk nonaktif (B-41) belum.

### 2026-11-04 20:05 WITA — Lanjutan pasca limit: sinkronisasi dokumen ACC pengaduan

- **Perubahan:** melanjutkan pekerjaan I-115 yang terhenti karena limit. Kode
  sudah lengkap; yang tertinggal hanya sisa teks dokumen yang masih menyebut
  Super Admin "baca-saja" pada pengaduan. Disinkronkan di komentar
  `DaftarPengaduan.jsx` dan `Pengaduan.jsx`, README (tabel keamanan + Koreksi
  Presensi), AGENTS.md (fakta pengaduan), serta `progress.md` (Status Terkini,
  tabel migrasi 33/34, commit terbaru, jumlah uji 68, backlog B-40/B-41).
- **File:** `src/components/pengaduan/DaftarPengaduan.jsx`, `src/pages/Pengaduan.jsx`,
  `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **68/68** lulus;
  `npm run build` lulus **8,47 dtk**.
- **Catatan/risiko:** tidak ada perubahan logika. Migrasi **34** dan
  `verifikasi_34.sql` tetap **belum dijalankan** di Supabase (B-40); uji manual
  tombol Absen Masuk nonaktif (B-41) juga belum.

### 2026-11-04 19:30 WITA — Tutup absen masuk & ACC pengaduan Super Admin

- **Perubahan:** (1) Tombol **Absen Hadir** kini nonaktif tepat pada jam selesai
  jadwal. Ditambahkan `tutupAbsenMasuk()` di `jadwalAbsen.js` (shift malam H+1),
  `masukTerlewat` di `PanelAbsen.jsx`, Alert "Absen Masuk Ditutup", dan label
  tombol baru. Server tidak diubah karena `submit_presensi` sudah menolak absen
  masuk setelah jam kerja berakhir. (2) Migrasi **34** mengizinkan
  `is_superadmin()` pada `putuskan_pengaduan_presensi`; Super Admin tidak terikat
  cek unit, tetapi semua peran tetap tidak dapat memutuskan pengaduan sendiri.
  (3) Tab **Riwayat Pengaduan** di `KoreksiPresensi.jsx` kini menampilkan tombol
  Tinjau dan `ModalPutusanPengaduan` untuk Super Admin.
- **File:** `src/utils/jadwalAbsen.js`, `src/components/PanelAbsen.jsx`,
  `src/pages/admin/KoreksiPresensi.jsx`, `tests/jadwalAbsen.test.js`,
  `supabase/migrations/34_superadmin_putuskan_pengaduan.sql`,
  `supabase/verifikasi_34.sql`, `supabase/schema.sql`, `README.md`,
  `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **68/68** lulus;
  `npm run build` lulus **8,65 dtk**. Uji unit baru: reguler ditutup 16.30,
  shift malam ditutup 08.00 H+1, jadwal kosong `null`.
- **Catatan/risiko:** migrasi **34** dan `verifikasi_34.sql` **belum dijalankan**
  di Supabase; sebelum itu tombol Tinjau Super Admin akan gagal dengan pesan
  "Hanya Kepala Unit...". Data presensi 30 Okt 2026 yang muncul di pengaduan
  masih perlu dicek; hapus hanya setelah dikonfirmasi sebagai data uji.

### 2026-11-04 18:40 WITA — Pembersihan teks UI AI slop

- **Perubahan:** membersihkan teks UI yang bertele-tele/duplikatif di portal
  pegawai dan admin. Rincian: sapaan "Selamat datang" + "Halo" di Dashboard
  disisakan satu; peringatan perangkat yang tampil di `PanelAbsen` dan
  `KartuStatusPerangkat` diringkas ke kartu status; emoji pesan libur dibatasi
  satu per pesan; filler `KartuShift`/`PanelAbsen` dihapus; teks developer
  `.env` di Login hanya tampil saat `import.meta.env.DEV` (produksi: "Aplikasi
  belum dikonfigurasi. Hubungi Admin IT."); deskripsi 13 halaman admin
  dipendekkan menjadi satu baris; pengulangan penjelasan Alfa di Pengaturan
  Presensi dikompres; Alert duplikat di Pengajuan Izin dihapus; label `v2.0`
  dihapus; "Kepala Ruangan" → "Kepala Unit" dan "Kamu" → "Anda" diseragamkan
  (termasuk tanda tangan cetak jadwal). Tanpa perubahan logika, DB, atau teks
  resmi laporan bulanan.
- **File:** `src/pages/Dashboard.jsx`, `src/components/PanelAbsen.jsx`,
  `src/components/kartu/{KartuShift,KartuStatusPerangkat,KartuProfil}.jsx`,
  `src/pages/Login.jsx`, `src/components/pengaduan/FormPengaduan.jsx`,
  `src/pages/{Pengaduan,IzinSaya,RiwayatSaya}.jsx`,
  `src/pages/admin/{DataPegawai,GrupShift,HariLibur,JadwalShift,JamKerjaUnit,KepalaUnit,KoreksiPresensi,LaporanBulanan,MasterShift,PengaduanKepala,PengajuanIzin,PengaturanPresensi,Rekapitulasi,VerifikasiPerangkat}.jsx`,
  `src/components/layout/{SidebarAdmin,SidebarKepala,PortalKepalaLayout}.jsx`,
  `src/components/{BarAtas,MenuKepala,ProtectedRoute}.jsx`,
  `src/components/laporan/LembarJadwal.jsx`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **67/67** lulus;
  `npm run build` lulus **12,33 dtk**. Grep residu: tidak ada deskripsi
  halaman >70 karakter, tidak ada "Kamu"/"v2.0"/"Kepala Ruangan" pada teks UI
  (hanya komentar kode).
- **Catatan/risiko:** perubahan hanya teks; alur absensi, validasi server,
  laporan, dan migrasi tidak berubah. Perlu uji tampilan manual singkat di HP
  dan desktop sebelum commit.

### 2026-11-04 18:20 WITA — Cek status pasca forceclose

- **Perubahan:** memeriksa status pekerjaan terakhir setelah forceclose lewat
  `git status`/`git reflog`/`git fsck --lost-found`, entri `progress.md`,
  backlog, serta kelengkapan migrasi `01`–`33` dan `verifikasi_*.sql`. Tidak
  ditemukan pekerjaan kode yang tertinggal: working tree bersih dan seluruh
  pekerjaan terakhir (**Pengaduan Presensi**, migrasi 33) sudah di-commit
  `c1e56f7`, diikuti sinkronisasi dokumen audit `3718cb1` dan push ke
  `origin/main`. Satu objek dangling yang ditemukan adalah `progress.md` versi
  lama (2026-10-29), bukan pekerjaan hilang. Tidak ada perubahan kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih, `npm test` **67/67** lulus,
  `npm run build` lulus **10,68 dtk**. Migrasi `01`–`33` lengkap; verifikasi
  `09`–`33` lengkap.
- **Catatan/risiko:** sisa pekerjaan hanya **uji manual**: B-28 (bebas radius),
  B-29 (akurasi GPS, ditahan), B-30 (koreksi shift malam H+1), B-31 (fallback
  white screen setelah deploy), B-37 (tukar shift, laporan, cetak jadwal F4).

### 2026-11-04 17:35 WITA — Konfirmasi migrasi 33, B-26, B-35, B-38, B-39

- **Perubahan:** user mengonfirmasi **migrasi 33** dan `verifikasi_33.sql` sudah
  dijalankan dan diuji, **B-35** (uji komponen UI baru) selesai, dan **B-26**
  (Alfa otomatis) sudah berjalan. Tidak ada perubahan kode; hanya pembaruan
  dokumen audit.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** klaim user 2026-11-04 17:35; `npm run lint` bersih,
  `npm test` **67/67**, `npm run build` lulus **6,95 dtk** (percobaan pertama
  kehabisan memori Node; diulang dengan `NODE_OPTIONS=--max-old-space-size=4096`).
  Commit `c1e56f7` dan push ke `origin/main`.
- **Catatan/risiko:** pekerjaan **Pengaduan Presensi** sudah di-commit
  `c1e56f7` dan di-push ke `origin/main`. Sisa uji manual: B-37 (tukar shift,
  laporan, cetak jadwal F4), B-28 (bebas radius), dan B-29 (akurasi GPS,
  ditahan).

### 2026-11-04 17:12 WITA — Pengaduan absen pulang (migrasi 33)

- **Perubahan:** melanjutkan rencana pengaduan presensi yang sempat terhenti
  karena forceclose. Pegawai dapat mengadukan presensi yang sudah memiliki
  `jam_masuk` tetapi belum `jam_pulang` (reguler/shift, maks. 7 hari) lewat menu
  **Pengaduan**. Form mewajibkan jam pulang, alasan min. 10 karakter, dan foto
  bukti JPG/PNG (kompres otomatis ≤ 1 MB); shift malam otomatis H+1. Kepala unit
  meninjau di menu **Pengaduan Presensi**: setuju (jam pulang boleh disesuaikan)
  atau tolak (catatan wajib), tidak dapat menyetujui pengaduan sendiri.
  Persetujuan mengisi `presensi.jam_pulang`, status `Koreksi`, dan `alasan_koreksi`;
  riwayat tetap tersimpan. Super Admin dapat menyetujui/menolak pengaduan di tab
  **Riwayat Pengaduan** (migrasi 34; tanpa ACC pengaduan sendiri). Server memakai RPC `SECURITY DEFINER`
  (`ajukan_pengaduan_presensi`, `putuskan_pengaduan_presensi`,
  `daftar_pengaduan_presensi`, `validasi_dokumen_pengaduan`), RLS baca per peran,
  dan policy unggah foto prefix `pengaduan/<user_id>/`.
- **File:** `supabase/migrations/33_pengaduan_presensi.sql`,
  `supabase/verifikasi_33.sql`, `supabase/schema.sql`,
  `src/services/pengaduanService.js`, `src/utils/pengaduan.js`,
  `src/pages/Pengaduan.jsx`, `src/pages/admin/PengaduanKepala.jsx`,
  `src/components/pengaduan/{FormPengaduan,DaftarPengaduan,ModalPutusanPengaduan}.jsx`,
  `src/App.jsx`, `src/components/BarAtas.jsx`,
  `src/components/NavigasiBawah.jsx`, `src/components/PanelAbsen.jsx`,
  `src/components/layout/{PortalKepalaLayout,SidebarKepala}.jsx`,
  `src/pages/admin/KoreksiPresensi.jsx`, `tests/pengaduan.test.js`, `README.md`,
  `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **67/67** lulus;
  `npm run build` lulus **7,47 dtk**. Audit ulang pra-commit: `schema.sql`
  identik dengan migrasi 33, RPC/policy memakai pola migrasi 32, dan tombol
  persetujuan disembunyikan untuk pengaduan milik kepala sendiri.
- **Catatan/risiko:** migrasi **33** dan `verifikasi_33.sql` **belum dijalankan**
  di Supabase, sehingga menu pengaduan akan gagal sampai migrasi dijalankan. Uji
  manual alur ajukan → setujui/tolak → laporan belum dilakukan. Pengaduan yang
  presensinya sudah terisi `jam_pulang` (mis. pegawai akhirnya absen pulang)
  tidak dapat disetujui; kepala unit dapat menolaknya dengan catatan.

### 2026-11-04 16:22 WITA — Cetak jadwal UGD jadi satu halaman

- **Perubahan:** jadwal shift unit UGD tercetak 2 halaman karena kolom nama
  42 mm membuat nama panjang turun ke baris kedua sehingga tinggi tabel
  melewati area F4. Disesuaikan di `src/index.css`:
  - kolom **Nama Pegawai** 58 mm, kolom **No** 7 mm (tanggal tetap ±8 mm);
  - font tabel 7 pt, `line-height` 1.05, padding sel 0.6 × 0.5 mm, hari 5,5 pt;
  - legenda 2 mm, `.ttd-jadwal` 4 mm dan ruang tanda tangan 10 mm.
  Footer tetap menempel dasar kertas lewat flex kolom `.lembar-jadwal`.
  Perkiraan kapasitas ±29 baris dalam satu halaman F4 landscape.
- **File:** `src/index.css`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **63/63** lulus;
  `npm run build` lulus **7,68 dtk**. Belum diverifikasi cetak manual di
  perangkat.
- **Catatan/risiko:** bila driver printer memakai margin lebih lebar dan
  masih 2 halaman, opsi cadangan mengecilkan margin `@page` dari 8 mm ke 6 mm.

### 2026-11-04 16:15 WITA — Nama tanda tangan cetak jadwal memakai nama kepala unit

- **Perubahan:** cetak jadwal menampilkan `agushidayat` (nama akun) untuk kepala
  **ASN**, padahal field **Nama untuk Tanda Tangan** sudah berisi
  `Ns. Agus Hidayat, S.Tr.Kep`. `cetakJadwal()` di `JadwalShift.jsx` tidak lagi
  memakai `profil.nama` / `daftar_kepala_unit().nama`, melainkan RPC yang sudah
  ada `public.nama_kepala_unit(unit)` — mengembalikan `pegawai.nama` untuk kepala
  non-ASN dan `kepala_unit.nama_kepala` untuk kepala ASN. Berlaku untuk kepala
  yang mencetak sendiri maupun Super Admin, dan per unit (kepala multi-unit).
- **File:** `src/services/kepalaUnitService.js` (`ambilNamaKepalaUnit`),
  `src/pages/admin/JadwalShift.jsx`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **63/63** lulus;
  `npm run build` lulus **11,79 dtk**. Tidak ada migrasi DB/data.
- **Catatan/risiko:** kepala non-ASN tetap memakai `pegawai.nama` apa adanya
  (opsi A, sesuai keputusan user). Perlu cek manual di akun kepala ASN. Belum
  di-commit.

### 2026-11-04 15:55 WITA — Footer jadwal dipatok & impor jadwal hanya Excel

- **Perubahan:**
  - Footer **Cetak Jadwal** (`.footer-laporan` di `LembarJadwal`) kini menempel
    di dasar kertas: `.lembar-jadwal` menjadi flex kolom dan tinggi cetak
    `calc(215mm - 17mm)` (F4 215 mm dikurangi margin `@page` 8 mm atas/bawah).
  - **CSV dihapus dari Jadwal Shift.** Template hanya Excel `.xlsx`; tombol
    **Unduh CSV** dihapus, input hanya menerima `.xlsx`, dan file `.csv`
    ditolak dengan pesan *"Format file harus Excel (.xlsx)."*.
    `unduhTemplateCsv()`, `parseCsv()`, `deteksiPemisah()`, dan `csvBaris()`
    dihapus dari `templateJadwal.js` (tidak dipakai lagi).
  - **Laporan error impor** kini juga Excel `.xlsx` (sheet `Error`, kolom
    Baris/Tanggal/Pesan) lewat `unduhLaporanErrorJadwal()`.
  - Teks arahan pada modal **Template & Impor** dan sheet **Petunjuk** di
    template diperbarui: hanya Excel (.xlsx).
- **File:** `src/index.css`, `src/utils/templateJadwal.js`,
  `src/pages/admin/JadwalShift.jsx`, `tests/templateJadwal.test.js`,
  `src/services/shiftService.js`, `supabase/schema.sql` (komentar),
  `README.md`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **63/63** lulus (uji baru:
  impor menolak `.csv`); `npm run build` lulus **11,08 dtk**.
- **Catatan/risiko:** migrasi 14 dan `verifikasi_14.sql` tidak diubah karena
  historis dan sudah dijalankan; RPC server tetap sama. Cetak jadwal & impor
  Excel perlu dicek manual di perangkat. Belum di-commit.

### 2026-11-04 15:35 WITA — Seimbangkan lebar kolom tabel laporan

- **Perubahan:** setelah kolom Shift dihilangkan untuk pegawai Reguler,
  kolom **Keterangan** memuai (42%) dan menghimpit **Terlambat** sampai
  pecah "Terlamb at". `.tabel-laporan` kini memakai `table-layout: fixed`
  agar lebar `colgroup` dipatuhi. Proporsi baru:
  - **Reguler (7 kolom):** 6 / 21 / 12 / 12 / 11 / 10 / 28 (%).
  - **Shift (8 kolom):** 5 / 18 / 16 / 10 / 10 / 10 / 10 / 21 (%).
- **File:** `src/components/laporan/LembarLaporan.jsx`, `src/index.css`,
  `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **62/62** lulus;
  `npm run build` lulus **15,76 dtk**.
- **Catatan/risiko:** tetap perlu cek visual/cetak pada perangkat; angka
  proporsi dapat digeser ±1–2% bila masih terasa sempit. Belum di-commit.

### 2026-11-04 15:29 WITA — Footer laporan dipatok & kolom Shift khusus pegawai shift

- **Perubahan:** footer laporan (`Dicetak melalui PRESISI-AMI, <tanggal>`)
  dipatok permanen di dasar kertas, baik pada pratinjau layar maupun cetak,
  dengan `.lembar-laporan` dijadikan flex kolom (`margin-top: auto` pada
  footer). Teks **Halaman X dari Y** dihapus beserta prop `halaman`/
  `totalHalaman`. Kolom **Shift** pada laporan bulanan kini hanya dirender
  untuk pegawai berpola **Shift** (`pegawai.pola_kerja !== 'reguler'`);
  pegawai **Reguler** memakai tabel 7 kolom tanpa kolom Shift (lebar kolom
  Keterangan melebar). Blok **Riwayat Tukar Shift** tetap hanya muncul bila
  ada tukar.
- **File:** `src/components/laporan/LembarLaporan.jsx`,
  `src/pages/admin/LaporanBulanan.jsx`, `src/index.css`, `progress.md`,
  `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **62/62** lulus;
  `npm run build` lulus **14,43 dtk**.
- **Catatan/risiko:** tinggi minimum cetak memakai
  `calc(297mm - 25mm)` agar footer menempel dasar A4 tanpa memicu halaman
  kosong; bila satu laporan tumpah ke halaman kedua, footer mengikuti halaman
  terakhir. Belum di-commit sesuai alur Git.

### 2026-11-04 15:08 WITA — Migrasi 32 & verifikasi 32 berhasil dijalankan

- **Perubahan:** user melaporkan `supabase/migrations/32_tukar_shift.sql` dan
  `supabase/verifikasi_32.sql` sudah dijalankan dan **sukses** di Supabase.
  Tabel `tukar_shift`, RPC `tukar_shift()`, dan RLS-nya kini aktif, sehingga
  tombol **Tukar Shift** dan riwayat tukar di laporan bulanan berfungsi.
  Status Terkini, tabel migrasi, dan backlog B-36 diperbarui. Tidak ada
  perubahan kode.
- **File:** `progress.md`, `AGENTS.md`, `README.md` (status).
- **Verifikasi:** laporan user 2026-11-04; verifikasi kode terakhir tetap
  `npm run lint` bersih, `npm test` **62/62**, `npm run build` lulus.
- **Catatan/risiko:** sisa pekerjaan hanya **uji manual** tukar shift & cetak
  jadwal F4 landscape (B-37), lalu commit/push menunggu perintah user.

### 2026-11-04 15:01 WITA — Lanjutan pasca forceclose: audit tukar shift & cetak jadwal

- **Perubahan:** melanjutkan pekerjaan terakhir (I-102/I-103) setelah sesi
  terputus. Diperiksa seluruh bagian yang seharusnya ada dan ternyata sudah
  lengkap di working tree: migrasi **32** + `verifikasi_32.sql` + sinkron
  `schema.sql`, RPC `tukar_shift()` di `shiftService.js`, modal **Tukar Shift**
  di `JadwalShift.jsx`, tombol **Cetak Jadwal** + `LembarJadwal.jsx` +
  `utils/jadwalCetak.js` + gaya cetak F4 landscape di `index.css`, kolom
  **Shift** & blok **Riwayat Tukar** di laporan bulanan (`reportService.js`,
  `LembarLaporan.jsx`, `utils/laporan.js`), uji `jadwalCetak.test.js` dan
  `laporan.test.js`, serta README/AGENTS/progress. Tidak ada yang tertinggal.
- **File:** tidak ada perubahan kode baru; hanya pembaruan dokumen audit ini.
- **Verifikasi:** `npm run lint` bersih; `npm test` **62/62** lulus;
  `npm run build` lulus **14,14 dtk**. Migrasi 32 **belum dijalankan** di
  Supabase.
- **Catatan/risiko:** fitur Tukar Shift dan Cetak Jadwal baru aktif setelah
  `supabase/migrations/32_tukar_shift.sql` dan `supabase/verifikasi_32.sql`
  dijalankan di project Supabase yang benar. Belum di-commit/di-push sesuai
  alur Git (menunggu perintah user).

### 2026-11-04 14:31 WITA — Tukar shift teraudit & cetak jadwal shift
- **Perubahan:** menindaklanjuti kebutuhan audit tukar shift pegawai pola
  kerja shift. Ditambahkan tabel `tukar_shift` (satu baris = satu kejadian,
  satu tanggal, dua pegawai, shift asal/pengganti, alasan, pelaku) dan RPC
  `tukar_shift()` yang mengunci dua baris `jadwal_shift` (`for update`),
  menukar `shift_id`, lalu menulis catatan audit secara atomik. Kepala unit
  hanya untuk unit yang dikelola pada tanggal hari ini/setelahnya; Super Admin
  bebas termasuk tanggal lampau. RLS baca untuk Super Admin, kepala unit, dan
  pegawai yang terlibat; tulis hanya lewat RPC.
  - UI: tombol **Tukar Shift** di menu Jadwal Shift dengan modal tanggal +
    dua pegawai + alasan opsional, serta pratinjau shift saat ini.
  - Laporan bulanan per pegawai: kolom **Shift** (shift terjadwal) + blok
    **Riwayat Tukar Shift**; keterangan baris berisi “Tukar dengan <nama>”.
  - Tombol **Cetak Jadwal** di menu Jadwal Shift: lembar F4 landscape, warna
    per shift (Pagi sky, Siang amber, Malam indigo), kop instansi, dan tanda
    tangan Kepala Ruangan (nama saja, tanpa NIP).
- **File:** `supabase/migrations/32_tukar_shift.sql` (baru),
  `supabase/verifikasi_32.sql` (baru), `supabase/schema.sql`,
  `src/services/shiftService.js`, `src/services/reportService.js`,
  `src/utils/jadwalCetak.js` (baru), `src/utils/laporan.js`,
  `src/components/laporan/LembarJadwal.jsx` (baru),
  `src/components/laporan/LembarLaporan.jsx`,
  `src/pages/admin/JadwalShift.jsx`, `src/pages/admin/LaporanBulanan.jsx`,
  `src/index.css`, `tests/jadwalCetak.test.js` (baru),
  `tests/laporan.test.js` (baru), `README.md`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **62/62** lulus;
  `npm run build` lulus **16,38 dtk** (JadwalShift 45,68 kB). Migrasi 32 dan
  `verifikasi_32.sql` **belum dijalankan** di Supabase.
- **Catatan/risiko:** sebelum migrasi 32 dijalankan, tombol Tukar Shift akan
  menampilkan error dari server dan blok riwayat tukar kosong; laporan tetap
  aman karena query `tukar_shift`/`jadwal_shift` gagal ditangani (fallback
  kosong). Tukar untuk tanggal lampau tidak menghapus Alfa yang sudah
  terbentuk; catat tukar sebelum shift selesai.

### 2026-11-04 11:46 WITA — Perapian UI & ACC otomatis Super Admin
- **Perubahan:** melanjutkan pekerjaan I-100 yang terhenti karena limit usage.
  Menambahkan komponen bersama `TombolMuatUlang`, `PencarianNama`,
  `PemilihPeriode`, dan `TampilanPeriode` serta utilitas `src/utils/kalender.js`
  (tanggal murni tanpa zona waktu). Tombol **Muat ulang** diterapkan di
  DashboardUtama, DataPegawai, PengaturanPresensi, LaporanBulanan,
  VerifikasiPerangkat, KoreksiPresensi, PengajuanIzin, RiwayatSaya, dan
  ErrorBoundary. Filter nama memakai `PencarianNama` di Verifikasi Perangkat
  (perangkat + audit) dan Koreksi Presensi (data + audit). `PemilihPeriode`
  dipakai di form Pengajuan Izin, sedangkan `TampilanPeriode` merapikan rentang
  tanggal di daftar Pengajuan Izin dan Izin Saya. Warna jenis izin dipusatkan di
  `varianJenisIzin()`/`varianStatusKehadiran()` dengan varian Badge baru
  (`sakit` rose, `cuti` teal, `dinas` violet); riwayat memakai varian yang sama.
  Migrasi **31** membuat `catat_izin_grup` dan `ubah_izin_grup` otomatis
  memanggil `putuskan_izin_grup` saat pemanggil Super Admin, sehingga pengajuan
  baru atau perubahan atas pengajuan menunggu langsung `disetujui` dan presensi
  terkait ditandai; pengajuan kepala ruangan tetap `menunggu`.
- **File:** `src/components/ui/TombolMuatUlang.jsx`,
  `src/components/ui/PencarianNama.jsx`, `src/components/ui/PemilihPeriode.jsx`,
  `src/components/ui/TampilanPeriode.jsx`, `src/components/ui/index.js`,
  `src/components/ui/Badge.jsx`, `src/utils/kalender.js`,
  `src/utils/status.js`, `src/services/leaveService.js`,
  `src/components/ErrorBoundary.jsx`, `src/components/kartu/KartuRiwayat.jsx`,
  `src/pages/IzinSaya.jsx`, `src/pages/RiwayatSaya.jsx`,
  `src/pages/admin/DashboardUtama.jsx`, `src/pages/admin/DataPegawai.jsx`,
  `src/pages/admin/KoreksiPresensi.jsx`, `src/pages/admin/LaporanBulanan.jsx`,
  `src/pages/admin/PengajuanIzin.jsx`, `src/pages/admin/PengaturanPresensi.jsx`,
  `src/pages/admin/VerifikasiPerangkat.jsx`,
  `supabase/migrations/31_auto_setujui_superadmin.sql` (baru),
  `supabase/verifikasi_31.sql` (baru), `supabase/schema.sql`, `README.md`,
  `progress.md`, `AGENTS.md`, serta uji `tests/kalender.test.js`,
  `tests/status.test.js`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **54/54** lulus;
  `npm run build` lulus **9,65 dtk**. Migrasi 31 dan `verifikasi_31.sql`
  **belum dijalankan** di Supabase.
- **Catatan/risiko:** selama migrasi 31 belum dijalankan, pengajuan Super Admin
  masih berstatus `menunggu` di server meskipun UI sudah siap. Jalankan migrasi
  31 lalu `verifikasi_31.sql` sebelum mengandalkan fitur ACC otomatis.
- **Koreksi (2026-11-04 13:42):** migrasi **31** dan `verifikasi_31.sql` sudah
  dijalankan dan lulus di Supabase (laporan user), sehingga ACC otomatis Super
  Admin aktif di server.

### 2026-11-04 13:42 WITA — Migrasi 31 dijalankan & commit/push perapian UI
- **Perubahan:** mencatat konfirmasi user bahwa migrasi **31** dan
  `verifikasi_31.sql` sudah dijalankan dan berhasil; fitur ACC otomatis Super
  Admin aktif. Lalu memverifikasi dan meng-commit seluruh pekerjaan yang
  tertahan (komponen UI baru, filter nama, pemilih/tampilan periode, warna jenis
  izin, dan migrasi 31) beserta dokumen audit.
- **File:** lihat `git show --stat` commit terbaru.
- **Verifikasi:** `npm run lint` bersih; `npm test` **54/54** lulus;
  `npm run build` lulus (lihat entri commit).
- **Catatan/risiko:** tidak ada migrasi yang tertunda. Deploy GitHub Pages
  berjalan otomatis dari push.

### 2026-11-04 11:24 WITA — Commit & push ketahanan halaman + toleransi terlambat
- **Perubahan:** memverifikasi lalu meng-commit seluruh pekerjaan yang tertahan:
  anti white screen, toleransi keterlambatan per menit penuh, jam pulang tepat
  waktu, migrasi 29–30, verifikasi 29–30, uji, README, dan dokumen audit.
  Commit `17d8efb` di-push ke `origin/main`.
- **File:** 22 file (lihat `git show --stat 17d8efb`).
- **Verifikasi:** `npm run lint` bersih; `npm test` **46/46** lulus;
  `npm run build` lulus **7,12 dtk** (293 modul). Push `089b4e7..17d8efb`.
- **Catatan/risiko:** migrasi 29 dan 30 sudah dijalankan user; tidak ada
  migrasi baru yang tertunda. Deploy GitHub Pages berjalan otomatis dari push.

### 2026-11-04 11:22 WITA — Migrasi 30 berhasil dijalankan
- **Perubahan:** mencatat konfirmasi user bahwa migrasi **30**
  (`30_hitung_ulang_menit_terlambat.sql`) dan verifikasinya sudah dijalankan
  dan berhasil. `menit_terlambat` untuk presensi sejak **1 November 2026**
  kini memakai aturan menit penuh, sehingga absen 08.00.xx tidak lagi terbaca
  terlambat. Tidak ada perubahan kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** laporan user 2026-11-04 ("sudah saya jalankan dan berhasil").
  Verifikasi 29 dan 30 dijalankan user. Tampilan Riwayat/Laporan perlu dimuat
  ulang agar membaca nilai terbaru.
- **Catatan/risiko:** bila masih ada baris yang tampak terlambat, periksa
  jadwal pegawai pada tanggal tersebut dan muat ulang halaman.

### 2026-11-04 11:18 WITA — Hitung ulang menit terlambat data lama
- **Perubahan:** menindaklanjuti laporan bahwa pegawai yang absen masuk pukul
  08.00 masih terbaca terlambat setelah migrasi 29 dijalankan. Akar masalah:
  migrasi 29 hanya mengubah fungsi untuk absensi/koreksi berikutnya; baris
  `presensi` yang sudah tersimpan masih memakai `menit_terlambat` hasil aturan
  lama (`ceil`). Ditambahkan skrip backfill yang menghitung ulang memakai
  `public.hitung_menit_terlambat()` sejak go-live **1 November 2026**, hanya
  untuk baris ber-`jam_masuk`, dan hanya memperbarui baris yang nilainya
  berbeda (idempoten). Jadwal, status, perangkat, dan data lain tidak diubah.
- **File:** `supabase/migrations/30_hitung_ulang_menit_terlambat.sql` (baru),
  `supabase/verifikasi_30.sql` (baru), `README.md`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** belum dijalankan di Supabase. `verifikasi_30.sql` memeriksa:
  fungsi memakai `floor`, tidak ada selisih nilai sejak 1 November 2026, tidak
  ada menit negatif, absen di bawah 1 menit tidak terlambat, dan absen ≥ 1
  menit tetap terlambat.
- **Catatan/risiko:** backfill memakai jadwal yang berlaku saat ini untuk
  tanggal tersebut; bila jadwal lama pernah diubah setelah presensi tercatat,
  nilai dapat ikut menyesuaikan. Untuk data uji pra-go-live sengaja tidak
  disentuh.

### 2026-11-04 11:11 WITA — Toleransi keterlambatan & jam pulang tepat waktu
- **Perubahan:** memperbaiki dua aturan waktu absensi. (1) Keterlambatan
  sebelumnya memakai `ceil`, sehingga masuk pukul 08.00.01 sudah dihitung
  1 menit; kini memakai `floor` per menit penuh: 08.00.59 masih 0 menit dan
  08.01.00 dihitung 1 menit. (2) Absen pulang sebelumnya baru dibuka 1 menit
  setelah jam pulang (16.31); kini dibuka tepat pada jam pulang (16.30) dan
  tetap ditutup 2 jam setelah jam pulang. Aturan yang sama diterapkan pada
  koreksi presensi lewat `hitung_menit_terlambat`.
- **File:** `supabase/migrations/29_toleransi_terlambat_dan_jam_pulang.sql`
  (baru), `supabase/verifikasi_29.sql` (baru), `supabase/schema.sql`,
  `src/config/constants.js`, `src/utils/jadwalAbsen.js`,
  `src/components/PanelAbsen.jsx`, `tests/jadwalAbsen.test.js`, `README.md`,
  `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **46/46** lulus;
  `npm run build` lulus **8,95 dtk** (293 modul). Uji unit pembukaan pulang:
  reguler 16.30 tepat dan shift malam 08.00 tepat. Migrasi 29 dan
  `verifikasi_29.sql` **belum dijalankan** di Supabase.
- **Catatan/risiko:** server tetap sumber kebenaran; selama migrasi 29 belum
  dijalankan, aturan lama (ceil dan pulang 16.31) masih berlaku di produksi
  meskipun klien sudah membuka tombol pulang pada 16.30. Jalankan migrasi 29
  lebih dulu sebelum/bersamaan deploy, lalu `verifikasi_29.sql`.

### 2026-11-03 15:55 WITA — Ketahanan halaman & anti white screen
- **Perubahan:** menindaklanjuti laporan white screen pada user mobile dan
  kadang-kadang di laptop saat membuka menu. Diagnosis: (1) tidak ada Error
  Boundary sehingga error render/lifecycle atau kegagalan `import()` chunk
  memutihkan seluruh aplikasi; (2) `index.html` dan aset GitHub Pages memakai
  `Cache-Control: max-age=600` dan chunk hash lama mengembalikan **404** setelah
  deploy, sehingga perangkat dengan HTML lama gagal membuka menu (gejala hilang
  setelah refresh, sesuai laporan user); (3) formatter tanggal dapat melempar
  `RangeError` untuk nilai tidak valid; (4) pembacaan `localStorage` unit kepala
  belum diamankan. Perbaikan: Error Boundary root + per-rute + per-halaman
  portal (sidebar tetap tampil saat halaman gagal), pemulihan otomatis sekali
  dengan penanda `?perbarui` dan guard 30 detik, listener `vite:preloadError`,
  fallback statis di `index.html` + `<noscript>`, formatter tanggal
  mengembalikan `—`, dan `localStorage` kepala memakai `try/catch`.
- **File:** `src/components/ErrorBoundary.jsx` (baru),
  `src/utils/pemulihanHalaman.js` (baru), `tests/pemulihanHalaman.test.js`
  (baru), `src/main.jsx`, `src/App.jsx`,
  `src/components/layout/PortalAdminLayout.jsx`,
  `src/components/layout/PortalKepalaLayout.jsx`, `src/utils/format.js`,
  `tests/format.test.js`, `index.html`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **46/46** lulus;
  `npm run build` lulus **7,78 dtk** (ulang 14,87 dtk; 293 modul). Uji headless Chrome:
  halaman login tetap render; saat berkas JS utama dihapus, fallback statis
  “Jika layar ini tidak berubah…” tampil (bukan putih).
- **Catatan/risiko:** pemulihan otomatis dibatasi sekali per 30 detik dan tidak
  diulang bila URL sudah berpenanda, sehingga tidak ada loop muat ulang.
  Perubahan ditahan di working tree menunggu uji user; perlu deploy GitHub Pages
  agar aktif di produksi. Uji manual di perangkat user tetap disarankan.

### 2026-11-03 13:29 WITA — Perbaikan lag mengetik alasan koreksi
- **Perubahan:** menindaklanjuti laporan form koreksi terasa berat saat mengetik
  alasan. Akar masalah: state `form` berada di halaman induk sehingga setiap
  ketukan merender ulang seluruh daftar presensi (varian HP dan tabel desktop
  sama-sama dirender), dan setiap baris membuat `Intl.DateTimeFormat` baru
  (benchmark 1.600 formatter baru 271 ms vs cache 4 ms). Langkah yang dikerjakan:
  (1) cache formatter level modul di `src/utils/format.js`; (2) memisahkan form
  ke `FormKoreksiPresensi.jsx` dengan state lokal, `useMemo` pratinjau, dan
  callback `onSelesai`; (3) memisahkan daftar ke `DaftarPresensiKoreksi.jsx`
  yang dibungkus `React.memo`, dengan `bukaKoreksi`/`tutupKoreksi`/`selesaiKoreksi`
  stabil via `useCallback`.
- **File:** `src/utils/format.js`, `src/pages/admin/KoreksiPresensi.jsx`,
  `src/components/admin/FormKoreksiPresensi.jsx` (baru),
  `src/components/admin/DaftarPresensiKoreksi.jsx` (baru), `progress.md`,
  `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **38/38** lulus;
  `npm run build` lulus **8,37 dtk** (291 modul).
- **Catatan/risiko:** perilaku simpan, validasi, dan pratinjau H+1 tidak berubah.
  Belum diuji manual di perangkat; perubahan ditahan di working tree menunggu uji
  user. Bila masih berat pada bulan lintas unit yang sangat besar, opsi lanjutan
  adalah pagination/virtualisasi daftar.

### 2026-11-03 12:07 WITA — Koreksi presensi shift malam otomatis H+1
- **Perubahan:** melanjutkan pekerjaan yang terhenti karena crash. Form koreksi
  sebelumnya menolak jam pulang shift malam (mis. masuk 20.31, pulang 08.00)
  karena jam pulang digabung ke tanggal presensi sehingga dianggap lebih awal
  dari jam masuk. Ditambahkan helper `susunWaktuKoreksi` yang mempertahankan
  timestamp asli bila jam tidak diubah (termasuk absen masuk setelah tengah
  malam), menggeser jam pulang ke H+1 (maksimal 7 hari) bila tidak lebih lambat
  dari jam masuk, dan menandai `pulangLintasHari`. Form **Koreksi Presensi**
  memakai helper saat menyimpan dan menampilkan pratinjau tanggal/jam masuk dan
  pulang beserta penanda H+1. Server `koreksi_presensi` tidak diubah karena tidak
  membatasi urutan waktu.
- **File:** `src/utils/koreksiPresensi.js` (baru), `src/pages/admin/KoreksiPresensi.jsx`,
  `tests/koreksiPresensi.test.js` (baru), `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **38/38** lulus (6 uji baru
  koreksi H+1); `npm run build` lulus **8,29 dtk** (289 modul).
- **Catatan/risiko:** belum diuji manual di UI; perubahan ditahan di working tree
  menunggu uji user. Menit terlambat untuk absen masuk setelah tengah malam tetap
  dihitung server terhadap tanggal presensi (perilaku lama, di luar lingkup).

### 2026-11-02 09:43 WITA — Commit & push bebas radius
- **Perubahan:** menindaklanjuti laporan pegawai yang ditolak dengan jarak 130 m
  padahal berada di gedung utama. Analisis menunjukkan pesan berasal dari
  validasi klien, titik MapAtlas hanya 10,5 m dari pusat, sehingga selisihnya
  berasal dari pembacaan GPS perangkat (bukan rumus radius atau server). User
  memutuskan **belum mengubah apa pun**; rencana perbaikan akurasi GPS ditahan.
  Pekerjaan **Bebas Radius** (kode, migrasi 28, verifikasi 28, dokumentasi)
  di-commit dan di-push.
- **File:** `AGENTS.md`, `README.md`, `progress.md`,
  `src/components/PanelAbsen.jsx`, `src/pages/Dashboard.jsx`,
  `src/pages/admin/DataPegawai.jsx`, `src/services/pegawaiService.js`,
  `src/utils/geofencing.js`, `supabase/schema.sql`, `tests/geofencing.test.js`,
  `supabase/migrations/28_bebas_radius.sql`, `supabase/verifikasi_28.sql`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **32/32**; `npm run build`
  lulus. Migrasi 28 dan `verifikasi_28.sql` sudah dijalankan user (2026-11-02).
- **Catatan/risiko:** kasus GPS meleset 130 m dicatat sebagai **B-29** dan belum
  diperbaiki; uji manual **B-28** masih tersisa. Perubahan kode Bebas Radius
  memerlukan deploy GitHub Pages agar aktif di produksi.

### 2026-11-02 08:55 WITA — Migrasi 28 & verifikasi 28 berhasil
- **Perubahan:** mencatat laporan user bahwa migrasi **28** dan
  `verifikasi_28.sql` sudah dijalankan serta lulus di Supabase. Flag
  **Bebas Radius** kini aktif di server: `submit_presensi` hanya menolak radius
  50 m bila flag mati, sedangkan pegawai dengan flag tersebut tetap pegawai
  reguler biasa dan hanya berbeda karena boleh absen di mana saja. Status
  "belum aktif di server" pada entri sebelumnya (2026-11-01 18:55) dengan ini
  sudah tidak berlaku. Tidak ada perubahan kode.
- **File:** `progress.md`, `AGENTS.md`, `README.md`.
- **Verifikasi:** konfirmasi user "sudah saya run dan succses" (2026-11-02
  08:55); `npm run lint`, `npm test` 32/32, dan `npm run build` terakhir lulus
  sebelum perubahan dokumen ini.
- **Catatan/risiko:** sisa uji manual (B-28): satu pegawai bebas radius absen
  dari luar area pada jam reguler dan satu pegawai biasa tetap ditolak di luar
  50 m. Perubahan dokumen ditahan di working tree (belum di-commit).

### 2026-11-01 18:55 WITA — Sinkronisasi istilah bebas radius
- **Perubahan:** menyelaraskan seluruh istilah fitur menjadi **Bebas Radius** /
  **pegawai tertentu**. Pegawai dengan flag ini adalah **pegawai reguler biasa**
  dengan jam kerja dan aturan yang sama; satu-satunya perbedaan adalah mereka
  boleh absen di mana saja (tidak terkena radius 50 m). Istilah lama dihapus
  dari label, judul, dan deskripsi; teks verbatim instruksi lama di
  `AGENTS.md` tetap dipertahankan sebagai catatan audit. Nama file migrasi
  disinkronkan menjadi `28_bebas_radius.sql` (sesuai file nyata) di
  `schema.sql`, `progress.md`, dan `AGENTS.md`.
- **File:** `supabase/schema.sql`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **32/32**; `npm run build`
  lulus **11,87 dtk** (288 modul). Tidak ada perubahan kode.
- **Catatan/risiko:** migrasi 28 dan `verifikasi_28.sql` tetap **belum
  dijalankan**; urutan deploy **migrasi 28 → verifikasi 28 → kode** masih
  berlaku. Perubahan dokumen ditahan di working tree (belum di-commit).

### 2026-11-01 18:13 WITA — Pengecualian radius pegawai tertentu
- **Perubahan:** menambahkan pengecualian radius **per pegawai** bagi pegawai
  tertentu yang boleh absen di mana saja dengan jam kerja reguler; selain itu
  mereka diperlakukan **sama persis seperti pegawai reguler biasa**. Flag
  `pegawai.bebas_radius` (default `false`) hanya dapat diubah
  Super Admin lewat **Data Pegawai** dan dicatat pada
  `bebas_radius_diubah_pada`/`bebas_radius_diubah_oleh`. `submit_presensi`
  tetap menghitung dan menyimpan jarak serta menandai
  `lokasi_masuk/pulang.di_luar_radius`, tetapi hanya menolak radius 50 m bila
  flag mati; validasi perangkat, anti Fake GPS, akurasi, jadwal, jendela absen,
  dan aturan hari libur tidak berubah. `profil_saya()` mengirim `bebas_radius`;
  klien memakai `periksaLokasi(pos, { abaikanRadius })` hanya untuk tampilan.
- **File:** `supabase/migrations/28_bebas_radius.sql`,
  `supabase/verifikasi_28.sql`, `supabase/schema.sql`, `README.md`,
  `src/utils/geofencing.js`, `src/components/PanelAbsen.jsx`,
  `src/components/kartu/KartuRiwayat.jsx`, `src/pages/Dashboard.jsx`,
  `src/pages/RiwayatSaya.jsx`, `src/pages/admin/DataPegawai.jsx`,
  `src/services/pegawaiService.js`, `tests/geofencing.test.js`, `progress.md`,
  `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **32/32** lulus (2 uji baru
  pengecualian radius + deteksi Fake GPS tetap aktif); `npm run build` lulus
  **8,46 dtk** (ulang 8,69 dtk; 288 modul). Migrasi 28 dan `verifikasi_28.sql` **belum
  dijalankan** di Supabase sehingga perilaku server belum berubah.
- **Catatan/risiko:** urutan deploy wajib **migrasi 28 → verifikasi 28 → kode**.
  Bila kode ter-deploy lebih dulu, daftar Data Pegawai tetap tampil (fallback
  kolom) tetapi penyimpanan menampilkan pesan agar migrasi dijalankan. Flag
  bersifat permanen sampai dinonaktifkan Super Admin; jejak perubahan, jarak,
  dan koordinat tetap tersimpan. Laporan PDF tidak menampilkan jarak; riwayat
  memberi penanda **bebas radius** untuk jarak di atas 50 m.

### 2026-11-01 17:58 WITA — Go-live produksi dimulai
- **Perubahan:** mencatat konfirmasi user bahwa **go-live sudah dilaksanakan
  pada Minggu, 1 November 2026** dan pegawai sudah mulai melakukan **absen
  masuk dan absen pulang**. Tidak ada perubahan kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** klaim user (bukan hasil perintah verifikasi); status server
  sudah sesuai aturan — pegawai reguler diblokir pada akhir pekan/hari libur
  (`schema.sql` pesan "Hari libur ... Anda tidak dijadwalkan shift"), sehingga
  absen hari ini berasal dari pegawai shift yang memiliki `jadwal_shift`.
- **Catatan/risiko:** sisa pekerjaan adalah memantau **pembentukan Alfa
  otomatis pertama** setelah jam kerja hari kerja pertama, memastikan tidak ada
  pegawai reguler yang lolos absen di hari libur, dan memantau keluhan
  operasional pasca go-live. Perubahan dokumen ditahan di working tree (belum
  di-commit).

### 2026-10-31 15:35 WITA — Pemberitahuan perangkat berbeda & reset
- **Perubahan:** memperbarui `src/components/kartu/KartuStatusPerangkat.jsx` dan
  `src/components/PanelAbsen.jsx` untuk menampilkan pesan status `terikat_perangkat_lain`:
  *“Kamu Menggunakan Perangkat/Browser Yang berbeda dengan yang terdaftar”*
  dengan catatan kecil di bawahnya: *“Reset Perangkat Hub Tim IT”*, serta
  menghilangkan rincian perangkat aktif.
- **File:** `src/components/kartu/KartuStatusPerangkat.jsx`, `src/components/PanelAbsen.jsx`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **30/30** lulus;
  `npm run build` lulus **8,52 dtk** (288 modul).
- **Catatan/risiko:** perubahan semula ditahan di working tree. (koreksi
  2026-11-01: sudah **di-commit `f332efb`** bersama pesan libur dan di-push ke
  `origin/main` pada 2026-10-31.)

### 2026-10-31 15:10 WITA — Pesan libur ramah & hijau di Panel Absen
- **Perubahan:** memperbarui `src/components/PanelAbsen.jsx` untuk menampilkan
  pesan libur (akhir pekan, hari libur nasional, atau libur shift) dengan
  varian alert **sukses (hijau)**, emoticon menarik (“Nikmati Akhir Pekan Anda! 🌴”,
  “Hari Libur Nasional 🎉”, “Jadwal Libur Hari Ini 🌟”), ucapan istirahat yang cukup,
  serta catatan kecil di bawahnya: *“Jika jadwal tidak sesuai, hubungi Kepala Unit/IT.”*
- **File:** `src/components/PanelAbsen.jsx`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **30/30** uji lulus;
  `npm run build` lulus **9,13 dtk** (288 modul).
- **Catatan/risiko:** perubahan semula ditahan di working tree. (koreksi
  2026-11-01: sudah **di-commit `f332efb`** dan di-push ke `origin/main` pada
  2026-10-31.)

### 2026-10-31 13:20 WITA — Commit & push paginasi data

- **Perubahan:** meng-commit perbaikan paginasi data (jadwal 1–2 November,
  rekap/laporan, koreksi, izin, validasi template, uji baru) beserta dokumen
  audit I-082–I-084, lalu push ke `origin/main`.
- **File:** `src/utils/paginasi.js` (baru), `src/services/shiftService.js`,
  `src/pages/admin/JadwalShift.jsx`, `src/services/reportService.js`,
  `src/services/correctionService.js`, `src/services/leaveService.js`,
  `src/utils/templateJadwal.js`, `tests/paginasi.test.js` (baru),
  `tests/templateJadwal.test.js` (baru), `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **30/30** lulus;
  `npm run build` lulus **13,18 dtk** (288 modul); staged diff diperiksa tanpa
  rahasia.
- **Commit:** `22c2bab` “PRESISI AMI: paginasi data jadwal dan laporan”;
  dokumen audit disinkronkan pada commit terpisah dan di-push bersama.
- **Catatan/risiko:** tidak ada migrasi DB dan tidak perlu impor ulang. Uji
  manual user 2026-10-31 12:53 sudah memastikan tanggal 1–2 November muncul.

### 2026-10-31 12:53 WITA — Uji manual paginasi jadwal lulus

- **Perubahan:** user mengonfirmasi hasil uji manual: seluruh tanggal jadwal,
  termasuk **1–2 November 2026**, sudah muncul setelah perbaikan paginasi.
  B-25 ditutup; Status Terkini dan tabel paginasi diperbarui. Tidak ada
  perubahan kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** laporan user 2026-10-31 12:53. Tidak ada lint/test/build baru
  karena tidak ada perubahan kode.
- **Catatan/risiko:** pada saat entri ini ditulis, perbaikan paginasi dan
  dokumen audit masih di working tree; keduanya sudah di-commit `22c2bab` pada
  2026-10-31 13:20.

### 2026-10-31 12:37 WITA — Paginasi jadwal 1000 baris (tanggal 1–2 tampil)

- **Perubahan:** memperbaiki jadwal dinas tanggal 1–2 November 2026 yang tidak
  tampil setelah impor. Diagnosis: data sudah masuk database (total November
  **1064 baris**), tetapi `ambilJadwalRentang` membaca seluruh unit tanpa
  paginasi dan terpotong batas bawaan Supabase **1000 baris**; urutan
  `tanggal desc` membuat baris tertua (1–2 November) hilang lebih dulu.
  Perbaikan: helper `src/utils/paginasi.js` membaca per halaman 500 dengan
  kenaikan berdasarkan jumlah data aktual; `ambilJadwalRentang` dibatasi ke
  `userIds` pegawai unit aktif dan diurutkan stabil; `JadwalShift.jsx` memuat
  jadwal setelah grup/unit dipilih dan memakai filter yang sama saat
  menyalin pola; paginasi juga diterapkan pada `reportService.js`,
  `correctionService.js`, dan `leaveService.js`; `templateJadwal.js` menolak
  header tanggal yang tidak dikenali; ringkasan impor menampilkan `dilewati`.
  Tidak ada migrasi DB dan tidak perlu impor ulang.
- **File:** `src/utils/paginasi.js` (baru), `src/services/shiftService.js`,
  `src/pages/admin/JadwalShift.jsx`, `src/services/reportService.js`,
  `src/services/correctionService.js`, `src/services/leaveService.js`,
  `src/utils/templateJadwal.js`, `tests/paginasi.test.js` (baru),
  `tests/templateJadwal.test.js` (baru), `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run lint` bersih; `npm test` **30/30** lulus (termasuk
  paginasi 1064 baris dan template 35 pegawai × 30 hari yang memuat tanggal
  1–2); `npm run build` lulus **15,01 dtk** (ulang 10,67 dtk; 288 modul).
- **Catatan/risiko:** uji manual UI dengan data 1064 baris **belum** dilakukan;
  halaman jadwal kini memerlukan 3 halaman data + 1 pemeriksaan kosong
  (4 permintaan) untuk data tersebut. Bila batas server lebih kecil dari 500,
  helper tetap berlanjut karena offset naik sesuai jumlah baris yang
  benar-benar diterima. Semua perubahan dan dokumen ini sudah di-commit
  `22c2bab` pada 2026-10-31 13:20; uji manual user lulus 12:53.

### 2026-10-31 12:07 WITA — Koreksi hari 1 November 2026 (Minggu)

- **Perubahan:** mencatat koreksi user atas panduan I-078. **1 November 2026
  adalah hari Minggu**, bukan Senin (terverifikasi
  `Get-Date -Date '2026-11-01' -Format dddd` → `Sunday`). Karena itu Alfa
  reguler pertama diperkirakan muncul **Senin 2 November 2026** setelah jam
  kerja berakhir; pegawai shift yang dijadwalkan pada akhir pekan dapat
  menyusul setelah shiftnya selesai. Panduan awal (Alfa pertama 2 November)
  berlaku kembali. Status Terkini (langkah go-live), catatan I-078 di entri
  pg_cron, dan dokumen audit diperbarui; tidak ada perubahan kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** `Get-Date -Date '2026-11-01' -Format 'dddd, dd MMMM yyyy'`
  → `Sunday, 01 November 2026`; `2026-11-02` → `Monday, 02 November 2026`.
  Tidak ada build/lint karena tidak ada perubahan kode.
- **Catatan/risiko:** `alfa_mulai` tetap 1 November 2026; job cron tetap
  berjalan tiap 15 menit. Bila unit tertentu punya jadwal shift pada Minggu,
  Alfa dapat terbentuk lebih awal dan itu bukan kesalahan. Dokumen ini ikut
  di-commit `22c2bab` pada 2026-10-31 13:20.

### 2026-10-30 23:45 WITA — B-8 lint/uji dasar & B-9 `.env.example`

- **Perubahan:** menambahkan **ESLint 10** (flat config, plugin React Hooks dan
  React Refresh), script `lint`/`test`/`test:watch`, serta **24 uji dasar**
  memakai `node:test` untuk `csv.js` (`amankanSelCsv`), `format.js`,
  `geofencing.js`, `izin.js`, dan `jadwalAbsen.js`. CI deploy kini menjalankan
  `npm run lint` dan `npm test` sebelum build. `.env.example` diganti memakai
  placeholder dan tidak lagi memuat URL/anon key project asli.
- **Perbaikan bug:** `format.js` menolak periode bulan di luar 01–12 (sebelumnya
  `2026-13` bergulir ke Januari 2027); `templateJadwal.js` mempertahankan
  `cause` saat membungkus error file Excel dan tidak lagi memanggil
  `includes()` pada `message` yang bukan string.
- **Cek bug pra-commit (23:59):** ditemukan `namaBulan()` memakai zona waktu
  perangkat sehingga `2026-10` tampil “September 2026” pada perangkat dengan
  zona negatif; diperbaiki dengan `timeZone: Asia/Makassar` dan dikunci lewat
  `tests/formatZonaWaktu.test.js` (child process `TZ=America/Los_Angeles`).
- **File:** `package.json`, `package-lock.json`, `eslint.config.js`,
  `tests/*.test.js`, `.env.example`, `.github/workflows/deploy.yml`,
  `src/utils/format.js`, `src/utils/templateJadwal.js`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** `npm run lint` lulus tanpa temuan; `npm test` **24/24 lulus**
  pada Node 24 dan Node 22.13; `npm run build` lulus (13,09 dtk Node 24; 14,66 dtk
  Node 22.13); `npm ci --dry-run` sesuai; `npm audit` 0 kerentanan.
- **Commit:** `42cb317` “PRESISI AMI: lint, uji dasar, dan perbaikan bug zona
  waktu” di-push ke `origin/main` 2026-10-31 00:09.
- **Catatan/risiko:** anon key lama masih ada di riwayat Git (anon key memang
  dipakai klien; service_role tidak pernah disimpan). CI akan memblokir deploy
  bila lint error atau uji gagal.

### 2026-10-30 23:30 WITA — pg_cron terkonfirmasi aktif

- **Perubahan:** mengonfirmasi berdasarkan screenshot user bahwa ekstensi
  **pg_cron 1.6.4** sudah aktif di project ABSENSI PEGAWAI, dan job
  `presisi-alfa-otomatis` sudah terdaftar serta aktif. Tidak ada perubahan kode;
  hanya pembaruan dokumen audit.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** screenshot Database → Extensions menunjukkan toggle
  `pg_cron` aktif; screenshot sebelumnya menunjukkan `cron.job` `active = true`
  dan riwayat run `succeeded`.
- **Catatan/risiko:** `alfa_mulai` diset **1 November 2026** sehingga belum ada
  Alfa yang dibuat sampai tanggal tersebut.
- **Koreksi (23:33):** user menyatakan 1 November adalah hari Senin; asumsi hari
  Minggu dibatalkan. Alfa mengikuti `alfa_mulai` dan jam kerja, bukan nama hari,
  sehingga Alfa reguler pertama dapat muncul pada 1 November setelah jam kerja
  berakhir.
- **Koreksi lanjutan (2026-10-31 12:07):** user mengoreksi kembali bahwa
  **1 November 2026 adalah hari Minggu** (terverifikasi `Get-Date` → `Sunday`).
  Catatan 23:33 dibatalkan; Alfa reguler pertama diperkirakan muncul **Senin
  2 November 2026** setelah jam kerja berakhir, kecuali ada pegawai shift yang
  dijadwalkan pada akhir pekan.

### 2026-10-30 23:23 WITA — Alfa otomatis diaktifkan

- **Perubahan:** mencatat user sudah mengaktifkan **Alfa otomatis** lewat
  **Pengaturan Presensi**. Ekstensi `pg_cron` aktif dan job
  `presisi-alfa-otomatis` berjalan setiap 15 menit dengan status `succeeded`.
  Status Terkini, tabel Alfa otomatis, langkah go-live, dan backlog diperbarui;
  tidak ada perubahan kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** laporan user 2026-10-30 23:23; screenshot Supabase
  menunjukkan `cron.job` aktif `true` dan riwayat run `succeeded`. Pembentukan
  data Alfa belum terverifikasi (query masih 0 baris sebelum aktivasi).
- **Catatan/risiko:** pastikan **Alfa berlaku mulai** sudah sesuai tanggal
  go-live agar presensi lama tidak ikut ditandai Alfa. Cron tetap perlu dipantau
  beberapa hari pertama.

### 2026-10-30 23:04 WITA — Data operasional lengkap

- **Perubahan:** mencatat laporan user bahwa data operasional sudah dilengkapi,
  termasuk **jadwal dinas** dan **pemetaan pegawai**. Status Terkini, langkah
  go-live (tinggal Alfa otomatis + `pg_cron`), dan backlog diperbarui; tidak ada
  perubahan kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** laporan user 2026-10-30 23:04; tidak ada SQL atau aplikasi
  yang dijalankan agen pada sesi ini.
- **Catatan/risiko:** kelengkapan jadwal per pegawai dan hari libur belum
  diverifikasi lewat query; status dicatat sebagai klaim user. Alfa otomatis
  tetap harus diaktifkan paling akhir setelah data dianggap final.

### 2026-10-30 23:01 WITA — Cleanup data uji

- **Perubahan:** mencatat `supabase/cleanup_data_uji.sql` sudah dijalankan: data
  transaksi (presensi, koreksi, izin, jadwal, perangkat) dibersihkan, sedangkan
  92 pegawai, grup, dan master shift dipertahankan. Status Terkini, langkah
  go-live, dan backlog diperbarui; tidak ada perubahan kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** laporan user 2026-10-30 23:01; tidak ada SQL yang dijalankan
  agen pada sesi ini.
- **Catatan/risiko:** jumlah data master pasca-cleanup tidak diverifikasi ulang
  lewat query; angka 92 mengacu pada laporan user dan isi skrip cleanup.

### 2026-10-30 22:13 WITA — Verifikasi SQL & uji go-live dinyatakan aman

- **Perubahan:** mencatat laporan user bahwa seluruh `supabase/verifikasi_*.sql`
  sudah dijalankan, pengujian manual aman, dan **go-live sudah masuk rencana**.
  Status Terkini, tabel status migrasi 22–27, status deploy, dan langkah
  berikutnya diperbarui; tidak ada perubahan kode.
- **File:** `progress.md`, `AGENTS.md`.
- **Verifikasi:** laporan user 2026-10-30 22:13 (tidak dijalankan ulang oleh
  agen). Pemeriksaan live: `https://presisiami.my.id/` HTTP 200 dan meta CSP +
  Referrer terpasang.
- **Catatan/risiko:** bukti keluaran `true` per skrip verifikasi tidak dilampirkan
  pada sesi ini; status dicatat sebagai klaim user. Sisa pekerjaan go-live: data
  operasional, pembersihan data uji akhir, dan aktivasi Alfa otomatis.

### 2026-10-30 10:09 WITA — Commit & push keamanan Step 2–4

- **Perubahan:** menyimpan seluruh pekerjaan keamanan Step 2–4 ke commit
  `1fec429` dan mendorongnya ke `origin/main`: pengaman formula CSV
  (`amankanSelCsv`), pemutusan `window.opener` dokumen izin, upgrade Vite 7.3.7
  + `@vitejs/plugin-react` 5.2.0 + React Router 7.18.5, Node CI 22, CSP
  produksi via `<meta>`, dan `Referrer-Policy`. Deploy GitHub Actions berjalan
  otomatis setelah push.
- **File:** `.github/workflows/deploy.yml`, `package.json`,
  `package-lock.json`, `vite.config.js`, `index.html`, `src/utils/csv.js`,
  `src/utils/templateJadwal.js`, `src/pages/IzinSaya.jsx`,
  `src/pages/admin/PengajuanIzin.jsx`, `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus **7,26 dtk** (287 modul) sebelum commit;
  `npm audit` 0 kerentanan; `git push` `271b14b..1fec429` berhasil; Enforce HTTPS
  terverifikasi (HTTP apex/`www` **301** ke HTTPS). Setelah deploy, CSP aktif di
  `https://presisiami.my.id/`—perlu dicek pada HTML live.
- **Catatan/risiko:** uji browser manual dan HP (login/logout, navigasi,
  absensi, dokumen, CSV, cetak laporan) masih perlu dilakukan pada build live.
  HSTS/anti-clickjacking/`Permissions-Policy` tetap menunggu Cloudflare/proxy.

### 2026-10-30 10:00 WITA — Step 4: CSP meta & referrer

- **Perubahan:** menambahkan plugin kecil di `vite.config.js` (`apply: 'build'`)
  yang menyisipkan `<meta http-equiv="Content-Security-Policy">` di awal `<head>`
  hanya pada hasil build, serta `<meta name="referrer"
  content="strict-origin-when-cross-origin">` di `index.html`. Kebijakan:
  `default-src 'self'`; `base-uri 'self'`; `object-src 'none'`;
  `script-src 'self'`; `style-src 'self' 'unsafe-inline'` (inline style cetak
  dan lebar kolom masih dipakai); `img-src 'self' data: blob:`;
  `font-src 'self'`; `connect-src 'self' https://*.supabase.co
  wss://*.supabase.co`; `frame-src 'none'`; `form-action 'self'`;
  `upgrade-insecure-requests`. Dev/HMR tidak terkena CSP.
- **File:** `vite.config.js`, `index.html`, `README.md`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** `npm run build` lulus **7,38 dtk** (ulang 6,94 dtk, 287 modul); `dist/index.html`
  memuat meta CSP dan meta referrer; `dist/404.html` (salinan setelah build) ikut
  memuat CSP; pratinjau SPA root `/login` dan `/superadmin-portal` 200; uji
  headless Chrome membuktikan halaman tetap render dan **script inline yang
  sengaja disisipkan tidak dieksekusi** (atribut uji tidak muncul di `<html>`),
  lalu `dist/index.html` dipulihkan.
- **Catatan/risiko:** perubahan **belum di-commit**. Uji browser manual tetap
  perlu (login, navigasi, absensi, dokumen, cetak). HSTS/anti-clickjacking/
  `Permissions-Policy` belum bisa dipasang di GitHub Pages; opsi Cloudflare
  ditunda. **Enforce HTTPS sudah aktif dan terverifikasi 2026-10-30 10:06
  WITA**: `http://presisiami.my.id` → **301** `https://`, `www` (HTTP/HTTPS)
  → **301** ke apex HTTPS. UI GitHub sempat menampilkan "DNS Check in
  Progress" meski DNS sudah benar.

### 2026-10-30 09:35 WITA — Step 3: upgrade dependensi

- **Perubahan:** melanjutkan rencana keamanan setelah Step 2 dinyatakan lulus
  uji user. Dependensi dinaikkan ke **Vite 7.3.7**, **`@vitejs/plugin-react`
  5.2.0**, dan **React Router 7.18.5**; workflow GitHub Actions memakai Node
  **22**. README menyebut syarat Node 20.19+/22.12+, AGENTS memperbarui stack
  frontend. Tidak ada perubahan kode aplikasi karena seluruh API router yang
  dipakai (`BrowserRouter` + `basename`, `Routes`, `Route`, `NavLink`,
  `useLocation`, `useOutletContext`, `Navigate`, `Link`) masih tersedia di
  React Router 7.
- **File:** `package.json`, `package-lock.json`, `.github/workflows/deploy.yml`,
  `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm ls --depth=0` menampilkan Vite 7.3.7, plugin React 5.2.0,
  React Router 7.18.5; `npm ci --dry-run` → `up to date` (lockfile sinkron);
  `npm audit` dan `npm audit --omit=dev` → **0 kerentanan**; smoke test impor
  React Router 7 lulus; `npm run build` lulus **20,65 dtk** lalu diulang **7,16
  dtk** (287 modul, base `/`); `npm run preview` → root `200` dan deep link `/admin/dashboard` `200`
  dengan `#root` (fallback SPA aktif). Lingkungan lokal Node 24.14.1/npm 11.11.0.
- **Catatan/risiko:** perubahan **belum di-commit**. Uji browser manual
  (login/logout, navigasi semua menu, absensi, ekspor CSV, dokumen izin) dan uji
  HP masih perlu dilakukan sebelum go-live. GitHub Pages tidak mendukung header
  HTTP kustom, sehingga langkah keamanan berikutnya (CSP/header) perlu memakai
  tag `<meta>` di `index.html` atau lapisan host lain.

### 2026-10-29 20:54 WITA — Step 2: pengaman formula CSV & dokumen

- **Perubahan:** menambahkan `amankanSelCsv()` di helper CSV. Nilai string yang
  diawali `=`, `+`, `-`, `@`, tab, CR, atau LF diberi apostrof lebih dulu agar
  tidak dieksekusi sebagai formula saat file dibuka di Excel/LibreOffice; nilai
  angka negatif tidak diubah. Regex pengaman template jadwal disamakan, dan dua
  halaman dokumen izin kini memutus `window.opener` lalu memakai
  `location.replace(url)` pada tab yang sudah dibuka.
- **File:** `src/utils/csv.js`, `src/utils/templateJadwal.js`,
  `src/pages/IzinSaya.jsx`, `src/pages/admin/PengajuanIzin.jsx`.
- **Verifikasi:** uji Node `amankanSelCsv` untuk `=`, `+`, `-`, `@`, tab, CR,
  LF, nilai biasa, angka negatif, dan sel berkoma semua lulus; `npm run build`
  lulus **8,28 dtk** (282 modul); `git diff --check` hanya memberi peringatan
  LF/CRLF.
- **Catatan/risiko:** perubahan **belum di-commit**. Uji nyata unduh CSV lalu buka
  di Excel dan buka dokumen izin di browser masih perlu dilakukan. Uji manual
  tampilan jam Admisi di akun pegawai sudah dilaporkan berhasil. Langkah
  keamanan berikutnya: upgrade dependensi, lalu header HTTPS/CSP.

### 2026-10-29 20:41 WITA — Commit & push jendela absen baru, jam kerja unit, migrasi 25–27

- **Perubahan:** menyimpan seluruh pekerjaan yang masih tertahan di working tree:
  jendela absen baru (masuk 1 jam sebelum, pulang ditutup 2 jam setelah),
  pemisahan presensi hari ini/kemarin, halaman **Jam Kerja Unit**, migrasi
  **25–27**, verifikasi 25–27, sinkronisasi `schema.sql`, dan dokumen audit.
  Status migrasi 26–27 diperbarui berdasarkan laporan user bahwa keduanya sudah
  dijalankan di Supabase.
- **File:** `src/App.jsx`, `src/components/PanelAbsen.jsx`,
  `src/components/layout/SidebarAdmin.jsx`, `src/config/constants.js`,
  `src/pages/Dashboard.jsx`, `src/pages/admin/JamKerjaUnit.jsx`,
  `src/services/attendanceService.js`, `src/services/jamKerjaService.js`,
  `src/utils/jadwalAbsen.js`, `supabase/schema.sql`,
  `supabase/migrations/25–27`, `supabase/verifikasi_25–27`, `README.md`,
  `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run build` lulus **6,89 dtk** (282 modul, chunk
  `JamKerjaUnit` 7,04 kB); `git diff --check` hanya memberi peringatan
  LF/CRLF. Migrasi 25–27 dilaporkan user sudah dijalankan; hasil
  `verifikasi_25–27` dan uji absensi nyata belum dikonfirmasi.
- **Catatan/risiko:** migrasi 27 mengubah seluruh pegawai `ADMISI RAWAT JALAN`
  menjadi pola Reguler; pegawai yang seharusnya tetap Shift harus diubah kembali
  lewat **Data Pegawai**. Verifikasi statis dan build tidak menggantikan uji
  absen, jam Admisi, serta cetak laporan di perangkat nyata.

### 2026-10-29 19:29 WITA — Jam kerja reguler per unit (migrasi 27)
- **Perubahan:** menambahkan override jam kerja reguler per unit agar unit
  dengan jam berbeda tidak perlu memakai pola shift. Tabel baru
  `jam_kerja_unit` (satu baris per unit per hari, fallback ke
  `jam_kerja_reguler` global), seed `ADMISI RAWAT JALAN` Senin–Jumat
  **07.00–15.00** dan Sabtu–Minggu libur. Pegawai unit tersebut yang masih
  berpola Shift diubah menjadi **Reguler** agar override berlaku.
  `jadwal_kerja` kini memakai override unit untuk pegawai reguler;
  `proses_alfa_otomatis` memakai jam selesai
  override. RLS: semua pegawai login boleh membaca, hanya Super Admin yang
  boleh menulis. Frontend: halaman **Jam Kerja Unit** (pilih unit, atur 7 hari,
  toggle libur, simpan, kembalikan ke global), service, route, dan menu di grup
  **Data & Struktur** portal Super Admin.
- **File:** `supabase/migrations/27_jam_kerja_unit.sql`,
  `supabase/verifikasi_27.sql`, `supabase/schema.sql`,
  `src/services/jamKerjaService.js`, `src/pages/admin/JamKerjaUnit.jsx`,
  `src/App.jsx`, `src/components/layout/SidebarAdmin.jsx`, `README.md`,
  `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run build` lulus **16,74 dtk** (build awal) dan
  **7,58 dtk** (verifikasi ulang; 282 modul, chunk `JamKerjaUnit` 7,04 kB
  terbentuk). Migrasi 27 dan `verifikasi_27.sql` **belum dijalankan** di
  Supabase; uji manual jam Admisi belum dilakukan.
- **Catatan/risiko:** seed dan konversi pola hanya berjalan bila unit bernama
  persis `ADMISI RAWAT JALAN` sudah ada di `grup_shift`; bila belum, atur lewat
  menu setelah unit dibuat. Migrasi mengubah **semua pegawai** unit tersebut
  menjadi Reguler; bila ada pegawai yang seharusnya tetap Shift, ubah kembali
  lewat **Data Pegawai** sebelum mengandalkan jadwal shift. Perubahan jam
  berlaku dinamis untuk tanggal yang dihitung setelah migrasi; data presensi
  lama dan menit terlambat yang sudah tersimpan tidak diubah. Verifikasi statis
  tidak menggantikan uji absen nyata.

### 2026-10-29 15:03 WITA — Jendela absen baru 1 jam / 2 jam (migrasi 26)
- **Perubahan:** aturan sosialisasi menggantikan batas migrasi 25. Absen masuk
  kini dibuka **60 menit (1 jam)** sebelum jam masuk. Absen pulang dibuka 1 menit
  setelah jam pulang dan ditutup **120 menit (2 jam)** setelah jam pulang, berlaku
  untuk semua pola kerja termasuk shift malam lintas hari (dihitung pada tanggal
  selesai). Klien: `MENIT_AWAL_ABSEN_MASUK = 60`, konstanta baru
  `MENIT_TUTUP_ABSEN_PULANG = 120`, `JAM_BATAS_PULANG_SHIFT_MALAM` dihapus,
  `tutupAbsenPulang` memakai jam selesai + 120 menit, dan teks peringatan
  `PanelAbsen` menyebut batas "2 jam setelah jam pulang" beserta jamnya. Server:
  migrasi **26** mendefinisikan ulang `submit_presensi` dengan batas awal
  `v_mulai - interval '1 hour'` dan batas akhir `v_selesai + interval '2 hours'`;
  aturan akhir hari/12.00 dihapus; radius 50 m, koordinat, dan hak akses tetap.
  `schema.sql` disinkronkan, `verifikasi_26.sql` memeriksa aturan baru.
- **File:** `src/config/constants.js`, `src/utils/jadwalAbsen.js`,
  `src/components/PanelAbsen.jsx`, `supabase/migrations/26_batas_absen_baru.sql`,
  `supabase/verifikasi_26.sql`, `supabase/schema.sql`, `README.md`,
  `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run build` lulus **8,90 dtk**; uji Node helper jendela
  waktu: reguler 08.00–16.30 → buka masuk 07.00, buka pulang 16.31, tutup 18.30;
  shift malam 20.00–08.00 → 19.00, 08.01 (H+1), 10.00 (H+1); shift siang
  14.00–21.00 → 13.00, 21.01, 23.00; hari libur → `null`. Migrasi 26 dan
  `verifikasi_26.sql` **belum dijalankan** di Supabase.
- **Catatan/risiko:** `verifikasi_17.sql` dan `verifikasi_25.sql` kini bersifat
  historis. Selama migrasi 26 belum dijalankan, server masih memakai batas
  migrasi 25 (23.59/12.00) sehingga klien dan server belum seragam. Uji manual
  batas masuk/pulang perlu dilakukan setelah migrasi 26.

### 2026-10-29 11:46 WITA — Batas akhir absen pulang (migrasi 25)
- **Perubahan:** panel absen tidak lagi selalu memprioritaskan baris kemarin
  yang terbuka. Presensi hari ini dan presensi kemarin dimuat terpisah; baris
  kemarin hanya dipakai selama jendela pulangnya belum lewat. Batas akhir absen
  pulang: **23.59 WITA** pada tanggal kerja untuk reguler/shift tidak lintas
  hari, dan **12.00 WITA** pada tanggal selesai untuk shift malam (lintas hari).
  Setelah batas lewat, tombol Absen Pulang mati, muncul keterangan agar
  mengajukan koreksi, dan Absen Hadir hari berjalan tetap aktif. Server menolak
  pulang setelah batas dengan pesan yang jelas.
- **File:** `src/config/constants.js`, `src/utils/jadwalAbsen.js`,
  `src/services/attendanceService.js`, `src/components/PanelAbsen.jsx`,
  `src/pages/Dashboard.jsx`, `supabase/migrations/25_batas_absen_pulang.sql`,
  `supabase/verifikasi_25.sql`, `supabase/schema.sql` (definisi terbaru
  `submit_presensi`), dokumen audit.
- **Verifikasi:** `npm run build` lulus (percobaan pertama 23,39 dtk, ulang
  6,82 dtk; 280 modul). Migrasi 25 dan
  `verifikasi_25.sql` **belum dijalankan** di Supabase; alur lupa absen pulang
  belum diuji manual.
- **Catatan/risiko:** presensi yang terlanjur melewati batas tetap `Hadir`
  dengan `jam_pulang` kosong dan hanya dapat diselesaikan lewat koreksi Super
  Admin (belum ada status "Lupa Pulang"). Halaman yang dibiarkan terbuka
  melewati tengah malam perlu dimuat ulang agar memakai tanggal baru.

### 2026-10-28 WITA — Migrasi 23 & 24 dijalankan
- **Perubahan:** tidak ada perubahan kode. User mengonfirmasi migrasi **23**
  (Dinas Luar lintas unit) dan migrasi **24** (radius 50 meter) sudah dijalankan
  di Supabase, sehingga validasi server memakai radius 50 m.
- **File:** dokumen audit (`progress.md`, `AGENTS.md`).
- **Verifikasi:** berdasarkan laporan user 2026-10-28; `verifikasi_23.sql` dan
  `verifikasi_24.sql` **belum dikonfirmasi** hasilnya.
- **Catatan/risiko:** perubahan dokumen ini belum di-commit/di-push.

### 2026-10-28 WITA — Commit & push radius 50 meter + UI mobile
- **Perubahan:** seluruh pekerjaan lokal di-commit: Dinas Luar lintas unit
  (migrasi 23), radius absensi 50 meter (migrasi 24), perapian UI mobile
  dashboard & riwayat, serta pembaruan dokumen audit. Commit fitur `a9a59ac`
  (`PRESISI AMI: dinas luar lintas unit, radius 50 meter, dan perapian UI
  mobile`), lalu commit sinkronisasi status dokumen.
- **File:** 19 file pada commit fitur + `AGENTS.md` dan `progress.md` pada
  commit sinkronisasi.
- **Verifikasi:** `npm run build` lulus **7,10 dtk** (280 modul) sebelum commit;
  push ke `origin/main` berhasil.
- **Catatan/risiko:** migrasi 23 dan 24 **belum dijalankan** di Supabase; radius
  server masih 100 m sampai migrasi 24 dieksekusi.

### 2026-10-28 WITA — Radius absensi 50 meter
- **Perubahan:** batas radius geofencing diubah dari 100 m menjadi **50 m** pada
  klien (`MAX_RADIUS_METERS`) dan server (`submit_presensi`). Dibuat migrasi
  **24** yang mendefinisikan ulang `submit_presensi` dengan radius 50 m beserta
  pesan jarak baru, `verifikasi_24.sql`, dan sinkronisasi seluruh definisi
  `submit_presensi` di `schema.sql`. Komentar teknis radius di
  `geofencing.js`, `PanelAbsen.jsx`, dan `attendanceService.js` ikut diperbarui.
- **File:** `supabase/migrations/24_radius_50_meter.sql`,
  `supabase/verifikasi_24.sql`, `supabase/schema.sql`,
  `src/config/constants.js`, `src/utils/geofencing.js`,
  `src/components/PanelAbsen.jsx`, `src/services/attendanceService.js`,
  `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus **7,10 dtk** (280 modul; percobaan
  pertama 6,24 dtk sebelum label radius di Panel Absen memakai konstanta).
  Migrasi 24 dan `verifikasi_24.sql` **belum dijalankan** di Supabase.
- **Catatan/risiko:** radius klien langsung berlaku, tetapi server baru menolak
  jarak > 50 m setelah migrasi 24 dijalankan. Perubahan belum di-commit.

### 2026-10-28 WITA — Perapian UI mobile dashboard & riwayat
- **Perubahan:** pemilih bulan di halaman **Riwayat & Rekap Presensi**
  dibatasi maksimal 190 px sehingga tidak melebar di HP; keterangan
  “Jam kerja reguler Senin–Kamis 08.00–16.30, Jumat 08.00–16.00” dihapus dari
  kartu **Jadwal Kerja Hari Ini** (keterangan shift malam/shift tetap); urutan
  kartu Dashboard pegawai di HP menjadi **Jadwal → Riwayat Presensi Terakhir →
  Status Perangkat** (desktop tetap dua kolom: riwayat di kiri, jadwal/status di
  kanan); kartu **Status Perangkat** saat terverifikasi kini ringkas tanpa teks
  penjelasan; pesan perangkat berbeda di kartu status dan Panel Absen
  dipersingkat agar lebih profesional.
- **File:** `src/pages/RiwayatSaya.jsx`, `src/pages/Dashboard.jsx`,
  `src/components/kartu/KartuShift.jsx`,
  `src/components/kartu/KartuStatusPerangkat.jsx`,
  `src/components/PanelAbsen.jsx`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus **6,50 dtk** (280 modul).
- **Catatan/risiko:** perubahan tampilan belum diuji manual di perangkat
  fisik; belum di-commit.

### 2026-10-28 WITA — Lanjutan Dinas Luar lintas unit (tinjauan & build)
- **Perubahan:** meninjau ulang pekerjaan terakhir (I-058). Migrasi 23,
  `verifikasi_23.sql`, sinkronisasi `schema.sql`, `pegawaiService.js`,
  `leaveService.js`, dan `PengajuanIzin.jsx` diperiksa ulang; tidak ditemukan
  sisa pekerjaan kode. Kontrak RPC (`daftar_pegawai_izin`,
  `bisa_akses_grup`, `bisa_kelola_izin_grup`), policy RLS `izin_cuti`/`pegawai`,
  dan fallback klien saat migrasi 23 belum aktif sudah konsisten. Tidak ada
  perubahan kode pada sesi ini selain dokumen audit.
- **File:** `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus **21,92 dtk** (280 modul).
- **Catatan/risiko:** langkah tersisa adalah menjalankan
  `supabase/migrations/23_dinas_luar_lintas_unit.sql` lalu
  `supabase/verifikasi_23.sql` di Supabase. Karena `cleanup_data_uji.sql` sudah
  mengosongkan `izin_cuti`, validasi FK baru ke `auth.users` tidak berisiko
  gagal akibat data lama. Perubahan belum di-commit.

### 2026-10-28 WITA — Dinas Luar lintas unit
- **Perubahan:** kepala unit kini dapat mencatat **Dinas Luar** untuk pegawai
  lintas unit (maksimal 4 pegawai per grup), sedangkan **Sakit/Cuti** tetap
  terbatas pada unit yang dikelola. Pembuat grup dapat membaca seluruh grup
  Dinas Luar beserta dokumennya **selama masih menjabat kepala unit**; akses
  dicabut otomatis setelah jabatan berakhir (atau bagi Super Admin). FK
  `izin_cuti.dibuat_oleh`/`dibatalkan_oleh` dipindah ke `auth.users` agar kepala
  ASN tanpa baris `pegawai` dapat mencatat/membatalkan. Klien memakai RPC
  `daftar_pegawai_izin()` untuk daftar pegawai lintas unit dan
  `bisa_kelola_izin_grup()` untuk menampilkan tombol Ubah/Batalkan secara akurat,
  dengan fallback konservatif bila migrasi 23 belum dijalankan. Policy baca
  `pegawai` diperluas agar pembuat grup dapat melihat nama/unit anggota lintas
  unit, dan RPC menolak akun non-`pegawai`.
- **File:** `supabase/migrations/23_dinas_luar_lintas_unit.sql`,
  `supabase/verifikasi_23.sql`, `supabase/schema.sql`,
  `src/services/pegawaiService.js`, `src/services/leaveService.js`,
  `src/pages/admin/PengajuanIzin.jsx`, `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus **5,24 dtk** (percobaan awal 8,15 dtk;
  280 modul). Migrasi 23 dan `verifikasi_23.sql` **belum dijalankan** di
  Supabase.
- **Catatan/risiko:** `bisa_baca_dokumen()` membatasi akses pemilik file hanya
  untuk file yang belum terhubung ke baris `izin_cuti`, sehingga dokumen grup
  ikut tertutup saat jabatan berakhir. Anggota grup tetap dapat membaca dokumen
  grup miliknya sendiri. Perubahan belum di-commit.

### 2026-10-28 WITA — Lanjutan penanda tangan laporan setelah force close
- **Perubahan:** mengidentifikasi pekerjaan terakhir sebagai I-055 (penanda tangan
  laporan Kasubbag Tata Usaha + penyembunyian menu Absensi bagi kepala ASN).
  Seluruh perubahan inti sudah ada di working tree; dilengkapi dengan menghapus
  helper `namaKepalaUnit` di `src/utils/laporan.js` yang tidak lagi dipakai
  setelah nama kepala unit tidak menjadi penanda tangan laporan.
- **File:** `src/utils/laporan.js`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus **6,95 dtk** (280 modul).
- **Catatan/risiko:** belum ada uji cetak manual. Sudah di-commit `69cc041` dan
  di-push ke `origin/main`. `verifikasi_22.sql` juga belum dikonfirmasi.

### 2026-10-28 11:42 WITA — Penanda tangan laporan & menu kepala ASN
- **Perubahan:** seluruh laporan presensi bulanan per pegawai kini ditandatangani
  **Kasubbag Tata Usaha, Suriami, SKM., M.Kes (NIP. 197312302007012011)** sesuai
  arahan direktur, bukan lagi nama kepala unit per unit kerja. Tombol **Kembali ke
  Absensi** di sidebar dan tab **Absensi** pada navigasi bawah HP disembunyikan
  untuk akun **kepala ASN** (`sumber_akun = kepala_asn`); kepala non-ASN dan
  pegawai biasa tetap dapat kembali ke Absensi. User juga melaporkan **migrasi 22
  sudah dijalankan**.
- **File:** `src/config/constants.js`, `src/components/laporan/BlokTandaTangan.jsx`,
  `src/components/laporan/LembarLaporan.jsx`,
  `src/pages/admin/LaporanBulanan.jsx`, `src/services/kepalaUnitService.js`,
  `src/components/layout/PortalKepalaLayout.jsx`,
  `src/components/layout/SidebarKepala.jsx`, `README.md`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** `npm run build` (lihat hasil di laporan akhir); belum ada uji
  cetak manual.
- **Catatan/risiko:** RPC `nama_kepala_unit` tetap ada di database meski klien
  tidak lagi memakainya (kompatibilitas). Penanda tangan kini sama untuk semua
  unit dan kedua portal; tidak perlu migrasi baru. Perubahan belum di-commit.

### 2026-10-28 WITA — Commit & push kepala unit multi-unit
- **Perubahan:** commit `18a497d` — meng-commit dan mem-push seluruh pekerjaan kepala unit
  multi-unit & kepala ASN (migrasi 22, halaman Kepala Unit, service, auth/RPC,
  RLS, portal kepala, laporan/tanda tangan, sinkronisasi `schema.sql` dan
  `cleanup_data_uji.sql`) beserta pembaruan dokumen audit.
- **File:** seluruh perubahan working tree per `git status` (21 file diubah +
  4 file baru).
- **Verifikasi:** `npm run build` lulus 6,77 dtk (280 modul) memakai
  `NODE_OPTIONS=--max-old-space-size=4096`; percobaan pertama gagal karena
  `vite:reporter` kehabisan memori lalu diulang dengan heap lebih besar.
- **Catatan/risiko:** migrasi **22** dan `verifikasi_22.sql` **belum dijalankan**
  di Supabase, sehingga menu Kepala Unit dan login kepala ASN belum berfungsi
  sampai migrasi dijalankan.

### 2026-10-28 09:11 WITA — Kepala unit multi-unit & kepala ASN
- **Perubahan:** penugasan kepala dipindah ke tabel `kepala_unit` (satu unit satu
  kepala, satu kepala boleh banyak unit). Kepala ASN memakai metadata
  `jenis_akun = kepala_asn`, tidak membuat baris `public.pegawai`, dan tetap
  dapat login/mengelola unit. `pegawai.kepala_ruangan` dipertahankan sebagai
  cache yang disinkronkan server. Menambahkan `profil_saya()`, `unit_dikelola()`,
  `is_kepala_ruangan()`, `bisa_kelola_unit()`, `daftar_kepala_unit()`,
  `daftar_akun_kepala_asn()`, `simpan_kepala_unit()`, dan `nama_kepala_unit()`;
  seluruh RPC izin/jadwal/impor/hapus grup serta policy RLS memakai
  `unit_dikelola()`/`bisa_kelola_unit()`. Frontend: halaman **Kepala Unit** di
  portal Super Admin, service `kepalaUnitService.js`, profil auth via RPC dengan
  fallback lama, routing peran `kepala`, pemilih unit aktif di portal kepala,
  Data Pegawai tanpa pengaturan kepala, dan laporan bulanan memakai nama kepala
  unit. `schema.sql` dan `cleanup_data_uji.sql` disinkronkan (tabel
  `kepala_unit` dipertahankan saat pembersihan data uji).
- **File:** `supabase/migrations/22_kepala_unit_multi_unit.sql`,
  `supabase/verifikasi_22.sql`, `supabase/schema.sql`,
  `supabase/cleanup_data_uji.sql`, `src/App.jsx`,
  `src/components/ProtectedRoute.jsx`, `src/context/AuthContext.jsx`,
  `src/services/authService.js`, `src/services/pegawaiService.js`,
  `src/services/reportService.js`, `src/services/kepalaUnitService.js`,
  `src/pages/admin/KepalaUnit.jsx`, `src/pages/admin/DataPegawai.jsx`,
  `src/pages/admin/JadwalShift.jsx`, `src/pages/admin/PengajuanIzin.jsx`,
  `src/pages/admin/LaporanBulanan.jsx`, `src/pages/Login.jsx`,
  `src/components/layout/PortalKepalaLayout.jsx`,
  `src/components/layout/SidebarAdmin.jsx`,
  `src/components/laporan/LembarLaporan.jsx`, `src/utils/laporan.js`,
  `src/index.css`, `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus 8,72 dtk (280 modul, 2026-10-28 09:11);
  verifikasi ulang 09:17 lulus 6,39 dtk dan 09:20 lulus 6,44 dtk setelah
  penyempurnaan daftar kandidat kepala. Migrasi 22 dan `verifikasi_22.sql`
  **belum dijalankan** di Supabase.
- **Catatan/risiko:** sebelum migrasi 22 dijalankan, menu Kepala Unit dan akun
  kepala ASN belum berfungsi (RPC `profil_saya`/`simpan_kepala_unit` belum ada);
  klien memiliki fallback profil lama sehingga pegawai tetap dapat login. Setelah
  migrasi, `pegawai.kepala_ruangan` hanya cache — ubah penugasan lewat halaman
  Kepala Unit. Perubahan belum di-commit.

### 2026-10-27 12:10 WITA — Ikon menu laporan dibedakan
- **Perubahan:** menu **Laporan Bulanan** dan **Rekapitulasi Laporan** di sidebar
  Super Admin sebelumnya memakai ikon yang sama (`rekap`). Laporan Bulanan kini
  memakai ikon dokumen (`laporan`), sedangkan Rekapitulasi Laporan tetap memakai
  ikon grafik (`rekap`).
- **File:** `src/components/layout/SidebarAdmin.jsx`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** `npm run build` lulus 6,78 dtk (278 modul).
- **Catatan/risiko:** hanya ikon menu yang berubah; rute dan halaman tidak
  berubah. Perubahan belum di-commit.

### 2026-10-27 12:04 WITA — Logo & identitas laporan dirapikan
- **Perubahan:** tinggi logo Kutai dan RSUD pada kop disamakan menjadi 20 mm
  (sebelumnya hanya lebar 15 mm sehingga logo RSUD tampak lebih kecil). Label
  identitas pegawai dibuat selebar isinya dan nilai langsung mengikuti titik dua,
  sehingga tidak ada jarak kosong besar setelah `Nama Pegawai:`.
- **File:** `src/index.css`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus 8,95 dtk (278 modul). Uji cetak manual
  A4 **belum dilakukan**.
- **Catatan/risiko:** kop menjadi sedikit lebih lebar karena logo RSUD 20 mm;
  nama RSUD tetap satu baris dan masih muat di area teks. Perubahan belum
  di-commit; menunggu uji lokal user.

### 2026-10-27 11:41 WITA — Kop & isi laporan presensi dirapikan
- **Perubahan:** kop RSUD dibuat satu baris dengan `white-space: nowrap` dan
  ukuran bold diturunkan menjadi 12/13/14pt; identitas pegawai diubah dari tabel
  menjadi grid 2x2 (Nama, Unit/Instalasi, Periode, Pola Kerja); ringkasan
  kehadiran dirapikan dan `Izin` dihapus; kolom Keterangan hanya diisi alasan
  Sakit/Cuti/Dinas Luar, label `Alfa`, dan `—` untuk Hadir/Koreksi;
  `alasan_koreksi` tidak lagi dipakai/di-query; footer hanya menampilkan tanggal
  cetak tanpa jam; lebar kolom tabel disesuaikan.
- **File:** `src/index.css`, `src/components/laporan/LembarLaporan.jsx`,
  `src/utils/laporan.js`, `src/services/reportService.js`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** `npm run build` lulus 7,49 dtk (278 modul). Uji cetak manual
  A4 satu pegawai/semua pegawai **belum dilakukan**.
- **Catatan/risiko:** status `Izin` memang sudah tidak ada di database sejak
  migrasi 09, jadi tidak perlu migrasi baru. Baris Koreksi tetap tampil tanpa
  alasan koreksi. Perubahan belum di-commit; menunggu uji lokal user.

### 2026-10-27 11:02 WITA — Data uji dibersihkan
- **Perubahan:** user menjalankan `supabase/cleanup_data_uji.sql`; data transaksi
  (presensi, koreksi, izin, jadwal, jadwal final, perangkat) dihapus, sedangkan
  92 pegawai, grup shift, master shift, dan data master lain dipertahankan.
- **File:** tidak ada perubahan kode baru; hanya pembaruan dokumen audit.
- **Verifikasi:** laporan user "sql sudah jalan" (11:02); hasil NOTICE/query
  verifikasi belum dilampirkan.
- **Catatan/risiko:** semua pegawai harus verifikasi perangkat ulang; jadwal
  go-live harus diisi ulang dan Alfa otomatis tetap nonaktif sampai lengkap.
  Perubahan skrip/dokumen masih di working tree, belum di-commit.

### 2026-10-27 10:54 WITA — Pembersihan data uji sebelum go-live
- **Perubahan:** `supabase/cleanup_data_uji.sql` diperbarui agar hanya menghapus
  data transaksi/uji: `presensi`, `koreksi_presensi`, `izin_cuti`,
  `jadwal_shift`, `jadwal_shift_final` (bila ada), dan `perangkat`.
  **Pegawai (92), grup shift, master shift, jam kerja reguler, hari libur, dan
  pengaturan presensi dipertahankan.** Skrip mencatat baseline jumlah
  pegawai/grup/master shift lalu membatalkan seluruh transaksi bila jumlahnya
  berubah.
- **File:** `supabase/cleanup_data_uji.sql`, `README.md`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** belum dijalankan di Supabase (menunggu user). SQL tidak
  memengaruhi `npm run build`.
- **Catatan/risiko:** setelah skrip dijalankan, seluruh pegawai harus
  mengajukan verifikasi perangkat ulang. Jadwal shift harus diisi ulang untuk
  periode go-live. Alfa otomatis tetap nonaktif sampai jadwal dan hari libur
  lengkap. Perubahan belum di-commit.

### 2026-10-27 10:39 WITA — Migrasi 21, Supabase Auth, dan HTTPS
- **Perubahan:** user mengonfirmasi seluruh sisa pekerjaan selesai: migrasi **21**
  dijalankan di Supabase, Site URL/Redirect URLs Supabase diperbarui ke domain
  baru, dan Enforce HTTPS diaktifkan.
- **File:** tidak ada perubahan kode; hanya pembaruan dokumen audit.
- **Verifikasi:** klaim user "sudah semuanya dan migrasi 21" (10:39). Pengecekan
  mandiri: `https://presisiami.my.id/` → **200**; `http://presisiami.my.id/`
  masih **200 tanpa redirect** ke HTTPS; `www` → 301 ke `http://presisiami.my.id/`
  (belum ke HTTPS).
- **Catatan/risiko:** `verifikasi_21.sql` belum dikonfirmasi. Jika setelah
  1×24 jam HTTP apex masih tidak redirect, buka Settings → Pages dan pastikan
  **Enforce HTTPS** benar-benar tersimpan/tersedia.

### 2026-10-27 10:36 WITA — Commit & push custom domain + verifikasi live
- **Perubahan:** perubahan custom domain (`VITE_BASE_PATH` → `/`, `public/CNAME`,
  README, dokumen audit) di-commit sebagai `11d35ab` dan di-push ke
  `origin/main`. Workflow deploy `40439173719` **sukses**.
- **File:** `.github/workflows/deploy.yml`, `public/CNAME`, `README.md`,
  `AGENTS.md`, `progress.md`.
- **Verifikasi live:**
  - `https://presisiami.my.id/` → **200**, aset `/assets/...` → **200**
    (sebelumnya `/PRESISI-AMI/assets/...` 404).
  - `https://www.presisiami.my.id/` → **200**, redirect ke
    `https://presisiami.my.id/`.
  - `/superadmin-portal` → HTTP 404 dengan body `index.html` (fallback SPA,
    aplikasi tetap termuat); favicon → **200**.
  - `http://presisiami.my.id/` belum redirect ke HTTPS → **Enforce HTTPS belum
    dicentang**.
- **Catatan/risiko:** Site URL/Redirect URLs Supabase belum diperbarui ke domain
  baru. Uji login dan absensi lewat domain baru belum tercatat.

### 2026-10-27 10:31 WITA — Custom domain presisiami.my.id disiapkan
- **Perubahan:** aplikasi disiapkan pindah dari
  `https://rantemario905-source.github.io/PRESISI-AMI/` ke domain utama
  `https://presisiami.my.id/`. DNS Rumahweb sudah berisi 4 A record GitHub Pages
  dan CNAME `www`, serta GitHub Pages melaporkan **DNS check successful**.
  `VITE_BASE_PATH` di workflow diubah menjadi `/` dan ditambahkan `public/CNAME`
  agar aset tidak lagi mencari folder `/PRESISI-AMI/`.
- **File:** `.github/workflows/deploy.yml`, `public/CNAME` (baru), `README.md`,
  `AGENTS.md`, `progress.md`.
- **Verifikasi:** `$env:VITE_BASE_PATH='/'; npm run build` lulus 8,23 dtk;
  `dist/index.html` memakai `/assets/...`, `dist/CNAME` berisi
  `presisiami.my.id`, `.nojekyll` ada. URL domain lama masih menyajikan build
  base `/PRESISI-AMI/` (aset 404 di root) sampai perubahan ini di-deploy.
- **Catatan/risiko:** **Enforce HTTPS belum aktif** karena sertifikat GitHub
  masih diproses. Perubahan belum di-commit/di-push; selama belum deploy,
  `https://presisiami.my.id/` tampil kosong dan URL github.io lama tetap
  berfungsi. Site URL/Redirect URLs Supabase juga belum diperbarui.

### 2026-10-27 09:59 WITA — Commit & push migrasi 21
- **Perubahan:** perubahan koordinat RSUD AMI terbaru (klien, `schema.sql`,
  migrasi 21, `verifikasi_21.sql`, dan dokumen audit) di-commit sebagai
  `28a900f` lalu di-push ke `origin/main`.
- **File:** `src/config/constants.js`, `supabase/schema.sql`,
  `supabase/migrations/21_koordinat_rsud.sql`,
  `supabase/verifikasi_21.sql`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus (12,25 dtk) sebelum commit; push
  `f13301d..28a900f main -> main` berhasil.
- **Catatan/risiko:** migrasi 21 belum dijalankan di Supabase; koordinat server
  baru aktif setelah dieksekusi.

### 2026-10-27 09:57 WITA — Koordinat RSUD AMI diubah lagi
- **Perubahan:** titik pusat geofencing RSUD AMI diganti menjadi
  `-0.23805651650343132, 117.41442516465149` sesuai instruksi user (I-037).
  Klien memakai nilai baru dari `src/config/constants.js`; server memakai nilai
  baru lewat migrasi **21** (mendefinisikan ulang `submit_presensi`, radius tetap
  100 m) karena migrasi 20 sudah dijalankan di produksi dan tidak diubah.
  `schema.sql` disinkronkan pada seluruh definisi `submit_presensi`, dan
  `verifikasi_20.sql` tetap sebagai riwayat.
- **File:** `src/config/constants.js`, `supabase/schema.sql`,
  `supabase/migrations/21_koordinat_rsud.sql` (baru),
  `supabase/verifikasi_21.sql` (baru), `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus (12,25 dtk). SQL belum dijalankan di
  Supabase; `verifikasi_21.sql` menunggu eksekusi.
- **Catatan/risiko:** koordinat server baru berlaku setelah migrasi 21
  dijalankan. Perubahan masih di working tree dan belum di-commit.

### 2026-10-27 09:53 WITA — Commit & push laporan bulanan + koordinat
- **Perubahan:** seluruh working tree (laporan presensi bulanan per pegawai,
  migrasi 19–20, verifikasi 19–20, koordinat RSUD AMI baru, dan dokumen audit)
  di-commit sebagai `fc772c1` lalu di-push ke `origin/main`.
- **File:** `src/App.jsx`, `src/components/laporan/*`,
  `src/pages/admin/LaporanBulanan.jsx`, `src/utils/laporan.js`,
  `src/services/reportService.js`, `src/config/constants.js`,
  `supabase/migrations/19–20`, `supabase/verifikasi_19–20`, `supabase/schema.sql`,
  `README.md`, `AGENTS.md`, `progress.md`, dan aset logo kop.
- **Verifikasi:** `npm run build` lulus (7,42 dtk) sebelum commit; push
  `e542c6c..fc772c1 main -> main` berhasil.
- **Catatan/risiko:** uji cetak PDF manual dan uji absensi dengan titik GPS baru
  di perangkat belum tercatat; GitHub Pages akan build otomatis dari push ini.

### 2026-10-27 09:39 WITA — Migrasi 20 & verifikasi 20 berhasil
- **Perubahan:** user menjalankan `supabase/migrations/20_koordinat_rsud.sql`
  dan `supabase/verifikasi_20.sql` di Supabase; keduanya **sukses**. Koordinat
  server RSUD AMI kini `-0.23781156083888882, 117.41437950820705` dan sejalan
  dengan klien.
- **File:** tidak ada perubahan kode; hanya pembaruan dokumen audit.
- **Verifikasi:** laporan user "sudah saya run dan succses" (2026-10-27 09:39).
- **Catatan/risiko:** uji absensi radius dengan titik GPS baru di perangkat
  belum tercatat; perubahan frontend masih di working tree dan belum di-commit.

### 2026-10-27 09:20 WITA — Koordinat RSUD AMI dikoreksi
- **Perubahan:** titik pusat geofencing RSUD AMI diganti lagi menjadi
  `-0.23781156083888882, 117.41437950820705` sesuai instruksi user (I-034).
  Nilai baru diterapkan di klien (`src/config/constants.js`), migrasi **20**,
  seluruh definisi `submit_presensi` pada `schema.sql`, dan pemeriksaan
  `verifikasi_20.sql`. Radius tetap 100 m.
- **File:** `src/config/constants.js`, `supabase/schema.sql`,
  `supabase/migrations/20_koordinat_rsud.sql`, `supabase/verifikasi_20.sql`,
  `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` lulus (7,42 dtk). `verifikasi_20.sql` kini
  menolak koordinat lama `-0.23795851007230442`.
- **Catatan/risiko:** migrasi 20 belum dijalankan di Supabase, sehingga
  koordinat server baru aktif setelah dieksekusi. Perubahan masih di working
  tree dan belum di-commit.

### 2026-10-27 09:03 WITA — Koordinat RSUD AMI diperbarui
- **Perubahan:** titik pusat geofencing RSUD AMI diubah menjadi
  `-0.23795851007230442, 117.41438417546158` sesuai instruksi user (I-033).
  Klien memakai nilai baru dari `src/config/constants.js`; server memakai nilai
  baru lewat migrasi **20** yang mendefinisikan ulang `submit_presensi` (radius
  tetap 100 m). `schema.sql` disinkronkan pada seluruh definisi `submit_presensi`.
- **File:** `src/config/constants.js`, `supabase/schema.sql`,
  `supabase/migrations/20_koordinat_rsud.sql` (baru),
  `supabase/verifikasi_20.sql` (baru), `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` (lihat hasil di sesi ini). SQL belum dijalankan
  di Supabase; `verifikasi_20.sql` menunggu eksekusi.
- **Catatan/risiko:** migrasi lama (05, 07, 12, 17) **tidak diubah** sesuai
  aturan; koordinat server baru berlaku setelah migrasi 20 dijalankan. Perubahan
  masih di working tree dan belum di-commit.

### 2026-10-27 01:03 WITA — Migrasi 19 & verifikasi 19 berhasil
- **Perubahan:** user menjalankan ulang migrasi 19 dan `verifikasi_19.sql` di
  project Supabase yang benar; keduanya **sukses**. Akses baca presensi unit
  untuk kepala ruangan kini aktif.
- **File:** tidak ada perubahan kode/dokumen SQL; hanya pembaruan dokumen audit.
- **Verifikasi:** laporan user "sudah succses run dua2nya" (2026-10-27 01:03).
  Build frontend terakhir tetap lulus 13,48 dtk / 12,16 dtk.
- **Catatan/risiko:** uji cetak PDF manual belum dilakukan; perubahan frontend
  masih di working tree dan belum di-commit.

### 2026-10-27 01:02 WITA — Klarifikasi project Supabase salah
- **Perubahan:** user mengonfirmasi ERROR 42883 terjadi karena SQL Editor dibuka
  pada **project Supabase yang salah**, bukan karena fungsi hilang di project
  aplikasi. Pengecekan tabel pada migrasi 19 bekerja: eksekusi di project tanpa
  `public.pegawai`/`public.presensi` dihentikan dengan pesan jelas.
- **File:** `AGENTS.md`, `progress.md` (tanpa perubahan kode).
- **Verifikasi:** belum ada; migrasi 19 tetap harus dijalankan di project yang
  cocok dengan `VITE_SUPABASE_URL` pada `.env` aplikasi.
- **Catatan/risiko:** blok kompatibilitas `is_superadmin()` tetap dipertahankan
  sebagai pengaman instalasi lama; definisinya sama dengan migrasi 02.

### 2026-10-27 00:58 WITA — Perbaikan migrasi 19 (is_superadmin hilang)
- **Perubahan:** migrasi 19 gagal di Supabase dengan `ERROR 42883: function
  public.is_superadmin() does not exist`. Versi perbaikan tidak lagi bergantung
  pada fungsi tersebut: `bisa_lihat_presensi()` memeriksa `role = 'superadmin'`,
  pemilik baris, dan kepala ruangan unit langsung dari tabel `pegawai`. Migrasi
  juga membuat ulang `public.is_superadmin()` dengan definisi yang sama seperti
  migrasi 02 agar policy lama yang membutuhkannya kembali berfungsi, serta
  menolak jalan bila tabel `pegawai`/`presensi` tidak ada (indikasi project
  salah).
- **File:** `supabase/migrations/19_laporan_presensi_kepala.sql`,
  `supabase/schema.sql`, `supabase/verifikasi_19.sql`, `README.md`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** SQL belum dijalankan ulang; menunggu user menjalankan migrasi
  19 dan `verifikasi_19.sql`. Build frontend tidak berubah (terakhir lulus
  13,48 dtk / 12,16 dtk).
- **Catatan/risiko:** bila `public.pegawai` juga tidak ditemukan, berarti project
  Supabase yang dibuka di SQL Editor bukan project aplikasi; jalankan migrasi
  01–18 lebih dulu di project yang benar.

### 2026-10-27 00:52 WITA — Laporan presensi bulanan per pegawai
- **Perubahan:** menambahkan fitur **Laporan Bulanan per Pegawai** untuk Super
  Admin dan Kepala Ruangan sesuai permintaan I-029. Super Admin memilih unit;
  kepala ruangan terkunci pada unit sendiri. Cakupan satu pegawai atau seluruh
  pegawai unit (satu halaman per pegawai). Lembar A4 portrait berisi kop
  Pemerintah Kutai Kartanegara + RSUD Aji Muhammad Idris (logo Kutai kiri,
  logo RSUD kanan, teks Times New Roman), identitas pegawai, tabel harian
  (hari/tanggal, jam masuk, jam pulang, status, terlambat, keterangan), ringkasan
  kehadiran, tanda tangan Kepala Ruangan kanan bawah (Muara Badak, NIP kosong),
  serta footer “Dicetak melalui PRESISI-AMI” + nomor halaman. Tabel tanpa kolom
  jarak. Keterangan memuat alasan koreksi dan alasan izin. Cetak lewat dialog
  browser → **Simpan sebagai PDF** (tanpa dependensi baru). Migrasi **19**
  menambahkan `bisa_lihat_presensi(uuid)` dan policy baca presensi unit agar
  kepala ruangan dapat mengambil data laporan.
- **File:** `supabase/migrations/19_laporan_presensi_kepala.sql`,
  `supabase/verifikasi_19.sql`, `supabase/schema.sql`,
  `src/pages/admin/LaporanBulanan.jsx`,
  `src/components/laporan/{KopLaporan,BlokTandaTangan,LembarLaporan}.jsx`,
  `src/utils/laporan.js`, `src/utils/format.js`, `src/services/reportService.js`,
  `src/index.css`, `src/App.jsx`,
  `src/components/layout/{PortalAdminLayout,PortalKepalaLayout,SidebarAdmin,SidebarKepala}.jsx`,
  `src/components/NavigasiBawah.jsx`, `src/pages/admin/Rekapitulasi.jsx`,
  `src/assets/logo-kutai-kartanegara.png` (rename),
  `README.md`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `npm run build` **lulus** — base `/` 13,48 dtk; base
  `/PRESISI-AMI/` 12,16 dtk (2026-10-27 00:52). Cetak manual PDF **belum
  diuji**.
- **Catatan/risiko:** migrasi 19 **belum dijalankan**; tanpa migrasi ini laporan
  kepala ruangan akan kosong karena RLS. Ukuran/bold kop menunggu koreksi visual
  user. Belum di-commit sesuai aturan alur Git.

### 2026-10-27 00:03 WITA — Commit & push aksi per halaman
- **Perubahan:** atas perintah user (I-028), pekerjaan penempatan aksi per
  halaman beserta pengembalian `KepalaHalaman` ke judul kiri/aksi kanan,
  penghapusan subtitle rumah sakit di topbar, dan aset
  `src/assets/logo kutai kartanegara.png` di-commit lalu di-push ke `origin/main`.
  Dokumen audit (`AGENTS.md`, `progress.md`) ikut diperbarui.
- **File:** `src/components/layout/PortalAdminLayout.jsx`,
  `src/components/layout/PortalKepalaLayout.jsx`, `src/components/ui/TabBar.jsx`,
  `src/pages/admin/{DataPegawai,GrupShift,MasterShift,HariLibur,KoreksiPresensi,VerifikasiPerangkat,PengajuanIzin,Rekapitulasi}.jsx`,
  `src/assets/logo kutai kartanegara.png`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 272 modul, 7,84 dtk (base `/`).
  Build base `/PRESISI-AMI/` terakhir lulus 8,07 dtk (2026-10-26 23:50).
- **Catatan/risiko:** uji visual desktop/HP untuk penempatan tombol aksi tetap
  menjadi backlog **B-19**; deploy GitHub Pages berjalan otomatis setelah push
  ke `main`.

### 2026-10-26 23:50 WITA — Penempatan aksi per halaman
- **Perubahan:** pendekatan I-025 (aksi menempel dekat judul) digantikan.
  `KepalaHalaman` kembali ke judul kiri/aksi kanan. Tombol aksi dipindah sesuai
  konteks: **Muat ulang** ke header **Daftar Pegawai**; **+ Grup** ke header
  **Daftar Grup**; **Buka Jadwal Shift** dan **+ Shift** ke header **Daftar
  Master Shift**; **Tahun** ke kanan atas kartu **Tambah Hari Libur**;
  **Muat ulang** ke baris tab setelah **Audit Trail** (Koreksi) dan setelah
  **Semua** (Verifikasi); **Muat ulang** dan **+ Catat** ke header daftar
  pengajuan Dinas & Sakit/Cuti; **Ekspor CSV** dan **Cetak Laporan** ke baris
  kanan atas di luar kotak filter Rekapitulasi. `TabBar` mendapat prop `aksi`.
  Dashboard, Pengaturan Presensi, dan Jadwal Shift tetap memakai aksi kanan
  `KepalaHalaman`; subtitle topbar tetap tanpa nama rumah sakit.
- **File:** `src/components/admin/KepalaHalaman.jsx`,
  `src/components/ui/TabBar.jsx`, `src/pages/admin/DataPegawai.jsx`,
  `src/pages/admin/GrupShift.jsx`, `src/pages/admin/MasterShift.jsx`,
  `src/pages/admin/HariLibur.jsx`, `src/pages/admin/KoreksiPresensi.jsx`,
  `src/pages/admin/VerifikasiPerangkat.jsx`,
  `src/pages/admin/PengajuanIzin.jsx`, `src/pages/admin/Rekapitulasi.jsx`,
  `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 6,73 dtk (base `/`); build
  `VITE_BASE_PATH=/PRESISI-AMI/` **lulus** — 8,07 dtk
  (`NODE_OPTIONS=--max-old-space-size=4096`). Pemeriksaan teks memastikan
  `aksi=` hanya tersisa pada `TabBar` Koreksi dan Verifikasi.
- **Catatan/risiko:** uji visual desktop/HP belum dilakukan; tombol di header
  kartu dapat turun baris pada layar sempit (sudah memakai `flex-wrap`).
  Tidak ada perubahan database; perubahan belum di-commit. Aset
  `src/assets/logo kutai kartanegara.png` tetap belum dipakai.

### 2026-10-26 22:40 WITA — Aksi dekat judul & subtitle topbar
- **Perubahan:** `KepalaHalaman` tidak lagi memakai tata letak kiri-kanan
  (`justify-between`); judul dan tombol aksi kini berada dalam satu baris
  `flex-wrap`, sehingga aksi menempel dekat judul dan turun baris bila tidak
  muat. Di HP aksi tetap selebar baris di bawah judul. Kontrol **Tahun** pada
  Hari Libur diubah menjadi satu baris (label dan input sejajar). Subtitle
  **RSUD Aji Muhammad Idris** dihapus dari topbar Super Admin; topbar Kepala
  Ruangan kini hanya menampilkan nama unit kerja.
- **File:** `src/components/admin/KepalaHalaman.jsx`,
  `src/pages/admin/HariLibur.jsx`,
  `src/components/layout/PortalAdminLayout.jsx`,
  `src/components/layout/PortalKepalaLayout.jsx`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 272 modul, 7,32 dtk (base `/`);
  build `VITE_BASE_PATH=/PRESISI-AMI/` **lulus** — 7,92 dtk. Semua 11 halaman
  pengguna `KepalaHalaman` ikut memakai tata letak baru.
- **Catatan/risiko:** pada halaman dengan tiga tombol (mis. Jadwal Shift) aksi
  dapat turun ke baris kedua di layar sempit; belum diuji visual di browser.
  Tidak ada perubahan database; perubahan belum di-commit. Aset
  `src/assets/logo kutai kartanegara.png` tetap belum dipakai.

### 2026-10-26 22:20 WITA — Latar biru semua menu portal
- **Perubahan:** latar gradasi biru muda transparan
  (`from-sky-50/90 via-sky-50/60 to-slate-50`) yang sebelumnya hanya dipakai
  halaman Dashboard kini diterapkan ke seluruh halaman portal Super Admin dan
  Kepala Ruangan. Header, sidebar, dan kartu tetap putih; tidak ada perubahan
  tata letak maupun data.
- **File:** `src/components/layout/PortalAdminLayout.jsx`,
  `src/components/layout/PortalKepalaLayout.jsx`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 272 modul, 8,12 dtk (base `/`);
  build `VITE_BASE_PATH=/PRESISI-AMI/` **lulus** — 7,81 dtk
  (`NODE_OPTIONS=--max-old-space-size=4096`). Kelas gradasi terverifikasi ada di
  CSS hasil build.
- **Catatan/risiko:** latar kini mengikuti tinggi konten; pada halaman yang
  sangat pendek sisa area bawah tetap slate. Belum diuji visual di browser.
  Tidak ada perubahan database. Aset
  `src/assets/logo kutai kartanegara.png` tetap belum dipakai.
- **Tindak lanjut:** di-commit `fd2d64a` dan di-push ke `origin/main`
  (2026-10-26 22:25), bersama perapian sidebar pada entri sebelumnya.

### 2026-10-26 22:05 WITA — Sidebar rapat & latar dashboard
- **Perubahan:** merapatkan jarak vertikal menu sidebar Super Admin dan Kepala
  Ruangan dengan kerapatan sedang: padding `nav` dikurangi, item menu menjadi
  38–40 px (sebelumnya 42–44 px), jarak antargrup dan antarsubmenu diperkecil,
  header grup lebih ringkas, serta garis pemisah Dashboard dirapatkan. Halaman
  **Dashboard Super Admin** kini memakai latar gradasi biru muda transparan
  (`from-sky-50/90 via-sky-50/60 to-slate-50`) pada kolom konten; halaman admin
  lain tetap berlatar slate. Header, sidebar, dan kartu tetap putih.
- **File:** `src/components/layout/SidebarAdmin.jsx`,
  `src/components/layout/SidebarKepala.jsx`,
  `src/components/layout/PortalAdminLayout.jsx`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 272 modul, 13,28 dtk (base `/`);
  build `VITE_BASE_PATH=/PRESISI-AMI/` **lulus** — 6,56 dtk setelah
  `NODE_OPTIONS=--max-old-space-size=4096` (percobaan pertama kena
  `JavaScript heap out of memory`). `git diff --stat` hanya menyentuh tiga file
  layout.
- **Catatan/risiko:** gradasi hanya aktif bila `pathname` tepat
  `/superadmin-portal`; sub-route Dashboard tidak ada. Jarak 38 px masih di atas
  batas minimum sentuh yang nyaman, tetapi perlu uji visual di HP. Tidak ada
  perubahan database. Aset
  `src/assets/logo kutai kartanegara.png` belum dipakai dan disisihkan untuk
  pekerjaan kop RSUD AMI berikutnya.
- **Tindak lanjut:** di-commit `fd2d64a` dan di-push ke `origin/main`
  (2026-10-26 22:25).

### 2026-10-26 15:31 WITA — Animasi submenu sidebar Super Admin
- **Perubahan:** submenu grup sidebar Super Admin (**Data & Struktur**,
  **Penjadwalan & Presensi**, **Layanan & Laporan**, **Keamanan**) kini dibuka
  dan ditutup dengan animasi gulir ke bawah/halus memakai transisi
  `grid-template-rows` 200 ms, ditambah opacity dan translate pada isinya.
  Submenu tetap ter-mount agar transisi tutup berjalan; saat tertutup isinya
  `aria-hidden`, tidak bisa diklik, dan tidak masuk urutan fokus keyboard.
- **File:** `src/components/layout/SidebarAdmin.jsx`, `README.md`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** `npm run build` **lulus** - 272 modul, 11,66 dtk (base `/`);
  build `VITE_BASE_PATH=/PRESISI-AMI/` **lulus** - 10,61 dtk; kelas
  `grid-rows-[0fr]`, `grid-rows-[1fr]`, dan `transition-[grid-template-rows]`
  ada di CSS hasil build.
- **Catatan/risiko:** animasi belum diuji visual manual di browser. Animasi
  `grid-template-rows` memicu layout ringan selama 200 ms; hanya berjalan saat
  grup dibuka/ditutup. Tidak ada perubahan database; perubahan belum di-commit.

### 2026-10-26 15:17 WITA — Animasi buka/tutup menu akun
- **Perubahan:** dropdown avatar kini muncul dengan animasi slide-down halus
  160 ms dan menutup dengan animasi 140 ms; elemen ditahan sebentar saat menutup
  agar transisi terlihat, lalu dilepas dari DOM. Animasi hanya memakai `opacity`
  dan `transform`; pengguna dengan `prefers-reduced-motion` tetap mendapat
  perubahan hampir instan. Fokus kembali ke tombol avatar saat menu ditutup
  dengan Esc.
- **File:** `tailwind.config.js`, `src/components/layout/MenuAkun.jsx`,
  `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** - 272 modul, 10,96 dtk (base `/`);
  build `VITE_BASE_PATH=/PRESISI-AMI/` **lulus** - 15,46 dtk; keyframe
  `dropdown-masuk`/`dropdown-keluar` dan kelas animasinya ada di CSS hasil build.
- **Catatan/risiko:** animasi belum diuji visual manual di browser. Tidak ada
  perubahan database; perubahan belum di-commit.

### 2026-10-26 15:07 WITA — Tanggal kartu pulang & menu akun avatar
- **Perubahan:** subtitle kartu **Sudah Absen Pulang** diganti menjadi tanggal
  aktual, sama dengan kartu **Hadir Hari Ini**. Tombol **Keluar** mandiri dihapus
  dari header portal pegawai, Super Admin, dan kepala ruangan; logout kini berada
  di dropdown avatar kanan atas. Avatar selalu tampil di HP, dropdown menampilkan
  nama/peran (di HP) dan tombol **Keluar**, serta menutup saat klik di luar atau
  menekan Esc.
- **File:** `src/components/layout/MenuAkun.jsx` (baru),
  `src/components/BarAtas.jsx`,
  `src/components/layout/PortalAdminLayout.jsx`,
  `src/components/layout/PortalKepalaLayout.jsx`,
  `src/pages/admin/DashboardUtama.jsx`, `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 272 modul, 13,23 dtk (base `/`);
  build `VITE_BASE_PATH=/PRESISI-AMI/` **lulus** — 12,47 dtk; `git diff --check`
  tanpa kesalahan.
- **Catatan/risiko:** perubahan belum di-commit; dropdown dan proses logout belum
  diuji manual di browser. Tidak ada perubahan database.

### 2026-10-26 14:56 WITA — Penyesuaian label dashboard Super Admin
- **Perubahan:** “Dashboard Utama” menjadi **Dashboard** di sidebar, judul
  halaman, dan topbar; “Total Pegawai Non-ASN” menjadi **Total Pegawai** dengan
  keterangan **Non ASN**; keterangan kartu **Hadir Hari Ini** diganti menjadi
  tanggal aktual (WITA); “Perlu verifikasi Admin IT” menjadi **Perlu Verifikasi**.
  Kartu **Sudah Absen Pulang** tetap dipertahankan sesuai koreksi user; grid 4
  kartu tidak berubah.
- **File:** `src/pages/admin/DashboardUtama.jsx`,
  `src/components/layout/SidebarAdmin.jsx`,
  `src/components/layout/PortalAdminLayout.jsx`, `src/App.jsx`,
  `src/services/adminDashboardService.js` (komentar), `README.md`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 271 modul, 13,63 dtk (base `/`);
  build `VITE_BASE_PATH=/PRESISI-AMI/` **lulus** — 13,99 dtk; URL favicon pada
  build base tetap `/PRESISI-AMI/...`.
- **Catatan/risiko:** perubahan belum di-commit; tampilan kartu di browser belum
  diuji manual. Tidak ada perubahan query statistik atau database.

### 2026-10-26 14:35 WITA — Favicon logo resmi & rapikan sidebar
- **Perubahan:** mengganti favicon tab browser dan apple-touch-icon dengan logo
  resmi RSUD AMI; menghapus label **Super Admin** dari header sidebar agar
  `PRESISI AMI` dan `RSUD Aji Muhammad Idris` tersusun lebih rapi.
- **File:** `index.html`, `public/favicon-32x32.png` (baru),
  `public/apple-touch-icon.png` (baru), `src/components/layout/SidebarAdmin.jsx`,
  `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 271 modul, 10,49 dtk (base `/`);
  build dengan `VITE_BASE_PATH=/PRESISI-AMI/` **lulus** — 11,74 dtk. Favicon
  terpasang pada `dist/favicon-32x32.png` dan
  `dist/apple-touch-icon.png`, dengan URL build `/PRESISI-AMI/favicon-32x32.png`.
- **Catatan/risiko:** perubahan belum di-commit; favicon 32×32 dan tampilan
  sidebar belum diverifikasi visual di browser. Browser dapat menyimpan favicon
  lama di cache; lakukan hard refresh saat menguji.

### 2026-10-26 14:21 WITA — Logo resmi RSUD AMI
- **Perubahan:** mengganti logo SVG sementara dengan berkas resmi
  `src/assets/logo-rsud-ami.png`. Logo dipakai di halaman login, header aplikasi
  pegawai, sidebar portal Super Admin, dan sidebar kepala ruangan.
- **File:** `src/components/LogoRSUD.jsx`, `src/components/layout/SidebarAdmin.jsx`,
  `src/components/layout/SidebarKepala.jsx`, `src/assets/logo-rsud-ami.png`
  (baru), `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 271 modul, 36,84 dtk
  (2026-10-26 14:21); aset logo terhasilkan sebagai
  `dist/assets/logo-rsud-ami-Bj5c6m9F.png`.
- **Catatan/risiko:** perubahan belum di-commit; tampilan visual di layar kecil
  belum diuji manual.

### 2026-10-26 13:45 WITA — Bilah progres navigasi
- **Perubahan:** menambahkan bilah progres tipis berwarna biru muda di bagian
  atas layar. Bilah aktif saat berpindah menu/rute, proses login, logout,
  pemuatan sesi awal, dan tombol muat ulang profil. Progres bergerak bertahap
  hingga 90%, lalu penuh dan memudar setelah rute selesai.
- **File:** `src/context/ProgressContext.jsx` (baru),
  `src/components/ui/BilahProgres.jsx` (baru),
  `src/components/PengamatRute.jsx` (baru), `src/main.jsx`, `src/App.jsx`,
  `src/pages/Login.jsx`, `src/components/ProtectedRoute.jsx`, `README.md`,
  `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 270 modul, 6,80 dtk
  (2026-10-26 13:45).
- **Tindak lanjut:** di-commit `900e916` dan di-push ke `origin/main`
  (2026-10-26 13:50).
- **Catatan/risiko:** animasi baru diuji lewat build, belum uji visual manual di
  browser.

### 2026-10-26 13:12 WITA — Selisih hitungan grup "Belum ditentukan"
- **Diagnosis:** UI menghitung pegawai ber-role `pegawai` saja (0), sedangkan RPC
  menghitung seluruh baris tabel `pegawai` (1). Satu baris itu adalah akun
  **Super Admin** yang memakai unit bawaan `Belum ditentukan`. Karena UI tidak
  menampilkan akun Super Admin di Data Pegawai, grup terlihat kosong.
- **Perubahan:** grup **Belum ditentukan** kini disembunyikan dari daftar bila
  tidak memiliki pegawai operasional; keterangan halaman diperjelas. Tidak ada
  perubahan RPC/migrasi baru — migrasi 18 tetap berlaku.
- **File:** `src/pages/admin/GrupShift.jsx`, `README.md`, `AGENTS.md`,
  `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 267 modul, 7,54 dtk
  (2026-10-26 13:18).
- **Tindak lanjut:** di-commit `6343111` dan di-push ke `origin/main`
  (2026-10-26 13:19).

### 2026-10-26 12:15 WITA — Hapus grup shift kosong (migrasi 18)
- **Perubahan:** membuka akses hapus untuk **semua grup shift tanpa pegawai**,
  termasuk grup **"Belum ditentukan"** yang sebelumnya dikunci di UI dan RPC.
  Grup yang masih berisi pegawai tetap ditolak. Konfirmasi hapus untuk grup
  bawaan mengingatkan bahwa grup akan dibuat ulang otomatis bila ada akun baru
  tanpa unit kerja.
- **File:** `supabase/migrations/18_hapus_grup_kosong.sql` (baru),
  `supabase/verifikasi_18.sql` (baru), `supabase/schema.sql`,
  `src/pages/admin/GrupShift.jsx`, `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 267 modul, 7,50 dtk
  (2026-10-26 12:15). Validasi SQL belum dijalankan di Supabase.
- **Catatan/risiko:** migrasi 18 sudah dijalankan di Supabase (pesan server baru
  muncul saat uji). **Koreksi 13:12:** "Belum ditentukan" ternyata dipakai akun
  Super Admin (1 akun); grup kini disembunyikan bila tanpa pegawai operasional,
  bukan dihapus.

### 2026-10-26 11:43 WITA — Jendela waktu absensi (migrasi 17)
- **Perubahan:** menambahkan batas waktu absensi sesuai klarifikasi user —
  **Absen Hadir** baru dapat diklik **20 menit sebelum jam masuk** (jadwal 08.00
  → 07.40), dan **Absen Pulang** baru dapat diisi **1 menit setelah jam pulang**
  (jadwal 16.30 → 16.31). Berlaku untuk pola Reguler dan Shift, termasuk shift
  malam lintas hari. Tombol terkunci sebelum jendela dibuka, menampilkan jam buka
  dan alasan; server memvalidasi ulang lewat RPC `submit_presensi`.
- **File:** `supabase/migrations/17_batas_waktu_absen.sql` (baru),
  `supabase/verifikasi_17.sql` (baru), `supabase/schema.sql`,
  `src/config/constants.js`, `src/utils/jadwalAbsen.js` (baru),
  `src/components/PanelAbsen.jsx`, `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 267 modul, 9,25 dtk
  (2026-10-26 11:42); verifikasi ulang pukul 11:52 juga **lulus** — 267 modul,
  6,76 dtk. Validasi SQL belum dijalankan di Supabase.
- **Catatan/risiko:** migrasi 17 belum dijalankan di database dan aturan belum
  diuji manual. Nilai 20 menit & 1 menit ditulis di server dan
  `src/config/constants.js`; ubah keduanya bila aturan berubah.
- **Tindak lanjut:** seluruh perubahan di-commit `c21ecf9` dan di-push ke
  `origin/main` (2026-10-26 12:01), memicu deploy GitHub Pages.

### 2026-10-26 11:04 WITA — Lanjutan migrasi 15–16: perbaikan & verifikasi build
- **Perubahan:** melanjutkan pekerjaan yang terhenti karena limit. Memeriksa seluruh
  diff working tree, memperbaiki teks rusak (mojibake) pada pesan loading
  `JadwalShift.jsx` dan komentar `schema.sql`, membuat pemeriksaan index pada
  `verifikasi_16.sql` cocok dengan format `pg_indexes` (predikat partial index
  dinormalisasi PostgreSQL), menyesuaikan dokumentasi (README bagian cleanup,
  AGENTS aturan Alfa + peta migrasi, progress.md), lalu menjalankan build produksi.
- **File:** `src/pages/admin/JadwalShift.jsx`, `supabase/schema.sql`,
  `supabase/verifikasi_16.sql`, `README.md`, `AGENTS.md`, `progress.md`.
- **Verifikasi:** `npm run build` **lulus** — 266 modul, 8,45 dtk (2026-10-26 11:04).
  Tidak ada lagi karakter `U+FFFD` di `src/`, `supabase/`, `scripts/`, README,
  AGENTS, progress.
- **Catatan/risiko:** migrasi 15–16 **belum dijalankan** di Supabase dan fitur
  belum diuji manual. Sesuai aturan, semua perubahan tetap di working tree.

### 2026-10-25 14:10–14:59 WITA — Migrasi 15–16: hapus finalisasi & satu perangkat `(rekonstruksi)`
- **Perubahan:** menghapus finalisasi jadwal bulanan (tabel, fungsi status, RPC,
  tombol UI, alur impor) dan mengizinkan kepala ruangan mengubah jadwal mulai
  hari ini; menerapkan aturan satu perangkat aktif (pending/approved) per pegawai
  dengan unique index, helper RLS, policy pengajuan, dan persetujuan yang menolak
  bila masih ada perangkat approved lain. Data perangkat uji dikosongkan.
- **File:** `supabase/migrations/15_hapus_finalisasi_jadwal.sql` (baru),
  `16_satu_perangkat.sql` (baru), `supabase/verifikasi_15.sql` (baru),
  `verifikasi_16.sql` (baru), `supabase/schema.sql`, `supabase/cleanup_data_uji.sql`,
  `src/services/shiftService.js`, `src/services/deviceService.js`,
  `src/pages/admin/JadwalShift.jsx`, `src/pages/admin/PengaturanPresensi.jsx`,
  `src/pages/admin/VerifikasiPerangkat.jsx`, `src/components/PanelAbsen.jsx`,
  `src/components/kartu/KartuStatusPerangkat.jsx`, `src/pages/Dashboard.jsx`,
  `README.md`, `AGENTS.md`.
- **Verifikasi:** belum diverifikasi pada sesi tersebut (terputus karena limit);
  skrip verifikasi DB sudah dibuat tetapi belum dijalankan.
- **Catatan/risiko:** migrasi 16 menghapus seluruh data `perangkat`; pegawai perlu
  verifikasi ulang. Waktu entri adalah perkiraan dari `LastWriteTime`.

### 2026-10-25 14:04 WITA — Uji perangkat & absensi lulus + aturan commit/push
- **Perubahan:** mencatat aturan baru bahwa **commit/push hanya setelah perintah
  user**; pekerjaan ditahan lokal untuk diuji lebih dahulu. Mencatat hasil uji
  verifikasi perangkat dan absensi.
- **File:** `AGENTS.md` (Aturan Wajib #1, Protokol Kerja, Log Instruksi `I-007`),
  `progress.md`.
- **Verifikasi:** laporan user — verifikasi perangkat, absensi, radius, akurasi,
  dan penolakan duplikasi berhasil; absensi juga dicoba di mobile.
- **Catatan/risiko:** pembaruan dokumen ini **sengaja belum di-commit/di-push**
  sesuai aturan baru. Perubahan menunggu perintah user.

### 2026-10-25 13:37 WITA — Login live berhasil (Super Admin + pegawai)
- **Perubahan:** tidak ada perubahan kode; verifikasi fungsional di URL produksi.
- **File:** `progress.md` (pembaruan status).
- **Verifikasi:** user berhasil login Super Admin di desktop dan login pegawai di
  mobile lewat `https://rantemario905-source.github.io/PRESISI-AMI/`.
- **Catatan/risiko:** lanjut ke uji verifikasi perangkat + absensi GPS. Pastikan
  perangkat pegawai disetujui dan jadwal hari tersebut tersedia sebelum uji absen.

### 2026-10-25 13:19 WITA — Deploy GitHub Pages aktif
- **Perubahan:** push commit `ba5e68d`; workflow **Deploy ke GitHub Pages**
  berjalan otomatis (build + deploy) dan berhasil.
- **File:** tidak ada perubahan kode; pembaruan `progress.md` dan `AGENTS.md`.
- **Verifikasi:** run `#1` (id `40164926480`) `completed/success` — job build dan
  deploy sukses. `GET /PRESISI-AMI/` → `200`, 730 B, aset `/PRESISI-AMI/…`;
  `GET /PRESISI-AMI/riwayat` → `404` dengan body `index.html` (734 B), jadi
  fallback SPA bekerja.
- **Catatan/risiko:** langkah berikutnya **Site URL Supabase** dan uji login.
  Secrets GitHub sudah terpasang; setiap push ke `main` akan redeploy otomatis.

### 2026-10-25 13:01 WITA — Konfigurasi deploy GitHub Pages
- **Perubahan:** mengganti target deploy dari Vercel ke GitHub Pages; menambah
  workflow Actions, dukungan base path `/PRESISI-AMI/`, `basename` pada router,
  fallback rute SPA (`404.html`), dan `.nojekyll`; memperbarui README.
- **File:** `.github/workflows/deploy.yml` (baru), `vite.config.js`,
  `src/App.jsx`, `public/.nojekyll`, `README.md`, `progress.md`, `AGENTS.md`.
- **Verifikasi:** `VITE_BASE_PATH=/PRESISI-AMI/ npm run build` **lulus**;
  `dist/index.html` memakai aset `/PRESISI-AMI/…`; `dist/.nojekyll` ada.
- **Catatan/risiko:** workflow membutuhkan secrets `VITE_SUPABASE_URL` +
  `VITE_SUPABASE_ANON_KEY` dan **Pages Source = GitHub Actions**. Belum di-push,
  jadi belum ada URL live.

### 2026-10-25 12:48 WITA — Push ke GitHub berhasil
- **Perubahan:** menambahkan remote `origin`, push branch `main`, dan verifikasi
  ref remote; menyinkronkan status dokumen audit.
- **File:** `.git/config` (remote `origin`), `progress.md`, `AGENTS.md`,
  `README.md` (status Fase 1–8 + `verifikasi_10.sql`).
- **Verifikasi:** `git ls-remote --heads origin` →
  `2c8a775… refs/heads/main`; `git status -sb` → `## main...origin/main`
  (working tree bersih).
- **Catatan/risiko:** repo GitHub sebelumnya kosong sehingga tidak ada konflik.
  Deploy Vercel belum dilakukan; migrasi DB tetap perlu dikonfirmasi. Pembaruan
  dokumen audit di-commit terpisah (`4739c4a`) lalu di-push.

### 2026-10-25 12:37 WITA — Commit & push untuk tahap deploy
- **Perubahan:** mereview seluruh perubahan yang belum di-commit (Fase 4–8, impor
  jadwal, UI navigasi, dokumen audit), lalu menyiapkan commit dan push ke GitHub.
- **File:** seluruh `src/**`, `supabase/**`, `scripts/**`, `README.md`,
  `AGENTS.md`, `progress.md`, `package.json`, `package-lock.json`, `.gitignore`.
- **Verifikasi:** `npm run build` lulus (266 modul, 6,46 dtk); `.env` dan `dist/`
  dipastikan diabaikan Git; tidak ditemukan secret ter-hardcode di `src/` maupun
  `scripts/` (hanya anon key publik di `.env.example`).
- **Catatan/risiko:** repo **belum memiliki remote `origin`** dan `gh` CLI tidak
  tersedia; push menunggu URL repository GitHub dari user.

### 2026-10-25 12:23 WITA — Audit trail: `progress.md` + `AGENTS.md`
- **Perubahan:** membuat dokumen audit progres dan aturan kerja agen; menambah
  tautan dari README. Tidak menyentuh kode aplikasi, DB, atau `.env`.
- **File:** `progress.md` (baru), `AGENTS.md` (baru), `README.md` (1 baris tautan).
- **Verifikasi:** pembacaan ulang file; pada sesi ini hanya `README.md` yang
  berubah (selain perubahan lama yang belum di-commit) ditambah dua file baru;
  `npm run build` **lulus** (266 modul, 6,46 dtk, 2026-10-25 12:24).
- **Catatan:** titik mulai pencatatan resmi. Riwayat sebelumnya direkonstruksi.

### 2026-10-25 10:23–11:49 WITA — Penyempurnaan UI navigasi `(rekonstruksi)`
- **Perubahan:** tab bar dan navigasi bawah untuk mobile, pembaruan bar atas,
  menu khusus kepala ruangan, layout portal kepala, penyesuaian halaman dashboard,
  jadwal shift, dan pengajuan izin; penyesuaian gaya di `index.css`.
- **File:** `src/components/ui/TabBar.jsx` (baru), `src/components/NavigasiBawah.jsx`
  (baru), `src/components/MenuKepala.jsx` (baru), `src/components/BarAtas.jsx`,
  `src/components/layout/PortalKepalaLayout.jsx` (baru),
  `src/components/layout/SidebarKepala.jsx`, `src/pages/Dashboard.jsx`,
  `src/pages/admin/JadwalShift.jsx`, `src/pages/admin/PengajuanIzin.jsx`,
  `src/index.css`; `supabase/cleanup_data_uji.sql` (10:23).
- **Verifikasi:** tidak tercatat.
- **Catatan:** urutan pasti perubahan antar-file tidak diketahui; dikelompokkan
  berdasarkan rentang mtime.

### 2026-10-23 19:22–23:43 WITA — Fase 7 + Fase 8 + finalisasi `(rekonstruksi)`
- **Perubahan:** kepala ruangan dapat mengelola jadwal unitnya (mulai besok),
  audit jadwal, finalisasi bulanan, penghapusan mode transisi; impor jadwal
  CSV/XLSX yang atomik; penyesuaian master shift, kartu shift, pengaturan presensi,
  dan `schema.sql`/`06_seed.sql`.
- **File:** `supabase/migrations/13_kepala_jadwal_final.sql`,
  `14_impor_jadwal_shift.sql`, `supabase/verifikasi_13.sql`, `verifikasi_14.sql`,
  `supabase/schema.sql`, `supabase/migrations/06_seed.sql`,
  `src/App.jsx`, `src/components/layout/PortalAdminLayout.jsx`,
  `SidebarAdmin.jsx`, `SidebarKepala.jsx`, `src/components/kartu/KartuShift.jsx`,
  `src/components/PanelAbsen.jsx`, `src/pages/admin/JadwalShift.jsx`,
  `MasterShift.jsx`, `PengaturanPresensi.jsx`, `src/services/shiftService.js`,
  `pengaturanService.js`, `attendanceService.js`, `src/utils/templateJadwal.js`.
- **Verifikasi:** `verifikasi_13.sql` (19:52) dan `verifikasi_14.sql` (21:36)
  dibuat; hasil eksekusi di Supabase tidak diketahui.
- **Catatan:** `schema.sql` disusun ulang pada 23:40 sebagai gabungan migrasi
  sampai 14.

### 2026-10-23 08:52–15:10 WITA — Fase 6: pola kerja, jadwal, hari libur, Alfa `(rekonstruksi)`
- **Perubahan:** grup shift + seksi, pola kerja Reguler/Shift, jam reguler,
  hari libur, deteksi keterlambatan, Alfa otomatis idempoten, koreksi presensi,
  riwayat dan rekapitulasi, ekspor CSV, serta pembaruan layanan data terkait.
- **File:** `supabase/migrations/12_pola_kerja_jadwal_alfa.sql`,
  `supabase/verifikasi_09.sql` (10:08), `verifikasi_12.sql` (10:24),
  `supabase/jadwal_alfa.sql` (11:25), `src/services/groupShiftService.js`,
  `hariLiburService.js`, `pegawaiService.js`, `authService.js`, `reportService.js`,
  `correctionService.js`, `riwayatService.js`, `src/pages/admin/GrupShift.jsx`,
  `HariLibur.jsx`, `KoreksiPresensi.jsx`, `Rekapitulasi.jsx`, `DataPegawai.jsx`,
  `src/pages/RiwayatSaya.jsx`, `src/components/kartu/KartuRiwayat.jsx`,
  `src/utils/format.js`, `src/pages/IzinSaya.jsx`.
- **Verifikasi:** `verifikasi_09.sql` dan `verifikasi_12.sql` dibuat; hasil tidak
  diketahui.
- **Catatan:** `verifikasi_09.sql` baru dibuat satu hari setelah migrasi 09,
  menandakan verifikasi Fase 4 tuntas pada tanggal ini.

### 2026-10-22 23:29–23:50 WITA — Fase 5: pengaturan kepala ruangan `(rekonstruksi)`
- **Perubahan:** RPC pengaturan nama, unit kerja, dan status kepala ruangan;
  perpindahan otomatis status kepala bila unit sudah punya kepala; RPC perubahan
  role (opsional, tidak dipakai UI); penyesuaian proteksi rute dan konteks auth.
- **File:** `supabase/migrations/10_kelola_role.sql`, `11_kepala_ruangan.sql`,
  `supabase/verifikasi_10.sql`, `verifikasi_11.sql`,
  `src/context/AuthContext.jsx`, `src/components/ProtectedRoute.jsx`,
  `src/components/kartu/KartuProfil.jsx`.
- **Verifikasi:** kedua skrip verifikasi dibuat; hasil tidak diketahui.

### 2026-10-22 21:51–23:23 WITA — Fase 4: Dinas & Sakit/Cuti `(rekonstruksi)`
- **Perubahan:** jenis izin menjadi Sakit/Cuti/Dinas Luar; Dinas Luar untuk 1–4
  pegawai per grup; dokumen wajib JPG/PNG maks. 1 MB; bucket privat
  `dokumen-izin`; pegawai tidak dapat mengajukan sendiri; status `dibatalkan`.
- **File:** `supabase/migrations/09_dinas_sakit_cuti.sql`,
  `src/utils/izin.js`, `src/utils/dokumenIzin.js`, `src/utils/status.js`,
  `src/services/leaveService.js`, `izinPegawaiService.js`,
  `src/components/kartu/KartuProfil.jsx`, `src/context/AuthContext.jsx`,
  `src/components/ProtectedRoute.jsx`.
- **Verifikasi:** `verifikasi_09.sql` menyusul pada 2026-10-23 10:08.
- **Catatan:** migrasi ini salah satu yang terbesar (≈30 KB) karena memuat ulang
  alur izin, policy storage, dan RPC persetujuan.

### 2026-10-21 22:00 WITA — Commit `6a4fb89` "PRESISI AMI: Fase 1-3 siap deploy" `(rekonstruksi)`
- **Perubahan:** menandai selesainya Fase 1–3 di Git (fondasi, Portal Super Admin,
  Data Pegawai) dan kesiapan deploy GitHub + Vercel.
- **File:** seluruh tree saat itu; `dist/` dan `.env` diabaikan.
- **Verifikasi:** tidak tercatat.
- **Catatan:** **satu-satunya commit** di repo sampai audit ini. Seluruh pekerjaan
  Fase 4–8 dan UI setelahnya masih belum di-commit.

### 2026-10-21 11:40–15:43 WITA — Fase 1–2: fondasi, DB, dan Portal Super Admin `(rekonstruksi)`
- **Perubahan:** skema 7 tabel, fungsi/trigger, index, RLS, RPC `submit_presensi`,
  seed master shift, RPC admin; geofencing Haversine 100 m, anti mock location,
  device token; login, dashboard pegawai, dashboard admin, verifikasi perangkat.
- **File:** `supabase/migrations/01_tabel.sql`–`07_admin_rpc.sql`,
  `src/config/constants.js`, `src/utils/supabaseClient.js`, `deviceHelper.js`,
  `geofencing.js`, `csv.js`, `src/services/deviceService.js`,
  `adminDashboardService.js`, `adminDeviceService.js`, `src/pages/Login.jsx`,
  `src/pages/admin/DashboardUtama.jsx`, `VerifikasiPerangkat.jsx`,
  `src/components/ui/*`, `src/components/admin/*`.
- **Verifikasi:** tidak tercatat.
- **Catatan:** `08_pegawai.sql` (Fase 3) selesai 21:22 dan ikut dalam commit 22:00.

### Sebelum 2026-10-21 — Inisialisasi proyek `(rekonstruksi)`
- **Perubahan:** pembuatan proyek Vite + React + Tailwind, konfigurasi Supabase,
  README, `vercel.json`, `index.html`, `public/favicon.svg`.
- **Verifikasi:** tidak tercatat.

---

## 4. Backlog & Hal yang Belum Terverifikasi

| # | Item | Dampak | Tindakan |
|---|---|---|---|
| B-1 | ~~Belum ada commit untuk Fase 4–8 + UI~~ | — | **Selesai:** commit `2c8a775` + push 2026-10-25 12:48 |
| B-2 | ~~Status migrasi 09–18 di Supabase belum diketahui~~ | - | **Selesai:** migrasi 01–27 sudah dijalankan (laporan user 2026-10-30) |
| B-3 | ~~Hasil `supabase/verifikasi_09..18.sql` belum diketahui~~ | - | **Selesai:** verifikasi 09–27 lulus (laporan user 2026-10-30) |
| B-12 | ~~Migrasi 15–18 belum dijalankan~~ | - | **Selesai:** dijalankan; verifikasi 15–18 lulus (laporan user 2026-10-30) |
| B-13 | ~~Uji lokal fitur baru belum dilakukan~~ | - | **Selesai:** uji manual dinyatakan aman (laporan user 2026-10-30) |
| B-14 | ~~Perubahan migrasi 15–17 belum di-commit~~ | - | **Selesai:** commit `c21ecf9` + push 2026-10-26 12:01 |
| B-15 | ~~Aturan jendela waktu (migrasi 17) belum dijalankan/diuji~~ | - | **Selesai:** digantikan migrasi 26; verifikasi 26 lulus (laporan user 2026-10-30) |
| B-16 | ~~Migrasi 18 dan UI grup sistem belum diuji/di-commit~~ | - | **Selesai:** commit `6343111`; `verifikasi_18.sql` lulus (laporan user 2026-10-30) |
| B-17 | ~~Kerapatan sidebar dan latar portal baru diuji lewat build~~ | - | **Selesai:** uji tampilan dinyatakan aman (laporan user 2026-10-30) |
| B-18 | ~~Posisi aksi dekat judul dan penghapusan subtitle baru diuji lewat build~~ | - | **Digantikan I-026:** aksi tidak lagi menempel judul |
| B-19 | ~~Penempatan aksi per halaman baru diuji lewat build~~ | - | **Selesai:** uji tampilan per halaman dinyatakan aman (laporan user 2026-10-30) |
| B-20 | ~~Migrasi 25 (batas akhir absen pulang) belum dijalankan~~ | - | **Selesai:** dijalankan user 2026-10-29; aturannya digantikan migrasi 26 |
| B-21 | ~~Alur lupa absen pulang belum diuji manual~~ | - | **Selesai:** uji manual aman (laporan user 2026-10-30) |
| B-22 | ~~Migrasi 26 sudah dijalankan; verifikasi dan uji manual belum~~ | - | **Selesai:** `verifikasi_26.sql` lulus dan uji jendela absen aman (laporan user 2026-10-30) |
| B-23 | ~~Migrasi 27 sudah dijalankan; verifikasi dan uji manual belum~~ | - | **Selesai:** `verifikasi_27.sql` lulus dan tampilan jam Admisi diuji (laporan user 2026-10-30) |
| B-24 | ~~Go-live belum dieksekusi~~ | - | **Selesai:** go-live dimulai Minggu, 1 November 2026 dan pegawai sudah absen masuk/pulang (laporan user 2026-11-01 17:58); sisa pantauan Alfa otomatis pertama |
| B-26 | ~~Verifikasi pembentukan Alfa otomatis pertama setelah go-live~~ | - | **Selesai:** Alfa otomatis sudah berjalan (laporan user 2026-11-04 17:35) |
| B-25 | ~~Uji manual jadwal 1.064 baris setelah paginasi~~ | - | **Selesai:** user memastikan seluruh tanggal termasuk 1–2 November muncul (2026-10-31 12:53) |
| B-27 | ~~Migrasi 28 dan verifikasi 28 belum dijalankan~~ | - | **Selesai:** migrasi 28 dijalankan dan `verifikasi_28.sql` lulus (laporan user 2026-11-02); flag **Bebas Radius** aktif di server |
| B-28 | ~~Uji manual pegawai bebas radius dan pegawai biasa setelah migrasi 28~~ | - | **Selesai:** pegawai Bebas Radius sudah dapat absen di luar area (laporan user 2026-11-05) |
| B-29 | ~~Kasus GPS meleset 130 m di gedung utama (pesan klien)~~ | - | **Ditutup:** dianggap kesalahan perangkat pengguna, tidak diungkit lagi (keputusan user 2026-11-05) |
| B-30 | ~~Uji manual koreksi presensi shift malam H+1~~ | - | **Selesai:** dinyatakan aman (laporan user 2026-11-05) |
| B-31 | ~~Uji manual fallback white screen setelah deploy~~ | - | **Selesai:** fallback white screen setelah deploy sudah aman (laporan user 2026-11-05) |
| B-32 | ~~Migrasi 29 dan verifikasi 29 belum dijalankan~~ | - | **Selesai:** dijalankan user 2026-11-04; aturan baru aktif di server |
| B-33 | ~~Migrasi 30 (backfill menit terlambat) belum dijalankan~~ | - | **Selesai:** dijalankan user 2026-11-04; `menit_terlambat` data sejak 1 November 2026 sudah dihitung ulang |
| B-34 | ~~Migrasi 31 (ACC otomatis Super Admin) dan verifikasi 31 belum dijalankan~~ | - | **Selesai:** migrasi 31 dan `verifikasi_31.sql` dijalankan dan lulus (laporan user 2026-11-04); ACC otomatis Super Admin aktif |
| B-35 | ~~Uji manual komponen UI baru (muat ulang, filter nama, pemilih periode, warna jenis)~~ | - | **Selesai:** diuji user 2026-11-04 17:35 |
| B-36 | ~~Migrasi 32 (tukar shift) dan verifikasi 32 belum dijalankan~~ | - | **Selesai:** migrasi 32 dan `verifikasi_32.sql` dijalankan dan lulus (laporan user 2026-11-04); server menyimpan riwayat tukar shift |
| B-38 | ~~Migrasi 33 (pengaduan presensi) dan `verifikasi_33.sql` belum dijalankan~~ | - | **Selesai:** dijalankan user 2026-11-04 17:35 |
| B-39 | ~~Uji manual pengaduan absen pulang~~ | - | **Selesai:** diuji user 2026-11-04 17:35 |
| B-40 | ~~Migrasi 34 (Super Admin memutuskan pengaduan) belum dijalankan~~ | - | **Selesai:** migrasi 34 + `verifikasi_34.sql` dijalankan dan lulus (laporan user 2026-11-05) |
| B-41 | ~~Uji manual tombol Absen Masuk nonaktif setelah jam selesai jadwal~~ | - | **Selesai:** tombol Absen Masuk nonaktif sudah berjalan (laporan user 2026-11-05) |
| B-42 | ~~Laporan bulanan masih menampilkan kolom Shift dan blok Riwayat Tukar Shift~~ | - | **Selesai:** keduanya dihapus 2026-11-06; kolom Shift kemudian dikembalikan khusus pegawai Shift, data tukar tetap tersimpan untuk audit |
| B-43 | ~~Kolom Keterangan laporan bulanan dan kebutuhan kolom Shift khusus pegawai shift~~ | - | **Selesai:** Keterangan dihapus untuk semua pola kerja; kolom Shift (nama shift hari itu) ditambahkan khusus pegawai Shift pada 2026-11-06 |
| B-44 | ~~Migrasi 38 (jenis Izin) dan `verifikasi_38.sql` belum dijalankan di Supabase~~ | - | **Selesai:** migrasi 38 dijalankan 2026-11-11 15:21 dan `verifikasi_38.sql` lulus (laporan user 2026-11-11 15:30) |
| B-46 | ~~Migrasi 39 (status Hadir setelah koreksi) belum dijalankan di Supabase~~ | - | **Selesai:** migrasi 39 + `verifikasi_39.sql` dijalankan user 2026-11-11 17:40 dan berhasil; sisa uji manual satu pengaduan disetujui |
| B-45 | ~~Uji manual jenis Izin dan warna status laporan belum dilakukan~~ | - | **Selesai:** uji manual berhasil (laporan user 2026-11-11 16:20) — alur Izin, penolakan absensi/Alfa/pengaduan, warna status laporan |
| B-47 | ~~Migrasi 40 (`jadwal_kerja` mengenali `kepala_unit`) belum dijalankan di Supabase~~ | `supabase/migrations/40_jadwal_kerja_hak_akses.sql` | **Selesai:** migrasi 40 + `verifikasi_40.sql` dijalankan user 2026-11-11 21:20; sisa uji Setujui satu pengaduan dari akun kepala unit yang sebelumnya gagal |
| B-48 | ~~Migrasi 41 (FK audit jadwal/tukar shift → `auth.users`) belum dijalankan di Supabase~~ | `supabase/migrations/41_audit_jadwal_shift_auth_users.sql` | **Selesai:** migrasi 41 + `verifikasi_41.sql` dijalankan user 2026-11-12 09:06. Sisa: uji Tukar Shift dari akun kepala unit ASN saat ada kasus nyata |
| B-49 | Uji manual tampilan pengaduan, periode satu baris, dan pemisah kolom tabel admin | `src/components/pengaduan/DaftarPengaduan.jsx`, `src/components/ui/TampilanPeriode.jsx` | **Belum:** menunggu uji lokal user (desktop & HP) |
| B-50 | ~~Migrasi 42 (pengaduan absen pulang setelah jendela tutup) belum dijalankan di Supabase~~ | `supabase/migrations/42_pengaduan_pulang_setelah_jendela.sql` | **Selesai:** migrasi 42 dijalankan & `verifikasi_42.sql` semua `true` (laporan user 2026-11-12 11:08). Sintaks + logika sebelumnya diuji di Postgres asli (PGlite): 19/19 verifikasi `true`, 16/16 uji perilaku lulus |
| B-51 | Uji manual kandidat absen pulang: belum muncul sebelum jam tutup, muncul setelahnya (reguler & shift malam) | `src/pages/Pengaduan.jsx` | **Belum:** server sudah aktif; menunggu uji manual user |
| B-52 | ~~Migrasi 43 (radius absensi 80 m) belum dijalankan di Supabase~~ | `supabase/migrations/43_radius_80_meter.sql` | **Selesai:** migrasi 43 dijalankan user 2026-11-13; digantikan migrasi 44 |
| B-53 | ~~Migrasi 44 (radius absensi 120 m) belum dijalankan di Supabase~~ | `supabase/migrations/44_radius_120_meter.sql` | **Selesai:** migrasi 44 dijalankan & `verifikasi_44.sql` lulus (laporan user 2026-11-14) |
| B-37 | ~~Uji manual tukar shift, laporan, & cetak jadwal F4 landscape~~ | - | **Selesai:** tukar shift, laporan, dan cetak F4 sudah aman (laporan user 2026-11-05) |
| B-4 | ~~`npm run build` belum dijalankan~~ | — | **Selesai:** lulus 2026-10-25 12:24 |
| B-5 | ~~README menyebut Fase 1–7 saja~~ | — | **Selesai:** diperbarui ke Fase 1–8 + impor |
| B-6 | ~~`verifikasi_10.sql` tidak ada di diagram README~~ | — | **Selesai:** ditambahkan ke struktur |
| B-7 | ~~Alfa otomatis belum tentu nonaktif di DB~~ | - | **Selesai:** diaktifkan user 2026-10-30; pantau pembentukan Alfa |
| B-8 | ~~Tidak ada lint/unit test~~ | - | **Selesai:** ESLint + 24 uji `node:test`; lint/test/build lulus; commit `42cb317` + push 2026-10-31 |
| B-9 | ~~`.env.example` perlu dicek~~ | - | **Selesai:** nilai asli diganti placeholder; commit `42cb317` + push 2026-10-31; anon key lama masih ada di riwayat Git |
| B-10 | ~~Deploy GitHub Pages belum aktif~~ | — | **Selesai:** live 2026-10-25 13:19 |
| B-11 | ~~Base path `/PRESISI-AMI/` terikat nama repo~~ | - | **Selesai:** pindah ke custom domain `presisiami.my.id`, `VITE_BASE_PATH` diset `/` (2026-10-27 10:31) |

---

## 5. Log Keputusan (ADR ringan)

| ID | Keputusan | Alasan | Konsekuensi |
|---|---|---|---|
| D-001 | Migrasi dijalankan bertahap `01→14`, bukan hanya `schema.sql` | Memudahkan pelacakan error per fase | Wajib disiplin urutan; jangan ulang file lama |
| D-002 | Koordinat pusat ditulis di `src/config/constants.js` **dan** `supabase/schema.sql` | Validasi klien + server | Setiap perubahan titik pusat harus di dua tempat |
| D-003 | Penulisan presensi hanya lewat RPC `SECURITY DEFINER` | Validasi ulang di server, tidak percaya klien | Semua aturan harus ada di SQL, bukan hanya UI |
| D-004 | Device binding 1 pegawai = 1 perangkat aktif | Mengurangi titip absen | Perangkat baru harus disetujui; reset mencabut yang lama |
| D-005 | Jadwal shift wajib; mode transisi dihapus permanen | Mencegah absen tanpa jadwal | Sel kosong berarti belum dijadwalkan |
| D-006 | ~~Finalisasi jadwal per unit/bulan~~ **dicabut oleh D-011** | Mengunci jadwal operasional | Digantikan aturan tanpa finalisasi |
| D-007 | Impor jadwal bersifat atomik dan divalidasi ulang di server | Mencegah data setengah jadi | Satu baris salah membatalkan seluruh impor |
| D-008 | Bucket `dokumen-izin` privat, JPG/PNG maks. 1 MB | Melindungi dokumen medis/kepegawaian | Jangan diubah menjadi publik |
| D-009 | Promosi/penurunan role Super Admin hanya lewat SQL Admin IT | Memisahkan kewenangan tertinggi dari UI | Tidak tersedia di Portal Super Admin |
| D-010 | Semua pekerjaan dicatat di `progress.md`; semua instruksi user dicatat di `AGENTS.md` | Auditability dan kelanjutan sesi | Wajib diperbarui setiap selesai tugas |
| D-011 | Finalisasi jadwal dihapus (migrasi 15) | Alur terlalu kaku; kepala ruangan perlu koreksi cepat | Sel kosong = belum dijadwalkan; kepala ruangan boleh mengubah mulai hari ini |
| D-012 | Satu perangkat aktif per pegawai termasuk `pending` (migrasi 16) | Mencegah pengajuan ganda dan titip absen | Perangkat kedua ditolak sampai Admin IT reset perangkat lama |
| D-013 | ~~Absen pulang ditutup akhir hari kerja; shift malam 12.00 WITA tanggal selesai (migrasi 25)~~ **digantikan D-014** | Memberi batas jelas dan mencegah durasi shift fiktif | Digantikan jendela 2 jam setelah jam pulang |
| D-014 | Jendela absen seragam: masuk 1 jam sebelum, pulang ditutup 2 jam setelah jam pulang (migrasi 26) | Aturan sosialisasi lebih sederhana dan adil untuk semua pola kerja | Setelah batas, presensi terbuka harus dikoreksi Super Admin; panel memakai baris hari ini agar absen masuk tetap bisa |
| D-015 | Jam reguler dapat di-override per unit (migrasi 27), fallback global | Unit seperti ADMISI RAWAT JALAN punya jam tetap berbeda tanpa harus memakai shift | Hanya berlaku untuk pegawai reguler; unit tanpa override tidak berubah; Super Admin mengatur lewat menu Jam Kerja Unit |

---

## 6. Cara Menambah Entri Baru

1. Tambahkan entri di **bagian atas** Log Kronologis (urutan terbaru di atas).
2. Format judul: `### YYYY-MM-DD HH:mm WITA — <ringkasan>`.
3. Isi minimal: **Perubahan**, **File**, **Verifikasi**, **Catatan/risiko**.
4. Perbarui **Status Terkini** dan **Terakhir diperbarui** di header.
5. Pindahkan item backlog yang selesai ke entri log; tandai `selesai` di tabel.
6. Jangan hapus entri lama. Bila ada koreksi, tambahkan catatan koreksi.
