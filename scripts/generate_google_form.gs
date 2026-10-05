/**
 * GENERATOR GOOGLE FORM OTOMATIS (SESUAI DESAIN & SCREENSHOT FORM)
 * Proyek: SPK Rekomendasi Lowongan Part-Time Mahasiswa UKRIDA (Metode SMARTER)
 * Mata Kuliah: Kolaborasi Data Mining & Sistem Pendukung Keputusan (Decision Support System - DSS)
 * Program Studi Informatika - Fakultas Teknologi Cerdas
 * Universitas Kristen Krida Wacana (UKRIDA)
 *
 * ANGGOTA KELOMPOK:
 * 1. 412024022 - Brandon Jeremiah Sutedja
 * 2. 412024043 - Andrew Linardi
 * 3. 412025014 - Raffael Benediktus Lolaroh
 * 4. 412025021 - Michael Aaron Sipahutar
 *
 * STRUKTUR HALAMAN:
 * - Halaman 1: Pengantar, Tim Peneliti & Lembar Persetujuan (Informed Consent)
 * - Halaman 2: HALAMAN 2 — IDENTITAS MAHASISWA (Q1 NIM, Q2 Nama)
 * - Halaman 3: HALAMAN 3 — PREFERENSI, WAKTU, GAJI & SKILL (Q3..Q8)
 */

