import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { BudgetHealth } from "@/types/project";

// Status colors per the validated status palette (fixed, never themed):
// good #0ca30c, warning #fab219, critical #d03b3b. Always paired with an
// icon + label so the meaning never rides on color alone.
const CONFIG: Record<BudgetHealth, { label: string; icon: typeof CheckCircle2; className: string }> = {
  "on-track": {
    label: "On Track",
    icon: CheckCircle2,
    className: "bg-[#0ca30c]/10 text-[#0ca30c]",
  },
  "near-budget": {
    label: "Near Budget",
    icon: AlertTriangle,
    className: "bg-[#fab219]/15 text-[#9a6a00]",
  },
  "over-budget": {
    label: "Over Budget",
    icon: XCircle,
    className: "bg-[#d03b3b]/10 text-[#d03b3b]",
  },
};

export default function BudgetHealthBadge({ health, className = "" }: { health: BudgetHealth; className?: string }) {
  const { label, icon: Icon, className: toneClass } = CONFIG[health];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClass} ${className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}
