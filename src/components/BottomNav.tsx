import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  ClipboardList,
  Wallet,
  User,
  LayoutDashboard,
  CalendarDays,
  Search,
  Users,
  Settings,
  Banknote,
  Plus,
} from "lucide-react";

import type { UserRole } from "@/lib/store";
import { cn } from "@/lib/utils";

export function BottomNav({ role = "cliente", wide = false }: { role?: UserRole; wide?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (role === "prestador") {
    const providerTabs = [
      { to: "/pro", label: "Início", icon: LayoutDashboard },
      { to: "/pro/oportunidades", label: "Bolsa", icon: Search },
      { to: "/pro/pedidos", label: "Trabalhos", icon: ClipboardList },
      { to: "/pro/ganhos", label: "Ganhos", icon: Wallet },
      { to: "/perfil", label: "Perfil", icon: User },
    ];

    return (
      <nav
        className={cn(
          "fixed bottom-0 left-1/2 z-40 w-full -translate-x-1/2 border-t border-border bg-card/95 px-2 pb-2.5 pt-1.5 backdrop-blur-md shadow-lg",
          wide ? "max-w-5xl" : "max-w-md",
        )}
      >
        <div className="flex items-center justify-between">
          {providerTabs.map(({ to, label, icon: Icon }) => {
            const active = to === "/pro" ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "press flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 transition-colors",
                  active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-all duration-200",
                    active ? "bg-accent text-primary" : "bg-transparent",
                  )}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span className="text-[10px] font-semibold tracking-tight">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  if (role === "admin") {
    const adminTabs = [
      { to: "/admin", label: "Painel", icon: LayoutDashboard },
      { to: "/admin/prestadores", label: "Prestadores", icon: Users },
      { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
      { to: "/admin/financeiro", label: "Financeiro", icon: Banknote },
      { to: "/admin/configuracoes", label: "Config.", icon: Settings },
    ];

    return (
      <nav
        className={cn(
          "fixed bottom-0 left-1/2 z-40 w-full -translate-x-1/2 border-t border-border bg-card/95 px-2 pb-2.5 pt-1.5 backdrop-blur-md shadow-lg",
          wide ? "max-w-5xl" : "max-w-md",
        )}
      >
        <div className="flex items-center justify-between">
          {adminTabs.map(({ to, label, icon: Icon }) => {
            const active = to === "/admin" ? pathname === to : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "press flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1 transition-colors",
                  active ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid h-7 w-12 place-items-center rounded-full transition-all duration-200",
                    active ? "bg-accent text-primary" : "bg-transparent",
                  )}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 1.8} />
                </span>
                <span className="text-[10px] font-semibold tracking-tight">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Client Navigation with Triider-style Center "+ Pedir" CTA
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-1/2 z-40 w-full -translate-x-1/2 border-t border-border/80 bg-card/95 px-2 pb-2.5 pt-1.5 backdrop-blur-md shadow-lg",
        wide ? "max-w-5xl" : "max-w-md",
      )}
    >
      <div className="flex items-center justify-between">
        {/* Início */}
        <Link
          to="/"
          className={cn(
            "press flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors",
            pathname === "/"
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "grid h-7 w-11 place-items-center rounded-full transition-all duration-200",
              pathname === "/" ? "bg-accent text-primary" : "bg-transparent",
            )}
          >
            <Home size={18} strokeWidth={pathname === "/" ? 2.5 : 1.8} />
          </span>
          <span className="text-[10px] font-semibold tracking-tight">Início</span>
        </Link>

        {/* Categorias / Buscar */}
        <Link
          to="/categorias"
          className={cn(
            "press flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors",
            pathname.startsWith("/categorias")
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "grid h-7 w-11 place-items-center rounded-full transition-all duration-200",
              pathname.startsWith("/categorias") ? "bg-accent text-primary" : "bg-transparent",
            )}
          >
            <Search size={18} strokeWidth={pathname.startsWith("/categorias") ? 2.5 : 1.8} />
          </span>
          <span className="text-[10px] font-semibold tracking-tight">Buscar</span>
        </Link>

        {/* Central Triider Action: Pedir Orçamento */}
        <Link
          to="/novo-pedido"
          className="press flex flex-col items-center -mt-4 px-2"
          aria-label="Pedir Orçamento Grátis"
        >
          <div className="relative flex size-12 items-center justify-center rounded-full bg-primary text-white shadow-md ring-4 ring-card hover:bg-brand-dark transition-all">
            <Plus size={22} strokeWidth={2.6} />
          </div>
          <span className="text-[10px] font-extrabold text-primary mt-0.5 tracking-tight">
            Pedir
          </span>
        </Link>

        {/* Pedidos */}
        <Link
          to="/pedidos"
          className={cn(
            "press flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors",
            pathname.startsWith("/pedidos") || pathname.startsWith("/pedido/")
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "grid h-7 w-11 place-items-center rounded-full transition-all duration-200",
              pathname.startsWith("/pedidos") || pathname.startsWith("/pedido/")
                ? "bg-accent text-primary"
                : "bg-transparent",
            )}
          >
            <ClipboardList size={18} strokeWidth={pathname.startsWith("/pedidos") ? 2.5 : 1.8} />
          </span>
          <span className="text-[10px] font-semibold tracking-tight">Pedidos</span>
        </Link>

        {/* Perfil */}
        <Link
          to="/perfil"
          className={cn(
            "press flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors",
            pathname.startsWith("/perfil") || pathname.startsWith("/carteira")
              ? "text-primary font-bold"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <span
            className={cn(
              "grid h-7 w-11 place-items-center rounded-full transition-all duration-200",
              pathname.startsWith("/perfil") || pathname.startsWith("/carteira")
                ? "bg-accent text-primary"
                : "bg-transparent",
            )}
          >
            <User size={18} strokeWidth={pathname.startsWith("/perfil") ? 2.5 : 1.8} />
          </span>
          <span className="text-[10px] font-semibold tracking-tight">Perfil</span>
        </Link>
      </div>
    </nav>
  );
}
