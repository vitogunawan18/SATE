'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import type { Rule, Stage, Condition, Operator } from '@/lib/mock-rules';
import { runInference, CandidateFacts } from '@/lib/inference-engine';
import { Sparkles } from 'lucide-react';

// ─── Human translation mappings for HRD ─────────────────────────────────────
const ATTRIBUTE_LABELS: Record<string, string> = {
  // Input facts
  nama: 'Nama Kandidat',
  jarak_rumah_km: 'Jarak Rumah',
  memiliki_kendaraan: 'Kepemilikan Kendaraan Pribadi',
  akses_transportasi: 'Akses Transportasi Umum',
  mobilitas_malam: 'Mobilitas Malam Hari',
  shift_malam: 'Ketersediaan Shift Malam',
  faktor_keamanan: 'Pertimbangan Keamanan',
  kemampuan_masak: 'Keahlian Memasak',
  fisik_kuat: 'Ketahanan Fisik / Tenaga',
  pengalaman_fnb_tahun: 'Pengalaman di F&B',
  riwayat_kerja_bulan: 'Lama Kerja Terpanjang',
  lulus_administrasi: 'Status Seleksi Administrasi',
  
  // Interview/Observasi
  sikap_ramah: 'Sikap Keramahan (Hospitality)',
  hadir_interview: 'Kehadiran Wawancara',
  disiplin: 'Tingkat Kedisiplinan',
  teamwork: 'Kerja Sama Tim (Teamwork)',
  panik_saat_tekanan: 'Reaksi di Bawah Tekanan',
  mood: 'Kestabilan Mood & Emosi',
  kemampuan_individu: 'Kemampuan Kerja Mandiri',
  lulus_wawancara: 'Status Kelulusan Wawancara',
  hasil_trial: 'Hasil Evaluasi Trial Kerja',
  
  // Intermediate conclusions
  hospitality: 'Kemampuan Pelayanan (Hospitality)',
  indikasi_disiplin_awal: 'Indikasi Disiplin Awal',
  adaptasi_kerja: 'Kecepatan Adaptasi Kerja',
  pertimbangan_khusus: 'Perlu Pertimbangan Khusus',
  perlu_pertimbangan: 'Perlu Pertimbangan Khusus (Shift Malam)',
  konsistensi: 'Konsistensi Kerja',
  lanjut_wawancara: 'Berhak Lanjut ke Wawancara',
  lanjut_trial: 'Berhak Lanjut ke Trial Kerja',
  diterima: 'Kelayakan Diterima',
  risiko_kendala: 'Risiko Kendala Operasional',
  kandidat_potensial: 'Kategori Kandidat Potensial',
  loyalitas: 'Tingkat Loyalitas',
  kecocokan: 'Kecocokan Karakter',
  perlu_pelatihan: 'Rekomendasi Pelatihan Tambahan',
  evaluasi_lanjut: 'Perlu Evaluasi Lanjutan',
  
  // Placement conclusions
  penempatan: 'Rekomendasi Posisi Penempatan',
  prioritas_penempatan: 'Skala Prioritas Penempatan',
  penempatan_shift: 'Rekomendasi Shift Kerja',
  potensi_kendala_kehadiran: 'Potensi Masalah Kehadiran',
  prioritas_diterima: 'Prioritas Kelulusan',
};

const VALUE_LABELS: Record<string, string> = {
  ya: 'Ya',
  tidak: 'Tidak',
  baik: 'Baik / Tinggi',
  cukup: 'Cukup / Sedang',
  kurang: 'Kurang / Rendah',
  tepat_waktu: 'Tepat Waktu',
  terlambat: 'Terlambat',
  tinggi: 'Tinggi',
  sedang: 'Sedang',
  rendah: 'Rendah / Kurang',
  mudah: 'Mudah',
  sulit: 'Sulit',
  bebas: 'Bebas Hambatan',
  terbatas: 'Terbatas',
  frontliner: 'Frontliner (Kasir/Waiter)',
  kitchen: 'Kitchen Crew (Dapur)',
  operasional: 'Staff Operasional',
  general_staff: 'General Staff',
  perlu: 'Perlu Perhatian',
  stabil: 'Stabil / Tenang',
  tidak_stabil: 'Tidak Stabil / Panik',
  lebih_cepat: 'Lebih Cepat',
  pagi_siang: 'Shift Pagi atau Siang',
};

function getUnit(attr: string): string {
  if (attr.endsWith('_tahun')) return ' tahun';
  if (attr.endsWith('_bulan')) return ' bulan';
  if (attr.endsWith('_km')) return ' km';
  return '';
}

