import { Link, useRouterState } from "@tanstack/react-router";
import { Home, ClipboardList, MessageCircle, Wallet, User } from "lucide-react";

const tabs = [
  { to: "/", label: "Início", icon: Home },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/carteira", label: "Carteira", icon: Wallet },
  { to: "/perfil", label: "Perfil", icon: User },
] as const;

export function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card border-t border-border px-4 py-2 pb-3 z-40">
      <div className="flex justify-between items-center">
        {tabs.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg transition-colors ${
                active ? "text-terracotta" : "text-muted-foreground"
              }`}
            >
              <div
                className={`size-8 rounded-lg flex items-center justify-center transition-colors ${
                  active ? "bg-terracotta/10" : ""
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.4 : 2} />
              </div>
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
