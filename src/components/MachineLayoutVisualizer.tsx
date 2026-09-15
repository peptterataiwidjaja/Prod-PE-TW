import React, { useState } from "react";
import {
  LineNumber,
  User,
  ProcessItem,
  Operator,
  LayoutStation,
  LineBalancingResult,
  MachineRequirement,
  TandemAnalysisResult,
} from "../types";
import {
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
  ChevronRight,
  Flame,
  Printer,
  RotateCcw,
  Check,
  Star,
  Maximize2,
  Calendar,
  Cpu,
  Sliders,
  Info,
  AlertCircle,
  HelpCircle,
  Zap,
} from "lucide-react";
import { getGradeBadge } from "../utils/grading";

interface MachineLayoutVisualizerProps {
  lineId: LineNumber;
  currentUser: User;
  currentLayout: LayoutStation[];
  recommendedLayout: LayoutStation[];
  currentBalancing: LineBalancingResult;
  recommendedBalancing: LineBalancingResult;
  machineRequirements?: MachineRequirement[];
  workingHours?: number;
  workSchedule?: "senin_jumat" | "sabtu";
  onToggleWorkSchedule?: (schedule: "senin_jumat" | "sabtu") => void;
  alerts: string[];
  unassignedProcesses: ProcessItem[];
  tandemAnalysis?: TandemAnalysisResult;
  onApplyRecommendedLayout: () => void;
  onOpenPrintReport?: () => void;
}

