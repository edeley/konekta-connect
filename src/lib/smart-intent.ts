/**
 * Motor local de interpretação e aconselhamento de pedidos KONEKTA STP.
 * Analisa a frase do cliente (ex.: "A minha geladeira não está funcionando"),
 * identifica com precisão o problema doméstico ou técnico, explica por que razão
 * aquele profissional específico é o ideal, sugere urgência, orçamento e perguntas chave.
 *
 * Funciona 100% offline com dicionário nativo e pode ser complementado com IA Gemini.
 */

import { STP_QUICK_SERVICE_TEMPLATES, type ServiceQuickTemplate } from "./stp-order-intelligence";
import type { RequestUrgency } from "./requests";

export interface SmartIntentResult {
  categorySlug: string | null;
  confidence: number; // 0 a 1
  urgency: RequestUrgency;
  suggestedTitle: string;
  suggestedBudget?: number;
  template?: ServiceQuickTemplate;
  matchedWords: string[];
  /** Perguntas curtas que ajudam o prestador a orçar melhor */
  followUps: string[];

  // Detalhes aprofundados de orientação para o cliente
  professionTitle: string;
  problemSummary: string;
  whyThisProfessional: string;
  isUnserved?: boolean;
  unservedAlternativeName?: string;
  aiExplanationBadge?: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const URGENT_WORDS = [
  "urgente",
  "urgência",
  "urgencia",
  "hoje",
  "agora",
  "imediato",
  "emergencia",
  "emergência",
  "rápido",
  "rapido",
  "já",
  "socorro",
  "inundad",
  "a arder",
  "sem luz",
  "sem água",
  "sem agua",
  "estragar comida",
  "comida a estragar",
  "parou de vez",
  "despejar agua",
];

const RELAXED_WORDS = [
  "sem pressa",
  "quando puder",
  "qualquer dia",
  "próximo mês",
  "proximo mes",
  "não é urgente",
  "nao e urgente",
  "apenas orcamento",
  "orcamento para depois",
];

function detectUrgency(
  raw: string,
  defaultUrgency: RequestUrgency = "esta-semana",
): RequestUrgency {
  const t = normalize(raw);
  if (RELAXED_WORDS.some((w) => t.includes(normalize(w)))) return "sem-pressa";
  if (URGENT_WORDS.some((w) => t.includes(normalize(w)))) return "urgente";
  return defaultUrgency;
}

function detectBudget(raw: string): number | undefined {
  const t = normalize(raw).replace(/\./g, "");
  const m = t.match(/(\d{2,7})\s*(db|dobras|stn)?/);
  if (!m) return undefined;
  const value = Number(m[1]);
  if (!Number.isFinite(value) || value < 50 || value > 500000) return undefined;
  return value;
}

interface DiagnosisRule {
  id: string;
  match: (t: string) => boolean;
  categorySlug: string | null;
  professionTitle: string;
  problemSummary: string;
  whyThisProfessional: string;
  suggestedTitle: string;
  suggestedBudget: number;
  urgency: RequestUrgency;
  followUps: string[];
  isUnserved?: boolean;
  unservedAlternativeName?: string;
}

const DIAGNOSIS_RULES: DiagnosisRule[] = [
  // 1. REFRIGERAÇÃO / GELADEIRAS / FRIGORÍFICOS / ARCAS
  {
    id: "geladeira-frigorifico",
    match: (t) =>
      t.includes("geladeira") ||
      t.includes("geladeiras") ||
      t.includes("frigorifico") ||
      t.includes("frigorificos") ||
      t.includes("geleira") ||
      t.includes("congelador") ||
      t.includes("freezer") ||
      t.includes("arca frigorifica") ||
      t.includes("arca congeladora") ||
      (t.includes("arca") && (t.includes("frio") || t.includes("carne") || t.includes("peixe"))) ||
      t.includes("nao gela") ||
      t.includes("nao esta a gelar") ||
      t.includes("nao arrefece") ||
      t.includes("nao resfria") ||
      t.includes("nao esfria"),
    categorySlug: "ar-condicionado",
    professionTitle: "Técnico de Frio & Refrigeração (Climatização & Eletrodomésticos)",
    problemSummary: "Avaria ou Falha de Frio em Geladeira / Frigorífico",
    whyThisProfessional:
      "Para geladeiras, frigoríficos ou arcas congeladoras que não estão funcionando ou não gelam, o profissional qualificado é o Técnico de Refrigeração e Climatização. Ele possui o equipamento para testar o termostato, compressor, fugas de gás e efetuar a recarga de gás refrigerante.",
    suggestedTitle: "Reparação de Geladeira / Frigorífico (não gela ou avaria no motor)",
    suggestedBudget: 450,
    urgency: "urgente",
    followUps: [
      "O motor/compressor na parte de trás faz barulho ou fica completamente silencioso?",
      "A luz interior da geladeira acende ao abrir a porta?",
      "Verifica acumulação anormal de gelo ou água no chão?",
    ],
  },

  // 2. AR CONDICIONADO / CLIMATIZAÇÃO
  {
    id: "ar-condicionado",
    match: (t) =>
      t.includes("ar condicionado") ||
      t.includes("ar-condicionado") ||
      t.includes("split") ||
      t.includes("climatizador") ||
      t.includes("gas do ar") ||
      t.includes("recarga de gas") ||
      t.includes("limpeza de ac"),
    categorySlug: "ar-condicionado",
    professionTitle: "Técnico de Climatização & Ar Condicionado",
    problemSummary: "Manutenção, Recarga de Gás ou Instalação de Ar Condicionado",
    whyThisProfessional:
      "Para aparelhos de ar condicionado split que não arrefecem, pingam água na parede ou deitam mau cheiro, o Técnico de Climatização realiza a lavagem das serpentinas, desinfeção antibacteriana e medição da pressão de gás.",
    suggestedTitle: "Manutenção e Recarga de Gás em Ar Condicionado Split",
    suggestedBudget: 500,
    urgency: "esta-semana",
    followUps: [
      "Quantos aparelhos de ar condicionado precisam de intervenção?",
      "O aparelho sopra ar normal ou não sopra nada?",
      "Há água a pingar para dentro do compartimento?",
    ],
  },

  // 3. ELETRODOMÉSTICOS DE COZINHA (Fogão, Máquina de Lavar, Micro-ondas)
  {
    id: "eletrodomesticos",
    match: (t) =>
      t.includes("fogao") ||
      t.includes("forno") ||
      t.includes("microondas") ||
      t.includes("micro-ondas") ||
      t.includes("maquina de lavar") ||
      t.includes("maquina de secar") ||
      t.includes("esquentador"),
    categorySlug: "ar-condicionado",
    professionTitle: "Técnico de Eletrodomésticos & Manutenção",
    problemSummary: "Reparação de Eletrodoméstico Doméstico",
    whyThisProfessional:
      "Para fogões elétricos/gás, máquinas de lavar roupa ou micro-ondas avariados, o técnico especializado em eletrodomésticos testa placas eletrónicas, resistências térmicas, válvulas e bombas de drenagem.",
    suggestedTitle: "Reparação e Diagnóstico de Eletrodoméstico",
    suggestedBudget: 400,
    urgency: "esta-semana",
    followUps: [
      "Qual é a marca e o modelo aproximado do aparelho?",
      "O aparelho liga as luzes no painel ou não recebe energia?",
    ],
  },

  // 4. ELETRICIDADE, CURTO-CIRCUITO, QUADRO E LUZES
  {
    id: "eletricidade",
    match: (t) =>
      t.includes("disjuntor") ||
      t.includes("curto") ||
      t.includes("tomada") ||
      t.includes("interruptor") ||
      t.includes("quadro eletric") ||
      t.includes("quadro de luz") ||
      t.includes("choque") ||
      t.includes("sem luz") ||
      t.includes("luz fraca") ||
      t.includes("fio descarnado") ||
      t.includes("fusivel") ||
      t.includes("inversor") ||
      t.includes("painel solar") ||
      t.includes("emae"),
    categorySlug: "eletricista",
    professionTitle: "Eletricista Credenciado",
    problemSummary: "Avaria Elétrica, Disjuntor a Disparar ou Instalação",
    whyThisProfessional:
      "Qualquer falha elétrica acarreta risco sério de choque e incêndio. Um Eletricista credenciado isola circuitos com multímetro, substitui disjuntores avariados e garante ligações seguras e protegidas.",
    suggestedTitle: "Deteção de Avaria Elétrica e Reparação de Disjuntor/Quadro",
    suggestedBudget: 400,
    urgency: "urgente",
    followUps: [
      "O corte de energia é em toda a casa ou apenas num quarto/cozinha?",
      "O disjuntor dispara imediatamente ao ser levantado?",
      "A avaria ocorreu após ligar algum aparelho específico?",
    ],
  },

  // 5. CANALIZAÇÃO, FUGAS DE ÁGUA E BOMBAS
  {
    id: "canalizacao",
    match: (t) =>
      t.includes("torneira") ||
      t.includes("cano") ||
      t.includes("tubo de agua") ||
      t.includes("fuga de agua") ||
      t.includes("esgoto") ||
      t.includes("sanita") ||
      t.includes("retrete") ||
      t.includes("autoclismo") ||
      t.includes("entupido") ||
      t.includes("entupimento") ||
      t.includes("desentupir") ||
      t.includes("bomba de agua") ||
      t.includes("tanque de agua") ||
      t.includes("deposito de agua") ||
      t.includes("fossa") ||
      t.includes("inundacao"),
    categorySlug: "canalizador",
    professionTitle: "Canalizador Profissional (Picheleiro)",
    problemSummary: "Fuga de Água, Desentupimento ou Bomba/Tanque",
    whyThisProfessional:
      "Para canos furados, torneiras a pingar, sanitas entupidas ou instalação de tanques de reserva com bomba de água em STP, o Canalizador profissional possui ferramentas de corte, solda PVC/PEX e desobstrução mecânica.",
    suggestedTitle: "Reparação de Fuga de Água e Desentupimento",
    suggestedBudget: 380,
    urgency: "urgente",
    followUps: [
      "A água vem da rede pública ou de tanque/depósito com eletrobomba?",
      "Consegue fechar a torneira de corte geral para estancar a água?",
      "A fuga está visível ou infiltrada na parede/chão?",
    ],
  },

  // 6. GERADORES DE ENERGIA (Essencial em STP)
  {
    id: "geradores",
    match: (t) =>
      t.includes("gerador") &&
      (t.includes("nao pega") ||
        t.includes("nao arranca") ||
        t.includes("fumo") ||
        t.includes("oleo") ||
        t.includes("diesel") ||
        t.includes("gasoleo") ||
        t.includes("gasolina") ||
        t.includes("avaria") ||
        t.includes("manutencao")),
    categorySlug: "mecanico",
    professionTitle: "Mecânico Especialista em Geradores & Motores",
    problemSummary: "Manutenção ou Reparação de Grupo Gerador",
    whyThisProfessional:
      "Em São Tomé e Príncipe, os geradores asseguram a continuidade energética durante cortes da EMAE. O Mecânico especializado diagnostica carburador, bomba injetora de gasóleo, motor de arranque e mudança de óleo e filtros.",
    suggestedTitle: "Manutenção e Reparação de Gerador de Energia",
    suggestedBudget: 500,
    urgency: "urgente",
    followUps: [
      "O gerador é a gasóleo (diesel) ou a gasolina?",
      "Qual é a potência aproximada (KVA ou Watts)?",
      "O motor tenta arrancar ou não faz qualquer ruído?",
    ],
  },

  // 7. MECÂNICA AUTO E VIATURAS
  {
    id: "mecanica-auto",
    match: (t) =>
      t.includes("carro") ||
      t.includes("viatura") ||
      t.includes("carrinha") ||
      t.includes("moto") ||
      t.includes("motorizada") ||
      t.includes("travao") ||
      t.includes("pastilha") ||
      t.includes("embraiagem") ||
      t.includes("bateria do carro") ||
      t.includes("motor a bater") ||
      t.includes("radiador") ||
      (t.includes("motor") && (t.includes("pega") || t.includes("arranca"))),
    categorySlug: "mecanico",
    professionTitle: "Mecânico de Automóveis & Viaturas",
    problemSummary: "Assistência Mecânica de Viatura ou Revisão",
    whyThisProfessional:
      "Para carros ou motas que não pegam, travões gastos, ruídos no motor ou socorro de bateria no local, o Mecânico credenciado desloca-se com equipamento de diagnóstico e ferramentas adequadas.",
    suggestedTitle: "Diagnóstico e Socorro Mecânico de Viatura",
    suggestedBudget: 450,
    urgency: "urgente",
    followUps: [
      "Qual é a marca, modelo e ano da viatura?",
      "O carro está imobilizado na via pública ou em sua casa?",
      "O motor de arranque dá sinal quando roda a chave?",
    ],
  },

  // 8. LIMPEZA RESIDENCIAL, FAXINA E PÓS-OBRA
  {
    id: "limpeza",
    match: (t) =>
      t.includes("limpeza") ||
      t.includes("limpar") ||
      t.includes("faxina") ||
      t.includes("arrumar casa") ||
      t.includes("lavar sofa") ||
      t.includes("pos-obra") ||
      t.includes("empregada") ||
      t.includes("domestica") ||
      t.includes("engomar"),
    categorySlug: "limpeza",
    professionTitle: "Profissional de Limpeza & Higienização",
    problemSummary: "Faxina Residencial, Pós-Obra ou Lavagem de Estofos",
    whyThisProfessional:
      "Para higienização completa da habitação, limpeza profunda após pinturas/obras ou lavagem de sofás e colchões, a equipa de limpeza assegura desinfeção e organização com produtos adequados.",
    suggestedTitle: "Limpeza Residencial Completa (Faxina)",
    suggestedBudget: 550,
    urgency: "esta-semana",
    followUps: [
      "Quantas divisões/quartos tem o espaço?",
      "É limpeza pontual ou pretende serviço regular?",
      "Tem materiais de limpeza em casa ou o profissional deve levar?",
    ],
  },

  // 9. PINTURA, SALITRE E HUMIDADE
  {
    id: "pintura",
    match: (t) =>
      t.includes("pintar") ||
      t.includes("pintura") ||
      t.includes("tinta") ||
      t.includes("parede") ||
      t.includes("salitre") ||
      t.includes("humidade") ||
      t.includes("verniz") ||
      t.includes("envernizar") ||
      t.includes("estuque"),
    categorySlug: "pintor",
    professionTitle: "Pintor da Construção Civil",
    problemSummary: "Pintura de Paredes e Tratamento Anti-Salitre",
    whyThisProfessional:
      "O clima tropical de São Tomé provoca desgaste rápido nas paredes por salitre e humidade. O Pintor profissional aplica primários hidrófugos isolantes e acabamentos duradouros de alta resistência.",
    suggestedTitle: "Pintura de Paredes e Tratamento de Salitre/Humidade",
    suggestedBudget: 600,
    urgency: "esta-semana",
    followUps: [
      "A pintura é no interior da casa ou em paredes/fachadas exteriores?",
      "As paredes têm bolor, descasque ou salitre visível?",
      "Já tem as tintas compradas ou deseja orçamento com material?",
    ],
  },

  // 10. JARDINAGEM, ROÇAGEM E PODAS
  {
    id: "jardinagem",
    match: (t) =>
      t.includes("jardim") ||
      t.includes("relva") ||
      t.includes("capim") ||
      t.includes("rocar") ||
      t.includes("rocadora") ||
      t.includes("podar") ||
      t.includes("arvore") ||
      t.includes("coqueiro") ||
      t.includes("palmeira") ||
      t.includes("limpar quintal"),
    categorySlug: "jardinagem",
    professionTitle: "Jardineiro & Limpeza de Quintais",
    problemSummary: "Roçagem de Capim, Poda de Árvores e Manutenção",
    whyThisProfessional:
      "Para manter o quintal seguro, limpo e livre de cobras e insetos, o Jardineiro dispõe de roçadoras a gasolina e equipamento próprio para nivelar relva e cortar ramos perigosos.",
    suggestedTitle: "Roçagem de Capim e Limpeza Geral de Quintal",
    suggestedBudget: 350,
    urgency: "esta-semana",
    followUps: [
      "Qual é a dimensão aproximada do quintal ou lote de terreno?",
      "É apenas corte de capim ou também inclui poda de árvores/coqueiros?",
      "Pretende que os resíduos vegetais sejam recolhidos e ensacados?",
    ],
  },

  // 11. BELEZA, TRANÇAS E ESTÉTICA
  {
    id: "beleza",
    match: (t) =>
      t.includes("cabelo") ||
      t.includes("tranca") ||
      t.includes("trancas") ||
      t.includes("box braids") ||
      t.includes("nago") ||
      t.includes("twist") ||
      t.includes("unha") ||
      t.includes("manicure") ||
      t.includes("pedicure") ||
      t.includes("verniz gel") ||
      t.includes("maquilhagem") ||
      t.includes("penteado") ||
      t.includes("barba"),
    categorySlug: "beleza",
    professionTitle: "Esteticista & Cabeleireira ao Domicílio",
    problemSummary: "Tranças Afro, Manicure ou Penteados",
    whyThisProfessional:
      "Para tranças impecáveis (box braids, nagô), manicure, pedicure e maquilhagem no conforto da sua residência, a profissional de estética atende com pontualidade e técnicas modernas.",
    suggestedTitle: "Tranças Afro / Manicure e Beleza ao Domicílio",
    suggestedBudget: 300,
    urgency: "esta-semana",
    followUps: [
      "Prefere ser atendida em sua casa ou no salão?",
      "Já tem o postiço/cabelo postiço comprado?",
      "Qual é a data e o período do dia (manhã/tarde) mais conveniente?",
    ],
  },

  // 12. ESPECIALIDADES EM EXPANSÃO (Informática, Pedreiro, Carpinteiro)
  {
    id: "construcao-pedreiro",
    match: (t) =>
      t.includes("pedreiro") ||
      t.includes("reboco") ||
      t.includes("assentar bloco") ||
      t.includes("cimento") ||
      t.includes("azulejo") ||
      t.includes("ladrilho") ||
      t.includes("telhado") ||
      t.includes("muro caido"),
    categorySlug: null,
    professionTitle: "Pedreiro / Mestre de Obras",
    problemSummary: "Obras de Alvenaria, Reboco, Pisos ou Telhado",
    whyThisProfessional:
      "Para assentamento de blocos de cimento, reboco de paredes, colocação de ladrilhos ou conserto de telhado, o profissional indicado é o Pedreiro. A KONEKTA ativará parceiros qualificados para atender este pedido.",
    suggestedTitle: "Serviço de Pedreiro e Construção Civil",
    suggestedBudget: 700,
    urgency: "esta-semana",
    isUnserved: true,
    unservedAlternativeName: "Construção Civil & Pedreiro",
    followUps: [
      "Qual é a dimensão do trabalho em metros quadrados aproximados?",
      "Já tem o material de construção (cimento, blocos, areia) no local?",
    ],
  },

  {
    id: "carpintaria-marcenaria",
    match: (t) =>
      t.includes("carpinteiro") ||
      t.includes("marceneiro") ||
      t.includes("madeira") ||
      t.includes("porta de madeira") ||
      t.includes("armario") ||
      t.includes("fechadura") ||
      t.includes("porta emperrada"),
    categorySlug: null,
    professionTitle: "Carpinteiro / Marceneiro",
    problemSummary: "Reparação de Portas, Fechaduras ou Móveis de Madeira",
    whyThisProfessional:
      "Para afinar portas emperradas, substituir fechaduras ou restaurar e montar móveis de madeira, o profissional adequado é o Carpinteiro/Marceneiro.",
    suggestedTitle: "Serviço de Carpintaria e Reparação de Portas/Móveis",
    suggestedBudget: 400,
    urgency: "esta-semana",
    isUnserved: true,
    unservedAlternativeName: "Carpintaria & Marcenaria",
    followUps: [
      "Trata-se de uma porta exterior ou de interior?",
      "A fechadura nova já está comprada?",
    ],
  },

  {
    id: "informatica-telemovel",
    match: (t) =>
      t.includes("computador") ||
      t.includes("portatil") ||
      t.includes("laptop") ||
      t.includes("telemovel") ||
      t.includes("celular") ||
      t.includes("ecra partido") ||
      t.includes("formatar") ||
      t.includes("impressora"),
    categorySlug: null,
    professionTitle: "Técnico de Informática & Eletrónica Digital",
    problemSummary: "Reparação de Computador, Telemóvel ou Software",
    whyThisProfessional:
      "Para computadores que não ligam, substituição de ecrãs de telemóveis, recuperação de ficheiros e instalação de software, o especialista adequado é o Técnico de Informática.",
    suggestedTitle: "Reparação e Diagnóstico de Computador / Telemóvel",
    suggestedBudget: 350,
    urgency: "esta-semana",
    isUnserved: true,
    unservedAlternativeName: "Informática & Reparação de Telemóveis",
    followUps: [
      "Qual é a marca e o modelo do computador ou telemóvel?",
      "O dispositivo liga ao carregador ou não dá sinal?",
    ],
  },
];

/**
 * Analisa a frase do cliente e devolve a recomendação da especialidade ideal,
 * com explicação clara do porquê chamar esse profissional.
 */
export function analyzeRequestText(text: string): SmartIntentResult {
  const t = normalize(text);
  const urgency = detectUrgency(text);

  // 1. Procurar nas regras específicas de diagnóstico inteligente
  for (const rule of DIAGNOSIS_RULES) {
    if (rule.match(t)) {
      // Procurar modelo STP relacionado
      let matchedTemplate: ServiceQuickTemplate | undefined;
      if (rule.categorySlug) {
        const pool = STP_QUICK_SERVICE_TEMPLATES.filter(
          (tpl) => tpl.categorySlug === rule.categorySlug,
        );
        matchedTemplate =
          pool.find((tpl) =>
            normalize(tpl.title)
              .split(" ")
              .some((w) => w.length > 4 && t.includes(w)),
          ) || pool[0];
      }

      const cleaned = text.trim().replace(/\s+/g, " ");
      const suggestedTitle =
        rule.suggestedTitle ||
        (cleaned.length > 0
          ? cleaned.charAt(0).toUpperCase() +
            cleaned.slice(1, 70) +
            (cleaned.length > 70 ? "…" : "")
          : "");

      return {
        categorySlug: rule.categorySlug,
        confidence: 0.95,
        urgency: detectUrgency(text, rule.urgency),
        suggestedTitle,
        suggestedBudget:
          detectBudget(text) ?? matchedTemplate?.estimatedBudgetSTN ?? rule.suggestedBudget,
        template: matchedTemplate,
        matchedWords: [rule.id],
        followUps: rule.followUps,
        professionTitle: rule.professionTitle,
        problemSummary: rule.problemSummary,
        whyThisProfessional: rule.whyThisProfessional,
        isUnserved: rule.isUnserved,
        unservedAlternativeName: rule.unservedAlternativeName,
        aiExplanationBadge: "💡 IA KONEKTA · Recomendação Precisa",
      };
    }
  }

  // 2. Fallback Genérico baseado em palavras soltas
  const cleaned = text.trim().replace(/\s+/g, " ");
  const fallbackTitle =
    cleaned.length > 0
      ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1, 70) + (cleaned.length > 70 ? "…" : "")
      : "Pedido de Assistência Técnica";

