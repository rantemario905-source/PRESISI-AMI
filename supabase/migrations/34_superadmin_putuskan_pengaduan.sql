-- ==========================================================================
-- 34 - SUPER ADMIN DAPAT MEMUTUSKAN PENGADUAN PRESENSI
-- Syarat: 01 s.d. 33 sudah dijalankan.
--
-- Ringkasan:
--   1. `putuskan_pengaduan_presensi` kini mengizinkan Super Admin selain
--      Kepala Unit.
--   2. Super Admin tidak terikat cek unit; Kepala Unit tetap hanya untuk unit
--      yang dikelola.
--   3. Semua peran tetap tidak dapat menyetujui pengaduan miliknya sendiri.
--   4. `dikoreksi_oleh` boleh kosong bila pemutus bukan baris `pegawai`
--      (akun Super Admin); pelaku tetap tercatat di `pengaduan_presensi`.
-- ==========================================================================

begin;

do $$
begin
  if to_regclass('public.pengaduan_presensi') is null
     or to_regclass('public.presensi') is null
     or to_regprocedure('public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text)') is null then
    raise exception 'Tabel/fungsi pengaduan tidak ditemukan. Jalankan migrasi 33 pada project Supabase yang benar.';
  end if;
end
$$;

create or replace function public.putuskan_pengaduan_presensi(
  p_id uuid,
  p_setuju boolean,
  p_jam_pulang timestamptz default null,
  p_catatan text default null
) returns jsonb
language plpgsql security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_super boolean := public.is_superadmin();
  v_q public.pengaduan_presensi%rowtype;
  v_p public.presensi%rowtype;
  v_unit text;
  v_nama text;
  v_jam timestamptz;
begin
  if v_uid is null then
    raise exception 'Silakan login terlebih dahulu.';
  end if;

  if not (v_super or public.is_kepala_ruangan()) then
    raise exception 'Hanya Kepala Unit atau Super Admin yang dapat memutuskan pengaduan.';
  end if;

  select * into v_q
    from public.pengaduan_presensi
   where id = p_id
   for update;

  if not found then
    raise exception 'Pengaduan tidak ditemukan.';
  end if;

  if v_q.status <> 'menunggu' then
    raise exception 'Pengaduan ini sudah diputuskan.';
  end if;

  if v_q.user_id = v_uid then
    raise exception 'Anda tidak dapat menyetujui pengaduan sendiri.';
  end if;

  if not v_super then
    select unit_kerja into v_unit
      from public.pegawai
     where id = v_q.user_id;

    if not public.bisa_kelola_unit(v_unit) then
      raise exception 'Anda tidak mengelola unit pegawai pengadu.';
    end if;
  end if;

  select * into v_p
    from public.presensi
   where id = v_q.presensi_id
   for update;

  if not found then
    raise exception 'Data presensi pengaduan tidak ditemukan.';
  end if;

  select coalesce(
           pg.nama,
           nullif(trim(u.raw_user_meta_data ->> 'nama'), ''),
           split_part(coalesce(u.email, ''), '@', 1)
         )
    into v_nama
    from auth.users u
    left join public.pegawai pg on pg.id = u.id
   where u.id = v_uid;

  if p_setuju then
    if v_p.jam_pulang is not null then
      raise exception 'Presensi ini sudah memiliki jam pulang.';
    end if;

    v_jam := coalesce(p_jam_pulang, v_q.jam_pulang_diajukan);

    if v_jam is null or v_jam <= v_p.jam_masuk then
      raise exception 'Jam pulang harus setelah jam masuk.';
    end if;

    if v_jam > now() then
      raise exception 'Jam pulang tidak boleh melewati waktu sekarang.';
    end if;

    update public.presensi
       set jam_pulang = v_jam,
           status_kehadiran = 'Koreksi',
           dikoreksi_oleh = (select id from public.pegawai where id = v_uid),
           alasan_koreksi = 'Pengaduan disetujui oleh ' || coalesce(v_nama, 'Kepala Unit')
             || ': ' || v_q.alasan
             || coalesce(' | ' || nullif(btrim(p_catatan), ''), '')
     where id = v_p.id;

    update public.pengaduan_presensi
       set status = 'disetujui',
           jam_pulang_disetujui = v_jam,
           diputuskan_oleh = v_uid,
           diputuskan_pada = now(),
           catatan_admin = nullif(btrim(p_catatan), '')
     where id = p_id;

    return jsonb_build_object(
      'status', 'ok',
      'keputusan', 'disetujui',
      'pesan', 'Pengaduan disetujui. Jam pulang presensi sudah diperbarui.'
    );
  end if;

  if p_catatan is null or char_length(btrim(p_catatan)) < 5 then
    raise exception 'Catatan penolakan wajib diisi minimal 5 karakter.';
  end if;

  update public.pengaduan_presensi
     set status = 'ditolak',
         diputuskan_oleh = v_uid,
         diputuskan_pada = now(),
         catatan_admin = btrim(p_catatan)
   where id = p_id;

  return jsonb_build_object(
    'status', 'ok',
    'keputusan', 'ditolak',
    'pesan', 'Pengaduan ditolak. Presensi tidak diubah.'
  );
end;
$$;

revoke execute on function public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text) from public, anon;
grant execute on function public.putuskan_pengaduan_presensi(uuid, boolean, timestamptz, text) to authenticated;

commit;
