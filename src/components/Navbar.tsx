import React, { useState } from "react";
import {
  Table,
  FileSpreadsheet,
  LayoutGrid,
  BarChart3,
  AlertTriangle,
  Layers,
  UserCheck,
  Shield,
  ChevronDown,
  Lock,
  Edit3,
  Printer,
  Users,
  Download,
  Calendar,
  KeyRound,
  LogIn,
  Sparkles,
  RotateCcw,
  Code2,
  LogOut,
} from "lucide-react";
import { VALID_LINES } from "../data/defaultData";
import { User, LineNumber } from "../types";
import { Logo } from "./Logo";

interface NavbarProps {
  activeTab: "hourly" | "attendance" | "excel" | "layout" | "pe-dashboard" | "daily";
  setActiveTab: (tab: "hourly" | "attendance" | "excel" | "layout" | "pe-dashboard" | "daily") => void;
  selectedLine: LineNumber;
  setSelectedLine: (line: LineNumber) => void;
  currentUser: User;
  users: User[];
  onSwitchUser: (user: User) => void;
  onOpenTargetAnalysis: () => void;
  onOpenEditUser: () => void;
  onOpenPrintReport: () => void;
  onExportExcel: () => void;
  onOpenLoginModal?: () => void;
  onLogout?: () => void;
  onOpenGoogleScript?: () => void;
  isGoogleScriptConnected?: boolean;
  onClearData?: () => void;
  buyerStyle: string;
  bottleneckCount: number;
  unassignedCount: number;
  attendancePresentCount: number;
  totalOperatorsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  selectedLine,
  setSelectedLine,
  currentUser,
  users,
  onSwitchUser,
  onOpenTargetAnalysis,
  onOpenEditUser,
  onOpenPrintReport,
  onExportExcel,
  onOpenLoginModal,
  onLogout,
  onOpenGoogleScript,
  isGoogleScriptConnected = false,
  onClearData,
  buyerStyle,
  bottleneckCount,
  unassignedCount,
  attendancePresentCount,
  totalOperatorsCount,
}) => {
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const isProductionEngineer = currentUser.role === "production_engineer";

  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Precision Accent Stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-blue-700 via-indigo-600 to-red-600" />

      {/* Main Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 border-b border-slate-100">
          {/* Brand Logo & Style Info */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <Logo size="md" />
            <div className="hidden md:block border-l border-slate-200 pl-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                Style & Dokumen Standar
              </span>
              <span className="text-xs font-mono font-semibold text-slate-800 truncate max-w-[200px] block">
                {buyerStyle || "SOGO BLAZER SPG-01"} &bull; F-SEW-005-00
              </span>
            </div>
          </div>

          {/* Quick Actions & Role Switcher */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Google Sheets & Apps Script Integration Button */}
            {onOpenGoogleScript && (
              <button
                id="btn-google-script-nav"
                onClick={onOpenGoogleScript}
                className={`inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                  isGoogleScriptConnected
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-xs"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300"
                }`}
                title="Integrasi Google Spreadsheet & Google Apps Script (Web App Webhook)"
              >
                <FileSpreadsheet className={`w-3.5 h-3.5 ${isGoogleScriptConnected ? "text-white" : "text-emerald-600"}`} />
                <span className="hidden sm:inline">Google Script</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isGoogleScriptConnected ? "bg-white animate-pulse" : "bg-emerald-400"
                  }`}
                  title={isGoogleScriptConnected ? "Tersambung ke Google Spreadsheet" : "Konfigurasi Google Apps Script"}
                />
              </button>
            )}

            {/* Export Excel Button */}
            <button
              id="btn-export-excel-nav"
              onClick={onExportExcel}
              className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
              title="Export Data Produksi & Layout ke Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>

            {/* Print PDF Report Button */}
            <button
              id="btn-open-print-pdf-nav"
              onClick={onOpenPrintReport}
              className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition-all border border-red-200"
              title="Generate PDF / Print Report Komprehensif (Breakdown, Attendance, Layout, Pareto, Root Cause)"
            >
              <Printer className="w-3.5 h-3.5 text-red-600" />
              <span className="hidden sm:inline">PDF Report</span>
            </button>

            {/* Login & Security Button */}
            {onOpenLoginModal && (
              <button
                id="btn-open-login-modal"
                onClick={onOpenLoginModal}
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs"
                title="Login & Sekuritas Admin Line (Kata Sandi Per Line)"
              >
                <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Sekuritas / Login</span>
              </button>
            )}

            {/* Clear Data Button */}
            {onClearData && (
              <button
                id="btn-clear-data-nav"
                onClick={onClearData}
                className="inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200"
                title="Kosongkan seluruh data jam yang terinput"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Kosongkan Data</span>
              </button>
            )}

            {/* Target & Bottleneck Diagnostic Bar with Gemini Star Icon */}
            <button
              id="btn-open-analysis"
              onClick={onOpenTargetAnalysis}
              className={`inline-flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                bottleneckCount > 0 || unassignedCount > 0
                  ? "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
              }`}
              title="Diagnostik Target & Deteksi Bottleneck"
            >
              <Sparkles
                className={`w-3.5 h-3.5 ${
                  bottleneckCount > 0 || unassignedCount > 0
                    ? "text-amber-500 fill-amber-400"
                    : "text-slate-500"
                }`}
              />
              <span className="hidden sm:inline">Diagnostik Target</span>
              {(bottleneckCount > 0 || unassignedCount > 0) && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-extrabold">
                  {bottleneckCount + unassignedCount}
                </span>
              )}
            </button>

            {/* RBAC USER ACCOUNT SWITCHER DROPDOWN */}
            <div className="relative">
              <button
                id="btn-user-switcher"
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center space-x-2 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
                title="Ganti akun: Production Engineer atau Admin Line"
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                    isProductionEngineer ? "bg-blue-600" : "bg-red-600"
                  }`}
                >
                  {isProductionEngineer ? (
                    <Shield className="w-3.5 h-3.5" />
                  ) : (
                    <span className="font-mono text-[11px]">L{currentUser.assignedLine}</span>
                  )}
                </div>

                <div className="text-left hidden lg:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {isProductionEngineer ? (
                      <span className="text-blue-700 font-semibold">PE Head (Semua Line)</span>
                    ) : (
                      <span className="text-red-700 font-semibold">Admin Line {currentUser.assignedLine}</span>
                    )}
                  </div>
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
              </button>

              {/* User Switcher Dropdown Menu */}
              {isUserDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in duration-150">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Hak Akses Pengguna (RBAC)
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Admin Line hanya mengelola line sendiri. PE dapat mengakses seluruh 6 line dan master data.
                    </p>
                  </div>

                  <div className="py-1 space-y-1 max-h-64 overflow-y-auto">
                    {users.map((u) => {
                      const isSelected = u.id === currentUser.id;
                      const isEng = u.role === "production_engineer";
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            onSwitchUser(u);
                            setIsUserDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                            isSelected
                              ? isEng
                                ? "bg-blue-50 text-blue-900 font-bold border border-blue-200"
                                : "bg-red-50 text-red-900 font-bold border border-red-200"
                              : "hover:bg-slate-50 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                                isEng ? "bg-blue-600" : "bg-red-600"
                              }`}
                            >
                              {isEng ? "PE" : `L${u.assignedLine}`}
                            </div>
                            <div>
                              <div className="font-semibold">{u.name}</div>
                              <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                                {u.title}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <span
                              className={`w-2 h-2 rounded-full ${
                                isEng ? "bg-blue-600" : "bg-red-600"
                              }`}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-slate-100">
                    <button
                      id="btn-edit-account-name"
                      onClick={() => {
                        setIsUserDropdownOpen(false);
                        onOpenEditUser();
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-blue-700 hover:bg-blue-50 flex items-center space-x-2 transition-colors border border-blue-100"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Ubah Profil Akun</span>
                    </button>

                    {onLogout && (
                      <button
                        id="btn-logout-screen"
                        onClick={() => {
                          setIsUserDropdownOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center space-x-2 transition-colors border border-rose-200 mt-1.5"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-600" />
                        <span>Keluar / Ganti Akun</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs & Active Line Switcher */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between py-2 gap-2">
          {/* Main Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none text-xs font-semibold">
            {/* Hourly Control Sheet */}
            <button
              id="tab-hourly"
              onClick={() => setActiveTab("hourly")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "hourly"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Hourly Control (F-SEW-005)</span>
            </button>

            {/* Attendance & Skill Matrix Tab */}
            <button
              id="tab-attendance"
              onClick={() => setActiveTab("attendance")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap relative ${
                activeTab === "attendance"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Attendance & Grading (Maks 26 Op)</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                {attendancePresentCount}/{totalOperatorsCount}
              </span>
            </button>

            {/* Excel Breakdown & Tool Requirement */}
            <button
              id="tab-excel"
              onClick={() => setActiveTab("excel")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "excel"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Breakdown & Kebutuhan Mesin</span>
            </button>

            {/* Machine Layout Visualizer (Current vs Recommended) */}
            <button
              id="tab-layout"
              onClick={() => setActiveTab("layout")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "layout"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-red-500" />
              <span>Visualisasi & Rekomendasi Layout</span>
            </button>

            {/* Daily Report Sheet & Monthly Archive */}
            <button
              id="tab-daily"
              onClick={() => setActiveTab("daily")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "daily"
                  ? "bg-blue-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              <span>Laporan Harian (Sep 2026)</span>
            </button>

            {/* PE Engineering Dashboard */}
            <button
              id="tab-pe-dashboard"
              onClick={() => setActiveTab("pe-dashboard")}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
                activeTab === "pe-dashboard"
                  ? "bg-indigo-600 text-white shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
              <span>Dasbor PE (Pareto, 6M, 5-Why)</span>
            </button>
          </nav>

          {/* Line Selector: 1, 3, 4, 5, 6, 7 (Role-gated) */}
          <div className="flex items-center space-x-1.5 self-end sm:self-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider px-1.5">
              Line:
            </span>
            {VALID_LINES.map((lineNum) => {
              const isSelected = selectedLine === lineNum;
              const isLineDisabled =
                !isProductionEngineer && currentUser.assignedLine !== lineNum;

              return (
                <button
                  key={lineNum}
                  id={`btn-line-${lineNum}`}
                  disabled={isLineDisabled}
                  onClick={() => {
                    if (!isLineDisabled) {
                      setSelectedLine(lineNum);
                    }
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center relative ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-xs ring-1 ring-blue-700 font-extrabold"
                      : isLineDisabled
                      ? "text-slate-300 cursor-not-allowed opacity-40"
                      : "text-slate-700 hover:text-blue-700 hover:bg-white"
                  }`}
                  title={
                    isLineDisabled
                      ? `Terkunci: Anda adalah Admin Line ${currentUser.assignedLine}`
                      : `Pilih Sewing Line ${lineNum}`
                  }
                >
                  {lineNum}
                  {isLineDisabled && (
                    <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-slate-400" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
