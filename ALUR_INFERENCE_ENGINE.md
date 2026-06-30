# Penjelasan Alur dan Cara Kerja Inference Engine

File `src/lib/inference-engine.ts` adalah inti dari sistem pakar (Expert System) yang menangani proses penalaran data kandidat. Sistem ini menggunakan metode **Forward Chaining** (penalaran maju berdasarkan data ke kesimpulan) yang dikombinasikan dengan metode **Certainty Factor (CF)** untuk menangani ketidakpastian.

Berikut adalah rincian mengenai alur dan cara kerjanya:

## 1. Inisialisasi Data (Working Memory)
Saat fungsi `runInference` dipanggil, ia menerima data profil dan hasil interview kandidat (`CandidateFacts`) beserta daftar aturan (`Rules`).
- Semua data mentah dari kandidat (seperti pengalaman FNB, jarak rumah, dan observasi wawancara) akan dimasukkan ke dalam objek **`workingMemory`**.
- Data mentah ini dianggap sebagai fakta pasti, sehingga secara default diberikan nilai awal **Certainty Factor (CF) sebesar 1.0 (100% yakin)**.

## 2. Forward Chaining Loop (Mengeksekusi Aturan)
Sistem masuk ke dalam proses *looping* menggunakan perintah `while (changed)`. Loop ini terus berjalan selama ada fakta baru yang berhasil disimpulkan.
- Sistem mencocokkan fakta-fakta yang ada di `workingMemory` dengan *kondisi (IF)* dari setiap aturan yang terdaftar.
- Fungsi pembantu `evaluateCondition` digunakan untuk mengecek operator logika dari setiap kondisi (contoh: apakah `jarak_rumah_km > 10`, atau `kemampuan_masak == 'baik'`).
- Jika **semua kondisi** dalam sebuah aturan terpenuhi (*allMet*), maka bagian *kesimpulan (THEN)* dari aturan tersebut akan memicu (fired) dan kesimpulannya ditambahkan ke dalam `workingMemory` sebagai **fakta baru**.
- Proses *looping* ini akan terus berulang. Fakta baru yang baru saja didapatkan bisa memicu aturan lain di putaran *loop* berikutnya. Jika sudah tidak ada aturan baru yang terpenuhi, loop akan berhenti.

## 3. Perhitungan Certainty Factor (CF Combine)
Bagaimana jika ada lebih dari 1 aturan yang menghasilkan kesimpulan yang sama? (Misalnya: Aturan P1 menyimpulkan kandidat cocok di "Frontliner" dengan CF 0.6, lalu Aturan P2 juga menyimpulkan kandidat cocok di "Frontliner" dengan CF 0.4).

Sistem menggunakan formula kombinasi probabilitas (CF Combine):
```text
CF_baru = CF_lama + CF_tambahan × (1 - CF_lama)
```
Dengan rumus ini, semakin banyak aturan yang mengarahkan pada kesimpulan yang sama, nilai probabilitas kesimpulannya (CF) akan semakin terakumulasi dan mendekati 1.0 (100%).

## 4. Penentuan Status Kelayakan (Stage 1)
Setelah tahap inferensi (pencarian fakta) selesai, sistem menentukan apakah kandidat layak diterima atau ditolak:
- **Disiplin Keras (Absolute Blocker):** Jika nilai `lulus_administrasi` adalah 'tidak' atau `lulus_wawancara` adalah 'tidak', maka status kandidat otomatis diset menjadi **'ditolak'** dengan CF 1.0. Sistem akan langsung membatalkan kelayakan kandidat.
- Jika lolos syarat mutlak, sistem akan mengecek *working memory* apakah status kandidat mengarah ke `'diterima'`, `'evaluasi_lanjut'`, atau `'perlu_pelatihan'` berdasarkan nilai CF tertinggi dari kesimpulan tahap 1.
- Sistem juga mengevaluasi faktor penurun nilai (seperti kecocokan rendah, konsistensi rendah, dan loyalitas rendah). Jika faktor ini ada, sistem akan menurunkan tingkat keyakinan (CF) dari status penerimaan.

