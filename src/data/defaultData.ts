import {
  ProcessItem,
  StyleMetadata,
  Operator,
  LineProductionData,
  User,
  LineNumber,
  Fishbone6M,
  FiveWhyItem,
  EngineeringRecommendation,
  GarmentProductType,
} from "../types";
import { calculateProductBasedGrading } from "../utils/grading";

export const VALID_LINES: LineNumber[] = [1, 3, 4, 5, 6, 7];

export const DEFAULT_STYLE_METADATA: StyleMetadata = {
  buyer: "SOGO EXPORT",
  style: "SOGO BLAZER SPG-01",
  workingHours: 8,
  targetPerManpowerPerDay: 10,
  lineTargetPerHour: 10,
  lineTargetPerDay: 80,
  totalSMV: 24.5,
  totalSAM: 28.18,
  allowancePercentage: 15,
  supervisor: "Edwar Permana, S.T.",
  qualityControl: "Fylaily Izmi Adhisty",
  sampleSpv: "Agus Waluyo (Sample SPV)",
  rndHead: "Bambang Sudarsono (Head R&D)",
  sewingDate: new Date().toISOString().split("T")[0],
  sewingDays: "Senin - Sabtu (Hari Kerja 1)",
};

// 26 Standard Processes for Garment Sewing Assembly
export const STANDARD_26_PROCESSES: ProcessItem[] = [
  { no: 1, section: "SEWING", subSection: "PITA", process: "Dasar Pita & Ujung", machine: "SN", cycleTime: 45, smv: 0.75, sam: 0.86 },
  { no: 2, section: "SEWING", subSection: "PITA", process: "Corong Tali Loop", machine: "Overdeck + Cr", cycleTime: 30, smv: 0.50, sam: 0.58 },
  { no: 3, section: "SEWING", subSection: "PITA", process: "Tacking Cincin Pita", machine: "SN", cycleTime: 25, smv: 0.42, sam: 0.48 },
  { no: 4, section: "SEWING", subSection: "SHELL DEPAN", process: "Gabung Princess Atas R/L", machine: "SN", cycleTime: 55, smv: 0.92, sam: 1.05 },
  { no: 5, section: "SEWING", subSection: "SHELL DEPAN", process: "Join Badan Atas Bawah R/L", machine: "SN", cycleTime: 70, smv: 1.17, sam: 1.34 },
  { no: 6, section: "SEWING", subSection: "SHELL DEPAN", process: "Jahit List Plaket Kanan", machine: "SN", cycleTime: 40, smv: 0.67, sam: 0.77 },
  { no: 7, section: "SEWING", subSection: "SHELL DEPAN", process: "Jahit Kerung Leher Depan", machine: "SN", cycleTime: 38, smv: 0.63, sam: 0.73 },
  { no: 8, section: "SEWING", subSection: "LINING DEPAN", process: "Gabung Princess Atas Lining", machine: "SN", cycleTime: 42, smv: 0.70, sam: 0.81 },
  { no: 9, section: "SEWING", subSection: "LINING DEPAN", process: "Join Badan Lining R/L", machine: "SN", cycleTime: 65, smv: 1.08, sam: 1.25 },
  { no: 10, section: "SEWING", subSection: "LINING DEPAN", process: "Gabung Shell Lining Plaket", machine: "SN", cycleTime: 75, smv: 1.25, sam: 1.44 },
  { no: 11, section: "SEWING", subSection: "SHELL BELAKANG", process: "Jahit Tengah Belakang", machine: "SN", cycleTime: 32, smv: 0.53, sam: 0.61 },
  { no: 12, section: "SEWING", subSection: "SHELL BELAKANG", process: "Gabung Princess Belakang", machine: "SN", cycleTime: 44, smv: 0.73, sam: 0.84 },
  { no: 13, section: "SEWING", subSection: "SHELL BELAKANG", process: "Join Badan Belakang Bawah", machine: "SN", cycleTime: 58, smv: 0.97, sam: 1.11 },
  { no: 14, section: "SEWING", subSection: "LINING BELAKANG", process: "Jahit Tengah + Ploi Belakang", machine: "SN", cycleTime: 35, smv: 0.58, sam: 0.67 },
  { no: 15, section: "SEWING", subSection: "TANGAN", process: "Gabung Kontras Tangan R/L", machine: "OL 5", cycleTime: 35, smv: 0.58, sam: 0.67 },
  { no: 16, section: "SEWING", subSection: "TANGAN", process: "Join Manset Tangan R/L", machine: "OL 5", cycleTime: 42, smv: 0.70, sam: 0.81 },
  { no: 17, section: "SEWING", subSection: "TANGAN", process: "Obras Ujung Tangan R/L", machine: "OL 3", cycleTime: 30, smv: 0.50, sam: 0.58 },
  { no: 18, section: "SEWING", subSection: "KONSEL", process: "Konsel Shell Resleting", machine: "SN", cycleTime: 80, smv: 1.33, sam: 1.53 },
  { no: 19, section: "SEWING", subSection: "ASSEMBLY", process: "Join Plaket Keliling Utama", machine: "SN", cycleTime: 95, smv: 1.58, sam: 1.82 },
  { no: 20, section: "SEWING", subSection: "ASSEMBLY", process: "Stitch Plaket Keliling", machine: "SN", cycleTime: 62, smv: 1.03, sam: 1.19 },
  { no: 21, section: "SEWING", subSection: "ASSEMBLY", process: "Pasang Tangan R/L (Sleeve Set)", machine: "DURKOPP", cycleTime: 92, smv: 1.53, sam: 1.76 },
  { no: 22, section: "SEWING", subSection: "ASSEMBLY", process: "Pasang Shoulder Pad R/L", machine: "SN", cycleTime: 40, smv: 0.67, sam: 0.77 },
  { no: 23, section: "SEWING", subSection: "ASSEMBLY", process: "Dasar Armhole R/L", machine: "SN", cycleTime: 110, smv: 1.83, sam: 2.11 },
  { no: 24, section: "SEWING", subSection: "TRIMMING", process: "Pasang Kancing 7x", machine: "Button Attaching", cycleTime: 36, smv: 0.60, sam: 0.69 },
  { no: 25, section: "SEWING", subSection: "TRIMMING", process: "Lubang Kancing 6x", machine: "Button Holer", cycleTime: 38, smv: 0.63, sam: 0.73 },
  { no: 26, section: "HELPER", subSection: "HELPER", process: "Gosok Open Seam & Quality Check", machine: "Helper", cycleTime: 50, smv: 0.83, sam: 0.96 },
];

