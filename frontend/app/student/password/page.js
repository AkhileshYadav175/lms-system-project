"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { fetchApi } from "@/lib/api";

const containerVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 280,
      damping: 24,
    },
  },
};

export default function PasswordPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetchApi("/student/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Failed to update portal password.");
      }
    } catch (err) {
      setError("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-3 sm:p-6 max-w-2xl mx-auto h-full flex flex-col gap-6 text-white"
    >
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[8px] bg-[#1C1C1E]/95 border border-white/10 p-6 sm:p-8 shadow-xl flex items-center justify-between gap-4">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-gradient-to-br from-[#8D0E1F]/50 to-transparent rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10">
          <span className="text-xs font-black uppercase tracking-wider text-white bg-[#8D0E1F] px-3 py-1 rounded-[8px] border border-red-500/30">
            Account Security
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-2 tracking-tight">
            Update Portal Password
          </h1>
          <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-md">
            Keep your student account secure by updating your access credentials regularly.
          </p>
        </div>

        <div className="w-12 h-12 rounded-[8px] bg-white/10 text-white border border-white/15 flex items-center justify-center shrink-0 shadow-2xs">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-[#1C1C1E]/95 rounded-[8px] p-6 sm:p-8 shadow-xl border border-white/10">
        {success && (
          <div className="bg-emerald-950/80 text-emerald-300 p-4 rounded-[8px] mb-6 font-medium border border-emerald-500/30 flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-[8px] bg-emerald-900/80 text-emerald-300 flex items-center justify-center font-bold shrink-0">
              ✓
            </div>
            <div>
              <p className="font-bold">Password changed successfully!</p>
              <p className="text-xs text-emerald-400 mt-0.5">Please use this new password next time you sign into your student portal.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-rose-950/80 text-rose-300 p-4 rounded-[8px] mb-6 font-medium border border-rose-500/30 flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-[8px] bg-rose-900/80 text-rose-300 flex items-center justify-center font-bold shrink-0">
              !
            </div>
            <div>
              <p className="font-bold">Password update failed</p>
              <p className="text-xs text-rose-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Current Password</label>
            <input 
              type="password" 
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-[8px] border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#c71e22] focus:border-transparent transition-all min-w-0 text-white bg-black/50 text-sm"
              placeholder="Enter current password"
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">New Password</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-[8px] border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#c71e22] focus:border-transparent transition-all min-w-0 text-white bg-black/50 text-sm"
              placeholder="Enter new password (min. 6 characters)"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-2">Confirm New Password</label>
            <input 
              type="password" 
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-[8px] border border-white/15 focus:outline-none focus:ring-2 focus:ring-[#c71e22] focus:border-transparent transition-all min-w-0 text-white bg-black/50 text-sm"
              placeholder="Confirm new password"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c71e22] hover:bg-[#a5191c] text-white font-bold py-3.5 px-6 rounded-[8px] transition-all shadow-md shadow-red-500/20 disabled:opacity-50 text-sm flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Updating Password...
                </>
              ) : (
                "Save New Password"
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
          <Link href="/student/profile/" className="hover:text-white font-semibold">
            ← Back to Profile
          </Link>
          <span>Need help? Contact Admin Desk</span>
        </div>
      </div>
    </motion.div>
  );
}
