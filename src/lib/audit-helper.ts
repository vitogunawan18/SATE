import type { InferenceResult } from './inference-engine';

export interface AuditCriterion {
  label: string;
  status: 'passed' | 'failed' | 'neutral';
  valueText: string;
  description: string;
}

export interface DetailedAuditReport {
  statusLabel: string;
  statusColor: string;
  summaryText: string;
  criteria: AuditCriterion[];
  rationales: string[];
  disqualifiers: string[];
  warnings: string[];
}

export function generateDetailedAuditReport(result: InferenceResult): DetailedAuditReport {
  const wm = result.working_memory || {};
  const rulesFired = result.inference_log.map((step) => step.rule_id);

  // 1. Get status configs
  let statusLabel = 'DITOLAK / TIDAK DIREKOMENDASIKAN';
  let statusColor = 'var(--color-accent-red)';
  let summaryText = 'Kandidat saat ini belum dapat direkomendasikan untuk posisi di outlet F&B.';

  if (result.status === 'diterima') {
    statusLabel = 'DITERIMA';
    statusColor = 'var(--color-accent-green)';
    summaryText = 'Kandidat memenuhi kriteria kelayakan untuk bergabung secara langsung.';
  } else if (result.status === 'perlu_pelatihan') {
    statusLabel = 'PERLU PELATIHAN / MAGANG';
    statusColor = 'var(--color-accent-blue)';
    summaryText = 'Kandidat direkomendasikan untuk program pelatihan terlebih dahulu guna menyelaraskan keterampilan teknis dengan kedisiplinannya.';
  } else if (result.status === 'evaluasi_lanjut') {
    statusLabel = 'EVALUASI LANJUT';
    statusColor = 'var(--color-accent-yellow)';
    summaryText = 'Kandidat membutuhkan peninjauan manual lebih lanjut oleh Manajemen/HRD karena adanya ketidakseimbangan kriteria.';
  }

  // 2. Define criteria evaluation
  const criteria: AuditCriterion[] = [];

  // - Administrasi
  const isLulusAdm = wm['lulus_administrasi']?.value === 'ya';
  criteria.push({
    label: 'Seleksi Administrasi',
    status: isLulusAdm ? 'passed' : 'failed',
    valueText: isLulusAdm ? 'LULUS' : 'GAGAL',
    description: 'Kelayakan berkas, dokumen, dan kualifikasi administratif awal.'
  });

  // - Wawancara
  const isLulusWawancara = wm['lulus_wawancara']?.value === 'ya';
  criteria.push({
    label: 'Observasi Wawancara',
    status: isLulusWawancara ? 'passed' : 'failed',
    valueText: isLulusWawancara ? 'LULUS' : 'GAGAL',
    description: 'Penilaian sikap, tata bahasa, kepribadian, dan kesesuaian nilai.'
  });

  // - Trial Kerja
  const trialVal = wm['hasil_trial']?.value;
  let trialStatus: 'passed' | 'failed' | 'neutral' = 'neutral';
  let trialText = 'BELUM DIUJI';
  if (trialVal === 'baik') {
    trialStatus = 'passed';
    trialText = 'BAIK (MEMUASKAN)';
  } else if (trialVal === 'cukup') {
    trialStatus = 'neutral';
    trialText = 'CUKUP (PERLU EVALUASI)';
  } else if (trialVal === 'buruk') {
    trialStatus = 'failed';
    trialText = 'BURUK (KURANG)';
  }
  criteria.push({
    label: 'Evaluasi Trial Kerja',
    status: trialStatus,
    valueText: trialText,
    description: 'Observasi langsung terhadap kinerja teknis di area kerja outlet.'
  });

  // 3. Compile decision rationales
  const rationales: string[] = [];
  const disqualifiers: string[] = [];
  const warnings: string[] = [];

  // Common pre-checks
  if (!isLulusAdm) {
    rationales.push('Kandidat dinyatakan tidak lulus tahap awal seleksi administrasi berkas.');
  }
  if (!isLulusWawancara) {
    rationales.push('Kandidat dinyatakan tidak lulus pada tahap wawancara kompetensi dan kesesuaian kultur.');
  }

  // Acceptance rationales
  if (result.status === 'diterima') {
    if (rulesFired.includes('H8')) {
      rationales.push('Hasil evaluasi trial kerja nyata di outlet dinilai Baik/Memuaskan (Aturan H8 aktif), membuktikan ketersediaan keterampilan teknis yang langsung siap pakai.');
    }
    if (rulesFired.includes('H13')) {
      rationales.push('Kandidat secara otomatis diterima melalui jalur reputasi terintegrasi (Aturan H13 aktif) karena dinilai sebagai Kandidat Potensial yang memiliki tingkat Loyalitas Baik.');
      
      if (rulesFired.includes('H10')) {
        rationales.push('Identifikasi "Kandidat Potensial" dipicu oleh kombinasi tingkat kedisiplinan yang tinggi serta sikap keramahan (hospitality) yang dinilai sangat ramah (Aturan H10 aktif).');
      }
      
      const riwayatKerja = wm['riwayat_kerja_bulan']?.value;
      rationales.push(`Riwayat stabilitas kerja sebelumnya cukup baik (${riwayatKerja || 0} bulan), sehingga loyalitas dinilai memenuhi standar (tidak memicu Aturan H11).`);
    }
  }

  // Training rationales
  if (result.status === 'perlu_pelatihan') {
    if (rulesFired.includes('H14')) {
      const disiplinText = String(wm['disiplin']?.value || 'sedang').toUpperCase();
      const expYears = wm['pengalaman_fnb_tahun']?.value || 0;
      rationales.push(`Kandidat direkomendasikan untuk program pelatihan terlebih dahulu (Aturan H14 aktif) karena memiliki tingkat kedisiplinan yang TINGGI (${disiplinText}), namun memiliki pengalaman kerja di F&B yang masih minim yaitu ${expYears} tahun (syarat <= 1 tahun).`);
    } else {
      rationales.push('Kandidat memiliki kriteria disiplin yang baik namun kompetensi kerja atau pengalaman praktis dinilai masih memerlukan pembinaan (Aturan Tahap 1 aktif).');
    }
  }

  // Evaluation rationales
  if (result.status === 'evaluasi_lanjut') {
    if (rulesFired.includes('H15')) {
      rationales.push('Kandidat direkomendasikan untuk evaluasi manual lebih lanjut oleh HRD (Aturan H15 aktif) karena memiliki kemampuan kerja individu yang baik (kemampuan_individu = baik), namun kemampuan kolaborasi tim dinilai kurang/rendah (teamwork = rendah).');
    } else {
      rationales.push('Kandidat membutuhkan pertimbangan manajerial karena terdapat kriteria yang kontradiktif (memiliki keahlian tinggi di beberapa bidang namun menunjukkan keterbatasan di bidang kerja sama tim).');
    }
  }

  // Rejection/Disqualification rationales
  if (result.status === 'ditolak') {
    const isPanik = wm['panik_saat_tekanan']?.value === 'ya';
    const isMoodTidakStabil = wm['mood']?.value === 'tidak_stabil';
    const isLoyalitasRendah = wm['riwayat_kerja_bulan']?.value != null && Number(wm['riwayat_kerja_bulan']?.value) < 3;

    if (isPanik) {
      disqualifiers.push('Reaksi Panik Saat Tekanan Tinggi: Kandidat cenderung mudah panik dalam situasi padat/tekanan tinggi, sehingga tingkat kecocokan dinilai rendah (Aturan H12 aktif, CF: 95%).');
    }
    if (isMoodTidakStabil) {
      disqualifiers.push('Ketidakstabilan Mood / Emosi: Emosi yang tidak stabil dapat mengganggu konsistensi pelayanan pelanggan dan operasional tim (Aturan H5 aktif, CF: 80%).');
    }
    if (isLoyalitasRendah) {
      const riwayatBulan = wm['riwayat_kerja_bulan']?.value || 0;
      disqualifiers.push(`Loyalitas Rendah: Riwayat masa kerja terlama sebelumnya terlalu singkat (${riwayatBulan} bulan, kurang dari batas minimal 3 bulan), menunjukkan risiko retensi rendah (Aturan H11 aktif, CF: 90%).`);
    }

    if (disqualifiers.length > 0) {
      rationales.push(`Kandidat ditolak karena memiliki ${disqualifiers.length} faktor diskualifikasi/risiko kritis yang melanggar standar minimal operasional outlet.`);
    } else if (isLulusAdm && isLulusWawancara) {
      rationales.push('Kandidat ditolak karena akumulasi fakta dan kriteria kelayakan tidak mencukupi untuk memicu aturan penerimaan langsung (H8/H13), pelatihan (H14), maupun evaluasi lanjut (H15).');
    }
  }

  // 4. Identify operational warning flags (Stage 2 related or logistics)
  const isShiftMalam = wm['shift_malam']?.value === 'ya';
  const hasNoVehicle = wm['memiliki_kendaraan']?.value === 'tidak';
  const isJarakJauh = wm['jarak_rumah_km']?.value != null && Number(wm['jarak_rumah_km']?.value) > 10;
  const isAksesSulit = wm['akses_transportasi']?.value === 'sulit';

  if (isShiftMalam && hasNoVehicle) {
    warnings.push('Risiko kendala transportasi pada shift malam karena kandidat bersedia shift malam namun tidak memiliki kendaraan pribadi (Aturan H9 aktif).');
  }
  if (isJarakJauh && isAksesSulit) {
    warnings.push('Potensi kendala kehadiran/absensi tinggi disebabkan jarak rumah yang jauh (> 10 km) dan akses transportasi umum yang sulit (Aturan P7 aktif).');
  }

  return {
    statusLabel,
    statusColor,
    summaryText,
    criteria,
    rationales,
    disqualifiers,
    warnings,
  };
}
