import { Operator, OperatorGrade, GarmentProductType, GARMENT_PRODUCTS_CONFIG } from "../types";

export interface GradingMetrics {
  grade: OperatorGrade;
  label: string;
  badgeClass: string;
  colorHex: string;
  description: string;
  efficiencyRange?: string;
  defectRange?: string;
  skillReq?: string;
  productReq: string;
  rolePlacement: string;
  masteredProducts?: GarmentProductType[];
  masteredCount?: number;
  highComplexityCount?: number;
  reason?: string;
}

export interface GradingParameterGuide {
  grade: OperatorGrade;
  title: string;
  label: string;
  color: string;
  badgeClass: string;
  productMatrixCriteria: string;
  efficiencyCriteria: string;
  defectCriteria: string;
  skillMatrixCriteria: string;
  roleAndPlacement: string;
  actionGuidance: string;
}

export const GRADING_PARAMETERS_GUIDE: GradingParameterGuide[] = [
  {
    grade: "A",
    title: "Grade A — Operator Ahli Multi-Produk (Tailoring & High Complexity)",
    label: "Grade A (Ahli)",
    color: "#10b981",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
    productMatrixCriteria:
      "Menguasai ≥ 6 jenis produk DAN minimal 1 produk kesulitan tinggi (Jas, Blazer, Wearpack, atau Jaket), ATAU menguasai ≥ 8 dari 10 jenis produk secara mandiri.",
    efficiencyCriteria: "Efisiensi ≥ 90% (Mampu melampaui target per jam secara konsisten)",
    defectCriteria: "Defect Rate ≤ 1.5% (Kualitas jahitan sangat rapi, zero-defect standard)",
    skillMatrixCriteria: "Menguasai ≥ 3 jenis mesin berbeda (skor rating ≥ 4 pada SN, DN, OL, Overdeck)",
    roleAndPlacement:
      "Ditempatkan pada Stasiun Kritis / Bottleneck utama, proses dengan SMV tinggi, dan sebagai Trainer / Floater Multi-Produk",
    actionGuidance: "Diberikan insentif keahlian khusus dan diprioritaskan menjadi pelatih operator baru.",
  },
  {
    grade: "B",
    title: "Grade B — Operator Terampil Multi-Produk Standar",
    label: "Grade B (Terampil)",
    color: "#3b82f6",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
    productMatrixCriteria:
      "Menguasai 4 - 7 jenis produk (Kemeja, Celana, Blouse, Rok, Vest, Toga), ATAU 1 produk tinggi (Jas/Blazer/Wearpack/Jaket) + minimal 2 produk dasar-menengah.",
    efficiencyCriteria: "Efisiensi 80% - 89% (Memenuhi ritme kerja dan target output line)",
    defectCriteria: "Defect Rate 1.6% - 3.0% (Kualitas jahitan stabil dalam toleransi QC buyer)",
    skillMatrixCriteria: "Menguasai 1 - 2 jenis mesin dengan skor rating ≥ 3 (Mampu standar mandiri)",
    roleAndPlacement: "Ditempatkan pada stasiun kerja perakitan utama reguler bervolume stabil",
    actionGuidance: "Diberi pelatihan silang (cross-training) produk kompleks untuk promosi ke Grade A.",
  },
  {
    grade: "C",
    title: "Grade C — Operator Menengah (Produk Dasar - Menengah)",
    label: "Grade C (Menengah)",
    color: "#f59e0b",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
    productMatrixCriteria:
      "Menguasai 2 - 3 jenis produk dasar (misal: Kemeja & Celana, atau Blouse & Rok). Fleksibilitas ganti style masih terbatas.",
    efficiencyCriteria: "Efisiensi 65% - 79% (Sering terjadi fluktuasi output antar jam)",
    defectCriteria: "Defect Rate 3.1% - 5.0% (Memerlukan beberapa kali perbaikan jahitan / rework)",
    skillMatrixCriteria: "Hanya menguasai 1 jenis mesin dasar (skor rating 2 - 3)",
    roleAndPlacement: "Ditempatkan pada proses jahitan lurus, non-kritis (side seam, hemming, dsb.)",
    actionGuidance: "Memerlukan monitoring intensif oleh Line Supervisor dan bimbingan operator Grade A.",
  },
  {
    grade: "D",
    title: "Grade D — Operator Pemula / Produk Tunggal (Butuh Pembinaan)",
    label: "Grade D (Pembinaan)",
    color: "#ef4444",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    productMatrixCriteria:
      "Hanya menguasai ≤ 1 jenis produk (belum mandiri pada variasi produk garmen lain). Masih dalam tahap masa adaptasi / training.",
    efficiencyCriteria: "Efisiensi < 65% (Jauh di bawah target standar hourly)",
    defectCriteria: "Defect Rate > 5.0% (Tingkat cacat tinggi, risiko bottleneck parah)",
    skillMatrixCriteria: "Keahlian mesin terbatas (skor rating 1 - 2), masih dalam masa adaptasi",
    roleAndPlacement: "Ditempatkan pada operasi awal non-mesin (trimming/marking) atau tandem dengan Grade A",
    actionGuidance: "Wajib mengikuti re-training di Training Center Sewing sebelum dipasang di produk berisiko.",
  },
];

const HIGH_COMPLEXITY_PRODUCTS: GarmentProductType[] = ["Jas", "Blazer", "Wearpack", "Jaket"];

/**
 * Calculate Operator Grade based on manufacturing capability across 10 Garment Products:
 * (Kemeja, Jas, Celana, Blouse, Rok, Blazer, Vest, Wearpack, Toga, Jaket)
 */
