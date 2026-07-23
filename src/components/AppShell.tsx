import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { BottomNav } from "./BottomNav";
import { AuthGate } from "./AuthGate";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-surface flex justify-center">
        <div className="w-full max-w-md relative bg-surface pb-24">
          {children}
          {!hideNav && (
            <>
              <Link
                to="/assistente"
                aria-label="Abrir assistente"
                className="fixed bottom-24 right-[max(1rem,calc(50%-14rem))] size-14 rounded-full bg-gradient-to-br from-terracotta to-cocoa text-primary-foreground grid place-items-center shadow-lg shadow-terracotta/30 z-40 ring-4 ring-surface"
              >
                <Sparkles size={20} />
              </Link>
              <BottomNav />
            </>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
