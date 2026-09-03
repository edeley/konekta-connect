import { useState } from "react";
import { Image as ImageIcon, Plus, Trash2, X, CheckCircle2, Upload, Eye } from "lucide-react";
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

const PRESET_BEFORE_IMAGES = [
  {
    label: "Quadro Antigo / Fios",
    url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Fuga / Parede Danificada",
    url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Sala / Teto Escuro",
    url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Obra / Sujeira",
    url: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&auto=format&fit=crop&q=80",
  },
];

const PRESET_AFTER_IMAGES = [
  {
    label: "Quadro Moderno Organizado",
    url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Canalização & Louça Nova",
    url: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Iluminação LED Impecável",
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80",
  },
  {
    label: "Ambiente Limpo e Brilhante",
    url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&auto=format&fit=crop&q=80",
  },
];

export function PortfolioBeforeAfterModal({
  isOpen,
  onClose,
  onSaveItem,
  initialItem,
}: PortfolioBeforeAfterModalProps) {
  const [title, setTitle] = useState(initialItem?.title || "");
  const [category, setCategory] = useState(initialItem?.category || "Eletricista");
  const [description, setDescription] = useState(initialItem?.description || "");
  const [beforeUrl, setBeforeUrl] = useState(
    initialItem?.beforeImageUrl || PRESET_BEFORE_IMAGES[0].url,
  );
  const [afterUrl, setAfterUrl] = useState(
    initialItem?.afterImageUrl || PRESET_AFTER_IMAGES[0].url,
  );
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!title.trim()) {
      toast.error("Por favor insira um título descritivo para o trabalho.");
      return;
    }
    if (!beforeUrl || !afterUrl) {
      toast.error("Por favor adicione as duas fotos: Antes e Depois.");
      return;
    }

    const newItem: PortfolioBeforeAfterItem = {
      id: initialItem?.id || `port-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim(),
      beforeImageUrl: beforeUrl,
      afterImageUrl: afterUrl,
      completedAt: "Recentemente",
      rating: 5.0,
    };

    onSaveItem(newItem);
    toast.success("Trabalho de Antes e Depois adicionado ao seu portfólio!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
      <div className="w-full max-w-xl bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* HEADER */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ImageIcon size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">
                {initialItem ? "Editar Trabalho" : "Novo Trabalho no Portfólio"}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Destaque a transformação visual com o comparador Antes vs. Depois
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
              <label className="text-xs font-bold text-foreground">Título do Serviço</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Reforma de Quadro Elétrico Residencial"
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
            <label className="text-xs font-bold text-foreground">Descrição do Trabalho</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Explique o desafio encontrado e como foi resolvido com rigor..."
              className="w-full p-3 rounded-2xl bg-muted/60 border border-border text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          {/* SELEÇÃO DAS IMAGENS ANTES E DEPOIS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* FOTO ANTES */}
            <div className="space-y-2 p-3 rounded-2xl border border-border/80 bg-muted/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1">
                  <span className="size-2 rounded-full bg-neutral-900 dark:bg-white" />
                  Foto: ANTES
                </span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  Estado Inicial
                </span>
              </div>

              <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-border bg-muted">
                <img src={beforeUrl} alt="Prévia Antes" className="size-full object-cover" />
              </div>

              {/* Presets rápidos */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-muted-foreground">
                  Escolher Foto de Exemplo:
                </span>
                <div className="flex flex-wrap gap-1">
                  {PRESET_BEFORE_IMAGES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBeforeUrl(p.url)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-semibold border transition cursor-pointer",
                        beforeUrl === p.url
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:text-foreground",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* FOTO DEPOIS */}
            <div className="space-y-2 p-3 rounded-2xl border border-primary/30 bg-primary/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <span className="size-2 rounded-full bg-primary" />
                  Foto: DEPOIS
                </span>
                <span className="text-[10px] text-primary font-bold">Resultado Final</span>
              </div>

              <div className="relative aspect-4/3 rounded-xl overflow-hidden border border-primary/30 bg-muted">
                <img src={afterUrl} alt="Prévia Depois" className="size-full object-cover" />
              </div>

              {/* Presets rápidos */}
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-bold text-muted-foreground">
                  Escolher Foto de Exemplo:
                </span>
                <div className="flex flex-wrap gap-1">
                  {PRESET_AFTER_IMAGES.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAfterUrl(p.url)}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-semibold border transition cursor-pointer",
                        afterUrl === p.url
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-muted-foreground border-border hover:text-foreground",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* PRÉVIA INTERATIVA INSTANTÂNEA */}
          {showPreview && (
            <div className="pt-2 border-t border-border/80 space-y-2 animate-fadeIn">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Eye size={13} className="text-primary" /> Prévia do Slider Interativo
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
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3.5 h-11 rounded-2xl bg-muted text-foreground text-xs font-bold flex items-center gap-1.5 hover:bg-muted/80 transition cursor-pointer"
          >
            <Eye size={14} className="text-primary" />
            <span>{showPreview ? "Ocultar Prévia" : "Ver Prévia"}</span>
          </button>

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
              className="px-5 h-11 rounded-2xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-primary/90 transition cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>Salvar Trabalho</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
