# PRESISI AMI

**P**resensi **S**istem **I**nformasi **S**taf **I**ntegrasi — RSUD Aji Muhammad Idris (RSUD AMI)

Aplikasi web absensi pegawai non-ASN berbasis **React (Vite) + Tailwind CSS + Supabase**,
dengan geofencing radius 100 m, proteksi Fake GPS, penguncian perangkat (device binding),
dan pemisahan hak akses antara **Pegawai** dan **Super Admin**.

> Status: **Fase 1–8 selesai di kode** — fondasi, database + RLS, login, geofencing,
> device binding, halaman absensi pegawai, Portal Super Admin, administrasi
> Dinas & Sakit / Cuti, **jadwal shift per grup yang langsung tersimpan,
> pengelolaan jadwal oleh kepala ruangan, hari libur, deteksi keterlambatan,
> Alfa otomatis**, **impor jadwal CSV/XLSX**, **satu perangkat aktif per
> pegawai**, **jendela waktu absensi**, serta **hapus grup shift kosong**.

> **Dokumentasi audit:** progres pekerjaan tercatat di [`progress.md`](progress.md)
> dan aturan kerja agen serta log instruksi user di [`AGENTS.md`](AGENTS.md).

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
| 9 | `supabase/migrations/09_dinas_sakit_cuti.sql` | **Fase 4**: kepala ruangan, grup Dinas, dokumen wajib, status `dibatalkan`, RPC baru, bucket `dokumen-izin` |
| 10 | `supabase/migrations/10_kelola_role.sql` | RPC perubahan role (opsional; tidak dipakai UI) |
| 11 | `supabase/migrations/11_kepala_ruangan.sql` | **Fase 5**: RPC pengaturan nama, unit kerja, dan kepala ruangan dari Data Pegawai |
| 12 | `supabase/migrations/12_pola_kerja_jadwal_alfa.sql` | **Fase 6**: grup shift, pola kerja, jam reguler, hari libur, keterlambatan, dan Alfa otomatis |
| 13 | `supabase/migrations/13_kepala_jadwal_final.sql` | **Fase 7**: hapus mode transisi, kepala ruangan kelola jadwal unit, audit jadwal, dan finalisasi bulanan (finalisasi dihapus oleh migrasi 15) |
| 14 | `supabase/migrations/14_impor_jadwal_shift.sql` | Impor massal jadwal shift dari template CSV/XLSX dengan validasi ulang di server |
| 15 | `supabase/migrations/15_hapus_finalisasi_jadwal.sql` | Hapus finalisasi bulanan; kepala ruangan dapat mengubah jadwal mulai hari ini |
| 16 | `supabase/migrations/16_satu_perangkat.sql` | Satu perangkat aktif per pegawai; data perangkat uji dikosongkan |
| 17 | `supabase/migrations/17_batas_waktu_absen.sql` | Batas waktu absen: masuk 20 menit sebelum jam masuk, pulang 1 menit setelah jam pulang |
| 18 | `supabase/migrations/18_hapus_grup_kosong.sql` | Hapus grup kosong; grup sistem "Belum ditentukan" hanya tampil jika berisi pegawai |

