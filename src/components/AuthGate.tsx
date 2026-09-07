import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore, type UserRole } from "@/lib/store";

export function AuthGate({ children, roles }: { children: ReactNode; roles?: UserRole[] }) {
  const user = useStore((s) => s.user);
  const onboarded = useStore((s) => s.onboarded);
  const providerProfile = useStore((s) => s.providerProfile);
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!onboarded && !user) {
      navigate({ to: "/onboarding", replace: true });
      return;
    }
    if (!user) {
      navigate({ to: "/login", replace: true });
      return;
    }
    if (roles && !roles.includes(user.role)) {
      navigate({ to: "/", replace: true });
      return;
    }
    // Regulação KONEKTA STP: Se a rota exige prestador, o prestador tem de estar aprovado pela empresa
    if (roles?.includes("prestador") && providerProfile?.status !== "aprovado") {
      navigate({ to: "/pending-approval", replace: true });
    }
  }, [hydrated, user, onboarded, roles, providerProfile?.status, navigate]);

  if (!hydrated) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface">
        <div className="size-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }
  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;
  if (roles?.includes("prestador") && providerProfile?.status !== "aprovado") return null;
  return <>{children}</>;
}
