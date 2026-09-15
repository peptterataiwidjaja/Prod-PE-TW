/**
 * Garment Industrial Engineering & Line Balancing Engine
 * Provides mathematical line balancing, operator allocation, and layout optimization.
 */

import {
  Operator,
  ProcessItem,
  LayoutStation,
  LineBalancingResult,
  MachineRequirement,
  TandemAnalysisResult,
  TandemAnalysisItem,
} from "../types";

export const FACTORY_MACHINE_INVENTORY: Record<string, { name: string; totalInFactory: number }> = {
  SN: { name: "Single Needle Lockstitch", totalInFactory: 60 },
  "OL 3": { name: "Overlock 3 Benang", totalInFactory: 18 },
  "OL 5": { name: "Overlock 5 Benang", totalInFactory: 12 },
  "Overdeck + Cr": { name: "Overdeck / Interlock + Corong", totalInFactory: 8 },
  DURKOPP: { name: "Durkopp Adler Sleeve Setting", totalInFactory: 6 },
  "Button Attaching": { name: "Mesin Pasang Kancing", totalInFactory: 6 },
  "Button Holer": { name: "Mesin Lubang Kancing", totalInFactory: 6 },
  Bass: { name: "Bass Automachine Label", totalInFactory: 4 },
  Soom: { name: "Blindstitch / Soom", totalInFactory: 4 },
  Manual: { name: "Meja Manual Stitch", totalInFactory: 15 },
  Helper: { name: "Meja Helper & Ironing", totalInFactory: 20 },
};

/**
 * Calculate Comprehensive Line Balancing and Layout Comparison
 */
