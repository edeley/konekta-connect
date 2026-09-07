import { useState, useRef } from "react";
import {
  Image as ImageIcon,
  Camera,
  Upload,
  Trash2,
  X,
  CheckCircle2,
  Eye,
  RefreshCw,
} from "lucide-react";
import { type PortfolioBeforeAfterItem } from "@/types/provider-profile";
import { BeforeAfterSlider } from "./BeforeAfterSlider";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PortfolioBeforeAfterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveItem: (item: PortfolioBeforeAfterItem) => void;
  initialItem?: PortfolioBeforeAfterItem;
}

export function PortfolioBeforeAfterModal({
  isOpen,
  onClose,
  onSaveItem,
  initialItem,
}: PortfolioBeforeAfterModalProps) {
  const [title, setTitle] = useState(initialItem?.title || "");
  const [category, setCategory] = useState(initialItem?.category || "Eletricista");
  const [description, setDescription] = useState(initialItem?.description || "");
  const [beforeUrl, setBeforeUrl] = useState<string | null>(initialItem?.beforeImageUrl || null);
  const [afterUrl, setAfterUrl] = useState<string | null>(initialItem?.afterImageUrl || null);
  const [showPreview, setShowPreview] = useState(false);

  // File input refs for "Antes"
  const beforeCameraRef = useRef<HTMLInputElement | null>(null);
  const beforeGalleryRef = useRef<HTMLInputElement | null>(null);

  // File input refs for "Depois"
  const afterCameraRef = useRef<HTMLInputElement | null>(null);
  const afterGalleryRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (url: string) => void,
    sideLabel: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(`O ficheiro para a foto "${sideLabel}" deve ser uma imagem válida.`);
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error(`A imagem "${sideLabel}" excede o tamanho máximo de 8MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setter(result);
        toast.success(`Foto ${sideLabel} carregada com sucesso!`);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Por favor insira um título descritivo para o trabalho.");
      return;
    }
    if (!beforeUrl || !afterUrl) {
      toast.error("Por favor adicione as duas fotos: a de ANTES e a de DEPOIS.");
      return;
    }

    const newItem: PortfolioBeforeAfterItem = {
      id: initialItem?.id || `port-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim(),
      beforeImageUrl: beforeUrl,
      afterImageUrl: afterUrl,
      completedAt: "Trabalho Recente",
      rating: 5.0,
    };

    onSaveItem(newItem);
    toast.success("Trabalho de Antes e Depois adicionado ao seu portfólio!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Hidden file inputs for ANTES */}
        <input
          ref={beforeCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e, setBeforeUrl, "Antes")}
        />
        <input
          ref={beforeGalleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e, setBeforeUrl, "Antes")}
        />

        {/* Hidden file inputs for DEPOIS */}
        <input
          ref={afterCameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFileSelect(e, setAfterUrl, "Depois")}
        />
        <input
          ref={afterGalleryRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFileSelect(e, setAfterUrl, "Depois")}
        />

        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ImageIcon size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {initialItem ? "Editar Trabalho" : "Novo Trabalho no Portfólio"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Tire foto no local ou escolha da galeria do seu telemóvel
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

        {/* CORPO */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TÍTULO E CATEGORIA */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-xs font-bold text-foreground">Título do Trabalho *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Instalação de Quadro Elétrico Residencial"
                className="w-full h-11 px-3.5 rounded-2xl bg-muted/60 border border-border text-sm font-medium focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-11 px-3 rounded-2xl bg-muted/60 border border-border text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
              >
                <option value="Eletricista">Eletricista</option>
                <option value="Canalizador">Canalizador</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Pintura">Pintura</option>
                <option value="Ar Condicionado">Ar Condicionado</option>
                <option value="Construção">Construção</option>
              </select>
            </div>
          </div>

          {/* DESCRIÇÃO */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-foreground">Breve Explicação do Serviço</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Descreva o que foi realizado (ex: substituição de fiação antiga por disjuntores modernos de segurança)..."
              className="w-full p-3 rounded-2xl bg-muted/60 border border-border text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* SELEÇÃO DAS IMAGENS ANTES E DEPOIS - CÂMERA OU GALERIA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* FOTO ANTES */}
            <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-neutral-800 dark:bg-neutral-200" />
                  Foto 1: ANTES (Inicial)
                </span>
                {beforeUrl && (
                  <button
                    type="button"
                    onClick={() => setBeforeUrl(null)}
                    className="text-[10px] text-destructive hover:underline font-bold"
                  >
                    Remover
                  </button>
                )}
              </div>

              {beforeUrl ? (
                <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-border bg-black/10">
                  <img src={beforeUrl} alt="Foto Antes" className="size-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded bg-black/40">
                      ✓ Foto Carregada
                    </span>
                    <button
                      type="button"
                      onClick={() => beforeGalleryRef.current?.click()}
                      className="text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      Trocar Foto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center space-y-3 bg-card/60">
                  <div className="size-10 rounded-xl bg-muted grid place-items-center mx-auto text-muted-foreground">
                    <Camera size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Como estava antes?</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Tire uma foto ou carregue da galeria
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => beforeCameraRef.current?.click()}
                      className="h-9 px-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-primary/90 transition cursor-pointer shadow-2xs"
                    >
                      <Camera size={13} />
                      <span>Câmera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => beforeGalleryRef.current?.click()}
                      className="h-9 px-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer border border-border"
                    >
                      <Upload size={13} />
                      <span>Galeria</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* FOTO DEPOIS */}
            <div className="p-3.5 rounded-2xl border border-primary/30 bg-primary/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-primary" />
                  Foto 2: DEPOIS (Final)
                </span>
                {afterUrl && (
                  <button
                    type="button"
                    onClick={() => setAfterUrl(null)}
                    className="text-[10px] text-destructive hover:underline font-bold"
                  >
                    Remover
                  </button>
                )}
              </div>

              {afterUrl ? (
                <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-primary/30 bg-black/10">
                  <img src={afterUrl} alt="Foto Depois" className="size-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded bg-emerald-700/80">
                      ✓ Resultado Final
                    </span>
                    <button
                      type="button"
                      onClick={() => afterGalleryRef.current?.click()}
                      className="text-[10px] font-bold text-white bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      Trocar Foto
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-primary/30 rounded-xl p-4 text-center space-y-3 bg-card/60">
                  <div className="size-10 rounded-xl bg-primary/15 text-primary grid place-items-center mx-auto">
                    <Camera size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Como ficou o resultado?</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Mostre a qualidade do serviço terminado
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => afterCameraRef.current?.click()}
                      className="h-9 px-2 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-primary/90 transition cursor-pointer shadow-2xs"
                    >
                      <Camera size={13} />
                      <span>Câmera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => afterGalleryRef.current?.click()}
                      className="h-9 px-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer border border-border"
                    >
                      <Upload size={13} />
                      <span>Galeria</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PRÉVIA INTERATIVA INSTANTÂNEA */}
          {showPreview && beforeUrl && afterUrl && (
            <div className="pt-2 border-t border-border/80 space-y-2 animate-fadeIn">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Eye size={13} className="text-primary" /> Prévia do Comparador Antes vs. Depois
              </h4>
              <BeforeAfterSlider
                beforeImageUrl={beforeUrl}
                afterImageUrl={afterUrl}
                title={title || "Prévia do Trabalho"}
                category={category}
                description={description}
              />
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-border bg-card flex items-center justify-between gap-3 shrink-0">
          {beforeUrl && afterUrl ? (
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-3.5 h-11 rounded-2xl bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-muted/80 transition cursor-pointer"
            >
              <Eye size={14} className="text-primary" />
              <span>{showPreview ? "Ocultar Comparador" : "Ver Comparador"}</span>
            </button>
          ) : (
            <span className="text-[11px] text-muted-foreground">
              Adicione ambas as fotos para ver o comparador
            </span>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-2xl bg-muted text-muted-foreground text-xs font-bold hover:text-foreground transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 h-11 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-primary/90 transition cursor-pointer active:scale-98"
            >
              <CheckCircle2 size={16} />
              <span>Guardar Trabalho</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
