Berdasarkan hasil analisis inkonsistensi, verifikasi formal, analisis kelengkapan (*completeness/hole*), serta rekomendasi perbaikan yang telah divalidasi oleh pakar (**Dr. Rohimat Nurhasan, S.E., M.Si**), berikut adalah **Daftar Aturan Final (Final Rules)** yang telah diperbaiki dan distandarisasi.

---

## Aturan Standardisasi & Perubahan Utama

* **Penyelarasan Istilah:** Semua istilah subjek diseragamkan menggunakan kata **"kandidat"** (menghilangkan istilah "karyawan" pada Tahap 2 untuk menjaga konsistensi unifikasi).
* **Penghapusan Bias & Variabel Objektif:** Mengubah aturan bias gender (H4) dan menambahkan variabel akses transportasi (P7).
* **Penanganan Hole:** Menambahkan 3 aturan baru (H14, H15, P9) untuk menutup kombinasi yang belum tercakup.

---

## BASIS PENGETAHUAN FINAL (FINAL KNOWLEDGE BASE)

### TAHAP 1: Penilaian Kelayakan Kandidat (H1 - H15)

* **[H1]** IF sikap_ramah = baik THEN hospitality = baik CF 0.9
* **[H2]** IF hadir_interview = tepat_waktu THEN indikasi_disiplin_awal = baik CF 0.6 *(Diubah: Menegaskan indikator awal)*
* **[H3]** IF pengalaman_fnb > 2_tahun THEN adaptasi_kerja = lebih_cepat CF 0.7 *(Diubah: Penyesuaian CF & interpretasi lebih realistis)*
* **[H4]** IF shift = malam AND faktor_keamanan = perlu THEN pertimbangan_khusus = ya CF 0.8 *(Diubah: Rekomendasi pakar untuk menghilangkan bias gender)*
* **[H5]** IF mood = tidak_stabil THEN konsistensi = rendah CF 0.8
* **[H6]** IF lulus_administrasi = ya THEN lanjut_wawancara = ya CF 0.9
* **[H7]** IF lulus_wawancara = ya THEN lanjut_trial = ya CF 0.9
* **[H8]** IF hasil_trial = baik THEN diterima = ya CF 0.9
* **[H9]** IF shift = malam AND tidak_ada_kendaraan THEN risiko_kendala = tinggi CF 0.8
* **[H10]** IF disiplin = tinggi AND hospitality = baik THEN kandidat_potensial = ya CF 0.9
* **[H11]** IF riwayat_kerja < 3_bulan THEN loyalitas = rendah CF 0.9
* **[H12]** IF panik_saat_tekanan = ya THEN kecocokan = rendah CF 0.95
* **[H13]** IF kandidat_potensial = ya AND loyalitas = baik THEN diterima = ya CF 0.9
* **[H14]** IF disiplin = tinggi AND pengalaman = rendah THEN perlu_pelatihan = ya CF 0.8 *(Aturan Baru: Penanganan Hole Kasus 1)*
* **[H15]** IF kemampuan_individu = baik AND teamwork = rendah THEN evaluasi_lanjut = ya CF 0.7 *(Aturan Baru: Penanganan Hole Kasus 2)*

---

### TAHAP 2: Penentuan Penempatan Kerja (P1 - P9)

* **[P1]** IF hospitality = baik THEN penempatan = frontliner CF 0.9
* **[P2]** IF kemampuan_masak = baik THEN penempatan = kitchen CF 0.85
* **[P3]** IF fisik_kuat = ya THEN penempatan = operasional CF 0.8
* **[P4]** IF shift = malam THEN pertimbangan_khusus = ya CF 0.8 *(Catatan: Tetap dipertahankan sebagai aturan penyaring umum/workflow)*
* **[P5]** IF pengalaman_fnb = tinggi THEN prioritas_penempatan = tinggi CF 0.8
* **[P6]** IF mobilitas_malam = terbatas THEN penempatan = shift_pagi_siang CF 0.9 *(Diubah: Istilah disesuaikan menjadi "kandidat" pada mesin inferensi)*
* **[P7]** IF jarak_rumah > 10km AND akses_transportasi = sulit THEN potensi_kendala_kehadiran = tinggi CF 0.5 *(Diubah: Penambahan variabel akses transportasi sesuai hasil refutation)*
* **[P8]** IF teamwork = baik THEN prioritas_diterima = ya CF 0.8
* **[P9]** IF tidak_memenuhi_posisi THEN penempatan = general_staff CF 0.6 *(Aturan Baru: Penanganan Hole Kasus 3)*

---