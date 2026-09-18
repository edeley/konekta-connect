import { useState } from "react";
import {
  X,
  Smartphone,
  Store,
  Copy,
  Check,
  Building,
  Upload,
  Zap,
  Info,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { store, useStore, SAO_WALLET_COMPANY } from "@/lib/store";
import { toast } from "sonner";
import { ProofUpload } from "./ProofUpload";

interface SaoWalletRechargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAmount?: number;
  onSuccess?: () => void;
  isPro?: boolean;
}

export function SaoWalletRechargeModal({
  isOpen,
  onClose,
  defaultAmount = 500,
  onSuccess,
  isPro: isProProp,
}: SaoWalletRechargeModalProps) {
  const user = useStore((s) => s.user);
  const isPro = isProProp !== undefined ? isProProp : user?.role === "prestador";

  const [tab, setTab] = useState<"agente" | "digital">("digital");
  const [amount, setAmount] = useState(String(defaultAmount));
  const [reference, setReference] = useState("");
  const [proofImage, setProofImage] = useState<string | undefined>(undefined);
  const [proofFileName, setProofFileName] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedName, setCopiedName] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  if (!isOpen) return null;

  function handleCopy(text: string, type: "name" | "phone") {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    if (type === "name") {
      setCopiedName(true);
      setTimeout(() => setCopiedName(false), 2000);
      toast.success("Nome do titular copiado!");
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
      toast.success("Número da APP copiado!");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(amount);
    if (!val || val <= 0) {
      toast.error("Insira um montante válido para recarregar.");
      return;
    }
    if (!reference.trim()) {
      toast.error(
        tab === "agente"
          ? "Insira o código de referência do talão do agente."
          : "Insira o ID / Referência da transação da São Wallet.",
      );
      return;
    }

    setIsSubmitting(true);
    const method = tab === "agente" ? "sao_wallet_agente" : "sao_wallet_digital";
    const res = store.createDepositRequest({
      amount: val,
      method,
      bankOrProviderName: tab === "agente" ? "Agente Físico São Wallet" : "App Digital São Wallet",
      referenceOrPhone: reference.trim(),
      proofImage,
      proofFileName,
      userRole: isPro ? "prestador" : "cliente",
      notes:
        tab === "agente"
          ? `Depósito efetuado em agente físico São Wallet. Talão: ${reference.trim()}`
          : `Transferência via App São Wallet. ID de Transação: ${reference.trim()}`,
    });

    setIsSubmitting(false);

    if (res.ok) {
      toast.success("Pedido de recarga submetido!", {
        description:
          "A nossa equipa validará o valor com a São Wallet e creditará o seu saldo em instantes.",
      });
      if (onSuccess) onSuccess();
      onClose();
    } else {
      toast.error(res.message);
    }
  }

  function handleInstantTestApproval() {
    const val = Number(amount) || 500;
    const ref = reference.trim() || (tab === "agente" ? "TAL-AG-TEST-8842" : "TXN-SW-TEST-9921");
    const method = tab === "agente" ? "sao_wallet_agente" : "sao_wallet_digital";

    const res = store.simulateInstantRecharge({
      amount: val,
      method,
      reference: ref,
      userRole: isPro ? "prestador" : "cliente",
    });

    if (res.ok) {
      toast.success("⚡ Recarga Validada Instantaneamente!", {
        description: `Creditado ${val} STN no seu saldo virtual KONEKTA com sucesso.`,
      });
      if (onSuccess) onSuccess();
      onClose();
    } else {
      toast.error(res.message);
    }
  }

  // Cores estritas: prestador verde/branco, cliente azul/branco
  const primaryBtn = isPro
    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";
  const activeTabStyle = isPro
    ? "bg-emerald-600 text-white shadow-xs"
    : "bg-blue-600 text-white shadow-xs";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[92vh] flex flex-col overflow-hidden text-zinc-900 dark:text-zinc-100">
        {/* Header */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/70 dark:bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                isPro
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400"
                  : "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
              }`}
            >
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                Carregar Carteira via São Wallet
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isPro ? "Conta do Prestador KONEKTA" : "Conta do Cliente KONEKTA"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-zinc-200/70 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Dados Oficiais da Carteira Digital */}
          <div
            className={`p-4 rounded-2xl border ${
              isPro
                ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
                : "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
                <Building size={14} className={isPro ? "text-emerald-600" : "text-blue-600"} />
                Dados Oficiais da Carteira Digital
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isPro ? "bg-emerald-600 text-white" : "bg-blue-600 text-white"
                }`}
              >
                Conta Oficial KONEKTA STP
              </span>
            </div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-3">
              Envie o valor exclusivamente para a conta oficial da aplicação:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Número da APP */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                    Número da APP
                  </span>
                  <span className="text-sm font-black font-mono text-zinc-900 dark:text-zinc-100">
                    {SAO_WALLET_COMPANY.phone}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(SAO_WALLET_COMPANY.phone, "phone")}
                  className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 transition"
                  title="Copiar Número da APP"
                >
                  {copiedPhone ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>

              {/* Titular da Conta */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold block">
                    Titular da Conta
                  </span>
                  <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                    {SAO_WALLET_COMPANY.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(SAO_WALLET_COMPANY.name, "name")}
                  className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-200 transition"
                  title="Copiar Titular da Conta"
                >
                  {copiedName ? (
                    <Check size={14} className="text-emerald-600" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Seleção do Canal: Agente Físico ou App Digital */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-2">
              Escolha como realizou o carregamento:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setTab("digital")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  tab === "digital"
                    ? activeTabStyle
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Smartphone size={15} />
                App São Wallet (Digital)
              </button>
              <button
                type="button"
                onClick={() => setTab("agente")}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                  tab === "agente"
                    ? activeTabStyle
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Store size={15} />
                Agente Físico São Wallet
              </button>
            </div>
          </div>

          {/* Guia de Passos do Canal Selecionado */}
          <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/80 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
              <Info size={15} className="text-emerald-700 dark:text-emerald-400" />
              <span>
                {tab === "digital"
                  ? "Instruções: Recarga Digital pelo App São Wallet"
                  : "Instruções: Depósito Físico num Agente São Wallet"}
              </span>
            </div>
            {tab === "digital" ? (
              <ol className="list-decimal list-inside space-y-1 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                <li>Abra o aplicativo da São Wallet no seu telemóvel.</li>
                <li>
                  Faça a transferência para o Número da APP{" "}
                  <strong>{SAO_WALLET_COMPANY.phone}</strong> em nome de{" "}
                  <strong>{SAO_WALLET_COMPANY.name}</strong>.
                </li>
                <li>Copie o ID/Referência da transação gerado no comprovativo.</li>
                <li>Preencha o formulário abaixo para crédito automático.</li>
              </ol>
            ) : (
              <ol className="list-decimal list-inside space-y-1 text-zinc-600 dark:text-zinc-400 text-[11px] leading-relaxed">
                <li>Dirija-se a qualquer agente oficial ou quiosque da São Wallet.</li>
                <li>
                  Entregue o dinheiro físico e informe o número{" "}
                  <strong>{SAO_WALLET_COMPANY.phone}</strong> em nome de{" "}
                  <strong>{SAO_WALLET_COMPANY.name}</strong>.
                </li>
                <li>Exija e guarde o talão físico impresso pelo agente.</li>
                <li>Introduza o código de referência do talão abaixo (com foto opcional).</li>
              </ol>
            )}
          </div>

          {/* Formulário de Notificação de Recarga */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Montante */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Montante Depositado / Transferido (STN) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  step="10"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 500"
                  className="w-full px-3.5 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3.5 top-3.5 text-xs font-black text-zinc-400 font-mono">
                  STN
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {[100, 250, 500, 1000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(String(quick))}
                    className="py-1 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-[11px] font-bold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                  >
                    +{quick} STN
                  </button>
                ))}
              </div>
            </div>

            {/* Referência da Transação ou Talão do Agente */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                {tab === "digital"
                  ? "ID / Referência da Transação Digital da São Wallet *"
                  : "Código de Referência do Talão do Agente *"}
              </label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={
                  tab === "digital" ? "Ex: SW-TX-882194 ou 9901823" : "Ex: TAL-AG-STP-94827"
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-mono font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                {tab === "digital"
                  ? "Encontra este código no ecrã de sucesso da app São Wallet."
                  : "Encontra o número no cabeçalho ou rodapé do talão impresso pelo agente."}
              </p>
            </div>

            {/* Anexo de Talão / Comprovativo Físico (Mais comum em Agente) */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
                Foto do Talão ou Captura de Ecrã (Opcional)
              </label>
              <ProofUpload
                onUploadComplete={(url, name) => {
                  setProofImage(url);
                  setProofFileName(name);
                }}
                currentUrl={proofImage}
                currentFileName={proofFileName}
                onRemove={() => {
                  setProofImage(undefined);
                  setProofFileName(undefined);
                }}
              />
            </div>

            {/* Botões de Submissão */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer ${primaryBtn}`}
              >
                <ShieldCheck size={16} />
                Submeter Notificação de Recarga
              </button>

              {/* Botão para Teste Imediato no Preview */}
              <button
                type="button"
                onClick={handleInstantTestApproval}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 dark:text-amber-300 border border-amber-500/30 transition active:scale-[0.99] cursor-pointer"
                title="Aprova a recarga imediatamente para testes"
              >
                <Zap size={14} className="text-amber-600" />⚡ Validar Imediatamente (Modo Teste /
                Demonstração)
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
