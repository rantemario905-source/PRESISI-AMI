# PRESISI AMI

**P**resensi **S**istem **I**nformasi **S**taf **I**ntegrasi — RSUD Aji Muhammad Idris (RSUD AMI)

Aplikasi web absensi pegawai non-ASN berbasis **React (Vite) + Tailwind CSS + Supabase**,
dengan geofencing radius 100 m, proteksi Fake GPS, penguncian perangkat (device binding),
dan pemisahan hak akses antara **Pegawai** dan **Super Admin**.

> Status: **Fase 1–3 selesai** — fondasi, database + RLS, login, geofencing,
> device binding, halaman absensi pegawai, Portal Super Admin lengkap, serta
> layanan mandiri pegawai (pengajuan izin/cuti dan riwayat bulanan).

---

## 1. Prasyarat

- Node.js 18+ (diuji pada Node 24)
- Akun/proyek Supabase (gratis)
- Browser modern + **HTTPS** saat produksi (Geolocation API mewajibkan konteks aman)

## 2. Menjalankan aplikasi

```bash
npm install
```

Salin `.env.example` menjadi `.env`, lalu isi:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Ambil nilainya di **Supabase Dashboard → Project Settings → API**.

Jalankan:

```bash
npm run dev      # development  → http://localhost:5173
npm run build    # build produksi
npm run preview  # pratinjau hasil build
```

## 3. Menyiapkan database

Ada dua cara — **cara bertahap lebih disarankan** agar mudah melacak error:

**A. Bertahap (disarankan)**

Buka **Supabase Dashboard → SQL Editor**, lalu jalankan file berikut
**satu per satu** (tunggu "Success" sebelum lanjut):

| Urutan | File | Isi |
|---|---|---|
| 1 | `supabase/migrations/01_tabel.sql` | 7 tabel dasar |
| 2 | `supabase/migrations/02_fungsi.sql` | Fungsi & trigger |
| 3 | `supabase/migrations/03_index.sql` | Index & unique constraint |
| 4 | `supabase/migrations/04_rls.sql` | RLS & policy keamanan |
| 5 | `supabase/migrations/05_rpc.sql` | RPC `submit_presensi` |
| 6 | `supabase/migrations/06_seed.sql` | Master shift Pagi/Siang/Malam |
| 7 | `supabase/migrations/07_admin_rpc.sql` | **Fase 2**: RPC admin, policy izin, realtime, penyempurnaan `submit_presensi` |
| 8 | `supabase/migrations/08_pegawai.sql` | **Fase 3**: RPC `perbarui_pegawai` (nama & unit kerja, tanpa ubah role) |

> Bila database sudah pernah dijalankan sampai file 07, **cukup jalankan file 08**
> untuk mengaktifkan menu Data Pegawai.

**B. Sekaligus**

Salin seluruh isi `supabase/schema.sql`, tempel, lalu **Run**.
Isinya identik dengan gabungan kedelapan file di atas.
3. Buat akun login di **Authentication → Users → Add user** (centang *Auto Confirm User*).
   Metadata opsional (JSON): `{"nama": "Nama Lengkap", "unit_kerja": "IGD"}`
4. Untuk akun **Super Admin**, jalankan SQL:

```sql
update public.pegawai
   set role = 'superadmin'
 where id = (select id from auth.users where email = 'admin@rsud-ami.go.id');
```

## 4. Struktur project

