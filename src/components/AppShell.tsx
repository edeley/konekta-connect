import { useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Headphones } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { AuthGate } from "./AuthGate";
import { OfflineBanner } from "./konekta/kit";
import { ActiveAlarmBanner } from "./konekta/ActiveAlarmBanner";
import { useAlarmScheduler } from "@/lib/useAlarmScheduler";
import { useStore, type UserRole } from "@/lib/store";
import { useChatMonitoringListener } from "@/lib/chat-monitoring-listener";
import { cn } from "@/lib/utils";

function useOnline() {
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
  const pathname = routerState.location.pathname;
  const isAssistantRoute = pathname === "/assistente";
  const { activeAlarm, dismissAlarm, snoozeAlarm } = useAlarmScheduler();
  useChatMonitoringListener();

  // Determinação rigorosa da identidade visual:
  // - Cliente: Azul e Branco
  // - Prestador: Verde e Branco
  const isProRoute = pathname.startsWith("/pro") || pathname === "/tornar-prestador";
  const isClientExclusive =
    pathname === "/" ||
    pathname.startsWith("/novo-pedido") ||
    pathname.startsWith("/categorias") ||
    pathname.startsWith("/favoritos");

  const activeRole: "prestador" | "cliente" =
    isProRoute || (!isClientExclusive && role === "prestador") ? "prestador" : "cliente";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-role", activeRole);
    }
  }, [activeRole]);

  return (
    <AuthGate roles={roles}>
      <ActiveAlarmBanner
        alarmInfo={activeAlarm}
        onDismiss={dismissAlarm}
        onSnooze={() => snoozeAlarm(5)}
      />
      <div
        data-role={activeRole}
        className="flex min-h-screen justify-center bg-surface transition-colors duration-150"
      >
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
                  className="press fixed bottom-24 right-[max(1rem,calc(50%-13rem))] z-40 flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-3.5 py-2.5 shadow-lg active:scale-95 transition-all hover:opacity-95"
                >
                  <Headphones size={17} className="text-primary-foreground shrink-0" />
                  <span className="text-xs font-bold tracking-tight">Apoio</span>
                </Link>
              )}
              <BottomNav role={activeRole} wide={wide} />
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
