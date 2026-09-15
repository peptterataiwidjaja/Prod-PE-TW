import React, { useState } from "react";
import {
  HourlyProductionRow,
  StyleMetadata,
  LineProductionData,
  Operator,
  User,
} from "../types";
import {
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  Plus,
  Minus,
  Download,
  Flame,
  Award,
  Settings,
  Clock,
  Edit2,
  Lock,
  Printer,
  Calendar,
  Users,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Zap,
  Check,
  TrendingDown,
  Layers,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { exportProductionSheetToExcel } from "../utils/excelParser";
import { getGradeBadge } from "../utils/grading";
import {
  formatIndoDate,
  formatIndoDateWithDay,
  offsetDate,
} from "../utils/dateUtils";

interface HourlyProductionSheetProps {
  metadata: StyleMetadata;
  lineData: LineProductionData;
  operators: Operator[];
  currentUser: User;
  workSchedule?: "senin_jumat" | "sabtu";
  onToggleWorkSchedule?: (schedule: "senin_jumat" | "sabtu") => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  onClearLineHourlyData?: () => void;
  onApplyDoubleJob?: (stationNo: number, candidateOpName: string, originStationNo: number) => void;
  onApplyTandem?: (stationNo: number, op1Name: string, op2Name: string) => void;
  onUpdateHourlyOutput: (
    processNo: number,
    hourIndex: number,
    newActual: number,
    newDefect: number
  ) => void;
  onUpdateRowDefects?: (processNo: number, newDefects: number) => void;
  onUpdateProcessAssignment?: (
    processNo: number,
    operatorName: string,
    machineName: string
  ) => void;
  onOpenPrintReport?: () => void;
  onUpdateSewingSchedule?: (date: string, days: string) => void;
  onNavigateToAttendance?: () => void;
  onOpenGoogleScript?: () => void;
  isGoogleScriptConnected?: boolean;
}

export const HourlyProductionSheet: React.FC<HourlyProductionSheetProps> = ({
  metadata,
  lineData,
  operators,
  currentUser,
  workSchedule = "senin_jumat",
  onToggleWorkSchedule,
  selectedDate,
  onSelectDate,
  onClearLineHourlyData,
  onApplyDoubleJob,
  onApplyTandem,
  onUpdateHourlyOutput,
  onUpdateRowDefects,
  onUpdateProcessAssignment,
  onOpenPrintReport,
  onUpdateSewingSchedule,
  onNavigateToAttendance,
  onOpenGoogleScript,
  isGoogleScriptConnected = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [editingCell, setEditingCell] = useState<{ processNo: number; hourIndex: number } | null>(null);
  const [editingDefectRow, setEditingDefectRow] = useState<number | null>(null);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Edit process assignment modal
  const [adjustingProcess, setAdjustingProcess] = useState<{
    no: number;
    process: string;
    section: string;
    machine: string;
    operatorName: string;
  } | null>(null);

  // Quick batch hour input modal
  const [batchHourModal, setBatchHourModal] = useState<number | null>(null);

  // Check authorization
  const canEditCurrentLine =
    currentUser.role === "production_engineer" ||
    currentUser.assignedLine === lineData.lineId;

  // Active working hours: 5 for Saturday, 8 for Mon-Fri
  const activeWorkingHours = workSchedule === "sabtu" ? 5 : 8;

  // Derive unique sections
  const sections = ["ALL", ...Array.from(new Set(lineData.rows.map((r) => r.section)))];

  // Attendance metrics for this line
  const totalOps = operators.length;
  const hadirOps = operators.filter((o) => o.attendanceStatus === "HADIR").length;
  const absentOps = totalOps - hadirOps;

  // Filter rows
  const filteredRows = lineData.rows.filter((row) => {
    const matchesSearch =
      row.process.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.operatorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.machine.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.no.toString().includes(searchTerm);

    const matchesSection = selectedSection === "ALL" || row.section === selectedSection;

    return matchesSearch && matchesSection;
  });

  // Calculate totals
  const totalActualSum = lineData.rows.reduce((sum, r) => sum + r.totalActual, 0);
  const totalTargetSum = lineData.rows.reduce((sum, r) => sum + r.target, 0);
  const totalBalanceSum = lineData.rows.reduce((sum, r) => sum + r.balanceTarget, 0);
  const totalDefectsSum = lineData.rows.reduce((sum, r) => sum + r.totalDefects, 0);
  const bottlenecksCount = lineData.rows.filter((r) => r.status === "bottleneck").length;
  const unassignedCount = lineData.rows.filter((r) => r.status === "unassigned").length;

  // Real-time Bottleneck Detection & Solution Analysis from Hour Control Data
  const bottleneckAnalysis = React.useMemo(() => {
    // 1. Identify rows with bottlenecks from hour control
    // Conditions:
    // - Unassigned (operator absent)
    // - Severe deficit (actual < target * 0.5 when totalActualSum > 0)
    // - Cycle time > takt time
    // - High defect rate (> 5%)
    const problematicStations = lineData.rows.filter((r) => {
      const isAbsent = r.operatorAttendance !== "HADIR" || r.status === "unassigned";
      const isBottleneck = r.status === "bottleneck";
      const isSeverelyLagging = totalActualSum > 50 && r.totalActual < (r.target * 0.6);
      return isAbsent || isBottleneck || isSeverelyLagging;
    });

    // 2. Find eligible present operators for Double Job (sorted by smallest primary SMV)
    const presentOpsWithSMV = lineData.rows
      .filter((r) => r.operatorAttendance === "HADIR" && !r.isDoubleJob && r.status !== "unassigned")
      .map((r) => ({
        operatorName: r.operatorName,
        stationNo: r.no,
        process: r.process,
        smv: r.smv,
      }))
      .sort((a, b) => a.smv - b.smv);

    return {
      problematicStations,
      smallestSMVOperators: presentOpsWithSMV,
      isFreshState: totalActualSum === 0,
    };
  }, [lineData.rows, totalActualSum]);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // Active Running Process Date Handling
  const activeDate = selectedDate || lineData.date || "2026-09-14";

  const todayStr = React.useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  const isToday = activeDate === todayStr;

  const handleDateChange = (newDate: string) => {
    if (!newDate) return;
    if (onSelectDate) {
      onSelectDate(newDate);
    }
    showNotification(`Tanggal proses dialihkan ke: ${formatIndoDateWithDay(newDate)}`);
  };

  const handlePrevDay = () => {
    const prev = offsetDate(activeDate, -1);
    handleDateChange(prev);
  };

  const handleNextDay = () => {
    const next = offsetDate(activeDate, 1);
    handleDateChange(next);
  };

  const handleSetToday = () => {
    handleDateChange(todayStr);
  };

  const handleSetYesterday = () => {
    const yesterday = offsetDate(todayStr, -1);
    handleDateChange(yesterday);
  };

  // Check day of week for activeDate
  const activeDateObj = new Date(activeDate + "T00:00:00");
  const dayOfWeek = !isNaN(activeDateObj.getTime()) ? activeDateObj.getDay() : 1;
  const isSaturday = dayOfWeek === 6;
  const isSunday = dayOfWeek === 0;

  return (
    <div className="space-y-6">
      {/* Attendance & Status Alert Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
            L{lineData.lineId}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                Hourly Production Control &bull; Sewing Line {lineData.lineId}
              </h2>
              <span className="text-[11px] px-2 py-0.5 rounded-md font-mono font-semibold bg-slate-100 text-slate-700">
                F-SEW-005-00
              </span>
              {workSchedule === "sabtu" ? (
                <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  Sabtu (5 Jam)
                </span>
              ) : (
                <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-blue-100 text-blue-900 border border-blue-200">
                  Senin - Jumat (8 Jam)
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-3">
              <span>Supervisor: <strong className="text-slate-700">{lineData.supervisor}</strong></span>
              <span>QC: <strong className="text-slate-700">{lineData.qcInspector}</strong></span>
              <span className="flex items-center space-x-1.5 font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Tanggal:</span>
                <input
                  type="date"
                  value={activeDate}
                  onChange={(e) => {
                    if (e.target.value) handleDateChange(e.target.value);
                  }}
                  className="font-mono text-xs font-bold text-blue-700 bg-white hover:bg-slate-50 px-1.5 py-0.5 rounded cursor-pointer border border-slate-300 shadow-2xs"
                  title="Pilih tanggal proses yang berjalan"
                />
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Work Schedule Toggle */}
          {onToggleWorkSchedule && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => onToggleWorkSchedule("senin_jumat")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  workSchedule === "senin_jumat"
                    ? "bg-white text-blue-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Senin - Jumat (8 Jam Kerja, Target 80 Pcs)"
              >
                Sen-Jum (8h)
              </button>
              <button
                onClick={() => onToggleWorkSchedule("sabtu")}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  workSchedule === "sabtu"
                    ? "bg-white text-amber-800 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
                title="Sabtu (5 Jam Kerja, Target 50 Pcs)"
              >
                Sabtu (5h)
              </button>
            </div>
          )}

          {/* Attendance status counter button */}
          <button
            onClick={onNavigateToAttendance}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center space-x-2 ${
              absentOps > 0
                ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
            }`}
            title="Buka panel Attendance & Grading Operator"
          >
            <Users className="w-4 h-4" />
            <span>
              Presensi: <strong>{hadirOps}</strong>/{totalOps} Hadir
              {absentOps > 0 && ` (${absentOps} Absen)`}
            </span>
          </button>

          {/* Clear Inputted Data Button */}
          {canEditCurrentLine && onClearLineHourlyData && (
            <button
              onClick={() => setIsClearConfirmOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center space-x-1.5 transition-colors"
              title="Kosongkan seluruh data jam yang sudah terinput"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Kosongkan Data Jam</span>
            </button>
          )}

          {/* Print Hourly Control Sheet (F-SEW-005) */}
          {onOpenPrintReport && (
            <button
              id="btn-print-hourly-control"
              onClick={onOpenPrintReport}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
              title="Cetak Lembar Hourly Production Control (F-SEW-005)"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print F-SEW-005</span>
            </button>
          )}

          {/* Google Spreadsheet & Apps Script Button */}
          {onOpenGoogleScript && (
            <button
              id="btn-open-google-script-hourly"
              onClick={onOpenGoogleScript}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors border ${
                isGoogleScriptConnected
                  ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300"
              }`}
              title="Kirim atau sinkronkan data jam-jaman ke Google Spreadsheet via Google Apps Script"
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${isGoogleScriptConnected ? "text-emerald-600" : "text-slate-500"}`} />
              <span>Google Script</span>
              {isGoogleScriptConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </button>
          )}

          <button
            onClick={() => exportProductionSheetToExcel(metadata, lineData.lineId, lineData.rows)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* PANEL OPSI PEMILIHAN TANGGAL PROSES YANG BERJALAN                         */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-blue-200/90 shadow-xs p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-gradient-to-r from-blue-50/60 via-white to-slate-50">
        {/* Left: Active Date Status & Details */}
        <div className="flex items-start sm:items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0 mt-0.5 sm:mt-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                Opsi Pemilihan Tanggal Proses yang Berjalan:
              </span>
              {isToday ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>SEDANG BERJALAN AKTIF (HARI INI)</span>
                </span>
              ) : isSaturday ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>JADWAL SABTU (5 JAM KERJA)</span>
                </span>
              ) : isSunday ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                  <AlertCircle className="w-3 h-3 text-rose-600" />
                  <span>HARI MINGGU (LIBUR / OVERTIME)</span>
                </span>
              ) : activeDate < todayStr ? (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  <span>ARSIP / REKAP HISTORIS</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                  <Calendar className="w-3 h-3 text-purple-600" />
                  <span>JADWAL PRODUKSI MENDATANG</span>
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="text-base sm:text-xl font-black text-slate-900">
                {formatIndoDateWithDay(activeDate)}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                (Shift: <strong>{workSchedule === "sabtu" ? "Sabtu (5 Jam)" : "Senin - Jumat (8 Jam)"}</strong> &bull; Target: <strong className="text-blue-700">{activeWorkingHours * 10} Pcs/Hari</strong>)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Date Picker Controls & Quick Stepper Presets */}
        <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
          {/* Stepper with Previous & Next */}
          <div className="flex items-center bg-white p-1 rounded-xl border border-slate-300 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevDay}
              className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-1 transition-all"
              title="Pindah ke hari sebelumnya (H-1)"
            >
              <ChevronLeft className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">H-1</span>
            </button>

            <div className="flex items-center px-2 border-x border-slate-200">
              <input
                type="date"
                value={activeDate}
                onChange={(e) => {
                  if (e.target.value) handleDateChange(e.target.value);
                }}
                className="font-mono text-xs font-bold text-blue-700 bg-blue-50/50 hover:bg-blue-50 focus:bg-white px-2 py-1 rounded-lg border border-blue-200 outline-none cursor-pointer"
                title="Klik untuk memilih tanggal proses dari kalender"
              />
            </div>

            <button
              type="button"
              onClick={handleNextDay}
              className="px-2.5 py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center space-x-1 transition-all"
              title="Pindah ke hari berikutnya (H+1)"
            >
              <span className="hidden sm:inline">H+1</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleSetToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                isToday
                  ? "bg-blue-600 text-white shadow-xs ring-2 ring-blue-300"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-blue-400"
              }`}
              title="Setel ke tanggal hari ini"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={handleSetYesterday}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all shadow-2xs"
              title="Setel ke tanggal kemarin"
            >
              Kemarin
            </button>
          </div>

          {/* Prompt switch to Saturday schedule if Saturday is selected */}
          {isSaturday && workSchedule !== "sabtu" && onToggleWorkSchedule && (
            <button
              type="button"
              onClick={() => onToggleWorkSchedule("sabtu")}
              className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white flex items-center space-x-1 animate-pulse shadow-xs"
              title="Tanggal yang dipilih adalah hari Sabtu, klik untuk beralih ke jadwal 5 Jam"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Ganti Shift Sabtu (5h)</span>
            </button>
          )}
        </div>
      </div>

      {actionSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Warning banner if there are unassigned stations due to absent operators */}
      {unassignedCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2 flex items-center justify-between text-rose-900 text-xs">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Perhatian:</strong> {unassignedCount} stasiun kerja belum terisi operator. Gunakan saran Double Job di bawah tabel.
            </span>
          </div>
          {onNavigateToAttendance && (
            <button
              onClick={onNavigateToAttendance}
              className="text-[11px] font-bold text-rose-700 underline hover:text-rose-900 shrink-0 ml-2"
            >
              Atur Presensi
            </button>
          )}
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Aktual Line</span>
          <div className="text-xl font-mono font-extrabold text-blue-700 mt-1">{totalActualSum} pcs</div>
          <span className="text-[10px] text-slate-500">Kumulatif 26 proses</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Target</span>
          <div className="text-xl font-mono font-extrabold text-slate-800 mt-1">{totalTargetSum} pcs</div>
          <span className="text-[10px] text-slate-500">
            {activeWorkingHours} Jam &times; 10 Pcs/Jam
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Balance Target</span>
          <div
            className={`text-xl font-mono font-extrabold mt-1 ${
              totalBalanceSum >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {totalBalanceSum >= 0 ? `+${totalBalanceSum}` : totalBalanceSum} pcs
          </div>
          <span className="text-[10px] text-slate-500">
            {totalBalanceSum >= 0 ? "Surplus / On Target" : "Defisit Produksi"}
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Defect</span>
          <div className="text-xl font-mono font-extrabold text-rose-600 mt-1">{totalDefectsSum} pcs</div>
          <span className="text-[10px] text-slate-500">
            Rate: {totalActualSum > 0 ? ((totalDefectsSum / totalActualSum) * 100).toFixed(1) : 0}%
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Titik Bottleneck</span>
          <div className="text-xl font-mono font-extrabold text-amber-600 mt-1 flex items-center space-x-1">
            <span>{bottlenecksCount}</span>
            {bottlenecksCount > 0 && <Flame className="w-4 h-4 text-red-500" />}
          </div>
          <span className="text-[10px] text-slate-500">Stasiun penghambat</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Kehadiran Hari Ini</span>
          <div className="text-xl font-mono font-extrabold text-emerald-600 mt-1">
            {totalOps > 0 ? Math.round((hadirOps / totalOps) * 100) : 0}%
          </div>
          <span className="text-[10px] text-slate-500">{hadirOps} dari 26 operator</span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Section Filter */}
          <div className="flex items-center space-x-2 text-xs">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-700">Section:</span>
            <div className="flex flex-wrap gap-1">
              {sections.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSection(sec)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    selectedSection === sec
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari proses, operator, mesin..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-400 transition-colors"
          />
        </div>
      </div>

      {/* Main Hourly Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-2 text-center w-10">No</th>
                <th className="py-3 px-3 min-w-[150px]">Nama Proses</th>
                <th className="py-3 px-2 text-center w-20">Mesin</th>
                <th className="py-3 px-2 text-center w-14">SMV</th>
                <th className="py-3 px-3 min-w-[130px]">Operator</th>
                <th className="py-3 px-2 text-center w-14">Target</th>

                {/* Jam 1 s/d Jam 8 */}
                {[1, 2, 3, 4, 5, 6, 7, 8].map((hr) => {
                  const isOffSchedule = hr > activeWorkingHours;
                  return (
                    <th
                      key={hr}
                      className={`py-3 px-1 text-center w-14 border-l border-slate-200 ${
                        isOffSchedule ? "bg-slate-100/80 text-slate-400" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>Jam {hr}</span>
                        {isOffSchedule ? (
                          <span className="text-[8px] font-normal text-amber-600">Luar Jam</span>
                        ) : (
                          canEditCurrentLine && (
                            <button
                              onClick={() => setBatchHourModal(hr)}
                              className="text-[9px] text-blue-600 hover:underline font-normal cursor-pointer"
                              title={`Isi massal jam ke-${hr}`}
                            >
                              Isi Cepat
                            </button>
                          )
                        )}
                      </div>
                    </th>
                  );
                })}

                <th className="py-3 px-2 text-center w-20 bg-blue-100/90 text-blue-950 border-l border-blue-200">
                  <div className="flex flex-col items-center">
                    <span className="font-extrabold text-[10px]">DEFECT</span>
                    <span className="text-[8px] font-mono font-bold text-blue-700 bg-white/80 px-1 rounded shadow-xs">
                      ∑ Jam 1-8
                    </span>
                  </div>
                </th>
                <th className="py-3 px-2 text-center w-16 text-rose-700 bg-rose-50/70 border-l border-rose-100">
                  <div className="flex flex-col items-center">
                    <span className="font-extrabold text-[10px] text-rose-800">TOTAL</span>
                    <span className="text-[8px] font-bold text-rose-600 bg-rose-100 px-1 py-0.2 rounded">
                      Manual
                    </span>
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[140px]">Status & Keterangan</th>
                <th className="py-3 px-2 text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map((row) => {
                const gradeBadge = getGradeBadge(row.operatorGrade);
                const isUnassigned = row.status === "unassigned";
                const isBottleneck = row.status === "bottleneck";
                const isDoubleJob = row.isDoubleJob;
                const isTandem = row.isTandem;
                // Sum of hourly actuals strictly for Jam 1 to Jam 8
                const rowTotalActual = row.hourlyActual.slice(0, 8).reduce((acc, val) => acc + (Number(val) || 0), 0);

                return (
                  <tr
                    key={row.no}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isUnassigned
                        ? "bg-rose-50/50"
                        : isDoubleJob
                        ? "bg-amber-50/40"
                        : isTandem
                        ? "bg-indigo-50/30"
                        : isBottleneck
                        ? "bg-amber-50/30"
                        : ""
                    }`}
                  >
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-500">
                      {row.no}
                    </td>

                    <td className="py-2 px-3">
                      <div className="font-bold text-slate-900">{row.process}</div>
                      <div className="text-[10px] text-slate-400">{row.section}</div>
                    </td>

                    <td className="py-2 px-2 text-center">
                      <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {row.machine}
                      </span>
                    </td>

                    <td className="py-2 px-2 text-center font-mono text-slate-600">
                      {row.smv}m
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`font-semibold ${
                            isUnassigned ? "text-rose-600 font-bold" : "text-slate-800"
                          }`}
                        >
                          {row.operatorName}
                        </span>
                        {gradeBadge && (
                          <span
                            className={`text-[9px] font-bold px-1 py-0.2 rounded ${gradeBadge.lightBg} ${gradeBadge.text}`}
                          >
                            {row.operatorGrade}
                          </span>
                        )}
                      </div>
                      {isDoubleJob && (
                        <span className="text-[9px] text-amber-700 font-bold bg-amber-100 px-1 py-0.2 rounded mt-0.5 inline-block">
                          Double Job (Cover)
                        </span>
                      )}
                      {isTandem && (
                        <span className="text-[9px] text-indigo-700 font-bold bg-indigo-100 px-1 py-0.2 rounded mt-0.5 inline-block">
                          Tandem (2 Op)
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-700">
                      {row.target}
                    </td>

                    {/* Hourly inputs */}
                    {row.hourlyActual.map((act, hIdx) => {
                      const isEditing =
                        editingCell?.processNo === row.no && editingCell?.hourIndex === hIdx;
                      const isOffSchedule = hIdx + 1 > activeWorkingHours;

                      return (
                        <td
                          key={hIdx}
                          className={`py-1 px-1 text-center font-mono border-l border-slate-100 ${
                            isOffSchedule ? "bg-slate-50 text-slate-400" : ""
                          }`}
                        >
                          {isEditing ? (
                            <input
                              type="number"
                              defaultValue={act}
                              autoFocus
                              onBlur={(e) => {
                                const val = parseInt(e.target.value, 10) || 0;
                                onUpdateHourlyOutput(row.no, hIdx, val, row.hourlyDefects[hIdx] || 0);
                                setEditingCell(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const val = parseInt((e.target as HTMLInputElement).value, 10) || 0;
                                  onUpdateHourlyOutput(row.no, hIdx, val, row.hourlyDefects[hIdx] || 0);
                                  setEditingCell(null);
                                }
                              }}
                              className="w-10 text-center py-1 border border-blue-500 rounded bg-white font-bold outline-none"
                            />
                          ) : (
                            <div
                              onClick={() => {
                                if (canEditCurrentLine) {
                                  setEditingCell({ processNo: row.no, hourIndex: hIdx });
                                }
                              }}
                              className={`py-1 rounded cursor-pointer transition-colors ${
                                canEditCurrentLine ? "hover:bg-blue-50" : ""
                              } ${
                                act === 0 && !isOffSchedule && row.totalActual > 0
                                  ? "text-rose-500 font-bold bg-rose-50/60"
                                  : "text-slate-800"
                              }`}
                            >
                              {act}
                            </div>
                          )}
                        </td>
                      );
                    })}

                    {/* DEFECT (∑ Jam 1-8) */}
                    <td
                      className="py-2 px-2 text-center font-mono font-black bg-blue-50/70 text-blue-950 border-l border-blue-200"
                      title={`DEFECT (∑ Jam 1-8): ${rowTotalActual} pcs`}
                    >
                      {rowTotalActual}
                    </td>

                    {/* TOTAL (Manual Input) */}
                    <td className="py-2 px-1 text-center font-mono font-bold text-rose-600 border-l border-rose-100 bg-rose-50/20">
                      {editingDefectRow === row.no ? (
                        <input
                          type="number"
                          min="0"
                          defaultValue={row.totalDefects || 0}
                          autoFocus
                          onBlur={(e) => {
                            const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                            if (onUpdateRowDefects) {
                              onUpdateRowDefects(row.no, val);
                            }
                            setEditingDefectRow(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = Math.max(0, parseInt((e.target as HTMLInputElement).value, 10) || 0);
                              if (onUpdateRowDefects) {
                                onUpdateRowDefects(row.no, val);
                              }
                              setEditingDefectRow(null);
                            } else if (e.key === "Escape") {
                              setEditingDefectRow(null);
                            }
                          }}
                          className="w-12 text-center py-0.5 border-2 border-rose-500 rounded bg-white text-rose-700 font-bold outline-none shadow-xs mx-auto block"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (canEditCurrentLine) {
                              setEditingDefectRow(row.no);
                            }
                          }}
                          disabled={!canEditCurrentLine}
                          className={`w-full py-1 px-1 rounded flex items-center justify-center space-x-1 group transition-colors ${
                            canEditCurrentLine
                              ? "cursor-pointer hover:bg-rose-100/70 border border-transparent hover:border-rose-300"
                              : "cursor-default border border-transparent"
                          }`}
                          title={
                            canEditCurrentLine
                              ? "Klik untuk memasukkan TOTAL secara manual"
                              : "Hanya Admin Line / PE yang dapat mengubah TOTAL"
                          }
                        >
                          <span
                            className={`font-mono font-bold text-xs ${
                              (row.totalDefects || 0) > 0 ? "text-rose-600 font-black" : "text-slate-400"
                            }`}
                          >
                            {row.totalDefects || 0}
                          </span>
                          {canEditCurrentLine && (
                            <Edit2 className="w-2.5 h-2.5 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      )}
                    </td>

                    {/* Status & Keterangan */}
                    <td className="py-2 px-3 text-[11px]">
                      {isUnassigned ? (
                        <span className="font-bold text-rose-700 flex items-center space-x-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Operator Kosong!</span>
                        </span>
                      ) : isDoubleJob ? (
                        <span className="font-bold text-amber-800 flex items-center space-x-1">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>Double Job Aktif</span>
                        </span>
                      ) : isTandem ? (
                        <span className="font-bold text-indigo-800 flex items-center space-x-1">
                          <Zap className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Tandem Aktif</span>
                        </span>
                      ) : isBottleneck ? (
                        <span className="font-bold text-amber-700 flex items-center space-x-1">
                          <Flame className="w-3.5 h-3.5 text-red-500" />
                          <span>Bottleneck</span>
                        </span>
                      ) : (
                        <span className="text-slate-600">{row.keterangan}</span>
                      )}
                    </td>

                    {/* Action edit assignment */}
                    <td className="py-2 px-2 text-center">
                      {canEditCurrentLine && (
                        <button
                          onClick={() =>
                            setAdjustingProcess({
                              no: row.no,
                              process: row.process,
                              section: row.section,
                              machine: row.machine,
                              operatorName: row.operatorName,
                            })
                          }
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          title="Ganti Operator / Mesin Stasiun Ini"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* SUMMARY FOOTER: SUM PADA KOLOM TOTAL & PER-JAM */}
            <tfoot className="bg-slate-100/95 font-bold border-t-2 border-slate-300 text-slate-800 text-[11px]">
              <tr>
                <td colSpan={5} className="py-3 px-3 text-right uppercase tracking-wider text-slate-700">
                  <div className="flex items-center justify-end space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span className="font-extrabold text-slate-900">
                      TOTAL SUM OUTPUT ({filteredRows.length} PROSES):
                    </span>
                  </div>
                </td>

                {/* SUM Target */}
                <td className="py-3 px-2 text-center font-mono font-black text-slate-900 bg-slate-200/60">
                  {filteredRows.reduce((sum, r) => sum + (r.target || 0), 0)}
                </td>

                {/* SUM Jam 1 s/d Jam 8 */}
                {[0, 1, 2, 3, 4, 5, 6, 7].map((hIdx) => {
                  const hourTotal = filteredRows.reduce(
                    (sum, r) => sum + (Number(r.hourlyActual[hIdx]) || 0),
                    0
                  );
                  const isOffSchedule = hIdx + 1 > activeWorkingHours;
                  return (
                    <td
                      key={hIdx}
                      className={`py-3 px-1 text-center font-mono font-bold border-l border-slate-200 ${
                        isOffSchedule
                          ? "bg-slate-200/40 text-slate-400"
                          : "text-slate-900 bg-slate-100"
                      }`}
                    >
                      {hourTotal}
                    </td>
                  );
                })}

                {/* SUM PADA KOLOM DEFECT (Jam 1 s/d Jam 8) */}
                <td
                  className="py-3 px-2 text-center font-mono font-black text-sm bg-blue-200/80 text-blue-950 border-l border-blue-300 shadow-inner"
                  title="SUM Kolom DEFECT (Jam 1 s/d Jam 8)"
                >
                  {filteredRows.reduce(
                    (totalSum, r) =>
                      totalSum +
                      r.hourlyActual.slice(0, 8).reduce((rowSum, val) => rowSum + (Number(val) || 0), 0),
                    0
                  )}
                </td>

                {/* SUM PADA KOLOM TOTAL (Manual) */}
                <td
                  className="py-3 px-2 text-center font-mono font-bold text-rose-700 bg-rose-50/70"
                  title="SUM Kolom TOTAL (Manual)"
                >
                  {filteredRows.reduce((sum, r) => sum + (Number(r.totalDefects) || 0), 0)}
                </td>

                {/* Line Achievement / Summary Status */}
                <td className="py-3 px-3 text-[11px]">
                  {(() => {
                    const totalTgt = filteredRows.reduce((sum, r) => sum + (r.target || 0), 0);
                    const totalAct = filteredRows.reduce(
                      (totalSum, r) =>
                        totalSum +
                        r.hourlyActual.reduce((rowSum, val) => rowSum + (Number(val) || 0), 0),
                      0
                    );
                    const pct = totalTgt > 0 ? Math.round((totalAct / totalTgt) * 100) : 0;
                    return (
                      <span className="font-bold text-blue-900 flex items-center space-x-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-mono">
                          {pct}%
                        </span>
                        <span>Efisiensi Output</span>
                      </span>
                    );
                  })()}
                </td>

                <td className="py-3 px-2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTLENECK SUGGESTIONS & ENGINEERING RECOMMENDATIONS (BELOW TABLE) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2.5 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
              Saran Solusi Bottleneck & Optimasi Line
            </h3>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 w-fit">
            Double Job (SMV Minimum) &bull; Tandem (Beban &gt; Kapasitas)
          </span>
        </div>

        {/* Suggestion Cards Container */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Card 1: SARAN DOUBLE JOB (SMV TERKECIL) */}
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-amber-600" />
                <span>Double Job &bull; Cover Operator Kosong</span>
              </span>
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded">
                Prioritas SMV Terkecil
              </span>
            </div>

            {/* Candidates List */}
            {bottleneckAnalysis.problematicStations.filter(s => s.status === "unassigned" || s.operatorAttendance !== "HADIR").length > 0 ? (
              <div className="space-y-2">
                {bottleneckAnalysis.problematicStations
                  .filter(s => s.status === "unassigned" || s.operatorAttendance !== "HADIR")
                  .slice(0, 3)
                  .map((prob) => {
                    const bestCandidate = bottleneckAnalysis.smallestSMVOperators[0];

                    return (
                      <div
                        key={prob.no}
                        className="bg-white p-2.5 rounded-lg border border-amber-200 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">
                            St. #{prob.no}: {prob.process}
                          </span>
                          <span className="font-mono text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded text-[10px]">
                            Kosong ({prob.smv}m)
                          </span>
                        </div>

                        {bestCandidate ? (
                          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                            <div className="text-slate-600">
                              Cover: <strong className="text-blue-700">{bestCandidate.operatorName}</strong>
                              <span className="text-slate-400 text-[10px]"> (St. #{bestCandidate.stationNo} &bull; {bestCandidate.smv}m)</span>
                            </div>
                            {canEditCurrentLine && onApplyDoubleJob && (
                              <button
                                onClick={() => {
                                  onApplyDoubleJob(prob.no, bestCandidate.operatorName, bestCandidate.stationNo);
                                  showNotification(`Double Job diterapkan: ${bestCandidate.operatorName} meng-cover Stasiun #${prob.no}!`);
                                }}
                                className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[10px]"
                              >
                                Terapkan
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[10px]">
                            Semua operator hadir bertugas penuh.
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Semua stasiun terisi operator normal.</span>
              </div>
            )}
          </div>

          {/* Card 2: SARAN TANDEM (KAPASITAS MELEBIHI / SIKLUS BERAT) */}
          <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600" />
                <span>Tandem &bull; Reduksi Siklus Berat (&gt;26 / Bottleneck)</span>
              </span>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded">
                Bagi Beban 50%
              </span>
            </div>

            {/* Heavy stations */}
            {lineData.rows.filter(r => r.cycleTime > 80 || r.status === "bottleneck").length > 0 ? (
              <div className="space-y-2">
                {lineData.rows
                  .filter(r => r.cycleTime > 80 || r.status === "bottleneck")
                  .slice(0, 3)
                  .map((st) => (
                    <div
                      key={st.no}
                      className="bg-white p-2.5 rounded-lg border border-indigo-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800">
                          St. #{st.no}: {st.process}
                        </span>
                        <span className="font-mono text-indigo-700 font-bold bg-indigo-50 px-1.5 py-0.5 rounded text-[10px]">
                          {st.cycleTime}s (Berat)
                        </span>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                        <span className="text-slate-600">
                          2 Op &rarr; Jadi <strong>{Math.round(st.cycleTime / 2)}s</strong>
                        </span>
                        {canEditCurrentLine && onApplyTandem && !st.isTandem && (
                          <button
                            onClick={() => {
                              onApplyTandem(st.no, st.operatorName, "Helper Tandem");
                              showNotification(`Tandem diterapkan pada Stasiun #${st.no}!`);
                            }}
                            className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[10px]"
                          >
                            Terapkan
                          </button>
                        )}
                        {st.isTandem && (
                          <span className="text-emerald-700 font-bold text-[10px]">Tandem Aktif</span>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Waktu siklus tiap stasiun seimbang.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal: Kosongkan Data Jam */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">
                  Konfirmasi Reset
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Kosongkan Semua Data Jam yang Terinput?
                </h3>
              </div>
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Tindakan ini akan mengosongkan seluruh angka output dan defect (Jam 1 s/d Jam 8) pada <strong>Sewing Line {lineData.lineId}</strong> kembali ke 0. Struktur proses, operator, dan target tetap terjaga.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (onClearLineHourlyData) {
                    onClearLineHourlyData();
                    showNotification(`Semua data input jam pada Line ${lineData.lineId} berhasil dikosongkan (0).`);
                  }
                  setIsClearConfirmOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Ya, Kosongkan Data Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Assignment Modal */}
      {adjustingProcess && onUpdateProcessAssignment && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                  Penyesuaian Stasiun Kerja
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  #{adjustingProcess.no} {adjustingProcess.process}
                </h3>
              </div>
              <button
                onClick={() => setAdjustingProcess(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pilih Operator (Hanya yang HADIR):
                </label>
                <select
                  value={adjustingProcess.operatorName}
                  onChange={(e) =>
                    setAdjustingProcess({
                      ...adjustingProcess,
                      operatorName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-semibold text-slate-800"
                >
                  {operators
                    .filter((op) => op.attendanceStatus === "HADIR")
                    .map((op) => (
                      <option key={op.id} value={op.name}>
                        {op.name} ({op.grade} - {op.primarySkill})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tipe Mesin Jahit:</label>
                <input
                  type="text"
                  value={adjustingProcess.machine}
                  onChange={(e) =>
                    setAdjustingProcess({
                      ...adjustingProcess,
                      machine: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAdjustingProcess(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  onUpdateProcessAssignment(
                    adjustingProcess.no,
                    adjustingProcess.operatorName,
                    adjustingProcess.machine
                  );
                  setAdjustingProcess(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Hour Input Modal */}
      {batchHourModal !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                  Input Cepat Massal Jam ke-{batchHourModal}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Isi Output Jam {batchHourModal} untuk Seluruh Stasiun
                </h3>
              </div>
              <button
                onClick={() => setBatchHourModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Fitur ini akan mengisi target default (10 pcs) untuk seluruh stasiun yang operatornya hadir pada jam ke-{batchHourModal}.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setBatchHourModal(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold text-xs"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  lineData.rows.forEach((r) => {
                    const isPresent = r.operatorAttendance === "HADIR";
                    onUpdateHourlyOutput(r.no, batchHourModal - 1, isPresent ? 10 : 0, 0);
                  });
                  setBatchHourModal(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
              >
                Isi Standar (10 pcs)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