// Names database for 26 operators per line
const OPERATOR_NAMES_POOL: string[] = [
  "Siti Rahmawati", "Agus Supriatna", "Dewi Lestari", "Budi Santoso", "Wati Handayani",
  "Rini Anggraini", "Eko Prasetyo", "Sri Mulyani", "Hendra Wijaya", "Nurul Hidayah",
  "Yayan Sopiyan", "Titi Kusuma", "Fajar Pratama", "Lia Safitri", "Aris Munandar",
  "Mega Utami", "Ahmad Subagyo", "Ratna Sari", "Dedi Kusnadi", "Fitriani",
  "Wahyu Hidayat", "Endang Susanti", "Rudi Hermawan", "Ika Pratiwi", "Sunaryo", "Tri Wahyuni",
  "Bambang Sutrisno", "Neni Anggraeni", "Surya Saputra", "Yuni Astuti", "Heri Purnomo", "Ani Suryani",
  "Kiki Fatmala", "Dimas Setiawan", "Indah Permata", "Gita Gutawa", "Bagas Prakoso", "Rina Marlina",
  "Joko Susilo", "Dian Sastrowardoyo", "Lukman Hakim", "Fauzi Rahman", "Tari Handayani", "Bayu Wicaksono",
  "Ayu Tingting", "Slamet Riyadi", "Nia Ramadhani", "Panji Trihatmodjo", "Vina Panduwinata", "Hasan Basri",
  "Zainal Arifin", "Rina Nose", "Gunawan Dwi", "Cahyo Kumolo", "Dewi Perssik", "Iwan Fals"
];

