import { MessageSquare } from "lucide-react";

interface ChatQuickRepliesProps {
  isClient: boolean;
  hasActiveQuote: boolean;
  isEscrowPaid: boolean;
  onSelect: (reply: string) => void;
}

export function ChatQuickReplies({
  isClient,
  hasActiveQuote,
  isEscrowPaid,
  onSelect,
}: ChatQuickRepliesProps) {
  let suggestions: string[] = [];

  if (isClient) {
    if (!hasActiveQuote) {
      suggestions = [
        "Pode enviar uma proposta formal no app?",
        "Qual é o prazo estimado para iniciar?",
        "Os materiais estão incluídos no valor?",
        "Pode fazer uma visita técnica para avaliar?",
      ];
    } else if (isEscrowPaid) {
      suggestions = [
        "Já efetuei o pagamento em custódia no app!",
        "Qual é a previsão de chegada ao local?",
        "O serviço ficou impecável, vou confirmar!",
        "Preciso de um pequeno ajuste antes da aprovação.",
      ];
    } else {
      suggestions = [
        "Recebi a proposta, vou analisar e pagar.",
        "Consegue detalhar os materiais incluídos?",
        "Qual a garantia oferecida para este trabalho?",
      ];
    }
  } else {
    // Prestador
    if (!hasActiveQuote) {
      suggestions = [
        "Olá! Posso ajudar. Já estou a preparar a proposta formal.",
        "Pode enviar uma foto da avaria para diagnóstico?",
        "O valor inclui mão de obra e garantia de 30 dias.",
        "Posso agendar uma visita técnica no terreno?",
      ];
    } else if (isEscrowPaid) {
      suggestions = [
        "Pagamento em custódia confirmado! Estou a caminho.",
        "Já iniciei os trabalhos no local.",
        "Serviço concluído com sucesso! Pode validar na app?",
        "Enviei as fotos finais do trabalho executado.",
      ];
    } else {
      suggestions = [
        "Acabei de enviar a proposta formal com garantia.",
        "O pagamento fica retido em custódia até à sua aprovação.",
        "Caso tenha dúvidas sobre a proposta, estou ao dispor.",
      ];
    }
  }

  if (suggestions.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1">
      <span className="text-[10px] font-bold text-muted-foreground shrink-0 flex items-center gap-1 pl-1">
        <MessageSquare size={11} className="text-primary" /> Sugestões:
      </span>
      {suggestions.map((s, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelect(s)}
          className="shrink-0 px-2.5 py-1 rounded-full bg-muted/80 hover:bg-primary/10 hover:text-primary text-[11px] font-medium text-foreground transition border border-border/60 cursor-pointer active:scale-95 whitespace-nowrap"
        >
          {s}
        </button>
      ))}
    </div>
  );
}
