import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Settings,
  HelpCircle,
  Shield,
  Bell,
  LogOut,
  Briefcase,
  Sparkles,
  UserCog,
  BadgeCheck,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill, ListRow } from "@/components/konekta/kit";
import { ProfileSwitcher } from "@/components/konekta/ProfileSwitcher";
import { store, useStore } from "@/lib/store";
import { documentStateMeta } from "@/lib/states";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · KONEKTA" },
      { name: "description", content: "Gerir a sua conta KONEKTA: perfil de cliente, perfil de prestador, segurança e definições." },
      { property: "og:title", content: "Perfil · KONEKTA" },
      { property: "og:description", content: "Uma conta, dois perfis: Cliente e Prestador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useStore((s) => s.user);
  const profiles = useStore((s) => s.profiles);
  const profile = useStore((s) => s.providerProfile);
  const orders = useStore((s) => s.orders);
  const favorites = useStore((s) => s.favorites);
  const navigate = useNavigate();

  const initial = user?.name?.charAt(0).toUpperCase() ?? "K";
  const memberYear = user ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();
  const isProvider = user?.role === "prestador";
  const docState = !profile
    ? "nao_enviado"
    : profile.status === "aprovado"
      ? "verificado"
      : profile.status === "rejeitado"
        ? "rejeitado"
        : "em_analise";

  function handleSignOut() {
    store.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Perfil</h1>
        <p className="text-sm text-muted-foreground">Uma conta, dois perfis independentes.</p>
      </header>

      <Section>
        <KCard className="flex items-center gap-4">
          <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-2xl font-bold text-accent-foreground">
            {user?.avatar ? <img src={user.avatar} alt="" className="size-full object-cover" /> : initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{user?.name ?? "Cliente KONEKTA"}</p>
            <p className="text-sm text-muted-foreground">+239 {user?.phone ?? ""}</p>
            <p className="mt-1 text-xs text-muted-foreground">Membro desde {memberYear}</p>
          </div>
        </KCard>

        <div className="mt-3 flex items-center justify-between gap-3">
          <ProfileSwitcher />
          {profiles.prestador && (
            <StatusPill tone={documentStateMeta[docState].tone}>
              {documentStateMeta[docState].label}
            </StatusPill>
          )}
        </div>
      </Section>

      {isProvider && profile && profile.status !== "aprovado" && (
        <Section>
          <KCard className="flex items-center gap-3 bg-warning/10">
            <span className="grid size-10 place-items-center rounded-xl bg-warning/20 text-warning">
              <BadgeCheck size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Conta em análise</p>
              <p className="text-xs text-muted-foreground">
                Só poderá receber pedidos após a aprovação dos documentos (24–48h).
              </p>
            </div>
            <button
              type="button"
              onClick={() => store.approveProviderProfile()}
              className="press shrink-0 rounded-full bg-primary px-3 py-2 text-[11px] font-semibold text-primary-foreground"
            >
              Simular
            </button>
          </KCard>
        </Section>
      )}

      <Section>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Pedidos", value: orders.length },
            { label: "Favoritos", value: favorites.length },
            { label: "Avaliações", value: orders.filter((o) => o.status === "avaliado").length },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card p-3 text-center shadow-soft">
              <p className="text-lg font-extrabold text-primary">{s.value}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Conta" className="space-y-2 pb-10">
        <ListRow
          to="/assistente"
          icon={<Sparkles size={18} />}
          title="Assistente KONEKTA"
          subtitle="Ajuda inteligente para os seus pedidos"
          right={<ChevronRight size={16} className="text-muted-foreground" />}
        />

        {!profiles.prestador && (
          <Link
            to="/tornar-prestador"
            className="press flex min-h-14 w-full items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-soft"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary-foreground/15">
              <Briefcase size={18} />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-bold">Quero também prestar serviços</span>
              <span className="block text-xs opacity-80">Ative o perfil Prestador na mesma conta</span>
            </span>
            <ChevronRight size={16} />
          </Link>
        )}

        {profiles.prestador && (
          <ListRow
            to="/pro"
            icon={<Briefcase size={18} />}
            title="Perfil profissional"
            subtitle={profile?.category ?? "Prestador KONEKTA"}
            right={<ChevronRight size={16} className="text-muted-foreground" />}
          />
        )}

        <ListRow icon={<UserCog size={18} />} title="Editar conta" subtitle="Nome, foto, e-mail" right={<ChevronRight size={16} className="text-muted-foreground" />} />
        <ListRow icon={<Bell size={18} />} title="Notificações" right={<ChevronRight size={16} className="text-muted-foreground" />} />
        <ListRow icon={<Shield size={18} />} title="Segurança e privacidade" subtitle="PIN, sessões, biometria" right={<ChevronRight size={16} className="text-muted-foreground" />} />
        <ListRow icon={<Settings size={18} />} title="Definições" right={<ChevronRight size={16} className="text-muted-foreground" />} />
        <ListRow icon={<HelpCircle size={18} />} title="Ajuda e suporte" right={<ChevronRight size={16} className="text-muted-foreground" />} />

        <button
          onClick={handleSignOut}
          className="press mt-2 flex min-h-12 w-full items-center gap-3 rounded-2xl p-4 text-left text-destructive"
        >
          <LogOut size={18} />
          <span className="text-sm font-semibold">Terminar sessão</span>
        </button>
      </Section>
    </AppShell>
  );
}
