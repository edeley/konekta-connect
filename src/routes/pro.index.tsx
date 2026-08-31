import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Bell,
  ChevronRight,
  Settings,
  TrendingUp,
  Image as ImageIcon,
  Plus,
  ExternalLink,
  Calculator,
  ShieldCheck,
  Tag,
  Clock,
  Sun,
  Maximize2,
  Zap,
  Edit2,
  Trash2,
  Boxes,
  CheckSquare,
  Car,
  FileText,
  Sparkles,
  MessageCircle,
  Star,
  Power,
  Compass,
  Calendar,
  Wallet,
  Eye,
  CheckCircle2,
  AlertTriangle,
  MoveHorizontal,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store, useStore } from "@/lib/store";
import { getProvider } from "@/lib/konekta-data";
import { PortfolioManagerModal } from "@/components/konekta/PortfolioManagerModal";
import { PortfolioBeforeAfterModal } from "@/components/konekta/PortfolioBeforeAfterModal";
import { QuoteComposer } from "@/components/konekta/QuoteComposer";
import { ServiceEditorModal } from "@/components/konekta/ServiceEditorModal";
import { ProviderReviewsModal } from "@/components/konekta/ProviderReviewsModal";
import { KycVerificationModule, KycStatusBanner } from "@/components/konekta/KycVerificationModule";
import { CoverageConfigurator } from "@/components/konekta/CoverageConfigurator";
import { ScheduleGridEditor } from "@/components/konekta/ScheduleGridEditor";
import { ProviderWalletCard } from "@/components/konekta/ProviderWalletCard";
import { getProviderContract } from "@/lib/provider-profile-data";
import {
  BILLING_MODELS,
  MVP_MODELS_LIST,
  formatDb,
  type ProviderCustomService,
} from "@/lib/pricing-engine";
import { type KycStatus, type PortfolioBeforeAfterItem } from "@/types/provider-profile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/pro/")({
  head: () => ({
    meta: [
      { title: "Painel do Prestador PRO · KONEKTA STP" },
      {
        name: "description",
        content:
          "Gestão operacional, validação de documentos KYC, área de cobertura, agenda e carteira financeira do prestador KONEKTA PRO em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Painel do Prestador PRO · KONEKTA STP" },
      {
        property: "og:description",
        content:
          "Gestão operacional, documentos KYC, carteira financeira e portfólio no portal verde KONEKTA PRO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProHome,
});

// Serviços padrão de demonstração para os 8 modelos caso o prestador ainda não tenha configurado
const defaultSeedServices: ProviderCustomService[] = [
  {
    id: "seed-1",
    name: "Instalação de Tomada ou Interruptor",
    category: "Eletricista",
    pricingType: "fixo",
    basePrice: 500,
    unit: "serviço",
    materialPolicy: "nao_incluido",
    travelFeePolicy: "fixo",
    travelFeeAmount: 200,
    estimatedDuration: "1 hora",
    observations: "O cliente deve fornecer a tomada.",
    isActive: true,
  },
  {
    id: "seed-2",
    name: "Limpeza Residencial Geral",
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
    extras: [
      { id: "e1", name: "Limpeza profunda", price: 500, selected: false },
      { id: "e2", name: "Limpeza de vidros/janelas", price: 300, selected: false },
      { id: "e3", name: "Forno e eletrodomésticos", price: 400, selected: false },
    ],
    isActive: true,
  },
  {
    id: "seed-3",
    name: "Trabalho de Alvenaria / Pedreiro",
    category: "Construção",
    pricingType: "dia",
    basePrice: 1500,
    unit: "dia",
    materialPolicy: "nao_incluido",
    travelFeePolicy: "fixo",
    travelFeeAmount: 200,
    estimatedDuration: "08:00–17:00",
    isActive: true,
  },
  {
    id: "seed-4",
    name: "Reparação e Troca de Torneira",
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
    id: "seed-5",
    name: "Lavagem & Higienização de Cadeiras",
    category: "Limpeza",
    pricingType: "unidade",
    basePrice: 100,
    unit: "cadeira",
    minimumQuantity: 4,
    materialPolicy: "incluido",
    travelFeePolicy: "fixo",
    travelFeeAmount: 200,
    isActive: true,
  },
  {
    id: "seed-6",
    name: "Pintura de Paredes e Tetos",
    category: "Pintor",
    pricingType: "m2",
    basePrice: 80,
    unit: "m²",
    minimumQuantity: 15,
    materialPolicy: "nao_incluido",
    travelFeePolicy: "fixo",
    travelFeeAmount: 200,
    observations: "Área medida no local para confirmação final.",
    isActive: true,
  },
  {
    id: "seed-7",
    name: "Visita Técnica & Diagnóstico no Terreno",
    category: "Eletricista",
    pricingType: "visita",
    basePrice: 500,
    unit: "visita",
    materialPolicy: "nao_incluido",
    travelFeePolicy: "incluida",
    observations: "Inclui deslocação e diagnóstico inicial. Reparação sob novo orçamento.",
    isActive: true,
  },
  {
    id: "seed-8",
    name: "Reparação Complexa de Telhado e Obras",
    category: "Construção",
    pricingType: "orcamento",
    basePrice: 0,
    unit: "orçamento",
    materialPolicy: "a_combinar",
    travelFeePolicy: "negociada",
    observations: "Preço definido após avaliação detalhada e fotos.",
    isActive: true,
  },
];

function ProHome() {
  const user = useStore((s) => s.user);
  const orders = useStore((s) => s.orders);
  const providerBalance = useStore((s) => s.providerBalance);
  const providerProfile = useStore((s) => s.providerProfile);

  // Status Online / Offline
  const [isOnline, setIsOnline] = useState(true);

  // Modais de Gestão
  const [openPortfolioModal, setOpenPortfolioModal] = useState(false);
  const [openBeforeAfterAddModal, setOpenBeforeAfterAddModal] = useState(false);
  const [openKycModal, setOpenKycModal] = useState(false);
  const [openComposer, setOpenComposer] = useState(false);
  const [openServiceModal, setOpenServiceModal] = useState(false);
  const [openReviewsModal, setOpenReviewsModal] = useState(false);
  const [editingService, setEditingService] = useState<ProviderCustomService | null>(null);

  const portfolio = providerProfile?.portfolio ?? [];
  const requests = useStore((s) => s.requests);
  const openRequests = requests.filter((r) => r.status === "aberto");
  const today = orders.filter((o) => o.status !== "concluido" && o.status !== "avaliado");
  const done = orders.filter((o) => o.status === "concluido" || o.status === "avaliado");
  const firstName = user?.name?.split(" ")[0] ?? "Prestador";

  // KYC Status
  const kycStatus: KycStatus =
    providerProfile?.status === "aprovado"
      ? "VERIFIED"
      : providerProfile?.status === "em_analise"
        ? "PENDING_REVIEW"
        : providerProfile?.status === "rejeitado"
          ? "REJECTED"
          : "VERIFIED";

  // Lista de Serviços do Prestador (customizados ou padrão)
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
      toast.success("Está Online! Pronto para receber chamados em tempo real na sua região.");
    } else {
      toast.info("Está Offline. Novos chamados automáticos estão pausados.");
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
    <AppShell roles={["prestador"]}>
      {/* HEADER VERDE KONEKTA PRO COM TOGGLE ONLINE/OFFLINE */}
      <header className="rounded-b-3xl bg-emerald-600 px-5 pb-6 pt-7 text-white shadow-lg space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold uppercase tracking-wider">
                KONEKTA PRO
              </span>
              <span className="text-xs text-emerald-100 font-medium">São Tomé e Príncipe</span>
            </div>
            <h1 className="text-2xl font-black leading-tight mt-1">Olá, {firstName}! 👋</h1>
            <p className="text-xs text-emerald-100 mt-0.5">
              Painel Privado do Prestador de Serviços
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/notificacoes"
              aria-label="Notificações"
              className="grid size-9 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition cursor-pointer"
            >
              <Bell size={17} />
            </Link>
            <Link
              to="/definicoes"
              aria-label="Definições"
              className="grid size-9 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25 transition cursor-pointer"
            >
              <Settings size={17} />
            </Link>
          </div>
        </div>

        {/* CONTROLO DE ATUAÇÃO: TOGGLE ONLINE / OFFLINE COM GPS */}
        <div className="p-3.5 rounded-2xl bg-white/15 border border-white/25 backdrop-blur-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={cn(
                "size-3 rounded-full shrink-0",
                isOnline ? "bg-emerald-300 animate-ping" : "bg-neutral-300",
              )}
            />
            <div className="min-w-0">
              <p className="text-xs font-black truncate">
                {isOnline ? "🟢 Status: Online para Chamados" : "⚪ Status: Offline (Pausado)"}
              </p>
              <p className="text-[10px] text-emerald-100 truncate">
                {isOnline
                  ? "Localização GPS ativa · Notificações imediatas"
                  : "Não receberá novos chamados em tempo real"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleOnline}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95",
              isOnline
                ? "bg-white text-emerald-800 hover:bg-emerald-50"
                : "bg-emerald-800 text-white hover:bg-emerald-900 border border-white/30",
            )}
          >
            <Power size={13} />
            <span>{isOnline ? "Ficar Offline" : "Ficar Online"}</span>
          </button>
        </div>

        {/* ATALHO DIRETO: VER PERFIL PÚBLICO */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-emerald-100 text-[11px]">
            Como os clientes encontram o seu perfil
          </span>
          <Link
            to="/prestador/$id"
            params={{ id: "edmilson-varela" }}
            className="px-3 py-1 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-1.5 transition text-[11px]"
          >
            <Eye size={13} />
            <span>Ver Visão Pública</span>
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-6 pb-32">
        {/* BANNER DE VALIDAÇÃO KYC (DOCUMENTOS & BIOMETRIA) */}
        <KycStatusBanner status={kycStatus} onOpenKycModal={() => setOpenKycModal(true)} />

        {/* MÓDULO FINANCEIRO: CARTEIRA & SALDO EM CUSTÓDIA */}
        <ProviderWalletCard
          availableBalance={providerBalance || 450.0}
          pendingEscrow={120.0}
          currency="STD"
        />

        {/* MÉTRICAS RÁPIDAS DE DESEMPENHO */}
        <section className="grid grid-cols-3 gap-2.5">
          <Link
            to="/pro/pedidos"
            className="rounded-2xl bg-card p-3 text-center border border-border shadow-2xs hover:border-primary/50 transition cursor-pointer group active:scale-98"
          >
            <p className="text-lg font-black text-foreground group-hover:text-primary">
              {today.length}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">Pedidos Ativos</p>
          </Link>

          <Link
            to="/pro/pedidos"
            className="rounded-2xl bg-card p-3 text-center border border-border shadow-2xs hover:border-primary/50 transition cursor-pointer group active:scale-98"
          >
            <p className="text-lg font-black text-foreground group-hover:text-primary">
              {done.length + 142}
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">Concluídos</p>
          </Link>

          <button
            type="button"
            onClick={() => setOpenReviewsModal(true)}
            className="rounded-2xl bg-card p-3 text-center border border-border shadow-2xs hover:border-primary/50 transition cursor-pointer group active:scale-98"
          >
            <p className="text-lg font-black text-foreground flex items-center justify-center gap-1 group-hover:text-primary">
              <span>4.92</span>
              <span className="text-amber-400 text-sm">⭐</span>
            </p>
            <p className="text-[10px] font-bold text-muted-foreground">84 Avaliações</p>
          </button>
        </section>

        {/* OPORTUNIDADES / PEDIDOS DE CLIENTES ABERTOS */}
        <section>
          <Link
            to="/pro/oportunidades"
            className="p-4 rounded-2xl bg-primary/10 border-2 border-primary/30 hover:border-primary/50 transition flex items-center justify-between gap-3 shadow-xs block group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0 shadow-2xs">
                <Sparkles size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-black text-foreground truncate">
                    Pedidos Publicados por Clientes
                  </p>
                  <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
                    {openRequests.length} novos
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  Clientes procuram profissionais em STP. Envie o seu orçamento!
                </p>
              </div>
            </div>
            <ChevronRight
              size={18}
              className="text-primary shrink-0 group-hover:translate-x-0.5 transition-transform"
            />
          </Link>
        </section>

        {/* CONFIGURADOR DOS LOCAIS E DISTRITOS DE ATENDIMENTO */}
        <section className="space-y-2">
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
            }}
          />
        </section>

        {/* GESTÃO DE HORÁRIOS E AGENDA SEMANAL */}
        <section className="space-y-2">
          <ScheduleGridEditor />
        </section>

        {/* GESTÃO DO PORTFÓLIO DE ANTES VS. DEPOIS */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <ImageIcon size={16} className="text-primary" /> Portfólio de Trabalhos (Antes vs
                  Depois)
                </h2>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Exiba as transformações dos seus serviços para converter clientes
              </p>
            </div>

            <button
              type="button"
              onClick={() => setOpenBeforeAfterAddModal(true)}
              className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-2xs flex items-center gap-1 cursor-pointer"
            >
              <Plus size={13} />
              <span>Novo Trabalho</span>
            </button>
          </div>

          <div className="rounded-3xl bg-card p-4 border border-border space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">
                Galeria ativa com widget interativo
              </span>
              <button
                type="button"
                onClick={() => setOpenPortfolioModal(true)}
                className="font-bold text-primary hover:underline cursor-pointer"
              >
                Gerir Fotos ({portfolio.length + 3})
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div
                onClick={() => setOpenBeforeAfterAddModal(true)}
                className="aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:border-primary/60 flex flex-col items-center justify-center text-center p-2 cursor-pointer transition"
              >
                <Plus size={18} className="text-primary mb-1" />
                <span className="text-[10px] font-bold text-foreground">Antes & Depois</span>
              </div>

              <div
                onClick={() => setOpenPortfolioModal(true)}
                className="aspect-square rounded-2xl overflow-hidden border border-border bg-muted relative group cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&auto=format&fit=crop&q=80"
                  alt="Quadro Elétrico"
                  className="size-full object-cover group-hover:scale-105 transition"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                  Quadro
                </span>
              </div>

              <div
                onClick={() => setOpenPortfolioModal(true)}
                className="aspect-square rounded-2xl overflow-hidden border border-border bg-muted relative group cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=80"
                  alt="Iluminação LED"
                  className="size-full object-cover group-hover:scale-105 transition"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-white text-[9px] font-bold">
                  LED Sala
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* CATÁLOGO DE SERVIÇOS & 8 MODELOS DE PREÇO */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Boxes size={16} className="text-primary" /> Serviços & Tabela de Preços
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  {myServices.length} ativos
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Configure os modelos de cobrança (Fixo, Hora, Dia, m², Unidade, Orçamento)
              </p>
            </div>
            <button
              type="button"
              onClick={handleCreateService}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold transition shadow-xs active:scale-95 cursor-pointer"
            >
              <Plus size={14} />
              Novo Serviço
            </button>
          </div>

          <div className="space-y-2.5">
            {myServices.map((srv) => {
              const meta = BILLING_MODELS[srv.pricingType] || BILLING_MODELS.fixo;
              return (
                <div
                  key={srv.id}
                  className="p-4 rounded-2xl bg-card border border-border hover:border-primary/50 transition shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground">{srv.category}</span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground mt-1">{srv.name}</h3>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-sm font-extrabold text-primary">
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

                  {/* Detalhes de Deslocação e Materiais */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground pt-2 border-t border-border/60">
                    <span>
                      🚗 Deslocação:{" "}
                      <strong className="text-foreground">
                        {srv.travelFeePolicy === "incluida"
                          ? "Incluída"
                          : srv.travelFeePolicy === "fixo"
                            ? formatDb(srv.travelFeeAmount || 0)
                            : srv.travelFeePolicy === "gratuita_km"
                              ? "Grátis no centro"
                              : "A negociar"}
                      </strong>
                    </span>
                    <span>·</span>
                    <span>
                      📦 Material:{" "}
                      <strong className="text-foreground">
                        {srv.materialPolicy === "incluido"
                          ? "Incluído"
                          : srv.materialPolicy === "nao_incluido"
                            ? "Não incluído"
                            : "A combinar"}
                      </strong>
                    </span>
                  </div>

                  {/* Ações de Edição do Serviço */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleEditService(srv)}
                      className="px-2.5 py-1 rounded-lg border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 size={12} /> Editar
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
              );
            })}
          </div>
        </section>

        {/* EMISSÃO DE PROPOSTA & ORÇAMENTO */}
        <section>
          <div className="p-4 rounded-2xl bg-card border border-border shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 text-primary grid place-items-center shrink-0">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">Emitir Proposta Oficial</p>
                <p className="text-[11px] text-muted-foreground">
                  Elabore orçamentos técnicos com materiais, mão de obra e prazos.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpenComposer(true)}
              className="px-3.5 py-2 rounded-xl bg-primary hover:bg-brand-dark text-white text-xs font-bold shadow-xs shrink-0 cursor-pointer transition"
            >
              Criar
            </button>
          </div>
        </section>
      </div>

      {/* MODAL KYC */}
      <KycVerificationModule
        isOpen={openKycModal}
        onClose={() => setOpenKycModal(false)}
        kycDocument={{
          idType: "bi_stp",
          status: kycStatus,
        }}
      />

      {/* MODAL DE ADIÇÃO DE TRABALHOS ANTES/DEPOIS */}
      <PortfolioBeforeAfterModal
        isOpen={openBeforeAfterAddModal}
        onClose={() => setOpenBeforeAfterAddModal(false)}
        onSaveItem={handleSaveNewPortfolioItem}
      />

      {/* MODAL DE GESTÃO DE SERVIÇOS */}
      <ServiceEditorModal
        open={openServiceModal}
        onClose={() => setOpenServiceModal(false)}
        serviceToEdit={editingService}
        defaultCategory={providerProfile?.category || "Eletricista"}
      />

      {/* MODAL DE GESTÃO DE FOTOS */}
      <PortfolioManagerModal
        open={openPortfolioModal}
        onClose={() => setOpenPortfolioModal(false)}
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
    </AppShell>
  );
}
