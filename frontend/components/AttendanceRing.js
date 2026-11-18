"use client";

import { motion } from "framer-motion";

export default function AttendanceRing({
  percentage = 100,
  attendedClasses = 0,
  totalClasses = 0,
  size = 140,
  strokeWidth = 12,
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const validPercentage = Math.min(100, Math.max(0, percentage));
  const offset = circumference - (validPercentage / 100) * circumference;

  let strokeColor = "#10b981"; // Emerald
  let badgeText = "Great";
  let badgeBg = "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (validPercentage < 65) {
    strokeColor = "#ef4444"; // Rose/Red
    badgeText = "Low";
    badgeBg = "bg-rose-50 text-rose-700 border-rose-200";
  } else if (validPercentage < 80) {
    strokeColor = "#f59e0b"; // Amber
    badgeText = "Average";
    badgeBg = "bg-amber-50 text-amber-700 border-amber-200";
  }

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Animated Progress circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5, type: "spring" }}
            className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight"
          >
            {validPercentage}%
          </motion.span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider -mt-0.5">
            Attendance
          </span>
        </div>
      </div>

      <div className="mt-2.5 text-center">
        <span
          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeBg}`}
        >
          {badgeText} • {attendedClasses}/{totalClasses} Classes
        </span>
      </div>
    </div>
  );
}
