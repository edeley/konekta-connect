import { useState, useRef } from "react";
import { Camera, Plus, Trash2, Image as ImageIcon, X, Check, Upload, Layers } from "lucide-react";
import { BottomSheet } from "@/components/konekta/kit";
import { store, useStore, type PortfolioItem } from "@/lib/store";
import { validateFormSafety } from "@/lib/escrow";
import { toast } from "sonner";

interface PortfolioManagerModalProps {
  open: boolean;
  onClose: () => void;
}

// Exemplos de fotos de serviços de alta qualidade para sugestão rápida
const PRESET_SERVICE_PHOTOS = [
  {
    category: "Eletricidade",
    title: "Instalação de Quadro Elétrico Geral",
    description: "Quadro trifásico com disjuntores e proteção diferencial.",
    image:
      "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Eletricidade",
    title: "Iluminação LED Embutida",
    description: "Focos embutidos e acabamento moderno em teto falso.",
    image:
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Canalização",
    title: "Canalização & Termoacumulador",
    description: "Instalação de tubagem termofusão para água quente.",
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Canalização",
    title: "Montagem de Louças e Torneiras",
    description: "Instalação completa de casa de banho.",
    image:
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Pintura",
    title: "Pintura Interior Decorativa",
    description: "Pintura com tinta acetinada e acabamento uniforme.",
    image:
      "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
  },
  {
    category: "Limpeza",
    title: "Limpeza Pós-Obra Completa",
    description: "Higienização profunda de pisos, vidros e paredes.",
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
  },
];

