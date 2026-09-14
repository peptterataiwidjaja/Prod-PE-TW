import React, { useState } from "react";
import { User } from "../types";
import { UserCheck, Shield, Edit3, X, Check, Lock } from "lucide-react";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  users: User[];
  onUpdateUserName: (userId: string, newName: string) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onUpdateUserName,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const selectedUser = users.find((u) => u.id === selectedUserId) || currentUser;
  const [newName, setNewName] = useState(selectedUser.name);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const handleSelectUser = (user: User) => {
    setSelectedUserId(user.id);
    setNewName(user.name);
    setSuccessMessage("");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    onUpdateUserName(selectedUserId, newName.trim());
    setSuccessMessage(`Nama akun "${selectedUser.title}" berhasil diubah menjadi "${newName.trim()}".`);
    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header with Red & Blue precision accent */}
        <div className="h-1.5 bg-gradient-to-r from-blue-700 via-blue-600 to-red-600" />
        
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Pengaturan Profil & Nama Akun
              </h3>
              <p className="text-xs text-slate-500">
                Ubah nama akun untuk Production Engineer (PE) dan seluruh Admin Line
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center text-lg font-bold transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* User selector tab */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Pilih Akun yang Ingin Diubah:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {users.map((u) => {
                const isSelected = u.id === selectedUserId;
                const isEng = u.role === "production_engineer";
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`p-2 rounded-xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? isEng
                          ? "bg-blue-50 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                          : "bg-red-50 border-red-400 ring-2 ring-red-500/20 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-white text-slate-700"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                          isEng ? "bg-blue-600 text-white" : "bg-red-600 text-white"
                        }`}
                      >
                        {isEng ? "PE" : `L${u.assignedLine}`}
                      </span>
                      {u.id === currentUser.id && (
                        <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="mt-1 font-bold text-xs text-slate-900 truncate" title={u.name}>
                      {u.name}
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {isEng ? "Prod. Engineer" : `Admin L${u.assignedLine}`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form edit name */}
          <form onSubmit={handleSave} className="space-y-4 pt-2 border-t border-slate-100">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-800">
                  Nama Lengkap Akun:
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  Role: <strong className="text-blue-700">{selectedUser.title}</strong>
                </span>
              </div>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Masukkan nama resmi penanggung jawab..."
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 focus:outline-none transition-all shadow-2xs"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Nama ini akan muncul pada header lembar kontrol F-SEW-005, denah tata letak layout meja jahit, dan kolom pengesahan laporan PDF.
              </p>
            </div>

            {successMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan Nama</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
