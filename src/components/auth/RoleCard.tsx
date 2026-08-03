import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type RoleCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  tone: "primary" | "warning" | "success";
};

const toneMap = {
  primary: {
    surface: "bg-accent",
    ring: "border-primary ring-2 ring-primary/25",
    icon: "bg-primary/12 text-primary",
    check: "bg-primary text-primary-foreground",
  },
  warning: {
    surface: "bg-warning/10",
    ring: "border-warning ring-2 ring-warning/25",
    icon: "bg-warning/15 text-warning",
    check: "bg-warning text-warning-foreground",
  },
  success: {
    surface: "bg-success/10",
    ring: "border-success ring-2 ring-success/25",
    icon: "bg-success/15 text-success",
    check: "bg-success text-success-foreground",
  },
} as const;

export function RoleCard({ icon: Icon, title, description, selected, onClick, tone }: RoleCardProps) {
  const t = toneMap[tone];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn(
        "press flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        t.surface,
        selected ? t.ring : "border-border",
      )}
    >
      <span className={cn("grid size-12 shrink-0 place-items-center rounded-xl", t.icon)}>
        <Icon size={22} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full border transition-colors",
          selected ? t.check + " border-transparent" : "border-border bg-card",
        )}
        aria-hidden="true"
      >
        {selected && <Check size={14} />}
      </span>
    </button>
  );
}
