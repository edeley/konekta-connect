import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";

export function AuthGate({ children }: { children: ReactNode }) {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !user) {
      navigate({ to: "/auth", replace: true });
    }
  }, [hydrated, user, navigate]);

  if (!hydrated) return null;
  if (!user) return null;
  return <>{children}</>;
}
