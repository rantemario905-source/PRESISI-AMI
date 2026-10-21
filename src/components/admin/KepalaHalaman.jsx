/**
 * Kepala halaman baku: judul, deskripsi, dan slot aksi (tombol).
 */
export default function KepalaHalaman({ judul, deskripsi, aksi }) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-extrabold text-slate-800 sm:text-xl">{judul}</h1>
        {deskripsi && <p className="mt-0.5 text-sm text-slate-500">{deskripsi}</p>}
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
    </div>
  )
}
