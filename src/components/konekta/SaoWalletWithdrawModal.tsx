import { useState } from "react";
import {
  X,
  Smartphone,
  Building,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";
import { formatDb } from "@/lib/catalog";

interface SaoWalletWithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro?: boolean;
}

const LOCAL_BANKS = [
  "BISTP (Banco Internacional de São Tomé e Príncipe)",
  "BGFI Bank São Tomé e Príncipe",
  "Afriland First Bank STP",
  "Banco Nacional de Investimento (BNI STP)",
  "CISTP (Caixa Económica e Crédito)",
];

export function SaoWalletWithdrawModal({
  isOpen,
  onClose,
  isPro: isProProp,
}: SaoWalletWithdrawModalProps) {
  const user = useStore((s) => s.user);
  const isPro = isProProp !== undefined ? isProProp : user?.role === "prestador";

  const clientBalance = useStore((s) => s.balance);
  const providerBalance = useStore((s) => s.providerBalance);
  const rawBalance = isPro ? providerBalance : clientBalance;
  const availableBalance =
    typeof rawBalance === "number" && Number.isFinite(rawBalance) ? rawBalance : 0;

  const [channel, setChannel] = useState<"sao_wallet" | "banco">("sao_wallet");
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dados de Destino do Utilizador (São Wallet)
  const [walletHolderName, setWalletHolderName] = useState(user?.name || "");
  const [walletPhone, setWalletPhone] = useState(user?.phone || "+239 99");

  // Dados de Destino Bancário
  const [bankHolderName, setBankHolderName] = useState(user?.name || "");
  const [selectedBank, setSelectedBank] = useState(LOCAL_BANKS[0]);
  const [bankNib, setBankNib] = useState("");

  if (!isOpen) return null;

  const maxVal = Math.max(0, availableBalance);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const val = Number(amount);

    if (!val || val <= 0) {
      toast.error("Insira um montante válido a levantar.");
      return;
    }

    if (val > maxVal) {
      toast.error(`Montante excede o saldo disponível (${formatDb(maxVal)}).`);
      return;
    }

    if (channel === "sao_wallet") {
      if (!walletHolderName.trim()) {
        toast.error("Insira o nome completo do titular na São Wallet.");
        return;
      }
      if (!walletPhone.trim() || walletPhone.trim().length < 7) {
        toast.error("Insira o seu número pessoal de telemóvel da São Wallet (+239 99X XXXX).");
        return;
      }
    } else {
      if (!bankHolderName.trim()) {
        toast.error("Insira o nome do titular da conta bancária.");
        return;
      }
      if (!bankNib.trim() || bankNib.trim().length < 10) {
        toast.error("Insira o NIB ou IBAN bancário de destino.");
        return;
      }
    }

    setIsSubmitting(true);

    const methodCode = channel === "sao_wallet" ? "sao_wallet" : "bistp";
    const accountInfo =
      channel === "sao_wallet"
        ? `São Wallet: ${walletPhone.trim()} (${walletHolderName.trim()})`
        : `${selectedBank} · NIB: ${bankNib.trim()} (${bankHolderName.trim()})`;

    const res = store.requestPayout({
      amount: val,
      method: methodCode,
      accountDetails: accountInfo,
      holderName: channel === "sao_wallet" ? walletHolderName.trim() : bankHolderName.trim(),
    });

    setIsSubmitting(false);

    if (res.ok) {
      toast.success("Pedido de levantamento registado!", {
        description:
          "O valor foi congelado na sua carteira. A equipa KONEKTA enviará a quantia para os seus dados em até 2 horas.",
      });
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
              <ArrowUpRight size={20} />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                Solicitar Levantamento (Cash-Out)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isPro ? "Resgatar Ganhos de Serviços Prestados" : "Resgatar Saldo Não Utilizado"}
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
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Card de Saldo Disponível */}
          <div className="p-3.5 rounded-2xl bg-zinc-100/70 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">
                Saldo Disponível para Resgate
              </span>
              <span className="text-lg font-black font-mono text-zinc-900 dark:text-zinc-100">
                {formatDb(availableBalance)}
              </span>
            </div>
            {availableBalance <= 0 && (
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-xl border border-amber-200 dark:border-amber-800/40">
                Sem saldo positivo
              </span>
            )}
          </div>

          {/* Seleção de Canal de Saída */}
          <div>
            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1.5">
              Enviar Dinheiro Para:
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setChannel("sao_wallet")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  channel === "sao_wallet"
                    ? activeTabStyle
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Smartphone size={14} />
                Minha São Wallet
              </button>
              <button
                type="button"
                onClick={() => setChannel("banco")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  channel === "banco"
                    ? activeTabStyle
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
                }`}
              >
                <Building size={14} />
                Transferência Bancária
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Montante */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Montante a Levantar (STN) *
                </label>
                {maxVal > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(String(maxVal))}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                  >
                    Levantar Total ({formatDb(maxVal)})
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="50"
                  max={maxVal > 0 ? maxVal : undefined}
                  step="1"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 500"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono font-bold text-base focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3.5 top-3 text-xs font-black text-zinc-400 font-mono">
                  STN
                </span>
              </div>
            </div>

            {channel === "sao_wallet" ? (
              /* Campos do Destinatário na São Wallet */
              <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  <Smartphone size={14} className={isPro ? "text-emerald-600" : "text-blue-600"} />
                  <span>Os seus dados na São Wallet</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Nome Completo do Titular (São Wallet) *
                  </label>
                  <input
                    type="text"
                    required
                    value={walletHolderName}
                    onChange={(e) => setWalletHolderName(e.target.value)}
                    placeholder="Ex: Edilson Sacramento"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Número de Telemóvel da São Wallet *
                  </label>
                  <input
                    type="text"
                    required
                    value={walletPhone}
                    onChange={(e) => setWalletPhone(e.target.value)}
                    placeholder="+239 99X XXXX"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    A empresa KONEKTA enviará a transferência diretamente para esta conta São
                    Wallet.
                  </p>
                </div>
              </div>
            ) : (
              /* Campos do Destinatário Bancário */
              <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-800 dark:text-zinc-200">
                  <Building size={14} className={isPro ? "text-emerald-600" : "text-blue-600"} />
                  <span>Os seus dados bancários locais</span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Nome do Titular da Conta Bancária *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankHolderName}
                    onChange={(e) => setBankHolderName(e.target.value)}
                    placeholder="Ex: Maria dos Santos"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    Banco de Destino *
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  >
                    {LOCAL_BANKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400 block mb-1">
                    NIB / IBAN de Destino (ST53...) *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankNib}
                    onChange={(e) => setBankNib(e.target.value)}
                    placeholder="0001.0000.XXXXXXXXXXX.XX"
                    className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-mono text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || maxVal <= 0}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${primaryBtn}`}
            >
              <ShieldCheck size={16} />
              Confirmar e Enviar Pedido de Levantamento
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