```
├── index.html
├── supabase/
│   ├── schema.sql              # Skema DB + RLS + RPC (instalasi sekali jalan)
│   └── migrations/             # 01–08, dijalankan bertahap
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx                # Entry point React
    ├── App.jsx                 # Router & pemisahan hak akses
    ├── index.css               # Tailwind + gaya dasar + gaya cetak (print)
    ├── config/
    │   └── constants.js        # Koordinat RSUD AMI, radius 100 m, zona waktu
    ├── utils/
    │   ├── supabaseClient.js   # Klien Supabase dari .env
    │   ├── geofencing.js       # Haversine + anti Mock Location + radius
    │   ├── deviceHelper.js     # UUID device_token di localStorage
    │   ├── format.js           # Format tanggal/jam WITA, periode, jarak
    │   ├── csv.js              # Ekspor CSV (kompatibel Excel)
    │   └── status.js           # Pemetaan status → warna badge
    ├── services/               # Akses data (dipisah per domain)
    │   ├── authService.js
    │   ├── deviceService.js
    │   ├── attendanceService.js
    │   ├── pegawaiService.js
    │   ├── adminDashboardService.js
    │   ├── adminDeviceService.js
    │   ├── shiftService.js
    │   ├── correctionService.js
    │   ├── leaveService.js
    │   ├── izinPegawaiService.js
    │   ├── riwayatService.js
    │   └── reportService.js
    ├── context/
    │   └── AuthContext.jsx     # Sesi, profil, peran
    ├── components/
    │   ├── ProtectedRoute.jsx  # Penjaga rute berbasis peran
    │   ├── AksesDitolak.jsx
    │   ├── BarAtas.jsx
    │   ├── PanelAbsen.jsx      # Alur tombol ABSEN HADIR / PULANG
    │   ├── ui/                 # Button, Badge, Alert, Spinner, Modal, dll.
    │   ├── kartu/              # Kartu profil, shift, perangkat, riwayat
    │   ├── layout/             # Sidebar & layout Portal Super Admin
    │   └── admin/              # KepalaHalaman, KartuStatistik
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx       # Halaman absensi pegawai (/)
        ├── IzinSaya.jsx        # Pengajuan izin/cuti pegawai (/izin-saya)
        ├── RiwayatSaya.jsx     # Riwayat & rekap bulanan pegawai (/riwayat)
        ├── NotFound.jsx
        └── admin/              # Portal Super Admin (/superadmin-portal)
            ├── DashboardUtama.jsx
            ├── DataPegawai.jsx
            ├── VerifikasiPerangkat.jsx
            ├── MasterShift.jsx
            ├── KoreksiPresensi.jsx
            ├── PengajuanIzin.jsx
            └── Rekapitulasi.jsx
```

## 5. Aturan keamanan yang diterapkan

| Lapisan | Implementasi |
|---|---|
| **Geofencing** | Haversine ke titik pusat RSUD AMI; tolak jika jarak > 100 m (klien + server) |
| **Fake GPS** | Tolak bila `coords.isMocked === true` atau `accuracy === 0`; akurasi > 50 m ditolak |
| **Device binding** | `device_token` UUID di `localStorage`; hanya perangkat `approved` Admin IT yang bisa absen; 1 pegawai = 1 perangkat aktif (unique index DB) |
| **Server-side** | Penulisan presensi hanya lewat RPC `submit_presensi` (`SECURITY DEFINER`) yang memvalidasi ulang semuanya |
| **RLS** | RLS aktif di semua tabel; pegawai hanya bisa membaca data miliknya |
| **Anti duplikasi** | `unique (user_id, tanggal)` + validasi absen masuk/pulang di server |
| **Aksi admin** | Persetujuan perangkat, koreksi presensi, dan keputusan izin hanya lewat RPC `SECURITY DEFINER` yang memeriksa `is_superadmin()` |
| **Audit trail** | Koreksi presensi wajib alasan (min. 5 karakter) dan mencatat admin, nilai lama/baru, serta waktu |
| **Privasi** | Promosi role hanya lewat SQL Admin IT (tidak bisa dari metadata signup) |

## 6. Alur absensi

1. Pegawai login → dashboard memuat profil, jadwal shift, status perangkat.
2. Perangkat baru → **Ajukan Verifikasi Perangkat** (status `pending`, tombol absen terkunci).
3. Admin IT menyetujui → status `approved` → tombol **ABSEN HADIR/PULANG** aktif.
4. Klik absen → izin lokasi → validasi mock location + radius → simpan ke Supabase → notifikasi.
5. Koordinat, jarak, akurasi, dan `device_token` tercatat untuk audit.

## 7. Portal Super Admin (Fase 2)

Akses: login dengan akun ber-role `superadmin`, lalu buka `/superadmin-portal`.

| Menu | Fungsi |
|---|---|
| **Dashboard Utama** | Statistik pegawai/hadir/pending + pemantauan presensi hari ini secara real-time |
| **Data Pegawai** | Lihat seluruh pegawai, ubah nama & unit kerja (role tetap read-only), pantau status perangkat |
| **Verifikasi Perangkat** | Setujui/tolak pengajuan, reset perangkat (otomatis mencabut perangkat lama) |
| **Master & Jadwal Shift** | CRUD shift (Pagi/Siang/Malam) + jadwal per pegawai atau serentak per unit |
| **Koreksi Presensi** | Ubah jam/status dengan **alasan wajib** + audit trail permanen |
| **Izin / Cuti / Dinas** | Catat surat atas nama pegawai, setujui/tolak; persetujuan otomatis menandai presensi |
| **Rekapitulasi** | Rekap bulanan per unit (ringkasan/detail), ekspor CSV, dan cetak laporan A4 |

