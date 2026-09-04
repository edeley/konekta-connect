import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  Smartphone,
  Star,
  ArrowRight,
  Award,
  Wallet,
  Users,
  Clock,
  MapPin,
  Upload,
  Check,
  ChevronRight,
  HelpCircle,
  Phone,
  Banknote,
  Wrench,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStore, store } from "@/lib/store";
import { CATEGORIES_DATA } from "@/lib/catalog";
import { STP_DISTRICTS } from "@/lib/konekta-data";
import { SmsOtpVerificationModal } from "@/components/konekta/SmsOtpVerificationModal";
import { toast } from "sonner";

export const Route = createFileRoute("/tornar-prestador")({
  head: () => ({
    meta: [
      { title: "Seja um Prestador KONEKTA PRO em São Tomé e Príncipe" },
      {
        name: "description",
        content:
          "Ganhe dinheiro prestando serviços em São Tomé e Príncipe. Receba pedidos semanais, pagamentos garantidos e valorização profissional.",
      },
      { property: "og:title", content: "Seja um Prestador KONEKTA PRO" },
      {
        property: "og:description",
        content: "Trabalhos semanais, pagamentos protegidos por Dobra 24 e bancos locais.",
      },
    ],
  }),
  component: TornarPrestadorPage,
});

const EARNINGS_CALCULATOR_DATA: Record<
  string,
  { avgPrice: number; weeklyJobs: number; title: string }
> = {
  eletricidade: { avgPrice: 450, weeklyJobs: 6, title: "Eletricista" },
  canalizacao: { avgPrice: 400, weeklyJobs: 7, title: "Canalizador" },
  climatizacao: { avgPrice: 650, weeklyJobs: 4, title: "Técnico de Ar Condicionado" },
  construcao: { avgPrice: 700, weeklyJobs: 5, title: "Pedreiro / Obras" },
  pintura: { avgPrice: 550, weeklyJobs: 4, title: "Pintor Profissional" },
  limpeza: { avgPrice: 350, weeklyJobs: 6, title: "Limpeza & Diarista" },
};

