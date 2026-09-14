import React, { useState, useMemo } from "react";
import {
  LineNumber,
  User,
  LineProductionData,
  Operator,
  Fishbone6M,
  FiveWhyItem,
  EngineeringRecommendation,
  DailyReportLog,
} from "../types";
import {
  BarChart3,
  GitCommit,
  GitBranch,
  HelpCircle,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Plus,
  ArrowRight,
  Shield,
  Layers,
  Users,
  Flame,
  Clock,
  Cpu,
  RefreshCw,
  ExternalLink,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  VALID_LINES,
  INITIAL_PARETO_DEFECTS,
  INITIAL_PARETO_BOTTLENECK_CAUSES,
  INITIAL_FISHBONE_6M,
  INITIAL_FIVE_WHY_CASES,
  INITIAL_RECOMMENDATIONS,
} from "../data/defaultData";
import {
  formatIndoDate,
  formatIndoMonth,
  offsetDate,
} from "../utils/dateUtils";

interface PEDashboardProps {
  linesData: Record<number, LineProductionData>;
  allOperators: Operator[];
  currentUser: User;
  onSelectLine: (line: LineNumber) => void;
  onOpenTargetAnalysis: () => void;
  selectedDate?: string;
  onSelectDate?: (date: string) => void;
  selectedMonth?: string;
  onSelectMonth?: (month: string) => void;
  dailyLogs?: DailyReportLog[];
}

