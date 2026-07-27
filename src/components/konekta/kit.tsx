import type { ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Inbox, Star, TriangleAlert, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

/* ---------------------------------- Screen --------------------------------- */

export function ScreenHeader({
  title,
  subtitle,
  back = true,
  right,
  sticky = true,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  sticky?: boolean;
}) {
  const router = useRouter();
  return (
    <header
      className={cn(
        "bg-surface/90 backdrop-blur-md px-5 pt-6 pb-4 z-30",
        sticky && "sticky top-0",
      )}
    >
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
        {back ? (
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => router.history.back()}
            className="press size-10 shrink-0 grid place-items-center rounded-full bg-card text-foreground shadow-soft"
          >
            <ArrowLeft size={18} />
          </button>
        ) : (
          <span className="size-0" />
        )}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="shrink-0">{right}</div>
      </div>
    </header>
  );
}

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("px-5 py-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h2 className="text-[15px] font-bold tracking-tight">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function KCard({
  children,
  className,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const Tag = as;
  return (
    <Tag className={cn("rounded-2xl bg-card p-4 shadow-soft", className)}>{children}</Tag>
  );
}

/* --------------------------------- Feedback -------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="fade-up flex flex-col items-center justify-center gap-3 rounded-2xl bg-card px-6 py-12 text-center shadow-soft">
      <div className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
        {icon ?? <Inbox size={22} />}
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="max-w-xs text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Algo correu mal",
  description = "Não foi possível carregar esta informação. Tente novamente.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl bg-card px-6 py-10 text-center shadow-soft">
      <div className="grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
        <TriangleAlert size={22} />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
      {onRetry && (
        <Button onClick={onRetry} className="mt-1 rounded-full">
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

export function OfflineBanner({ online }: { online: boolean }) {
  if (online) return null;
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-warning px-4 py-2 text-xs font-semibold text-warning-foreground">
      <WifiOff size={14} /> Está offline — a mostrar dados guardados
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <Skeleton className="size-14 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

/* ---------------------------------- Atoms ---------------------------------- */

const toneMap = {
  neutral: "bg-muted text-muted-foreground",
  primary: "bg-accent text-accent-foreground",
  success: "bg-success/12 text-success",
  warning: "bg-warning/15 text-warning",
  error: "bg-destructive/12 text-destructive",
} as const;

export type Tone = keyof typeof toneMap;

export function StatusPill({ children, tone = "neutral" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold",
        toneMap[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          className={i <= Math.round(value) ? "fill-warning text-warning" : "text-border"}
        />
      ))}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "primary",
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: Tone;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        {icon && (
          <span className={cn("grid size-8 place-items-center rounded-full", toneMap[tone])}>{icon}</span>
        )}
      </div>
      <p className="mt-2 text-xl font-extrabold tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ListRow({
  to,
  icon,
  title,
  subtitle,
  right,
  onClick,
}: {
  to?: string;
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onClick?: () => void;
}) {
  const body = (
    <>
      {icon && (
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1 text-left">
        <span className="block truncate text-sm font-semibold">{title}</span>
        {subtitle && <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      {right}
    </>
  );
  const cls =
    "press flex w-full items-center gap-3 rounded-2xl bg-card p-4 shadow-soft transition-colors hover:bg-accent/40";
  if (to) {
    return (
      <Link to={to} className={cls}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {body}
    </button>
  );
}

export function ProgressSteps({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Passo ${step} de ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-colors duration-300",
            i < step ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </div>
  );
}
