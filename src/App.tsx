/**
 * Sewing Production Engineering Monitoring & Operator Grading System
 *
 * Core System Features:
 * - 6 Sewing Lines: Line 1, 3, 4, 5, 6, 7
 * - Role-Based Access Control (RBAC):
 *   * Production Engineer (PE): Global access to all lines, master data, breakdown upload, and PE analytics
 *   * Admin Line: Restricted strictly to their assigned line, manages attendance and hourly inputs
 * - Operator Attendance Management (Up to 26 operators per line):
 *   * HADIR, SAKIT, IZIN, CUTI, ALPHA
 *   * STRICT RULE: Optimization engine only allocates HADIR operators
 * - Line Balancing & Optimization Engine:
 *   * Operator grading (Grade A, B, C, D)
 *   * Sewing machine requirements & inventory shortage/surplus detection
 *   * Takt time & Pitch diagram calculation
 *   * Capacity, bottlenecks, balance efficiency, idle time
 *   * Current vs. Recommended Layout comparison with 1-click apply
 * - Digital Hourly Production Control Sheet (F-SEW-005-00)
 * - PE Decision Support Dashboard:
 *   * Multi-line comparison
 *   * Pareto Analysis (Defects & Bottleneck Causes 80/20)
 *   * 6M Fishbone Cause & Effect Diagram
 *   * 5 Why Root Cause Drill-Down
 *   * AI & Heuristic Recommendation Engine
 * - Export to Excel (.xlsx) & Comprehensive PDF Layout Print Reports (F-IE-008-00)
 */

import React, { useState, useMemo } from "react";
import {
  ProcessItem,
  StyleMetadata,
  MachineRequirement,
  LineProductionData,
  Operator,
  User,
  LineNumber,
  AttendanceStatus,
  LineBPData,
  DailyReportLog,
  GoogleScriptConfig,
  GoogleScriptSyncLog,
} from "./types";
import {
  DEFAULT_STYLE_METADATA,
  RAW_BREAKDOWN_PROCESSES,
  INITIAL_OPERATORS,
  VALID_LINES,
  DEFAULT_USERS,
  generateInitialLineRows,
} from "./data/defaultData";
import { DEFAULT_LINES_BP, INITIAL_SEPTEMBER_2026_LOGS } from "./data/lineBPData";
import { calculateMachineRequirements, exportProductionSheetToExcel } from "./utils/excelParser";
import { runLineBalancingOptimization } from "./utils/lineBalancing";
import { DEFAULT_GOOGLE_SCRIPT_CONFIG, syncHourlyToGoogleScript } from "./utils/googleScriptService";
import { Navbar } from "./components/Navbar";
import { HourlyProductionSheet } from "./components/HourlyProductionSheet";
import { OperatorAttendanceSheet } from "./components/OperatorAttendanceSheet";
import { ExcelProcessBreakdown } from "./components/ExcelProcessBreakdown";
import { MachineLayoutVisualizer } from "./components/MachineLayoutVisualizer";
import { PEDashboard } from "./components/PEDashboard";
import { TargetAnalysisModal } from "./components/TargetAnalysisModal";
import { EditUserModal } from "./components/EditUserModal";
import { LineLayoutPrintReport } from "./components/LineLayoutPrintReport";
import { DailyReportSheet } from "./components/DailyReportSheet";
import { LoginModal } from "./components/LoginModal";
import { GoogleScriptModal } from "./components/GoogleScriptModal";