## 5. Penentuan Rekomendasi Penempatan (Stage 2)
Jika kandidat dinyatakan layak, sistem akan menyaring semua aturan penempatan (*placement rules* / Stage 2) yang berhasil dieksekusi selama *looping*.
- Sistem mengumpulkan dan menggabungkan nilai CF untuk setiap posisi spesifik (`frontliner`, `kitchen`, `operasional`, dll) menggunakan rumus *CF combine* di atas.
- **Fallback Rule:** Jika ternyata kandidat tidak memenuhi kriteria penempatan spesifik apa pun, sistem akan merekomendasikan peran **'general_staff'** sebagai posisi default (dengan basis skor CF yang rendah).
- Terakhir, posisi-posisi tersebut diurutkan dari nilai CF terbesar ke terkecil. Posisi yang berada di urutan pertama (ber-CF tertinggi) akan ditetapkan sebagai **`best_placement`**.

## 6. Logging dan Pencatatan Khusus (Catatan)
Sistem memiliki mekanisme untuk mendeteksi *red-flags* (bendera merah) atau catatan khusus:
- Sistem mengecek variabel khusus di `workingMemory` (seperti `potensi_kendala_kehadiran` tinggi, `risiko_kendala`, atau indikasi `loyalitas` rendah).
- Jika flag tersebut aktif, sistem akan menyisipkan peringatan deskriptif ke dalam array `catatan` untuk memperingatkan HRD/Manajer.
- Selain itu, setiap aturan yang tereksekusi beserta alasannya akan dicatat ke dalam `inferenceLog`. Ini sangat penting agar sistem bersifat **Transparan (Explainable AI)**, sehingga HRD bisa tahu persis aturan mana saja yang menyebabkan kandidat mendapatkan rekomendasi tertentu.

---

### Kesimpulan Singkat
Sistem ini meniru cara berpikir HRD: 
1. **Membaca Data CV & Wawancara** (Fakta awal).
2. **Menghubungkan Fakta** (Menjalankan semua logika *If-Then* secara beruntun sampai mentok).
3. **Menggabungkan Tingkat Keyakinan** (Perhitungan akumulasi skor / CF).
4. **Menyaring Kandidat** (Membuang kandidat yang gagal syarat mutlak).
5. **Menghitung Rekomendasi** (Skor tertinggi untuk kelayakan & posisi divisi).
6. **Mencetak Laporan Lengkap** (Riwayat log, Catatan bahaya, dan Skor).

---

---

# Dokumentasi Kombinasi Aturan per Hasil Keputusan

Bagian ini mendokumentasikan secara rinci **kombinasi kondisi input** yang memicu setiap hasil keputusan sistem — baik status kelayakan (diterima, ditolak, dll) maupun rekomendasi posisi penempatan (frontliner, kitchen, dll). Setiap kombinasi disertai penjelasan logis mengapa kombinasi tersebut menghasilkan keputusan yang dimaksud.

> **Catatan:** Sistem bekerja secara bertahap (Stage 1 → Stage 2). Stage 1 menentukan *apakah kandidat layak*, Stage 2 menentukan *di mana kandidat ditempatkan*. Kedua stage dijalankan secara bersamaan dalam satu loop forward chaining, tetapi keputusan penempatan hanya relevan jika status kelayakan bukan `ditolak`.

---

## BAGIAN A — Status Kelayakan (Stage 1)

### ✅ A1. Status: DITERIMA (via Rule H8)

**Jalur paling umum dan langsung.**

| Kondisi Input yang Dibutuhkan | Nilai |
|-------------------------------|-------|
| `lulus_administrasi` | `ya` |
| `lulus_wawancara` | `ya` |
| `hasil_trial` | `baik` |

**Rantai aturan yang terpicu:**
```
[H6] lulus_administrasi = ya  →  lanjut_wawancara = ya  (CF 0.9)
[H7] lulus_wawancara = ya     →  lanjut_trial = ya      (CF 0.9)
[H8] hasil_trial = baik       →  diterima = ya           (CF 0.9)
```

**Mengapa kombinasi ini menghasilkan DITERIMA?**
Kandidat berhasil melewati seluruh tahapan seleksi secara berurutan: lolos administrasi, lolos wawancara, dan menunjukkan performa memuaskan saat trial kerja. Hasil trial adalah **bukti kerja nyata** yang paling kuat — kandidat sudah terbukti bisa bekerja di lingkungan FNB secara langsung. Oleh karena itu, H8 memiliki CF tertinggi (0.9) dan langsung memicu status `diterima`.

