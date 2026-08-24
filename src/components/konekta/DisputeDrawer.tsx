import { useState, useRef } from "react";
import {
  AlertTriangle,
  Camera,
  X,
  ShieldAlert,
  Loader2,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
} from "lucide-react";
import { BottomSheet } from "./kit";
import { Button } from "@/components/ui/button";
import { OrderService } from "@/lib/order-service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DisputeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  clientId: string;
  onDisputeOpened?: () => void;
}

const DISPUTE_REASONS = [
  "Qualidade insatisfatória / trabalho mal executado",
  "Serviço não foi finalizado pelo técnico",
  "Técnico não compareceu no horário combinado",
  "Danos a equipamentos ou património durante o serviço",
  "Cobrança indevida de valores não acordados",
  "Outro problema operacional",
];

export function DisputeDrawer({
  isOpen,
  onClose,
  orderId,
  clientId,
  onDisputeOpened,
}: DisputeDrawerProps) {
  const [selectedReason, setSelectedReason] = useState(DISPUTE_REASONS[0]);
  const [description, setDescription] = useState("");
  const [evidencePhotos, setEvidencePhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Apenas fotos são permitidas como prova.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const res = event.target?.result as string;
        if (res) {
          setEvidencePhotos((prev) => [...prev, res]);
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemovePhoto = (index: number) => {
    setEvidencePhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitDispute = async () => {
    if (!description.trim()) {
      toast.error("Por favor descreva o motivo da contestação em detalhe.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await OrderService.openDispute({
        orderId,
        openedByUserId: clientId,
        reason: selectedReason,
        description: description.trim(),
        evidencePhotos,
      });

      if (res.success) {
        toast.success(
          "Disputa registada com sucesso. Os fundos em custódia foram congelados para auditoria.",
        );
        onDisputeOpened?.();
        onClose();
      }
    } catch {
      toast.error("Erro ao abrir disputa. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose}>
      <div id={`dispute-drawer-${orderId}`} className="space-y-4 max-w-lg mx-auto">
        {/* CABEÇALHO */}
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-destructive/10 text-destructive grid place-items-center shrink-0">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h3 className="text-base font-black text-foreground">Abrir Disputa & Mediação</h3>
            <p className="text-xs text-muted-foreground">
              Pedido <span className="font-mono font-bold">{orderId}</span> · Congelar Custódia
            </p>
          </div>
        </div>

        {/* ALERTA DE CONGELAMENTO */}
        <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-3.5 flex items-start gap-2.5">
          <AlertTriangle size={17} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-xs text-destructive font-medium leading-relaxed">
            Ao acionar a mediação, a{" "}
            <strong>libertação do pagamento é bloqueada de imediato</strong>. A equipa de suporte
            KONEKTA em São Tomé irá contactar ambas as partes e analisar as evidências.
          </p>
        </div>

        {/* SELEÇÃO DO MOTIVO */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">
            Motivo Principal da Contestação:
          </label>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {DISPUTE_REASONS.map((reason) => (
              <label
                key={reason}
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition",
                  selectedReason === reason
                    ? "border-destructive bg-destructive/5 font-bold text-foreground ring-1 ring-destructive/30"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50",
                )}
              >
                <input
                  type="radio"
                  name="dispute_reason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="accent-destructive size-4"
                />
                <span className="truncate">{reason}</span>
              </label>
            ))}
          </div>
        </div>

        {/* DESCRIÇÃO DETALHADA */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-foreground block">
            Descrição dos Fatos & Evidências:
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Explique o que aconteceu, eventuais acordos prévios e o resultado final no local..."
            className="w-full rounded-2xl bg-muted/40 border border-border p-3 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-destructive transition"
          />
        </div>

        {/* UPLOAD DE PROVAS FOTOGRÁFICAS */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground block">
            Fotos de Comprovação (Opcional):
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoUpload}
            className="hidden"
          />

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="h-14 px-3.5 rounded-xl border border-dashed border-border bg-card hover:bg-muted text-xs font-bold text-muted-foreground flex items-center gap-2 transition cursor-pointer"
            >
              <Camera size={16} />
              <span>Anexar Foto</span>
            </button>

            {evidencePhotos.map((photo, index) => (
              <div
                key={index}
                className="relative size-14 rounded-xl border border-border overflow-hidden group shadow-2xs"
              >
                <img
                  src={photo}
                  alt={`Evidência ${index + 1}`}
                  className="size-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(index)}
                  className="absolute top-1 right-1 size-5 rounded-full bg-black/70 text-white grid place-items-center"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* BOTÕES DE AÇÃO */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-11 px-4 rounded-xl text-xs font-bold"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmitDispute}
            disabled={isSubmitting || !description.trim()}
            className="h-11 px-5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <>
                <ShieldAlert size={15} />
                <span>Congelar Custódia & Abrir Disputa</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
