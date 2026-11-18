"use client";

export default function MobileStatusBar() {
  return (
    <div className="w-full flex items-center justify-between px-6 pt-3 pb-2 text-white text-xs select-none">
      {/* Time */}
      <span className="font-semibold text-sm tracking-tight">9:41</span>

      {/* Dynamic Island / Speaker Pill indicator on desktop framing */}
      <div className="w-20 h-4 bg-black/60 rounded-full hidden sm:block border border-white/10"></div>

      {/* Signal, WiFi, Battery */}
      <div className="flex items-center gap-1.5 text-white">
        {/* Cellular Signal Bars (4 bars) */}
        <svg className="w-4 h-3.5" viewBox="0 0 17 12" fill="currentColor">
          <rect x="0.5" y="8" width="2.5" height="4" rx="0.75" />
          <rect x="4.5" y="5.5" width="2.5" height="6.5" rx="0.75" />
          <rect x="8.5" y="3" width="2.5" height="9" rx="0.75" />
          <rect x="12.5" y="0.5" width="2.5" height="11.5" rx="0.75" />
        </svg>

        {/* WiFi Icon */}
        <svg className="w-3.5 h-3.5" viewBox="0 0 16 12" fill="currentColor">
          <path d="M8 9.5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-3.5-3a5 5 0 017 0 .75.75 0 101.06-1.06 6.5 6.5 0 00-9.12 0 .75.75 0 101.06 1.06zm-3.5-3a10 10 0 0114 0 .75.75 0 001.06-1.06 11.5 11.5 0 00-16.12 0 .75.75 0 101.06 1.06z" />
        </svg>

        {/* Battery Icon */}
        <svg className="w-5 h-3" viewBox="0 0 24 12" fill="currentColor">
          <rect x="1" y="1" width="19" height="10" rx="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <rect x="2.5" y="2.5" width="13" height="7" rx="1.5" fill="currentColor" />
          <path d="M21.5 4.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

