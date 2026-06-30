### 1. Aturan Tahap 1: Penilaian Kelayakan Kandidat (H1 - H13)

* **[H1]** IF sikap_ramah = baik THEN hospitality = baik CF 0.9


* **[H2]** IF hadir_interview = tepat_waktu THEN indikasi_disiplin_awal = baik CF 0.6 *(Diubah agar hanya menjadi indikasi awal, bukan representasi disiplin penuh)*

* **[H3]** IF pengalaman_fnb > 2_tahun THEN adaptasi_kerja = lebih_cepat CF 0.7 *(Tingkat keyakinan diturunkan dan kesimpulan disesuaikan agar tidak terlalu absolut)*

* **[H4]** IF shift = malam AND faktor_keamanan = perlu THEN pertimbangan_khusus = ya CF 0.8 *(Diubah untuk menghilangkan bias gender/generalisasi)*

* **[H5]** IF mood = tidak_stabil THEN konsistensi = rendah CF 0.8


* **[H6]** IF lulus_administrasi = ya THEN lanjut_wawancara = ya CF 0.9


* **[H7]** IF lulus_wawancara = ya THEN lanjut_trial = ya CF 0.9


* **[H8]** IF hasil_trial = baik THEN diterima = ya CF 0.9


* **[H9]** IF shift = malam AND tidak_ada_kendaraan THEN risiko_kendala = tinggi CF 0.8


* **[H10]** IF disiplin = tinggi AND hospitality = baik THEN kandidat_potensial = ya CF 0.9


* **[H11]** IF riwayat_kerja < 3_bulan THEN loyalitas = rendah CF 0.9


* **[H12]** IF panik_saat_tekanan = ya THEN kecocokan = rendah CF 0.95


* **[H13]** IF kandidat_potensial = ya AND loyalitas = baik THEN diterima = ya CF 0.9



### 2. Aturan Tahap 2: Penentuan Penempatan Kerja (P1 - P8)

* **[P1]** IF hospitality = baik THEN penempatan = frontliner CF 0.9


* **[P2]** IF kemampuan_masak = baik THEN penempatan = kitchen CF 0.85


* **[P3]** IF fisik_kuat = ya THEN penempatan = operasional CF 0.8


* **[P4]** IF shift = malam THEN perlu_pertimbangan = ya CF 0.8


* **[P5]** IF pengalaman_fnb = tinggi THEN prioritas_penempatan = tinggi CF 0.8


* **[P6]** IF mobilitas_malam = terbatas THEN penempatan = shift_pagi_siang CF 0.9


* **[P7]** IF jarak_rumah > 10km AND akses_transportasi = sulit THEN potensi_kendala_kehadiran = tinggi CF 0.5 *(Diubah dengan menambahkan variabel akses transportasi)*

* **[P8]** IF teamwork = baik THEN prioritas_diterima = ya CF 0.8



### 3. Aturan Tambahan (Mengatasi Kasus Kosong / *Hole*)

Berdasarkan analisis kelengkapan (*completeness analysis*), aturan tambahan berikut dimasukkan untuk menangani kombinasi kondisi yang sebelumnya belum tercakup oleh sistem:

* **[Aturan Tambahan 1]** IF disiplin = tinggi AND pengalaman = rendah THEN perlu_pelatihan = ya CF 0.8


* **[Aturan Tambahan 2]** IF kemampuan_individu = baik AND teamwork = rendah THEN evaluasi_lanjut = ya CF 0.7


* **[Aturan Tambahan 3]** IF hasil_trial = cukup THEN evaluasi_lanjut = ya CF 0.6 *(Menutup hole: hasil trial rata-rata tidak langsung ditolak, melainkan dievaluasi lebih lanjut oleh HRD)*


* **[Aturan Tambahan 4]** IF tidak_memenuhi_posisi THEN penempatan = general_staff CF 0.6



**Catatan Standarisasi Variabel:**
Sesuai dengan hasil analisis teknik *unification*, seluruh istilah subjek pada basis pengetahuan final ini telah distandarisasi secara konsisten menggunakan istilah **"kandidat"** (bukan mencampuradukkan kata "kandidat" dan "karyawan") agar tidak terjadi inkonsistensi pada proses pencocokan variabel di sistem inferensi.