---

### ✅ A2. Status: DITERIMA (via Rule H13 — Jalur Alternatif)

**Jalur untuk kandidat berpengalaman dan berkarakter kuat, meski hasil trial tidak dinilai "baik".**

| Kondisi Input yang Dibutuhkan | Nilai |
|-------------------------------|-------|
| `disiplin` | `tinggi` |
| `sikap_ramah` | `baik` |
| `riwayat_kerja_bulan` | `≥ 3` (tidak memicu H11) |

**Rantai aturan yang terpicu:**
```
[H1]  sikap_ramah = baik                          →  hospitality = baik        (CF 0.9)
[H10] disiplin = tinggi AND hospitality = baik     →  kandidat_potensial = ya   (CF 0.9)
      [loyalitas tidak = rendah, karena riwayat_kerja ≥ 3 bulan]
[H13] kandidat_potensial = ya AND loyalitas = baik →  diterima = ya             (CF 0.9)
```

> **Catatan penting:** H13 membutuhkan `loyalitas = baik` sebagai fakta di working memory. Nilai ini **tidak diinput langsung** — ia hanya ada jika H11 *tidak* terpicu (riwayat kerja ≥ 3 bulan), dan HRD tidak memasukkan flag negatif loyalitas. Dalam implementasi saat ini, `loyalitas` hanya bisa bernilai `rendah` (dari H11) atau tidak ada di working memory sama sekali. Untuk memicu H13, perlu dipastikan `loyalitas` tidak dalam kondisi `rendah`.

**Mengapa kombinasi ini menghasilkan DITERIMA?**
Kandidat tidak hanya ramah, tetapi juga disiplin tinggi dan memiliki riwayat kerja yang stabil. Kombinasi ini mencerminkan profil karyawan yang *ideal secara karakter*. Sistem menyimpulkan kandidat ini adalah "kandidat potensial" (H10), dan karena rekam jejaknya tidak menunjukkan loyalitas rendah, H13 memvalidasi penerimaan dari sisi karakter dan track record.

---

### 🔄 A3. Status: PERLU PELATIHAN (via Rule H14)

| Kondisi Input yang Dibutuhkan | Nilai |
|-------------------------------|-------|
| `disiplin` | `tinggi` |
| `pengalaman_fnb_tahun` | `≤ 1` |
| `lulus_administrasi` | `ya` |
| `lulus_wawancara` | `ya` |
| `hasil_trial` | bukan `baik` (H8 tidak aktif) |

**Rantai aturan yang terpicu:**
```
[H6]  lulus_administrasi = ya                         →  lanjut_wawancara = ya    (CF 0.9)
[H7]  lulus_wawancara = ya                            →  lanjut_trial = ya        (CF 0.9)
[H14] disiplin = tinggi AND pengalaman_fnb_tahun ≤ 1  →  perlu_pelatihan = ya     (CF 0.8)
```

**Mengapa kombinasi ini menghasilkan PERLU PELATIHAN?**
Kandidat menunjukkan karakter yang sangat baik (disiplin tinggi adalah aset besar di FNB), tetapi pengalaman praktisnya masih sangat minim (≤ 1 tahun). Sistem mengenali bahwa kandidat ini *punya potensi besar* tetapi belum siap langsung terjun tanpa bimbingan. Daripada ditolak, sistem merekomendasikan kandidat ini untuk mengikuti program pelatihan terlebih dahulu. CF 0.8 mencerminkan keyakinan yang cukup tinggi bahwa pelatihan dapat mengisi kekurangan pengalaman.

---

### 🔄 A4. Status: EVALUASI LANJUT (via Rule H15)

| Kondisi Input yang Dibutuhkan | Nilai |
|-------------------------------|-------|
| `kemampuan_individu` | `baik` |
| `teamwork` | `rendah` |
| `lulus_administrasi` | `ya` |
| `lulus_wawancara` | `ya` |
| `hasil_trial` | bukan `baik` (H8 tidak aktif) |

**Rantai aturan yang terpicu:**
```
[H6]  lulus_administrasi = ya                         →  lanjut_wawancara = ya   (CF 0.9)
[H7]  lulus_wawancara = ya                            →  lanjut_trial = ya       (CF 0.9)
[H15] kemampuan_individu = baik AND teamwork = rendah →  evaluasi_lanjut = ya    (CF 0.7)
```

