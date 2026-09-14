import React, { useState } from "react";
import { User, LineNumber } from "../types";
import {
  Lock,
  KeyRound,
  Shield,
  UserCheck,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  X,
  Building2,
  LogIn,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Logo } from "./Logo";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onLoginSuccess: (user: User) => void;
  onLogout: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onLoginSuccess,
  onLogout,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id || users[1].id);
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetUser = users.find((u) => u.id === selectedUserId) || users[0];
  const isPE = targetUser.role === "production_engineer";

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate password
    const expectedPass = targetUser.password || "123456";
    if (password.trim() !== expectedPass) {
      setErrorMsg(`Password salah untuk akun ${targetUser.name}. Silakan cek kata sandi.`);
      return;
    }

    setSuccessMsg(`Autentikasi Berhasil! Masuk sebagai ${targetUser.name}`);
    setTimeout(() => {
      onLoginSuccess(targetUser);
      setSuccessMsg(null);
      setPassword("");
      onClose();
    }, 500);
  };

  const handleQuickSelect = (user: User) => {
    setSelectedUserId(user.id);
    setPassword(user.password || "");
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header with Security Theme */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">
                Autentikasi & Sekuritas Admin Line
              </h3>
              <p className="text-xs text-blue-200">
                Sistem Terisolasi Per Sewing Line Pabrik
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Setiap sewing line memiliki akun mandiri untuk mengunggah file BP (Breakdown Produksi) dan laporan harian masing-masing.
          </p>
        </div>

        {/* Current Active Account Status */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-medium">Akun Aktif:</span>
            <span className="font-bold text-slate-800">{currentUser.name}</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                currentUser.role === "production_engineer"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {currentUser.role === "production_engineer"
                ? "PE Super"
                : `Line ${currentUser.assignedLine}`}
            </span>
          </div>
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="text-slate-500 hover:text-red-600 flex items-center space-x-1 font-semibold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {/* Account Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Pilih Akun Pengguna / Admin Line:
            </label>
            <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto p-1 bg-slate-50 rounded-2xl border border-slate-200">
              {users.map((u) => {
                const isSelected = u.id === selectedUserId;
                const isEng = u.role === "production_engineer";
                return (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => handleQuickSelect(u)}
                    className={`text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                      isSelected
                        ? isEng
                          ? "bg-blue-600 text-white font-bold shadow-xs"
                          : "bg-red-600 text-white font-bold shadow-xs"
                        : "hover:bg-white text-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-extrabold ${
                          isSelected
                            ? "bg-white/20 text-white"
                            : isEng
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {isEng ? "PE" : `L${u.assignedLine}`}
                      </div>
                      <div>
                        <div className="leading-tight">{u.name}</div>
                        <div
                          className={`text-[10px] ${
                            isSelected ? "text-white/80" : "text-slate-400"
                          }`}
                        >
                          {u.title}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                <span>Kata Sandi / PIN Sekuritas:</span>
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                Default: {targetUser.password || "123456"}
              </span>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Masukkan kata sandi..."
                required
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role Access Scope Info */}
          <div
            className={`p-3 rounded-xl border text-xs leading-relaxed ${
              isPE
                ? "bg-blue-50 border-blue-200 text-blue-900"
                : "bg-amber-50 border-amber-200 text-amber-900"
            }`}
          >
            <div className="font-bold flex items-center space-x-1.5 mb-1">
              {isPE ? <Shield className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>
                {isPE
                  ? "Hak Akses: Production Engineer (Super Admin)"
                  : `Hak Akses: Terkunci Khusus Sewing Line ${targetUser.assignedLine}`}
              </span>
            </div>
            <p className="text-[11px] opacity-90">
              {isPE
                ? "PE memiliki izin menyeluruh untuk memantau 6 line, mengaudit keseimbangan line, dan melihat master breakdown seluruh line."
                : `Admin Line ${targetUser.assignedLine} hanya dapat mengunggah file BP line sendiri, mencatat absensi harian, dan mengisi laporan kontrol produksi Line ${targetUser.assignedLine}.`}
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center space-x-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk Sebagai {targetUser.name}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