> Bila database sudah pernah dijalankan sampai file 08, jalankan **file 09** untuk
> mengaktifkan alur Dinas & Sakit / Cuti, **file 11** untuk pengaturan kepala
> ruangan, lalu **file 12** untuk jadwal shift/keterlambatan/Alfa, **file 13**
> untuk kebijakan jadwal wajib, **file 14** untuk impor template, **file 15**
> untuk menghapus finalisasi, **file 16** untuk aturan satu perangkat, **file 17**
> untuk batas waktu absen, dan **file 18** untuk hapus grup kosong.
> File 10 hanya berisi RPC perubahan role yang tidak dipakai UI, jadi boleh
> dilewati. Jalankan migrasi secara bertahap - jangan mengulang file lama bila
> tidak diperlukan.
>
> Migrasi 09 juga membuat bucket privat **`dokumen-izin`** (JPG/PNG, maks. 1 MB)
> beserta policy-nya. Jangan mengubah bucket menjadi publik.
>
> Jalankan **`supabase/verifikasi_09.sql`**, **`supabase/verifikasi_11.sql`**,
> **`supabase/verifikasi_12.sql`**, **`supabase/verifikasi_15.sql`**,
> **`supabase/verifikasi_16.sql`**, **`supabase/verifikasi_17.sql`**, dan
> **`supabase/verifikasi_18.sql`** setelah migrasi terkait. Seluruh nilai
> pemeriksaan harus `true`; bila ada yang `false`, jangan lanjutkan pemakaian.
> `verifikasi_13.sql` dan `verifikasi_14.sql` hanya berlaku sebelum migrasi 15;
> setelah migrasi 15, gunakan `verifikasi_15.sql`, `verifikasi_16.sql`,
> `verifikasi_17.sql`, dan `verifikasi_18.sql`.
> Migrasi 12–18 wajib dijalankan sebelum membuka menu Grup Shift/Jadwal Shift.

**B. Sekaligus**

Salin seluruh isi `supabase/schema.sql`, tempel, lalu **Run**.
Isinya identik dengan gabungan kedelapan belas file di atas (termasuk migrasi 15-18).

**C. Membuat akun pegawai**

1. Satu akun: **Authentication → Users → Add user** (centang *Auto Confirm User*).
   Metadata opsional (JSON): `{"nama": "Nama Lengkap", "unit_kerja": "IGD"}`
2. Untuk **Super Admin pertama**, jalankan SQL (wajib karena belum ada akun
   Super Admin yang bisa membuka menu Data Pegawai):

```sql
update public.pegawai
   set role = 'superadmin'
 where id = (select id from auth.users where email = 'admin@rsud-ami.go.id');
```

   Setelah satu Super Admin aktif, promosi/penurunan role pegawai lain **tetap
   dilakukan lewat SQL** oleh Admin IT; akun Super Admin tidak ditampilkan di
   Data Pegawai.

3. Untuk menjadikan seorang pegawai **kepala ruangan**, buka
   **Portal Super Admin → Data Pegawai → Ubah → Peran: Kepala Ruangan**.
   Satu unit hanya boleh memiliki satu kepala ruangan. Jika unit tersebut sudah
   punya kepala, statusnya dipindahkan otomatis ke pegawai yang dipilih.

   Alternatif lewat SQL:

```sql
update public.pegawai
   set kepala_ruangan = true
 where id = (select id from auth.users where email = 'kepala.unit@rsud-ami.go.id');

-- Bila perlu mencabut:
-- update public.pegawai set kepala_ruangan = false where id = '...';
```

4. Untuk puluhan akun sekaligus, siapkan file CSV UTF-8 dengan kolom
   `nama,email,unit_kerja` (alias seperti `Nama Pegawai`, `Unit Kerja`,
   `Kata Sandi` juga dikenali), lalu jalankan dari folder proyek:

   ```bash
   node scripts/impor-akun.mjs data-pegawai.csv --dry-run
   node scripts/impor-akun.mjs data-pegawai.csv --secret-file C:\rahasia\secret.txt
   ```

   Gunakan **Secret key** Supabase (bukan publishable/anon key) dan jangan
   pernah menyimpannya di repository. Bila kolom password kosong, skrip
   membuat password acak yang kuat. File `hasil-impor-*.csv` berisi password
   awal — distribusikan secara pribadi, lalu hapus file tersebut. Unit kerja
   baru otomatis dibuat sebagai grup shift dengan seksi **Belum ditentukan**;
   lengkapi seksinya di menu **Grup Shift**.

   Verifikasi hasil impor dan uji login akun pertama:

   ```bash
   node scripts/verifikasi-impor.mjs hasil-impor-*.csv --secret-file C:\rahasia\secret.txt
   ```

## 4. Struktur project

