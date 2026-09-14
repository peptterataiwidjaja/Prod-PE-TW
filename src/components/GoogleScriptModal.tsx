import React, { useState } from "react";
import {
  FileSpreadsheet,
  Code2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Send,
  Sliders,
  History,
  X,
  Sparkles,
  Layers,
  Users,
  Calendar,
  HelpCircle,
} from "lucide-react";
import {
  GoogleScriptConfig,
  GoogleScriptSyncLog,
  LineNumber,
  HourlyProductionRow,
  StyleMetadata,
  Operator,
  DailyReportLog,
} from "../types";
import {
  getGoogleAppsScriptTemplate,
  pingGoogleScript,
  syncHourlyToGoogleScript,
  syncAttendanceToGoogleScript,
  syncDailyToGoogleScript,
} from "../utils/googleScriptService";

interface GoogleScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GoogleScriptConfig;
  onSaveConfig: (newConfig: GoogleScriptConfig) => void;
  syncLogs: GoogleScriptSyncLog[];
  onAddSyncLog: (log: GoogleScriptSyncLog) => void;
  onClearSyncLogs: () => void;
  currentLine: LineNumber;
  activeMetadata: StyleMetadata;
  currentLineRows: HourlyProductionRow[];
  currentOperators: Operator[];
  dailyLogs: DailyReportLog[];
}