// Helper to generate exactly 26 operators for a line
export function generate26OperatorsForLine(lineId: LineNumber): Operator[] {
  const lineOffset = (lineId - 1) * 7;
  const operators: Operator[] = [];

  for (let i = 1; i <= 26; i++) {
    const nameIndex = (lineOffset + i - 1) % OPERATOR_NAMES_POOL.length;
    const name = OPERATOR_NAMES_POOL[nameIndex];
    const nik = `NIK-${1000 + lineId * 100 + i}`;

    // Attendance condition distribution (22-25 Hadir, 1-4 absent on various lines to demonstrate feature)
    let attendanceStatus: Operator["attendanceStatus"] = "HADIR";
    let attendanceNotes = "Hadir tepat waktu";

    if (lineId === 1 && i === 4) {
      attendanceStatus = "SAKIT";
      attendanceNotes = "Surat Dokter Flu & Demam";
    } else if (lineId === 1 && i === 19) {
      attendanceStatus = "IZIN";
      attendanceNotes = "Urusan Keluarga";
    } else if (lineId === 3 && (i === 10 || i === 21)) {
      attendanceStatus = i === 10 ? "SAKIT" : "ALPHA";
      attendanceNotes = i === 10 ? "Sakit Tipes" : "Tanpa Keterangan";
    } else if (lineId === 4 && i === 23) {
      attendanceStatus = "CUTI";
      attendanceNotes = "Cuti Tahunan";
    } else if (lineId === 6 && (i === 5 || i === 18)) {
      attendanceStatus = i === 5 ? "IZIN" : "SAKIT";
      attendanceNotes = "Izin Menikah / Sakit";
    } else if (lineId === 7 && i === 1) {
      attendanceStatus = "ALPHA";
      attendanceNotes = "Tanpa Pemberitahuan";
    }

    // Skills & Product Competencies (10 Garment Products)
    // Products: Kemeja, Jas, Celana, Blouse, Rok, Blazer, Vest, Wearpack, Toga, Jaket
    const efficiency = 75 + Math.floor((i * 13 + lineId * 7) % 32); // 75% to 106%
    const defectRate = Number((0.8 + ((i * 3 + lineId) % 5) * 0.7).toFixed(1)); // 0.8% to 4.3%

    // Product capabilities distribution across 10 products
    const productCapabilities: Record<GarmentProductType, number> = {
      Kemeja: 4,
      Celana: i % 4 !== 0 ? 3 : 2,
      Blouse: i % 3 !== 0 ? 4 : 2,
      Rok: i % 2 === 0 ? 4 : 3,
      Vest: (i + lineId) % 3 === 0 ? 4 : 2,
      Toga: (i + lineId) % 4 === 0 ? 4 : 2,
      Blazer: i % 5 === 0 || i === 4 || i === 10 || i === 21 ? 4 : 1,
      Jas: i % 7 === 0 || i === 19 || i === 21 ? 5 : 1,
      Wearpack: (i + lineId) % 6 === 0 || i === 1 ? 4 : 1,
      Jaket: i % 4 === 1 || i === 14 ? 4 : 2,
    };

    // Calculate Grade based on product capabilities
    const gradingResult = calculateProductBasedGrading(productCapabilities);
    const grade: Operator["grade"] = gradingResult.grade;
    const masteredProducts = gradingResult.masteredProducts;
    const productGradeReason = gradingResult.reason;

    // Machine skill matrix ratings 1..5
    const primarySkill = i % 5 === 0 ? "OL 5" : i % 7 === 0 ? "OL 3" : i === 21 ? "DURKOPP" : i % 9 === 0 ? "Button Attaching" : "SN";
    const skills: Record<string, number> = {
      SN: primarySkill === "SN" ? 5 : 3 + (i % 2),
      "OL 3": primarySkill === "OL 3" ? 5 : 2 + (i % 3),
      "OL 5": primarySkill === "OL 5" ? 5 : 2 + (i % 3),
      "Overdeck + Cr": 2 + (i % 3),
      DURKOPP: primarySkill === "DURKOPP" ? 5 : 1 + (i % 3),
      "Button Attaching": primarySkill === "Button Attaching" ? 5 : 3,
      "Button Holer": 3 + (i % 2),
      Bass: 2 + (i % 3),
      Soom: 3,
      Manual: 4,
      Helper: 5,
    };

    const targetOutput = 80;
    const totalOutput = attendanceStatus === "HADIR" ? Math.round((targetOutput * efficiency) / 100) : 0;
    const totalDefect = attendanceStatus === "HADIR" ? Math.round((totalOutput * defectRate) / 100) : 0;

    operators.push({
      id: `op-L${lineId}-${i}`,
      nik,
      name,
      line: lineId,
      attendanceStatus,
      attendanceNotes,
      grade,
      skills,
      primarySkill,
      experienceYears: 1 + ((i * 3 + lineId) % 9),
      efficiency,
      defectRate,
      targetOutput,
      totalOutput,
      totalDefect,
      assignedProcessNo: i,
      assignedProcessName: STANDARD_26_PROCESSES[i - 1]?.process || `Proses ${i}`,
      machineType: STANDARD_26_PROCESSES[i - 1]?.machine || "SN",
      productCapabilities,
      masteredProducts,
      productGradeReason,
    });
  }

  return operators;
}