export function runLineBalancingOptimization(
  processes: ProcessItem[],
  allOperators: Operator[], // up to 26 operators for the line
  targetPerHour: number = 10,
  workingHours: number = 8, // 8 for Senin-Jumat, 5 for Sabtu
  allowancePct: number = 15,
  workSchedule: "senin_jumat" | "sabtu" = "senin_jumat"
): {
  currentLayout: LayoutStation[];
  recommendedLayout: LayoutStation[];
  currentBalancing: LineBalancingResult;
  recommendedBalancing: LineBalancingResult;
  machineRequirements: MachineRequirement[];
  unassignedProcesses: ProcessItem[];
  alerts: string[];
  tandemAnalysis: TandemAnalysisResult;
} {
  // STRICT RULE: Only operators who are HADIR are available
  const presentOperators = allOperators.filter((op) => op.attendanceStatus === "HADIR");
  const absentOperators = allOperators.filter((op) => op.attendanceStatus !== "HADIR");

  // Takt time calculation strictly based on working hours
  // Senin - Jumat: 8 jam (28,800 detik total)
  // Sabtu: 5 jam (18,000 detik total)
  const totalAvailableSec = workingHours * 3600;
  const targetPerDay = targetPerHour * workingHours; // 80 for 8h, 50 for 5h
  const taktTimeSec = targetPerDay > 0 ? Math.round(totalAvailableSec / targetPerDay) : Math.round(3600 / targetPerHour);
  const taktTimeMin = Number((taktTimeSec / 60).toFixed(2));

  const totalSMV = Number(processes.reduce((sum, p) => sum + p.smv, 0).toFixed(2));
  const totalSAM = Number(processes.reduce((sum, p) => sum + (p.sam || p.smv * (1 + allowancePct / 100)), 0).toFixed(2));
  const totalCycleTime = processes.reduce((sum, p) => sum + p.cycleTime, 0);

  const alerts: string[] = [];
  const TOTAL_PHYSICAL_STATIONS = 26;
  const hasProcessesExceeding26 = processes.length > TOTAL_PHYSICAL_STATIONS;
  const exceedingCount = Math.max(0, processes.length - TOTAL_PHYSICAL_STATIONS);

  // Attendance Alert
  if (absentOperators.length > 0) {
    const absentNames = absentOperators.map((o) => `${o.name} (${o.attendanceStatus})`).join(", ");
    alerts.push(`Peringatan Kehadiran: Terdapat ${absentOperators.length} operator tidak hadir [${absentNames}].`);
  }

  // Schedule Info Alert
  alerts.push(
    workingHours === 5
      ? `Jadwal Kerja Sabtu: 5 Jam Kerja aktif (Takt Time: ${taktTimeSec}s, Target Harian: ${targetPerDay} pcs).`
      : `Jadwal Kerja Senin - Jumat: 8 Jam Kerja aktif (Takt Time: ${taktTimeSec}s, Target Harian: ${targetPerDay} pcs).`
  );

  if (hasProcessesExceeding26) {
    alerts.push(
      `Pemberitahuan Layout 26: Terdapat ${processes.length} proses (melebihi 26 stasiun fisik). ${exceedingCount} proses dialokasikan ke stasiun Tandem pada layout 26 meja.`
    );
  }

  // 1. GENERATE CURRENT LAYOUT (Strict 26 physical stations)
  // Take the first 26 processes as base stations
  const baseProcesses = processes.slice(0, TOTAL_PHYSICAL_STATIONS);
  const extraProcesses = processes.slice(TOTAL_PHYSICAL_STATIONS);

  // Map extra processes to host stations among the 26 stations
  // In sewing IE, extra operations are tandemized to complementary stations
  const tandemHostMap = new Map<number, ProcessItem>();
  extraProcesses.forEach((extraProc, idx) => {
    // Find matching station with same section or highest cycle time / bottleneck
    let bestHostSt = 19; // Default plausible tandem host for garments (e.g. Plaket/Collar/Sleeve)
    const matchingStationIdx = baseProcesses.findIndex(
      (bp) => bp.subSection === extraProc.subSection || bp.section === extraProc.section
    );
    if (matchingStationIdx !== -1 && !tandemHostMap.has(matchingStationIdx + 1)) {
      bestHostSt = matchingStationIdx + 1;
    } else {
      // Pick fallback stations 19, 21, 23, 25, 5, 7, 9
      const fallbackList = [19, 21, 23, 25, 5, 7, 9, 11, 13, 15, 17];
      for (const cand of fallbackList) {
        if (!tandemHostMap.has(cand)) {
          bestHostSt = cand;
          break;
        }
      }
    }
    tandemHostMap.set(bestHostSt, extraProc);
  });

  const currentLayout: LayoutStation[] = baseProcesses.map((proc, idx) => {
    const stationNo = idx + 1;
    const assignedOp = allOperators.find((op) => op.assignedProcessNo === proc.no);
    const isOpPresent = assignedOp && assignedOp.attendanceStatus === "HADIR";

    const isBottleneck = proc.cycleTime > taktTimeSec || proc.sam > taktTimeMin;
    const isUnassigned = !isOpPresent;

    let status: LayoutStation["status"] = "normal";
    if (isUnassigned) status = "unassigned";
    else if (isBottleneck) status = "bottleneck";
    else if (proc.cycleTime > taktTimeSec * 0.85) status = "warning";

    const workloadRatio = Number((proc.cycleTime / taktTimeSec).toFixed(2));

    let matchScore = 70;
    if (isOpPresent && assignedOp) {
      const skillRating = assignedOp.skills[proc.machine] || 2;
      matchScore = Math.min(100, Math.round((skillRating / 5) * 100));
    } else {
      matchScore = 0;
    }

    // Check if this station hosts a tandem extra process
    const tandemExtraProc = tandemHostMap.get(stationNo);
    const isTandem = !!tandemExtraProc;
    const tandemOp = tandemExtraProc ? allOperators.find((op) => op.assignedProcessNo === tandemExtraProc.no) : undefined;
    const tandemOpName = tandemOp && tandemOp.attendanceStatus === "HADIR" ? tandemOp.name : "Asisten Line / Helper Tandem";

    return {
      stationNo,
      processNo: proc.no,
      processName: proc.process,
      section: proc.subSection || proc.section,
      machineType: proc.machine,
      cycleTimeSec: isTandem ? Math.round((proc.cycleTime + tandemExtraProc!.cycleTime) / 2) : proc.cycleTime,
      smv: proc.smv,
      sam: Number((proc.sam || proc.smv * 1.15).toFixed(2)),
      targetPerHour,
      assignedOperatorId: isOpPresent ? assignedOp?.id : undefined,
      assignedOperatorName: isOpPresent ? (isTandem ? `${assignedOp?.name} & ${tandemOpName} (Tandem)` : assignedOp?.name) : "— KOSONG (Operator Absen) —",
      operatorGrade: isOpPresent ? assignedOp?.grade : undefined,
      operatorAttendance: assignedOp?.attendanceStatus,
      status: isTandem && status !== "unassigned" ? (workloadRatio > 1 ? "warning" : "normal") : status,
      workloadRatio,
      matchScore,
      rowPosition: idx % 2 === 0 ? "left" : "right",
      isTandem,
      tandemOperators: isTandem ? [assignedOp?.name || "Operator 1", tandemOpName] : undefined,
      tandemProcessNo: tandemExtraProc?.no,
      tandemProcessName: tandemExtraProc?.process,
      tandemMachine: tandemExtraProc?.machine,
      tandemSMV: tandemExtraProc?.smv,
      tandemCycleTimeSec: tandemExtraProc?.cycleTime,
      tandemOperatorName: tandemOpName,
      combinedSMV: tandemExtraProc ? Number((proc.smv + tandemExtraProc.smv).toFixed(2)) : undefined,
      tandemReason: tandemExtraProc
        ? `Proses #${tandemExtraProc.no} (${tandemExtraProc.process}) ditandemkan karena proses line melebihi 26 stasiun fisik.`
        : undefined,
    };
  });

  // 2. GENERATE RECOMMENDED LAYOUT WITH DOUBLE JOB & TANDEM ENGINE
  // Rule A: Jika operator kosong/tidak masuk -> Lakukan Double Job dengan analisis SMV terkecil
  // Rule B: Jika proses melebihi kapasitas orang atau > 26 -> Lakukan Tandem pada stasiun berat

  // Create operator workload registry
  interface OpWorkload {
    operator: Operator;
    primaryProcessNo?: number;
    primarySMV: number;
    assignedProcesses: number[];
    totalSMV: number;
    isDoubleJob: boolean;
  }

  const opWorkloadMap = new Map<string, OpWorkload>();
  presentOperators.forEach((op) => {
    // Find primary process
    const primProc = processes.find((p) => p.no === op.assignedProcessNo);
    const primSMV = primProc ? primProc.smv : 0.6;
    opWorkloadMap.set(op.id, {
      operator: op,
      primaryProcessNo: op.assignedProcessNo,
      primarySMV: primSMV,
      assignedProcesses: primProc ? [primProc.no] : [],
      totalSMV: primSMV,
      isDoubleJob: false,
    });
  });

  // Sort processes by criticality: high cycleTime/SAM first
  const sortedProcesses = [...processes].sort((a, b) => b.cycleTime - a.cycleTime);

  const recommendedAssignments = new Map<number, any>();
  const availablePresentOps = [...presentOperators];
  const assignedPrimaryOps = new Map<number, Operator>();

  // Pass 1: Assign one present operator per process where possible (prefer high skill / grade)
  sortedProcesses.forEach((proc) => {
    if (availablePresentOps.length === 0) return;

    let bestIndex = -1;
    let bestScore = -1;

    availablePresentOps.forEach((op, idx) => {
      const skill = op.skills[proc.machine] || 1;
      const gradeScore = op.grade === "A" ? 40 : op.grade === "B" ? 30 : op.grade === "C" ? 20 : 10;
      const efficiencyScore = op.efficiency * 0.4;
      const isOriginal = op.assignedProcessNo === proc.no ? 25 : 0;
      const totalScore = skill * 20 + gradeScore + efficiencyScore + isOriginal;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestIndex = idx;
      }
    });

    if (bestIndex !== -1) {
      const chosenOp = availablePresentOps.splice(bestIndex, 1)[0];
      assignedPrimaryOps.set(proc.no, chosenOp);
    }
  });

  // Identify vacant / uncovered processes among the 26 base stations
  const vacantProcesses = baseProcesses.filter((p) => !assignedPrimaryOps.has(p.no));

  // Pass 2: DOUBLE JOB with Analisis SMV Terkecil
  // For each vacant process, select present operator with the SMALLEST SMV workload
  const doubleJobAssignments = new Map<number, { op: Operator; originStation: number; originSMV: number }>();

  if (vacantProcesses.length > 0 && presentOperators.length > 0) {
    vacantProcesses.forEach((vacProc) => {
      let bestCandidateOp: Operator | null = null;
      let minSMV = 9999;
      let originSt = 1;

      presentOperators.forEach((op) => {
        const assignedProcNo = Array.from(assignedPrimaryOps.entries()).find(([_, o]) => o.id === op.id)?.[0];
        const primProc = processes.find((p) => p.no === assignedProcNo);
        const currentOpSMV = primProc ? primProc.smv : 0.5;

        let currentLoadCount = 1;
        doubleJobAssignments.forEach((v) => {
          if (v.op.id === op.id) currentLoadCount += 1;
        });

        const effectiveLoad = currentOpSMV + (currentLoadCount - 1) * 2.0;

        if (effectiveLoad < minSMV) {
          minSMV = effectiveLoad;
          bestCandidateOp = op;
          originSt = primProc ? primProc.no : 1;
        }
      });

      if (bestCandidateOp) {
        const op: Operator = bestCandidateOp;
        const originProc = processes.find((p) => p.no === originSt);
        const originSMV = originProc ? originProc.smv : 0.5;
        doubleJobAssignments.set(vacProc.no, { op, originStation: originSt, originSMV });

        alerts.push(
          `Double Job Diaktifkan (Analisis SMV Terkecil): Stasiun #${vacProc.no} (${vacProc.process}) di-cover oleh ${op.name} dari Stasiun #${originSt} (SMV Terkecil: ${originSMV}m).`
        );
      }
    });
  }

  // Pass 3: TANDEM ENGINE FOR 26 STATIONS
  // Any extra processes (index >= 26) are mapped to tandem host stations
  // In addition, any severe bottleneck station (> taktTime) gets tandem assistance
  const recTandemMap = new Map<number, { extraProc?: ProcessItem; helperName: string; reason: string }>();

  // Assign extra processes (> 26) to stations among the 26 base stations
  extraProcesses.forEach((extraProc, idx) => {
    let hostStNo = 19;
    const matchingStation = baseProcesses.find(
      (bp) => bp.subSection === extraProc.subSection || bp.section === extraProc.section
    );
    if (matchingStation && !recTandemMap.has(matchingStation.no)) {
      hostStNo = matchingStation.no;
    } else {
      const candidates = [19, 21, 23, 25, 5, 7, 9, 11, 13, 15, 17];
      for (const cand of candidates) {
        if (!recTandemMap.has(cand)) {
          hostStNo = cand;
          break;
        }
      }
    }

    const assignedExtraOp = allOperators.find((o) => o.assignedProcessNo === extraProc.no);
    const helperName = assignedExtraOp && assignedExtraOp.attendanceStatus === "HADIR"
      ? assignedExtraOp.name
      : "Asisten Tandem / Operator Bantuan";

    recTandemMap.set(hostStNo, {
      extraProc,
      helperName,
      reason: `Proses #${extraProc.no} (${extraProc.process}) ditandemkan ke Stasiun #${hostStNo} agar layout tetap 26 stasiun fisik.`,
    });
  });

  // Also check if any other station has severe bottleneck and could benefit from helper tandem
  baseProcesses.forEach((p) => {
    if (!recTandemMap.has(p.no) && p.cycleTime > taktTimeSec * 1.05) {
      recTandemMap.set(p.no, {
        helperName: "Asisten Line / Reduksi Bottleneck",
        reason: `Beban kerja stasiun (${p.cycleTime}s) melebihi Takt Time (${taktTimeSec}s). Ditandemkan untuk membagi siklus kerja.`,
      });
    }
  });

  const unassignedProcesses: ProcessItem[] = [];

  const recommendedLayout: LayoutStation[] = baseProcesses.map((proc, idx) => {
    const stationNo = idx + 1;
    const primaryOp = assignedPrimaryOps.get(proc.no);
    const doubleJobInfo = doubleJobAssignments.get(proc.no);
    const tandemInfo = recTandemMap.get(stationNo);

    let assignedOperatorName = "— Rekomendasi: Gabung Stasiun / Floating Helper —";
    let assignedOperatorId: string | undefined = undefined;
    let operatorGrade: Operator["grade"] | undefined = undefined;
    let operatorAttendance: Operator["attendanceStatus"] | undefined = undefined;
    let isDoubleJob = false;
    let doubleJobOriginStation: number | undefined = undefined;
    let doubleJobOriginSMV: number | undefined = undefined;
    let doubleJobDetail: string | undefined = undefined;
    let combinedSMV: number | undefined = undefined;
    let isTandem = !!tandemInfo;
    let tandemOperators: string[] | undefined = undefined;
    let effectiveEfficiency = 0.85;
    let matchScore = 0;

    if (primaryOp) {
      assignedOperatorName = primaryOp.name;
      assignedOperatorId = primaryOp.id;
      operatorGrade = primaryOp.grade;
      operatorAttendance = primaryOp.attendanceStatus;
      effectiveEfficiency = Math.max(0.7, primaryOp.efficiency / 100);
      const skillRating = primaryOp.skills[proc.machine] || 3;
      matchScore = Math.min(100, Math.round((skillRating / 5) * 100));

      if (isTandem) {
        assignedOperatorName = `${primaryOp.name} & ${tandemInfo.helperName} (Tandem)`;
        tandemOperators = [primaryOp.name, tandemInfo.helperName];
      }
    } else if (doubleJobInfo) {
      isDoubleJob = true;
      const { op, originStation, originSMV } = doubleJobInfo;
      assignedOperatorId = op.id;
      assignedOperatorName = `${op.name} [Double Job: St.#${originStation} & St.#${proc.no}]`;
      operatorGrade = op.grade;
      operatorAttendance = op.attendanceStatus;
      doubleJobOriginStation = originStation;
      doubleJobOriginSMV = originSMV;
      combinedSMV = Number((originSMV + proc.smv).toFixed(2));
      doubleJobDetail = `Analisis SMV Terkecil (${originSMV}m)`;
      effectiveEfficiency = Math.max(0.7, op.efficiency / 100);
      const skillRating = op.skills[proc.machine] || 2;
      matchScore = Math.min(100, Math.round((skillRating / 5) * 100));
    } else {
      unassignedProcesses.push(proc);
    }

    // Cycle time calculation: If Tandem, effective cycle time is halved because 2 operators divide the task!
    let rawCycle = proc.cycleTime;
    if (tandemInfo?.extraProc) {
      rawCycle = Math.round((proc.cycleTime + tandemInfo.extraProc.cycleTime) / 2);
    }
    let adjustedCycleTime = Math.round(rawCycle / effectiveEfficiency);
    if (isTandem && !tandemInfo?.extraProc) {
      adjustedCycleTime = Math.round(adjustedCycleTime / 2);
    }

    const isBottleneck = adjustedCycleTime > taktTimeSec;
    let status: LayoutStation["status"] = "normal";

    if (!primaryOp && !doubleJobInfo) {
      status = "unassigned";
    } else if (isBottleneck) {
      status = "bottleneck";
    } else if (isDoubleJob) {
      status = "warning";
    } else if (adjustedCycleTime > taktTimeSec * 0.85) {
      status = "warning";
    }

    const workloadRatio = Number((adjustedCycleTime / taktTimeSec).toFixed(2));

    const extraProc = tandemInfo?.extraProc;
    const finalCombinedSMV = extraProc ? Number((proc.smv + extraProc.smv).toFixed(2)) : combinedSMV;

    return {
      stationNo,
      processNo: proc.no,
      processName: proc.process,
      section: proc.subSection || proc.section,
      machineType: proc.machine,
      cycleTimeSec: adjustedCycleTime,
      smv: proc.smv,
      sam: Number((proc.sam || proc.smv * 1.15).toFixed(2)),
      targetPerHour,
      assignedOperatorId,
      assignedOperatorName,
      operatorGrade,
      operatorAttendance,
      status,
      workloadRatio,
      matchScore,
      rowPosition: idx % 2 === 0 ? "left" : "right",
      isDoubleJob,
      doubleJobOriginStation,
      doubleJobOriginSMV,
      doubleJobDetail,
      combinedSMV: finalCombinedSMV,
      isTandem,
      tandemOperators,
      tandemProcessNo: extraProc?.no,
      tandemProcessName: extraProc?.process,
      tandemMachine: extraProc?.machine,
      tandemSMV: extraProc?.smv,
      tandemCycleTimeSec: extraProc?.cycleTime,
      tandemOperatorName: tandemInfo?.helperName,
      tandemReason: tandemInfo?.reason,
    };
  });

  // 3. BALANCE EFFICIENCY & METRICS CALCULATION
  const calculateMetrics = (layout: LayoutStation[]): LineBalancingResult => {
    const cycleTimes = layout.map((s) => s.cycleTimeSec);
    const maxCycleTime = Math.max(...cycleTimes, 1);
    const sumCycleTime = cycleTimes.reduce((a, b) => a + b, 0);

    const stationsCount = layout.length;
    const balanceEfficiency = Number(((sumCycleTime / (maxCycleTime * stationsCount)) * 100).toFixed(1));
    const balanceDelay = Number((100 - balanceEfficiency).toFixed(1));

    // Idle time across working hours (8h for Mon-Fri, 5h for Sat)
    const cyclesPerDay = (workingHours * 3600) / maxCycleTime;
    const idleSecondsPerCycle = maxCycleTime * stationsCount - sumCycleTime;
    const totalIdleMinutes = Math.round((idleSecondsPerCycle * cyclesPerDay) / 60);

    const bottlenecks = layout.filter((s) => s.status === "bottleneck").length;
    const unassigned = layout.filter((s) => s.status === "unassigned").length;

    const lineEfficiency = Math.min(100, Number((balanceEfficiency * 0.94).toFixed(1)));
    const capacityPerHour = Math.floor(3600 / maxCycleTime);

    return {
      taktTimeSec,
      taktTimeMin: Number(taktTimeMin.toFixed(2)),
      totalCycleTime: sumCycleTime,
      totalSAM,
      totalSMV,
      theoreticalStations: Math.ceil(sumCycleTime / taktTimeSec),
      actualStations: stationsCount,
      lineEfficiency,
      balanceEfficiency,
      balanceDelay,
      totalIdleMinutes,
      capacityPerHour,
      bottleneckCount: bottlenecks,
      unassignedCount: unassigned,
      presentOperatorsCount: presentOperators.length,
      absentOperatorsCount: absentOperators.length,
    };
  };

  const currentBalancing = calculateMetrics(currentLayout);
  const recommendedBalancing = calculateMetrics(recommendedLayout);

  // 4. MACHINE REQUIREMENTS & SHORTAGE/SURPLUS DETECTION
  const machineMap = new Map<string, { count: number; totalSMV: number; totalSAM: number }>();
  processes.forEach((p) => {
    const m = p.machine;
    const existing = machineMap.get(m) || { count: 0, totalSMV: 0, totalSAM: 0 };
    existing.count += 1;
    existing.totalSMV += p.smv;
    existing.totalSAM += p.sam || p.smv * 1.15;
    machineMap.set(m, existing);
  });

  const availableMinutes = workingHours * 60 * 0.85; // 85% standard line efficiency
  const machineRequirements: MachineRequirement[] = [];

  machineMap.forEach((val, mType) => {
    const theoretical = (val.totalSAM * targetPerDay) / availableMinutes;
    const allocated = Math.max(1, Math.ceil(theoretical));
    const factoryInfo = FACTORY_MACHINE_INVENTORY[mType] || {
      name: mType,
      totalInFactory: 10,
    };
    const available = factoryInfo.totalInFactory;
    const shortageOrSurplus = available - allocated;

    if (shortageOrSurplus < 0) {
      alerts.push(
        `Deteksi Mesin: Kekurangan mesin ${mType} sebanyak ${Math.abs(
          shortageOrSurplus
        )} unit! Kebutuhan Harian: ${allocated} unit, Tersedia di pabrik: ${available} unit.`
      );
    }

    machineRequirements.push({
      machineType: mType,
      displayName: factoryInfo.name,
      totalSMV: Number(val.totalSMV.toFixed(2)),
      totalSAM: Number(val.totalSAM.toFixed(2)),
      processCount: val.count,
      theoreticalMachines: Number(theoretical.toFixed(2)),
      allocatedMachines: allocated,
      availableInFactory: available,
      shortageOrSurplus,
      utilizationPercent: Number(((theoretical / allocated) * 100).toFixed(1)),
      recommendedOperators: allocated,
    });
  });

  machineRequirements.sort((a, b) => b.allocatedMachines - a.allocatedMachines);

  // 5. TANDEM ANALYSIS DATA
  const tandemAnalysisItems: TandemAnalysisItem[] = [];

  recommendedLayout.forEach((station) => {
    if (station.isTandem) {
      const primarySMV = station.smv;
      const tandemSMV = station.tandemSMV || 0.65;
      const combined = Number((primarySMV + tandemSMV).toFixed(2));
      const effectiveSec = station.cycleTimeSec;

      tandemAnalysisItems.push({
        stationNo: station.stationNo,
        primaryProcessNo: station.processNo,
        primaryProcessName: station.processName,
        primaryMachine: station.machineType,
        primarySMV,
        primaryCycleTimeSec: Math.round(primarySMV * 60),
        primaryOperatorName: station.assignedOperatorName?.split("&")[0]?.trim() || "Operator Utama",
        tandemProcessNo: station.tandemProcessNo || 0,
        tandemProcessName: station.tandemProcessName || "Bantuan Tandem / Reduksi Beban",
        tandemMachine: station.tandemMachine || station.machineType,
        tandemSMV,
        tandemCycleTimeSec: station.tandemCycleTimeSec || Math.round(tandemSMV * 60),
        tandemOperatorName: station.tandemOperatorName || "Operator Tandem / Helper",
        combinedSMV: combined,
        effectiveCycleTimeSec: effectiveSec,
        taktTimeSec,
        workloadRatio: station.workloadRatio,
        status: station.status === "bottleneck" ? "bottleneck" : station.status === "warning" ? "warning" : "normal",
        reason: station.tandemReason || "Penyaluran kapasitas operasi ke layout 26",
        engineeringBenefit: hasProcessesExceeding26
          ? `Menjaga layout fisik tetap 26 stasiun dengan membagi beban 2 proses/2 operator sehingga waktu siklus efektif (${effectiveSec}s) aman dari Takt Time (${taktTimeSec}s).`
          : `Mengurangi waktu siklus bottleneck dari ${Math.round(primarySMV * 60)}s menjadi ${effectiveSec}s dengan bantuan operator tandem.`,
      });
    }
  });

  const tandemAnalysis: TandemAnalysisResult = {
    totalProcesses: processes.length,
    physicalLayoutStations: TOTAL_PHYSICAL_STATIONS,
    hasProcessesExceeding26,
    exceedingCount,
    tandemStationCount: tandemAnalysisItems.length,
    tandemStations: tandemAnalysisItems,
    lineBalancingImprovement: hasProcessesExceeding26
      ? `Layout fisik dipertahankan tepat 26 stasiun. ${exceedingCount} proses berlebih (> 26) dialokasikan ke ${tandemAnalysisItems.length} stasiun tandem tanpa memerlukan investasi meja/jalur baru.`
      : `Tandem diterapkan secara terarah pada stasiun bottleneck untuk menjaga stabilitas aliran produksi.`,
  };

  return {
    currentLayout,
    recommendedLayout,
    currentBalancing,
    recommendedBalancing,
    machineRequirements,
    unassignedProcesses,
    alerts,
    tandemAnalysis,
  };
}

