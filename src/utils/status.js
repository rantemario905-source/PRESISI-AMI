/**
 * Pemetaan status → varian warna Badge.
 */
export function varianStatusPerangkat(status) {
  return { pending: 'peringatan', approved: 'sukses', rejected: 'bahaya' }[status] ?? 'netral'
}

export function labelStatusPerangkat(status) {
  return { pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak' }[status] ?? status
}

export function varianStatusIzin(status) {
  return { menunggu: 'peringatan', disetujui: 'sukses', ditolak: 'bahaya' }[status] ?? 'netral'
}

export function labelStatusIzin(status) {
  return { menunggu: 'Menunggu', disetujui: 'Disetujui', ditolak: 'Ditolak' }[status] ?? status
}

export function varianStatusKehadiran(status) {
  return (
    {
      Hadir: 'sukses',
      Alfa: 'bahaya',
      Izin: 'info',
      Sakit: 'info',
      Cuti: 'info',
      'Dinas Luar': 'info',
      Koreksi: 'peringatan',
    }[status] ?? 'netral'
  )
}
