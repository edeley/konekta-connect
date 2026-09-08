import { useState, useRef, useEffect } from "react";
import {
  Camera,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  Layers,
  ArrowLeft,
  Pencil,
  SlidersHorizontal,
  CheckCircle2,
} from "lucide-react";
import { BottomSheet } from "@/components/konekta/kit";
import { store, useStore, type PortfolioItem } from "@/lib/store";
import { validateFormSafety } from "@/lib/escrow";
import { toast } from "sonner";

interface PortfolioManagerModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: "list" | "add" | "edit";
  initialItemToEdit?: PortfolioItem | null;
}

export function PortfolioManagerModal({
  open,
  onClose,
  initialMode = "list",
  initialItemToEdit = null,
}: PortfolioManagerModalProps) {
  const user = useStore((s) => s.user);
  const profile = useStore((s) => s.providerProfile);
  const portfolio = profile?.portfolio ?? [];

  const [mode, setMode] = useState<"list" | "add" | "edit">(initialMode);
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(initialItemToEdit);

  // Form states
  const [addType, setAddType] = useState<"single" | "before_after">("single");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(profile?.category || "Serviços Gerais");
  const [date, setDate] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string | null>(null);

  // Before & After state
  const [beforePreview, setBeforePreview] = useState<string | null>(null);
  const [afterPreview, setAfterPreview] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Native file input refs
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const beforeCameraRef = useRef<HTMLInputElement | null>(null);
  const beforeGalleryRef = useRef<HTMLInputElement | null>(null);
  const afterCameraRef = useRef<HTMLInputElement | null>(null);
  const afterGalleryRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      if (initialItemToEdit) {
        startEdit(initialItemToEdit);
      } else {
        setMode(initialMode);
        if (initialMode === "add") {
          resetFormFields();
        }
      }
    }
  }, [open, initialMode, initialItemToEdit]);

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

  function resetFormFields() {
    setTitle("");
    setDescription("");
    setImagePreview(null);
    setImageFileName(null);
    setBeforePreview(null);
    setAfterPreview(null);
    setCategory(profile?.category || "Serviços Gerais");
    setDate(
      new Date().toLocaleDateString("pt-PT", {
        month: "short",
        year: "numeric",
      }),
    );
    setEditingItem(null);
  }

  function startEdit(item: PortfolioItem) {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || "");
    setCategory(item.category || profile?.category || "Serviços Gerais");
    setDate(item.date || "Recente");
    setImagePreview(item.image);
    setImageFileName(null);
    setMode("edit");
  }

  function handleFileChange(
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void,
    nameSetter?: (val: string) => void,
  ) {
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

    if (nameSetter) {
      nameSetter(file.name);
    }

    const reader = new FileReader();
    reader.onload = () => {
      setter(reader.result as string);
      toast.success("Foto carregada com sucesso!");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleSavePortfolio(e: React.FormEvent) {
    e.preventDefault();

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

    if (mode === "edit") {
      if (!editingItem) return;
      if (!imagePreview) {
        toast.error("O trabalho deve conter uma imagem.");
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        store.updatePortfolioItem(editingItem.id, {
          title: title.trim(),
          description: description.trim(),
          category: category.trim(),
          date: date.trim() || "Trabalho Recente",
          image: imagePreview,
        });

        setIsSubmitting(false);
        toast.success("Trabalho atualizado com sucesso!");
        resetFormFields();
        setMode("list");
      }, 300);
      return;
    }

    // Adding flow
    if (addType === "single") {
      if (!imagePreview) {
        toast.error("Tire uma foto ou escolha uma imagem da sua galeria.");
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
        resetFormFields();
        setMode("list");
        toast.success("Trabalho adicionado ao seu portfólio público!");
      }, 300);
    } else {
      // Before and After
      if (!beforePreview || !afterPreview) {
        toast.error("Por favor adicione ambas as fotos: a de ANTES e a de DEPOIS.");
        return;
      }

      setIsSubmitting(true);
      setTimeout(() => {
        store.addPortfolioItem({
          title: title.trim(),
          description: description.trim()
            ? `${description.trim()} (Antes e Depois)`
            : "Transformação Antes e Depois",
          category: category.trim(),
          image: afterPreview, // Primary display image
        });

        setIsSubmitting(false);
        resetFormFields();
        setMode("list");
        toast.success("Trabalho de Antes e Depois publicado no portfólio!");
      }, 300);
    }
  }

  function handleDeleteItem(item: PortfolioItem) {
    if (confirm(`Tem a certeza que deseja eliminar "${item.title}" do seu portfólio?`)) {
      store.removePortfolioItem(item.id);
      if (editingItem?.id === item.id) {
        resetFormFields();
        setMode("list");
      }
      toast.success("Trabalho eliminado do portfólio.");
    }
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        resetFormFields();
        onClose();
      }}
      title={
        mode === "list"
          ? "Portfólio de Trabalhos"
          : mode === "edit"
            ? "Editar Trabalho do Portfólio"
            : "Adicionar Portfólio"
      }
      description={
        mode === "list"
          ? "Gerencie fotos reais dos seus serviços em São Tomé. Pode adicionar, editar detalhes e eliminar trabalhos."
          : mode === "edit"
            ? "Atualize o título, descrição, especialidade ou troque a foto deste trabalho."
            : "Publique fotos reais com opção de foto única ou comparação de Antes e Depois."
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
                  {portfolio.length} {portfolio.length === 1 ? "trabalho" : "trabalhos"}
                </span>
                <span className="text-[11px] text-muted-foreground">Público no perfil</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetFormFields();
                  setMode("add");
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-xs active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                Adicionar Portfólio
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
                  onClick={() => {
                    resetFormFields();
                    setMode("add");
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-soft transition active:scale-95 cursor-pointer"
                >
                  <Plus size={15} />
                  Adicionar Portfólio Agora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                      {item.category && (
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold backdrop-blur-xs">
                          {item.category}
                        </span>
                      )}

                      {/* Botões de Ação Imediata: Editar & Eliminar */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="size-8 rounded-full bg-black/70 hover:bg-primary text-white backdrop-blur-xs grid place-items-center transition cursor-pointer"
                          title="Editar trabalho"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item)}
                          className="size-8 rounded-full bg-black/70 hover:bg-destructive text-white backdrop-blur-xs grid place-items-center transition cursor-pointer"
                          title="Eliminar trabalho"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs font-bold text-foreground line-clamp-1">
                            {item.title}
                          </p>
                        </div>
                        {item.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/60">
                        <span className="text-[10px] text-muted-foreground">{item.date}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Pencil size={11} />
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item)}
                            className="text-[11px] font-bold text-destructive hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 size={11} />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          /* Formulário de Adição ou Edição */
          <form onSubmit={handleSavePortfolio} className="space-y-4">
            {/* Hidden file inputs for Single Image */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileChange(e, setImagePreview, setImageFileName)}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setImagePreview, setImageFileName)}
              className="hidden"
            />

            {/* Hidden file inputs for Before & After */}
            <input
              ref={beforeCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileChange(e, setBeforePreview)}
              className="hidden"
            />
            <input
              ref={beforeGalleryRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setBeforePreview)}
              className="hidden"
            />
            <input
              ref={afterCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => handleFileChange(e, setAfterPreview)}
              className="hidden"
            />
            <input
              ref={afterGalleryRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, setAfterPreview)}
              className="hidden"
            />

            {/* Barra de Navegação Superior */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  resetFormFields();
                  setMode("list");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Voltar ao Portfólio</span>
              </button>
              <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {mode === "edit" ? "Modo Edição" : "Novo Trabalho"}
              </span>
            </div>

            {/* SELETOR DE TIPO: Foto Única vs Antes/Depois (apenas no modo Adicionar) */}
            {mode === "add" && (
              <div className="grid grid-cols-2 p-1 rounded-2xl bg-muted/70 border border-border/50 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAddType("single")}
                  className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    addType === "single"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Camera size={14} />
                  <span>Foto Única</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddType("before_after")}
                  className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    addType === "before_after"
                      ? "bg-card text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <SlidersHorizontal size={14} />
                  <span>Antes & Depois</span>
                </button>
              </div>
            )}

            {/* SELEÇÃO DE IMAGEM PARA FOTO ÚNICA OU EDIÇÃO */}
            {mode === "edit" || addType === "single" ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Foto do Trabalho</span>
                  {imagePreview && (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                      <CheckCircle2 size={12} /> Foto anexada
                    </span>
                  )}
                </label>

                {imagePreview ? (
                  <div className="space-y-2">
                    <div className="relative rounded-2xl border-2 border-primary/40 overflow-hidden bg-black/5 aspect-16/10 shadow-sm">
                      <img
                        src={imagePreview}
                        alt="Foto do trabalho"
                        className="size-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl text-white text-[11px] flex items-center justify-between">
                        <span className="truncate max-w-[200px]">
                          {imageFileName || "Foto carregada"}
                        </span>
                        <span className="text-emerald-300 font-bold shrink-0">✓ Pronta</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-border/80 cursor-pointer"
                      >
                        <Camera size={14} className="text-primary" />
                        <span>Tirar Outra</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="flex-1 py-2 px-3 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-border/80 cursor-pointer"
                      >
                        <ImageIcon size={14} className="text-primary" />
                        <span>Trocar pela Galeria</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="p-4 rounded-2xl border-2 border-dashed border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 text-center transition flex flex-col items-center justify-center gap-2 active:scale-98 cursor-pointer group"
                      >
                        <div className="size-11 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 grid place-items-center group-hover:scale-110 transition-transform">
                          <Camera size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground">Tirar com Câmera</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Fotografar no local
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="p-4 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 hover:bg-primary/10 text-center transition flex flex-col items-center justify-center gap-2 active:scale-98 cursor-pointer group"
                      >
                        <div className="size-11 rounded-2xl bg-primary/20 text-primary grid place-items-center group-hover:scale-110 transition-transform">
                          <ImageIcon size={22} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground">Pegar na Galeria</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Fotos do telemóvel
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* SELEÇÃO PARA ANTES & DEPOIS */
              <div className="space-y-3">
                <p className="text-xs font-bold text-foreground">
                  Anexe as duas fotos da transformação:
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Foto de ANTES */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      1. Foto de ANTES
                    </span>
                    {beforePreview ? (
                      <div className="relative aspect-square rounded-2xl border-2 border-primary/40 overflow-hidden bg-black/5 shadow-2xs">
                        <img src={beforePreview} alt="Antes" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setBeforePreview(null)}
                          className="absolute top-1.5 right-1.5 size-7 rounded-full bg-black/70 hover:bg-destructive text-white grid place-items-center cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => beforeCameraRef.current?.click()}
                          className="w-full p-2.5 rounded-xl border border-dashed border-border bg-muted/40 hover:bg-muted text-center text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Camera size={13} />
                          Câmera
                        </button>
                        <button
                          type="button"
                          onClick={() => beforeGalleryRef.current?.click()}
                          className="w-full p-2.5 rounded-xl border border-dashed border-border bg-muted/40 hover:bg-muted text-center text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <ImageIcon size={13} />
                          Galeria
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Foto de DEPOIS */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground block">
                      2. Foto de DEPOIS
                    </span>
                    {afterPreview ? (
                      <div className="relative aspect-square rounded-2xl border-2 border-emerald-500/40 overflow-hidden bg-black/5 shadow-2xs">
                        <img src={afterPreview} alt="Depois" className="size-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setAfterPreview(null)}
                          className="absolute top-1.5 right-1.5 size-7 rounded-full bg-black/70 hover:bg-destructive text-white grid place-items-center cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={() => afterCameraRef.current?.click()}
                          className="w-full p-2.5 rounded-xl border border-dashed border-border bg-muted/40 hover:bg-muted text-center text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Camera size={13} />
                          Câmera
                        </button>
                        <button
                          type="button"
                          onClick={() => afterGalleryRef.current?.click()}
                          className="w-full p-2.5 rounded-xl border border-dashed border-border bg-muted/40 hover:bg-muted text-center text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <ImageIcon size={13} />
                          Galeria
                        </button>
                      </div>
                    )}
                  </div>
                </div>
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
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    placeholder="Ex: Fev 2026"
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
              {mode === "edit" && editingItem && (
                <button
                  type="button"
                  onClick={() => handleDeleteItem(editingItem)}
                  className="h-10 px-3.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-xs font-bold flex items-center justify-center gap-1.5 transition border border-destructive/30 cursor-pointer"
                  title="Eliminar este trabalho"
                >
                  <Trash2 size={14} />
                  <span>Eliminar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  resetFormFields();
                  setMode("list");
                }}
                className="flex-1 h-10 rounded-xl border border-border text-xs font-bold text-foreground hover:bg-muted transition cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !title.trim() ||
                  (mode === "add" && addType === "single" && !imagePreview) ||
                  (mode === "add" &&
                    addType === "before_after" &&
                    (!beforePreview || !afterPreview))
                }
                className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center gap-2 shadow-xs hover:bg-primary/90 transition disabled:opacity-50 active:scale-95 cursor-pointer"
              >
                <Check size={14} />
                <span>
                  {isSubmitting
                    ? "A guardar..."
                    : mode === "edit"
                      ? "Guardar Alterações"
                      : "Publicar Portfólio"}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </BottomSheet>
  );
}