```
├── index.html
├── supabase/
│   ├── schema.sql              # Skema DB + RLS + RPC (instalasi sekali jalan)
│   ├── migrations/             # 01–18, dijalankan bertahap
│   ├── verifikasi_09.sql       # Pemeriksaan fitur Dinas & Sakit / Cuti
│   ├── verifikasi_10.sql       # Pemeriksaan RPC perubahan role (opsional)
│   ├── verifikasi_11.sql       # Pemeriksaan pengaturan kepala ruangan
│   ├── verifikasi_12.sql       # Pemeriksaan jadwal, keterlambatan, Alfa
│   ├── verifikasi_13.sql       # Pemeriksaan jadwal kepala & audit (sebelum migrasi 15)
│   ├── verifikasi_14.sql       # Pemeriksaan RPC impor (sebelum migrasi 15)
│   ├── verifikasi_15.sql       # Pemeriksaan finalisasi terhapus & batas tanggal baru
│   ├── verifikasi_16.sql       # Pemeriksaan satu perangkat aktif per pegawai
│   ├── verifikasi_17.sql       # Pemeriksaan batas waktu absen masuk/pulang
│   ├── verifikasi_18.sql       # Pemeriksaan hapus grup kosong
│   └── jadwal_alfa.sql         # Opsional: jadwal pg_cron untuk Alfa
├── scripts/
│   ├── impor-akun.mjs          # Impor akun massal via Supabase Admin API
│   └── verifikasi-impor.mjs    # Verifikasi hasil impor + uji login
├── public/
│   ├── favicon.svg            # Ikon lama (tidak dirujuk)
│   ├── favicon-32x32.png      # Ikon tab dari logo resmi
│   └── apple-touch-icon.png   # Ikon iOS dari logo resmi
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
    │   ├── templateJadwal.js   # Template + parser impor jadwal CSV/XLSX
    │   ├── dokumenIzin.js      # Validasi + kompresi JPG/PNG maks. 1 MB
    │   ├── izin.js             # Pengelompokan grup Dinas & label jenis
    │   └── status.js           # Pemetaan status → warna badge
    ├── services/               # Akses data (dipisah per domain)
    │   ├── authService.js
    │   ├── deviceService.js
    │   ├── attendanceService.js
    │   ├── pegawaiService.js
    │   ├── adminDashboardService.js
    │   ├── adminDeviceService.js
    │   ├── shiftService.js
    │   ├── groupShiftService.js
    │   ├── hariLiburService.js
    │   ├── pengaturanService.js
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
    │   ├── layout/             # Layout Super Admin, kepala ruangan, sidebar
    │   └── admin/              # KepalaHalaman, KartuStatistik
    └── pages/
        ├── Login.jsx
        ├── Dashboard.jsx       # Halaman absensi pegawai (/)
        ├── IzinSaya.jsx        # Riwayat baca-saja Dinas & Sakit / Cuti (/izin-saya)
        ├── RiwayatSaya.jsx     # Riwayat & rekap bulanan pegawai (/riwayat)
        ├── NotFound.jsx
        └── admin/              # Portal Super Admin & kepala ruangan
            ├── DashboardUtama.jsx
            ├── DataPegawai.jsx
            ├── VerifikasiPerangkat.jsx
            ├── GrupShift.jsx
            ├── MasterShift.jsx
            ├── JadwalShift.jsx
            ├── HariLibur.jsx
            ├── PengaturanPresensi.jsx
            ├── KoreksiPresensi.jsx
            ├── PengajuanIzin.jsx   # Dipakai mode superadmin & kepala
            └── Rekapitulasi.jsx
```

## 5. Aturan keamanan yang diterapkan

