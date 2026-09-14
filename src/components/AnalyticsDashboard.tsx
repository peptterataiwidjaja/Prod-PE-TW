import React, { useState } from "react";
import { LineProductionData, Operator } from "../types";
import { VALID_LINES } from "../data/defaultData";
import {
  BarChart3,
  TrendingUp,
  Award,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Users,
  Target,
  Sparkles,
} from "lucide-react";

interface AnalyticsDashboardProps {
  linesData: Record<number, LineProductionData>;
  operators: Operator[];
  selectedLine: 1 | 3 | 4 | 5 | 6 | 7;
  onSelectLine: (line: 1 | 3 | 4 | 5 | 6 | 7) => void;
  onOpenTargetAnalysis: () => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  linesData,
  operators,
  selectedLine,
  onSelectLine,
  onOpenTargetAnalysis,
}) => {
  const [viewMode, setViewMode] = useState<"compare" | "single">("compare");

  // Aggregate metrics across all valid lines (1, 3, 4, 5, 6, 7)
  const lineSummaries = VALID_LINES.map((lineId) => {
    const data = linesData[lineId];
    if (!data) return null;

    const totalActual = data.rows.reduce((s, r) => s + r.totalActual, 0);
    const totalTarget = data.rows.reduce((s, r) => s + r.target, 0);
    const efficiency = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
    const totalDefects = data.rows.reduce(
      (s, r) => s + r.hourlyDefects.reduce((ds, d) => ds + d, 0),
      0
    );
    const defectRate = totalActual > 0 ? (totalDefects / totalActual) * 100 : 0;
    const bottlenecks = data.rows.filter((r) => r.balanceTarget < -5);

    // Hourly aggregation for hours 1 to 8
    const hourlyTotals = [0, 1, 2, 3, 4, 5, 6, 7].map((hIndex) =>
      data.rows.reduce((sum, r) => sum + (r.hourlyActual[hIndex] || 0), 0)
    );

    return {
      lineId,
      supervisor: data.supervisor,
      totalActual,
      totalTarget,
      efficiency: Number(efficiency.toFixed(1)),
      totalDefects,
      defectRate: Number(defectRate.toFixed(1)),
      bottleneckCount: bottlenecks.length,
      topBottleneck: bottlenecks[0] || null,
      hourlyTotals,
    };
  }).filter(Boolean) as Array<{
    lineId: 1 | 3 | 4 | 5 | 6 | 7;
    supervisor: string;
    totalActual: number;
    totalTarget: number;
    efficiency: number;
    totalDefects: number;
    defectRate: number;
    bottleneckCount: number;
    topBottleneck: any;
    hourlyTotals: number[];
  }>;

  // Global Metrics
  const globalActual = lineSummaries.reduce((s, l) => s + l.totalActual, 0);
  const globalTarget = lineSummaries.reduce((s, l) => s + l.totalTarget, 0);
  const globalEfficiency = globalTarget > 0 ? ((globalActual / globalTarget) * 100).toFixed(1) : "0";
  const globalDefects = lineSummaries.reduce((s, l) => s + l.totalDefects, 0);
  const globalDefectRate = globalActual > 0 ? ((globalDefects / globalActual) * 100).toFixed(1) : "0";

  // Operator Grading distribution
  const gradeCounts = {
    A: operators.filter((o) => o.grade === "A").length,
    B: operators.filter((o) => o.grade === "B").length,
    C: operators.filter((o) => o.grade === "C").length,
    D: operators.filter((o) => o.grade === "D").length,
  };

  // Hourly Average across all lines
  const globalHourly = [0, 1, 2, 3, 4, 5, 6, 7].map((hIndex) => {
    const sum = lineSummaries.reduce((s, l) => s + l.hourlyTotals[hIndex], 0);
    return Math.round(sum / (lineSummaries.length || 1));
  });

  return (
    <div className="space-y-6">
      {/* Top Global Dashboard KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Output (Semua Line)</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-900">{globalActual}</span>
            <span className="text-xs text-slate-400">/ {globalTarget} pcs</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Dari 6 Line Aktif: 1, 3, 4, 5, 6, 7
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Rata-Rata Efisiensi Pabrik</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span
              className={`text-2xl sm:text-3xl font-bold ${
                Number(globalEfficiency) >= 90
                  ? "text-emerald-600"
                  : Number(globalEfficiency) >= 80
                  ? "text-blue-600"
                  : "text-amber-600"
              }`}
            >
              {globalEfficiency}%
            </span>
            <span className="text-xs text-slate-400">Target &ge; 85%</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            {Number(globalEfficiency) >= 85 ? "Performa line memuaskan" : "Di bawah ambang target"}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Tingkat Kualitas & Reject</span>
            <CheckCircle2 className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-rose-600">{globalDefectRate}%</span>
            <span className="text-xs text-slate-400">({globalDefects} pcs defect)</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Batas toleransi buyer SOGO: &le; 2.5%
          </p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Grading Operator (Total {operators.length})</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-bold">
              A: {gradeCounts.A}
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-bold">
              B: {gradeCounts.B}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold">
              C: {gradeCounts.C}
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-bold">
              D: {gradeCounts.D}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Grading dinamis real-time dari scan barcode
          </p>
        </div>
      </div>

      {/* Multi-Line Comparison Grid (Line 1, 3, 4, 5, 6, 7) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Perbandingan Kinerja Line Sewing (Line 1, 3, 4, 5, 6, 7)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Evaluasi ketercapaian target, efisiensi, dan stasiun bottleneck per line
            </p>
          </div>

          <button
            onClick={onOpenTargetAnalysis}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>Diagnosa AI Target Gagal</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {lineSummaries.map((line) => {
            const isSelected = selectedLine === line.lineId;
            const hasBottleneck = line.bottleneckCount > 0;

            return (
              <div
                key={line.lineId}
                onClick={() => onSelectLine(line.lineId)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-blue-50/30 ring-2 ring-blue-500/20 shadow-md"
                    : "border-slate-200 hover:border-slate-300 bg-white"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-8 h-8 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                      L{line.lineId}
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">Line {line.lineId}</h4>
                      <span className="text-[10px] text-slate-400">Spv: {line.supervisor}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      line.efficiency >= 95
                        ? "bg-emerald-100 text-emerald-800"
                        : line.efficiency >= 85
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {line.efficiency}%
                  </span>
                </div>

                {/* Output Progress Bar */}
                <div className="space-y-1 my-3">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-500">Output Aktual:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {line.totalActual} / {line.totalTarget} pcs
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full ${
                        line.efficiency >= 90
                          ? "bg-emerald-500"
                          : line.efficiency >= 80
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                      style={{ width: `${Math.min(100, line.efficiency)}%` }}
                    />
                  </div>
                </div>

                {/* Defect & Bottleneck info */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    Defect: <span className="font-bold text-rose-600">{line.totalDefects} pcs ({line.defectRate}%)</span>
                  </span>

                  {hasBottleneck ? (
                    <span className="flex items-center space-x-1 text-rose-600 font-semibold text-[10px]">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{line.bottleneckCount} Bottleneck</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 text-emerald-600 font-semibold text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Seimbang</span>
                    </span>
                  )}
                </div>

                {/* Top bottleneck station notice if any */}
                {line.topBottleneck && (
                  <div className="mt-2 p-1.5 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-700 truncate">
                    Defisit: #{line.topBottleneck.no} {line.topBottleneck.process} ({line.topBottleneck.balanceTarget} pcs)
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Hourly Output Bar Visualizer (Jam 1 s/d Jam 8) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Tren Output Produksi Per Jam (Jam 1 s/d 8)
            </h3>
            <p className="text-xs text-slate-500">
              Rata-rata output stasiun per jam vs target garis standar (10 pcs/jam)
            </p>
          </div>
          <span className="text-xs font-mono font-semibold text-blue-600">Target: 10 Pcs/Jam</span>
        </div>

        <div className="h-44 flex items-end justify-between space-x-2 pt-6 pb-2 border-b border-slate-200">
          {globalHourly.map((val, idx) => {
            const heightPercent = Math.min(100, (val / 12) * 100);
            const isUnderTarget = val < 10;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <span className="text-[10px] font-mono font-bold text-slate-700 mb-1 group-hover:scale-110 transition-transform">
                  {val}
                </span>
                <div className="w-full max-w-[36px] bg-slate-100 rounded-t-lg overflow-hidden flex flex-col justify-end h-full">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isUnderTarget ? "bg-amber-400 group-hover:bg-amber-500" : "bg-blue-600 group-hover:bg-blue-500"
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-mono mt-2">J-{idx + 1}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operator Leaderboard & Grading Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Matriks Grading & Produktivitas Operator</span>
            </h3>
            <p className="text-xs text-slate-500">
              Evaluasi akurat berdasarkan output aktual dan tingkat defect per operator
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Operator</th>
                <th className="p-3">Line</th>
                <th className="p-3">Proses Ditugaskan</th>
                <th className="p-3">Mesin</th>
                <th className="p-3 text-center">Output / Target</th>
                <th className="p-3 text-center">Efisiensi</th>
                <th className="p-3 text-center">Defect Rate</th>
                <th className="p-3 text-center">Grading</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {operators.map((op) => (
                <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs ${op.avatarColor}`}
                      >
                        {op.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{op.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{op.barcode}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-slate-700">Line {op.line}</td>
                  <td className="p-3 text-slate-800 font-medium truncate max-w-[180px]">
                    #{op.assignedProcessNo} - {op.assignedProcessName}
                  </td>
                  <td className="p-3 font-mono font-semibold text-slate-700">{op.machineType}</td>
                  <td className="p-3 text-center font-mono font-semibold text-slate-800">
                    {op.totalOutput} / {op.targetOutput} pcs
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-blue-700">
                    {op.efficiency}%
                  </td>
                  <td className="p-3 text-center font-mono font-medium text-rose-600">
                    {op.defectRate}% ({op.totalDefect} pcs)
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        op.grade === "A"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : op.grade === "B"
                          ? "bg-blue-100 text-blue-800 border-blue-300"
                          : op.grade === "C"
                          ? "bg-amber-100 text-amber-800 border-amber-300"
                          : "bg-rose-100 text-rose-800 border-rose-300"
                      }`}
                    >
                      Grade {op.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
