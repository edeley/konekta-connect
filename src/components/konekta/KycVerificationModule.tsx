import { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Upload,
  Camera,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Info,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { type KycStatus, type ProviderKycDocument } from "@/types/provider-profile";
import { store, useStore } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface KycVerificationModuleProps {
  kycDocument?: ProviderKycDocument;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (newStatus: KycStatus) => void;
}

export function KycVerificationModule({
  kycDocument,
  isOpen,
  onClose,
  onStatusChange,
}: KycVerificationModuleProps) {
  const user = useStore((s) => s.user);
  const myProfile = useStore((s) => s.providerProfile);

  const currentStatus: KycStatus =
    myProfile?.status === "aprovado"
      ? "VERIFIED"
      : myProfile?.status === "em_analise"
        ? "PENDING_REVIEW"
        : myProfile?.status === "rejeitado"
          ? "REJECTED"
          : kycDocument?.status || "NOT_SUBMITTED";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [docType, setDocType] = useState<"bi_stp" | "passaporte" | "carta_conducao">("bi_stp");
  const [idNumber, setIdNumber] = useState(myProfile?.documents?.idNumber || "STP-984214-B");
  const [frontDoc, setFrontDoc] = useState<string | null>(
    kycDocument?.frontDocUrl ||
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
  );
  const [backDoc, setBackDoc] = useState<string | null>(
    kycDocument?.backDocUrl ||
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80",
  );
  const [selfie, setSelfie] = useState<string | null>(
    kycDocument?.selfieUrl || user?.avatar || null,
  );
  const [proofAddress, setProofAddress] = useState<string | null>(
    kycDocument?.residenceProofUrl ||
      "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmitDocuments = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      store.updateProviderProfile({
        status: "em_analise",
        documents: {
          idNumber,
          nif: "NIF-STP-102938",
          selfieOk: true,
        },
      });
      if (onStatusChange) onStatusChange("PENDING_REVIEW");
      toast.success("Documentos submetidos com sucesso! A equipa KONEKTA irá analisar em até 24h.");
      onClose();
    }, 800);
  };

  const handleSimulateInstantApprove = () => {
    store.updateProviderProfile({
      status: "aprovado",
      documents: {
        idNumber,
        nif: "NIF-STP-102938",
        selfieOk: true,
      },
    });
    if (onStatusChange) onStatusChange("VERIFIED");
    toast.success("Selo de Verificação KYC aprovado com sucesso!");
    onClose();
  };

  const handleSimulateReject = () => {
    store.updateProviderProfile({
      status: "rejeitado",
    });
    if (onStatusChange) onStatusChange("REJECTED");
    toast.error("Documentos marcados como pendentes de correção.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Verificação de Identidade (KYC)</h3>
              <p className="text-[11px] text-muted-foreground">
                Selo de Profissional Checado KONEKTA
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* PROGRESSO EM PASSOS */}
        <div className="px-5 pt-3 pb-2 border-b border-border/50 bg-card/60 flex items-center justify-between shrink-0">
          {[
            { n: 1, label: "Documento" },
            { n: 2, label: "Selfie Facial" },
            { n: 3, label: "Residência & Envio" },
          ].map((s) => (
            <button
              key={s.n}
              type="button"
              onClick={() => setStep(s.n as 1 | 2 | 3)}
              className="flex items-center gap-1.5 cursor-pointer"
            >
              <span
                className={cn(
                  "size-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-all",
                  step === s.n
                    ? "bg-primary text-primary-foreground shadow-xs scale-105"
                    : step > s.n
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {step > s.n ? "✓" : s.n}
              </span>
              <span
                className={cn(
                  "text-xs font-semibold hidden sm:inline",
                  step === s.n ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* CORPO ROLÁVEL */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* PASSO 1: DOCUMENTO DE IDENTIDADE */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Tipo de Documento Oficial (São Tomé e Príncipe)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "bi_stp", label: "Bilhete de Identidade (B.I.)" },
                    { id: "passaporte", label: "Passaporte Nacional" },
                    { id: "carta_conducao", label: "Carta de Condução" },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDocType(d.id as "bi_stp" | "passaporte" | "carta_conducao")}
                      className={cn(
                        "p-2.5 rounded-2xl border text-center text-xs font-bold transition cursor-pointer",
                        docType === d.id
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Número do Documento / Identificação
                </label>
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Ex: STP-102938-A"
                  className="w-full h-11 px-3.5 rounded-2xl bg-muted/60 border border-border text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
                />
              </div>

              {/* FRENTE E VERSO */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Frente do Documento
                  </span>
                  <div className="relative aspect-4/3 rounded-2xl border-2 border-dashed border-border bg-muted/40 overflow-hidden flex flex-col items-center justify-center p-2 text-center group hover:border-primary/60 transition">
                    {frontDoc ? (
                      <>
                        <img
                          src={frontDoc}
                          alt="Frente"
                          className="size-full object-cover rounded-xl"
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/70 text-[9px] text-white font-bold">
                          ✓ Carregado
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-muted-foreground mb-1" />
                        <span className="text-[10px] font-bold text-foreground">Anexar Frente</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Verso do Documento
                  </span>
                  <div className="relative aspect-4/3 rounded-2xl border-2 border-dashed border-border bg-muted/40 overflow-hidden flex flex-col items-center justify-center p-2 text-center group hover:border-primary/60 transition">
                    {backDoc ? (
                      <>
                        <img
                          src={backDoc}
                          alt="Verso"
                          className="size-full object-cover rounded-xl"
                        />
                        <span className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded-md bg-black/70 text-[9px] text-white font-bold">
                          ✓ Carregado
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload size={20} className="text-muted-foreground mb-1" />
                        <span className="text-[10px] font-bold text-foreground">Anexar Verso</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PASSO 2: SELFIE FACIAL */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn text-center">
              <div className="max-w-xs mx-auto space-y-2">
                <div className="size-28 mx-auto rounded-full border-4 border-primary/30 bg-muted overflow-hidden relative shadow-inner">
                  {selfie ? (
                    <img src={selfie} alt="Selfie" className="size-full object-cover" />
                  ) : (
                    <div className="size-full flex flex-col items-center justify-center text-muted-foreground">
                      <Camera size={32} />
                    </div>
                  )}
                  <span className="absolute bottom-1 inset-x-0 bg-black/60 text-[9px] text-white font-bold py-0.5">
                    Biometria Facial
                  </span>
                </div>
                <h4 className="text-sm font-bold text-foreground">
                  Validação de Vivacidade Facial
                </h4>
                <p className="text-xs text-muted-foreground">
                  Tire uma foto clara do seu rosto em local bem iluminado, sem óculos de sol ou
                  boné.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/50 border border-border/80 text-left flex items-start gap-2.5">
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  A foto selfie é comparada com a foto do seu bilhete de identidade para assegurar
                  que a conta pertence de facto a si.
                </p>
              </div>
            </div>
          )}

          {/* PASSO 3: COMPROVANTE DE RESIDÊNCIA E RESUMO */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Comprovante de Residência em São Tomé
                </label>
                <p className="text-[11px] text-muted-foreground">
                  Fatura recente da EMAE, atestado da junta de freguesia ou contrato de
                  arrendamento.
                </p>
                <div className="p-3 rounded-2xl border border-dashed border-border bg-muted/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileCheck size={20} className="text-primary" />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        Fatura_EMAE_Agosto2026.pdf
                      </p>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        1.2 MB · Verificado
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-[10px] font-bold">
                    Anexado
                  </span>
                </div>
              </div>

              {/* RESUMO DO ESTADO ATUAL */}
              <div className="p-3.5 rounded-2xl bg-card border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Status Atual:</span>
                  <span
                    className={cn(
                      "font-bold uppercase text-[10px] px-2 py-0.5 rounded-full",
                      currentStatus === "VERIFIED"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : currentStatus === "PENDING_REVIEW"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {currentStatus === "VERIFIED"
                      ? "Verificado (Aprovado)"
                      : currentStatus === "PENDING_REVIEW"
                        ? "Em Análise"
                        : currentStatus === "REJECTED"
                          ? "Rejeitado"
                          : "Não Submetido"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Tempo estimado de análise:</span>
                  <span className="font-semibold text-foreground">Menos de 24 horas</span>
                </div>
              </div>

              {/* SIMULADOR PARA DESENVOLVIMENTO / TESTES RÁPIDOS */}
              <div className="pt-2 border-t border-border/80 space-y-1.5">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">
                  Atalhos de Demonstração (Simulação):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateInstantApprove}
                    className="h-9 px-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <CheckCircle2 size={13} /> Aprovar Imediato (KYC)
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateReject}
                    className="h-9 px-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <AlertTriangle size={13} /> Simular Rejeição
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER COM BOTÕES DE AÇÃO */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3 shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : 1))}
              className="px-4 h-11 rounded-2xl bg-muted text-foreground text-xs font-bold hover:bg-muted/80 transition cursor-pointer"
            >
              Voltar
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-2xl bg-muted text-muted-foreground text-xs font-bold hover:text-foreground transition cursor-pointer"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : 3))}
              className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1 shadow-md hover:bg-primary/90 transition cursor-pointer"
            >
              <span>Avançar</span>
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleSubmitDocuments}
              className="flex-1 h-11 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-1.5 shadow-md hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>A enviar documentos...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Submeter para Validação</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function KycStatusBanner({
  status,
  onOpenKycModal,
  className,
}: {
  status: KycStatus;
  onOpenKycModal: () => void;
  className?: string;
}) {
  if (status === "VERIFIED") {
    return (
      <div
        className={cn(
          "rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3.5 flex items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300",
          className,
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold tracking-tight">
              Selo de Identidade Verificada Ativo
            </h4>
            <p className="text-[11px] opacity-90 truncate">
              Documentos e biometria aprovados pela KONEKTA STP.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenKycModal}
          className="text-[11px] font-bold underline hover:opacity-80 shrink-0 cursor-pointer"
        >
          Verificar Dados
        </button>
      </div>
    );
  }

  if (status === "PENDING_REVIEW") {
    return (
      <div
        className={cn(
          "rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-300",
          className,
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <Clock size={18} className="text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold">Documentos em Análise de Segurança</h4>
            <p className="text-[11px] opacity-90 truncate">
              A equipa KONEKTA está a conferir o B.I. e selfie.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenKycModal}
          className="px-3 py-1.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition shrink-0 cursor-pointer shadow-2xs"
        >
          Acompanhar
        </button>
      </div>
    );
  }

  if (status === "REJECTED") {
    return (
      <div
        className={cn(
          "rounded-2xl bg-destructive/10 border border-destructive/30 p-3.5 flex items-center justify-between gap-3 text-destructive",
          className,
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-8 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold">Verificação Pendente de Correção</h4>
            <p className="text-[11px] opacity-90 truncate">
              Foto do documento ilegível. Reenvie para desbloquear propostas.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenKycModal}
          className="px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 transition shrink-0 cursor-pointer shadow-2xs"
        >
          Reenviar
        </button>
      </div>
    );
  }

  // NOT_SUBMITTED
  return (
    <div
      className={cn(
        "rounded-2xl bg-primary/5 border border-primary/20 p-3.5 flex items-center justify-between gap-3 text-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="size-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <ShieldAlert size={18} />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs font-bold text-foreground">
            Obtenha o Selo "Profissional Checado"
          </h4>
          <p className="text-[11px] text-muted-foreground truncate">
            Valide a sua identidade para transmitir 100% de confiança aos clientes.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onOpenKycModal}
        className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shrink-0 cursor-pointer shadow-2xs"
      >
        Validar KYC
      </button>
    </div>
  );
}
