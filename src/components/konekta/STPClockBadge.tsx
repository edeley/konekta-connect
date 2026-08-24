import { useSTPClock } from "@/lib/stp-time";
import { Clock, MapPin, Sun, Moon, Sunrise } from "lucide-react";

type STPClockBadgeProps = {
  compact?: boolean;
  showGreeting?: boolean;
  className?: string;
};

export function STPClockBadge({
  compact = false,
  showGreeting = false,
  className = "",
}: STPClockBadgeProps) {
  const { timeShort, dateShort, greeting, period } = useSTPClock();

  const PeriodIcon = period === "manha" ? Sunrise : period === "tarde" ? Sun : Moon;

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-card/90 backdrop-blur-xs border border-border/80 text-[11px] font-medium text-foreground shadow-2xs ${className}`}
        title="Hora Oficial de São Tomé e Príncipe (GMT)"
      >
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
        </span>
        <Clock size={12} className="text-primary" />
        <span className="font-bold tabular-nums">{timeShort}</span>
        <span className="text-[10px] text-muted-foreground">GMT · STP</span>
      </div>
    );
  }

  return (
    <div
      className={`bg-card/90 backdrop-blur-xs border border-border/80 rounded-2xl p-3 shadow-2xs flex items-center justify-between gap-3 text-xs ${className}`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <PeriodIcon size={18} />
        </div>
        <div className="min-w-0">
          {showGreeting ? (
            <p className="text-xs font-bold text-foreground truncate">{greeting} em São Tomé</p>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              <MapPin size={11} className="text-primary" />
              <span>São Tomé e Príncipe</span>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground truncate capitalize">
            {dateShort} · Fuso GMT (UTC+0)
          </p>
        </div>
      </div>

      <div className="text-right shrink-0">
        <div className="flex items-center justify-end gap-1.5">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
          </span>
          <span className="text-sm font-black text-foreground tabular-nums tracking-tight">
            {timeShort}
          </span>
        </div>
        <span className="text-[9px] font-bold text-primary block">GMT (Tempo Real)</span>
      </div>
    </div>
  );
}