function formatCondition(cond: any) {
  const attrName = ATTRIBUTE_LABELS[cond.attribute] || cond.attribute;
  const valName = VALUE_LABELS[String(cond.value)] || String(cond.value);
  const unit = getUnit(cond.attribute);
  
  if (cond.operator === '==') {
    return (
      <span>
        <strong>{attrName}</strong> adalah <span className="highlight-val">"{valName}"</span>
      </span>
    );
  } else if (cond.operator === '!=') {
    return (
      <span>
        <strong>{attrName}</strong> bukan <span className="highlight-val">"{valName}"</span>
      </span>
    );
  } else if (cond.operator === '>') {
    return (
      <span>
        <strong>{attrName}</strong> &gt; <strong>{cond.value}</strong>{unit}
      </span>
    );
  } else if (cond.operator === '<') {
    return (
      <span>
        <strong>{attrName}</strong> &lt; <strong>{cond.value}</strong>{unit}
      </span>
    );
  } else if (cond.operator === '>=') {
    return (
      <span>
        <strong>{attrName}</strong> ≥ <strong>{cond.value}</strong>{unit}
      </span>
    );
  } else if (cond.operator === '<=') {
    return (
      <span>
        <strong>{attrName}</strong> ≤ <strong>{cond.value}</strong>{unit}
      </span>
    );
  }
  return <span><strong>{attrName}</strong> {cond.operator} {valName}</span>;
}

function formatConclusion(conc: any) {
  const attrName = ATTRIBUTE_LABELS[conc.attribute] || conc.attribute;
  const valName = VALUE_LABELS[String(conc.value)] || String(conc.value);
  return (
    <span>
      <strong>{attrName}</strong> disimpulkan sebagai <span className="highlight-concl">"{valName}"</span>
    </span>
  );
}

// Initial facts for interactive playground
const DEFAULT_PLAYGROUND_FACTS: CandidateFacts = {
  nama: 'Simulasi Kandidat',
  jarak_rumah_km: 5,
  memiliki_kendaraan: 'ya',
  akses_transportasi: 'mudah',
  mobilitas_malam: 'bebas',
  shift_malam: 'tidak',
  faktor_keamanan: 'tidak',
  kemampuan_masak: 'cukup',
  fisik_kuat: 'tidak',
  pengalaman_fnb_tahun: 0,
  riwayat_kerja_bulan: 6,
  lulus_administrasi: 'ya',
  sikap_ramah: 'baik',
  hadir_interview: 'tepat_waktu',
  disiplin: 'sedang',
  teamwork: 'baik',
  panik_saat_tekanan: 'tidak',
  mood: 'stabil',
  kemampuan_individu: 'baik',
  lulus_wawancara: 'ya',
  hasil_trial: 'baik',
};

