import type { ReactNode } from "react";
import { BottomNav } from "./BottomNav";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex justify-center">
      <div className="w-full max-w-md relative bg-surface pb-24">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
