import logoKutai from '../../assets/logo-kutai-kartanegara.png'
import logoRsud from '../../assets/logo-rsud-ami.png'

export default function KopLaporan() {
  return (
    <>
      <header className="kop-laporan">
        <img src={logoKutai} alt="Logo Kutai Kartanegara" className="kop-logo" />
        <div className="kop-teks">
          <p className="kop-baris-1">PEMERINTAH KUTAI KARTANEGARA</p>
          <p className="kop-baris-2">DINAS KESEHATAN</p>
          <p className="kop-baris-2">UNIT ORGANISASI BERSIFAT KHUSUS</p>
          <p className="kop-baris-4">RUMAH SAKIT UMUM DAERAH AJI MUHAMMAD IDRIS</p>
          <p className="kop-alamat">
            Jalan Poros Muara Badak-Marangkayu, RT02 Sumber Jembatan, Desa Tanjung Limau,
          </p>
          <p className="kop-alamat">
            Kecamatan Muara Badak, Kode Pos 75382, Pos-el : rsudajimuhammadidris1@gmail.com
          </p>
        </div>
        <img src={logoRsud} alt="Logo RSUD Aji Muhammad Idris" className="kop-logo" />
      </header>
      <div className="kop-garis" aria-hidden="true" />
    </>
  )
}
