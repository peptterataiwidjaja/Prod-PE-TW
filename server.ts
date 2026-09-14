import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Server-side Gemini client
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch (err) {
      console.error("Failed to initialize GoogleGenAI:", err);
    }
  }
  return aiClient;
}

// Healthcheck endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Google Apps Script Web App Proxy Endpoint
// Proxies sync requests to avoid browser CORS / 302 redirect issues with script.google.com
app.post("/api/google-script-sync", async (req, res) => {
  const { scriptUrl, action, payload } = req.body;

  if (!scriptUrl || typeof scriptUrl !== "string") {
    return res.status(400).json({
      success: false,
      message: "URL Google Apps Script Web App tidak valid atau belum diisi.",
    });
  }

  try {
    const postBody = JSON.stringify({
      action: action || "SYNC_HOURLY",
      timestamp: new Date().toISOString(),
      payload: payload || {},
    });

    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: postBody,
      redirect: "follow",
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        message: `Google Apps Script mengembalikan status ${response.status}`,
        details: data,
      });
    }

    return res.json({
      success: true,
      message: data?.message || "Data berhasil disinkronkan ke Google Spreadsheet via Google Apps Script.",
      data,
    });
  } catch (error: any) {
    console.error("Error proxying to Google Apps Script:", error);
    return res.status(500).json({
      success: false,
      message: `Gagal menghubungi Google Apps Script: ${error?.message || "Koneksi terputus"}`,
    });
  }
});

// Endpoint to test or ping Google Apps Script (GET)
app.get("/api/google-script-test", async (req, res) => {
  const scriptUrl = req.query.url as string;
  if (!scriptUrl) {
    return res.status(400).json({ success: false, message: "Parameter URL diperlukan." });
  }

  try {
    const separator = scriptUrl.includes("?") ? "&" : "?";
    const testUrl = `${scriptUrl}${separator}action=PING&timestamp=${Date.now()}`;
    const response = await fetch(testUrl, {
      method: "GET",
      redirect: "follow",
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return res.json({
      success: response.ok,
      message: response.ok ? "Koneksi Google Apps Script berhasil dan aktif!" : `Respon ${response.status}`,
      data,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: `Koneksi gagal: ${error?.message || "Tidak dapat menghubungi server"}`,
    });
  }
});

// AI Bottleneck & Target Shortfall Analysis endpoint
app.post("/api/analyze-target", async (req, res) => {
  const { line, target, actual, shortfall, bottlenecks, lowGradingOps, summaryData } = req.body;

  try {
    const ai = getAIClient();
    if (ai) {
      const prompt = `Anda adalah Industrial Engineering & Sewing Production Expert di industri garmen manufaktur.
Analisis data kegagalan pencapaian target produksi pada Line ${line}:
- Target Kumulatif: ${target} pcs
- Aktual Tercapai: ${actual} pcs
- Selisih / Defisit: ${shortfall} pcs (${target > 0 ? ((shortfall / target) * 100).toFixed(1) : 0}% di bawah target)
- Proses Bottleneck Terparah:
${(bottlenecks || [])
  .map(
    (b: any) =>
      `  * No ${b.no} - ${b.process} (Mesin: ${b.machine}): Target ${b.target} pcs, Aktual ${b.actual} pcs (Defisit: ${b.shortfall}), Output/jam: ${b.hourlyRate} pcs, Defect: ${b.defects || 0} pcs`
  )
  .join("\n")}
- Operator Membutuhkan Pendampingan (Grade C/D):
${(lowGradingOps || [])
  .map(
    (op: any) =>
      `  * ${op.name} (Grade: ${op.grade}, Efisiensi: ${op.efficiency}%, Defect: ${op.defects}) pada proses ${op.process}`
  )
  .join("\n")}

Format output yang dibutuhkan (gunakan bahasa Indonesia yang ringkas, teknis, dan solutif ala Supervisor Pabrik Garmen):
1. **Analisis Akar Masalah (4M: Man, Machine, Method, Material)**
2. **Identifikasi Bottleneck Utama & Efek Domino ke Proses Selanjutnya**
3. **Langkah Taktis Penyelamatan Line (Immediate Action Plan - 1 s/d 2 Jam Ke Depan)**
4. **Rekomendasi Penyeimbangan Line (Line Balancing & Relokasi Helper / Operator Cadangan)**

Buatlah dalam format Markdown yang rapi dan mudah dibaca supervisor di lantai produksi.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
      });

      if (response.text) {
        return res.json({
          source: "gemini",
          analysis: response.text,
        });
      }
    }
  } catch (error: any) {
    console.warn("Gemini API call failed or not configured, using expert rule-based diagnostic engine:", error?.message);
  }

  // Expert Heuristic Fallback Analysis
  const topBottleneck = bottlenecks?.[0] || { process: "Operasi Jahit Utama", machine: "SN", shortfall: shortfall || 15 };
  const fallbackAnalysis = `### 🔍 Analisis Diagnostik Otomatis Line ${line} (Sistem IE Garmen)

#### 1. Ringkasan Kesenjangan Target (Gap Summary)
* **Status Produksi:** Line ${line} mengalami defisit sebesar **${shortfall} pcs** terhadap target (${actual}/${target} pcs).
* **Efisiensi Line Aktual:** ${target > 0 ? ((actual / target) * 100).toFixed(1) : 0}%.
* **Stasiun Penghambat Terbesar:** **${topBottleneck.process}** (Mesin ${topBottleneck.machine}) dengan defisit per jam yang menumpuk.

#### 2. Akar Masalah Berdasarkan Analisis 4M:
* **Man (Tenaga Kerja):** Operator pada stasiun bottleneck mengalami kendala ritme kerja atau kesulitan pada bagian rumit (cycle time melampaui SMV standar). ${lowGradingOps?.length ? `Terdapat ${lowGradingOps.length} operator berkategori Grade C/D yang memerlukan bantuan.` : "Fluktuasi ritme kerja operator jam ke jam terlihat menurun di paruh kedua jam kerja."}
* **Machine (Mesin):** Kebutuhan alat jahit tipe **${topBottleneck.machine}** memiliki beban SMV tinggi. Perlu pemeriksaan tension benang, jarum tumpul, atau rpm mesin yang belum maksimal.
* **Method (Metode Kerja):** Penumpukan WIP (Work In Process) terjadi sebelum stasiun ${topBottleneck.process}, mengindikasikan ketidakseimbangan beban kerja (line imbalance).
* **Material:** Pastikan bundle potongan kain dan aksesoris (benang, padding, interlining) telah siap di feeding table tanpa jeda pencarian potongan.

#### 3. Rencana Aksi Segera (Action Plan Supervisor):
1. **Terapkan Bantuan Floating Helper / Operator Serbabisa:** Alokasikan 1 orang Helper cadangan untuk membantu trimming, penataan potongan, atau bundling di stasiun ${topBottleneck.process}.
2. **Breakdown Elemen Gerak:** Periksa apakah operator melakukan gerakan non-value-added (misal menjangkau komponen terlalu jauh atau memotong benang manual berulang).
3. **Pemberian Target Mini per 30 Menit:** Pasang target visual jangka pendek untuk memacu ritme kerja kembali normal.
4. **Maintenance Check:** Lakukan quick check pada mesin ${topBottleneck.machine} untuk memastikan tidak ada loncatan jahitan atau benang putus berulang.`;

  return res.json({
    source: "heuristic-expert",
    analysis: fallbackAnalysis,
  });
});

// Setup Vite dev server or serve production build
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express + Vite server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
