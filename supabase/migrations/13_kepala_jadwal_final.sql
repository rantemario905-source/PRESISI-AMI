-- ==========================================================================
-- 13 — KEPALA RUANGAN KELOLA JADWAL, FINALISASI, & HAPUS MODE TRANSISI
-- Syarat: 12 sudah dijalankan.
--
-- Ringkasan:
--   1. Mode transisi dihapus permanen. Pegawai shift yang belum dijadwalkan
--      selalu ditolak saat absen; tidak ada pengaturan yang bisa membuka lagi.
--   2. Kepala ruangan boleh melihat dan mengelola jadwal shift unitnya sendiri.
--      Mereka hanya boleh menulis untuk tanggal besok dan seterusnya, hanya
--      untuk pegawai shift di unitnya, dan tidak boleh mengubah master shift.
--   3. Setiap perubahan jadwal dicatat: dibuat_oleh, diperbarui_oleh, waktu.
--   4. Finalisasi jadwal per unit/bulan. Setelah final, kepala ruangan tidak
--      dapat mengubah jadwal lagi; Super Admin tetap dapat mengubah dan
--      membuka finalisasi.
-- ==========================================================================

begin;

-- --------------------------------------------------------------------------
-- 1. Hapus mode transisi shift
-- --------------------------------------------------------------------------

alter table public.pengaturan_presensi
  drop column if exists kunci_shift_tanpa_jadwal;

-- Fungsi lama memakai tiga parameter; hapus agar tidak menjadi overload.
drop function if exists public.simpan_pengaturan_presensi(boolean, boolean, date);

