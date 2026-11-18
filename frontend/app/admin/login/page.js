"use client";
import { useEffect } from "react";
import Link from "next/link";
import { API_URL } from "@/lib/api";

export default function DecoyAdminLoginPage() {
  useEffect(() => {
    // Silent Honeypot Probe Beacon
    try {
      const probePayload = {
        trap: "HONEYPOT_TRIGGERED",
        targetPath: "/admin/login",
        referrer: typeof document !== "undefined" ? document.referrer : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString()
      };
      
      const cleanBase = API_URL.replace(/\/$/, "");
      fetch(`${cleanBase}/admin/trap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(probePayload),
        keepalive: true
      }).catch(() => {
        // Silent catch: do not expose error to scanner
      });
    } catch (e) {
      // Silent catch
    }
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center text-center px-4 font-sans text-gray-900">
      <div className="flex items-center gap-4 mb-4">
        <h1 className="text-2xl font-semibold border-r border-gray-300 pr-4">404</h1>
        <p className="text-sm text-gray-600">This page could not be found.</p>
      </div>
      <Link 
        href="/" 
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2 underline"
      >
        Return to Home
      </Link>
    </div>
  );
}
