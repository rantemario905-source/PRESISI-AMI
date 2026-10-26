import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const ProgressContext = createContext(null)

export function ProgressProvider({ children }) {
  const [tampil, setTampil] = useState(false)
  const [progres, setProgres] = useState(0)
  const aktifRef = useRef(false)
  const tampilRef = useRef(false)
  const intervalRef = useRef(null)
  const hideRef = useRef(null)
  const resetRef = useRef(null)

  const bersihkan = useCallback(() => {
    if (intervalRef.current) window.clearInterval(intervalRef.current)
    if (hideRef.current) window.clearTimeout(hideRef.current)
    if (resetRef.current) window.clearTimeout(resetRef.current)
    intervalRef.current = null
    hideRef.current = null
    resetRef.current = null
  }, [])

  const mulai = useCallback(() => {
    bersihkan()
    if (aktifRef.current) return

    aktifRef.current = true
    setProgres((nilai) => (tampilRef.current ? Math.max(nilai, 90) : 8))
    tampilRef.current = true
    setTampil(true)

    intervalRef.current = window.setInterval(() => {
      setProgres((nilai) => {
        if (nilai >= 90) return nilai
        return Math.min(90, nilai + Math.max(1, (90 - nilai) * 0.12))
      })
    }, 180)
  }, [bersihkan])

  const selesai = useCallback(() => {
    if (!aktifRef.current) return
    aktifRef.current = false
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    setProgres(100)
    hideRef.current = window.setTimeout(() => {
      tampilRef.current = false
      setTampil(false)
      hideRef.current = null
      resetRef.current = window.setTimeout(() => {
        setProgres(0)
        resetRef.current = null
      }, 260)
    }, 220)
  }, [])

  useEffect(() => bersihkan, [bersihkan])

  const nilai = useMemo(
    () => ({ tampil, progres, mulai, selesai }),
    [tampil, progres, mulai, selesai],
  )

  return <ProgressContext.Provider value={nilai}>{children}</ProgressContext.Provider>
}

export function useProgres() {
  const konteks = useContext(ProgressContext)
  if (!konteks) throw new Error('useProgres harus dipakai di dalam <ProgressProvider>')
  return konteks
}
