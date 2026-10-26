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
| Terakhir diperbarui | 2026-10-27 00:03 WITA |
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
relevan) dan **subtitle rumah sakit di topbar dihapus**. Yang belum: konfirmasi
migrasi 09–18 & skrip verifikasi, penyiapan data operasional
(grup shift, jadwal, hari libur), dan persiapan go-live.

| Aspek | Status | Bukti |
|---|---|---|
| Kode aplikasi | Selesai sampai Fase 8 + UI navigasi + migrasi 15–18 | `src/`, `supabase/migrations/01–18` |
| Commit Git | **HEAD** — `c4fe733` (aksi per halaman dan subtitle topbar) | `git log` |
| Perubahan lokal | **Tidak ada** — penempatan aksi per halaman, `KepalaHalaman` judul kiri/aksi kanan, subtitle topbar, dan aset `logo kutai kartanegara.png` sudah di-commit dan di-push 2026-10-27 00:03 | `git status` |
| Migrasi DB 01–18 | **18 sudah dijalankan** (pesan server baru); 15–17 belum terkonfirmasi | uji Hapus grup, 2026-10-26 |
| Skrip `supabase/verifikasi_*.sql` | **Tidak diketahui** sudah dijalankan atau belum | perlu cek manual |
| Build produksi | **Lulus** — base `/` 6,73 dtk; build base `/PRESISI-AMI/` 8,07 dtk | `npm run build` (2026-10-26 23:50) |
| Jendela waktu absen | **Ada di kode** — masuk 20 menit sebelum, pulang 1 menit setelah | migrasi 17, `PanelAbsen.jsx`, `jadwalAbsen.js` |
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
| Lint/unit test | Tidak tersedia di `package.json` | `package.json` |
| Alfa otomatis | Fitur ada, **default nonaktif** | migrasi 12, `PengaturanPresensi.jsx` |
| Deploy GitHub Pages | **Aktif** — workflow run #1 sukses | https://rantemario905-source.github.io/PRESISI-AMI/ |
| Uji login live | **Lulus** — Super Admin (desktop) + pegawai (mobile) | Laporan user 2026-10-25 13:37 |
| Uji perangkat & absensi | **Lulus** — verifikasi perangkat, radius, akurasi, duplikasi | Laporan user 2026-10-25 14:04 |

