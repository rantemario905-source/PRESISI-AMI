import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useProgres } from '../context/ProgressContext.jsx'

export default function PengamatRute() {
  const { pathname, search, hash, key } = useLocation()
  const { mulai, selesai } = useProgres()

  useEffect(() => {
    mulai()
    const timer = window.setTimeout(selesai, 650)
    return () => window.clearTimeout(timer)
  }, [pathname, search, hash, key, mulai, selesai])

  return null
}
