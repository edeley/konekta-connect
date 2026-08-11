import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarClock,
  Camera,
  Check,
  Clock,
  CreditCard,
  Images,
  Loader2,
  MapPin,
  Repeat,
  Search,
  ShieldCheck,
  User as UserIcon,
  Users,
  Wrench,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { AccordionSection } from "@/components/auth/AccordionSection";
import { CategorySelector, type SelectedService } from "@/components/auth/CategorySelector";
import { FileUpload } from "@/components/auth/FileUpload";
import { LoadingButton } from "@/components/auth/LoadingButton";
import { OTPInput } from "@/components/auth/OTPInput";
import { BottomSheet } from "@/components/konekta/kit";
import { FILE_RULES } from "@/lib/auth-schemas";
import {
  LOCALITIES,
  PAYMENT_PREFERENCES,
  PRICING_LABELS,
  SERVICE_RADIUS,
  STP_DISTRICTS,
  WEEK_DAYS,
  categoryById,
  pricingModelsFor,
  requiredDocuments,
  type PricingModel,
} from "@/lib/registo-catalog";
import { clearDraft, useDraftState, useOnline } from "@/lib/registo-draft";
import { store } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "Criar conta — KONEKTA STP" },
      {
        name: "description",
        content:
          "Crie a sua conta KONEKTA num só ecrã: confirme o número +239, escolha se quer contratar ou prestar serviços em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Criar conta — KONEKTA STP" },
      {
        property: "og:description",
        content: "Registo simples e seguro para clientes e prestadores em São Tomé e Príncipe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RegistoPage,
});

/* --------------------------------- Mock ---------------------------------- */

const DEMO_OTP = "123456";
/** Números que já têm conta (mock — futuramente uma verificação no backend). */
const EXISTING_PHONES = ["9912345"];

type Role = "cliente" | "prestador" | "ambos";
type ProviderKind = "individual" | "empresa";

type Draft = {
  role: Role | null;
  phone: string;
  verified: boolean;
  name: string;
  email: string;
  birth: string;
  district: string;
  locality: string;
  providerKind: ProviderKind;
  proName: string;
  proDesc: string;
  years: string;
  services: SelectedService[];
  pricing: PricingModel[];
  priceFrom: string;
  workDistricts: string[];
  radius: string;
  days: string[];
  from: string;
  to: string;
  availabilityLater: boolean;
  docs: string[];
  payment: string;
  terms: boolean;
  privacy: boolean;
};

const emptyDraft: Draft = {
  role: null,
  phone: "",
  verified: false,
  name: "",
  email: "",
  birth: "",
  district: "",
  locality: "",
  providerKind: "individual",
  proName: "",
  proDesc: "",
  years: "",
  services: [],
  pricing: [],
  priceFrom: "",
  workDistricts: [],
  radius: SERVICE_RADIUS[1],
  days: ["seg", "ter", "qua", "qui", "sex"],
  from: "08:00",
  to: "18:00",
  availabilityLater: false,
  docs: [],
  payment: "depois",
  terms: false,
  privacy: false,
};

function formatPhone(digits: string) {
  const d = digits.replace(/\D/g, "").slice(0, 7);
  return d.length > 3 ? `${d.slice(0, 3)} ${d.slice(3)}` : d;
}

/* --------------------------------- Página --------------------------------- */

