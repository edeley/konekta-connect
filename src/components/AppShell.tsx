import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { AuthGate } from "./AuthGate";

export function AppShell({ children, hideNav = false }: { children: ReactNode; hideNav?: boolean }) {
  return (
    <AuthGate>
      <div className="min-h-screen bg-surface flex justify-center">
        <div className="w-full max-w-md relative bg-surface pb-24">
          {children}
          {!hideNav && <BottomNav />}
        </div>
      </div>
    </AuthGate>
  );
}