export const MachineLayoutVisualizer: React.FC<MachineLayoutVisualizerProps> = ({
  lineId,
  currentUser,
  currentLayout,
  recommendedLayout,
  currentBalancing,
  recommendedBalancing,
  machineRequirements = [],
  workingHours = 8,
  workSchedule = "senin_jumat",
  onToggleWorkSchedule,
  alerts,
  unassignedProcesses,
  tandemAnalysis,
  onApplyRecommendedLayout,
  onOpenPrintReport,
}) => {
  const [activeTab, setActiveTab] = useState<
    "floor_plan" | "tandem_analysis" | "machine_bar" | "compare" | "pitch"
  >("floor_plan");
  const [viewMode, setViewMode] = useState<"recommended" | "current">("recommended");
  const [selectedStation, setSelectedStation] = useState<LayoutStation | null>(null);
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  // Local inventory adjustment to simulate machine availability
  const [customInventory, setCustomInventory] = useState<Record<string, number>>({});

  const canEdit =
    currentUser.role === "production_engineer" || currentUser.assignedLine === lineId;

  const handleApply = () => {
    onApplyRecommendedLayout();
    setAppliedSuccess(true);
    setTimeout(() => setAppliedSuccess(false), 4000);
  };

  const taktTime = currentBalancing.taktTimeSec;
  const activeLayout = viewMode === "recommended" ? recommendedLayout : currentLayout;

  // Split stations into Left Row (Ganjil - Infeed/Sub-assembly) and Right Row (Genap - Assembly/Finishing)
  const leftRowStations = activeLayout.filter((_, idx) => idx % 2 === 0);
  const rightRowStations = activeLayout.filter((_, idx) => idx % 2 !== 0);

  // Machine shortages counter
  const machineShortagesCount = machineRequirements.filter((m) => {
    const available = customInventory[m.machineType] !== undefined ? customInventory[m.machineType] : m.availableInFactory;
    return available < m.allocatedMachines;
  }).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
              <Layers className="w-5 h-5 text-blue-600" />
              <span>Tata Letak Sewing & Line Balancing &bull; Line {lineId}</span>
            </h2>
            <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Only HADIR Engine
            </span>
            {workSchedule === "sabtu" ? (
              <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-amber-600" />
                <span>Sabtu (5 Jam Kerja)</span>
              </span>
            ) : (
              <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center space-x-1">
                <Clock className="w-3 h-3 text-blue-600" />
                <span>Senin - Jumat (8 Jam Kerja)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualisasi penempatan meja jahit sewing, monitoring unit mesin harian, serta optimasi Double Job (SMV terkecil) & Tandem.
          </p>
        </div>

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
              >
                Sabtu (5h)
              </button>
            </div>
          )}

          {/* Apply Recommendation Button */}
          {canEdit && (
            <button
              onClick={handleApply}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center space-x-1.5 active:scale-95"
              title="Terapkan penempatan operator rekomendasi ke lembar hourly sheet"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Terapkan Rekomendasi ke Line</span>
            </button>
          )}

          {onOpenPrintReport && (
            <button
              onClick={onOpenPrintReport}
              className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              title="Cetak PDF Layout"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {appliedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Rekomendasi layout berhasil diterapkan! Penempatan operator pada lembar Hourly Control Sheet Line {lineId} telah disinkronkan.
          </span>
        </div>
      )}

      {/* Alerts & Warning Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alt, i) => (
            <div
              key={i}
              className={`p-3 border-l-4 rounded-xl text-xs flex items-start space-x-2.5 shadow-2xs ${
                alt.includes("Kekurangan mesin") || alt.includes("tidak hadir")
                  ? "bg-rose-50 border-rose-500 text-rose-900"
                  : alt.includes("Double Job")
                  ? "bg-amber-50 border-amber-500 text-amber-900"
                  : alt.includes("Tandem")
                  ? "bg-indigo-50 border-indigo-500 text-indigo-900"
                  : "bg-blue-50 border-blue-500 text-blue-900"
              }`}
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-current" />
              <div className="leading-relaxed font-medium">{alt}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab("floor_plan")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "floor_plan"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>🏭 Denah Visual Meja Sewing (Floor Plan 26)</span>
          </button>
          <button
            onClick={() => setActiveTab("tandem_analysis")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "tandem_analysis"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>⚡ Analisis Tandem & Layout 26</span>
            {tandemAnalysis && tandemAnalysis.exceedingCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[10px] font-extrabold ml-1">
                +{tandemAnalysis.exceedingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("machine_bar")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "machine_bar"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>📊 Bar Unit Mesin & Kebutuhan Harian</span>
            {machineShortagesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("compare")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "compare"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>📋 Daftar Stasiun (Aktual vs Rekomendasi)</span>
          </button>
          <button
            onClick={() => setActiveTab("pitch")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === "pitch"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>📈 Pitch Diagram (Siklus vs Takt Time)</span>
          </button>
        </div>

        {/* View Toggle (Recommended vs Current) */}
        {activeTab === "floor_plan" && (
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode("recommended")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "recommended"
                  ? "bg-white text-blue-700 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Layout Rekomendasi (Double Job & Tandem)
            </button>
            <button
              onClick={() => setViewMode("current")}
              className={`px-3 py-1 rounded-lg transition-all ${
                viewMode === "current"
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Layout Aktual Line
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: VISUAL DENAH PENEMPATAN SEWING (FLOOR PLAN MEJA JAHIT) */}
      {activeTab === "floor_plan" && (
        <div className="space-y-4">
          {/* Header & Legend */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <span className="font-bold text-slate-900">Petunjuk Status Meja Sewing:</span>
              <span className="flex items-center space-x-1 text-slate-600">
                <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-500 inline-block" />
                <span>Normal Tercukupi</span>
              </span>
              <span className="flex items-center space-x-1 text-amber-700 font-semibold">
                <span className="w-3 h-3 rounded-sm bg-amber-100 border border-amber-500 inline-block" />
                <span>Double Job (SMV Terkecil)</span>
              </span>
              <span className="flex items-center space-x-1 text-indigo-700 font-semibold">
                <span className="w-3 h-3 rounded-sm bg-indigo-100 border border-indigo-500 inline-block" />
                <span>Tandem (2 Operator)</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-700 font-bold">
                <span className="w-3 h-3 rounded-sm bg-rose-100 border-2 border-rose-600 inline-block animate-pulse" />
                <span>⚠️ Warning / Bottleneck / Kosong</span>
              </span>
            </div>

            <div className="text-slate-500 font-medium">
              Aliran Material: <strong>Infeed (Kiri) &rarr; Conveyor Tengah &rarr; Outfeed (Kanan)</strong> &bull; Takt Time:{" "}
              <strong className="text-slate-900">{taktTime}s ({workingHours} Jam)</strong>
            </div>
          </div>

          {/* Sewing Line Floor Plan Canvas */}
          <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800 overflow-x-auto">
            <div className="min-w-[950px] space-y-6">
              {/* Floor Plan Header */}
              <div className="flex items-center justify-between text-slate-400 text-xs border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-bold uppercase tracking-wider text-slate-200">
                    SEWING FLOOR LAYOUT &bull; LINE {lineId} (26 WORKSTATIONS)
                  </span>
                </div>
                <div className="text-slate-400 font-mono">
                  Mode: {viewMode === "recommended" ? "Rekomendasi Teroptimasi (IE)" : "Aktual Berjalan"}
                </div>
              </div>

              {/* TWO PARALLEL SEWING ROWS WITH CENTER CONVEYOR AISLE */}
              <div className="relative">
                {/* ROW A (LEFT / INFEED SIDE - Stasiun Ganjil #1, #3, #5, ... #25) */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <span>Baris Kiri (Infeed / Front & Back Preparation)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Stasiun Ganjil #1 s/d #25</span>
                  </div>
                  <div className="grid grid-cols-6 lg:grid-cols-13 gap-2">
                    {leftRowStations.map((st) => {
                      const isUnassigned = st.status === "unassigned";
                      const isBottleneck = st.status === "bottleneck";
                      const isDoubleJob = st.isDoubleJob;
                      const isTandem = st.isTandem;
                      const hasWarning = isUnassigned || isBottleneck || st.hasMachineShortage;

                      return (
                        <div
                          key={st.stationNo}
                          onClick={() => setSelectedStation(st)}
                          className={`relative rounded-xl p-2.5 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg ${
                            isTandem
                              ? "bg-gradient-to-b from-indigo-950 via-slate-900 to-purple-950 border-2 border-indigo-400 shadow-md shadow-indigo-950/80 ring-1 ring-indigo-400/50"
                              : isUnassigned
                              ? "bg-rose-950/80 border-2 border-rose-500 shadow-rose-950"
                              : isBottleneck
                              ? "bg-rose-950/60 border-2 border-rose-500"
                              : isDoubleJob
                              ? "bg-amber-950/50 border border-amber-400"
                              : "bg-slate-800/90 border border-slate-700 hover:border-blue-400"
                          }`}
                        >
                          {/* Top Tag: Station No & Machine / Tandem Badge */}
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span
                              className={`font-extrabold px-1 rounded ${
                                isTandem
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-700/80 text-white"
                              }`}
                            >
                              #{st.stationNo}
                            </span>
                            {isTandem ? (
                              <span className="font-extrabold text-amber-300 text-[8px] px-1 py-0.2 bg-indigo-500/40 rounded border border-indigo-400/50">
                                ⚡ TANDEM
                              </span>
                            ) : (
                              <span className="font-bold text-blue-300 truncate max-w-[50px]">
                                {st.machineType}
                              </span>
                            )}
                          </div>

                          {/* Sewing Machine & Needle Icon Graphic */}
                          <div
                            className={`h-10 w-full rounded-lg flex items-center justify-center my-1 relative border ${
                              isTandem
                                ? "bg-indigo-950/80 border-indigo-500/50"
                                : "bg-slate-950/60 border-slate-800"
                            }`}
                          >
                            <div className="text-slate-400 flex flex-col items-center">
                              <span className="text-[14px] leading-none">
                                {isTandem ? "🪡⚡🪡" : "🪡"}
                              </span>
                              <span
                                className={`text-[8px] font-mono font-bold ${
                                  isTandem ? "text-indigo-300" : "text-slate-400"
                                }`}
                              >
                                {st.cycleTimeSec}s
                              </span>
                            </div>

                            {/* Warning Indicator */}
                            {hasWarning && !isTandem && (
                              <div
                                className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow-md animate-bounce"
                                title="Peringatan Masalah!"
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </div>
                            )}

                            {isDoubleJob && !hasWarning && (
                              <div
                                className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-900 rounded-full text-[8px] font-extrabold px-1"
                                title="Double Job"
                              >
                                DJ
                              </div>
                            )}

                            {isTandem && (
                              <div
                                className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-400 to-indigo-500 text-slate-950 rounded-full text-[8px] font-black px-1 shadow-sm"
                                title="Stasiun Tandem (2 Op / 2 Proses)"
                              >
                                2X
                              </div>
                            )}
                          </div>

                          {/* Process Name */}
                          <div
                            className="text-[10px] font-bold text-slate-200 truncate"
                            title={st.processName}
                          >
                            {st.processName}
                          </div>
                          {isTandem && st.tandemProcessName && (
                            <div
                              className="text-[8px] font-bold text-amber-300 truncate mt-0.5"
                              title={`Proses Tandem: #${st.tandemProcessNo} ${st.tandemProcessName}`}
                            >
                              + #{st.tandemProcessNo} {st.tandemProcessName}
                            </div>
                          )}

                          {/* Operator */}
                          <div
                            className={`text-[9px] truncate mt-0.5 ${
                              isTandem ? "text-indigo-200 font-semibold" : "text-slate-400"
                            }`}
                            title={st.assignedOperatorName}
                          >
                            {isUnassigned ? (
                              <span className="text-rose-400 font-bold">KOSONG</span>
                            ) : isTandem ? (
                              <span>{st.assignedOperatorName?.replace(" (Tandem)", "")}</span>
                            ) : (
                              <span>{st.assignedOperatorName?.split(" ")[0]}</span>
                            )}
                          </div>

                          {/* Badge Footer */}
                          <div className="mt-1 flex items-center justify-between text-[8px] font-mono">
                            <span
                              className={isTandem ? "text-indigo-300 font-bold" : "text-slate-400"}
                            >
                              {isTandem && st.combinedSMV ? `∑${st.combinedSMV}m` : `SMV ${st.smv}m`}
                            </span>
                            {isTandem ? (
                              <span className="text-amber-400 font-bold">TANDEM</span>
                            ) : st.workloadRatio > 1.0 ? (
                              <span className="text-rose-400 font-bold">
                                +{Math.round((st.workloadRatio - 1) * 100)}%
                              </span>
                            ) : (
                              <span className="text-emerald-400">OK</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CENTER AISLE / MATERIAL CONVEYOR LINE */}
                <div className="my-4 py-2 px-4 bg-slate-950/80 rounded-2xl border border-dashed border-slate-700 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                    <span className="text-blue-400 font-bold">CONVEYOR WIP / MEJA TRANSIT BUNDLING</span>
                  </div>
                  <div className="flex items-center space-x-4 text-slate-400 text-[11px]">
                    <span>&larr; Aliran Potongan Kain</span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-amber-400 font-semibold">Takt Time: {taktTime} Detik/Pcs</span>
                    <span className="text-slate-600">&bull;</span>
                    <span>Aliran Komponen Jadi &rarr;</span>
                  </div>
                </div>

                {/* ROW B (RIGHT / OUTFEED SIDE - Stasiun Genap #2, #4, #6, ... #26) */}
                <div>
                  <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center space-x-2">
                    <span>Baris Kanan (Assembly / Outfeed & Finishing)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Stasiun Genap #2 s/d #26</span>
                  </div>
                  <div className="grid grid-cols-6 lg:grid-cols-13 gap-2">
                    {rightRowStations.map((st) => {
                      const isUnassigned = st.status === "unassigned";
                      const isBottleneck = st.status === "bottleneck";
                      const isDoubleJob = st.isDoubleJob;
                      const isTandem = st.isTandem;
                      const hasWarning = isUnassigned || isBottleneck || st.hasMachineShortage;

                      return (
                        <div
                          key={st.stationNo}
                          onClick={() => setSelectedStation(st)}
                          className={`relative rounded-xl p-2.5 cursor-pointer transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg ${
                            isTandem
                              ? "bg-gradient-to-b from-indigo-950 via-slate-900 to-purple-950 border-2 border-indigo-400 shadow-md shadow-indigo-950/80 ring-1 ring-indigo-400/50"
                              : isUnassigned
                              ? "bg-rose-950/80 border-2 border-rose-500 shadow-rose-950"
                              : isBottleneck
                              ? "bg-rose-950/60 border-2 border-rose-500"
                              : isDoubleJob
                              ? "bg-amber-950/50 border border-amber-400"
                              : "bg-slate-800/90 border border-slate-700 hover:border-emerald-400"
                          }`}
                        >
                          {/* Top Tag: Station No & Machine / Tandem Badge */}
                          <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                            <span
                              className={`font-extrabold px-1 rounded ${
                                isTandem
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-700/80 text-white"
                              }`}
                            >
                              #{st.stationNo}
                            </span>
                            {isTandem ? (
                              <span className="font-extrabold text-amber-300 text-[8px] px-1 py-0.2 bg-indigo-500/40 rounded border border-indigo-400/50">
                                ⚡ TANDEM
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-300 truncate max-w-[50px]">
                                {st.machineType}
                              </span>
                            )}
                          </div>

                          {/* Sewing Machine & Needle Icon Graphic */}
                          <div
                            className={`h-10 w-full rounded-lg flex items-center justify-center my-1 relative border ${
                              isTandem
                                ? "bg-indigo-950/80 border-indigo-500/50"
                                : "bg-slate-950/60 border-slate-800"
                            }`}
                          >
                            <div className="text-slate-400 flex flex-col items-center">
                              <span className="text-[14px] leading-none">
                                {isTandem ? "🪡⚡🪡" : "🪡"}
                              </span>
                              <span
                                className={`text-[8px] font-mono font-bold ${
                                  isTandem ? "text-indigo-300" : "text-slate-400"
                                }`}
                              >
                                {st.cycleTimeSec}s
                              </span>
                            </div>

                            {/* Warning Indicator */}
                            {hasWarning && !isTandem && (
                              <div
                                className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white rounded-full p-0.5 shadow-md animate-bounce"
                                title="Peringatan Masalah!"
                              >
                                <AlertTriangle className="w-3 h-3" />
                              </div>
                            )}

                            {isDoubleJob && !hasWarning && (
                              <div
                                className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-900 rounded-full text-[8px] font-extrabold px-1"
                                title="Double Job"
                              >
                                DJ
                              </div>
                            )}

                            {isTandem && (
                              <div
                                className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-amber-400 to-indigo-500 text-slate-950 rounded-full text-[8px] font-black px-1 shadow-sm"
                                title="Stasiun Tandem (2 Op / 2 Proses)"
                              >
                                2X
                              </div>
                            )}
                          </div>

                          {/* Process Name */}
                          <div
                            className="text-[10px] font-bold text-slate-200 truncate"
                            title={st.processName}
                          >
                            {st.processName}
                          </div>
                          {isTandem && st.tandemProcessName && (
                            <div
                              className="text-[8px] font-bold text-amber-300 truncate mt-0.5"
                              title={`Proses Tandem: #${st.tandemProcessNo} ${st.tandemProcessName}`}
                            >
                              + #{st.tandemProcessNo} {st.tandemProcessName}
                            </div>
                          )}

                          {/* Operator */}
                          <div
                            className={`text-[9px] truncate mt-0.5 ${
                              isTandem ? "text-indigo-200 font-semibold" : "text-slate-400"
                            }`}
                            title={st.assignedOperatorName}
                          >
                            {isUnassigned ? (
                              <span className="text-rose-400 font-bold">KOSONG</span>
                            ) : isTandem ? (
                              <span>{st.assignedOperatorName?.replace(" (Tandem)", "")}</span>
                            ) : (
                              <span>{st.assignedOperatorName?.split(" ")[0]}</span>
                            )}
                          </div>

                          {/* Badge Footer */}
                          <div className="mt-1 flex items-center justify-between text-[8px] font-mono">
                            <span
                              className={isTandem ? "text-indigo-300 font-bold" : "text-slate-400"}
                            >
                              {isTandem && st.combinedSMV ? `∑${st.combinedSMV}m` : `SMV ${st.smv}m`}
                            </span>
                            {isTandem ? (
                              <span className="text-amber-400 font-bold">TANDEM</span>
                            ) : st.workloadRatio > 1.0 ? (
                              <span className="text-rose-400 font-bold">
                                +{Math.round((st.workloadRatio - 1) * 100)}%
                              </span>
                            ) : (
                              <span className="text-emerald-400">OK</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ANALISIS TANDEM & PEMETAAN LAYOUT 26 */}
      {activeTab === "tandem_analysis" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-6 border border-indigo-700/50 shadow-xl text-white">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 text-xs font-bold mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Industrial Engineering &bull; Alokasi Stasiun Tandem & Batasan Meja 26</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Analisis Komparasi Tandem & Pemetaan Layout 26
                </h2>
                <p className="text-xs sm:text-sm text-indigo-200 mt-1 max-w-3xl leading-relaxed">
                  Sesuai standar ergonomi sewing floor garmen, fisik layout dipertahankan tepat 26 stasiun kerja
                  (13 meja baris kiri Infeed &bull; 13 meja baris kanan Outfeed). Ketika style breakdown proses
                  melebihi 26 (atau memiliki bottleneck tinggi), proses berlebih dialokasikan ke stasiun tandem
                  dengan 2 operator/helper untuk membagi siklus kerja dan menjaga Takt Time ({taktTime}s).
                </p>
              </div>

              <div className="flex items-center space-x-2">
                {onOpenPrintReport && (
                  <button
                    onClick={onOpenPrintReport}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center space-x-1.5 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Laporan IE</span>
                  </button>
                )}
              </div>
            </div>

            {/* 4 Metric Highlight Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-800/60 text-xs">
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-indigo-900/60">
                <span className="text-slate-400 text-[11px] block">Kapasitas Fisik Standar:</span>
                <span className="text-lg font-black text-white">26 Stasiun</span>
                <span className="text-[10px] text-indigo-300 block">13 Infeed &bull; 13 Outfeed</span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-indigo-900/60">
                <span className="text-slate-400 text-[11px] block">Total Proses BP Line:</span>
                <span className="text-lg font-black text-blue-400">
                  {tandemAnalysis?.totalProcesses || 26} Proses
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {tandemAnalysis && tandemAnalysis.totalProcesses > 26 ? "Melebihi 26 stasiun" : "Dalam batas 26"}
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-indigo-900/60">
                <span className="text-slate-400 text-[11px] block">Proses Berlebih (&gt; 26):</span>
                <span
                  className={`text-lg font-black ${
                    tandemAnalysis && tandemAnalysis.exceedingCount > 0 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {tandemAnalysis?.exceedingCount || 0} Proses
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Ditampung di Stasiun Tandem
                </span>
              </div>
              <div className="bg-slate-950/70 p-3 rounded-2xl border border-indigo-900/60">
                <span className="text-slate-400 text-[11px] block">Stasiun Tandem Aktif:</span>
                <span className="text-lg font-black text-indigo-400">
                  {tandemAnalysis?.tandemStationCount || 0} Stasiun
                </span>
                <span className="text-[10px] text-emerald-300 block">Beban Kerja Terbagi</span>
              </div>
            </div>
          </div>

          {/* Tandem Comparison Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <span>Daftar Komparasi & Rincian Stasiun Tandem vs Stasiun Tunggal</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Rincian stasiun fisik (#1 s/d #26) yang mengoperasikan tandem dengan 2 operator atau menyerap proses &gt; 26
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                {tandemAnalysis?.tandemStations?.length || 0} Stasiun Tandem Terkonfigurasi
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 w-16 text-center">Meja #</th>
                    <th className="py-3 px-3">Proses Utama (Host)</th>
                    <th className="py-3 px-3">Proses Tandem (&gt;26 / Bantuan)</th>
                    <th className="py-3 px-3">Operator yang Terlibat</th>
                    <th className="py-3 px-2 text-center w-20">SMV Total</th>
                    <th className="py-3 px-2 text-center w-24">Waktu Siklus Efektif</th>
                    <th className="py-3 px-2 text-center w-24">Status Takt ({taktTime}s)</th>
                    <th className="py-3 px-3 min-w-[220px]">Analisis IE & Manfaat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tandemAnalysis && tandemAnalysis.tandemStations.length > 0 ? (
                    tandemAnalysis.tandemStations.map((item) => (
                      <tr key={item.stationNo} className="hover:bg-indigo-50/40 transition-colors">
                        <td className="py-3.5 px-3 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-100 text-indigo-900 font-extrabold font-mono text-xs border border-indigo-300">
                            #{item.stationNo}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">
                            P#{item.primaryProcessNo}: {item.primaryProcessName}
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            Mesin: {item.primaryMachine} &bull; SMV: {item.primarySMV}m ({item.primaryCycleTimeSec}s)
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-indigo-950 flex items-center space-x-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-indigo-600 text-white">
                              TANDEM
                            </span>
                            <span>
                              {item.tandemProcessNo > 0 ? `P#${item.tandemProcessNo}: ` : ""}
                              {item.tandemProcessName}
                            </span>
                          </div>
                          <div className="text-[11px] text-indigo-700 font-mono mt-0.5">
                            Mesin: {item.tandemMachine} &bull; SMV: {item.tandemSMV}m ({item.tandemCycleTimeSec}s)
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="flex items-center space-x-1 text-slate-800 font-medium">
                            <span className="font-bold text-slate-900">{item.primaryOperatorName}</span>
                            <span className="text-indigo-600 font-bold">&</span>
                            <span className="font-bold text-indigo-700">{item.tandemOperatorName}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 block mt-0.5">2 Operator Kolaboratif</span>
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono font-extrabold text-indigo-950 bg-indigo-50/40">
                          {item.combinedSMV}m
                        </td>
                        <td className="py-3.5 px-2 text-center font-mono">
                          <div className="font-extrabold text-slate-900 text-xs">
                            {item.effectiveCycleTimeSec}s
                          </div>
                          <div className="text-[9px] text-slate-400 line-through">
                            {item.primaryCycleTimeSec + item.tandemCycleTimeSec}s (1 Op)
                          </div>
                        </td>
                        <td className="py-3.5 px-2 text-center">
                          {item.effectiveCycleTimeSec <= item.taktTimeSec ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Lolos ({Math.round((item.effectiveCycleTimeSec / item.taktTimeSec) * 100)}%)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                              Waspada
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 text-[11px] leading-relaxed">
                          <div className="font-semibold text-slate-900 mb-0.5">{item.reason}</div>
                          <div className="text-slate-500">{item.engineeringBenefit}</div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Tidak ada stasiun tandem aktif pada konfigurasi saat ini. Seluruh proses tertampung normal dalam 26 stasiun.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Complete 26-Station Mapping Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Ikhtisar Alokasi 26 Stasiun Meja Jahit
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-13 gap-2">
              {recommendedLayout.slice(0, 26).map((st) => {
                const isTandem = st.isTandem;
                const isDoubleJob = st.isDoubleJob;
                return (
                  <div
                    key={st.stationNo}
                    onClick={() => setSelectedStation(st)}
                    className={`p-2 rounded-xl text-center cursor-pointer transition-all border ${
                      isTandem
                        ? "bg-indigo-900 text-white border-indigo-500 shadow-xs"
                        : isDoubleJob
                        ? "bg-amber-100 text-amber-900 border-amber-300"
                        : "bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200"
                    }`}
                  >
                    <div className="text-[10px] font-mono font-bold">#{st.stationNo}</div>
                    <div className="text-[8px] truncate font-semibold mt-0.5">
                      {isTandem ? "TANDEM" : isDoubleJob ? "DOUBLE" : "SINGLE"}
                    </div>
                    <div className="text-[8px] font-mono mt-0.5 opacity-80">{st.cycleTimeSec}s</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MONITORING BAR UNIT MESIN & KEBUTUHAN HARIAN */}
      {activeTab === "machine_bar" && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <span>Kalkulasi Kebutuhan Mesin Harian vs Unit Tersedia di Pabrik</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Formula IE: <code>Kebutuhan Mesin = (Total SAM &times; Target Harian) / (Jam Kerja &times; 60 &times; Efisiensi 85%)</code>
                </p>
              </div>

              <div className="flex items-center space-x-3 text-xs">
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
                  <span className="text-[10px] uppercase font-bold text-blue-700 block">Basis Jam Kerja:</span>
                  <span className="font-extrabold text-blue-950 font-mono">{workingHours} Jam ({workingHours * 60} Menit)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Target Harian:</span>
                  <span className="font-extrabold text-slate-800 font-mono">{workingHours * 10} Pcs / Hari</span>
                </div>
              </div>
            </div>

            {/* List of Machine Bars */}
            <div className="mt-5 space-y-4">
              {machineRequirements.map((req) => {
                const available = customInventory[req.machineType] !== undefined
                  ? customInventory[req.machineType]
                  : req.availableInFactory;
                const needed = req.allocatedMachines;
                const surplusOrShortage = available - needed;
                const isShortage = surplusOrShortage < 0;
                const isTight = surplusOrShortage >= 0 && surplusOrShortage <= 1;

                // Percentage used
                const usagePct = available > 0 ? Math.min(100, Math.round((needed / available) * 100)) : 100;

                return (
                  <div
                    key={req.machineType}
                    className={`p-4 rounded-2xl border transition-all ${
                      isShortage
                        ? "bg-rose-50/70 border-rose-300 shadow-rose-100"
                        : isTight
                        ? "bg-amber-50/50 border-amber-300"
                        : "bg-slate-50/60 border-slate-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="px-2.5 py-1 bg-slate-900 text-white rounded-lg font-mono font-bold text-xs">
                          {req.machineType}
                        </span>
                        <div>
                          <span className="font-bold text-slate-900 text-xs">{req.displayName}</span>
                          <span className="text-[11px] text-slate-500 ml-2">
                            ({req.processCount} proses &bull; Total SAM: {req.totalSAM}m)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 text-xs font-mono">
                        <span className="text-slate-600">
                          Dibutuhkan: <strong className="text-slate-900">{needed} unit</strong>
                        </span>
                        <span className="text-slate-400">&bull;</span>
                        <span className="text-slate-600">
                          Tersedia di Pabrik: <strong className="text-blue-700">{available} unit</strong>
                        </span>
                        <span className="text-slate-400">&bull;</span>

                        {isShortage ? (
                          <span className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-bold animate-pulse flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>DEFISIT {Math.abs(surplusOrShortage)} UNIT!</span>
                          </span>
                        ) : isTight ? (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold border border-amber-300">
                            Sisa Cadangan {surplusOrShortage} unit (Kritis)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold border border-emerald-300">
                            Surplus +{surplusOrShortage} unit (Aman)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isShortage
                            ? "bg-rose-600"
                            : isTight
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${Math.min(100, usagePct)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-mono">
                      <span>Utilisasi Mesin: {req.utilizationPercent}%</span>
                      <span>
                        {isShortage
                          ? "Segera tarik mesin cadangan dari gudang atau pinjam dari line lain"
                          : `Tersedia ${surplusOrShortage} unit buffer untuk perawatan`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SIDE BY SIDE LIST (CURRENT VS RECOMMENDED) */}
      {activeTab === "compare" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CURRENT LAYOUT PANEL */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Layout Berjalan</span>
                <h3 className="font-bold text-slate-800 text-sm">Layout Aktual (Current)</h3>
              </div>
              <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                Efisiensi: {currentBalancing.balanceEfficiency}%
              </span>
            </div>

            <div className="p-3 max-h-[600px] overflow-y-auto space-y-2 divide-y divide-slate-100">
              {currentLayout.map((st) => {
                const gradeBadge = getGradeBadge(st.operatorGrade);
                const isUnassigned = st.status === "unassigned";

                return (
                  <div
                    key={st.stationNo}
                    className={`pt-2 flex items-center justify-between text-xs p-2 rounded-xl transition-colors ${
                      isUnassigned ? "bg-rose-50/60 border border-rose-200" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-mono font-bold shrink-0">
                        {st.stationNo}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 truncate max-w-[190px]">
                          {st.processName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                          <span className="font-mono">{st.machineType}</span>
                          <span>&bull;</span>
                          <span>SAM: {st.sam}m</span>
                          <span>&bull;</span>
                          <span>{st.cycleTimeSec}s</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-semibold text-slate-800 flex items-center justify-end space-x-1">
                        <span>{st.assignedOperatorName}</span>
                        {gradeBadge && (
                          <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${gradeBadge.lightBg} ${gradeBadge.text}`}>
                            {st.operatorGrade}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px]">
                        {isUnassigned ? (
                          <span className="text-rose-600 font-bold">Operator Absen</span>
                        ) : (
                          <span className="text-slate-400">Match: {st.matchScore}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECOMMENDED LAYOUT PANEL */}
          <div className="bg-white rounded-2xl border-2 border-blue-600 shadow-md overflow-hidden">
            <div className="p-4 bg-blue-50/70 border-b border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-700 block flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Rekomendasi Double Job & Tandem IE</span>
                </span>
                <h3 className="font-bold text-blue-950 text-sm">Layout Rekomendasi (Teroptimasi)</h3>
              </div>
              <span className="text-xs font-mono font-extrabold text-blue-800 bg-white px-2.5 py-1 rounded-lg border border-blue-300">
                Efisiensi: {recommendedBalancing.balanceEfficiency}%
              </span>
            </div>

            <div className="p-3 max-h-[600px] overflow-y-auto space-y-2 divide-y divide-slate-100">
              {recommendedLayout.map((st) => {
                const gradeBadge = getGradeBadge(st.operatorGrade);
                const isBottleneck = st.status === "bottleneck";
                const isDoubleJob = st.isDoubleJob;
                const isTandem = st.isTandem;

                return (
                  <div
                    key={st.stationNo}
                    className={`pt-2 flex items-center justify-between text-xs p-2 rounded-xl transition-colors ${
                      isDoubleJob
                        ? "bg-amber-50/80 border border-amber-300"
                        : isTandem
                        ? "bg-indigo-50/80 border border-indigo-300"
                        : isBottleneck
                        ? "bg-rose-50/50 border border-rose-200"
                        : "hover:bg-blue-50/30"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-mono font-bold shrink-0">
                        {st.stationNo}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 truncate max-w-[190px]">
                          {st.processName}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center space-x-2">
                          <span className="font-mono text-slate-600 font-semibold">{st.machineType}</span>
                          <span>&bull;</span>
                          <span>SAM: {st.sam}m</span>
                          <span>&bull;</span>
                          <span>{st.cycleTimeSec}s</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-semibold text-slate-800 flex items-center justify-end space-x-1">
                        <span>{st.assignedOperatorName}</span>
                        {gradeBadge && (
                          <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${gradeBadge.lightBg} ${gradeBadge.text}`}>
                            {st.operatorGrade}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] flex items-center justify-end space-x-1">
                        {isDoubleJob ? (
                          <span className="text-amber-800 font-bold bg-amber-100 px-1.5 py-0.5 rounded">
                            Double Job (SMV: {st.doubleJobOriginSMV}m)
                          </span>
                        ) : isTandem ? (
                          <span className="text-indigo-800 font-bold bg-indigo-100 px-1.5 py-0.5 rounded">
                            Tandem (2 Op)
                          </span>
                        ) : isBottleneck ? (
                          <span className="text-rose-600 font-bold flex items-center">
                            <Flame className="w-3 h-3 text-red-500 mr-0.5" />
                            Bottleneck
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Match: {st.matchScore}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PITCH DIAGRAM */}
      {activeTab === "pitch" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Pitch Diagram &bull; Distribusi Waktu Siklus (Cycle Time) vs Takt Time ({taktTime}s)
              </h3>
              <p className="text-xs text-slate-500">
                Visualisasi beban kerja stasiun 1 hingga {recommendedLayout.length}. Garis merah menunjukkan batas Takt Time ({workingHours} Jam Kerja).
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="flex items-center space-x-1 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                <span>Siklus Normal</span>
              </span>
              <span className="flex items-center space-x-1 text-amber-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                <span>Double Job</span>
              </span>
              <span className="flex items-center space-x-1 text-rose-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
                <span>Bottleneck (&gt; {taktTime}s)</span>
              </span>
            </div>
          </div>

          <div className="pt-4 overflow-x-auto pb-2">
            <div className="min-w-[700px] h-40 flex items-end space-x-1.5 border-b border-slate-300 relative">
              {/* Takt Time Horizontal Line */}
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-rose-500 z-10 flex items-center justify-end pr-2"
                style={{ bottom: `${Math.min(95, (taktTime / 180) * 100)}%` }}
              >
                <span className="bg-rose-50 text-rose-700 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-rose-200">
                  Takt Time: {taktTime}s
                </span>
              </div>

              {recommendedLayout.map((st) => {
                const heightPct = Math.min(100, Math.max(10, (st.cycleTimeSec / 150) * 100));
                const isBottleneck = st.status === "bottleneck";
                const isUnassigned = st.status === "unassigned";
                const isDoubleJob = st.isDoubleJob;

                return (
                  <div
                    key={st.stationNo}
                    className="flex-1 flex flex-col items-center group cursor-pointer"
                    onClick={() => setSelectedStation(st)}
                  >
                    <div className="w-full flex items-end justify-center h-32 relative">
                      <div
                        className={`w-full rounded-t-sm transition-all duration-200 group-hover:opacity-80 ${
                          isUnassigned
                            ? "bg-slate-300 border-t-2 border-rose-500"
                            : isBottleneck
                            ? "bg-rose-500"
                            : isDoubleJob
                            ? "bg-amber-400"
                            : st.cycleTimeSec > taktTime * 0.85
                            ? "bg-amber-300"
                            : "bg-blue-600"
                        }`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-mono text-slate-500 mt-1 group-hover:font-bold">
                      #{st.stationNo}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Station Detail Modal */}
      {selectedStation && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">
                  Detail Stasiun Kerja #{selectedStation.stationNo}
                </span>
                <h3 className="text-base font-bold text-slate-900">{selectedStation.processName}</h3>
                <div className="text-xs text-slate-500">{selectedStation.section} &bull; Mesin: {selectedStation.machineType}</div>
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                &times;
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Waktu Siklus (Cycle Time):</span>
                <span className="font-mono font-bold text-slate-800">{selectedStation.cycleTimeSec} detik</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Standard Allowed Minutes (SAM):</span>
                <span className="font-mono font-bold text-blue-700">{selectedStation.sam} menit</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Beban Kerja (vs Takt Time {taktTime}s):</span>
                <span className="font-mono font-bold text-slate-800">
                  {Math.round((selectedStation.cycleTimeSec / taktTime) * 100)}%
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Operator Rekomendasi:</span>
                <span className="font-bold text-slate-900">{selectedStation.assignedOperatorName}</span>
              </div>
              {selectedStation.isDoubleJob && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900">
                  <span className="font-bold block">Status: Double Job (Analisis SMV Terkecil)</span>
                  <p className="text-[11px] mt-0.5 text-amber-800">
                    Operator dari Stasiun #{selectedStation.doubleJobOriginStation} (SMV: {selectedStation.doubleJobOriginSMV}m) diperbantukan di stasiun ini.
                  </p>
                </div>
              )}
              {selectedStation.isTandem && (
                <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl text-indigo-950 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-indigo-900 flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                      <span>Stasiun Kerja Tandem (2 Operator / 2 Proses)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-200 text-indigo-900">
                      Layout 26
                    </span>
                  </div>

                  <div className="bg-white/80 p-2 rounded-xl border border-indigo-100 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="font-semibold text-slate-700">Proses Utama:</span>
                      <span className="font-bold text-slate-900">
                        P#{selectedStation.processNo} ({selectedStation.smv}m)
                      </span>
                    </div>
                    {selectedStation.tandemProcessName && (
                      <div className="flex justify-between">
                        <span className="font-semibold text-indigo-700">Proses Tandem:</span>
                        <span className="font-bold text-indigo-950">
                          {selectedStation.tandemProcessNo ? `P#${selectedStation.tandemProcessNo}: ` : ""}
                          {selectedStation.tandemProcessName} ({selectedStation.tandemSMV || 0.6}m)
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-indigo-100 pt-1">
                      <span className="font-semibold text-slate-700">Total SMV Gabungan:</span>
                      <span className="font-bold font-mono text-indigo-950">
                        {selectedStation.combinedSMV || selectedStation.smv} menit
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-indigo-800 leading-relaxed">
                    {selectedStation.tandemReason ||
                      "Dua operator bekerja bersama di stasiun ini untuk membagi siklus kerja dan menampung proses berlebih tanpa menambah meja fisik dari 26 stasiun."}
                  </p>
                </div>
              )}
            </div>

            <div className="text-right pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedStation(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
