import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill, EmptyState } from "@/components/konekta/kit";
import { store, useStore } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { orderStateMeta } from "@/lib/states";

export const Route = createFileRoute("/pro/pedidos")({
  head: () => ({
    meta: [
      { title: "Pedidos recebidos · KONEKTA" },
      { name: "description", content: "Aceite, execute e conclua os pedidos dos seus clientes na KONEKTA." },
      { property: "og:title", content: "Pedidos recebidos · KONEKTA" },
      { property: "og:description", content: "Gestão de pedidos do prestador KONEKTA." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProOrders,
});

const tabs = [
  { key: "novos", label: "Novos" },
  { key: "ativos", label: "Ativos" },
  { key: "historico", label: "Histórico" },
] as const;

function ProOrders() {
  const orders = useStore((s) => s.orders);
  const profile = useStore((s) => s.providerProfile);
  const [tab, setTab] = useState<(typeof tabs)[number]["key"]>("novos");

  const filtered = orders.filter((o) =>
    tab === "novos"
      ? o.status === "pendente"
      : tab === "ativos"
        ? ["aceite", "a-caminho", "em-execucao"].includes(o.status)
        : ["concluido", "avaliado"].includes(o.status),
  );

  return (
    <AppShell roles={["prestador"]}>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Pedidos recebidos</h1>
        <p className="text-sm text-muted-foreground">Histórico separado do seu perfil de cliente.</p>
      </header>

      <Section>
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`press min-h-10 flex-1 rounded-full px-3 text-xs font-semibold transition-colors ${
                tab === t.key ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground shadow-soft"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Section>

      <Section className="space-y-3 pb-10">
        {filtered.length === 0 ? (
          <EmptyState title="Sem pedidos nesta lista" description="Novos pedidos aparecem aqui em tempo real." />
        ) : (
          filtered.map((o) => {
            const meta = orderStateMeta[o.status];
            return (
              <KCard key={o.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{o.service}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.id} · {o.clientName ?? "Cliente"} · {o.scheduledFor}
                    </p>
                  </div>
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{meta.message}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-extrabold text-primary">{formatDb(o.total)}</span>
                  {!["concluido", "avaliado"].includes(o.status) && (
                    <button
                      type="button"
                      disabled={profile?.status !== "aprovado"}
                      onClick={() => {
                        store.advanceOrder(o.id);
                        if (o.status === "em-execucao") {
                          const net = store.addEarning(`Serviço ${o.id}`, o.total);
                          toast.success(`Serviço concluído · +${formatDb(net ?? 0)}`);
                        } else {
                          toast.success("Estado do pedido atualizado");
                        }
                      }}
                      className="press min-h-10 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground disabled:opacity-50"
                    >
                      {o.status === "pendente" ? "Aceitar" : "Avançar estado"}
                    </button>
                  )}
                </div>
              </KCard>
            );
          })
        )}
      </Section>
    </AppShell>
  );
}
