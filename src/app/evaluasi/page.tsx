'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import type { CandidateFacts } from '@/lib/inference-engine';
import { 
  User, 
  MapPin, 
  Briefcase, 
  Clock, 
  Car, 
  Utensils, 
  Activity, 
  Smile, 
  Users, 
  Award, 
  Building2, 
  Store, 
  CheckCircle2, 
  Check, 
  FileText, 
  ArrowLeft, 
  ArrowRight,
  Sparkles,
  HelpCircle
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
      staggerChildren: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.3,
      ease: [0.22, 1, 0.36, 1],
    }
  }
} as const;

// Form interfaces
type FormFacts = {
  [K in keyof CandidateFacts]: K extends 'nama'
    ? string
    : K extends 'jarak_rumah_km' | 'pengalaman_fnb_tahun' | 'riwayat_kerja_bulan'
    ? number | ''
    : CandidateFacts[K] | '';
};

type RadioField = { key: keyof FormFacts; label: string; desc?: string; options: { v: string; l: string }[] };
type NumberField = { key: keyof FormFacts; label: string; desc?: string; min: number; max: number; unit: string };

const S1_NUM_FIELDS: NumberField[] = [
  { key: 'jarak_rumah_km', label: 'Jarak Rumah ke Lokasi Kerja', desc: 'Jarak tempuh memengaruhi risiko keterlambatan dan kebutuhan transportasi kandidat.', min: 1, max: 100, unit: 'km' },
  { key: 'pengalaman_fnb_tahun', label: 'Pengalaman Kerja F&B', desc: 'Total durasi akumulatif pengalaman kerja kandidat di industri Food & Beverage.', min: 0, max: 30, unit: 'tahun' },
  { key: 'riwayat_kerja_bulan', label: 'Riwayat Kerja Terlama di F&B', desc: 'Masa kerja terlama (dalam bulan) di satu outlet/perusahaan sebelumnya (mengukur loyalitas & stabilitas).', min: 0, max: 120, unit: 'bulan' },
];

const S1_RADIO_FIELDS: RadioField[] = [
  { key: 'lulus_administrasi', label: 'Kelayakan Administrasi', desc: 'Kelulusan berkas lamaran, kesesuaian umur, dokumen kelengkapan, dan kualifikasi dasar.', options: [{ v: 'ya', l: 'Lulus' }, { v: 'tidak', l: 'Tidak Lulus' }] },
  { key: 'memiliki_kendaraan', label: 'Kepemilikan Kendaraan Pribadi', desc: 'Sangat krusial untuk mobilitas, ketersediaan lembur, atau penempatan shift penutupan (closing).', options: [{ v: 'ya', l: 'Ada' }, { v: 'tidak', l: 'Tidak Ada' }] },
  { key: 'akses_transportasi', label: 'Akses Transportasi Umum', desc: 'Kemudahan akses transportasi (angkot, busway, KRL, ojek online) dari rumah ke outlet.', options: [{ v: 'mudah', l: 'Mudah' }, { v: 'sedang', l: 'Sedang' }, { v: 'sulit', l: 'Sulit' }] },
  { key: 'mobilitas_malam', label: 'Fleksibilitas Mobilitas Malam', desc: 'Kemampuan bepergian larut malam tanpa halangan izin keluarga atau kendala transportasi.', options: [{ v: 'bebas', l: 'Bebas' }, { v: 'terbatas', l: 'Terbatas' }] },
  { key: 'shift_malam', label: 'Ketersediaan Kerja Shift Malam', desc: 'Kesiapan kandidat jika ditempatkan pada shift malam (closing outlet, biasanya s.d. pukul 22:00 atau lebih).', options: [{ v: 'ya', l: 'Bersedia' }, { v: 'tidak', l: 'Tidak Bersedia' }] },
  { key: 'faktor_keamanan', label: 'Faktor Keamanan Malam Hari', desc: 'Apakah rute pulang atau lingkungan rumah kandidat memerlukan pertimbangan keamanan khusus saat larut malam.', options: [{ v: 'tidak', l: 'Aman / Tidak Masalah' }, { v: 'perlu', l: 'Perlu Pertimbangan' }] },
  { key: 'kemampuan_masak', label: 'Tingkat Kemampuan Memasak', desc: 'Penguasaan teknik memasak, pengolahan bahan (cutting), higienitas makanan, dan penggunaan alat dapur.', options: [{ v: 'baik', l: 'Baik' }, { v: 'cukup', l: 'Cukup' }, { v: 'tidak', l: 'Tidak Bisa' }] },
  { key: 'fisik_kuat', label: 'Kondisi Fisik / Ketahanan Tubuh', desc: 'Ketahanan berdiri lama (stand-by), ketahanan suhu panas (dapur), dan kemampuan mengangkat beban stok bahan.', options: [{ v: 'ya', l: 'Sangat Kuat' }, { v: 'tidak', l: 'Standar / Biasa' }] },
];

