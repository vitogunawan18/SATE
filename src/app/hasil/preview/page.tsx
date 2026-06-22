'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import type { InferenceResult } from '@/lib/inference-engine';
import { generateDetailedAuditReport } from '@/lib/audit-helper';

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

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
} as const;

function formatCF(cf: number) {
  return `${Math.round(cf * 100)}%`;
}

const STATUS_CFG: Record<string, { label: string; icon: string; color: string; bg: string; border: string }> = {
  diterima: { label: 'Diterima', icon: '✓', color: 'var(--color-accent-green)', bg: 'rgba(17,255,153,0.05)', border: 'rgba(17,255,153,0.15)' },
  evaluasi_lanjut: { label: 'Evaluasi Lanjut', icon: '🔍', color: 'var(--color-accent-yellow)', bg: 'rgba(255,197,61,0.05)', border: 'rgba(255,197,61,0.15)' },
  perlu_pelatihan: { label: 'Perlu Pelatihan', icon: '📚', color: 'var(--color-accent-blue)', bg: 'rgba(59,158,255,0.05)', border: 'rgba(59,158,255,0.15)' },
  ditolak: { label: 'Tidak Direkomendasikan', icon: '✗', color: 'var(--color-accent-red)', bg: 'rgba(255,32,71,0.05)', border: 'rgba(255,32,71,0.15)' },
};

const POSITION_CFG: Record<string, { label: string; icon: string; color: string; desc: string }> = {
  frontliner: { label: 'Frontliner', icon: '🤝', color: '#3b9eff', desc: 'Pelayanan pelanggan, kasir, host' },
  kitchen: { label: 'Kitchen', icon: '👨‍🍳', color: '#ffc53d', desc: 'Memasak, persiapan makanan, plating' },
  operasional: { label: 'Operasional', icon: '⚙️', color: '#11ff99', desc: 'Logistik, ketersediaan stok, operasional outlet' },
  general_staff: { label: 'General Staff', icon: '👔', color: '#888e90', desc: 'Posisi administrasi atau penunjang umum' },
};

function getFactValue(key: string, value: unknown) {
  if (value === undefined || value === null) return '—';
  const valStr = String(value).toLowerCase();
  
  if (key === 'sikap_ramah') {
    if (valStr === 'baik') return 'Sangat Ramah';
    if (valStr === 'cukup') return 'Cukup Ramah';
    return 'Kurang Ramah';
  }
  if (key === 'hadir_interview') {
    return valStr === 'tepat_waktu' ? 'Tepat Waktu' : 'Terlambat';
  }
  if (key === 'disiplin') {
    if (valStr === 'tinggi') return 'Tinggi';
    if (valStr === 'sedang') return 'Sedang';
    return 'Rendah';
  }
  if (key === 'teamwork') {
    if (valStr === 'baik') return 'Baik / Kooperatif';
    if (valStr === 'cukup') return 'Cukup';
    return 'Rendah / Pasif';
  }
  if (key === 'hasil_trial') {
    if (valStr === 'baik') return 'Baik / Memuaskan';
    if (valStr === 'cukup') return 'Cukup';
    return 'Buruk / Kurang';
  }
  if (key === 'fisik_kuat') {
    return valStr === 'ya' ? 'Sangat Kuat' : 'Standar';
  }
  if (key === 'kemampuan_masak') {
    if (valStr === 'baik') return 'Menguasai';
    if (valStr === 'cukup') return 'Cukup Bisa';
    return 'Tidak Bisa';
  }
  if (key === 'jarak_rumah_km') {
    return `${value} km`;
  }
  if (key === 'pengalaman_fnb_tahun') {
    return `${value} tahun`;
  }
  if (key === 'riwayat_kerja_bulan') {
    return `${value} bulan`;
  }
  if (key === 'lulus_administrasi' || key === 'lulus_wawancancara' || key === 'shift_malam') {
    return valStr === 'ya' ? 'Ya' : 'Tidak';
  }
  if (key === 'memiliki_kendaraan') {
    return valStr === 'ya' ? 'Ada' : 'Tidak Ada';
  }
  
  return String(value);
}

const RULE_TRANSITION_MAP: Record<string, string> = {
  H1: 'Kandidat ramah ➔ Hospitality baik',
  H2: 'Hadir tepat waktu ➔ Indikasi disiplin awal baik',
  H3: 'Pengalaman F&B > 2 tahun ➔ Adaptasi kerja lebih cepat',
  H4: 'Shift malam & Perlu keamanan ➔ Pertimbangan khusus',
  H5: 'Mood tidak stabil ➔ Konsistensi rendah',
  H6: 'Lulus administrasi ➔ Lanjut wawancara',
  H7: 'Lulus wawancara ➔ Lanjut trial',
  H8: 'Hasil trial baik ➔ Diterima',
  H9: 'Shift malam & Tanpa kendaraan ➔ Risiko kendala tinggi',
  H10: 'Disiplin tinggi & Hospitality baik ➔ Kandidat potensial',
  H11: 'Riwayat kerja < 3 bulan ➔ Loyalitas rendah',
  H12: 'Panik saat tekanan ➔ Kecocokan rendah',
  H13: 'Kandidat potensial & Loyalitas baik ➔ Diterima',
  H14: 'Disiplin tinggi & Pengalaman rendah ➔ Perlu pelatihan',
  H15: 'Kemampuan individu baik & Teamwork rendah ➔ Evaluasi lanjut',
  P1: 'Hospitality baik ➔ Cocok Frontliner',
  P2: 'Kemampuan masak baik ➔ Cocok Kitchen',
  P3: 'Fisik kuat ➔ Cocok Operasional',
  P4: 'Shift malam ➔ Pertimbangan khusus',
  P5: 'Pengalaman F&B tinggi ➔ Prioritas penempatan tinggi',
  P6: 'Mobilitas malam terbatas ➔ Penempatan shift pagi/siang',
  P7: 'Jarak jauh & Akses transportasi sulit ➔ Potensi kendala kehadiran',
  P8: 'Teamwork baik ➔ Prioritas diterima',
  P9: 'Tidak memenuhi posisi spesifik ➔ Cocok General Staff',
};

