/**
 * Layar memuat layar penuh — dipakai saat cek sesi berlangsung.
 */
import Spinner from './Spinner.jsx'

export default function LayarMemuat({ label = 'Memuat aplikasi…' }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center gap-3 text-slate-600">
        <Spinner className="h-8 w-8" />
        <p className="text-sm font-medium">{label}</p>
      </div>
    </div>
  )
}