export const PEDashboard: React.FC<PEDashboardProps> = ({
  linesData,
  allOperators,
  currentUser,
  onSelectLine,
  onOpenTargetAnalysis,
  selectedDate = "2026-09-13",
  onSelectDate,
  selectedMonth = "2026-09",
  onSelectMonth,
  dailyLogs = [],
}) => {
  const [activeTab, setActiveTab] = useState<"comparison" | "pareto" | "fishbone" | "5why" | "recommendations">("comparison");
  const [paretoType, setParetoType] = useState<"defects" | "bottlenecks">("defects");
  const [timeframe, setTimeframe] = useState<"daily" | "monthly">("daily");

  // State for 6M Fishbone
  const [fishbone, setFishbone] = useState<Fishbone6M>(INITIAL_FISHBONE_6M);
  const [newFishboneItem, setNewFishboneItem] = useState<{ category: keyof Fishbone6M; text: string }>({
    category: "man",
    text: "",
  });

  // State for 5 Why
  const [fiveWhyCases, setFiveWhyCases] = useState<FiveWhyItem[]>(INITIAL_FIVE_WHY_CASES);
  const [isAddingWhy, setIsAddingWhy] = useState(false);
  const [newWhy, setNewWhy] = useState<Partial<FiveWhyItem>>({
    line: 1,
    issue: "",
    stationOrProcess: "",
    why1: "",
    why2: "",
    why3: "",
    why4: "",
    why5: "",
    rootCause: "",
    correctiveAction: "",
    preventiveAction: "",
    pic: "",
    status: "Open",
  });

  // Multi-line comparison calculation (Daily vs Monthly)
  const lineComparisons = useMemo(() => {
    return VALID_LINES.map((lineId) => {
      const lineObj = linesData[lineId];
      const ops = allOperators.filter((o) => o.line === lineId);
      const totalOps = ops.length || 26;
      const hadirOps = ops.filter((o) => o.attendanceStatus === "HADIR").length;
      const absentOps = totalOps - hadirOps;
      const attendanceRate = totalOps > 0 ? Number(((hadirOps / totalOps) * 100).toFixed(1)) : 0;

      // Check if monthly mode
      if (timeframe === "monthly") {
        const monthPrefix = selectedMonth || "2026-09";
        const lineMonthLogs = dailyLogs.filter(
          (l) => l.lineId === lineId && l.date.startsWith(monthPrefix)
        );

        const totalActual = lineMonthLogs.reduce((s, l) => s + l.actualOutput, 0);
        const totalTarget = lineMonthLogs.reduce((s, l) => s + l.targetPerDay, 0);
        const totalDefects = lineMonthLogs.reduce((s, l) => s + l.defectsCount, 0);
        const efficiency =
          lineMonthLogs.length > 0
            ? Number((lineMonthLogs.reduce((s, l) => s + l.efficiency, 0) / lineMonthLogs.length).toFixed(1))
            : 0;
        const defectRate = totalActual > 0 ? Number(((totalDefects / totalActual) * 100).toFixed(1)) : 0;
        const avgAttendanceRate =
          lineMonthLogs.length > 0
            ? Number((lineMonthLogs.reduce((s, l) => s + l.attendanceRate, 0) / lineMonthLogs.length).toFixed(1))
            : attendanceRate;

        const balanceEfficiency = Number((75 + (lineId * 2) % 12).toFixed(1));
        const balanceDelay = Number((100 - balanceEfficiency).toFixed(1));

        return {
          lineId,
          supervisor: lineObj?.supervisor || `Supervisor Line ${lineId}`,
          totalOps,
          hadirOps: Math.round((avgAttendanceRate / 100) * totalOps),
          absentOps: totalOps - Math.round((avgAttendanceRate / 100) * totalOps),
          attendanceRate: avgAttendanceRate,
          totalActual,
          totalTarget,
          efficiency,
          defectRate,
          bottlenecks: lineMonthLogs.reduce((s, l) => s + (l.bottleneckCount || 0), 0),
          balanceEfficiency,
          balanceDelay,
          recordedDays: lineMonthLogs.length,
        };
      }

      // Default: Daily Mode
      const rows = lineObj?.rows || [];
      const totalActual = rows.reduce((s, r) => s + r.totalActual, 0);
      const totalTarget = rows.reduce((s, r) => s + r.target, 0);
      const totalDefects = rows.reduce((s, r) => s + r.totalDefects, 0);
      const bottlenecks = rows.filter((r) => r.status === "bottleneck").length;

      const efficiency = totalTarget > 0 ? Number(((totalActual / totalTarget) * 100).toFixed(1)) : 0;
      const defectRate = totalActual > 0 ? Number(((totalDefects / totalActual) * 100).toFixed(1)) : 0;

      // Line balance estimate
      const balanceEfficiency = Number((72 + (lineId * 3) % 15 - (absentOps * 2.5)).toFixed(1));
      const balanceDelay = Number((100 - balanceEfficiency).toFixed(1));

      return {
        lineId,
        supervisor: lineObj?.supervisor || `Supervisor Line ${lineId}`,
        totalOps,
        hadirOps,
        absentOps,
        attendanceRate,
        totalActual,
        totalTarget,
        efficiency,
        defectRate,
        bottlenecks,
        balanceEfficiency,
        balanceDelay,
        recordedDays: 1,
      };
    });
  }, [VALID_LINES, linesData, allOperators, timeframe, selectedMonth, dailyLogs]);

  // Add item to 6M Fishbone
  const handleAddFishbone = () => {
    if (!newFishboneItem.text.trim()) return;
    setFishbone((prev) => ({
      ...prev,
      [newFishboneItem.category]: [...prev[newFishboneItem.category], newFishboneItem.text.trim()],
    }));
    setNewFishboneItem({ category: "man", text: "" });
  };

  // Add 5 Why
  const handleSaveWhy = () => {
    if (!newWhy.issue || !newWhy.rootCause) return;
    const item: FiveWhyItem = {
      id: `why-${Date.now()}`,
      line: (newWhy.line as LineNumber) || 1,
      issue: newWhy.issue || "",
      stationOrProcess: newWhy.stationOrProcess || "Stasiun Kerja",
      why1: newWhy.why1 || "",
      why2: newWhy.why2 || "",
      why3: newWhy.why3 || "",
      why4: newWhy.why4 || "",
      why5: newWhy.why5 || "",
      rootCause: newWhy.rootCause || "",
      correctiveAction: newWhy.correctiveAction || "",
      preventiveAction: newWhy.preventiveAction || "",
      pic: newWhy.pic || "Supervisor Line & PE",
      status: (newWhy.status as any) || "Open",
    };

    setFiveWhyCases([item, ...fiveWhyCases]);
    setIsAddingWhy(false);
  };

  return (
    <div className="space-y-4">
      {/* Sleek, Minimalist PE Control & Date Monitor Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-8 h-8 rounded-xl bg-slate-900 text-blue-400 font-bold text-xs flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Dasbor Monitoring Multi-Line PE
              </h2>
              <span className="text-[11px] text-slate-500">
                Evaluasi 6 Line Sewing (Line 1, 3, 4, 5, 6, 7)
              </span>
            </div>
          </div>

          {/* Timeframe Toggle: Harian vs Bulanan */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTimeframe("daily")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                timeframe === "daily"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Harian</span>
            </button>
            <button
              onClick={() => setTimeframe("monthly")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 ${
                timeframe === "monthly"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Per Bulan</span>
            </button>
          </div>
        </div>

        {/* Date & Month Monitor Inputs + Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {timeframe === "daily" && onSelectDate && (
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
          )}

          {/* Month input */}
          <div className="flex items-center space-x-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold uppercase text-slate-400">Bln:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                if (e.target.value && onSelectMonth) {
                  onSelectMonth(e.target.value);
                }
              }}
              className="text-xs font-bold font-mono text-blue-700 bg-transparent border-none outline-hidden cursor-pointer"
            />
          </div>

          <button
            onClick={onOpenTargetAnalysis}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Diagnostik Target</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab("comparison")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === "comparison"
              ? "border-blue-600 text-blue-700 bg-white shadow-2xs font-extrabold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Komparasi 6 Sewing Line</span>
        </button>

        <button
          onClick={() => setActiveTab("pareto")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === "pareto"
              ? "border-blue-600 text-blue-700 bg-white shadow-2xs font-extrabold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analisis Pareto (80/20)</span>
        </button>

        <button
          onClick={() => setActiveTab("fishbone")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === "fishbone"
              ? "border-blue-600 text-blue-700 bg-white shadow-2xs font-extrabold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>Fishbone Diagram (6M)</span>
        </button>

        <button
          onClick={() => setActiveTab("5why")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === "5why"
              ? "border-blue-600 text-blue-700 bg-white shadow-2xs font-extrabold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Analisis 5 Why</span>
        </button>

        <button
          onClick={() => setActiveTab("recommendations")}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === "recommendations"
              ? "border-blue-600 text-blue-700 bg-white shadow-2xs font-extrabold"
              : "border-transparent text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Recommendation Engine ({INITIAL_RECOMMENDATIONS.length})</span>
        </button>
      </div>

      {/* TAB 1: MULTI-LINE COMPARISON */}
      {activeTab === "comparison" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Tabel Komparasi Seluruh Line Jahit (Line 1, 3, 4, 5, 6, 7)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Evaluasi kehadiran operator, ketercapaian target, line balance efficiency, dan titik bottleneck.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Line</th>
                    <th className="py-3 px-3">Supervisor</th>
                    <th className="py-3 px-3 text-center">Kehadiran (Hadir/Total)</th>
                    <th className="py-3 px-3 text-center">% Presensi</th>
                    <th className="py-3 px-3 text-center font-mono">Aktual / Target</th>
                    <th className="py-3 px-3 text-center">% Efisiensi</th>
                    <th className="py-3 px-3 text-center font-mono font-bold text-blue-700">Line Balancing</th>
                    <th className="py-3 px-3 text-center">Balance Delay</th>
                    <th className="py-3 px-3 text-center">Defect Rate</th>
                    <th className="py-3 px-3 text-center">Bottlenecks</th>
                    <th className="py-3 px-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lineComparisons.map((item) => {
                    const isBelowTarget = item.efficiency < 85;
                    const hasBottleneck = item.bottlenecks > 0;

                    return (
                      <tr key={item.lineId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2">
                            <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-mono font-bold flex items-center justify-center text-xs">
                              L{item.lineId}
                            </span>
                            <span className="font-bold text-slate-900">Line {item.lineId}</span>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-700 font-medium">{item.supervisor}</td>

                        <td className="py-3 px-3 text-center font-mono font-semibold">
                          <span className="text-emerald-700 font-bold">{item.hadirOps}</span>
                          <span className="text-slate-400"> / {item.totalOps}</span>
                          {item.absentOps > 0 && (
                            <span className="text-rose-600 block text-[10px]">({item.absentOps} Absen)</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              item.attendanceRate >= 95
                                ? "bg-emerald-100 text-emerald-800"
                                : item.attendanceRate >= 90
                                ? "bg-blue-100 text-blue-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.attendanceRate}%
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <span className="font-bold text-slate-900">{item.totalActual}</span>
                          <span className="text-slate-400"> / {item.totalTarget}</span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-bold">
                          <span
                            className={
                              item.efficiency >= 95
                                ? "text-emerald-600"
                                : item.efficiency >= 85
                                ? "text-blue-600"
                                : "text-rose-600"
                            }
                          >
                            {item.efficiency}%
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-extrabold text-blue-700 bg-blue-50/30">
                          {item.balanceEfficiency}%
                        </td>

                        <td className="py-3 px-3 text-center font-mono text-slate-600">
                          {item.balanceDelay}%
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          <span
                            className={
                              item.defectRate <= 2.0
                                ? "text-emerald-600"
                                : item.defectRate <= 3.5
                                ? "text-slate-700"
                                : "text-rose-600"
                            }
                          >
                            {item.defectRate}%
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono">
                          {hasBottleneck ? (
                            <span className="inline-flex items-center text-rose-600 font-bold">
                              <Flame className="w-3.5 h-3.5 text-red-500 mr-0.5" />
                              {item.bottlenecks}
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">0</span>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => onSelectLine(item.lineId)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-bold text-[11px] transition-colors inline-flex items-center space-x-1"
                          >
                            <span>Buka Line</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARETO ANALYSIS */}
      {activeTab === "pareto" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Analisis Diagram Pareto (Prinsip 80/20 Garment Industrial Engineering)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  80% permasalahan produksi dan perlambatan line diakibatkan oleh 20% faktor penyebab dominan.
                </p>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setParetoType("defects")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    paretoType === "defects"
                      ? "bg-white text-slate-900 shadow-xs font-bold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pareto Cacat Jahit (Defects)
                </button>
                <button
                  onClick={() => setParetoType("bottlenecks")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    paretoType === "bottlenecks"
                      ? "bg-white text-slate-900 shadow-xs font-bold text-rose-700"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Pareto Penyebab Bottleneck
                </button>
              </div>
            </div>

            {/* Pareto Chart & Table */}
            {(() => {
              const dataset =
                paretoType === "defects" ? INITIAL_PARETO_DEFECTS : INITIAL_PARETO_BOTTLENECK_CAUSES;

              return (
                <div className="space-y-6">
                  {/* Visual Bar & Cumulative Line Representation */}
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-700">Grafik Frekuensi & Kumulatif:</div>
                    <div className="space-y-3 pt-2">
                      {dataset.map((item, idx) => (
                        <div key={item.category} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-slate-800">
                              #{idx + 1} {item.category}
                            </span>
                            <span className="font-mono text-slate-500">
                              <strong>{item.count} kasus</strong> ({item.percentage}%) &bull; Kumulatif:{" "}
                              <strong className="text-blue-700">{item.cumulativePercentage}%</strong>
                            </span>
                          </div>
                          <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full rounded-full transition-all ${
                                idx < 2 ? "bg-rose-500" : idx < 4 ? "bg-amber-500" : "bg-blue-600"
                              }`}
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Callout */}
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl text-xs text-blue-900 space-y-1">
                    <div className="font-bold flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>Rekomendasi Tindakan Berdasarkan Pareto:</span>
                    </div>
                    <p className="leading-relaxed">
                      {paretoType === "defects"
                        ? "Fokus perbaikan pada 2 kategori teratas ('Jahitan Melintir/Pucker' & 'Skip Stitch') akan menyelesaikan 64% total cacat jahit di seluruh line. Pastikan tension benang diperiksa sebelum start jam 1."
                        : "Kombinasi 'Operator Tidak Hadir' dan 'Cycle Time > Takt Time' menyumbang 65.5% bottleneck. Sistem rekomendasi layout berbasis operator hadir wajib diterapkan setiap pagi untuk menutup stasiun kritis."}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB 3: 6M FISHBONE DIAGRAM */}
      {activeTab === "fishbone" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Diagram Sebab-Akibat Ishikawa (6M Fishbone Analysis)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Analisis menyeluruh akar permasalahan produksi sewing: Man, Machine, Method, Material, Measurement, Milieu.
                </p>
              </div>

              {/* Add item to fishbone */}
              <div className="flex items-center space-x-2">
                <select
                  value={newFishboneItem.category}
                  onChange={(e) =>
                    setNewFishboneItem({
                      ...newFishboneItem,
                      category: e.target.value as keyof Fishbone6M,
                    })
                  }
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold"
                >
                  <option value="man">Man (Manusia/Operator)</option>
                  <option value="machine">Machine (Mesin Jahit)</option>
                  <option value="method">Method (Metode Kerja)</option>
                  <option value="material">Material (Kain & Aksesoris)</option>
                  <option value="measurement">Measurement (Pengukuran)</option>
                  <option value="milieu">Milieu (Lingkungan)</option>
                </select>

                <input
                  type="text"
                  placeholder="Tambah penyebab baru..."
                  value={newFishboneItem.text}
                  onChange={(e) => setNewFishboneItem({ ...newFishboneItem, text: e.target.value })}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs w-52"
                />

                <button
                  onClick={handleAddFishbone}
                  disabled={!newFishboneItem.text.trim()}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 6M Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Man */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-2">
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>1. Man (Tenaga Kerja & Kehadiran)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {fishbone.man.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Machine */}
              <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/40 space-y-2">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
                  <Cpu className="w-4 h-4 text-indigo-600" />
                  <span>2. Machine (Peralatan & Mesin)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {fishbone.machine.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Method */}
              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-2">
                <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs uppercase tracking-wider">
                  <GitCommit className="w-4 h-4 text-purple-600" />
                  <span>3. Method (Metode & Layout)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {fishbone.method.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Material */}
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-2">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Layers className="w-4 h-4 text-amber-600" />
                  <span>4. Material (Kain & Benang)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {fishbone.material.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Measurement */}
              <div className="p-4 rounded-2xl border border-teal-200 bg-teal-50/40 space-y-2">
                <div className="flex items-center space-x-2 text-teal-900 font-bold text-xs uppercase tracking-wider">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>5. Measurement (Takt & Target)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {fishbone.measurement.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Milieu */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2">
                <div className="flex items-center space-x-2 text-slate-900 font-bold text-xs uppercase tracking-wider">
                  <Flame className="w-4 h-4 text-slate-600" />
                  <span>6. Milieu (Lingkungan Produksi)</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {fishbone.milieu.map((item, i) => (
                    <li key={i} className="flex items-start space-x-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-500 mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: 5 WHY ROOT CAUSE ANALYSIS */}
      {activeTab === "5why" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Metodologi 5-Why Root Cause Drill Down
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Menelusuri rantai kausalitas kegagalan hingga ke akar masalah paling mendasar, tindakan korektif, dan tindakan pencegahan.
                </p>
              </div>

              <button
                onClick={() => setIsAddingWhy(!isAddingWhy)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Analisis 5 Why</span>
              </button>
            </div>

            {/* New 5 Why Form Modal / Drawer */}
            {isAddingWhy && (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs animate-in fade-in">
                <div className="font-bold text-slate-900 text-sm">Formulir 5 Why Baru:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Line:</label>
                    <select
                      value={newWhy.line}
                      onChange={(e) => setNewWhy({ ...newWhy, line: Number(e.target.value) as LineNumber })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    >
                      {VALID_LINES.map((l) => (
                        <option key={l} value={l}>
                          Line {l}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Stasiun / Proses:</label>
                    <input
                      type="text"
                      placeholder="Contoh: Stasiun 19 - Join Plaket"
                      value={newWhy.stationOrProcess}
                      onChange={(e) => setNewWhy({ ...newWhy, stationOrProcess: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-600 font-bold mb-1">Pernyataan Masalah (Problem Statement):</label>
                  <input
                    type="text"
                    placeholder="Apa masalah aktual yang terjadi?"
                    value={newWhy.issue}
                    onChange={(e) => setNewWhy({ ...newWhy, issue: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold"
                  />
                </div>

                {/* 5 Whys inputs */}
                <div className="space-y-2 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <div key={num} className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-600 w-16 shrink-0">Why #{num}:</span>
                      <input
                        type="text"
                        placeholder={`Kenapa masalah terjadi? (Tahap ${num})`}
                        value={(newWhy as any)[`why${num}`] || ""}
                        onChange={(e) => setNewWhy({ ...newWhy, [`why${num}`]: e.target.value })}
                        className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                      />
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Akar Masalah (Root Cause):</label>
                    <input
                      type="text"
                      placeholder="Akar penyebab sejati..."
                      value={newWhy.rootCause}
                      onChange={(e) => setNewWhy({ ...newWhy, rootCause: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">PIC (Penanggung Jawab):</label>
                    <input
                      type="text"
                      placeholder="Nama Supervisor / PE..."
                      value={newWhy.pic}
                      onChange={(e) => setNewWhy({ ...newWhy, pic: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Tindakan Korektif (Corrective Action):</label>
                    <input
                      type="text"
                      placeholder="Langkah langsung saat ini..."
                      value={newWhy.correctiveAction}
                      onChange={(e) => setNewWhy({ ...newWhy, correctiveAction: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Tindakan Pencegahan (Preventive Action):</label>
                    <input
                      type="text"
                      placeholder="Langkah jangka panjang agar tidak terulang..."
                      value={newWhy.preventiveAction}
                      onChange={(e) => setNewWhy({ ...newWhy, preventiveAction: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => setIsAddingWhy(false)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveWhy}
                    className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold"
                  >
                    Simpan Kasus 5 Why
                  </button>
                </div>
              </div>
            )}

            {/* List of 5 Why Cases */}
            <div className="space-y-4">
              {fiveWhyCases.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-mono font-bold text-[10px]">
                          Line {c.line}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{c.stationOrProcess}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm mt-1">{c.issue}</h4>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        c.status === "Resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "In Progress"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* 5 Whys Chain */}
                  <div className="pl-3 border-l-2 border-blue-400 space-y-1.5 text-xs text-slate-700 bg-white p-3 rounded-r-xl border border-slate-200/80">
                    <div className="flex items-start space-x-2">
                      <span className="font-mono text-blue-600 font-bold shrink-0">W1:</span>
                      <span>{c.why1}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-mono text-blue-600 font-bold shrink-0">W2:</span>
                      <span>{c.why2}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-mono text-blue-600 font-bold shrink-0">W3:</span>
                      <span>{c.why3}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-mono text-blue-600 font-bold shrink-0">W4:</span>
                      <span>{c.why4}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-mono text-blue-600 font-bold shrink-0">W5:</span>
                      <span>{c.why5}</span>
                    </div>
                  </div>

                  {/* Root Cause & Actions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                    <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                      <span className="text-[10px] uppercase font-bold text-red-700 block">
                        Akar Masalah (Root Cause):
                      </span>
                      <p className="font-semibold text-red-950 mt-0.5">{c.rootCause}</p>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">
                        Tindakan Korektif (Langsung):
                      </span>
                      <p className="font-semibold text-blue-950 mt-0.5">{c.correctiveAction}</p>
                    </div>

                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                        Tindakan Pencegahan (Preventif):
                      </span>
                      <p className="font-semibold text-emerald-950 mt-0.5">{c.preventiveAction}</p>
                      <span className="text-[10px] text-emerald-700 mt-1 block">PIC: {c.pic}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: RECOMMENDATION ENGINE */}
      {activeTab === "recommendations" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Recommendation Engine & Tindakan Pencegahan/Perbaikan</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tindakan rekayasa industri yang dihasilkan berdasarkan anomali output aktual, kehadiran operator, dan beban mesin.
                </p>
              </div>

              <button
                onClick={onOpenTargetAnalysis}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Analisis AI Mendalam</span>
              </button>
            </div>

            <div className="space-y-4">
              {INITIAL_RECOMMENDATIONS.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                    rec.priority === "CRITICAL"
                      ? "bg-rose-50/40 border-rose-300"
                      : rec.priority === "HIGH"
                      ? "bg-amber-50/40 border-amber-300"
                      : "bg-blue-50/40 border-blue-200"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          rec.priority === "CRITICAL"
                            ? "bg-rose-600 text-white"
                            : rec.priority === "HIGH"
                            ? "bg-amber-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {rec.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                        Line {rec.lineId} &bull; Kategori: {rec.category}
                      </span>
                    </div>

                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {rec.estimatedImpact}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{rec.issue}</h4>

                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">Akar Masalah:</strong> {rec.rootCause}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-blue-700 block">
                        Tindakan Taktis Segera (Immediate Action):
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">{rec.immediateAction}</p>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">
                        Tindakan Pencegahan (Preventive Action):
                      </span>
                      <p className="font-semibold text-slate-800 mt-0.5">{rec.preventiveAction}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