export default function App() {
  // Navigation & Line Selection
  const [activeTab, setActiveTab] = useState<
    "hourly" | "attendance" | "excel" | "layout" | "pe-dashboard" | "daily"
  >("hourly");
  const [selectedLine, setSelectedLine] = useState<LineNumber>(1);

  // RBAC User Authentication State
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem("sewsmart_users_v4");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedUser = localStorage.getItem("sewsmart_current_user_v4");
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {}
    return DEFAULT_USERS[0]; // Default: Production Engineer
  });

  // Master per-line Breakdown Process (BP) State
  // Each line has its own distinct BP uploaded by its admin
  const [linesBP, setLinesBP] = useState<Record<LineNumber, LineBPData>>(() => {
    try {
      const saved = localStorage.getItem("sewsmart_lines_bp_v4");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_LINES_BP;
  });

  // Daily Reports & Monthly Recap Logs (September 2026)
  const [dailyLogs, setDailyLogs] = useState<DailyReportLog[]>(() => {
    try {
      const saved = localStorage.getItem("sewsmart_daily_logs_v4");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_SEPTEMBER_2026_LOGS;
  });

  const [selectedDate, setSelectedDate] = useState<string>("2026-09-13");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Active Line's Breakdown Data (BP)
  const currentLineBP: LineBPData = useMemo(() => {
    return linesBP[selectedLine] || DEFAULT_LINES_BP[selectedLine] || DEFAULT_LINES_BP[1];
  }, [linesBP, selectedLine]);

  const activeProcesses = currentLineBP.processes;
  const activeMetadata = currentLineBP.metadata;
  const activeMachineRequirements = currentLineBP.machineRequirements;

  // Line Production Data for Lines 1, 3, 4, 5, 6, 7 (Generated with each line's BP)
  const [linesData, setLinesData] = useState<Record<number, LineProductionData>>(() => {
    const initial: Record<number, LineProductionData> = {};
    VALID_LINES.forEach((lineId) => {
      const bp = DEFAULT_LINES_BP[lineId] || DEFAULT_LINES_BP[1];
      initial[lineId] = generateInitialLineRows(lineId, bp.processes);
    });
    return initial;
  });

  // Operators List (Per line with attendance, skill matrix & grading)
  const [operators, setOperators] = useState<Operator[]>(() => {
    try {
      const saved = localStorage.getItem("sewsmart_operators_v4");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_OPERATORS;
  });

  // Modals state
  const [isTargetAnalysisOpen, setIsTargetAnalysisOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [isGoogleScriptModalOpen, setIsGoogleScriptModalOpen] = useState(false);

  // Google Apps Script & Google Spreadsheet Integration State
  const [googleScriptConfig, setGoogleScriptConfig] = useState<GoogleScriptConfig>(() => {
    try {
      const saved = localStorage.getItem("sewsmart_google_script_config_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return DEFAULT_GOOGLE_SCRIPT_CONFIG;
  });

  const [syncLogs, setSyncLogs] = useState<GoogleScriptSyncLog[]>(() => {
    try {
      const saved = localStorage.getItem("sewsmart_google_script_logs_v1");
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const handleSaveGoogleScriptConfig = (newConfig: GoogleScriptConfig) => {
    setGoogleScriptConfig(newConfig);
    try {
      localStorage.setItem("sewsmart_google_script_config_v1", JSON.stringify(newConfig));
    } catch (e) {}
  };

  const handleAddSyncLog = (log: GoogleScriptSyncLog) => {
    setSyncLogs((prev) => {
      const next = [log, ...prev].slice(0, 50); // keep last 50
      try {
        localStorage.setItem("sewsmart_google_script_logs_v1", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const handleClearSyncLogs = () => {
    setSyncLogs([]);
    try {
      localStorage.removeItem("sewsmart_google_script_logs_v1");
    } catch (e) {}
  };

  // Work Schedule state: "senin_jumat" (8 hours) vs "sabtu" (5 hours)
  const [workSchedule, setWorkSchedule] = useState<"senin_jumat" | "sabtu">("senin_jumat");
  const effectiveWorkingHours = workSchedule === "sabtu" ? 5 : 8;

  // Current line operators
  const currentLineOperators = useMemo(() => {
    return operators.filter((o) => o.line === selectedLine);
  }, [operators, selectedLine]);

  // Current line data
  const currentLineData = useMemo(() => {
    return linesData[selectedLine] || generateInitialLineRows(selectedLine, activeProcesses, currentLineOperators, workSchedule);
  }, [linesData, selectedLine, activeProcesses, currentLineOperators, workSchedule]);

  // LINE BALANCING OPTIMIZATION ENGINE
  // Computes current layout vs recommended layout, metrics, alerts, machine reqs, double job & tandem
  const optimizationResult = useMemo(() => {
    return runLineBalancingOptimization(
      activeProcesses,
      currentLineOperators,
      activeMetadata.lineTargetPerHour,
      effectiveWorkingHours,
      activeMetadata.allowancePercentage || 15,
      workSchedule
    );
  }, [
    activeProcesses,
    currentLineOperators,
    activeMetadata.lineTargetPerHour,
    effectiveWorkingHours,
    activeMetadata.allowancePercentage,
    workSchedule,
  ]);

  // Handlers for RBAC user changes
  const handleUpdateUserName = (userId: string, newName: string) => {
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, name: newName } : u));
      try {
        localStorage.setItem("sewsmart_users_v4", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    if (currentUser.id === userId) {
      setCurrentUser((prev) => {
        const updated = { ...prev, name: newName };
        try {
          localStorage.setItem("sewsmart_current_user_v4", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
    }
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    try {
      localStorage.setItem("sewsmart_current_user_v4", JSON.stringify(user));
    } catch (e) {}
    if (user.role === "admin_line" && user.assignedLine) {
      setSelectedLine(user.assignedLine);
    }
  };

  // UPLOAD LINE BP HANDLER (Admin Line or PE)
  const handleUploadLineBP = (
    lineId: LineNumber,
    newProcesses: ProcessItem[],
    newMetadata: StyleMetadata,
    fileName: string
  ) => {
    const newReqs = calculateMachineRequirements(
      newProcesses,
      newMetadata.lineTargetPerDay,
      newMetadata.workingHours,
      newMetadata.allowancePercentage || 15
    );

    const updatedBP: LineBPData = {
      lineId,
      metadata: newMetadata,
      processes: newProcesses,
      machineRequirements: newReqs,
      uploadedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      uploadedBy: currentUser.name,
      fileName,
    };

    setLinesBP((prev) => {
      const next = { ...prev, [lineId]: updatedBP };
      try {
        localStorage.setItem("sewsmart_lines_bp_v4", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Re-generate line rows with the new processes for this specific line
    setLinesData((prev) => {
      const lineOps = operators.filter((o) => o.line === lineId);
      const newSheet = generateInitialLineRows(lineId, newProcesses, lineOps);
      return {
        ...prev,
        [lineId]: newSheet,
      };
    });
  };

  // UPDATE PROCESSES FOR ACTIVE LINE
  const handleUpdateProcesses = (newProcesses: ProcessItem[]) => {
    const newReqs = calculateMachineRequirements(
      newProcesses,
      activeMetadata.lineTargetPerDay,
      activeMetadata.workingHours,
      activeMetadata.allowancePercentage || 15
    );

    const updatedBP: LineBPData = {
      ...currentLineBP,
      processes: newProcesses,
      machineRequirements: newReqs,
    };

    setLinesBP((prev) => {
      const next = { ...prev, [selectedLine]: updatedBP };
      try {
        localStorage.setItem("sewsmart_lines_bp_v4", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setLinesData((prev) => {
      const lineOps = operators.filter((o) => o.line === selectedLine);
      const newSheet = generateInitialLineRows(selectedLine, newProcesses, lineOps);
      return {
        ...prev,
        [selectedLine]: newSheet,
      };
    });
  };

  // UPDATE METADATA FOR ACTIVE LINE
  const handleUpdateMetadata = (newMetadata: StyleMetadata) => {
    const newReqs = calculateMachineRequirements(
      activeProcesses,
      newMetadata.lineTargetPerDay,
      newMetadata.workingHours,
      newMetadata.allowancePercentage || 15
    );

    const updatedBP: LineBPData = {
      ...currentLineBP,
      metadata: newMetadata,
      machineRequirements: newReqs,
    };

    setLinesBP((prev) => {
      const next = { ...prev, [selectedLine]: updatedBP };
      try {
        localStorage.setItem("sewsmart_lines_bp_v4", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // SAVE DAILY REPORT LOG (September 2026)
  const handleSaveDailyLog = (newLog: DailyReportLog) => {
    setDailyLogs((prev) => {
      const index = prev.findIndex((l) => l.date === newLog.date && l.lineId === newLog.lineId);
      let updated: DailyReportLog[];
      if (index >= 0) {
        updated = [...prev];
        updated[index] = newLog;
      } else {
        updated = [newLog, ...prev];
      }
      try {
        localStorage.setItem("sewsmart_daily_logs_v4", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // ATTENDANCE UPDATE HANDLER
  const handleUpdateOperatorAttendance = (
    operatorId: string,
    status: AttendanceStatus,
    notes?: string
  ) => {
    setOperators((prev) => {
      const next = prev.map((op) =>
        op.id === operatorId
          ? {
              ...op,
              attendanceStatus: status,
              attendanceNotes: notes || (status === "HADIR" ? "" : op.attendanceNotes),
            }
          : op
      );
      try {
        localStorage.setItem("sewsmart_operators_v4", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    // Synchronize attendance flag on current line rows
    setLinesData((prev) => {
      const lineObj = prev[selectedLine];
      if (!lineObj) return prev;

      const targetOp = operators.find((o) => o.id === operatorId);
      if (!targetOp) return prev;

      const updatedRows = lineObj.rows.map((row) => {
        if (row.operatorName === targetOp.name || row.no === targetOp.assignedProcessNo) {
          return {
            ...row,
            operatorAttendance: status,
            status:
              status !== "HADIR"
                ? ("unassigned" as const)
                : row.balanceTarget < -10
                ? ("bottleneck" as const)
                : ("normal" as const),
          };
        }
        return row;
      });

      return {
        ...prev,
        [selectedLine]: {
          ...lineObj,
          rows: updatedRows,
        },
      };
    });
  };

  // BATCH SET ALL HADIR
  const handleBatchSetAllHadir = () => {
    setOperators((prev) => {
      const next = prev.map((op) =>
        op.line === selectedLine
          ? { ...op, attendanceStatus: "HADIR", attendanceNotes: "" }
          : op
      );
      try {
        localStorage.setItem("sewsmart_operators_v4", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    setLinesData((prev) => {
      const lineObj = prev[selectedLine];
      if (!lineObj) return prev;

      const updatedRows = lineObj.rows.map((r) => ({
        ...r,
        operatorAttendance: "HADIR" as const,
        status: r.balanceTarget < -10 ? ("bottleneck" as const) : ("normal" as const),
      }));

      return {
        ...prev,
        [selectedLine]: {
          ...lineObj,
          rows: updatedRows,
        },
      };
    });
  };

  // UPDATE OPERATOR DETAILS (Skill Matrix, Grade, Efficiency, Defect)
  const handleUpdateOperatorDetails = (operatorId: string, updated: Partial<Operator>) => {
    setOperators((prev) => {
      const next = prev.map((op) => (op.id === operatorId ? { ...op, ...updated } : op));
      try {
        localStorage.setItem("sewsmart_operators_v4", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // ADD OPERATOR TO CURRENT LINE
  const handleAddOperator = (newOperator: Operator) => {
    setOperators((prev) => {
      const next = [...prev, newOperator];
      try {
        localStorage.setItem("sewsmart_operators_v4", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // DELETE OPERATOR FROM CURRENT LINE
  const handleDeleteOperator = (operatorId: string) => {
    setOperators((prev) => {
      const next = prev.filter((op) => op.id !== operatorId);
      try {
        localStorage.setItem("sewsmart_operators_v4", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // APPLY RECOMMENDED LAYOUT TO LINE PRODUCTION SHEET
  const handleApplyRecommendedLayout = () => {
    setLinesData((prev) => {
      const lineObj = prev[selectedLine];
      if (!lineObj) return prev;

      const updatedRows = lineObj.rows.map((row) => {
        const rec = optimizationResult.recommendedLayout.find((r) => r.stationNo === row.no);
        if (rec) {
          return {
            ...row,
            operatorName: rec.assignedOperatorName,
            operatorGrade: rec.operatorGrade,
            operatorAttendance: rec.attendanceStatus,
            status: rec.status,
            machine: rec.machineType,
            keterangan:
              rec.status === "unassigned"
                ? "Operator Asli Absen - Butuh Floating Helper"
                : rec.status === "bottleneck"
                ? "Bottleneck Siklus > Takt Time"
                : "Optimal Line Balancing",
          };
        }
        return row;
      });

      return {
        ...prev,
        [selectedLine]: {
          ...lineObj,
          rows: updatedRows,
        },
      };
    });
  };

  // HOURLY PRODUCTION SHEET OUTPUT UPDATE
  const handleUpdateHourlyOutput = (
    processNo: number,
    hourIndex: number,
    newActual: number,
    newDefect: number
  ) => {
    setLinesData((prev) => {
      const lineObj = prev[selectedLine];
      if (!lineObj) return prev;

      const updatedRows = lineObj.rows.map((row) => {
        if (row.no === processNo) {
          const updatedHourlyActual = [...row.hourlyActual];
          const updatedHourlyDefects = [...row.hourlyDefects];

          updatedHourlyActual[hourIndex] = newActual;
          updatedHourlyDefects[hourIndex] = newDefect;

          const totalActual = updatedHourlyActual.reduce((a, b) => a + b, 0);
          const totalDefects = updatedHourlyDefects.reduce((a, b) => a + b, 0);
          const balanceTarget = totalActual - row.target;

          return {
            ...row,
            hourlyActual: updatedHourlyActual,
            hourlyDefects: updatedHourlyDefects,
            totalActual,
            akmOutput: totalActual,
            totalDefects,
            balanceTarget,
            status:
              row.operatorAttendance !== "HADIR"
                ? ("unassigned" as const)
                : balanceTarget < -10
                ? ("bottleneck" as const)
                : ("normal" as const),
            keterangan:
              row.operatorAttendance !== "HADIR"
                ? "Kritis: Operator Absen"
                : balanceTarget < -10
                ? "Bottleneck di stasiun ini"
                : balanceTarget < 0
                ? "Under target"
                : "Tercapai normal",
          };
        }
        return row;
      });

      return {
        ...prev,
        [selectedLine]: {
          ...lineObj,
          rows: updatedRows,
        },
      };
    });
  };

  // UPDATE PROCESS ASSIGNMENT (Single Station)
  const handleUpdateProcessAssignment = (
    processNo: number,
    operatorName: string,
    machineName: string
  ) => {
    const matchedOp = currentLineOperators.find((o) => o.name === operatorName);

    setLinesData((prev) => {
      const lineObj = prev[selectedLine];
      if (!lineObj) return prev;

      const updatedRows = lineObj.rows.map((r) => {
        if (r.no === processNo) {
          return {
            ...r,
            operatorName,
            operatorGrade: matchedOp?.grade || r.operatorGrade,
            operatorAttendance: matchedOp?.attendanceStatus || "HADIR",
            machine: machineName,
          };
        }
        return r;
      });

      return {
        ...prev,
        [selectedLine]: {
          ...lineObj,
          rows: updatedRows,
        },
      };
    });
  };

  // CLEAR CURRENT LINE HOURLY DATA (KOSONGKAN DATA TERINPUT KEMBALI KE 0)
  const handleClearLineHourlyData = (lineId: LineNumber) => {
    setLinesData((prev) => {
      const lineObj = prev[lineId];
      if (!lineObj) return prev;

      const clearedRows = lineObj.rows.map((row) => ({
        ...row,
        hourlyActual: [0, 0, 0, 0, 0, 0, 0, 0],
        hourlyDefects: [0, 0, 0, 0, 0, 0, 0, 0],
        totalActual: 0,
        akmOutput: 0,
        totalDefects: 0,
        balanceTarget: -row.target,
        status:
          row.operatorAttendance !== "HADIR"
            ? ("unassigned" as const)
            : ("normal" as const),
        keterangan:
          row.operatorAttendance !== "HADIR"
            ? "Kritis: Operator Absen"
            : "Data baru dikosongkan (0 pcs)",
      }));

      const next = {
        ...prev,
        [lineId]: {
          ...lineObj,
          rows: clearedRows,
        },
      };
      try {
        localStorage.setItem("sewsmart_lines_data_v4", JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  // APPLY DOUBLE JOB (SMV TERKECIL)
  const handleApplyDoubleJob = (
    stationNo: number,
    candidateOpName: string,
    originStationNo: number
  ) => {
    const candidateOp = operators.find((o) => o.name === candidateOpName);
    setLinesData((prev) => {
      const lineObj = prev[selectedLine];
      if (!lineObj) return prev;

      const updatedRows = lineObj.rows.map((row) => {
        if (row.no === stationNo) {
          return {
            ...row,
            operatorName: `${candidateOpName} (Double Job)`,
            operatorGrade: candidateOp?.grade || row.operatorGrade,
            operatorAttendance: "HADIR" as const,
            isDoubleJob: true,
            status: "normal" as const,
            keterangan: `Double Job (Cover dari St. #${originStationNo})`,
          };
        }
        if (row.no === originStationNo) {
          return {
            ...row,
            isDoubleJob: true,
            keterangan: `Double Job (Cover St. #${stationNo})`,
          };
        }
        return row;
      });

      return {
        ...prev,
        [selectedLine]: {
          ...lineObj,
          rows: updatedRows,
        },
      };
    });
  };

  // APPLY TANDEM (KAPASITAS MELEBIHI / 2 OPERATOR)
  const handleApplyTandem = (
    stationNo: number,
    op1Name: string,
    op2Name: string
  ) => {
    setLinesData((prev) => {
      const lineObj = prev[selectedLine];
      if (!lineObj) return prev;

      const updatedRows = lineObj.rows.map((row) => {
        if (row.no === stationNo) {
          return {
            ...row,
            operatorName: `${op1Name} & ${op2Name}`,
            isTandem: true,
            cycleTime: Math.round(row.cycleTime / 2),
            status: "normal" as const,
            keterangan: "Tandem 2 Operator (Siklus dipangkas 50%)",
          };
        }
        return row;
      });

      return {
        ...prev,
        [selectedLine]: {
          ...lineObj,
          rows: updatedRows,
        },
      };
    });
  };

  // COUNTERS FOR NAVBAR ALERTS
  const presentCount = currentLineOperators.filter((o) => o.attendanceStatus === "HADIR").length;
  const totalOpsCount = currentLineOperators.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Precision Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedLine={selectedLine}
        setSelectedLine={setSelectedLine}
        currentUser={currentUser}
        users={users}
        onSwitchUser={handleSwitchUser}
        onOpenTargetAnalysis={() => setIsTargetAnalysisOpen(true)}
        onOpenEditUser={() => setIsEditUserOpen(true)}
        onOpenPrintReport={() => setIsPrintReportOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenGoogleScript={() => setIsGoogleScriptModalOpen(true)}
        isGoogleScriptConnected={!!googleScriptConfig.webAppUrl}
        onClearData={() => handleClearLineHourlyData(selectedLine)}
        onExportExcel={() =>
          exportProductionSheetToExcel(activeMetadata, selectedLine, currentLineData.rows)
        }
        buyerStyle={`${activeMetadata.buyer} • ${activeMetadata.style}`}
        bottleneckCount={optimizationResult.currentBalancing.bottleneckCount}
        unassignedCount={optimizationResult.currentBalancing.unassignedCount}
        attendancePresentCount={presentCount}
        totalOperatorsCount={totalOpsCount}
      />

      {/* Main Workspace View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* VIEW 1: Hourly Production Sheet (F-SEW-005) */}
        {activeTab === "hourly" && (
          <HourlyProductionSheet
            metadata={activeMetadata}
            lineData={currentLineData}
            operators={currentLineOperators}
            currentUser={currentUser}
            workSchedule={workSchedule}
            onToggleWorkSchedule={setWorkSchedule}
            onClearLineHourlyData={() => handleClearLineHourlyData(selectedLine)}
            onApplyDoubleJob={handleApplyDoubleJob}
            onApplyTandem={handleApplyTandem}
            onUpdateHourlyOutput={handleUpdateHourlyOutput}
            onUpdateProcessAssignment={handleUpdateProcessAssignment}
            onOpenPrintReport={() => setIsPrintReportOpen(true)}
            onNavigateToAttendance={() => setActiveTab("attendance")}
            onOpenGoogleScript={() => setIsGoogleScriptModalOpen(true)}
            isGoogleScriptConnected={!!googleScriptConfig.webAppUrl}
          />
        )}

        {/* VIEW 2: Operator Attendance & Skill Matrix (Max 26 Ops) */}
        {activeTab === "attendance" && (
          <OperatorAttendanceSheet
            lineId={selectedLine}
            operators={currentLineOperators}
            currentUser={currentUser}
            onUpdateOperatorAttendance={handleUpdateOperatorAttendance}
            onUpdateOperatorDetails={handleUpdateOperatorDetails}
            onBatchSetAllHadir={handleBatchSetAllHadir}
            onAddOperator={handleAddOperator}
            onDeleteOperator={handleDeleteOperator}
          />
        )}

        {/* VIEW 3: Excel Breakdown & Sewing Machine Requirements (Per-Line BP Upload) */}
        {activeTab === "excel" && (
          <ExcelProcessBreakdown
            selectedLine={selectedLine}
            currentBP={currentLineBP}
            metadata={activeMetadata}
            processes={activeProcesses}
            machineRequirements={activeMachineRequirements}
            currentUser={currentUser}
            onUpdateProcesses={handleUpdateProcesses}
            onUpdateMetadata={handleUpdateMetadata}
            onUploadLineBP={handleUploadLineBP}
          />
        )}

        {/* VIEW 4: Machine Layout Visualizer (Current vs Recommended Layout) */}
        {activeTab === "layout" && (
          <MachineLayoutVisualizer
            lineId={selectedLine}
            currentUser={currentUser}
            currentLayout={optimizationResult.currentLayout}
            recommendedLayout={optimizationResult.recommendedLayout}
            currentBalancing={optimizationResult.currentBalancing}
            recommendedBalancing={optimizationResult.recommendedBalancing}
            alerts={optimizationResult.alerts}
            unassignedProcesses={optimizationResult.unassignedProcesses}
            machineRequirements={activeMachineRequirements}
            workingHours={effectiveWorkingHours}
            workSchedule={workSchedule}
            onToggleWorkSchedule={setWorkSchedule}
            onApplyRecommendedLayout={handleApplyRecommendedLayout}
            onOpenPrintReport={() => setIsPrintReportOpen(true)}
          />
        )}

        {/* VIEW 5: Production Engineering Decision-Support Dashboard */}
        {activeTab === "pe-dashboard" && (
          <PEDashboard
            linesData={linesData}
            allOperators={operators}
            currentUser={currentUser}
            onSelectLine={(line) => {
              setSelectedLine(line);
              setActiveTab("hourly");
            }}
            onOpenTargetAnalysis={() => setIsTargetAnalysisOpen(true)}
          />
        )}

        {/* VIEW 6: Laporan Harian & Arsip Bulanan (September 2026) */}
        {activeTab === "daily" && (
          <DailyReportSheet
            selectedLine={selectedLine}
            currentBP={currentLineBP}
            lineData={currentLineData}
            operators={currentLineOperators}
            currentUser={currentUser}
            dailyLogs={dailyLogs}
            onSaveDailyLog={handleSaveDailyLog}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        )}
      </main>

      {/* Production Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600" />
            <span className="font-semibold text-slate-700">
              Sewing Production Engineering Monitoring & Operator Grading System
            </span>
            <span className="text-slate-400 font-mono">| Lines 1, 3, 4, 5, 6, 7</span>
          </div>

          <div className="font-mono text-slate-500">
            Aktif: <strong className="text-slate-800">{currentUser.name}</strong> (
            {currentUser.role === "production_engineer"
              ? "PE Head"
              : `Admin Line ${currentUser.assignedLine}`}
            ) &bull; Hadir: {presentCount}/{totalOpsCount} Op &bull; BP: {currentLineBP.metadata.buyer} {currentLineBP.metadata.style}
          </div>
        </div>
      </footer>

      {/* Target & AI Diagnostic Modal */}
      <TargetAnalysisModal
        isOpen={isTargetAnalysisOpen}
        onClose={() => setIsTargetAnalysisOpen(false)}
        lineData={currentLineData}
        operators={currentLineOperators}
        selectedLine={selectedLine}
        onSelectLine={setSelectedLine}
      />

      {/* Edit User Profile Modal */}
      <EditUserModal
        isOpen={isEditUserOpen}
        onClose={() => setIsEditUserOpen(false)}
        currentUser={currentUser}
        users={users}
        onUpdateUserName={handleUpdateUserName}
      />

      {/* Comprehensive Printable Report Modal */}
      <LineLayoutPrintReport
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        metadata={activeMetadata}
        currentLineData={currentLineData}
        allLinesData={linesData}
        machineRequirements={activeMachineRequirements}
        operators={operators}
        currentUser={currentUser}
        onSelectLine={(l) => setSelectedLine(l)}
      />

      {/* Role-Based Login & Security Modal (Admin Line & PE Passwords) */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        users={users}
        onLoginSuccess={handleSwitchUser}
        onLogout={() => handleSwitchUser(DEFAULT_USERS[0])}
      />

      {/* Google Apps Script & Google Spreadsheet Integration Modal */}
      <GoogleScriptModal
        isOpen={isGoogleScriptModalOpen}
        onClose={() => setIsGoogleScriptModalOpen(false)}
        config={googleScriptConfig}
        onSaveConfig={handleSaveGoogleScriptConfig}
        syncLogs={syncLogs}
        onAddSyncLog={handleAddSyncLog}
        onClearSyncLogs={handleClearSyncLogs}
        currentLine={selectedLine}
        activeMetadata={activeMetadata}
        currentLineRows={currentLineData.rows}
        currentOperators={currentLineOperators}
        dailyLogs={dailyLogs}
      />
    </div>
  );
}
