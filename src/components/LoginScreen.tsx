import React, { useState } from "react";
import { User, LineNumber } from "../types";
import {
  Shield,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Layers,
  Factory,
  ArrowRight,
  Info,
  Building2,
  Cpu,
} from "lucide-react";
import { Logo } from "./Logo";

interface LoginScreenProps {
  users: User[];
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ users, onLogin }) => {
  // Default selection is Production Engineer
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || "user-pe");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const selectedUser = users.find((u) => u.id === selectedUserId) || users[0];
  const isPE = selectedUser.role === "production_engineer";

  const handleSelectAccount = (user: User) => {
    setSelectedUserId(user.id);
    setPassword("");
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleUseDefaultPassword = () => {
    if (selectedUser.password) {
      setPassword(selectedUser.password);
      setErrorMsg(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const expectedPass = selectedUser.password || "123456";
    if (password.trim() !== expectedPass) {
      setErrorMsg(`Kata sandi salah untuk akun ${selectedUser.name}. Silakan periksa kembali atau gunakan tombol sandi bawaan.`);
      return;
    }

    setLoading(true);
    setSuccessMsg(`Autentikasi Berhasil! Membuka workspace ${selectedUser.name}...`);

    setTimeout(() => {
      setLoading(false);
      onLogin(selectedUser);
    }, 600);
  };

  // Group accounts for clear visual presentation
  const peUser = users.find((u) => u.role === "production_engineer");
  const adminLineUsers = users.filter((u) => u.role === "admin_line");

  // Buyer mapping info for lines
  const lineBuyers: Record<number, string> = {
    1: "SOGO EXPORT",
    3: "UNIQLO CASUAL",
    4: "ZARA WOMAN",
    5: "H&M BASIC",
    6: "MARKS & SPENCER",
    7: "ADIDAS SPORTS",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-between text-slate-100 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(16,185,129,0.12),transparent_50%)] pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

      {/* Top Navbar */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Logo />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                  Coba Kontrol Produksi Sewing TW 38
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold">
                  V.1 RBAC
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Garment Manufacturing Industrial Engineering & Operator Grading System
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-3 text-xs text-slate-400">
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multi-Akun Terisolasi</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/60 border border-slate-700/60">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Layout 26 &bull; Tandem Engine</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Login Content */}
      <main className="relative z-10 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold mb-3">
            <Shield className="w-3.5 h-3.5" />
            <span>Portal Autentikasi Pengguna &bull; Pilih Akun untuk Memulai</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Selamat Datang di Portal Produksi Sewing
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Silakan pilih akun Anda di bawah ini (Production Engineer Head atau Admin Line 1, 3, 4, 5, 6, 7)
            untuk mengelola breakdown proses, layout 26 stasiun, dan hourly output sheet.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Account Selection Grid (Left / Top: 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Production Engineer Super Card */}
            {peUser && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-blue-400 mb-2 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Akun Master &bull; Production Engineer (PE)</span>
                </label>
                <div
                  id="account-card-pe"
                  onClick={() => handleSelectAccount(peUser)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all duration-200 relative overflow-hidden ${
                    selectedUserId === peUser.id
                      ? "bg-blue-900/40 border-blue-500 shadow-lg shadow-blue-900/30 ring-2 ring-blue-500/40"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-extrabold text-base shadow-md">
                        PE
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-sm sm:text-base">
                            {peUser.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-400/30">
                            FULL ACCESS
                          </span>
                        </div>
                        <p className="text-xs text-blue-200 mt-0.5">
                          {peUser.title}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Akses Master BP, semua Line 1, 3, 4, 5, 6, 7, Konfigurasi Layout 26, & Analisis Tandem.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center pl-2">
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                          selectedUserId === peUser.id
                            ? "bg-blue-500 border-blue-400 text-white"
                            : "border-slate-700 bg-slate-800"
                        }`}
                      >
                        {selectedUserId === peUser.id && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Admin Line Grid (Line 1, 3, 4, 5, 6, 7) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center space-x-1.5">
                <Factory className="w-3.5 h-3.5 text-emerald-400" />
                <span>Akun Administrator Sewing Line (Line 1, 3, 4, 5, 6, 7)</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {adminLineUsers.map((user) => {
                  const isSelected = selectedUserId === user.id;
                  const lineNum = user.assignedLine || 1;
                  const buyer = lineBuyers[lineNum] || "GARMENT";

                  return (
                    <div
                      key={user.id}
                      id={`account-card-line-${lineNum}`}
                      onClick={() => handleSelectAccount(user)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-950/40 ring-2 ring-emerald-500/40"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                            L{lineNum}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-white text-xs sm:text-sm truncate">
                                {user.name}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="text-[10px] font-bold text-emerald-400">
                                Line {lineNum}
                              </span>
                              <span className="text-slate-600 text-[10px]">&bull;</span>
                              <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                                {buyer}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-emerald-500 border-emerald-400 text-white"
                              : "border-slate-700 bg-slate-800"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Login Form Box (Right: 5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl relative">
              {/* Header Box */}
              <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                    isPE
                      ? "bg-gradient-to-br from-blue-600 to-indigo-700"
                      : "bg-gradient-to-br from-emerald-600 to-teal-700"
                  }`}
                >
                  {isPE ? "PE" : `L${selectedUser.assignedLine}`}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="font-bold text-white text-base">
                      {selectedUser.name}
                    </h2>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        isPE
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {isPE ? "Super PE" : `Admin Line ${selectedUser.assignedLine}`}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Username: <span className="text-slate-200">{selectedUser.username}</span>
                  </p>
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300 flex items-center space-x-1.5">
                      <Lock className="w-3.5 h-3.5 text-blue-400" />
                      <span>Kata Sandi / PIN Akun:</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleUseDefaultPassword}
                      className="text-[11px] text-blue-400 hover:text-blue-300 hover:underline font-semibold"
                      title="Isi otomatis dengan kata sandi bawaan sistem"
                    >
                      Gunakan Sandi Bawaan
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      id="input-login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setErrorMsg(null);
                      }}
                      placeholder={`Masukkan sandi (${selectedUser.password || "123456"})...`}
                      className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder:text-slate-600 outline-none transition-all pr-10 shadow-inner"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Hint Pill */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 px-1">
                    <span>
                      Sandi Bawaan:{" "}
                      <code className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded font-mono font-bold">
                        {selectedUser.password}
                      </code>
                    </span>
                    <span className="text-slate-500">Bisa diubah setelah login</span>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start space-x-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Success Banner */}
                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-semibold">{successMsg}</span>
                  </div>
                )}

                {/* Submit Login Button */}
                <button
                  id="btn-submit-login"
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center space-x-2 transition-all shadow-lg ${
                    isPE
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-900/40"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-900/40"
                  } active:scale-[0.99] disabled:opacity-50 cursor-pointer`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Masuk Sebagai {isPE ? "Production Engineer" : `Admin Line ${selectedUser.assignedLine}`}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Workspace Permissions Notice */}
              <div className="mt-5 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
                <div className="flex items-center space-x-1.5 font-bold text-slate-300">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span>Hak Akses Akun:</span>
                </div>
                {isPE ? (
                  <p className="leading-relaxed">
                    Akun PE memiliki hak akses penuh untuk mengedit seluruh master BP garmen, alokasi mesin, dan memonitor 6 line sekaligus.
                  </p>
                ) : (
                  <p className="leading-relaxed">
                    Akun Admin Line memiliki hak akses khusus untuk menginput output jam-jaman, presensi operator, dan upload file BP pada Line {selectedUser.assignedLine}.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950/80 px-6 py-3 text-center text-xs text-slate-500">
        <p>
          &copy; 2026 PT Garment Manufacturing Indonesia &bull; Coba Kontrol Produksi Sewing TW 38 &bull; Layout 26 & Tandem Engine
        </p>
      </footer>
    </div>
  );
};
