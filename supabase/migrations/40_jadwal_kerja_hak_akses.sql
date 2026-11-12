-- ==========================================================================
-- 40 - HAK AKSES jadwal_kerja SESUAI kepala_unit
-- --------------------------------------------------------------------------
-- Masalah: `jadwal_kerja` masih memakai aturan lama (kolom
-- `pegawai.kepala_ruangan` + unit kerja sama). Sejak migrasi 22 penugasan
-- kepala unit disimpan di tabel `kepala_unit` (satu kepala boleh banyak unit,
-- kepala ASN tanpa baris pegawai), sehingga kepala unit yang sah ditolak
-- dengan pesan "Anda tidak berhak melihat jadwal pegawai ini." — mis. saat
-- menyetujui pengaduan presensi (RPC memanggil jadwal_kerja pegawai pengadu).
--
-- Perbaikan: pengecekan memakai `public.bisa_lihat_presensi(p_user)` yang
-- sudah mencakup Super Admin, diri sendiri, dan kepala unit pengelola unit
-- pegawai tersebut. Isi fungsi lain tidak berubah.
-- ==========================================================================
begin;

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
     and not public.bisa_lihat_presensi(p_user) then
    raise exception 'Anda tidak berhak melihat jadwal pegawai ini.';
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
