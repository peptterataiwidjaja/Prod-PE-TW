import { Operator, OperatorGrade } from "../types";

export interface GradingMetrics {
  grade: OperatorGrade;
  label: string;
  badgeClass: string;
  colorHex: string;
  description: string;
  efficiencyRange: string;
  defectRange: string;
  skillReq: string;
  rolePlacement: string;
}

export interface GradingParameterGuide {
  grade: OperatorGrade;
  title: string;
  label: string;
  color: string;
  badgeClass: string;
  efficiencyCriteria: string;
  defectCriteria: string;
  skillMatrixCriteria: string;
  roleAndPlacement: string;
  actionGuidance: string;
}

export const GRADING_PARAMETERS_GUIDE: GradingParameterGuide[] = [
  {
    grade: "A",
    title: "Grade A — Operator Ahli / Multi-Skill Master",
    label: "Grade A (Ahli)",
    color: "#10b981",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    efficiencyCriteria: "Efisiensi ≥ 90% (Mampu melampaui target per jam secara konsisten)",
    defectCriteria: "Defect Rate ≤ 1.5% (Kualitas jahitan sangat rapi, zero-defect standard)",
    skillMatrixCriteria: "Menguasai ≥ 3 jenis mesin berbeda (skor rating ≥ 4 pada SN, DN, OL, Overdeck)",
    roleAndPlacement: "Ditempatkan pada Stasiun Kritis / Bottleneck utama, proses dengan SMV tinggi, dan sebagai Trainer/Floater",
    actionGuidance: "Diberikan insentif keahlian khusus dan diprioritaskan menjadi pelatih operator baru.",
  },
  {
    grade: "B",
    title: "Grade B — Operator Terampil / Standar Unggul",
    label: "Grade B (Terampil)",
    color: "#3b82f6",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    efficiencyCriteria: "Efisiensi 80% - 89% (Memenuhi ritme kerja dan target output line)",
    defectCriteria: "Defect Rate 1.6% - 3.0% (Kualitas jahitan stabil dalam toleransi QC buyer)",
    skillMatrixCriteria: "Menguasai 1 - 2 jenis mesin dengan skor rating ≥ 3 (Mampu standar mandiri)",
    roleAndPlacement: "Ditempatkan pada stasiun kerja perakitan utama reguler bervolume stabil",
    actionGuidance: "Diberi pelatihan silang (cross-training) mesin sekunder untuk promosi ke Grade A.",
  },
  {
    grade: "C",
    title: "Grade C — Operator Menengah / Perlu Pendampingan",
    label: "Grade C (Menengah)",
    color: "#f59e0b",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    efficiencyCriteria: "Efisiensi 65% - 79% (Sering terjadi fluktuasi output antar jam)",
    defectCriteria: "Defect Rate 3.1% - 5.0% (Memerlukan beberapa kali perbaikan jahitan / rework)",
    skillMatrixCriteria: "Hanya menguasai 1 jenis mesin dasar (skor rating 2 - 3)",
    roleAndPlacement: "Ditempatkan pada proses jahitan lurus, non-kritis (side seam, hemming, dsb.)",
    actionGuidance: "Memerlukan monitoring intensif oleh Line Supervisor dan bimbingan operator Grade A.",
  },
  {
    grade: "D",
    title: "Grade D — Operator Baru / Butuh Pembinaan Khusus",
    label: "Grade D (Pembinaan)",
    color: "#ef4444",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    efficiencyCriteria: "Efisiensi < 65% (Jauh di bawah target standar hourly)",
    defectCriteria: "Defect Rate > 5.0% (Tingkat cacat tinggi, risiko bottleneck parah)",
    skillMatrixCriteria: "Keahlian mesin terbatas (skor rating 1 - 2), masih dalam masa adaptasi",
    roleAndPlacement: "Ditempatkan pada operasi awal non-mesin (trimming/marking) atau tandem dengan Grade A",
    actionGuidance: "Wajib mengikuti re-training di Training Center Sewing sebelum dipasang di proses berisiko.",
  },
];

export function calculateOperatorGrading(efficiency: number, defectRate: number): GradingMetrics {
  if (efficiency >= 90 && defectRate <= 1.5) {
    return {
      grade: "A",
      label: "Grade A (Unggul / Ahli)",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      colorHex: "#10b981",
      description: "Produktivitas tinggi & kualitas jahitan presisi standar buyer",
      efficiencyRange: "≥ 90%",
      defectRange: "≤ 1.5%",
      skillReq: "≥ 3 Mesin (Skor ≥ 4)",
      rolePlacement: "Stasiun Kritis / Bottleneck & Floater",
    };
  }

  if (efficiency >= 80 && defectRate <= 3.0) {
    return {
      grade: "B",
      label: "Grade B (Standar Baik)",
      badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
      colorHex: "#3b82f6",
      description: "Mencapai ritme kerja rata-rata line, defect terkendali",
      efficiencyRange: "80% - 89%",
      defectRange: "1.6% - 3.0%",
      skillReq: "1 - 2 Mesin (Skor ≥ 3)",
      rolePlacement: "Stasiun Operasi Reguler",
    };
  }

  if (efficiency >= 65 && defectRate <= 5.0) {
    return {
      grade: "C",
      label: "Grade C (Perlu Perhatian)",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      colorHex: "#f59e0b",
      description: "Output di bawah target atau tingkat rework fluktuatif",
      efficiencyRange: "65% - 79%",
      defectRange: "3.1% - 5.0%",
      skillReq: "1 Mesin Dasar (Skor 2-3)",
      rolePlacement: "Stasiun Non-Kritis / Jahit Lurus",
    };
  }

  return {
    grade: "D",
    label: "Grade D (Perlu Pelatihan / Pembinaan)",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    colorHex: "#ef4444",
    description: "Kritis bottleneck, efisiensi rendah atau tingkat defect tinggi",
    efficiencyRange: "< 65%",
    defectRange: "> 5.0%",
    skillReq: "Skor < 2 (Perlu Training)",
    rolePlacement: "Tandem / Operasi Awal Non-Mesin",
  };
}

export function getGradeBadge(grade: OperatorGrade) {
  switch (grade) {
    case "A":
      return {
        bg: "bg-emerald-500",
        text: "text-emerald-700",
        lightBg: "bg-emerald-50",
        border: "border-emerald-200",
        label: "Grade A",
      };
    case "B":
      return {
        bg: "bg-blue-500",
        text: "text-blue-700",
        lightBg: "bg-blue-50",
        border: "border-blue-200",
        label: "Grade B",
      };
    case "C":
      return {
        bg: "bg-amber-500",
        text: "text-amber-700",
        lightBg: "bg-amber-50",
        border: "border-amber-200",
        label: "Grade C",
      };
    case "D":
      return {
        bg: "bg-rose-500",
        text: "text-rose-700",
        lightBg: "bg-rose-50",
        border: "border-rose-200",
        label: "Grade D",
      };
  }
}

