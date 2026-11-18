"use client";
import { useState } from "react";
import { fetchApi } from "@/lib/api";

export default function PasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetchApi("/admin/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || json.error || "Failed to update password");
      }

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 max-w-3xl mx-auto h-full text-white">
      {/* Top Banner */}
      <div className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-2xl p-5 sm:p-6 flex items-center gap-4 border border-white/10 shadow-xl">
        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Security Settings</h2>
          <p className="text-gray-400 text-sm">Update your administrator access password</p>
        </div>
      </div>

      <div className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 md:p-8 border border-white/10 flex-1">
        <h2 className="text-lg font-bold text-white mb-6 border-b border-white/10 pb-4">Change Password</h2>
        
        <div className="max-w-md mx-auto mt-6">
          {error && (
            <div className="mb-6 p-4 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-2xl text-xs font-semibold flex gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-semibold flex gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              Password updated successfully.
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Current Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#D71D3A]/40 focus:outline-none text-sm text-white placeholder-gray-500 transition-all"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#D71D3A]/40 focus:outline-none text-sm text-white placeholder-gray-500 transition-all"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Confirm New Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#D71D3A]/40 focus:outline-none text-sm text-white placeholder-gray-500 transition-all"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="pt-4">
              <button 
                type="submit"
                disabled={loading}
                className={`w-full bg-gradient-to-r from-[#D71D3A] to-[#BA142D] hover:brightness-110 active:scale-95 text-white font-semibold py-3.5 rounded-2xl transition-all shadow-lg shadow-red-950/60 flex justify-center items-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating Password...
                  </>
                ) : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
