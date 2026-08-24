import { createFileRoute, Link, useRouter, useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Star,
  Shield,
  CheckCircle2,
  Heart,
  MessageCircle,
  X,
  Calendar,
  Clock,
  Camera,
  MessageSquarePlus,
  Tag,
  Boxes,
  Maximize2,
  Car,
  FileText,
  Clock3,
  Sun,
  Edit2,
  ShieldCheck,
  Zap,
  Award,
  Lock,
  Phone,
  Compass,
  MapPin,
  Sparkles,
  Layers,
  HelpCircle,
  Eye,
  Sliders,
} from "lucide-react";
import { getProvider, providers, getProviderServicesWithPricing } from "@/lib/konekta-data";
import { store, useStore } from "@/lib/store";
import { getQuickDynamicSlotsSTP, useSTPClock } from "@/lib/stp-time";
import { PortfolioGallery } from "@/components/konekta/PortfolioGallery";
import { PortfolioManagerModal } from "@/components/konekta/PortfolioManagerModal";
import { PortfolioBeforeAfterModal } from "@/components/konekta/PortfolioBeforeAfterModal";
import { BookingModal } from "@/components/konekta/BookingModal";
import { ReviewModal } from "@/components/konekta/ReviewModal";
import { ReviewsList } from "@/components/konekta/ReviewsList";
import { ProviderHeaderAuthority } from "@/components/konekta/ProviderHeaderAuthority";
import { KycVerificationModule, KycStatusBanner } from "@/components/konekta/KycVerificationModule";
import { CoverageConfigurator } from "@/components/konekta/CoverageConfigurator";
import { ScheduleGridEditor } from "@/components/konekta/ScheduleGridEditor";
import { getProviderContract } from "@/lib/provider-profile-data";
import { type ProviderUIStateMode, type PortfolioBeforeAfterItem } from "@/types/provider-profile";
import { formatDb } from "@/lib/pricing-engine";
import { toast } from "sonner";

