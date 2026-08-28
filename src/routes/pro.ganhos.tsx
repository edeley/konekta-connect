import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Building2,
  ShieldCheck,
  Check,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Banknote,
  Users,
  Plus,
  Trash2,
  CreditCard,
  Building,
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
import { store, useStore } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { walletStateMeta } from "@/lib/states";
import { isPayoutDay, payoutLabel } from "@/lib/escrow";
import { KonektaCalculator } from "@/components/konekta/KonektaCalculator";

export const Route = createFileRoute("/pro/ganhos")({
  head: () => ({
    meta: [
      { title: "Ganhos & Gestão · KONEKTA PRO" },
      {
        name: "description",
        content:
          "Consulte os seus ganhos, dívida de comissões, regularização bancária STP, planos de empresa e equipa de técnicos.",
      },
      { property: "og:title", content: "Ganhos & Gestão · KONEKTA PRO" },
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
  const txs = useStore((s) => s.providerTransactions);
  const commission = useStore((s) => s.config.commissionPct);
  const companyPlanFee = useStore((s) => s.config.companyMonthlyPlanFee);
  const companyMonetization = useStore((s) => s.companyMonetization);
  const providerProfile = useStore((s) => s.providerProfile);
  const providerDebt = useStore((s) => s.providerDebt);
  const isProviderBlockedForDebt = useStore((s) => s.isProviderBlockedForDebt);
  const companyProfile = useStore((s) => s.companyProfile);

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [topUpAmount, setTopUpAmount] = useState("");
  const [selectedBank, setSelectedBank] = useState<"bistp" | "bgfi" | "afriland" | "dobra24">(
    "bistp",
  );
  const [transferProofRef, setTransferProofRef] = useState("");

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

  const isCompany =
    providerProfile?.providerType === "empresa" ||
    Boolean(providerProfile?.companyName) ||
    Boolean(companyProfile?.companyName) ||
    companyMonetization.companyName !== undefined;

  const state = balance <= 0 ? "sem_saldo" : "disponivel";
  const earned = txs.filter((t) => t.kind === "in").reduce((a, t) => a + t.amount, 0);

  const canPayout = isPayoutDay();
  const isPlanActive =
    isCompany && companyMonetization.model === "plano_mensal" && companyMonetization.planActive;

  function handlePayout() {
    const value = Number(amount);
    if (!value || value > balance) {
      toast.error("Valor inválido");
      return;
    }
    if (!canPayout) {
      toast.error("Levantamentos só às quintas-feiras", { description: payoutLabel() });
      return;
    }
    store.requestPayout(value);
    setAmount("");
    setPayoutOpen(false);
  }

  function handleTopUpDebt() {
    const value = Number(topUpAmount);
    if (!value || value <= 0) {
      toast.error("Insira um montante válido para recarga.");
      return;
    }

    const res = store.topUpProviderWallet(value, {
      method: selectedBank,
      ref: transferProofRef.trim() || undefined,
    });

    if (res.ok) {
      toast.success(res.message);
      setTopUpOpen(false);
      setTopUpAmount("");
      setTransferProofRef("");
    } else {
      toast.error(res.message);
    }
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
        <h1 className="text-2xl font-extrabold tracking-tight">Ganhos & Gestão PRO</h1>
        <p className="text-sm text-muted-foreground">
          Gestão financeira STP, liquidação de comissões, equipa e planos empresariais.
        </p>
      </header>

      {/* Alerta de Bloqueio por Dívida */}
      {isProviderBlockedForDebt && (
        <div className="px-5 pt-2">
          <div className="p-4 rounded-2xl bg-destructive/15 border-2 border-destructive/40 text-destructive text-xs space-y-2">
            <div className="flex items-center gap-2 font-black text-sm">
              <AlertTriangle size={18} />
              <span>Conta Suspensa por Dívida (≥ 500 STN)</span>
            </div>
            <p className="leading-relaxed text-foreground/90">
              A sua dívida acumulada de comissões por serviços presenciais em dinheiro atingiu{" "}
              <strong>{providerDebt} STN</strong>. A sua capacidade de emitir orçamentos e propor
              visitas foi temporariamente suspensa.
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

      {/* Saldo da Carteira & Regularização de Dívida */}
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <KCard className="bg-primary text-primary-foreground">
            <div className="flex items-center justify-between">
              <span className="text-xs opacity-80">Saldo disponível</span>
              <StatusPill tone={walletStateMeta[state].tone}>
                {walletStateMeta[state].label}
              </StatusPill>
            </div>
            <p className="mt-2 text-3xl font-extrabold tracking-tight font-mono">
              {formatDb(balance)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPayoutOpen(true)}
                disabled={!canPayout || balance <= 0}
                className="press min-h-11 rounded-xl bg-primary-foreground text-xs font-bold text-primary disabled:opacity-60 cursor-pointer"
              >
                Levantamento
              </button>
              <button
                type="button"
                onClick={() => setTopUpOpen(true)}
                className="press min-h-11 rounded-xl bg-white/20 text-xs font-bold text-white hover:bg-white/30 transition cursor-pointer"
              >
                Recarregar / Regularizar
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] opacity-80">
              Ciclo semanal de saques · {payoutLabel()}
            </p>
          </KCard>

          {/* Cartão de Estado da Dívida */}
          <KCard className="border border-border/80 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <AlertCircle size={15} className="text-amber-600" /> Dívida de Comissões
              </span>
              <StatusPill
                tone={providerDebt >= 500 ? "danger" : providerDebt > 0 ? "warning" : "success"}
              >
                {providerDebt >= 500
                  ? "Bloqueado (≥ 500 STN)"
                  : providerDebt > 0
                    ? `Pendente (${formatDb(providerDebt)})`
                    : "Regular (0 STN)"}
              </StatusPill>
            </div>

            <div>
              <p className="text-2xl font-black font-mono text-foreground">
                {formatDb(providerDebt)}
              </p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">
                Limite de tolerância: <strong>500 STN</strong>. Cobranças em mão acumulam comissão
                aqui.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setTopUpAmount(String(Math.max(providerDebt, 100)));
                setTopUpOpen(true);
              }}
              className="w-full py-2.5 rounded-xl border border-border bg-muted/60 hover:bg-muted text-foreground font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Banknote size={14} className="text-primary" /> Liquidar / Transferir Comissões
            </button>
          </KCard>
        </div>
      </Section>

      {/* Gestão de Empresa & Técnicos (Apenas se for Empresa) */}
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
                        Tel: {t.phone || "N/A"} · {t.specialties.join(", ")}
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

      {/* Modelo de Cobrança: Exclusividade de Plano Mensal para Empresas */}
      <Section title="Modelo de Cobrança KONEKTA">
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
            <StatusPill tone={isPlanActive ? "success" : "default"}>
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
              <Sparkles size={14} />
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

      <Section>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total ganho"
            value={formatDb(earned)}
            tone="success"
            icon={<TrendingUp size={15} />}
          />
          <StatCard
            label="Taxa de Serviço"
            value={isPlanActive ? "0%" : `${commission}%`}
            tone={isPlanActive ? "success" : "warning"}
          />
        </div>
      </Section>

      {/* Simulador Calculadora KONEKTA */}
      <Section title="Simulador de Preços & Recebimento">
        <KonektaCalculator
          initialTotal={500}
          feePct={isPlanActive ? 0 : commission}
          editable={true}
          isClientView={false}
          showSubtitle={true}
        />
      </Section>

      <Section title="Movimentos" className="space-y-3 pb-10">
        {txs.length === 0 ? (
          <EmptyState
            title="Ainda sem movimentos"
            description="Os pagamentos dos seus serviços aparecem aqui."
          />
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
              <span
                className={`text-sm font-bold font-mono ${t.kind === "in" ? "text-success" : "text-foreground"}`}
              >
                {t.kind === "in" ? "+" : "−"}
                {formatDb(t.amount)}
              </span>
            </KCard>
          ))
        )}
      </Section>

      {/* Modal de Levantamento */}
      <BottomSheet
        open={payoutOpen}
        onClose={() => setPayoutOpen(false)}
        title="Solicitar levantamento"
        description={`Disponível: ${formatDb(balance)} · ${payoutLabel()}`}
      >
        <div className="space-y-3">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="numeric"
            placeholder="Valor em Db"
            className="min-h-12 w-full rounded-2xl bg-muted px-4 text-sm outline-none ring-1 ring-transparent focus:ring-primary font-mono"
          />
          <button
            type="button"
            onClick={handlePayout}
            className="press min-h-12 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground cursor-pointer"
          >
            Confirmar Levantamento
          </button>
        </div>
      </BottomSheet>

      {/* Modal de Recarga Bancária STP & Regularização de Dívida */}
      <BottomSheet
        open={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        title="Recarregar Saldo / Regularizar Dívida"
        description="Deposite ou transfira para as contas oficiais KONEKTA em São Tomé e Príncipe para liquidar dívidas de comissão."
      >
        <div className="space-y-4 pt-2">
          {providerDebt > 0 && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-900 dark:text-amber-200">
              Dívida atual: <strong>{formatDb(providerDebt)}</strong>. Qualquer recarga amortiza
              automaticamente a sua dívida e desbloqueia a sua conta.
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
              Referência ou Comprovativo (opcional)
            </label>
            <input
              type="text"
              value={transferProofRef}
              onChange={(e) => setTransferProofRef(e.target.value)}
              placeholder="Ex: TRF-BISTP-849302 ou nº de telefone"
              className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleTopUpDebt}
            className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
          >
            <Check size={16} /> Confirmar Depósito & Liquidar Comissões
          </button>
        </div>
      </BottomSheet>

      {/* Modal de Adicionar Novo Técnico à Empresa */}
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

      {/* Modal de Escolha do Modelo: Exclusivo para Empresas */}
      <BottomSheet
        open={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title="Modelos de Cobrança para Empresas"
        description="Apenas empresas prestadoras de serviços podem alternar entre Comissão ou Plano Mensal."
      >
        <div className="space-y-4 pt-2">
          {/* Opção 1: Comissão Avulsa */}
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

          {/* Opção 2: Plano Mensal Empresa */}
          <div
            className={`p-4 rounded-2xl border-2 transition ${
              isPlanActive ? "border-emerald-500 bg-emerald-500/10" : "border-border bg-card"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-foreground flex items-center gap-1">
                <Sparkles size={14} className="text-amber-500" /> Plano Mensal Empresa (0% Comissão)
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

      {/* Modal de Upgrade para Empresa */}
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
