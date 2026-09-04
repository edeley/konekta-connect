import { useRef, useState } from "react";
import { Upload, FileText, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ProofUploadProps {
  value?: string;
  fileName?: string;
  onChange: (dataUrl: string | undefined, fileName?: string) => void;
  label?: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

export function ProofUpload({ value, fileName, onChange, label }: ProofUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  function handleFile(file?: File) {
    if (!file) return;
    const ok =
      file.type.startsWith("image/") || file.type === "application/pdf";
    if (!ok) {
      toast.error("Envie uma imagem (foto do recibo) ou um ficheiro PDF.");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("O comprovativo deve ter no máximo 5 MB.");
      return;
    }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setLoading(false);
      onChange(String(reader.result), file.name);
    };
    reader.onerror = () => {
      setLoading(false);
      toast.error("Não foi possível ler o ficheiro. Tente novamente.");
    };
    reader.readAsDataURL(file);
  }

  const isImage = value?.startsWith("data:image");

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-foreground block">
        {label || "Comprovativo / Recibo de Pagamento *"}
      </label>

      {!value ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full p-4 rounded-2xl border-2 border-dashed border-border bg-muted/40 hover:bg-muted/70 transition cursor-pointer flex flex-col items-center gap-1.5 text-center"
        >
          <Upload size={18} className="text-primary" />
          <span className="text-xs font-bold text-foreground">
            {loading ? "A carregar ficheiro..." : "Anexar foto do recibo ou PDF"}
          </span>
          <span className="text-[10px] text-muted-foreground">
            Obrigatório · JPG, PNG ou PDF até 5 MB
          </span>
        </button>
      ) : (
        <div className="p-2.5 rounded-2xl border border-emerald-500/40 bg-emerald-500/[0.06] flex items-center gap-2.5">
          {isImage ? (
            <img
              src={value}
              alt="Comprovativo de pagamento"
              className="size-12 rounded-xl object-cover border border-border"
            />
          ) : (
            <div className="size-12 rounded-xl bg-muted grid place-items-center text-muted-foreground">
              <FileText size={18} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-foreground truncate">
              {fileName || "Comprovativo anexado"}
            </p>
            <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle2 size={11} /> Pronto para validação do administrador
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(undefined, undefined)}
            className="size-8 rounded-full bg-muted grid place-items-center text-muted-foreground hover:text-foreground cursor-pointer shrink-0"
            aria-label="Remover comprovativo"
          >
            <X size={14} />
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