export function PortfolioManagerModal({ open, onClose }: PortfolioManagerModalProps) {
  const user = useStore((s) => s.user);
  const profile = useStore((s) => s.providerProfile);
  const portfolio = profile?.portfolio ?? [];

  const [mode, setMode] = useState<"list" | "add">("list");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(profile?.category || "Serviços Gerais");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isProvider = user?.role === "prestador";

  if (open && !isProvider) {
    return (
      <BottomSheet
        open={open}
        onClose={onClose}
        title="Área Exclusiva de Prestadores"
        description="A gestão e publicação de portfólio de serviços é reservada exclusivamente a prestadores de serviços registados."
      >
        <div className="p-6 text-center space-y-3">
          <div className="size-12 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground">
            <ImageIcon size={24} />
          </div>
          <p className="text-sm font-semibold text-foreground">
            Apenas profissionais podem publicar portfólios
          </p>
          <p className="text-xs text-muted-foreground">
            Os clientes visualizam as fotos e trabalhos realizados nas páginas públicas dos
            prestadores.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
          >
            Entendido
          </button>
        </div>
      </BottomSheet>
    );
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setImagePreview(null);
    setCategory(profile?.category || "Serviços Gerais");
    setMode("list");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecione um arquivo de imagem (JPG, PNG)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem é muito grande (máximo 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleSelectPreset(preset: (typeof PRESET_SERVICE_PHOTOS)[0]) {
    setImagePreview(preset.image);
    setTitle(preset.title);
    setDescription(preset.description);
    setCategory(preset.category);
    toast.success("Foto selecionada! Pode personalizar o título e descrição.");
  }

  function handleSavePhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!imagePreview) {
      toast.error("Selecione ou carregue uma foto do serviço");
      return;
    }
    if (!title.trim()) {
      toast.error("Insira um título para identificar o trabalho");
      return;
    }

    const safety = validateFormSafety({
      "Título da Foto": title,
      "Descrição da Foto": description,
    });

    if (!safety.isValid) {
      toast.error(safety.reason || "Conteúdo não permitido no portfólio.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      store.addPortfolioItem({
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        image: imagePreview,
      });

      setIsSubmitting(false);
      resetForm();
    }, 300);
  }

  function handleDeleteItem(item: PortfolioItem) {
    if (confirm(`Remover "${item.title}" do seu portfólio?`)) {
      store.removePortfolioItem(item.id);
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title="Portfólio & Fotos de Serviços"
      description="Mostre a qualidade dos seus serviços aos clientes com fotos reais dos seus trabalhos."
    >
      <div className="space-y-4 pb-6">
        {mode === "list" ? (
          <>
            {/* Header de Ação */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                  <Layers size={13} />
                  {portfolio.length} {portfolio.length === 1 ? "foto" : "fotos"}
                </span>
                <span className="text-[11px] text-muted-foreground">Visível para os clientes</span>
              </div>

              <button
                type="button"
                onClick={() => setMode("add")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-2xs"
              >
                <Plus size={15} />
                Adicionar Foto
              </button>
            </div>

            {/* Lista de Fotos Existentes */}
            {portfolio.length === 0 ? (
              <div className="p-8 rounded-2xl bg-card border border-dashed border-border/80 text-center space-y-3">
                <div className="size-14 rounded-2xl bg-primary/10 text-primary mx-auto grid place-items-center">
                  <ImageIcon size={28} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    Ainda não tem fotos no portfólio
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    Profissionais com fotos de trabalhos realizados recebem até 3x mais pedidos de
                    orçamento.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("add")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-soft transition active:scale-95"
                >
                  <Camera size={15} />
                  Adicionar Primeira Foto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {portfolio.map((item) => (
                  <div
                    key={item.id}
                    className="group relative rounded-2xl bg-card border border-border overflow-hidden shadow-2xs flex flex-col"
                  >
                    <div className="relative aspect-4/3 w-full bg-muted overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item)}
                        className="absolute top-2 right-2 size-7 rounded-full bg-black/60 hover:bg-rose-600 text-white backdrop-blur-xs grid place-items-center transition"
                        title="Remover foto"
                      >
                        <Trash2 size={13} />
                      </button>
                      {item.category && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                          {item.category}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="text-xs font-bold text-foreground line-clamp-1">
                          {item.title}
                        </p>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Formulário de Adição de Foto */
          <form onSubmit={handleSavePhoto} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Nova foto para o portfólio</span>
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Voltar à lista
              </button>
            </div>

            {/* Upload Area / Preview */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {imagePreview ? (
                <div className="relative rounded-2xl border border-border overflow-hidden bg-black/5 aspect-16/10">
                  <img
                    src={imagePreview}
                    alt="Pré-visualização"
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 size-8 rounded-full bg-black/70 hover:bg-rose-600 text-white grid place-items-center transition"
                    title="Remover imagem selecionada"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-border hover:border-primary p-6 text-center cursor-pointer transition bg-card/50 hover:bg-muted/30 space-y-2"
                >
                  <div className="size-12 rounded-xl bg-primary/10 text-primary mx-auto grid place-items-center">
                    <Upload size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      Carregar foto do seu telemóvel ou computador
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Toque aqui para escolher da galeria ou tirar foto (JPG, PNG até 5MB)
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Sugestões Rápidas de Fotos de Serviços */}
            {!imagePreview && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <ImageIcon size={13} className="text-primary" />
                  <span>Ou escolha um exemplo de serviço:</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_SERVICE_PHOTOS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="group relative rounded-xl border border-border overflow-hidden bg-card text-left aspect-4/3 flex flex-col justify-end p-1.5 transition hover:border-primary"
                    >
                      <img
                        src={preset.image}
                        alt={preset.title}
                        className="absolute inset-0 size-full object-cover group-hover:scale-105 transition duration-200"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <span className="relative text-[9px] font-bold text-white leading-tight line-clamp-2">
                        {preset.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campos de Texto */}
            <div className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Título do Serviço <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Instalação de Quadro Trifásico em Santana"
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Especialidade / Tag</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="Ex: Eletricidade, Instalação"
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-foreground">Data da Realização</label>
                  <input
                    type="text"
                    defaultValue={new Date().toLocaleDateString("pt-PT", {
                      month: "short",
                      year: "numeric",
                    })}
                    className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Descrição do Trabalho (Opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Substituição de cablagem antiga, colocação de disjuntores modernos e ligação à terra."
                  rows={2}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden resize-none"
                />
              </div>
            </div>

            {/* Botões do Formulário */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !imagePreview || !title.trim()}
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-2xs hover:bg-primary/90 transition disabled:opacity-50"
              >
                <Check size={14} />
                {isSubmitting ? "A guardar..." : "Publicar no Portfólio"}
              </button>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
}
