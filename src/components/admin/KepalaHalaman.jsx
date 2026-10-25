/**
 * Kepala halaman baku: judul, deskripsi, dan slot aksi (tombol).
 * Di HP aksi tampil selebar baris agar mudah disentuh.
 */
export default function KepalaHalaman({ judul, deskripsi, aksi }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-balance text-lg font-extrabold leading-tight text-slate-900 sm:text-xl">
          {judul}
        </h1>
        {deskripsi && (
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500 sm:text-sm">{deskripsi}</p>
        )}
      </div>
      {aksi && <div className="aksi-halaman">{aksi}</div>}
    </div>
  )
}
