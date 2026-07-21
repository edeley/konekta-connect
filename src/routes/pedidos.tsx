import { createFileRoute, Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { orders, getProvider, statusLabel } from "@/lib/konekta-data";

export const Route = createFileRoute("/pedidos")({
  head: () => ({
    meta: [
      { title: "Meus Pedidos · KONEKTA" },
      { name: "description", content: "Acompanhe os seus pedidos de serviço na KONEKTA." },
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

function OrdersPage() {
  return (
    <AppShell>
      <header className="pt-8 pb-4 px-4">
        <h1 className="text-2xl font-semibold">Meus Pedidos</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe todos os seus serviços</p>
      </header>

      <div className="px-4 flex gap-2 mb-4">
        {["Ativos", "Concluídos", "Todos"].map((t, i) => (
          <button
            key={t}
            className={`px-4 py-1.5 rounded-full text-sm font-medium ring-1 ${
              i === 0 ? "bg-cocoa text-primary-foreground ring-transparent" : "bg-card ring-border"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <section className="px-4 space-y-3">
        {orders.map((o) => {
          const p = getProvider(o.providerId);
          return (
            <Link
              key={o.id}
              to="/prestador/$id"
              params={{ id: o.providerId }}
              className="block bg-card rounded-2xl ring-1 ring-border p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  {p && (
                    <img
                      src={p.image}
                      alt={p.name}
                      className="size-12 rounded-xl object-cover"
                    />
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
              </div>

              <div className="mt-3 pt-3 border-t border-border flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="font-semibold text-terracotta">{o.total} STN</span>
              </div>

              {o.status === "concluido" && (
                <button className="mt-3 w-full py-2 rounded-lg bg-sun/15 text-sun font-medium text-sm flex items-center justify-center gap-1.5">
                  <Star size={14} /> Avaliar serviço
                </button>
              )}
            </Link>
          );
        })}
      </section>
    </AppShell>
  );
}
