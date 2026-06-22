import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCF(cf: number): string {
  return `${Math.round(cf * 100)}%`;
}

export function getCFColor(cf: number): string {
  if (cf >= 0.8) return 'text-emerald-400';
  if (cf >= 0.6) return 'text-amber-400';
  if (cf >= 0.4) return 'text-orange-400';
  return 'text-red-400';
}

export function getStatusConfig(status: string) {
  const configs = {
    diterima: {
      label: 'Diterima',
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/30',
      glow: 'shadow-emerald-500/20',
      icon: '✅',
    },
    evaluasi_lanjut: {
      label: 'Evaluasi Lanjut',
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/30',
      glow: 'shadow-amber-500/20',
      icon: '🔍',
    },
    perlu_pelatihan: {
      label: 'Perlu Pelatihan',
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/30',
      glow: 'shadow-blue-500/20',
      icon: '📚',
    },
    ditolak: {
      label: 'Tidak Direkomendasikan',
      color: 'text-red-400',
      bg: 'bg-red-400/10',
      border: 'border-red-400/30',
      glow: 'shadow-red-500/20',
      icon: '❌',
    },
  };
  return configs[status as keyof typeof configs] ?? configs.ditolak;
}

export function getPlacementConfig(posisi: string) {
  const configs = {
    frontliner: {
      label: 'Frontliner',
      icon: '🤝',
      color: '#6366f1',
      description: 'Pelayanan pelanggan, kasir, host',
    },
    kitchen: {
      label: 'Kitchen / Dapur',
      icon: '👨‍🍳',
      color: '#f59e0b',
      description: 'Persiapan makanan, memasak, plating',
    },
    operasional: {
      label: 'Operasional',
      icon: '⚙️',
      color: '#10b981',
      description: 'Logistik, stok, operasional harian',
    },
    general_staff: {
      label: 'General Staff',
      icon: '👔',
      color: '#64748b',
      description: 'Posisi umum sesuai kebutuhan',
    },
    tidak_ada: {
      label: 'Belum Ditentukan',
      icon: '❓',
      color: '#475569',
      description: '-',
    },
  };
  return configs[posisi as keyof typeof configs] ?? configs.tidak_ada;
}
