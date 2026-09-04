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
} from "lucide-react";
import { toast } from "sonner";
import { ProofUpload } from "@/components/konekta/ProofUpload";
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
      { title: "Carteira Digital & Gestão · KONEKTA PRO" },
      {
        name: "description",
        content:
          "Consulte os seus ganhos, dívida de comissões, regularização bancária STP, planos de empresa e equipa de técnicos.",
      },
      { property: "og:title", content: "Carteira Digital & Gestão · KONEKTA PRO" },
      {
        property: "og:description",
        content: "Carteira do prestador, gestão de dívida, equipa e comissões.",
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
  const companyPlanFee = useStore((s) => s.config.companyMonthlyPlanFee);
  const companyMonetization = useStore((s) => s.companyMonetization);
  const providerProfile = useStore((s) => s.providerProfile);
  const providerDebt = useStore((s) => s.providerDebt);
  const isProviderBlockedForDebt = useStore((s) => s.isProviderBlockedForDebt);
  const companyProfile = useStore((s) => s.companyProfile);
  const debtBlockLimit = useStore((s) => s.config.debtBlockLimit || 500);

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<
    "bistp" | "bgfi" | "afriland" | "dobra24" | "cst_money" | "pix" | "iban"
  >("bistp");
  const [payoutAccount, setPayoutAccount] = useState("ST53.0001.0000.4455.6677.8899.1");
  const [payoutHolder, setPayoutHolder] = useState(
    user?.name || providerProfile?.companyName || "Edmilson Varela",
  );
  const [payoutPhone, setPayoutPhone] = useState(user?.phone || "+239 9845678");

  const [topUpAmount, setTopUpAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<"bistp" | "bgfi" | "afriland" | "dobra24">(
    "bistp",
  );
  const [transferProofRef, setTransferProofRef] = useState("");
  const [proofImage, setProofImage] = useState<string | undefined>(undefined);
  const [proofFileName, setProofFileName] = useState<string | undefined>(undefined);

  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [companyUpgradeModalOpen, setCompanyUpgradeModalOpen] = useState(false);
  const [companyNameInput, setCompanyNameInput] = useState(
    companyProfile?.companyName || providerProfile?.companyName || "",
  );
  const [companyNifInput, setCompanyNifInput] = useState(
    companyProfile?.nif || providerProfile?.documents?.nif || "",
  );
  const [companyIbanInput, setCompanyIbanInput] = useState(companyProfile?.iban || "");

  // Modal Técnico
  const [addTechModalOpen, setAddTechModalOpen] = useState(false);
  const [techName, setTechName] = useState("");
  const [techPhone, setTechPhone] = useState("");
  const [techSpecialty, setTechSpecialty] = useState("");

  // Transação selecionada para BottomSheet de Detalhes
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [txFilter, setTxFilter] = useState<"all" | "in" | "out" | "commissions">("all");

  // Modal de Declaração de Pagamento Presencial (Dinheiro em Mão)
  const [cashDeclModalOpen, setCashDeclModalOpen] = useState(false);
  const [cashDeclClientName, setCashDeclClientName] = useState("");
  const [cashDeclServiceTitle, setCashDeclServiceTitle] = useState("");
  const [cashDeclAmount, setCashDeclAmount] = useState("");
  const [cashDeclNotes, setCashDeclNotes] = useState("");

  const isCompany =
    providerProfile?.providerType === "empresa" ||
    Boolean(providerProfile?.companyName) ||
    Boolean(companyProfile?.companyName) ||
    companyMonetization.companyName !== undefined;

  const earned = txs.filter((t) => t.kind === "in").reduce((a, t) => a + t.amount, 0);

  const canPayout = isPayoutDay();
  const isPlanActive =
    isCompany && companyMonetization.model === "plano_mensal" && companyMonetization.planActive;

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
    const providerName = user?.name || providerProfile?.companyName || "Edmilson Varela";

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

    if (!proofImage) {
      toast.error("Anexe o comprovativo ou recibo do pagamento para submeter a recarga.");
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
      userName: user?.name || providerProfile?.companyName || "Edmilson Varela",
      userPhone: user?.phone || "+239 9845678",
      amount: value,
      method: selectedBank === "dobra24" ? "dobra24" : "transferencia_bancaria",
      bankOrProviderName: bankLabels[selectedBank] || selectedBank.toUpperCase(),
      referenceOrPhone: transferProofRef.trim() || `TRF-${Date.now().toString().slice(-6)}`,
      proofImage,
      proofFileName,
      notes: "Recarga de carteira e regularização de comissões KONEKTA PRO",
    });

    if (res.ok) {
      toast.success("Comprovativo de Recarga Submetido!", {
        description:
          "O montante será creditado na sua carteira assim que o administrador confirmar o pagamento.",
      });
      setTopUpOpen(false);
      setTopUpAmount("");
      setTransferProofRef("");
      setProofImage(undefined);
      setProofFileName(undefined);
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
    const commPct = isPlanActive ? 0 : commission;
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
      description: isPlanActive
        ? "0% de comissão deduzida (Plano Empresa Ativo)."
        : `Comissão KONEKTA de ${formatDb(commAmount)} (${commPct}%) adicionada ao extrato.`,
    });

    setCashDeclModalOpen(false);
    setCashDeclClientName("");
    setCashDeclServiceTitle("");
    setCashDeclAmount("");
    setCashDeclNotes("");
  }

  function handleSubscribePlan() {
    if (!isCompany) {
      toast.error("Apenas empresas prestadoras podem subscrever o plano mensal");
      return;
    }
    const res = store.subscribeCompanyPlan(1);
    if (res.ok) {
      toast.success(res.message);
      setPlanModalOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  function handleUpgradeToCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyNameInput.trim()) {
      toast.error("Insira o nome oficial da empresa.");
      return;
    }
    store.updateProviderProfile({
      providerType: "empresa",
      companyName: companyNameInput.trim(),
      documents: {
        ...providerProfile?.documents,
        nif: companyNifInput.trim(),
        selfieOk: true,
      },
    });
    store.updateCompanyProfile({
      companyName: companyNameInput.trim(),
      nif: companyNifInput.trim(),
      iban: companyIbanInput.trim(),
    });
    toast.success("Perfil atualizado para Empresa Prestadora de Serviços!");
    setCompanyUpgradeModalOpen(false);
    setPlanModalOpen(true);
  }

  function handleAddTechnician(e: React.FormEvent) {
    e.preventDefault();
    if (!techName.trim()) {
      toast.error("Insira o nome do técnico.");
      return;
    }
    const res = store.addCompanyTechnician({
      name: techName.trim(),
      phone: techPhone.trim(),
      specialties: techSpecialty
        ? techSpecialty
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : ["Técnico Especialista"],
    });

    if (res.ok) {
      toast.success(res.message);
      setAddTechModalOpen(false);
      setTechName("");
      setTechPhone("");
      setTechSpecialty("");
    } else {
      toast.error(res.message);
    }
  }

  return (
    <AppShell roles={["prestador"]}>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Carteira Digital & Gestão PRO</h1>
        <p className="text-sm text-muted-foreground">
          Gestão financeira STP, custódia escrow, liquidação de comissões e saques.
        </p>
      </header>

      {/* Alerta Crítico de Bloqueio por Dívida */}
      {isProviderBlockedForDebt && (
        <div className="px-5 pt-2">
          <div className="p-4 rounded-3xl bg-destructive/15 border-2 border-destructive/40 text-destructive text-xs space-y-2.5">
            <div className="flex items-center gap-2 font-black text-sm">
              <AlertTriangle size={18} />
              <span>CONTA SUSPENSA: Limite de Dívida Atingido (≥ {formatDb(debtBlockLimit)})</span>
            </div>
            <p className="text-destructive/90 leading-relaxed font-medium">
              Acumulou <strong>{formatDb(providerDebt)}</strong> em comissões pendentes de serviços
              pagos em dinheiro no terreno. O limite máximo de crédito é de{" "}
              {formatDb(debtBlockLimit)}. A sua conta está temporariamente bloqueada para novos
              serviços até amortizar o valor.
            </p>
            <button
              type="button"
              onClick={() => {
                setTopUpAmount(String(providerDebt));
                setTopUpOpen(true);
              }}
              className="w-full py-2.5 rounded-xl bg-destructive text-destructive-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition cursor-pointer"
            >
              <Banknote size={14} /> Regularizar Dívida Imediatamente ({formatDb(providerDebt)})
            </button>
          </div>
        </div>
      )}

      {/* HEADER CARD COM OS 3 PILARES DE SALDO MD3 */}
      <Section className="pt-2">
        <div className="rounded-3xl border border-border/80 bg-card p-5 space-y-4 shadow-sm">
          {/* TOPO DO CARD */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <div>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Visão Consolidada
                </h3>
                <p className="text-sm font-extrabold text-foreground">Saldos & Custódia KONEKTA</p>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                isProviderBlockedForDebt
                  ? "bg-destructive/15 text-destructive"
                  : providerDebt > 0
                    ? "bg-amber-500/15 text-amber-900 dark:text-amber-300"
                    : "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
              }`}
            >
              {isProviderBlockedForDebt ? (
                <>
                  <AlertTriangle size={12} /> Bloqueado
                </>
              ) : providerDebt > 0 ? (
                <>
                  <AlertCircle size={12} /> Dívida Pendente
                </>
              ) : (
                <>
                  <ShieldCheck size={12} /> Regularizado
                </>
              )}
            </span>
          </div>

          {/* OS 3 PILARES DE SALDO */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. SALDO DISPONÍVEL (Verde) */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-emerald-600" /> 1. Saldo Disponível
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-[10px] font-bold">
                  Pronto
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-mono">
                {formatDb(balance)}
              </p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Dinheiro de serviços concluídos e aprovados, pronto para levantamento bancário STP.
              </p>
            </div>

            {/* 2. SALDO EM CUSTÓDIA / ESCROW (Âmbar) */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                  <Lock size={13} className="text-amber-600" /> 2. Em Custódia (Escrow)
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[10px] font-bold">
                  Garantido
                </span>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-mono">
                {formatDb(pendingBalance)}
              </p>
              <p className="text-[11px] text-muted-foreground leading-snug">
                Retido em segurança. Transferido para o saldo disponível assim que o cliente validar
                o PIN.
              </p>
            </div>

            {/* 3. DÍVIDA DE COMISSÕES (Vermelho) */}
            <div
              className={`p-4 rounded-2xl border space-y-1.5 ${
                providerDebt > 0
                  ? "bg-destructive/10 border-destructive/30"
                  : "bg-muted/40 border-border/80"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[11px] font-bold flex items-center gap-1 ${
                    providerDebt > 0 ? "text-destructive" : "text-muted-foreground"
                  }`}
                >
                  <AlertTriangle
                    size={13}
                    className={providerDebt > 0 ? "text-destructive" : "text-muted-foreground"}
                  />{" "}
                  3. Dívida de Comissões
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    providerDebt >= debtBlockLimit
                      ? "bg-destructive text-white"
                      : providerDebt > 0
                        ? "bg-amber-500/20 text-amber-900 dark:text-amber-200"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {providerDebt >= debtBlockLimit
                    ? "Limite Atingido"
                    : providerDebt > 0
                      ? `${formatDb(debtBlockLimit - providerDebt)} p/ Bloqueio`
                      : "0 Db"}
                </span>
              </div>
              <p
                className={`text-2xl sm:text-3xl font-black tracking-tight font-mono ${
                  providerDebt > 0 ? "text-destructive" : "text-foreground"
                }`}
              >
                {formatDb(providerDebt)}
              </p>
              {/* Barra de Progresso da Dívida */}
              <div className="w-full bg-muted/60 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    providerDebt >= debtBlockLimit ? "bg-destructive" : "bg-amber-500"
                  }`}
                  style={{
                    width: `${Math.min(100, (providerDebt / debtBlockLimit) * 100)}%`,
                  }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground leading-snug">
                {providerDebt > 0
                  ? `Comissões de dinheiro recebido no local. Limite: ${formatDb(debtBlockLimit)}.`
                  : "Nenhuma comissão pendente de repasse."}
              </p>
            </div>
          </div>

          {/* BARRA DE AÇÕES RÁPIDAS */}
          <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2.5">
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Info size={13} className="text-primary shrink-0" />
              <span>
                Taxa de serviço da plataforma:{" "}
                <strong>{isPlanActive ? "0% (Plano Empresa)" : `${commission}%`}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCashDeclModalOpen(true)}
                className="px-3.5 h-9 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-border"
              >
                <Banknote size={14} className="text-emerald-600" />
                <span>Declarar Pagamento Dinheiro</span>
              </button>

              {providerDebt > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setTopUpAmount(String(providerDebt));
                    setTopUpOpen(true);
                  }}
                  className="px-3.5 h-9 rounded-xl bg-amber-500/15 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/25 transition cursor-pointer border border-amber-500/30"
                >
                  <RefreshCw size={13} />
                  <span>Regularizar Dívida</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setPayoutOpen(true)}
                disabled={balance <= 0 || isProviderBlockedForDebt}
                className="px-4 h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
              >
                <ArrowUpRight size={14} />
                <span>Solicitar Saque</span>
              </button>
            </div>
          </div>
        </div>
      </Section>

      {/* HISTÓRICO DE SAQUES SOLICITADOS */}
      {payoutRequests.length > 0 && (
        <Section title="Solicitações de Saque Bancário">
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
                      {new Date(req.requestedAt ?? Date.now()).toLocaleDateString("pt-PT")}
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
                    ℹ️ Nota: {req.adminNotes}
                  </p>
                )}
              </KCard>
            ))}
          </div>
        </Section>
      )}

      {/* RESUMO DE MÉTRICAS */}
      <Section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatCard
            label="Total Ganho Líquido"
            value={formatDb(earned)}
            tone="success"
            icon={<TrendingUp size={15} />}
          />
          <StatCard
            label="Total Sacado"
            value={formatDb(withdrawnBalance)}
            tone="primary"
            icon={<Building2 size={15} />}
          />
          <StatCard
            label="Dívida de Comissão"
            value={formatDb(providerDebt)}
            tone={providerDebt > 0 ? "error" : "neutral"}
            icon={<AlertCircle size={15} />}
          />
          <StatCard
            label="Taxa de Serviço"
            value={isPlanActive ? "0%" : `${commission}%`}
            tone={isPlanActive ? "success" : "warning"}
          />
        </div>
      </Section>

      {/* LISTA DE MOVIMENTOS & TRANSAÇÕES COM FILTROS */}
      <Section title="Extrato Detalhado de Movimentos" className="space-y-3 pb-6">
        {/* FILTRO CHIPS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "all" as const, label: `Todos (${txs.length})` },
            {
              id: "in" as const,
              label: `Entradas (${txs.filter((t) => t.kind === "in").length})`,
            },
            {
              id: "out" as const,
              label: `Saques (${txs.filter((t) => t.kind === "out" && !t.label.toLowerCase().includes("comiss")).length})`,
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
                          ? "text-emerald-800 dark:text-emerald-300"
                          : isCommissionDebit
                            ? "text-amber-800 dark:text-amber-300"
                            : "text-foreground"
                      }`}
                    >
                      {t.kind === "in" ? "+" : "−"}
                      {formatDb(t.amount)}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center justify-end gap-0.5">
                      Ver detalhes
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* GESTÃO DE EMPRESA & TÉCNICOS */}
      {isCompany && (
        <Section title="Gestão da Empresa & Equipa de Técnicos">
          <KCard className="border border-border/80 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-2xl bg-primary/10 text-primary grid place-items-center">
                  <Building size={18} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {companyProfile?.companyName ||
                      providerProfile?.companyName ||
                      "Empresa Prestadora"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    NIF: {companyProfile?.nif || providerProfile?.documents?.nif || "Pendente"} ·{" "}
                    {companyProfile?.technicians?.length || 0} Técnicos registados
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAddTechModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
              >
                <Plus size={13} /> Novo Técnico
              </button>
            </div>

            {/* Lista de Técnicos */}
            <div className="space-y-2 pt-1">
              {!companyProfile?.technicians || companyProfile.technicians.length === 0 ? (
                <div className="p-3.5 rounded-xl bg-muted/40 border border-dashed border-border text-center text-xs text-muted-foreground">
                  Nenhum técnico associado à empresa. Adicione técnicos para atribuir chamados no
                  terreno.
                </div>
              ) : (
                companyProfile.technicians.map((t) => (
                  <div
                    key={t.id}
                    className="p-3 rounded-xl bg-muted/40 border border-border flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground truncate">{t.name}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                            t.active
                              ? "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {t.active ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Tel: {t.phone || "N/A"} · {(t.specialties ?? []).join(", ")}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          store.toggleCompanyTechnician(t.id);
                          toast.success(`Estado do técnico ${t.name} atualizado`);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-card border border-border text-[11px] font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                      >
                        {t.active ? "Desativar" : "Ativar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          store.removeCompanyTechnician(t.id);
                          toast.success("Técnico removido");
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition cursor-pointer"
                        aria-label="Remover técnico"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </KCard>
        </Section>
      )}

      {/* MODELO DE COBRANÇA */}
      <Section title="Modelo de Cobrança KONEKTA" className="pb-10">
        <KCard className="border border-border/80 shadow-2xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 grid place-items-center shrink-0">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {isCompany
                    ? isPlanActive
                      ? "Plano Mensal Empresa Pro (0% Comissão)"
                      : "Empresa · Modelo por Comissão (20%)"
                    : "Profissional Individual · Comissão (20%)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isCompany
                    ? isPlanActive
                      ? "0% de taxa por serviço · Subscrição mensal ativa"
                      : "20% retidos apenas após aprovação do cliente"
                    : "Profissionais simples pagam apenas comissão de sucesso por serviço"}
                </p>
              </div>
            </div>
            <StatusPill tone={isPlanActive ? "success" : "neutral"}>
              {isPlanActive ? "0% Taxa" : `${commission}% Taxa`}
            </StatusPill>
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 text-xs text-foreground/80 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Tipo de Conta:</span>
              <span className="font-bold text-foreground">
                {isCompany ? "🏢 Empresa Prestadora" : "👤 Profissional Simples / Individual"}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Regra de Cobrança:</span>
              <strong className="text-foreground">
                {isPlanActive
                  ? "Subscrição Mensal Fixa (0% comissão)"
                  : "Comissão de Sucesso (20% por serviço)"}
              </strong>
            </div>

            {isPlanActive && companyMonetization.planExpiresAt && (
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Renovação do plano:</span>
                <strong className="text-emerald-800 dark:text-emerald-300 font-bold">
                  {new Date(companyMonetization.planExpiresAt).toLocaleDateString("pt-PT")}
                </strong>
              </div>
            )}
          </div>

          {/* Ações baseadas no Tipo de Perfil */}
          {isCompany ? (
            <button
              type="button"
              onClick={() => setPlanModalOpen(true)}
              className="w-full py-2.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Building2 size={14} />
              {isPlanActive
                ? "Gerir ou Renovar Plano Empresa"
                : "Escolher Modelo: Comissão vs Plano Mensal"}
            </button>
          ) : (
            <div className="pt-1 space-y-2">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200">
                💡 <strong>Regra KONEKTA:</strong> Os profissionais simples funcionam exclusivamente
                com comissão por serviço concluído (20%). Apenas{" "}
                <strong>empresas prestadoras</strong> podem optar pelo plano mensal fixo.
              </div>

              <button
                type="button"
                onClick={() => setCompanyUpgradeModalOpen(true)}
                className="w-full py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition border border-border cursor-pointer"
              >
                <Building2 size={13} />
                Registar Perfil como Empresa Comercial
              </button>
            </div>
          )}
        </KCard>
      </Section>

      {/* ========================================================================= */}
      {/* BOTTOM SHEET DE DETALHE DE TRANSAÇÃO (MATEMÁTICA & DETALHES) */}
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
                      ? "text-emerald-800 dark:text-emerald-300"
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
                {selectedTx.kind === "in" ? "✓ Entrada Liquidada" : "Débito / Saque"}
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
                      {formatDb(
                        Math.round(selectedTx.amount / (1 - (isPlanActive ? 0 : commission / 100))),
                      )}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>
                      Taxa de Comissão Plataforma (
                      {isPlanActive ? "0% Plano Empresa" : `${commission}%`}):
                    </span>
                    <strong className="text-amber-800 dark:text-amber-300 font-mono">
                      −{" "}
                      {formatDb(
                        Math.round(
                          (selectedTx.amount / (1 - (isPlanActive ? 0 : commission / 100))) *
                            (isPlanActive ? 0 : commission / 100),
                        ),
                      )}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center border-t border-border pt-2 font-bold text-sm">
                    <span className="text-foreground">Líquido Creditado na Carteira:</span>
                    <strong className="text-emerald-800 dark:text-emerald-300 font-mono">
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
                    <strong className="text-emerald-800 dark:text-emerald-300 font-mono">
                      0 STN (Gratuito)
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
        title="Declarar Pagamento Presencial (Dinheiro)"
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
              Valor Total Recebido em Dinheiro (STN) *
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
                <span className="text-muted-foreground">
                  Comissão KONEKTA ({isPlanActive ? "0% Empresa" : `${commission}%`}):
                </span>
                <strong className="text-destructive font-mono">
                  {formatDb(
                    Math.round(Number(cashDeclAmount) * ((isPlanActive ? 0 : commission) / 100)),
                  )}
                </strong>
              </div>
              <div className="flex justify-between border-t border-amber-500/30 pt-1 text-[11px] text-muted-foreground">
                <span>Impacto na Carteira:</span>
                <span className="font-bold text-foreground">
                  {isPlanActive
                    ? "Sem acréscimo de dívida (0% taxa)"
                    : `+${formatDb(Math.round(Number(cashDeclAmount) * (commission / 100)))} na dívida de comissões`}
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
        title="Solicitar Saque Bancário STP"
        description={`Saldo disponível líquido: ${formatDb(balance)} · ${payoutLabel()}`}
      >
        <div className="space-y-4 pt-2">
          {/* Montante e Atalhos */}
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Valor a Transferir (STN) *
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
              <strong className="text-emerald-800 dark:text-emerald-300">0 Db (Gratuito)</strong>
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
            <Check size={16} /> Confirmar Pedido de Saque
          </button>
        </div>
      </BottomSheet>

      {/* MODAL DE RECARGA BANCÁRIA STP & REGULARIZAÇÃO DE DÍVIDA */}
      <BottomSheet
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        title="Recarregar Saldo / Regularizar Dívida"
        description="Transfira para as contas oficiais KONEKTA em São Tomé e Príncipe. O saldo será creditado após validação do comprovativo pela administração."
      >
        <div className="space-y-4 pt-2">
          {providerDebt > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
              Dívida atual: <strong>{formatDb(providerDebt)}</strong>. O carregamento amortiza a sua
              dívida e desbloqueia a sua conta assim que validado pelo administrador.
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Valor a Transferir (STN) *
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
              Selecione o Canal de Pagamento STP:
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

          <ProofUpload
            value={proofImage}
            fileName={proofFileName}
            onChange={(v, n) => {
              setProofImage(v);
              setProofFileName(n);
            }}
          />

          <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground">
            💡 <strong>Validação Admin:</strong> O comprovativo é enviado instantaneamente para a
            administração. O saldo fica disponível logo após a conferência bancária.
          </div>

          <button
            type="button"
            onClick={handleTopUpDebt}
            disabled={!proofImage}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs disabled:opacity-50"
          >
            <Check size={16} /> Submeter Comprovativo para Validação Admin
          </button>
        </div>
      </BottomSheet>

      {/* MODAL DE ADICIONAR NOVO TÉCNICO */}
      <BottomSheet
        open={addTechModalOpen}
        onClose={() => setAddTechModalOpen(false)}
        title="Adicionar Técnico à Equipa"
        description="Registe os colaboradores técnicos da sua empresa para deslocação a serviços de campo."
      >
        <form onSubmit={handleAddTechnician} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Nome Completo do Técnico *
            </label>
            <input
              type="text"
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
              placeholder="Ex: Manuel da Costa"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Contacto Telefónico STP
            </label>
            <input
              type="tel"
              value={techPhone}
              onChange={(e) => setTechPhone(e.target.value)}
              placeholder="Ex: 9912345"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Especialidades (separadas por vírgula)
            </label>
            <input
              type="text"
              value={techSpecialty}
              onChange={(e) => setTechSpecialty(e.target.value)}
              placeholder="Ex: Eletricidade, Redes, Climatização"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Plus size={16} /> Registar Técnico
          </button>
        </form>
      </BottomSheet>

      {/* MODAL DE PLANOS DE EMPRESA */}
      <BottomSheet
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title="Modelos de Cobrança para Empresas"
        description="Apenas empresas prestadoras de serviços podem alternar entre Comissão ou Plano Mensal."
      >
        <div className="space-y-4 pt-2">
          <div
            onClick={() => {
              store.switchMonetizationModel("comissao");
              toast.success("Modalidade de comissão por serviço selecionada");
              setPlanModalOpen(false);
            }}
            className={`p-4 rounded-2xl border-2 transition cursor-pointer ${
              !isPlanActive
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-foreground">Plano Flexível (Comissão)</span>
              <span className="text-xs font-bold text-primary">{commission}% por serviço</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Sem custos fixos mensais. A empresa paga apenas 20% quando fechar e concluir serviços.
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border-2 transition ${
              isPlanActive ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                <Building2 size={14} className="text-primary" /> Plano Mensal Empresa (0% Comissão)
              </span>
              <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 font-mono">
                {formatDb(companyPlanFee)}/mês
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Receba 100% do valor dos seus orçamentos sem qualquer dedução de comissões por
              serviço.
            </p>

            <button
              type="button"
              onClick={handleSubscribePlan}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition active:scale-98 cursor-pointer"
            >
              {isPlanActive
                ? "Renovar Subscrição (1 Mês)"
                : `Subscrever por ${formatDb(companyPlanFee)}/mês`}
            </button>
          </div>
        </div>
      </BottomSheet>

      {/* MODAL DE UPGRADE PARA EMPRESA */}
      <BottomSheet
        open={companyUpgradeModalOpen}
        onClose={() => setCompanyUpgradeModalOpen(false)}
        title="Registar como Empresa Prestadora"
        description="Empresas registadas têm acesso a planos mensais fixos com 0% de taxa por serviço e gestão de múltiplos técnicos."
      >
        <form onSubmit={handleUpgradeToCompany} className="space-y-3 pt-2">
          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              Nome Comercial da Empresa *
            </label>
            <input
              type="text"
              value={companyNameInput}
              onChange={(e) => setCompanyNameInput(e.target.value)}
              placeholder="Ex: EletroSantome Lda"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              NIF da Empresa (São Tomé e Príncipe)
            </label>
            <input
              type="text"
              value={companyNifInput}
              onChange={(e) => setCompanyNifInput(e.target.value)}
              placeholder="Ex: 500123456"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-foreground block mb-1">
              IBAN Bancário Corporativo (BISTP / BGFI / Afriland)
            </label>
            <input
              type="text"
              value={companyIbanInput}
              onChange={(e) => setCompanyIbanInput(e.target.value)}
              placeholder="ST53.0001.0000.xxxx.xxxx.x"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition cursor-pointer"
          >
            <Building2 size={14} />
            Confirmar Registo de Empresa
          </button>
        </form>
      </BottomSheet>
    </AppShell>
  );
}
