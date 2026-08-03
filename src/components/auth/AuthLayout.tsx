import type { ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProgressIndicator({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="space-y-1.5" aria-label={`Passo ${step} de ${total}`}>
      <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
        <span>
          Passo {step} de {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function AuthLayout({
  children,
  back,
  showLogo = true,
  step,
  totalSteps,
  className,
}: {
  children: ReactNode;
  back?: boolean;
  showLogo?: boolean;
  step?: number;
  totalSteps?: number;
  className?: string;
}) {
  const router = useRouter();
  return (
    <main className="relative min-h-screen bg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-accent to-transparent"
      />
      <div className={cn("relative mx-auto flex w-full max-w-md flex-col px-5 pb-12 pt-6 md:max-w-lg lg:max-w-xl", className)}>
        <div className="flex items-center justify-between">
          {back ? (
            <button
              type="button"
              onClick={() => router.history.back()}
              aria-label="Voltar"
              className="press grid size-10 place-items-center rounded-full bg-card text-foreground shadow-soft"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
          ) : (
            <span className="size-10" />
          )}
          {showLogo && (
            <Link to="/" className="flex items-center gap-2" aria-label="KONEKTA — início">
              <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Zap size={16} aria-hidden="true" />
              </span>
              <span className="text-base font-extrabold tracking-tight text-primary">KONEKTA</span>
            </Link>
          )}
          <span className="size-10" />
        </div>

        {typeof step === "number" && typeof totalSteps === "number" && (
          <div className="mt-6">
            <ProgressIndicator step={step} total={totalSteps} />
          </div>
        )}

        <div className="fade-up mt-6 flex-1">{children}</div>
      </div>
    </main>
  );
}