// Generate LineProductionData for 26 processes with CLEAN / EMPTY hourly output (siap diinput)
export function generateLineProductionRows(
  lineId: LineNumber,
  operators: Operator[],
  processes: ProcessItem[] = STANDARD_26_PROCESSES,
  workingHours: number = 8,
  workSchedule: "senin_jumat" | "sabtu" = "senin_jumat"
): LineProductionData {
  const supervisors: Record<number, string> = {
    1: "Edwar Permana, S.T.",
    3: "Bambang Irawan",
    4: "Surya Kencana",
    5: "Dedi Supriyadi",
    6: "Asep Sunandar",
    7: "Hadi Gunawan",
  };

  const targetPerHour = 10;
  const targetPerDay = targetPerHour * workingHours; // 80 pcs for 8h, 50 pcs for 5h

  const rows = processes.map((proc) => {
    const assignedOp = operators.find((o) => o.assignedProcessNo === proc.no);
    const isPresent = assignedOp?.attendanceStatus === "HADIR";

    const workingMinutes = workingHours * 60;
    // Bersihkan semua input: default ke 0 (kosong)
    const hourlyActual: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const hourlyDefects: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    const totalActual = 0;
    const totalDefects = 0;
    const target = targetPerDay;
    const balanceTarget = 0;
    const akmOutput = 0;
    const akmStock = 0;

    let status: "normal" | "warning" | "bottleneck" | "unassigned" = "normal";
    let keterangan = "Siap input produksi";

    if (!isPresent) {
      status = "unassigned";
      keterangan = `Operator ${assignedOp?.name || ""} (${assignedOp?.attendanceStatus || "Absen"}) - Butuh Double Job`;
    }

    return {
      no: proc.no,
      process: proc.process,
      machine: proc.machine,
      section: proc.subSection || proc.section,
      operatorId: assignedOp ? assignedOp.id : `op-${lineId}-${proc.no}`,
      operatorName: assignedOp ? assignedOp.name : `Op. Line ${lineId} #${proc.no}`,
      operatorGrade: assignedOp ? assignedOp.grade : "B",
      operatorAttendance: assignedOp ? assignedOp.attendanceStatus : "HADIR",
      targetPerHour,
      workingMinutes,
      akmOutput,
      akmStock,
      target,
      balanceTarget,
      hourlyActual,
      hourlyDefects,
      totalActual,
      totalDefects,
      keterangan,
      status,
    };
  });

  return {
    lineId,
    supervisor: supervisors[lineId] || "Supervisor Sewing",
    qcInspector: "Fylaily Izmi Adhisty",
    date: new Date().toISOString().split("T")[0],
    sewingDays: workSchedule === "sabtu" ? "Sabtu (5 Jam Kerja)" : "Senin - Jumat (8 Jam Kerja)",
    workingHours,
    workSchedule,
    totalOperators: operators.length,
    targetPerHour,
    targetPerDay,
    processes,
    rows,
  };
}

