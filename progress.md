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
| Terakhir diperbarui | 2026-10-25 13:19 WITA |
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
- Satu entri log = satu unit pekerjaan bermakna. Sertakan file yang berubah,
  cara verifikasi, dan risiko/utang teknis.

---

## 1. Status Terkini

**Ringkasan:** seluruh fitur inti (Fase 1–8 + penyempurnaan UI navigasi) sudah ada
di kode, sudah di-commit, dan **live di GitHub Pages**. Yang belum: pengaturan
**Site URL Supabase**, konfirmasi migrasi 09–14 beserta skrip verifikasi, dan uji
fungsional di perangkat.

| Aspek | Status | Bukti |
|---|---|---|
| Kode aplikasi | Selesai sampai Fase 8 + UI navigasi | `src/`, `supabase/migrations/01–14` |
| Commit Git | **Sinkron** — `2c8a775` (Fase 4–8 + UI) | `git log`, `origin/main` |
| Perubahan belum di-commit | **Tidak ada** — working tree bersih | `git status` |
| Migrasi DB 01–14 | **Tidak diketahui** di proyek Supabase | perlu cek SQL Editor |
| Skrip `supabase/verifikasi_*.sql` | **Tidak diketahui** sudah dijalankan atau belum | perlu cek manual |
| Build produksi | **Lulus** — 266 modul, 6,46 dtk | `npm run build` (2026-10-25 12:24) |
| Lint/unit test | Tidak tersedia di `package.json` | `package.json` |
| Alfa otomatis | Fitur ada, **default nonaktif** | migrasi 12, `PengaturanPresensi.jsx` |
| Deploy GitHub Pages | **Aktif** — workflow run #1 sukses | https://rantemario905-source.github.io/PRESISI-AMI/ |

**Pekerjaan terakhir sebelum audit:** penyempurnaan navigasi UI (tab bar, navigasi
bawah, menu kepala ruangan, layout portal kepala) pada 2026-10-25 11:28–11:49.

**Langkah berikutnya yang disarankan:**
1. Set **Site URL** Supabase ke `https://rantemario905-source.github.io/PRESISI-AMI/`
   dan tambahkan redirect URL yang sama (`/**`) + `http://localhost:5173/**`.
2. Uji login Super Admin di URL live, lalu buka Portal Super Admin.
3. Pastikan migrasi 09–14 sudah dijalankan berurutan dan seluruh
   `supabase/verifikasi_*.sql` bernilai `true`.
4. Jangan aktifkan Alfa otomatis sebelum jadwal bulan pertama lengkap, hari libur
   terisi, dan finalisasi diuji.
5. Uji absensi di HP (HTTPS + izin lokasi) dalam radius 100 m dari RSUD AMI.

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
| 7 | Kepala ruangan kelola jadwal unit, audit jadwal, finalisasi bulanan, hapus mode transisi | `migrations/13_kepala_jadwal_final.sql`, `src/components/layout/PortalKepalaLayout.jsx`, `SidebarKepala.jsx`, `src/components/MenuKepala.jsx`, `src/pages/admin/JadwalShift.jsx` | selesai | tidak diketahui | `supabase/verifikasi_13.sql` |
| 8 | Impor massal jadwal shift CSV/XLSX, validasi ulang di server, atomik | `migrations/14_impor_jadwal_shift.sql`, `src/utils/templateJadwal.js`, `src/services/shiftService.js`, `src/pages/admin/JadwalShift.jsx` | selesai | tidak diketahui | `supabase/verifikasi_14.sql` |
| UI | Penyempurnaan navigasi: tab bar, navigasi bawah mobile, menu kepala, layout portal | `src/components/ui/TabBar.jsx`, `src/components/NavigasiBawah.jsx`, `src/components/BarAtas.jsx`, `src/components/MenuKepala.jsx`, `src/components/layout/PortalKepalaLayout.jsx`, `src/index.css`, `src/pages/Dashboard.jsx` | selesai `(inferred)` | — | build lulus; uji manual belum tercatat |

**Catatan:** README baris status masih menyebut **Fase 1–7** dan belum menyebut
Fase 8 (impor jadwal) maupun pekerjaan UI 25 Okt. README juga belum mencantumkan
`verifikasi_10.sql` pada diagram struktur, padahal filenya ada.

---

## 3. Log Kronologis Pekerjaan

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
| B-2 | Status migrasi 09–14 di Supabase belum diketahui | Fitur bisa gagal saat dipakai | Cek SQL Editor / jalankan migrasi berurutan |
| B-3 | Hasil `supabase/verifikasi_09..14.sql` belum diketahui | Jaminan integritas DB belum ada | Jalankan dan pastikan semua `true` |
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
| D-005 | Jadwal shift wajib; mode transisi dihapus permanen | Mencegah absen tanpa jadwal | Sel kosong sebelum final bukan berarti libur |
| D-006 | Finalisasi jadwal per unit/bulan | Mengunci jadwal operasional | Hanya Super Admin yang dapat membuka finalisasi |
| D-007 | Impor jadwal bersifat atomik dan divalidasi ulang di server | Mencegah data setengah jadi | Satu baris salah membatalkan seluruh impor |
| D-008 | Bucket `dokumen-izin` privat, JPG/PNG maks. 1 MB | Melindungi dokumen medis/kepegawaian | Jangan diubah menjadi publik |
| D-009 | Promosi/penurunan role Super Admin hanya lewat SQL Admin IT | Memisahkan kewenangan tertinggi dari UI | Tidak tersedia di Portal Super Admin |
| D-010 | Semua pekerjaan dicatat di `progress.md`; semua instruksi user dicatat di `AGENTS.md` | Auditability dan kelanjutan sesi | Wajib diperbarui setiap selesai tugas |

---

## 6. Cara Menambah Entri Baru

1. Tambahkan entri di **bagian atas** Log Kronologis (urutan terbaru di atas).
2. Format judul: `### YYYY-MM-DD HH:mm WITA — <ringkasan>`.
3. Isi minimal: **Perubahan**, **File**, **Verifikasi**, **Catatan/risiko**.
4. Perbarui **Status Terkini** dan **Terakhir diperbarui** di header.
5. Pindahkan item backlog yang selesai ke entri log; tandai `selesai` di tabel.
6. Jangan hapus entri lama. Bila ada koreksi, tambahkan catatan koreksi.