export const Route = createFileRoute("/prestador/$id")({
  head: ({ params }) => {
    const p = getProvider(params.id);
    return {
      meta: [
        { title: p ? `${p.name} — ${p.category} · KONEKTA STP` : "Prestador · KONEKTA STP" },
        {
          name: "description",
          content:
            p?.bio ??
            "Perfil verificado de prestador de serviços na plataforma KONEKTA São Tomé e Príncipe.",
        },
        { property: "og:title", content: p ? `${p.name} · KONEKTA STP` : "Prestador · KONEKTA" },
        { property: "og:description", content: p?.bio ?? "Perfil de prestador na KONEKTA STP." },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen grid place-items-center p-8 text-center bg-surface">
      <div className="space-y-3">
        <h1 className="text-xl font-bold text-foreground">Prestador não encontrado</h1>
        <p className="text-xs text-muted-foreground">
          O perfil solicitado não existe ou foi arquivado.
        </p>
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
        >
          Voltar ao início
        </Link>
      </div>
    </div>
  ),
  errorComponent: ({ reset }) => (
    <div className="min-h-screen grid place-items-center p-8 text-center bg-surface">
      <button onClick={reset} className="text-primary font-medium">
        Tentar novamente
      </button>
    </div>
  ),
  loader: ({ params }) => {
    const provider = getProvider(params.id);
    if (!provider) throw new Error("not found");
    return { provider };
  },
  component: ProviderPage,
});

function ProviderPage() {
  const { id } = Route.useParams();
  const rawProvider = getProvider(id)!;
  const router = useRouter();
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const myProviderProfile = useStore((s) => s.providerProfile);
  const favorites = useStore((s) => s.favorites);
  const allReviews = useStore((s) => s.reviews);
  const isFav = favorites.includes(rawProvider.id);

  const [viewMode, setViewMode] = useState<ProviderUIStateMode>("VIEW_MODE_PUBLIC");
  const [openBook, setOpenBook] = useState(false);
  const [openPortfolioModal, setOpenPortfolioModal] = useState(false);
  const [openBeforeAfterAddModal, setOpenBeforeAfterAddModal] = useState(false);
  const [openReviewModal, setOpenReviewModal] = useState(false);
  const [openKycModal, setOpenKycModal] = useState(false);
  const [selectedService, setSelectedService] = useState(rawProvider.services[0]);

  const isOwner = Boolean(
    user && user.role === "prestador" && (user.id === rawProvider.id || id === "me"),
  );

  // Contrato de dados formal do prestador
  const contract = useMemo(() => {
    return getProviderContract(rawProvider.id);
  }, [rawProvider.id]);

  // Calcula estatísticas reais e dinâmicas das avaliações do prestador
  const providerReviews = useMemo(() => {
    return allReviews.filter((r) => r.providerId === rawProvider.id);
  }, [allReviews, rawProvider.id]);

  const dynamicRating = useMemo(() => {
    if (providerReviews.length === 0) return rawProvider.rating;
    const sum = providerReviews.reduce((acc, r) => acc + r.rating, 0);
    return Number((sum / providerReviews.length).toFixed(1));
  }, [providerReviews, rawProvider.rating]);

  const dynamicReviewsCount = useMemo(() => {
    return Math.max(rawProvider.reviews, providerReviews.length);
  }, [rawProvider.reviews, providerReviews.length]);

  // Atualiza métricas no contrato
  const liveContract = useMemo(() => {
    return {
      ...contract,
      metrics: {
        ...contract.metrics,
        rating: dynamicRating,
        totalReviews: dynamicReviewsCount,
      },
    };
  }, [contract, dynamicRating, dynamicReviewsCount]);

  const servicesWithPricing = useMemo(() => {
    return getProviderServicesWithPricing(rawProvider);
  }, [rawProvider]);

  const handleSaveNewPortfolioItem = (item: PortfolioBeforeAfterItem) => {
    const existing = myProviderProfile?.portfolio || [];
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
    <div className="min-h-screen bg-surface flex justify-center">
      <div className="w-full max-w-md bg-surface pb-36">
        {/* BARRA SUPERIOR DE NAVEGAÇÃO */}
        <div className="sticky top-0 z-30 bg-surface/90 backdrop-blur-md px-4 py-3 border-b border-border/60 flex items-center justify-between">
          <button
            onClick={() => router.history.back()}
            className="size-9 rounded-2xl bg-card border border-border flex items-center justify-center text-foreground hover:bg-muted transition cursor-pointer"
            aria-label="Voltar"
          >
            <ArrowLeft size={18} />
          </button>

          <span className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            {isOwner && viewMode === "VIEW_MODE_SELF" ? "Painel de Edição" : "Perfil Profissional"}
          </span>

          <div className="flex items-center gap-1.5">
            {isOwner && (
              <Link
                to="/pro"
                className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition flex items-center gap-1"
              >
                <Sliders size={13} />
                <span>Painel PRO</span>
              </Link>
            )}
            <button
              onClick={() => store.toggleFavorite(rawProvider.id)}
              className="size-9 rounded-2xl bg-card border border-border flex items-center justify-center transition cursor-pointer"
              aria-label="Favoritar"
            >
              <Heart
                size={18}
                className={isFav ? "fill-red-500 text-red-500" : "text-muted-foreground"}
              />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* BANNER DE STATUS KYC QUANDO APROVADO OU EM ANÁLISE */}
          <KycStatusBanner
            status={liveContract.kycStatus}
            onOpenKycModal={() => setOpenKycModal(true)}
          />

          {/* HEADER DE AUTORIDADE COM BADGE KYC E MÉTRICAS */}
          <ProviderHeaderAuthority
            contract={liveContract}
            isOwner={isOwner}
            viewMode={viewMode}
            onToggleViewMode={setViewMode}
            onOpenBooking={() => setOpenBook(true)}
            onOpenKycModal={() => setOpenKycModal(true)}
            isFavorite={isFav}
            onToggleFavorite={() => store.toggleFavorite(rawProvider.id)}
          />

          {/* APRESENTAÇÃO & BIOGRAFIA & CERTIFICAÇÕES */}
          <section className="rounded-3xl border border-border/80 bg-card p-5 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText size={14} className="text-primary" /> Apresentação & Experiência
              </h2>
              <span className="text-[11px] font-bold text-primary">
                {liveContract.personalInfo.yearsExperience} anos no ramo
              </span>
            </div>

            <p className="text-xs text-foreground leading-relaxed">
              {liveContract.personalInfo.bio}
            </p>

            {/* CERTIFICAÇÕES E GARANTIAS */}
            {liveContract.personalInfo.certifications && (
              <div className="pt-2 border-t border-border/60 space-y-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Garantias e Credenciais
                </span>
                <div className="space-y-1.5">
                  {liveContract.personalInfo.certifications.map((cert, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-foreground">
                      <ShieldCheck
                        size={14}
                        className="text-emerald-600 dark:text-emerald-400 shrink-0"
                      />
                      <span className="text-[11px]">{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* CATÁLOGO DE SERVIÇOS E PREÇOS */}
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Boxes size={14} className="text-primary" /> Serviços & Tabela de Preços
              </h2>
              {isOwner && (
                <Link
                  to="/pro"
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Edit2 size={12} /> Gerir Catálogo
                </Link>
              )}
            </div>

            <div className="space-y-2">
              {servicesWithPricing.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedService(s.name);
                    setOpenBook(true);
                  }}
                  className="p-3.5 bg-card border border-border/80 rounded-2xl hover:border-primary/60 transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {s.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {s.description || "Clique para solicitar este serviço"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-primary">
                      {s.billingMethod === "orcamento" ? "Sob Orçamento" : formatDb(s.price)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">/{s.unit || "serviço"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* PORTFÓLIO DE TRABALHOS: COMPARATIVO ANTES VS DEPOIS COM SLIDER */}
          <PortfolioGallery
            portfolio={liveContract.portfolio}
            providerId={rawProvider.id}
            providerName={rawProvider.name}
            isOwner={isOwner}
            onAddPhotoClick={() => setOpenBeforeAfterAddModal(true)}
          />

          {/* ÁREA DE COBERTURA & RAIO DE ATENDIMENTO */}
          <CoverageConfigurator
            initialCoverage={liveContract.coverage}
            isReadOnly={!isOwner || viewMode === "VIEW_MODE_PUBLIC"}
          />

          {/* HORÁRIOS DE ATENDIMENTO SEMANAL */}
          {liveContract.schedule && (
            <ScheduleGridEditor
              initialSchedule={liveContract.schedule}
              isReadOnly={!isOwner || viewMode === "VIEW_MODE_PUBLIC"}
            />
          )}

          {/* BANNER DE PROTEÇÃO EM CUSTÓDIA KONEKTA */}
          <section>
            <div className="bg-primary/10 rounded-2xl p-4 flex gap-3 border border-primary/20">
              <ShieldCheck size={22} className="text-primary shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-foreground">Pagamento 100% em Custódia Segura</p>
                <p className="text-muted-foreground leading-relaxed">
                  O valor do serviço fica retido na KONEKTA STP e o prestador só recebe após a sua
                  confirmação com o PIN de finalização.
                </p>
              </div>
            </div>
          </section>

          {/* AVALIAÇÕES DETALHADAS COM FILTROS E TAGS */}
          <ReviewsList
            providerId={rawProvider.id}
            providerName={rawProvider.name}
            reviews={allReviews}
            onOpenReviewModal={() => setOpenReviewModal(true)}
            isOwner={isOwner}
          />
        </div>

        {/* BARRA FIXA INFERIOR DE CONVERSÃO RÁPIDA (CLIENTE) */}
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card/95 backdrop-blur-md border-t border-border p-4 shadow-xl z-30">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">
                A partir de
              </p>
              <p className="text-lg font-black text-primary">
                {formatDb(rawProvider.priceFrom || 350)}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Link
                to="/chat/$id"
                params={{ id: rawProvider.id }}
                className="size-11 rounded-2xl bg-muted border border-border/60 flex items-center justify-center text-foreground hover:bg-muted/80 transition cursor-pointer"
                title="Mensagem"
              >
                <MessageCircle size={18} className="text-primary" />
              </Link>
              <button
                type="button"
                onClick={() => setOpenBook(true)}
                className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-2 shadow-md hover:bg-primary/90 transition cursor-pointer active:scale-95"
              >
                <CheckCircle2 size={16} />
                <span>Solicitar Pedido</span>
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DE AGENDAMENTO / ORÇAMENTO */}
        <BookingModal
          open={openBook}
          onClose={() => setOpenBook(false)}
          provider={rawProvider}
          initialService={selectedService}
        />

        {/* MODAL DE ADICIONAR TRABALHO COM ANTES E DEPOIS */}
        <PortfolioBeforeAfterModal
          isOpen={openBeforeAfterAddModal}
          onClose={() => setOpenBeforeAfterAddModal(false)}
          onSaveItem={handleSaveNewPortfolioItem}
        />

        {/* MODAL DE KYC */}
        <KycVerificationModule
          isOpen={openKycModal}
          onClose={() => setOpenKycModal(false)}
          kycDocument={liveContract.kycDocuments}
          onStatusChange={(newStatus) => {
            toast.success(`Status de verificação KYC atualizado para ${newStatus}!`);
          }}
        />

        {/* MODAL DE AVALIAÇÃO */}
        <ReviewModal
          open={openReviewModal}
          onClose={() => setOpenReviewModal(false)}
          providerId={rawProvider.id}
          providerName={rawProvider.name}
          providerImage={rawProvider.image}
          providerCategory={rawProvider.category}
          serviceName={selectedService}
        />
      </div>
    </div>
  );
}

void providers;
