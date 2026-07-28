import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ClipboardList, Star, TrendingUp, Wallet, Power } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatCard, StatusPill, EmptyState } from "@/components/konekta/kit";
import { ProfileSwitcher } from "@/components/konekta/ProfileSwitcher";
import { useStore } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { orderStateMeta } from "@/lib/states";

export const Route = createFileRoute("/pro/")({
  head: () => ({
    meta: [
      { title: "Painel do prestador · KONEKTA" },
      { name: "description", content: "Acompanhe pedidos recebidos, ganhos e desempenho do seu negócio na KONEKTA." },
      { property: "og:title", content: "Painel do prestador · KONEKTA" },
      { property: "og:description", content: "Pedidos, agenda e ganhos num só painel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProDashboard,
});

function ProDashboard() {
  const user = useStore((s) => s.user);
  const profile = useStore((s) => s.providerProfile);
  const orders = useStore((s) => s.orders);
  const providerBalance = useStore((s) => s.providerBalance);
  const approved = profile?.status === "aprovado";
  const active = orders.filter((o) => o.status !== "avaliado");

  return (
    <AppShell roles={["prestador"]}>
      <header className="px-5 pb-2 pt-8">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">Bom trabalho,</p>
            <h1 className="truncate text-2xl font-extrabold tracking-tight">{user?.name ?? "Prestador"}</h1>
          </div>
          <StatusPill tone={approved ? "success" : "warning"}>
            <Power size={12} /> {approved ? "Disponível" : "Em análise"}
          </StatusPill>
        </div>
        <div className="mt-3">
          <ProfileSwitcher />
        </div>
      </header>

      {!approved && (
        <Section>
          <KCard className="bg-warning/10">
            <p className="text-sm font-semibold">Conta em análise</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Só pode receber pedidos depois da aprovação dos documentos. Entretanto pode preparar os
              seus serviços e disponibilidade.
            </p>
          </KCard>
        </Section>
      )}

      <Section>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Ganhos disponíveis" value={formatDb(providerBalance)} tone="success" icon={<Wallet size={15} />} />
          <StatCard label="Pedidos ativos" value={String(active.length)} icon={<ClipboardList size={15} />} />
          <StatCard label="Avaliação" value="4.9" tone="warning" icon={<Star size={15} />} />
          <StatCard label="Taxa de aceitação" value="96%" icon={<TrendingUp size={15} />} />
        </div>
      </Section>

      <Section
        title="Pedidos recebidos"
        action={
          <Link to="/pro/pedidos" className="text-xs font-semibold text-primary">
            Ver todos
          </Link>
        }
      >
        {active.length === 0 ? (
          <EmptyState title="Sem pedidos por agora" description="Assim que um cliente o contratar, aparece aqui." />
        ) : (
          <ul className="space-y-3">
            {active.slice(0, 3).map((o) => {
              const meta = orderStateMeta[o.status];
              return (
                <KCard as="li" key={o.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{o.service}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.clientName ?? "Cliente"} · {o.scheduledFor}
                      </p>
                    </div>
                    <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{meta.message}</p>
                  <p className="mt-2 text-sm font-extrabold text-primary">{formatDb(o.total)}</p>
                </KCard>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Atalhos" className="grid grid-cols-2 gap-3 pb-10">
        <Link to="/pro/agenda" className="press rounded-2xl bg-card p-4 shadow-soft">
          <CalendarDays size={18} className="text-primary" />
          <p className="mt-2 text-sm font-semibold">Agenda</p>
          <p className="text-xs text-muted-foreground">Gerir disponibilidade</p>
        </Link>
        <Link to="/pro/ganhos" className="press rounded-2xl bg-card p-4 shadow-soft">
          <TrendingUp size={18} className="text-success" />
          <p className="mt-2 text-sm font-semibold">Ganhos</p>
          <p className="text-xs text-muted-foreground">Carteira do prestador</p>
        </Link>
      </Section>
    </AppShell>
  );
}
