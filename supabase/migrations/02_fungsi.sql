-- ==========================================================================
-- 02 — FUNGSI & TRIGGER
-- Syarat: 01_tabel.sql sudah sukses (tabel public.pegawai harus ada).
-- ==========================================================================

-- Fungsi Haversine: jarak meter antara dua koordinat
create or replace function public.haversine(
  p_lat1 double precision, p_lng1 double precision,
  p_lat2 double precision, p_lng2 double precision
) returns double precision
language sql immutable
as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(p_lat2 - p_lat1) / 2), 2) +
    cos(radians(p_lat1)) * cos(radians(p_lat2)) *
    power(sin(radians(p_lng2 - p_lng1) / 2), 2)
  ));
$$;

-- Cek role superadmin (SECURITY DEFINER agar tidak rekurif terhadap RLS)
create or replace function public.is_superadmin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.pegawai
    where id = auth.uid() and role = 'superadmin'
  );
$$;

-- Otomatis membuat baris pegawai saat akun baru dibuat di Supabase Auth.
-- CATATAN: role SELALU 'pegawai' — promosi superadmin hanya lewat SQL manual
-- oleh Admin IT (mencegah eskalasi hak via metadata saat signup).
create or replace function public.handle_new_pegawai()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.pegawai (id, nama, unit_kerja, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nama', split_part(coalesce(new.email, 'Pegawai'), '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'unit_kerja', 'Belum ditentukan'),
    'pegawai'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger auto-profil pegawai
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_pegawai();
