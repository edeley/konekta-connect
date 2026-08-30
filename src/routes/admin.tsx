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
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill } from "@/components/konekta/kit";
import { store, useStore, type ModerationDispute } from "@/lib/store";
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
          "Gestão oficial de contactos, grupos WhatsApp, taxas, planos empresariais e visitas técnicas.",
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
  const companyMonetization = useStore((s) => s.companyMonetization);

  const [disputeFilter, setDisputeFilter] = useState<"todos" | "pendentes" | "resolvidos">(
    "pendentes",
  );
  const [activeResolvingId, setActiveResolvingId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [customArbitratedAmount, setCustomArbitratedAmount] = useState("");

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
          Personalização de contactos oficiais, grupos de WhatsApp, comissões, planos e visitas no
          terreno.
        </p>
      </header>

      {/* Indicadores Globais */}
      <Section>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Custódia Ativa</p>
            <p className="text-base font-black text-primary mt-0.5">
              {formatDb(activeEscrowTotal)}
            </p>
            <p className="text-[10px] text-muted-foreground">Protegido no app</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">
              Visitas Uber-Style
            </p>
            <p className="text-base font-black text-emerald-800 dark:text-emerald-300 mt-0.5">
              {technicalVisits.length}
            </p>
            <p className="text-[10px] text-muted-foreground">Com saldo retido</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Taxa Padrão</p>
            <p className="text-base font-black text-foreground mt-0.5">{config.commissionPct}%</p>
            <p className="text-[10px] text-muted-foreground">Por serviço avulso</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-card border border-border/80 shadow-2xs">
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Plano Empresa</p>
            <p className="text-base font-black text-blue-800 dark:text-blue-300 mt-0.5">
              {formatDb(config.companyMonthlyPlanFee)}/mês
            </p>
            <p className="text-[10px] text-muted-foreground">0% comissão</p>
          </div>
        </div>
      </Section>

      {/* Formulário de Configuração Oficial */}
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

          {/* Grupos do WhatsApp */}
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

          {/* Modelos Financeiros & Visitas Técnicas */}
          <KCard className="border border-border/80 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-3">
              <DollarSign size={18} className="text-amber-500" />
              <div>
                <h2 className="text-sm font-bold text-foreground">
                  Comissões, Planos & Visitas no Terreno
                </h2>
                <p className="text-[11px] text-muted-foreground">
                  Regras financeiras para serviços, empresas e deslocação Uber-style
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Comissão Padrão por Serviço (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commissionPct}
                  onChange={(e) => setCommissionPct(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Cobrada sobre serviços avulsos
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Plano Mensal Empresa (Db/mês)
                </label>
                <input
                  type="number"
                  min="0"
                  value={companyPlanFee}
                  onChange={(e) => setCompanyPlanFee(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1">Isenção de comissões (0%)</p>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Taxa Visita Técnica Uber (Db)
                </label>
                <input
                  type="number"
                  min="0"
                  value={technicalVisitFee}
                  onChange={(e) => setTechnicalVisitFee(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl bg-muted/50 border border-border text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
                <p className="text-[10px] text-muted-foreground mt-1">Retido em custódia prévia</p>
              </div>
            </div>
          </KCard>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all"
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Guardar Configurações da Plataforma
          </button>
        </form>
      </Section>

      {/* Painel de Moderação & Disputas de Preço (Visitas Técnicas & Blindagem Escrow) */}
      <Section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Scale size={16} className="text-red-600 dark:text-red-400" />
            <h2 className="text-sm font-bold text-foreground">
              Moderação & Disputas de Preço (Escrow)
            </h2>
          </div>
          <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-xl">
            {(["todos", "pendentes", "resolvidos"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setDisputeFilter(filter)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition ${
                  disputeFilter === filter
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {(() => {
          const filteredDisputes = moderationDisputes.filter((d) => {
            if (disputeFilter === "pendentes")
              return d.status === "pendente" || d.status === "em_analise";
            if (disputeFilter === "resolvidos")
              return d.status === "resolvido" || d.status === "sancionado";
            return true;
          });

          if (filteredDisputes.length === 0) {
            return (
              <div className="p-6 rounded-2xl bg-card border border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Nenhuma disputa de moderação{" "}
                  {disputeFilter === "todos" ? "registada" : disputeFilter} no momento.
                </p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {filteredDisputes.map((dispute) => {
                const isResolving = activeResolvingId === dispute.id;

                return (
                  <KCard
                    key={dispute.id}
                    className={`border shadow-2xs space-y-3 ${
                      dispute.status === "pendente" || dispute.status === "em_analise"
                        ? "border-red-500/40 bg-red-500/5"
                        : "border-border/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded-md text-foreground">
                            {dispute.id}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              dispute.status === "pendente"
                                ? "bg-red-500/20 text-red-800 dark:text-red-300"
                                : dispute.status === "sancionado"
                                  ? "bg-purple-500/20 text-purple-800 dark:text-purple-300"
                                  : "bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                            }`}
                          >
                            {dispute.status === "pendente"
                              ? "🚨 Divergência >40% (Congelado)"
                              : dispute.status === "sancionado"
                                ? "⛔ Prestador Sancionado"
                                : "✅ Resolvido"}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold text-foreground mt-1">
                          {dispute.serviceTitle}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          Cliente: <strong>{dispute.clientName}</strong> · Prestador:{" "}
                          <strong>{dispute.providerName}</strong> ({dispute.district})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] font-bold text-red-800 dark:text-red-300 block">
                          Divergência
                        </span>
                        <span className="text-base font-black font-mono text-red-800 dark:text-red-300">
                          {dispute.divergencePercent.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Comparação dos Valores & Benchmark */}
                    <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-card border border-border text-center text-xs">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold block">
                          Prestador Declarou
                        </span>
                        <span className="font-black text-foreground">
                          {formatDb(dispute.providerAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold block">
                          Cliente Informou
                        </span>
                        <span className="font-black text-primary">
                          {formatDb(dispute.clientAmount)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold block">
                          Média STP Categoria
                        </span>
                        <span className="font-black text-emerald-800 dark:text-emerald-300">
                          {formatDb(dispute.benchmarkAverage)}
                        </span>
                      </div>
                    </div>

                    {dispute.clientNotes && (
                      <p className="text-[11px] text-muted-foreground italic bg-muted/40 p-2 rounded-lg">
                        &quot;{dispute.clientNotes}&quot;
                      </p>
                    )}

                    {dispute.status === "resolvido" || dispute.status === "sancionado" ? (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1">
                        <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                          <span>Resolução Aplicada:</span>
                          <span className="capitalize">{dispute.resolution}</span>
                        </div>
                        {dispute.resolvedAmount && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span>Valor Fixado em Custódia:</span>
                            <strong className="text-foreground">
                              {formatDb(dispute.resolvedAmount)}
                            </strong>
                          </div>
                        )}
                        {dispute.moderatorNotes && (
                          <p className="text-[10px] text-muted-foreground">
                            Nota do moderador: {dispute.moderatorNotes}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1 border-t border-border/60">
                        {!isResolving ? (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveResolvingId(dispute.id);
                                setCustomArbitratedAmount(String(dispute.benchmarkAverage));
                              }}
                              className="py-2 px-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98 transition"
                            >
                              <Gavel size={13} /> Arbitrar Decisão Admin
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const res = store.resolveModerationCase({
                                  disputeId: dispute.id,
                                  resolution: "accept_client",
                                  resolvedAmount: dispute.clientAmount,
                                  moderatorNotes: "Adotado valor informado pelo cliente.",
                                });
                                if (res.ok) toast.success(res.message);
                              }}
                              className="py-2 px-2.5 rounded-xl bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98 transition"
                            >
                              <Check size={13} /> Adotar Valor do Cliente (
                              {formatDb(dispute.clientAmount)})
                            </button>
                          </div>
                        ) : (
                          <div className="p-3 rounded-xl bg-muted/60 border border-border space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-foreground">
                                Decisão do Moderador
                              </span>
                              <button
                                type="button"
                                onClick={() => setActiveResolvingId(null)}
                                className="text-muted-foreground hover:text-foreground text-xs"
                              >
                                Cancelar
                              </button>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                Fixar Valor Final de Custódia (Db)
                              </label>
                              <input
                                type="number"
                                value={customArbitratedAmount}
                                onChange={(e) => setCustomArbitratedAmount(e.target.value)}
                                className="w-full h-9 px-3 rounded-lg bg-card border border-border text-xs font-bold text-foreground"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">
                                Justificação / Parecer do Moderador
                              </label>
                              <textarea
                                value={resolutionNotes}
                                onChange={(e) => setResolutionNotes(e.target.value)}
                                rows={2}
                                placeholder="Indique a fundamentação da decisão..."
                                className="w-full p-2 rounded-lg bg-card border border-border text-xs text-foreground"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  const res = store.resolveModerationCase({
                                    disputeId: dispute.id,
                                    resolution: "custom_arbitrated",
                                    resolvedAmount:
                                      Number(customArbitratedAmount) || dispute.benchmarkAverage,
                                    moderatorNotes:
                                      resolutionNotes ||
                                      "Arbitrado com base no padrão médio da ilha.",
                                  });
                                  if (res.ok) {
                                    toast.success(res.message);
                                    setActiveResolvingId(null);
                                  }
                                }}
                                className="py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <Check size={13} /> Aplicar Valor Arbitrado
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const res = store.resolveModerationCase({
                                    disputeId: dispute.id,
                                    resolution: "sanction_provider",
                                    moderatorNotes:
                                      resolutionNotes ||
                                      "Sancionado por inflação abusiva de preço.",
                                  });
                                  if (res.ok) {
                                    toast.success(res.message);
                                    setActiveResolvingId(null);
                                  }
                                }}
                                className="py-2 rounded-xl bg-red-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs"
                              >
                                <AlertOctagon size={13} /> Sancionar Prestador
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

      {/* Gestão das Visitas Técnicas no Terreno (Uber-style) */}
      <Section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Car size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Visitas Técnicas no Terreno</h2>
          </div>
          <span className="text-[10px] font-bold text-muted-foreground">
            Modelo Uber STP · Saldo Retido em Carteira
          </span>
        </div>

        {technicalVisits.length === 0 ? (
          <div className="p-6 rounded-2xl bg-card border border-border text-center">
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
    </AppShell>
  );
}
