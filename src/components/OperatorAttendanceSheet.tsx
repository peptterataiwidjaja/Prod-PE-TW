import React, { useState } from "react";
import {
  Operator,
  AttendanceStatus,
  User,
  LineNumber,
  OperatorGrade,
  GarmentProductType,
  GARMENT_PRODUCTS_CONFIG,
} from "../types";
import {
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Award,
  Filter,
  Search,
  Sliders,
  FileCheck,
  Edit2,
  Check,
  X,
  Plus,
  Shield,
  Star,
  Trash2,
  HelpCircle,
  Info,
  BookOpen,
  PlusCircle,
  Save,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Shirt,
  Layers,
  CheckSquare,
} from "lucide-react";
import {
  getGradeBadge,
  GRADING_PARAMETERS_GUIDE,
  calculateOperatorGrading,
  calculateProductBasedGrading,
} from "../utils/grading";

interface OperatorAttendanceSheetProps {
  lineId: LineNumber;
  operators: Operator[];
  currentUser: User;
  onUpdateOperatorAttendance: (operatorId: string, status: AttendanceStatus, notes?: string) => void;
  onUpdateOperatorDetails?: (operatorId: string, updated: Partial<Operator>) => void;
  onBatchSetAllHadir: () => void;
  onAddOperator?: (newOperator: Operator) => void;
  onDeleteOperator?: (operatorId: string) => void;
}

const COMMON_SEWING_MACHINES = [
  "SN (Single Needle)",
  "DN (Double Needle)",
  "OL (Overlock / Obras)",
  "Overdeck / Interlock",
  "Bartack",
  "Kansai / Multi-Needle",
  "Button Hole / Kancing",
  "Ironing / Press",
];

