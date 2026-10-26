"use client";

import { useEffect } from "react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

/**
 * Didit redirects here (backend PRO_APP_URL) when a Neko Pro KYC/KYB session
 * ends. Inside the verification iframe it tells the parent page to re-check
 * the status; opened on its own it sends the user back to Neko Pro.
 */
export default function DiditCallbackPage() {
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (window.parent !== window) {
      window.parent.postMessage(
        { type: "didit:complete", status },
        window.location.origin
      );
    } else {
      window.location.replace("/pro");
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#121212] p-8">
      <LoadingSpinner className="border-white/60 border-r-transparent" />
    </main>
  );
}
