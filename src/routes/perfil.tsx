import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Settings,
  HelpCircle,
  Shield,
  Bell,
  LogOut,
  Star,
  Briefcase,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · KONEKTA" },
      { name: "description", content: "Gerir a sua conta KONEKTA." },
      { property: "og:title", content: "Perfil · KONEKTA" },
      { property: "og:description", content: "A sua conta na plataforma KONEKTA." },
    ],
  }),
  component: ProfilePage,
});

const menu = [
  { icon: Briefcase, label: "Tornar-se prestador", accent: true },
  { icon: Bell, label: "Notificações" },
  { icon: Shield, label: "Segurança e privacidade" },
  { icon: Settings, label: "Definições" },
  { icon: HelpCircle, label: "Ajuda e suporte" },
];

function ProfilePage() {
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);
  const favorites = useStore((s) => s.favorites);
  const navigate = useNavigate();

  const initial = user?.name?.charAt(0).toUpperCase() ?? "K";
  const memberYear = user ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();

  function handleSignOut() {
    store.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <header className="pt-8 pb-4 px-4">
        <h1 className="text-2xl font-semibold">Perfil</h1>
      </header>

      <section className="px-4">
        <div className="bg-card ring-1 ring-border rounded-2xl p-5 flex items-center gap-4">
          <div className="size-16 rounded-full bg-terracotta/15 grid place-items-center text-terracotta text-2xl font-semibold">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate">{user?.name ?? "Cliente KONEKTA"}</p>
            <p className="text-sm text-muted-foreground">+239 {user?.phone ?? ""}</p>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <Star size={12} className="fill-sun text-sun" />
              <span className="text-muted-foreground">Cliente desde {memberYear}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 mt-4 grid grid-cols-3 gap-2">
        {[
          { label: "Pedidos", value: orders.length },
          { label: "Favoritos", value: favorites.length },
          { label: "Avaliações", value: orders.filter((o) => o.status === "avaliado").length },
        ].map((s) => (
          <div key={s.label} className="bg-card ring-1 ring-border rounded-xl p-3 text-center">
            <p className="text-lg font-semibold text-terracotta">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </section>

      <section className="px-4 mt-6 space-y-1.5">
        {menu.map((m) => (
          <button
            key={m.label}
            className="w-full flex items-center gap-3 bg-card ring-1 ring-border rounded-xl p-4 text-left"
          >
            <div
              className={`size-9 rounded-lg flex items-center justify-center ${
                m.accent ? "bg-terracotta/10 text-terracotta" : "bg-muted text-muted-foreground"
              }`}
            >
              <m.icon size={16} />
            </div>
            <span className={`flex-1 text-sm ${m.accent ? "font-semibold text-terracotta" : "font-medium"}`}>
              {m.label}
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        ))}

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 rounded-xl p-4 text-left text-destructive mt-2"
        >
          <LogOut size={16} />
          <span className="text-sm font-medium">Terminar sessão</span>
        </button>
      </section>
    </AppShell>
  );
}