const S2_RADIO_FIELDS: RadioField[] = [
  { key: 'sikap_ramah', label: 'Sikap Keramahan (Hospitality)', desc: 'Ekspresi wajah, kesantunan, kontak mata, dan kemudahan senyum yang diobservasi selama rekrutmen.', options: [{ v: 'baik', l: 'Sangat Ramah' }, { v: 'cukup', l: 'Cukup Ramah' }, { v: 'kurang', l: 'Kurang Ramah' }] },
  { key: 'hadir_interview', label: 'Kehadiran Sesi Wawancara', desc: 'Ketepatan waktu kandidat saat hadir wawancara (representasi kedisiplinan awal).', options: [{ v: 'tepat_waktu', l: 'Tepat Waktu' }, { v: 'terlambat', l: 'Terlambat' }] },
  { key: 'disiplin', label: 'Penilaian Kedisiplinan Kandidat', desc: 'Sikap patuh instruksi, ketertiban pakaian/penampilan, dan ketepatan waktu umum kandidat.', options: [{ v: 'tinggi', l: 'Tinggi' }, { v: 'sedang', l: 'Sedang' }, { v: 'rendah', l: 'Rendah' }] },
  { key: 'teamwork', label: 'Kemampuan Bekerja Sama (Teamwork)', desc: 'Kemampuan kolaborasi, keramahtamahan antarrekan kerja, dan ego individu saat bekerja di bawah tim.', options: [{ v: 'baik', l: 'Sangat Baik' }, { v: 'cukup', l: 'Cukup' }, { v: 'rendah', l: 'Rendah' }] },
  { key: 'panik_saat_tekanan', label: 'Reaksi Bekerja di Bawah Tekanan', desc: 'Respons emosional ketika terjadi penumpukan pesanan pelanggan (rush hour) atau komplain langsung.', options: [{ v: 'tidak', l: 'Tetap Tenang' }, { v: 'ya', l: 'Mudah Panik' }] },
  { key: 'mood', label: 'Kestabilan Mood & Emosional', desc: 'Konsistensi emosi pelayanan agar tetap positif dan tidak terpengaruh masalah personal.', options: [{ v: 'stabil', l: 'Stabil' }, { v: 'tidak_stabil', l: 'Tidak Stabil' }] },
  { key: 'kemampuan_individu', label: 'Kemampuan Bekerja Mandiri', desc: 'Kecakapan menyelesaikan checklist tugas mandiri (seperti pembersihan area) tanpa instruksi berulang.', options: [{ v: 'baik', l: 'Mandiri' }, { v: 'cukup', l: 'Cukup Mandiri' }, { v: 'rendah', l: 'Perlu Arahan' }] },
  { key: 'lulus_wawancara', label: 'Hasil Kelulusan Wawancara', desc: 'Penilaian kelulusan akhir sesi interview kompetensi oleh HRD/Pewawancara.', options: [{ v: 'ya', l: 'Lulus' }, { v: 'tidak', l: 'Tidak Lulus' }] },
  { key: 'hasil_trial', label: 'Hasil Evaluasi Trial Kerja Nyata', desc: 'Evaluasi praktik langsung (magang singkat 1-3 hari) di stasiun kerja outlet F&B.', options: [{ v: 'baik', l: 'Baik / Memuaskan' }, { v: 'cukup', l: 'Cukup / Rata-rata' }, { v: 'buruk', l: 'Kurang / Buruk' }] },
];