export function calculateProductBasedGrading(
  productCapabilities?: Record<GarmentProductType, boolean | number>
): GradingMetrics {
  if (!productCapabilities || Object.keys(productCapabilities).length === 0) {
    return {
      grade: "D",
      label: "Grade D (Belum Ada Data Produk)",
      badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
      colorHex: "#ef4444",
      description: "Belum terdata kemampuan pada 10 produk standar garmen",
      productReq: "≤ 1 Jenis Produk",
      rolePlacement: "Training Center / Tandem",
      masteredProducts: [],
      masteredCount: 0,
      highComplexityCount: 0,
      reason: "Hanya menguasai ≤ 1 jenis produk.",
    };
  }

  // Filter products mastered: boolean true or numeric rating >= 3
  const masteredProducts: GarmentProductType[] = (
    Object.keys(productCapabilities) as GarmentProductType[]
  ).filter((p) => {
    const val = productCapabilities[p];
    if (typeof val === "boolean") return val;
    if (typeof val === "number") return val >= 3;
    return false;
  });

  const masteredCount = masteredProducts.length;
  const highComplexityMastered = masteredProducts.filter((p) =>
    HIGH_COMPLEXITY_PRODUCTS.includes(p)
  );
  const highComplexityCount = highComplexityMastered.length;

  // Grade A criteria:
  // (>= 6 products AND >= 1 High Complexity) OR (>= 8 products of any kind)
  if ((masteredCount >= 6 && highComplexityCount >= 1) || masteredCount >= 8) {
    return {
      grade: "A",
      label: "Grade A (Ahli Multi-Produk)",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      colorHex: "#10b981",
      description: `Menguasai ${masteredCount}/10 produk garmen (${highComplexityMastered.join(", ")})`,
      efficiencyRange: "≥ 90%",
      defectRange: "≤ 1.5%",
      skillReq: "Tinggi & Multi-Machine",
      productReq: "≥ 6 Produk + 1 Produk Tinggi",
      rolePlacement: "Stasiun Kritis / Bottleneck & Floater All-Line",
      masteredProducts,
      masteredCount,
      highComplexityCount,
      reason: `Menguasai ${masteredCount} jenis produk termasuk produk tailoring berbobot tinggi (${highComplexityMastered.join(", ") || "Universal"}).`,
    };
  }

  // Grade B criteria:
  // (4 - 7 products) OR (highComplexityCount >= 1 and masteredCount >= 3)
  if (masteredCount >= 4 || (highComplexityCount >= 1 && masteredCount >= 3)) {
    return {
      grade: "B",
      label: "Grade B (Terampil Multi-Produk)",
      badgeClass: "bg-blue-100 text-blue-800 border-blue-300",
      colorHex: "#3b82f6",
      description: `Menguasai ${masteredCount}/10 produk (${masteredProducts.join(", ")})`,
      efficiencyRange: "80% - 89%",
      defectRange: "1.6% - 3.0%",
      skillReq: "Standard Unggul",
      productReq: "4 - 7 Jenis Produk",
      rolePlacement: "Stasiun Perakitan Utama Reguler",
      masteredProducts,
      masteredCount,
      highComplexityCount,
      reason: `Menguasai ${masteredCount} jenis produk standar garmen secara mandiri.`,
    };
  }

  // Grade C criteria:
  // 2 - 3 products
  if (masteredCount >= 2) {
    return {
      grade: "C",
      label: "Grade C (Menengah Produk Dasar)",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      colorHex: "#f59e0b",
      description: `Menguasai ${masteredCount}/10 produk (${masteredProducts.join(", ")})`,
      efficiencyRange: "65% - 79%",
      defectRange: "3.1% - 5.0%",
      skillReq: "1-2 Mesin Dasar",
      productReq: "2 - 3 Jenis Produk",
      rolePlacement: "Stasiun Non-Kritis / Jahit Lurus",
      masteredProducts,
      masteredCount,
      highComplexityCount,
      reason: `Menguasai ${masteredCount} jenis produk dasar (${masteredProducts.join(", ")}). Perlu pendampingan untuk ganti style.`,
    };
  }

  // Grade D criteria:
  // <= 1 product
  return {
    grade: "D",
    label: "Grade D (Pemula / Produk Tunggal)",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-300",
    colorHex: "#ef4444",
    description:
      masteredCount === 1
        ? `Hanya menguasai 1 produk (${masteredProducts[0]})`
        : "Belum menguasai produk mandiri",
    efficiencyRange: "< 65%",
    defectRange: "> 5.0%",
    skillReq: "Perlu Training",
    productReq: "≤ 1 Jenis Produk",
    rolePlacement: "Tandem / Operasi Awal Non-Mesin",
    masteredProducts,
    masteredCount,
    highComplexityCount,
    reason:
      masteredCount === 1
        ? `Hanya menguasai 1 produk (${masteredProducts[0]}). Memerlukan pembinaan untuk fleksibilitas ganti order.`
        : "Belum teruji mandiri pada pembuatan produk garmen.",
  };
}

export function calculateOperatorGrading(
  efficiency: number,
  defectRate: number,
  productCapabilities?: Record<GarmentProductType, boolean | number>
): GradingMetrics {
  // If product capabilities exist, prioritize product capability as the primary IE determinant
  if (productCapabilities && Object.keys(productCapabilities).length > 0) {
    return calculateProductBasedGrading(productCapabilities);
  }

  // Fallback to efficiency & defect rate if no product matrix recorded
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
      productReq: "≥ 6 Produk (Jas, Blazer, dsb.)",
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
      productReq: "4 - 7 Jenis Produk",
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
      productReq: "2 - 3 Jenis Produk",
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
    productReq: "≤ 1 Jenis Produk",
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


