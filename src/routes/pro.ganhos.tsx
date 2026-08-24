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
      { title: "Ganhos · KONEKTA" },
      {
        name: "description",
        content:
          "Consulte os seus ganhos, comissões, planos de empresa e levantamentos como prestador KONEKTA.",
      },
      { property: "og:title", content: "Ganhos · KONEKTA" },
      {
        property: "og:description",
        content: "Carteira do prestador, planos empresariais e comissões.",
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
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [companyUpgradeModalOpen, setCompanyUpgradeModalOpen] = useState(false);
  const [companyNameInput, setCompanyNameInput] = useState(providerProfile?.companyName || "");
  const [companyNifInput, setCompanyNifInput] = useState(providerProfile?.documents?.nif || "");

  const isCompany =
    providerProfile?.providerType === "empresa" ||
    Boolean(providerProfile?.companyName) ||
    companyMonetization.companyName !== undefined;

  const state = balance <= 0 ? "sem_saldo" : "disponivel";
  const earned = txs.filter((t) => t.kind === "in").reduce((a, t) => a + t.amount, 0);

  const canPayout = isPayoutDay();
  const isPlanActive =
    isCompany && companyMonetization.model === "plano_mensal" && companyMonetization.planActive;

  function payout() {
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
    setOpen(false);
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
    toast.success("Perfil atualizado para Empresa Prestadora de Serviços!");
    setCompanyUpgradeModalOpen(false);
    setPlanModalOpen(true);
  }

  return (
    <AppShell roles={["prestador"]}>
      <header className="px-5 pb-2 pt-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Ganhos & Planos</h1>
        <p className="text-sm text-muted-foreground">
          Gestão financeira, comissões transparentes e planos exclusivos para empresas.
        </p>
      </header>

      <Section>
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
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!canPayout || balance <= 0}
            className="press mt-4 min-h-12 w-full rounded-full bg-primary-foreground text-sm font-bold text-primary disabled:opacity-60 cursor-pointer"
          >
            Solicitar levantamento
          </button>
          <p className="mt-2 text-center text-[11px] opacity-80">
            Ciclo semanal de saques · {payoutLabel()}
          </p>
        </KCard>
      </Section>

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
        open={open}
        onClose={() => setOpen(false)}
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
            onClick={payout}
            className="press min-h-12 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground cursor-pointer"
          >
            Confirmar
          </button>
        </div>
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
        description="Empresas registadas têm acesso a planos mensais fixos com 0% de taxa por serviço."
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
