'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { InferenceResult } from '@/lib/inference-engine';
import { Sparkles } from 'lucide-react';

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

interface CandidateRecord {
  id: string;
  tanggal: string;
  result: InferenceResult;
}

const STATUS_BADGES: Record<string, { label: string; color: string; bg: string; border: string }> = {
  diterima: { label: 'Diterima', color: 'var(--color-accent-green)', bg: 'rgba(17, 255, 153, 0.05)', border: 'rgba(17, 255, 153, 0.15)' },
  evaluasi_lanjut: { label: 'Evaluasi Lanjut', color: 'var(--color-accent-yellow)', bg: 'rgba(255, 197, 61, 0.05)', border: 'rgba(255, 197, 61, 0.15)' },
  perlu_pelatihan: { label: 'Perlu Pelatihan', color: 'var(--color-accent-blue)', bg: 'rgba(59, 158, 255, 0.05)', border: 'rgba(59, 158, 255, 0.15)' },
  ditolak: { label: 'Ditolak', color: 'var(--color-accent-red)', bg: 'rgba(255, 32, 71, 0.05)', border: 'rgba(255, 32, 71, 0.15)' },
};

const POSITION_LABELS: Record<string, string> = {
  frontliner: 'Frontliner',
  kitchen: 'Kitchen',
  operasional: 'Operasional',
  general_staff: 'General Staff',
};

