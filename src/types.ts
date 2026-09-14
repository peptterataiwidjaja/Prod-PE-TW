/**
 * Sewing Production Engineering Monitoring & Operator Grading System
 * Core TypeScript Definitions
 */

export type LineNumber = 1 | 3 | 4 | 5 | 6 | 7;

export type UserRole = "production_engineer" | "admin_line";

export type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "CUTI" | "ALPHA";

export type OperatorGrade = "A" | "B" | "C" | "D";

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  assignedLine?: LineNumber; // defined if role === "admin_line"
  title: string;
  password?: string;
  lastLogin?: string;
}

export interface SkillRating {
  machineType: string;
  level: number; // 1 to 5 (1=Novice, 2=Basic, 3=Competent, 4=Proficient, 5=Expert)
}

export interface Operator {
  id: string;
  name: string;
  line: LineNumber;
  nik: string; // Nomor Induk Karyawan
  attendanceStatus: AttendanceStatus;
  attendanceNotes?: string;
  grade: OperatorGrade;
  skills: Record<string, number>; // machineType -> rating 1..5
  primarySkill: string;
  experienceYears: number;
  efficiency: number; // in percentage (e.g. 98)
  defectRate: number; // in percentage (e.g. 1.5)
  targetOutput: number;
  totalOutput: number;
  totalDefect: number;
  assignedProcessNo?: number;
  assignedProcessName?: string;
  machineType?: string;
}

export interface ProcessItem {
  no: number;
  section: string;
  subSection?: string;
  process: string;
  machine: string;
  cycleTime: number; // in seconds
  smv: number;       // Standard Minute Value
  sam: number;       // Standard Allowed Minutes (e.g. smv * 1.15)
}

export interface StyleMetadata {
  buyer: string;
  style: string;
  workingHours: number; // 8 for Senin-Jumat, 5 for Sabtu
  workSchedule?: "senin_jumat" | "sabtu";
  targetPerManpowerPerDay: number;
  lineTargetPerHour: number;
  lineTargetPerDay: number;
  totalSMV: number;
  totalSAM: number;
  allowancePercentage: number; // e.g. 15%
  supervisor: string;
  qualityControl: string;
  sampleSpv: string;
  rndHead: string;
  sewingDate: string; // YYYY-MM-DD
  sewingDays: string; // e.g. "Senin - Sabtu (Hari 1)"
}

export interface MachineRequirement {
  machineType: string;
  displayName: string;
  totalSMV: number;
  totalSAM: number;
  processCount: number;
  theoreticalMachines: number;
  allocatedMachines: number;
  availableInFactory: number;
  shortageOrSurplus: number; // availableInFactory - allocatedMachines (negative means shortage)
  utilizationPercent: number;
  recommendedOperators: number;
}

export interface HourlyProductionRow {
  no: number;
  process: string;
  machine: string;
  section: string;
  operatorId: string;
  operatorName: string;
  operatorGrade: OperatorGrade;
  operatorAttendance: AttendanceStatus;
  targetPerHour: number;
  workingMinutes: number;
  akmOutput: number;
  akmStock: number;
  target: number;
  balanceTarget: number; // actual - target (+ or -)
  hourlyActual: number[]; // Index 0..8 represents Jam 1 to 9
  hourlyDefects: number[]; // Index 0..8 represents defects Jam 1 to 9
  totalActual: number;
  totalDefects: number;
  keterangan: string;
  status: "normal" | "warning" | "bottleneck" | "unassigned";
  // Double Job & Tandem support
  isDoubleJob?: boolean;
  doubleJobOriginStation?: number;
  doubleJobDetail?: string;
  combinedSMV?: number;
  isTandem?: boolean;
  tandemOperators?: string[];
}

export interface LineProductionData {
  lineId: LineNumber;
  supervisor: string;
  qcInspector: string;
  date: string;
  sewingDays: string;
  workingHours: number; // 8 (Senin-Jumat) or 5 (Sabtu)
  workSchedule?: "senin_jumat" | "sabtu";
  totalOperators: number;
  targetPerHour: number;
  targetPerDay: number;
  processes?: ProcessItem[];
  rows: HourlyProductionRow[];
}