create or replace function public.simpan_pengaturan_presensi(
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
     set alfa_otomatis = coalesce(p_alfa_otomatis, false),
         alfa_mulai = p_alfa_mulai,
         diperbarui_pada = now(),
         diperbarui_oleh = auth.uid()
   where id = 1;

  return jsonb_build_object(
    'status', 'ok',
    'alfa_otomatis', coalesce(p_alfa_otomatis, false),
    'alfa_mulai', p_alfa_mulai
  );
end;
$$;

revoke execute on function public.simpan_pengaturan_presensi(boolean, date) from public, anon;
grant execute on function public.simpan_pengaturan_presensi(boolean, date) to authenticated;

-- jadwal_kerja: shift tanpa jadwal SELALU terkunci.
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

-- --------------------------------------------------------------------------
-- 2. Audit jadwal shift
-- --------------------------------------------------------------------------

alter table public.jadwal_shift
  add column if not exists dibuat_oleh uuid,
  add column if not exists diperbarui_oleh uuid,
  add column if not exists dibuat_pada timestamptz not null default now(),
  add column if not exists diperbarui_pada timestamptz not null default now();

alter table public.jadwal_shift
  drop constraint if exists jadwal_shift_dibuat_oleh_fkey;
alter table public.jadwal_shift
  add constraint jadwal_shift_dibuat_oleh_fkey
  foreign key (dibuat_oleh) references public.pegawai (id) on delete set null not valid;
alter table public.jadwal_shift
  validate constraint jadwal_shift_dibuat_oleh_fkey;

alter table public.jadwal_shift
  drop constraint if exists jadwal_shift_diperbarui_oleh_fkey;
alter table public.jadwal_shift
  add constraint jadwal_shift_diperbarui_oleh_fkey
  foreign key (diperbarui_oleh) references public.pegawai (id) on delete set null not valid;
alter table public.jadwal_shift
  validate constraint jadwal_shift_diperbarui_oleh_fkey;

create or replace function public.set_audit_jadwal_shift()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.dibuat_oleh := auth.uid();
    new.dibuat_pada := now();
  else
    new.dibuat_oleh := old.dibuat_oleh;
    new.dibuat_pada := old.dibuat_pada;
  end if;
  new.diperbarui_oleh := auth.uid();
  new.diperbarui_pada := now();
  return new;
end;
$$;

revoke execute on function public.set_audit_jadwal_shift() from public, anon;
grant execute on function public.set_audit_jadwal_shift() to authenticated;

drop trigger if exists trg_audit_jadwal_shift on public.jadwal_shift;
create trigger trg_audit_jadwal_shift
before insert or update on public.jadwal_shift
for each row execute function public.set_audit_jadwal_shift();

-- Hak tabel eksplisit; RLS tetap yang menentukan baris mana yang boleh diubah.
revoke all on table public.jadwal_shift from anon, authenticated;
grant select, insert, update, delete on table public.jadwal_shift to authenticated;

-- --------------------------------------------------------------------------
-- 3. Finalisasi jadwal per unit/bulan
-- --------------------------------------------------------------------------

create table if not exists public.jadwal_shift_final (
  unit_kerja  text not null references public.grup_shift (nama)
              on update cascade on delete cascade,
  periode     date not null,
  final_oleh  uuid references public.pegawai (id) on delete set null,
  final_pada  timestamptz not null default now(),
  primary key (unit_kerja, periode),
  constraint jadwal_shift_final_periode_check
    check (extract(day from periode) = 1)
);

create index if not exists idx_jadwal_shift_final_periode
  on public.jadwal_shift_final (periode, unit_kerja);

alter table public.jadwal_shift_final enable row level security;

drop policy if exists "jadwal_final_baca" on public.jadwal_shift_final;
create policy "jadwal_final_baca" on public.jadwal_shift_final
  for select to authenticated
  using (
    public.is_superadmin()
    or (public.is_kepala_ruangan() and unit_kerja = public.unit_saya())
  );

revoke all on table public.jadwal_shift_final from anon, authenticated;
grant select on table public.jadwal_shift_final to authenticated;

-- --------------------------------------------------------------------------
-- 4. Helper akses & RLS jadwal untuk kepala ruangan
-- --------------------------------------------------------------------------

create or replace function public.bisa_kelola_jadwal(p_user uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin()
      or exists (
        select 1
          from public.pegawai saya
          join public.pegawai target on target.id = p_user
         where saya.id = auth.uid()
           and saya.kepala_ruangan
           and saya.unit_kerja = target.unit_kerja
           and target.role = 'pegawai'
           and target.pola_kerja = 'shift'
      );
$$;

create or replace function public.jadwal_bulan_final(p_user uuid, p_tanggal date)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1
      from public.jadwal_shift_final f
      join public.pegawai p on p.id = p_user
     where f.unit_kerja = p.unit_kerja
       and f.periode = date_trunc('month', p_tanggal)::date
  );
$$;

revoke execute on function public.bisa_kelola_jadwal(uuid) from public, anon;
grant execute on function public.bisa_kelola_jadwal(uuid) to authenticated;
revoke execute on function public.jadwal_bulan_final(uuid, date) from public, anon;
grant execute on function public.jadwal_bulan_final(uuid, date) to authenticated;

-- Kepala boleh melihat seluruh jadwal unitnya (termasuk tanggal lampau).
drop policy if exists "jadwal_baca_kepala_unit" on public.jadwal_shift;
create policy "jadwal_baca_kepala_unit" on public.jadwal_shift
  for select to authenticated
  using (
    public.is_kepala_ruangan()
    and exists (
      select 1
        from public.pegawai target
       where target.id = jadwal_shift.user_id
         and target.unit_kerja = public.unit_saya()
    )
  );

-- Kepala hanya boleh menulis mulai besok, untuk pegawai shift unitnya, dan
-- tidak boleh menyentuh bulan yang sudah difinalisasi.
drop policy if exists "jadwal_kelola_kepala_unit" on public.jadwal_shift;
create policy "jadwal_kelola_kepala_unit" on public.jadwal_shift
  for all to authenticated
  using (
    public.is_kepala_ruangan()
    and public.bisa_kelola_jadwal(user_id)
    and tanggal > (now() at time zone 'Asia/Makassar')::date
    and not public.jadwal_bulan_final(user_id, tanggal)
  )
  with check (
    public.is_kepala_ruangan()
    and public.bisa_kelola_jadwal(user_id)
    and tanggal > (now() at time zone 'Asia/Makassar')::date
    and not public.jadwal_bulan_final(user_id, tanggal)
  );

-- --------------------------------------------------------------------------
-- 5. RPC finalisasi
-- --------------------------------------------------------------------------

create or replace function public.finalisasi_jadwal_unit(
  p_unit text,
  p_periode date,
  p_final boolean default true
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_unit text := trim(coalesce(p_unit, ''));
  v_periode date;
  v_final boolean := coalesce(p_final, true);
begin
  if v_unit = '' then
    raise exception 'Unit kerja wajib dipilih.';
  end if;
  if p_periode is null then
    raise exception 'Periode wajib dipilih.';
  end if;

  v_periode := date_trunc('month', p_periode)::date;

  if not exists (select 1 from public.grup_shift where nama = v_unit) then
    raise exception 'Grup shift tidak ditemukan.';
  end if;

  if not public.is_superadmin() then
    if not public.is_kepala_ruangan()
       or public.unit_saya() is distinct from v_unit then
      raise exception 'Anda hanya dapat mengelola jadwal unit sendiri.';
    end if;
    if v_periode < date_trunc('month', (now() at time zone 'Asia/Makassar')::date)::date then
      raise exception 'Jadwal bulan yang sudah lewat hanya dapat dikelola Super Admin.';
    end if;
    if not v_final then
      raise exception 'Hanya Super Admin yang dapat membuka finalisasi jadwal.';
    end if;
  end if;

  if v_final then
    insert into public.jadwal_shift_final (unit_kerja, periode, final_oleh, final_pada)
    values (v_unit, v_periode, auth.uid(), now())
    on conflict (unit_kerja, periode) do update
      set final_oleh = excluded.final_oleh,
          final_pada = excluded.final_pada;
  else
    delete from public.jadwal_shift_final
     where unit_kerja = v_unit and periode = v_periode;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'unit_kerja', v_unit,
    'periode', v_periode,
    'final', v_final
  );
end;
$$;

revoke execute on function public.finalisasi_jadwal_unit(text, date, boolean) from public, anon;
grant execute on function public.finalisasi_jadwal_unit(text, date, boolean) to authenticated;

commit;
