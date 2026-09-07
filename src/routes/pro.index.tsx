import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  Settings,
  Image as ImageIcon,
  Plus,
  ShieldCheck,
  Power,
  Eye,
  CheckCircle2,
  Clock,
  Boxes,
  FileText,
  MapPin,
  Calendar,
  Camera,
  Upload,
  Edit2,
  Trash2,
  Sparkles,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store, useStore } from "@/lib/store";
import { PortfolioManagerModal } from "@/components/konekta/PortfolioManagerModal";
import { PortfolioBeforeAfterModal } from "@/components/konekta/PortfolioBeforeAfterModal";
import { QuoteComposer } from "@/components/konekta/QuoteComposer";
import { ServiceEditorModal } from "@/components/konekta/ServiceEditorModal";
import { ProviderReviewsModal } from "@/components/konekta/ProviderReviewsModal";
import { KycVerificationModule } from "@/components/konekta/KycVerificationModule";
import { CoverageConfigurator } from "@/components/konekta/CoverageConfigurator";
import { ScheduleGridEditor } from "@/components/konekta/ScheduleGridEditor";
import { ProviderWalletCard } from "@/components/konekta/ProviderWalletCard";
import { BottomSheet } from "@/components/konekta/kit";
import { BILLING_MODELS, formatDb, type ProviderCustomService } from "@/lib/pricing-engine";
import { type KycStatus, type PortfolioBeforeAfterItem } from "@/types/provider-profile";
import { AlarmSyncModal } from "@/components/konekta/AlarmSyncModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/")({
  head: () => ({
    meta: [
      { title: "Painel do Prestador · KONEKTA STP" },
      {
        name: "description",
        content:
          "Gestão operacional, carteira financeira, oportunidades de clientes, catálogo de serviços e portfólio do prestador KONEKTA em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Painel do Prestador · KONEKTA STP" },
      {
        property: "og:description",
        content: "Gestão do prestador, carteira, chamados e portfólio profissional.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProHome,
});

// Serviços padrão caso o prestador ainda não tenha configurado
const defaultSeedServices: ProviderCustomService[] = [
  {
    id: "seed-1",
    name: "Instalação de Quadro Elétrico ou Disjuntores",
    category: "Eletricista",
    pricingType: "fixo",
    basePrice: 500,
    unit: "serviço",
    materialPolicy: "nao_incluido",
    travelFeePolicy: "fixo",
    travelFeeAmount: 150,
    estimatedDuration: "1 a 2 horas",
    observations: "Cliente fornece material ou orçado em separado.",
    isActive: true,
  },
  {
    id: "seed-2",
    name: "Limpeza Residencial Completa",
    category: "Limpeza",
    pricingType: "hora",
    basePrice: 500,
    unit: "hora",
    minimumQuantity: 2,
    maximumQuantity: 8,
    materialPolicy: "nao_incluido",
    travelFeePolicy: "incluida",
    travelFeeAmount: 0,
    estimatedDuration: "2h a 6h",
    isActive: true,
  },
  {
    id: "seed-3",
    name: "Reparação e Substituição de Canalização",
    category: "Canalizador",
    pricingType: "servico",
    basePrice: 800,
    unit: "serviço",
    materialPolicy: "nao_incluido",
    travelFeePolicy: "fixo",
    travelFeeAmount: 150,
    estimatedDuration: "1h",
    isActive: true,
  },
  {
    id: "seed-4",
    name: "Pintura de Paredes e Fachadas",
    category: "Pintor",
    pricingType: "m2",
    basePrice: 80,
    unit: "m²",
    minimumQuantity: 15,
    materialPolicy: "nao_incluido",
    travelFeePolicy: "fixo",
    travelFeeAmount: 200,
    observations: "Área confirmada no local.",
    isActive: true,
  },
  {
    id: "seed-5",
    name: "Visita Técnica & Diagnóstico no Terreno",
    category: "Eletricista",
    pricingType: "visita",
    basePrice: 150,
    unit: "visita",
    materialPolicy: "nao_incluido",
    travelFeePolicy: "incluida",
    observations: "Diagnóstico inicial e parecer técnico.",
    isActive: true,
  },
];

function ProHome() {
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);
  const providerProfile = useStore((s) => s.providerProfile);
  const requests = useStore((s) => s.requests);
  const notifications = useStore((s) => s.notifications);

  // Status de Disponibilidade (Online / Offline)
  const [isOnline, setIsOnline] = useState(true);

  // Aba ativa na seção de Gestão
  const [activeTab, setActiveTab] = useState<"servicos" | "portfolio" | "cobertura" | "horarios">(
    "servicos",
  );

  // Modais de Gestão
  const [openPortfolioModal, setOpenPortfolioModal] = useState(false);
  const [openBeforeAfterAddModal, setOpenBeforeAfterAddModal] = useState(false);
  const [openKycModal, setOpenKycModal] = useState(false);
  const [openComposer, setOpenComposer] = useState(false);
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [openReviewsModal, setOpenReviewsModal] = useState(false);
  const [openCoverageModal, setOpenCoverageModal] = useState(false);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [openAlarmModal, setOpenAlarmModal] = useState(false);
  const [editingService, setEditingService] = useState<ProviderCustomService | null>(null);

  const portfolio = providerProfile?.portfolio ?? [];
  const openRequests = requests.filter((r) => r.status === "aberto");
  const today = orders.filter((o) => o.status !== "concluido" && o.status !== "avaliado");
  const done = orders.filter((o) => o.status === "concluido" || o.status === "avaliado");
  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const firstName = user?.name?.split(" ")[0] ?? "Prestador";
  const displayName = providerProfile?.businessName || user?.name || firstName;

  // KYC Status
  const kycStatus: KycStatus =
    providerProfile?.status === "aprovado"
      ? "VERIFIED"
      : providerProfile?.status === "em_analise"
        ? "PENDING_REVIEW"
        : providerProfile?.status === "rejeitado"
          ? "REJECTED"
          : "VERIFIED";

  // Lista de Serviços do Prestador
  const myServices = useMemo(() => {
    if (providerProfile?.customServices && providerProfile.customServices.length > 0) {
      return providerProfile.customServices;
    }
    return defaultSeedServices;
  }, [providerProfile?.customServices]);

  const handleToggleOnline = () => {
    const nextState = !isOnline;
    setIsOnline(nextState);
    if (nextState) {
      toast.success("Está Online! Pronto para receber chamados de clientes na sua região.");
    } else {
      toast.info("Modo Offline ativado. Novos chamados automáticos foram pausados.");
    }
  };

  const handleEditService = (srv: ProviderCustomService) => {
    setEditingService(srv);
    setOpenServiceModal(true);
  };

  const handleCreateService = () => {
    setEditingService(null);
    setOpenServiceModal(true);
  };

  const handleDeleteService = (id: string, name: string) => {
    if (confirm(`Pretende remover o serviço "${name}" do seu catálogo?`)) {
      store.deleteCustomService(id);
      toast.success("Serviço removido com sucesso.");
    }
  };

  const handleSaveNewPortfolioItem = (item: PortfolioBeforeAfterItem) => {
    const existing = providerProfile?.portfolio || [];
    store.updateProviderProfile({
      portfolio: [
        ...existing,
        {
          id: item.id,
          title: item.title,
          image: item.afterImageUrl,
          description: item.description,
          category: item.category,
          date: item.completedAt,
        },
      ],
    });
  };

  return (
    <AppShell roles={["prestador"]} hideFab>
      {/* ========================================================================= */}
      {/* CABEÇALHO ELEGANTE & PROFISSIONAL KONEKTA (HUMAN-DESIGNED) */}
      {/* ========================================================================= */}
      <header className="rounded-b-3xl bg-slate-950 text-white px-5 pt-7 pb-6 space-y-4 border-b border-slate-800/80 shadow-md">
        {/* TOPO: PERFIL & NOTIFICAÇÕES */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative shrink-0">
              <div className="size-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 border border-white/20 flex items-center justify-center font-bold text-base text-white shadow-sm overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt={displayName} className="size-full object-cover" />
                ) : (
                  displayName.slice(0, 2).toUpperCase()
                )}
              </div>
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 size-3.5 rounded-full border-2 border-slate-950",
                  isOnline ? "bg-emerald-400" : "bg-slate-500",
                )}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                  KONEKTA
                </span>
                <span className="text-[10px] text-slate-400">· São Tomé e Príncipe</span>
              </div>
              <h1 className="text-lg font-bold text-white leading-tight truncate">
                Olá, {displayName}
              </h1>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-emerald-400 shrink-0" />
                <span className="truncate">
                  {providerProfile?.category || "Profissional Certificado"}
                </span>
                <span>·</span>
                <span className="text-slate-300">{providerProfile?.district || "Água Grande"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Botão Sincronizar Alarme do Telemóvel */}
            <button
              type="button"
              onClick={() => setOpenAlarmModal(true)}
              aria-label="Sincronizar Alarme & Lembretes"
              title="Sincronizar Alarme e Lembretes do Telemóvel"
              className="grid size-9 place-items-center rounded-xl bg-slate-800/90 text-amber-400 hover:bg-slate-800 hover:text-amber-300 transition border border-slate-700/60"
            >
              <Clock size={16} />
            </button>

            <Link
              to="/notificacoes"
              aria-label="Notificações"
              className="relative grid size-9 place-items-center rounded-xl bg-slate-800/90 text-slate-300 hover:text-white transition border border-slate-700/60"
            >
              <Bell size={16} />
              {unreadNotifications > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
              )}
            </Link>

            <Link
              to="/definicoes"
              aria-label="Definições"
              className="grid size-9 place-items-center rounded-xl bg-slate-800/90 text-slate-300 hover:text-white transition border border-slate-700/60"
            >
              <Settings size={16} />
            </Link>
          </div>
        </div>

        {/* STATUS OPERACIONAL: DISPONIBILIDADE (HUMAN, CLEAN, NO TRUNCATION) */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className={cn(
                "size-3 rounded-full mt-1 shrink-0",
                isOnline ? "bg-emerald-400 shadow-[0_0_10px_#34d399]" : "bg-slate-500",
              )}
            />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-white">
                {isOnline ? "Disponível para Novos Chamados" : "Atendimento Pausado (Offline)"}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isOnline
                  ? "O seu perfil está ativo e visível para novos clientes em São Tomé e Príncipe."
                  : "Ative a disponibilidade para voltar a receber pedidos no telemóvel."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleOnline}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95 shadow-xs",
              isOnline
                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                : "bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700",
            )}
          >
            <Power size={14} />
            <span>{isOnline ? "Pausar Atendimento" : "Ficar Online"}</span>
          </button>
        </div>

        {/* BARRA INFORMATIVA KYC & PERFIL PÚBLICO */}
        <div className="flex items-center justify-between pt-0.5 gap-2">
          <button
            type="button"
            onClick={() => setOpenKycModal(true)}
            className="flex items-center gap-1.5 text-slate-300 hover:text-white transition cursor-pointer text-xs"
          >
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Identidade Verificada KONEKTA</span>
          </button>

          <Link
            to="/prestador/$id"
            params={{ id: "edmilson-varela" }}
            className="px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/60 text-slate-200 hover:text-white font-bold flex items-center gap-1.5 transition text-xs"
          >
            <Eye size={13} />
            <span>Ver Perfil Público</span>
          </Link>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* CORPO DO DASHBOARD */}
      {/* ========================================================================= */}
      <div className="p-4 space-y-5 pb-32">
        {/* CARTEIRA & GANHOS DO PRESTADOR */}
        <ProviderWalletCard />

        {/* MÉTRICAS RÁPIDAS DE DESEMPENHO (3 CARDS EQUILIBRADOS) */}
        <section className="grid grid-cols-3 gap-2.5">
          <Link
            to="/pro/pedidos"
            className="rounded-2xl bg-card p-3 text-center border border-border shadow-2xs hover:border-primary/50 transition cursor-pointer group active:scale-98"
          >
            <p className="text-xl font-black text-foreground group-hover:text-primary">
              {today.length}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Trabalhos Ativos</p>
          </Link>

          <Link
            to="/pro/pedidos"
            className="rounded-2xl bg-card p-3 text-center border border-border shadow-2xs hover:border-primary/50 transition cursor-pointer group active:scale-98"
          >
            <p className="text-xl font-black text-foreground group-hover:text-primary">
              {done.length + 142}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">Concluídos</p>
          </Link>

          <button
            type="button"
            onClick={() => setOpenReviewsModal(true)}
            className="rounded-2xl bg-card p-3 text-center border border-border shadow-2xs hover:border-primary/50 transition cursor-pointer group active:scale-98"
          >
            <p className="text-xl font-black text-foreground flex items-center justify-center gap-1 group-hover:text-primary">
              <span>4.92</span>
              <span className="text-amber-400 text-sm">⭐</span>
            </p>
            <p className="text-[10px] font-bold text-muted-foreground mt-0.5">84 Avaliações</p>
          </button>
        </section>

        {/* AÇÕES DE OPORTUNIDADE & ORÇAMENTO */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Link
            to="/pro/oportunidades"
            className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 hover:border-emerald-500/50 transition flex items-center justify-between gap-3 shadow-2xs group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-emerald-600 text-white grid place-items-center shrink-0 shadow-2xs">
                <Search size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-foreground truncate">
                    Bolsa de Pedidos STP
                  </p>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shrink-0">
                    {openRequests.length} novos
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  Clientes aguardam orçamentos
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-emerald-600 shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </Link>

          <button
            type="button"
            onClick={() => setOpenComposer(true)}
            className="p-3.5 rounded-2xl bg-card border border-border hover:border-primary/50 transition flex items-center justify-between gap-3 shadow-2xs group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-foreground truncate">
                  Emitir Proposta Oficial
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  Orçamento técnico com garantia
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </button>
        </section>

        {/* ========================================================================= */}
        {/* HUB DE GESTÃO DO SEU NEGÓCIO (ORGANIZADO EM ABAS LIMPAS) */}
        {/* ========================================================================= */}
        <section className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Gestão do Seu Negócio
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Configure serviços, fotos, cobertura e agenda
              </p>
            </div>
          </div>

          {/* SELETOR DE ABAS */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-muted rounded-2xl border border-border">
            {[
              { id: "servicos" as const, label: "Serviços", icon: Boxes, count: myServices.length },
              {
                id: "portfolio" as const,
                label: "Fotos",
                icon: ImageIcon,
                count: portfolio.length,
              },
              { id: "cobertura" as const, label: "Distritos", icon: MapPin },
              { id: "horarios" as const, label: "Agenda", icon: Clock },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer",
                    isActive
                      ? "bg-card text-foreground shadow-xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={16} className={isActive ? "text-primary" : ""} />
                  <span className="text-[11px] truncate w-full text-center">
                    {tab.label}
                    {tab.count !== undefined && ` (${tab.count})`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CONTEÚDO DA ABA 1: SERVIÇOS & PREÇOS */}
          {activeTab === "servicos" && (
            <div className="space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">
                  {myServices.length} serviços ativos no seu perfil
                </span>
                <button
                  type="button"
                  onClick={handleCreateService}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-2xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Novo Serviço</span>
                </button>
              </div>

              <div className="space-y-2">
                {myServices.map((srv) => {
                  const meta = BILLING_MODELS[srv.pricingType] || BILLING_MODELS.fixo;
                  return (
                    <div
                      key={srv.id}
                      className="p-3.5 rounded-2xl bg-card border border-border hover:border-primary/40 transition shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                              {meta.label}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {srv.category}
                            </span>
                          </div>
                          <h3 className="text-xs font-bold text-foreground mt-1">{srv.name}</h3>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-black font-mono text-primary">
                            {srv.pricingType === "orcamento"
                              ? "Sob Orçamento"
                              : `${formatDb(srv.basePrice)}${srv.pricingType === "hora" ? "/h" : srv.pricingType === "dia" ? "/dia" : srv.pricingType === "m2" ? "/m²" : srv.pricingType === "unidade" ? `/${srv.unit || "un"}` : ""}`}
                          </p>
                          {srv.minimumQuantity && srv.minimumQuantity > 1 && (
                            <p className="text-[10px] text-muted-foreground">
                              Mínimo: {srv.minimumQuantity} {srv.unit || meta.unitSuffix}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1.5 border-t border-border/60">
                        <span>
                          🚗 Deslocação:{" "}
                          <strong className="text-foreground">
                            {srv.travelFeePolicy === "incluida"
                              ? "Incluída"
                              : srv.travelFeePolicy === "fixo"
                                ? formatDb(srv.travelFeeAmount || 0)
                                : "A negociar"}
                          </strong>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditService(srv)}
                            className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-bold text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 size={11} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteService(srv.id, srv.name)}
                            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Remover serviço"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA 2: PORTFÓLIO & FOTOS (SEM IMAGENS FICTÍCIAS) */}
          {activeTab === "portfolio" && (
            <div className="space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Fotos dos Seus Trabalhos
                  </span>
                  <p className="text-[10px] text-muted-foreground">
                    Carregue fotos reais da sua câmera ou galeria
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setOpenBeforeAfterAddModal(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition border border-border flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Antes/Depois</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenPortfolioModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Camera size={13} />
                    <span>Adicionar Foto</span>
                  </button>
                </div>
              </div>

              {portfolio.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {portfolio.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setOpenPortfolioModal(true)}
                      className="rounded-2xl overflow-hidden border border-border bg-card shadow-2xs group cursor-pointer space-y-1.5 p-1.5"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="size-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <div className="px-1 pb-1">
                        <p className="text-xs font-bold text-foreground truncate">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {item.category}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-border p-6 text-center space-y-3 bg-muted/20">
                  <div className="size-12 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground">
                    <Camera size={24} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      Ainda não adicionou fotos ao seu portfólio
                    </h3>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto mt-0.5">
                      Prestadores com fotos reais de serviços realizados recebem até 3x mais pedidos
                      em São Tomé.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setOpenPortfolioModal(true)}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-primary/90"
                    >
                      <Camera size={14} />
                      <span>Tirar Foto Agora</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenBeforeAfterAddModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-muted text-foreground text-xs font-bold border border-border cursor-pointer hover:bg-muted/80"
                    >
                      <span>Adicionar Antes/Depois</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONTEÚDO DA ABA 3: ÁREA DE COBERTURA */}
          {activeTab === "cobertura" && (
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-2xs animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      Distritos & Zonas de Atendimento
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Regiões onde aceita pedidos e presta serviços
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenCoverageModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-2xs cursor-pointer"
                >
                  Alterar Distritos
                </button>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Distrito Principal
                  </span>
                  <p className="text-sm font-bold text-foreground">
                    {providerProfile?.district || "Água Grande"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Cobertura Ativa
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ✓ 4 Distritos Selecionados
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {["Água Grande", "Mé-Zóchi", "Cantagalo", "Lobata"].map((d) => (
                  <span
                    key={d}
                    className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold border border-primary/20"
                  >
                    📍 {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA 4: AGENDA & HORÁRIOS */}
          {activeTab === "horarios" && (
            <div className="p-4 rounded-2xl bg-card border border-border space-y-3 shadow-2xs animate-fadeIn">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">
                      Disponibilidade & Agenda Semanal
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Dias e horários em que aceita marcações
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenScheduleModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-2xs cursor-pointer"
                >
                  Ajustar Agenda
                </button>
              </div>

              <div className="p-3 rounded-xl bg-muted/40 border border-border/80 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">Segunda a Sábado</span>
                  <span className="font-mono font-bold text-primary">08:00 – 18:00</span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Domingo</span>
                  <span>Folga / Sob marcação prévia</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                💡 Os clientes só conseguem marcar visitas dentro dos intervalos definidos na sua
                agenda.
              </p>
            </div>
          )}
        </section>
      </div>

      {/* ========================================================================= */}
      {/* MODAIS DE CONFIGURAÇÃO */}
      {/* ========================================================================= */}

      {/* MODAL KYC */}
      <KycVerificationModule
        isOpen={openKycModal}
        onClose={() => setOpenKycModal(false)}
        kycDocument={{
          idType: "bi_stp",
          status: kycStatus,
        }}
      />

      {/* MODAL DE ADIÇÃO DE TRABALHOS ANTES/DEPOIS (COM CÂMERA & GALERIA) */}
      <PortfolioBeforeAfterModal
        isOpen={openBeforeAfterAddModal}
        onClose={() => setOpenBeforeAfterAddModal(false)}
        onSaveItem={handleSaveNewPortfolioItem}
      />

      {/* MODAL DE GESTÃO DE FOTOS */}
      <PortfolioManagerModal
        open={openPortfolioModal}
        onClose={() => setOpenPortfolioModal(false)}
      />

      {/* MODAL DE GESTÃO DE SERVIÇOS */}
      <ServiceEditorModal
        open={openServiceModal}
        onClose={() => setOpenServiceModal(false)}
        serviceToEdit={editingService}
        defaultCategory={providerProfile?.category || "Eletricista"}
      />

      {/* MODAL DE AVALIAÇÕES */}
      <ProviderReviewsModal
        open={openReviewsModal}
        onClose={() => setOpenReviewsModal(false)}
        providerName={user?.name || "Prestador"}
      />

      {/* MODAL DO SIMULADOR DE ORÇAMENTO */}
      <QuoteComposer
        open={openComposer}
        onClose={() => setOpenComposer(false)}
        onSubmit={(data) => {
          toast.success(
            `Simulação concluída! Total cobrado: ${formatDb(
              data.net + (data.displacementFee || 0),
            )} com custódia segura KONEKTA.`,
          );
        }}
      />

      {/* BOTTOM SHEET DE COBERTURA & DISTRITOS */}
      <BottomSheet
        open={openCoverageModal}
        onClose={() => setOpenCoverageModal(false)}
        title="Distritos & Localidades de Atendimento"
        description="Defina onde aceita deslocar-se para atender chamados e executar serviços."
      >
        <div className="pt-2">
          <CoverageConfigurator
            initialCoverage={{
              districts: providerProfile?.district
                ? [providerProfile.district, "Mé-Zóchi", "Cantagalo", "Lobata"]
                : ["Água Grande", "Mé-Zóchi", "Cantagalo", "Lobata"],
            }}
            onSave={(cov) => {
              store.updateProviderProfile({
                district: cov.districts[0] || "Água Grande",
              });
              setOpenCoverageModal(false);
              toast.success("Área de cobertura atualizada com sucesso!");
            }}
          />
        </div>
      </BottomSheet>

      {/* BOTTOM SHEET DE HORÁRIOS & AGENDA */}
      <BottomSheet
        open={openScheduleModal}
        onClose={() => setOpenScheduleModal(false)}
        title="Configurar Horários de Atendimento"
        description="Defina os dias e horas em que está disponível para serviços e chamados presenciais."
      >
        <div className="pt-2">
          <ScheduleGridEditor
            onSave={() => {
              setOpenScheduleModal(false);
              toast.success("Agenda semanal guardada com sucesso!");
            }}
          />
        </div>
      </BottomSheet>

      {/* MODAL DE SINCRONIZAÇÃO DE ALARME & TELEMÓVEL */}
      <AlarmSyncModal open={openAlarmModal} onClose={() => setOpenAlarmModal(false)} />
    </AppShell>
  );
}