**Alur verifikasi perangkat (tanpa SQL manual):**

1. Pegawai klik **Ajukan Verifikasi Perangkat** di dashboard.
2. Super Admin membuka **Verifikasi Perangkat → Menunggu**, lalu **Setujui**.
3. Sistem otomatis mencabut perangkat lama yang masih aktif (kebijakan 1 perangkat).
4. Tombol absen pegawai terbuka pada perangkat yang disetujui.

**Efek persetujuan izin/cuti:** baris presensi pada rentang tanggal tersebut dibuat atau
ditandai dengan status sesuai jenis izin. Presensi yang sudah memiliki jam masuk tidak
ditimpa. Bila pengajuan dibatalkan/ditolak, penanda otomatis dihapus.

## 8. Layanan mandiri pegawai (Fase 3)

| Menu | Fungsi |
|---|---|
| **Absensi** (`/`) | Absen hadir/pulang dengan geofencing + device binding |
| **Izin & Cuti** (`/izin-saya`) | Ajukan izin, sakit, cuti, atau dinas luar; pantau status & catatan admin |
| **Riwayat** (`/riwayat`) | Rekap & detail presensi bulanan milik sendiri |

Pengajuan izin yang sudah dikirim **tidak dapat dibatalkan atau diubah** oleh pegawai;
hanya Super Admin yang dapat menyetujui/menolak. Persetujuan otomatis menandai presensi
pada rentang tanggal terkait.

**Perubahan data pegawai:** Super Admin dapat memperbarui nama dan unit kerja melalui
menu **Data Pegawai**. Peran (`pegawai` / `superadmin`) sengaja tidak dapat diubah dari
aplikasi — promosi hanya melalui SQL oleh Admin IT.

## 9. Catatan penting

- **Deteksi Fake GPS bersifat heuristik.** `coords.isMocked` hanya tersedia di Chrome Android;
  iOS/Safari tidak melaporkannya. Validasi server tetap dijalankan, namun tidak ada
  aplikasi web murni yang 100% kebal manipulasi GPS. Pertahanan terbaik dicapai lewat
  kombinasi device binding + validasi server + audit trail.
- **Koordinat pusat** diatur di `src/config/constants.js` **dan** `supabase/schema.sql`
  (fungsi `submit_presensi`). Jika titik pusat berubah, ubah **keduanya**.
- **Timezone** "hari ini" memakai `Asia/Makassar` (WITA).
- `dist/` dan `.env` sudah masuk `.gitignore`.

## 10. Deploy produksi (GitHub + Vercel)

1. Buat repository **kosong** di GitHub (tanpa README / .gitignore).
2. Dari folder proyek, jalankan:

   ```bash
   git init
   git add .
   git commit -m "PRESISI AMI - siap produksi"
   git branch -M main
   git remote add origin https://github.com/<username>/<nama-repo>.git
   git push -u origin main
   ```

3. Buka [vercel.com](https://vercel.com) → **Add New → Project** → import repository tersebut.
4. Vercel mendeteksi **Vite** secara otomatis (`npm run build`, output `dist`).
5. Tambahkan **Environment Variables**:

   | Nama | Nilai |
   |---|---|
   | `VITE_SUPABASE_URL` | URL project Supabase |
   | `VITE_SUPABASE_ANON_KEY` | anon/public key Supabase |

6. Klik **Deploy**. File `vercel.json` sudah mengatur rewrite SPA agar rute seperti
   `/riwayat` dan `/superadmin-portal` tidak 404 saat di-refresh.
7. Setelah dapat domain Vercel, buka **Supabase → Authentication → URL Configuration**
   dan isi **Site URL** dengan domain tersebut.
8. GPS hanya berjalan di **HTTPS** (otomatis dari Vercel) dan harus diuji di HP
   dalam radius 100 m dari RSUD AMI.

**Membersihkan data uji sebelum go-live:** jalankan `supabase/cleanup_data_uji.sql`
di SQL Editor. Skrip ini menghapus presensi, izin, koreksi, jadwal, dan perangkat,
tetapi mempertahankan akun, unit kerja, serta master shift.
