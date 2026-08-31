import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Shield,
  X,
  Building,
  CreditCard,
  Banknote,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Smartphone,
  Copy,
  Check,
  ShieldCheck,
  Award,
  Sparkles,
  Lock,
  ChevronRight,
  KeyRound,
  FileText,
  Info,
  Layers,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";
import { payoutLabel } from "@/lib/escrow";
import { SmsOtpVerificationModal } from "@/components/konekta/SmsOtpVerificationModal";

export const Route = createFileRoute("/carteira")({
  head: () => ({
    meta: [
      { title: "Carteira Digital & Custódia Escrow · KONEKTA STP" },
      {
        name: "description",
        content:
          "Gerir saldo disponível, retenção de pagamentos em custódia segura, recargas por Dobra 24 e bancos locais em São Tomé e Príncipe.",
      },
      { property: "og:title", content: "Carteira Digital Closed-Loop · KONEKTA STP" },
      {
        property: "og:description",
        content:
          "Pagamentos 100% protegidos por custódia e validação OTP em Dobras (STN) para clientes e profissionais.",
      },
    ],
  }),
  component: WalletPage,
});

function formatDate(at: number) {
  const d = new Date(at);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400_000 && d.getDate() === now.getDate()) {
    return `Hoje, ${d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}`;
  }
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STP_BANKS = [
  "Dobra 24 (Carteira Móvel CST / Unitel STP)",
  "BISTP (Banco Internacional de São Tomé e Príncipe)",
  "BGFI Bank São Tomé e Príncipe",
  "Afriland First Bank STP",
  "Levantamento em Dinheiro num Agente KONEKTA",
];

const DOBRA24_AGENTS = [
  { name: "Agente Central Mercado Grande", district: "Água Grande", address: "Av. 12 de Julho" },
  { name: "Posto CST Trindade", district: "Mé-Zóchi", address: "Junto à Praça Central" },
  { name: "Agente Unitel Santana", district: "Cantagalo", address: "Estrada Nacional 2" },
  { name: "Quiosque Guadalupe", district: "Lobata", address: "Cruzamento Central" },
];