export const GoogleScriptModal: React.FC<GoogleScriptModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  syncLogs,
  onAddSyncLog,
  onClearSyncLogs,
  currentLine,
  activeMetadata,
  currentLineRows,
  currentOperators,
  dailyLogs,
}) => {
  const [activeTab, setActiveTab] = useState<"connect" | "code" | "history">("connect");
  const [webAppUrl, setWebAppUrl] = useState(config.webAppUrl || "");
  const [sheetUrl, setSheetUrl] = useState(config.sheetUrl || "");
  const [autoSync, setAutoSync] = useState(config.autoSync || false);

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: "none" | "success" | "error";
    message: string;
  }>({ status: "none", message: "" });

  const [isSyncingHourly, setIsSyncingHourly] = useState(false);
  const [isSyncingAttendance, setIsSyncingAttendance] = useState(false);
  const [isSyncingDaily, setIsSyncingDaily] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const scriptCode = getGoogleAppsScriptTemplate();

  const handleSaveSettings = () => {
    const updated: GoogleScriptConfig = {
      ...config,
      webAppUrl: webAppUrl.trim(),
      sheetUrl: sheetUrl.trim(),
      autoSync,
    };
    onSaveConfig(updated);
    setTestResult({
      status: "success",
      message: "Pengaturan koneksi Google Script berhasil disimpan!",
    });
  };

  const handleTestConnection = async () => {
    if (!webAppUrl.trim()) {
      setTestResult({
        status: "error",
        message: "Masukkan URL Aplikasi Web Google Apps Script terlebih dahulu.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult({ status: "none", message: "" });

    try {
      const res = await pingGoogleScript(webAppUrl.trim());
      if (res.success) {
        setTestResult({
          status: "success",
          message: res.message || "Koneksi berhasil! Google Apps Script siap menerima data.",
        });
        onAddSyncLog({
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString("id-ID"),
          action: "TEST_PING",
          status: "success",
          message: "Uji koneksi Google Script sukses",
        });
      } else {
        setTestResult({
          status: "error",
          message: res.message || "Gagal menghubungkan ke Google Apps Script.",
        });
        onAddSyncLog({
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString("id-ID"),
          action: "TEST_PING",
          status: "error",
          message: res.message || "Uji koneksi gagal",
        });
      }
    } catch (err: any) {
      setTestResult({
        status: "error",
        message: err.message || "Terjadi kesalahan saat menguji koneksi.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(scriptCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch {
      // fallback
      const textArea = document.createElement("textarea");
      textArea.value = scriptCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    }
  };

  const handleSyncHourly = async () => {
    if (!webAppUrl.trim()) {
      alert("Harap atur dan simpan URL Google Apps Script terlebih dahulu.");
      return;
    }

    setIsSyncingHourly(true);
    try {
      const res = await syncHourlyToGoogleScript(
        { ...config, webAppUrl: webAppUrl.trim() },
        currentLine,
        activeMetadata,
        currentLineRows
      );

      if (res.success) {
        onAddSyncLog({
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString("id-ID"),
          action: "SYNC_HOURLY",
          status: "success",
          targetLine: currentLine,
          recordsCount: currentLineRows.length,
          message: res.message,
        });
        setTestResult({
          status: "success",
          message: `Berhasil kirim data jam-jaman Line ${currentLine} (${currentLineRows.length} proses) ke tab HOURLY_L${currentLine}!`,
        });
      } else {
        onAddSyncLog({
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString("id-ID"),
          action: "SYNC_HOURLY",
          status: "error",
          targetLine: currentLine,
          message: res.message,
        });
        setTestResult({
          status: "error",
          message: res.message,
        });
      }
    } finally {
      setIsSyncingHourly(false);
    }
  };

  const handleSyncAttendance = async () => {
    if (!webAppUrl.trim()) {
      alert("Harap atur dan simpan URL Google Apps Script terlebih dahulu.");
      return;
    }

    setIsSyncingAttendance(true);
    try {
      const res = await syncAttendanceToGoogleScript(
        { ...config, webAppUrl: webAppUrl.trim() },
        currentLine,
        currentOperators
      );

      if (res.success) {
        onAddSyncLog({
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString("id-ID"),
          action: "SYNC_ATTENDANCE",
          status: "success",
          targetLine: currentLine,
          recordsCount: currentOperators.length,
          message: res.message,
        });
        setTestResult({
          status: "success",
          message: `Berhasil kirim data absensi ${currentOperators.length} operator Line ${currentLine} ke tab ATTENDANCE!`,
        });
      } else {
        onAddSyncLog({
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString("id-ID"),
          action: "SYNC_ATTENDANCE",
          status: "error",
          targetLine: currentLine,
          message: res.message,
        });
        setTestResult({
          status: "error",
          message: res.message,
        });
      }
    } finally {
      setIsSyncingAttendance(false);
    }
  };

  const handleSyncDaily = async () => {
    if (!webAppUrl.trim()) {
      alert("Harap atur dan simpan URL Google Apps Script terlebih dahulu.");
      return;
    }

    const latestLog = dailyLogs.find((l) => l.lineId === currentLine) || dailyLogs[0];
    if (!latestLog) {
      alert("Belum ada data laporan harian yang tersimpan.");
      return;
    }

    setIsSyncingDaily(true);
    try {
      const res = await syncDailyToGoogleScript(
        { ...config, webAppUrl: webAppUrl.trim() },
        latestLog
      );

      if (res.success) {
        onAddSyncLog({
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString("id-ID"),
          action: "SYNC_DAILY",
          status: "success",
          targetLine: latestLog.lineId,
          message: res.message,
        });
        setTestResult({
          status: "success",
          message: `Berhasil kirim rekap harian Line ${latestLog.lineId} (${latestLog.date}) ke tab DAILY_SUMMARY!`,
        });
      } else {
        onAddSyncLog({
          id: String(Date.now()),
          timestamp: new Date().toLocaleTimeString("id-ID"),
          action: "SYNC_DAILY",
          status: "error",
          targetLine: latestLog.lineId,
          message: res.message,
        });
        setTestResult({
          status: "error",
          message: res.message,
        });
      }
    } finally {
      setIsSyncingDaily(false);
    }
  };

  const isConnected = !!config.webAppUrl && config.lastSyncStatus !== "error";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full my-8 overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base sm:text-lg font-bold">
                  Koneksi Google Spreadsheet & Apps Script
                </h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isConnected
                      ? "bg-emerald-400/20 text-emerald-200 border-emerald-400/30"
                      : "bg-amber-400/20 text-amber-200 border-amber-400/30"
                  }`}
                >
                  {isConnected ? "Tersambung" : "Belum Tersambung"}
                </span>
              </div>
              <p className="text-xs text-emerald-100/80 mt-0.5">
                Kirim data kontrol per jam F-SEW-005, absensi operator & rekap harian langsung ke Google Spreadsheet via Google Apps Script (Web App Webhook).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-3 gap-2 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("connect")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors border-t border-x -mb-px ${
              activeTab === "connect"
                ? "bg-white text-emerald-700 border-slate-200 border-b-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sliders className="w-4 h-4 text-emerald-600" />
            <span>Koneksi & Sinkronisasi Data</span>
          </button>

          <button
            onClick={() => setActiveTab("code")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors border-t border-x -mb-px ${
              activeTab === "code"
                ? "bg-white text-emerald-700 border-slate-200 border-b-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <Code2 className="w-4 h-4 text-blue-600" />
            <span>Kode Script Google Apps Script (Code.gs)</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-colors border-t border-x -mb-px ${
              activeTab === "history"
                ? "bg-white text-emerald-700 border-slate-200 border-b-white"
                : "border-transparent text-slate-600 hover:text-slate-900"
            }`}
          >
            <History className="w-4 h-4 text-slate-600" />
            <span>Riwayat Sinkronisasi</span>
            {syncLogs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
                {syncLogs.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-800 space-y-6">
          {/* TAB 1: KONEKSI & SINKRONISASI */}
          {activeTab === "connect" && (
            <div className="space-y-6">
              {/* Feedback Alert */}
              {testResult.message && (
                <div
                  className={`p-3.5 rounded-xl border flex items-start space-x-3 text-xs ${
                    testResult.status === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-red-50 border-red-200 text-red-900"
                  }`}
                >
                  {testResult.status === "success" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{testResult.message}</p>
                  </div>
                </div>
              )}

              {/* Form Input URL */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <span>Konfigurasi Google Apps Script Web App</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab("code")}
                    className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center space-x-1"
                  >
                    <span>Belum pasang script? Lihat Kode</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Aplikasi Web Google Apps Script (Web App URL) *
                  </label>
                  <input
                    type="url"
                    value={webAppUrl}
                    onChange={(e) => setWebAppUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Diperoleh setelah klik menu <strong>Terapkan (Deploy) &gt; Penerapan baru &gt; Aplikasi Web</strong> di Apps Script Google Spreadsheet Anda (akses harus diatur: <em>Siapa Saja / Anyone</em>).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    URL Google Spreadsheet Anda (Opsional, untuk jalan pintas buka sheet)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="url"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/1abc.../edit"
                      className="flex-1 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-slate-800"
                    />
                    {sheetUrl && (
                      <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center space-x-1 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Sheet</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoSync}
                      onChange={(e) => setAutoSync(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Auto-Sync otomatis saat output per jam / absensi diubah
                    </span>
                  </label>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center space-x-1.5 transition-colors border border-slate-300 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin" : ""}`} />
                      <span>{isTesting ? "Menguji..." : "Uji Koneksi (Test Ping)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveSettings}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 transition-colors shadow-xs"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Simpan Pengaturan</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Kirim Data Langsung */}
              <div className="border border-slate-200 rounded-2xl p-4.5 space-y-3 bg-white">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                  <Send className="w-4 h-4 text-blue-600" />
                  <span>Kirim Data ke Google Spreadsheet Sekarang</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Pilih data yang ingin Anda kirimkan ke Google Spreadsheet. Google Script akan secara otomatis membuat tab baru yang sesuai dan merapikan format kolom jika belum ada.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  {/* Kirim Jam-Jaman Line Aktif */}
                  <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center space-x-1.5 text-blue-900 font-bold text-xs">
                        <Layers className="w-3.5 h-3.5 text-blue-600" />
                        <span>Kontrol Jam Line {currentLine}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Form F-SEW-005-00 ({currentLineRows.length} proses, Jam 1-8). Ditulis ke tab <code>HOURLY_L{currentLine}</code>.
                      </p>
                    </div>
                    <button
                      onClick={handleSyncHourly}
                      disabled={isSyncingHourly}
                      className="w-full py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 ${isSyncingHourly ? "animate-pulse" : ""}`} />
                      <span>{isSyncingHourly ? "Mengirim..." : `Kirim Line ${currentLine}`}</span>
                    </button>
                  </div>

                  {/* Kirim Absensi Operator */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center space-x-1.5 text-emerald-900 font-bold text-xs">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Absensi & Grading Op</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Status {currentOperators.length} operator (Hadir, Sakit, Izin, Grade, Efisiensi). Ditulis ke tab <code>ATTENDANCE</code>.
                      </p>
                    </div>
                    <button
                      onClick={handleSyncAttendance}
                      disabled={isSyncingAttendance}
                      className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 ${isSyncingAttendance ? "animate-pulse" : ""}`} />
                      <span>{isSyncingAttendance ? "Mengirim..." : "Kirim Absensi"}</span>
                    </button>
                  </div>

                  {/* Kirim Rekap Harian */}
                  <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>Rekap Harian Produksi</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">
                        Ringkasan target harian, output riil, efisiensi & defect rate. Ditulis ke tab <code>DAILY_SUMMARY</code>.
                      </p>
                    </div>
                    <button
                      onClick={handleSyncDaily}
                      disabled={isSyncingDaily}
                      className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
                    >
                      <Send className={`w-3.5 h-3.5 ${isSyncingDaily ? "animate-pulse" : ""}`} />
                      <span>{isSyncingDaily ? "Mengirim..." : "Kirim Rekap"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KODE SCRIPT GOOGLE APPS SCRIPT (Code.gs) */}
          {activeTab === "code" && (
            <div className="space-y-6">
              {/* Panduan Langkah demi Langkah */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4.5 space-y-3">
                <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4 text-blue-600" />
                  <span>Panduan Memasang Google Apps Script (Hanya 1 Kali Setting)</span>
                </div>
                <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Buka Google Spreadsheet baru di browser Anda melalui <a href="https://sheets.new" target="_blank" rel="noreferrer" className="text-blue-700 underline font-semibold">sheets.new</a> atau Google Drive.
                  </li>
                  <li>
                    Di Google Spreadsheet, klik menu <strong>Ekstensi (Extensions) &gt; Apps Script</strong>.
                  </li>
                  <li>
                    Hapus kode bawaan di tab <code>Code.gs</code>, lalu klik tombol hijau <strong>"Salin Seluruh Kode Script"</strong> di bawah ini dan tempelkan (Ctrl+V) ke editor Apps Script.
                  </li>
                  <li>
                    Simpan proyek (tekan <strong>Ctrl+S</strong> atau klik ikon Disket).
                  </li>
                  <li>
                    Klik tombol biru <strong>Terapkan (Deploy) &gt; Penerapan baru (New deployment)</strong> di pojok kanan atas.
                  </li>
                  <li>
                    Pilih jenis roda gigi: <strong>Aplikasi Web (Web app)</strong>.
                  </li>
                  <li>
                    Isikan pengaturan berikut:
                    <ul className="list-disc list-inside pl-5 mt-1 text-slate-800 font-medium">
                      <li>Jalankan sebagai (Execute as): <strong>Saya (email Anda)</strong></li>
                      <li>Yang memiliki akses (Who has access): <strong>Siapa saja (Anyone)</strong> &larr; <em>Sangat penting agar aplikasi web dapat mengirim data!</em></li>
                    </ul>
                  </li>
                  <li>
                    Klik <strong>Terapkan (Deploy)</strong>, berikan izin Google (Authorize access) jika muncul, lalu <strong>salin URL Aplikasi Web</strong> (akhiran <code>/exec</code>) dan tempel di Tab <em>Koneksi &amp; Sinkronisasi</em>.
                  </li>
                </ol>
              </div>

              {/* Header Kode & Tombol Salin */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-blue-600" />
                    <span>Kode Lengkap Google Apps Script (Code.gs)</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    Otomatis membuat tab &amp; format kolom HOURLY_L1..L7, ATTENDANCE, dan DAILY_SUMMARY.
                  </span>
                </div>

                <button
                  onClick={handleCopyScript}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all shadow-xs ${
                    copiedCode
                      ? "bg-emerald-600 text-white"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Seluruh Kode Script</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Display Area */}
              <div className="relative rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden text-slate-200">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  <span>Code.gs &bull; Google Apps Script V8 Engine</span>
                  <span>Siap Pakai</span>
                </div>
                <pre className="p-4 text-xs font-mono overflow-x-auto max-h-96 leading-relaxed select-all">
                  <code>{scriptCode}</code>
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: RIWAYAT SINKRONISASI */}
          {activeTab === "history" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                    <History className="w-4 h-4 text-slate-600" />
                    <span>Log Aktivitas Sinkronisasi Google Script</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Catatan pengiriman data jam-jaman, absensi, dan pengujian koneksi.
                  </p>
                </div>

                {syncLogs.length > 0 && (
                  <button
                    onClick={onClearSyncLogs}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 px-2.5 py-1 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Bersihkan Riwayat
                  </button>
                )}
              </div>

              {syncLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-700">Belum Ada Riwayat Sinkronisasi</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Data yang Anda kirim ke Google Spreadsheet atau hasil uji koneksi akan dicatat di sini.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Waktu</th>
                        <th className="py-2.5 px-3">Aksi</th>
                        <th className="py-2.5 px-3">Target</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Keterangan / Hasil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {syncLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {log.timestamp}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800">
                            {log.action}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {log.targetLine ? `Line ${log.targetLine}` : "-"}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.status === "success"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {log.status === "success" ? "SUKSES" : "GAGAL"}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans text-slate-700 max-w-xs truncate" title={log.message}>
                            {log.message}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 px-6 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center space-x-2 text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <span className="font-medium">
              {isConnected
                ? "Apps Script Siap Sinkronisasi"
                : "Belum Dikonfigurasi (Masukkan URL Web App)"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
