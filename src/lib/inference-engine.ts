import type { Condition, Rule } from './mock-rules';
import { RULES } from './mock-rules';

export interface CandidateFacts {
  // ── Data Demografi & Teknis ──────────────────────────────────
  nama: string;
  jarak_rumah_km: number;
  memiliki_kendaraan: 'ya' | 'tidak';
  akses_transportasi: 'mudah' | 'sedang' | 'sulit';
  mobilitas_malam: 'bebas' | 'terbatas';
  shift_malam: 'ya' | 'tidak';
  faktor_keamanan: 'perlu' | 'tidak';
  kemampuan_masak: 'baik' | 'cukup' | 'tidak';
  fisik_kuat: 'ya' | 'tidak';
  pengalaman_fnb_tahun: number;
  riwayat_kerja_bulan: number;
  lulus_administrasi: 'ya' | 'tidak';

  // ── Observasi Wawancara ──────────────────────────────────────
  sikap_ramah: 'baik' | 'cukup' | 'kurang';
  hadir_interview: 'tepat_waktu' | 'terlambat';
  disiplin: 'tinggi' | 'sedang' | 'rendah';
  teamwork: 'baik' | 'cukup' | 'rendah';
  panik_saat_tekanan: 'ya' | 'tidak';
  mood: 'stabil' | 'tidak_stabil';
  kemampuan_individu: 'baik' | 'cukup' | 'rendah';
  lulus_wawancara: 'ya' | 'tidak';
  hasil_trial: 'baik' | 'cukup' | 'buruk';
}

export interface InferenceStep {
  rule_id: string;
  description: string;
  stage: 1 | 2;
  matched_conditions: string[];
  conclusion_attribute: string;
  conclusion_value: string | number | boolean;
  cf: number;
  combined_cf?: number;
}

export type StatusKelayakan = 'diterima' | 'evaluasi_lanjut' | 'perlu_pelatihan' | 'ditolak';
export type Penempatan = 'frontliner' | 'kitchen' | 'operasional' | 'general_staff' | 'tidak_ada';

export interface PlacementScore {
  posisi: Penempatan;
  cf: number;
  rules_triggered: string[];
}

export interface InferenceResult {
  candidate_name: string;
  status: StatusKelayakan;
  status_cf: number;
  placements: PlacementScore[];
  best_placement: PlacementScore | null;
  inference_log: InferenceStep[];
  catatan: string[];
  working_memory: Record<string, { value: string | number | boolean; cf: number }>;
}

// ─── CF Combine Formula ─────────────────────────────────────────────────────
// CF_combine = CF1 + CF2 × (1 - CF1)
function combineCF(cf1: number, cf2: number): number {
  return cf1 + cf2 * (1 - cf1);
}

// ─── Evaluate a single condition against working memory ────────────────────
function evaluateCondition(
  condition: Condition,
  facts: Record<string, number | string | boolean>
): boolean {
  const factValue = facts[condition.attribute];
  if (factValue === undefined) return false;

  switch (condition.operator) {
    case '==':
      return factValue === condition.value;
    case '!=':
      return factValue !== condition.value;
    case '>':
      return Number(factValue) > Number(condition.value);
    case '<':
      return Number(factValue) < Number(condition.value);
    case '>=':
      return Number(factValue) >= Number(condition.value);
    case '<=':
      return Number(factValue) <= Number(condition.value);
    default:
      return false;
  }
}

