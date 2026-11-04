import test from 'node:test'
import assert from 'node:assert/strict'
import {
  adalahGalatMuatModul,
  bolehMuatUlangOtomatis,
  bersihkanPenandaPerbarui,
  muatUlangSekali,
} from '../src/utils/pemulihanHalaman.js'

test('adalahGalatMuatModul mendeteksi kegagalan chunk halaman', () => {
  assert.equal(
    adalahGalatMuatModul(
      new Error('Failed to fetch dynamically imported module: https://x/assets/Dashboard-abc.js'),
    ),
    true,
  )
  assert.equal(
    adalahGalatMuatModul(new Error('ChunkLoadError: Loading chunk 12 failed.')),
    true,
  )
  assert.equal(adalahGalatMuatModul(new Error('Importing a module script failed.')), true)
})

test('adalahGalatMuatModul mengabaikan galat yang bukan kegagalan modul', () => {
  assert.equal(adalahGalatMuatModul(new Error('Cannot read properties of undefined')), false)
  assert.equal(adalahGalatMuatModul(null), false)
  assert.equal(adalahGalatMuatModul(''), false)
})

test('fungsi pemulihan aman dipanggil tanpa window (SSR/uji node)', () => {
  assert.equal(bolehMuatUlangOtomatis(), false)
  assert.equal(muatUlangSekali(), false)
  assert.doesNotThrow(() => bersihkanPenandaPerbarui())
})

function denganWindow(href, stempel, fn) {
  const asli = globalThis.window
  const simpan = new Map()
  if (stempel) simpan.set('presisi-ami:muat-ulang-terakhir', String(stempel))
  let dialihkan = null
  globalThis.window = {
    location: {
      href,
      replace(url) {
        dialihkan = url
      },
      reload() {
        dialihkan = 'reload'
      },
    },
    history: {
      state: null,
      url: null,
      replaceState(_state, _judul, url) {
        this.url = url
      },
    },
    sessionStorage: {
      getItem(kunci) {
        return simpan.has(kunci) ? simpan.get(kunci) : null
      },
      setItem(kunci, nilai) {
        simpan.set(kunci, String(nilai))
      },
    },
  }
  try {
    return fn(() => dialihkan)
  } finally {
    if (asli === undefined) delete globalThis.window
    else globalThis.window = asli
  }
}

test('muatUlangSekali menambah penanda cache-busting sekali', () => {
  denganWindow('https://presisiami.my.id/superadmin-portal/rekap', '', (ambilDialihkan) => {
    assert.equal(bolehMuatUlangOtomatis(), true)
    assert.equal(muatUlangSekali(), true)
    assert.match(ambilDialihkan(), /perbarui=\d+/)
  })
})

test('muatUlangSekali tidak mengulang bila URL sudah berpenanda', () => {
  denganWindow('https://presisiami.my.id/?perbarui=123', '', () => {
    assert.equal(bolehMuatUlangOtomatis(), false)
    assert.equal(muatUlangSekali(), false)
  })
})

test('muatUlangSekali menghormati jeda 30 detik', () => {
  denganWindow('https://presisiami.my.id/', String(Date.now()), () => {
    assert.equal(bolehMuatUlangOtomatis(), false)
  })
})

test('bersihkanPenandaPerbarui menghapus parameter tanpa mengganggu parameter lain', () => {
  denganWindow('https://presisiami.my.id/riwayat?perbarui=123&bulan=11#atas', '', () => {
    bersihkanPenandaPerbarui()
    assert.equal(globalThis.window.history.url, '/riwayat?bulan=11#atas')
  })
})