export const DEFAULT_USERS: User[] = [
  {
    id: "user-pe",
    username: "pe_head",
    password: "pe123",
    name: "Ir. Budi Santoso (PE Head)",
    role: "production_engineer",
    title: "Production Engineer Head (Akses Penuh Semua Line & Master BP)",
    lastLogin: "2026-09-13 07:45",
  },
  {
    id: "user-l1",
    username: "admin_l1",
    password: "line1pass",
    name: "Rina S. (Admin Line 1)",
    role: "admin_line",
    assignedLine: 1,
    title: "Admin Sewing Line 1 (SOGO EXPORT)",
    lastLogin: "2026-09-13 08:00",
  },
  {
    id: "user-l3",
    username: "admin_l3",
    password: "line3pass",
    name: "Dewi P. (Admin Line 3)",
    role: "admin_line",
    assignedLine: 3,
    title: "Admin Sewing Line 3 (UNIQLO CASUAL)",
    lastLogin: "2026-09-13 08:05",
  },
  {
    id: "user-l4",
    username: "admin_l4",
    password: "line4pass",
    name: "Agus T. (Admin Line 4)",
    role: "admin_line",
    assignedLine: 4,
    title: "Admin Sewing Line 4 (ZARA WOMAN)",
    lastLogin: "2026-09-13 07:55",
  },
  {
    id: "user-l5",
    username: "admin_l5",
    password: "line5pass",
    name: "Fitri W. (Admin Line 5)",
    role: "admin_line",
    assignedLine: 5,
    title: "Admin Sewing Line 5 (H&M BASIC)",
    lastLogin: "2026-09-13 08:10",
  },
  {
    id: "user-l6",
    username: "admin_l6",
    password: "line6pass",
    name: "Hendra K. (Admin Line 6)",
    role: "admin_line",
    assignedLine: 6,
    title: "Admin Sewing Line 6 (MARKS & SPENCER)",
    lastLogin: "2026-09-13 08:00",
  },
  {
    id: "user-l7",
    username: "admin_l7",
    password: "line7pass",
    name: "Siti Nur (Admin Line 7)",
    role: "admin_line",
    assignedLine: 7,
    title: "Admin Sewing Line 7 (ADIDAS SPORTS)",
    lastLogin: "2026-09-13 08:12",
  },
];

// Initial Pareto Defect & Delay Categories
export const INITIAL_PARETO_DEFECTS = [
  { category: "Jahitan Melintir / Pucker", count: 48, percentage: 38.4, cumulativePercentage: 38.4 },
  { category: "Skip Stitch / Loncatan Jarum", count: 32, percentage: 25.6, cumulativePercentage: 64.0 },
  { category: "Lebar Kampuh Tidak Standar", count: 18, percentage: 14.4, cumulativePercentage: 78.4 },
  { category: "Tension Benang Kendur / Putus", count: 14, percentage: 11.2, cumulativePercentage: 89.6 },
  { category: "Noda Minyak Mesin", count: 8, percentage: 6.4, cumulativePercentage: 96.0 },
  { category: "Lainnya / Benang Sisa", count: 5, percentage: 4.0, cumulativePercentage: 100.0 },
];

export const INITIAL_PARETO_BOTTLENECK_CAUSES = [
  { category: "Operator Tidak Hadir (Absen / Sakit)", count: 42, percentage: 39.3, cumulativePercentage: 39.3 },
  { category: "Cycle Time Melampaui Takt Time", count: 28, percentage: 26.2, cumulativePercentage: 65.5 },
  { category: "Keterlambatan Bundle Potongan (WIP)", count: 16, percentage: 15.0, cumulativePercentage: 80.5 },
  { category: "Kendala Mesin / Jarum Patah Berulang", count: 12, percentage: 11.2, cumulativePercentage: 91.7 },
  { category: "Operator Kurang Terlatih (Skill Gap)", count: 9, percentage: 8.3, cumulativePercentage: 100.0 },
];

