import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Shield,
  X,
  Building,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";
import { payoutLabel } from "@/lib/escrow";
import { KonektaCalculator } from "@/components/konekta/KonektaCalculator";

export const Route = createFileRoute("/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira & Pagamentos · KONEKTA STP" },
      {
        name: "description",
        content: "Gerir saldo, recargas e transações protegidas na KONEKTA São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Carteira · KONEKTA" },
      {
        property: "og:description",
        content: "Pagamentos protegidos e transparentes em Dobras (STN).",
      },
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
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STP_BANKS = [
  "BISTP (Banco Internacional de São Tomé e Príncipe)",
  "BGFI Bank São Tomé e Príncipe",
  "Afriland First Bank STP",
  "Caixa Geral de Depósitos STP",
  "Levantamento em Dinheiro num Agente KONEKTA",
];

function WalletPage() {
  const balance = useStore((s) => s.balance);
  const transactions = useStore((s) => s.transactions);
  const orders = useStore((s) => s.orders);

  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Top-Up Form State
  const [topUpMethod, setTopUpMethod] = useState<"dobrapay" | "transferencia" | "agente">(
    "dobrapay",
  );
  const [topUpAmount, setTopUpAmount] = useState("");

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBank, setWithdrawBank] = useState(STP_BANKS[0]);
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawName, setWithdrawName] = useState("");

  // Calculate active escrow in orders
  const escrowAmount = orders
    .filter((o) => ["pendente", "aceite", "a-caminho", "em-execucao"].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);

  function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(topUpAmount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    store.topUp(Math.min(n, 100000));
    setTopUpAmount("");
    setShowTopUp(false);
    toast.success(`Carregamento de ${n.toLocaleString("pt-PT")} STN efetuado com sucesso!`);
  }

  function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(withdrawAmount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    if (n > balance) {
      toast.error("Saldo insuficiente para efetuar este levantamento");
      return;
    }
    if (!withdrawAccount.trim()) {
      toast.error("Preencha o número de conta bancária ou NIB");
      return;
    }

    const success = store.withdraw(n);
    if (success) {
      toast.success(
        `Pedido de levantamento de ${n.toLocaleString("pt-PT")} STN registado para ${withdrawBank}.`,
        { description: payoutLabel() },
      );
      setWithdrawAmount("");
      setWithdrawAccount("");
      setShowWithdraw(false);
    } else {
      toast.error("Não foi possível processar o levantamento.");
    }
  }

  return (
    <AppShell>
      <header className="pt-7 pb-3 px-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Carteira KONEKTA</h1>
          <p className="text-xs text-muted-foreground font-medium">
            Pagamentos locais seguros em São Tomé e Príncipe
          </p>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Como funciona o pagamento seguro"
        >
          <HelpCircle size={18} />
        </button>
      </header>

      {/* Card Principal da Carteira */}
      <section className="px-5 mt-2">
        <div className="bg-primary text-primary-foreground rounded-3xl p-5.5 relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-primary-foreground/75 font-bold">
              Saldo Disponível
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] bg-primary-foreground/20 px-2 py-0.5 rounded-full font-semibold">
              <Shield size={11} />
              Protegido
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <p className="text-4xl font-black tracking-tight">{balance.toLocaleString("pt-PT")}</p>
            <span className="text-lg font-bold text-primary-foreground/80">STN (Dobras)</span>
          </div>

          {escrowAmount > 0 && (
            <div className="mt-3 py-2 px-3 rounded-xl bg-black/20 text-xs flex items-center justify-between">
              <span className="text-primary-foreground/80 flex items-center gap-1.5">
                <Clock size={12} />
                Em custódia (serviços a decorrer):
              </span>
              <span className="font-bold">{escrowAmount.toLocaleString("pt-PT")} STN</span>
            </div>
          )}

          <div className="mt-5 flex gap-2.5 relative">
            <button
              onClick={() => setShowTopUp(true)}
              className="flex-1 bg-white text-primary rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform"
            >
              <Plus size={16} /> Carregar Saldo
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={balance <= 0}
              className="flex-1 bg-primary-foreground/15 hover:bg-primary-foreground/25 backdrop-blur text-primary-foreground rounded-xl py-3 text-xs font-bold border border-primary-foreground/20 active:scale-98 transition-transform disabled:opacity-50"
            >
              Levantar Saldo
            </button>
          </div>
        </div>
      </section>

      {/* Explicação de Custódia e Segurança */}
      <section className="px-5 mt-4">
        <div className="bg-card border border-emerald-500/30 rounded-2xl p-4 flex gap-3 shadow-2xs">
          <Shield size={20} className="text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-foreground">Como funciona a Custódia KONEKTA?</p>
            <p className="text-muted-foreground mt-0.5 leading-relaxed text-[11px]">
              Quando solicita um serviço, o valor fica retido na plataforma em segurança. O
              profissional só recebe o pagamento após a sua aprovação final.
            </p>
          </div>
        </div>
      </section>

      {/* Calculadora KONEKTA Interativa */}
      <section className="px-5 mt-4">
        <KonektaCalculator
          initialTotal={500}
          editable={true}
          isClientView={true}
          showSubtitle={true}
        />
      </section>

      {/* Histórico de Transações */}
      <section className="px-5 mt-6 pb-8 space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Extrato de Movimentos
          </h2>
          <span className="text-[11px] text-muted-foreground font-medium">
            {transactions.length} transações
          </span>
        </div>

        {transactions.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-6 text-center text-xs text-muted-foreground">
            Sem transações registadas até ao momento.
          </div>
        ) : (
          transactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 bg-card border border-border/80 rounded-2xl p-3.5 shadow-2xs"
            >
              <div
                className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                  t.kind === "in"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}
              >
                {t.kind === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{t.label}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{formatDate(t.at)}</p>
              </div>
              <span
                className={`text-xs font-black shrink-0 ${
                  t.kind === "in" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                }`}
              >
                {t.kind === "in" ? "+" : "-"}
                {t.amount.toLocaleString("pt-PT")} STN
              </span>
            </div>
          ))
        )}
      </section>

      {/* Modal de Carregamento */}
      {showTopUp && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowTopUp(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto border border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Carregar Carteira</h3>
                <p className="text-xs text-muted-foreground">
                  Adicione saldo em Dobras de São Tomé (STN)
                </p>
              </div>
              <button
                onClick={() => setShowTopUp(false)}
                className="size-8 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            {/* Opções de Método */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Método de Carregamento</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTopUpMethod("dobrapay")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col gap-1 transition-all ${
                    topUpMethod === "dobrapay"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <CreditCard size={16} />
                  <span>DobraPay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTopUpMethod("transferencia")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col gap-1 transition-all ${
                    topUpMethod === "transferencia"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Building size={16} />
                  <span>BISTP / BGFI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTopUpMethod("agente")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col gap-1 transition-all ${
                    topUpMethod === "agente"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Banknote size={16} />
                  <span>Agente Local</span>
                </button>
              </div>
            </div>

            {topUpMethod === "transferencia" && (
              <div className="p-3 rounded-2xl bg-muted/60 text-[11px] space-y-1 text-muted-foreground border border-border">
                <p className="font-bold text-foreground">Coordenadas Bancárias KONEKTA STP:</p>
                <p>
                  <strong>Banco:</strong> BISTP · NIB: 0001.0000.12345678901.23
                </p>
                <p>
                  <strong>Beneficiário:</strong> Konekta Serviços Lda
                </p>
                <p className="text-[10px] text-amber-700 font-semibold">
                  O saldo é creditado instantaneamente após confirmação.
                </p>
              </div>
            )}

            <form onSubmit={handleTopUp} className="space-y-3 pt-1">
              <div>
                <span className="text-xs font-bold text-foreground">Valores Rápidos</span>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {[250, 500, 1000, 2500, 5000, 10000].map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setTopUpAmount(String(v))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                        topUpAmount === String(v)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted hover:bg-muted/80 text-foreground border-border"
                      }`}
                    >
                      {v.toLocaleString("pt-PT")} STN
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-foreground">
                  Ou digite o valor personalizado (STN)
                </span>
                <input
                  type="number"
                  min={50}
                  max={100000}
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Ex: 750"
                  className="mt-1 w-full py-2.5 px-3.5 bg-card border border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-primary"
                />
              </label>

              <button
                type="submit"
                disabled={!topUpAmount || Number(topUpAmount) <= 0}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-bold text-xs shadow-sm hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
              >
                Confirmar Carregamento (
                {topUpAmount ? `${Number(topUpAmount).toLocaleString("pt-PT")} STN` : ""})
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Levantamento */}
      {showWithdraw && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowWithdraw(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto border border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Levantar Saldo</h3>
                <p className="text-xs text-muted-foreground">
                  Transferência direta para conta bancária em STP
                </p>
              </div>
              <button
                onClick={() => setShowWithdraw(false)}
                className="size-8 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Banco de Destino em São Tomé
                </label>
                <select
                  value={withdrawBank}
                  onChange={(e) => setWithdrawBank(e.target.value)}
                  className="w-full py-2.5 px-3 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                >
                  {STP_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Nome do Titular da Conta
                </label>
                <input
                  type="text"
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                  placeholder="Nome completo como consta no banco"
                  required
                  className="w-full py-2.5 px-3 bg-card border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Número de Conta / NIB
                </label>
                <input
                  type="text"
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                  placeholder="Ex: 0001.0000.XXXXXXX ou Telefone para Agente"
                  required
                  className="w-full py-2.5 px-3 bg-card border border-border rounded-xl text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-foreground">Valor a Levantar (STN)</span>
                  <span className="text-[11px] text-muted-foreground">
                    Máx: {balance.toLocaleString("pt-PT")} STN
                  </span>
                </div>
                <input
                  type="number"
                  min={100}
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Valor em Dobras"
                  required
                  className="w-full py-2.5 px-3 bg-card border border-border rounded-xl text-xs font-semibold focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 rounded-2xl bg-muted/60 text-[11px] space-y-1 text-muted-foreground">
                <p className="flex items-center gap-1 font-bold text-foreground">
                  <Clock size={13} className="text-primary" />
                  Prazo de Processamento:
                </p>
                <p>
                  Transferências bancárias e levantamentos são processados às quintas-feiras ou em
                  24h úteis para agentes autorizados.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  !withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > balance
                }
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-bold text-xs shadow-sm hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
              >
                Confirmar Pedido de Levantamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Informativo / Garantia */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-3xl p-5 space-y-4 border border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Shield className="text-primary" size={18} />
                Segurança Financeira KONEKTA
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="size-8 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <p>
                A <strong className="text-foreground">KONEKTA</strong> é a primeira plataforma de
                serviços com sistema de garantia integrado em São Tomé e Príncipe.
              </p>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Garantia de 7 Dias:</strong> Se houver defeito no serviço executado,
                    mediamos a correção sem custos adicionais.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Sem Risco de Fuga:</strong> O prestador sabe que o dinheiro está
                    garantido, e o cliente sabe que só paga se o trabalho for bem feito.
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Suporte Humano em São Tomé:</strong> Linha de atendimento e mediação
                    pronta a intervir em caso de desacordo.
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-bold text-xs"
            >
              Compreendi
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
