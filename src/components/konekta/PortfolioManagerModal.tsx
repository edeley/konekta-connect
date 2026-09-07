import { useState, useRef } from "react";
import {
  Camera,
  Plus,
  Trash2,
  Image as ImageIcon,
  X,
  Check,
  Upload,
  Layers,
  Sparkles,
  ArrowLeft,
  RotateCcw,
} from "lucide-react";
import { BottomSheet } from "@/components/konekta/kit";
import { store, useStore, type PortfolioItem } from "@/lib/store";
import { validateFormSafety } from "@/lib/escrow";
import { toast } from "sonner";

interface PortfolioManagerModalProps {
  open: boolean;
  onClose: () => void;
}

export function PortfolioManagerModal({ open, onClose }: PortfolioManagerModalProps) {
  const user = useStore((s) => s.user);
  const profile = useStore((s) => s.providerProfile);
  const portfolio = profile?.portfolio ?? [];

  const [mode, setMode] = useState<"list" | "add">("list");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(profile?.category || "Serviços Gerais");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Separate refs for Camera and Gallery
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

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
    setImageFileName(null);
    setCategory(profile?.category || "Serviços Gerais");
    setMode("list");
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor selecione um ficheiro de imagem válido (JPG, PNG, HEIC).");
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      toast.error("A imagem é muito grande (máximo 8MB).");
      return;
    }

    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
      toast.success("Foto carregada com sucesso!");
    };
    reader.readAsDataURL(file);
  }

  function handleSavePhoto(e: React.FormEvent) {
    e.preventDefault();
    if (!imagePreview) {
      toast.error("Tire uma foto ou escolha uma imagem da sua galeria.");
      return;
    }
    if (!title.trim()) {
      toast.error("Insira um título para identificar o trabalho realizado.");
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
      toast.success("Foto adicionada ao seu portfólio público!");
    }, 350);
  }

  function handleDeleteItem(item: PortfolioItem) {
    if (confirm(`Remover "${item.title}" do seu portfólio?`)) {
      store.removePortfolioItem(item.id);
      toast.success("Foto removida do portfólio.");
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      title={mode === "list" ? "Portfólio de Trabalhos" : "Adicionar Foto Real"}
      description={
        mode === "list"
          ? "Mostre aos clientes a qualidade dos seus serviços com fotos reais dos seus trabalhos realizados em São Tomé e Príncipe."
          : "Tire uma fotografia na hora com a câmara ou escolha uma foto dos seus trabalhos na galeria."
      }
    >
      <div className="space-y-4 pb-4">
        {mode === "list" ? (
          <>
            {/* Header de Ação */}
            <div className="flex items-center justify-between gap-3 bg-muted/40 p-3 rounded-2xl border border-border/70">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-bold">
                  <Layers size={13} />
                  {portfolio.length} {portfolio.length === 1 ? "foto" : "fotos"}
                </span>
                <span className="text-[11px] text-muted-foreground">Público no perfil</span>
              </div>

              <button
                type="button"
                onClick={() => setMode("add")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs active:scale-95"
              >
                <Plus size={15} />
                Adicionar Foto
              </button>
            </div>

            {/* Lista de Fotos Existentes */}
            {portfolio.length === 0 ? (
              <div className="p-8 rounded-2xl bg-card border border-dashed border-border/80 text-center space-y-3">
                <div className="size-14 rounded-2xl bg-primary/10 text-primary mx-auto grid place-items-center">
                  <Camera size={26} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    Ainda não tem fotos no portfólio
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                    Fotografe os seus serviços no terreno. Prestadores com fotos reais transmitem
                    muito mais confiança e fecham até 3x mais serviços.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMode("add")}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-soft transition active:scale-95"
                >
                  <Camera size={15} />
                  Tirar Primeira Foto
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
          /* Formulário de Adição de Foto (100% Real - Câmera ou Galeria) */
          <form onSubmit={handleSavePhoto} className="space-y-4">
            {/* Hidden native file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Voltar às fotos</span>
              </button>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Foto Real do Serviço
              </span>
            </div>

            {/* SEÇÃO PRINCIPAL DE CAPTURA / PREVIEW */}
            {imagePreview ? (
              /* Pré-visualização da Foto Carregada */
              <div className="space-y-2.5">
                <div className="relative rounded-2xl border-2 border-primary/40 overflow-hidden bg-black/5 aspect-16/10 shadow-sm">
                  <img
                    src={imagePreview}
                    alt="Foto capturada do serviço"
                    className="size-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageFileName(null);
                      }}
                      className="size-8 rounded-full bg-black/70 hover:bg-rose-600 text-white grid place-items-center transition backdrop-blur-xs"
                      title="Eliminar foto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] flex items-center justify-between">
                    <span className="truncate max-w-[200px]">
                      {imageFileName || "Foto selecionada"}
                    </span>
                    <span className="text-emerald-300 font-bold shrink-0">✓ Pronta</span>
                  </div>
                </div>

                {/* Opções para trocar a foto */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-border/80"
                  >
                    <Camera size={14} className="text-primary" />
                    <span>Tirar outra</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex-1 py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-border/80"
                  >
                    <ImageIcon size={14} className="text-primary" />
                    <span>Outra da galeria</span>
                  </button>
                </div>
              </div>
            ) : (
              /* DUAS OPÇÕES DIRETAS E CLARAS: CÂMARA OU GALERIA */
              <div className="space-y-2.5">
                <p className="text-xs font-bold text-foreground">Escolha como anexar a imagem:</p>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Botão 1: Tirar Foto no Momento com a Câmera */}
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 text-center transition flex flex-col items-center justify-center gap-2 active:scale-98 cursor-pointer group"
                  >
                    <div className="size-12 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 grid place-items-center group-hover:scale-110 transition-transform">
                      <Camera size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">Tirar com Câmera</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Fotografar agora no local
                      </p>
                    </div>
                  </button>

                  {/* Botão 2: Pegar na Galeria do Telemóvel */}
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="p-4 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 text-center transition flex flex-col items-center justify-center gap-2 active:scale-98 cursor-pointer group"
                  >
                    <div className="size-12 rounded-2xl bg-primary/20 text-primary grid place-items-center group-hover:scale-110 transition-transform">
                      <ImageIcon size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-foreground">Pegar na Galeria</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Fotos salvas no telemóvel
                      </p>
                    </div>
                  </button>
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  Formatos aceites: JPG, PNG, HEIC (fotos até 8MB)
                </p>
              </div>
            )}

            {/* Campos de Identificação do Trabalho */}
            <div className="space-y-3 pt-2 border-t border-border/60">
              <div className="space-y-1">
                <label className="text-xs font-bold text-foreground">
                  Título do Trabalho / Serviço Realizado <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Instalação de Bomba de Água em Santana"
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
                    placeholder="Ex: Canalização, Eletricidade"
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
                  placeholder="Ex: Substituição de tubos danificados, teste de estanqueidade e pressurização da rede."
                  rows={2}
                  className="w-full rounded-xl border border-border bg-card px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden resize-none"
                />
              </div>
            </div>

            {/* Botões de Ação */}
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
                className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-primary/90 transition disabled:opacity-50 active:scale-95"
              >
                <Check size={14} />
                {isSubmitting ? "A publicar..." : "Publicar no Portfólio"}
              </button>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
}
