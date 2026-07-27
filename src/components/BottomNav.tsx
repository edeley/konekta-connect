import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  ClipboardList,
  MessageCircle,
  Wallet,
  User,
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  Users,
  Settings,
  Banknote,
} from "lucide-react";
import type { UserRole } from "@/lib/store";
import { cn } from "@/lib/utils";

const clientTabs = [
  { to: "/", label: "Início", icon: Home },
  { to: "/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/chat", label: "Chat", icon: MessageCircle },
  { to: "/carteira", label: "Carteira", icon: Wallet },
  { to: "/perfil", label: "Perfil", icon: User },
];

const providerTabs = [
  { to: "/pro", label: "Painel", icon: LayoutDashboard },
  { to: "/pro/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/pro/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/pro/ganhos", label: "Ganhos", icon: TrendingUp },
  { to: "/perfil", label: "Perfil", icon: User },
];

const adminTabs = [
  { to: "/admin", label: "Painel", icon: LayoutDashboard },
  { to: "/admin/prestadores", label: "Prestadores", icon: Users },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/financeiro", label: "Financeiro", icon: Banknote },
  { to: "/admin/configuracoes", label: "Config.", icon: Settings },
];

export function navFor(role: UserRole) {
  if (role === "prestador") return providerTabs;
  if (role === "admin") return adminTabs;
  return clientTabs;
}

export function BottomNav({ role = "cliente", wide = false }: { role?: UserRole; wide?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const tabs = navFor(role);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-1/2 z-40 w-full -translate-x-1/2 border-t border-border bg-card/95 px-3 pb-3 pt-2 backdrop-blur-md",
        wide ? "max-w-5xl" : "max-w-md",
      )}
    >
      <div className="flex items-center justify-between">
        {tabs.map(({ to, label, icon: Icon }) => {
          const root = to === "/" || to === "/pro" || to === "/admin";
          const active = root ? pathname === to : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "press flex flex-1 flex-col items-center gap-1 rounded-xl py-1",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-14 place-items-center rounded-full transition-all duration-200",
                  active ? "bg-accent" : "bg-transparent",
                )}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.9} />
              </span>
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
