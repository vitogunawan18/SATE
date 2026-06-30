'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, FileText, ChevronRight, CheckCircle, Sparkles } from 'lucide-react';
import { InferenceResult } from '@/lib/inference-engine';

// Animation variants
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
  diterima: { label: 'Diterima', color: '#2ec4b6', bg: 'rgba(46, 196, 182, 0.05)', border: 'rgba(46, 196, 182, 0.15)' },
  evaluasi_lanjut: { label: 'Evaluasi Lanjut', color: '#ffc53d', bg: 'rgba(255, 197, 61, 0.05)', border: 'rgba(255, 197, 61, 0.15)' },
  perlu_pelatihan: { label: 'Perlu Pelatihan', color: '#3b9eff', bg: 'rgba(59, 158, 255, 0.05)', border: 'rgba(59, 158, 255, 0.15)' },
  ditolak: { label: 'Ditolak', color: '#e71d36', bg: 'rgba(231, 29, 54, 0.05)', border: 'rgba(231, 29, 54, 0.15)' },
};

const POSITION_LABELS: Record<string, string> = {
  frontliner: 'Frontliner',
  kitchen: 'Kitchen',
  operasional: 'Operasional',
  general_staff: 'General Staff',
};

export default function HomePage() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
    const timer = setTimeout(() => setChartReady(true), 600);
    return () => clearTimeout(timer);
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

  // Calculate KPIs
  const totalCount = candidates.length;
  const acceptedCount = candidates.filter((c) => c.result.status === 'diterima').length;
  const trainingCount = candidates.filter((c) => c.result.status === 'perlu_pelatihan').length;
  const otherCount = totalCount - acceptedCount - trainingCount;

  // Calculate Placement distribution for chart
  const placementDistribution = {
    frontliner: 0,
    kitchen: 0,
    operasional: 0,
    general_staff: 0,
  };

  candidates.forEach((c) => {
    if (c.result.status !== 'ditolak' && c.result.best_placement) {
      const pos = c.result.best_placement.posisi;
      if (pos in placementDistribution) {
        placementDistribution[pos as keyof typeof placementDistribution]++;
      }
    }
  });

  const chartData = [
    { name: 'Frontliner', count: placementDistribution.frontliner, fill: '#0ea5e9' },
    { name: 'Kitchen', count: placementDistribution.kitchen, fill: '#f59e0b' },
    { name: 'Operasional', count: placementDistribution.operasional, fill: '#10b981' },
    { name: 'General Staff', count: placementDistribution.general_staff, fill: '#94a3b8' },
  ];

  // Limit to 3 latest candidate records for dashboard
  const latestCandidates = candidates.slice(0, 3);

  const viewDetails = (record: CandidateRecord) => {
    router.push(`/hasil/${record.id}`);
  };

  return (
    <div className="pb-10 min-h-full">
      <AnimatePresence mode="wait">
        {!mounted ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="min-h-[60vh] flex flex-col items-center justify-center gap-5 bg-transparent"
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
                Memuat Dasbor Asesmen
              </p>
              <p className="text-slate-400 dark:text-[#7f8087] text-[11px] animate-pulse">
                Mengambil data metrik & log kandidat terbaru...
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="dashboard-content"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* Header Row */}
            <motion.div 
              variants={itemVariants}
              className="page-header-group pb-6 mb-8 border-b border-slate-100 dark:border-[#23232a] relative"
            >
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="page-header-badge bg-cyan-50/80 dark:bg-cyan-950/20 border border-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-wider text-[10px] px-3 py-1 rounded-md inline-block mb-3"
                  >
                    DASHBOARD OVERVIEW
                  </motion.div>
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white font-sans">SATE Dashboard</h1>
                  <p className="text-sm text-slate-400 dark:text-[#7f8087] mt-1">Smart Assessment for Talent Evaluation in FNB</p>
                </div>
                
                <div className="no-print">
                  <Link href="/evaluasi">
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300 bg-cyan-500 text-white hover:bg-cyan-600 flex items-center gap-2 shadow-lg shadow-cyan-500/15"
                    >
                      <Plus className="w-4 h-4" />
                      Mulai Evaluasi Kandidat
                    </motion.button>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* KPIs Grid */}
            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {[
                { label: 'TOTAL PROSES', value: totalCount, icon: FileText, color: 'text-slate-600 dark:text-cyan-100', iconColor: 'text-slate-800/10 dark:text-white/10', isSpecial: true },
                { label: 'DITERIMA', value: acceptedCount, icon: CheckCircle, color: 'text-[#10b981] dark:text-[#2ec4b6]', iconColor: 'text-[#10b981]/15 dark:text-[#2ec4b6]/10' },
                { label: 'PERLU PELATIHAN', value: trainingCount, icon: Plus, color: 'text-cyan-600 dark:text-cyan-400', iconColor: 'text-cyan-500/10' },
                { label: 'EVALUASI / DITOLAK', value: otherCount, icon: SparklesIcon, color: 'text-amber-600 dark:text-amber-400', iconColor: 'text-amber-500/10' },
              ].map((kpi, index) => (
                <motion.div
                  key={kpi.label}
                  variants={itemVariants}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className={`${kpi.isSpecial ? 'wave-bg' : 'bg-white dark:bg-[#18181c]'} rounded-[2rem] p-6 flex flex-col justify-between relative shadow-sm border border-slate-100 dark:border-[#23232a]/40 min-h-[140px] group overflow-hidden`}
                >
                  <div className="relative z-10">
                    <span className={`text-[10px] uppercase font-bold tracking-wider ${kpi.color} block`}>{kpi.label}</span>
                    <motion.span 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.2 + index * 0.05, type: 'spring' }}
                      className={`text-3xl font-extrabold ${kpi.isSpecial ? 'text-slate-800 dark:text-white' : kpi.color} mt-2 block font-sans`}
                    >
                      {kpi.value}
                    </motion.span>
                  </div>
                  <div className={`absolute right-4 bottom-4 ${kpi.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                    <kpi.icon className="w-12 h-12" />
                  </div>
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Main Widgets Layout */}
            <motion.div 
              variants={containerVariants}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6"
            >
              {/* LEFT WIDGET: Candidate list table */}
              <motion.div 
                variants={itemVariants}
                className="lg:col-span-7 bg-white dark:bg-[#18181c] border border-slate-100 dark:border-[#23232a] rounded-[2rem] overflow-hidden flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="px-6 py-5 border-b border-slate-100 dark:border-[#23232a] flex justify-between items-center bg-slate-50/50 dark:bg-[#18181c]/50">
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Log Evaluasi Terkini</h3>
                      <p className="text-[11px] text-slate-400 dark:text-[#7f8087] mt-0.5">Menampilkan 3 data kandidat teratas</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-[#23232a] bg-slate-50/50 dark:bg-[#121214]/60">
                          <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Nama Kandidat</th>
                          <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Tanggal Evaluasi</th>
                          <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Status Kelayakan</th>
                          <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">Rekomendasi</th>
                          <th className="px-6 py-4 font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] text-right">Aksi</th>
                        </tr>
                      </thead>
                      <motion.tbody variants={containerVariants}>
                        {latestCandidates.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center text-slate-400 py-8 font-mono text-[11px]">
                              NO_CANDIDATE_RECORDS_FOUND
                            </td>
                          </tr>
                        ) : (
                          latestCandidates.map((record) => {
                            const badge = STATUS_BADGES[record.result.status] ?? STATUS_BADGES.ditolak;
                            const bestPlacement = record.result.best_placement;
                            
                            return (
                              <motion.tr 
                                key={record.id}
                                variants={itemVariants}
                                className="border-b border-slate-100/50 dark:border-[#23232a]/50 hover:bg-slate-50/40 dark:hover:bg-[#16161c]/30 transition-colors duration-200"
                              >
                                <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">{record.result.candidate_name}</td>
                                <td className="px-6 py-4 text-slate-400 dark:text-[#7f8087]">{record.tanggal}</td>
                                <td className="px-6 py-4">
                                  <span
                                    className="inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold border"
                                    style={{
                                      color: badge.color,
                                      backgroundColor: badge.bg,
                                      borderColor: badge.border,
                                    }}
                                  >
                                    {badge.label}
                                  </span>
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-200">
                                  {record.result.status !== 'ditolak' && bestPlacement ? (
                                    <div className="flex items-center gap-1.5">
                                      <span>
                                        {POSITION_LABELS[bestPlacement.posisi] ?? bestPlacement.posisi}
                                      </span>
                                      <span className="text-cyan-600 dark:text-cyan-400 text-[10px] font-mono">
                                        ({Math.round(bestPlacement.cf * 100)}%)
                                      </span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 dark:text-[#7f8087]">—</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex gap-2 justify-end">
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => viewDetails(record)}
                                      className="px-2.5 py-1.5 rounded-xl border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all duration-200 font-semibold text-[11px]"
                                    >
                                      Detail
                                    </motion.button>
                                    <motion.button
                                      whileHover={{ scale: 1.1 }}
                                      whileTap={{ scale: 0.9 }}
                                      onClick={() => setConfirmDeleteId(record.id)}
                                      className="p-1.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200"
                                      title="Hapus"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </motion.button>
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          })
                        )}
                      </motion.tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination / View More */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-[#23232a] bg-slate-50/30 dark:bg-[#121214]/30">
                  <Link href="/hasil" className="w-full block">
                    <motion.button 
                      whileHover={{ x: 5 }}
                      className="w-full py-2.5 rounded-xl border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/10 font-bold text-xs transition-all duration-300 flex items-center justify-center gap-1.5"
                    >
                      <span>Lihat Semua Hasil Evaluasi</span>
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  </Link>
                </div>
              </motion.div>

              {/* RIGHT WIDGET: Distribution Chart */}
              <motion.div 
                variants={itemVariants}
                className="lg:col-span-5 bg-white dark:bg-[#18181c] border border-slate-100 dark:border-[#23232a] rounded-[2rem] p-6 flex flex-col justify-between shadow-sm"
              >
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Distribusi Penempatan</h3>
                  <p className="text-[11px] text-slate-400 dark:text-[#7f8087] mt-0.5">Jumlah penempatan divisi kerja aktif</p>
                </div>

                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="h-56 w-full mt-6 relative"
                  style={{ minWidth: 0, minHeight: 0 }}
                >
                  {chartReady ? (
                    <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 1, height: 1 }}>
                      <BarChart data={chartData} barSize={20} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-hairline)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#94a3b8', fontSize: 9 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'var(--color-surface-card)', border: '1px solid var(--color-hairline-strong)', borderRadius: '12px', color: 'var(--color-ink)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                          itemStyle={{ color: 'var(--color-ink)' }}
                          labelStyle={{ color: 'var(--color-charcoal)' }}
                          formatter={(value) => [`${value} Kandidat`, 'Jumlah']}
                          cursor={{ fill: 'rgba(14, 165, 233, 0.02)' }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/10 animate-pulse rounded-2xl" />
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (() => {
          const target = candidates.find(c => c.id === confirmDeleteId);
          return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-white dark:bg-[#18181c] border border-slate-100 dark:border-[#23232a] rounded-[2rem] p-6 max-w-sm w-full glow-card text-center shadow-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 border border-red-500/10 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                
                <h3 className="text-base font-bold text-slate-800 dark:text-white mb-2">Hapus Data Kandidat?</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 leading-relaxed mb-6">
                  Kamu akan menghapus data evaluasi milik <strong className="text-slate-850 dark:text-white">{target?.result.candidate_name ?? '—'}</strong>. Tindakan ini permanen dan tidak dapat dibatalkan.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-100 dark:border-[#23232a] hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-[#e5e7eb] transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => handleDeleteCandidate(confirmDeleteId)}
                    disabled={deletingId === confirmDeleteId}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-xs font-semibold text-white transition-all disabled:opacity-50"
                  >
                    {deletingId === confirmDeleteId ? 'Menghapus...' : 'Ya, Hapus'}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

// Icon fallbacks
function SparklesIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5z" />
      <path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1z" />
    </svg>
  );
}
