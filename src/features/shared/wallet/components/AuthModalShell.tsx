"use client";

import { useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { ModalPortal } from "@/components/ui/ModalPortal";

interface AuthModalShellProps {
  titleId: string;
  title: string;
  subtitle?: string;
  onClose?: () => void;
  closeLabel?: string;
  children: React.ReactNode;
}

export function AuthModalShell({
  titleId,
  title,
  subtitle,
  onClose,
  closeLabel,
  children,
}: AuthModalShellProps) {
  useEffect(() => {
    if (!onClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="relative w-full max-w-[360px] rounded-3xl border border-white/10 bg-[#161616] px-6 pb-6 pt-8 shadow-[0_24px_80px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label={closeLabel}
              className="absolute right-4 top-4 rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          <div className="flex flex-col items-center text-center">
            <Image
              src="/Neko.svg"
              alt="Neko"
              width={90}
              height={25}
              className="h-6 w-auto -translate-x-[8.84%]"
              priority
            />
            <h3 id={titleId} className="mt-6 text-lg font-semibold text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                {subtitle}
              </p>
            )}
          </div>

          <div className="mt-6">{children}</div>
        </div>
      </div>
    </ModalPortal>
  );
}
