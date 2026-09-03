import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Settings,
  HelpCircle,
  Shield,
  Bell,
  LogOut,
  Briefcase,
  UserCog,
  BadgeCheck,
  Phone,
  Mail,
  Lock,
  Moon,
  Sun,
  Smartphone,
  Check,
  Heart,
  CalendarCheck,
  Star,
  Wallet,
  ExternalLink,
  Image as ImageIcon,
  Camera,
  Plus,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, StatusPill, ListRow, BottomSheet } from "@/components/konekta/kit";
import { store, useStore } from "@/lib/store";
import { documentStateMeta } from "@/lib/states";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PortfolioManagerModal } from "@/components/konekta/PortfolioManagerModal";

type TopicType = "notificacoes" | "seguranca" | "definicoes" | null;

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Perfil · KONEKTA" },
      {
        name: "description",
        content:
          "Gerir a sua conta KONEKTA: perfil de cliente, perfil de prestador, segurança e definições.",
      },
      { property: "og:title", content: "Perfil · KONEKTA" },
      { property: "og:description", content: "Uma conta, dois perfis: Cliente e Prestador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const user = useStore((s) => s.user);
  const profiles = useStore((s) => s.profiles);
  const profile = useStore((s) => s.providerProfile);
  const orders = useStore((s) => s.orders);
  const favorites = useStore((s) => s.favorites);
  const settings = useStore((s) => s.settings);
  const balance = useStore((s) => s.balance);
  const navigate = useNavigate();

  // Selected topic modal state
  const [activeTopic, setActiveTopic] = useState<TopicType>(null);
  const [openPortfolioModal, setOpenPortfolioModal] = useState(false);

  // Email requirement modal state for notifications
  const [showEmailPromptModal, setShowEmailPromptModal] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Security Form state
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [securityPin] = useState("1234");
  const [savingPass, setSavingPass] = useState(false);

  const initial = user?.name?.charAt(0).toUpperCase() ?? "K";
  const memberYear = user ? new Date(user.createdAt).getFullYear() : new Date().getFullYear();
  const isProvider = user?.role === "prestador";
  const docState = !profile
    ? "nao_enviado"
    : profile.status === "aprovado"
      ? "verificado"
      : profile.status === "rejeitado"
        ? "rejeitado"
        : "em_analise";

  function handleSignOut() {
    store.signOut();
    toast.info("Sessão terminada. Até breve!");
    navigate({ to: "/login", replace: true });
  }

  function handleToggleEmailNotifications(checked: boolean) {
    if (checked) {
      const userEmail = user?.email?.trim();
      if (!userEmail) {
        setInputEmail("");
        setShowEmailPromptModal(true);
        return;
      }
      store.updateSettings({ emailNotifications: true });
      toast.success("Notificações por email ativadas");
    } else {
      store.updateSettings({ emailNotifications: false });
      toast.success("Notificações por email desativadas");
    }
  }

  function handleSaveNewEmail(e: React.FormEvent) {
    e.preventDefault();
    const cleanEmail = inputEmail.trim();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      toast.error("Por favor insira um endereço de email válido");
      return;
    }

    setSavingEmail(true);
    setTimeout(() => {
      store.updateUser({ email: cleanEmail });
      store.updateSettings({ emailNotifications: true });
      setSavingEmail(false);
      setShowEmailPromptModal(false);
      toast.success("Email adicionado e notificações ativadas com sucesso!");
    }, 400);
  }

  function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPass || !newPass) {
      toast.error("Preencha a senha atual e a nova senha");
      return;
    }
    if (newPass.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    setSavingPass(true);
    setTimeout(() => {
      setSavingPass(false);
      setCurrentPass("");
      setNewPass("");
      setActiveTopic(null);
      toast.success("Senha atualizada com sucesso!");
    }, 400);
  }

  return (
    <AppShell>
      {/* Header com estilo premium e sem ruído genérico */}
      <header className="flex items-center justify-between px-5 pb-3 pt-7">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">A Minha Conta</h1>
          <p className="text-xs font-medium text-muted-foreground mt-0.5">
            Gestão de dados pessoais, atividade e segurança
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveTopic("definicoes")}
          aria-label="Abrir Definições"
          className="grid size-11 place-items-center rounded-2xl bg-card border border-border text-foreground transition-all hover:bg-muted active:scale-95 shadow-2xs"
        >
          <Settings size={20} />
        </button>
      </header>

      {/* Cartão de Identidade do Utilizador */}
      <Section className="pt-1">
        <div className="rounded-[24px] bg-card p-5 border border-border/80 shadow-2xs space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative size-16 shrink-0 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-2xl font-black overflow-hidden shadow-2xs">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="size-full object-cover" />
              ) : (
                <span>{initial}</span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-base font-extrabold text-foreground tracking-tight">
                  {user?.name ?? "Utilizador KONEKTA"}
                </p>
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                {user?.phone
                  ? user.phone.startsWith("+239")
                    ? user.phone
                    : `+239 ${user.phone}`
                  : "Sem telemóvel associado"}
              </p>
              {user?.email && (
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              )}
              <p className="text-[11px] text-muted-foreground/80 mt-1 font-medium">
                Membro desde {memberYear}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/60">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              <span className="size-2 rounded-full bg-primary" />
              <span>Perfil {isProvider ? "Prestador" : "Cliente"}</span>
            </div>

            {profiles.prestador && (
              <StatusPill tone={documentStateMeta[docState].tone}>
                {documentStateMeta[docState].label}
              </StatusPill>
            )}

            <button
              type="button"
              onClick={() => {
                navigate({
                  to: "/registro",
                  search: {
                    role: isProvider ? "prestador" : "cliente",
                    edit: true,
                  },
                });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-xs font-bold text-foreground hover:bg-muted/80 transition-colors active:scale-95"
            >
              <UserCog size={13} />
              Editar dados
            </button>
          </div>
        </div>
      </Section>

      {/* Alerta de Documentos em Análise se prestador */}
      {isProvider && profile && profile.status !== "aprovado" && (
        <Section>
          <KCard className="flex items-center gap-3 bg-warning/10 border-warning/30">
            <span className="grid size-10 place-items-center rounded-xl bg-warning/20 text-warning shrink-0">
              <BadgeCheck size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-foreground">Conta em análise</p>
              <p className="text-xs text-muted-foreground">
                Poderá receber pedidos após a aprovação dos documentos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => store.approveProviderProfile()}
              className="press shrink-0 rounded-full bg-primary px-3 py-2 text-[11px] font-bold text-primary-foreground"
            >
              Simular aprovação
            </button>
          </KCard>
        </Section>
      )}

      {/* Painel de Acesso Rápido Funcional com Fluxos Reais */}
      <Section title="Atividade & Atalhos">
        <div className="grid grid-cols-3 gap-2.5">
          {/* Card 1: Pedidos com Link Direto */}
          <Link
            to={isProvider ? "/pro/pedidos" : "/pedidos"}
            className="group rounded-2xl bg-card p-3.5 text-center border border-border/80 shadow-2xs hover:border-primary/40 hover:bg-muted/30 transition-all active:scale-95 flex flex-col items-center justify-center"
          >
            <div className="size-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <CalendarCheck size={18} />
            </div>
            <p className="text-base font-black text-foreground">{orders.length}</p>
            <p className="text-[11px] font-bold text-muted-foreground">Pedidos</p>
          </Link>

          {/* Card 2: Favoritos com Link Direto */}
          <Link
            to="/favoritos"
            className="group rounded-2xl bg-card p-3.5 text-center border border-border/80 shadow-2xs hover:border-primary/40 hover:bg-muted/30 transition-all active:scale-95 flex flex-col items-center justify-center"
          >
            <div className="size-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Heart size={18} />
            </div>
            <p className="text-base font-black text-foreground">{favorites.length}</p>
            <p className="text-[11px] font-bold text-muted-foreground">Favoritos</p>
          </Link>

          {/* Card 3: Carteira / Saldo */}
          <Link
            to="/carteira"
            className="group rounded-2xl bg-card p-3.5 text-center border border-border/80 shadow-2xs hover:border-primary/40 hover:bg-muted/30 transition-all active:scale-95 flex flex-col items-center justify-center"
          >
            <div className="size-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
              <Wallet size={18} />
            </div>
            <p className="text-base font-black text-foreground">{balance} Db</p>
            <p className="text-[11px] font-bold text-muted-foreground">Carteira</p>
          </Link>
        </div>
      </Section>

      {/* Secção de Portfólio & Fotos de Serviços para Prestadores */}
      {profiles.prestador && (
        <Section
          title="Portfólio de Serviços"
          action={
            <button
              type="button"
              onClick={() => setOpenPortfolioModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
            >
              <Plus size={14} />
              Adicionar Foto
            </button>
          }
        >
          <div className="rounded-2xl bg-card border border-border/80 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="size-8 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <ImageIcon size={16} />
                </span>
                <div>
                  <p className="text-xs font-bold text-foreground">Galeria de Trabalhos</p>
                  <p className="text-[11px] text-muted-foreground">
                    Fotos visíveis na sua página pública
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                {(profile?.portfolio ?? []).length}{" "}
                {(profile?.portfolio ?? []).length === 1 ? "foto" : "fotos"}
              </span>
            </div>

            {/* Grid de Pré-visualização das fotos */}
            {(profile?.portfolio ?? []).length === 0 ? (
              <div
                onClick={() => setOpenPortfolioModal(true)}
                className="p-5 rounded-xl border border-dashed border-border/80 bg-muted/20 text-center cursor-pointer hover:border-primary transition space-y-2"
              >
                <div className="size-10 rounded-xl bg-primary/10 text-primary mx-auto grid place-items-center">
                  <Camera size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Ainda não adicionou fotos de serviços
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Adicione fotos dos seus trabalhos para atrair mais clientes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenPortfolioModal(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-2xs"
                >
                  <Plus size={13} />
                  Adicionar Fotos Agora
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="grid grid-cols-3 gap-2">
                  {(profile?.portfolio ?? []).slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setOpenPortfolioModal(true)}
                      className="group relative rounded-xl overflow-hidden aspect-square bg-muted cursor-pointer border border-border/60"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="size-full object-cover group-hover:scale-105 transition duration-200"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageIcon size={16} className="text-white" />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setOpenPortfolioModal(true)}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <Layers size={13} />
                    Gerir todas as {(profile?.portfolio ?? []).length} fotos
                  </button>

                  <Link
                    to="/prestador/$id"
                    params={{ id: "edmilson-varela" }}
                    className="text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                  >
                    Ver perfil público
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Secção de Conta e Serviços */}
      <Section title="Gestão da Conta" className="space-y-2 pb-12">
        {/* Banner para Ativar Perfil Prestador */}
        {!profiles.prestador && (
          <Link
            to="/registro"
            className="press flex min-h-14 w-full items-center gap-3 rounded-2xl bg-primary p-4 text-primary-foreground shadow-soft transition-all hover:opacity-95"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary-foreground/15">
              <Briefcase size={18} />
            </span>
            <span className="min-w-0 flex-1 text-left">
              <span className="block text-sm font-bold">Quero prestar serviços</span>
              <span className="block text-xs opacity-80">
                Ative o perfil profissional na mesma conta
              </span>
            </span>
            <ChevronRight size={18} />
          </Link>
        )}

        {/* Link para Painel Profissional se prestador */}
        {profiles.prestador && (
          <>
            <ListRow
              to="/pro"
              icon={<Briefcase size={18} className="text-primary" />}
              title="Painel do Profissional"
              subtitle={profile?.category ?? "Gerir serviços, tarifas e agenda"}
              right={<ChevronRight size={16} className="text-muted-foreground" />}
            />
            <button
              type="button"
              onClick={() => setOpenPortfolioModal(true)}
              className="press flex min-h-14 w-full items-center gap-3 rounded-2xl bg-card p-4 text-left border border-border/70 shadow-2xs transition hover:bg-muted/40"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <ImageIcon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-foreground">
                  Fotos & Portfólio de Serviços
                </span>
                <span className="block text-xs text-muted-foreground">
                  {(profile?.portfolio ?? []).length}{" "}
                  {(profile?.portfolio ?? []).length === 1 ? "foto publicada" : "fotos publicadas"}{" "}
                  no perfil
                </span>
              </span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </>
        )}

        {/* Tópico: Favoritos (Acesso direto em lista) */}
        <ListRow
          to="/favoritos"
          icon={<Heart size={18} className="text-rose-500" />}
          title="Prestadores Favoritos"
          subtitle={`${favorites.length} profissional(is) guardado(s)`}
          right={<ChevronRight size={16} className="text-muted-foreground" />}
        />

        {/* Tópico: Notificações */}
        <button
          type="button"
          onClick={() => setActiveTopic("notificacoes")}
          className="press flex min-h-14 w-full items-center gap-3 rounded-2xl bg-card p-4 text-left border border-border/70 shadow-2xs transition hover:bg-muted/40"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
            <Bell size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-foreground">Notificações e Alertas</span>
            <span className="block text-xs text-muted-foreground">Push, email e preferências</span>
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* Tópico: Segurança e privacidade */}
        <button
          type="button"
          onClick={() => setActiveTopic("seguranca")}
          className="press flex min-h-14 w-full items-center gap-3 rounded-2xl bg-card p-4 text-left border border-border/70 shadow-2xs transition hover:bg-muted/40"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
            <Shield size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-foreground">
              Segurança e Palavra-passe
            </span>
            <span className="block text-xs text-muted-foreground">
              Alterar senha, PIN de segurança e sessões
            </span>
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* Tópico: Definições Gerais */}
        <button
          type="button"
          onClick={() => setActiveTopic("definicoes")}
          className="press flex min-h-14 w-full items-center gap-3 rounded-2xl bg-card p-4 text-left border border-border/70 shadow-2xs transition hover:bg-muted/40"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
            <Settings size={18} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-foreground">Definições da Aplicação</span>
            <span className="block text-xs text-muted-foreground">Modo escuro, idioma e moeda</span>
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>

        {/* Tópico: Ajuda e Suporte */}
        <ListRow
          to="/ajuda"
          icon={<HelpCircle size={18} className="text-amber-500" />}
          title="Ajuda e Suporte KONEKTA"
          subtitle="Perguntas frequentes e apoio ao cliente"
          right={<ChevronRight size={16} className="text-muted-foreground" />}
        />

        {/* Botão Sair */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSignOut}
            className="press flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-destructive/10 p-3.5 text-center font-bold text-destructive hover:bg-destructive/20 transition active:scale-98"
          >
            <LogOut size={17} />
            <span className="text-xs font-extrabold">Terminar sessão na conta</span>
          </button>
        </div>
      </Section>

      {/* INTELLIGENT DRAWER 1: NOTIFICAÇÕES */}
      <BottomSheet
        open={activeTopic === "notificacoes"}
        onClose={() => setActiveTopic(null)}
        title="Notificações"
        description="Controle os alertas e mensagens que recebe do KONEKTA."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-card p-3.5 border border-border">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Bell size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Notificações Push</p>
                <p className="text-xs text-muted-foreground">
                  Alertas de pedidos e respostas instantâneas
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) => {
                  store.updateSettings({ pushNotifications: e.target.checked });
                  toast.success(
                    e.target.checked
                      ? "Notificações push ativadas"
                      : "Notificações push desativadas",
                  );
                }}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-card p-3.5 border border-border">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                <Mail size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Notificações por Email</p>
                <p className="text-xs text-muted-foreground">
                  {user?.email ? user.email : "Recibos e sumários (requer email na conta)"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={Boolean(user?.email && settings.emailNotifications)}
                onChange={(e) => handleToggleEmailNotifications(e.target.checked)}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-card p-3.5 border border-border">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <Phone size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Alertas por SMS</p>
                <p className="text-xs text-muted-foreground">
                  Confirmação de novos serviços via SMS
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={settings.smsAlerts}
                onChange={(e) => {
                  store.updateSettings({ smsAlerts: e.target.checked });
                  toast.success(
                    e.target.checked ? "SMS de alerta ativados" : "SMS de alerta desativados",
                  );
                }}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
            </label>
          </div>

          <Link
            to="/notificacoes"
            onClick={() => setActiveTopic(null)}
            className="flex items-center justify-between rounded-2xl bg-primary/5 hover:bg-primary/10 border border-primary/20 p-3.5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Bell size={18} />
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Ver Notificações</p>
                <p className="text-xs text-muted-foreground">
                  Consultar histórico de mensagens e alertas recebidos
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </Link>

          <button
            type="button"
            onClick={() => setActiveTopic(null)}
            className="press w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground mt-2"
          >
            Concluir
          </button>
        </div>
      </BottomSheet>

      {/* INTELLIGENT DRAWER 2: SEGURANÇA E PRIVACIDADE */}
      <BottomSheet
        open={activeTopic === "seguranca"}
        onClose={() => setActiveTopic(null)}
        title="Segurança e privacidade"
        description="Altere a sua palavra-passe, configure PIN e proteja a sua conta."
      >
        <form onSubmit={handleSavePassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Palavra-passe atual
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-muted-foreground">
              Nova palavra-passe
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type="password"
                required
                minLength={6}
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-muted/40 p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-foreground">PIN de Segurança</p>
                <p className="text-[11px] text-muted-foreground">
                  PIN de 4 dígitos para confirmações rápidas
                </p>
              </div>
              <span className="rounded-md bg-card px-2.5 py-1 text-xs font-mono font-bold tracking-widest text-primary border border-border">
                {securityPin}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3.5">
            <div className="flex items-center gap-3">
              <Smartphone size={18} className="text-primary shrink-0" />
              <div>
                <p className="text-xs font-bold text-foreground">Dispositivo Atual</p>
                <p className="text-[11px] text-muted-foreground">
                  Sessão iniciada em São Tomé · Ativo agora
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setActiveTopic(null)}
              className="press flex-1 rounded-xl bg-accent py-3 text-xs font-bold text-accent-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingPass}
              className="press flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground"
            >
              {savingPass ? "A atualizar..." : "Atualizar senha"}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* INTELLIGENT DRAWER 3: DEFINIÇÕES DA APLICAÇÃO */}
      <BottomSheet
        open={activeTopic === "definicoes"}
        onClose={() => setActiveTopic(null)}
        title="Definições da Aplicação"
        description="Geral, tema visual e preferências da plataforma."
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-card p-3.5 border border-border">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                {settings.darkMode || settings.theme === "dark" ? (
                  <Moon size={18} />
                ) : (
                  <Sun size={18} />
                )}
              </span>
              <div>
                <p className="text-sm font-bold text-foreground">Modo Escuro</p>
                <p className="text-xs text-muted-foreground">
                  {settings.darkMode || settings.theme === "dark"
                    ? "Tema escuro ativo"
                    : "Tema claro padrão"}
                </p>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={Boolean(settings.darkMode || settings.theme === "dark")}
                onChange={(e) => {
                  store.updateSettings({
                    darkMode: e.target.checked,
                    theme: e.target.checked ? "dark" : "light",
                  });
                  toast.success(e.target.checked ? "Modo escuro ativado" : "Modo claro ativado");
                }}
                className="peer sr-only"
              />
              <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
            </label>
          </div>

          <div className="rounded-2xl bg-card p-3.5 border border-border space-y-1">
            <p className="text-xs font-bold text-foreground">Idioma da plataforma</p>
            <p className="text-xs text-muted-foreground">Português (São Tomé e Príncipe)</p>
          </div>

          <div className="rounded-2xl bg-card p-3.5 border border-border space-y-1">
            <p className="text-xs font-bold text-foreground">Moeda padrão</p>
            <p className="text-xs text-muted-foreground">Dobra são-tomense (STN - Db)</p>
          </div>

          <div className="rounded-2xl bg-card p-3.5 border border-border space-y-1">
            <p className="text-xs font-bold text-foreground">Fuso Horário Operacional</p>
            <p className="text-xs text-muted-foreground">GMT / UTC+0 (África/São Tomé)</p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTopic(null);
              toast.success("Definições guardadas");
            }}
            className="press w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground mt-2"
          >
            Concluir
          </button>
        </div>
      </BottomSheet>

      {/* MODAL / BOTTOMSHEET: PEDIR EMAIL CASO O UTILIZADOR QUEIRA NOTIFICAÇÕES POR EMAIL */}
      <BottomSheet
        open={showEmailPromptModal}
        onClose={() => setShowEmailPromptModal(false)}
        title="Adicionar Email"
        description="Para receber notificações por email, introduza o seu endereço de correio eletrónico."
      >
        <form onSubmit={handleSaveNewEmail} className="space-y-4">
          <div className="rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 p-3.5 border border-indigo-100 dark:border-indigo-900/40 flex items-start gap-3">
            <span className="grid size-8 place-items-center rounded-xl bg-indigo-600 text-white shrink-0 mt-0.5">
              <Mail size={16} />
            </span>
            <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed">
              Não indicou nenhum endereço de email durante o registo. Adicione o seu email para
              ativar recibos, confirmações e resumos de atividades.
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-foreground">
              O seu endereço de Email
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
              <input
                type="email"
                required
                autoFocus
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full rounded-xl border border-input bg-card py-2.5 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                placeholder="exemplo@gmail.com"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowEmailPromptModal(false)}
              className="press flex-1 rounded-xl bg-accent py-3 text-xs font-bold text-accent-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingEmail}
              className="press flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground disabled:opacity-60"
            >
              {savingEmail ? "A guardar..." : "Guardar e Ativar"}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* MODAL / DRAWER: GESTÃO DO PORTFÓLIO DE SERVIÇOS */}
      <PortfolioManagerModal
        open={openPortfolioModal}
        onClose={() => setOpenPortfolioModal(false)}
      />
    </AppShell>
  );
}
