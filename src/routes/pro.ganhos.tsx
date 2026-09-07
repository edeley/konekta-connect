import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Building2,
  ShieldCheck,
  Check,
  AlertCircle,
  AlertTriangle,
  Banknote,
  Users,
  Plus,
  Trash2,
  CreditCard,
  Building,
  Lock,
  Wallet,
  Clock,
  CheckCircle2,
  FileText,
  Share2,
  RefreshCw,
  Info,
  Smartphone,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import {
  Section,
  KCard,
  StatCard,
  EmptyState,
  BottomSheet,
  StatusPill,
} from "@/components/konekta/kit";
import { store, useStore, type Transaction } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { walletStateMeta } from "@/lib/states";
import { isPayoutDay, payoutLabel } from "@/lib/escrow";

export const Route = createFileRoute("/pro/ganhos")({
  head: () => ({
    meta: [
      { title: "Carteira Digital & Gestão · KONEKTA" },
      {
        name: "description",
        content:
          "Consulte os seus ganhos, custódia de clientes, regularização bancária STP e movimentos financeiros.",
      },
      { property: "og:title", content: "Carteira Digital & Gestão · KONEKTA" },
      {
        property: "og:description",
        content: "Carteira do prestador, gestão de dívida e comissões.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProEarnings,
});

function ProEarnings() {
  const balance = useStore((s) => s.providerBalance);
  const pendingBalance = useStore((s) => s.providerPendingBalance);
  const withdrawnBalance = useStore((s) => s.providerWithdrawnBalance);
  const payoutRequests = useStore((s) => s.payoutRequests);
  const user = useStore((s) => s.user);
  const txs = useStore((s) => s.providerTransactions);
  const commission = useStore((s) => s.config.commissionPct);
  const providerProfile = useStore((s) => s.providerProfile);
  const providerDebt = useStore((s) => s.providerDebt);
  const isProviderBlockedForDebt = useStore((s) => s.isProviderBlockedForDebt);
  const debtBlockLimit = useStore((s) => s.config.debtBlockLimit || 500);

  const [showBalance, setShowBalance] = useState(true);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<
    "bistp" | "bgfi" | "afriland" | "dobra24" | "cst_money" | "pix" | "iban"
  >("bistp");
  const [payoutAccount, setPayoutAccount] = useState("ST53.0001.0000.4455.6677.8899.1");
  const [payoutHolder, setPayoutHolder] = useState(user?.name || "Edmilson Varela");
  const [payoutPhone, setPayoutPhone] = useState(user?.phone || "+239 9845678");

  const [topUpAmount, setTopUpAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<"bistp" | "bgfi" | "afriland" | "dobra24">(
    "bistp",
  );
  const [transferProofRef, setTransferProofRef] = useState("");

  // Transação selecionada para BottomSheet de Detalhes
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [txFilter, setTxFilter] = useState<"all" | "in" | "out" | "commissions">("all");

  // Modal de Declaração de Pagamento Presencial (Dinheiro em Mão)
  const [cashDeclModalOpen, setCashDeclModalOpen] = useState(false);
  const [cashDeclClientName, setCashDeclClientName] = useState("");
  const [cashDeclServiceTitle, setCashDeclServiceTitle] = useState("");
  const [cashDeclAmount, setCashDeclAmount] = useState("");
  const [cashDeclNotes, setCashDeclNotes] = useState("");

  const earned = txs.filter((t) => t.kind === "in").reduce((a, t) => a + t.amount, 0);

  const canPayout = isPayoutDay();

  // Filtragem de Transações
  const filteredTxs = txs.filter((t) => {
    if (txFilter === "in") return t.kind === "in";
    if (txFilter === "out") {
      const isCom =
        t.label.toLowerCase().includes("comissão") || t.label.toLowerCase().includes("comissao");
      return t.kind === "out" && !isCom;
    }
    if (txFilter === "commissions") {
      const isCom =
        t.label.toLowerCase().includes("comissão") ||
        t.label.toLowerCase().includes("comissao") ||
        t.label.toLowerCase().includes("dívida");
      return isCom;
    }
    return true;
  });

  function handlePayout() {
    const value = Number(amount);
    if (!value || value <= 0) {
      toast.error("Insira um montante válido para saque.");
      return;
    }
    if (value > balance) {
      toast.error(`Saldo disponível insuficiente (${formatDb(balance)}).`);
      return;
    }
    if (isProviderBlockedForDebt) {
      toast.error(
        "Conta suspensa por dívida pendente. Regularize as comissões para efetuar saques.",
      );
      return;
    }
    if (!payoutAccount.trim()) {
      toast.error("Insira o NIB, IBAN ou número de conta para transferência.");
      return;
    }

    const providerId = providerProfile?.id || "edmilson-varela";
    const providerName = user?.name || "Edmilson Varela";

    const res = store.requestProviderPayout({
      providerId,
      providerName,
      providerPhone: payoutPhone,
      amount: value,
      method: payoutMethod,
      accountDetails: payoutAccount.trim(),
      holderName: payoutHolder.trim() || providerName,
    });

    if (res.ok) {
      toast.success("Solicitação de Saque Enviada com Sucesso!", {
        description: `O repasse de ${formatDb(value)} será processado para a conta ${payoutMethod.toUpperCase()} (${payoutAccount}).`,
      });
      setAmount("");
      setPayoutOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  function handleTopUpDebt() {
    const value = Number(topUpAmount);
    if (!value || value <= 0) {
      toast.error("Insira um montante válido para recarga.");
      return;
    }

    const bankLabels: Record<string, string> = {
      bistp: "BISTP (Banco Internacional de STP)",
      bgfi: "BGFI Bank STP",
      afriland: "Afriland First Bank",
      dobra24: "Dobra 24 Móvel",
    };

    const res = store.createDepositRequest({
      userRole: "prestador",
      userName: user?.name || "Edmilson Varela",
      userPhone: user?.phone || "+239 9845678",
      amount: value,
      method: selectedBank === "dobra24" ? "dobra24" : "transferencia_bancaria",
      bankOrProviderName: bankLabels[selectedBank] || selectedBank.toUpperCase(),
      referenceOrPhone: transferProofRef.trim() || `TRF-${Date.now().toString().slice(-6)}`,
      notes: "Recarga de carteira e regularização de comissões KONEKTA",
    });

    if (res.ok) {
      toast.success("Comprovativo de Recarga Submetido!", {
        description:
          "O montante será creditado na sua carteira assim que o administrador confirmar o pagamento.",
      });
      setTopUpOpen(false);
      setTopUpAmount("");
      setTransferProofRef("");
    } else {
      toast.error(res.message);
    }
  }

  function handleDeclareCashPayment(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(cashDeclAmount);
    if (!val || val <= 0) {
      toast.error("Insira um valor numérico válido recebido em dinheiro.");
      return;
    }
    if (!cashDeclClientName.trim()) {
      toast.error("Insira o nome do cliente.");
      return;
    }

    const targetService = cashDeclServiceTitle.trim() || "Serviço Presencial Concluído";
    const commPct = commission;
    const commAmount = Math.round(val * (commPct / 100));

    // Regista a transação e atualiza a dívida
    store.declareInPersonCashPayment({
      clientName: cashDeclClientName.trim(),
      serviceTitle: targetService,
      amountReceived: val,
      commissionAmount: commAmount,
      notes: cashDeclNotes.trim() || undefined,
    });

    toast.success(`Pagamento presencial de ${formatDb(val)} declarado com sucesso!`, {
      description: `Comissão KONEKTA de ${formatDb(commAmount)} (${commPct}%) adicionada ao extrato.`,
    });

    setCashDeclModalOpen(false);
    setCashDeclClientName("");
    setCashDeclServiceTitle("");
    setCashDeclAmount("");
    setCashDeclNotes("");
  }

  return (
    <AppShell roles={["prestador"]}>
      {/* Header Limpo e Humano */}
      <header className="px-5 pb-2 pt-6 flex items-start justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 mb-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Conta Profissional STP
          </span>
          <h1 className="text-2xl font-black tracking-tight text-foreground">A Minha Carteira</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gestão de ganhos, custódia e levantamentos bancários em Dobras (Db).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBalance(!showBalance)}
          className="size-9 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground grid place-items-center transition border border-border shrink-0 cursor-pointer"
          title={showBalance ? "Ocultar saldos" : "Mostrar saldos"}
        >
          {showBalance ? <Eye size={17} /> : <EyeOff size={17} />}
        </button>
      </header>

      {/* Alerta de Bloqueio por Dívida (caso ocorra) */}
      {isProviderBlockedForDebt && (
        <div className="px-5 pt-2">
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-black text-sm text-rose-600 dark:text-rose-400">
              <AlertTriangle size={17} />
              <span>Conta Suspensa: Limite de Comissões Atingido</span>
            </div>
            <p className="leading-relaxed">
              Tem <strong>{formatDb(providerDebt)}</strong> pendentes de serviços pagos em dinheiro
              no terreno. Amortize a dívida para reativar o recebimento de novos serviços.
            </p>
            <button
              type="button"
              onClick={() => {
                setTopUpAmount(String(providerDebt));
                setTopUpOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <RefreshCw size={13} /> Regularizar Agora ({formatDb(providerDebt)})
            </button>
          </div>
        </div>
      )}

      {/* CARTÃO FINANCEIRO PRINCIPAL (DESIGN MODERNO FINTECH) */}
      <div className="px-5 pt-3">
        <div className="relative rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900 text-white p-6 shadow-lg overflow-hidden border border-emerald-800/40">
          {/* Efeito decorativo sutil de fundo */}
          <div className="absolute -right-12 -bottom-12 size-48 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 size-40 rounded-full bg-teal-400/10 blur-xl pointer-events-none" />

          {/* Topo do Cartão */}
          <div className="relative flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-300 grid place-items-center border border-emerald-400/30">
                <Wallet size={14} />
              </div>
              <span className="text-[11px] font-bold tracking-wider uppercase text-emerald-200/90">
                KONEKTA STP
              </span>
            </div>

            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/25">
              Saldo Líquido
            </span>
          </div>

          {/* Montante Principal */}
          <div className="relative space-y-1 mb-6">
            <p className="text-xs text-emerald-200/80 font-medium">
              Disponível para Levantamento Imediato
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-white">
                {showBalance ? formatDb(balance) : "••••••••"}
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/70">
              Transferência direta para a sua conta BISTP, BGFI ou Dobra 24
            </p>
          </div>

          {/* Ações Rápidas no Cartão */}
          <div className="relative grid grid-cols-2 gap-2.5 pt-2 border-t border-emerald-800/60">
            <button
              type="button"
              onClick={() => setPayoutOpen(true)}
              disabled={balance <= 0 || isProviderBlockedForDebt}
              className="py-3 px-4 rounded-2xl bg-white text-slate-950 hover:bg-emerald-50 font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              <ArrowUpRight size={16} className="text-emerald-700" />
              <span>Levantar Dinheiro</span>
            </button>

            <button
              type="button"
              onClick={() => setCashDeclModalOpen(true)}
              className="py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 active:scale-98 transition cursor-pointer backdrop-blur-xs"
            >
              <Banknote size={15} className="text-emerald-300" />
              <span>Declarar em Dinheiro</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2 CARDS INFORMATIVOS (SEM NUMERAÇÃO ROBÓTICA) */}
      <div className="px-5 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Card 1: Saldo em Custódia Segura (Escrow) */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 grid place-items-center">
                <Lock size={15} />
              </div>
              <span className="text-xs font-bold text-foreground">Custódia Protegida</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300">
              Garantido
            </span>
          </div>

          <p className="text-2xl font-black font-mono text-foreground">
            {showBalance ? formatDb(pendingBalance) : "••••••"}
          </p>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Pago antecipadamente pelos clientes. É creditado no seu saldo assim que o cliente
            confirmar a conclusão do serviço com o código de 4 dígitos.
          </p>
        </div>

        {/* Card 2: Comissões KONEKTA & Estado da Conta */}
        <div className="p-4 rounded-2xl bg-card border border-border shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`size-8 rounded-xl grid place-items-center ${
                  providerDebt > 0
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {providerDebt > 0 ? <AlertCircle size={15} /> : <ShieldCheck size={15} />}
              </div>
              <span className="text-xs font-bold text-foreground">Estado das Comissões</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                providerDebt > 0
                  ? "bg-rose-500/15 text-rose-700 dark:text-rose-300"
                  : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
              }`}
            >
              {providerDebt > 0 ? "Pendente" : "Regularizada"}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <p
              className={`text-2xl font-black font-mono ${
                providerDebt > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              }`}
            >
              {showBalance ? formatDb(providerDebt) : "••••••"}
            </p>
            {providerDebt > 0 && (
              <button
                type="button"
                onClick={() => {
                  setTopUpAmount(String(providerDebt));
                  setTopUpOpen(true);
                }}
                className="text-[11px] font-bold text-primary hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Pagar</span>
                <ChevronRight size={12} />
              </button>
            )}
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {providerDebt > 0
              ? `Comissão de ${commission}% em serviços presenciais. Limite de crédito: ${formatDb(debtBlockLimit)}.`
              : `Conta 100% em dia. A comissão de ${commission}% só se aplica quando os serviços são concluídos com sucesso.`}
          </p>
        </div>
      </div>

      {/* CONTA BANCÁRIA VINCULADA STP */}
      <div className="px-5 pt-3">
        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
              <Building2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-foreground">BISTP · Conta Bancária STP</p>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                  Ativa
                </span>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground mt-0.5">
                ST53.0001.0000.4455.6677.8899.1
              </p>
              <p className="text-[10px] text-muted-foreground">
                Titular: {user?.name || "Edmilson Varela"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setPayoutOpen(true)}
            className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-foreground text-xs font-bold transition shrink-0 cursor-pointer"
          >
            Alterar
          </button>
        </div>
      </div>

      {/* HISTÓRICO DE SAQUES SOLICITADOS (SE HOUVER) */}
      {payoutRequests.length > 0 && (
        <Section title="Pedidos de Levantamento Recentes" className="pt-4">
          <div className="space-y-2.5">
            {payoutRequests.map((req) => (
              <KCard key={req.id} className="border border-border/80 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-mono text-foreground">{req.id}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          req.status === "aprovado"
                            ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                            : req.status === "rejeitado"
                              ? "bg-destructive/15 text-destructive"
                              : "bg-amber-500/15 text-amber-900 dark:text-amber-300"
                        }`}
                      >
                        {req.status === "aprovado"
                          ? "✓ Transferido"
                          : req.status === "rejeitado"
                            ? "✕ Rejeitado"
                            : "⏳ Em Processamento"}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-foreground mt-1">
                      {req.method.toUpperCase()} · {req.accountDetails}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      Titular: {req.holderName} · Solicitado em{" "}
                      {new Date(req.requestedAt || Date.now()).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-extrabold font-mono text-foreground">
                      {formatDb(req.amount)}
                    </p>
                    {req.proofRef && (
                      <p className="text-[10px] text-emerald-800 dark:text-emerald-300 font-mono mt-0.5">
                        Ref: {req.proofRef}
                      </p>
                    )}
                  </div>
                </div>
                {req.adminNotes && (
                  <p className="text-[11px] text-muted-foreground bg-muted/40 p-2 rounded-lg border border-border/40">
                    Nota: {req.adminNotes}
                  </p>
                )}
              </KCard>
            ))}
          </div>
        </Section>
      )}

      {/* RESUMO DE MÉTRICAS */}
      <Section className="pt-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatCard
            label="Total Ganho Líquido"
            value={formatDb(earned)}
            tone="success"
            icon={<TrendingUp size={15} />}
          />
          <StatCard
            label="Total Levantado"
            value={formatDb(withdrawnBalance)}
            tone="primary"
            icon={<Wallet size={15} />}
          />
          <StatCard
            label="Taxa de Serviço"
            value={`${commission}%`}
            tone="default"
            icon={<ShieldCheck size={15} />}
          />
          <StatCard
            label="Prazo de Repasse"
            value="24h úteis"
            tone="default"
            icon={<Clock size={15} />}
          />
        </div>
      </Section>

      {/* EXTRATO DETALHADO DE MOVIMENTOS COM FILTROS */}
      <Section title="Extrato de Movimentos" className="space-y-3 pb-8">
        {/* FILTROS CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all" as const, label: `Todos (${txs.length})` },
            {
              id: "in" as const,
              label: `Entradas (${txs.filter((t) => t.kind === "in").length})`,
            },
            {
              id: "out" as const,
              label: `Levantamentos (${txs.filter((t) => t.kind === "out" && !t.label.toLowerCase().includes("comiss")).length})`,
            },
            {
              id: "commissions" as const,
              label: `Comissões (${txs.filter((t) => t.label.toLowerCase().includes("comiss") || t.label.toLowerCase().includes("dívida")).length})`,
            },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setTxFilter(f.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                txFilter === f.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {filteredTxs.length === 0 ? (
          <EmptyState
            title="Ainda sem movimentos nesta categoria"
            description="Os pagamentos, saques e comissões dos seus serviços aparecem aqui."
          />
        ) : (
          <div className="space-y-2">
            {filteredTxs.map((t) => {
              const isCommissionDebit =
                t.label.toLowerCase().includes("comissão") ||
                t.label.toLowerCase().includes("comissao") ||
                t.label.toLowerCase().includes("dívida");
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTx(t)}
                  className="p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:bg-muted/20 transition flex items-center justify-between gap-3 cursor-pointer shadow-2xs group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`grid size-10 place-items-center rounded-2xl shrink-0 ${
                        t.kind === "in"
                          ? "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
                          : isCommissionDebit
                            ? "bg-amber-500/15 text-amber-800 dark:text-amber-300"
                            : "bg-primary/10 text-primary"
                      }`}
                    >
                      {t.kind === "in" ? (
                        <ArrowDownLeft size={18} />
                      ) : isCommissionDebit ? (
                        <AlertCircle size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {t.label}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                        <span>
                          {new Date(t.at).toLocaleDateString("pt-PT")} às{" "}
                          {new Date(t.at).toLocaleTimeString("pt-PT", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <span>•</span>
                        <span className="font-mono">{t.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-black font-mono block ${
                        t.kind === "in"
                          ? "text-emerald-700 dark:text-emerald-300"
                          : isCommissionDebit
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-foreground"
                      }`}
                    >
                      {t.kind === "in" ? "+" : "−"}
                      {formatDb(t.amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-0.5">
                      Ver recibo
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* ========================================================================= */}
      {/* BOTTOM SHEET DE DETALHE DE TRANSAÇÃO (RECIBO & MATEMÁTICA) */}
      {/* ========================================================================= */}
      <BottomSheet
        open={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
        title="Detalhes do Movimento Financeiro"
        description={selectedTx ? `Referência: ${selectedTx.id}` : ""}
      >
        {selectedTx && (
          <div className="space-y-4 pt-2">
            {/* Header da Transação */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Montante Registado</p>
                <p
                  className={`text-2xl font-black font-mono ${
                    selectedTx.kind === "in"
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-foreground"
                  }`}
                >
                  {selectedTx.kind === "in" ? "+" : "−"}
                  {formatDb(selectedTx.amount)}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedTx.kind === "in"
                    ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
                    : "bg-muted text-foreground border border-border"
                }`}
              >
                {selectedTx.kind === "in" ? "✓ Entrada Liquidada" : "Débito / Levantamento"}
              </span>
            </div>

            {/* Matemática Detalhada (Gross, Commission, Net) */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-2.5 text-xs">
              <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider text-muted-foreground">
                Cálculo Financeiro da Operação
              </h4>

              {selectedTx.kind === "in" ? (
                <>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Valor Bruto do Serviço (Cliente):</span>
                    <strong className="text-foreground font-mono">
                      {formatDb(Math.round(selectedTx.amount / (1 - commission / 100)))}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Taxa de Comissão Plataforma ({commission}%):</span>
                    <strong className="text-amber-700 dark:text-amber-300 font-mono">
                      −{" "}
                      {formatDb(
                        Math.round(
                          (selectedTx.amount / (1 - commission / 100)) * (commission / 100),
                        ),
                      )}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-2 font-bold text-sm">
                    <span className="text-foreground">Líquido Creditado na Carteira:</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 font-mono">
                      {formatDb(selectedTx.amount)}
                    </strong>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Montante Debitado:</span>
                    <strong className="text-foreground font-mono">
                      {formatDb(selectedTx.amount)}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Taxa de Transação KONEKTA:</span>
                    <strong className="text-emerald-700 dark:text-emerald-300 font-mono">
                      0 Db (Gratuito)
                    </strong>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-2 font-bold text-sm">
                    <span className="text-foreground">Total Processado:</span>
                    <strong className="text-primary font-mono">
                      {formatDb(selectedTx.amount)}
                    </strong>
                  </div>
                </>
              )}
            </div>

            {/* Metadados e Rastreabilidade */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descrição / Descritivo:</span>
                <strong className="text-foreground text-right">{selectedTx.label}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data e Hora:</span>
                <strong className="text-foreground font-mono">
                  {new Date(selectedTx.at).toLocaleString("pt-PT")}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID do Movimento:</span>
                <strong className="text-foreground font-mono">{selectedTx.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Canal STP:</span>
                <strong className="text-foreground">
                  Custódia Escrow / Transferência Bancária
                </strong>
              </div>
            </div>

            {/* Ações */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  toast.success("Comprovativo digital gerado com sucesso!", {
                    description: `Transação ${selectedTx.id} pronta para partilha.`,
                  });
                }}
                className="flex-1 h-11 rounded-2xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center justify-center gap-1.5 border border-border transition cursor-pointer"
              >
                <Share2 size={15} />
                <span>Partilhar Recibo</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <Check size={16} />
                <span>Concluir</span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ========================================================================= */}
      {/* MODAL DE DECLARAÇÃO DE PAGAMENTO PRESENCIAL (DINHEIRO EM MÃO) */}
      {/* ========================================================================= */}
      <BottomSheet
        open={cashDeclModalOpen}
        onClose={() => setCashDeclModalOpen(false)}
        title="Declarar Pagamento Presencial"
        description="Registe os pagamentos recebidos em dinheiro vivo diretamente das mãos do cliente no terreno."
      >
        <form onSubmit={handleDeclareCashPayment} className="space-y-3.5 pt-2">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Nome do Cliente *
            </label>
            <input
              type="text"
              required
              value={cashDeclClientName}
              onChange={(e) => setCashDeclClientName(e.target.value)}
              placeholder="Ex: Maria Fernandes ou Dr. Manuel"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none border border-border focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Serviço Realizado / Referência *
            </label>
            <input
              type="text"
              required
              value={cashDeclServiceTitle}
              onChange={(e) => setCashDeclServiceTitle(e.target.value)}
              placeholder="Ex: Instalação Elétrica ou Visita Técnica"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none border border-border focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Valor Total Recebido em Dinheiro (Db) *
            </label>
            <input
              type="number"
              required
              min="10"
              value={cashDeclAmount}
              onChange={(e) => setCashDeclAmount(e.target.value)}
              placeholder="Ex: 800"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-sm font-extrabold text-foreground outline-none border border-border focus:ring-2 focus:ring-primary font-mono"
            />
          </div>

          {/* Pré-visualização da Comissão */}
          {Number(cashDeclAmount) > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1 text-foreground">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor em Dinheiro:</span>
                <strong className="font-mono">{formatDb(Number(cashDeclAmount))}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comissão KONEKTA ({commission}%):</span>
                <strong className="text-destructive font-mono">
                  {formatDb(Math.round(Number(cashDeclAmount) * (commission / 100)))}
                </strong>
              </div>
              <div className="flex justify-between border-t border-amber-500/30 pt-1 text-[11px] text-muted-foreground">
                <span>Impacto na Carteira:</span>
                <span className="font-bold text-foreground">
                  +{formatDb(Math.round(Number(cashDeclAmount) * (commission / 100)))} na comissão
                  pendente
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Observações ou Detalhes (opcional)
            </label>
            <input
              type="text"
              value={cashDeclNotes}
              onChange={(e) => setCashDeclNotes(e.target.value)}
              placeholder="Ex: Pagamento após montagem completa"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none border border-border"
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
          >
            <Check size={16} /> Confirmar Declaração Presencial
          </button>
        </form>
      </BottomSheet>

      {/* MODAL DE SOLICITAÇÃO DE SAQUE BANCÁRIO */}
      <BottomSheet
        open={payoutOpen}
        onClose={() => setPayoutOpen(false)}
        title="Solicitar Levantamento Bancário"
        description={`Saldo disponível líquido: ${formatDb(balance)} · ${payoutLabel()}`}
      >
        <div className="space-y-4 pt-2">
          {/* Montante e Atalhos */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Valor a Transferir (Db) *
            </label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="numeric"
              placeholder={`Máx: ${balance} Db`}
              className="w-full h-12 rounded-xl bg-muted px-4 text-base font-extrabold text-foreground outline-none ring-1 ring-transparent focus:ring-primary font-mono"
            />
            <div className="flex items-center gap-2 mt-1.5">
              {[
                { label: "25%", val: Math.round(balance * 0.25) },
                { label: "50%", val: Math.round(balance * 0.5) },
                { label: "100%", val: balance },
              ]
                .filter((b) => b.val > 0)
                .map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setAmount(String(b.val))}
                    className="px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 text-[11px] font-bold text-foreground transition cursor-pointer"
                  >
                    {b.label} ({formatDb(b.val)})
                  </button>
                ))}
            </div>
          </div>

          {/* Seleção do Canal de Recebimento STP */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Canal de Recebimento STP:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "bistp" as const, name: "BISTP", desc: "Banco Internacional" },
                { id: "bgfi" as const, name: "BGFI Bank", desc: "BGFI Bank STP" },
                { id: "afriland" as const, name: "Afriland", desc: "Afriland First Bank" },
                { id: "dobra24" as const, name: "Dobra 24", desc: "Carteira Móvel" },
                { id: "cst_money" as const, name: "CST Money", desc: "Dinheiro Móvel" },
                { id: "iban" as const, name: "Outro IBAN", desc: "Transferência Direta" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPayoutMethod(m.id)}
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                    payoutMethod === m.id
                      ? "border-primary bg-primary/10 font-bold"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <p className="text-xs font-bold text-foreground">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Dados Bancários */}
          <div className="space-y-2.5">
            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                NIB / IBAN / Número de Conta ou Telemóvel *
              </label>
              <input
                type="text"
                value={payoutAccount}
                onChange={(e) => setPayoutAccount(e.target.value)}
                placeholder="Ex: ST53.0001.0000.1234.5678.9 ou 9845678"
                className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-bold text-foreground outline-none font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground block mb-1">
                Nome do Titular da Conta *
              </label>
              <input
                type="text"
                value={payoutHolder}
                onChange={(e) => setPayoutHolder(e.target.value)}
                placeholder="Nome completo na conta bancária"
                className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground space-y-1">
            <div className="flex justify-between">
              <span>Valor solicitado:</span>
              <strong className="text-foreground">{formatDb(Number(amount) || 0)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Taxa de processamento KONEKTA:</span>
              <strong className="text-emerald-700 dark:text-emerald-300">0 Db (Gratuito)</strong>
            </div>
            <div className="flex justify-between border-t border-border/50 pt-1 font-bold">
              <span>Total a transferir:</span>
              <strong className="text-primary">{formatDb(Number(amount) || 0)}</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePayout}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all cursor-pointer"
          >
            <Check size={16} /> Confirmar Pedido de Levantamento
          </button>
        </div>
      </BottomSheet>

      {/* MODAL DE RECARGA BANCÁRIA STP & REGULARIZAÇÃO DE DÍVIDA */}
      <BottomSheet
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        title="Regularizar Comissões KONEKTA"
        description="Transfira para as contas oficiais KONEKTA em São Tomé e Príncipe. O saldo será creditado após validação do comprovativo pela administração."
      >
        <div className="space-y-4 pt-2">
          {providerDebt > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
              Comissões pendentes: <strong>{formatDb(providerDebt)}</strong>. O pagamento amortiza a
              sua dívida e mantém a sua conta ativa e apta a receber novos serviços.
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Valor a Transferir (Db) *
            </label>
            <input
              type="number"
              min="50"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Ex: 500"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-bold text-foreground outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1.5">
              Selecione a Conta Bancária de Destino:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  id: "bistp" as const,
                  label: "BISTP (Banco Internacional)",
                  iban: "ST53.0001.0000.1234.5678.9",
                },
                { id: "bgfi" as const, label: "BGFI Bank STP", iban: "ST53.0002.0000.8765.4321.0" },
                {
                  id: "afriland" as const,
                  label: "Afriland First Bank",
                  iban: "ST53.0003.0000.5432.1098.7",
                },
                { id: "dobra24" as const, label: "Carteira Dobra 24", iban: "Ref: 994-552-110" },
              ].map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setSelectedBank(b.id)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    selectedBank === b.id
                      ? "border-primary bg-primary/10 font-bold"
                      : "border-border bg-card hover:bg-muted/40"
                  }`}
                >
                  <p className="text-xs font-bold text-foreground">{b.label}</p>
                  <p className="text-[10px] text-muted-foreground font-mono truncate">{b.iban}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Referência ou Comprovativo de Transferência *
            </label>
            <input
              type="text"
              value={transferProofRef}
              onChange={(e) => setTransferProofRef(e.target.value)}
              placeholder="Ex: TRF-BISTP-849302 ou nº de telefone"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground">
            💡 <strong>Validação Rápida:</strong> O comprovativo é processado pela equipa KONEKTA em
            até 2 horas úteis.
          </div>

          <button
            type="button"
            onClick={handleTopUpDebt}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs active:scale-98"
          >
            <Check size={16} /> Submeter Comprovativo de Regularização
          </button>
        </div>
      </BottomSheet>
    </AppShell>
  );
}