export default function HasilEvaluasiPage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mounted, setMounted] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadCandidates = () => {
    fetch('/api/candidates')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch candidates');
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setCandidates(data.data);
        }
      })
      .catch((err) => {
        console.error('Error loading candidates from database:', err);
      })
      .finally(() => {
        setMounted(true);
      });
  };

  useEffect(() => {
    loadCandidates();
  }, []);

  const handleDeleteCandidate = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/candidates?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kandidat');
      setConfirmDeleteId(null);
      loadCandidates();
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-select-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [dropdownOpen]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Render handled below with AnimatePresence

  // Search and Filter logic
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = c.result.candidate_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.result.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredCandidates.length / itemsPerPage);
  const activePage = Math.min(Math.max(currentPage, 1), totalPages || 1);
  const indexOfLastItem = activePage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentCandidates = filteredCandidates.slice(indexOfFirstItem, indexOfLastItem);

  const viewDetails = (record: CandidateRecord) => {
    router.push(`/hasil/${record.id}`);
  };

  const exportToCSV = () => {
    const STATUS_LABELS: Record<string, string> = {
      diterima: 'Diterima', evaluasi_lanjut: 'Evaluasi Lanjut',
      perlu_pelatihan: 'Perlu Pelatihan', ditolak: 'Tidak Direkomendasikan',
    };

    const headers = ['No', 'Nama Kandidat', 'Tanggal Evaluasi', 'Status', 'CF Status (%)', 'Rekomendasi Posisi', 'CF Posisi (%)'];
    const rows = candidates.map((c, i) => {
      const best = c.result.placements?.[0];
      return [
        i + 1,
        c.result.candidate_name,
        c.tanggal,
        STATUS_LABELS[c.result.status] ?? c.result.status,
        Math.round(c.result.status_cf * 100),
        best ? (POSITION_LABELS[best.posisi] ?? best.posisi) : '—',
        best ? Math.round(best.cf * 100) : 0,
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // BOM for Excel Indonesian charset compatibility
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sate-semua-kandidat-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ paddingBottom: '40px' }} className="min-h-full">
      <AnimatePresence mode="wait">
        {!mounted ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ minHeight: '80vh' }}
            className="canvas-bg flex flex-col items-center justify-center gap-5"
          >
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 border-4 border-cyan-500/10 border-t-cyan-500 rounded-full animate-spin" />
              <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }} />
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex flex-col items-center gap-1.5 text-center">
              <p className="text-slate-700 dark:text-slate-200 text-sm font-bold tracking-wide uppercase">
                Memuat Log Evaluasi
              </p>
              <p className="text-slate-400 dark:text-[#7f8087] text-[11px] animate-pulse">
                Menghubungkan ke database & mengambil arsip kandidat...
              </p>
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
          
          .datatable-wrapper {
            background-color: var(--color-surface-card);
            border: 1px solid var(--color-hairline-strong);
            border-radius: 2rem; /* rounded-2rem */
            overflow: hidden;
            min-width: 0;
            margin-top: 24px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.02);
          }

          .filter-bar {
            padding: 20px 24px;
            border-bottom: 1px solid var(--color-hairline-strong);
            display: flex;
            flex-direction: column;
            gap: 16px;
          }

          .search-input {
            background-color: var(--color-surface-card);
            border: 1px solid var(--color-hairline-strong);
            border-radius: 14px;
            padding: 10px 16px;
            font-size: 13px;
            color: var(--color-ink);
            outline: none;
            width: 100%;
            height: 40px;
            transition: all 0.2s ease;
          }

          .search-input:focus {
            border-color: var(--color-primary-white);
            box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
          }

          .filter-actions {
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 100%;
          }

          .custom-select-container {
            position: relative;
            width: 100%;
          }

          .custom-select-trigger {
            background-color: var(--color-surface-card);
            border: 1px solid var(--color-hairline-strong);
            border-radius: 14px;
            padding: 8px 16px;
            font-size: 13px;
            color: var(--color-ink);
            display: flex;
            align-items: center;
            gap: 12px;
            cursor: pointer;
            height: 40px;
            font-family: var(--font-sans);
            justify-content: space-between;
            width: 100%;
            transition: all 0.2s ease;
          }
          .custom-select-trigger:hover {
            border-color: var(--color-mute);
          }

          .custom-select-options {
            position: absolute;
            top: 46px;
            right: 0;
            left: 0;
            background-color: var(--color-surface-card);
            border: 1px solid var(--color-hairline-strong);
            border-radius: 14px;
            zIndex: 50;
            box-shadow: 0 10px 30px rgba(0,0,0,0.08);
            overflow: hidden;
            padding: 6px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }

          .csv-export-btn {
            height: 40px;
            padding: 0 18px;
            background-color: transparent;
            border: 1px solid var(--color-hairline-strong);
            border-radius: 14px;
            font-size: 12.5px;
            font-weight: 600;
            color: var(--color-charcoal);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-family: var(--font-sans);
            transition: all 0.2s ease;
            width: 100%;
            justify-content: center;
          }

          .csv-export-btn:disabled {
            color: var(--color-stone) !important;
            cursor: not-allowed;
            border-color: var(--color-hairline-strong) !important;
          }

          @media (min-width: 640px) {
            .filter-actions {
              flex-direction: row;
              width: auto;
            }
            .custom-select-container {
              width: auto;
            }
            .custom-select-trigger {
              width: auto;
              min-width: 160px;
            }
            .custom-select-options {
              left: auto;
              min-width: 170px;
            }
            .csv-export-btn {
              width: auto;
              justify-content: flex-start;
            }
          }

          .table-scroll {
            overflow-x: auto;
          }

          .dash-table {
            width: 100%;
            border-collapse: collapse;
            text-align: left;
            font-size: 13px;
          }

          .dash-table th {
            background-color: rgba(0, 0, 0, 0.01);
            color: var(--color-mute);
            font-weight: 600;
            padding: 14px 24px;
            border-bottom: 1px solid var(--color-hairline-strong);
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.05em;
          }

          .dash-table td {
            padding: 16px 24px;
            border-bottom: 1px solid var(--color-hairline-strong);
            color: var(--color-body);
          }

          .dash-table tr:hover td {
            background-color: var(--color-hover-overlay-ultrasubtle);
          }

          .status-badge {
            display: inline-flex;
            align-items: center;
            padding: 4px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 700;
          }

          @media (min-width: 768px) {
            .filter-bar {
              flex-direction: row;
              align-items: center;
              justify-content: space-between;
              padding: 20px 28px;
            }
            .search-input {
              max-width: 300px;
            }
          }
        `}</style>

        <div className="hasil-container">
          {/* Header Row */}
          <motion.div variants={itemVariants} className="page-header-group">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="page-header-badge" style={{ borderColor: 'var(--color-accent-orange)', color: 'var(--color-accent-orange)', background: 'var(--color-accent-orange-glow)' }}>
                DATABASE EVALUASI
              </div>
              <div className="page-header-row">
                <div>
                  <h1 className="page-header-title">Log Hasil Evaluasi</h1>
                  <p className="page-header-subtitle">Daftar keseluruhan data asesmen penempatan karyawan F&B</p>
                </div>
                <div className="no-print">
                  <Link href="/">
                    <button className="btn-ghost-editorial touch-target-mobile" style={{ height: '42px', fontWeight: 600, padding: '0 16px', fontSize: '13px' }}>
                      ← Kembali ke Dashboard
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Main Candidates table */}
          <motion.div variants={itemVariants} className="datatable-wrapper">
            <div className="filter-bar">
              <span className="heading-sm" style={{ fontSize: '14px', color: 'var(--color-ink)' }}>Daftar Evaluasi Keseluruhan</span>
              
              <div className="filter-actions">
                <input
                  type="text"
                  placeholder="Cari nama kandidat..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                
                <div className="custom-select-container">
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="custom-select-trigger"
                  >
                    <span>
                      {
                        [
                          { value: 'all', label: 'Semua Status' },
                          { value: 'diterima', label: 'Diterima' },
                          { value: 'perlu_pelatihan', label: 'Perlu Pelatihan' },
                          { value: 'evaluasi_lanjut', label: 'Evaluasi Lanjut' },
                          { value: 'ditolak', label: 'Ditolak' }
                        ].find(o => o.value === statusFilter)?.label
                      }
                    </span>
                    <span
                      style={{
                        fontSize: '9px',
                        color: 'var(--color-mute)',
                        transition: 'transform 0.2s ease',
                        transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        display: 'inline-block',
                      }}
                    >
                      ▼
                    </span>
                  </button>
                  
                  {dropdownOpen && (
                    <div className="custom-select-options">
                      {[
                        { value: 'all', label: 'Semua Status' },
                        { value: 'diterima', label: 'Diterima' },
                        { value: 'perlu_pelatihan', label: 'Perlu Pelatihan' },
                        { value: 'evaluasi_lanjut', label: 'Evaluasi Lanjut' },
                        { value: 'ditolak', label: 'Ditolak' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setStatusFilter(opt.value);
                            setDropdownOpen(false);
                          }}
                          className="custom-select-option"
                          style={{
                            textAlign: 'left',
                            padding: '8px 12px',
                            fontSize: '13px',
                            color: statusFilter === opt.value ? 'var(--color-accent-orange)' : 'var(--color-body)',
                            background: statusFilter === opt.value ? 'var(--color-accent-orange-glow)' : 'transparent',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-sans)',
                            width: '100%',
                            transition: 'all 0.1s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (statusFilter !== opt.value) {
                              e.currentTarget.style.backgroundColor = 'var(--color-surface-elevated)';
                              e.currentTarget.style.color = 'var(--color-ink)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (statusFilter !== opt.value) {
                              e.currentTarget.style.backgroundColor = 'transparent';
                              e.currentTarget.style.color = 'var(--color-body)';
                            }
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Export CSV Button */}
                <button
                  type="button"
                  onClick={exportToCSV}
                  disabled={candidates.length === 0}
                  className="csv-export-btn"
                  onMouseEnter={(e) => {
                    if (candidates.length > 0) {
                      e.currentTarget.style.borderColor = 'var(--color-accent-green)';
                      e.currentTarget.style.color = 'var(--color-accent-green)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-hairline-strong)';
                    e.currentTarget.style.color = 'var(--color-charcoal)';
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Ekspor CSV
                </button>
              </div>
            </div>

            <div className="table-scroll">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Nama Kandidat</th>
                    <th>Tanggal Evaluasi</th>
                    <th>Status Kelayakan</th>
                    <th>Rekomendasi Penempatan</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {currentCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', color: 'var(--color-stone)', padding: '32px', fontFamily: 'var(--font-mono)' }}>
                        NO_EVALUATION_RECORDS_FOUND
                      </td>
                    </tr>
                  ) : (
                    currentCandidates.map((record) => {
                      const badge = STATUS_BADGES[record.result.status] ?? STATUS_BADGES.ditolak;
                      const bestPlacement = record.result.best_placement;
                      
                      return (
                        <tr key={record.id}>
                          <td style={{ fontWeight: 600, color: 'var(--color-ink)' }}>{record.result.candidate_name}</td>
                          <td>{record.tanggal}</td>
                          <td>
                            <span
                              className="status-badge"
                              style={{
                                color: badge.color,
                                backgroundColor: badge.bg,
                                border: `1px solid ${badge.border}`,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ fontWeight: 500 }}>
                            {record.result.status !== 'ditolak' && bestPlacement ? (
                              <>
                                <span style={{ color: 'var(--color-primary-white)' }}>
                                  {POSITION_LABELS[bestPlacement.posisi] ?? bestPlacement.posisi}
                                </span>
                                <span style={{ color: 'var(--color-accent-orange)', fontSize: '11px', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
                                  ({Math.round(bestPlacement.cf * 100)}%)
                                </span>
                              </>
                            ) : (
                              <span style={{ color: 'var(--color-stone)' }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => viewDetails(record)}
                                className="btn-ghost-editorial touch-target-mobile"
                                style={{
                                  height: '32px',
                                  padding: '0 12px',
                                  fontSize: '12px',
                                  backgroundColor: 'transparent',
                                  color: 'var(--color-accent-orange)',
                                  borderColor: 'var(--color-accent-orange)',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-accent-orange)';
                                  e.currentTarget.style.color = 'var(--color-primary-on)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = 'var(--color-accent-orange)';
                                }}
                              >
                                Detail
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(record.id)}
                                className="btn-ghost-editorial touch-target-mobile"
                                style={{
                                  height: '32px',
                                  padding: '0 12px',
                                  fontSize: '12px',
                                  backgroundColor: 'transparent',
                                  color: 'var(--color-accent-red)',
                                  borderColor: 'var(--color-accent-red)',
                                  transition: 'all 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-accent-red)';
                                  e.currentTarget.style.color = 'var(--color-primary-on)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = 'var(--color-accent-red)';
                                }}
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination-bar" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 20px',
              borderTop: '1px solid var(--color-hairline)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <span className="caption-editorial" style={{ color: 'var(--color-charcoal)', fontSize: '12px' }}>
                Menampilkan {filteredCandidates.length === 0 ? 0 : indexOfFirstItem + 1}–{Math.min(indexOfLastItem, filteredCandidates.length)} dari {filteredCandidates.length} kandidat
              </span>
              
              {totalPages > 1 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={activePage === 1}
                    className="btn-ghost-editorial touch-target-mobile"
                    style={{
                      height: '32px',
                      width: '32px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: activePage === 1 ? 'not-allowed' : 'pointer',
                      opacity: activePage === 1 ? 0.3 : 1,
                      borderColor: 'var(--color-hairline-strong)',
                      color: 'var(--color-ink)',
                      backgroundColor: 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ‹
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className="touch-target-mobile"
                      style={{
                        height: '32px',
                        width: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: activePage === page ? '600' : '400',
                        cursor: 'pointer',
                        backgroundColor: activePage === page ? 'var(--color-accent-orange)' : 'transparent',
                        color: activePage === page ? 'var(--color-primary-on)' : 'var(--color-ink)',
                        border: activePage === page ? '1px solid var(--color-accent-orange)' : '1px solid transparent',
                        fontFamily: 'var(--font-mono)',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (activePage !== page) {
                          e.currentTarget.style.backgroundColor = 'var(--color-hover-overlay)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (activePage !== page) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={activePage === totalPages}
                    className="btn-ghost-editorial touch-target-mobile"
                    style={{
                      height: '32px',
                      width: '32px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      fontSize: '14px',
                      cursor: activePage === totalPages ? 'not-allowed' : 'pointer',
                      opacity: activePage === totalPages ? 0.3 : 1,
                      borderColor: 'var(--color-hairline-strong)',
                      color: 'var(--color-ink)',
                      backgroundColor: 'transparent',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (() => {
        const target = candidates.find(c => c.id === confirmDeleteId);
        return (
          <div style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200, padding: '20px',
          }}>
            <div style={{
              backgroundColor: 'var(--color-surface-card)',
              border: '1px solid var(--color-hairline-strong)',
              borderRadius: '12px',
              padding: '32px 28px',
              width: '100%',
              maxWidth: '400px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              {/* Icon */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  backgroundColor: 'var(--color-accent-red-glow)',
                  border: '1px solid rgba(255,32,71,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent-red)" strokeWidth="2.5">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </div>
              </div>

              {/* Text */}
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--color-ink)', margin: '0 0 8px' }}>
                  Hapus Data Kandidat?
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--color-charcoal)', margin: 0, lineHeight: 1.5 }}>
                  Kamu akan menghapus data evaluasi <strong style={{ color: 'var(--color-ink)' }}>{target?.result.candidate_name ?? '—'}</strong>.
                  Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{
                    flex: 1, height: '40px', fontSize: '13px', fontWeight: 500,
                    backgroundColor: 'transparent',
                    border: '1px solid var(--color-hairline-strong)',
                    borderRadius: '8px',
                    color: 'var(--color-charcoal)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDeleteCandidate(confirmDeleteId)}
                  disabled={deletingId === confirmDeleteId}
                  style={{
                    flex: 1, height: '40px', fontSize: '13px', fontWeight: 600,
                    backgroundColor: 'var(--color-accent-red)',
                    border: '1px solid var(--color-accent-red)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    cursor: deletingId === confirmDeleteId ? 'not-allowed' : 'pointer',
                    opacity: deletingId === confirmDeleteId ? 0.7 : 1,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  {deletingId === confirmDeleteId ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
