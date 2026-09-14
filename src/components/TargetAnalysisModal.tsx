import React, { useState, useEffect } from "react";
import { LineProductionData, Operator } from "../types";
import {
  AlertTriangle,
  X,
  Sparkles,
  RefreshCw,
  Flame,
  CheckCircle,
  Users,
  Wrench,
  TrendingDown,
  Layers,
} from "lucide-react";

interface TargetAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  lineData: LineProductionData;
  operators: Operator[];
  selectedLine: 1 | 3 | 4 | 5 | 6 | 7;
  onSelectLine: (line: 1 | 3 | 4 | 5 | 6 | 7) => void;
}

export const TargetAnalysisModal: React.FC<TargetAnalysisModalProps> = ({
  isOpen,
  onClose,
  lineData,
  operators,
  selectedLine,
  onSelectLine,
}) => {
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisSource, setAnalysisSource] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Compute stats for current line
  const totalActual = lineData.rows.reduce((s, r) => s + r.totalActual, 0);
  const totalTarget = lineData.rows.reduce((s, r) => s + r.target, 0);
  const shortfall = Math.max(0, totalTarget - totalActual);
  const efficiency = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  // Bottleneck operations
  const bottlenecks = lineData.rows
    .filter((r) => r.balanceTarget < 0)
    .sort((a, b) => a.balanceTarget - b.balanceTarget)
    .map((r) => ({
      no: r.no,
      process: r.process,
      machine: r.machine,
      target: r.target,
      actual: r.totalActual,
      shortfall: Math.abs(r.balanceTarget),
      hourlyRate: (r.totalActual / 8).toFixed(1),
      defects: r.hourlyDefects.reduce((a, b) => a + b, 0),
    }));

  // Low grading operators on this line
  const lowGradingOps = operators
    .filter((o) => o.line === selectedLine && (o.grade === "C" || o.grade === "D"))
    .map((o) => ({
      name: o.name,
      grade: o.grade,
      efficiency: o.efficiency,
      defects: o.totalDefect,
      process: o.assignedProcessName,
    }));

  const runAnalysis = async () => {
    setIsLoading(true);
    setAnalysisResult(null);

    try {
      const res = await fetch("/api/analyze-target", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          line: selectedLine,
          target: totalTarget,
          actual: totalActual,
          shortfall,
          bottlenecks: bottlenecks.slice(0, 5),
          lowGradingOps,
        }),
      });

      const data = await res.json();
      setAnalysisResult(data.analysis);
      setAnalysisSource("Sistem Diagnostik IE Otomatis");
    } catch (err) {
      console.error("Analysis request error:", err);
      setAnalysisResult("Gagal terhubung ke modul analisis. Silakan periksa koneksi server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runAnalysis();
    }
  }, [isOpen, selectedLine]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4 fill-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center space-x-2">
                <span>Diagnostik Ketercapaian Target & Bottleneck</span>
                <span className="px-2 py-0.5 rounded bg-blue-600/40 text-blue-300 text-xs font-mono border border-blue-500/30">
                  Line {selectedLine}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Deteksi penyebab hambatan output & panduan taktis penyelamatan line sewing
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Target Gap Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Target Kumulatif:</span>
              <span className="font-bold text-slate-900 text-base font-mono">{totalTarget} Pcs</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Aktual Tercapai:</span>
              <span className="font-bold text-blue-700 text-base font-mono">{totalActual} Pcs</span>
            </div>

            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-rose-600 block text-[10px] font-semibold">Defisit Target:</span>
              <span className="font-bold text-rose-700 text-base font-mono">
                {shortfall > 0 ? `-${shortfall} Pcs` : "0 Pcs (Tercapai)"}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px]">Efisiensi Line:</span>
              <span
                className={`font-bold text-base font-mono ${
                  efficiency >= 85 ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {efficiency.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Stasiun Bottleneck Terdeteksi */}
          {bottlenecks.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
              <div className="flex items-center space-x-2 text-rose-800 text-xs font-bold mb-2">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Top Stasiun Terhambat (Bottleneck) di Line {selectedLine}:</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {bottlenecks.slice(0, 3).map((b, idx) => (
                  <div
                    key={b.no}
                    className="flex items-center justify-between p-2 bg-white rounded-lg border border-rose-200 text-slate-800"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold">#{b.no} {b.process}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 font-mono text-[10px] text-slate-600">
                        {b.machine}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-rose-600 font-mono">-{b.shortfall} pcs</span>
                      <span className="text-[10px] text-slate-400 block">
                        Aktual: {b.actual}/{b.target}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Diagnostic Report with Gemini Star */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-300">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Hasil Diagnosa & Rekomendasi Penyelamatan Line
                </h4>
              </div>

              {analysisSource && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-medium flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-amber-500 fill-amber-400" />
                  <span>{analysisSource}</span>
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600 mb-2" />
                <span>Menganalisis data stasiun dan menghitung akar masalah 4M...</span>
              </div>
            ) : analysisResult ? (
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans prose prose-sm max-w-none">
                {analysisResult}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={runAnalysis}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Muat Ulang Analisis</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