| Lapisan | Implementasi |
|---|---|
| **Geofencing** | Haversine ke titik pusat RSUD AMI; tolak jika jarak > 100 m (klien + server) |
| **Fake GPS** | Tolak bila `coords.isMocked === true` atau `accuracy === 0`; akurasi > 50 m ditolak |
| **Device binding** | `device_token` UUID di `localStorage`; hanya perangkat `approved` Admin IT yang bisa absen; 1 pegawai = 1 perangkat aktif (`pending`/`approved`) dijaga unique index dan RLS |
| **Server-side** | Penulisan presensi hanya lewat RPC `submit_presensi` (`SECURITY DEFINER`) yang memvalidasi ulang semuanya |
| **RLS** | RLS aktif di semua tabel; pegawai hanya bisa membaca data miliknya |
| **Anti duplikasi** | `unique (user_id, tanggal)` + validasi absen masuk/pulang di server |
| **Jendela waktu** | Absen masuk dibuka 20 menit sebelum jam masuk; absen pulang dibuka 1 menit setelah jam pulang (reguler, shift, dan shift malam lintas hari; klien + server) |
| **Jadwal shift** | Super Admin mengelola semua unit/tanggal; kepala ruangan hanya unitnya, mulai hari ini (WITA), dan tanggal sebelum hari ini hanya untuk Super Admin. Perubahan sel langsung tersimpan. Pegawai shift tanpa jadwal **selalu** ditolak |
| **Status jadwal** | Tidak ada finalisasi. Sel kosong berarti belum dijadwalkan, bukan libur. Impor mengikuti batas tanggal yang sama |
| **Keterlambatan** | Dihitung server dari jam masuk terhadap jadwal; tanpa toleransi (08.00.01 = 1 menit) dan hanya pada hari yang dijadwalkan |
| **Hari libur** | Diinput manual Super Admin; absensi reguler dikunci, sedangkan pegawai shift tetap boleh absen bila dijadwalkan |
| **Alfa otomatis** | Hanya dibuat setelah jam kerja berakhir; idempoten, mendukung shift malam lintas hari, dan tunduk pada tanggal mulai penerapan |
| **Aksi admin** | Persetujuan perangkat, koreksi presensi, dan keputusan Dinas & Sakit / Cuti hanya lewat RPC `SECURITY DEFINER` yang memeriksa `is_superadmin()` |
| **Administrasi unit** | Kepala ruangan hanya dapat membaca data pegawai unit, mengatur jadwal shift unit, dan mencatat pengajuan unit; tidak dapat menyetujui |
| **Izin read-only** | Tidak ada policy insert/update/delete pada `izin_cuti`; pegawai hanya melihat barisnya sendiri dan tidak dapat mengajukan sendiri |
| **Dokumen** | Bucket privat `dokumen-izin`; hanya JPG/PNG maks. 1 MB; path wajib diawali `grup_id` dan diverifikasi RPC |
| **Audit trail** | Koreksi presensi wajib alasan (min. 5 karakter) dan mencatat admin, nilai lama/baru, serta waktu |
| **Bilah progres** | Bilah tipis biru muda di atas layar saat navigasi menu, login, logout, dan muat ulang profil |
| **Logo aplikasi** | Logo resmi RSUD AMI (`src/assets/logo-rsud-ami.png`) di halaman login, header pegawai, sidebar Super Admin/kepala ruangan, favicon tab, dan apple-touch-icon |
| **Menu akun** | Klik avatar di kanan atas untuk membuka menu **Keluar** dengan animasi buka/tutup halus; tersedia di portal pegawai, Super Admin, dan kepala ruangan, termasuk tampilan HP |
| **Grup sidebar** | Grup **Data & Struktur**, **Penjadwalan & Presensi**, **Layanan & Laporan**, dan **Keamanan** dapat dibuka/tutup dengan animasi gulir ke bawah; grup aktif terbuka otomatis |
| **Privasi** | Promosi/penurunan role Super Admin hanya lewat SQL Admin IT; status kepala ruangan diatur Super Admin dari Data Pegawai dan dibatasi satu kepala per unit |

## 6. Alur absensi