// 6M Fishbone Default Diagram
export const INITIAL_FISHBONE_6M: Fishbone6M = {
  man: [
    "Operator skill mismatch pada mesin khusus (Durkopp & OL 5)",
    "Ketidakhadiran harian tanpa pemberitahuan lebih awal (Alpha)",
    "Kelelahan fisik operator pada jam ke-6 dan ke-7",
    "Operator Grade C/D belum mendapatkan on-the-job training",
  ],
  machine: [
    "Ketegangan benang (tension) berubah pada rpm tinggi",
    "Jarum tumpul / nomor jarum tidak sesuai gramasi kain",
    "Piringan looper obras kotor serat benang",
    "Waktu tanggap mekanik lambat saat mesin breakdown",
  ],
  method: [
    "Urutan bundling potongan kain tidak beraturan",
    "Line balancing belum dihitung ulang saat ada operator absen",
    "Metode gerakan (work motion) non-value-added pada trimming benang",
    "SOP penataan tumpukan komponen belum seragam",
  ],
  material: [
    "Variasi ketebalan kain antar lot rol",
    "Benang jahit mudah rapuh / terurai di kecepatan tinggi",
    "Interlining leher tidak merekat sempurna dari press fusing",
    "Label buyer salah kode ukuran",
  ],
  measurement: [
    "Pencatatan hourly output manual sering terlambat diisi",
    "Toleransi jahitan +/- 2mm tidak dicek berkala",
    "Takt time tidak ditampilkan secara visual di atas line",
  ],
  milieu: [
    "Suhu area sewing meningkat di siang hari (ventilasi minim)",
    "Pencahayaan di stasiun armhole kurang terang (< 500 lux)",
    "Kebisingan suara kompresor udara dekat Line 3",
  ],
};

// 5 Why Root Cause Analysis Cases
export const INITIAL_FIVE_WHY_CASES: FiveWhyItem[] = [
  {
    id: "why-1",
    issue: "Line 1 mengalami defisit 18 pcs pada proses Join Plaket & Armhole",
    line: 1,
    stationOrProcess: "Stasiun 4 & 19 (Join Plaket & Dasar Armhole)",
    why1: "Kenapa output tertahan? Stasiun nomor 4 dan 19 mengalami antrian WIP menumpuk.",
    why2: "Kenapa WIP menumpuk? Cycle time aktual 130 detik, jauh melampaui takt time 360 detik dibagi target.",
    why3: "Kenapa cycle time melompat tinggi? Operator utama (Budi & Dewi) sedang SAKIT dan IZIN, digantikan operator pinjaman tanpa skill yang memadai.",
    why4: "Kenapa pengganti tidak siap? Skill matrix dan daftar kehadiran tidak disinkronkan sebelum line berjalan di pagi hari.",
    why5: "Kenapa tidak disinkronkan? Belum ada sistem optimasi rekomendasi layout otomatis berbasis operator hadir.",
    rootCause: "Ketiadaan real-time attendance-based line balancing yang otomatis merelokasi operator cadangan bersertifikat skill matrix.",
    correctiveAction: "Aktifkan layout rekomendasi: tempatkan operator Grade A yang hadir pada stasiun armhole dan tugaskan 1 floating helper.",
    preventiveAction: "Wajibkan verifikasi attendance pada pukul 07:15 dan jalankan kalkulasi recommended layout sebelum mesin berputar.",
    pic: "Edwar Permana (Supervisor L1) & PE Team",
    status: "In Progress",
  },
  {
    id: "why-2",
    issue: "Tingkat defect loncatan jahitan (skip stitch) tinggi di Line 3",
    line: 3,
    stationOrProcess: "Stasiun 21 (Pasang Tangan Durkopp)",
    why1: "Kenapa ada skip stitch? Jahitan tidak mengikat pada kain tebal armhole.",
    why2: "Kenapa tidak mengikat? Jarum mesin nomor 11 terlalu kecil untuk kain blazer 340 gsm.",
    why3: "Kenapa jarum nomor 11 terpasang? Jarum standar pengganti nomor 14/16 habis di toolkit line.",
    why4: "Kenapa stok jarum habis? Tidak ada checklist preventive maintenance harian sebelum start produksi.",
    why5: "Kenapa checklist tidak ada? SOP ganti style baru belum memuat spesifikasi jarum per jenis kain.",
    rootCause: "Standar Operasional Prosedur (SOP) ganti style R&D belum terintegrasi ke setting mekanik line.",
    correctiveAction: "Ganti seluruh jarum stasiun pasang tangan ke nomor 14 ball-point dan stel timing looper.",
    preventiveAction: "Buat form verifikasi kesiapan jarum & benang sebelum style baru dinaikkan ke line.",
    pic: "Bambang Irawan (SPV L3) & Mekanik R&D",
    status: "Open",
  },
];

