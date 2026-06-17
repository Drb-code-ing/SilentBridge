import type { RiskLevel } from "@silentbridge/shared";

interface StatusBadgeProps {
  level: RiskLevel;
  label: string;
  className?: string;
}

export function StatusBadge({ level, label, className = "" }: StatusBadgeProps) {
  const styles = {
    normal: "bg-emerald-50 text-emerald-800 border-emerald-200",
    attention: "bg-amber-50 text-amber-900 border-amber-200",
    critical: "bg-red-50 text-red-800 border-red-200"
  };

  const marks = {
    normal: "OK",
    attention: "CHECK",
    critical: "RISK"
  };

  return (
    <span
      className={`label-mono inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-[11px] font-bold ${styles[level]} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      <span>{marks[level]}</span>
      <span className="font-sans text-xs tracking-normal">{label}</span>
    </span>
  );
}
