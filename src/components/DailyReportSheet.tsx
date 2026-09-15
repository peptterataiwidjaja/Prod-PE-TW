import React, { useState, useMemo } from "react";
import {
  LineNumber,
  User,
  LineProductionData,
  Operator,
  LineBPData,
  DailyReportLog,
} from "../types";
import {
  Calendar,
  FileSpreadsheet,
  CheckCircle2,
  Printer,
  Download,
  Save,
  Users,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Award,
  Layers,
  Lock,
  CalendarDays,
  ListFilter,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import * as XLSX from "xlsx";
import {
  formatIndoDate,
  formatIndoDateWithDay,
  formatIndoMonth,
  getDaysInMonth,
  offsetDate,
} from "../utils/dateUtils";

interface DailyReportSheetProps {
  selectedLine: LineNumber;
  currentBP: LineBPData;
  lineData: LineProductionData;
  operators: Operator[];
  currentUser: User;
  dailyLogs: DailyReportLog[];
  onSaveDailyLog: (log: DailyReportLog) => void;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  selectedMonth?: string;
  onSelectMonth?: (month: string) => void;
}

export const DailyReportSheet: React.FC<DailyReportSheetProps> = ({
  selectedLine,
  currentBP,
  lineData,
  operators,
  currentUser,
  dailyLogs,
  onSaveDailyLog,
  selectedDate,
  onSelectDate,
  selectedMonth = "2026-09",
  onSelectMonth,
}) => {
  const [viewMode, setViewMode] = useState<"daily" | "monthly">("daily");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active month calculation
  const activeMonthStr = selectedMonth || selectedDate.slice(0, 7) || "2026-09";
  const daysInMonthCount = useMemo(() => getDaysInMonth(activeMonthStr), [activeMonthStr]);

  // Filter logs for this line and this month
  const lineLogs = useMemo(() => {
    return dailyLogs.filter((l) => l.lineId === selectedLine);
  }, [dailyLogs, selectedLine]);

  const currentLog = useMemo(() => {
    return lineLogs.find((l) => l.date === selectedDate);
  }, [lineLogs, selectedDate]);

  // Month days array
  const monthDays = useMemo(() => {
    return Array.from({ length: daysInMonthCount }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${activeMonthStr}-${dayNum.toString().padStart(2, "0")}`;
      const log = lineLogs.find((l) => l.date === dateStr);
      return {
        day: dayNum,
        date: dateStr,
        log,
      };
    });
  }, [activeMonthStr, daysInMonthCount, lineLogs]);

  // Monthly aggregated totals
  const monthlyStats = useMemo(() => {
    const recordedLogs = monthDays.filter((d) => Boolean(d.log)).map((d) => d.log!);
    const totalActual = recordedLogs.reduce((s, l) => s + l.actualOutput, 0);
    const totalTarget = recordedLogs.reduce((s, l) => s + l.targetPerDay, 0);
    const totalDefects = recordedLogs.reduce((s, l) => s + l.defectsCount, 0);
    const avgEfficiency =
      recordedLogs.length > 0
        ? Number((recordedLogs.reduce((s, l) => s + l.efficiency, 0) / recordedLogs.length).toFixed(1))
        : 0;
    const avgAttendance =
      recordedLogs.length > 0
        ? Number((recordedLogs.reduce((s, l) => s + l.attendanceRate, 0) / recordedLogs.length).toFixed(1))
        : 100;

    return {
      recordedDays: recordedLogs.length,
      totalActual,
      totalTarget,
      totalDefects,
      avgEfficiency,
      avgAttendance,
    };
  }, [monthDays]);

  // Form input calculations
  const totalActualCalculated = lineData.rows.reduce((sum, r) => sum + r.totalActual, 0);
  const totalDefectsCalculated = lineData.rows.reduce((sum, r) => sum + r.totalDefects, 0);
  const totalTargetStandard = currentBP.metadata.lineTargetPerDay || 80;
  const presentOpsCount = operators.filter((o) => o.attendanceStatus === "HADIR").length;
  const bottlenecksCount = lineData.rows.filter(
    (r) => r.status === "bottleneck" || r.status === "unassigned"
  ).length;

  // Local form state
  const [inputTarget, setInputTarget] = useState<number>(
    currentLog ? currentLog.targetPerDay : totalTargetStandard
  );
  const [inputActual, setInputActual] = useState<number>(
    currentLog ? currentLog.actualOutput : totalActualCalculated || totalTargetStandard - 4
  );
  const [inputDefects, setInputDefects] = useState<number>(
    currentLog ? currentLog.defectsCount : totalDefectsCalculated || 2
  );
  const [inputNotes, setInputNotes] = useState<string>(
    currentLog ? currentLog.notes : "Produksi harian berjalan lancar sesuai Breakdown Proses (BP)."
  );
  const [inputSupervisor, setInputSupervisor] = useState<string>(
    currentLog ? currentLog.supervisor : currentBP.metadata.supervisor || "Edwar Permana, S.T."
  );
  const [inputQC, setInputQC] = useState<string>(
    currentLog ? currentLog.qcInspector : currentBP.metadata.qualityControl || "Fylaily Izmi Adhisty"
  );

  // Sync form when selectedDate changes or currentLog changes
  React.useEffect(() => {
    if (currentLog) {
      setInputTarget(currentLog.targetPerDay);
      setInputActual(currentLog.actualOutput);
      setInputDefects(currentLog.defectsCount);
      setInputNotes(currentLog.notes);
      setInputSupervisor(currentLog.supervisor);
      setInputQC(currentLog.qcInspector);
    } else {
      setInputTarget(totalTargetStandard);
      setInputActual(totalActualCalculated || totalTargetStandard - 4);
      setInputDefects(totalDefectsCalculated || 2);
      setInputNotes("Produksi harian berjalan normal sesuai BP.");
      setInputSupervisor(currentBP.metadata.supervisor || "Edwar Permana, S.T.");
      setInputQC(currentBP.metadata.qualityControl || "Fylaily Izmi Adhisty");
    }
  }, [selectedDate, currentLog, totalTargetStandard, totalActualCalculated, totalDefectsCalculated]);

  const canEditCurrentLine =
    currentUser.role === "production_engineer" || currentUser.assignedLine === selectedLine;

  const efficiency = inputTarget > 0 ? Number(((inputActual / inputTarget) * 100).toFixed(1)) : 0;
  const defectRate = inputActual > 0 ? Number(((inputDefects / inputActual) * 100).toFixed(1)) : 0;
  const attendanceRate =
    operators.length > 0 ? Number(((presentOpsCount / operators.length) * 100).toFixed(1)) : 100;

  // Save report
  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEditCurrentLine) return;

    const newLog: DailyReportLog = {
      id: currentLog?.id || `log-l${selectedLine}-${selectedDate.replace(/-/g, "")}`,
      date: selectedDate,
      lineId: selectedLine,
      buyer: currentBP.metadata.buyer,
      style: currentBP.metadata.style,
      targetPerDay: Number(inputTarget),
      actualOutput: Number(inputActual),
      efficiency,
      defectsCount: Number(inputDefects),
      defectRate,
      presentOperators: presentOpsCount,
      totalOperators: operators.length,
      attendanceRate,
      bottleneckCount: bottlenecksCount,
      notes: inputNotes,
      supervisor: inputSupervisor,
      qcInspector: inputQC,
      submittedBy: currentUser.name,
      submittedAt: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    onSaveDailyLog(newLog);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Export Month to Excel
  const handleExportMonthlyExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = monthDays.map((d) => [
      d.date,
      `Line ${selectedLine}`,
      currentBP.metadata.buyer,
      currentBP.metadata.style,
      d.log?.targetPerDay || "-",
      d.log?.actualOutput || "-",
      d.log ? `${d.log.efficiency}%` : "-",
      d.log?.defectsCount || "-",
      d.log ? `${d.log.presentOperators}/${d.log.totalOperators}` : "-",
      d.log?.notes || "-",
      d.log?.submittedBy || "-",
    ]);

    const header = [
      [`REKAP LAPORAN HARIAN SEWING - ${formatIndoMonth(activeMonthStr).toUpperCase()}`],
      [`Sewing Line ${selectedLine}`, `Buyer: ${currentBP.metadata.buyer}`, `Style: ${currentBP.metadata.style}`],
      [],
      [
        "Tanggal",
        "Line",
        "Buyer",
        "Style",
        "Target (Pcs)",
        "Aktual (Pcs)",
        "Efisiensi",
        "Defect (Pcs)",
        "Presensi Op",
        "Catatan",
        "Petugas",
      ],
      ...rows,
    ];

    const ws = XLSX.utils.aoa_to_sheet(header);
    XLSX.utils.book_append_sheet(wb, ws, `Line ${selectedLine}`);
    XLSX.writeFile(wb, `Rekap_Produksi_Line_${selectedLine}_${activeMonthStr}.xlsx`);
  };

  return (
    <div className="space-y-4">
      {/* Sleek Top Control Bar: Date, Month & Mode Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Line Badge & Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
              L{selectedLine}
            </span>
            <div>
              <span className="text-xs font-bold text-slate-800 block">
                Line {selectedLine} &bull; {currentBP.metadata.style}
              </span>
              <span className="text-[10px] text-slate-400">
                Buyer: {currentBP.metadata.buyer}
              </span>
            </div>
          </div>

          {/* View Mode Segment */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold ml-0 sm:ml-2">
            <button
              onClick={() => setViewMode("daily")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                viewMode === "daily"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Harian</span>
            </button>
            <button
              onClick={() => setViewMode("monthly")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                viewMode === "monthly"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Rekap Bulanan</span>
            </button>
          </div>
        </div>

        {/* Right: Date Picker, Month Picker & Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tanggal Monitor Input */}
          <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onSelectDate(offsetDate(selectedDate, -1))}
              className="p-1 hover:bg-slate-200 rounded text-slate-500"
              title="Hari Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold uppercase text-slate-400">Tgl:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onSelectDate(e.target.value);
                  if (onSelectMonth) onSelectMonth(e.target.value.slice(0, 7));
                }
              }}
              className="text-xs font-bold font-mono text-slate-800 bg-transparent border-none outline-hidden cursor-pointer"
            />
            <button
              onClick={() => onSelectDate(offsetDate(selectedDate, 1))}
              className="p-1 hover:bg-slate-200 rounded text-slate-500"
              title="Hari Berikutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Per Bulan Input */}
          <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400">Bln:</span>
            <input
              type="month"
              value={activeMonthStr}
              onChange={(e) => {
                if (e.target.value) {
                  if (onSelectMonth) onSelectMonth(e.target.value);
                  onSelectDate(`${e.target.value}-01`);
                }
              }}
              className="text-xs font-bold font-mono text-blue-700 bg-transparent border-none outline-hidden cursor-pointer"
            />
          </div>

          {/* Quick Action: Export Excel */}
          <button
            onClick={handleExportMonthlyExcel}
            className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all border border-emerald-200 flex items-center space-x-1"
            title="Download Rekap Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel</span>
          </button>

          {/* Print */}
          <button
            onClick={() => window.print()}
            className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all"
            title="Cetak Form"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Save Notification */}
      {saveSuccess && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Laporan harian Line {selectedLine} ({formatIndoDate(selectedDate)}) berhasil disimpan!
          </span>
        </div>
      )}

      {/* READ-ONLY NOTICE IF NOT AUTHORIZED */}
      {!canEditCurrentLine && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center space-x-2">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Mode Pratinjau (Read-Only) &bull; Anda adalah <strong>{currentUser.name}</strong>.
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: LAPORAN HARIAN (PER TANGGAL) */}
      {/* ========================================================================= */}
      {viewMode === "daily" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Form: Clean & Minimalist */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>Input Laporan Harian</span>
                </span>
                <span className="text-[11px] font-mono text-blue-700 font-bold">
                  {formatIndoDateWithDay(selectedDate)}
                </span>
              </div>

              <form onSubmit={handleSaveReport} className="space-y-3">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Target (Pcs):
                    </label>
                    <input
                      type="number"
                      value={inputTarget}
                      onChange={(e) => setInputTarget(Number(e.target.value))}
                      disabled={!canEditCurrentLine}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:bg-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Aktual (Pcs):
                    </label>
                    <input
                      type="number"
                      value={inputActual}
                      onChange={(e) => setInputActual(Number(e.target.value))}
                      disabled={!canEditCurrentLine}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-blue-700 focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Defect / BS (Pcs):
                    </label>
                    <input
                      type="number"
                      value={inputDefects}
                      onChange={(e) => setInputDefects(Number(e.target.value))}
                      disabled={!canEditCurrentLine}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-rose-600 focus:bg-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Kehadiran Operator:
                    </label>
                    <div className="px-2.5 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-700">
                      {presentOpsCount}/{operators.length} Hadir ({attendanceRate}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      Supervisor:
                    </label>
                    <input
                      type="text"
                      value={inputSupervisor}
                      onChange={(e) => setInputSupervisor(e.target.value)}
                      disabled={!canEditCurrentLine}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                      QC Inspector:
                    </label>
                    <input
                      type="text"
                      value={inputQC}
                      onChange={(e) => setInputQC(e.target.value)}
                      disabled={!canEditCurrentLine}
                      className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-0.5">
                    Catatan Produksi:
                  </label>
                  <textarea
                    rows={2}
                    value={inputNotes}
                    onChange={(e) => setInputNotes(e.target.value)}
                    disabled={!canEditCurrentLine}
                    placeholder="Catatan kendala / perbaikan..."
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white outline-hidden resize-none"
                  />
                </div>

                {canEditCurrentLine && (
                  <button
                    type="submit"
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan Laporan ({selectedDate})</span>
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* Right: Official Summary Document (F-SEW-007) */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 print:border-none print:shadow-none">
              {/* Document Header */}
              <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider block">
                    SEWSMART &bull; F-SEW-007-00
                  </span>
                  <h3 className="text-sm font-bold text-slate-900">
                    Laporan Harian Sewing Line {selectedLine}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  {formatIndoDate(selectedDate)}
                </span>
              </div>

              {/* KPI Badges */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-blue-600 block">Aktual / Target</span>
                  <div className="text-sm font-mono font-extrabold text-blue-900 mt-0.5">
                    {inputActual} / {inputTarget}
                  </div>
                  <span className="text-[9px] text-blue-700">Pcs</span>
                </div>

                <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-emerald-600 block">Efisiensi</span>
                  <div className="text-sm font-mono font-extrabold text-emerald-900 mt-0.5">
                    {efficiency}%
                  </div>
                  <span className="text-[9px] text-emerald-700">Std: 85%</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-500 block">Presensi</span>
                  <div className="text-sm font-mono font-extrabold text-slate-800 mt-0.5">
                    {attendanceRate}%
                  </div>
                  <span className="text-[9px] text-slate-500">{presentOpsCount}/{operators.length} Op</span>
                </div>

                <div className="bg-rose-50/70 p-2.5 rounded-xl border border-rose-100 text-center">
                  <span className="text-[9px] uppercase font-bold text-rose-600 block">Defect</span>
                  <div className="text-sm font-mono font-extrabold text-rose-900 mt-0.5">
                    {defectRate}%
                  </div>
                  <span className="text-[9px] text-rose-700">{inputDefects} pcs</span>
                </div>
              </div>

              {/* Note */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">Catatan:</span>
                <p className="text-slate-700 mt-0.5 italic">&ldquo;{inputNotes}&rdquo;</p>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block mb-6">Admin Line</span>
                  <strong className="text-slate-800 underline block text-[11px]">{currentUser.name}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block mb-6">Supervisor</span>
                  <strong className="text-slate-800 underline block text-[11px]">{inputSupervisor}</strong>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 uppercase block mb-6">PE Head</span>
                  <strong className="text-slate-800 underline block text-[11px]">Fikri Putra</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: REKAPITULASI BULANAN (PER BULAN) */}
      {/* ========================================================================= */}
      {viewMode === "monthly" && (
        <div className="space-y-4">
          {/* Monthly KPI Overview Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Output Bulan Ini</span>
              <div className="text-lg font-mono font-extrabold text-blue-700 mt-0.5">
                {monthlyStats.totalActual} pcs
              </div>
              <span className="text-[10px] text-slate-500">
                {monthlyStats.recordedDays} hari kerja tercatat
              </span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Bulanan</span>
              <div className="text-lg font-mono font-extrabold text-slate-800 mt-0.5">
                {monthlyStats.totalTarget} pcs
              </div>
              <span className="text-[10px] text-slate-500">Kumulatif line</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Rata-rata Efisiensi</span>
              <div className="text-lg font-mono font-extrabold text-emerald-600 mt-0.5">
                {monthlyStats.avgEfficiency}%
              </div>
              <span className="text-[10px] text-slate-500">Target PE: &ge;85%</span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Defect</span>
              <div className="text-lg font-mono font-extrabold text-rose-600 mt-0.5">
                {monthlyStats.totalDefects} pcs
              </div>
              <span className="text-[10px] text-slate-500">
                Rate:{" "}
                {monthlyStats.totalActual > 0
                  ? ((monthlyStats.totalDefects / monthlyStats.totalActual) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>

            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Presensi Rata-rata</span>
              <div className="text-lg font-mono font-extrabold text-slate-800 mt-0.5">
                {monthlyStats.avgAttendance}%
              </div>
              <span className="text-[10px] text-slate-500">Tingkat kehadiran</span>
            </div>
          </div>

          {/* Interactive Month Days Calendar Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-slate-900">
                  Kalender {formatIndoMonth(activeMonthStr)} &bull; Line {selectedLine}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-semibold text-slate-500">
                <span className="inline-flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>&ge;95%</span>
                </span>
                <span className="inline-flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>85-94%</span>
                </span>
                <span className="inline-flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>&lt;85%</span>
                </span>
              </div>
            </div>

            {/* Grid of days in this month */}
            <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
              {monthDays.map((d) => {
                const isSelected = d.date === selectedDate;
                const hasLog = Boolean(d.log);
                const eff = d.log?.efficiency || 0;

                let badgeColor = "bg-slate-50 border-slate-200 text-slate-400";
                if (hasLog) {
                  if (eff >= 95) badgeColor = "bg-emerald-50 border-emerald-300 text-emerald-900";
                  else if (eff >= 85) badgeColor = "bg-amber-50 border-amber-300 text-amber-900";
                  else badgeColor = "bg-rose-50 border-rose-300 text-rose-900";
                }

                return (
                  <button
                    key={d.day}
                    onClick={() => {
                      onSelectDate(d.date);
                      setViewMode("daily");
                    }}
                    className={`p-2 rounded-xl border text-left transition-all ${badgeColor} ${
                      isSelected ? "ring-2 ring-blue-600 shadow-sm font-bold" : "hover:border-blue-300"
                    }`}
                    title={`Klik untuk buka laporan tgl ${d.date}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold">{d.day}</span>
                      {hasLog ? (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                      )}
                    </div>
                    {hasLog ? (
                      <div className="mt-1">
                        <div className="text-[11px] font-mono font-extrabold">{d.log?.actualOutput} pcs</div>
                        <div className="text-[9px] text-slate-500">{d.log?.efficiency}%</div>
                      </div>
                    ) : (
                      <div className="mt-1 text-[9px] text-slate-400 italic">-</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Month Summary Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                <ListFilter className="w-3.5 h-3.5 text-blue-600" />
                <span>Rekapitulasi Harian {formatIndoMonth(activeMonthStr)}</span>
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {monthlyStats.recordedDays} Catatan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-2 text-center">Target</th>
                    <th className="py-2.5 px-2 text-center">Aktual</th>
                    <th className="py-2.5 px-2 text-center">Efisiensi</th>
                    <th className="py-2.5 px-2 text-center">Defect</th>
                    <th className="py-2.5 px-2 text-center">Presensi</th>
                    <th className="py-2.5 px-3">Catatan</th>
                    <th className="py-2.5 px-2 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthDays.map((d) => {
                    if (!d.log) return null;
                    return (
                      <tr key={d.day} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2 px-3 font-mono font-semibold text-slate-800">
                          {d.date}
                        </td>
                        <td className="py-2 px-2 text-center font-mono">{d.log.targetPerDay}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold text-blue-700">
                          {d.log.actualOutput}
                        </td>
                        <td className="py-2 px-2 text-center font-mono">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              d.log.efficiency >= 95
                                ? "bg-emerald-100 text-emerald-800"
                                : d.log.efficiency >= 85
                                ? "bg-amber-100 text-amber-800"
                                : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {d.log.efficiency}%
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-rose-600">
                          {d.log.defectsCount} ({d.log.defectRate}%)
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600">
                          {d.log.presentOperators}/{d.log.totalOperators}
                        </td>
                        <td className="py-2 px-3 text-slate-600 truncate max-w-[200px]">
                          {d.log.notes}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => {
                              onSelectDate(d.date);
                              setViewMode("daily");
                            }}
                            className="px-2 py-1 rounded bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-[10px]"
                          >
                            Buka
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {monthlyStats.recordedDays === 0 && (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-400 italic">
                        Belum ada laporan yang tersimpan untuk {formatIndoMonth(activeMonthStr)}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