// Production Engineering Action Recommendations
export const INITIAL_RECOMMENDATIONS: EngineeringRecommendation[] = [
  {
    id: "rec-1",
    lineId: 1,
    priority: "CRITICAL",
    category: "Attendance",
    issue: "2 Operator Kunci Tidak Hadir (Sakit & Izin)",
    rootCause: "Stasiun 4 (Princess) dan Stasiun 19 (Plaket) tidak terisi operator spesialis.",
    immediateAction: "Terapkan Rekomendasi Layout: Tukar operator Grade A dari stasiun ringan ke stasiun 19 dan gunakan 1 floating helper.",
    preventiveAction: "Training silang (cross-skilling) 4 operator cadangan untuk mesin SN dan Durkopp.",
    estimatedImpact: "Mencegah defisit 25 pcs/hari (+31% line balance efficiency)",
  },
  {
    id: "rec-2",
    lineId: 3,
    priority: "HIGH",
    category: "Balancing",
    issue: "Cycle time stasiun 23 (Dasar Armhole) 110 detik (Bottleneck)",
    rootCause: "Beban kerja individual terlalu padat, operator harus memegang kain sekaligus mengukur kampuh.",
    immediateAction: "Pecah proses menjadi 2 sub-proses atau sediakan guide jig magnetik untuk menjamin lebar kampuh instan.",
    preventiveAction: "Modifikasi feeding table dan pasang lamp tambahan di stasiun armhole.",
    estimatedImpact: "Menurunkan cycle time dari 110s menjadi 75s (-31% bottleneck)",
  },
  {
    id: "rec-3",
    lineId: 4,
    priority: "MEDIUM",
    category: "Machine",
    issue: "Mesin Overlock 5 Benang bergetar pada rpm > 4500",
    rootCause: "Baut mounting meja longgar dan sabuk v-belt motor telah aus.",
    immediateAction: "Kencangkan mounting dan atur tension belt saat jam istirahat.",
    preventiveAction: "Jadwalkan preventive maintenance mingguan untuk seluruh mesin overlock.",
    estimatedImpact: "Mengurangi risiko benang putus dan menaikkan efisiensi +4%",
  },
];

// Aliases & default initial states
export const RAW_BREAKDOWN_PROCESSES = STANDARD_26_PROCESSES;

export const INITIAL_OPERATORS: Operator[] = VALID_LINES.flatMap((lineId) =>
  generate26OperatorsForLine(lineId)
);

export function generateInitialLineRows(
  lineId: LineNumber,
  customProcesses?: ProcessItem[],
  customOperators?: Operator[],
  workingHours: number = 8,
  workSchedule: "senin_jumat" | "sabtu" = "senin_jumat"
): LineProductionData {
  const lineOps = customOperators || generate26OperatorsForLine(lineId);
  const procs = customProcesses || STANDARD_26_PROCESSES;
  return generateLineProductionRows(lineId, lineOps, procs, workingHours, workSchedule);
}

