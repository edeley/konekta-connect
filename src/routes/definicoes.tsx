import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Lock,
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Briefcase,
  Check,
  Globe,
  HelpCircle,
  FileText,
  Smartphone,
  Sparkles,
  Camera,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Section, KCard, BottomSheet } from "@/components/konekta/kit";
import { ProfileSwitcher } from "@/components/konekta/ProfileSwitcher";
import { store, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/definicoes")({
  head: () => ({
    meta: [
      { title: "Definições · KONEKTA" },
      {
        name: "description",
        content: "Gerir conta, perfis, segurança, notificações e preferências da aplicação.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const user = useStore((s) => s.user);
  const profiles = useStore((s) => s.profiles);
  const settings = useStore((s) => s.settings);
  const platformConfig = useStore((s) => s.config);

  // Modals state
  const [editUserModal, setEditUserModal] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [securityModal, setSecurityModal] = useState(false);
  const [showEmailPromptModal, setShowEmailPromptModal] = useState(false);
  const [inputEmail, setInputEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);

  // Form states for editing profile
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [district, setDistrict] = useState(user?.district ?? "Água Grande");
  const [saving, setSaving] = useState(false);

  // Form state for password/PIN update
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor insira o seu nome");
      return;
    }
    setSaving(true);
    setTimeout(() => {
      store.updateUser({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        district: district.trim(),
      });
      setSaving(false);
      setEditUserModal(false);
      toast.success("Dados do perfil atualizados com sucesso!");
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
      setSecurityModal(false);
      setCurrentPass("");
      setNewPass("");
      toast.success("Senha atualizada com sucesso!");
    }, 500);
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

  function handleSignOut() {
    store.signOut();
    toast.info("Sessão terminada. Até breve!");
    navigate({ to: "/login", replace: true });
  }

  const initial = user?.name?.charAt(0).toUpperCase() ?? "K";
  const activeRoleLabel = user?.role === "prestador" ? "Prestador" : "Cliente";

  return (
    <AppShell>
      {/* Top Header with Back button */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border/80 bg-card/95 px-5 py-4 backdrop-blur-md">
        <button
          type="button"
          onClick={() => navigate({ to: "/perfil" })}
          className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground transition hover:bg-accent/80"
          aria-label="Voltar ao Perfil"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-bold tracking-tight">Definições e Perfil</h1>
          <p className="text-xs text-muted-foreground">Gerir a sua conta e preferências</p>
        </div>
      </header>

      <div className="p-5 space-y-6">
        {/* User Card Summary */}
        <KCard className="flex items-center gap-4 bg-gradient-to-br from-card to-accent/20">
          <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-primary text-xl font-bold text-primary-foreground">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="size-full object-cover" />
            ) : (
              initial
            )}
            <button
              type="button"
              onClick={() => setEditUserModal(true)}
              className="absolute inset-0 grid place-items-center bg-black/30 opacity-0 transition hover:opacity-100 text-white"
              aria-label="Alterar foto"
            >
              <Camera size={18} />
            </button>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-base font-bold text-foreground">
                {user?.name ?? "Utilizador KONEKTA"}
              </p>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                {activeRoleLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">+239 {user?.phone ?? ""}</p>
            {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
          </div>
          <button
            type="button"
            onClick={() => {
              setName(user?.name ?? "");
              setPhone(user?.phone ?? "");
              setEmail(user?.email ?? "");
              setDistrict(user?.district ?? "Água Grande");
              setEditUserModal(true);
            }}
            className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-primary hover:bg-accent transition"
          >
            Editar
          </button>
        </KCard>

        {/* Mudar de Perfil Section */}
        <Section title="Mudar de Perfil (Mesma Conta)">
          <div className="rounded-3xl border border-border/80 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Perfil Ativo Atualmente</p>
                <p className="text-sm font-bold text-foreground">
                  {user?.role === "prestador" ? "Perfil de Prestador" : "Perfil de Cliente"}
                </p>
              </div>
              <ProfileSwitcher />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Pode alternar entre pedir serviços e prestar serviços a qualquer momento. A sua sessão
              mantém-se sempre ativa.
            </p>

            {!profiles.prestador && (
              <Link
                to="/registro"
                className="flex items-center justify-between rounded-2xl bg-primary/10 p-3.5 text-xs font-bold text-primary hover:bg-primary/20 transition"
              >
                <div className="flex items-center gap-2">
                  <Briefcase size={16} />
                  <span>Quero ser Prestador de Serviços</span>
                </div>
                <ChevronRight size={16} />
              </Link>
            )}
          </div>
        </Section>

        {/* Conta & Perfil */}
        <Section title="Conta & Dados Pessoais">
          <div className="rounded-3xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden">
            <button
              type="button"
              onClick={() => {
                setName(user?.name ?? "");
                setPhone(user?.phone ?? "");
                setEmail(user?.email ?? "");
                setDistrict(user?.district ?? "Água Grande");
                setEditUserModal(true);
              }}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/40 transition"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400">
                  <User size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Informações Pessoais</p>
                  <p className="text-xs text-muted-foreground">
                    Nome, e-mail, telefone e localização
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>

            <button
              type="button"
              onClick={() => setSecurityModal(true)}
              className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/40 transition"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                  <Lock size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Palavra-passe & Segurança</p>
                  <p className="text-xs text-muted-foreground">Alterar senha, PIN e dispositivos</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          </div>
        </Section>

        {/* Preferências e Notificações */}
        <Section title="Notificações & Preferências">
          <div className="rounded-3xl border border-border/80 bg-card p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <Bell size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Notificações Push</p>
                  <p className="text-xs text-muted-foreground">
                    Alertas de novos pedidos e mensagens
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
                      e.target.checked ? "Notificações ativadas" : "Notificações desativadas",
                    );
                  }}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
                  <Mail size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Notificações por Email</p>
                  <p className="text-xs text-muted-foreground">
                    {user?.email ? user.email : "Resumos e recibos (requer email na conta)"}
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
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-border/60 pt-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                  {settings.darkMode ? <Moon size={18} /> : <Sun size={18} />}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Modo Escuro</p>
                  <p className="text-xs text-muted-foreground">Aparência visual do aplicativo</p>
                </div>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings.darkMode}
                  onChange={(e) => {
                    store.updateSettings({ darkMode: e.target.checked });
                    if (e.target.checked) {
                      document.documentElement.classList.add("dark");
                    } else {
                      document.documentElement.classList.remove("dark");
                    }
                    toast.success(e.target.checked ? "Modo escuro ativado" : "Modo claro ativado");
                  }}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-muted after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full" />
              </label>
            </div>

            <Link
              to="/notificacoes"
              className="flex items-center justify-between border-t border-border/60 pt-3 group hover:opacity-90 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                  <Bell size={18} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Ver Notificações
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Consultar o histórico e alertas da sua conta
                  </p>
                </div>
              </div>
              <ChevronRight
                size={18}
                className="text-muted-foreground group-hover:text-primary transition-colors"
              />
            </Link>
          </div>
        </Section>

        {/* Sobre & Legal */}
        <Section title="Informações & Suporte">
          <div className="rounded-3xl border border-border/80 bg-card divide-y divide-border/60 overflow-hidden">
            <Link
              to="/ajuda"
              className="flex items-center justify-between p-4 hover:bg-accent/40 transition"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  Ajuda & Centro de Suporte
                </span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              to="/sobre"
              className="flex items-center justify-between p-4 hover:bg-accent/40 transition"
            >
              <div className="flex items-center gap-3">
                <Sparkles size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Sobre o KONEKTA STP</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              to="/termos"
              className="flex items-center justify-between p-4 hover:bg-accent/40 transition"
            >
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Termos e Condições</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              to="/privacidade"
              className="flex items-center justify-between p-4 hover:bg-accent/40 transition"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Política de Privacidade</span>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>

            <Link
              to="/admin"
              className="flex items-center justify-between p-4 bg-primary/5 hover:bg-primary/10 transition"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} className="text-primary" />
                <div>
                  <span className="text-sm font-bold text-foreground block">
                    Painel de Administração
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Gerir WhatsApp oficial, emails, comissões e planos
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                Admin
              </span>
            </Link>
          </div>
        </Section>

        {/* Comunidade KONEKTA no WhatsApp */}
        <Section title="Comunidade Oficial KONEKTA">
          <div className="rounded-3xl border border-border/80 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 grid place-items-center font-bold text-xs">
                  WA
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Grupos Oficiais WhatsApp STP</p>
                  <p className="text-[10px] text-muted-foreground">
                    Novidades, dicas e avisos em tempo real
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <a
                href={
                  platformConfig.clientWhatsappGroup ||
                  "https://chat.whatsapp.com/KONEKTA-Clientes-STP"
                }
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-muted text-xs font-bold text-foreground border border-border/60 transition"
              >
                <span>👥 Grupo de Clientes</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </a>
              <a
                href={
                  platformConfig.providerWhatsappGroup ||
                  "https://chat.whatsapp.com/KONEKTA-Prestadores-STP"
                }
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 hover:bg-muted text-xs font-bold text-foreground border border-border/60 transition"
              >
                <span>🛠️ Grupo de Prestadores</span>
                <ChevronRight size={14} className="text-muted-foreground" />
              </a>
            </div>
          </div>
        </Section>

        {/* Sair da Conta */}
        <Section>
          <button
            type="button"
            onClick={() => setLogoutDialog(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 py-4 text-sm font-bold text-destructive transition hover:bg-destructive/15"
          >
            <LogOut size={18} />
            <span>Sair da Conta / Terminar Sessão</span>
          </button>
        </Section>
      </div>

      {/* Modal Editar Perfil */}
      <BottomSheet
        open={editUserModal}
        onClose={() => setEditUserModal(false)}
        title="Editar Dados Pessoais"
        description="Atualize as suas informações de contacto no KONEKTA."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Nome completo *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Telemóvel *</label>
            <div className="flex items-center rounded-2xl border border-border bg-card overflow-hidden">
              <span className="px-3.5 py-3 text-xs font-bold bg-surface border-r border-border text-foreground">
                +239
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-3 text-sm font-medium outline-none bg-transparent"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@konekta.st"
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Distrito principal</label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="Água Grande">Água Grande (São Tomé)</option>
              <option value="Mé-Zóchi">Mé-Zóchi (Trindade)</option>
              <option value="Cantagalo">Cantagalo (Santana)</option>
              <option value="Lobata">Lobata (Guadalupe)</option>
              <option value="Lembá">Lembá (Neves)</option>
              <option value="Caué">Caué (São João dos Angolares)</option>
              <option value="Pagué">Pagué (Príncipe)</option>
            </select>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setEditUserModal(false)}
              className="flex-1 rounded-full border border-border py-3 text-xs font-bold text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? "A guardar..." : "Guardar Alterações"}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal Palavra-passe & Segurança */}
      <BottomSheet
        open={securityModal}
        onClose={() => setSecurityModal(false)}
        title="Palavra-passe & Segurança"
        description="Atualize a sua senha de acesso e verifique os detalhes de segurança."
      >
        <form onSubmit={handleSavePassword} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Palavra-passe atual *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPass}
              onChange={(e) => setCurrentPass(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Nova palavra-passe *</label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/40"
              required
            />
          </div>

          <div className="pt-2">
            <p className="text-xs font-bold text-foreground mb-2">Dispositivo Ativo</p>
            <div className="flex items-center justify-between rounded-2xl border border-border/80 bg-accent/30 p-3 text-xs">
              <div className="flex items-center gap-2">
                <Smartphone size={16} className="text-primary" />
                <div>
                  <p className="font-bold text-foreground">Este dispositivo (Navegador)</p>
                  <p className="text-[10px] text-muted-foreground">Sessão ativa em São Tomé</p>
                </div>
              </div>
              <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-bold text-success">
                Ativo
              </span>
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setSecurityModal(false)}
              className="flex-1 rounded-full border border-border py-3 text-xs font-bold text-muted-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={savingPass}
              className="flex-1 rounded-full bg-primary py-3 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {savingPass ? "A atualizar..." : "Atualizar Senha"}
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal Confirmar Logout */}
      <BottomSheet
        open={logoutDialog}
        onClose={() => setLogoutDialog(false)}
        title="Terminar Sessão?"
        description="Tem a certeza de que deseja sair da sua conta no KONEKTA?"
      >
        <div className="space-y-4 pt-2 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <LogOut size={28} />
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Terá de voltar a introduzir a sua palavra-passe para aceder novamente à sua conta e
            histórico de pedidos.
          </p>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setLogoutDialog(false)}
              className="flex-1 rounded-full border border-border py-3.5 text-xs font-bold text-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex-1 rounded-full bg-destructive py-3.5 text-xs font-bold text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Sair
            </button>
          </div>
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
    </AppShell>
  );
}
