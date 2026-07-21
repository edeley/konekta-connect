import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Plus, Shield } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira · KONEKTA" },
      { name: "description", content: "Gerir saldo e transações na KONEKTA." },
    ],
  }),
  component: WalletPage,
});

const transactions = [
  { id: 1, kind: "out", label: "Pagamento — Edmilson Varela", date: "Hoje, 14:20", amount: 450 },
  { id: 2, kind: "in", label: "Carregamento de saldo", date: "Ontem", amount: 1000 },
  { id: 3, kind: "out", label: "Pagamento — Maria Santos", date: "12 Nov", amount: 550 },
  { id: 4, kind: "in", label: "Reembolso KNK-1015", date: "10 Nov", amount: 200 },
];

function WalletPage() {
  return (
    <AppShell>
      <header className="pt-8 pb-4 px-4">
        <h1 className="text-2xl font-semibold">Carteira</h1>
      </header>

      <section className="px-4">
        <div className="bg-cocoa text-primary-foreground rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-40 bg-terracotta/30 blur-3xl rounded-full" />
          <p className="text-[11px] uppercase tracking-widest text-primary-foreground/60">
            Saldo disponível
          </p>
          <p className="text-4xl font-semibold mt-2">
            1.850 <span className="text-lg text-primary-foreground/70">STN</span>
          </p>
          <div className="mt-5 flex gap-2 relative">
            <button className="flex-1 bg-primary-foreground text-cocoa rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5">
              <Plus size={16} /> Carregar
            </button>
            <button className="flex-1 bg-primary-foreground/10 backdrop-blur text-primary-foreground rounded-xl py-2.5 text-sm font-medium ring-1 ring-primary-foreground/20">
              Levantar
            </button>
          </div>
        </div>
      </section>

      <section className="px-4 mt-4">
        <div className="bg-ocean/10 rounded-2xl p-4 flex gap-3">
          <Shield size={20} className="text-ocean shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground">Pagamentos protegidos</p>
            <p className="text-muted-foreground text-xs mt-0.5">
              O dinheiro fica retido até confirmar a conclusão do serviço.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 mt-6 space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Transações
        </h2>
        {transactions.map((t) => (
          <div
            key={t.id}
            className="flex items-center gap-3 bg-card ring-1 ring-border rounded-xl p-3"
          >
            <div
              className={`size-9 rounded-full flex items-center justify-center ${
                t.kind === "in" ? "bg-ocean/10 text-ocean" : "bg-terracotta/10 text-terracotta"
              }`}
            >
              {t.kind === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.label}</p>
              <p className="text-xs text-muted-foreground">{t.date}</p>
            </div>
            <span
              className={`text-sm font-semibold ${
                t.kind === "in" ? "text-ocean" : "text-foreground"
              }`}
            >
              {t.kind === "in" ? "+" : "-"}
              {t.amount} STN
            </span>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