1. Pegawai login → dashboard memuat profil, jadwal hari ini, status perangkat.
2. Perangkat baru → **Ajukan Verifikasi Perangkat** (status `pending`, tombol absen terkunci).
3. Admin IT menyetujui → status `approved` → tombol **ABSEN HADIR/PULANG** aktif.
4. Klik absen → izin lokasi → validasi mock location + radius → server memeriksa
   pola kerja, jadwal/hari libur, dan jam kerja → simpan → notifikasi. Pegawai
   shift yang belum dijadwalkan **selalu ditolak**; tidak ada mode transisi.
5. Keterlambatan dihitung otomatis (menit penuh, tanpa toleransi) dan ditampilkan
   pada kartu hari ini, riwayat, koreksi, dan rekap. Absen pulang tetap dicatat
   meskipun pegawai datang terlambat.
6. Shift **Malam 21.30–07.30** dapat absen masuk pada tanggal jadwal dan absen
   pulang pada dini hari berikutnya; sistem mencari baris presensi yang masih
   terbuka dari hari sebelumnya.
7. Koordinat, jarak, akurasi, dan `device_token` tercatat untuk audit.

## 7. Portal Super Admin (Fase 2–7)

Akses: login dengan akun ber-role `superadmin`, lalu buka `/superadmin-portal`.

| Menu | Fungsi |
|---|---|
| **Dashboard** | Statistik pegawai/hadir/pending + pemantauan presensi hari ini secara real-time |
| **Data Pegawai** | Lihat pegawai non-ASN, ubah nama/unit kerja/status Kepala Ruangan, pantau status perangkat. Akun Super Admin tidak ditampilkan |
| **Verifikasi Perangkat** | Setujui/tolak pengajuan, reset perangkat (otomatis mencabut perangkat lama) |
| **Grup Shift** | Master grup/unit dan seksi; rename otomatis memperbarui unit seluruh pegawai |
| **Master Shift** | CRUD pola jam shift (Pagi/Siang/Malam) |
| **Jadwal Shift** | Grid jadwal per grup, isi cepat, salin pola bulan lalu, template/impor CSV & XLSX, simpan otomatis per sel, dan tampilan daftar di HP |
| **Hari Libur** | Input manual hari libur nasional/cuti bersama per tahun |
| **Pengaturan Presensi** | Aktivasi Alfa otomatis dan proses Alfa manual. Mode transisi sudah dihapus |
| **Koreksi Presensi** | Ubah jam/status dengan **alasan wajib** + audit trail permanen |
| **Dinas & Sakit** | Catat Sakit (1 pegawai) atau Dinas Luar (1–4 pegawai/grup), dokumen wajib, setujui/tolak per grup |
| **Cuti** | Catat Cuti (1 pegawai), dokumen opsional, setujui/tolak |
| **Rekapitulasi** | Rekap bulanan per unit (ringkasan/detail), ekspor CSV, dan cetak laporan A4 |

### Jadwal shift, hari libur, dan Alfa otomatis

- **Grup Shift** memakai 24 unit yang sudah ada sebagai grup operasional. Setiap
  grup memiliki **seksi** induk: *Seksi Pelayanan Medik dan Keperawatan*,
  *Seksi Penunjang*, atau *Sub Bagian Tata Usaha*. Grup baru diawali
  **Belum ditentukan** sampai Super Admin memilih seksinya.
- **Hapus grup** hanya untuk grup tanpa pegawai. Grup yang masih berisi pegawai
  harus dikosongkan lebih dulu. **Belum ditentukan** adalah grup bawaan akun
  sistem (mis. Super Admin): grup ini hanya tampil bila berisi pegawai dan tidak
  dapat dihapus selama masih dipakai akun sistem.
- **Pola kerja** pegawai ada dua: **Reguler** dan **Shift**. Seluruh pegawai lama
  otomatis berstatus Shift saat migrasi 12. Ubah pegawai yang memakai jam kantor
  menjadi Reguler melalui **Data Pegawai → Ubah**.
