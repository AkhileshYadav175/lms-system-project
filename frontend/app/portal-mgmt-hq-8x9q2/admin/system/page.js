export default function SystemPage() {
  return (
    <div className="flex flex-col gap-5 max-w-4xl mx-auto h-full text-white">
      {/* Top Banner */}
      <div className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-2xl p-5 sm:p-6 flex items-center gap-4 border border-white/10 shadow-xl">
        <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">System Diagnostics</h2>
          <p className="text-gray-400 text-sm">Monitor LMS core engine health and security gateway status</p>
        </div>
      </div>

      <div className="bg-[#1C1C1E]/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 md:p-8 border border-white/10 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/40 p-6 rounded-2xl border border-white/10 transition-shadow hover:border-red-500/30">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"></path></svg>
              </div>
              <h3 className="font-bold text-white text-lg">Server Status</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-gray-400 uppercase tracking-wider">Gateway Status</span>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">Online &amp; Protected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-gray-400 uppercase tracking-wider">Uptime</span>
                <span className="font-bold text-white">99.99%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-gray-400 uppercase tracking-wider">Version</span>
                <span className="font-mono text-sm text-gray-300">v2.4.0 (Burgundy)</span>
              </div>
            </div>
          </div>

          <div className="bg-black/40 p-6 rounded-2xl border border-white/10 transition-shadow hover:border-red-500/30">
            <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
              </div>
              <h3 className="font-bold text-white text-lg">Database &amp; Storage</h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-gray-400 uppercase tracking-wider">Connection</span>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-gray-400 uppercase tracking-wider">Storage Engine</span>
                <span className="font-semibold text-white">Cloudflare R2 + Redis</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-gray-400 uppercase tracking-wider">Latency</span>
                <span className="font-mono text-sm text-emerald-400">18ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