// ─── Main Inference Engine ─────────────────────────────────────────────────
export function runInference(candidate: CandidateFacts, rules: Rule[] = RULES): InferenceResult {
  // Initialize working memory from candidate facts
  const workingMemory: Record<string, { value: string | number | boolean; cf: number }> = {};
  const inferenceLog: InferenceStep[] = [];
  const catatan: string[] = [];

  // Load all candidate facts into working memory with certainty 1.0
  Object.entries(candidate).forEach(([key, value]) => {
    if (key !== 'nama') {
      workingMemory[key] = { value: value as string | number | boolean, cf: 1.0 };
    }
  });

  // ── Forward Chaining Loop ───────────────────────────────────────────────
  let changed = true;
  const firedRules = new Set<string>();

  while (changed) {
    changed = false;

    for (const rule of rules) {
      if (firedRules.has(rule.rule_id)) continue;

      // Evaluate all conditions
      const allMet = rule.conditions.every((cond) =>
        evaluateCondition(cond, Object.fromEntries(
          Object.entries(workingMemory).map(([k, v]) => [k, v.value])
        ))
      );

      if (allMet) {
        firedRules.add(rule.rule_id);
        changed = true;

        const conditionDescriptions = rule.conditions.map(
          (c) => `${c.attribute} ${c.operator} ${c.value}`
        );

        const conclusionAttr = rule.conclusion.attribute;
        const conclusionVal = rule.conclusion.value;

        // Calculate CF for this conclusion
        let finalCF = rule.cf;
        let combinedCF: number | undefined;

        if (workingMemory[conclusionAttr] !== undefined) {
          // Combine with existing CF
          const existingCF = workingMemory[conclusionAttr].cf;
          combinedCF = combineCF(existingCF, rule.cf);
          finalCF = combinedCF;
        }

        workingMemory[conclusionAttr] = { value: conclusionVal, cf: finalCF };

        inferenceLog.push({
          rule_id: rule.rule_id,
          description: rule.description,
          stage: rule.stage,
          matched_conditions: conditionDescriptions,
          conclusion_attribute: conclusionAttr,
          conclusion_value: conclusionVal,
          cf: rule.cf,
          combined_cf: combinedCF,
        });
      }
    }
  }

  // ── Determine Status Kelayakan ──────────────────────────────────────────
  let status: StatusKelayakan = 'ditolak';
  let statusCF = 0;

  // Check for absolute blockers (Disqualification) first
  if (workingMemory['lulus_administrasi']?.value === 'tidak' || workingMemory['lulus_wawancara']?.value === 'tidak') {
    status = 'ditolak';
    statusCF = 1.0;
    
    if (workingMemory['lulus_administrasi']?.value === 'tidak') {
      catatan.push('❌ Kandidat tidak memenuhi kualifikasi kelayakan seleksi administrasi awal.');
    }
    if (workingMemory['lulus_wawancara']?.value === 'tidak') {
      catatan.push('❌ Kandidat tidak dinyatakan lulus pada sesi evaluasi wawancara.');
    }
  } else if (workingMemory['diterima']?.value === 'ya') {
    status = 'diterima';
    statusCF = workingMemory['diterima'].cf;
  } else if (workingMemory['evaluasi_lanjut']?.value === 'ya') {
    status = 'evaluasi_lanjut';
    statusCF = workingMemory['evaluasi_lanjut'].cf;
  } else if (workingMemory['perlu_pelatihan']?.value === 'ya') {
    status = 'perlu_pelatihan';
    statusCF = workingMemory['perlu_pelatihan'].cf;
  } else {
    // Check if any critical disqualifiers exist
    let combinedDisqualificationCF = 0;
    let hasDisqualifier = false;

    if (workingMemory['kecocokan']?.value === 'rendah') {
      const cf = workingMemory['kecocokan'].cf;
      combinedDisqualificationCF = hasDisqualifier ? combineCF(combinedDisqualificationCF, cf) : cf;
      hasDisqualifier = true;
    }
    if (workingMemory['konsistensi']?.value === 'rendah') {
      const cf = workingMemory['konsistensi'].cf;
      combinedDisqualificationCF = hasDisqualifier ? combineCF(combinedDisqualificationCF, cf) : cf;
      hasDisqualifier = true;
    }
    if (workingMemory['loyalitas']?.value === 'rendah') {
      const cf = workingMemory['loyalitas'].cf;
      combinedDisqualificationCF = hasDisqualifier ? combineCF(combinedDisqualificationCF, cf) : cf;
      hasDisqualifier = true;
    }

    if (workingMemory['kecocokan']?.value === 'rendah') {
      catatan.push('⚠️ Kandidat menunjukkan respons panik saat tekanan tinggi (H12 aktif)');
    }
    if (workingMemory['konsistensi']?.value === 'rendah') {
      catatan.push('⚠️ Mood tidak stabil terdeteksi — konsistensi kerja diragukan (H5 aktif)');
    }

    statusCF = hasDisqualifier ? combinedDisqualificationCF : 0.3;
  }

  // ── Determine Placements ────────────────────────────────────────────────
  const placements: PlacementScore[] = [];
  const placementRules = rules.filter(
    (r) => r.stage === 2 && r.conclusion.attribute === 'penempatan'
  );

  const placementMap: Record<string, { cf: number; rules: string[] }> = {};

  for (const rule of placementRules) {
    if (!firedRules.has(rule.rule_id)) continue;
    const posisi = rule.conclusion.value as Penempatan;
    if (!placementMap[posisi]) {
      placementMap[posisi] = { cf: rule.cf, rules: [rule.rule_id] };
    } else {
      placementMap[posisi].cf = combineCF(placementMap[posisi].cf, rule.cf);
      placementMap[posisi].rules.push(rule.rule_id);
    }
  }

  for (const [posisi, data] of Object.entries(placementMap)) {
    placements.push({
      posisi: posisi as Penempatan,
      cf: data.cf,
      rules_triggered: data.rules,
    });
  }

  // If no specific placement, default to general_staff
  if (placements.length === 0 && status !== 'ditolak') {
    const p9Fired = firedRules.has('P9');
    placements.push({
      posisi: 'general_staff',
      cf: p9Fired ? (workingMemory['penempatan']?.cf ?? 0.6) : 0.4,
      rules_triggered: p9Fired ? ['P9'] : [],
    });
    catatan.push('📋 Kandidat ditempatkan sebagai General Staff karena tidak memenuhi kriteria posisi spesifik');
  }

  // Sort by CF descending
  placements.sort((a, b) => b.cf - a.cf);
  const bestPlacement = placements[0] ?? null;

  // ── Additional Notes ───────────────────────────────────────────────────
  if (workingMemory['risiko_kendala']?.value === 'tinggi') {
    catatan.push('🚗 Risiko kendala kehadiran shift malam — tidak memiliki kendaraan (H9 aktif)');
  }
  if (workingMemory['potensi_kendala_kehadiran']?.value === 'tinggi') {
    catatan.push('📍 Jarak rumah jauh + akses transportasi sulit — potensi absensi (P7 aktif)');
  }
  if (workingMemory['loyalitas']?.value === 'rendah') {
    catatan.push('📊 Riwayat kerja singkat — indikasi loyalitas rendah (H11 aktif)');
  }
  if (workingMemory['prioritas_penempatan']?.value === 'tinggi') {
    catatan.push('⭐ Pengalaman FNB tinggi — kandidat mendapat prioritas penempatan (P5 aktif)');
  }

  return {
    candidate_name: candidate.nama,
    status,
    status_cf: statusCF,
    placements,
    best_placement: bestPlacement,
    inference_log: inferenceLog,
    catatan,
    working_memory: workingMemory,
  };
}