**Mengapa kombinasi ini menghasilkan EVALUASI LANJUT?**
Kandidat ini memiliki profil yang *kontradiktif*: secara teknis dan individual sangat capable, tetapi kemampuan bekerja dalam tim sangat rendah. Di industri FNB yang sangat bergantung pada kerja tim, ini adalah red flag yang signifikan. Namun sistem tidak langsung menolak karena kemampuan individunya tetap bernilai. Keputusan akhir diserahkan ke HRD untuk evaluasi lebih mendalam — mungkin ada posisi yang lebih cocok untuk bekerja secara mandiri. CF 0.7 (lebih rendah dari H8/H14) mencerminkan ketidakpastian ini.

---

### 🔄 A5. Status: EVALUASI LANJUT (via Rule H16 — Hasil Trial Cukup)

| Kondisi Input yang Dibutuhkan | Nilai |
|-------------------------------|-------|
| `lulus_administrasi` | `ya` |
| `lulus_wawancara` | `ya` |
| `hasil_trial` | `cukup` |

**Rantai aturan yang terpicu:**
```
[H6]  lulus_administrasi = ya  →  lanjut_wawancara = ya  (CF 0.9)
[H7]  lulus_wawancara = ya     →  lanjut_trial = ya      (CF 0.9)
[H16] hasil_trial = cukup      →  evaluasi_lanjut = ya   (CF 0.6)
```

**Mengapa `hasil_trial = cukup` menghasilkan EVALUASI LANJUT (bukan ditolak)?**
Hasil trial "cukup" berada di zona abu-abu — kandidat tidak gagal, tapi belum terbukti unggul. Menolak mereka secara langsung terlalu terburu-buru karena ada kemungkinan performa trial dipengaruhi faktor eksternal (stres hari pertama, lingkungan baru, dll). CF 0.6 yang lebih rendah dari H8 (0.9) mencerminkan bahwa ini adalah rekomendasi dengan keyakinan sedang — keputusan akhir tetap di tangan HRD setelah melakukan review tambahan.

> **Catatan:** Inilah perbaikan yang menutup hole untuk kasus seperti **Chikal Ubaidillah** — sebelum H16 ditambahkan, hasil trial "cukup" langsung jatuh ke status ditolak default (CF 0.3).

---

### ❌ A5. Status: DITOLAK — Absolute Blocker (Gagal Administrasi / Wawancara)

| Kondisi Input | Nilai | Efek |
|---------------|-------|------|
| `lulus_administrasi` | `tidak` | Langsung ditolak, CF = 1.0 |
| `lulus_wawancara` | `tidak` | Langsung ditolak, CF = 1.0 |

**Rantai aturan:**
```
[Hardcoded Blocker] lulus_administrasi = tidak  →  status = ditolak  (CF 1.0)
[Hardcoded Blocker] lulus_wawancara = tidak     →  status = ditolak  (CF 1.0)
```

**Mengapa kombinasi ini menghasilkan DITOLAK?**
Administrasi dan wawancara adalah **gerbang seleksi minimum**. Tidak lolos administrasi berarti kandidat tidak memenuhi persyaratan dasar dokumen (ijazah, usia, dll). Tidak lolos wawancara berarti kandidat gagal menunjukkan kriteria dasar karakter yang dibutuhkan. Tidak ada argumen lain yang bisa membatalkan kegagalan di tahap ini — CF 1.0 (100%) menegaskan kepastian penuh bahwa kandidat tidak bisa dilanjutkan.

---

### ❌ A6. Status: DITOLAK — Disqualifier dari Karakter (H5, H11, H12)

Kandidat lolos administrasi dan wawancara, tetapi memiliki satu atau lebih faktor diskualifikasi karakter:

| Rule | Kondisi Input | Kesimpulan | CF |
|------|---------------|------------|----|
| H5  | `mood = tidak_stabil` | `konsistensi = rendah` | 0.8 |
| H11 | `riwayat_kerja_bulan < 3` | `loyalitas = rendah` | 0.9 |
| H12 | `panik_saat_tekanan = ya` | `kecocokan = rendah` | 0.95 |

**Kondisi gabungan yang memicu penolakan:**
- Tidak ada aturan penerimaan yang aktif (H8 / H13 tidak terpicu), DAN
- Satu atau lebih dari H5, H11, H12 aktif