export const OperatorAttendanceSheet: React.FC<OperatorAttendanceSheetProps> = ({
  lineId,
  operators,
  currentUser,
  onUpdateOperatorAttendance,
  onUpdateOperatorDetails,
  onBatchSetAllHadir,
  onAddOperator,
  onDeleteOperator,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [gradeFilter, setGradeFilter] = useState<string>("ALL");
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);

  // Skill Matrix editing state
  const [editingSkillOp, setEditingSkillOp] = useState<Operator | null>(null);
  const [tempSkills, setTempSkills] = useState<Record<string, number>>({});
  const [tempPrimarySkill, setTempPrimarySkill] = useState<string>("");
  const [newMachineInput, setNewMachineInput] = useState("");

  // Product capabilities editing state (10 Garment Products)
  const [editingProductOp, setEditingProductOp] = useState<Operator | null>(null);
  const [tempProductCaps, setTempProductCaps] = useState<Record<GarmentProductType, number>>({
    Kemeja: 0,
    Jas: 0,
    Celana: 0,
    Blouse: 0,
    Rok: 0,
    Blazer: 0,
    Vest: 0,
    Wearpack: 0,
    Toga: 0,
    Jaket: 0,
  });

  // Add / Remove Operator state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<Operator | null>(null);
  const [newOpForm, setNewOpForm] = useState({
    name: "",
    nik: `OP-L${lineId}-${String(operators.length + 1).padStart(2, "0")}`,
    grade: "B" as OperatorGrade,
    efficiency: 85,
    defectRate: 2.0,
    primarySkill: "Jahit Obras / Side Seam",
    machineType: "SN",
    experienceYears: 2,
    attendanceStatus: "HADIR" as AttendanceStatus,
    attendanceNotes: "",
  });

  // Grading Parameter Guide toggle
  const [isGradingGuideOpen, setIsGradingGuideOpen] = useState(false);

  const canEdit =
    currentUser.role === "production_engineer" || currentUser.assignedLine === lineId;
  const isPE = currentUser.role === "production_engineer";

  // Attendance metrics
  const total = operators.length;
  const hadirCount = operators.filter((o) => o.attendanceStatus === "HADIR").length;
  const sakitCount = operators.filter((o) => o.attendanceStatus === "SAKIT").length;
  const izinCount = operators.filter((o) => o.attendanceStatus === "IZIN").length;
  const cutiCount = operators.filter((o) => o.attendanceStatus === "CUTI").length;
  const alphaCount = operators.filter((o) => o.attendanceStatus === "ALPHA").length;
  const absentTotal = total - hadirCount;
  const attendanceRate = total > 0 ? ((hadirCount / total) * 100).toFixed(1) : "0";

  // Filtered operators
  const filteredOperators = operators.filter((op) => {
    const matchesSearch =
      op.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.nik.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.primarySkill.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (op.machineType && op.machineType.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || op.attendanceStatus === statusFilter;
    const matchesGrade = gradeFilter === "ALL" || op.grade === gradeFilter;
    return matchesSearch && matchesStatus && matchesGrade;
  });

  // Open Skill Matrix Modal with current operator's skills
  const handleOpenSkillMatrix = (op: Operator) => {
    setEditingSkillOp(op);
    setTempSkills({ ...op.skills });
    setTempPrimarySkill(op.primarySkill);
    setNewMachineInput("");
  };

  // Update skill score for a specific machine
  const handleSetSkillScore = (machine: string, score: number) => {
    setTempSkills((prev) => ({
      ...prev,
      [machine]: score,
    }));
  };

  // Add custom machine to skills
  const handleAddMachineToSkills = () => {
    if (!newMachineInput.trim()) return;
    const key = newMachineInput.trim().toUpperCase();
    if (!tempSkills[key]) {
      setTempSkills((prev) => ({
        ...prev,
        [key]: 3,
      }));
    }
    setNewMachineInput("");
  };

  // Remove machine from skills
  const handleRemoveMachineFromSkills = (machine: string) => {
    setTempSkills((prev) => {
      const copy = { ...prev };
      delete copy[machine];
      return copy;
    });
  };

  // Save skill matrix
  const handleSaveSkillMatrix = () => {
    if (!editingSkillOp || !onUpdateOperatorDetails) return;

    // Recalculate grade hint based on skills & performance
    onUpdateOperatorDetails(editingSkillOp.id, {
      skills: tempSkills,
      primarySkill: tempPrimarySkill,
    });

    setEditingSkillOp(null);
  };

  // Open Garment Product Matrix modal
  const handleOpenProductMatrix = (op: Operator) => {
    setEditingProductOp(op);
    const initialCaps: Record<GarmentProductType, number> = {
      Kemeja: 0,
      Jas: 0,
      Celana: 0,
      Blouse: 0,
      Rok: 0,
      Blazer: 0,
      Vest: 0,
      Wearpack: 0,
      Toga: 0,
      Jaket: 0,
    };
    if (op.productCapabilities) {
      (Object.keys(initialCaps) as GarmentProductType[]).forEach((p) => {
        const val = op.productCapabilities?.[p];
        if (typeof val === "number") initialCaps[p] = val;
        else if (typeof val === "boolean") initialCaps[p] = val ? 4 : 0;
      });
    }
    setTempProductCaps(initialCaps);
  };

  // Set rating for a garment product
  const handleSetProductRating = (product: GarmentProductType, rating: number) => {
    setTempProductCaps((prev) => ({
      ...prev,
      [product]: rating,
    }));
  };

  // Quick toggle mastery for a garment product
  const handleToggleProductMastery = (product: GarmentProductType) => {
    setTempProductCaps((prev) => {
      const current = prev[product] || 0;
      return {
        ...prev,
        [product]: current >= 3 ? 0 : 4,
      };
    });
  };

  // Preset quick application for product matrix
  const handleApplyProductPreset = (preset: "all" | "tailoring_a" | "multi_b" | "basic_c" | "reset") => {
    if (preset === "all") {
      setTempProductCaps({
        Kemeja: 5,
        Jas: 5,
        Celana: 5,
        Blouse: 5,
        Rok: 5,
        Blazer: 5,
        Vest: 5,
        Wearpack: 5,
        Toga: 5,
        Jaket: 5,
      });
    } else if (preset === "tailoring_a") {
      setTempProductCaps({
        Kemeja: 4,
        Jas: 5,
        Celana: 4,
        Blouse: 3,
        Rok: 3,
        Blazer: 5,
        Vest: 4,
        Wearpack: 3,
        Toga: 2,
        Jaket: 4,
      });
    } else if (preset === "multi_b") {
      setTempProductCaps({
        Kemeja: 4,
        Jas: 0,
        Celana: 4,
        Blouse: 4,
        Rok: 4,
        Blazer: 0,
        Vest: 4,
        Wearpack: 0,
        Toga: 3,
        Jaket: 0,
      });
    } else if (preset === "basic_c") {
      setTempProductCaps({
        Kemeja: 4,
        Jas: 0,
        Celana: 3,
        Blouse: 3,
        Rok: 0,
        Blazer: 0,
        Vest: 0,
        Wearpack: 0,
        Toga: 0,
        Jaket: 0,
      });
    } else if (preset === "reset") {
      setTempProductCaps({
        Kemeja: 0,
        Jas: 0,
        Celana: 0,
        Blouse: 0,
        Rok: 0,
        Blazer: 0,
        Vest: 0,
        Wearpack: 0,
        Toga: 0,
        Jaket: 0,
      });
    }
  };

  // Save product matrix and recalculate operator grade
  const handleSaveProductMatrix = () => {
    if (!editingProductOp || !onUpdateOperatorDetails) return;
    const gradingResult = calculateProductBasedGrading(tempProductCaps);
    onUpdateOperatorDetails(editingProductOp.id, {
      productCapabilities: tempProductCaps,
      masteredProducts: gradingResult.masteredProducts,
      grade: gradingResult.grade,
      productGradeReason: gradingResult.reason,
    });
    setEditingProductOp(null);
  };

  // Handle Add Operator Submit
  const handleAddOperatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpForm.name.trim()) return;

    const initialSkills: Record<string, number> = {
      [newOpForm.machineType]: newOpForm.grade === "A" ? 5 : newOpForm.grade === "B" ? 4 : 3,
      SN: 3,
      OL: 3,
    };

    const newOperator: Operator = {
      id: `op-l${lineId}-${Date.now()}`,
      nik: newOpForm.nik || `OP-L${lineId}-${Math.floor(Math.random() * 900 + 100)}`,
      name: newOpForm.name.trim(),
      line: lineId,
      attendanceStatus: newOpForm.attendanceStatus,
      attendanceNotes: newOpForm.attendanceNotes,
      grade: newOpForm.grade,
      skills: initialSkills,
      primarySkill: newOpForm.primarySkill || "Jahit Standar",
      experienceYears: Number(newOpForm.experienceYears) || 1,
      efficiency: Number(newOpForm.efficiency) || 80,
      defectRate: Number(newOpForm.defectRate) || 2.0,
      targetOutput: 80,
      totalOutput: Math.round(80 * (Number(newOpForm.efficiency) / 100)),
      totalDefect: Math.round(2),
      machineType: newOpForm.machineType,
    };

    if (onAddOperator) {
      onAddOperator(newOperator);
    }

    // Reset Form
    setNewOpForm({
      name: "",
      nik: `OP-L${lineId}-${String(operators.length + 2).padStart(2, "0")}`,
      grade: "B",
      efficiency: 85,
      defectRate: 2.0,
      primarySkill: "Jahit Obras / Side Seam",
      machineType: "SN",
      experienceYears: 2,
      attendanceStatus: "HADIR",
      attendanceNotes: "",
    });
    setIsAddModalOpen(false);
  };

  // Handle Delete Operator
  const handleConfirmDelete = () => {
    if (operatorToDelete && onDeleteOperator) {
      onDeleteOperator(operatorToDelete.id);
      setOperatorToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Attendance Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Total Manpower Line
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-1 font-mono">
            {total} <span className="text-xs text-slate-500 font-sans font-medium">Operator</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Line {lineId} Active Pool</div>
        </div>

        <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider flex items-center justify-between">
            <span>Operator Hadir</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">{hadirCount}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5 font-semibold">Tersedia untuk Layout</div>
        </div>

        <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Sakit (Dokter)</div>
          <div className="text-2xl font-extrabold text-amber-700 mt-1 font-mono">{sakitCount}</div>
          <div className="text-[11px] text-amber-600 mt-0.5">Dikecualikan layout</div>
        </div>

        <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Izin & Cuti</div>
          <div className="text-2xl font-extrabold text-blue-700 mt-1 font-mono">{izinCount + cutiCount}</div>
          <div className="text-[11px] text-blue-600 mt-0.5">Izin: {izinCount} | Cuti: {cutiCount}</div>
        </div>

        <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 shadow-xs">
          <div className="text-[10px] uppercase font-bold text-rose-700 tracking-wider">Alpha (Tanpa Kabar)</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1 font-mono">{alphaCount}</div>
          <div className="text-[11px] text-rose-600 mt-0.5">Perlu follow-up SPV</div>
        </div>

        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xs">
          <div className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Tingkat Kehadiran</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">{attendanceRate}%</div>
          <div className="text-[11px] text-slate-300 mt-0.5">
            {absentTotal > 0 ? `${absentTotal} Orang Absen` : "100% Lengkap"}
          </div>
        </div>
      </div>

      {/* Warning Notice if operators are absent */}
      {absentTotal > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start space-x-3 text-amber-900 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-sm">
              Perhatian Sistem Line Balancing: {absentTotal} Operator Tidak Hadir pada Line {lineId}
            </span>
            <p className="leading-relaxed">
              Sesuai aturan engineering garmen, sistem secara otomatis <strong>hanya mengalokasikan operator berstatus HADIR</strong> untuk proses penempatan stasiun dan kalkulasi layout rekomendasi. Proses yang operator aslinya absen dialihkan ke operator cadangan yang hadir berdasarkan Skill Matrix & Grading.
            </p>
          </div>
        </div>
      )}

      {/* Grading Parameter Guide Box (Interactive Toggle) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div
          onClick={() => setIsGradingGuideOpen(!isGradingGuideOpen)}
          className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/40 hover:bg-slate-100/70 cursor-pointer flex items-center justify-between border-b border-slate-200 transition-colors"
        >
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-2">
                <span>Parameter & Kriteria Penentuan Grading Operator Sewing</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                  Standar Industrial Engineering (IE)
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Panduan tolok ukur penentuan Grade A, B, C, dan D berdasarkan Efisiensi, Defect Rate, dan Skill Matrix multi-mesin.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center space-x-1.5 shadow-2xs"
          >
            <span>{isGradingGuideOpen ? "Sembunyikan Panduan" : "Buka Parameter Grading"}</span>
            {isGradingGuideOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isGradingGuideOpen && (
          <div className="p-5 space-y-4 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {GRADING_PARAMETERS_GUIDE.map((g) => (
                <div
                  key={g.grade}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${g.badgeClass}`}>
                        {g.label}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Parameter IE</span>
                    </div>

                    <h4 className="font-bold text-xs text-slate-900 mt-2.5">{g.title}</h4>

                    <div className="mt-3 space-y-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Tolok Ukur Efisiensi:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{g.efficiencyCriteria}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Toleransi Defect QC:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{g.defectCriteria}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Kriteria Skill Matrix:</span>
                        <span className="font-semibold text-slate-800 text-[11px]">{g.skillMatrixCriteria}</span>
                      </div>

                      <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200">
                        <span className="text-[10px] uppercase font-bold text-blue-700 block flex items-center space-x-1">
                          <Shirt className="w-3 h-3 text-blue-600" />
                          <span>Kriteria Kemampuan Produk:</span>
                        </span>
                        <span className="font-semibold text-blue-950 text-[11px] block mt-0.5">
                          {g.productMatrixCriteria}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 space-y-1">
                    <div>
                      <strong className="text-slate-800">Alokasi Line:</strong> {g.roleAndPlacement}
                    </div>
                    <div className="text-[10px] text-slate-500 italic">
                      {g.actionGuidance}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Catatan Engineering:</strong> Operator berstatus <strong>Grade A & B</strong> diprioritaskan oleh algoritma optimasi layout untuk mengisi operasi bottleneck (SMV tertinggi) dan proses dengan risiko cacat kritis (contoh: pasang kerah, bobok kantong, set sleeve). Operator <strong>Grade C & D</strong> diarahkan ke operasi jahitan lurus standar atau ditandemkan dengan trainer.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control Bar: Filters & Quick Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIK, skill, mesin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none w-52 sm:w-60"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
            {["ALL", "HADIR", "SAKIT", "IZIN", "CUTI", "ALPHA"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg transition-all text-[11px] whitespace-nowrap ${
                  statusFilter === st
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {st === "ALL" ? `Semua Presensi (${total})` : st}
              </button>
            ))}
          </div>

          {/* Grade Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {["ALL", "A", "B", "C", "D"].map((gr) => (
              <button
                key={gr}
                onClick={() => setGradeFilter(gr)}
                className={`px-2 py-1 rounded-lg transition-all text-[11px] ${
                  gradeFilter === gr
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {gr === "ALL" ? "Semua Grade" : `Gr. ${gr}`}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {canEdit && (
            <>
              {/* Tambah Operator Button */}
              <button
                id="btn-add-operator"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
                title="Tambah operator baru ke Line ini"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Operator</span>
              </button>

              {/* Set All Hadir */}
              <button
                onClick={onBatchSetAllHadir}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center space-x-1.5"
                title={`Setel semua operator Line ${lineId} menjadi HADIR`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Setel Semua Hadir</span>
              </button>
            </>
          )}

          <div className="text-xs text-slate-500 pl-2 border-l border-slate-200">
            {isPE ? (
              <span className="inline-flex items-center text-blue-700 font-semibold">
                <Shield className="w-3.5 h-3.5 mr-1" /> Hak Akses PE
              </span>
            ) : (
              <span className="text-slate-600 font-medium">Admin Line {lineId}</span>
            )}
          </div>
        </div>
      </div>

      {/* Operators Attendance & Skill Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Daftar Presensi Harian, Skill Matrix & Grading Operator Sewing
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Line {lineId} &bull; Total {total} Operator terdaftar &bull; Klik status kehadiran untuk presensi langsung, atau klik Skill Matrix untuk mengedit keahlian mesin.
            </p>
          </div>
          <div className="text-xs font-mono bg-slate-100 px-3 py-1 rounded-lg font-semibold text-slate-700">
            {filteredOperators.length} Operator ditampilkan
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">NIK & Nama Operator</th>
                <th className="py-3 px-3">Status Kehadiran</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3 text-center">Grade</th>
                <th className="py-3 px-3 min-w-[210px]">Kemampuan Produk (10 Garment)</th>
                <th className="py-3 px-3 text-center">Efisiensi</th>
                <th className="py-3 px-3 text-center">Defect</th>
                <th className="py-3 px-3">Skill Utama & Matriks Mesin</th>
                <th className="py-3 px-3">Stasiun Asal</th>
                <th className="py-3 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOperators.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Tidak ada operator yang cocok dengan kriteria pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredOperators.map((op, idx) => {
                  const badge = getGradeBadge(op.grade);
                  const isHadir = op.attendanceStatus === "HADIR";

                  // Number of machines with score >= 3
                  const multiSkillCount = Object.values(op.skills || {}).filter((s) => Number(s) >= 3).length;

                  return (
                    <tr
                      key={op.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        !isHadir ? "bg-rose-50/30" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{op.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center space-x-1.5">
                          <span>{op.nik}</span>
                          {op.experienceYears && <span>&bull; {op.experienceYears} thn</span>}
                        </div>
                      </td>

                      {/* Attendance Status Buttons */}
                      <td className="py-2.5 px-3">
                        {canEdit ? (
                          <div className="inline-flex rounded-lg shadow-2xs border border-slate-200 overflow-hidden bg-white">
                            {(["HADIR", "SAKIT", "IZIN", "CUTI", "ALPHA"] as AttendanceStatus[]).map(
                              (st) => {
                                const isSelected = op.attendanceStatus === st;
                                let color = "hover:bg-slate-100 text-slate-600";
                                if (isSelected) {
                                  if (st === "HADIR") color = "bg-emerald-600 text-white font-bold";
                                  else if (st === "SAKIT") color = "bg-amber-500 text-white font-bold";
                                  else if (st === "IZIN") color = "bg-blue-600 text-white font-bold";
                                  else if (st === "CUTI") color = "bg-purple-600 text-white font-bold";
                                  else if (st === "ALPHA") color = "bg-rose-600 text-white font-bold";
                                }

                                return (
                                  <button
                                    key={st}
                                    onClick={() => onUpdateOperatorAttendance(op.id, st, op.attendanceNotes)}
                                    className={`px-2 py-1 text-[10px] transition-colors ${color}`}
                                    title={`Tandai ${op.name} sebagai ${st}`}
                                  >
                                    {st}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        ) : (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              op.attendanceStatus === "HADIR"
                                ? "bg-emerald-100 text-emerald-800"
                                : op.attendanceStatus === "SAKIT"
                                ? "bg-amber-100 text-amber-800"
                                : op.attendanceStatus === "IZIN"
                                ? "bg-blue-100 text-blue-800"
                                : op.attendanceStatus === "CUTI"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {op.attendanceStatus}
                          </span>
                        )}
                      </td>

                      {/* Attendance Notes */}
                      <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-[120px] truncate">
                        {op.attendanceNotes || "—"}
                      </td>

                      {/* Grade Badge */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${badge?.lightBg} ${badge?.text} border ${badge?.border}`}
                          title={`Grading: ${op.grade} (Efisiensi ${op.efficiency}%, Defect ${op.defectRate}%)`}
                        >
                          {badge?.label}
                        </span>
                      </td>

                      {/* Kemampuan Pembuatan Produk (10 Garment) */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between space-x-1.5">
                            <span className="text-[11px] font-bold text-slate-800 flex items-center space-x-1">
                              <Shirt className="w-3.5 h-3.5 text-blue-600" />
                              <span>{op.masteredProducts?.length || 0}/10 Produk</span>
                            </span>
                            <button
                              onClick={() => handleOpenProductMatrix(op)}
                              className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-colors flex items-center space-x-1 shadow-2xs"
                              title="Kelola & Evaluasi Kemampuan 10 Produk Garmen"
                            >
                              <Layers className="w-3 h-3 text-blue-600" />
                              <span>{canEdit ? "Evaluasi Produk" : "Lihat Produk"}</span>
                            </button>
                          </div>

                          {/* Preview tags of mastered products */}
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {op.masteredProducts && op.masteredProducts.length > 0 ? (
                              op.masteredProducts.slice(0, 4).map((p) => {
                                const isHigh = ["Jas", "Blazer", "Wearpack", "Jaket"].includes(p);
                                return (
                                  <span
                                    key={p}
                                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                      isHigh
                                        ? "bg-purple-100 text-purple-800 border border-purple-200"
                                        : "bg-slate-100 text-slate-700 border border-slate-200"
                                    }`}
                                  >
                                    {p}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Belum ada data</span>
                            )}
                            {op.masteredProducts && op.masteredProducts.length > 4 && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700">
                                +{op.masteredProducts.length - 4} lainnya
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Efficiency */}
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span
                          className={
                            op.efficiency >= 90
                              ? "text-emerald-600"
                              : op.efficiency >= 80
                              ? "text-blue-600"
                              : op.efficiency >= 65
                              ? "text-amber-600"
                              : "text-rose-600"
                          }
                        >
                          {op.efficiency}%
                        </span>
                      </td>

                      {/* Defect Rate */}
                      <td className="py-2.5 px-3 text-center font-mono font-semibold">
                        <span
                          className={
                            op.defectRate <= 1.5
                              ? "text-emerald-600 font-bold"
                              : op.defectRate <= 3.0
                              ? "text-slate-700"
                              : op.defectRate <= 5.0
                              ? "text-amber-600"
                              : "text-rose-600 font-bold"
                          }
                        >
                          {op.defectRate}%
                        </span>
                      </td>

                      {/* Primary Skill & Skill Matrix Modal Trigger */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px] truncate max-w-[130px]">
                            {op.primarySkill}
                          </span>
                          <button
                            onClick={() => handleOpenSkillMatrix(op)}
                            className="px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold transition-colors flex items-center space-x-1"
                            title="Buka dan Edit Skill Matrix Mesin"
                          >
                            <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                            <span>{canEdit ? "Edit Skill" : "Lihat Skill"}</span>
                            <span className="text-[9px] px-1 bg-blue-200/80 rounded-full font-mono">
                              {multiSkillCount} Msn
                            </span>
                          </button>
                        </div>
                      </td>

                      {/* Assigned Station */}
                      <td className="py-2.5 px-3 text-[11px] text-slate-600">
                        <div className="font-semibold text-slate-800 truncate max-w-[130px]">
                          {op.assignedProcessNo ? `#${op.assignedProcessNo} ${op.assignedProcessName}` : "—"}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {op.machineType || "Mesin Sewing"}
                        </div>
                      </td>

                      {/* Actions: Edit Details & Delete Operator */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {canEdit && (
                            <>
                              <button
                                onClick={() => setEditingOperator(op)}
                                className="p-1 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100"
                                title="Edit Catatan Kehadiran, Grade & Efisiensi"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {onDeleteOperator && (
                                <button
                                  onClick={() => setOperatorToDelete(op)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                  title={`Hapus ${op.name} dari line ini`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT SKILL MATRIX OPERATOR (INTERAKTIF & BISA DIEDIT)            */}
      {/* ========================================================================= */}
      {editingSkillOp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider flex items-center space-x-1">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                  <span>Edit Skill Matrix Operator Sewing</span>
                </span>
                <h3 className="text-lg font-bold text-slate-900">{editingSkillOp.name}</h3>
                <div className="text-xs text-slate-500 font-mono">
                  {editingSkillOp.nik} &bull; Line {lineId} &bull; Grade {editingSkillOp.grade}
                </div>
              </div>
              <button
                onClick={() => setEditingSkillOp(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Primary Skill input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Keahlian Utama (Primary Skill / Operasi Khusus):
              </label>
              <input
                type="text"
                disabled={!canEdit}
                value={tempPrimarySkill}
                onChange={(e) => setTempPrimarySkill(e.target.value)}
                placeholder="Contoh: Jahit Kerah / Bobok Kantong / Pasang Lengan"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-xs focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Machine ratings list */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Rating Kemampuan per Jenis Mesin (Klik Bintang 1 - 5):
                </span>
                <span className="text-[10px] text-slate-400">Skala 1 (Dasar) s/d 5 (Master/Trainer)</span>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {Object.entries(tempSkills).map(([mType, score]) => {
                  const numScore = Number(score);
                  return (
                    <div
                      key={mType}
                      className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between hover:bg-blue-50/30 transition-colors"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-800">{mType}</div>
                        <div className="text-[10px] text-slate-400">
                          {numScore >= 5
                            ? "5: Ahli / Trainer (Multi-Style)"
                            : numScore === 4
                            ? "4: Mahir Mandiri (Memenuhi SMV)"
                            : numScore === 3
                            ? "3: Mampu Standar (Sesuai SOP)"
                            : numScore === 2
                            ? "2: Mampu Terbatas (Perlu Bantuan)"
                            : "1: Pemula / Dalam Pelatihan"}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Interactive Star Buttons */}
                        <div className="flex items-center space-x-0.5">
                          {[1, 2, 3, 4, 5].map((starVal) => (
                            <button
                              key={starVal}
                              type="button"
                              disabled={!canEdit}
                              onClick={() => handleSetSkillScore(mType, starVal)}
                              className={`p-1 rounded-md transition-all ${
                                canEdit ? "hover:scale-125 cursor-pointer" : "cursor-default"
                              }`}
                              title={`Beri rating ${starVal} untuk mesin ${mType}`}
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  starVal <= numScore
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-slate-300 fill-slate-100"
                                }`}
                              />
                            </button>
                          ))}
                        </div>

                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMachineFromSkills(mType)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            title="Hapus mesin dari matrix"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Add New Machine to Matrix */}
            {canEdit && (
              <div className="pt-2 border-t border-slate-100">
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Tambahkan Jenis Mesin Baru ke Matrix Operator:
                </label>
                <div className="flex items-center space-x-2">
                  <select
                    value={newMachineInput}
                    onChange={(e) => setNewMachineInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 text-xs outline-none"
                  >
                    <option value="">-- Pilih Jenis Mesin Sewing --</option>
                    {COMMON_SEWING_MACHINES.filter(
                      (m) => !Object.keys(tempSkills).includes(m.split(" ")[0])
                    ).map((m) => (
                      <option key={m} value={m.split(" ")[0]}>
                        {m}
                      </option>
                    ))}
                    <option value="CUSTOM">+ Ketik Jenis Mesin Khusus...</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleAddMachineToSkills}
                    disabled={!newMachineInput}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingSkillOp(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Tutup
              </button>
              {canEdit && (
                <button
                  type="button"
                  onClick={handleSaveSkillMatrix}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Skill Matrix</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MATRIKS KEMAMPUAN 10 PRODUK GARMEN & PENENTUAN GRADING OPERATOR    */}
      {/* ========================================================================= */}
      {editingProductOp && (() => {
        const liveGrading = calculateProductBasedGrading(tempProductCaps);
        const liveBadge = getGradeBadge(liveGrading.grade);

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 shrink-0">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Shirt className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base sm:text-lg font-extrabold text-slate-900">
                        Matriks Kemampuan Produk Garmen & Penentuan Grading
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      Operator: <strong className="text-slate-800">{editingProductOp.name}</strong> ({editingProductOp.nik}) &bull; Line {lineId}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingProductOp(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="space-y-4 overflow-y-auto pr-1">
                {/* Live Real-Time Calculated Grade Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white shadow-md border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-slate-300">
                        HASIL REKOMENDASI GRADING IE:
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${liveBadge.lightBg} ${liveBadge.text} border ${liveBadge.border}`}>
                        Grade {liveGrading.grade}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-slate-200">
                      {liveGrading.reason}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-300">
                      <div className="flex items-center space-x-1.5">
                        <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Total Dikuasai: <strong className="text-white font-mono">{liveGrading.masteredCount} / 10 Produk</strong></span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Award className="w-3.5 h-3.5 text-purple-400" />
                        <span>Kesulitan Tinggi: <strong className="text-white font-mono">{liveGrading.highComplexityCount} / 4</strong> (Jas, Blazer, Wearpack, Jaket)</span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-700 pt-2 sm:pt-0 sm:pl-4">
                    <div className="text-[10px] text-slate-400 font-mono">STATUS EVALUASI</div>
                    <div className="text-2xl font-black font-mono text-emerald-400">
                      {liveGrading.masteredCount >= 6 ? "AHLI" : liveGrading.masteredCount >= 4 ? "TERAMPIL" : liveGrading.masteredCount >= 2 ? "STANDAR" : "PEMBINAAN"}
                    </div>
                  </div>
                </div>

                {/* Quick Presets */}
                {canEdit && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Preset Cepat Berdasarkan Pola Kemampuan:</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Klik untuk menerapkan profil standar</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleApplyProductPreset("all")}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-slate-700 hover:text-emerald-700 text-[11px] font-semibold transition-all shadow-2xs"
                      >
                        🌟 Universal Master (Semua 10 Produk &rarr; Grade A)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyProductPreset("tailoring_a")}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-purple-500 text-slate-700 hover:text-purple-700 text-[11px] font-semibold transition-all shadow-2xs"
                      >
                        👔 Spesialis Tailoring (Jas, Blazer, Jaket &rarr; Grade A)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyProductPreset("multi_b")}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-blue-500 text-slate-700 hover:text-blue-700 text-[11px] font-semibold transition-all shadow-2xs"
                      >
                        👕 Multi-Produk Standar (5 Produk &rarr; Grade B)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyProductPreset("basic_c")}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-amber-500 text-slate-700 hover:text-amber-700 text-[11px] font-semibold transition-all shadow-2xs"
                      >
                        👖 Produk Dasar (Kemeja, Celana &rarr; Grade C)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyProductPreset("reset")}
                        className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-rose-500 text-slate-500 hover:text-rose-600 text-[11px] font-semibold transition-all shadow-2xs"
                      >
                        🔄 Reset Kosong
                      </button>
                    </div>
                  </div>
                )}

                {/* 10 Garment Products Matrix List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
                      <span>Daftar 10 Jenis Produk Garmen & Level Kompetensi:</span>
                    </h4>
                    <span className="text-[10px] text-slate-500">Skor &ge; 3 dihitung sebagai "Menguasai"</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {GARMENT_PRODUCTS_CONFIG.map((pConfig) => {
                      const currentScore = tempProductCaps[pConfig.name] || 0;
                      const isMastered = currentScore >= 3;
                      const isHighComplexity = pConfig.difficulty === "Tinggi";

                      return (
                        <div
                          key={pConfig.name}
                          className={`p-3 rounded-2xl border transition-all ${
                            isMastered
                              ? isHighComplexity
                                ? "bg-purple-50/60 border-purple-200 shadow-xs"
                                : "bg-blue-50/50 border-blue-200 shadow-xs"
                              : "bg-slate-50/50 border-slate-200 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center space-x-1.5">
                                <span className="font-extrabold text-xs text-slate-900">{pConfig.name}</span>
                                {isHighComplexity ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                    Tingkat Tinggi
                                  </span>
                                ) : pConfig.difficulty === "Menengah" ? (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                    Menengah
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-200/80 text-slate-700">
                                    Dasar
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                {pConfig.description}
                              </div>
                            </div>

                            {/* Quick Toggle Button */}
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => handleToggleProductMastery(pConfig.name)}
                                className={`shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center space-x-1 shadow-2xs ${
                                  isMastered
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                {isMastered ? <Check className="w-3 h-3" /> : null}
                                <span>{isMastered ? "Dikuasai" : "Belum"}</span>
                              </button>
                            )}
                          </div>

                          {/* Detail Level Selector (0 - 5) */}
                          <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {currentScore === 5
                                ? "5: Ahli / Trainer"
                                : currentScore === 4
                                ? "4: Mahir (Cepat)"
                                : currentScore === 3
                                ? "3: Mandiri (Standar)"
                                : currentScore === 2
                                ? "2: Bimbingan"
                                : currentScore === 1
                                ? "1: Training"
                                : "0: Belum Pernah"}
                            </span>

                            <div className="flex items-center space-x-1">
                              {[0, 1, 2, 3, 4, 5].map((lvl) => (
                                <button
                                  key={lvl}
                                  type="button"
                                  disabled={!canEdit}
                                  onClick={() => handleSetProductRating(pConfig.name, lvl)}
                                  className={`w-6 h-6 rounded-lg text-[10px] font-mono font-bold transition-all ${
                                    currentScore === lvl
                                      ? lvl >= 3
                                        ? "bg-blue-600 text-white shadow-2xs scale-105"
                                        : "bg-slate-800 text-white"
                                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                                  }`}
                                  title={`Tingkat ${lvl} untuk ${pConfig.name}`}
                                >
                                  {lvl}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Industrial Engineering Informational Box */}
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-start space-x-2.5 text-xs text-blue-950">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed text-[11px]">
                    <strong>Ketentuan Standar IE:</strong> Penentuan <strong>Grade A</strong> membutuhkan penguasaan minimal 6 produk dengan salah satu produk kompleksitas tinggi (Jas, Blazer, Wearpack, Jaket) atau menguasai minimal 8 produk umum. Operator <strong>Grade B</strong> menguasai 4–7 produk standar. Operator <strong>Grade C</strong> menguasai 2–3 produk dasar. Operator yang hanya menguasai &le;1 produk dikelompokkan ke <strong>Grade D</strong> (pembinaan).
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
                <div className="text-xs text-slate-500">
                  Perubahan akan otomatis memperbarui <strong className="text-slate-800">Grade & Skill Operator</strong>.
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingProductOp(null)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={handleSaveProductMatrix}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Simpan & Terapkan Grade ({liveGrading.grade})</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* MODAL 2: TAMBAH OPERATOR BARU KE LINE                                     */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                  Manpower Entry
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Tambah Operator Baru &bull; Line {lineId}
                </h3>
                <p className="text-xs text-slate-500">
                  Total saat ini: {total} operator.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddOperatorSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">NIK Operator:</label>
                  <input
                    type="text"
                    required
                    value={newOpForm.nik}
                    onChange={(e) => setNewOpForm({ ...newOpForm, nik: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nama Lengkap Operator:</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Siti Rahmawati"
                    value={newOpForm.name}
                    onChange={(e) => setNewOpForm({ ...newOpForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Grade Operator:</label>
                  <select
                    value={newOpForm.grade}
                    onChange={(e) =>
                      setNewOpForm({ ...newOpForm, grade: e.target.value as OperatorGrade })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-bold"
                  >
                    <option value="A">Grade A (Ahli &ge;90%)</option>
                    <option value="B">Grade B (Terampil 80-89%)</option>
                    <option value="C">Grade C (Menengah 65-79%)</option>
                    <option value="D">Grade D (Pembinaan &lt;65%)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Efisiensi Rata-rata (%):</label>
                  <input
                    type="number"
                    min={30}
                    max={150}
                    value={newOpForm.efficiency}
                    onChange={(e) =>
                      setNewOpForm({ ...newOpForm, efficiency: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Defect Rate (%):</label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={30}
                    value={newOpForm.defectRate}
                    onChange={(e) =>
                      setNewOpForm({ ...newOpForm, defectRate: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Keahlian Mesin Utama:</label>
                  <select
                    value={newOpForm.machineType}
                    onChange={(e) => setNewOpForm({ ...newOpForm, machineType: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                  >
                    <option value="SN">SN (Single Needle Lockstitch)</option>
                    <option value="DN">DN (Double Needle)</option>
                    <option value="OL">OL (Overlock / Obras)</option>
                    <option value="Overdeck">Overdeck / Interlock</option>
                    <option value="Bartack">Bartack</option>
                    <option value="Kansai">Kansai / Multi-Needle</option>
                    <option value="Ironing">Ironing / Press</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Proses Spesialisasi:</label>
                  <input
                    type="text"
                    placeholder="Contoh: Jahit Kerah / Hemming"
                    value={newOpForm.primarySkill}
                    onChange={(e) => setNewOpForm({ ...newOpForm, primarySkill: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Kehadiran Awal:</label>
                <select
                  value={newOpForm.attendanceStatus}
                  onChange={(e) =>
                    setNewOpForm({
                      ...newOpForm,
                      attendanceStatus: e.target.value as AttendanceStatus,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-bold"
                >
                  <option value="HADIR">HADIR (Siap dialokasikan ke stasiun sewing)</option>
                  <option value="SAKIT">SAKIT (Surat Dokter)</option>
                  <option value="IZIN">IZIN (Keperluan Pribadi)</option>
                  <option value="CUTI">CUTI</option>
                  <option value="ALPHA">ALPHA</option>
                </select>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambahkan Operator</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: KONFIRMASI HAPUS OPERATOR                                        */}
      {/* ========================================================================= */}
      {operatorToDelete && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-slate-900">Hapus Operator?</h3>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus operator{" "}
                <strong className="text-slate-800">{operatorToDelete.name}</strong> ({operatorToDelete.nik}) dari daftar Line {lineId}?
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setOperatorToDelete(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT KEHADIRAN / PROFIL OPERATOR                                  */}
      {/* ========================================================================= */}
      {editingOperator && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                  Update Kehadiran & Profil
                </span>
                <h3 className="text-base font-bold text-slate-900">{editingOperator.name}</h3>
                <div className="text-xs text-slate-400 font-mono">{editingOperator.nik}</div>
              </div>
              <button
                onClick={() => setEditingOperator(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Kehadiran Hari Ini:</label>
                <select
                  value={editingOperator.attendanceStatus}
                  onChange={(e) =>
                    setEditingOperator({
                      ...editingOperator,
                      attendanceStatus: e.target.value as AttendanceStatus,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                >
                  <option value="HADIR">HADIR (Tersedia untuk alokasi line)</option>
                  <option value="SAKIT">SAKIT (Surat Dokter / Klinik)</option>
                  <option value="IZIN">IZIN (Keperluan Pribadi / Keluarga)</option>
                  <option value="CUTI">CUTI (Cuti Tahunan / Melahirkan)</option>
                  <option value="ALPHA">ALPHA (Tanpa Pemberitahuan)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan / Alasan:</label>
                <input
                  type="text"
                  value={editingOperator.attendanceNotes || ""}
                  onChange={(e) =>
                    setEditingOperator({
                      ...editingOperator,
                      attendanceNotes: e.target.value,
                    })
                  }
                  placeholder="Contoh: Sakit tipes / Izin keluarga..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none"
                />
              </div>

              {/* Editing Grade, Efficiency, and Defect for Admin & PE */}
              {canEdit && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Pengaturan Kinerja & Grading:</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Grade:</label>
                      <select
                        value={editingOperator.grade}
                        onChange={(e) =>
                          setEditingOperator({
                            ...editingOperator,
                            grade: e.target.value as OperatorGrade,
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="A">Grade A</option>
                        <option value="B">Grade B</option>
                        <option value="C">Grade C</option>
                        <option value="D">Grade D</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Efisiensi (%):</label>
                      <input
                        type="number"
                        value={editingOperator.efficiency}
                        onChange={(e) =>
                          setEditingOperator({
                            ...editingOperator,
                            efficiency: Number(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Defect (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingOperator.defectRate}
                        onChange={(e) =>
                          setEditingOperator({
                            ...editingOperator,
                            defectRate: Number(e.target.value),
                          })
                        }
                        className="w-full px-2 py-1.5 border border-slate-200 rounded-lg font-mono text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const opToEdit = editingOperator;
                      setEditingOperator(null);
                      handleOpenProductMatrix(opToEdit);
                    }}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold border border-blue-200 flex items-center justify-center space-x-2 transition-colors"
                  >
                    <Shirt className="w-4 h-4 text-blue-600" />
                    <span>Buka Evaluasi 10 Produk Garmen (Auto-Grading)</span>
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingOperator(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onUpdateOperatorAttendance(
                    editingOperator.id,
                    editingOperator.attendanceStatus,
                    editingOperator.attendanceNotes
                  );
                  if (onUpdateOperatorDetails) {
                    onUpdateOperatorDetails(editingOperator.id, {
                      grade: editingOperator.grade,
                      efficiency: editingOperator.efficiency,
                      defectRate: editingOperator.defectRate,
                    });
                  }
                  setEditingOperator(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