const INITIAL_FACTS: FormFacts = {
  nama: '',
  jarak_rumah_km: '',
  memiliki_kendaraan: '',
  akses_transportasi: '',
  mobilitas_malam: '',
  shift_malam: '',
  faktor_keamanan: '',
  kemampuan_masak: '',
  fisik_kuat: '',
  pengalaman_fnb_tahun: '',
  riwayat_kerja_bulan: '',
  lulus_administrasi: '',
  
  sikap_ramah: '',
  hadir_interview: '',
  disiplin: '',
  teamwork: '',
  panik_saat_tekanan: '',
  mood: '',
  kemampuan_individu: '',
  lulus_wawancara: '',
  hasil_trial: '',
};

export default function EvaluasiPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormFacts>(INITIAL_FACTS);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormFacts, string>>>({});

  const [mounted, setMounted] = useState(false);
  const [hrdName, setHrdName] = useState('');
  const [companyName, setCompanyName] = useState('PT Sinar Agung Terang F&B');
  const [outletName, setOutletName] = useState('Kantor Pusat');
  
  // dialogue customization state
  const [userMode, setUserMode] = useState<'pemula' | 'pakar'>('pemula');

  // Load draft and mode from localstorage on mount
  useEffect(() => {
    setMounted(true);
    
    const savedMode = localStorage.getItem('fnb_user_mode');
    if (savedMode === 'pakar' || savedMode === 'pemula') {
      setUserMode(savedMode);
    }

    const savedDraft = localStorage.getItem('fnb_eval_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setForm(parsed);
      } catch (e) {
        console.error('Failed to restore form draft:', e);
      }
    }

    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setHrdName(data.user.name);
        }
      })
      .catch(err => console.error('Failed to load user session:', err));

    fetch('/api/settings/company')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          if (data.data.company_name) {
            setCompanyName(data.data.company_name);
          }
          if (data.data.outlet_name) {
            setOutletName(data.data.outlet_name);
          }
        }
      })
      .catch(err => console.error('Failed to load company settings:', err));
  }, []);

  // Autosave form draft when form changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('fnb_eval_draft', JSON.stringify(form));
    }
  }, [form, mounted]);

  // Autosave user mode when it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('fnb_user_mode', userMode);
    }
  }, [userMode, mounted]);

  const resetForm = () => {
    if (window.confirm('Apakah Anda yakin ingin mengosongkan seluruh formulir dan menghapus draf?')) {
      setForm(INITIAL_FACTS);
      localStorage.removeItem('fnb_eval_draft');
      setStep(1);
      setErrors({});
    }
  };

  const updateFact = (key: keyof FormFacts, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    // Clear error on change
    if (errors[key]) {
      setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof FormFacts, string>> = {};

    if (!form.nama.trim()) {
      newErrors.nama = 'Nama kandidat wajib diisi';
    } else if (form.nama.trim().length < 2) {
      newErrors.nama = 'Nama minimal 2 karakter';
    }

    if (!hrdName.trim()) {
      alert('Nama HRD / Evaluator tidak boleh kosong');
      return false;
    }
    if (!companyName.trim()) {
      alert('Nama perusahaan tidak boleh kosong');
      return false;
    }
    if (!outletName.trim()) {
      alert('Nama outlet / cabang tidak boleh kosong');
      return false;
    }

    if (form.jarak_rumah_km === '') {
      newErrors.jarak_rumah_km = 'Jarak rumah wajib diisi';
    } else if (form.jarak_rumah_km < 1 || form.jarak_rumah_km > 100) {
      newErrors.jarak_rumah_km = 'Jarak harus antara 1 – 100 km';
    }

    if (form.pengalaman_fnb_tahun === '') {
      newErrors.pengalaman_fnb_tahun = 'Pengalaman F&B wajib diisi';
    } else if (form.pengalaman_fnb_tahun < 0 || form.pengalaman_fnb_tahun > 30) {
      newErrors.pengalaman_fnb_tahun = 'Pengalaman harus antara 0 – 30 tahun';
    }

    if (form.riwayat_kerja_bulan === '') {
      newErrors.riwayat_kerja_bulan = 'Riwayat kerja wajib diisi';
    } else if (form.riwayat_kerja_bulan < 0 || form.riwayat_kerja_bulan > 120) {
      newErrors.riwayat_kerja_bulan = 'Riwayat kerja harus antara 0 – 120 bulan';
    }

    // Validate Step 1 Radio fields
    S1_RADIO_FIELDS.forEach((field) => {
      if (form[field.key] === '') {
        newErrors[field.key] = `${field.label} wajib dipilih`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Partial<Record<keyof FormFacts, string>> = {};

    S2_RADIO_FIELDS.forEach((field) => {
      if (form[field.key] === '') {
        newErrors[field.key] = `${field.label} wajib dipilih`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const executeAnalysis = async () => {
    if (!validateStep2()) {
      alert('Mohon lengkapi semua penilaian wawancara sebelum melanjutkan.');
      return;
    }

    setLoading(true);
    try {
      const sanitizedFacts: CandidateFacts = {
        ...form,
        jarak_rumah_km: form.jarak_rumah_km === '' ? 0 : Number(form.jarak_rumah_km),
        pengalaman_fnb_tahun: form.pengalaman_fnb_tahun === '' ? 0 : Number(form.pengalaman_fnb_tahun),
        riwayat_kerja_bulan: form.riwayat_kerja_bulan === '' ? 0 : Number(form.riwayat_kerja_bulan),
      } as CandidateFacts;

      const res = await fetch('/api/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facts: sanitizedFacts,
          hrd_name: hrdName,
          company_name: companyName,
          outlet_name: outletName,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan hasil evaluasi');
      }

      // Hapus draf dari LocalStorage karena evaluasi telah berhasil disimpan
      localStorage.removeItem('fnb_eval_draft');
      setForm(INITIAL_FACTS);

      router.push(`/hasil/${data.data.id}`);
    } catch (err: any) {
      console.error('Analysis execution error:', err);
      alert(err.message || 'Terjadi kesalahan saat menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: '60px' }} className="min-h-full">
      <AnimatePresence mode="wait">
        {!mounted ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-[60vh] flex flex-col items-center justify-center gap-4 bg-transparent"
          >
            <div className="w-10 h-10 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-slate-400 dark:text-[#7f8087] text-xs font-semibold uppercase tracking-wider animate-pulse">
              Memuat Formulir Evaluasi...
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            <style>{`
              .evaluasi-container {
                width: 100%;
              }
              
              .eval-grid-layout {
                display: grid;
                grid-template-columns: 1fr;
                gap: 24px;
                align-items: start;
              }

              /* Interactive Custom Pill selection */
              .pill-group {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                margin-top: 6px;
              }
              .pill-option {
                background-color: var(--color-surface-elevated);
                border: 1px solid var(--color-hairline-strong);
                color: var(--color-charcoal);
                padding: 10px 16px;
                border-radius: 12px;
                font-size: 13px;
                font-family: var(--font-sans), sans-serif;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
              }
              .pill-option:hover {
                background-color: var(--color-hover-overlay);
                border-color: var(--color-mute);
                color: var(--color-ink);
              }
              .pill-option.selected {
                background-color: var(--color-primary-white);
                color: var(--color-primary-on);
                border-color: var(--color-primary-white);
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(14, 165, 233, 0.18);
              }

              /* Navigation action footer */
              .action-bar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 40px;
                padding-top: 24px;
                border-top: 1px solid var(--color-hairline-strong);
                gap: 16px;
              }

              .company-outlet-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 16px;
              }
              @media (min-width: 640px) {
                .company-outlet-grid {
                  grid-template-columns: 1fr 1fr;
                }
              }

              .form-panel-card {
                order: 1;
                padding: 24px;
                background-color: var(--color-surface-card);
                border-radius: 2rem;
                border: 1px solid var(--color-hairline-strong);
                box-shadow: 0 4px 20px rgba(0,0,0,0.01);
              }

              .summary-panel {
                order: 2;
              }

              @media (min-width: 1024px) {
                .eval-grid-layout {
                  grid-template-columns: 360px 1fr;
                  gap: 32px;
                }
                .summary-panel {
                  position: sticky;
                  top: 24px;
                  order: 1;
                }
                .form-panel-card {
                  order: 2;
                  padding: 32px;
                }
              }
            `}</style>

            <div className="evaluasi-container">
              
              {/* Title Section */}
              <div className="page-header-group">
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div className="page-header-badge">
                    <Sparkles className="w-3.5 h-3.5 mr-1" />
                    Asesmen Penempatan
                  </div>
                  <h1 className="page-header-title">
                    Evaluasi & Penempatan Kerja
                  </h1>
                  <p className="page-header-subtitle">
                    Kumpulkan data administratif, ketersediaan operasional, dan hasil wawancara untuk merumuskan rekomendasi penempatan divisi kerja secara optimal.
                  </p>
                </div>
              </div>

              {/* Elegant Stepper Header with Mode Toggle */}
              <div className="mb-8 bg-white dark:bg-[#18181c] p-4 rounded-[1.5rem] border border-slate-100 dark:border-[#23232a] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 1 ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-emerald-500 text-white'}`}>
                      {step > 1 ? <Check className="w-4.5 h-4.5" /> : '1'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Langkah 1: Kelayakan Teknis</p>
                      <p className="text-[10px] text-slate-400 dark:text-[#7f8087]">Administrasi & Kompetensi Dasar</p>
                    </div>
                  </div>
                  
                  <div className="hidden sm:block flex-1 h-px bg-slate-100 dark:bg-slate-800 mx-4" />
                  
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 2 ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-slate-100 dark:bg-[#23232a] text-slate-400 dark:text-slate-500'}`}>
                      2
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Langkah 2: Observasi Wawancara</p>
                      <p className="text-[10px] text-slate-400 dark:text-[#7f8087]">Sikap & Evaluasi Trial</p>
                    </div>
                  </div>
                </div>

                {/* Dialogue Mode Selector */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#1f1f23] p-1 rounded-xl border border-slate-100 dark:border-slate-800/80 self-stretch lg:self-auto justify-center">
                  <button
                    type="button"
                    onClick={() => setUserMode('pemula')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${userMode === 'pemula' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
                  >
                    Mode Pemula
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserMode('pakar')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${userMode === 'pakar' ? 'bg-cyan-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'}`}
                  >
                    Mode Pakar
                  </button>
                </div>
              </div>

              {/* Workspace Grid */}
              <div className="eval-grid-layout">
                
                {/* COLUMN 1: CANDIDATE PROFILE SUMMARY CARD */}
                <div className="summary-panel">
                  <div className="bg-white dark:bg-[#18181c] rounded-[2rem] border border-slate-100 dark:border-[#23232a] p-6 shadow-sm">
                    {/* Header Card */}
                    <div className="flex items-center gap-3.5 pb-5 border-b border-slate-100 dark:border-[#23232a]">
                      <div className="w-11 h-11 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center shadow-inner">
                        <User className="w-5.5 h-5.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white truncate" title={form.nama}>
                          {form.nama || 'Belum Diisi'}
                        </h3>
                        <span className="text-[9px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full inline-block mt-0.5 uppercase tracking-wider">
                          Rangkuman Kandidat
                        </span>
                      </div>
                    </div>

                    {/* Content list */}
                    <div className="py-5 flex flex-col gap-4">
                      {/* Section 1: Administrasi & Lokasi */}
                      <div>
                        <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">Administrasi & Cabang</p>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Building2 className="w-3.5 h-3.5" />
                              <span>Perusahaan</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-right truncate max-w-[140px]" title={companyName}>
                              {companyName || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Store className="w-3.5 h-3.5" />
                              <span>Outlet / Cabang</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 text-right truncate max-w-[140px]" title={outletName}>
                              {outletName || '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Kelayakan Adm.</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${form.lulus_administrasi === 'ya' ? 'text-emerald-500 bg-emerald-500/10' : form.lulus_administrasi === 'tidak' ? 'text-rose-500 bg-rose-500/10' : 'text-slate-400 bg-slate-100 dark:bg-slate-800'}`}>
                              {form.lulus_administrasi === 'ya' ? 'LULUS' : form.lulus_administrasi === 'tidak' ? 'GAGAL' : 'BELUM DIISI'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <MapPin className="w-3.5 h-3.5" />
                              <span>Jarak Rumah</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {form.jarak_rumah_km !== '' ? `${form.jarak_rumah_km} km` : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800" />

                      {/* Section 2: Kompetensi */}
                      <div>
                        <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">Kapasitas Kerja & Fisik</p>
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Briefcase className="w-3.5 h-3.5" />
                              <span>Pengalaman F&B</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {form.pengalaman_fnb_tahun !== '' ? `${form.pengalaman_fnb_tahun} tahun` : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Kerja Terlama</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {form.riwayat_kerja_bulan !== '' ? `${form.riwayat_kerja_bulan} bulan` : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Activity className="w-3.5 h-3.5" />
                              <span>Daya Fisik</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200">
                              {form.fisik_kuat === 'ya' ? 'Sangat Kuat' : form.fisik_kuat === 'tidak' ? 'Standar' : '—'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                              <Utensils className="w-3.5 h-3.5" />
                              <span>Keahlian Memasak</span>
                            </div>
                            <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                              {form.kemampuan_masak || '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Step 2 summary info */}
                      {step === 2 && (
                        <>
                          <div className="h-px bg-slate-100 dark:bg-slate-800" />
                          <div>
                            <p className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider mb-2">Evaluasi Perilaku</p>
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                  <Smile className="w-3.5 h-3.5" />
                                  <span>Hospitality</span>
                                </div>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                                  {form.sikap_ramah === 'baik' ? 'Sangat Ramah' : form.sikap_ramah === 'cukup' ? 'Cukup' : form.sikap_ramah === 'kurang' ? 'Kurang' : '—'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Wawancara</span>
                                </div>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">
                                  {form.hadir_interview ? form.hadir_interview.replace('_', ' ') : '—'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Kedisiplinan</span>
                                </div>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{form.disiplin || '—'}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                  <Users className="w-3.5 h-3.5" />
                                  <span>Teamwork</span>
                                </div>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{form.teamwork || '—'}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs">
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Trial Kerja</span>
                                </div>
                                <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{form.hasil_trial || '—'}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-[#23232a] text-center">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-relaxed block">
                        Informasi yang dihimpun akan diolah secara real-time oleh mesin inferensi.
                      </span>
                    </div>
                  </div>
                </div>

                {/* COLUMN 2: FORM CONTROLS */}
                <div className="elevation-card form-panel-card">
                  <AnimatePresence mode="wait">
                    {step === 1 ? (
                      <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
                      >
                        {/* Metadata inputs are removed from here as they are managed in Settings */}

                        {/* Candidate Name Input */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 }}
                        >
                          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                            Nama Lengkap Kandidat *
                          </label>
                          {userMode === 'pemula' && (
                            <p className="mb-2 text-[11px] leading-relaxed text-slate-400 dark:text-[#7f8087]">
                              Masukkan nama lengkap kandidat sesuai dengan berkas identitas resmi.
                            </p>
                          )}
                          <input
                            type="text"
                            className="text-input-editorial"
                            placeholder="Contoh: Amanda Rahma"
                            value={form.nama}
                            onChange={(e) => updateFact('nama', e.target.value)}
                            style={errors.nama ? { borderColor: 'var(--color-accent-red)' } : {}}
                          />
                          {errors.nama && (
                            <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                              ⚠ {errors.nama}
                            </p>
                          )}
                        </motion.div>

                        {/* Numbers fields */}
                        {S1_NUM_FIELDS.map((field, idx) => (
                          <motion.div 
                            key={field.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + idx * 0.05 }}
                          >
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                              {field.label}
                            </label>
                            {userMode === 'pemula' && field.desc && (
                              <p className="mb-2 text-[11px] leading-relaxed text-slate-400 dark:text-[#7f8087]">
                                {field.desc}
                              </p>
                            )}
                            <div className="relative flex items-center max-w-[200px]">
                              <input
                                type="number"
                                min={field.min}
                                max={field.max}
                                className="text-input-editorial pr-14"
                                style={errors[field.key] ? { borderColor: 'var(--color-accent-red)' } : {}}
                                value={form[field.key]}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateFact(field.key, val === '' ? '' : Number(val));
                                }}
                              />
                              <div className="absolute right-3.5 text-xs text-slate-400 dark:text-slate-500 font-semibold pointer-events-none bg-white dark:bg-[#18181c] pl-1">
                                {field.unit}
                              </div>
                            </div>
                            
                            {errors[field.key] && (
                              <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                                ⚠ {errors[field.key]}
                              </p>
                            )}
                          </motion.div>
                        ))}

                        <div className="h-px bg-slate-100 dark:bg-slate-800/80 my-2" />

                        {/* Radio groups styled as pills */}
                        {S1_RADIO_FIELDS.map((field, idx) => (
                          <motion.div 
                            key={field.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + idx * 0.04 }}
                          >
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                              {field.label}
                            </label>
                            {userMode === 'pemula' && field.desc && (
                              <p className="mb-2 text-[11px] leading-relaxed text-slate-400 dark:text-[#7f8087]">
                                {field.desc}
                              </p>
                            )}
                            <div className="pill-group">
                              {field.options.map((opt) => (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  key={opt.v}
                                  type="button"
                                  onClick={() => updateFact(field.key, opt.v)}
                                  className={`pill-option ${form[field.key] === opt.v ? 'selected' : ''}`}
                                >
                                  {opt.l}
                                </motion.button>
                              ))}
                            </div>
                            {errors[field.key] && (
                              <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                                ⚠ {errors[field.key]}
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.3 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
                      >
                        {S2_RADIO_FIELDS.map((field, idx) => (
                          <motion.div 
                            key={field.key}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.04 }}
                          >
                            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">
                              {field.label}
                            </label>
                            {userMode === 'pemula' && field.desc && (
                              <p className="mb-2 text-[11px] leading-relaxed text-slate-400 dark:text-[#7f8087]">
                                {field.desc}
                              </p>
                            )}
                            <div className="pill-group">
                              {field.options.map((opt) => (
                                <motion.button
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  key={opt.v}
                                  type="button"
                                  onClick={() => updateFact(field.key, opt.v)}
                                  className={`pill-option ${form[field.key] === opt.v ? 'selected' : ''}`}
                                >
                                  {opt.l}
                                </motion.button>
                              ))}
                            </div>
                            {errors[field.key] && (
                              <p className="mt-1 text-xs text-rose-500 font-medium flex items-center gap-1">
                                ⚠ {errors[field.key]}
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Stepper buttons with Reset Form */}
                  <div className="action-bar">
                    <div className="flex items-center gap-2">
                      {step > 1 && (
                        <button
                          type="button"
                          className="btn-ghost-editorial touch-target-mobile flex items-center gap-1.5"
                          onClick={() => setStep(1)}
                        >
                          <ArrowLeft className="w-4 h-4" />
                          Kembali
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-rose-500 dark:text-rose-400 text-xs font-semibold uppercase tracking-wider transition-colors duration-200 touch-target-mobile"
                      >
                        Reset Formulir
                      </button>
                    </div>

                    {step === 1 ? (
                      <button
                        type="button"
                        className="btn-primary-editorial touch-target-mobile flex items-center gap-1.5"
                        onClick={() => {
                          if (validateStep1()) setStep(2);
                        }}
                      >
                        Lanjut ke Wawancara
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary-editorial touch-target-mobile flex items-center gap-2"
                        disabled={loading}
                        onClick={executeAnalysis}
                        style={{
                          opacity: loading ? 0.7 : 1,
                        }}
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Memproses...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Proses Rekomendasi Penempatan
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
