// Basis Pengetahuan Final - Divalidasi oleh Dr. Rohimat Nurhasan, S.E., M.Si
// Sumber: rules_expert.md

export type Operator = '==' | '!=' | '>' | '<' | '>=' | '<=';
export type Stage = 1 | 2;

export interface Condition {
  attribute: string;
  operator: Operator;
  value: string | number | boolean;
}

export interface Conclusion {
  attribute: string;
  value: string | number | boolean;
}

export interface Rule {
  rule_id: string;
  stage: Stage;
  description: string;
  conditions: Condition[];
  conclusion: Conclusion;
  cf: number;
}

export const RULES: Rule[] = [
  // ─── TAHAP 1: Penilaian Kelayakan (H1 - H15) ───────────────────────────────
  {
    rule_id: 'H1',
    stage: 1,
    description: 'Indikator hospitality dari sikap awal kandidat',
    conditions: [{ attribute: 'sikap_ramah', operator: '==', value: 'baik' }],
    conclusion: { attribute: 'hospitality', value: 'baik' },
    cf: 0.9,
  },
  {
    rule_id: 'H2',
    stage: 1,
    description: 'Indikasi disiplin awal dari ketepatan hadir interview',
    conditions: [{ attribute: 'hadir_interview', operator: '==', value: 'tepat_waktu' }],
    conclusion: { attribute: 'indikasi_disiplin_awal', value: 'baik' },
    cf: 0.6,
  },
  {
    rule_id: 'H3',
    stage: 1,
    description: 'Pengalaman FNB > 2 tahun mengindikasikan adaptasi kerja lebih cepat',
    conditions: [{ attribute: 'pengalaman_fnb_tahun', operator: '>', value: 2 }],
    conclusion: { attribute: 'adaptasi_kerja', value: 'lebih_cepat' },
    cf: 0.7,
  },
  {
    rule_id: 'H4',
    stage: 1,
    description: 'Shift malam dengan faktor keamanan memerlukan pertimbangan khusus',
    conditions: [
      { attribute: 'shift_malam', operator: '==', value: 'ya' },
      { attribute: 'faktor_keamanan', operator: '==', value: 'perlu' },
    ],
    conclusion: { attribute: 'pertimbangan_khusus', value: 'ya' },
    cf: 0.8,
  },
  {
    rule_id: 'H5',
    stage: 1,
    description: 'Mood tidak stabil mengindikasikan konsistensi rendah',
    conditions: [{ attribute: 'mood', operator: '==', value: 'tidak_stabil' }],
    conclusion: { attribute: 'konsistensi', value: 'rendah' },
    cf: 0.8,
  },
  {
    rule_id: 'H6',
    stage: 1,
    description: 'Lulus administrasi → lanjut ke tahap wawancara',
    conditions: [{ attribute: 'lulus_administrasi', operator: '==', value: 'ya' }],
    conclusion: { attribute: 'lanjut_wawancara', value: 'ya' },
    cf: 0.9,
  },
  {
    rule_id: 'H7',
    stage: 1,
    description: 'Lulus wawancara → lanjut ke tahap trial',
    conditions: [{ attribute: 'lulus_wawancara', operator: '==', value: 'ya' }],
    conclusion: { attribute: 'lanjut_trial', value: 'ya' },
    cf: 0.9,
  },
  {
    rule_id: 'H8',
    stage: 1,
    description: 'Hasil trial baik → kandidat diterima',
    conditions: [{ attribute: 'hasil_trial', operator: '==', value: 'baik' }],
    conclusion: { attribute: 'diterima', value: 'ya' },
    cf: 0.9,
  },
  {
    rule_id: 'H9',
    stage: 1,
    description: 'Shift malam tanpa kendaraan meningkatkan risiko kendala',
    conditions: [
      { attribute: 'shift_malam', operator: '==', value: 'ya' },
      { attribute: 'memiliki_kendaraan', operator: '==', value: 'tidak' },
    ],
    conclusion: { attribute: 'risiko_kendala', value: 'tinggi' },
    cf: 0.8,
  },
  {
    rule_id: 'H10',
    stage: 1,
    description: 'Disiplin tinggi + hospitality baik → kandidat potensial',
    conditions: [
      { attribute: 'disiplin', operator: '==', value: 'tinggi' },
      { attribute: 'hospitality', operator: '==', value: 'baik' },
    ],
    conclusion: { attribute: 'kandidat_potensial', value: 'ya' },
    cf: 0.9,
  },
  {
    rule_id: 'H11',
    stage: 1,
    description: 'Riwayat kerja < 3 bulan mengindikasikan loyalitas rendah',
    conditions: [{ attribute: 'riwayat_kerja_bulan', operator: '<', value: 3 }],
    conclusion: { attribute: 'loyalitas', value: 'rendah' },
    cf: 0.9,
  },
  {
    rule_id: 'H12',
    stage: 1,
    description: 'Panik saat tekanan mengindikasikan kecocokan rendah',
    conditions: [{ attribute: 'panik_saat_tekanan', operator: '==', value: 'ya' }],
    conclusion: { attribute: 'kecocokan', value: 'rendah' },
    cf: 0.95,
  },
  {
    rule_id: 'H13',
    stage: 1,
    description: 'Kandidat potensial + loyalitas baik → diterima',
    conditions: [
      { attribute: 'kandidat_potensial', operator: '==', value: 'ya' },
      { attribute: 'loyalitas', operator: '==', value: 'baik' },
    ],
    conclusion: { attribute: 'diterima', value: 'ya' },
    cf: 0.9,
  },
  {
    rule_id: 'H14',
    stage: 1,
    description: 'Disiplin tinggi + pengalaman rendah → perlu pelatihan (Penanganan Hole 1)',
    conditions: [
      { attribute: 'disiplin', operator: '==', value: 'tinggi' },
      { attribute: 'pengalaman_fnb_tahun', operator: '<=', value: 1 },
    ],
    conclusion: { attribute: 'perlu_pelatihan', value: 'ya' },
    cf: 0.8,
  },
  {
    rule_id: 'H15',
    stage: 1,
    description: 'Kemampuan individu baik + teamwork rendah → evaluasi lanjut (Penanganan Hole 2)',
    conditions: [
      { attribute: 'kemampuan_individu', operator: '==', value: 'baik' },
      { attribute: 'teamwork', operator: '==', value: 'rendah' },
    ],
    conclusion: { attribute: 'evaluasi_lanjut', value: 'ya' },
    cf: 0.7,
  },

  // ─── TAHAP 2: Penentuan Penempatan Kerja (P1 - P9) ─────────────────────────
  {
    rule_id: 'P1',
    stage: 2,
    description: 'Hospitality baik → penempatan Frontliner',
    conditions: [{ attribute: 'hospitality', operator: '==', value: 'baik' }],
    conclusion: { attribute: 'penempatan', value: 'frontliner' },
    cf: 0.9,
  },
  {
    rule_id: 'P2',
    stage: 2,
    description: 'Kemampuan masak baik → penempatan Kitchen',
    conditions: [{ attribute: 'kemampuan_masak', operator: '==', value: 'baik' }],
    conclusion: { attribute: 'penempatan', value: 'kitchen' },
    cf: 0.85,
  },
  {
    rule_id: 'P3',
    stage: 2,
    description: 'Fisik kuat → penempatan Operasional',
    conditions: [{ attribute: 'fisik_kuat', operator: '==', value: 'ya' }],
    conclusion: { attribute: 'penempatan', value: 'operasional' },
    cf: 0.8,
  },
  {
    rule_id: 'P4',
    stage: 2,
    description: 'Shift malam memerlukan pertimbangan khusus (penyaring workflow)',
    conditions: [{ attribute: 'shift_malam', operator: '==', value: 'ya' }],
    conclusion: { attribute: 'pertimbangan_khusus_p2', value: 'ya' },
    cf: 0.8,
  },
  {
    rule_id: 'P5',
    stage: 2,
    description: 'Pengalaman FNB tinggi → prioritas penempatan tinggi',
    conditions: [{ attribute: 'pengalaman_fnb_tahun', operator: '>', value: 2 }],
    conclusion: { attribute: 'prioritas_penempatan', value: 'tinggi' },
    cf: 0.8,
  },
  {
    rule_id: 'P6',
    stage: 2,
    description: 'Mobilitas malam terbatas → penempatan shift pagi/siang',
    conditions: [{ attribute: 'mobilitas_malam', operator: '==', value: 'terbatas' }],
    conclusion: { attribute: 'penempatan_shift', value: 'pagi_siang' },
    cf: 0.9,
  },
  {
    rule_id: 'P7',
    stage: 2,
    description: 'Jarak > 10km + akses transportasi sulit → potensi kendala kehadiran tinggi',
    conditions: [
      { attribute: 'jarak_rumah_km', operator: '>', value: 10 },
      { attribute: 'akses_transportasi', operator: '==', value: 'sulit' },
    ],
    conclusion: { attribute: 'potensi_kendala_kehadiran', value: 'tinggi' },
    cf: 0.5,
  },
  {
    rule_id: 'P8',
    stage: 2,
    description: 'Teamwork baik → prioritas diterima',
    conditions: [{ attribute: 'teamwork', operator: '==', value: 'baik' }],
    conclusion: { attribute: 'prioritas_diterima', value: 'ya' },
    cf: 0.8,
  },
  {
    rule_id: 'P9',
    stage: 2,
    description: 'Tidak memenuhi posisi spesifik → General Staff (Penanganan Hole 3)',
    conditions: [{ attribute: 'tidak_memenuhi_posisi', operator: '==', value: 'ya' }],
    conclusion: { attribute: 'penempatan', value: 'general_staff' },
    cf: 0.6,
  },
];

export const getRulesByStage = (stage: Stage): Rule[] =>
  RULES.filter((r) => r.stage === stage);
