import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Phone,
  Mail,
  Users,
  Building2,
  DollarSign,
  Car,
  Save,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Layers,
  Scale,
  Gavel,
  AlertOctagon,
  Compass,
  FileCheck,
  Check,
  X,
  CreditCard,
  ArrowDownToLine,
  ArrowUpFromLine,
  Clock,
  Banknote,
  Receipt,
  UserCheck,
  Lock,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill } from "@/components/konekta/kit";
import {
  store,
  useStore,
  type ModerationDispute,
  type DepositRequest,
  type PayoutRequest,
} from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { getCategoryBenchmark } from "@/lib/price-benchmark";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Painel de Administração · KONEKTA STP" },
      {
        name: "description",
        content:
          "Validação de recargas e depósitos de saldo, repasses a prestadores, custódia escrow, moderação e configurações.",
      },
    ],
  }),
  component: AdminPage,
});

export default function AdminPage() {
  const config = useStore((s) => s.config);
  const technicalVisits = useStore((s) => s.technicalVisits);
  const moderationDisputes = useStore((s) => s.moderationDisputes);
  const orders = useStore((s) => s.orders);
  const depositRequests = useStore((s) => s.depositRequests || []);
  const payoutRequests = useStore((s) => s.payoutRequests || []);
  const companyMonetization = useStore((s) => s.companyMonetization);

  // Tab Navigation State
  const [activeTab, setActiveTab] = useState<
    "deposits" | "payouts" | "escrow" | "ledger" | "disputes" | "visits" | "config"
  >(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (
        t === "deposits" ||
        t === "payouts" ||
        t === "escrow" ||
        t === "ledger" ||
        t === "disputes" ||
        t === "visits" ||
        t === "config"
      ) {
        return t;
      }
    }
    return "deposits";
  });

  const transactions = useStore((s) => s.transactions);
  const [ledgerFilter, setLedgerFilter] = useState<"all" | "in" | "out">("all");

  // Filters
  const [depositFilter, setDepositFilter] = useState<
    "todos" | "pendentes" | "aprovados" | "rejeitados"
  >("pendentes");
  const [payoutFilter, setPayoutFilter] = useState<"todos" | "pendentes" | "processados">(
    "pendentes",
  );
  const [disputeFilter, setDisputeFilter] = useState<"todos" | "pendentes" | "resolvidos">(
    "pendentes",
  );

  // Dispute moderation action states
  const [activeResolvingId, setActiveResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [customArbitratedAmount, setCustomArbitratedAmount] = useState("");

  // Reject modal state
  const [rejectDepositId, setRejectDepositId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Form states for editable config
  const [whatsapp, setWhatsapp] = useState(config.officialWhatsapp || "+239 9944747");
  const [email, setEmail] = useState(config.officialEmail || "edeleydamiao@gmail.com");
  const [clientGroup, setClientGroup] = useState(
    config.clientWhatsappGroup || "https://chat.whatsapp.com/KONEKTA-Clientes-STP",
  );
  const [providerGroup, setProviderGroup] = useState(
    config.providerWhatsappGroup || "https://chat.whatsapp.com/KONEKTA-Prestadores-STP",
  );
  const [commissionPct, setCommissionPct] = useState(String(config.commissionPct || 20));
  const [companyPlanFee, setCompanyPlanFee] = useState(
    String(config.companyMonthlyPlanFee || 1500),
  );
  const [companyCommissionPct, setCompanyCommissionPct] = useState(
    String(config.companyCommissionPct || 0),
  );
  const [technicalVisitFee, setTechnicalVisitFee] = useState(
    String(config.technicalVisitFee || 150),
  );
  const [isSaving, setIsSaving] = useState(false);

  // Counts
  const pendingDeposits = depositRequests.filter((d) => d.status === "pendente_aprovacao");
  const pendingPayouts = payoutRequests.filter((p) => p.status === "pendente");
  const pendingDisputes = moderationDisputes.filter((d) => d.status === "pendente");

  const activeEscrowTotal = orders
    .filter((o) => o.status !== "concluido" && o.status !== "avaliado")
    .reduce((acc, o) => acc + o.total, 0);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    setTimeout(() => {
      store.updateConfig({
        officialWhatsapp: whatsapp.trim(),
        officialEmail: email.trim(),
        clientWhatsappGroup: clientGroup.trim(),
        providerWhatsappGroup: providerGroup.trim(),
        commissionPct: Number(commissionPct) || 20,
        companyMonthlyPlanFee: Number(companyPlanFee) || 1500,
        companyCommissionPct: Number(companyCommissionPct) || 0,
        technicalVisitFee: Number(technicalVisitFee) || 150,
      });

      setIsSaving(false);
      toast.success("Configurações do KONEKTA atualizadas com sucesso!");
    }, 400);
  };

  const filteredDeposits = depositRequests.filter((d) => {
    if (depositFilter === "pendentes") return d.status === "pendente_aprovacao";
    if (depositFilter === "aprovados") return d.status === "aprovado";
    if (depositFilter === "rejeitados") return d.status === "rejeitado";
    return true;
  });

  const filteredPayouts = payoutRequests.filter((p) => {
    if (payoutFilter === "pendentes") return p.status === "pendente";
    if (payoutFilter === "processados") return p.status === "processado";
    return true;
  });

  return (
    <AppShell>
      <header className="px-5 pb-2 pt-8">
        <div className="flex items-center gap-2">
          <Link
            to="/definicoes"
            className="size-8 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </Link>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            Acesso Restrito Admin
          </span>
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground mt-2">
          Painel de Controlo KONEKTA
        </h1>
        <p className="text-xs text-muted-foreground font-medium">
          Validação bancária de recargas, gestão de custódia escrow, repasses de prestadores e
          controlo operacional.
        </p>
      </header>

      {/* Indicadores Globais no Topo */}
      <Section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Recargas Pendentes
              </p>
              <CreditCard size={14} className="text-amber-500" />
            </div>
            <p className="text-base font-black text-foreground mt-0.5">{pendingDeposits.length}</p>
            <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
              Exigem validação admin
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Custódia Ativa
              </p>
              <Lock size={14} className="text-primary" />
            </div>
            <p className="text-base font-black text-primary mt-0.5">
              {formatDb(activeEscrowTotal)}
            </p>
            <p className="text-[10px] text-muted-foreground">Retido na plataforma</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Saques Prestador
              </p>
              <ArrowUpFromLine size={14} className="text-blue-500" />
            </div>
            <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {pendingPayouts.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Repasses a efetuar</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Comissão Padrão
              </p>
              <Scale size={14} className="text-emerald-500" />
            </div>
            <p className="text-base font-black text-foreground mt-0.5">{config.commissionPct}%</p>
            <p className="text-[10px] text-muted-foreground">Split retido no OTP</p>
          </div>
        </div>
      </Section>

      {/* Tabs de Navegação Admin */}
      <Section>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("deposits")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "deposits"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <CreditCard size={14} />
            Validação de Recargas
            {pendingDeposits.length > 0 && (
              <span className="size-4 rounded-full bg-amber-500 text-white text-[10px] grid place-items-center font-black">
                {pendingDeposits.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payouts")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "payouts"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowUpFromLine size={14} />
            Saques & Repasses
            {pendingPayouts.length > 0 && (
              <span className="size-4 rounded-full bg-blue-500 text-white text-[10px] grid place-items-center font-black">
                {pendingPayouts.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("escrow")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "escrow"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock size={14} />
            Custódia Escrow ({orders.filter((o) => o.status !== "concluido").length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ledger")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "ledger"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Receipt size={14} />
            Livro-Razão & Receita ({transactions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("disputes")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "disputes"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Scale size={14} />
            Disputas & Moderação
            {pendingDisputes.length > 0 && (
              <span className="size-4 rounded-full bg-red-500 text-white text-[10px] grid place-items-center font-black">
                {pendingDisputes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("visits")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "visits"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Car size={14} />
            Visitas Técnicas ({technicalVisits.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("config")}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "config"
                ? "bg-primary text-primary-foreground shadow-2xs"
                : "bg-muted/70 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Save size={14} />
            Definições & Taxas
          </button>
        </div>
      </Section>

      {/* ABA 1: VALIDAÇÃO DE RECARGAS & DEPÓSITOS (ADMIN CONFIRMATION) */}
      {activeTab === "deposits" && (
        <Section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <CreditCard size={16} className="text-primary" />
                Validação de Depósitos & Saldo de Carteira
              </h2>
              <p className="text-[11px] text-muted-foreground">
                O saldo da carteira do cliente ou prestador só é creditado após a sua aprovação.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setDepositFilter("pendentes")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  depositFilter === "pendentes"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pendentes ({pendingDeposits.length})
              </button>
              <button
                type="button"
                onClick={() => setDepositFilter("todos")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  depositFilter === "todos"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos ({depositRequests.length})
              </button>
              <button
                type="button"
                onClick={() => setDepositFilter("aprovados")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  depositFilter === "aprovados"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Aprovados
              </button>
              <button
                type="button"
                onClick={() => setDepositFilter("rejeitados")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  depositFilter === "rejeitados"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Rejeitados
              </button>
            </div>
          </div>

          {filteredDeposits.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 opacity-60" />
              <p className="text-xs font-bold text-foreground">
                Nenhum pedido de recarga {depositFilter === "pendentes" ? "pendente" : "encontrado"}
                .
              </p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Quando clientes ou prestadores efetuarem transferências bancárias (BISTP, BGFI,
                Afriland, Dobra 24) ou utilizarem Pontos de Recarga, os comprovativos aparecerão
                aqui para validação.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDeposits.map((dep) => {
                const isPending = dep.status === "pendente_aprovacao";
                const isClient = dep.userRole === "cliente";

                return (
                  <KCard
                    key={dep.id}
                    className={`border transition space-y-3 ${
                      isPending
                        ? "border-amber-500/40 bg-amber-500/[0.02]"
                        : dep.status === "aprovado"
                          ? "border-emerald-500/30"
                          : "border-border/60 opacity-80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-foreground">{dep.id}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isClient
                                ? "bg-sky-500/10 text-sky-700 dark:text-sky-300"
                                : "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                            }`}
                          >
                            {isClient ? "👤 Cliente" : "🛠️ Prestador"}
                          </span>
                          <span className="text-[11px] font-semibold text-foreground">
                            {dep.userName}
                          </span>
                          {dep.userPhone && (
                            <span className="text-[10px] text-muted-foreground">
                              · {dep.userPhone}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Método:{" "}
                          <strong className="text-foreground">{dep.bankOrProviderName}</strong>
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>Ref / Comprovativo:</span>
                          <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[10px] font-bold">
                            {dep.referenceOrPhone}
                          </code>
                        </div>

                        {dep.notes && (
                          <p className="text-[11px] text-muted-foreground italic bg-muted/40 p-1.5 rounded-lg">
                            "{dep.notes}"
                          </p>
                        )}
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-primary">{formatDb(dep.amount)}</p>
                        <div className="mt-1">
                          <StatusPill
                            tone={
                              dep.status === "aprovado"
                                ? "success"
                                : dep.status === "pendente_aprovacao"
                                  ? "accent"
                                  : "error"
                            }
                          >
                            {dep.status === "aprovado"
                              ? "✅ Aprovado"
                              : dep.status === "pendente_aprovacao"
                                ? "⏳ Aguarda Validação"
                                : "❌ Rejeitado"}
                          </StatusPill>
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">
                          {new Date(dep.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Ações de Moderação do Depósito */}
                    {isPending ? (
                      <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2">
                        {rejectDepositId === dep.id ? (
                          <div className="w-full p-3 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                            <p className="text-xs font-bold text-red-700 dark:text-red-300">
                              Motivo da Recusa do Depósito:
                            </p>
                            <input
                              type="text"
                              value={rejectionReason}
                              onChange={(e) => setRejectionReason(e.target.value)}
                              placeholder="Ex: Comprovativo ilegível ou montante não entrou na conta BISTP..."
                              className="w-full h-8 px-2.5 rounded-lg bg-card border border-border text-xs text-foreground"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectDepositId(null);
                                  setRejectionReason("");
                                }}
                                className="px-3 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
                              >
                                Cancelar
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const res = store.rejectDepositRequest(
                                    dep.id,
                                    rejectionReason || "Comprovativo bancário não localizado.",
                                  );
                                  if (res.ok) {
                                    toast.success(res.message);
                                    setRejectDepositId(null);
                                    setRejectionReason("");
                                  }
                                }}
                                className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold text-xs"
                              >
                                Confirmar Recusa
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setRejectDepositId(dep.id)}
                              className="px-3 py-2 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                            >
                              <X size={13} className="inline mr-1" />
                              Recusar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const res = store.approveDepositRequest(dep.id);
                                if (res.ok) toast.success(res.message);
                              }}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs flex items-center gap-1.5 transition cursor-pointer active:scale-98"
                            >
                              <Check size={14} />
                              Confirmar Pagamento & Creditar Saldo
                            </button>
                          </>
                        )}
                      </div>
                    ) : dep.status === "aprovado" ? (
                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          Saldo creditado com sucesso na carteira do utilizador.
                        </span>
                        <span>Validado por: {dep.reviewedBy || "Admin KONEKTA"}</span>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-border/60 text-[11px] text-red-600 dark:text-red-400">
                        <span>Motivo da recusa: {dep.rejectionReason}</span>
                      </div>
                    )}
                  </KCard>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* ABA 2: SAQUES & REPASSES DOS PRESTADORES (PAYOUTS) */}
      {activeTab === "payouts" && (
        <Section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <ArrowUpFromLine size={16} className="text-blue-500" />
                Pedidos de Levantamento / Repasses a Prestadores
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Efetue a transferência bancária a partir da conta KONEKTA e confirme o envio abaixo.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setPayoutFilter("pendentes")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  payoutFilter === "pendentes"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pendentes ({pendingPayouts.length})
              </button>
              <button
                type="button"
                onClick={() => setPayoutFilter("todos")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  payoutFilter === "todos"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos ({payoutRequests.length})
              </button>
            </div>
          </div>

          {filteredPayouts.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-blue-500 opacity-60" />
              <p className="text-xs font-bold text-foreground">Nenhum pedido de saque pendente.</p>
              <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
                Quando os prestadores solicitarem o levantamento dos seus ganhos líquidos para
                contas BISTP, BGFI ou Dobra 24, os pedidos serão listados aqui.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayouts.map((pay) => {
                const isPending = pay.status === "pendente";

                return (
                  <KCard key={pay.id} className="border border-border/80 shadow-2xs space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-foreground">{pay.id}</span>
                          <span className="text-xs font-bold text-foreground">
                            {pay.providerName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            · {pay.providerPhone}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Banco / Método:{" "}
                          <strong className="text-foreground uppercase">{pay.method}</strong>
                        </p>

                        <div className="text-[11px] text-muted-foreground">
                          <span>Conta / NIB de Destino: </span>
                          <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-[11px] font-bold">
                            {pay.accountDetails}
                          </code>
                        </div>

                        <p className="text-[10px] text-muted-foreground">
                          Titular da Conta: <strong>{pay.holderName}</strong>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-base font-black text-blue-600 dark:text-blue-400">
                          {formatDb(pay.amount)}
                        </p>
                        <div className="mt-1">
                          <StatusPill tone={isPending ? "accent" : "success"}>
                            {isPending ? "⏳ Aguarda Transferência" : "✅ Processado"}
                          </StatusPill>
                        </div>
                      </div>
                    </div>

                    {isPending ? (
                      <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const res = store.rejectPayoutRequest(
                              pay.id,
                              "Dados bancários incorretos.",
                            );
                            if (res.ok) toast.success(res.message);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground"
                        >
                          Recusar & Devolver Saldo
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const res = store.approvePayoutRequest(pay.id);
                            if (res.ok) toast.success(res.message);
                          }}
                          className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs flex items-center gap-1.5"
                        >
                          <Check size={14} />
                          Confirmar Transferência Executada
                        </button>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-border/60 text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={13} />
                        Transferência concluída e registada no extrato do prestador.
                      </div>
                    )}
                  </KCard>
                );
              })}
            </div>
          )}
        </Section>
      )}

      {/* ABA 3: CUSTÓDIA ESCROW & PEDIDOS EM ANDAMENTO */}
      {activeTab === "escrow" && (
        <Section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Lock size={16} className="text-primary" />
                Painel de Custódia Segura (Escrow Model)
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Pagamentos integrais retidos pela plataforma até validação por OTP presencial.
              </p>
            </div>
            <span className="text-xs font-black text-primary">
              Total Retido: {formatDb(activeEscrowTotal)}
            </span>
          </div>

          <div className="space-y-3">
            {orders.map((order) => {
              const isFinished = order.status === "concluido" || order.status === "avaliado";
              const commAmount = Math.round((order.total * (config.commissionPct || 20)) / 100);
              const netAmount = order.total - commAmount;

              return (
                <KCard key={order.id} className="border border-border/80 shadow-2xs space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-foreground">{order.id}</span>
                        <span className="text-xs font-bold text-foreground">{order.service}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Cliente: <strong>{order.clientName || "Cliente KONEKTA"}</strong> ➔
                        Prestador: <strong>{order.providerId}</strong>
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        📍 {order.district || "São Tomé"} · 📅 {order.scheduledFor}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base font-black text-primary">{formatDb(order.total)}</p>
                      <div className="mt-0.5">
                        <StatusPill
                          tone={
                            isFinished
                              ? "success"
                              : order.status === "a-caminho" || order.status === "em-execucao"
                                ? "accent"
                                : "default"
                          }
                        >
                          {isFinished
                            ? "✅ Liquidado"
                            : order.status === "a-caminho"
                              ? "🚗 A caminho"
                              : order.status === "em-execucao"
                                ? "⚡ Em execução"
                                : "💰 Pago em Custódia"}
                        </StatusPill>
                      </div>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-muted/40 border border-border/60 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Valor em Custódia
                      </span>
                      <strong className="text-foreground">{formatDb(order.total)}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Comissão Plataforma ({config.commissionPct}%)
                      </span>
                      <strong className="text-emerald-700 dark:text-emerald-400">
                        {formatDb(commAmount)}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Líquido ao Prestador
                      </span>
                      <strong className="text-blue-700 dark:text-blue-400">
                        {formatDb(netAmount)}
                      </strong>
                    </div>
                  </div>

                  {order.completionCode && (
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>
                        Código OTP de Conclusão:{" "}
                        <strong className="text-foreground tracking-widest font-mono">
                          {order.completionCode}
                        </strong>
                      </span>
                      <span className="text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                        100% Protegido em Escrow
                      </span>
                    </div>
                  )}
                </KCard>
              );
            })}
          </div>
        </Section>
      )}

      {/* ABA: LIVRO-RAZÃO & AUDITORIA DE RECEITAS (LEDGER) */}
      {activeTab === "ledger" && (
        <Section>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Receipt size={16} className="text-primary" />
                  Livro-Razão Geral & Receitas KONEKTA
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Auditoria imutável de todos os movimentos financeiros da carteira digital e split
                  de comissão
                </p>
              </div>
              <span className="text-xs font-bold text-muted-foreground">
                {transactions.length} registos
              </span>
            </div>

            {/* Métricas de Receita e GMV */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Volume Transacionado (GMV)
                </span>
                <p className="text-base font-black text-foreground mt-0.5">
                  {formatDb(
                    transactions
                      .filter((t) => t.kind === "in")
                      .reduce((acc, t) => acc + t.amount, 0),
                  )}
                </p>
                <span className="text-[9px] text-muted-foreground">
                  Total depositado em carteira
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                  Comissões KONEKTA (15%)
                </span>
                <p className="text-base font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {formatDb(
                    orders
                      .filter((o) => o.status === "concluido" || o.status === "avaliado")
                      .reduce((acc, o) => acc + Math.round((o.total * 15) / 100), 0) || 375,
                  )}
                </p>
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400">
                  Receita líquida retida
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block">
                  Em Custódia Escrow
                </span>
                <p className="text-base font-black text-amber-700 dark:text-amber-400 mt-0.5">
                  {formatDb(activeEscrowTotal)}
                </p>
                <span className="text-[9px] text-amber-600 dark:text-amber-400">
                  Fundos retidos nos serviços
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 shadow-2xs">
                <span className="text-[10px] uppercase font-bold text-blue-800 dark:text-blue-300 block">
                  Repasses Pagos aos Técnicos
                </span>
                <p className="text-base font-black text-blue-700 dark:text-blue-400 mt-0.5">
                  {formatDb(
                    payoutRequests
                      .filter((p) => p.status === "processado")
                      .reduce((acc, p) => acc + p.amount, 0) || 1250,
                  )}
                </p>
                <span className="text-[9px] text-blue-600 dark:text-blue-400">
                  Transferências bancárias
                </span>
              </div>
            </div>

            {/* Filtros do Livro-Razão */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLedgerFilter("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  ledgerFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos ({transactions.length})
              </button>
              <button
                onClick={() => setLedgerFilter("in")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  ledgerFilter === "in"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Entradas / Recargas
              </button>
              <button
                onClick={() => setLedgerFilter("out")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  ledgerFilter === "out"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                Saídas / Pagamentos
              </button>
            </div>

            {/* Lista de Registos Ledger */}
            <div className="space-y-2">
              {transactions
                .filter((t) => {
                  if (ledgerFilter === "in") return t.kind === "in";
                  if (ledgerFilter === "out") return t.kind === "out";
                  return true;
                })
                .map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3.5 rounded-2xl bg-card border border-border/80 flex items-center justify-between shadow-2xs text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {tx.id}
                        </span>
                        <strong className="text-foreground">{tx.label}</strong>
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Data: {new Date(tx.at).toLocaleString("pt-PT")}
                      </span>
                    </div>

                    <div className="text-right">
                      <strong
                        className={`text-sm font-black ${
                          tx.kind === "in"
                            ? "text-emerald-700 dark:text-emerald-400"
                            : "text-foreground"
                        }`}
                      >
                        {tx.kind === "in" ? "+" : "-"}
                        {tx.amount.toLocaleString("pt-PT")} STN
                      </strong>
                      <span className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground block">
                        {tx.kind === "in" ? "Crédito" : "Débito"}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </Section>
      )}
      {activeTab === "disputes" && (
        <Section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Scale size={16} className="text-primary" />
                Casos de Moderação & Auditoria de Divergência
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Casos onde a declaração presencial divergiu do valor acordado ou da média de mercado
                STP.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setDisputeFilter("pendentes")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  disputeFilter === "pendentes"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pendentes ({pendingDisputes.length})
              </button>
              <button
                type="button"
                onClick={() => setDisputeFilter("todos")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  disputeFilter === "todos"
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Todos ({moderationDisputes.length})
              </button>
            </div>
          </div>

          {(() => {
            const filteredDisputes = moderationDisputes.filter((d) => {
              if (disputeFilter === "pendentes") return d.status === "pendente";
              if (disputeFilter === "resolvidos") return d.status !== "pendente";
              return true;
            });

            if (filteredDisputes.length === 0) {
              return (
                <div className="p-8 rounded-2xl bg-card border border-border text-center space-y-2">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 opacity-60" />
                  <p className="text-xs font-bold text-foreground">
                    Nenhum caso de divergência pendente de moderação.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {filteredDisputes.map((dispute) => {
                  const isPending = dispute.status === "pendente";
                  const isResolving = activeResolvingId === dispute.id;

                  return (
                    <KCard
                      key={dispute.id}
                      className="border border-border/80 shadow-2xs space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground">
                            {dispute.id} · {dispute.district}
                          </span>
                          <h3 className="text-sm font-bold text-foreground mt-0.5">
                            {dispute.serviceTitle}
                          </h3>
                        </div>
                        <StatusPill tone={isPending ? "error" : "success"}>
                          {isPending ? "⚠️ Em Moderação" : "✅ Resolvido"}
                        </StatusPill>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-muted/40 border border-border/60 text-xs">
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Prestador Declarou:
                          </span>
                          <strong className="text-red-700 dark:text-red-400 text-sm">
                            {formatDb(dispute.conflict.providerDeclaredAmount)}
                          </strong>
                          <p className="text-[10px] text-muted-foreground">
                            {dispute.provider.name}
                          </p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground block">
                            Cliente Informou:
                          </span>
                          <strong className="text-emerald-700 dark:text-emerald-400 text-sm">
                            {formatDb(dispute.conflict.clientDeclaredAmount)}
                          </strong>
                          <p className="text-[10px] text-muted-foreground">{dispute.client.name}</p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
                        <p className="font-bold text-amber-800 dark:text-amber-300">
                          📊 Análise Algorítmica de Mercado:
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {dispute.marketBenchmark.analysisVerdict}
                        </p>
                      </div>

                      {isPending && (
                        <div className="pt-2 border-t border-border/60 flex items-center justify-end gap-2">
                          {!isResolving ? (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveResolvingId(dispute.id);
                                setCustomArbitratedAmount(
                                  String(dispute.marketBenchmark.avgPrice || 450),
                                );
                              }}
                              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-2xs flex items-center gap-1.5"
                            >
                              <Gavel size={14} />
                              Arbitrar Decisão Admin
                            </button>
                          ) : (
                            <div className="w-full p-3 rounded-xl bg-muted/60 border border-border space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground">
                                  Decisão do Moderador
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setActiveResolvingId(null)}
                                  className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Cancelar
                                </button>
                              </div>
                              <input
                                type="number"
                                value={customArbitratedAmount}
                                onChange={(e) => setCustomArbitratedAmount(e.target.value)}
                                placeholder="Valor final arbitrado em STN"
                                className="w-full h-8 px-2.5 rounded-lg bg-card border border-border text-xs text-foreground font-bold"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const res = store.resolveModerationCase({
                                      disputeId: dispute.id,
                                      resolution: "custom_arbitrated",
                                      resolvedAmount:
                                        Number(customArbitratedAmount) ||
                                        dispute.marketBenchmark.avgPrice,
                                      moderatorNotes: "Decisão arbitral final da administração.",
                                    });
                                    if (res.ok) {
                                      toast.success(res.message);
                                      setActiveResolvingId(null);
                                    }
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs"
                                >
                                  Aplicar Valor Arbitrado
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </KCard>
                  );
                })}
              </div>
            );
          })()}
        </Section>
      )}

      {/* ABA 5: VISITAS TÉCNICAS */}
      {activeTab === "visits" && (
        <Section>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Car size={16} className="text-primary" />
                Visitas Técnicas no Terreno
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Modelo de deslocação Uber-style para avaliação no local com taxa retida.
              </p>
            </div>
          </div>

          {technicalVisits.length === 0 ? (
            <div className="p-8 rounded-2xl bg-card border border-border text-center">
              <p className="text-xs text-muted-foreground">
                Nenhuma visita técnica solicitada no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {technicalVisits.map((v) => (
                <KCard key={v.id} className="border border-border/80 shadow-2xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-muted-foreground">{v.id}</span>
                      <p className="text-xs font-bold text-foreground mt-0.5">{v.serviceTitle}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {v.clientName} ➔ <strong>{v.providerName}</strong> · {v.district}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        📅 {v.scheduledDate} às {v.scheduledTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <StatusPill
                        tone={
                          v.status === "concluido"
                            ? "success"
                            : v.status === "a_caminho"
                              ? "accent"
                              : "default"
                        }
                      >
                        {v.status === "a_caminho"
                          ? "🚗 A caminho"
                          : v.status === "concluido"
                            ? "✅ Concluído"
                            : "⏳ Pendente"}
                      </StatusPill>
                      <p className="text-xs font-black text-primary mt-1">{formatDb(v.visitFee)}</p>
                      <p className="text-[9px] text-emerald-800 dark:text-emerald-300 font-bold">
                        Custódia Garantida
                      </p>
                    </div>
                  </div>
                </KCard>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ABA 6: DEFINIÇÕES & CONFIGURAÇÕES */}
      {activeTab === "config" && (
        <Section>
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <KCard className="border border-border/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Phone size={18} className="text-emerald-700 dark:text-emerald-400" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Contactos Oficiais da Plataforma
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Usados nos canais automáticos e suporte
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    WhatsApp Oficial KONEKTA
                  </label>
                  <input
                    type="text"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="+239 9944747"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Número oficial configurado:{" "}
                    <strong className="text-foreground">+239 9944747</strong>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Email Oficial de Suporte
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="edeleydamiao@gmail.com"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Email oficial configurado:{" "}
                    <strong className="text-foreground">edeleydamiao@gmail.com</strong>
                  </p>
                </div>
              </div>
            </KCard>

            <KCard className="border border-border/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <Users size={18} className="text-primary" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    Grupos WhatsApp da Comunidade KONEKTA
                  </h2>
                  <p className="text-[11px] text-muted-foreground">
                    Direcionamento automático após o registo de utilizadores
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Link do Grupo de Clientes no WhatsApp
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={clientGroup}
                      onChange={(e) => setClientGroup(e.target.value)}
                      className="flex-1 h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="https://chat.whatsapp.com/..."
                      required
                    />
                    <a
                      href={clientGroup}
                      target="_blank"
                      rel="noreferrer"
                      className="size-11 rounded-xl bg-card border border-border grid place-items-center text-muted-foreground hover:text-foreground"
                      title="Testar link"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Link do Grupo de Prestadores no WhatsApp
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={providerGroup}
                      onChange={(e) => setProviderGroup(e.target.value)}
                      className="flex-1 h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="https://chat.whatsapp.com/..."
                      required
                    />
                    <a
                      href={providerGroup}
                      target="_blank"
                      rel="noreferrer"
                      className="size-11 rounded-xl bg-card border border-border grid place-items-center text-muted-foreground hover:text-foreground"
                      title="Testar link"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </KCard>

            <KCard className="border border-border/80 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 border-b border-border/60 pb-3">
                <DollarSign size={18} className="text-amber-500" />
                <div>
                  <h2 className="text-sm font-bold text-foreground">Taxas, Comissões e Planos</h2>
                  <p className="text-[11px] text-muted-foreground">
                    Valores aplicados em toda a plataforma KONEKTA
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Comissão Padrão do Prestador (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={commissionPct}
                    onChange={(e) => setCommissionPct(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Percentagem retida no pagamento em custódia (ex: 20%)
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground block mb-1">
                    Mensalidade do Plano Empresa (Db / STN)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={companyPlanFee}
                    onChange={(e) => setCompanyPlanFee(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-xs font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Preço mensal para empresas com 0% comissão (ex: 1500 Db)
                  </p>
                </div>
              </div>
            </KCard>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black text-sm flex items-center justify-center gap-2 shadow-sm active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              <Save size={18} />
              {isSaving ? "A Guardar..." : "Guardar Todas as Definições"}
            </button>
          </form>
        </Section>
      )}
    </AppShell>
  );
}
