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
| Terakhir diperbarui | 2026-10-30 23:23 WITA (Alfa otomatis diaktifkan; cron aktif) |
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
23:23). Yang tersisa: verifikasi pembentukan Alfa pertama dan eksekusi go-live. **Step 2 keamanan** (pengaman formula CSV dan
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

| Aspek | Status | Bukti |
|---|---|---|
| Kode aplikasi | Selesai sampai Fase 10 + UI navigasi + migrasi 15–27 | `src/`, `supabase/migrations/01–27` |
| Commit Git | **Fitur terakhir** — `1fec429` (pengaman CSV, Vite 7/React Router 7, CSP produksi); dokumen `260f3c2`; sebelumnya `6a7430e` | `git log` |
| Perubahan lokal | **Hanya dokumen audit** (`AGENTS.md`, `progress.md`) belum di-commit; kode bersih | `git status` |
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
| Data uji | **Sudah dibersihkan ulang setelah uji** — transaksi dihapus, 92 pegawai/grup/master shift dipertahankan | `supabase/cleanup_data_uji.sql`, laporan user 2026-10-30 23:01 |
| Data operasional | **Lengkap** — jadwal dinas dan pemetaan pegawai sudah diisi | laporan user 2026-10-30 23:04 |
| Koordinat RSUD AMI | **Ada di kode** — `-0.23805651650343132, 117.41442516465149` di klien dan schema | `src/config/constants.js`, `supabase/schema.sql`, migrasi 21 |
| Radius absensi | **Aktif 50 meter** — klien (`MAX_RADIUS_METERS`) dan server (migrasi 24 sudah dijalankan) | `src/config/constants.js`, `supabase/migrations/24_radius_50_meter.sql` |
| Skrip `supabase/verifikasi_*.sql` | **Verifikasi 09–27 lulus** — dijalankan user, semua hasil `true` (laporan 2026-10-30) | laporan user 2026-10-30 |
| Build produksi | **Lulus** — base `/` 7,38 dtk (ulang 6,94 dtk, 2026-10-30 Step 4; 287 modul; `dist/index.html` 1,29 kB); pratinjau SPA root dan deep link `/admin/dashboard` 200 | `npm run build`, `npm run preview` |
| Dependensi frontend | **Diperbarui & di-commit** — Vite 7.3.7, `@vitejs/plugin-react` 5.2.0, React Router 7.18.5; Node CI 22; lockfile sinkron; `npm audit` 0 kerentanan | `package.json`, `package-lock.json`, `.github/workflows/deploy.yml` |
| Header keamanan (CSP) | **Ada di kode & di-commit** — CSP produksi via `<meta>`: `script-src 'self'`, `connect-src` self + `*.supabase.co`, `frame-src 'none'`, `form-action 'self'`, `object-src 'none'`, `base-uri 'self'`; meta referrer; hanya saat build. Uji headless: script inline diblokir, halaman render | `vite.config.js`, `index.html` |
| Batas GitHub Pages | **Enforce HTTPS aktif & terverifikasi** (2026-10-30 10:06 WITA): HTTP apex dan `www` **301** ke HTTPS/apex. Namun HSTS, `X-Frame-Options`/`frame-ancestors`, `X-Content-Type-Options`, dan `Permissions-Policy` tetap belum aktif karena memerlukan header HTTP; Cloudflare/proxy opsional | `curl -I` HTTP/HTTPS apex & `www`, 2026-10-30 |
| Kepala unit multi-unit | **Ada di kode** — tabel `kepala_unit` (satu unit satu kepala, boleh multi-unit), halaman **Kepala Unit**, pemilih unit aktif di portal kepala, kepala ASN tanpa baris `pegawai`, RPC `profil_saya()`/`simpan_kepala_unit()`, policy `unit_dikelola()` | migrasi 22, `KepalaUnit.jsx`, `kepalaUnitService.js`, `AuthContext.jsx`, `authService.js`, `PortalKepalaLayout.jsx` |
| Jendela waktu absen | **Ada di kode** — masuk dibuka 1 jam sebelum; pulang 1 menit setelah hingga 2 jam setelah jam pulang (semua pola, termasuk shift malam) | migrasi 26, `PanelAbsen.jsx`, `jadwalAbsen.js` |
| Jam kerja per unit | **Ada di kode** — override jam reguler per unit dengan fallback global; ADMISI RAWAT JALAN 07.00–15.00 Senin–Jumat; menu Super Admin; tampilan jam di akun pegawai sudah diuji dan berubah | migrasi 27, `JamKerjaUnit.jsx`, `jamKerjaService.js`, `jadwal_kerja`, `proses_alfa_otomatis` |
| Keamanan ekspor CSV | **Ada di kode & di-commit** — sel string berawalan `=`, `+`, `-`, `@`, tab, CR, atau LF diberi apostrof sebelum escaping; template jadwal memakai aturan yang sama | `src/utils/csv.js`, `src/utils/templateJadwal.js` |
| Buka dokumen izin | **Ada di kode & di-commit** — tab dokumen memutus `window.opener` dan memakai `location.replace` agar tidak membuka halaman Supabase dengan konteks pembuka | `src/pages/IzinSaya.jsx`, `src/pages/admin/PengajuanIzin.jsx` |
| Hapus grup kosong | **Ada di kode** — semua grup 0 pegawai; "Belum ditentukan" (akun sistem) disembunyikan bila kosong | migrasi 18, `GrupShift.jsx` |
| Bilah progres | **Ada di kode** — bilah biru muda di atas layar saat navigasi, login, logout, dan muat ulang profil | `ProgressContext.jsx`, `BilahProgres.jsx`, `PengamatRute.jsx` |
| Logo aplikasi | **Ada di kode** — logo resmi RSUD AMI dipakai di login, header pegawai, sidebar admin/kepala ruangan, favicon, dan apple-touch-icon | `src/assets/logo-rsud-ami.png`, `LogoRSUD.jsx`, `favicon-32x32.png`, `apple-touch-icon.png` |
| Dashboard admin | **Ada di kode** — “Dashboard”, “Total Pegawai” (Non ASN), “Hadir Hari Ini” dan “Sudah Absen Pulang” dengan tanggal aktual, “Perlu Verifikasi” | `DashboardUtama.jsx`, `SidebarAdmin.jsx`, `PortalAdminLayout.jsx` |
| Menu akun | **Ada di kode** — avatar kanan atas membuka menu **Keluar** dengan animasi buka/tutup di portal pegawai, Super Admin, dan kepala ruangan; tampil di desktop dan HP | `MenuAkun.jsx`, `BarAtas.jsx`, `PortalAdminLayout.jsx`, `PortalKepalaLayout.jsx`, `tailwind.config.js` |
| Animasi sidebar | **Ada di kode** — submenu grup Super Admin dibuka/tutup dengan animasi gulir; grup aktif terbuka otomatis; submenu tertutup tidak dapat difokuskan | `SidebarAdmin.jsx` |
| Kerapatan sidebar | **Ada di kode** — jarak menu Super Admin dan Kepala Ruangan dirapatkan (rapat sedang, target sentuh 38–40 px) | `SidebarAdmin.jsx`, `SidebarKepala.jsx` |
| Latar Dashboard | **Ada di kode** — gradasi biru muda transparan pada seluruh halaman portal Super Admin dan Kepala Ruangan | `PortalAdminLayout.jsx`, `PortalKepalaLayout.jsx` |
| Aksi halaman | **Ada di kode** — tombol aksi kembali di kanan; aksi spesifik dipindah ke header kartu daftar, kartu Tambah Hari Libur (Tahun), baris tab Koreksi/Verifikasi, dan atas kotak filter Rekapitulasi | `KepalaHalaman.jsx`, `TabBar.jsx`, `DataPegawai.jsx`, `GrupShift.jsx`, `MasterShift.jsx`, `HariLibur.jsx`, `KoreksiPresensi.jsx`, `VerifikasiPerangkat.jsx`, `PengajuanIzin.jsx`, `Rekapitulasi.jsx` |
| Subtitle topbar | **Ada di kode** — portal Super Admin tanpa subtitle; portal Kepala Ruangan hanya nama unit kerja | `PortalAdminLayout.jsx`, `PortalKepalaLayout.jsx` |
| Laporan bulanan per pegawai | **Ada di kode** — Super Admin pilih unit, kepala unit memakai unit aktif (bisa berganti jika multi-unit); satu pegawai atau semua pegawai unit; kop dua logo satu baris (tinggi 20 mm), identitas grid 2x2 dengan nilai setelah titik dua, tabel harian, ringkasan tanpa `Izin`, Keterangan Sakit/Cuti/Dinas Luar/Alfa, penanda tangan tetap Kasubbag Tata Usaha (Suriami, SKM., M.Kes; NIP. 197312302007012011), footer bertanggal tanpa jam; cetak PDF A4 portrait | migrasi 19 & 22, `LaporanBulanan.jsx`, `reportService.js`, `utils/laporan.js`, `components/laporan/*`, `index.css` |
| Penanda tangan laporan | **Ada di kode** — Kasubbag Tata Usaha, Suriami, SKM., M.Kes, NIP. 197312302007012011 untuk semua pegawai | `src/config/constants.js`, `BlokTandaTangan.jsx` |
| Menu kepala ASN | **Ada di kode** — “Kembali ke Absensi” (sidebar) dan tab Absensi (navigasi bawah HP) disembunyikan bila `sumber_akun = kepala_asn` | `PortalKepalaLayout.jsx`, `SidebarKepala.jsx` |
| Dinas Luar lintas unit | **Ada di kode** — kepala unit dapat memilih pegawai lintas unit untuk Dinas Luar; Sakit/Cuti tetap per unit; pembuat grup membaca grup + dokumennya selama menjabat; akses dicabut otomatis saat jabatan berakhir; kepala ASN dapat mencatat (FK ke `auth.users`) | migrasi 23, `PengajuanIzin.jsx`, `leaveService.js`, `pegawaiService.js`, `verifikasi_23.sql` |
| Lint/unit test | Tidak tersedia di `package.json` | `package.json` |
| Alfa otomatis | **Aktif mulai 1 November 2026** — diaktifkan lewat Pengaturan Presensi; **pg_cron 1.6.4 aktif** dan job `presisi-alfa-otomatis` terdaftar/aktif tiap 15 menit; menunggu pembentukan Alfa pertama | migrasi 12/27, `PengaturanPresensi.jsx`, `supabase/jadwal_alfa.sql`, laporan user 2026-10-30 |
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

**Langkah berikutnya yang disarankan (go-live):**
1. Tidak ada tindakan cron lagi sebelum 1 November; biarkan job berjalan.
2. Setelah 1 November: verifikasi pembentukan Alfa pertama. Karena 1 November
   adalah hari kerja, pegawai reguler dapat tercatat Alfa pada 1 November setelah
   jam kerja berakhir; shift malam menyusul setelah shiftnya selesai:
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
| B-24 | Go-live belum dieksekusi | Aplikasi belum dipakai produksi | Data uji sudah dibersihkan, data operasional lengkap, Alfa otomatis aktif mulai 1 November, dan `pg_cron` terkonfirmasi aktif (2026-10-30); tinggal verifikasi Alfa pertama dan eksekusi go-live |
| B-4 | ~~`npm run build` belum dijalankan~~ | — | **Selesai:** lulus 2026-10-25 12:24 |
| B-5 | ~~README menyebut Fase 1–7 saja~~ | — | **Selesai:** diperbarui ke Fase 1–8 + impor |
| B-6 | ~~`verifikasi_10.sql` tidak ada di diagram README~~ | — | **Selesai:** ditambahkan ke struktur |
| B-7 | ~~Alfa otomatis belum tentu nonaktif di DB~~ | - | **Selesai:** diaktifkan user 2026-10-30; pantau pembentukan Alfa |
| B-8 | Tidak ada lint/unit test | Regresi hanya tertangkap manual | Pertimbangkan uji dasar bila diminta |
| B-9 | Tidak ada `.env.example` yang diperbarui? — ada, tapi nilainya harus dicek | Setup developer baru | Pastikan sesuai variabel terpakai |
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