export interface LayoutStation {
  stationNo: number;
  processNo: number;
  processName: string;
  section: string;
  machineType: string;
  cycleTimeSec: number;
  smv: number;
  sam: number;
  targetPerHour: number;
  assignedOperatorId?: string;
  assignedOperatorName?: string;
  operatorGrade?: OperatorGrade;
  operatorAttendance?: AttendanceStatus;
  status: "normal" | "warning" | "bottleneck" | "unassigned";
  workloadRatio: number; // cycleTime / taktTime ( > 1.0 = bottleneck )
  matchScore: number; // 0..100% skill match
  rowPosition?: "left" | "right" | "center";
  // Double Job & Tandem support
  isDoubleJob?: boolean;
  doubleJobOriginStation?: number;
  doubleJobOriginSMV?: number;
  doubleJobDetail?: string;
  combinedSMV?: number;
  isTandem?: boolean;
  tandemOperators?: string[];
  hasMachineShortage?: boolean;
}

export interface HourlyBottleneckSuggestion {
  stationNo: number;
  processName: string;
  section: string;
  machineType: string;
  currentActual: number;
  target: number;
  deficit: number;
  cause: "absent" | "high_smv" | "output_drop" | "high_defects" | "starvation";
  recommendationType: "double_job" | "tandem" | "helper" | "rebalance";
  title: string;
  description: string;
  suggestedAction: string;
  candidateOperatorName?: string;
  candidateStationNo?: number;
  candidateSMV?: number;
  expectedBenefit: string;
}

export interface LineBalancingResult {
  taktTimeSec: number;
  taktTimeMin: number;
  totalCycleTime: number;
  totalSAM: number;
  totalSMV: number;
  theoreticalStations: number;
  actualStations: number;
  lineEfficiency: number;       // %
  balanceEfficiency: number;    // % (Sum(SAM) / (Max(SAM) * N)) * 100
  balanceDelay: number;         // 100 - balanceEfficiency (%)
  totalIdleMinutes: number;
  capacityPerHour: number;
  bottleneckCount: number;
  unassignedCount: number;
  presentOperatorsCount: number;
  absentOperatorsCount: number;
}

export interface ParetoItem {
  category: string;
  count: number;
  percentage: number;
  cumulativePercentage: number;
}

export interface Fishbone6M {
  man: string[];
  machine: string[];
  method: string[];
  material: string[];
  measurement: string[];
  milieu: string[];
}

export interface FiveWhyItem {
  id: string;
  issue: string;
  line: LineNumber;
  stationOrProcess: string;
  why1: string;
  why2: string;
  why3: string;
  why4: string;
  why5: string;
  rootCause: string;
  correctiveAction: string;
  preventiveAction: string;
  pic: string;
  status: "Open" | "In Progress" | "Resolved";
}

export interface EngineeringRecommendation {
  id: string;
  lineId: LineNumber;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: "Man" | "Machine" | "Method" | "Balancing" | "Attendance";
  issue: string;
  rootCause: string;
  immediateAction: string;
  preventiveAction: string;
  estimatedImpact: string;
}

export type RecommendationItem = EngineeringRecommendation;

export interface LineBPData {
  lineId: LineNumber;
  metadata: StyleMetadata;
  processes: ProcessItem[];
  machineRequirements?: MachineRequirement[];
  uploadedAt?: string;
  uploadedBy?: string;
  fileName?: string;
}

export interface DailyReportLog {
  id: string;
  date: string; // YYYY-MM-DD
  lineId: LineNumber;
  buyer: string;
  style: string;
  targetPerDay: number;
  actualOutput: number;
  efficiency: number;
  defectsCount: number;
  defectRate: number;
  presentOperators: number;
  totalOperators: number;
  attendanceRate: number;
  bottleneckCount: number;
  notes: string;
  supervisor: string;
  qcInspector: string;
  submittedBy: string;
  submittedAt: string;
}

export interface GoogleScriptConfig {
  webAppUrl: string;
  sheetUrl?: string;
  autoSync: boolean;
  sheetNameHourlyPrefix?: string;
  lastSyncTime?: string;
  lastSyncStatus?: "success" | "error" | "idle";
  lastSyncMessage?: string;
}

export interface GoogleScriptSyncLog {
  id: string;
  timestamp: string;
  action: "SYNC_HOURLY" | "SYNC_ATTENDANCE" | "SYNC_DAILY" | "SYNC_ALL" | "TEST_PING" | "PULL_DATA";
  status: "success" | "error" | "pending";
  targetLine?: LineNumber;
  message: string;
  recordsCount?: number;
}


