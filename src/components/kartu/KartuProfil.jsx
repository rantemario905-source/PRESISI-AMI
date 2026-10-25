/**
 * Kartu profil pegawai yang sedang login.
 */
import { inisialNama } from '../../utils/format.js'
import Badge from '../ui/Badge.jsx'

export default function KartuProfil({ profil }) {
  return (
    <section className="kartu flex items-center gap-3.5">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-600 text-base font-bold text-white">
        {inisialNama(profil?.nama)}
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-base font-bold text-slate-800">{profil?.nama}</h2>
        <p className="truncate text-xs text-slate-500">{profil?.unit_kerja}</p>
        <div className="mt-1.5">
          <Badge variant="info">
            {profil?.role === 'superadmin'
              ? 'Super Admin'
              : profil?.kepala_ruangan
                ? 'Kepala Ruangan'
                : 'Pegawai Non-ASN'}
          </Badge>
        </div>
      </div>
    </section>
  )
}