  return {
    categorySlug: null,
    confidence: 0.3,
    urgency,
    suggestedTitle: fallbackTitle,
    suggestedBudget: detectBudget(text) ?? 400,
    matchedWords: [],
    followUps: [
      "Pode descrever com mais pormenor o que aconteceu?",
      "Onde se localiza o serviço em São Tomé e Príncipe?",
    ],
    professionTitle: "Especialista Polivalente",
    problemSummary: "Pedido de Assistência Geral",
    whyThisProfessional:
      "A KONEKTA ajuda-o a encontrar o profissional certo para resolver esta situação com orçamento prévio e segurança.",
    aiExplanationBadge: "IA KONEKTA",
  };
}

/** Avalia a qualidade do pedido e sugere melhorias antes de publicar. */
export function scoreRequestQuality(input: {
  title: string;
  description: string;
  photos: number;
  address?: string;
  reference?: string;
  budget?: number;
}) {
  const tips: string[] = [];
  let score = 0;

  if (input.title.trim().length >= 8) score += 15;
  else tips.push("Escreva um título mais claro (ex.: “Reparação de geladeira que não gela”).");

  if (input.description.trim().length >= 40) score += 30;
  else tips.push("Detalhe melhor o problema — pedidos detalhados recebem propostas mais rápidas.");

  if (input.photos > 0) score += 25;
  else tips.push("Anexe pelo menos uma foto do local ou do aparelho avariado.");

  if ((input.address ?? "").trim().length >= 5) score += 15;
  else tips.push("Indique o bairro ou zona aproximada em STP.");

  if ((input.reference ?? "").trim().length >= 4) score += 10;
  else tips.push("Adicione um ponto de referência conhecido.");

  if (input.budget && input.budget > 0) score += 5;

  return { score: Math.min(100, score), tips: tips.slice(0, 3) };
}
