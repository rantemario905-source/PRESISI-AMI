-- ==========================================================================
-- 12 — POLA KERJA, GRUP SHIFT, HARI LIBUR, TERLAMBAT & ALFA OTOMATIS
-- Syarat: 01 s.d. 11 sudah dijalankan.
--
-- Ringkasan:
--   1. Setiap pegawai memiliki pola kerja: shift (default) atau reguler.
--   2. Grup shift memakai master tersendiri sehingga grup kosong tetap bisa
--      dibuat dan rename grup otomatis memperbarui unit pegawai (FK cascade).
--   3. Jam kerja reguler: Senin–Kamis 08.00–16.30, Jumat 08.00–16.00,
--      Sabtu–Minggu libur. Hari libur nasional/cuti bersama diinput manual.
--   4. Presensi reguler dikunci pada akhir pekan/hari libur. Pegawai shift
--      hanya boleh absen bila dijadwalkan, kecuali mode transisi diaktifkan.
--   5. Keterlambatan dihitung tanpa toleransi; 08.00.01 = 1 menit.
--   6. Alfa otomatis dibuat setelah jam kerja berakhir (bukan jam tetap).
--
-- CATATAN: butir 4 (mode transisi) dihapus oleh migrasi 13. Jalankan 13
-- setelah file ini agar jadwal shift wajib berlaku penuh.
-- ==========================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. Master grup shift & seksi
-- --------------------------------------------------------------------------

create table if not exists public.grup_shift (
  nama           text primary key,
  seksi          text not null default 'Belum ditentukan',
  dibuat_pada    timestamptz not null default now(),
  diperbarui_pada timestamptz not null default now(),
  constraint grup_shift_nama_check check (length(trim(nama)) >= 2),
  constraint grup_shift_seksi_check check (length(trim(seksi)) >= 2)
);

-- Rapikan nilai unit lama sebelum dipasang foreign key.
update public.pegawai
   set unit_kerja = trim(unit_kerja)
 where unit_kerja is not null
   and unit_kerja <> trim(unit_kerja);

update public.pegawai
   set unit_kerja = 'Belum ditentukan'
 where unit_kerja is null or length(trim(unit_kerja)) < 2;

insert into public.grup_shift (nama, seksi)
select distinct p.unit_kerja, 'Belum ditentukan'
  from public.pegawai p
 where p.unit_kerja is not null
   and length(trim(p.unit_kerja)) >= 2
on conflict (nama) do nothing;

insert into public.grup_shift (nama, seksi)
values ('Belum ditentukan', 'Belum ditentukan')
on conflict (nama) do nothing;

alter table public.pegawai drop constraint if exists pegawai_unit_kerja_fkey;
alter table public.pegawai
  add constraint pegawai_unit_kerja_fkey
  foreign key (unit_kerja) references public.grup_shift (nama)
  on update cascade on delete restrict not valid;
alter table public.pegawai validate constraint pegawai_unit_kerja_fkey;

create index if not exists idx_grup_shift_seksi on public.grup_shift (seksi, nama);

alter table public.grup_shift enable row level security;
drop policy if exists "grup_shift_baca" on public.grup_shift;
create policy "grup_shift_baca" on public.grup_shift
  for select to authenticated
  using (true);

revoke all on table public.grup_shift from anon, authenticated;
grant select on table public.grup_shift to authenticated;

-- --------------------------------------------------------------------------
-- 2. Pola kerja pegawai
-- --------------------------------------------------------------------------

alter table public.pegawai
  add column if not exists pola_kerja text not null default 'shift';

alter table public.pegawai drop constraint if exists pegawai_pola_kerja_check;
alter table public.pegawai
  add constraint pegawai_pola_kerja_check
  check (pola_kerja in ('shift', 'reguler')) not valid;
alter table public.pegawai validate constraint pegawai_pola_kerja_check;

create index if not exists idx_pegawai_pola_kerja on public.pegawai (pola_kerja);

-- --------------------------------------------------------------------------
-- 3. Jam kerja reguler & hari libur
-- --------------------------------------------------------------------------

create table if not exists public.jam_kerja_reguler (
  hari        integer primary key check (hari between 1 and 7),
  jam_mulai   time,
  jam_selesai time,
  libur       boolean not null default false,
  constraint jam_kerja_reguler_jam_check check (
    libur
    or (jam_mulai is not null and jam_selesai is not null and jam_mulai < jam_selesai)
  )
);

insert into public.jam_kerja_reguler (hari, jam_mulai, jam_selesai, libur)
values
  (1, time '08:00', time '16:30', false),
  (2, time '08:00', time '16:30', false),
  (3, time '08:00', time '16:30', false),
  (4, time '08:00', time '16:30', false),
  (5, time '08:00', time '16:00', false),
  (6, null, null, true),
  (7, null, null, true)
on conflict (hari) do update
  set jam_mulai = excluded.jam_mulai,
      jam_selesai = excluded.jam_selesai,
      libur = excluded.libur;