function TornarPrestadorPage() {
  const user = useStore((s) => s.user);
  const navigate = useNavigate();

  // Wizard Steps: 1 = Informações, 2 = Documentos & BI, 3 = Distritos & Conclusão
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form states
  const [selectedProfCategory, setSelectedProfCategory] = useState("eletricidade");
  const [fullName, setFullName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "+239 99");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [experienceYears, setExperienceYears] = useState("3");
  const [bio, setBio] = useState("");
  const [biNumber, setBiNumber] = useState("");
  const [hasBiUploaded, setHasBiUploaded] = useState(false);
  const [hasWorkPhotoUploaded, setHasWorkPhotoUploaded] = useState(false);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(["Água Grande", "Mé-Zóchi"]);
  const [payoutMethod, setPayoutMethod] = useState<"dobra24" | "bistp">("dobra24");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculator estimates
  const calcData =
    EARNINGS_CALCULATOR_DATA[selectedProfCategory] || EARNINGS_CALCULATOR_DATA.eletricidade;
  const estimatedMonthly = calcData.avgPrice * calcData.weeklyJobs * 4;

  const toggleDistrict = (d: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(d) ? prev.filter((item) => item !== d) : [...prev, d],
    );
  };

  const handleFinishOnboarding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phone.trim() || !biNumber.trim()) {
      toast.error("Por favor preencha todos os campos obrigatórios (Nome, Telefone e BI STP).");
      return;
    }
    if (selectedDistricts.length === 0) {
      toast.error("Selecione pelo menos um distrito de atendimento em STP.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      // Create or update local user to PRO
      if (user) {
        store.setUser({
          ...user,
          role: "prestador",
          name: fullName,
          phone: phone,
          district: selectedDistricts[0],
        });
      } else {
        store.setUser({
          id: `pro_${Date.now()}`,
          name: fullName,
          phone: phone,
          email: `${fullName.toLowerCase().replace(/\s+/g, ".")}@konekta.st`,
          role: "prestador",
          district: selectedDistricts[0],
          isVerified: true,
          createdAt: Date.now(),
          walletBalance: 250,
          rating: 5.0,
          completedJobs: 0,
          createdAt: Date.now(),
        });
      }

      setIsSubmitting(false);
      toast.success("Candidatura KONEKTA PRO aprovada com sucesso!", {
        description: "O seu perfil já está ativo e pronto para receber pedidos em São Tomé.",
      });
      navigate({ to: "/pro/agenda" });
    }, 900);
  };

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-6">
        {/* Banner Superior Estilo Triider PRO */}
        <div className="bg-gradient-to-br from-primary via-emerald-800 to-teal-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-md">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold tracking-wide uppercase mb-3">
            <Award size={13} className="text-amber-300" />
            <span>KONEKTA PRO · São Tomé e Príncipe</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Receba mais clientes e ganhe em Dobras (STN)
          </h1>
          <p className="text-white/85 text-xs sm:text-sm mt-2 max-w-lg leading-relaxed">
            Faça parte da maior rede de prestadores qualificados em STP. Receba pedidos no seu
            telemóvel, receba por Dobra 24 ou BISTP com garantia de pagamento.
          </p>

          {/* Métricas de Confiança */}
          <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-white/15">
            <div className="text-center">
              <span className="block text-lg sm:text-xl font-black text-amber-300">0 STN</span>
              <span className="text-[10px] text-white/75 font-medium">Inscrição Gratuita</span>
            </div>
            <div className="text-center border-x border-white/15">
              <span className="block text-lg sm:text-xl font-black text-amber-300">100%</span>
              <span className="text-[10px] text-white/75 font-medium">Pagamento Seguro</span>
            </div>
            <div className="text-center">
              <span className="block text-lg sm:text-xl font-black text-amber-300">Dobra 24</span>
              <span className="text-[10px] text-white/75 font-medium">Receba no telemóvel</span>
            </div>
          </div>
        </div>

        {/* Simulador de Rendimentos em STP */}
        <section className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <Banknote size={16} className="text-primary" />
                Simulador de Ganhos em São Tomé
              </h2>
              <p className="text-xs text-muted-foreground">
                Quanto pode faturar prestando serviços na plataforma:
              </p>
            </div>
            <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-1 rounded-full">
              Estimativa Média
            </span>
          </div>

          {/* Selecionador de Categoria para Cálculo */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {Object.entries(EARNINGS_CALCULATOR_DATA).map(([catKey, data]) => {
              const active = selectedProfCategory === catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  onClick={() => setSelectedProfCategory(catKey)}
                  className={`p-2 rounded-2xl border text-center transition-all ${
                    active
                      ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                      : "border-border bg-card text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <span className="block text-[11px] truncate">{data.title.split(" ")[0]}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-muted/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border border-border/80">
            <div>
              <span className="text-xs text-muted-foreground font-medium">
                Potencial Mensal ({calcData.weeklyJobs} serviços/sem):
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-primary">
                  {estimatedMonthly.toLocaleString("pt-PT")}
                </span>
                <span className="text-sm font-bold text-foreground">STN / mês</span>
              </div>
            </div>
            <div className="text-right text-[11px] text-muted-foreground">
              <span className="block">Média por serviço: ~{calcData.avgPrice} STN</span>
              <span className="text-emerald-700 font-semibold">✓ Recebimento sem atrasos</span>
            </div>
          </div>
        </section>

        {/* Wizard de Registo Rápido */}
        <section className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-5">
          {/* Steps Indicator */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            {[
              { num: 1, label: "Especialidade" },
              { num: 2, label: "Documentos STP" },
              { num: 3, label: "Distritos & Ativação" },
            ].map((s) => (
              <div
                key={s.num}
                className={`flex items-center gap-2 ${
                  step === s.num
                    ? "text-primary font-bold"
                    : step > s.num
                      ? "text-emerald-700 font-semibold"
                      : "text-muted-foreground"
                }`}
              >
                <div
                  className={`size-7 rounded-full grid place-items-center text-xs font-black ${
                    step === s.num
                      ? "bg-primary text-white"
                      : step > s.num
                        ? "bg-emerald-600 text-white"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > s.num ? <Check size={13} /> : s.num}
                </div>
                <span className="text-xs hidden sm:inline">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Passo 1: Informações Profissionais */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Nome Completo (como consta no Bilhete de Identidade) *
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Manuel da Conceição Espírito Santo"
                  className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Contacto Telefónico (CST / Unitel STP) *
                    </label>
                    {isPhoneVerified ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={11} /> Verificado por SMS
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (phone.length < 7) {
                            toast.error("Insira o seu número STP antes de validar.");
                            return;
                          }
                          setOtpModalOpen(true);
                        }}
                        className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Smartphone size={11} /> Validar por SMS
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setIsPhoneVerified(false);
                      }}
                      placeholder="+239 990 0000"
                      className={`w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 ${
                        isPhoneVerified
                          ? "ring-1 ring-emerald-500/50 bg-emerald-50/20"
                          : "focus:ring-primary/20"
                      }`}
                      required
                    />
                    {!isPhoneVerified && (
                      <button
                        type="button"
                        onClick={() => {
                          if (phone.length < 7) {
                            toast.error("Insira o seu número STP antes de validar.");
                            return;
                          }
                          setOtpModalOpen(true);
                        }}
                        className="absolute right-2 top-2 px-2 py-1.5 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition cursor-pointer"
                      >
                        Enviar SMS
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground block mb-1.5">
                    Anos de Experiência Prática *
                  </label>
                  <select
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="1">Menos de 1 ano</option>
                    <option value="2">1 a 2 anos</option>
                    <option value="3">3 a 5 anos</option>
                    <option value="5">Mais de 5 anos (Mestre)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Área Principal de Atuação *
                </label>
                <select
                  value={selectedProfCategory}
                  onChange={(e) => setSelectedProfCategory(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="eletricidade">⚡ Eletricista e Instalações Elétricas</option>
                  <option value="canalizacao">🚰 Canalização, Fugas e Bombas d'Água</option>
                  <option value="climatizacao">❄️ Ar Condicionado e Refrigeração</option>
                  <option value="construcao">🧱 Construção Civil, Pedreiro e Alvenaria</option>
                  <option value="pintura">🎨 Pintura e Acabamentos</option>
                  <option value="limpeza">🧹 Limpeza Residencial e Comercial</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Breve Apresentação para os Clientes
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Ex: Trabalho há 8 anos na área de climatização em São Tomé. Faço instalações limpas, recargas de gás e manutenções preventivas com garantia..."
                  className="w-full p-3 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!fullName.trim() || !phone.trim()) {
                    toast.error("Preencha o nome e telefone antes de avançar.");
                    return;
                  }
                  setStep(2);
                }}
                className="w-full h-12 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
              >
                <span>Avançar para Documentos</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Passo 2: Verificação e Documentos STP */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                <ShieldCheck size={18} className="shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <span className="font-bold block">Por que pedimos o BI?</span>
                  <span className="text-[11px] leading-relaxed text-muted-foreground">
                    Para garantir que 100% dos clientes em São Tomé confiem no seu perfil. Os
                    profissionais verificados recebem até 4x mais pedidos no KONEKTA.
                  </span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Número do Bilhete de Identidade (BI STP) *
                </label>
                <input
                  type="text"
                  value={biNumber}
                  onChange={(e) => setBiNumber(e.target.value)}
                  placeholder="Ex: 012345/STP/2018"
                  className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  required
                />
              </div>

              {/* Upload Simulado de BI */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Foto do BI (Frente e Verso)
                </label>
                <div
                  onClick={() => {
                    setHasBiUploaded(true);
                    toast.success("Foto do BI carregada com sucesso!");
                  }}
                  className={`p-4 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                    hasBiUploaded
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                      : "border-border hover:border-primary/50 bg-muted/40"
                  }`}
                >
                  <Upload size={22} className="mx-auto mb-1 opacity-70" />
                  <span className="text-xs font-bold block">
                    {hasBiUploaded
                      ? "✓ Foto do BI Anexada (Validada)"
                      : "Clique para anexar foto do BI"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">JPG, PNG ou PDF até 5MB</span>
                </div>
              </div>

              {/* Fotos de Trabalhos Anteriores */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">
                  Foto de Trabalho Realizado (Opcional mas recomendado)
                </label>
                <div
                  onClick={() => {
                    setHasWorkPhotoUploaded(true);
                    toast.success("Foto do trabalho adicionada ao portfólio!");
                  }}
                  className={`p-4 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-colors ${
                    hasWorkPhotoUploaded
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-700"
                      : "border-border hover:border-primary/50 bg-muted/40"
                  }`}
                >
                  <Wrench size={22} className="mx-auto mb-1 opacity-70" />
                  <span className="text-xs font-bold block">
                    {hasWorkPhotoUploaded
                      ? "✓ Foto de Trabalho Anexada"
                      : "Clique para enviar foto de serviço anterior"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Mostre a qualidade do seu acabamento aos clientes
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 h-12 bg-muted text-foreground font-bold text-xs rounded-xl"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!biNumber.trim()) {
                      toast.error("Insira o número do seu BI STP.");
                      return;
                    }
                    setStep(3);
                  }}
                  className="flex-2 h-12 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-1.5"
                >
                  <span>Avançar para Distritos</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Passo 3: Distritos de Atendimento & Pagamento */}
          {step === 3 && (
            <form onSubmit={handleFinishOnboarding} className="space-y-4 animate-in fade-in">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1.5">
                  Distritos onde pode prestar serviços em STP *
                </label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  Selecione onde tem disponibilidade para se deslocar:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STP_DISTRICTS.map((district) => {
                    const isSelected = selectedDistricts.includes(district);
                    return (
                      <button
                        key={district}
                        type="button"
                        onClick={() => toggleDistrict(district)}
                        className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border bg-card text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="truncate">{district}</span>
                        {isSelected && <Check size={14} className="shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Forma de Recebimento de Ganhos */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-foreground block">
                  Como prefere receber os seus ganhos em São Tomé? *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutMethod("dobra24")}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                      payoutMethod === "dobra24"
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <Smartphone size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block">Dobra 24 Móvel</span>
                      <span className="text-[10px] text-muted-foreground">Sem conta bancária</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutMethod("bistp")}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                      payoutMethod === "bistp"
                        ? "border-primary bg-primary/10 text-primary font-bold"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    <Building2 size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold block">BISTP / BGFI</span>
                      <span className="text-[10px] text-muted-foreground">Transferência NIB</span>
                    </div>
                  </button>
                </div>

                <input
                  type="text"
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder={
                    payoutMethod === "dobra24"
                      ? "Número Dobra 24 (Ex: 990 0000)"
                      : "NIB ou Número de Conta BISTP/BGFI"
                  }
                  className="w-full h-11 px-3.5 rounded-xl bg-muted text-xs font-medium text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Termos de Compromisso KONEKTA PRO */}
              <div className="p-3.5 rounded-2xl bg-muted/70 border border-border text-[11px] text-muted-foreground space-y-1.5">
                <span className="font-bold text-foreground block">
                  Compromisso KONEKTA com o Prestador:
                </span>
                <p>✓ Garantia de pagamento no encerramento de cada serviço via PIN do cliente.</p>
                <p>✓ Apoio ao cliente local em São Tomé via WhatsApp Oficial (+239 994 4747).</p>
                <p>✓ Liberdade total para aceitar os pedidos que se encaixem na sua agenda.</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 h-12 bg-muted text-foreground font-bold text-xs rounded-xl"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-2 h-12 bg-primary text-primary-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>A registar perfil PRO...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Concluir e Ativar Conta PRO</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* Perguntas Frequentes dos Prestadores em STP */}
        <section className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Dúvidas Frequentes sobre a KONEKTA PRO
          </h2>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
              <p className="font-bold text-foreground">Quanto custa fazer o registo?</p>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                O registo é 100% gratuito. A KONEKTA apenas retém uma pequena comissão de 10% quando
                o serviço for executado com sucesso e o cliente libertar o pagamento.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
              <p className="font-bold text-foreground">
                Como recebo o dinheiro se não tiver conta no BISTP?
              </p>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                Pode receber diretamente no telemóvel através da carteira <strong>Dobra 24</strong>{" "}
                ou levantar junto dos agentes credenciados no seu distrito.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
              <p className="font-bold text-foreground">Como funciona a garantia de 30 dias?</p>
              <p className="text-muted-foreground mt-0.5 text-[11px] leading-relaxed">
                A garantia cobre correções de mão de obra para dar total tranquilidade aos clientes.
                Bons técnicos com boa reputação ganham o selo de Mestre e têm prioridade de pedidos.
              </p>
            </div>
          </div>
        </section>

        {/* Modal de Validação por SMS OTP */}
        <SmsOtpVerificationModal
          open={otpModalOpen}
          onClose={() => setOtpModalOpen(false)}
          phone={phone}
          title="Validar Contacto Telefónico"
          reason="Autenticação segura de prestador de serviços KONEKTA PRO"
          onVerified={() => {
            setIsPhoneVerified(true);
            toast.success("Telemóvel verificado com sucesso por SMS OTP!");
          }}
        />
      </div>
    </AppShell>
  );
}
