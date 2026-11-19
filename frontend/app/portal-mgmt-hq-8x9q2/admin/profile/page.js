"use client";
import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [email, setEmail] = useState("Loading...");

  useEffect(() => {
    // Access the email saved during login
    const savedEmail = localStorage.getItem("admin_email");
    if (savedEmail) {
      setEmail(savedEmail);
    } else {
      setEmail("admin@jainscomputer.com"); // Fallback
    }
  }, []);

  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto h-full text-white">
      {/* Top Banner */}
      <div className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-2xl p-5 sm:p-6 flex items-center gap-4 border border-white/10 shadow-xl">
        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">Admin Profile</h2>
          <p className="text-gray-400 text-sm">View administrator credentials and roles</p>
        </div>
      </div>

      <div className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 md:p-8 flex flex-col items-center justify-center min-h-[400px] border border-white/10 flex-1">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-r from-[#D71D3A] to-[#BA142D] text-white font-black flex items-center justify-center text-4xl mb-5 shadow-xl shadow-red-950/60 border border-white/10">A</div>
        <h2 className="text-2xl font-extrabold text-white mb-1">HQ Administrator</h2>
        <p className="text-rose-400 font-bold text-xs mb-8 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full">Core Super Admin</p>
        
        <div className="w-full max-w-md space-y-3">
          <div className="flex flex-col sm:flex-row justify-between p-4 bg-black/40 rounded-2xl gap-2 border border-white/10">
            <span className="font-bold text-xs text-gray-400 uppercase tracking-wider">Email Address</span>
            <span className="text-white font-mono text-sm break-all sm:break-normal">{email}</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between p-4 bg-black/40 rounded-2xl gap-2 border border-white/10">
            <span className="font-bold text-xs text-gray-400 uppercase tracking-wider">Access Scope</span>
            <span className="text-white font-semibold text-sm">Super Admin (Unrestricted)</span>
          </div>
          <div className="flex flex-col sm:flex-row justify-between p-4 bg-black/40 rounded-2xl gap-2 border border-white/10">
            <span className="font-bold text-xs text-gray-400 uppercase tracking-wider">Gateway Status</span>
            <span className="text-emerald-400 font-bold text-xs bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full inline-flex items-center w-max">Active &amp; Authenticated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