**Pekerjaan terakhir:** mengembalikan tata letak `KepalaHalaman` ke judul
kiri/aksi kanan, lalu memindahkan tombol aksi per halaman ke header kartu daftar,
kartu **Tambah Hari Libur** (Tahun), baris tab **Koreksi**/**Verifikasi**, dan
atas kotak filter **Rekapitulasi**; subtitle **RSUD Aji Muhammad Idris** tetap
dihapus dari topbar (2026-10-26; **sudah di-commit dan di-push** ke
`origin/main` pada 2026-10-27 00:03). Aset
`src/assets/logo kutai kartanegara.png` ikut di-commit untuk pekerjaan kop RSUD
AMI berikutnya dan belum dipakai di UI.

**Langkah berikutnya yang disarankan:**
1. Jalankan migrasi **15**, **16**, **17**, lalu **18** berurutan di SQL Editor,
   kemudian `supabase/verifikasi_15.sql`, `verifikasi_16.sql`,
   `verifikasi_17.sql`, dan `verifikasi_18.sql` sampai semua `true`. Migrasi 16
   **mengosongkan tabel `perangkat`** (data uji).
2. Uji lokal: kepala ruangan mengubah jadwal hari ini, pegawai mengajukan
   perangkat kedua (harus ditolak sampai Admin IT reset), tombol absen terkunci
   sebelum jam buka (masuk 20 menit sebelum, pulang 1 menit setelah), dan hapus
   salah satu grup kosong operasional dari menu Grup Shift. Grup sistem
   **Belum ditentukan** kini tersembunyi selama tidak berisi pegawai. Periksa
   juga favicon tab browser, header sidebar Super Admin tanpa label role, label
   dashboard (“Dashboard”, “Total Pegawai”, tanggal aktual, “Perlu Verifikasi”),
   dan menu **Keluar** di avatar kanan atas pada desktop serta HP. Periksa juga
   kerapatan menu sidebar Super Admin/kepala ruangan dan latar biru muda
   transparan pada seluruh halaman portal Super Admin dan Kepala Ruangan;
   periksa juga posisi tombol aksi per halaman (header kartu daftar, Tahun Hari
   Libur, baris tab Koreksi/Verifikasi, dan atas kotak filter Rekapitulasi)
   serta topbar tanpa subtitle rumah sakit.
3. Lengkapi data operasional: seksi **Grup Shift**, pola kerja di **Data Pegawai**,
   **Jadwal Shift**, dan **Hari Libur**.
4. Pastikan migrasi 09–14 sudah dijalankan berurutan dan seluruh
   `supabase/verifikasi_*.sql` bernilai `true`.
5. Bersihkan data uji dengan `supabase/cleanup_data_uji.sql` sebelum go-live.
6. Aktifkan Alfa otomatis + `pg_cron` **paling akhir**, setelah jadwal lengkap dan
   hari libur terisi.

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
| B-2 | Status migrasi 09–18 di Supabase belum diketahui | Fitur bisa gagal saat dipakai | Cek SQL Editor / jalankan migrasi berurutan |
| B-3 | Hasil `supabase/verifikasi_09..18.sql` belum diketahui | Jaminan integritas DB belum ada | Jalankan dan pastikan semua `true` |
| B-12 | Migrasi 15–18 belum dijalankan | UI baru tidak berfungsi dengan DB lama | Jalankan 15, 16, 17, lalu 18; **16 mengosongkan `perangkat`** |
| B-13 | Uji lokal fitur baru belum dilakukan | Perilaku kepala ruangan, perangkat kedua, jendela waktu, dan hapus grup belum terbukti | Uji ubah jadwal hari ini, ajukan perangkat kedua, tombol absen sebelum jam buka, dan hapus grup kosong non-sistem |
| B-14 | ~~Perubahan migrasi 15–17 belum di-commit~~ | - | **Selesai:** commit `c21ecf9` + push 2026-10-26 12:01 |
| B-15 | Aturan jendela waktu (migrasi 17) belum dijalankan/diuji | Absen bisa ditolak atau tidak sesuai harapan | Jalankan 17 + `verifikasi_17.sql`, lalu uji absen 07.40 dan 16.31 |
| B-16 | ~~Migrasi 18 dan UI grup sistem belum diuji/di-commit~~ | - | **Selesai:** commit `6343111` + push 2026-10-26 13:19; sisa uji `verifikasi_18.sql` |
| B-17 | Kerapatan sidebar dan latar portal baru diuji lewat build | Tampilan di layar kecil/desktop belum terbukti | Uji visual `npm run dev` di desktop dan HP, lalu sesuaikan bila terlalu rapat/terlalu pucat |
| B-18 | ~~Posisi aksi dekat judul dan penghapusan subtitle baru diuji lewat build~~ | - | **Digantikan I-026:** aksi tidak lagi menempel judul |
| B-19 | Penempatan aksi per halaman baru diuji lewat build | Tombol bisa menumpuk atau salah posisi di layar sempit | Uji visual Data Pegawai, Grup Shift, Master Shift, Hari Libur, Koreksi, Dinas & Sakit, Cuti, Rekapitulasi, Verifikasi, dan Jadwal Shift di desktop serta HP |
| B-4 | ~~`npm run build` belum dijalankan~~ | — | **Selesai:** lulus 2026-10-25 12:24 |
| B-5 | ~~README menyebut Fase 1–7 saja~~ | — | **Selesai:** diperbarui ke Fase 1–8 + impor |
| B-6 | ~~`verifikasi_10.sql` tidak ada di diagram README~~ | — | **Selesai:** ditambahkan ke struktur |
| B-7 | Alfa otomatis belum tentu nonaktif di DB | Risiko Alfa salah dibuat | Cek `Pengaturan Presensi` |
| B-8 | Tidak ada lint/unit test | Regresi hanya tertangkap manual | Pertimbangkan uji dasar bila diminta |
| B-9 | Tidak ada `.env.example` yang diperbarui? — ada, tapi nilainya harus dicek | Setup developer baru | Pastikan sesuai variabel terpakai |
| B-10 | ~~Deploy GitHub Pages belum aktif~~ | — | **Selesai:** live 2026-10-25 13:19 |
| B-11 | Base path `/PRESISI-AMI/` terikat nama repo | Custom domain perlu ubah `VITE_BASE_PATH` | Ubah ke `/` bila pindah domain |

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

---

## 6. Cara Menambah Entri Baru

1. Tambahkan entri di **bagian atas** Log Kronologis (urutan terbaru di atas).
2. Format judul: `### YYYY-MM-DD HH:mm WITA — <ringkasan>`.
3. Isi minimal: **Perubahan**, **File**, **Verifikasi**, **Catatan/risiko**.
4. Perbarui **Status Terkini** dan **Terakhir diperbarui** di header.
5. Pindahkan item backlog yang selesai ke entri log; tandai `selesai` di tabel.
6. Jangan hapus entri lama. Bila ada koreksi, tambahkan catatan koreksi.