alter table public.jam_kerja_reguler enable row level security;
drop policy if exists "jam_kerja_reguler_baca" on public.jam_kerja_reguler;
create policy "jam_kerja_reguler_baca" on public.jam_kerja_reguler
  for select to authenticated
  using (true);

revoke all on table public.jam_kerja_reguler from anon, authenticated;
grant select on table public.jam_kerja_reguler to authenticated;

create table if not exists public.hari_libur (
  tanggal      date primary key,
  nama         text not null,
  dibuat_oleh  uuid references public.pegawai (id) on delete set null,
  dibuat_pada  timestamptz not null default now(),
  constraint hari_libur_nama_check check (length(trim(nama)) >= 2)
);

create index if not exists idx_hari_libur_tanggal on public.hari_libur (tanggal);

alter table public.hari_libur enable row level security;
drop policy if exists "hari_libur_baca" on public.hari_libur;
create policy "hari_libur_baca" on public.hari_libur
  for select to authenticated
  using (true);

revoke all on table public.hari_libur from anon, authenticated;
grant select on table public.hari_libur to authenticated;

-- --------------------------------------------------------------------------
-- 4. Pengaturan presensi (mode transisi & Alfa)
-- --------------------------------------------------------------------------

create table if not exists public.pengaturan_presensi (
  id                        integer primary key default 1 check (id = 1),
  kunci_shift_tanpa_jadwal  boolean not null default false,
  alfa_otomatis             boolean not null default false,
  alfa_mulai                date,
  diperbarui_pada           timestamptz not null default now(),
  diperbarui_oleh           uuid references public.pegawai (id) on delete set null
);

insert into public.pengaturan_presensi (id)
values (1)
on conflict (id) do nothing;

alter table public.pengaturan_presensi enable row level security;
drop policy if exists "pengaturan_presensi_baca" on public.pengaturan_presensi;
create policy "pengaturan_presensi_baca" on public.pengaturan_presensi
  for select to authenticated
  using (true);

revoke all on table public.pengaturan_presensi from anon, authenticated;
grant select on table public.pengaturan_presensi to authenticated;

-- --------------------------------------------------------------------------
-- 5. Kolom keterlambatan
-- --------------------------------------------------------------------------

alter table public.presensi
  add column if not exists menit_terlambat integer not null default 0;

alter table public.presensi drop constraint if exists presensi_menit_terlambat_check;
alter table public.presensi
  add constraint presensi_menit_terlambat_check
  check (menit_terlambat >= 0) not valid;
alter table public.presensi validate constraint presensi_menit_terlambat_check;

create index if not exists idx_presensi_open
  on public.presensi (user_id, tanggal desc)
  where jam_masuk is not null and jam_pulang is null;

-- --------------------------------------------------------------------------
-- 6. Helper waktu & jadwal kerja
-- --------------------------------------------------------------------------

create or replace function public.waktu_wita(p_tanggal date, p_jam time)
returns timestamptz
language sql immutable
set search_path = public
as $$
  select ((p_tanggal + p_jam) at time zone 'Asia/Makassar');
$$;

create or replace function public.jadwal_kerja(
  p_user uuid default auth.uid(),
  p_tanggal date default ((now() at time zone 'Asia/Makassar')::date)
) returns table (
  user_id uuid,
  tanggal date,
  pola_kerja text,
  terjadwal boolean,
  libur boolean,
  nama_shift text,
  jam_mulai time,
  jam_selesai time,
  shift_id uuid,
  nama_hari_libur text,
  alasan text,
  boleh_absen boolean,
  pesan_jadwal text
)
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_pola text;
  v_isodow int;
  v_jam public.jam_kerja_reguler%rowtype;
  v_shift public.jadwal_shift%rowtype;
  v_master public.shift_master%rowtype;
  v_libur text;
  v_kunci boolean := false;
  v_terjadwal boolean := false;
  v_weekly_libur boolean := false;
  v_alasan text := null;
  v_boleh boolean := false;
  v_pesan text := null;
  v_nama_shift text := null;
  v_mulai time := null;
  v_selesai time := null;
