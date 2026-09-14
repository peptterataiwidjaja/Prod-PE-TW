/**
 * Google Apps Script & Google Spreadsheet Integration Utility
 * 
 * Provides:
 * 1. Payload formatters for Hourly Production (F-SEW-005-00), Attendance, and Daily Reports
 * 2. API synchronization via backend proxy /api/google-script-sync
 * 3. Complete, ready-to-copy Google Apps Script (Code.gs) source code
 */

import {
  HourlyProductionRow,
  StyleMetadata,
  Operator,
  LineNumber,
  DailyReportLog,
  GoogleScriptConfig,
  GoogleScriptSyncLog,
} from "../types";

export const DEFAULT_GOOGLE_SCRIPT_CONFIG: GoogleScriptConfig = {
  webAppUrl: "",
  sheetUrl: "",
  autoSync: false,
  sheetNameHourlyPrefix: "HOURLY_L",
  lastSyncStatus: "idle",
};

/**
 * Generates the complete Google Apps Script code to paste into Google Sheets > Extensions > Apps Script
 */
export function getGoogleAppsScriptTemplate(): string {
  return `/**
 * ==============================================================================
 * SISTEM INTEGRASI GOOGLE SPREADSHEET & APPS SCRIPT
 * Sewing Production Engineering Monitoring & Operator Grading System
 * Form: F-SEW-005-00 & F-IE-008-00 (Line 1, 3, 4, 5, 6, 7)
 * ==============================================================================
 * 
 * CARA MEMASANG:
 * 1. Buat Google Spreadsheet baru di Google Drive Anda.
 * 2. Buka menu: Ekstensi (Extensions) > Apps Script.
 * 3. Hapus semua kode default, lalu PASTE SELURUH KODE INI ke dalam file Code.gs.
 * 4. Simpan proyek (ikon disket / Ctrl+S) dengan nama "Sewing Production Webhook".
 * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas > "Kelola penerapan" atau "Penerapan baru" (New deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web app).
 * 7. Isi:
 *    - Deskripsi: Integrasi Produksi Sewing
 *    - Jalankan sebagai (Execute as): Saya (email Anda)
 *    - Yang memiliki akses (Who has access): Siapa saja (Anyone)  <-- PENTING!
 * 8. Klik "Terapkan" (Deploy), berikan izin Google jika diminta.
 * 9. Salin URL Aplikasi Web (akhiran /exec) dan tempelkan di aplikasi Sewing Control!
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : "PING";
  
  if (action === "PING") {
    return createJsonResponse({
      status: "success",
      message: "Google Apps Script Web App aktif dan siap menerima data produksi sewing.",
      timestamp: new Date().toISOString(),
      spreadsheetName: SpreadsheetApp.getActiveSpreadsheet().getName()
    });
  }
  
  if (action === "GET_SUMMARY") {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("DAILY_SUMMARY");
    var data = sheet ? sheet.getDataRange().getValues() : [];
    return createJsonResponse({
      status: "success",
      data: data
    });
  }

  return createJsonResponse({
    status: "success",
    message: "Endpoint aktif.",
    availableActions: ["PING", "GET_SUMMARY"]
  });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return createJsonResponse({
        status: "error",
        message: "Data POST kosong atau tidak valid."
      });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || "SYNC_HOURLY";
    var data = payload.payload || {};
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === "SYNC_HOURLY") {
      return handleSyncHourly(ss, data);
    } else if (action === "SYNC_ATTENDANCE") {
      return handleSyncAttendance(ss, data);
    } else if (action === "SYNC_DAILY") {
      return handleSyncDaily(ss, data);
    } else if (action === "SYNC_ALL") {
      return handleSyncAll(ss, data);
    }

    return createJsonResponse({
      status: "error",
      message: "Aksi '" + action + "' tidak dikenali."
    });
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Terjadi kesalahan di Google Script: " + err.toString()
    });
  }
}

// 1. Simpan Kontrol Jam-Jaman (F-SEW-005-00)
function handleSyncHourly(ss, data) {
  var lineId = data.lineId || 1;
  var sheetName = "HOURLY_L" + lineId;
  var sheet = getOrCreateSheet(ss, sheetName, [
    "Tanggal", "Jam Input", "Line", "Buyer", "Style", "Target/Jam",
    "No", "Nama Proses", "Mesin", "Nama Operator", "Grade", "Status Absen",
    "Target", "Jam 1", "Jam 2", "Jam 3", "Jam 4", "Jam 5", "Jam 6", "Jam 7", "Jam 8",
    "Total Aktual", "Total Defect", "Balance Target", "Status", "Keterangan"
  ], "#1e40af"); // Navy Blue Header

  var date = data.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  var time = Utilities.formatDate(new Date(), "GMT+7", "HH:mm:ss");
  var rows = data.rows || [];
  var metadata = data.metadata || {};

  var newRows = [];
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var hourly = r.hourlyActual || [0,0,0,0,0,0,0,0];
    newRows.push([
      date,
      time,
      "Line " + lineId,
      metadata.buyer || "-",
      metadata.style || "-",
      r.targetPerHour || metadata.lineTargetPerHour || 0,
      r.no,
      r.process,
      r.machine,
      r.operatorName || "BELUM DITUGASKAN",
      r.operatorGrade || "-",
      r.operatorAttendance || "-",
      r.target || 0,
      hourly[0] || 0,
      hourly[1] || 0,
      hourly[2] || 0,
      hourly[3] || 0,
      hourly[4] || 0,
      hourly[5] || 0,
      hourly[6] || 0,
      hourly[7] || 0,
      r.totalActual || 0,
      r.totalDefects || 0,
      r.balanceTarget || 0,
      r.status || "normal",
      r.keterangan || ""
    ]);
  }

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  return createJsonResponse({
    status: "success",
    message: "Berhasil menyimpan " + newRows.length + " baris data jam-jaman ke tab " + sheetName,
    sheetName: sheetName,
    rowsSaved: newRows.length,
    timestamp: new Date().toISOString()
  });
}

// 2. Simpan Data Absensi Operator
function handleSyncAttendance(ss, data) {
  var sheetName = "ATTENDANCE";
  var sheet = getOrCreateSheet(ss, sheetName, [
    "Tanggal", "Jam Update", "Line", "NIK", "Nama Operator",
    "Status Kehadiran", "Grade", "Skill Utama", "Efisiensi %", "Defect Rate %",
    "Target Harian", "Catatan"
  ], "#047857"); // Emerald Green Header

  var date = data.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  var time = Utilities.formatDate(new Date(), "GMT+7", "HH:mm:ss");
  var operators = data.operators || [];

  var newRows = [];
  for (var i = 0; i < operators.length; i++) {
    var op = operators[i];
    newRows.push([
      date,
      time,
      "Line " + (op.line || data.lineId || "-"),
      op.nik || "-",
      op.name,
      op.attendanceStatus,
      op.grade,
      op.primarySkill || "-",
      op.efficiency || 0,
      op.defectRate || 0,
      op.targetOutput || 0,
      op.attendanceNotes || ""
    ]);
  }

  if (newRows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, newRows[0].length).setValues(newRows);
  }

  return createJsonResponse({
    status: "success",
    message: "Berhasil menyimpan " + newRows.length + " data kehadiran operator ke tab " + sheetName,
    rowsSaved: newRows.length
  });
}

// 3. Simpan Laporan Rekap Harian
function handleSyncDaily(ss, data) {
  var sheetName = "DAILY_SUMMARY";
  var sheet = getOrCreateSheet(ss, sheetName, [
    "Tanggal", "Jam Submit", "Line", "Buyer", "Style",
    "Target Harian (Pcs)", "Output Aktual (Pcs)", "Efisiensi (%)",
    "Total Defect (Pcs)", "Defect Rate (%)", "Operator Hadir", "Total Operator",
    "Attendance Rate (%)", "Bottleneck Count", "Supervisor", "QC Inspector", "Catatan"
  ], "#b91c1c"); // Red Header

  var log = data.log || {};
  var row = [
    log.date || Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"),
    Utilities.formatDate(new Date(), "GMT+7", "HH:mm:ss"),
    "Line " + (log.lineId || "-"),
    log.buyer || "-",
    log.style || "-",
    log.targetPerDay || 0,
    log.actualOutput || 0,
    log.efficiency || 0,
    log.defectsCount || 0,
    log.defectRate || 0,
    log.presentOperators || 0,
    log.totalOperators || 0,
    log.attendanceRate || 0,
    log.bottleneckCount || 0,
    log.supervisor || "-",
    log.qcInspector || "-",
    log.notes || ""
  ];

  sheet.appendRow(row);

  return createJsonResponse({
    status: "success",
    message: "Berhasil mencatat rekap harian Line " + log.lineId + " ke tab " + sheetName
  });
}

// Helper: Cari atau Buat Sheet dengan Header Otomatis
function getOrCreateSheet(ss, sheetName, headers, headerColor) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    var range = sheet.getRange(1, 1, 1, headers.length);
    range.setBackground(headerColor || "#334155");
    range.setFontColor("#ffffff");
    range.setFontWeight("bold");
    range.setHorizontalAlignment("center");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Helper: Response JSON
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
}

/**
 * Send Hourly Production rows to Google Apps Script Web App
 */
export async function syncHourlyToGoogleScript(
  config: GoogleScriptConfig,
  lineId: LineNumber,
  metadata: StyleMetadata,
  rows: HourlyProductionRow[],
  dateStr?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!config.webAppUrl || !config.webAppUrl.trim().startsWith("http")) {
    return {
      success: false,
      message: "URL Google Apps Script Web App belum diatur. Silakan buka menu 'Google Sheets & Script'.",
    };
  }

  const payload = {
    lineId,
    date: dateStr || metadata.sewingDate || new Date().toISOString().substring(0, 10),
    metadata: {
      buyer: metadata.buyer,
      style: metadata.style,
      lineTargetPerHour: metadata.lineTargetPerHour,
      lineTargetPerDay: metadata.lineTargetPerDay,
      workingHours: metadata.workingHours,
    },
    rows: rows.map((r) => ({
      no: r.no,
      process: r.process,
      machine: r.machine,
      operatorName: r.operatorName,
      operatorGrade: r.operatorGrade,
      operatorAttendance: r.operatorAttendance,
      targetPerHour: r.targetPerHour,
      target: r.target,
      hourlyActual: r.hourlyActual,
      totalActual: r.totalActual,
      totalDefects: r.totalDefects,
      balanceTarget: r.balanceTarget,
      status: r.status,
      keterangan: r.keterangan,
    })),
  };

  return executeSyncRequest(config.webAppUrl, "SYNC_HOURLY", payload);
}

/**
 * Send Attendance to Google Apps Script Web App
 */
export async function syncAttendanceToGoogleScript(
  config: GoogleScriptConfig,
  lineId: LineNumber,
  operators: Operator[],
  dateStr?: string
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!config.webAppUrl || !config.webAppUrl.trim().startsWith("http")) {
    return {
      success: false,
      message: "URL Google Apps Script Web App belum diatur.",
    };
  }

  const payload = {
    lineId,
    date: dateStr || new Date().toISOString().substring(0, 10),
    operators: operators.map((o) => ({
      nik: o.nik,
      name: o.name,
      line: o.line,
      attendanceStatus: o.attendanceStatus,
      attendanceNotes: o.attendanceNotes,
      grade: o.grade,
      primarySkill: o.primarySkill,
      efficiency: o.efficiency,
      defectRate: o.defectRate,
      targetOutput: o.targetOutput,
    })),
  };

  return executeSyncRequest(config.webAppUrl, "SYNC_ATTENDANCE", payload);
}

/**
 * Send Daily Report Log to Google Apps Script Web App
 */
export async function syncDailyToGoogleScript(
  config: GoogleScriptConfig,
  log: DailyReportLog
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!config.webAppUrl || !config.webAppUrl.trim().startsWith("http")) {
    return {
      success: false,
      message: "URL Google Apps Script Web App belum diatur.",
    };
  }

  return executeSyncRequest(config.webAppUrl, "SYNC_DAILY", { log });
}

/**
 * Test Connection (Ping)
 */
export async function pingGoogleScript(
  webAppUrl: string
): Promise<{ success: boolean; message: string; data?: any }> {
  if (!webAppUrl || !webAppUrl.trim().startsWith("http")) {
    return { success: false, message: "URL tidak valid." };
  }

  try {
    // Try via our proxy first
    const proxyRes = await fetch(`/api/google-script-test?url=${encodeURIComponent(webAppUrl)}`);
    if (proxyRes.ok) {
      const json = await proxyRes.json();
      return json;
    }
  } catch (e) {
    console.warn("Proxy ping failed, trying direct GET:", e);
  }

  // Fallback direct ping
  try {
    const sep = webAppUrl.includes("?") ? "&" : "?";
    const res = await fetch(`${webAppUrl}${sep}action=PING&_=${Date.now()}`, {
      method: "GET",
    });
    if (res.ok) {
      const data = await res.json();
      return { success: true, message: data.message || "Koneksi Google Script berhasil.", data };
    }
    return { success: false, message: `Server mengembalikan respon status ${res.status}` };
  } catch (err: any) {
    return {
      success: false,
      message: `Tidak dapat menghubungi Google Apps Script: ${err.message || "Periksa izin 'Siapa saja / Anyone'"}`,
    };
  }
}

/**
 * Core Request Dispatcher via server proxy with direct fallback
 */
async function executeSyncRequest(
  webAppUrl: string,
  action: string,
  payload: any
): Promise<{ success: boolean; message: string; data?: any }> {
  // Method A: Express Proxy (Handles redirects & CORS cleanly)
  try {
    const res = await fetch("/api/google-script-sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        scriptUrl: webAppUrl,
        action,
        payload,
      }),
    });

    const json = await res.json();
    if (res.ok && json.success) {
      return {
        success: true,
        message: json.message || "Data berhasil terkirim ke Google Spreadsheet.",
        data: json.data,
      };
    } else {
      // If error message returned
      if (json.message) {
        return {
          success: false,
          message: json.message,
          data: json.data,
        };
      }
    }
  } catch (err: any) {
    console.warn("Express proxy error, attempting direct client fetch:", err);
  }

  // Method B: Direct Client fetch fallback
  try {
    const directRes = await fetch(webAppUrl, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8", // avoids preflight CORS on Google Apps Script
      },
      body: JSON.stringify({
        action,
        payload,
      }),
    });

    if (directRes.ok) {
      const data = await directRes.json();
      return {
        success: true,
        message: data.message || "Data tersinkronisasi via koneksi langsung.",
        data,
      };
    }
    return {
      success: false,
      message: `Google Apps Script mengembalikan status HTTP ${directRes.status}`,
    };
  } catch (directErr: any) {
    return {
      success: false,
      message: `Gagal mengirim ke Google Apps Script: ${directErr.message || "Periksa URL Web App & pastikan akses diatur 'Siapa Saja / Anyone'"}.`,
    };
  }
}
