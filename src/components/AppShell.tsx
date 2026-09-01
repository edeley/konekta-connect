import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Headphones } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { AuthGate } from "./AuthGate";
import { OfflineBanner } from "./konekta/kit";
import { useStore, type UserRole } from "@/lib/store";
import { cn } from "@/lib/utils";

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || typeof navigator === "undefined") return;
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    setOnline(navigator.onLine ?? true);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

export function AppShell({
  children,
  hideNav = false,
  hideFab = false,
  wide = false,
  roles,
}: {
  children: ReactNode;
  hideNav?: boolean;
  hideFab?: boolean;
  wide?: boolean;
  roles?: UserRole[];
}) {
  const role = useStore((s) => s.user?.role ?? "cliente");
  const assistantOn = useStore((s) => s.flags.assistente);
  const online = useOnline();
  const routerState = useRouterState();
  const isAssistantRoute = routerState.location.pathname === "/assistente";

  return (
    <AuthGate roles={roles}>
      <div className="flex min-h-screen justify-center bg-surface">
        <div
          className={cn(
            "relative w-full bg-surface pb-28",
            wide ? "max-w-5xl" : "max-w-md md:max-w-xl",
          )}
        >
          <OfflineBanner online={online} />
          {children}
          {!hideNav && (
            <>
              {assistantOn && !hideFab && !isAssistantRoute && (
                <Link
                  to="/assistente"
                  aria-label="Apoio ao Cliente KONEKTA"
                  className="press fixed bottom-24 right-[max(1rem,calc(50%-13rem))] z-40 flex items-center gap-2 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3.5 py-2.5 shadow-lg border border-slate-800/20 dark:border-slate-200/20 active:scale-95 transition-all hover:opacity-90"
                >
                  <Headphones
                    size={17}
                    className="text-emerald-400 dark:text-emerald-600 shrink-0"
                  />
                  <span className="text-xs font-bold tracking-tight">Apoio</span>
                </Link>
              )}
              <BottomNav role={role} wide={wide} />
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
