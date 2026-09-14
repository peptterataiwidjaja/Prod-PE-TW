import React from "react";
import {
  LineProductionData,
  Operator,
  User,
  LineNumber,
  Fishbone6M,
  FiveWhyItem,
  ParetoItem,
  RecommendationItem,
} from "../types";
import { VALID_LINES } from "../data/defaultData";
import { Printer, X, FileText, Calendar, CheckSquare, Shield } from "lucide-react";

interface PEAnalysisPrintReportProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedPeriod: string;
  linesData: Record<number, LineProductionData>;
  allOperators: Operator[];
  currentUser: User;
  fishbone: Fishbone6M;
  fiveWhyCases: FiveWhyItem[];
  paretoDefects: ParetoItem[];
  paretoBottlenecks: ParetoItem[];
  recommendations: RecommendationItem[];
}

export const PEAnalysisPrintReport: React.FC<PEAnalysisPrintReportProps> = ({
  isOpen,
  onClose,
  selectedDate,
  selectedPeriod,
  linesData,
  allOperators,
  currentUser,
  fishbone,
  fiveWhyCases,
  paretoDefects,
  paretoBottlenecks,
  recommendations,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Multi-line summary calculation
  const lineSummaries = VALID_LINES.map((lineId) => {
    const lineObj = linesData[lineId];
    const ops = allOperators.filter((o) => o.line === lineId);
    const totalOps = ops.length || 26;
    const hadirOps = ops.filter((o) => o.attendanceStatus === "HADIR").length;
    const absentOps = totalOps - hadirOps;
    const attendanceRate = totalOps > 0 ? Number(((hadirOps / totalOps) * 100).toFixed(1)) : 0;

    const rows = lineObj?.rows || [];
    const totalActual = rows.reduce((s, r) => s + r.totalActual, 0);
    const totalTarget = rows.reduce((s, r) => s + r.target, 0);
    const totalDefects = rows.reduce((s, r) => s + r.totalDefects, 0);
    const bottleneckCount = rows.filter((r) => r.status === "bottleneck" || r.balanceTarget < -5).length;
    const efficiency = totalTarget > 0 ? Number(((totalActual / totalTarget) * 100).toFixed(1)) : 0;

    return {
      lineId,
      style: lineObj?.style || "SOGO BLAZER",
      buyer: lineObj?.buyer || "SOGO APPAREL",
      supervisor: lineObj?.supervisor || `SPV Line ${lineId}`,
      totalTarget,
      totalActual,
      balance: totalActual - totalTarget,
      efficiency,
      totalDefects,
      defectRate: totalActual > 0 ? Number(((totalDefects / totalActual) * 100).toFixed(1)) : 0,
      bottleneckCount,
      totalOps,
      hadirOps,
      absentOps,
      attendanceRate,
    };
  });

  const grandTarget = lineSummaries.reduce((s, l) => s + l.totalTarget, 0);
  const grandActual = lineSummaries.reduce((s, l) => s + l.totalActual, 0);
  const grandDefects = lineSummaries.reduce((s, l) => s + l.totalDefects, 0);
  const avgEfficiency = grandTarget > 0 ? Number(((grandActual / grandTarget) * 100).toFixed(1)) : 0;

  // Format Date to formal Indonesian string (e.g., 13 September 2026)
  const formatIndoDate = (dateStr: string) => {
    try {
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        const year = parts[0];
        const monthNames = [
          "Januari", "Februari", "Maret", "April", "Mei", "Juni",
          "Juli", "Agustus", "September", "Oktober", "November", "Desember",
        ];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        return `${day} ${monthNames[monthIndex] || parts[1]} ${year}`;
      }
    } catch (e) {}
    return dateStr;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-start justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden my-4 print:my-0 print:border-none print:shadow-none print:w-full">
        {/* Screen Controls Header (Hidden in Print) */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <span>Laporan Analisis Engineering Produksi Sewing (Hitam & Putih)</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700">
                  Form: F-PE-012-00
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Format siap cetak hemat tinta untuk laporan harian/mingguan manajemen pabrik &bull; Tanggal: {formatIndoDate(selectedDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-print-pe-report-action"
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center space-x-2 transition-all shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Print PDF</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE BLACK AND WHITE REPORT DOCUMENT */}
        <div className="p-8 sm:p-10 space-y-6 text-black bg-white font-sans text-xs" id="printable-pe-report">
          {/* Document Header - Standard ISO/Factory Header */}
          <div className="border-b-2 border-black pb-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-black">
                  PT. INDO GARMENT APPAREL MANUFACTURING &bull; PRODUCTION ENGINEERING DEPT
                </div>
                <h1 className="text-lg sm:text-xl font-bold uppercase tracking-tight text-black mt-1">
                  LAPORAN ANALISIS AKAR MASALAH PRODUKSI & REKOMENDASI ENGINEERING
                </h1>
                <div className="text-xs text-slate-700 mt-0.5 font-medium">
                  Monitoring Kinerja Sewing Line 1, 3, 4, 5, 6, 7 &bull; Analisis Pareto, Ishikawa 6M & 5-Why
                </div>
              </div>

              {/* Form Meta Box */}
              <div className="border border-black p-2 text-right text-[11px] font-mono leading-tight bg-white">
                <div><strong>No. Dok:</strong> F-PE-012-00</div>
                <div><strong>Tanggal:</strong> {selectedDate}</div>
                <div><strong>Periode:</strong> {selectedPeriod}</div>
                <div><strong>Status:</strong> RESMI / APPROVED</div>
              </div>
            </div>

            {/* Document Info Bar */}
            <div className="grid grid-cols-4 gap-2 mt-4 pt-2 border-t border-black text-[11px]">
              <div>
                <span className="font-bold block">Tanggal Analisis:</span>
                <span>{formatIndoDate(selectedDate)}</span>
              </div>
              <div>
                <span className="font-bold block">Periode Kerja:</span>
                <span>{selectedPeriod}</span>
              </div>
              <div>
                <span className="font-bold block">Disusun Oleh:</span>
                <span>{currentUser.name} ({currentUser.title})</span>
              </div>
              <div>
                <span className="font-bold block">Target Garment:</span>
                <span>Total 6 Sewing Line</span>
              </div>
            </div>
          </div>

          {/* SECTION 1: RINGKASAN KINERJA 6 SEWING LINE */}
          <div>
            <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                1. Ringkasan Kinerja Output & Efisiensi 6 Sewing Line
              </h2>
              <span className="text-[10px] font-mono">Satuan: Pieces (Pcs) & Persen (%)</span>
            </div>

            <table className="w-full text-left border-collapse border border-black text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-black font-bold">
                  <th className="border border-black p-1.5 text-center w-12">Line</th>
                  <th className="border border-black p-1.5">Style / Buyer</th>
                  <th className="border border-black p-1.5">Supervisor</th>
                  <th className="border border-black p-1.5 text-center">Kehadiran</th>
                  <th className="border border-black p-1.5 text-right">Target</th>
                  <th className="border border-black p-1.5 text-right">Aktual</th>
                  <th className="border border-black p-1.5 text-right">Balance</th>
                  <th className="border border-black p-1.5 text-center">Efisiensi</th>
                  <th className="border border-black p-1.5 text-right">Defect</th>
                  <th className="border border-black p-1.5 text-center">Defect %</th>
                  <th className="border border-black p-1.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {lineSummaries.map((l) => (
                  <tr key={l.lineId} className="border-b border-black">
                    <td className="border border-black p-1.5 text-center font-bold font-mono">
                      Line {l.lineId}
                    </td>
                    <td className="border border-black p-1.5">
                      <div className="font-semibold">{l.style}</div>
                      <div className="text-[9px] text-slate-600">{l.buyer}</div>
                    </td>
                    <td className="border border-black p-1.5">{l.supervisor}</td>
                    <td className="border border-black p-1.5 text-center font-mono">
                      {l.hadirOps}/{l.totalOps} ({l.attendanceRate}%)
                    </td>
                    <td className="border border-black p-1.5 text-right font-mono">{l.totalTarget}</td>
                    <td className="border border-black p-1.5 text-right font-mono font-bold">{l.totalActual}</td>
                    <td className="border border-black p-1.5 text-right font-mono">
                      {l.balance >= 0 ? `+${l.balance}` : l.balance}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono font-bold">
                      {l.efficiency}%
                    </td>
                    <td className="border border-black p-1.5 text-right font-mono">{l.totalDefects}</td>
                    <td className="border border-black p-1.5 text-center font-mono">{l.defectRate}%</td>
                    <td className="border border-black p-1.5 text-center font-bold text-[10px]">
                      {l.efficiency >= 90 ? "[TERCAPAI]" : l.efficiency >= 75 ? "[CUKUP]" : "[KRITIS]"}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 font-bold border-t-2 border-black">
                  <td colSpan={4} className="border border-black p-1.5 text-right uppercase">
                    Total Pabrik (6 Line):
                  </td>
                  <td className="border border-black p-1.5 text-right font-mono">{grandTarget}</td>
                  <td className="border border-black p-1.5 text-right font-mono">{grandActual}</td>
                  <td className="border border-black p-1.5 text-right font-mono">
                    {grandActual - grandTarget >= 0 ? `+${grandActual - grandTarget}` : grandActual - grandTarget}
                  </td>
                  <td className="border border-black p-1.5 text-center font-mono">{avgEfficiency}%</td>
                  <td className="border border-black p-1.5 text-right font-mono">{grandDefects}</td>
                  <td className="border border-black p-1.5 text-center font-mono">
                    {grandActual > 0 ? ((grandDefects / grandActual) * 100).toFixed(1) : 0}%
                  </td>
                  <td className="border border-black p-1.5 text-center text-[10px]">
                    {avgEfficiency >= 85 ? "SESUAI STANDAR" : "PERLU EVALUASI"}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* SECTION 2: ANALISIS PARETO 80/20 (DEFECT & BOTTLENECK) */}
          <div>
            <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                2. Analisis Pareto 80/20 (Faktor Kritis Cacat Jahit & Hambatan Line)
              </h2>
              <span className="text-[10px] font-mono">Prinsip Vital Few (80% Akibat dari 20% Sebab)</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Pareto Defects */}
              <div className="border border-black p-2">
                <div className="font-bold border-b border-black pb-1 mb-1 text-[11px] uppercase">
                  A. Pareto Cacat Jahitan (Sewing Defects)
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b border-black font-bold">
                      <th className="p-1">No</th>
                      <th className="p-1">Jenis Cacat</th>
                      <th className="p-1 text-right">Jumlah (Pcs)</th>
                      <th className="p-1 text-right">Kumulatif %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paretoDefects.slice(0, 5).map((d, i) => (
                      <tr key={d.category} className="border-b border-slate-300">
                        <td className="p-1 font-mono">{i + 1}</td>
                        <td className="p-1 font-semibold">{d.category}</td>
                        <td className="p-1 text-right font-mono">{d.count}</td>
                        <td className="p-1 text-right font-mono font-bold">{d.cumulativePercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pareto Bottlenecks */}
              <div className="border border-black p-2">
                <div className="font-bold border-b border-black pb-1 mb-1 text-[11px] uppercase">
                  B. Pareto Penyebab Bottleneck Stasiun
                </div>
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="border-b border-black font-bold">
                      <th className="p-1">No</th>
                      <th className="p-1">Penyebab Bottleneck</th>
                      <th className="p-1 text-right">Frekuensi</th>
                      <th className="p-1 text-right">Kumulatif %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paretoBottlenecks.slice(0, 5).map((b, i) => (
                      <tr key={b.category} className="border-b border-slate-300">
                        <td className="p-1 font-mono">{i + 1}</td>
                        <td className="p-1 font-semibold">{b.category}</td>
                        <td className="p-1 text-right font-mono">{b.count}</td>
                        <td className="p-1 text-right font-mono font-bold">{b.cumulativePercentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* SECTION 3: DIAGRAM ISHIKAWA 6M (FISHBONE ANALYSIS) */}
          <div>
            <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                3. Matriks Diagram Ishikawa 6M (Faktor Man, Machine, Method, Material, Measurement, Milieu)
              </h2>
              <span className="text-[10px] font-mono">Studi Kasus: Gap Output & Bottleneck Stasiun</span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
              {/* Man */}
              <div className="border border-black p-2">
                <div className="font-bold border-b border-black pb-0.5 mb-1 uppercase bg-slate-100 px-1">
                  1. Man (Manpower / Operator)
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {fishbone.man.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Machine */}
              <div className="border border-black p-2">
                <div className="font-bold border-b border-black pb-0.5 mb-1 uppercase bg-slate-100 px-1">
                  2. Machine (Mesin Sewing & Jarum)
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {fishbone.machine.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Method */}
              <div className="border border-black p-2">
                <div className="font-bold border-b border-black pb-0.5 mb-1 uppercase bg-slate-100 px-1">
                  3. Method (Metode Kerja / SOP)
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {fishbone.method.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Material */}
              <div className="border border-black p-2">
                <div className="font-bold border-b border-black pb-0.5 mb-1 uppercase bg-slate-100 px-1">
                  4. Material (Bahan Kain & Benang)
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {fishbone.material.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Measurement */}
              <div className="border border-black p-2">
                <div className="font-bold border-b border-black pb-0.5 mb-1 uppercase bg-slate-100 px-1">
                  5. Measurement (Pengukuran / SMV)
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {fishbone.measurement.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>

              {/* Milieu */}
              <div className="border border-black p-2">
                <div className="font-bold border-b border-black pb-0.5 mb-1 uppercase bg-slate-100 px-1">
                  6. Milieu (Lingkungan Kerja Line)
                </div>
                <ul className="list-disc list-inside space-y-0.5">
                  {fishbone.milieu.map((item, idx) => (
                    <li key={idx} className="leading-snug">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* SECTION 4: LEMBAR INVESTIGASI 5-WHY ROOT CAUSE */}
          <div>
            <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                4. Investigasi 5-Why & Rencana Tindakan Perbaikan (Corrective & Preventive Action)
              </h2>
              <span className="text-[10px] font-mono">Form QC / IE CAPA</span>
            </div>

            <table className="w-full text-left border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-slate-100 border-b border-black font-bold">
                  <th className="border border-black p-1.5 w-12 text-center">Line</th>
                  <th className="border border-black p-1.5 w-40">Isu / Bottleneck</th>
                  <th className="border border-black p-1.5">Penelusuran 5-Why</th>
                  <th className="border border-black p-1.5 w-36">Akar Masalah</th>
                  <th className="border border-black p-1.5 w-44">Tindakan Perbaikan (CAPA)</th>
                  <th className="border border-black p-1.5 w-24 text-center">PIC / Status</th>
                </tr>
              </thead>
              <tbody>
                {fiveWhyCases.map((fw) => (
                  <tr key={fw.id} className="border-b border-black">
                    <td className="border border-black p-1.5 text-center font-mono font-bold">
                      Line {fw.line}
                    </td>
                    <td className="border border-black p-1.5">
                      <div className="font-bold">{fw.issue}</div>
                      <div className="text-[9px] text-slate-600">{fw.stationOrProcess}</div>
                    </td>
                    <td className="border border-black p-1.5 leading-tight space-y-0.5">
                      <div><strong>1.</strong> {fw.why1}</div>
                      <div><strong>2.</strong> {fw.why2}</div>
                      <div><strong>3.</strong> {fw.why3}</div>
                      {fw.why4 && <div><strong>4.</strong> {fw.why4}</div>}
                      {fw.why5 && <div><strong>5.</strong> {fw.why5}</div>}
                    </td>
                    <td className="border border-black p-1.5 font-semibold">
                      {fw.rootCause}
                    </td>
                    <td className="border border-black p-1.5 leading-snug">
                      <div><strong>Korektif:</strong> {fw.correctiveAction}</div>
                      <div className="mt-0.5"><strong>Preventif:</strong> {fw.preventiveAction}</div>
                    </td>
                    <td className="border border-black p-1.5 text-center">
                      <div className="font-bold">{fw.pic}</div>
                      <div className="text-[9px] font-mono mt-0.5">[{fw.status.toUpperCase()}]</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION 5: REKOMENDASI TATA LETAK & ACTION PLAN ENGINEERING */}
          <div>
            <div className="flex items-center justify-between border-b border-black pb-1 mb-2">
              <h2 className="text-xs font-bold uppercase tracking-wider">
                5. Rekomendasi Rencana Aksi Engineering (Action Plan)
              </h2>
              <span className="text-[10px] font-mono">Implementasi Target & Penataan Ulang Operator</span>
            </div>

            <table className="w-full text-left border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-slate-100 border-b border-black font-bold">
                  <th className="border border-black p-1.5 w-10 text-center">No</th>
                  <th className="border border-black p-1.5 w-16 text-center">Line</th>
                  <th className="border border-black p-1.5 w-48">Fokus Area / Stasiun</th>
                  <th className="border border-black p-1.5">Uraian Rekomendasi Engineering</th>
                  <th className="border border-black p-1.5 w-28 text-center">Estimasi Dampak</th>
                  <th className="border border-black p-1.5 w-24 text-center">Prioritas</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.map((rec, i) => (
                  <tr key={rec.id} className="border-b border-black">
                    <td className="border border-black p-1.5 text-center font-mono">{i + 1}</td>
                    <td className="border border-black p-1.5 text-center font-mono font-bold">Line {rec.line}</td>
                    <td className="border border-black p-1.5 font-semibold">{rec.area}</td>
                    <td className="border border-black p-1.5">{rec.action}</td>
                    <td className="border border-black p-1.5 text-center font-mono font-bold">{rec.impact}</td>
                    <td className="border border-black p-1.5 text-center font-bold">
                      [{rec.priority.toUpperCase()}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* SECTION 6: SIGNATURE & APPROVAL BLOCK (STANDARD GARMENT FACTORY) */}
          <div className="pt-4 border-t-2 border-black">
            <div className="grid grid-cols-4 gap-4 text-center text-[11px]">
              <div className="border border-black p-2 flex flex-col justify-between h-28">
                <div className="font-bold">Dibuat Oleh:</div>
                <div className="font-bold border-b border-black mx-4 pb-0.5 font-mono">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-slate-600">Production Engineer / IE</div>
              </div>

              <div className="border border-black p-2 flex flex-col justify-between h-28">
                <div className="font-bold">Diperiksa Oleh:</div>
                <div className="font-bold border-b border-black mx-4 pb-0.5 font-mono">
                  ( ................................... )
                </div>
                <div className="text-[10px] text-slate-600">Supervisor Sewing Line</div>
              </div>

              <div className="border border-black p-2 flex flex-col justify-between h-28">
                <div className="font-bold">Diverifikasi Oleh:</div>
                <div className="font-bold border-b border-black mx-4 pb-0.5 font-mono">
                  ( ................................... )
                </div>
                <div className="text-[10px] text-slate-600">Head of Quality Control (QC)</div>
              </div>

              <div className="border border-black p-2 flex flex-col justify-between h-28">
                <div className="font-bold">Disetujui Oleh:</div>
                <div className="font-bold border-b border-black mx-4 pb-0.5 font-mono">
                  ( ................................... )
                </div>
                <div className="text-[10px] text-slate-600">Production Engineering Manager</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-3 pt-2 border-t border-slate-300">
              <div>
                Dokumen ini dicetak otomatis dari Sewing Production Engineering Monitoring & Operator Grading System
              </div>
              <div className="font-mono">
                Dicetak pada: {new Date().toISOString().replace("T", " ").substring(0, 19)} &bull; Hal: 1 / 1
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
