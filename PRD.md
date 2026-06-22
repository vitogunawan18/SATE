Berikut adalah rancangan *Product Requirements Document* (PRD) yang komprehensif untuk pengembangan Sistem Pakar Rekomendasi Penempatan Karyawan FNB. Dokumen ini dirancang khusus dengan arsitektur modern menggunakan Next.js dan disusun berdasarkan *knowledge base* final yang telah divalidasi pakar.

---

# PRODUCT REQUIREMENTS DOCUMENT (PRD)

**Nama Produk:** FNB Talent Placement Expert System
**Platform:** Web Application
**Tech Stack:** Next.js (App Router), Tailwind CSS, shadcn/ui, MongoDB Atlas

## 1. Pendahuluan

### 1.1 Tujuan Produk

Membangun aplikasi sistem pakar berbasis web yang mengotomatisasi proses evaluasi kelayakan dan penempatan posisi kandidat karyawan *Food and Beverage* (FNB). Sistem ini meniru logika pengambilan keputusan manajer HRD/Pakar menggunakan metode *Forward Chaining* dan mengakomodasi ketidakpastian data manusia menggunakan *Certainty Factor* (CF).

### 1.2 Ruang Lingkup

* Sistem membaca input fakta profil kandidat (hasil wawancara, observasi, dan tes).
* Sistem memproses Tahap 1: Penilaian Kelayakan (H1-H15).
* Sistem memproses Tahap 2: Penentuan Penempatan Kerja (P1-P9).
* Menghasilkan *output* rekomendasi status penerimaan, rekomendasi penempatan (Frontliner, Kitchen, Operasional, General Staff), serta catatan khusus terkait kandidat.

## 2. Pengguna Sasaran (User Personas)

* **HR Manager / Rekruter FNB:** Pengguna utama yang memasukkan data hasil wawancara dan melihat hasil rekomendasi sistem.
* **Administrator / Knowledge Engineer:** Pengguna yang memiliki akses untuk mengelola (CRUD) *knowledge base* (aturan dan nilai CF) di masa depan tanpa harus mengubah *source code*.

## 3. Arsitektur & Teknologi

* **Frontend & Backend:** Next.js (menggunakan fitur *Server Actions* atau *Route Handlers* untuk mengeksekusi mesin inferensi di *server-side* agar performa komputasi lebih optimal).
* **Styling & UI Components:** Tailwind CSS dikombinasikan dengan shadcn/ui untuk mempercepat iterasi komponen (seperti form, tabel, modal, dan *cards*).
* **Database:** MongoDB Atlas (NoSQL sangat cocok untuk menyimpan struktur fakta kandidat dan aturan yang fleksibel/bercabang).

## 4. Mesin Inferensi (Core Logic)

### 4.1 Forward Chaining

Sistem akan bekerja secara *data-driven*. Proses dimulai dari kumpulan fakta dasar yang diinputkan oleh HRD (misal: `pengalaman_fnb > 2 tahun`, `sikap_ramah = baik`). Mesin kemudian akan melakukan iterasi pencocokan premis (IF) pada aturan Tahap 1 dan Tahap 2 secara sekuensial. Jika kondisi terpenuhi, maka *conclusion* (THEN) akan ditambahkan sebagai fakta baru ke dalam memori kerja (*working memory*) hingga tidak ada lagi aturan yang bisa dieksekusi.

### 4.2 Certainty Factor (CF)

Setiap aturan memiliki nilai CF (0 hingga 1) yang merepresentasikan tingkat keyakinan pakar.

* Jika dua aturan menghasilkan kesimpulan yang sama untuk satu kandidat, sistem akan menggunakan rumus kombinasi untuk menggabungkan tingkat keyakinan:
$CF_{combine} = CF_1 + CF_2 \times (1 - CF_1)$
* Hasil akhir yang ditampilkan di *dashboard* akan dikonversi menjadi persentase (misalnya: "Kandidat direkomendasikan untuk Kitchen dengan tingkat keyakinan 85%").

## 5. Spesifikasi Fitur Utama

### 5.1 Modul Input Fakta Kandidat

* Formulir dinamis menggunakan komponen form dari shadcn/ui.
* Terbagi menjadi dua sesi pengisian:
* **Data Demografi & Teknis:** Jarak rumah, ketersediaan kendaraan, kemampuan masak, fisik, pengalaman.
* **Observasi Wawancara:** Sikap ramah, disiplin, *teamwork*, reaksi saat panik, *mood*.



### 5.2 Modul Dashboard Hasil (*Result Engine*)

* Menampilkan ringkasan kelayakan kandidat ("Diterima", "Evaluasi Lanjut", "Perlu Pelatihan", "Ditolak").
* Menampilkan rekomendasi penempatan dengan persentase CF tertingginya.
* Menampilkan **Log Inferensi (Reasoning Path)**: Menjelaskan kepada pengguna aturan mana saja yang aktif dan *trigger* keputusan tersebut (misal: "Kandidat ditempatkan di Kitchen karena: Kemampuan Masak Baik [Aturan P2 aktif]").

### 5.3 Modul Manajemen Pengetahuan (Rule Base CRUD)

* Antarmuka *tabel data* untuk menambah, mengedit, atau menghapus premis, kesimpulan, dan nilai CF.
* Fungsi validasi agar *knowledge engineer* tidak memasukkan variabel yang menyebabkan inkonsistensi (*subsumption*, *contradictory*).

## 6. Struktur Basis Data (MongoDB Draft Schema)

* **Collection `Candidates**`: Menyimpan biodata, input fakta mentah, serta *history* hasil inferensi.
* **Collection `Rules**`: Menyimpan logika *IF-THEN* secara dinamis. Format dokumen JSON sangat ideal:
```json
{
  "rule_id": "H1",
  "stage": 1,
  "conditions": [{ "attribute": "sikap_ramah", "operator": "==", "value": "baik" }],
  "conclusion": { "attribute": "hospitality", "value": "baik" },
  "cf": 0.9,
  "description": "Indikator hospitality dari sikap awal"
}

```



## 7. Rencana Antarmuka (UI/UX)

* **Estetika:** Pendekatan visual akan menggunakan tema minimalis dan modern. Konsep *Glassmorphism* ringan (latar belakang semi-transparan dengan *blur* efek) atau *Premium Silk* (palet warna halus, kontras yang bersih, dan tipografi yang elegan) akan diterapkan pada antarmuka *dashboard* dan komponen *card* hasil evaluasi untuk memberikan kesan profesional dan *high-end*.
* **Interaktivitas:** Menggunakan transisi halus (*framer-motion* atau animasi bawaan Tailwind) saat pengguna berpindah dari pengisian formulir Tahap 1 menuju hasil analisis Tahap 2.

---