import * as XLSX from "xlsx";
import { ProcessItem, StyleMetadata, MachineRequirement } from "../types";
import {
  STANDARD_26_PROCESSES,
  DEFAULT_STYLE_METADATA,
} from "../data/defaultData";
import { FACTORY_MACHINE_INVENTORY } from "./lineBalancing";

export interface ParsedBreakdownResult {
  metadata: StyleMetadata;
  processes: ProcessItem[];
  machineRequirements: MachineRequirement[];
  totalSMV: number;
  totalSAM: number;
}

/**
 * Parse uploaded Excel or CSV file
 */
export async function parseExcelOrCsv(
  file: File,
  allowancePercentage: number = 15
): Promise<ParsedBreakdownResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  let buyer = DEFAULT_STYLE_METADATA.buyer;
  let style = DEFAULT_STYLE_METADATA.style;
  let workingHours = DEFAULT_STYLE_METADATA.workingHours;
  let targetPerManpowerPerDay = DEFAULT_STYLE_METADATA.targetPerManpowerPerDay;
  let totalSMVFromHeader = 0;

  const processes: ProcessItem[] = [];
  let currentSection = "SEWING";
  let currentSubSection = "";

  // Iterate rows to scan metadata and process entries
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const firstCol = String(row[0] || "").trim();
    const secondCol = String(row[1] || "").trim();

    // Check Metadata rows
    if (firstCol.toLowerCase().includes("buyer")) {
      const match = (row[1] || row[2] || "").toString().replace(/^[:\s]+/, "");
      if (match) buyer = match;
    }
    if (firstCol.toLowerCase().includes("style")) {
      const match = (row[1] || row[2] || "").toString().replace(/^[:\s]+/, "");
      if (match) style = match;
    }
    if (firstCol.toLowerCase().includes("jam kerja")) {
      const num = parseFloat((row[1] || row[2] || "").toString().replace(/[^0-9.]/g, ""));
      if (!isNaN(num) && num > 0) workingHours = num;
    }
    if (firstCol.toLowerCase().includes("target/manpower")) {
      const num = parseFloat((row[1] || row[2] || "").toString().replace(/[^0-9.]/g, ""));
      if (!isNaN(num) && num > 0) targetPerManpowerPerDay = num;
    }
    if (firstCol.toLowerCase().includes("total smv")) {
      const smvVal = parseFloat(String(row[5] || row[4] || row[3] || "").replace(",", "."));
      if (!isNaN(smvVal)) totalSMVFromHeader = smvVal;
    }

    // Section header identification (e.g. SEWING, AUTOMACHINE, TRIMMING, HELPER)
    const upperFirst = firstCol.toUpperCase();
    if (["SEWING", "AUTOMACHINE", "TRIMMING", "HELPER"].includes(upperFirst)) {
      currentSection = upperFirst;
      continue;
    }

    // Sub-section identification (e.g., ,PITA,,,, or ,SHELL DEPAN,,,,)
    if (!firstCol && secondCol && isNaN(Number(secondCol)) && !secondCol.toLowerCase().includes("process")) {
      currentSubSection = secondCol;
      continue;
    }

    // Data Row: check if first column is numeric (No 1, 2, 3...)
    const noNum = parseInt(firstCol, 10);
    if (!isNaN(noNum) && noNum > 0) {
      const processName = String(row[1] || row[2] || "").trim();
      const machine = String(row[3] || row[2] || "SN").trim();
      const cycleTimeStr = String(row[4] || row[3] || "0").replace(",", ".");
      const smvStr = String(row[5] || row[4] || "0").replace(",", ".");

      const cycleTime = parseFloat(cycleTimeStr) || 0;
      let smv = parseFloat(smvStr) || 0;
      if (smv === 0 && cycleTime > 0) {
        smv = Number((cycleTime / 60).toFixed(2));
      }

      const sam = Number((smv * (1 + allowancePercentage / 100)).toFixed(2));

      processes.push({
        no: noNum,
        section: currentSection,
        subSection: currentSubSection,
        process: processName,
        machine: machine || "SN",
        cycleTime,
        smv,
        sam,
      });
    }
  }

  // Fallback if parsing didn't find rows
  const finalProcesses = processes.length > 0 ? processes : STANDARD_26_PROCESSES;
  const calculatedTotalSMV = finalProcesses.reduce((sum, p) => sum + p.smv, 0);
  const totalSMV = totalSMVFromHeader > 0 ? totalSMVFromHeader : Number(calculatedTotalSMV.toFixed(2));
  const totalSAM = Number((totalSMV * (1 + allowancePercentage / 100)).toFixed(2));

  const metadata: StyleMetadata = {
    buyer,
    style,
    workingHours,
    targetPerManpowerPerDay,
    lineTargetPerHour: targetPerManpowerPerDay,
    lineTargetPerDay: targetPerManpowerPerDay * workingHours,
    totalSMV,
    totalSAM,
    allowancePercentage,
    supervisor: DEFAULT_STYLE_METADATA.supervisor,
    qualityControl: DEFAULT_STYLE_METADATA.qualityControl,
    sampleSpv: DEFAULT_STYLE_METADATA.sampleSpv,
    rndHead: DEFAULT_STYLE_METADATA.rndHead,
    sewingDate: new Date().toISOString().split("T")[0],
    sewingDays: "Senin - Sabtu (Hari Kerja 1)",
  };

  const machineRequirements = calculateMachineRequirements(
    finalProcesses,
    metadata.lineTargetPerDay,
    workingHours,
    allowancePercentage
  );

  return {
    metadata,
    processes: finalProcesses,
    machineRequirements,
    totalSMV,
    totalSAM,
  };
}