- **Jam reguler** Senin–Kamis **08.00–16.30**, Jumat **08.00–16.00**,
  Sabtu–Minggu **libur**. Hari libur nasional/cuti bersama diinput manual dan
  mengunci absensi reguler; pegawai shift tetap dapat absen hanya bila
  dijadwalkan, termasuk pada hari libur.
- **Keterlambatan** dihitung dari jam masuk terhadap jam mulai jadwal, tanpa
  toleransi. Pukul **08.00.01** sudah dihitung **1 menit terlambat**. Sistem
  tidak menghitung pulang cepat; absen pulang tetap direkam.
- **Jendela waktu absen.** Tombol **Absen Hadir** baru aktif **20 menit sebelum
  jam masuk** (jadwal 08.00 → aktif 07.40). Tombol **Absen Pulang** baru aktif
  **1 menit setelah jam pulang** (jadwal pulang 16.30 → aktif 16.31). Aturan ini
  berlaku untuk Reguler dan Shift, termasuk shift malam lintas hari, serta
  divalidasi ulang di server. Sebelum jendela dibuka, tombol menampilkan jam
  buka dan alasan penguncian.
- **Jadwal shift wajib, tanpa mode transisi.** Pegawai shift yang belum
  dijadwalkan selalu ditolak saat absen dan tidak dibuatkan Alfa. Kepala ruangan
  dapat mengisi jadwal unitnya sendiri untuk tanggal **hari ini dan seterusnya**;
  tanggal sebelum hari ini dan unit lain hanya dapat diubah Super Admin.
  Perubahan kepala ruangan langsung tersimpan per sel dan tercatat di audit
  jadwal — tanpa alur persetujuan tambahan.
- **Tanpa finalisasi.** Tidak ada tombol finalisasi bulanan. Sel kosong berarti
  **belum dijadwalkan**, bukan libur. Perubahan dapat dilakukan kapan saja pada
  tanggal hari ini dan setelahnya; jadwal bulan lampau hanya dapat dikoreksi
  Super Admin.
- **Template & Impor.** Tombol **Template & Impor** mengunduh grid jadwal
  `user_id; nama; unit_kerja; 1..31` dalam **CSV** atau **XLSX** (sheet Jadwal
  dan Petunjuk). File berisi jadwal yang sudah ada, hanya pegawai shift pada unit
  tersebut, dan hanya tanggal yang boleh diubah menurut peran. Setelah diisi,
  file dipilih kembali untuk **preview** perubahan sebelum impor. Sel kosong atau
  `LIBUR` berarti jadwal dihapus. Impor bersifat **atomik**: satu kesalahan
  membatalkan seluruh perubahan. File dibaca di browser (maks. 2 MB) dan tidak
  diunggah ke Storage; server tetap memvalidasi ulang unit, peran, pola kerja,
  shift, tanggal, dan duplikat melalui RPC `impor_jadwal_shift`.
  Pustaka XLSX dimuat hanya saat diperlukan; CSV tetap tanpa dependensi tambahan.
  Impor mengikuti batas tanggal peran: kepala ruangan boleh mengimpor tanggal
  hari ini dan setelahnya, tetapi bukan tanggal lampau. Pengeditan sel manual,
  **Isi Cepat**, dan **Salin Bulan Lalu** tetap tersedia tanpa harus mengimpor
  file.
- **Alfa otomatis** awalnya **nonaktif**. Isi *Alfa berlaku mulai*, aktifkan,
  lalu simpan. Alfa hanya dibuat untuk pegawai reguler pada hari kerja atau
  pegawai shift yang dijadwalkan, setelah jam kerja berakhir — bukan pada pukul
  03.00 — dan shift Malam diproses setelah pukul 07.30 keesokan harinya.
  Proses bersifat idempoten sehingga aman diulang. Jangan aktifkan Alfa sebelum
  jadwal bulan pertama lengkap dan hari libur terisi.
- Agar Alfa berjalan tanpa dibuka manual, aktifkan ekstensi **pg_cron** di
  Supabase lalu jalankan **`supabase/jadwal_alfa.sql`**. Cron memanggil
  `proses_alfa_otomatis()` setiap 15 menit. Tombol **Hari ini & kemarin** pada
  Pengaturan Presensi dapat dipakai untuk mengisi data yang terlewat.

