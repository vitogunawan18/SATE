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
