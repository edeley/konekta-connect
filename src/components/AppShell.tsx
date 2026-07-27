import { useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { AuthGate } from "./AuthGate";
import { OfflineBanner } from "./konekta/kit";
import { useStore, type UserRole } from "@/lib/store";
import { cn } from "@/lib/utils";

export function useOnline() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    setOnline(navigator.onLine);
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
              {assistantOn && !hideFab && (
                <Link
                  to="/assistente"
                  aria-label="Abrir assistente KONEKTA"
                  className="press fixed bottom-28 right-[max(1rem,calc(50%-13rem))] z-40 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-raised ring-4 ring-surface"
                >
                  <Sparkles size={20} />
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
