import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Settings,
  HelpCircle,
  Shield,
  Bell,
  LogOut,
  Star,
  Briefcase,
  Sparkles,
  Clock,
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

function ProfilePage() {
  const user = useStore((s) => s.user);
  const profile = useStore((s) => s.providerProfile);
  const orders = useStore((s) => s.orders);
  const favorites = useStore((s) => s.favorites);
  const navigate = useNavigate();

  const initial = user?.name?.charAt(0).toUpperCase() ?? "K";
  const memberYear = user ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();
  const isProvider = user?.role === "prestador";

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
          <div className="size-16 rounded-full bg-terracotta/15 grid place-items-center text-terracotta text-2xl font-semibold overflow-hidden">
            {user?.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-lg truncate">{user?.name ?? "Cliente KONEKTA"}</p>
            <p className="text-sm text-muted-foreground">+239 {user?.phone ?? ""}</p>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <Star size={12} className="fill-sun text-sun" />
              <span className="text-muted-foreground">
                {isProvider ? "Prestador" : "Cliente"} desde {memberYear}
              </span>
            </div>
          </div>
        </div>
      </section>

      {isProvider && profile && (
        <section className="px-4 mt-4">
          <div className={`rounded-2xl p-4 ring-1 flex items-center gap-3 ${
            profile.status === "em_analise" ? "bg-sun/10 ring-sun/30" : "bg-ocean/10 ring-ocean/30"
          }`}>
            <div className={`size-10 rounded-lg grid place-items-center ${
              profile.status === "em_analise" ? "bg-sun/20 text-sun" : "bg-ocean/20 text-ocean"
            }`}>
              <Clock size={18} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">
                {profile.status === "em_analise" ? "Perfil em análise" : "Perfil aprovado"}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile.status === "em_analise"
                  ? "Iremos avisar quando estiver aprovado (24-48h)."
                  : "Pode começar a receber pedidos."}
              </p>
            </div>
          </div>
        </section>
      )}

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
        <Link
          to="/assistente"
          className="w-full flex items-center gap-3 bg-card ring-1 ring-border rounded-xl p-4 text-left"
        >
          <div className="size-9 rounded-lg bg-gradient-to-br from-terracotta to-cocoa text-primary-foreground flex items-center justify-center">
            <Sparkles size={16} />
          </div>
          <span className="flex-1 text-sm font-medium">Assistente KONEKTA</span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>

        {!isProvider && (
          <Link
            to="/auth"
            className="w-full flex items-center gap-3 bg-card ring-1 ring-border rounded-xl p-4 text-left"
          >
            <div className="size-9 rounded-lg bg-terracotta/10 text-terracotta flex items-center justify-center">
              <Briefcase size={16} />
            </div>
            <span className="flex-1 text-sm font-semibold text-terracotta">Tornar-se prestador</span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </Link>
        )}

        {[
          { icon: Bell, label: "Notificações" },
          { icon: Shield, label: "Segurança e privacidade" },
          { icon: Settings, label: "Definições" },
          { icon: HelpCircle, label: "Ajuda e suporte" },
        ].map((m) => (
          <button
            key={m.label}
            className="w-full flex items-center gap-3 bg-card ring-1 ring-border rounded-xl p-4 text-left"
          >
            <div className="size-9 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
              <m.icon size={16} />
            </div>
            <span className="flex-1 text-sm font-medium">{m.label}</span>
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