export default function HasilPage() {
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'ringkasan' | 'log'>('ringkasan');
  const [logicOpen, setLogicOpen] = useState(false);
  const [hrdName, setHrdName] = useState<string>('HR Manager');
  const [companyName, setCompanyName] = useState<string>('PT Sinar Agung Terang F&B');
  const [outletName, setOutletName] = useState<string>('Kantor Pusat');
  const [docYear, setDocYear] = useState<string>('2026');
  const [docDate, setDocDate] = useState<string>('');
  const [scale, setScale] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (result) {
      const timer = setTimeout(() => setChartReady(true), 600);
      return () => clearTimeout(timer);
    }
  }, [result]);

  useEffect(() => {
    const handleResize = () => {
      const targetWidth = 680;
      const padding = 64; // Adjusted to 64px to leave room for the shadow on left and right
      const availableWidth = window.innerWidth - padding;
      if (availableWidth < targetWidth) {
        setScale(availableWidth / targetWidth);
      } else {
        setScale(1);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [companyAddress, setCompanyAddress] = useState<string>('Gedung Sinar Agung, Lantai 5, Jl. H.R. Rasuna Said Kav. B-10, Jakarta Selatan 12920');
  const [companyPhone, setCompanyPhone] = useState<string>('(021) 520-4567');
  const [companyEmail, setCompanyEmail] = useState<string>('hr@sinaragungterang.co.id');
  const [companyWebsite, setCompanyWebsite] = useState<string>('www.sinaragungterang.co.id');
  const [companyLogo, setCompanyLogo] = useState<string>('');

  useEffect(() => {
    const raw = sessionStorage.getItem('fnb_result');
    
    // Fetch settings
    fetch('/api/settings/company')
      .then(res => res.json())
      .then(settingsData => {
        let candCompany = 'PT Sinar Agung Terang F&B';
        
        if (raw) {
          const parsed = JSON.parse(raw);
          setResult(parsed);
          if (parsed.hrd_name) setHrdName(parsed.hrd_name);
          if (parsed.company_name) {
            candCompany = parsed.company_name;
            setCompanyName(parsed.company_name);
          }
          if (parsed.outlet_name) setOutletName(parsed.outlet_name);
          setDocYear(new Date().getFullYear().toString());
          setDocDate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
        } else {
          setDocYear(new Date().getFullYear().toString());
          setDocDate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
        }

        if (settingsData.success && settingsData.data) {
          const settingsCompName = settingsData.data.company_name || 'PT Sinar Agung Terang F&B';
          if (candCompany === settingsCompName || candCompany === 'PT Sinar Agung Terang F&B') {
            if (candCompany === 'PT Sinar Agung Terang F&B' && settingsCompName !== 'PT Sinar Agung Terang F&B') {
              setCompanyName(settingsCompName);
            }
            setCompanyAddress(settingsData.data.address || 'Gedung Sinar Agung, Lantai 5, Jl. H.R. Rasuna Said Kav. B-10, Jakarta Selatan 12920');
            setCompanyPhone(settingsData.data.phone || '');
            setCompanyEmail(settingsData.data.email || '');
            setCompanyWebsite(settingsData.data.website || '');
            setCompanyLogo(settingsData.data.logo || '');
          }
        }
      })
      .catch(err => {
        console.error('Error loading settings on preview page:', err);
        // Fall back to sessionStorage parsing only
        if (raw) {
          const parsed = JSON.parse(raw);
          setResult(parsed);
          if (parsed.hrd_name) setHrdName(parsed.hrd_name);
          if (parsed.company_name) setCompanyName(parsed.company_name);
          if (parsed.outlet_name) setOutletName(parsed.outlet_name);
        }
        setDocYear(new Date().getFullYear().toString());
        setDocDate(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }));
      });
  }, []);
  // Removed early returns to allow AnimatePresence transitions

  const currentStatus = result ? (STATUS_CFG[result.status] ?? STATUS_CFG.ditolak) : STATUS_CFG.ditolak;
  const bestPlacement = result?.best_placement;
  const bestPlacementCfg = bestPlacement ? (POSITION_CFG[bestPlacement.posisi] ?? POSITION_CFG.general_staff) : null;
  const alternativePlacements = result && result.status !== 'ditolak'
    ? result.placements.filter((p) => p.posisi !== bestPlacement?.posisi)
    : [];
  const auditReport = result ? generateDetailedAuditReport(result) : null;

  const chartData = result
    ? result.placements.map((p) => ({
        name: POSITION_CFG[p.posisi]?.label ?? p.posisi,
        cf: Math.round(p.cf * 100),
        fill: POSITION_CFG[p.posisi]?.color ?? 'var(--color-mute)',
      }))
    : [];

  const scorecardItems = result ? [
    {
      no: 1,
      name: 'Hospitality (Sikap Ramah)',
      value: getFactValue('sikap_ramah', result.working_memory['sikap_ramah']?.value),
      desc: result.working_memory['sikap_ramah']?.value === 'baik' ? 'Sangat sesuai standar pelayanan' : 'Perlu pembinaan sikap'
    },
    {
      no: 2,
      name: 'Kedisiplinan (Kehadiran Interview)',
      value: getFactValue('hadir_interview', result.working_memory['hadir_interview']?.value),
      desc: result.working_memory['hadir_interview']?.value === 'tepat_waktu' ? 'Disiplin waktu awal terpenuhi' : 'Risiko ketidakdisiplinan'
    },
    {
      no: 3,
      name: 'Kerjasama Tim (Teamwork)',
      value: getFactValue('teamwork', result.working_memory['teamwork']?.value),
      desc: result.working_memory['teamwork']?.value === 'baik' ? 'Mampu berkolaborasi dengan baik' : 'Cenderung bekerja individual'
    },
    {
      no: 4,
      name: 'Hasil Uji Coba Kerja (Trial)',
      value: getFactValue('hasil_trial', result.working_memory['hasil_trial']?.value),
      desc: result.working_memory['hasil_trial']?.value === 'baik' ? 'Kinerja trial memenuhi ekspektasi' : 'Kemampuan teknis kurang mencukupi'
    },
    {
      no: 5,
      name: 'Kemampuan Memasak',
      value: getFactValue('kemampuan_masak', result.working_memory['kemampuan_masak']?.value),
      desc: result.working_memory['kemampuan_masak']?.value === 'baik' ? 'Menguasai teknik dapur standar' : 'Minim keahlian dasar memasak'
    },
    {
      no: 6,
      name: 'Ketahanan Fisik',
      value: getFactValue('fisik_kuat', result.working_memory['fisik_kuat']?.value),
      desc: result.working_memory['fisik_kuat']?.value === 'ya' ? 'Sanggup bekerja berdiri lama' : 'Kekuatan fisik rata-rata'
    },
    {
      no: 7,
      name: 'Pengalaman Industri F&B',
      value: getFactValue('pengalaman_fnb_tahun', result.working_memory['pengalaman_fnb_tahun']?.value),
      desc: Number(result.working_memory['pengalaman_fnb_tahun']?.value) >= 2 ? 'Kategori berpengalaman' : 'Kategori pemula / non-pengalaman'
    },
    {
      no: 8,
      name: 'Jarak Rumah & Kendaraan',
      value: `${getFactValue('jarak_rumah_km', result.working_memory['jarak_rumah_km']?.value)}${result.working_memory['memiliki_kendaraan']?.value === 'ya' ? ' (Ada Kendaraan)' : ' (Tanpa Kendaraan)'}`,
      desc: Number(result.working_memory['jarak_rumah_km']?.value) <= 10 ? 'Lokasi relatif dekat' : 'Lokasi jauh, rawan keterlambatan'
    }
  ] : [];

  const recommendationRows = result ? [
    {
      label: 'Rekomendasi Posisi Utama',
      value: result.status !== 'ditolak' && bestPlacement ? bestPlacementCfg?.label.toUpperCase() : 'TIDAK DIREKOMENDASIKAN',
      isBold: true,
      isLarge: true,
      color: result.status !== 'ditolak' && bestPlacement ? '#0f172a' : '#dc2626'
    },
    {
      label: 'Certainty Factor (Posisi Utama)',
      value: result.status !== 'ditolak' && bestPlacement ? formatCF(bestPlacement.cf) : formatCF(result.status_cf),
      isBold: true,
      isMono: true
    },
    {
      label: 'Rekomendasi Alternatif',
      value: result.status !== 'ditolak' && alternativePlacements.length > 0 ? (
        alternativePlacements.map((p, idx) => {
          const cfg = POSITION_CFG[p.posisi] ?? POSITION_CFG.general_staff;
          return (
            <span key={p.posisi}>
              {idx > 0 && ', '}
              <strong>{cfg.label.toUpperCase()}</strong> ({formatCF(p.cf)})
            </span>
          );
        })
      ) : (
        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Tidak ada</span>
      )
    }
  ] : [];

  return (
    <div style={{ paddingBottom: '40px' }} className="min-h-full">
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}
            className="canvas-bg"
          >
            <div className="elevation-card" style={{ padding: '40px 32px', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
              <div style={{ fontSize: '32px', marginBottom: '16px' }}>🔍</div>
              <h2 className="heading-sm" style={{ color: 'var(--color-ink)', marginBottom: '12px' }}>Belum Ada Data Evaluasi</h2>
              <p className="body-sm-editorial" style={{ color: 'var(--color-charcoal)', marginBottom: '28px', lineHeight: 1.5 }}>
                Silakan jalankan simulasi penilaian fakta kandidat pada formulir rekrutmen terlebih dahulu.
              </p>
              <Link href="/evaluasi" style={{ width: '100%' }}>
                <button className="btn-primary-editorial touch-target-mobile" style={{ width: '100%', height: '42px' }}>
                  Buka Form Evaluasi
                </button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
      <style>{`
        .hasil-container {
          width: 100%;
        }

        /* Top Action Bar (Minimal buttons) */
        .results-action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          gap: 16px;
        }

        /* High-contrast centered white email/report card */
        .report-island-wrapper {
          display: flex;
          justify-content: flex-start;
          padding: 48px 16px; /* Horizontal padding added to prevent shadow cutting */
          background: radial-gradient(circle at center, rgba(255, 255, 255, 0.03) 0%, transparent 80%);
          margin-bottom: 48px;
          border-top: 1px solid var(--color-hairline);
          border-bottom: 1px solid var(--color-hairline);
          width: 100%;
          -webkit-overflow-scrolling: touch;
        }
        @media (min-width: 680px) {
          .report-island-wrapper {
            justify-content: center;
          }
        }
        
        .report-island-card {
          width: 100%;
          min-width: 640px;
          max-width: 680px;
          background-color: #ffffff;
          color: #000000;
          border-radius: 16px;
          padding: 48px 40px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15), 0 1px 8px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.08);
          position: relative;
          box-sizing: border-box;
        }
        .report-header {
          border-bottom: 2px solid #000000;
          padding-bottom: 20px;
          margin-bottom: 28px;
          text-align: center;
        }
        .report-title {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.01em;
          text-transform: uppercase;
        }
        .report-subtitle {
          font-family: var(--font-sans), sans-serif;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: #555555;
          margin-top: 6px;
        }
        .report-details-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        @media (min-width: 640px) {
          .report-details-grid {
            grid-template-columns: 1.2fr 1fr;
            gap: 32px;
          }
        }
        
        /* Editorial tabs */
        .hasil-tabs {
          display: flex;
          border-bottom: 1px solid var(--color-hairline);
          margin-bottom: 24px;
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .hasil-tabs::-webkit-scrollbar {
          display: none;
        }
        .hasil-tab-btn {
          background: transparent;
          border: none;
          color: var(--color-charcoal);
          font-size: 13px;
          font-weight: 500;
          padding: 12px 20px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .hasil-tab-btn.active {
          color: var(--color-ink);
          border-bottom-color: var(--color-ink);
        }
 
        .recommendation-summary-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 12px;
          margin: 8px 0;
        }
        .cf-summary-block {
          text-align: left;
        }
        @media (min-width: 480px) {
          .recommendation-summary-row {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding-bottom: 8px;
          }
          .cf-summary-block {
            text-align: right;
          }
        }

        .report-signatures {
          display: flex;
          flex-direction: row;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
        }
        .signature-expert-block {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        /* Chart card styling */
        .chart-section {
          background-color: var(--color-surface-card);
          border: 1px solid var(--color-hairline);
          border-radius: 12px;
          padding: 32px;
        }

        /* Warning / evaluation notes card */
        .notes-card {
          background-color: var(--color-surface-card);
          border: 1px solid var(--color-accent-yellow-glow);
          border-left: 4px solid var(--color-accent-yellow);
          border-radius: 8px;
          padding: 20px;
          margin-top: 24px;
        }

        /* Log elements */
        .log-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .log-item-card {
          background-color: var(--color-surface-card);
          border: 1px solid var(--color-hairline);
          border-radius: 8px;
          padding: 20px;
        }

        /* Force Kop Surat to keep print layout */
        .report-kop-surat {
          border-bottom: 3px double #000000;
          padding-bottom: 12px;
          margin-bottom: 20px;
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 16px;
          text-align: left;
        }
        .report-kop-text {
          text-align: left;
        }
        .company-contact-info {
          display: flex;
          flex-direction: row;
          justify-content: flex-start;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 4px;
        }
        .company-contact-info span:not(:last-child)::after {
          content: " |";
          margin-left: 6px;
          color: #888;
        }

        /* Force Section I table to display as a table */
        .report-island-card .responsive-grid-table {
          display: table !important;
          width: 100% !important;
          border-collapse: collapse !important;
          font-size: 10px !important;
        }
        .report-island-card .responsive-grid-table tbody {
          display: table-row-group !important;
        }
        .report-island-card .responsive-grid-table tr {
          display: table-row !important;
        }
        .report-island-card .responsive-grid-table td {
          display: table-cell !important;
          border: 1px solid #cbd5e1 !important;
          width: 25% !important;
          padding: 6px 8px !important;
          font-size: 10px !important;
        }
        .report-island-card .responsive-grid-table td.table-label {
          background-color: #f8fafc !important;
          color: #0f172a !important;
          font-size: 10px !important;
          font-weight: 600 !important;
        }

      `}</style>

      <div className="hasil-container">
        
        {/* Title Header (hidden in print) */}
        <div className="page-header-group no-print">
          
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="page-header-badge" style={{ borderColor: 'var(--color-accent-green)', color: 'var(--color-accent-green)', background: 'rgba(17, 255, 153, 0.05)' }}>
              INFERENCE REPORT AUDIT
            </div>
            <div className="page-header-row">
              <div>
                <h1 className="page-header-title">Hasil Analisis Penempatan</h1>
                <p className="page-header-subtitle">
                  Laporan kelayakan kandidat beserta audit transparansi aturan sistem pakar.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <Link href="/evaluasi">
                  <button className="btn-outline-editorial touch-target-mobile">
                    ← Evaluasi Baru
                  </button>
                </Link>
                <button
                  onClick={() => window.print()}
                  className="btn-primary-editorial touch-target-mobile"
                  style={{ backgroundColor: 'var(--color-primary-white)', color: 'var(--color-primary-on)' }}
                >
                  🖨 Cetak Laporan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Zoom Control for Mobile Viewports */}
        {scale < 1 && (
          <div className="no-print" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginBottom: '12px' 
          }}>
            <button 
              onClick={() => setIsZoomed(!isZoomed)}
              className="touch-target-mobile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '20px',
                backgroundColor: 'var(--color-surface-card)',
                border: '1px solid var(--color-hairline-strong)',
                color: 'var(--color-ink)',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {isZoomed ? (
                <>
                  <span>🔍</span>
                  <span>Pas Layar (Fit Page)</span>
                </>
              ) : (
                <>
                  <span>🔍</span>
                  <span>Ukuran Penuh (Zoom 100%)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* PRINT ISLAND CARD (High contrast light mockup) */}
        <div 
          className="report-island-wrapper"
          style={{
            justifyContent: (scale < 1 && isZoomed) ? 'flex-start' : 'center',
            overflow: (scale < 1 && isZoomed) ? 'auto' : 'visible'
          }}
        >
          <div 
            className="report-island-card"
            onClick={() => {
              if (scale < 1) {
                setIsZoomed(!isZoomed);
              }
            }}
            style={{
              zoom: isZoomed ? 1 : scale,
              cursor: scale < 1 ? (isZoomed ? 'zoom-out' : 'zoom-in') : 'default',
              transition: 'zoom 0.15s ease-in-out',
            }}
          >

            
            {/* Kop Surat (Corporate Letterhead) */}
            <div className="report-kop-surat">
              {/* Elegant corporate seal/logo */}
              <div style={{ width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff', flexShrink: 0 }}>
                {companyLogo ? (
                  <img src={companyLogo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                ) : (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                )}
              </div>
              <div className="report-kop-text">
                <div style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: '16px', fontWeight: 800, letterSpacing: '0.05em', color: '#000000', textTransform: 'uppercase', lineHeight: 1.2 }}>{companyName}</div>
                <div style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: '9px', color: '#333333', marginTop: '2px', lineHeight: '1.3' }}>
                  {companyAddress}
                  <div className="company-contact-info">
                    {companyPhone && <span>Telp: {companyPhone}</span>}
                    {companyEmail && <span>Email: {companyEmail}</span>}
                    {companyWebsite && <span>Website: {companyWebsite}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Title & Number */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-sans), sans-serif', fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', margin: '0 0 4px 0', textDecoration: 'underline' }}>
                SURAT REKOMENDASI PENEMPATAN KARYAWAN
              </h2>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '10px', color: '#333333', fontWeight: 600 }}>
                Nomor: SATE/ASSESS/{docYear}/SIMULASI
              </div>
            </div>

            {/* Introductory Text */}
            <p style={{ fontSize: '11px', lineHeight: '1.4', color: '#000000', margin: '0 0 16px 0', textAlign: 'justify' }}>
              Berdasarkan hasil evaluasi kualifikasi, wawancara, dan uji coba lapangan (trial) menggunakan Smart Assessment for Talent Evaluation (SATE), dengan ini diterbitkan laporan penilaian atas kandidat berikut:
            </p>

            {/* Section I: DATA UTAMA EVALUASI */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', borderBottom: '1.5px solid #000000', paddingBottom: '3px', marginBottom: '8px' }}>
                I. DATA UTAMA EVALUASI
              </h3>
              <table className="responsive-grid-table">
                <tbody>
                  <tr>
                    <td className="table-label">Nama Kandidat</td>
                    <td>{result.candidate_name}</td>
                    <td className="table-label">Tanggal Evaluasi</td>
                    <td>{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                  </tr>
                  <tr>
                    <td className="table-label">Evaluator (HRD)</td>
                    <td>{hrdName}</td>
                    <td className="table-label">Status Kelayakan</td>
                    <td style={{ fontWeight: 700, color: currentStatus.color === 'var(--color-accent-green)' ? '#16a34a' : currentStatus.color === 'var(--color-accent-red)' ? '#dc2626' : currentStatus.color === 'var(--color-accent-blue)' ? '#2563eb' : '#d97706' }}>
                      {currentStatus.label.toUpperCase()}
                    </td>
                  </tr>
                  <tr>
                    <td className="table-label">Perusahaan</td>
                    <td>{companyName}</td>
                    <td className="table-label">Outlet / Cabang</td>
                    <td>{outletName}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section II: SCORECARD ATRIBUT KANDIDAT */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', borderBottom: '1.5px solid #000000', paddingBottom: '3px', marginBottom: '8px' }}>
                II. SCORECARD ATRIBUT KANDIDAT
              </h3>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #cbd5e1' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1.5px solid #94a3b8' }}>
                    <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'center', width: '5%' }}>No</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'left', width: '35%' }}>Kriteria / Atribut Evaluasi</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'left', width: '30%' }}>Nilai Penilaian</th>
                    <th style={{ padding: '6px 8px', border: '1px solid #cbd5e1', textAlign: 'left', width: '30%' }}>Keterangan / Status</th>
                  </tr>
                </thead>
                <tbody>
                  {scorecardItems.map((item) => (
                    <tr key={item.no}>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', textAlign: 'center' }}>{item.no}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', fontWeight: 500 }}>{item.name}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1' }}>{item.value}</td>
                      <td style={{ padding: '5px 8px', border: '1px solid #cbd5e1', color: '#475569' }}>{item.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section III: KESIMPULAN REKOMENDASI PENEMPATAN */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', borderBottom: '1.5px solid #000000', paddingBottom: '3px', marginBottom: '8px' }}>
                III. KESIMPULAN REKOMENDASI PENEMPATAN
              </h3>
              <p style={{ fontSize: '11px', lineHeight: '1.5', color: '#000000', margin: '0 0 10px 0', textAlign: 'justify' }}>
                Berdasarkan hasil pemrosesan logika aturan (rule-base) di Tahap 1 (Kelayakan) dan Tahap 2 (Penempatan) oleh Smart Assessment for Talent Evaluation (SATE), kesimpulan rekomendasi penempatan divisi kerja kandidat adalah sebagai berikut:
              </p>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', border: '1px solid #cbd5e1' }}>
                <tbody>
                  {recommendationRows.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: idx < recommendationRows.length - 1 || result.catatan.length > 0 ? '1px solid #cbd5e1' : 'none' }}>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a', width: '150px', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1' }}>{row.label}</td>
                      <td style={{ 
                        padding: '8px 10px', 
                        color: row.color || '#0f172a',
                        fontWeight: row.isBold ? 800 : 400,
                        fontSize: row.isLarge ? '12px' : row.isMono ? '11px' : '10px',
                        fontFamily: row.isMono ? 'var(--font-mono), monospace' : 'inherit'
                      }}>
                        {row.value}
                      </td>
                    </tr>
                  ))}
                  {result.catatan.length > 0 && (
                    <tr>
                      <td style={{ padding: '8px 10px', fontWeight: 600, color: '#0f172a', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', verticalAlign: 'top' }}>Catatan Khusus Penilaian</td>
                      <td style={{ padding: '8px 10px', color: '#334155' }}>
                        <ul style={{ margin: 0, paddingLeft: '14px', listStyleType: 'disc', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          {result.catatan.map((note, idx) => (
                            <li key={idx} style={{ lineHeight: '1.4' }}>
                              {note.replace(/^[^\w\d\s\-]+/g, '').trim()}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section IV: PENGESAHAN DOKUMEN */}
            <div style={{ marginTop: '28px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#000000', borderBottom: '1.5px solid #000000', paddingBottom: '3px', marginBottom: '12px' }}>
                IV. PENGESAHAN DOKUMEN
              </h3>
              <div className="report-signatures" style={{ fontSize: '10px', fontFamily: 'var(--font-sans), sans-serif' }}>
                <div style={{ minWidth: '180px' }}>
                  <div style={{ color: '#475569', textTransform: 'uppercase', fontSize: '8px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>Sistem Penerbit Laporan</div>
                  <div style={{ fontWeight: 700, color: '#000000', fontSize: '11px' }}>SATE Inference Engine</div>
                  <div style={{ color: '#475569', marginTop: '1px' }}>Forward-Chaining & Certainty Factor System</div>
                  <div style={{ marginTop: '12px', padding: '4px 6px', border: '1px dashed #cbd5e1', display: 'inline-block', backgroundColor: '#f8fafc', borderRadius: '4px' }}>
                    <div style={{ fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px' }}>
                      <span>✓</span> VALIDATED BY EXPERT RULES
                    </div>
                    <div style={{ fontSize: '8px', color: '#64748b', fontFamily: 'var(--font-mono), monospace', marginTop: '2px' }}>
                      HASH: SIMULATION-MODE
                    </div>
                  </div>
                </div>
                
                <div className="signature-expert-block" style={{ minWidth: '180px' }}>
                  <div style={{ color: '#475569', textTransform: 'uppercase', fontSize: '8px', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '2px' }}>Pengesah Ahli / Pakar Penilai</div>
                  <div style={{ fontWeight: 700, color: '#000000', fontSize: '11px', fontStyle: 'italic', textDecoration: 'underline' }}>Dr. Rohimat Nurhasan, S.E., M.Si.</div>
                  <div style={{ color: '#475569', marginTop: '1px' }}>Expert Knowledge Validator</div>
                  <div style={{ marginTop: '16px', color: '#64748b', fontSize: '9px' }}>
                    Jakarta, {docDate}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* LOGIC TRANSPARENCY ACCORDION (no-print) */}
        <div className="no-print" style={{ marginBottom: '40px' }}>
          <button
            onClick={() => setLogicOpen(!logicOpen)}
            style={{
              width: '100%',
              padding: '16px 20px',
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-hairline-strong)',
              borderRadius: logicOpen ? '8px 8px 0 0' : '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              color: 'var(--color-ink)',
              fontWeight: 600,
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              transition: 'border-radius 0.15s ease',
            }}
          >
            <span> Mengapa sistem merekomendasikan ini? (Transparansi Logika)</span>
            <span style={{ fontSize: '12px', color: 'var(--color-mute)' }}>
              {logicOpen ? 'Sembunyikan' : 'Buka Alur Deduksi'}
            </span>
          </button>

          {logicOpen && (
            <div
              style={{
                padding: '24px',
                backgroundColor: 'var(--color-surface-deep)',
                border: '1px solid var(--color-hairline-strong)',
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
              }}
            >
              {/* Graphical Arrow Flow */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px dashed var(--color-hairline)' }}>
                <span className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-mute)', marginRight: '8px' }}>Rantai Aturan:</span>
                {result.inference_log
                  .filter((step) => step.rule_id in RULE_TRANSITION_MAP)
                  .map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {idx > 0 && <span style={{ color: 'var(--color-stone)', fontSize: '11px' }}>➔</span>}
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', background: step.stage === 1 ? 'rgba(59,158,255,0.08)' : 'rgba(255,197,61,0.08)', color: step.stage === 1 ? 'var(--color-accent-blue)' : 'var(--color-accent-yellow)', border: `1px solid ${step.stage === 1 ? 'rgba(59,158,255,0.15)' : 'rgba(255,197,61,0.15)'}` }}>
                        {step.rule_id}
                      </span>
                    </div>
                  ))
                }
              </div>

              {/* Deduction details text list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {result.inference_log
                  .filter((step) => step.rule_id in RULE_TRANSITION_MAP)
                  .map((step, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px 16px',
                        borderLeft: `3px solid ${step.stage === 1 ? 'var(--color-accent-blue)' : 'var(--color-accent-yellow)'}`,
                        background: 'var(--color-surface-deep)',
                        borderRadius: '0 6px 6px 0',
                      }}
                    >
                      <div style={{ fontSize: '11px', color: 'var(--color-mute)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, color: step.stage === 1 ? 'var(--color-accent-blue)' : 'var(--color-accent-yellow)' }}>
                          Aturan {step.rule_id} Terpicu
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>Keyakinan Aturan: {formatCF(step.cf)}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-body)', lineHeight: 1.5, fontWeight: 500 }}>
                        {RULE_TRANSITION_MAP[step.rule_id]}
                      </p>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>

        {/* TABS CONTAINER (no-print) */}
        <div className="no-print">
          
          <div className="hasil-tabs">
            <button
              className={`hasil-tab-btn ${activeTab === 'ringkasan' ? 'active' : ''}`}
              onClick={() => setActiveTab('ringkasan')}
            >
              Hasil & Distribusi Penempatan
            </button>
            <button
              className={`hasil-tab-btn ${activeTab === 'log' ? 'active' : ''}`}
              onClick={() => setActiveTab('log')}
            >
              Log Audit Inferensi ({result.inference_log.length} Aturan Terpicu)
            </button>
          </div>

          {/* TAB 1: SUMMARY & CHART */}
          {activeTab === 'ringkasan' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              
              {result.status === 'ditolak' ? (
                <div className="chart-section" style={{ textAlign: 'center', padding: '48px 32px' }}>
                  <div style={{ fontSize: '32px', marginBottom: '16px' }}>🚫</div>
                  <h4 style={{ color: 'var(--color-ink)', fontWeight: 600, fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                    Distribusi Penempatan Tidak Tersedia
                  </h4>
                  <p style={{ color: 'var(--color-mute)', fontSize: '13px', lineHeight: 1.5, maxWidth: '480px', margin: '0 auto' }}>
                    Kandidat ini memiliki status kelayakan <strong>Tidak Direkomendasikan</strong>, sehingga sistem tidak menyarankan penempatan divisi operasional maupun pelayanan.
                  </p>
                </div>
              ) : chartData.length > 0 ? (
                <div className="chart-section">
                  <h3 className="heading-sm" style={{ color: 'var(--color-ink)', marginBottom: '24px', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📊 Distribusi Tingkat Keyakinan Penempatan
                  </h3>
                                    {/* Recharts Wrapper */}
                  <div style={{ height: '220px', width: '100%', marginBottom: '32px', minWidth: 0, minHeight: 0, position: 'relative' }}>
                    {chartReady ? (
                      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                        <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                          <XAxis dataKey="name" tick={{ fill: 'var(--color-charcoal)', fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-charcoal)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'var(--color-surface-deep)', border: '1px solid var(--color-hairline-strong)', borderRadius: '8px', color: 'var(--color-ink)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
                            itemStyle={{ color: 'var(--color-ink)' }}
                            labelStyle={{ color: 'var(--color-charcoal)' }}
                            formatter={(value) => [`${value}%`, 'Certainty Factor']}
                            cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                          />
                          <Bar dataKey="cf" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/10 animate-pulse rounded-2xl" />
                    )}
                  </div>

                  {/* List items */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {result.placements.map((placement, index) => {
                      const cfg = POSITION_CFG[placement.posisi] ?? POSITION_CFG.general_staff;
                      const isTop = index === 0;
                      
                      return (
                        <div
                          key={placement.posisi}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            backgroundColor: 'var(--color-surface-elevated)',
                            border: `1px solid ${isTop ? 'var(--color-hairline-strong)' : 'var(--color-hairline)'}`,
                            borderRadius: '8px',
                          }}
                        >
                          <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: `${cfg.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', border: `1px solid ${cfg.color}30` }}>
                            {cfg.icon}
                          </div>
                          
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--color-ink)' }}>{cfg.label}</span>
                              {isTop && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'var(--color-primary-white)', color: 'var(--color-primary-on)' }}>Rekomendasi Utama</span>}
                            </div>
                            <p className="caption-editorial" style={{ margin: '2px 0 0' }}>
                              Aturan Terpicu: {placement.rules_triggered.join(', ') || '—'}
                            </p>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: cfg.color, fontFamily: 'var(--font-mono)' }}>
                              {formatCF(placement.cf)}
                            </div>
                            <div style={{ fontSize: '10px', color: 'var(--color-mute)' }}>Certainty Factor</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Special evaluation notes */}
              {result.catatan.length > 0 && (
                <div className="notes-card">
                  <h4 className="heading-sm" style={{ fontSize: '14px', color: 'var(--color-accent-yellow)', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ⚠️ Catatan Penting Hasil Observasi
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.catatan.map((note, idx) => (
                      <div key={idx} style={{ fontSize: '13px', color: 'var(--color-body)', lineHeight: 1.5 }}>
                        • {note}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: AUDIT LOGS */}
          {activeTab === 'log' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {auditReport && (
                <div className="elevation-card" style={{ padding: '28px', borderLeft: `6px solid ${auditReport.statusColor}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
                    <div>
                      <h4 className="heading-sm" style={{ margin: 0, fontSize: '15px', color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        🔎 Laporan Audit Keputusan Kelayakan
                      </h4>
                      <p className="caption-editorial" style={{ margin: '4px 0 0', color: 'var(--color-mute)' }}>
                        Analisis deduksi kriteria rekrutmen berbasis sistem pakar
                      </p>
                    </div>
                    <span style={{ 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      padding: '4px 10px', 
                      borderRadius: '4px', 
                      backgroundColor: `${auditReport.statusColor}15`, 
                      color: auditReport.statusColor,
                      border: `1px solid ${auditReport.statusColor}25`
                    }}>
                      {auditReport.statusLabel}
                    </span>
                  </div>

                  <p className="body-sm-editorial" style={{ color: 'var(--color-body)', marginBottom: '24px', fontStyle: 'italic', lineHeight: 1.5 }}>
                    &ldquo;{auditReport.summaryText}&rdquo;
                  </p>

                  {/* Criteria Grid */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr', 
                    gap: '16px', 
                    marginBottom: '28px' 
                  }} className="audit-criteria-grid">
                    <style>{`
                      @media (min-width: 640px) {
                        .audit-criteria-grid {
                          grid-template-columns: repeat(3, 1fr) !important;
                        }
                      }
                    `}</style>
                    {auditReport.criteria.map((c, i) => {
                      const isPassed = c.status === 'passed';
                      const isFailed = c.status === 'failed';
                      const icon = isPassed ? '✓' : isFailed ? '✗' : '⚠';
                      const color = isPassed ? 'var(--color-accent-green)' : isFailed ? 'var(--color-accent-red)' : 'var(--color-accent-yellow)';
                      const bg = isPassed ? 'var(--color-accent-green-glow)' : isFailed ? 'var(--color-accent-red-glow)' : 'var(--color-accent-yellow-glow)';
                      const border = isPassed ? 'rgba(22, 163, 74, 0.15)' : isFailed ? 'rgba(220, 38, 38, 0.15)' : 'rgba(217, 119, 6, 0.15)';
                      
                      return (
                        <div key={i} style={{ 
                          padding: '16px', 
                          backgroundColor: 'var(--color-surface-deep)', 
                          border: '1px solid var(--color-hairline)', 
                          borderRadius: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-mute)' }}>{c.label}</span>
                            <span style={{ 
                              fontSize: '10px', 
                              fontWeight: 700, 
                              padding: '2px 6px', 
                              borderRadius: '4px', 
                              backgroundColor: bg, 
                              color: color,
                              border: `1px solid ${border}`
                            }}>
                              {icon} {c.valueText}
                            </span>
                          </div>
                          <p className="caption-editorial" style={{ margin: 0, fontSize: '11px', lineHeight: 1.4, color: 'var(--color-charcoal)' }}>
                            {c.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Decision Rationales */}
                  <div style={{ marginBottom: '24px' }}>
                    <h5 className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-ink)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                      Rasionalisasi Keputusan
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '4px' }}>
                      {auditReport.rationales.map((rat, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', fontSize: '13px', lineHeight: 1.5, color: 'var(--color-body)' }}>
                          <span style={{ color: auditReport.statusColor }}>•</span>
                          <span>{rat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Disqualifiers */}
                  {auditReport.disqualifiers.length > 0 && (
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: 'var(--color-accent-red-glow)', 
                      border: '1px solid rgba(220, 38, 38, 0.15)', 
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <h5 className="caption-editorial" style={{ fontWeight: 700, color: 'var(--color-accent-red)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🔴 Faktor Diskualifikasi Kritis
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {auditReport.disqualifiers.map((dis, i) => (
                          <div key={i} style={{ fontSize: '12.5px', color: 'var(--color-body)', lineHeight: 1.45, paddingLeft: '8px', borderLeft: '2px solid var(--color-accent-red)' }}>
                            {dis}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Operational Warnings */}
                  {auditReport.warnings.length > 0 && (
                    <div style={{ 
                      padding: '16px', 
                      backgroundColor: 'var(--color-accent-yellow-glow)', 
                      border: '1px solid rgba(217, 119, 6, 0.15)', 
                      borderRadius: '8px'
                    }}>
                      <h5 className="caption-editorial" style={{ fontWeight: 700, color: 'var(--color-accent-yellow)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        ⚠️ Catatan Risiko Operasional & Logistik
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {auditReport.warnings.map((warn, i) => (
                          <div key={i} style={{ fontSize: '12.5px', color: 'var(--color-body)', lineHeight: 1.45, paddingLeft: '8px', borderLeft: '2px solid var(--color-accent-yellow)' }}>
                            {warn}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="log-list">
                <div className="chart-section" style={{ padding: '24px 32px' }}>
                  <h3 className="heading-sm" style={{ color: 'var(--color-ink)', marginBottom: '18px', fontSize: '15px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    📋 Alur Log Inferensi (Forward-Chaining Memory Trace)
                  </h3>

                {result.inference_log.length === 0 ? (
                  <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--color-mute)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                    &gt;_ [Inference engine log] Tidak ada aturan terpicu.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {result.inference_log.map((step, idx) => {
                      const isStage1 = step.stage === 1;
                      const activeColor = isStage1 ? 'var(--color-accent-blue)' : 'var(--color-accent-yellow)';
                      
                      return (
                        <div key={idx} className="log-item-card" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          
                          {/* Log Card Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '8px', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                            <div>
                              <span style={{ color: 'var(--color-mute)', marginRight: '6px' }}>[step_{String(idx).padStart(2, '0')}]</span>
                              <span style={{ color: activeColor, fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${activeColor}10`, border: `1px solid ${activeColor}20` }}>
                                STAGE_{step.stage} :: RULE_{step.rule_id}
                              </span>
                            </div>
                            <div style={{ color: 'var(--color-mute)' }}>
                              RULE_CF: <span style={{ color: 'var(--color-accent-yellow)', fontWeight: 700 }}>{formatCF(step.cf)}</span>
                            </div>
                          </div>

                          {/* Log Desc */}
                          <div style={{ color: 'var(--color-body)', fontSize: '12px', marginBottom: '10px', lineHeight: 1.5 }}>
                            <span style={{ color: 'var(--color-mute)' }}>{"// Deskripsi:"}</span> {step.description}
                          </div>

                          {/* Log Conditions */}
                          <div style={{ marginBottom: '10px' }}>
                            <div style={{ fontSize: '10px', color: 'var(--color-charcoal)', textTransform: 'uppercase', marginBottom: '4px' }}>IF (Fakta Terpenuhi):</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingLeft: '8px' }}>
                              {step.matched_conditions.map((c, cIdx) => (
                                <div key={cIdx} style={{ color: 'var(--color-accent-blue)' }}>
                                  → <span style={{ color: 'var(--color-mute)' }}>[MATCH]</span> {c}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Log Conclusion */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '10px' }}>
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--color-charcoal)', textTransform: 'uppercase', marginBottom: '4px' }}>THEN (Konklusi):</div>
                              <div style={{ color: 'var(--color-accent-green)', paddingLeft: '8px' }}>
                                ⇒ <span style={{ color: 'var(--color-mute)' }}>[ASSERT]</span> {step.conclusion_attribute} = <span style={{ fontWeight: 700 }}>{String(step.conclusion_value).toUpperCase()}</span>
                              </div>
                            </div>
                            
                            {step.combined_cf != null && (
                              <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--color-accent-green)' }}>
                                COMBINED_CF: <span style={{ fontWeight: 800 }}>{formatCF(step.combined_cf)}</span>
                              </div>
                            )}
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

        </div>

      </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
