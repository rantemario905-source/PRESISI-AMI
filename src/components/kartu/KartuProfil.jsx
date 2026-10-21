/**
 * Kartu profil pegawai yang sedang login.
 */
import { inisialNama } from '../../utils/format.js'
import Badge from '../ui/Badge.jsx'

export default function KartuProfil({ profil }) {
  return (
    <section className="kartu flex items-center gap-4">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sky-600 text-lg font-bold text-white">
        {inisialNama(profil?.nama)}
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold text-slate-800">{profil?.nama}</h2>
        <p className="truncate text-sm text-slate-500">{profil?.unit_kerja}</p>
        <div className="mt-1.5">
          <Badge variant="info" className="capitalize">
            {profil?.role === 'superadmin' ? 'Super Admin' : 'Pegawai Non-ASN'}
          </Badge>
        </div>
      </div>
    </section>
  )
}
