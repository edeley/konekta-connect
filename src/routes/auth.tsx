import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import {
  ShieldCheck,
  Sparkles,
  HandCoins,
  ArrowRight,
  ArrowLeft,
  Check,
  User as UserIcon,
  Briefcase,
  MapPin,
  Camera,
  FileText,
  Wallet as WalletIcon,
  Phone,
  Loader2,
} from "lucide-react";
import { store, useStore } from "@/lib/store";
import { categories } from "@/lib/konekta-data";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Criar conta · KONEKTA" },
      { name: "description", content: "Registo rápido e seguro na KONEKTA em menos de 2 minutos." },
      { property: "og:title", content: "Entrar na KONEKTA" },
      { property: "og:description", content: "Serviços de confiança em São Tomé e Príncipe." },
    ],
  }),
  component: AuthPage,
});

type Mode = "welcome" | "login" | "client" | "provider";
const phoneRe = /^[0-9\s+()-]{7,20}$/;

function AuthPage() {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("welcome");

  useEffect(() => {
    if (user) navigate({ to: "/", replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-surface flex justify-center">
      <div className="w-full max-w-md min-h-screen flex flex-col bg-surface">
        {mode === "welcome" && <Welcome onChoose={setMode} />}
        {mode === "login" && <LoginFlow onBack={() => setMode("welcome")} />}
        {mode === "client" && <ClientFlow onBack={() => setMode("welcome")} onDone={() => navigate({ to: "/" })} />}
        {mode === "provider" && <ProviderFlow onBack={() => setMode("welcome")} onDone={() => navigate({ to: "/" })} />}
      </div>
    </div>
  );
}

/* ---------------- Welcome ---------------- */
function Welcome({ onChoose }: { onChoose: (m: Mode) => void }) {
  return (
    <>
      <div className="relative overflow-hidden bg-cocoa text-primary-foreground px-6 pt-14 pb-16 rounded-b-[2rem]">
        <div className="absolute -top-16 -right-16 size-56 bg-terracotta/40 blur-3xl rounded-full" />
        <div className="absolute -bottom-20 -left-10 size-48 bg-ocean/30 blur-3xl rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-2 text-primary-foreground/70 text-xs tracking-[0.25em] uppercase">
            <span className="size-2 rounded-full bg-terracotta" />
            KONEKTA · STP
          </div>
          <h1 className="mt-4 text-3xl font-semibold leading-tight text-balance">
            Bem-vindo à KONEKTA
          </h1>
          <p className="mt-2 text-sm text-primary-foreground/70 leading-relaxed">
            Conectando pessoas, criando oportunidades em São Tomé e Príncipe.
          </p>
        </div>
      </div>

      <div className="flex-1 px-5 -mt-8 pb-8">
        <div className="bg-card ring-1 ring-border rounded-2xl p-5 shadow-sm space-y-3">
          <button
            onClick={() => onChoose("client")}
            className="w-full flex items-center gap-3 bg-terracotta text-primary-foreground rounded-xl p-4 font-semibold text-sm"
          >
            <div className="size-10 rounded-lg bg-primary-foreground/15 grid place-items-center">
              <UserIcon size={18} />
            </div>
            <div className="flex-1 text-left">
              <div>Sou cliente</div>
              <div className="text-xs font-normal text-primary-foreground/80">Contratar profissionais</div>
            </div>
            <ArrowRight size={18} />
          </button>

          <button
            onClick={() => onChoose("provider")}
            className="w-full flex items-center gap-3 bg-cocoa text-primary-foreground rounded-xl p-4 font-semibold text-sm"
          >
            <div className="size-10 rounded-lg bg-primary-foreground/15 grid place-items-center">
              <Briefcase size={18} />
            </div>
            <div className="flex-1 text-left">
              <div>Quero trabalhar na KONEKTA</div>
              <div className="text-xs font-normal text-primary-foreground/80">Receber pedidos e ganhar</div>
            </div>
            <ArrowRight size={18} />
          </button>

          <div className="pt-2 border-t border-border text-center">
            <button onClick={() => onChoose("login")} className="text-sm font-medium text-cocoa">
              Já tenho conta · Entrar
            </button>
          </div>
        </div>

        <ul className="mt-6 space-y-3">
          {[
            { icon: ShieldCheck, title: "Pagamento protegido", text: "O prestador só recebe após confirmar o serviço." },
            { icon: Sparkles, title: "Profissionais verificados", text: "Identidade e reputação validadas." },
            { icon: HandCoins, title: "Preços transparentes", text: "Sem taxas escondidas nem surpresas." },
          ].map((f) => (
            <li key={f.title} className="flex gap-3 items-start bg-card ring-1 ring-border rounded-xl p-3">
              <div className="size-9 rounded-lg bg-terracotta/10 text-terracotta grid place-items-center shrink-0">
                <f.icon size={16} />
              </div>
              <div>
                <p className="text-sm font-medium">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

/* ---------------- Reusable step chrome ---------------- */
function StepShell({
  step,
  total,
  title,
  subtitle,
  onBack,
  children,
}: {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  const progress = Math.round((step / total) * 100);
  return (
    <div className="flex-1 flex flex-col">
      <header className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="size-9 rounded-full bg-card ring-1 ring-border grid place-items-center"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Passo {step} de {total}
          </span>
        </div>
        <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-terracotta transition-all" style={{ width: `${progress}%` }} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold leading-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </header>
      <div className="flex-1 px-5 pb-8 flex flex-col">{children}</div>
    </div>
  );
}

function TextField({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
  optional,
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
  optional?: boolean;
  inputMode?: "text" | "tel" | "email" | "numeric";
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">
        {label} {optional && <span className="text-muted-foreground/60">(opcional)</span>}
      </span>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        autoFocus={autoFocus}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full py-3 px-3 bg-card ring-1 ring-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
      />
    </label>
  );
}

function PrimaryBtn({
  children,
  onClick,
  disabled,
  loading,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full mt-auto bg-terracotta text-primary-foreground rounded-xl py-3.5 font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------- Login (rápido) ---------------- */
function LoginFlow({ onBack }: { onBack: () => void }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function submitPhone() {
    setErr(null);
    try {
      z.string().regex(phoneRe).parse(phone);
      setStep(2);
    } catch {
      setErr("Número inválido");
    }
  }

  function submitOtp() {
    setErr(null);
    if (otp.length !== 6) return setErr("Insira o código de 6 dígitos");
    setLoading(true);
    setTimeout(() => {
      store.signIn({ phone });
      navigate({ to: "/", replace: true });
    }, 500);
  }

  if (step === 1)
    return (
      <StepShell step={1} total={2} title="Bem-vindo(a)!" subtitle="Entre com o seu número" onBack={onBack}>
        <div className="space-y-4">
          <PhoneInput value={phone} onChange={setPhone} />
          {err && <ErrorText>{err}</ErrorText>}
        </div>
        <PrimaryBtn onClick={submitPhone} disabled={!phone}>Receber código</PrimaryBtn>
      </StepShell>
    );

  return (
    <StepShell step={2} total={2} title="Código enviado" subtitle={`Enviámos um código para +239 ${phone}`} onBack={() => setStep(1)}>
      <OtpInput value={otp} onChange={setOtp} />
      {err && <ErrorText>{err}</ErrorText>}
      <p className="text-xs text-center text-muted-foreground mt-4">
        Não recebeu? <button className="text-terracotta font-medium">Reenviar</button>
      </p>
      <PrimaryBtn onClick={submitOtp} loading={loading} disabled={otp.length !== 6}>Entrar</PrimaryBtn>
    </StepShell>
  );
}

/* ---------------- Client Flow (6 steps) ---------------- */
type ClientData = {
  phone: string;
  otp: string;
  name: string;
  avatar?: string;
  birthDate?: string;
  gender?: string;
  district: string;
  city: string;
  address?: string;
  terms: boolean;
  privacy: boolean;
};

function ClientFlow({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ClientData>({
    phone: "", otp: "", name: "", district: "", city: "", terms: false, privacy: false,
  });
  const [err, setErr] = useState<string | null>(null);
  const total = 6;
  const back = () => (step === 1 ? onBack() : (setErr(null), setStep(step - 1)));

  function next() {
    setErr(null);
    if (step === 1 && !phoneRe.test(data.phone)) return setErr("Número inválido");
    if (step === 2 && data.otp.length !== 6) return setErr("Código de 6 dígitos");
    if (step === 3 && data.name.trim().length < 2) return setErr("Indique o seu nome");
    if (step === 5 && (!data.district || !data.city)) return setErr("Preencha distrito e cidade");
    if (step === total) {
      if (!data.terms || !data.privacy) return setErr("Aceite os termos para continuar");
      store.registerClient({
        phone: data.phone,
        name: data.name,
        avatar: data.avatar,
        birthDate: data.birthDate,
        gender: data.gender,
        district: data.district,
        city: data.city,
        address: data.address,
      });
      onDone();
      return;
    }
    setStep(step + 1);
  }

  return (
    <>
      {step === 1 && (
        <StepShell step={1} total={total} title="O seu telemóvel" subtitle="Usamos para proteger a sua conta" onBack={back}>
          <PhoneInput value={data.phone} onChange={(v) => setData({ ...data, phone: v })} />
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next} disabled={!data.phone}>Receber código</PrimaryBtn>
        </StepShell>
      )}
      {step === 2 && (
        <StepShell step={2} total={total} title="Código de verificação" subtitle={`Enviado para +239 ${data.phone}`} onBack={back}>
          <OtpInput value={data.otp} onChange={(v) => setData({ ...data, otp: v })} />
          {err && <ErrorText>{err}</ErrorText>}
          <p className="text-xs text-center text-muted-foreground mt-4">
            <button className="text-terracotta font-medium">Reenviar código</button>
          </p>
          <PrimaryBtn onClick={next} disabled={data.otp.length !== 6}>Verificar</PrimaryBtn>
        </StepShell>
      )}
      {step === 3 && (
        <StepShell step={3} total={total} title="Os seus dados" subtitle="Só o essencial para começar" onBack={back}>
          <div className="space-y-4">
            <AvatarPicker value={data.avatar} onChange={(v) => setData({ ...data, avatar: v })} />
            <TextField label="Nome completo" name="name" value={data.name} onChange={(v) => setData({ ...data, name: v })} placeholder="Aida Neto" autoFocus />
            <TextField label="Data de nascimento" name="birthDate" type="date" value={data.birthDate ?? ""} onChange={(v) => setData({ ...data, birthDate: v })} optional />
            <div>
              <span className="text-xs font-medium text-muted-foreground">Sexo <span className="text-muted-foreground/60">(opcional)</span></span>
              <div className="mt-1 grid grid-cols-3 gap-2">
                {["Feminino", "Masculino", "Outro"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setData({ ...data, gender: g })}
                    className={`py-2.5 rounded-xl text-xs font-medium ring-1 ${
                      data.gender === g ? "bg-terracotta text-primary-foreground ring-terracotta" : "bg-card ring-border"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next}>Continuar</PrimaryBtn>
        </StepShell>
      )}
      {step === 4 && (
        <StepShell step={4} total={total} title="Onde vive?" subtitle="Ajuda-nos a mostrar prestadores próximos" onBack={back}>
          <div className="space-y-4">
            <DistrictPicker value={data.district} onChange={(v) => setData({ ...data, district: v })} />
            <TextField label="Cidade / Bairro" name="city" value={data.city} onChange={(v) => setData({ ...data, city: v })} placeholder="Trindade" />
            <TextField label="Endereço" name="address" value={data.address ?? ""} onChange={(v) => setData({ ...data, address: v })} placeholder="Rua da Praia, 12" optional />
            <button
              type="button"
              className="w-full flex items-center gap-2 bg-ocean/10 text-ocean rounded-xl py-2.5 px-3 text-sm font-medium"
            >
              <MapPin size={16} /> Usar a minha localização
            </button>
          </div>
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next}>Continuar</PrimaryBtn>
        </StepShell>
      )}
      {step === 5 && (
        <StepShell step={5} total={total} title="Quase lá" subtitle="Confirme os detalhes" onBack={back}>
          <div className="space-y-2 bg-card ring-1 ring-border rounded-xl p-4">
            <ReviewRow label="Nome" value={data.name} />
            <ReviewRow label="Telemóvel" value={`+239 ${data.phone}`} />
            <ReviewRow label="Localização" value={`${data.city}, ${data.district}`} />
            {data.address && <ReviewRow label="Endereço" value={data.address} />}
          </div>
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next}>Continuar</PrimaryBtn>
        </StepShell>
      )}
      {step === 6 && (
        <StepShell step={6} total={total} title="Termos e Condições" subtitle="Para continuarmos, aceite os termos" onBack={back}>
          <div className="space-y-3">
            <CheckBox
              checked={data.terms}
              onChange={(v) => setData({ ...data, terms: v })}
              label="Aceito os Termos de Utilização"
            />
            <CheckBox
              checked={data.privacy}
              onChange={(v) => setData({ ...data, privacy: v })}
              label="Aceito a Política de Privacidade"
            />
          </div>
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next} disabled={!data.terms || !data.privacy}>
            Criar conta
          </PrimaryBtn>
        </StepShell>
      )}
    </>
  );
}

/* ---------------- Provider Flow (8 steps) ---------------- */
type ProviderData = {
  phone: string;
  otp: string;
  name: string;
  avatar?: string;
  birthDate: string;
  category: string;
  subcategory: string;
  yearsExperience: number;
  bio: string;
  services: { name: string; price: number }[];
  district: string;
  city: string;
  radiusKm: number;
  idNumber: string;
  nif?: string;
  selfieOk: boolean;
  bankAccount?: string;
  contract: boolean;
};

function ProviderFlow({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ProviderData>({
    phone: "", otp: "", name: "", birthDate: "", category: "",
    subcategory: "", yearsExperience: 0, bio: "",
    services: [{ name: "", price: 0 }],
    district: "", city: "", radiusKm: 10,
    idNumber: "", selfieOk: false, contract: false,
  });
  const [err, setErr] = useState<string | null>(null);
  const total = 8;
  const back = () => (step === 1 ? onBack() : (setErr(null), setStep(step - 1)));

  function next() {
    setErr(null);
    if (step === 1 && !phoneRe.test(data.phone)) return setErr("Número inválido");
    if (step === 2 && data.otp.length !== 6) return setErr("Código de 6 dígitos");
    if (step === 3 && (data.name.trim().length < 2 || !data.birthDate)) return setErr("Preencha nome e data de nascimento");
    if (step === 4 && (!data.category || data.yearsExperience < 0)) return setErr("Escolha a categoria");
    if (step === 5) {
      const valid = data.services.filter((s) => s.name.trim() && s.price > 0);
      if (valid.length === 0) return setErr("Adicione pelo menos um serviço");
      setData({ ...data, services: valid });
    }
    if (step === 6 && (!data.district || !data.city)) return setErr("Preencha localização");
    if (step === 7 && (!data.idNumber || !data.selfieOk)) return setErr("Envie BI e selfie");
    if (step === total) {
      if (!data.contract) return setErr("Aceite o contrato para continuar");
      store.registerProvider(
        { phone: data.phone, name: data.name, avatar: data.avatar, birthDate: data.birthDate },
        {
          category: data.category,
          subcategory: data.subcategory,
          yearsExperience: data.yearsExperience,
          bio: data.bio,
          services: data.services,
          district: data.district,
          city: data.city,
          radiusKm: data.radiusKm,
          documents: { idNumber: data.idNumber, nif: data.nif, selfieOk: data.selfieOk },
          bankAccount: data.bankAccount,
        },
      );
      onDone();
      return;
    }
    setStep(step + 1);
  }

  return (
    <>
      {step === 1 && (
        <StepShell step={1} total={total} title="Vamos começar" subtitle="Comece pelo seu telemóvel" onBack={back}>
          <PhoneInput value={data.phone} onChange={(v) => setData({ ...data, phone: v })} />
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next}>Receber código</PrimaryBtn>
        </StepShell>
      )}
      {step === 2 && (
        <StepShell step={2} total={total} title="Verifique o número" subtitle={`Código enviado para +239 ${data.phone}`} onBack={back}>
          <OtpInput value={data.otp} onChange={(v) => setData({ ...data, otp: v })} />
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next}>Verificar</PrimaryBtn>
        </StepShell>
      )}
      {step === 3 && (
        <StepShell step={3} total={total} title="Os seus dados" onBack={back}>
          <div className="space-y-4">
            <AvatarPicker value={data.avatar} onChange={(v) => setData({ ...data, avatar: v })} required />
            <TextField label="Nome completo" name="name" value={data.name} onChange={(v) => setData({ ...data, name: v })} placeholder="Ex.: Edmilson Varela" />
            <TextField label="Data de nascimento" name="birthDate" type="date" value={data.birthDate} onChange={(v) => setData({ ...data, birthDate: v })} />
          </div>
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next}>Continuar</PrimaryBtn>
        </StepShell>
      )}
      {step === 4 && (
        <StepShell step={4} total={total} title="A sua profissão" subtitle="Categoria e experiência" onBack={back}>
          <div className="space-y-4">
            <div>
              <span className="text-xs font-medium text-muted-foreground">Categoria principal</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setData({ ...data, category: c.name })}
                    className={`py-3 rounded-xl text-sm font-medium ring-1 ${
                      data.category === c.name ? "bg-terracotta text-primary-foreground ring-terracotta" : "bg-card ring-border"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
            <TextField label="Subcategoria" name="sub" value={data.subcategory} onChange={(v) => setData({ ...data, subcategory: v })} placeholder="Ex.: Instalações residenciais" optional />
            <TextField label="Anos de experiência" name="years" type="number" inputMode="numeric" value={String(data.yearsExperience || "")} onChange={(v) => setData({ ...data, yearsExperience: Number(v) || 0 })} placeholder="0" />
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Pequena descrição</span>
              <textarea
                value={data.bio}
                onChange={(e) => setData({ ...data, bio: e.target.value })}
                maxLength={240}
                rows={3}
                placeholder="Fale sobre o seu trabalho..."
                className="mt-1 w-full py-3 px-3 bg-card ring-1 ring-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-terracotta/40"
              />
            </label>
          </div>
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next}>Continuar</PrimaryBtn>
        </StepShell>
      )}
      {step === 5 && (
        <StepShell step={5} total={total} title="Preços dos serviços" subtitle="Preço inicial em Dobras (Db)" onBack={back}>
          <div className="space-y-2">
            {data.services.map((s, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={s.name}
                  onChange={(e) => {
                    const next = [...data.services];
                    next[i] = { ...next[i], name: e.target.value };
                    setData({ ...data, services: next });
                  }}
                  placeholder="Ex.: Instalação elétrica"
                  className="flex-1 py-2.5 px-3 bg-card ring-1 ring-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={s.price || ""}
                  onChange={(e) => {
                    const next = [...data.services];
                    next[i] = { ...next[i], price: Number(e.target.value) || 0 };
                    setData({ ...data, services: next });
                  }}
                  placeholder="Db"
                  className="w-24 py-2.5 px-3 bg-card ring-1 ring-border rounded-xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-terracotta/40"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => setData({ ...data, services: [...data.services, { name: "", price: 0 }] })}
              className="w-full py-2.5 rounded-xl text-sm font-medium text-terracotta bg-terracotta/10"
            >
              + Adicionar serviço
            </button>
          </div>
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next}>Continuar</PrimaryBtn>
        </StepShell>
      )}
      {step === 6 && (
        <StepShell step={6} total={total} title="Área de atuação" onBack={back}>
          <div className="space-y-4">
            <DistrictPicker value={data.district} onChange={(v) => setData({ ...data, district: v })} />
            <TextField label="Cidade" name="city" value={data.city} onChange={(v) => setData({ ...data, city: v })} placeholder="São Tomé" />
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Raio de atuação: {data.radiusKm} km</span>
              <input
                type="range"
                min={1}
                max={50}
                value={data.radiusKm}
                onChange={(e) => setData({ ...data, radiusKm: Number(e.target.value) })}
                className="w-full mt-2 accent-terracotta"
              />
            </label>
          </div>
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next}>Continuar</PrimaryBtn>
        </StepShell>
      )}
      {step === 7 && (
        <StepShell step={7} total={total} title="Documentos" subtitle="Para verificarmos a sua identidade" onBack={back}>
          <div className="space-y-4">
            <TextField label="Número do Bilhete de Identidade" name="id" value={data.idNumber} onChange={(v) => setData({ ...data, idNumber: v })} placeholder="000000000ST" />
            <TextField label="NIF" name="nif" value={data.nif ?? ""} onChange={(v) => setData({ ...data, nif: v })} optional />
            <button
              type="button"
              onClick={() => setData({ ...data, selfieOk: !data.selfieOk })}
              className={`w-full flex items-center gap-3 rounded-xl p-4 ring-1 ${
                data.selfieOk ? "bg-terracotta/10 ring-terracotta" : "bg-card ring-border"
              }`}
            >
              <div className={`size-10 rounded-lg grid place-items-center ${data.selfieOk ? "bg-terracotta text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {data.selfieOk ? <Check size={18} /> : <Camera size={18} />}
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium">Selfie de verificação</div>
                <div className="text-xs text-muted-foreground">{data.selfieOk ? "Enviada" : "Toque para tirar"}</div>
              </div>
            </button>
          </div>
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next}>Continuar</PrimaryBtn>
        </StepShell>
      )}
      {step === 8 && (
        <StepShell step={8} total={total} title="Pagamentos e contrato" onBack={back}>
          <div className="space-y-4">
            <TextField label="Conta bancária" name="bank" value={data.bankAccount ?? ""} onChange={(v) => setData({ ...data, bankAccount: v })} placeholder="IBAN ST00..." optional />
            <div className="bg-terracotta/10 text-cocoa rounded-xl p-3 flex items-start gap-2">
              <WalletIcon size={18} className="text-terracotta shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                Uma carteira KONEKTA será criada automaticamente. Levantamentos disponíveis a partir de 500 Db.
              </div>
            </div>
            <CheckBox
              checked={data.contract}
              onChange={(v) => setData({ ...data, contract: v })}
              label="Aceito o contrato de prestação de serviços"
            />
          </div>
          {err && <ErrorText>{err}</ErrorText>}
          <PrimaryBtn onClick={next} disabled={!data.contract}>
            Enviar para análise
          </PrimaryBtn>
        </StepShell>
      )}
    </>
  );
}

/* ---------------- Small building blocks ---------------- */
function PhoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-foreground">Telemóvel</span>
      <div className="mt-1 flex items-stretch bg-card ring-1 ring-border rounded-xl focus-within:ring-2 focus-within:ring-terracotta/40">
        <span className="px-3 grid place-items-center text-sm text-muted-foreground border-r border-border font-medium">
          +239
        </span>
        <input
          type="tel"
          inputMode="tel"
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="991 2345"
          className="flex-1 py-3.5 px-3 bg-transparent text-base focus:outline-none"
        />
      </div>
    </label>
  );
}

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const chars = useMemo(() => Array.from({ length: 6 }, (_, i) => value[i] ?? ""), [value]);
  return (
    <div className="flex gap-2 justify-between">
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={c}
          inputMode="numeric"
          maxLength={1}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            const next = value.split("");
            next[i] = v;
            const joined = next.join("").slice(0, 6);
            onChange(joined);
            if (v && i < 5) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !chars[i] && i > 0) refs.current[i - 1]?.focus();
          }}
          className="w-12 h-14 text-center text-xl font-semibold bg-card ring-1 ring-border rounded-xl focus:outline-none focus:ring-2 focus:ring-terracotta/40"
        />
      ))}
    </div>
  );
}

function AvatarPicker({ value, onChange, required }: { value?: string; onChange: (v: string) => void; required?: boolean }) {
  const inp = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <button
        type="button"
        onClick={() => inp.current?.click()}
        className="size-24 rounded-full bg-terracotta/10 grid place-items-center overflow-hidden ring-2 ring-terracotta/20"
      >
        {value ? (
          <img src={value} alt="Avatar" className="size-full object-cover" />
        ) : (
          <Camera size={28} className="text-terracotta" />
        )}
      </button>
      <input
        ref={inp}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => onChange(r.result as string);
          r.readAsDataURL(f);
        }}
      />
      <p className="text-xs text-muted-foreground">
        {value ? "Toque para alterar" : `Adicionar fotografia${required ? "" : " (opcional)"}`}
      </p>
    </div>
  );
}

const DISTRICTS = ["Água Grande", "Mé-Zóchi", "Cantagalo", "Caué", "Lembá", "Lobata", "Príncipe"];
function DistrictPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground">Distrito</span>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {DISTRICTS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`py-2.5 rounded-xl text-xs font-medium ring-1 ${
              value === d ? "bg-terracotta text-primary-foreground ring-terracotta" : "bg-card ring-border"
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function CheckBox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 bg-card ring-1 ring-border rounded-xl p-3 text-left"
    >
      <div className={`size-5 rounded-md grid place-items-center ${checked ? "bg-terracotta text-primary-foreground" : "bg-muted"}`}>
        {checked && <Check size={14} />}
      </div>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">{children}</p>;
}