begin
  if p_user is null then
    raise exception 'Pegawai tidak valid.';
  end if;

  if auth.uid() is not null
     and p_user <> auth.uid()
     and not public.is_superadmin() then
    if not exists (
      select 1
        from public.pegawai saya
        join public.pegawai target on target.id = p_user
       where saya.id = auth.uid()
         and saya.kepala_ruangan
         and saya.unit_kerja = target.unit_kerja
    ) then
      raise exception 'Anda tidak berhak melihat jadwal pegawai ini.';
    end if;
  end if;

  select p.pola_kerja into v_pola
    from public.pegawai p
   where p.id = p_user;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;

  v_pola := coalesce(v_pola, 'shift');
  v_isodow := extract(isodow from p_tanggal)::int;

  select h.nama into v_libur
    from public.hari_libur h
   where h.tanggal = p_tanggal;

  select coalesce(k.kunci_shift_tanpa_jadwal, false) into v_kunci
    from public.pengaturan_presensi k
   where k.id = 1;

  if v_pola = 'reguler' then
    select * into v_jam
      from public.jam_kerja_reguler j
     where j.hari = v_isodow;

    if not found then
      v_terjadwal := false;
      v_weekly_libur := true;
      v_alasan := 'tidak_ada_aturan';
      v_boleh := false;
      v_pesan := 'Aturan jam kerja reguler belum tersedia. Hubungi Admin IT.';
    elsif v_jam.libur then
      v_terjadwal := false;
      v_weekly_libur := true;
      v_alasan := 'akhir_pekan';
      v_boleh := false;
      v_pesan := 'Akhir pekan adalah hari libur. Absensi tidak diperlukan.';
    elsif v_libur is not null then
      v_terjadwal := false;
      v_weekly_libur := false;
      v_alasan := 'hari_libur';
      v_boleh := false;
      v_pesan := 'Hari libur: ' || v_libur || '. Absensi tidak diperlukan.';
    else
      v_terjadwal := true;
      v_weekly_libur := false;
      v_alasan := null;
      v_nama_shift := 'Reguler';
      v_mulai := v_jam.jam_mulai;
      v_selesai := v_jam.jam_selesai;
      v_boleh := true;
      v_pesan := null;
    end if;
  else
    select js.* into v_shift
      from public.jadwal_shift js
     where js.user_id = p_user
       and js.tanggal = p_tanggal;

    if found then
      select sm.* into v_master
        from public.shift_master sm
       where sm.id = v_shift.shift_id;

      if found then
        v_terjadwal := true;
        v_weekly_libur := false;
        v_alasan := null;
        v_nama_shift := v_master.nama_shift;
        v_mulai := v_master.jam_mulai;
        v_selesai := v_master.jam_selesai;
        v_boleh := true;
      else
        v_terjadwal := false;
        v_alasan := 'belum_dijadwalkan';
        v_boleh := false;
        v_pesan := 'Shift pada jadwal tidak ditemukan. Hubungi Admin IT.';
      end if;
    else
      v_terjadwal := false;
      v_weekly_libur := false;
      if v_libur is not null then
        v_alasan := 'hari_libur';
        v_boleh := false;
        v_pesan := 'Hari libur: ' || v_libur || '. Anda tidak dijadwalkan shift.';
      else
        v_alasan := 'belum_dijadwalkan';
        v_boleh := not v_kunci;
        if v_kunci then
          v_pesan := 'Anda belum dijadwalkan shift hari ini. Hubungi Kepala Ruangan/Super Admin.';
        else
          v_pesan := 'Anda belum dijadwalkan shift hari ini. Mode transisi masih mengizinkan absensi.';
        end if;
      end if;
    end if;
  end if;

  user_id := p_user;
  tanggal := p_tanggal;
  pola_kerja := v_pola;
  terjadwal := v_terjadwal;
  libur := v_weekly_libur
    or (not v_terjadwal and v_alasan in ('hari_libur', 'akhir_pekan', 'tidak_ada_aturan'));
  nama_shift := v_nama_shift;
  jam_mulai := v_mulai;
  jam_selesai := v_selesai;
  shift_id := case when v_pola = 'shift' and v_terjadwal then v_shift.shift_id else null end;
  nama_hari_libur := v_libur;
  alasan := v_alasan;
  boleh_absen := v_boleh;
  pesan_jadwal := v_pesan;
  return next;
end;
$$;

revoke execute on function public.jadwal_kerja(uuid, date) from public, anon;
grant execute on function public.jadwal_kerja(uuid, date) to authenticated;

create or replace function public.hitung_menit_terlambat(
  p_user uuid,
  p_tanggal date,
  p_waktu timestamptz
) returns integer
language plpgsql stable security definer
set search_path = public
as $$
declare
  v_jadwal record;
  v_mulai timestamptz;
  v_menit integer;
begin
  if p_waktu is null then
    return 0;
  end if;

  select * into v_jadwal
    from public.jadwal_kerja(p_user, p_tanggal);

  if not found
     or not coalesce(v_jadwal.terjadwal, false)
     or v_jadwal.jam_mulai is null then
    return 0;
  end if;

  v_mulai := public.waktu_wita(p_tanggal, v_jadwal.jam_mulai);
  if p_waktu <= v_mulai then
    return 0;
  end if;

  v_menit := ceil(extract(epoch from (p_waktu - v_mulai)) / 60.0)::int;
  return greatest(v_menit, 0);
end;
$$;

revoke execute on function public.hitung_menit_terlambat(uuid, date, timestamptz) from public, anon;
grant execute on function public.hitung_menit_terlambat(uuid, date, timestamptz) to authenticated;

-- --------------------------------------------------------------------------
-- 7. Trigger akun baru: pastikan grup tujuan selalu ada
-- --------------------------------------------------------------------------

create or replace function public.handle_new_pegawai()
returns trigger
language plpgsql security definer
set search_path = public
as $$
declare
  v_unit text;
