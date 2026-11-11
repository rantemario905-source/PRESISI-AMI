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
  return (
    {
      menunggu: 'peringatan',
      disetujui: 'sukses',
      ditolak: 'bahaya',
      dibatalkan: 'netral',
    }[status] ?? 'netral'
  )
}

export function labelStatusIzin(status) {
  return (
    {
      menunggu: 'Menunggu',
      disetujui: 'Disetujui',
      ditolak: 'Ditolak',
      dibatalkan: 'Dibatalkan',
    }[status] ?? status
  )
}

export function varianJenisIzin(jenis) {
  return (
    {
      Sakit: 'sakit',
      Cuti: 'cuti',
      'Dinas Luar': 'dinas',
      Izin: 'izin',
    }[jenis] ?? 'info'
  )
}

export function varianStatusKehadiran(status) {
  return (
    {
      Hadir: 'sukses',
      Alfa: 'bahaya',
      Sakit: 'sakit',
      Cuti: 'cuti',
      'Dinas Luar': 'dinas',
      Izin: 'izin',
      Koreksi: 'peringatan',
    }[status] ?? 'netral'
  )
}