**Mengapa kombinasi ini menghasilkan DITOLAK?**

| Faktor | Penjelasan |
|--------|-----------|
| **H12 — Panik saat tekanan** (CF 0.95) | Lingkungan FNB, terutama saat *rush hour*, adalah lingkungan dengan tekanan sangat tinggi. Kandidat yang mudah panik berpotensi membuat kesalahan fatal (misdelivery, kecelakaan dapur) dan memperburuk kinerja tim. CF 0.95 adalah yang tertinggi di antara disqualifier karena risikonya paling langsung terhadap operasional. |
| **H5 — Mood tidak stabil** (CF 0.8) | Pelayanan pelanggan membutuhkan konsistensi emosional. Mood yang tidak stabil dapat merusak pengalaman pelanggan secara tidak terduga dan menciptakan konflik internal tim. |
| **H11 — Riwayat kerja < 3 bulan** (CF 0.9) | Riwayat kerja yang sangat singkat di tempat sebelumnya menunjukkan pola keluar cepat. Di industri FNB yang sudah memiliki turnover tinggi, merekrut kandidat semacam ini meningkatkan risiko investasi onboarding yang sia-sia. |

---

### ❌ A7. Status: DITOLAK — Tidak Memenuhi Kriteria Apapun (Default Rejection)

**Kondisi:** Kandidat lolos administrasi & wawancara, tetapi:
- `hasil_trial` = `cukup` atau `buruk` (H8 tidak aktif)
- `disiplin` bukan `tinggi` (H10 tidak aktif → H13 tidak aktif)
- `kemampuan_individu` bukan `baik` ATAU `teamwork` bukan `rendah` (H15 tidak aktif)
- `disiplin` bukan `tinggi` ATAU `pengalaman_fnb_tahun` > 1 (H14 tidak aktif)

**Tidak ada aturan penerimaan, pelatihan, atau evaluasi yang aktif → status default = `ditolak` dengan CF 0.3.**

**Mengapa?**
Kandidat tidak memberikan bukti yang cukup untuk diterima maupun untuk dipertimbangkan lebih lanjut. Hasil trial yang tidak memuaskan (bukan "baik") dan tidak ada profil karakter yang menonjol membuat sistem tidak dapat menemukan dasar rekomendasi yang valid. CF 0.3 mencerminkan bahwa ini bukan penolakan dengan keyakinan penuh — tetapi ketiadaan bukti penerimaan itu sendiri sudah cukup untuk tidak meneruskan kandidat.

> **Catatan khusus:** Inilah yang terjadi pada kasus **Chikal Ubaidillah** — `hasil_trial = cukup` (bukan "baik") sehingga H8 tidak aktif, dan tidak ada kombinasi lain yang memadai.

---

## BAGIAN B — Rekomendasi Penempatan (Stage 2)

> Stage 2 hanya relevan jika status kandidat **bukan** `ditolak`. Penempatan ditentukan berdasarkan aturan P1–P9 yang terpicu selama forward chaining.

---

### 🏪 B1. Penempatan: FRONTLINER (Rule P1)

| Kondisi Input yang Dibutuhkan | Nilai |
|-------------------------------|-------|
| `sikap_ramah` | `baik` |

**Rantai aturan:**
```
[H1] sikap_ramah = baik   →  hospitality = baik      (CF 0.9)
[P1] hospitality = baik   →  penempatan = frontliner  (CF 0.9)
```

**Mengapa sikap ramah mengarah ke Frontliner?**
Frontliner adalah wajah pertama yang dilihat pelanggan — kasir, penerima pesanan, pelayan. Pekerjaan ini menuntut kemampuan pelayanan (hospitality) yang prima setiap saat. H1 mengkonversi observasi wawancara (`sikap_ramah = baik`) menjadi variabel terukur `hospitality`, yang kemudian langsung digunakan P1 untuk merekomendasikan posisi ini. CF 0.9 mencerminkan keyakinan tinggi bahwa kandidat dengan hospitality baik akan berperforma baik sebagai frontliner.

**CF yang dihasilkan:** 0.9

---

### 🍳 B2. Penempatan: KITCHEN (Rule P2)

