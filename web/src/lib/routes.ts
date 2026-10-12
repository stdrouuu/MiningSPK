// URL mapping (dua mode, layar sama, beda sumber profil):
//   Mode user baru (profil kosong, isi via kuesioner):
//   /                -> Beranda      /portal          -> Portal
//   /perhitungan-spk -> Matriks SPK  /kuesioner       -> Kuesioner
//   Mode demo data (profil = dropdown responden GForm, dropdown avatar):
//   /data                  -> Beranda  /data/portal            -> Portal
//   /data/perhitungan-spk  -> Matriks SPK
//   BLOK /data/* DEMO SEMENTARA — hapus setelah demo (route + prefs data +
//   CSV web/public/data/clean_students_dataset.csv) agar data partisipan
//   tidak tersebar publik.
export const ROUTES = {
  LANDING: '/',
  PORTAL: '/portal',
  MATRIX: '/perhitungan-spk',
  KUESIONER: '/kuesioner',
  DATA: '/data',
  DATA_PORTAL: '/data/portal',
  DATA_MATRIX: '/data/perhitungan-spk',
} as const