**Alur verifikasi perangkat (tanpa SQL manual):**

1. Pegawai klik **Ajukan Verifikasi Perangkat** di dashboard.
2. Super Admin membuka **Verifikasi Perangkat → Menunggu**, lalu **Setujui**.
3. Satu pegawai hanya boleh punya satu perangkat aktif (`pending`/`approved`).
   Perangkat lain tidak dapat mengajukan verifikasi dan akan melihat pesan untuk
   menghubungi Admin IT.
4. Untuk mengganti perangkat, Super Admin menekan **Reset Perangkat** pada
   perangkat lama, lalu pegawai mengajukan dari perangkat baru.
5. Tombol absen pegawai terbuka pada perangkat yang disetujui.

> Migrasi 16 mengosongkan seluruh data perangkat karena masih data uji. Setelah
> migrasi dijalankan, semua pegawai harus mengajukan verifikasi ulang.

**Efek persetujuan Dinas & Sakit / Cuti:** baris presensi seluruh anggota grup pada
rentang tanggal tersebut dibuat atau ditandai sesuai jenis. Presensi yang sudah memiliki
jam masuk atau sudah dikoreksi Admin tidak ditimpa. Pembatalan oleh Super Admin menghapus
penanda otomatis tersebut.

**Aturan dokumen:** Sakit dan Dinas Luar **wajib** memiliki dokumen JPG/PNG maks. 1 MB
saat disimpan. Cuti boleh tanpa dokumen. Satu grup Dinas Luar memakai satu dokumen
bersama. Jika file Sakit/Dinas Luar hilang dari storage, persetujuan akan ditolak,
tetapi penolakan tetap dapat dilakukan. Cuti tetap dapat disetujui tanpa file. Kepala
ruangan tidak dapat menghapus dokumen yang masih tertaut ke pengajuan; file yatim
(upload gagal disimpan) tetap dapat dibersihkan.

## 8. Portal kepala ruangan & halaman pegawai

| Menu | Fungsi |
|---|---|
| **Absensi** (`/`) | Absen hadir/pulang dengan geofencing + device binding (akun kepala ruangan tetap absen seperti biasa) |
| **Jadwal Shift** (`/kepala-ruangan/jadwal-shift`) | Atur jadwal shift unit sendiri mulai hari ini, unduh/impor template CSV/XLSX; tanpa akses unit lain atau tanggal lampau |
| **Kepala Ruangan** (`/kepala-ruangan/dinas-sakit`, `/kepala-ruangan/cuti`) | Catat/ubah pengajuan unit sendiri; tanpa akses data pegawai di luar unit, rekap unit, atau persetujuan |
| **Dinas & Cuti** (`/izin-saya`) | Riwayat **baca-saja** Dinas, Sakit & Cuti milik sendiri + lihat dokumen |
| **Riwayat** (`/riwayat`) | Rekap & detail presensi bulanan milik sendiri |

Pegawai biasa **tidak dapat mengajukan sendiri**. Pencatatan dilakukan kepala ruangan
atau Super Admin; persetujuan hanya oleh Super Admin. Kepala ruangan dapat mencatat
cuti/sakit/dinas untuk dirinya sendiri, tetapi tetap harus disetujui Super Admin.

**Perubahan data pegawai:** Super Admin dapat memperbarui nama, unit kerja, pola
kerja (Reguler/Shift), dan status **Kepala Ruangan** melalui menu **Data Pegawai**.
Akun Super Admin tidak ditampilkan. Jika unit yang dipilih sudah memiliki kepala
ruangan, status kepala lama otomatis dipindahkan ke pegawai yang dipilih.
Promosi/penurunan role Super Admin tetap hanya melalui SQL oleh Admin IT.

## 9. Catatan penting