export default function KnowledgeBasePage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeStage, setActiveStage] = useState<'all' | 1 | 2>('all');
  const [user, setUser] = useState<{ name: string; username: string; role: string } | null>(null);
  
  // Playground state
  const [facts, setFacts] = useState<CandidateFacts>(DEFAULT_PLAYGROUND_FACTS);
  const triggeredRules = useMemo(() => {
    if (rules.length === 0) return [];
    const result = runInference(facts, rules);
    return result.inference_log.map((step) => step.rule_id);
  }, [facts, rules]);
  const [showPlayground, setShowPlayground] = useState(false);

  // CRUD Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [ruleForm, setRuleForm] = useState<{
    rule_id: string;
    stage: Stage;
    description: string;
    conditions: Condition[];
    conclusion: { attribute: string; value: string | number | boolean };
    cf: number;
  }>({
    rule_id: '',
    stage: 1,
    description: '',
    conditions: [{ attribute: 'sikap_ramah', operator: '==', value: 'baik' }],
    conclusion: { attribute: 'hospitality', value: 'baik' },
    cf: 0.8,
  });

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/rules');
      const data = await res.json();
      if (data.success) {
        // Prevent layout shift during the page entrance animation by delaying
        // the massive DOM expansion until the 250ms transition completes.
        setTimeout(() => {
          setRules(data.data);
          setLoadingRules(false);
        }, 300);
      } else {
        setLoadingRules(false);
      }
    } catch (err) {
      console.error('Error fetching rules from API:', err);
      setLoadingRules(false);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchRules();
    fetchUser();
  }, []);

  // Search and filter logic
  const filteredRules = rules.filter((rule) => {
    const matchesStage = activeStage === 'all' || rule.stage === activeStage;
    
    const searchLower = searchTerm.toLowerCase();
    const matchesId = rule.rule_id.toLowerCase().includes(searchLower);
    const matchesDesc = rule.description.toLowerCase().includes(searchLower);
    
    const matchesConds = rule.conditions.some((c) => {
      const attrLabel = (ATTRIBUTE_LABELS[c.attribute] || '').toLowerCase();
      const valLabel = (VALUE_LABELS[String(c.value)] || '').toLowerCase();
      return attrLabel.includes(searchLower) || valLabel.includes(searchLower) || c.attribute.toLowerCase().includes(searchLower);
    });
    const matchesConcl = (ATTRIBUTE_LABELS[rule.conclusion.attribute] || '').toLowerCase().includes(searchLower) ||
      (VALUE_LABELS[String(rule.conclusion.value)] || '').toLowerCase().includes(searchLower) ||
      rule.conclusion.attribute.toLowerCase().includes(searchLower);

    return matchesStage && (matchesId || matchesDesc || matchesConds || matchesConcl);
  });

  const updatePlaygroundFact = (key: keyof CandidateFacts, value: string | number) => {
    setFacts((prev) => ({ ...prev, [key]: value }));
  };

  // CRUD Actions
  const openAddModal = () => {
    setIsEditing(false);
    setRuleForm({
      rule_id: 'R' + (rules.length + 1),
      stage: 1,
      description: '',
      conditions: [{ attribute: 'sikap_ramah', operator: '==', value: 'baik' }],
      conclusion: { attribute: 'hospitality', value: 'baik' },
      cf: 0.8,
    });
    setShowModal(true);
  };

  const openEditModal = (rule: Rule) => {
    setIsEditing(true);
    setRuleForm({
      rule_id: rule.rule_id,
      stage: rule.stage,
      description: rule.description,
      conditions: rule.conditions.map(c => ({ ...c })),
      conclusion: { ...rule.conclusion },
      cf: rule.cf,
    });
    setShowModal(true);
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus aturan [${ruleId}]?`)) return;
    try {
      const res = await fetch(`/api/rules?rule_id=${ruleId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus aturan');
      }
      alert('Aturan berhasil dihapus');
      fetchRules();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = isEditing ? 'PUT' : 'POST';
    try {
      const res = await fetch('/api/rules', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleForm),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menyimpan aturan');
      }
      alert(data.message || 'Aturan berhasil disimpan');
      setShowModal(false);
      fetchRules();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateCondition = (index: number, field: keyof Condition, value: string | number) => {
    const updated = [...ruleForm.conditions];
    updated[index] = { ...updated[index], [field]: value };
    setRuleForm(prev => ({ ...prev, conditions: updated }));
  };

  const addCondition = () => {
    setRuleForm(prev => ({
      ...prev,
      conditions: [...prev.conditions, { attribute: 'sikap_ramah', operator: '==', value: 'baik' }]
    }));
  };

  const removeCondition = (index: number) => {
    if (ruleForm.conditions.length === 1) return;
    setRuleForm(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, idx) => idx !== index)
    }));
  };

  const updateConclusion = (field: 'attribute' | 'value', value: string | number) => {
    setRuleForm(prev => ({
      ...prev,
      conclusion: { ...prev.conclusion, [field]: value }
    }));
  };

  return (
    <div style={{ paddingBottom: '40px' }}>
      <style>{`
        .kb-container {
          width: 100%;
        }

        /* Expert header card */
        .expert-card {
          background-color: var(--color-surface-elevated);
          border: 1px solid var(--color-hairline-strong);
          border-radius: 2rem; /* rounded-2rem */
          padding: 24px;
          margin-bottom: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        @media (min-width: 768px) {
          .expert-card {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        /* Layout columns */
        .kb-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        @media (min-width: 1024px) {
          .kb-grid {
            grid-template-columns: ${showPlayground ? '380px 1fr' : '1fr'};
            transition: all 0.3s ease;
          }
        }

        /* Playground Panel */
        .playground-panel {
          background-color: var(--color-surface-card);
          border: 1px solid var(--color-hairline-strong);
          border-radius: 2rem; /* rounded-2rem */
          padding: 24px;
          position: relative;
        }
        @media (min-width: 1024px) {
          .playground-panel {
            position: sticky;
            top: 24px;
            max-height: 85vh;
            overflow-y: auto;
          }
        }
        .playground-row {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          padding: 12px 0;
          border-bottom: 1px solid var(--color-divider-soft);
          font-size: 13px;
          gap: 8px;
        }
        @media (min-width: 480px) {
          .playground-row {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            gap: 12px;
          }
        }
        .playground-label {
          color: var(--color-charcoal);
          font-weight: 500;
        }
        .playground-btn-group {
          display: flex;
          gap: 4px;
          width: 100%;
        }
        @media (min-width: 480px) {
          .playground-btn-group {
            width: auto;
          }
        }
        .playground-btn {
          flex: 1;
          font-size: 11px;
          padding: 8px 6px;
          border-radius: 10px;
          border: 1px solid var(--color-hairline-strong);
          background-color: var(--color-surface-elevated);
          color: var(--color-body);
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 44px;
        }
        @media (min-width: 480px) {
          .playground-btn {
            flex: none;
            padding: 4px 10px;
            min-height: unset;
          }
        }
        .playground-btn.selected {
          background-color: var(--color-primary-white);
          color: var(--color-primary-on);
          border-color: var(--color-primary-white);
          font-weight: 600;
        }

        /* Rule Cards List */
        .rules-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .rule-card {
          background-color: var(--color-surface-card);
          border: 1px solid var(--color-hairline-strong);
          border-radius: 2rem; /* rounded-2rem */
          padding: 20px;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        @media (min-width: 640px) {
          .rule-card {
            padding: 24px;
          }
        }
        .rule-card.triggered {
          border-color: var(--color-accent-green);
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.05);
        }
        .rule-card:hover {
          border-color: var(--color-mute);
        }

        /* Flow Diagram */
        .flow-container {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          background-color: var(--color-surface-elevated);
          padding: 16px;
          border-radius: 16px; /* rounded-2xl */
          border: 1px solid var(--color-hairline-strong);
        }
        .flow-block {
          font-size: 13px;
          line-height: 1.5;
          color: var(--color-body);
        }
        .flow-arrow {
          display: flex;
          align-items: center;
          color: var(--color-mute);
          font-size: 14px;
          padding-left: 8px;
        }
        .highlight-val {
          color: var(--color-primary-white);
          font-weight: 600;
        }
        .highlight-concl {
          color: var(--color-accent-green);
          font-weight: 600;
        }

        /* CF Meter */
        .cf-meter-container {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .cf-bar-track {
          flex: 1;
          height: 6px;
          background-color: var(--color-surface-deep);
          border-radius: 3px;
          overflow: hidden;
        }
        .cf-bar-fill {
          height: 100%;
          border-radius: 3px;
        }

        /* Badges */
        .stage-badge {
          display: inline-flex;
          align-items: center;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        /* Tabs styling */
        .filter-tabs {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--color-hairline-strong);
          margin-bottom: 24px;
          overflow-x: auto;
          white-space: nowrap;
          padding-bottom: 2px;
        }
        .tab-btn {
          background: transparent;
          border: none;
          color: var(--color-mute);
          font-size: 13.5px;
          font-weight: 600;
          padding: 10px 16px;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
          font-family: var(--font-sans);
        }
        .tab-btn:hover {
          color: var(--color-ink);
        }
        .tab-btn.active {
          color: var(--color-primary-white);
          border-bottom-color: var(--color-primary-white);
          font-weight: 700;
        }

        /* Modal Styles */
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }
        .modal-body {
          background-color: var(--color-surface-card);
          border: 1px solid var(--color-hairline-strong);
          border-radius: 2rem; /* rounded-2rem */
          width: 100%;
          maxWidth: 600px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        }
        .modal-condition-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          background-color: var(--color-surface-elevated);
          padding: 12px;
          border-radius: 12px;
          border: 1px solid var(--color-hairline-strong);
        }
        .modal-condition-row > .field-attr {
          flex: 1 1 100%;
          width: 100%;
        }
        .modal-condition-row > .field-op {
          flex: 1 1 25%;
        }
        .modal-condition-row > .field-val {
          flex: 1 1 50%;
        }
        .modal-condition-row > .field-del {
          flex: 0 0 auto;
        }
        @media (min-width: 480px) {
          .modal-condition-row {
            flex-wrap: nowrap;
          }
          .modal-condition-row > .field-attr {
            flex: 1.5;
            width: auto;
          }
          .modal-condition-row > .field-op {
            flex: 0.6;
          }
          .modal-condition-row > .field-val {
            flex: 1;
          }
        }
        .modal-conclusion-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          background-color: rgba(14, 165, 233, 0.03);
          padding: 12px;
          border-radius: 12px;
          border: 1px solid rgba(14, 165, 233, 0.15);
        }
        .modal-conclusion-row > .field-attr {
          flex: 1 1 100%;
          width: 100%;
        }
        .modal-conclusion-row > .field-arrow {
          display: none;
        }
        .modal-conclusion-row > .field-val {
          flex: 1 1 100%;
          width: 100%;
        }
        @media (min-width: 480px) {
          .modal-conclusion-row {
            flex-wrap: nowrap;
          }
          .modal-conclusion-row > .field-attr {
            flex: 1.5;
            width: auto;
          }
          .modal-conclusion-row > .field-arrow {
            display: inline-block;
          }
          .modal-conclusion-row > .field-val {
            flex: 1;
            width: auto;
          }
        }
      `}</style>

      <div className="kb-container">
        
        {/* Page Header */}
        <div className="page-header-group">
          <div>
            <div className="page-header-badge">
              KNOWLEDGE BASE CONFIG
            </div>
            <div className="page-header-row">
              <div>
                <h1 className="page-header-title">Basis Pengetahuan Sistem Pakar</h1>
                <p className="page-header-subtitle">
                  Daftar aturan logika rekrutmen dan penempatan karyawan F&B yang digunakan oleh mesin inferensi.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                <button
                  onClick={() => setShowPlayground(!showPlayground)}
                  className="btn-outline-editorial touch-target-mobile"
                  style={{
                    borderColor: showPlayground ? 'var(--color-accent-blue)' : 'var(--color-hairline-strong)',
                    color: showPlayground ? 'var(--color-accent-blue)' : 'var(--color-ink)',
                    background: showPlayground ? 'var(--color-accent-blue-glow)' : 'transparent',
                    fontSize: '12px',
                    height: '38px',
                    flex: '1 1 auto',
                  }}
                >
                  ⚡ {showPlayground ? 'Sembunyikan Simulator' : 'Buka Simulator Aturan'}
                </button>
                {user?.role === 'admin' && (
                  <button
                    onClick={openAddModal}
                    className="btn-primary-editorial touch-target-mobile"
                    style={{ fontSize: '12px', height: '38px', flex: '1 1 auto' }}
                  >
                    + Tambah Aturan Baru
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Expert Validator / Certification Info */}
        <div className="expert-card">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{ fontSize: '32px', filter: 'grayscale(0.2)' }}>🎓</div>
            <div>
              <h3 className="heading-sm" style={{ fontSize: '15px', color: 'var(--color-ink)', margin: 0 }}>
                Tervalidasi & Disahkan oleh Pakar
              </h3>
              <p className="caption-editorial" style={{ margin: '4px 0', fontSize: '12px', color: 'var(--color-body)', fontWeight: 500 }}>
                Dr. Rohimat Nurhasan, S.E., M.Si
              </p>
              <p className="caption-editorial" style={{ margin: 0, fontSize: '11px', color: 'var(--color-mute)' }}>
                Aturan disesuaikan untuk meminimalkan bias subjektif (gender) dan menutup semua inkonsistensi keputusan (kasus hole).
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: 'var(--color-accent-green-glow)', border: '1px solid rgba(22, 163, 74, 0.15)', color: 'var(--color-accent-green)', fontWeight: 600 }}>
              ✓ Bebas Bias Gender
            </span>
            <span style={{ fontSize: '10px', padding: '4px 8px', borderRadius: '4px', background: 'var(--color-accent-blue-glow)', border: '1px solid rgba(37, 99, 235, 0.15)', color: 'var(--color-accent-blue)', fontWeight: 600 }}>
              + 3 Aturan Hole Tertutup
            </span>
          </div>
        </div>

        {/* Main Grid (Simulator + Rules List) */}
        <div className="kb-grid">
          
          {/* SIMULATOR/PLAYGROUND COLUMN */}
          {showPlayground && (
            <div className="playground-panel">
              <div style={{ display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '12px' }}>
                <span className="heading-sm" style={{ fontSize: '14px', color: 'var(--color-ink)' }}>
                  Simulator Input Fakta
                </span>
                <button
                  onClick={() => setFacts(DEFAULT_PLAYGROUND_FACTS)}
                  style={{ border: 'none', background: 'none', color: 'var(--color-accent-blue)', fontSize: '11px', cursor: 'pointer', fontFamily: 'var(--font-mono)' }}
                >
                  RESET_FACTS
                </button>
              </div>
              <p className="caption-editorial" style={{ color: 'var(--color-mute)', marginBottom: '16px', lineHeight: 1.4 }}>
                Ubah kriteria kandidat di bawah ini untuk melihat aturan mana saja yang akan otomatis terpicu (ditandai warna hijau).
              </p>

              {/* Facts Options Selectors */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                
                {/* Sikap Ramah */}
                <div className="playground-row">
                  <span className="playground-label">Sikap Ramah</span>
                  <div className="playground-btn-group">
                    {['baik', 'cukup', 'kurang'].map((v) => (
                      <button
                        key={v}
                        onClick={() => updatePlaygroundFact('sikap_ramah', v)}
                        className={`playground-btn ${facts.sikap_ramah === v ? 'selected' : ''}`}
                      >
                        {VALUE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Disiplin */}
                <div className="playground-row">
                  <span className="playground-label">Kedisiplinan</span>
                  <div className="playground-btn-group">
                    {['tinggi', 'sedang', 'rendah'].map((v) => (
                      <button
                        key={v}
                        onClick={() => updatePlaygroundFact('disiplin', v)}
                        className={`playground-btn ${facts.disiplin === v ? 'selected' : ''}`}
                      >
                        {VALUE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pengalaman FNB */}
                <div className="playground-row">
                  <span className="playground-label">Pengalaman F&B</span>
                  <div className="playground-btn-group">
                    {[
                      { v: 0, label: 'Baru' },
                      { v: 1, label: '1 Thn' },
                      { v: 3, label: '> 2 Thn' }
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => updatePlaygroundFact('pengalaman_fnb_tahun', opt.v)}
                        className={`playground-btn ${facts.pengalaman_fnb_tahun === opt.v ? 'selected' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Riwayat Kerja */}
                <div className="playground-row">
                  <span className="playground-label">Lama Kerja Terlama</span>
                  <div className="playground-btn-group">
                    {[
                      { v: 2, label: '< 3 Bln' },
                      { v: 6, label: '> 3 Bln' }
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        onClick={() => updatePlaygroundFact('riwayat_kerja_bulan', opt.v)}
                        className={`playground-btn ${facts.riwayat_kerja_bulan === opt.v ? 'selected' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shift Malam */}
                <div className="playground-row">
                  <span className="playground-label">Shift Malam</span>
                  <div className="playground-btn-group">
                    {['ya', 'tidak'].map((v) => (
                      <button
                        key={v}
                        onClick={() => updatePlaygroundFact('shift_malam', v)}
                        className={`playground-btn ${facts.shift_malam === v ? 'selected' : ''}`}
                      >
                        {VALUE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hadir Interview */}
                <div className="playground-row">
                  <span className="playground-label">Hadir Interview</span>
                  <div className="playground-btn-group">
                    {['tepat_waktu', 'terlambat'].map((v) => (
                      <button
                        key={v}
                        onClick={() => updatePlaygroundFact('hadir_interview', v)}
                        className={`playground-btn ${facts.hadir_interview === v ? 'selected' : ''}`}
                      >
                        {VALUE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Teamwork */}
                <div className="playground-row">
                  <span className="playground-label">Kerja Sama Tim</span>
                  <div className="playground-btn-group">
                    {['baik', 'cukup', 'rendah'].map((v) => (
                      <button
                        key={v}
                        onClick={() => updatePlaygroundFact('teamwork', v)}
                        className={`playground-btn ${facts.teamwork === v ? 'selected' : ''}`}
                      >
                        {VALUE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kemampuan Masak */}
                <div className="playground-row">
                  <span className="playground-label">Keahlian Masak</span>
                  <div className="playground-btn-group">
                    {['baik', 'cukup', 'tidak'].map((v) => (
                      <button
                        key={v}
                        onClick={() => updatePlaygroundFact('kemampuan_masak', v)}
                        className={`playground-btn ${facts.kemampuan_masak === v ? 'selected' : ''}`}
                      >
                        {VALUE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fisik Kuat */}
                <div className="playground-row">
                  <span className="playground-label">Ketahanan Fisik</span>
                  <div className="playground-btn-group">
                    {['ya', 'tidak'].map((v) => (
                      <button
                        key={v}
                        onClick={() => updatePlaygroundFact('fisik_kuat', v)}
                        className={`playground-btn ${facts.fisik_kuat === v ? 'selected' : ''}`}
                      >
                        {v === 'ya' ? 'Sangat Kuat' : 'Standar'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hasil Trial */}
                <div className="playground-row">
                  <span className="playground-label">Hasil Trial</span>
                  <div className="playground-btn-group">
                    {['baik', 'cukup', 'buruk'].map((v) => (
                      <button
                        key={v}
                        onClick={() => updatePlaygroundFact('hasil_trial', v)}
                        className={`playground-btn ${facts.hasil_trial === v ? 'selected' : ''}`}
                      >
                        {VALUE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Active Rules Result Tracker */}
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px dashed var(--color-hairline)' }}>
                <span className="caption-editorial" style={{ fontWeight: 600, color: 'var(--color-ink)' }}>
                  Aturan yang Aktif ({triggeredRules.length}):
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {triggeredRules.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'var(--color-mute)', fontFamily: 'var(--font-mono)' }}>NO_ACTIVE_RULES</span>
                  ) : (
                    triggeredRules.map((id) => (
                      <span
                        key={id}
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(17, 255, 153, 0.1)',
                          border: '1px solid rgba(17, 255, 153, 0.3)',
                          color: 'var(--color-accent-green)',
                        }}
                      >
                        {id}
                      </span>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* RULES LIST & FILTERS COLUMN */}
          <div>
            
            {/* Filter controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-mute)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8"></circle>
                      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                  </span>
                  <input
                    type="text"
                    placeholder="Cari aturan (misal: H1, kitchen, ramah...)"
                    className="text-input-editorial"
                    style={{ paddingLeft: '40px', height: '42px' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-tabs">
                <button
                  className={`tab-btn ${activeStage === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveStage('all')}
                >
                  Semua Aturan ({rules.length})
                </button>
                <button
                  className={`tab-btn ${activeStage === 1 ? 'active' : ''}`}
                  onClick={() => setActiveStage(1)}
                >
                  Tahap 1: Penilaian Kelayakan ({rules.filter(r => r.stage === 1).length})
                </button>
                <button
                  className={`tab-btn ${activeStage === 2 ? 'active' : ''}`}
                  onClick={() => setActiveStage(2)}
                >
                  Tahap 2: Penentuan Penempatan ({rules.filter(r => r.stage === 2).length})
                </button>
              </div>
            </div>

            {/* List */}
            <div className="rules-list">
              {loadingRules ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 bg-transparent w-full">
                  <div className="relative w-12 h-12 flex items-center justify-center">
                    <div className="absolute inset-0 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }} />
                    <div className="w-6 h-6 rounded-lg bg-cyan-500/10 text-cyan-500 flex items-center justify-center animate-pulse">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 text-center">
                    <p className="text-slate-700 dark:text-slate-200 text-xs font-bold tracking-wide uppercase">
                      Memuat Basis Pengetahuan
                    </p>
                    <p className="text-slate-400 dark:text-[#7f8087] text-[10px] animate-pulse">
                      Mengunduh basis aturan & bobot Certainty Factor...
                    </p>
                  </div>
                </div>
              ) : filteredRules.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'var(--color-surface-card)', borderRadius: '12px', border: '1px solid var(--color-hairline)', color: 'var(--color-mute)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                  NO_RULES_MATCHED_SEARCH_CRITERIA
                </div>
              ) : (
                filteredRules.map((rule) => {
                  const isTriggered = triggeredRules.includes(rule.rule_id);
                  const isStage1 = rule.stage === 1;
                  const isHoleRule = ['H14', 'H15', 'H16', 'P9'].includes(rule.rule_id);
                  
                  // Certainty Factor Colors
                  let cfColor = 'var(--color-accent-blue)';
                  let cfBg = 'rgba(37, 99, 235, 0.1)';
                  if (rule.cf >= 0.9) {
                    cfColor = 'var(--color-accent-green)';
                    cfBg = 'rgba(17, 255, 153, 0.1)';
                  } else if (rule.cf < 0.7) {
                    cfColor = 'var(--color-accent-yellow)';
                    cfBg = 'rgba(217, 119, 6, 0.1)';
                  }

                  return (
                    <div
                      key={rule.rule_id}
                      className={`rule-card ${isTriggered ? 'triggered' : ''}`}
                    >
                      {/* Active status indicator overlay */}
                      {isTriggered && (
                        <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 12px', background: 'var(--color-accent-green)', color: '#000000', fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '0 0 0 8px' }}>
                          ⚡ Terpicu (Aktif)
                        </div>
                      )}

                      {/* Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 800,
                              color: isTriggered ? 'var(--color-accent-green)' : 'var(--color-ink)',
                              fontFamily: 'var(--font-mono)',
                            }}
                          >
                            [{rule.rule_id}]
                          </span>
                          
                          <span
                            className="stage-badge"
                            style={{
                              backgroundColor: isStage1 ? 'rgba(59, 158, 255, 0.08)' : 'rgba(255, 197, 61, 0.08)',
                              color: isStage1 ? 'var(--color-accent-blue)' : 'var(--color-accent-yellow)',
                              border: `1px solid ${isStage1 ? 'rgba(59, 158, 255, 0.15)' : 'rgba(255, 197, 61, 0.15)'}`,
                            }}
                          >
                            {isStage1 ? 'Tahap 1: Kelayakan' : 'Tahap 2: Penempatan'}
                          </span>

                          {isHoleRule && (
                            <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.08)', border: '1px solid rgba(220, 38, 38, 0.15)', color: 'var(--color-accent-red)', fontWeight: 700 }}>
                              Aturan Tambahan (Hole Fix)
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="caption-editorial" style={{ color: 'var(--color-mute)' }}>CF:</span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: cfColor }}>
                              {Math.round(rule.cf * 100)}%
                            </span>
                          </div>
                          
                          {/* Admin CRUD options inside Card */}
                          {user?.role === 'admin' && (
                            <div style={{ display: 'flex', gap: '6px', borderLeft: '1px solid var(--color-hairline)', paddingLeft: '12px' }}>
                              <button
                                onClick={() => openEditModal(rule)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--color-accent-blue)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  fontWeight: 500
                                }}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteRule(rule.rule_id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--color-accent-red)',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  fontWeight: 500
                                }}
                              >
                                Hapus
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="body-md-editorial" style={{ margin: '0 0 16px', fontWeight: 500, color: 'var(--color-ink)' }}>
                        {rule.description}
                      </p>

                      {/* Flow Diagram (IF... THEN...) */}
                      <div className="flow-container">
                        
                        {/* Premis (IF) */}
                        <div className="flow-block">
                          <div style={{ fontSize: '10px', color: 'var(--color-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                            IF (Syarat / Kondisi):
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                            {rule.conditions.map((cond, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <span style={{ color: 'var(--color-mute)', fontWeight: 700 }}>•</span>
                                <span>{formatCondition(cond)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Arrow separator */}
                        <div className="flow-arrow">➔</div>

                        {/* Conclusion (THEN) */}
                        <div className="flow-block">
                          <div style={{ fontSize: '10px', color: 'var(--color-mute)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                            THEN (Hasil Kesimpulan):
                          </div>
                          <div style={{ paddingLeft: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--color-accent-green)', fontWeight: 700 }}>➔</span>
                            <span>{formatConclusion(rule.conclusion)}</span>
                          </div>
                        </div>

                      </div>

                      {/* Progress Bar of CF */}
                      <div className="cf-meter-container">
                        <div className="cf-bar-track">
                          <div
                            className="cf-bar-fill"
                            style={{
                              width: `${rule.cf * 100}%`,
                              backgroundColor: cfColor,
                            }}
                          />
                        </div>
                        <span className="caption-editorial" style={{ fontFamily: 'var(--font-mono)', minWidth: '40px', textAlign: 'right' }}>
                          CF: {rule.cf.toFixed(2)}
                        </span>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>

      {/* CRUD MODAL FOR ADMIN */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-body" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-hairline)', paddingBottom: '14px' }}>
              <h3 className="heading-sm" style={{ margin: 0, fontSize: '16px' }}>
                {isEditing ? `Edit Aturan [${ruleForm.rule_id}]` : 'Tambah Aturan Sistem Pakar Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', color: 'var(--color-mute)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRule} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Rule ID & Stage */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-section-title">Aturan ID *</label>
                  <input
                    type="text"
                    className="text-input-editorial"
                    placeholder="Contoh: H16, P10"
                    disabled={isEditing}
                    value={ruleForm.rule_id}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, rule_id: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="form-section-title">Tahap Inferensi *</label>
                  <select
                    className="text-input-editorial"
                    value={ruleForm.stage}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, stage: Number(e.target.value) as Stage }))}
                    style={{ cursor: 'pointer' }}
                  >
                    <option value={1}>Tahap 1 (Penilaian Kelayakan)</option>
                    <option value={2}>Tahap 2 (Penempatan Posisi)</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="form-section-title">Deskripsi Logika Aturan *</label>
                <input
                  type="text"
                  className="text-input-editorial"
                  placeholder="Contoh: Ketersediaan shift malam dan kepemilikan kendaraan"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>

              {/* Certainty Factor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-section-title">Certainty Factor (CF) Pakar *</label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--color-accent-blue)' }}>
                    {ruleForm.cf.toFixed(2)} ({Math.round(ruleForm.cf * 100)}%)
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                  <input
                    type="range"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={ruleForm.cf}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, cf: Number(e.target.value) }))}
                    style={{ flex: 1, accentColor: 'var(--color-accent-blue)', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Dynamic Conditions (IF) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-section-title" style={{ margin: 0 }}>IF - Kondisi Syarat (Premis)</label>
                  <button
                    type="button"
                    onClick={addCondition}
                    className="btn-ghost-editorial"
                    style={{ fontSize: '11px', height: '28px', padding: '0 8px', borderRadius: '4px' }}
                  >
                    + Tambah Syarat
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ruleForm.conditions.map((cond, idx) => (
                    <div key={idx} className="modal-condition-row">
                      {/* Atribut */}
                      <select
                        className="text-input-editorial field-attr"
                        value={cond.attribute}
                        onChange={(e) => updateCondition(idx, 'attribute', e.target.value)}
                        style={{ padding: '4px 8px', height: '34px', fontSize: '12px' }}
                      >
                        {Object.entries(ATTRIBUTE_LABELS).map(([k, label]) => (
                          <option key={k} value={k}>{label} ({k})</option>
                        ))}
                      </select>

                      {/* Operator */}
                      <select
                        className="text-input-editorial field-op"
                        value={cond.operator}
                        onChange={(e) => updateCondition(idx, 'operator', e.target.value as Operator)}
                        style={{ padding: '4px', height: '34px', fontSize: '12px', textAlign: 'center' }}
                      >
                        <option value="==">==</option>
                        <option value="!=">!=</option>
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                        <option value=">=">&gt;=</option>
                        <option value="<=">&lt;=</option>
                      </select>

                      {/* Value (dynamic input/select) */}
                      <input
                        type="text"
                        className="text-input-editorial field-val"
                        placeholder="Nilai (ya, tidak, baik, 2, dll)"
                        value={String(cond.value)}
                        onChange={(e) => {
                          const val = e.target.value;
                          const num = Number(val);
                          updateCondition(idx, 'value', isNaN(num) || val.trim() === '' ? val : num);
                        }}
                        style={{ padding: '4px 8px', height: '34px', fontSize: '12px' }}
                        required
                      />

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeCondition(idx)}
                        disabled={ruleForm.conditions.length === 1}
                        className="field-del"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: ruleForm.conditions.length === 1 ? 'var(--color-stone)' : 'var(--color-accent-red)',
                          cursor: ruleForm.conditions.length === 1 ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          padding: '4px'
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Conclusion (THEN) */}
              <div>
                <label className="form-section-title">THEN - Kesimpulan (Konklusi)</label>
                <div className="modal-conclusion-row">
                  
                  {/* Conclusion Attribute */}
                  <select
                    className="text-input-editorial field-attr"
                    value={ruleForm.conclusion.attribute}
                    onChange={(e) => updateConclusion('attribute', e.target.value)}
                    style={{ padding: '4px 8px', height: '34px', fontSize: '12px' }}
                  >
                    {Object.entries(ATTRIBUTE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label} ({k})</option>
                    ))}
                  </select>
                  
                  <span className="field-arrow" style={{ color: 'var(--color-accent-green)', fontWeight: 700, fontSize: '13px' }}>➔</span>

                  {/* Conclusion Value */}
                  <input
                    type="text"
                    className="text-input-editorial field-val"
                    placeholder="Nilai (ya, ditolak, kitchen, dll)"
                    value={String(ruleForm.conclusion.value)}
                    onChange={(e) => {
                      const val = e.target.value;
                      const num = Number(val);
                      updateConclusion('value', isNaN(num) || val.trim() === '' ? val : num);
                    }}
                    style={{ padding: '4px 8px', height: '34px', fontSize: '12px' }}
                    required
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--color-hairline)', paddingTop: '14px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-ghost-editorial"
                  style={{ height: '38px', fontSize: '12px' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-primary-editorial"
                  style={{ height: '38px', fontSize: '12px', fontWeight: 600 }}
                >
                  Simpan Aturan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
