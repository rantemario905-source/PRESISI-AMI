-- ==========================================================================
-- 27 - JAM KERJA REGULER PER UNIT
-- Syarat: 01 s.d. 26 sudah dijalankan.
--
-- Ringkasan:
--   Menambahkan override jam kerja reguler per unit. Unit yang tidak memiliki
--   override tetap memakai jam kerja global (jam_kerja_reguler). Shift tidak
--   terpengaruh karena shift memakai shift_master/jadwal_shift.
--
--   Contoh: unit ADMISI RAWAT JALAN bekerja Senin-Jumat 07.00-15.00 dan
--   libur Sabtu-Minggu.
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.pegawai') is null
     or to_regclass('public.jam_kerja_reguler') is null
     or to_regclass('public.grup_shift') is null then
    raise exception 'Tabel inti tidak ditemukan. Jalankan migrasi 01-26 pada project Supabase yang benar.';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 1. Tabel override jam kerja per unit
-- --------------------------------------------------------------------------

create table if not exists public.jam_kerja_unit (
  unit_kerja   text not null references public.grup_shift (nama)
               on update cascade on delete cascade,
  hari         integer not null check (hari between 1 and 7),
  jam_mulai    time,
  jam_selesai  time,
  libur        boolean not null default false,
  primary key (unit_kerja, hari),
  constraint jam_kerja_unit_jam_check check (
    libur
    or (jam_mulai is not null and jam_selesai is not null and jam_mulai < jam_selesai)
  )
);

alter table public.jam_kerja_unit enable row level security;
drop policy if exists "jam_kerja_unit_baca" on public.jam_kerja_unit;
create policy "jam_kerja_unit_baca" on public.jam_kerja_unit
  for select to authenticated
  using (true);

-- Hanya Super Admin yang boleh mengubah; RLS tetap menjadi pengaman utama.
drop policy if exists "jam_kerja_unit_kelola_admin" on public.jam_kerja_unit;
create policy "jam_kerja_unit_kelola_admin" on public.jam_kerja_unit
  for all to authenticated
  using (public.is_superadmin())
  with check (public.is_superadmin());

revoke all on table public.jam_kerja_unit from anon, authenticated;
grant select, insert, update, delete on table public.jam_kerja_unit to authenticated;

-- Seed awal bila unit sudah ada. Tidak menimpa pengaturan yang sudah diubah.
do $$
begin
  if exists (
    select 1 from public.grup_shift where nama = 'ADMISI RAWAT JALAN'
  ) then
    insert into public.jam_kerja_unit (unit_kerja, hari, jam_mulai, jam_selesai, libur)
    values
      ('ADMISI RAWAT JALAN', 1, time '07:00', time '15:00', false),
      ('ADMISI RAWAT JALAN', 2, time '07:00', time '15:00', false),
      ('ADMISI RAWAT JALAN', 3, time '07:00', time '15:00', false),
      ('ADMISI RAWAT JALAN', 4, time '07:00', time '15:00', false),
      ('ADMISI RAWAT JALAN', 5, time '07:00', time '15:00', false),
      ('ADMISI RAWAT JALAN', 6, null, null, true),
      ('ADMISI RAWAT JALAN', 7, null, null, true)
    on conflict (unit_kerja, hari) do nothing;
  end if;
end;
$$;

-- Unit ini bekerja reguler tanpa shift. Pastikan seluruh pegawainya memakai
-- pola Reguler agar override jam kerja di atas benar-benar berlaku.
update public.pegawai
   set pola_kerja = 'reguler'
 where unit_kerja = 'ADMISI RAWAT JALAN'
   and role = 'pegawai'
   and pola_kerja is distinct from 'reguler';

-- --------------------------------------------------------------------------
-- 2. Alfa otomatis: gunakan override unit bila ada
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
      select p.id as user_id,
             coalesce(u.jam_mulai, j.jam_mulai) as jam_mulai,
             coalesce(u.jam_selesai, j.jam_selesai) as jam_selesai
        from public.pegawai p
        join public.jam_kerja_reguler j
          on j.hari = extract(isodow from v_target)::int
        left join public.jam_kerja_unit u
          on u.unit_kerja = p.unit_kerja
         and u.hari = extract(isodow from v_target)::int
       where p.role = 'pegawai'
         and p.pola_kerja = 'reguler'
         and not coalesce(u.libur, j.libur)
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

-- --------------------------------------------------------------------------
-- 3. Jadwal kerja: override reguler per unit
-- --------------------------------------------------------------------------

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
  v_unit text;
  v_isodow int;
  v_jam public.jam_kerja_reguler%rowtype;
  v_override public.jam_kerja_unit%rowtype;
  v_ada_jam boolean := false;
  v_pakai_override boolean := false;
  v_shift public.jadwal_shift%rowtype;
  v_master public.shift_master%rowtype;
  v_libur text;
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

  select p.pola_kerja, p.unit_kerja into v_pola, v_unit
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

  if v_pola = 'reguler' then
    select * into v_jam
      from public.jam_kerja_reguler j
     where j.hari = v_isodow;
    v_ada_jam := found;

    select * into v_override
      from public.jam_kerja_unit u
     where u.unit_kerja = v_unit
       and u.hari = v_isodow;

    if found then
      v_jam.jam_mulai := v_override.jam_mulai;
      v_jam.jam_selesai := v_override.jam_selesai;
      v_jam.libur := v_override.libur;
      v_ada_jam := true;
      v_pakai_override := true;
    end if;

    if not v_ada_jam then
      v_terjadwal := false;
      v_weekly_libur := true;
      v_alasan := 'tidak_ada_aturan';
      v_boleh := false;
      v_pesan := 'Aturan jam kerja reguler belum tersedia. Hubungi Admin IT.';
    elsif v_jam.libur then
      v_terjadwal := false;
      v_weekly_libur := true;
      v_alasan := case when v_pakai_override then 'libur_jadwal' else 'akhir_pekan' end;
      v_boleh := false;
      v_pesan := case
        when v_pakai_override then 'Hari ini libur menurut jam kerja unit. Absensi tidak diperlukan.'
        else 'Akhir pekan adalah hari libur. Absensi tidak diperlukan.'
      end;
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
        v_boleh := false;
        v_pesan := 'Anda belum dijadwalkan shift hari ini. Hubungi Kepala Ruangan/Super Admin.';
      end if;
    end if;
  end if;

  user_id := p_user;
  tanggal := p_tanggal;
  pola_kerja := v_pola;
  terjadwal := v_terjadwal;
  libur := v_weekly_libur
    or (not v_terjadwal and v_alasan in ('hari_libur', 'akhir_pekan', 'tidak_ada_aturan', 'libur_jadwal'));
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

commit;
