import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatCard, EmptyState, BottomSheet, StatusPill } from "@/components/konekta/kit";
import { store, useStore } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { walletStateMeta } from "@/lib/states";

export const Route = createFileRoute("/pro/ganhos")({
  head: () => ({
    meta: [
      { title: "Ganhos · KONEKTA" },
      { name: "description", content: "Consulte os seus ganhos, comissões e levantamentos como prestador KONEKTA." },
      { property: "og:title", content: "Ganhos · KONEKTA" },
      { property: "og:description", content: "Carteira do prestador, independente da carteira de cliente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProEarnings,
});

function ProEarnings() {
  const balance = useStore((s) => s.providerBalance);
  const txs = useStore((s) => s.providerTransactions);
  const commission = useStore((s) => s.config.commissionPct);
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const state = balance <= 0 ? "sem_saldo" : "disponivel";
  const earned = txs.filter((t) => t.kind === "in").reduce((a, t) => a + t.amount, 0);

  function payout() {
    const value = Number(amount);
    if (!value || value > balance) {
      toast.error("Valor inválido");
      return;
    }
    store.requestPayout(value);
    setAmount("");
    setOpen(false);
  }

  return (
    <AppShell roles={["prestador"]}>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Ganhos</h1>
        <p className="text-sm text-muted-foreground">Carteira independente da sua carteira de cliente.</p>
      </header>

      <Section>
        <KCard className="bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-80">Saldo disponível</span>
            <StatusPill tone={walletStateMeta[state].tone}>{walletStateMeta[state].label}</StatusPill>
          </div>
          <p className="mt-2 text-3xl font-extrabold tracking-tight">{formatDb(balance)}</p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="press mt-4 min-h-12 w-full rounded-full bg-primary-foreground text-sm font-bold text-primary"
          >
            Solicitar levantamento
          </button>
        </KCard>
      </Section>

      <Section>
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Total ganho" value={formatDb(earned)} tone="success" icon={<TrendingUp size={15} />} />
          <StatCard label="Comissão KONEKTA" value={`${commission}%`} tone="warning" />
        </div>
      </Section>

      <Section title="Movimentos" className="space-y-3 pb-10">
        {txs.length === 0 ? (
          <EmptyState title="Ainda sem movimentos" description="Os pagamentos dos seus serviços aparecem aqui." />
        ) : (
          txs.map((t) => (
            <KCard key={t.id} className="flex items-center gap-3">
              <span
                className={`grid size-10 place-items-center rounded-xl ${
                  t.kind === "in" ? "bg-success/12 text-success" : "bg-muted text-muted-foreground"
                }`}
              >
                {t.kind === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{t.label}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(t.at).toLocaleDateString("pt-PT")}
                </p>
              </div>
              <span className={`text-sm font-bold ${t.kind === "in" ? "text-success" : "text-foreground"}`}>
                {t.kind === "in" ? "+" : "−"}
                {formatDb(t.amount)}
              </span>
            </KCard>
          ))
        )}
      </Section>

      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Solicitar levantamento"
        description={`Disponível: ${formatDb(balance)}`}
      >
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="numeric"
          placeholder="Valor em Db"
          className="min-h-12 w-full rounded-2xl bg-muted px-4 text-sm outline-none ring-1 ring-transparent focus:ring-primary"
        />
        <button
          type="button"
          onClick={payout}
          className="press min-h-12 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground"
        >
          Confirmar
        </button>
      </BottomSheet>
    </AppShell>
  );
}