function WalletPage() {
  const balance = useStore((s) => s.balance);
  const transactions = useStore((s) => s.transactions);
  const orders = useStore((s) => s.orders);
  const user = useStore((s) => s.user);
  const depositRequests = useStore((s) => s.depositRequests || []);

  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showFlowGuide, setShowFlowGuide] = useState(false);
  const [copiedNib, setCopiedNib] = useState(false);
  const [txFilter, setTxFilter] = useState<"all" | "in" | "out" | "escrow">("all");
  const [selectedTx, setSelectedTx] = useState<(typeof transactions)[0] | null>(null);

  // Top-Up Form State
  const [topUpMethod, setTopUpMethod] = useState<"dobra24" | "transferencia" | "agente">("dobra24");
  const [topUpAmount, setTopUpAmount] = useState("500");
  const [dobra24Phone, setDobra24Phone] = useState(user?.phone || "+239 99");
  const [transferProofRef, setTransferProofRef] = useState("");
  const [isProcessingTopUp, setIsProcessingTopUp] = useState(false);

  // Withdraw Form State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBank, setWithdrawBank] = useState(STP_BANKS[0]);
  const [withdrawAccount, setWithdrawAccount] = useState("");
  const [withdrawName, setWithdrawName] = useState(user?.name || "");
  const [showWithdrawOtp, setShowWithdrawOtp] = useState(false);

  // Calculate active escrow in orders
  const activeEscrowOrders = orders.filter((o) =>
    ["pendente", "aceite", "a-caminho", "em-execucao", "aguardando-codigo"].includes(o.status),
  );

  const escrowAmount = activeEscrowOrders.reduce((sum, o) => sum + o.total, 0);
  const totalWalletValue = balance + escrowAmount;

  // Meus depósitos pendentes
  const myPendingDeposits = depositRequests.filter(
    (d) => d.userId === user?.id && d.status === "pendente_aprovacao",
  );

  function handleCopyNib() {
    navigator.clipboard?.writeText("0001.0000.12345678901.23");
    setCopiedNib(true);
    toast.success("NIB do BISTP copiado para a área de transferência!");
    setTimeout(() => setCopiedNib(false), 2500);
  }

  function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(topUpAmount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Insira um valor válido em Dobras (STN).");
      return;
    }

    setIsProcessingTopUp(true);

    const methodNames: Record<string, string> = {
      dobra24: "Dobra 24 Móvel STP",
      transferencia: "Transferência BISTP / BGFI",
      agente: "Ponto de Recarga / Agente Parceiro",
    };

    const res = store.createDepositRequest({
      userId: user?.id || "usr-client",
      userName: user?.name || "Manuel Trindade",
      userRole: "cliente",
      userPhone: user?.phone || dobra24Phone || "+239 9918273",
      amount: n,
      method:
        topUpMethod === "dobra24"
          ? "dobra24"
          : topUpMethod === "transferencia"
            ? "transferencia_bancaria"
            : "agente_parceiro",
      bankOrProviderName: methodNames[topUpMethod] || "Dobra 24 STP",
      referenceOrPhone:
        topUpMethod === "dobra24"
          ? dobra24Phone || `DB24-${Date.now().toString().slice(-6)}`
          : transferProofRef.trim() || `TRF-${Date.now().toString().slice(-6)}`,
      notes: "Carregamento de carteira digital do cliente",
    });

    setIsProcessingTopUp(false);
    setShowTopUp(false);
    setTopUpAmount("");
    setTransferProofRef("");

    if (res.ok) {
      toast.success("Comprovativo de Carregamento Submetido!", {
        description:
          "O seu pedido de recarga foi registado no sistema e o saldo será creditado assim que validado pelo administrador.",
      });
    } else {
      toast.error(res.message);
    }
  }

  function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(withdrawAmount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Insira um valor válido");
      return;
    }
    if (n > balance) {
      toast.error("Saldo insuficiente para efetuar este levantamento");
      return;
    }
    if (!withdrawAccount.trim()) {
      toast.error("Preencha o número de telemóvel Dobra 24 ou NIB bancário");
      return;
    }

    // Abre o modal de verificação SMS OTP por segurança
    setShowWithdrawOtp(true);
  }

  function executeWithdrawAfterOtp() {
    const n = Number(withdrawAmount);
    const success = store.withdraw(n);
    if (success) {
      toast.success(
        `Pedido de levantamento de ${n.toLocaleString("pt-PT")} STN registado para ${withdrawBank}.`,
        { description: payoutLabel() },
      );
      setWithdrawAmount("");
      setWithdrawAccount("");
      setShowWithdraw(false);
    } else {
      toast.error("Não foi possível processar o levantamento.");
    }
  }

  // Filtragem de transações
  const filteredTxs = transactions.filter((t) => {
    if (txFilter === "in") return t.kind === "in";
    if (txFilter === "out") return t.kind === "out";
    if (txFilter === "escrow") {
      const label = t.label.toLowerCase();
      return (
        label.includes("custódia") ||
        label.includes("custodia") ||
        label.includes("retenção") ||
        label.includes("pagamento")
      );
    }
    return true;
  });

  return (
    <AppShell>
      <header className="pt-7 pb-3 px-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              Carteira Digital Closed-Loop
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-foreground mt-1">
            Carteira KONEKTA
          </h1>
          <p className="text-xs text-muted-foreground font-medium">
            Pagamentos por Dobra 24 e bancos locais com Custódia Escrow em São Tomé
          </p>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="size-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          aria-label="Como funciona o pagamento seguro"
        >
          <HelpCircle size={18} />
        </button>
      </header>

      {/* BANNER DO FLUXO CLOSED-LOOP EM 5 ETAPAS */}
      <section className="px-5 mt-1">
        <div className="bg-card border border-primary/25 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Como Funciona a Custódia</h3>
                <p className="text-[10px] text-muted-foreground">
                  O cliente nunca paga diretamente ao técnico
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFlowGuide(!showFlowGuide)}
              className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
            >
              {showFlowGuide ? "Ocultar" : "Ver 5 Etapas"}
            </button>
          </div>

          {showFlowGuide && (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2 border-t border-border/80 text-[11px] animate-fadeIn">
              <div className="p-2.5 rounded-xl bg-muted/50 space-y-1">
                <span className="font-extrabold text-primary block">1. Carregamento</span>
                <p className="text-muted-foreground text-[10px]">
                  Transfere por Dobra 24 ou BISTP/BGFI. Saldo entra disponível no app.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/50 space-y-1">
                <span className="font-extrabold text-amber-600 dark:text-amber-400 block">
                  2. Bloqueio Escrow
                </span>
                <p className="text-muted-foreground text-[10px]">
                  Ao aceitar a proposta, o valor fica congelado em custódia segura.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/50 space-y-1">
                <span className="font-extrabold text-blue-600 dark:text-blue-400 block">
                  3. Execução & PIN
                </span>
                <p className="text-muted-foreground text-[10px]">
                  O técnico executa o trabalho e solicita o código OTP de 4 dígitos.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/50 space-y-1">
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 block">
                  4. Split Automático
                </span>
                <p className="text-muted-foreground text-[10px]">
                  Validação do PIN credita 85% ao prestador e 15% taxa KONEKTA.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/50 space-y-1">
                <span className="font-extrabold text-purple-600 dark:text-purple-400 block">
                  5. Saque Bancário
                </span>
                <p className="text-muted-foreground text-[10px]">
                  O prestador resgata o saldo para a sua conta bancária ou Dobra 24.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CARD PRINCIPAL DE SALDO & CUSTÓDIA */}
      <section className="px-5 mt-4">
        <div className="bg-gradient-to-br from-primary via-emerald-800 to-teal-950 text-primary-foreground rounded-3xl p-5.5 relative overflow-hidden shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-widest text-primary-foreground/75 font-bold">
              Resumo da Carteira
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full font-bold text-white shadow-2xs">
              <ShieldCheck size={12} className="text-amber-300" />
              100% Protegido em STP
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Saldo Disponível */}
            <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1">
              <span className="text-[10px] text-primary-foreground/80 font-bold uppercase tracking-wider block">
                Saldo Disponível
              </span>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-black tracking-tight">
                  {balance.toLocaleString("pt-PT")}
                </p>
                <span className="text-xs font-bold text-primary-foreground/80">STN</span>
              </div>
              <span className="text-[9px] text-emerald-200 block">Livre para contratação</span>
            </div>

            {/* Saldo Bloqueado em Custódia */}
            <div className="p-3 rounded-2xl bg-amber-400/15 backdrop-blur-xs border border-amber-400/25 space-y-1">
              <span className="text-[10px] text-amber-200 font-bold uppercase tracking-wider block flex items-center gap-1">
                <Lock size={10} /> Em Custódia
              </span>
              <div className="flex items-baseline gap-1.5">
                <p className="text-2xl font-black tracking-tight text-amber-300">
                  {escrowAmount.toLocaleString("pt-PT")}
                </p>
                <span className="text-xs font-bold text-amber-200">STN</span>
              </div>
              <span className="text-[9px] text-amber-200/90 block">
                {activeEscrowOrders.length} serviço(s) ativo(s)
              </span>
            </div>
          </div>

          {/* Total Geral */}
          <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs">
            <span className="text-primary-foreground/80 font-medium">
              Total na Carteira (Disponível + Retido):
            </span>
            <strong className="text-sm font-black text-white">
              {totalWalletValue.toLocaleString("pt-PT")} STN
            </strong>
          </div>

          {/* Botões de Ação */}
          <div className="pt-2 flex gap-2.5">
            <button
              onClick={() => setShowTopUp(true)}
              className="flex-1 bg-white text-primary rounded-xl py-3 text-xs font-black flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-transform cursor-pointer"
            >
              <Plus size={16} /> Carregar Carteira
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={balance <= 0}
              className="flex-1 bg-primary-foreground/15 hover:bg-primary-foreground/25 backdrop-blur text-primary-foreground rounded-xl py-3 text-xs font-bold border border-primary-foreground/20 active:scale-98 transition-transform disabled:opacity-50 cursor-pointer"
            >
              Levantar Saldo
            </button>
          </div>
        </div>
      </section>

      {/* AVISO DE RECARGAS PENDENTES DE APROVAÇÃO PELO ADMIN */}
      {myPendingDeposits.length > 0 && (
        <section className="px-5 mt-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold">
              <Clock size={16} className="text-amber-600 dark:text-amber-400" />
              <span>{myPendingDeposits.length} Carregamento(s) em Validação Bancária</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              O seu comprovativo foi submetido. Assim que a administração confirmar a transferência,
              o saldo será creditado automaticamente.
            </p>
          </div>
        </section>
      )}

      {/* SERVIÇOS EM CUSTÓDIA ATIVA (COM CÓDIGO OTP) */}
      {activeEscrowOrders.length > 0 && (
        <section className="px-5 mt-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Lock size={13} className="text-amber-600" />
              Serviços com Custódia Ativa ({activeEscrowOrders.length})
            </h2>
          </div>

          <div className="space-y-2">
            {activeEscrowOrders.map((ord) => (
              <div
                key={ord.id}
                className="bg-card border border-amber-500/30 rounded-2xl p-3.5 shadow-2xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase">
                      {ord.id}
                    </span>
                    <h4 className="text-xs font-bold text-foreground">{ord.service}</h4>
                  </div>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                    {ord.total.toLocaleString("pt-PT")} STN
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-muted/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <KeyRound size={16} className="text-primary shrink-0" />
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        O seu Código OTP de Conclusão:
                      </span>
                      <strong className="text-sm font-mono tracking-widest text-primary font-black">
                        {ord.completionCode || "5821"}
                      </strong>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground text-right">
                    Forneça apenas ao terminar o serviço
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* DESTAQUE DOBRA 24 STP */}
      <section className="px-5 mt-4">
        <div className="bg-card border border-primary/20 rounded-2xl p-4 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-primary/10 text-primary grid place-items-center">
                <Smartphone size={17} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-foreground">Pagamentos via Dobra 24</h3>
                <p className="text-[10px] text-muted-foreground">
                  Sem necessidade de conta bancária em STP
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Instantâneo
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground pt-1 border-t border-border">
            Pode recarregar a carteira através do menu USSD da CST/Unitel ou dirigindo-se a um
            agente de proximidade em qualquer distrito de São Tomé.
          </p>
        </div>
      </section>

      {/* EXTRATO DE MOVIMENTOS COM FILTROS */}
      <section className="px-5 mt-6 pb-12 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Livro-Razão & Movimentos
          </h2>
          <span className="text-[11px] text-muted-foreground font-medium">
            {filteredTxs.length} registo(s)
          </span>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setTxFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              txFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setTxFilter("in")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              txFilter === "in"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Recargas (+)
          </button>
          <button
            onClick={() => setTxFilter("out")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              txFilter === "out"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Pagamentos (-)
          </button>
          <button
            onClick={() => setTxFilter("escrow")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              txFilter === "escrow"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            Custódia Escrow
          </button>
        </div>

        {filteredTxs.length === 0 ? (
          <div className="rounded-2xl bg-card border border-border p-6 text-center text-xs text-muted-foreground">
            Sem transações registadas nesta categoria.
          </div>
        ) : (
          filteredTxs.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTx(t)}
              className="flex items-center gap-3 bg-card border border-border/80 hover:border-primary/40 rounded-2xl p-3.5 shadow-2xs transition cursor-pointer"
            >
              <div
                className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                  t.kind === "in"
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                }`}
              >
                {t.kind === "in" ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground truncate">{t.label}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {formatDate(t.at)}
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground px-1.5 py-0.2 rounded bg-muted">
                    {t.id}
                  </span>
                </div>
              </div>
              <span
                className={`text-xs font-black shrink-0 ${
                  t.kind === "in" ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                }`}
              >
                {t.kind === "in" ? "+" : "-"}
                {t.amount.toLocaleString("pt-PT")} STN
              </span>
            </div>
          ))
        )}
      </section>

      {/* MODAL DE DETALHE DA TRANSAÇÃO */}
      {selectedTx && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedTx(null)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-3xl p-5 space-y-3.5 border border-border shadow-xl text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <FileText size={16} className="text-primary" />
                Comprovativo de Movimento
              </span>
              <button
                onClick={() => setSelectedTx(null)}
                className="size-7 rounded-full bg-muted grid place-items-center text-muted-foreground"
              >
                <X size={14} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-muted/50 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ID do Registo:</span>
                <strong className="font-mono text-foreground">{selectedTx.id}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Descrição:</span>
                <strong className="text-foreground text-right">{selectedTx.label}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Montante:</span>
                <strong
                  className={
                    selectedTx.kind === "in"
                      ? "text-emerald-600 font-black"
                      : "text-foreground font-black"
                  }
                >
                  {selectedTx.kind === "in" ? "+" : "-"}
                  {selectedTx.amount.toLocaleString("pt-PT")} STN
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data e Hora:</span>
                <span className="text-foreground font-medium">{formatDate(selectedTx.at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo de Movimento:</span>
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-[10px] uppercase">
                  {selectedTx.kind === "in" ? "Crédito em Carteira" : "Débito / Custódia"}
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                toast.success("Comprovativo descarregado com sucesso!");
                setSelectedTx(null);
              }}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-bold text-xs shadow-sm hover:opacity-95 cursor-pointer"
            >
              Descarregar Recibo Digital
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE CARREGAMENTO DOBRA 24 & BANCOS */}
      {showTopUp && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowTopUp(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto border border-border shadow-xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Carregar Carteira</h3>
                <p className="text-xs text-muted-foreground">
                  Adicione saldo em Dobras de São Tomé (STN)
                </p>
              </div>
              <button
                onClick={() => setShowTopUp(false)}
                className="size-8 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Opções de Método */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-foreground">Método de Carregamento</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTopUpMethod("dobra24")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col gap-1 transition-all cursor-pointer ${
                    topUpMethod === "dobra24"
                      ? "border-primary bg-primary/10 text-primary shadow-2xs"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Smartphone size={16} />
                  <span>Dobra 24</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTopUpMethod("transferencia")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col gap-1 transition-all cursor-pointer ${
                    topUpMethod === "transferencia"
                      ? "border-primary bg-primary/10 text-primary shadow-2xs"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Building size={16} />
                  <span>BISTP / BGFI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTopUpMethod("agente")}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold flex flex-col gap-1 transition-all cursor-pointer ${
                    topUpMethod === "agente"
                      ? "border-primary bg-primary/10 text-primary shadow-2xs"
                      : "border-border bg-card text-muted-foreground"
                  }`}
                >
                  <Banknote size={16} />
                  <span>Agente Bairro</span>
                </button>
              </div>
            </div>

            {/* Detalhes Dobra 24 */}
            {topUpMethod === "dobra24" && (
              <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-primary">
                  <span>📱 Carregamento Direto por Telemóvel</span>
                  <span className="text-[10px] bg-primary/10 px-2 py-0.5 rounded-full">
                    USSD STP
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Insira o seu número CST / Unitel STP. Receberá um prompt para confirmar o débito
                  com o seu PIN da Dobra 24.
                </p>
                <div className="pt-1">
                  <label className="text-[11px] font-bold text-foreground block mb-1">
                    Número do Telemóvel Dobra 24
                  </label>
                  <input
                    type="tel"
                    value={dobra24Phone}
                    onChange={(e) => setDobra24Phone(e.target.value)}
                    placeholder="+239 990 0000"
                    className="w-full h-10 px-3 rounded-xl bg-card border border-border text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {/* Detalhes Transferência Bancária */}
            {topUpMethod === "transferencia" && (
              <div className="p-3.5 rounded-2xl bg-muted/60 text-[11px] space-y-2 text-muted-foreground border border-border">
                <p className="font-bold text-foreground">Coordenadas Bancárias KONEKTA STP:</p>
                <div className="flex items-center justify-between p-2 rounded-xl bg-card border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">NIB BISTP</span>
                    <strong className="text-foreground font-mono text-xs">
                      0001.0000.12345678901.23
                    </strong>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyNib}
                    className="p-1.5 rounded-lg bg-muted hover:bg-primary/10 text-foreground cursor-pointer transition"
                  >
                    {copiedNib ? (
                      <Check size={14} className="text-emerald-600" />
                    ) : (
                      <Copy size={14} />
                    )}
                  </button>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-foreground block mb-1">
                    Nº de Comprovativo / Referência de Transferência
                  </label>
                  <input
                    type="text"
                    value={transferProofRef}
                    onChange={(e) => setTransferProofRef(e.target.value)}
                    placeholder="Ex: TRF-982173 ou Nome do Titular"
                    className="w-full h-9 px-3 rounded-xl bg-card border border-border text-xs font-mono"
                  />
                </div>
                <p>
                  <strong>Beneficiário:</strong> Konekta Serviços Lda · BISTP / BGFI Bank
                </p>
              </div>
            )}

            {/* Detalhes Agente de Bairro */}
            {topUpMethod === "agente" && (
              <div className="p-3.5 rounded-2xl bg-muted/60 text-[11px] space-y-2 border border-border">
                <span className="font-bold text-foreground block">
                  Agentes Dobra 24 Credenciados em STP:
                </span>
                <div className="space-y-1.5">
                  {DOBRA24_AGENTS.map((ag) => (
                    <div
                      key={ag.name}
                      className="p-2 rounded-xl bg-card border border-border flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-foreground block text-xs">{ag.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {ag.district} · {ag.address}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-bold">Aberto</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleTopUp} className="space-y-3 pt-1">
              <div>
                <span className="text-xs font-bold text-foreground">Valores Rápidos</span>
                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {[250, 500, 1000, 2500, 5000, 10000].map((v) => (
                    <button
                      type="button"
                      key={v}
                      onClick={() => setTopUpAmount(String(v))}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        topUpAmount === String(v)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted hover:bg-muted/80 text-foreground border-border"
                      }`}
                    >
                      {v.toLocaleString("pt-PT")} STN
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="text-xs font-bold text-foreground">
                  Ou digite o valor personalizado (STN)
                </span>
                <input
                  type="number"
                  min={50}
                  max={100000}
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  placeholder="Ex: 750"
                  className="mt-1 w-full py-2.5 px-3.5 bg-card border border-border rounded-xl text-sm font-semibold focus:outline-none focus:border-primary font-mono"
                />
              </label>

              <button
                type="submit"
                disabled={!topUpAmount || Number(topUpAmount) <= 0 || isProcessingTopUp}
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-bold text-xs shadow-sm hover:opacity-95 active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isProcessingTopUp ? (
                  <span>A processar recarga...</span>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>
                      Submeter Carregamento (
                      {topUpAmount ? `${Number(topUpAmount).toLocaleString("pt-PT")} STN` : ""})
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE LEVANTAMENTO */}
      {showWithdraw && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowWithdraw(false)}
        >
          <div
            className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-3xl p-5 space-y-4 max-h-[90vh] overflow-y-auto border border-border shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-base font-bold text-foreground">Levantar Saldo</h3>
                <p className="text-xs text-muted-foreground">
                  Transferência para Dobra 24 ou conta bancária em STP
                </p>
              </div>
              <button
                onClick={() => setShowWithdraw(false)}
                className="size-8 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Destino do Levantamento em São Tomé
                </label>
                <select
                  value={withdrawBank}
                  onChange={(e) => setWithdrawBank(e.target.value)}
                  className="w-full py-2.5 px-3 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                >
                  {STP_BANKS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Nome do Titular
                </label>
                <input
                  type="text"
                  value={withdrawName}
                  onChange={(e) => setWithdrawName(e.target.value)}
                  placeholder="Nome completo"
                  className="w-full py-2.5 px-3 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Número de Telemóvel Dobra 24 ou NIB Bancário
                </label>
                <input
                  type="text"
                  value={withdrawAccount}
                  onChange={(e) => setWithdrawAccount(e.target.value)}
                  placeholder="Ex: 990 0000 ou 0001.0000..."
                  className="w-full py-2.5 px-3 bg-card border border-border rounded-xl text-xs font-medium focus:outline-none focus:border-primary font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground block mb-1">
                  Montante a Levantar (STN)
                </label>
                <input
                  type="number"
                  min={50}
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Máximo disponível: ${balance.toLocaleString("pt-PT")} STN`}
                  className="w-full py-2.5 px-3 bg-card border border-border rounded-xl text-xs font-bold focus:outline-none focus:border-primary font-mono"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-bold text-xs shadow-sm hover:opacity-95 active:scale-98 transition-all cursor-pointer"
              >
                Confirmar Pedido de Levantamento
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE AJUDA & SEGURANÇA */}
      {showHelp && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowHelp(false)}
        >
          <div
            className="w-full max-w-sm bg-card rounded-3xl p-5 space-y-3.5 border border-border shadow-xl text-xs text-muted-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-primary" />
                Segurança dos Pagamentos KONEKTA
              </span>
              <button onClick={() => setShowHelp(false)} className="cursor-pointer">
                <X size={16} />
              </button>
            </div>
            <p>
              1. <strong>Custódia:</strong> O dinheiro nunca vai diretamente para o técnico antes do
              serviço. Fica guardado em segurança na KONEKTA.
            </p>
            <p>
              2. <strong>Libertação por PIN:</strong> Só quando o trabalho estiver pronto é que o
              cliente partilha o código PIN de 4 dígitos para transferir os fundos.
            </p>
            <p>
              3. <strong>Garantia 30 Dias:</strong> Se algo falhar, o técnico é obrigado a corrigir
              o problema sem custos extras de mão de obra.
            </p>
          </div>
        </div>
      )}

      {/* Modal de Confirmação SMS OTP de Levantamento */}
      <SmsOtpVerificationModal
        open={showWithdrawOtp}
        onClose={() => setShowWithdrawOtp(false)}
        phone={withdrawAccount || user?.phone || "+239 990 0000"}
        title="Confirmar Levantamento por SMS OTP"
        reason={`Autorização de débito de ${Number(withdrawAmount || 0).toLocaleString("pt-PT")} STN`}
        onVerified={executeWithdrawAfterOtp}
      />
    </AppShell>
  );
}