begin
  v_unit := trim(coalesce(new.raw_user_meta_data ->> 'unit_kerja', 'Belum ditentukan'));
  if length(v_unit) < 2 then
    v_unit := 'Belum ditentukan';
  end if;

  insert into public.grup_shift (nama, seksi)
  values (v_unit, 'Belum ditentukan')
  on conflict (nama) do nothing;

  insert into public.pegawai (id, nama, unit_kerja, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nama', split_part(coalesce(new.email, 'Pegawai'), '@', 1)),
    v_unit,
    'pegawai'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- --------------------------------------------------------------------------
-- 8. RPC grup shift
-- --------------------------------------------------------------------------

create or replace function public.tambah_grup_shift(
  p_nama text,
  p_seksi text default 'Belum ditentukan'
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_nama text;
  v_seksi text;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menambah grup shift.';
  end if;

  v_nama := trim(coalesce(p_nama, ''));
  v_seksi := coalesce(nullif(trim(p_seksi), ''), 'Belum ditentukan');

  if length(v_nama) < 2 then
    raise exception 'Nama grup shift wajib diisi (minimal 2 karakter).';
  end if;
  if length(v_seksi) < 2 then
    raise exception 'Seksi wajib dipilih.';
  end if;
  if exists (select 1 from public.grup_shift g where lower(g.nama) = lower(v_nama)) then
    raise exception 'Nama grup shift "%" sudah digunakan.', v_nama;
  end if;

  insert into public.grup_shift (nama, seksi)
  values (v_nama, v_seksi);

  return jsonb_build_object('status', 'ok', 'nama', v_nama, 'seksi', v_seksi);
end;
$$;

revoke execute on function public.tambah_grup_shift(text, text) from public, anon;
grant execute on function public.tambah_grup_shift(text, text) to authenticated;

create or replace function public.ubah_grup_shift(
  p_nama_lama text,
  p_nama_baru text,
  p_seksi text default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama text;
  v_baru text;
  v_seksi text;
  v_jumlah integer;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengubah grup shift.';
  end if;

  v_lama := trim(coalesce(p_nama_lama, ''));
  v_baru := trim(coalesce(p_nama_baru, ''));

  if length(v_lama) < 2 or length(v_baru) < 2 then
    raise exception 'Nama grup shift lama dan baru wajib diisi.';
  end if;

  perform pg_advisory_xact_lock(hashtext('presisi-grup-' || v_lama));

  select g.seksi into v_seksi
    from public.grup_shift g
   where g.nama = v_lama
   for update;

  if not found then
    raise exception 'Grup shift "%" tidak ditemukan.', v_lama;
  end if;

  v_seksi := coalesce(nullif(trim(p_seksi), ''), v_seksi);
  if length(v_seksi) < 2 then
    raise exception 'Seksi wajib dipilih.';
  end if;

  if v_baru <> v_lama
     and exists (select 1 from public.grup_shift g where lower(g.nama) = lower(v_baru)) then
    raise exception 'Nama grup shift "%" sudah digunakan.', v_baru;
  end if;

  update public.grup_shift
     set nama = v_baru,
         seksi = v_seksi,
         diperbarui_pada = now()
   where nama = v_lama;

  select count(*)::int into v_jumlah
    from public.pegawai p
   where p.unit_kerja = v_baru;

  return jsonb_build_object(
    'status', 'ok',
    'nama_lama', v_lama,
    'nama_baru', v_baru,
    'seksi', v_seksi,
    'jumlah_pegawai', v_jumlah,
    'pesan', 'Grup shift dan unit kerja pegawai berhasil diperbarui.'
  );
end;
$$;

revoke execute on function public.ubah_grup_shift(text, text, text) from public, anon;
grant execute on function public.ubah_grup_shift(text, text, text) to authenticated;

create or replace function public.hapus_grup_shift(p_nama text)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_nama text;
  v_jumlah integer;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menghapus grup shift.';
  end if;

  v_nama := trim(coalesce(p_nama, ''));
  if v_nama = 'Belum ditentukan' then
    raise exception 'Grup "Belum ditentukan" tidak dapat dihapus.';
  end if;

  select count(*)::int into v_jumlah
    from public.pegawai p
   where p.unit_kerja = v_nama;

  if v_jumlah > 0 then
    raise exception 'Grup "%" masih memiliki % pegawai. Pindahkan pegawai terlebih dahulu.', v_nama, v_jumlah;
  end if;

  delete from public.grup_shift where nama = v_nama;
  if not found then
    raise exception 'Grup shift "%" tidak ditemukan.', v_nama;
  end if;

  return jsonb_build_object('status', 'ok', 'pesan', 'Grup shift dihapus.');
end;
$$;

revoke execute on function public.hapus_grup_shift(text) from public, anon;
grant execute on function public.hapus_grup_shift(text) to authenticated;

-- --------------------------------------------------------------------------
-- 9. RPC hari libur & pengaturan
-- --------------------------------------------------------------------------

create or replace function public.tambah_hari_libur(
  p_tanggal date,
  p_nama text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_nama text;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengatur hari libur.';
  end if;
  if p_tanggal is null then
    raise exception 'Tanggal libur wajib diisi.';
  end if;

  v_nama := trim(coalesce(p_nama, ''));
  if length(v_nama) < 2 then
    raise exception 'Nama hari libur wajib diisi (minimal 2 karakter).';
  end if;

  insert into public.hari_libur (tanggal, nama, dibuat_oleh)
  values (p_tanggal, v_nama, auth.uid())
  on conflict (tanggal) do update
    set nama = excluded.nama,
        dibuat_oleh = excluded.dibuat_oleh,
        dibuat_pada = now();

  return jsonb_build_object('status', 'ok', 'tanggal', p_tanggal, 'nama', v_nama);
end;
$$;

revoke execute on function public.tambah_hari_libur(date, text) from public, anon;
grant execute on function public.tambah_hari_libur(date, text) to authenticated;

create or replace function public.hapus_hari_libur(p_tanggal date)
returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menghapus hari libur.';
  end if;

  delete from public.hari_libur where tanggal = p_tanggal;
  if not found then
    raise exception 'Hari libur pada tanggal tersebut tidak ditemukan.';
  end if;

  return jsonb_build_object('status', 'ok', 'pesan', 'Hari libur dihapus.');
end;
$$;

revoke execute on function public.hapus_hari_libur(date) from public, anon;
grant execute on function public.hapus_hari_libur(date) to authenticated;

create or replace function public.simpan_pengaturan_presensi(
  p_kunci_shift_tanpa_jadwal boolean,
  p_alfa_otomatis boolean,
  p_alfa_mulai date default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengubah pengaturan presensi.';
  end if;

  update public.pengaturan_presensi
     set kunci_shift_tanpa_jadwal = coalesce(p_kunci_shift_tanpa_jadwal, false),
         alfa_otomatis = coalesce(p_alfa_otomatis, false),
         alfa_mulai = p_alfa_mulai,
         diperbarui_pada = now(),
         diperbarui_oleh = auth.uid()
   where id = 1;

  return jsonb_build_object(
    'status', 'ok',
    'kunci_shift_tanpa_jadwal', coalesce(p_kunci_shift_tanpa_jadwal, false),
    'alfa_otomatis', coalesce(p_alfa_otomatis, false),
    'alfa_mulai', p_alfa_mulai
  );
end;
$$;

revoke execute on function public.simpan_pengaturan_presensi(boolean, boolean, date) from public, anon;
grant execute on function public.simpan_pengaturan_presensi(boolean, boolean, date) to authenticated;

-- --------------------------------------------------------------------------
-- 10. RPC data pegawai: nama, unit, kepala, pola kerja
-- --------------------------------------------------------------------------

create or replace function public.perbarui_pegawai_dan_jadwal(
  p_id uuid,
  p_nama text,
  p_unit_kerja text,
  p_kepala_ruangan boolean,
  p_pola_kerja text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama public.pegawai%rowtype;
  v_unit text;
  v_kepala boolean;
  v_pola text;
  v_kepala_lama text;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengubah data pegawai.';
  end if;
  if p_id is null then
    raise exception 'ID pegawai tidak valid.';
  end if;
  if p_nama is null or length(trim(p_nama)) < 2 then
    raise exception 'Nama pegawai wajib diisi (minimal 2 karakter).';
  end if;
  if p_unit_kerja is null or length(trim(p_unit_kerja)) < 2 then
    raise exception 'Unit kerja wajib diisi (minimal 2 karakter).';
  end if;

  v_unit := trim(p_unit_kerja);
  v_kepala := coalesce(p_kepala_ruangan, false);

  perform pg_advisory_xact_lock(hashtext('presisi-kepala-' || v_unit));

  select * into v_lama
    from public.pegawai
   where id = p_id
   for update;

  if not found then
    raise exception 'Data pegawai tidak ditemukan.';
  end if;
  if v_lama.role <> 'pegawai' then
    raise exception 'Hanya akun pegawai yang dapat diubah dari menu ini.';
  end if;
  if not exists (select 1 from public.grup_shift g where g.nama = v_unit) then
    raise exception 'Grup shift "%" tidak ditemukan. Tambahkan grup terlebih dahulu.', v_unit;
  end if;

  v_pola := lower(trim(coalesce(nullif(p_pola_kerja, ''), v_lama.pola_kerja, 'shift')));
  if v_pola not in ('shift', 'reguler') then
    raise exception 'Pola kerja tidak valid. Pilih Shift atau Reguler.';
  end if;

  if v_kepala then
    select string_agg(nama, ', ' order by nama)
      into v_kepala_lama
      from public.pegawai
     where unit_kerja = v_unit
       and kepala_ruangan
       and id <> p_id;

    update public.pegawai
       set kepala_ruangan = false
     where unit_kerja = v_unit
       and kepala_ruangan
       and id <> p_id;
  end if;

  update public.pegawai
     set nama = trim(p_nama),
         unit_kerja = v_unit,
         kepala_ruangan = v_kepala,
         pola_kerja = v_pola
   where id = p_id;

  return jsonb_build_object(
    'status', 'ok',
    'kepala_ruangan', v_kepala,
    'kepala_sebelumnya', v_kepala_lama,
    'pola_kerja', v_pola,
    'pesan', 'Data pegawai berhasil diperbarui.'
  );
end;
$$;

revoke execute on function public.perbarui_pegawai_dan_jadwal(uuid, text, text, boolean, text) from public, anon;
grant execute on function public.perbarui_pegawai_dan_jadwal(uuid, text, text, boolean, text) to authenticated;

-- --------------------------------------------------------------------------
-- 11. Submit presensi: validasi jadwal, keterlambatan, checkout lintas hari
-- --------------------------------------------------------------------------

create or replace function public.submit_presensi(
  p_device_token text,
  p_tipe text,
  p_lat double precision,
  p_lng double precision,
  p_akurasi double precision,
  p_is_mocked boolean default false
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_hari date := (now() at time zone 'Asia/Makassar')::date;
  v_waktu timestamptz := now();
  v_status text;
  v_jarak double precision;
  v_row public.presensi%rowtype;
  v_jadwal record;
  v_jadwal_kemarin record;
  v_tanggal_kerja date := v_hari;
  v_mulai timestamptz;
  v_selesai timestamptz;
  v_menit integer := 0;
begin
  if v_user is null then
    raise exception 'Sesi Anda tidak valid. Silakan login kembali.';
  end if;
  if p_tipe not in ('masuk', 'pulang') then
    raise exception 'Jenis absensi tidak dikenal.';
  end if;

  -- Validasi perangkat
  select status into v_status
    from public.perangkat
   where user_id = v_user and device_token = p_device_token;

  if v_status is null then
    raise exception 'Perangkat ini belum terdaftar. Ajukan verifikasi perangkat terlebih dahulu.';
  end if;
  if v_status <> 'approved' then
    raise exception 'Perangkat Anda sedang menunggu persetujuan Admin IT. Tombol absen terkunci.';
  end if;

  -- Anti Fake GPS
  if coalesce(p_is_mocked, false) or p_akurasi is null or p_akurasi <= 0 then
    raise exception 'Terdeteksi menggunakan Fake GPS / Mock Location. Absensi dibatalkan.';
  end if;
  if p_akurasi > 50 then
    raise exception 'Akurasi GPS tidak wajar (% m). Coba lagi di ruang terbuka.', round(p_akurasi)::text;
  end if;

  select public.haversine(-0.23861315731059254, 117.41485548535888, p_lat, p_lng)
    into v_jarak;
  if v_jarak > 100 then
    raise exception 'Anda berada di luar radius 100 meter dari RSUD AMI. Jarak Anda saat ini % meter.',
      round(v_jarak)::text;
  end if;

  if p_tipe = 'masuk' then
    select * into v_jadwal from public.jadwal_kerja(v_user, v_hari);

    -- Shift malam yang dimulai kemarin masih berlangsung setelah tengah malam.
    if v_jadwal.pola_kerja = 'shift' and not v_jadwal.terjadwal then
      select * into v_jadwal_kemarin from public.jadwal_kerja(v_user, v_hari - 1);
      if v_jadwal_kemarin.pola_kerja = 'shift'
         and v_jadwal_kemarin.terjadwal
         and v_jadwal_kemarin.jam_mulai is not null
         and v_jadwal_kemarin.jam_selesai is not null
         and v_jadwal_kemarin.jam_selesai <= v_jadwal_kemarin.jam_mulai then
        v_selesai := public.waktu_wita(v_hari - 1, v_jadwal_kemarin.jam_selesai) + interval '1 day';
        if v_waktu <= v_selesai then
          v_tanggal_kerja := v_hari - 1;
          v_jadwal := v_jadwal_kemarin;
        end if;
      end if;
    end if;

    if not coalesce(v_jadwal.boleh_absen, false) then
      raise exception '%', coalesce(v_jadwal.pesan_jadwal, 'Anda tidak dijadwalkan untuk absensi hari ini.');
    end if;

    if coalesce(v_jadwal.terjadwal, false)
       and v_jadwal.jam_mulai is not null
       and v_jadwal.jam_selesai is not null then
      v_mulai := public.waktu_wita(v_tanggal_kerja, v_jadwal.jam_mulai);
      v_selesai := public.waktu_wita(v_tanggal_kerja, v_jadwal.jam_selesai);
      if v_jadwal.jam_selesai <= v_jadwal.jam_mulai then
        v_selesai := v_selesai + interval '1 day';
      end if;

      if v_waktu > v_selesai then
        raise exception 'Jam kerja Anda sudah berakhir. Absensi tidak dapat dilakukan.';
      end if;

      if v_waktu > v_mulai then
        v_menit := ceil(extract(epoch from (v_waktu - v_mulai)) / 60.0)::int;
      else
        v_menit := 0;
      end if;
    end if;

    select * into v_row
      from public.presensi
     where user_id = v_user and tanggal = v_tanggal_kerja
     for update;

    if found then
      if v_row.jam_masuk is not null then
        raise exception 'Anda sudah melakukan absen masuk pada hari kerja tersebut.';
      end if;
      if v_row.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar') then
        raise exception 'Anda tercatat % pada hari kerja tersebut. Absensi tidak dapat dilakukan.',
          v_row.status_kehadiran;
      end if;
      if v_row.status_kehadiran = 'Koreksi' or v_row.dikoreksi_oleh is not null then
        raise exception 'Presensi pada hari kerja tersebut sudah dikoreksi oleh Super Admin.';
      end if;

      update public.presensi
         set jam_masuk = v_waktu,
             lokasi_masuk = jsonb_build_object(
               'lat', p_lat,
               'lng', p_lng,
               'akurasi', round(p_akurasi::numeric, 1)
             ),
             jarak_masuk = round(v_jarak::numeric, 1),
             status_kehadiran = 'Hadir',
             menit_terlambat = v_menit,
             device_token = p_device_token
       where id = v_row.id
       returning * into v_row;
    else
      insert into public.presensi
        (user_id, tanggal, jam_masuk, lokasi_masuk, jarak_masuk,
         status_kehadiran, menit_terlambat, device_token)
      values
        (v_user, v_tanggal_kerja, v_waktu,
         jsonb_build_object(
           'lat', p_lat,
           'lng', p_lng,
           'akurasi', round(p_akurasi::numeric, 1)
         ),
         round(v_jarak::numeric, 1), 'Hadir', v_menit, p_device_token)
      returning * into v_row;
    end if;
  else
    -- Checkout: cari presensi terbuka hari ini atau shift malam kemarin.
    select * into v_row
      from public.presensi
     where user_id = v_user
       and jam_masuk is not null
       and jam_pulang is null
       and tanggal >= v_hari - 1
     order by tanggal desc
     limit 1
     for update;

    if not found then
      if exists (
        select 1 from public.presensi
         where user_id = v_user and tanggal = v_hari and jam_masuk is null
      ) then
        raise exception 'Anda belum melakukan absen masuk. Silakan absen hadir terlebih dahulu.';
      end if;
      raise exception 'Anda sudah melakukan absen pulang hari ini.';
    end if;

    update public.presensi
       set jam_pulang = v_waktu,
           lokasi_pulang = jsonb_build_object(
             'lat', p_lat,
             'lng', p_lng,
             'akurasi', round(p_akurasi::numeric, 1)
           ),
           jarak_pulang = round(v_jarak::numeric, 1)
     where id = v_row.id
     returning * into v_row;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'tipe', p_tipe,
    'tanggal', v_row.tanggal,
    'waktu', case when p_tipe = 'masuk' then v_row.jam_masuk else v_row.jam_pulang end,
    'jarak', round(v_jarak::numeric, 1),
    'menit_terlambat', coalesce(v_row.menit_terlambat, 0),
    'pesan', case
      when p_tipe = 'masuk' and coalesce(v_row.menit_terlambat, 0) > 0
        then 'Absen hadir berhasil dicatat. Terlambat ' || v_row.menit_terlambat || ' menit.'
      when p_tipe = 'masuk' then 'Absen hadir berhasil dicatat.'
      else 'Absen pulang berhasil dicatat.'
    end
  );
end;
$$;

revoke execute on function public.submit_presensi(text, text, double precision, double precision, double precision, boolean)
  from public, anon;
grant execute on function public.submit_presensi(text, text, double precision, double precision, double precision, boolean)
  to authenticated;

-- --------------------------------------------------------------------------
-- 12. Koreksi: hitung ulang keterlambatan
-- --------------------------------------------------------------------------

create or replace function public.koreksi_presensi(
  p_presensi_id uuid,
  p_jam_masuk timestamptz,
  p_jam_pulang timestamptz,
  p_status text,
  p_alasan text
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_lama public.presensi%rowtype;
  v_menit integer := 0;
begin
  if not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat mengoreksi presensi.';
  end if;
  if p_alasan is null or length(trim(p_alasan)) < 5 then
    raise exception 'Alasan koreksi wajib diisi (minimal 5 karakter).';
  end if;
  if p_status not in ('Hadir', 'Sakit', 'Cuti', 'Dinas Luar', 'Alfa', 'Koreksi') then
    raise exception 'Status kehadiran tidak valid.';
  end if;

  select * into v_lama from public.presensi where id = p_presensi_id;
  if not found then
    raise exception 'Data presensi tidak ditemukan.';
  end if;

  if p_status = 'Hadir' and p_jam_masuk is not null then
    v_menit := public.hitung_menit_terlambat(v_lama.user_id, v_lama.tanggal, p_jam_masuk);
  else
    v_menit := 0;
  end if;

  update public.presensi
     set jam_masuk = p_jam_masuk,
         jam_pulang = p_jam_pulang,
         status_kehadiran = p_status,
         menit_terlambat = v_menit,
         dikoreksi_oleh = auth.uid(),
         alasan_koreksi = trim(p_alasan)
   where id = p_presensi_id;

  insert into public.koreksi_presensi
    (presensi_id, admin_id, kolom_koreksi, nilai_lama, nilai_baru, alasan)
  values (
    p_presensi_id,
    auth.uid(),
    'jam_masuk,jam_pulang,status_kehadiran,menit_terlambat',
    jsonb_build_object(
      'jam_masuk', v_lama.jam_masuk,
      'jam_pulang', v_lama.jam_pulang,
      'status_kehadiran', v_lama.status_kehadiran,
      'menit_terlambat', v_lama.menit_terlambat
    ),
    jsonb_build_object(
      'jam_masuk', p_jam_masuk,
      'jam_pulang', p_jam_pulang,
      'status_kehadiran', p_status,
      'menit_terlambat', v_menit
    ),
    trim(p_alasan)
  );

  return jsonb_build_object(
    'status', 'ok',
    'menit_terlambat', v_menit,
    'pesan', 'Koreksi presensi tersimpan.'
  );
end;
$$;

revoke execute on function public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text) from public, anon;
grant execute on function public.koreksi_presensi(uuid, timestamptz, timestamptz, text, text) to authenticated;

-- --------------------------------------------------------------------------
-- 13. Alfa otomatis setelah jam kerja berakhir
-- --------------------------------------------------------------------------

create or replace function public.proses_alfa_otomatis(
  p_tanggal date default null
) returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_sekarang timestamptz := now();
  v_hari_ini date := (now() at time zone 'Asia/Makassar')::date;
  v_target date;
  v_aktif boolean := false;
  v_mulai date;
  v_row record;
  v_selesai timestamptz;
  v_baris integer;
  v_jumlah integer := 0;
begin
  if auth.uid() is not null and not public.is_superadmin() then
    raise exception 'Hanya Super Admin yang dapat menjalankan proses Alfa.';
  end if;

  select k.alfa_otomatis, k.alfa_mulai
    into v_aktif, v_mulai
    from public.pengaturan_presensi k
   where k.id = 1;

  if not coalesce(v_aktif, false) then
    return 0;
  end if;

  for v_target in
    select d
      from unnest(
        case
          when p_tanggal is null then array[v_hari_ini, v_hari_ini - 1]::date[]
          else array[p_tanggal]::date[]
        end
      ) as d
  loop
    if v_target > v_hari_ini then
      continue;
    end if;
    if v_mulai is not null and v_target < v_mulai then
      continue;
    end if;

    -- Pegawai reguler: hanya hari kerja dan bukan hari libur.
    for v_row in
      select p.id as user_id, j.jam_mulai, j.jam_selesai
        from public.pegawai p
        join public.jam_kerja_reguler j
          on j.hari = extract(isodow from v_target)::int
       where p.role = 'pegawai'
         and p.pola_kerja = 'reguler'
         and not j.libur
         and not exists (
           select 1 from public.hari_libur h where h.tanggal = v_target
         )
         and not exists (
           select 1
             from public.presensi pr
            where pr.user_id = p.id
              and pr.tanggal = v_target
              and (
                pr.jam_masuk is not null
                or pr.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar', 'Koreksi')
              )
         )
    loop
      v_selesai := public.waktu_wita(v_target, v_row.jam_selesai);
      if v_selesai <= v_sekarang then
        insert into public.presensi (user_id, tanggal, status_kehadiran)
        values (v_row.user_id, v_target, 'Alfa')
        on conflict (user_id, tanggal) do nothing;
        get diagnostics v_baris = row_count;
        v_jumlah := v_jumlah + v_baris;
      end if;
    end loop;

    -- Pegawai shift: hanya tanggal yang memiliki jadwal.
    for v_row in
      select p.id as user_id, js.tanggal, sm.jam_mulai, sm.jam_selesai
        from public.jadwal_shift js
        join public.pegawai p on p.id = js.user_id
        join public.shift_master sm on sm.id = js.shift_id
       where js.tanggal = v_target
         and p.role = 'pegawai'
         and p.pola_kerja = 'shift'
         and not exists (
           select 1
             from public.presensi pr
            where pr.user_id = js.user_id
              and pr.tanggal = js.tanggal
              and (
                pr.jam_masuk is not null
                or pr.status_kehadiran in ('Sakit', 'Cuti', 'Dinas Luar', 'Koreksi')
              )
         )
    loop
      v_selesai := public.waktu_wita(v_row.tanggal, v_row.jam_selesai);
      if v_row.jam_selesai <= v_row.jam_mulai then
        v_selesai := v_selesai + interval '1 day';
      end if;

      if v_selesai <= v_sekarang then
        insert into public.presensi (user_id, tanggal, status_kehadiran)
        values (v_row.user_id, v_row.tanggal, 'Alfa')
        on conflict (user_id, tanggal) do nothing;
        get diagnostics v_baris = row_count;
        v_jumlah := v_jumlah + v_baris;
      end if;
    end loop;
  end loop;

  return v_jumlah;
end;
$$;

revoke execute on function public.proses_alfa_otomatis(date) from public, anon;
grant execute on function public.proses_alfa_otomatis(date) to authenticated;

commit;
