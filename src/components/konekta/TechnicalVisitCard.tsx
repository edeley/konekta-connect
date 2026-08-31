import { useState } from "react";
import {
  Car,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Banknote,
  Send,
  HelpCircle,
  KeyRound,
  Eye,
  EyeOff,
  Scale,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { store, useStore, type TechnicalVisit } from "@/lib/store";
import { formatDb } from "@/lib/catalog";
import { evaluateVisitPriceDivergence } from "@/lib/pricing-engine";
import { KButton } from "./kit";

interface TechnicalVisitCardProps {
  visit: TechnicalVisit;
  providerId: string;
}

export function TechnicalVisitCard({ visit, providerId }: TechnicalVisitCardProps) {
  const user = useStore((s) => s.user);
  const profiles = useStore((s) => s.profiles);
  const isProviderMode = profiles.prestador;

  const [declareOpen, setDeclareOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [reportInput, setReportInput] = useState("");

  const [clientCorrectionOpen, setClientCorrectionOpen] = useState(false);
  const [clientRealAmount, setClientRealAmount] = useState("");
  const [clientReason, setClientReason] = useState("");

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [showOtp, setShowOtp] = useState(false);

  const [contestOpen, setContestOpen] = useState(false);
  const [contestReason, setContestReason] = useState("");

  const isClient = !isProviderMode;

  function handleAcceptVisit() {
    const res = store.clientAcceptTechnicalVisit(visit.id);
    if (!res.ok) {
      toast.error(res.message);
    } else {
      toast.success("Visita Técnica Aceite!", {
        description: res.message,
      });
    }
  }

  function handleStartWay() {
    store.startTechnicalVisit(visit.id);
    toast.info("Deslocação Iniciada", {
      description: "O cliente foi informado que você está a caminho.",
    });
  }

  function handleDeclareBudget() {
    const val = Number(budgetInput);
    if (!val || val <= 0) {
      toast.error("Insira o valor do orçamento presencial.");
      return;
    }
    if (!reportInput.trim()) {
      toast.error("Insira um breve diagnóstico técnico das condições do local.");
      return;
    }
    const res = store.providerDeclareVisitBudget(visit.id, val, reportInput);
    if (res.ok) {
      toast.success("Orçamento Presencial Enviado", {
        description: res.message,
      });
      setDeclareOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  function handleClientConfirmBudget(agreed: boolean) {
    if (agreed) {
      const res = store.clientConfirmVisitBudget(visit.id, true);
      if (res.ok) {
        toast.success("Orçamento Confirmado!", {
          description: res.message,
        });
      } else {
        toast.error(res.message);
      }
    } else {
      setClientCorrectionOpen(true);
    }
  }

  function handleClientSubmitCorrection() {
    const val = Number(clientRealAmount);
    if (!val || val <= 0) {
      toast.error("Insira o valor real combinado presencialmente.");
      return;
    }
    const res = store.clientConfirmVisitBudget(visit.id, false, val, clientReason);
    if (res.ok) {
      if (res.resultLevel === "level_3") {
        toast.warning("Divergência em Moderação", {
          description: res.message,
        });
      } else {
        toast.success("Orçamento Ajustado", {
          description: res.message,
        });
      }
      setClientCorrectionOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  function handleValidateCashOtp() {
    if (!otpInput.trim() || otpInput.trim().length !== 4) {
      toast.error("Insira o código OTP de 4 dígitos gerado no telemóvel do cliente.");
      return;
    }
    const amount = visit.finalAgreedAmount || visit.providerDeclaredAmount || 500;
    const res = store.declareCashPaymentWithOtp(visit.id, amount, otpInput.trim());
    if (res.ok) {
      toast.success("Pagamento em Dinheiro Validado!", {
        description: res.message,
      });
      setOtpModalOpen(false);
    } else {
      toast.error(res.message);
    }
  }

  function handleContestReceipt() {
    if (!contestReason.trim()) {
      toast.error("Por favor descreva o motivo da contestação.");
      return;
    }
    const res = store.contestCashReceipt(visit.id, contestReason);
    if (res.ok) {
      toast.success("Contestação Enviada", {
        description: res.message,
      });
      setContestOpen(false);
    }
  }

  return (
    <div
      id={`technical-visit-${visit.id}`}
      className="my-3 overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 shadow-sm dark:border-emerald-900/60 dark:bg-emerald-950/30"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Visita Técnica no Terreno
              </span>
              <span className="rounded-md bg-emerald-200/80 px-2 py-0.5 text-[11px] font-bold text-emerald-900 dark:bg-emerald-800/60 dark:text-emerald-100">
                #{visit.id}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {visit.serviceTitle}
            </h4>
          </div>
        </div>

        {/* Status Badge */}
        <div>
          {visit.status === "pendente" && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
              Aguardando Aceite
            </span>
          )}
          {visit.status === "aguardando_visita" && (
            <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-900/60 dark:text-blue-200">
              Visita Confirmada
            </span>
          )}
          {visit.status === "a_caminho" && (
            <span className="animate-pulse rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200">
              🚗 Técnico a Caminho
            </span>
          )}
          {visit.status === "confirmacao_cliente" && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 dark:bg-amber-900/60 dark:text-amber-200">
              Aguardando Confirmação do Cliente
            </span>
          )}
          {visit.status === "em_moderacao" && (
            <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 dark:bg-rose-900/60 dark:text-rose-200">
              ⚠️ Em Moderação Antifraude
            </span>
          )}
          {visit.status === "visita_paga_e_aprovada" && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
              ✓ Orçamento Validado
            </span>
          )}
          {visit.status === "concluido" && (
            <span className="rounded-full bg-zinc-200 px-2.5 py-1 text-xs font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              Concluído
            </span>
          )}
        </div>
      </div>

      {/* Details Grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white/80 p-3 text-xs text-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-300 sm:grid-cols-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{visit.scheduledDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>{visit.scheduledTime}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="truncate">{visit.district}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            Taxa:{" "}
            <strong className="text-zinc-900 dark:text-white">
              {visit.visitFee > 0 ? formatDb(visit.visitFee) : "Gratuita"}
            </strong>
          </span>
        </div>
      </div>

      {/* Localização liberada após aceite */}
      {visit.status !== "pendente" && visit.address && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-100/60 px-3 py-1.5 text-xs text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span>
            <strong>Local de Atendimento:</strong> {visit.address}, {visit.district}
          </span>
        </div>
      )}

      {/* -------------------- ESTADOS ESPECÍFICOS DO FLUXO -------------------- */}

      {/* 1. Pendente: Cliente aceita pagar taxa em custódia */}
      {visit.status === "pendente" && isClient && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/60 dark:bg-amber-950/40">
          <p className="text-xs text-amber-900 dark:text-amber-200">
            O profissional propôs uma visita presencial para diagnosticar o local. A taxa de
            deslocação (<strong>{formatDb(visit.visitFee)}</strong>) fica retida em custódia segura
            KONEKTA e será descontada do orçamento final se o serviço for fechado.
          </p>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={handleAcceptVisit}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-4 w-4" /> Aceitar Visita ({formatDb(visit.visitFee)} em
              Custódia)
            </button>
          </div>
        </div>
      )}

      {/* 2. Aguardando Visita: Prestador clica em Iniciar Deslocação */}
      {visit.status === "aguardando_visita" && isProviderMode && (
        <div className="mt-4 flex items-center justify-between gap-2 rounded-xl bg-white p-3 shadow-sm dark:bg-zinc-900">
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Visita confirmada pelo cliente. Inicie a viagem quando estiver a caminho.
          </div>
          <button
            onClick={handleStartWay}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700"
          >
            <Car className="h-4 w-4" /> Iniciar Deslocação 🚗
          </button>
        </div>
      )}

      {/* 3. A Caminho / Chegada: Prestador lança orçamento presencial */}
      {visit.status === "a_caminho" && isProviderMode && (
        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/40">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-indigo-950 dark:text-indigo-200">
                Você está em trânsito para o local ({visit.district}).
              </p>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                Assim que avaliar as instalações, lance o orçamento presencial para confirmação.
              </p>
            </div>
            <button
              onClick={() => setDeclareOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
            >
              <FileText className="h-4 w-4" /> Lançar Orçamento Presencial
            </button>
          </div>
        </div>
      )}

      {/* 4. Orçamento Lançado - Camada de Confirmação do Cliente */}
      {visit.status === "confirmacao_cliente" && (
        <div className="mt-4 rounded-xl border-2 border-emerald-300 bg-white p-4 shadow-md dark:border-emerald-700 dark:bg-zinc-900">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <Scale className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Validação de Orçamento Presencial (2ª Camada)
            </span>
          </div>

          <div className="mt-2 rounded-lg bg-zinc-50 p-3 text-xs dark:bg-zinc-800/80">
            <div className="flex items-baseline justify-between">
              <span className="text-zinc-600 dark:text-zinc-400">
                Valor Declarado pelo Técnico:
              </span>
              <strong className="text-base text-zinc-950 dark:text-white">
                {formatDb(visit.providerDeclaredAmount || 0)}
              </strong>
            </div>
            {visit.diagnosticReport && (
              <p className="mt-2 border-t border-zinc-200 pt-2 italic text-zinc-700 dark:border-zinc-700 dark:text-zinc-300">
                "{visit.diagnosticReport}"
              </p>
            )}
          </div>

          {isClient ? (
            <div className="mt-4">
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                O prestador informou que o valor combinado para a execução completa é de{" "}
                <strong>{formatDb(visit.providerDeclaredAmount || 0)}</strong>. Este valor está
                correto?
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => handleClientConfirmBudget(true)}
                  className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700"
                >
                  ✓ Sim, está correto ({formatDb(visit.providerDeclaredAmount || 0)})
                </button>
                <button
                  onClick={() => handleClientConfirmBudget(false)}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                >
                  Não, o valor é outro
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              ⏳ Aguardando validação do cliente no telemóvel dele. O sistema verificará a
              conformidade do valor com o preço médio da categoria.
            </div>
          )}
        </div>
      )}

      {/* 5. Em Moderação Antifraude */}
      {visit.status === "em_moderacao" && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/90 p-4 text-xs dark:border-amber-900/80 dark:bg-amber-950/60">
          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Disputa de Valores em Análise na Moderação KONEKTA</span>
          </div>
          <p className="mt-1.5 text-amber-800 dark:text-amber-300">
            O valor informado pelo cliente (
            <strong>{formatDb(visit.clientDeclaredAmount || 0)}</strong>) diverge do informado pelo
            prestador (<strong>{formatDb(visit.providerDeclaredAmount || 0)}</strong>) em{" "}
            <strong>{visit.divergencePct}%</strong>. A equipe de suporte está avaliando o caso com
            base no histórico e evidências.
          </p>
          <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
            <span>ID da Disputa: {visit.disputeId || "DISP-8492"}</span>
            <span>•</span>
            <span>Status: Congelado para Proteção de Ambos</span>
          </div>
        </div>
      )}

      {/* 6. Orçamento Aprovado & Opção de Pagamento em Dinheiro c/ OTP */}
      {visit.status === "visita_paga_e_aprovada" && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                Orçamento Validado:{" "}
                {formatDb(visit.finalAgreedAmount || visit.providerDeclaredAmount || 0)}
              </span>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              Pronto para Execução
            </span>
          </div>

          {/* Se o cliente for pagar em dinheiro presencial */}
          <div className="mt-3 rounded-lg border border-emerald-200/80 bg-white p-3 dark:border-emerald-800/60 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4 text-emerald-600" />
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Pagamento Presencial em Dinheiro (à mão)
                </span>
              </div>
            </div>

            {isClient ? (
              <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-100/50 p-2.5 dark:bg-emerald-950/60">
                <div>
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    Seu Código de Validação OTP para entregar ao técnico:
                  </div>
                  <div className="mt-0.5 text-lg font-mono font-bold tracking-widest text-emerald-900 dark:text-emerald-200">
                    {showOtp ? visit.completionOtp || "8492" : "••••"}
                  </div>
                </div>
                <button
                  onClick={() => setShowOtp(!showOtp)}
                  className="rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-200"
                >
                  {showOtp ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-zinc-600 dark:text-zinc-400">
                  Recebeu em dinheiro no local? Solicite o OTP de 4 dígitos do cliente.
                </span>
                <button
                  onClick={() => setOtpModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Validar OTP & Emitir Recibo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Concluído com Recibo Digital */}
      {visit.status === "concluido" && visit.paymentMethod === "dinheiro_em_mao" && (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-3.5 text-xs shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                Recibo Digital KONEKTA #{visit.id}
              </span>
            </div>
            <span className="font-bold text-emerald-600">
              {formatDb(visit.declaredCashAmount || visit.finalAgreedAmount || 0)} (Pago em
              Dinheiro)
            </span>
          </div>

          {visit.cashReceiptContested ? (
            <div className="mt-2 rounded-lg bg-amber-50 p-2 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
              ⚠️ Recibo contestado pelo cliente: "{visit.cashContestReason}" (Em análise pelo
              suporte)
            </div>
          ) : (
            isClient && (
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => setContestOpen(true)}
                  className="text-[11px] text-zinc-500 underline hover:text-rose-600 dark:text-zinc-400"
                >
                  Contestar valor do recibo
                </button>
              </div>
            )
          )}
        </div>
      )}

      {/* MODAL: Prestador lança orçamento */}
      {declareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Lançar Orçamento Presencial no Terreno
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Informe o valor total avaliado para o serviço. O cliente receberá a confirmação em
              tempo real no chat.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Valor Total do Serviço (Db / STN) *
                </label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    value={budgetInput}
                    onChange={(e) => setBudgetInput(e.target.value)}
                    placeholder="Ex: 1200"
                    className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-400">
                    Db
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Diagnóstico Técnico & Observações do Local *
                </label>
                <textarea
                  rows={3}
                  value={reportInput}
                  onChange={(e) => setReportInput(e.target.value)}
                  placeholder="Ex: Identificada necessidade de substituição de 4m de canos e troca da junta principal..."
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setDeclareOpen(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeclareBudget}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
              >
                Enviar para o Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cliente corrige o valor */}
      {clientCorrectionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Informar Valor Combinado Real
              </h3>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              O prestador lançou <strong>{formatDb(visit.providerDeclaredAmount || 0)}</strong>.
              Informe o valor exato acordado entre vocês no local. O sistema validará
              automaticamente em conformidade com as taxas de mercado de São Tomé.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Valor Real Combinado (Db) *
                </label>
                <input
                  type="number"
                  value={clientRealAmount}
                  onChange={(e) => setClientRealAmount(e.target.value)}
                  placeholder="Ex: 850"
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Motivo da divergência (Opcional)
                </label>
                <input
                  type="text"
                  value={clientReason}
                  onChange={(e) => setClientReason(e.target.value)}
                  placeholder="Ex: Combinamos não incluir a pintura final hoje"
                  className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setClientCorrectionOpen(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleClientSubmitCorrection}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
              >
                Submeter Validação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Prestador valida OTP em dinheiro */}
      {otpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <div className="flex items-center gap-2 text-emerald-600">
              <KeyRound className="h-5 w-5" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Validar Recebimento em Dinheiro
              </h3>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Solicite ao cliente o código OTP de 4 dígitos exibido na tela dele para comprovar o
              recebimento presencial.
            </p>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Código OTP de 4 Dígitos *
              </label>
              <input
                type="text"
                maxLength={4}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                placeholder="Ex: 8492"
                className="mt-1 w-full text-center font-mono text-2xl font-bold tracking-widest rounded-xl border border-zinc-300 bg-white py-2 text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setOtpModalOpen(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleValidateCashOtp}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700"
              >
                Validar & Emitir Recibo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Contestar Recibo */}
      {contestOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-zinc-900">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Contestar Recibo de Pagamento
            </h3>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Se o valor constante no recibo for diferente do que você entregou em dinheiro ao
              técnico, detalhe abaixo para a moderação KONEKTA.
            </p>
            <textarea
              rows={3}
              value={contestReason}
              onChange={(e) => setContestReason(e.target.value)}
              placeholder="Ex: Paguei 500 Db mas no recibo consta outro montante..."
              className="mt-3 w-full rounded-xl border border-zinc-300 bg-white p-2.5 text-xs text-zinc-900 shadow-sm focus:border-emerald-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setContestOpen(false)}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleContestReceipt}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-700"
              >
                Enviar Contestação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