- **Deteksi Fake GPS bersifat heuristik.** `coords.isMocked` hanya tersedia di Chrome Android;
  iOS/Safari tidak melaporkannya. Validasi server tetap dijalankan, namun tidak ada
  aplikasi web murni yang 100% kebal manipulasi GPS. Pertahanan terbaik dicapai lewat
  kombinasi device binding + validasi server + audit trail.
- **Koordinat pusat** diatur di `src/config/constants.js` **dan** `supabase/schema.sql`
  (fungsi `submit_presensi`). Jika titik pusat berubah, ubah **keduanya**.
- **Timezone** "hari ini" dan perhitungan jadwal memakai `Asia/Makassar` (WITA).
- **Jangan mengaktifkan Alfa otomatis** sebelum jadwal shift bulan pertama
  lengkap dan hari libur terisi. Mode transisi sudah dihapus; jadwal kosong bukan
  alasan untuk membuka absen.
- **Tidak ada finalisasi jadwal.** Sel kosong berarti belum dijadwalkan, bukan
  libur. Perubahan jadwal hari ini dan setelahnya dapat dilakukan kapan saja;
  tanggal lampau hanya dapat dikoreksi Super Admin.
- **Rename grup** mengubah `unit_kerja` pegawai melalui `ON UPDATE CASCADE`; data
  jadwal, presensi, dan pengajuan tetap utuh.
- `dist/` dan `.env` sudah masuk `.gitignore`.

## 10. Deploy produksi (GitHub Pages)

Aplikasi ini SPA Vite dan dipublikasikan lewat **GitHub Actions** ke GitHub Pages
dengan base path `/PRESISI-AMI/`.

**A. Aktifkan GitHub Pages**

1. Buka repository → **Settings → Pages**.
2. Pada **Build and deployment → Source**, pilih **GitHub Actions**.
3. Buka **Settings → Secrets and variables → Actions → New repository secret**,
   lalu tambahkan:

   | Nama | Nilai |
   |---|---|
   | `VITE_SUPABASE_URL` | URL project Supabase |
   | `VITE_SUPABASE_ANON_KEY` | anon/public key Supabase |

   Ambil di **Supabase → Project Settings → API**. Gunakan anon/public key,
   **bukan** `service_role`.
4. Push ke branch `main`. Workflow `.github/workflows/deploy.yml` akan
   menjalankan `npm ci`, build, lalu deploy otomatis.
5. URL aplikasi: `https://rantemario905-source.github.io/PRESISI-AMI/`.

**B. Hubungkan Supabase Auth**

- **Authentication → URL Configuration → Site URL:**
  `https://rantemario905-source.github.io/PRESISI-AMI/`
- **Redirect URLs:** tambahkan
  `https://rantemario905-source.github.io/PRESISI-AMI/**` dan
  `http://localhost:5173/**` untuk pengembangan.

**C. Catatan GitHub Pages**

- Workflow menyalin `dist/index.html` menjadi `dist/404.html` dan menambahkan
  `.nojekyll`, sehingga rute seperti `/riwayat` atau `/superadmin-portal` tetap
  terbuka saat di-refresh.
- Base path diatur lewat `VITE_BASE_PATH` di workflow. Untuk local dev, base
  tetap `/`.
- Bila kelak memakai **custom domain**, ubah `VITE_BASE_PATH` menjadi `/` agar
  aset tidak mencari folder `/PRESISI-AMI/`.
- GPS hanya berjalan di **HTTPS**; GitHub Pages sudah menyediakannya.

**D. Vercel (opsional)**

`vercel.json` tetap disimpan sebagai alternatif. Import repo di Vercel, isi dua
environment variable yang sama, lalu deploy.

**Membersihkan data uji sebelum go-live:** jalankan `supabase/cleanup_data_uji.sql`
di SQL Editor. Skrip ini menghapus presensi, izin, koreksi, jadwal, dan perangkat,
tetapi mempertahankan akun, unit kerja, master shift,
hari libur, serta pengaturan presensi.