| Kondisi Input yang Dibutuhkan | Nilai |
|-------------------------------|-------|
| `kemampuan_masak` | `baik` |

**Rantai aturan:**
```
[P2] kemampuan_masak = baik  →  penempatan = kitchen  (CF 0.85)
```

**Mengapa kemampuan masak mengarah ke Kitchen?**
Posisi kitchen membutuhkan kompetensi teknis memasak yang nyata. P2 adalah aturan yang paling langsung — tidak membutuhkan rantai inferensi tambahan karena `kemampuan_masak` adalah fakta observasional yang sudah spesifik dan tidak ambigu. CF sedikit lebih rendah (0.85) dibanding frontliner karena kemampuan masak saja belum cukup — faktor fisik dan stamina juga berperan, meski tidak di-enforce secara ketat oleh P2.

**CF yang dihasilkan:** 0.85

---

### 🔧 B3. Penempatan: OPERASIONAL (Rule P3)

| Kondisi Input yang Dibutuhkan | Nilai |
|-------------------------------|-------|
| `fisik_kuat` | `ya` |

**Rantai aturan:**
```
[P3] fisik_kuat = ya  →  penempatan = operasional  (CF 0.8)
```

**Mengapa fisik kuat mengarah ke Operasional?**
Divisi operasional mencakup tugas-tugas fisik berat seperti bongkar-muat stok, pengaturan area, pembersihan peralatan besar, dan support logistik outlet. Kandidat yang tidak memiliki fisik kuat akan cepat kelelahan dan rentan cedera. P3 memiliki CF 0.8 (lebih rendah dari frontliner/kitchen) karena posisi operasional memang lebih fleksibel dan tidak membutuhkan spesialisasi keahlian tinggi.

**CF yang dihasilkan:** 0.8

---

### 👥 B4. Penempatan: GENERAL STAFF (Rule P9 — Fallback)

**Kondisi:** Tidak ada aturan P1, P2, atau P3 yang aktif (tidak ada penempatan spesifik).

| Kondisi yang TIDAK terpenuhi | Penjelasan |
|------------------------------|-----------|
| `sikap_ramah ≠ baik` | H1 tidak aktif → hospitality tidak baik → P1 gagal |
| `kemampuan_masak ≠ baik` | P2 gagal |
| `fisik_kuat ≠ ya` | P3 gagal |

**Rantai aturan:**
```
[P9] tidak_memenuhi_posisi = ya  →  penempatan = general_staff  (CF 0.6)
     [atau: fallback otomatis engine jika placements kosong, CF 0.4]
```

**Mengapa tidak ada posisi spesifik menghasilkan General Staff?**
General Staff adalah posisi serba-bisa (*multipurpose*) yang dapat mendukung frontliner, kitchen, maupun operasional sesuai kebutuhan harian outlet. Kandidat yang tidak unggul di satu bidang spesifik tetapi tetap lolos seleksi masih bisa berkontribusi sebagai general staff. CF 0.4–0.6 mencerminkan bahwa ini adalah keputusan *terbaik yang tersedia*, bukan keputusan ideal.

**CF yang dihasilkan:** 0.4 (fallback otomatis) atau 0.6 (jika P9 aktif secara eksplisit)

---

## BAGIAN C — Kombinasi Ganda: Kandidat dengan Beberapa Posisi Sekaligus

Sistem memungkinkan satu kandidat mendapatkan **lebih dari satu rekomendasi penempatan**, yang kemudian diurutkan berdasarkan CF tertinggi.

### C1. Frontliner + Kitchen (CF Gabungan Tertinggi)

**Profil kandidat:**
| Input | Nilai |
|-------|-------|
| `sikap_ramah` | `baik` |
| `kemampuan_masak` | `baik` |

**Aturan yang aktif:**
```
[H1] → hospitality = baik  →  [P1] penempatan = frontliner  (CF 0.9)
[P2] kemampuan_masak = baik → penempatan = kitchen          (CF 0.85)
```

**Hasil:** `best_placement = frontliner` (CF 0.9 > 0.85)

**Mengapa Frontliner dipilih sebagai yang terbaik?**
Keduanya valid, tetapi CF frontliner lebih tinggi. Kandidat ini ideal untuk frontliner *dan* bisa dijadikan backup kitchen jika dibutuhkan — fleksibilitas yang sangat berharga di outlet FNB skala kecil-menengah.

