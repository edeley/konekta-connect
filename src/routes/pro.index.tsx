import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, ChevronRight, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore } from "@/lib/store";
import { getProvider } from "@/lib/konekta-data";

export const Route = createFileRoute("/pro/")({
  head: () => ({
    meta: [
      { title: "Painel do prestador — KONEKTA STP" },
      {
        name: "description",
        content:
          "Acompanhe os seus ganhos, próximos pedidos e avaliações como prestador de serviços na KONEKTA STP.",
      },
      { property: "og:title", content: "Painel do prestador — KONEKTA" },
      { property: "og:description", content: "Ganhos, pedidos e agenda num só painel." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProHome,
});

function ProHome() {
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);
  const providerBalance = useStore((s) => s.providerBalance);
  const status = useStore((s) => s.providerProfile?.status);

  const today = orders.filter((o) => o.status !== "concluido" && o.status !== "avaliado");
  const done = orders.filter((o) => o.status === "concluido" || o.status === "avaliado");
  const earnedToday = today.reduce((a, o) => a + o.total, 0) || providerBalance;
  const firstName = user?.name?.split(" ")[0] ?? "Prestador";

  return (
    <AppShell>
      <header className="rounded-b-3xl bg-success px-5 pb-7 pt-7 text-success-foreground">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-success-foreground/80">Olá,</p>
            <h1 className="text-2xl font-extrabold leading-tight">{firstName}! 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-success-foreground/15 px-3 py-1 text-[11px] font-semibold">
              {status === "aprovado" ? "Disponível" : "Em análise"}
            </span>
            <Link
              to="/notificacoes"
              aria-label="Notificações"
              className="grid size-9 place-items-center rounded-full bg-success-foreground/15"
            >
              <Bell size={17} />
            </Link>
          </div>
        </div>

        <div className="mt-5 rounded-2xl bg-success-foreground/12 p-4">
          <p className="text-[11px] text-success-foreground/85">Ganhos hoje</p>
          <p className="text-3xl font-extrabold">{earnedToday.toLocaleString("pt-PT")} STN</p>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-3 gap-3 px-5">
        {[
          { v: today.length, l: "Pedidos hoje" },
          { v: done.length, l: "Concluídos" },
          { v: "4.8", l: "Avaliação" },
        ].map((s) => (
          <div key={s.l} className="rounded-2xl bg-card p-3 text-center ring-1 ring-border">
            <p className="text-lg font-extrabold">{s.v}</p>
            <p className="text-[10px] text-muted-foreground">{s.l}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 px-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Próximos pedidos</h2>
          <Link to="/pro/pedidos" className="text-xs font-semibold text-success">
            Ver todos
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {today.length === 0 && (
            <p className="rounded-2xl bg-card p-6 text-center text-sm text-muted-foreground ring-1 ring-border">
              Sem pedidos agendados.
            </p>
          )}
          {today.map((o) => {
            const p = getProvider(o.providerId);
            return (
              <Link
                key={o.id}
                to="/pedido/$id"
                params={{ id: o.id }}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-border"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{o.service}</p>
                  <p className="text-xs text-muted-foreground">
                    {p?.category ?? "Serviço"} · {o.scheduledFor}
                  </p>
                </div>
                <span className="text-sm font-bold text-success">
                  {o.total.toLocaleString("pt-PT")} STN
                </span>
                <ChevronRight size={16} className="text-muted-foreground" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-5 px-5">
        <Link
          to="/pro/ganhos"
          className="flex items-center gap-2 rounded-2xl bg-success/10 p-4 text-sm font-semibold text-success ring-1 ring-success/20"
        >
          <TrendingUp size={16} /> Nível Ouro — continue assim para alcançar Platina
        </Link>
      </section>
    </AppShell>
  );
}