function buatFormKuesioner() {

  // ── 1. INISIALISASI FORM UTAMA ───────────────────────────────────────────
  var form = FormApp.create('Survei Preferensi Kerja Part-Time Mahasiswa UKRIDA');

  var deskripsiPengantar = 
    'Halo rekan-rekan mahasiswa! 👋\n\n' +
    'Kami mahasiswa Program Studi Informatika, Fakultas Teknologi Cerdas, ' +
    'Universitas Kristen Krida Wacana (UKRIDA), saat ini sedang melakukan penelitian ' +
    'untuk tugas besar kolaborasi mata kuliah Data Mining dan Sistem Pendukung Keputusan ' +
    '(Decision Support System / DSS).\n\n' +
    '📌 TOPIK PENELITIAN:\n' +
    'Pengembangan Sistem Pendukung Keputusan (SPK) Rekomendasi Lowongan Kerja Part-Time ' +
    'Mahasiswa Menggunakan Metode SMARTER (Simple Multi-Attribute Rating Technique Exploiting Ranks).\n\n' +
    '👥 TIM PENELITI (KELOMPOK):\n' +
    '• 412024022 — Brandon Jeremiah Sutedja\n' +
    '• 412024043 — Andrew Linardi\n' +
    '• 412025014 — Raffael Benediktus Lolaroh\n' +
    '• 412025021 — Michael Aaron Sipahutar\n' +
    'Program Studi Informatika, Universitas Kristen Krida Wacana (UKRIDA)\n\n' +
    '🎯 TUJUAN SURVEI:\n' +
    'Kuesioner ini bertujuan untuk mengumpulkan data riil mengenai preferensi, ketersediaan waktu, ' +
    'dan ekspektasi rekan-rekan mahasiswa terkait pekerjaan paruh waktu (part-time). Data yang terkumpul ' +
    'akan menjadi dasar parameter preferensi mahasiswa pada sistem rekomendasi yang kami bangun.\n\n' +
    '🔒 KERAHASIAAN & ETIKA PENELITIAN:\n' +
    'Seluruh informasi dan data yang Anda berikan dijamin kerahasiaannya dan HANYA digunakan ' +
    'untuk kepentingan pengolahan data akademik penelitian ini. Waktu pengisian kuesioner ini ' +
    'hanya membutuhkan waktu sekitar 2–3 menit.\n\n' +
    'Atas kesediaan, perhatian, dan waktu yang rekan-rekan berikan, kami ucapkan terima kasih yang sebesar-besarnya! 🙏✨';

  form.setDescription(deskripsiPengantar);
  form.setCollectEmail(false);
  form.setLimitOneResponsePerUser(false);
  form.setProgressBar(true);
  form.setConfirmationMessage(
    'Terima kasih banyak atas partisipasinya! Data Anda telah berhasil direkam dan ' +
    'sangat berharga untuk pengembangan Sistem Pendukung Keputusan (SPK) Part-Time UKRIDA. 🙏🎉'
  );


  // ── HALAMAN 1: LEMBAR PERSETUJUAN (INFORMED CONSENT) ──────────────────────
  var consentItem = form.addMultipleChoiceItem();
  consentItem
    .setTitle('Lembar Persetujuan (Informed Consent)')
    .setHelpText(
      'Dengan memilih "Ya", Anda menyatakan bersedia mengisi kuesioner ini secara sukarela ' +
      'untuk keperluan penelitian akademik tim kami.'
    )
    .setRequired(true);


  // ── HALAMAN 2: IDENTITAS MAHASISWA ────────────────────────────────────────
  var page2 = form.addPageBreakItem()
    .setTitle('HALAMAN 2\n\nIDENTITAS MAHASISWA')
    .setHelpText('Informasi ini digunakan sebagai identitas sampel mahasiswa dalam penelitian ↓');

  consentItem.setChoices([
    consentItem.createChoice('Ya, saya bersedia mengisi kuesioner ini secara sukarela', page2),
    consentItem.createChoice('Tidak, saya belum bersedia', FormApp.PageNavigationType.SUBMIT)
  ]);

  // Q1: NIM
  form.addTextItem()
    .setTitle('Q1. Nomor Induk Mahasiswa (NIM)')
    .setHelpText('Tuliskan NIM Anda (Contoh: 412024000)')
    .setRequired(true);

  // Q2: Nama Lengkap
  form.addTextItem()
    .setTitle('Q2. Nama Lengkap')
    .setHelpText('Tuliskan nama lengkap Anda')
    .setRequired(true);


  // ── HALAMAN 3: PREFERENSI, WAKTU, GAJI & SKILL ────────────────────────────
  form.addPageBreakItem()
    .setTitle('HALAMAN 3\n\nPREFERENSI BIDANG PEKERJAAN & LOKASI')
    .setHelpText('Bagian ini memetakan preferensi bidang minat kerja, domisili, dan sistem kerja yang Anda harapkan ↓');

  // Q3: Domisili
  form.addMultipleChoiceItem()
    .setTitle('Q3. Di area mana Anda tinggal saat ini?')
    .setHelpText('Pilih wilayah domisili terdekat untuk perhitungan jarak tempuh kerja.')
    .setChoiceValues([
      'Jakarta Barat (Grogol, Kebon Jeruk, Tanjung Duren, Palmerah, Kembangan, dsb.)',
      'Jakarta Pusat (Gambir, Menteng, Tanah Abang, Senen, dsb.)',
      'Jakarta Selatan (Kebayoran, Mampang, Setiabudi, Pasar Minggu, dsb.)',
      'Jakarta Timur (Jatinegara, Matraman, Duren Sawit, Cakung, dsb.)',
      'Jakarta Utara (Penjaringan, Kelapa Gading, Pluit, Pademangan, dsb.)',
      'Tangerang / Tangerang Selatan / BSD / Serpong',
      'Depok / Bogor',
      'Bekasi'
    ])
    .setRequired(true);

  // Q4: Bidang Minat
  form.addMultipleChoiceItem()
    .setTitle('Q4. Bidang pekerjaan part-time apa yang paling Anda minati?')
    .setHelpText('Pilih 1 (satu) bidang utama yang paling sesuai dengan ketertarikan Anda.')
    .setChoiceValues([
      'Education & Tutoring (Guru les privat, asisten bimbel, tutor belajar)',
      'Food & Beverage / F&B (Barista kedai kopi, crew kafe/restoran, helper dapur)',
      'Retail & Store Operations (Kasir toko, pramuniaga/store crew, staf operasional toko)',
      'Marketing & Sales (Promotor produk, sales lapangan/event, direct sales marketing)',
      'Content & Media (Host live streaming TikTok/Shopee, content writer, penerjemah)',
      'Design & Creative (Desain grafis, editor video, pembuatan konten visual)',
      'Admin & Office Support (Staf input data, rekapitulasi berkas, admin chat/dokumen)',
      'Customer Service & Support (Layanan chat pelanggan, front desk, helpdesk)',
      'Logistics & Delivery (Petugas sortir/packing gudang, kurir pengiriman barang)',
      'IT & Software (Junior web/mobile developer, IT support, technical assistant)'
    ])
    .setRequired(true);

  // Q5: Sistem Kerja
  form.addMultipleChoiceItem()
    .setTitle('Q5. Sistem kerja part-time seperti apa yang Anda harapkan?')
    .setHelpText('Pilih model kerja yang paling memungkinkan dengan rutinitas harian Anda.')
    .setChoiceValues([
      'Remote (Bekerja secara online dari rumah / tempat lainnya)',
      'Hybrid (Sebagian online, sebagian hadir ke lokasi)',
      'Onsite (Hadir langsung secara fisik di tempat kerja / outlet / kantor)'
    ])
    .setRequired(true);

  // Sub-Section: Ketersediaan Waktu & Ekspektasi Finansial
  form.addSectionHeaderItem()
    .setTitle('KETERSEDIAAN WAKTU & EKSPEKTASI FINANSIAL')
    .setHelpText('Bagian ini memetakan alokasi waktu luang yang dapat Anda sediakan di sela kegiatan kuliah serta target penghasilan per bulan yang diharapkan ↓');

  // Q6a: Hari per Minggu
  form.addMultipleChoiceItem()
    .setTitle('Q6a. Dalam seminggu, berapa hari waktu kerja part-time yang Anda harapkan?')
    .setHelpText('Pilih frekuensi hari kerja di luar jadwal kuliah utama.')
    .setChoiceValues([
      '1 hari / minggu (misalnya khusus weekend)',
      '2 hari / minggu',
      '3 hari / minggu',
      '4 hari / minggu',
      '5 hari / minggu atau lebih (selama tidak menggangu jadwal perkuliahan)'
    ])
    .setRequired(true);

  // Q6b: Jam per Hari
  form.addMultipleChoiceItem()
    .setTitle('Q6b. Berapa jam waktu yang diharapkan untuk bekerja part-time?')
    .setHelpText('Estimasi durasi waktu kerja per hari.')
    .setChoiceValues([
      '2 – 3 jam / hari (durasi santai, misal sore setelah jam kuliah selesai)',
      '4 – 6 jam / hari (durasi sedang / setengah hari)',
      '7 – 8 jam / hari (durasi panjang / mendekati shift penuh)'
    ])
    .setRequired(true);

  // Q7: Upah per Bulan
  form.addMultipleChoiceItem()
    .setTitle('Q7. Berapa banyak upah / gaji yang Anda harapkan per bulan?')
    .setHelpText('Pilih rentang penghasilan bulanan yang menurut Anda layak dan memuaskan.')
    .setChoiceValues([
      'Rp 500.000 – Rp 1.000.000 / bulan (penghasilan dasar / mengutamakan pengalaman)',
      'Rp 1.000.000 – Rp 1.500.000 / bulan',
      'Rp 1.500.000 – Rp 2.000.000 / bulan',
      'Rp 2.000.000 – Rp 2.500.000 / bulan',
      'Di atas Rp 2.500.000 / bulan'
    ])
    .setRequired(true);

  // Sub-Section: Keahlian & Keterampilan Diri
  form.addSectionHeaderItem()
    .setTitle('KEAHLIAN & KETERAMPILAN DIRI')
    .setHelpText('Keahlian yang Anda miliki akan dicocokkan dengan kualifikasi yang paling sesuai dari lowongan pekerjaan paruh waktu yang tersedia ↓');

  // Q8: Skills Bebas
  form.addParagraphTextItem()
    .setTitle('Q8. Tuliskan skills apa saja yang Anda miliki saat ini:')
    .setHelpText(
      'Tuliskan secara bebas (boleh mencakup software, hard skills, maupun soft skills), dan pisahkan setiap skill menggunakan tanda koma ( , )\n\n' +
      'Contoh pengisian:\n' +
      '• "Canva, Adobe Photoshop, video editing CapCut, komunikasi ramah, kemampuan bekerja sama"\n' +
      '• atau, "Microsoft Excel, pengetikan cepat, rekap data teliti, customer service"\n' +
      '• atau, "Espresso machine, manual brewing, keramahan hospitality, kebersihan bar"\n' +
      '• atau, "HTML, CSS, Python dasar, analisis data, troubleshooting komputer"\n\n' +
      'NOTE: Diharapkan menuliskan skill yang sesuai/berhubungan dengan bidang pekerjaan part-time yang diminati (yang sebelumnya telah diisi pada Q4)'
    )
    .setRequired(true);


  // ── LOG URL FORM ──────────────────────────────────────────────────────────
  var formUrl     = form.getPublishedUrl();
  var editUrl     = form.getEditUrl();
  var responseUrl = form.getSummaryUrl();

  Logger.log('========================================================================');
  Logger.log('✅ GOOGLE FORM BERHASIL DI-GENERATE SESUAI SCREENSHOT!');
  Logger.log('========================================================================');
  Logger.log('🔗 LINK UNTUK DISEBAR KE RESPONDEN (PUBLISHED URL):');
  Logger.log(formUrl);
  Logger.log('');
  Logger.log('✏️  LINK UNTUK EDIT FORM (EDIT URL):');
  Logger.log(editUrl);
  Logger.log('');
  Logger.log('📊 LINK RINGKASAN JAWABAN (SUMMARY URL):');
  Logger.log(responseUrl);
  Logger.log('========================================================================');

  var ui = SpreadsheetApp.getUi ? SpreadsheetApp.getUi() : null;
  Browser.msgBox(
    'Google Form Berhasil Dibuat! 🎉\n\n' +
    'Desain: Persis sesuai screenshot (Total 3 Halaman).\n\n' +
    'Link Kuesioner:\n' + formUrl + '\n\n' +
    'Cek menu View > Logs (atau Execution log) untuk link lengkap.'
  );
}