---

### C2. Frontliner + Operasional

**Profil kandidat:**
| Input | Nilai |
|-------|-------|
| `sikap_ramah` | `baik` |
| `fisik_kuat` | `ya` |

**Aturan yang aktif:**
```
[H1] → hospitality = baik  →  [P1] penempatan = frontliner   (CF 0.9)
[P3] fisik_kuat = ya       →       penempatan = operasional  (CF 0.8)
```

**Hasil:** `best_placement = frontliner` (CF 0.9 > 0.8)

---

### C3. Kitchen + Operasional

**Profil kandidat:**
| Input | Nilai |
|-------|-------|
| `kemampuan_masak` | `baik` |
| `fisik_kuat` | `ya` |

**Aturan yang aktif:**
```
[P2] kemampuan_masak = baik →  penempatan = kitchen      (CF 0.85)
[P3] fisik_kuat = ya        →  penempatan = operasional  (CF 0.8)
```

**Hasil:** `best_placement = kitchen` (CF 0.85 > 0.8)

---

## BAGIAN D — Flag & Catatan Tambahan (Bukan Penentu Utama)

Aturan berikut tidak menentukan status diterima/ditolak secara langsung, tetapi menghasilkan **catatan peringatan** yang muncul di laporan HRD:

| Rule | Kondisi | Flag yang Dihasilkan | Catatan untuk HRD |
|------|---------|---------------------|-------------------|
| H3 | `pengalaman_fnb_tahun > 2` | `adaptasi_kerja = lebih_cepat` | Kandidat berpengalaman, onboarding lebih singkat |
| H4 | `shift_malam = ya AND faktor_keamanan = perlu` | `pertimbangan_khusus = ya` | Perlu pertimbangan akomodasi/keamanan untuk shift malam |
| H9 | `shift_malam = ya AND memiliki_kendaraan = tidak` | `risiko_kendala = tinggi` | ⚠️ Risiko absensi shift malam — tidak punya kendaraan |
| P4 | `shift_malam = ya` | `perlu_pertimbangan = ya` | Perlu penjadwalan shift khusus |
| P5 | `pengalaman_fnb_tahun > 2` | `prioritas_penempatan = tinggi` | ⭐ Kandidat diprioritaskan karena pengalaman tinggi |
| P6 | `mobilitas_malam = terbatas` | `penempatan_shift = pagi_siang` | Rekomendasikan shift pagi/siang saja |
| P7 | `jarak_rumah_km > 10 AND akses_transportasi = sulit` | `potensi_kendala_kehadiran = tinggi` | 📍 Waspadai absensi akibat jarak & akses transportasi |
| P8 | `teamwork = baik` | `prioritas_diterima = ya` | Kandidat diutamakan karena kemampuan tim yang baik |

---

## Ringkasan Matriks Keputusan

| Status | Syarat Utama | Rules Kunci | CF Output |
|--------|-------------|-------------|-----------|
| **Diterima** | `hasil_trial = baik` | H6 → H7 → **H8** | 0.9 |
| **Diterima** | `disiplin = tinggi` + `sikap_ramah = baik` + riwayat stabil | H1 → H10 → **H13** | 0.9 |
| **Perlu Pelatihan** | `disiplin = tinggi` + `pengalaman ≤ 1 tahun` | **H14** | 0.8 |
| **Evaluasi Lanjut** | `kemampuan_individu = baik` + `teamwork = rendah` | **H15** | 0.7 |
| **Evaluasi Lanjut** | `hasil_trial = cukup` | **H16** | 0.6 |
| **Ditolak (keras)** | Gagal administrasi / wawancara | Blocker | 1.0 |
| **Ditolak (karakter)** | Panik / mood tidak stabil / loyalitas rendah | H5, H11, H12 | 0.8–0.95 |
| **Ditolak (default)** | Tidak ada aturan penerimaan terpicu | — | 0.3 |
| | | | |
| **Frontliner** | `sikap_ramah = baik` | H1 → **P1** | 0.9 |
| **Kitchen** | `kemampuan_masak = baik` | **P2** | 0.85 |
| **Operasional** | `fisik_kuat = ya` | **P3** | 0.8 |
| **General Staff** | Tidak ada posisi spesifik | P9 / Fallback | 0.4–0.6 |
