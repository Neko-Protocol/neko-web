import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface NavItemProps {
  label: string;
  href: string;
  icon: React.ElementType;
  isActive: boolean;
  disabled?: boolean;
}

export function NavItem({
  label,
  href,
  icon: Icon,
  isActive,
  disabled,
}: NavItemProps) {
  if (disabled) {
    return <DisabledNavItem label={label} icon={Icon} />;
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-4 py-3 text-base font-medium transition-colors duration-150",
        isActive
          ? "text-white"
          : "text-white/35 hover:text-white/65"
      )}
      style={
        isActive
          ? { background: "#222222", borderRadius: "84px" }
          : { borderRadius: "84px" }
      }
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-white" : "text-white/35"
        )}
      />
      {label}
    </Link>
  );
}

/** A mainnet-only page while the app runs on testnet. */
function DisabledNavItem({
  label,
  icon: Icon,
}: {
  label: string;
  icon: React.ElementType;
}) {
  const t = useTranslations("common.testnet");

  return (
    <div
      aria-disabled="true"
      title={t("notAvailable")}
      className="flex cursor-not-allowed select-none items-center gap-3 px-4 py-3 text-base font-medium text-white/15"
      style={{ borderRadius: "84px" }}
    >
      <Icon className="h-5 w-5 shrink-0 text-white/15" />
      {label}
    </div>
  );
}
