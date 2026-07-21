import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Shield, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store, useStore } from "@/lib/store";

export const Route = createFileRoute("/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira · KONEKTA" },
      { name: "description", content: "Gerir saldo e transações na KONEKTA." },
      { property: "og:title", content: "Carteira · KONEKTA" },
      { property: "og:description", content: "Pagamentos protegidos e transparentes." },
    ],
  }),
  component: WalletPage,
});

function formatDate(at: number) {
  const d = new Date(at);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400_000 && d.getDate() === now.getDate()) {
    return `Hoje, ${d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function WalletPage() {
  const balance = useStore((s) => s.balance);
  const transactions = useStore((s) => s.transactions);
  const [showTopUp, setShowTopUp] = useState(false);
  const [amount, setAmount] = useState("");

  function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return;
    store.topUp(Math.min(n, 100000));
    setAmount("");
    setShowTopUp(false);
  }

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
            {balance.toLocaleString("pt-PT")} <span className="text-lg text-primary-foreground/70">STN</span>
          </p>
          <div className="mt-5 flex gap-2 relative">
            <button
              onClick={() => setShowTopUp(true)}
              className="flex-1 bg-primary-foreground text-cocoa rounded-xl py-2.5 text-sm font-medium flex items-center justify-center gap-1.5"
            >
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
          <div key={t.id} className="flex items-center gap-3 bg-card ring-1 ring-border rounded-xl p-3">
            <div
              className={`size-9 rounded-full flex items-center justify-center ${
                t.kind === "in" ? "bg-ocean/10 text-ocean" : "bg-terracotta/10 text-terracotta"
              }`}
            >
              {t.kind === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{t.label}</p>
              <p className="text-xs text-muted-foreground">{formatDate(t.at)}</p>
            </div>
            <span className={`text-sm font-semibold ${t.kind === "in" ? "text-ocean" : "text-foreground"}`}>
              {t.kind === "in" ? "+" : "-"}
              {t.amount.toLocaleString("pt-PT")} STN
            </span>
          </div>
        ))}
      </section>

      {showTopUp && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
          onClick={() => setShowTopUp(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-3xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Carregar saldo</h3>
              <button onClick={() => setShowTopUp(false)} className="size-8 rounded-full bg-muted grid place-items-center">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleTopUp} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2500].map((v) => (
                  <button
                    type="button"
                    key={v}
                    onClick={() => setAmount(String(v))}
                    className="py-2 rounded-lg bg-muted text-sm font-medium"
                  >
                    {v} STN
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="text-xs font-medium text-muted-foreground">Valor personalizado (STN)</span>
                <input
                  type="number"
                  min={1}
                  max={100000}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="mt-1 w-full py-3 px-3 bg-surface ring-1 ring-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                />
              </label>
              <button
                type="submit"
                disabled={!amount || Number(amount) <= 0}
                className="w-full bg-terracotta text-primary-foreground rounded-xl py-3 font-semibold text-sm disabled:opacity-60"
              >
                Confirmar carregamento
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