function RegistoPage() {
  const navigate = useNavigate();
  const online = useOnline();
  const [d, setD] = useDraftState<Draft>(emptyDraft);
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));

  const [otpOpen, setOtpOpen] = useState(false);
  const [otpError, setOtpError] = useState<string>();
  const [otpBusy, setOtpBusy] = useState(false);
  const [phoneError, setPhoneError] = useState<string>();
  const [duplicate, setDuplicate] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);

  const isProvider = d.role === "prestador" || d.role === "ambos";
  const isClient = d.role === "cliente" || d.role === "ambos";
  const categoryIds = useMemo(() => [...new Set(d.services.map((s) => s.categoryId))], [d.services]);
  const pricingOptions = useMemo(() => pricingModelsFor(categoryIds), [categoryIds]);
  const docs = useMemo(() => requiredDocuments(d.providerKind, categoryIds), [d.providerKind, categoryIds]);

  /* ------------------------------ Validação ------------------------------ */

  const nameError = d.name.trim().length >= 3 ? undefined : "Escreva o seu nome completo.";
  const emailError =
    !d.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())
      ? undefined
      : "Introduza um e-mail válido.";
  const locationError = d.district ? undefined : "Escolha o seu distrito.";
  const servicesError = !isProvider || d.services.length ? undefined : "Escolha pelo menos um serviço.";
  const proError =
    !isProvider || (d.providerKind === "individual" ? d.proName.trim().length >= 3 : d.proName.trim().length >= 3)
      ? undefined
      : d.providerKind === "empresa"
        ? "Indique o nome da empresa."
        : "Indique o seu nome profissional.";
  const docsError =
    !isProvider || docs.filter((x) => x.required).every((x) => d.docs.includes(x.id))
      ? undefined
      : "Envie o documento de identidade.";
  const termsError = d.terms && d.privacy ? undefined : "Aceite os termos para continuar.";

  const errors = [nameError, emailError, locationError, proError, servicesError, docsError, termsError].filter(
    Boolean,
  ) as string[];

  const cta =
    d.role === "prestador"
      ? "Enviar perfil para verificação"
      : d.role === "ambos"
        ? "Concluir e enviar perfil"
        : "Começar a procurar serviços";

  /* -------------------------------- Ações -------------------------------- */

  function handleContinue() {
    setDuplicate(false);
    if (!d.role) {
      setPhoneError("Escolha primeiro como pretende utilizar o KONEKTA.");
      return;
    }
    if (d.phone.length !== 7 || !/^9/.test(d.phone)) {
      setPhoneError("Introduza um número de telemóvel válido (9XX XXXX).");
      return;
    }
    if (EXISTING_PHONES.includes(d.phone)) {
      setPhoneError(undefined);
      setDuplicate(true);
      return;
    }
    setPhoneError(undefined);
    setOtpError(undefined);
    setOtpOpen(true);
  }

  function handleOtp(code: string) {
    setOtpBusy(true);
    setOtpError(undefined);
    setTimeout(() => {
      setOtpBusy(false);
      if (code !== DEMO_OTP) {
        setOtpError("Código incorreto. Tente novamente.");
        return;
      }
      set({ verified: true });
      setOtpOpen(false);
      toast.success("Número confirmado");
    }, 600);
  }

  function useGps() {
    if (!("geolocation" in navigator)) {
      toast.error("O seu telemóvel não permite localização automática.");
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setGpsBusy(false);
        set({ district: "Água Grande", locality: d.locality || "Cidade de São Tomé" });
        toast.success("Localização preenchida");
      },
      () => {
        setGpsBusy(false);
        toast.message("Sem acesso ao GPS", { description: "Pode escolher o distrito manualmente." });
      },
      { timeout: 8000 },
    );
  }

  function pickPhoto(capture: boolean) {
    setPhotoOpen(false);
    const input = photoInput.current;
    if (!input) return;
    if (capture) input.setAttribute("capture", "user");
    else input.removeAttribute("capture");
    input.click();
  }

  function submit() {
    setShowErrors(true);
    if (errors.length) {
      toast.error(errors[0]);
      return;
    }
    if (!online) {
      toast.error("Sem ligação à internet.", { description: "Os seus dados ficam guardados. Tente novamente." });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      const base = {
        phone: `+239 ${formatPhone(d.phone)}`,
        name: d.name.trim(),
        email: d.email.trim() || undefined,
        avatar: photo ?? undefined,
        birthDate: d.birth || undefined,
        district: d.district,
        city: d.locality,
      };

      if (isProvider) {
        store.registerProvider(base, {
          category: categoryById(categoryIds[0])?.name ?? "Serviços",
          subcategory: d.services[0]?.subcategory,
          yearsExperience: Number(d.years) || 0,
          bio: d.proDesc.trim(),
          services: d.services.map((s) => ({ name: s.service, price: Number(d.priceFrom) || 0 })),
          district: d.district,
          city: d.locality,
          radiusKm: Number(d.radius.replace(/\D/g, "")) || 0,
          documents: { selfieOk: d.docs.includes("bi") },
        });
      } else {
        store.registerClient(base);
      }
      store.markOnboarded();
      clearDraft();
      setSubmitting(false);
      navigate({ to: isProvider ? "/pending-approval" : "/", replace: true });
    }, 900);
  }

  /* --------------------------------- UI ---------------------------------- */

  return (
    <main className="min-h-screen bg-surface pb-28">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md items-center gap-3 px-4 py-3">
          <Link
            to="/login"
            aria-label="Voltar"
            className="press grid size-10 place-items-center rounded-full bg-surface text-foreground"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base font-bold tracking-tight">Criar conta KONEKTA</h1>
            <p className="truncate text-xs text-muted-foreground">Um só ecrã. Simples e seguro.</p>
          </div>
        </div>
      </header>

      {!online && (
        <div className="mx-auto mt-3 flex w-full max-w-md items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs font-semibold text-foreground">
          <WifiOff size={15} aria-hidden="true" /> Sem ligação. Os seus dados ficam guardados neste telemóvel.
        </div>
      )}

      <div className="mx-auto w-full max-w-md space-y-4 px-4 py-4">
        {/* 1. Perfil */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-bold">Como pretende utilizar o KONEKTA?</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Pode mudar mais tarde no seu perfil.</p>
          <div className="mt-3 space-y-2">
            {(
              [
                { id: "cliente", icon: UserIcon, title: "Cliente", desc: "Quero contratar serviços", tag: "Perfil Cliente" },
                { id: "prestador", icon: Wrench, title: "Prestador", desc: "Quero prestar serviços", tag: "Perfil Prestador" },
                { id: "ambos", icon: Repeat, title: "Ambos", desc: "Contratar e prestar serviços", tag: "Perfil Duplo" },
              ] as const
            ).map((opt) => {
              const active = d.role === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ role: opt.id })}
                  className={cn(
                    "press flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-left transition-colors",
                    active ? "border-primary bg-accent" : "border-border bg-card",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-11 shrink-0 place-items-center rounded-xl",
                      active ? "bg-primary text-primary-foreground" : "bg-surface text-primary",
                    )}
                  >
                    <opt.icon size={20} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">{opt.title}</span>
                    <span className="block text-xs text-muted-foreground">{opt.desc}</span>
                  </span>
                  {active ? (
                    <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-primary-foreground">
                      {opt.tag}
                    </span>
                  ) : (
                    <span className="size-5 rounded-full border-2 border-border" aria-hidden="true" />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* 2. Telefone */}
        <section className="rounded-2xl border border-border bg-card p-4">
          <label htmlFor="phone" className="text-sm font-bold">
            Número de telemóvel
          </label>
          <p className="mt-0.5 text-xs text-muted-foreground">É assim que entra na app e recebe pedidos.</p>
          <div
            className={cn(
              "mt-3 flex items-stretch overflow-hidden rounded-xl border bg-card focus-within:ring-2 focus-within:ring-ring/40",
              phoneError ? "border-destructive" : d.verified ? "border-success" : "border-border",
            )}
          >
            <span className="grid select-none place-items-center gap-1 bg-surface px-3 text-sm font-bold text-foreground">
              🇸🇹 +239
            </span>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="9XX XXXX"
              disabled={d.verified}
              value={formatPhone(d.phone)}
              onChange={(e) => {
                setDuplicate(false);
                setPhoneError(undefined);
                set({ phone: e.target.value.replace(/\D/g, "").slice(0, 7) });
              }}
              className="min-h-12 w-full bg-transparent px-3 text-base font-semibold tracking-wide outline-none disabled:opacity-70"
            />
            {d.verified && (
              <span className="grid place-items-center px-3 text-success">
                <BadgeCheck size={20} aria-hidden="true" />
              </span>
            )}
          </div>
          {phoneError && (
            <p role="alert" className="mt-2 text-xs font-medium text-destructive">
              {phoneError}
            </p>
          )}

          {duplicate && (
            <div className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3">
              <p className="text-xs font-semibold">Este número já possui uma conta KONEKTA.</p>
              <div className="mt-2 flex gap-2">
                <Link
                  to="/login"
                  className="press flex-1 rounded-lg bg-primary px-3 py-2 text-center text-xs font-bold text-primary-foreground"
                >
                  Entrar
                </Link>
                <Link
                  to="/recover-access"
                  className="press flex-1 rounded-lg border border-border bg-card px-3 py-2 text-center text-xs font-bold"
                >
                  Recuperar acesso
                </Link>
              </div>
            </div>
          )}

          {d.verified ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-success">
              <Check size={14} aria-hidden="true" /> Número confirmado
            </p>
          ) : (
            <button
              type="button"
              onClick={handleContinue}
              className="press mt-3 min-h-12 w-full rounded-xl bg-primary text-sm font-bold text-primary-foreground"
            >
              Continuar
            </button>
          )}
        </section>

        {/* 3. Perfil (aparece depois do número confirmado) */}
        {!d.verified ? (
          <p className="px-1 text-center text-xs text-muted-foreground">
            Confirme o número para completar o seu perfil aqui mesmo.
          </p>
        ) : (
          <>
            <AccordionSection
              icon={<UserIcon size={17} aria-hidden="true" />}
              title="Dados pessoais"
              summary={d.name || "Nome, foto e e-mail"}
              done={!nameError && !emailError}
              defaultOpen
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPhotoOpen(true)}
                  className="press grid size-16 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-dashed border-border bg-surface text-muted-foreground"
                  aria-label="Adicionar foto de perfil"
                >
                  {photo ? (
                    <img src={photo} alt="Foto de perfil escolhida" className="size-16 object-cover" />
                  ) : (
                    <Camera size={20} aria-hidden="true" />
                  )}
                </button>
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">Foto de perfil</p>
                  <p>Opcional, mas ajuda a criar confiança.</p>
                </div>
              </div>
              <input
                ref={photoInput}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setPhoto(URL.createObjectURL(file));
                }}
              />

              <TextField
                label="Nome completo"
                required
                value={d.name}
                onChange={(v) => set({ name: v })}
                placeholder="Ex.: Maria dos Santos"
                error={showErrors ? nameError : undefined}
              />
              <TextField
                label="E-mail (opcional)"
                type="email"
                value={d.email}
                onChange={(v) => set({ email: v })}
                placeholder="nome@exemplo.st"
                hint="Serve para recibos e notificações. Não é obrigatório."
                error={emailError}
              />
              <TextField
                label="Data de nascimento (opcional)"
                type="date"
                value={d.birth}
                onChange={(v) => set({ birth: v })}
              />
            </AccordionSection>

            <AccordionSection
              icon={<MapPin size={17} aria-hidden="true" />}
              title="Onde está?"
              summary={d.district ? `${d.district}${d.locality ? ` · ${d.locality}` : ""}` : "Distrito e bairro"}
              done={!!d.district}
            >
              <button
                type="button"
                onClick={useGps}
                className="press flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface text-sm font-semibold text-primary"
              >
                {gpsBusy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <MapPin size={15} aria-hidden="true" />}
                Usar a minha localização
              </button>

              <div className="space-y-1.5">
                <label htmlFor="district" className="text-sm font-semibold">
                  Distrito <span className="text-destructive">*</span>
                </label>
                <select
                  id="district"
                  value={d.district}
                  onChange={(e) => set({ district: e.target.value, locality: "" })}
                  className="min-h-12 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">Escolher distrito</option>
                  {STP_DISTRICTS.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
                {showErrors && locationError && (
                  <p role="alert" className="text-xs text-destructive">
                    {locationError}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="locality" className="text-sm font-semibold">
                  Localidade / Bairro
                </label>
                <input
                  id="locality"
                  list="localities"
                  value={d.locality}
                  onChange={(e) => set({ locality: e.target.value })}
                  placeholder="Ex.: Riboque"
                  className="min-h-12 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                />
                <datalist id="localities">
                  {(LOCALITIES[d.district] ?? []).map((x) => (
                    <option key={x} value={x} />
                  ))}
                </datalist>
              </div>
            </AccordionSection>

            {isProvider && (
              <>
                <AccordionSection
                  icon={<Briefcase size={17} aria-hidden="true" />}
                  title="Perfil profissional"
                  summary={d.proName || (d.providerKind === "empresa" ? "Dados da empresa" : "Como quer ser conhecido")}
                  done={!proError}
                  defaultOpen
                >
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { id: "individual", label: "Profissional individual", icon: UserIcon },
                        { id: "empresa", label: "Empresa", icon: Building2 },
                      ] as const
                    ).map((k) => (
                      <button
                        key={k.id}
                        type="button"
                        aria-pressed={d.providerKind === k.id}
                        onClick={() => set({ providerKind: k.id })}
                        className={cn(
                          "press flex flex-col items-center gap-1.5 rounded-xl border-2 p-3 text-center text-xs font-semibold",
                          d.providerKind === k.id ? "border-primary bg-accent text-primary" : "border-border bg-card",
                        )}
                      >
                        <k.icon size={18} aria-hidden="true" /> {k.label}
                      </button>
                    ))}
                  </div>

                  <TextField
                    label={d.providerKind === "empresa" ? "Nome da empresa" : "Nome profissional"}
                    required
                    value={d.proName}
                    onChange={(v) => set({ proName: v })}
                    placeholder={d.providerKind === "empresa" ? "Ex.: STP Serviços, Lda" : "Ex.: Eletricista Nando"}
                    error={showErrors ? proError : undefined}
                  />
                  {d.providerKind === "empresa" && (
                    <TextField
                      label="Nome do responsável"
                      value={d.name}
                      onChange={(v) => set({ name: v })}
                      placeholder="Quem responde pela empresa"
                    />
                  )}
                  <div className="space-y-1.5">
                    <label htmlFor="bio" className="text-sm font-semibold">
                      Descrição
                    </label>
                    <textarea
                      id="bio"
                      rows={3}
                      value={d.proDesc}
                      onChange={(e) => set({ proDesc: e.target.value })}
                      placeholder="Explique em poucas palavras o que faz e porque confiar em si."
                      className="w-full rounded-xl border border-border bg-card p-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                  <TextField
                    label="Experiência (anos)"
                    type="number"
                    value={d.years}
                    onChange={(v) => set({ years: v })}
                    placeholder="Ex.: 5"
                  />
                </AccordionSection>

                <AccordionSection
                  icon={<Wrench size={17} aria-hidden="true" />}
                  title="Serviços"
                  summary={d.services.length ? `${d.services.length} serviço(s) escolhido(s)` : "Escolha o que sabe fazer"}
                  done={!servicesError}
                  defaultOpen
                >
                  <CategorySelector value={d.services} onChange={(services) => set({ services, pricing: [] })} />
                  {showErrors && servicesError && (
                    <p role="alert" className="text-xs text-destructive">
                      {servicesError}
                    </p>
                  )}
                </AccordionSection>

                {d.services.length > 0 && (
                  <AccordionSection
                    icon={<CreditCard size={17} aria-hidden="true" />}
                    title="Como quer cobrar"
                    summary={d.pricing.length ? d.pricing.map((p) => PRICING_LABELS[p]).join(", ") : "Formas de cobrança"}
                    done={d.pricing.length > 0}
                    optional
                  >
                    <p className="text-xs text-muted-foreground">
                      Mostramos apenas o que faz sentido para os serviços que escolheu.
                    </p>
                    <ul className="flex flex-wrap gap-2">
                      {pricingOptions.map((p) => {
                        const active = d.pricing.includes(p);
                        return (
                          <li key={p}>
                            <button
                              type="button"
                              aria-pressed={active}
                              onClick={() =>
                                set({
                                  pricing: active ? d.pricing.filter((x) => x !== p) : [...d.pricing, p],
                                })
                              }
                              className={cn(
                                "rounded-full border px-3 py-2 text-xs font-semibold",
                                active ? "border-primary bg-accent text-primary" : "border-border bg-card",
                              )}
                            >
                              {PRICING_LABELS[p]}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    <TextField
                      label="Preço a partir de (Db)"
                      type="number"
                      value={d.priceFrom}
                      onChange={(v) => set({ priceFrom: v })}
                      placeholder="Ex.: 500"
                      hint="Pode negociar cada pedido dentro do KONEKTA."
                    />
                  </AccordionSection>
                )}

                <AccordionSection
                  icon={<MapPin size={17} aria-hidden="true" />}
                  title="Onde presta serviços"
                  summary={d.workDistricts.length ? d.workDistricts.join(", ") : "Distritos de atendimento"}
                  done={d.workDistricts.length > 0}
                  optional
                >
                  <ul className="flex flex-wrap gap-2">
                    {STP_DISTRICTS.map((x) => {
                      const active = d.workDistricts.includes(x);
                      return (
                        <li key={x}>
                          <button
                            type="button"
                            aria-pressed={active}
                            onClick={() =>
                              set({
                                workDistricts: active
                                  ? d.workDistricts.filter((w) => w !== x)
                                  : [...d.workDistricts, x],
                              })
                            }
                            className={cn(
                              "rounded-full border px-3 py-2 text-xs font-semibold",
                              active ? "border-primary bg-accent text-primary" : "border-border bg-card",
                            )}
                          >
                            {active && <Check size={12} className="mr-1 inline" aria-hidden="true" />}
                            {x}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="space-y-1.5">
                    <label htmlFor="radius" className="text-sm font-semibold">
                      Raio de atendimento
                    </label>
                    <select
                      id="radius"
                      value={d.radius}
                      onChange={(e) => set({ radius: e.target.value })}
                      className="min-h-12 w-full rounded-xl border border-border bg-card px-3 text-sm outline-none focus:border-primary"
                    >
                      {SERVICE_RADIUS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                </AccordionSection>

                <AccordionSection
                  icon={<Clock size={17} aria-hidden="true" />}
                  title="Disponibilidade"
                  summary={d.availabilityLater ? "Configurar depois" : `${d.days.length} dias · ${d.from}–${d.to}`}
                  done={d.availabilityLater || d.days.length > 0}
                  optional
                >
                  <ul className="flex flex-wrap gap-2">
                    {WEEK_DAYS.map((day) => {
                      const active = d.days.includes(day.id);
                      return (
                        <li key={day.id}>
                          <button
                            type="button"
                            aria-pressed={active}
                            disabled={d.availabilityLater}
                            onClick={() =>
                              set({ days: active ? d.days.filter((x) => x !== day.id) : [...d.days, day.id] })
                            }
                            className={cn(
                              "size-11 rounded-full border text-xs font-bold disabled:opacity-50",
                              active ? "border-primary bg-accent text-primary" : "border-border bg-card",
                            )}
                          >
                            {day.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="grid grid-cols-2 gap-2">
                    <TextField label="Das" type="time" value={d.from} onChange={(v) => set({ from: v })} />
                    <TextField label="Até" type="time" value={d.to} onChange={(v) => set({ to: v })} />
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <input
                      type="checkbox"
                      checked={d.availabilityLater}
                      onChange={(e) => set({ availabilityLater: e.target.checked })}
                      className="size-4 accent-[var(--color-primary)]"
                    />
                    <CalendarClock size={14} aria-hidden="true" /> Configurar depois
                  </label>
                </AccordionSection>

                <AccordionSection
                  icon={<ShieldCheck size={17} aria-hidden="true" />}
                  title="Verificação"
                  summary={d.docs.length ? `${d.docs.length} documento(s) enviado(s)` : "Documento de identidade"}
                  done={!docsError}
                  defaultOpen
                >
                  <p className="text-xs text-muted-foreground">
                    Envie o seu documento para confirmarmos a sua identidade. Os clientes só veem um selo de
                    verificado — nunca os seus documentos.
                  </p>
                  {docs.map((doc) => (
                    <div key={doc.id} className="space-y-2">
                      <FileUpload
                        label={doc.label + (doc.required ? "" : " (quando aplicável)")}
                        hint={doc.hint}
                        accept={FILE_RULES.bi.accept}
                        maxSize={FILE_RULES.bi.maxSize}
                        required={doc.required}
                        secure
                        onChange={(files) =>
                          set({
                            docs: files.length
                              ? [...new Set([...d.docs, doc.id])]
                              : d.docs.filter((x) => x !== doc.id),
                          })
                        }
                      />
                      {d.docs.includes(doc.id) && (
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-warning">
                          <Clock size={13} aria-hidden="true" /> Em análise (24–48h)
                        </p>
                      )}
                    </div>
                  ))}
                  {showErrors && docsError && (
                    <p role="alert" className="text-xs text-destructive">
                      {docsError}
                    </p>
                  )}
                </AccordionSection>
              </>
            )}

            {isClient && (
              <AccordionSection
                icon={<CreditCard size={17} aria-hidden="true" />}
                title="Preferências de pagamento"
                summary={PAYMENT_PREFERENCES.find((p) => p.id === d.payment)?.label}
                done
                optional
              >
                <ul className="space-y-2">
                  {PAYMENT_PREFERENCES.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-pressed={d.payment === p.id}
                        onClick={() => set({ payment: p.id })}
                        className={cn(
                          "press flex w-full items-center justify-between rounded-xl border-2 px-3 py-3 text-left",
                          d.payment === p.id ? "border-primary bg-accent" : "border-border bg-card",
                        )}
                      >
                        <span>
                          <span className="block text-sm font-semibold">{p.label}</span>
                          <span className="block text-xs text-muted-foreground">{p.hint}</span>
                        </span>
                        {d.payment === p.id && <Check size={16} className="text-primary" aria-hidden="true" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </AccordionSection>
            )}

            <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
              <label className="flex items-start gap-3 text-xs">
                <input
                  type="checkbox"
                  checked={d.terms}
                  onChange={(e) => set({ terms: e.target.checked })}
                  className="mt-0.5 size-4 accent-[var(--color-primary)]"
                />
                <span>
                  Aceito os{" "}
                  <Link to="/termos" className="font-semibold text-primary underline">
                    Termos de Utilização
                  </Link>
                  .
                </span>
              </label>
              <label className="flex items-start gap-3 text-xs">
                <input
                  type="checkbox"
                  checked={d.privacy}
                  onChange={(e) => set({ privacy: e.target.checked })}
                  className="mt-0.5 size-4 accent-[var(--color-primary)]"
                />
                <span>
                  Aceito a{" "}
                  <Link to="/privacidade" className="font-semibold text-primary underline">
                    Política de Privacidade
                  </Link>
                  .
                </span>
              </label>
              {showErrors && termsError && (
                <p role="alert" className="text-xs text-destructive">
                  {termsError}
                </p>
              )}

              <LoadingButton loading={submitting} fullWidth onClick={submit}>
                {isProvider ? <Users size={16} aria-hidden="true" /> : <Search size={16} aria-hidden="true" />}
                {cta}
              </LoadingButton>
              <p className="text-center text-[11px] text-muted-foreground">
                Já tem conta?{" "}
                <Link to="/login" className="font-semibold text-primary">
                  Entrar
                </Link>
              </p>
            </section>
          </>
        )}
      </div>

      {/* OTP — bottom sheet, sem sair do ecrã */}
      <BottomSheet
        open={otpOpen}
        onClose={() => setOtpOpen(false)}
        title="Confirme o seu número"
        description={`Enviámos um código para +239 ${formatPhone(d.phone)}.`}
      >
        <OTPInput length={6} onComplete={handleOtp} error={otpError} disabled={otpBusy} />
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          Demonstração: use o código <strong>{DEMO_OTP}</strong>
        </p>
        <div className="mt-3 flex items-center justify-between text-xs font-semibold">
          <button type="button" onClick={() => toast.success("Código reenviado")} className="text-primary">
            Reenviar código
          </button>
          <button type="button" onClick={() => setOtpOpen(false)} className="text-muted-foreground">
            Alterar número
          </button>
        </div>
        {otpBusy && (
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" aria-hidden="true" /> A confirmar…
          </p>
        )}
      </BottomSheet>

      {/* Foto de perfil */}
      <BottomSheet open={photoOpen} onClose={() => setPhotoOpen(false)} title="Criar foto de perfil">
        <button
          type="button"
          onClick={() => pickPhoto(true)}
          className="press flex min-h-12 w-full items-center gap-3 rounded-xl border border-border px-3 text-sm font-semibold"
        >
          <Camera size={18} aria-hidden="true" /> Tirar fotografia
        </button>
        <button
          type="button"
          onClick={() => pickPhoto(false)}
          className="press flex min-h-12 w-full items-center gap-3 rounded-xl border border-border px-3 text-sm font-semibold"
        >
          <Images size={18} aria-hidden="true" /> Escolher da galeria
        </button>
        <button
          type="button"
          onClick={() => setPhotoOpen(false)}
          className="press min-h-12 w-full rounded-xl bg-surface text-sm font-semibold text-muted-foreground"
        >
          Cancelar
        </button>
      </BottomSheet>
    </main>
  );
}

/* ------------------------------ Campo simples ----------------------------- */

function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={!!error}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "min-h-12 w-full rounded-xl border bg-card px-3 text-sm outline-none focus:border-primary",
          error ? "border-destructive" : "border-border",
        )}
      />
      {hint && !error && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