/**
 * Calculate Kebutuhan Alat Jahit (Sewing Machine Requirements)
 * Formula:
 * Kebutuhan Mesin = (Total SAM per tipe mesin * Target Harian) / (Jam Kerja * 60 * Line Efficiency)
 */
export function calculateMachineRequirements(
  processes: ProcessItem[],
  targetPerDay: number = 80,
  workingHours: number = 8,
  allowancePercentage: number = 15,
  efficiencyRatio: number = 0.85 // 85% standard line efficiency
): MachineRequirement[] {
  const machineMap = new Map<string, { totalSMV: number; totalSAM: number; count: number }>();

  processes.forEach((p) => {
    const m = p.machine.trim();
    const current = machineMap.get(m) || { totalSMV: 0, totalSAM: 0, count: 0 };
    current.totalSMV += p.smv;
    const sam = p.sam || Number((p.smv * (1 + allowancePercentage / 100)).toFixed(2));
    current.totalSAM += sam;
    current.count += 1;
    machineMap.set(m, current);
  });

  const availableMinutes = workingHours * 60 * efficiencyRatio;

  const machineNamesMap: Record<string, string> = {
    SN: "Single Needle (Jahit Jarum 1 Lockstitch)",
    "Overdeck + Cr": "Overdeck / Interlock + Corong",
    "OL 3": "Overlock 3 Benang (Obras Halus)",
    "OL 5": "Overlock 5 Benang (Obras Safety)",
    DURKOPP: "Durkopp Adler (Pasang Tangan Khusus)",
    Bass: "Bass Automachine (Label Setting)",
    "Button Attaching": "Mesin Pasang Kancing",
    "Button Holer": "Mesin Lubang Kancing",
    Manual: "Meja Kerja Manual / Hand Stitch",
    Soom: "Mesin Blindstitch / Soom",
    Helper: "Meja Helper / Ironing / Bundling",
  };

  const result: MachineRequirement[] = [];

  machineMap.forEach((val, machineType) => {
    // Theoretical machines needed based on SAM
    const theoretical = (val.totalSAM * targetPerDay) / availableMinutes;
    const allocated = Math.max(1, Math.ceil(theoretical));
    const utilization = theoretical > 0 ? (theoretical / allocated) * 100 : 0;
    const availableInFactory = FACTORY_MACHINE_INVENTORY[machineType]?.totalInFactory ?? 12;
    const shortageOrSurplus = availableInFactory - allocated;

    result.push({
      machineType,
      displayName: machineNamesMap[machineType] || machineType,
      totalSMV: Number(val.totalSMV.toFixed(2)),
      totalSAM: Number(val.totalSAM.toFixed(2)),
      processCount: val.count,
      theoreticalMachines: Number(theoretical.toFixed(2)),
      allocatedMachines: allocated,
      utilizationPercent: Number(utilization.toFixed(1)),
      recommendedOperators: allocated,
      availableInFactory,
      shortageOrSurplus,
    });
  });

  // Sort by highest allocated units
  return result.sort((a, b) => b.allocatedMachines - a.allocatedMachines);
}

/**
 * Export Hourly Production Control Sheet to Excel (.xlsx)
 */
export function exportProductionSheetToExcel(
  metadata: StyleMetadata,
  lineId: number,
  rows: any[]
) {
  const wb = XLSX.utils.book_new();

  // Header info
  const headerData = [
    ["HOURLY PRODUCTION CONTROL (F-SEW-005-00)"],
    ["Customer / Buyer:", metadata.buyer, "Line:", `Line ${lineId}`, "Tanggal:", metadata.sewingDate || new Date().toLocaleDateString("id-ID")],
    ["Style:", metadata.style, "Supervisor:", metadata.supervisor, "Jam Kerja:", `${metadata.workingHours} Jam`],
    ["Target / Jam:", metadata.lineTargetPerHour, "Target / Hari:", metadata.lineTargetPerDay, "Total SMV:", metadata.totalSMV, "Total SAM:", metadata.totalSAM],
    [],
    [
      "No",
      "Proses",
      "Mesin",
      "Operator",
      "Kehadiran",
      "Target/Jam",
      "Menit Kerja",
      "AKM Output",
      "AKM Stock",
      "Target",
      "+/- Target",
      "Jam 1",
      "Jam 2",
      "Jam 3",
      "Jam 4",
      "Jam 5",
      "Jam 6",
      "Jam 7",
      "Jam 8",
      "Jam 9",
      "Total",
      "Keterangan",
    ],
  ];

  const tableRows = rows.map((r) => [
    r.no,
    r.process,
    r.machine,
    r.operatorName,
    r.operatorAttendance || "HADIR",
    r.targetPerHour,
    r.workingMinutes,
    r.akmOutput,
    r.akmStock,
    r.target,
    r.balanceTarget,
    r.hourlyActual?.[0] ?? 0,
    r.hourlyActual?.[1] ?? 0,
    r.hourlyActual?.[2] ?? 0,
    r.hourlyActual?.[3] ?? 0,
    r.hourlyActual?.[4] ?? 0,
    r.hourlyActual?.[5] ?? 0,
    r.hourlyActual?.[6] ?? 0,
    r.hourlyActual?.[7] ?? 0,
    r.hourlyActual?.[8] ?? 0,
    r.totalActual,
    r.keterangan,
  ]);

  const fullData = [...headerData, ...tableRows];
  const ws = XLSX.utils.aoa_to_sheet(fullData);

  // Set column widths
  ws["!cols"] = [
    { wch: 5 },
    { wch: 35 },
    { wch: 15 },
    { wch: 20 },
    { wch: 12 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 10 },
    { wch: 25 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, `Line ${lineId} Control`);
  XLSX.writeFile(wb, `Hourly_Production_Control_Line_${lineId}_${metadata.style.replace(/\s+/g, "_")}.xlsx`);
}
