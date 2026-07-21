import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MessageCircle, Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { getProvider, statusLabel } from "@/lib/konekta-data";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus Pedidos · KONEKTA" },
      { name: "description", content: "Acompanhe os seus pedidos de serviço na KONEKTA." },
      { property: "og:title", content: "Meus Pedidos · KONEKTA" },
      { property: "og:description", content: "Acompanhe os seus pedidos em tempo real." },
    ],
  }),
  component: OrdersPage,
});

const statusTone: Record<string, string> = {
  "a-caminho": "bg-ocean/10 text-ocean",
  aceite: "bg-sun/15 text-sun",
  concluido: "bg-muted text-muted-foreground",
  pendente: "bg-terracotta/10 text-terracotta",
  "em-execucao": "bg-ocean/10 text-ocean",
  avaliado: "bg-muted text-muted-foreground",
};

const tabs = ["Ativos", "Concluídos", "Todos"] as const;
type Tab = (typeof tabs)[number];

function OrdersPage() {
  const orders = useStore((s) => s.orders);
  const [tab, setTab] = useState<Tab>("Ativos");

  const visible = orders.filter((o) => {
    if (tab === "Todos") return true;
    if (tab === "Concluídos") return o.status === "concluido" || o.status === "avaliado";
    return o.status !== "concluido" && o.status !== "avaliado";
  });

  return (
    <AppShell>
      <header className="pt-8 pb-4 px-4">
        <h1 className="text-2xl font-semibold">Meus Pedidos</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe todos os seus serviços</p>
      </header>

      <div className="px-4 flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ring-1 transition ${
              tab === t ? "bg-cocoa text-primary-foreground ring-transparent" : "bg-card ring-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <section className="px-4 space-y-3">
        {visible.length === 0 && (
          <div className="bg-card ring-1 ring-border rounded-2xl p-8 text-center">
            <p className="text-sm font-medium">Sem pedidos {tab.toLowerCase()}</p>
            <Link to="/" className="mt-3 inline-block text-terracotta text-sm font-medium">
              Explorar prestadores
            </Link>
          </div>
        )}

        {visible.map((o) => {
          const p = getProvider(o.providerId);
          return (
            <div key={o.id} className="bg-card rounded-2xl ring-1 ring-border p-4">
              <Link
                to="/prestador/$id"
                params={{ id: o.providerId }}
                className="flex justify-between items-start"
              >
                <div className="flex items-center gap-3">
                  {p && (
                    <img src={p.image} alt={p.name} className="size-12 rounded-xl object-cover" />
                  )}
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">{o.id}</p>
                    <p className="font-medium text-sm mt-0.5">{o.service}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p?.name} · {o.scheduledFor}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full ${
                    statusTone[o.status]
                  }`}
                >
                  {statusLabel[o.status]}
                </span>
              </Link>

              <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="font-semibold text-terracotta">{o.total} STN</span>
              </div>

              <div className="mt-3 flex gap-2">
                <Link
                  to="/chat/$id"
                  params={{ id: o.providerId }}
                  className="flex-1 py-2 rounded-lg bg-muted text-foreground font-medium text-sm flex items-center justify-center gap-1.5"
                >
                  <MessageCircle size={14} /> Mensagem
                </Link>
                {o.status === "concluido" && (
                  <button className="flex-1 py-2 rounded-lg bg-sun/15 text-sun font-medium text-sm flex items-center justify-center gap-1.5">
                    <Star size={14} /> Avaliar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>
    </AppShell>
  );
}
