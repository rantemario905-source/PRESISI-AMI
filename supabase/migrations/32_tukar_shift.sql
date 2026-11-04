-- ==========================================================================
-- 32 - TUKAR SHIFT (AUDIT) UNTUK PEGAWAI POLA KERJA SHIFT
-- Syarat: 01 s.d. 31 sudah dijalankan.
--
-- Ringkasan:
--   1. Tabel `tukar_shift` mencatat setiap kejadian tukar shift (satu baris
--      = satu kejadian, satu tanggal, dua pegawai) beserta shift asal/pengganti,
--      alasan, dan pembuat catatan.
--   2. RPC `tukar_shift()` menukar dua baris `jadwal_shift` secara atomik
--      (baris dikunci `for update`) lalu menulis catatan audit.
--   3. Kepala unit hanya boleh menukar pegawai dari unit yang dikelola pada
--      tanggal hari ini atau setelahnya; Super Admin bebas (termasuk tanggal
--      lampau untuk perbaikan).
--   4. RLS baca: Super Admin, kepala unit terkait, dan pegawai yang terlibat.
--      Penulisan hanya lewat RPC (SECURITY DEFINER).
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.pegawai') is null
     or to_regclass('public.jadwal_shift') is null
     or to_regclass('public.shift_master') is null then
    raise exception 'Tabel inti tidak ditemukan. Jalankan migrasi 01-31 pada project Supabase yang benar.';
  end if;
end;
$$;

-- --------------------------------------------------------------------------
-- 1. Tabel catatan tukar shift
-- --------------------------------------------------------------------------

create table if not exists public.tukar_shift (
  id           uuid primary key default gen_random_uuid(),
  tanggal      date not null,
  unit_kerja   text,
  pegawai_a    uuid not null references public.pegawai (id) on delete cascade,
  pegawai_b    uuid not null references public.pegawai (id) on delete cascade,
  shift_a_lama uuid not null references public.shift_master (id),
  shift_b_lama uuid not null references public.shift_master (id),
  shift_a_baru uuid not null references public.shift_master (id),
  shift_b_baru uuid not null references public.shift_master (id),
  alasan       text,
  dibuat_oleh  uuid references public.pegawai (id) on delete set null,
  dibuat_pada  timestamptz not null default now(),
  constraint tukar_shift_pegawai_beda check (pegawai_a <> pegawai_b)
);

create index if not exists idx_tukar_shift_tanggal on public.tukar_shift (tanggal);
create index if not exists idx_tukar_shift_pegawai_a on public.tukar_shift (pegawai_a);
create index if not exists idx_tukar_shift_pegawai_b on public.tukar_shift (pegawai_b);

alter table public.tukar_shift enable row level security;

-- Penulisan hanya lewat RPC; baris dibaca sesuai policy di bawah.
revoke all on table public.tukar_shift from public, anon, authenticated;
grant select on table public.tukar_shift to authenticated;

drop policy if exists "tukar_shift_baca" on public.tukar_shift;
create policy "tukar_shift_baca" on public.tukar_shift
  for select to authenticated
  using (
    public.is_superadmin()
    or pegawai_a = auth.uid()
    or pegawai_b = auth.uid()
    or dibuat_oleh = auth.uid()
    or exists (
      select 1
        from public.pegawai p
       where p.id in (tukar_shift.pegawai_a, tukar_shift.pegawai_b)
         and public.bisa_kelola_unit(p.unit_kerja)
    )
  );

-- --------------------------------------------------------------------------
-- 2. RPC tukar shift
-- --------------------------------------------------------------------------

create or replace function public.tukar_shift(
  p_pegawai_a uuid,
  p_pegawai_b uuid,
  p_tanggal date,
  p_alasan text default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_super boolean := public.is_superadmin();
  v_hari_ini date := (now() at time zone 'Asia/Makassar')::date;
  v_unit_a text;
  v_unit_b text;
  v_shift_a public.jadwal_shift%rowtype;
  v_shift_b public.jadwal_shift%rowtype;
  v_id uuid := gen_random_uuid();
begin
  if v_uid is null then
    raise exception 'Sesi Anda tidak valid. Silakan login kembali.';
  end if;

  if not (v_super or public.is_kepala_ruangan()) then
    raise exception 'Hanya kepala unit atau Super Admin yang dapat menukar jadwal shift.';
  end if;

  if p_pegawai_a is null or p_pegawai_b is null or p_pegawai_a = p_pegawai_b then
    raise exception 'Pilih dua pegawai yang berbeda.';
  end if;

  if p_tanggal is null then
    raise exception 'Tanggal tukar tidak valid.';
  end if;

  if not v_super and p_tanggal < v_hari_ini then
    raise exception 'Tanggal sebelum hari ini hanya dapat ditukar oleh Super Admin.';
  end if;

  select p.unit_kerja into v_unit_a from public.pegawai p where p.id = p_pegawai_a;
  if v_unit_a is null then
    raise exception 'Pegawai pertama tidak ditemukan.';
  end if;

  select p.unit_kerja into v_unit_b from public.pegawai p where p.id = p_pegawai_b;
  if v_unit_b is null then
    raise exception 'Pegawai kedua tidak ditemukan.';
  end if;

  if not v_super then
    if not public.bisa_kelola_unit(v_unit_a) or not public.bisa_kelola_unit(v_unit_b) then
      raise exception 'Anda hanya dapat menukar jadwal pegawai dari unit yang Anda kelola.';
    end if;
  end if;

  select * into v_shift_a
    from public.jadwal_shift js
   where js.user_id = p_pegawai_a
     and js.tanggal = p_tanggal
   for update;
  if not found then
    raise exception 'Pegawai pertama tidak memiliki jadwal pada tanggal tersebut.';
  end if;

  select * into v_shift_b
    from public.jadwal_shift js
   where js.user_id = p_pegawai_b
     and js.tanggal = p_tanggal
   for update;
  if not found then
    raise exception 'Pegawai kedua tidak memiliki jadwal pada tanggal tersebut.';
  end if;

  if v_shift_a.shift_id = v_shift_b.shift_id then
    raise exception 'Kedua pegawai memakai shift yang sama, tidak ada yang ditukar.';
  end if;

  update public.jadwal_shift
     set shift_id = v_shift_b.shift_id
   where id = v_shift_a.id;

  update public.jadwal_shift
     set shift_id = v_shift_a.shift_id
   where id = v_shift_b.id;

  insert into public.tukar_shift (
    id, tanggal, unit_kerja,
    pegawai_a, pegawai_b,
    shift_a_lama, shift_b_lama, shift_a_baru, shift_b_baru,
    alasan, dibuat_oleh
  ) values (
    v_id, p_tanggal, v_unit_a,
    p_pegawai_a, p_pegawai_b,
    v_shift_a.shift_id, v_shift_b.shift_id, v_shift_b.shift_id, v_shift_a.shift_id,
    nullif(trim(p_alasan), ''), v_uid
  );

  return jsonb_build_object(
    'status', 'ok',
    'id', v_id,
    'tanggal', p_tanggal,
    'pesan', 'Jadwal shift berhasil ditukar.'
  );
end;
$$;

revoke execute on function public.tukar_shift(uuid, uuid, date, text) from public, anon;
grant execute on function public.tukar_shift(uuid, uuid, date, text) to authenticated;

commit;
