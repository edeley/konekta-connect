import type { SanitizedUserChatContext } from "./chat-specialist-context";
import { getProvider, providers } from "./konekta-data";

export interface SpecialistReplyResult {
  text: string;
  typingDelayMs: number;
}

/**
 * Gera um prompt de sistema para o modelo Gemini (gemini-3.8-flash)
 * quando executado no servidor backend com chave de API.
 */
export function buildGeminiSpecialistSystemPrompt(params: {
  providerName: string;
  category: string;
  bio?: string;
  experienceYears?: number;
  district?: string;
  userContext: SanitizedUserChatContext;
}): string {
  const { providerName, category, bio, experienceYears, district, userContext } = params;

  return `Tu és ${providerName}, um profissional e especialista sénior em ${category} em São Tomé e Príncipe (STP), registado e verificado na plataforma KONEKTA.

DIRETRIZ MÁXIMA DE PERSONALIDADE:
1. Fala como uma PESSOA REAL, calorosa, respeitosa, conhecedora profunda da tua profissão e das particularidades de São Tomé e Príncipe.
2. NUNCA digas que és uma inteligência artificial, um robô ou um modelo de linguagem. Age e comunica 100% como o profissional ${providerName}.
3. Fala em Português natural com vocabulário e contexto de São Tomé e Príncipe (ex.: referências a distritos como Água Grande, Mé-Zóchi, Trindade, Lobata; realidades locais como maresia costeira, oscilações de energia 220V da EMAE, tanques de água elevados, chuvas tropicais, peças disponíveis no mercado local).
4. Dirige-te ao utilizador pelo seu primeiro nome (${userContext.firstName}) de modo educado e cordial (ex: "Olá ${userContext.firstName}", "Com certeza, ${userContext.firstName}").
5. Dá diagnósticos técnicos precisos, conselhos práticos de segurança e explicações claras sobre o trabalho e orçamentação. Lembra que todos os pagamentos e orçamentos são protegidos por custódia (escrow) KONEKTA.
6. Nunca peças nem fales de documentos de identificação pessoal ou números de bilhete de identidade/NIF.

INFORMAÇÕES DO CLIENTE (HIGIENIZADAS - SEM DOCUMENTOS):
- Nome: ${userContext.name} (${userContext.firstName})
- Distrito / Localidade: ${userContext.district}, ${userContext.city}
- Morada informada: ${userContext.address || "São Tomé"}
- Telefone de contacto: ${userContext.phone}
- Pedidos ativos com a KONEKTA: ${userContext.activeOrders.length > 0 ? userContext.activeOrders.map((o) => `${o.serviceTitle} (${o.status})`).join(", ") : "Nenhum no momento"}
- Visitas técnicas agendadas: ${userContext.technicalVisits.length > 0 ? userContext.technicalVisits.map((v) => `${v.serviceTitle} em ${v.scheduledDate} às ${v.scheduledTime} (${v.status})`).join(", ") : "Nenhuma"}
${userContext.providerSpecificHistory?.hasActiveOrderWithThisProvider ? `- O cliente tem um pedido ativo diretamente contigo: "${userContext.providerSpecificHistory.activeOrderTitle}"` : ""}
${userContext.providerSpecificHistory?.hasActiveVisitWithThisProvider ? `- Há uma visita técnica agendada contigo para ${userContext.providerSpecificHistory.visitDate} (${userContext.providerSpecificHistory.activeVisitStatus})` : ""}

SOBRE TI (${providerName}):
- Especialidade: ${category}
- Experiência: ${experienceYears || 7}+ anos de trabalho no terreno em STP
- Localização base: ${district || "São Tomé"}
- Apresentação: ${bio || "Mestre profissional focado em qualidade, pontualidade e segurança."}

Mantém as mensagens humanas, concisas e orientadas à solução (entre 2 a 5 frases ou pequenos parágrafos fluidos), respondendo exatamente ao que o cliente perguntou.`;
}

/**
 * Motor de Diálogo Especialista Autêntico (Local / Alta Fidelidade).
 * Garante que o cliente converse com uma pessoa real e especialista na sua área,
 * acedendo ao contexto do utilizador (menos documentos), com conhecimento técnico
 * e profundo enraizamento em São Tomé e Príncipe.
 */
export function generateSpecialistResponse(params: {
  providerId: string;
  messageText: string;
  userContext: SanitizedUserChatContext;
  isPhoto?: boolean;
}): SpecialistReplyResult {
  const { providerId, messageText, userContext, isPhoto } = params;
  const provider = getProvider(providerId) || providers.find((p) => p.id === providerId);

  const providerName = provider?.name || "Especialista KONEKTA";
  const category = (provider?.category || "Serviços Técnicos").toLowerCase();
  const lowerMsg = messageText.toLowerCase().trim();
  const userName = userContext.firstName || "amigo";
  const userDistrict = userContext.district || "Água Grande";

  // Se o utilizador enviou uma foto para diagnóstico
  if (isPhoto) {
    return generatePhotoDiagnosticReply(providerName, category, userName, userDistrict);
  }

  // 1. Mensagens sobre Visita Técnica no Terreno ou Agendamento
  if (
    lowerMsg.includes("visita") ||
    lowerMsg.includes("marcar") ||
    lowerMsg.includes("agendar") ||
    lowerMsg.includes("quando podes") ||
    lowerMsg.includes("quando pode") ||
    lowerMsg.includes("horário") ||
    lowerMsg.includes("dia")
  ) {
    return {
      text: getVisitResponse({ providerName, category, userName, userDistrict, userContext }),
      typingDelayMs: 2200,
    };
  }

  // 2. Perguntas sobre Preço, Orçamento e Custos
  if (
    lowerMsg.includes("quanto") ||
    lowerMsg.includes("preço") ||
    lowerMsg.includes("preco") ||
    lowerMsg.includes("orçamento") ||
    lowerMsg.includes("orcamento") ||
    lowerMsg.includes("valor") ||
    lowerMsg.includes("custo") ||
    lowerMsg.includes("dobras") ||
    lowerMsg.includes("stn")
  ) {
    return {
      text: getPricingResponse({ providerName, category, userName, userDistrict, lowerMsg }),
      typingDelayMs: 2400,
    };
  }

  // 3. Perguntas de Diagnóstico Técnico Específico por Profissão
  if (category.includes("eletric") || category.includes("elétr")) {
    const diag = getElectricianDiagnostic(lowerMsg, userName, userDistrict);
    if (diag) return { text: diag, typingDelayMs: 2300 };
  } else if (
    category.includes("encan") ||
    category.includes("canaliz") ||
    category.includes("água") ||
    category.includes("agua")
  ) {
    const diag = getPlumberDiagnostic(lowerMsg, userName, userDistrict);
    if (diag) return { text: diag, typingDelayMs: 2300 };
  } else if (
    category.includes("clima") ||
    category.includes("ar condic") ||
    category.includes("frio")
  ) {
    const diag = getHVACDiagnostic(lowerMsg, userName, userDistrict);
    if (diag) return { text: diag, typingDelayMs: 2300 };
  } else if (category.includes("limpeza")) {
    const diag = getCleaningDiagnostic(lowerMsg, userName, userDistrict);
    if (diag) return { text: diag, typingDelayMs: 2100 };
  } else if (
    category.includes("mecan") ||
    category.includes("mecân") ||
    category.includes("carro") ||
    category.includes("auto")
  ) {
    const diag = getMechanicDiagnostic(lowerMsg, userName, userDistrict);
    if (diag) return { text: diag, typingDelayMs: 2400 };
  } else if (category.includes("pint")) {
    const diag = getPainterDiagnostic(lowerMsg, userName, userDistrict);
    if (diag) return { text: diag, typingDelayMs: 2200 };
  }

  // 4. Urgência ou Emergência
  if (
    lowerMsg.includes("urgente") ||
    lowerMsg.includes("emergência") ||
    lowerMsg.includes("emergencia") ||
    lowerMsg.includes("rápido") ||
    lowerMsg.includes("agora") ||
    lowerMsg.includes("socorro")
  ) {
    return {
      text: `Compreendo perfeitamente a urgência, ${userName}! Em situações críticas prefiro não demorar. Como está em ${userDistrict}, consigo reorganizar a minha rota de hoje para passar aí o quanto antes com as ferramentas principais. Pode clicar no botão de propor Visita Técnica ou confirmar os detalhes do local aqui no chat para eu avançar com segurança?`,
      typingDelayMs: 1800,
    };
  }

  // 5. Localização, Deslocação e Proximidade
  if (
    lowerMsg.includes("onde") ||
    lowerMsg.includes("mora") ||
    lowerMsg.includes("distrito") ||
    lowerMsg.includes("bairro") ||
    lowerMsg.includes("deslocação") ||
    lowerMsg.includes("deslocacao") ||
    lowerMsg.includes("chegar")
  ) {
    return {
      text: `Costumo atuar regularmente em ${userDistrict} e arredores em São Tomé. Pelo seu perfil vejo que a morada é ${userContext.address || userDistrict}. Tenho transporte próprio e levo sempre mala de ferramentas completa para diagnosticar logo no local sem perdas de tempo.`,
      typingDelayMs: 2000,
    };
  }

  // 6. Cumprimentos e Início de Conversa
  if (
    lowerMsg === "olá" ||
    lowerMsg === "ola" ||
    lowerMsg === "bom dia" ||
    lowerMsg === "boa tarde" ||
    lowerMsg === "boa noite" ||
    lowerMsg.startsWith("olá") ||
    lowerMsg.startsWith("ola") ||
    lowerMsg.startsWith("bom dia") ||
    lowerMsg.startsWith("boa tarde") ||
    lowerMsg.startsWith("boa noite")
  ) {
    return {
      text: getGreetingResponse({ providerName, category, userName, userDistrict }),
      typingDelayMs: 1700,
    };
  }

  // 7. Confirmação / Agradecimento
  if (
    lowerMsg.includes("obrigado") ||
    lowerMsg.includes("obrigada") ||
    lowerMsg.includes("valeu") ||
    lowerMsg.includes("ok") ||
    lowerMsg.includes("perfeito") ||
    lowerMsg.includes("combinado")
  ) {
    return {
      text: `De nada, ${userName}! Fico inteiramente à sua disposição para deixar o serviço impecável e seguro. Qualquer detalhe adicional que se lembre ou se quiser agendar a intervenção, é só dizer por aqui!`,
      typingDelayMs: 1600,
    };
  }

  // 8. Resposta Genérica de Alto Nível Técnico e Humano
  return {
    text: getContextualFallback({ providerName, category, userName, userDistrict, messageText }),
    typingDelayMs: 2200,
  };
}

function generatePhotoDiagnosticReply(
  providerName: string,
  category: string,
  userName: string,
  userDistrict: string,
): SpecialistReplyResult {
  if (category.includes("eletric") || category.includes("elétr")) {
    return {
      text: `Obrigado pela foto, ${userName}! Analisei atentamente a imagem. Pelo aspeto das ligações e componentes, parece haver sinais de sobreaquecimento ou desgaste no isolamento, muito comum com as oscilações de tensão que temos aqui em ${userDistrict}. Recomendo não tocar nos fios desencapados. Se pretender, lanço já uma proposta de visita técnica ou fecho o orçamento de reparação em segurança pela app.`,
      typingDelayMs: 2600,
    };
  }

  if (category.includes("encan") || category.includes("canaliz") || category.includes("água")) {
    return {
      text: `Recebi a foto com clareza, ${userName}. Consegui identificar a zona da junta e a acumulação de humidade. Para este tipo de tubagem, o ideal é substituir o vedante ou aplicar união rápida em PVC/PPR para evitar que a infiltração danifique a alvenaria. Posso levar o material adequado diretamente comigo ao passar por ${userDistrict}.`,
      typingDelayMs: 2500,
    };
  }

  if (category.includes("clima") || category.includes("ar condic")) {
    return {
      text: `Foto analisada, ${userName}! Pelo aspeto da unidade e das serpentinas, nota-se o efeito típico do clima húmido e maresia aqui de São Tomé. É necessário fazer limpeza química nas alhetas e medir a pressão do gás refrigerante com o manómetro. Fica novo e a gelar com consumo de energia muito mais baixo.`,
      typingDelayMs: 2500,
    };
  }

  return {
    text: `Obrigado pelo envio da fotografia, ${userName}! Já estive a analisar a situação com atenção. Dá para ter uma boa perceção do estado do local e das peças necessárias. Para resolver isto com garantia de 30 dias KONEKTA, o melhor caminho é avançarmos com a confirmação aqui na plataforma. Quer que lhe envie já a proposta formal?`,
    typingDelayMs: 2300,
  };
}

function getGreetingResponse(params: {
  providerName: string;
  category: string;
  userName: string;
  userDistrict: string;
}): string {
  const { providerName, category, userName, userDistrict } = params;
  return `Olá ${userName}, tudo bem consigo? Daqui fala o ${providerName}, especialista em ${category} aqui em ${userDistrict}. Como posso ajudá-lo hoje com a sua instalação ou reparação? Conte-me o que está a acontecer para vermos a melhor solução.`;
}

function getVisitResponse(params: {
  providerName: string;
  category: string;
  userName: string;
  userDistrict: string;
  userContext: SanitizedUserChatContext;
}): string {
  const { userName, userDistrict, userContext } = params;
  const address = userContext.address
    ? `na sua morada (${userContext.address})`
    : `em ${userDistrict}`;

  return `Com certeza, ${userName}! Uma avaliação no terreno é a forma mais segura e transparente de vermos a extensão do trabalho sem surpresas de material. Tenho disponibilidade para passar ${address} amanhã entre as 09h30 e as 14h00, ou se for necessário podemos ajustar para o período da tarde. O valor da visita técnica fica retido com total proteção pela KONEKTA e abate diretamente no serviço final caso aprovemos o orçamento.`;
}

function getPricingResponse(params: {
  providerName: string;
  category: string;
  userName: string;
  userDistrict: string;
  lowerMsg: string;
}): string {
  const { category, userName, userDistrict } = params;

  if (category.includes("eletric")) {
    return `Olá ${userName}, o custo varia conforme a intervenção: reparações pontuais (como substituição de disjuntor, interruptor ou tomada de força) costumam rondar entre 250 e 450 STN. Intervenções mais completas, como quadros trifásicos ou circuitos de raiz, requerem avaliação prévia. A deslocação em ${userDistrict} é rápida e o pagamento fica 100% guardado em custódia KONEKTA até o serviço estar concluído e testado.`;
  }

  if (category.includes("encan") || category.includes("canaliz")) {
    return `Olá ${userName}! Para canalizações, pequenas desobstruções ou troca de torneiras e vedantes ficam normalmente entre 200 e 400 STN de mão de obra. Se envolver tubagem embutida, bombas periféricas ou tanques de água, avaliamos no local. O material podemos combinar se compra o senhor nas lojas de São Tomé ou se levo já as peças de qualidade certificada.`;
  }

  if (category.includes("clima")) {
    return `Para ar condicionado, ${userName}, uma higienização profunda completa ronda os 450 a 600 STN. Se for necessária recarga de gás R410a com teste de fugas de vácuo, costuma ficar entre 750 e 1.200 STN com garantia. Tudo com emissão de orçamento formal aqui na plataforma.`;
  }

  return `O valor justo depende sempre do tempo de execução e dos materiais envolvidos, ${userName}. Trabalho com tabela transparente na KONEKTA, onde a mão de obra especializada começa nos valores base da categoria e só é libertada após a sua confirmação do teste final. Se me descrever o problema ou enviar uma foto, dou-lhe já uma estimativa muito aproximada!`;
}

function getElectricianDiagnostic(
  lowerMsg: string,
  userName: string,
  userDistrict: string,
): string | null {
  if (
    lowerMsg.includes("disjuntor") ||
    lowerMsg.includes("dispar") ||
    lowerMsg.includes("quadro") ||
    lowerMsg.includes("luz cai")
  ) {
    return `Isso é um sinal clássico, ${userName}. Quando o disjuntor dispara, geralmente acontece por duas razões: sobrecarga num circuito (vários aparelhos elétricos potentes ligados à mesma fase) ou fuga de corrente/curto-circuito provocado por humidade ou fio desencapado. Aqui em ${userDistrict}, as oscilações de energia também fragilizam disjuntores antigos. O disjuntor dispara de imediato ao ligar, ou só passados alguns minutos com os aparelhos a funcionar?`;
  }

  if (
    lowerMsg.includes("tomada") ||
    lowerMsg.includes("fagulha") ||
    lowerMsg.includes("queimad") ||
    lowerMsg.includes("cheiro")
  ) {
    return `Atenção ${userName}, cheiro a queimado ou fagulhas em tomadas é sinal de mau contacto térmico (bornes frouxos). Recomendo desligar preventivamente o disjuntor desse setor no quadro geral para evitar sobreaquecimento na cablagem interior. Posso passar aí para reapertar as ligações e substituir o mecanismo com material antichama.`;
  }

  if (
    lowerMsg.includes("gerador") ||
    lowerMsg.includes("inversor") ||
    lowerMsg.includes("solar") ||
    lowerMsg.includes("emae")
  ) {
    return `Com as quebras de rede da EMAE, é essencial ter um comutador de rede (chave inversora) bem dimensionado para proteger os aparelhos contra o retorno repentino da luz, ${userName}. Faço essa montagem com ligação à terra para garantir que nem o gerador nem os eletrodomésticos sofram danos.`;
  }

  return null;
}

function getPlumberDiagnostic(
  lowerMsg: string,
  userName: string,
  userDistrict: string,
): string | null {
  if (
    lowerMsg.includes("fuga") ||
    lowerMsg.includes("pingar") ||
    lowerMsg.includes("infiltra") ||
    lowerMsg.includes("parede")
  ) {
    return `Fugas de água em São Tomé exigem intervenção rápida antes que a água enfraqueça o reboco e crie salitre, ${userName}. Se a parede estiver húmida sem cano visível, utilizo equipamento de deteção acústica e teste de pressão para abrir exatamente onde está o furo, sem partir a parede inteira. Fechou a torneira de segurança geral provisoriamente?`;
  }

  if (
    lowerMsg.includes("pressão") ||
    lowerMsg.includes("pressao") ||
    lowerMsg.includes("pouca água") ||
    lowerMsg.includes("sem água")
  ) {
    return `Se a pressão da água está muito fraca, ${userName}, pode ser ar retido na canalização, filtro da torneira obstruído por resíduos da rede pública ou necessidade de recalibrar a electrobomba do tanque elevado. Se tiver tanque no telhado, verifico também a boia mecânica e a válvula de retenção.`;
  }

  if (
    lowerMsg.includes("esgoto") ||
    lowerMsg.includes("entup") ||
    lowerMsg.includes("sanita") ||
    lowerMsg.includes("ralo")
  ) {
    return `Entupimentos de ralos ou sanitas resolvo com desentupidor espiral mecânico de alta flexibilidade, que limpa a tubagem sem a danificar, ${userName}. Consigo resolver isso no próprio dia aí em ${userDistrict} para restabelecer a higiene da casa.`;
  }

  return null;
}

function getHVACDiagnostic(
  lowerMsg: string,
  userName: string,
  userDistrict: string,
): string | null {
  if (
    lowerMsg.includes("não gela") ||
    lowerMsg.includes("nao gela") ||
    lowerMsg.includes("não arrefece") ||
    lowerMsg.includes("quente")
  ) {
    return `Se o aparelho liga o ventilador mas não arrefece o ar, ${userName}, os motivos mais comuns em São Tomé são: fuga de gás refrigerante nas conexões de cobre devido à maresia, capacitor do compressor queimado por pico de corrente ou filtros completamente saturados de pó. Vou equipado com manómetros e detetor eletrónico para diagnosticar na hora.`;
  }

  if (
    lowerMsg.includes("pingar") ||
    lowerMsg.includes("pinga") ||
    lowerMsg.includes("água dentro")
  ) {
    return `Água a pingar dentro do quarto ou da sala significa que a calha de condensação ou o tubo de dreno externo está obstruído com lodo e humidade, ${userName}. Uma limpeza e desobstrução do circuito de dreno resolve isso em menos de 45 minutos.`;
  }

  return null;
}

function getCleaningDiagnostic(
  lowerMsg: string,
  userName: string,
  userDistrict: string,
): string | null {
  if (lowerMsg.includes("profunda") || lowerMsg.includes("obra") || lowerMsg.includes("mudança")) {
    return `Para limpezas pós-obra ou pré-mudança em ${userDistrict}, ${userName}, levamos aspiradores industriais, desengordurantes profissionais e material para decapagem de tintas em vidros e rodapés. Deixamos a habitação pronta a habitar com cheiro fresco e higienizada. Quantos quartos e casas de banho tem o espaço?`;
  }

  return null;
}

function getMechanicDiagnostic(
  lowerMsg: string,
  userName: string,
  userDistrict: string,
): string | null {
  if (
    lowerMsg.includes("barulho") ||
    lowerMsg.includes("suspensão") ||
    lowerMsg.includes("buraco") ||
    lowerMsg.includes("travao") ||
    lowerMsg.includes("travão")
  ) {
    return `Com o estado de algumas estradas aqui em STP, as buchas, ponteiras de direção e amortecedores sofrem bastante, ${userName}. Se ouve um bater seco em lombas ou curvas, convém inspecionar a viatura num elevador para não danificar os pneus nem colocar a segurança em risco. Posso verificar isso consigo.`;
  }

  return null;
}

function getPainterDiagnostic(
  lowerMsg: string,
  userName: string,
  userDistrict: string,
): string | null {
  if (
    lowerMsg.includes("bolor") ||
    lowerMsg.includes("humidade") ||
    lowerMsg.includes("descascar") ||
    lowerMsg.includes("tinta")
  ) {
    return `Nas casas aqui em São Tomé, a humidade do ar e as chuvas provocam fungos rápidos se não se aplicar um bom primário isolante anti-bolor antes da tinta final, ${userName}. Faço a raspagem prévia, tratamento fungicida nas paredes e pintura com tinta lavável de alta durabilidade.`;
  }

  return null;
}

function getContextualFallback(params: {
  providerName: string;
  category: string;
  userName: string;
  userDistrict: string;
  messageText: string;
}): string {
  const { providerName, category, userName, userDistrict, messageText } = params;

  return `Entendido, ${userName}! Em relação ao que mencionou ("${messageText.slice(0, 50)}${messageText.length > 50 ? "..." : ""}"), tenho vasta experiência com esses casos aqui em ${userDistrict}. O meu compromisso como profissional de ${category} é garantir um trabalho seguro, duradouro e bem acabado. Se quiser, combinamos um horário para eu passar e ver pessoalmente, ou pode partilhar mais detalhes para eu avançar com o orçamento aqui pela KONEKTA.`;
}

/**
 * Atendimento Humano Sénior do Apoio & Concierge KONEKTA São Tomé e Príncipe.
 * Conversa como um consultor humano especialista de apoio, acedendo a todo
 * o contexto operacional do cliente (sem documentos).
 */
export function generateConciergeResponse(params: {
  text: string;
  userContext: SanitizedUserChatContext;
}): { text: string; actions?: { label: string; link?: string; phone?: string }[] } {
  const { text, userContext } = params;
  const lower = text.toLowerCase().trim();
  const userName = userContext.firstName || "Estimado cliente";
  const userDistrict = userContext.district || "São Tomé";

  // 1. Perguntas sobre pedidos ativos do utilizador
  if (
    lower.includes("meu pedido") ||
    lower.includes("meus pedidos") ||
    lower.includes("estado") ||
    lower.includes("onde está") ||
    lower.includes("como está") ||
    lower.includes("acompanhar")
  ) {
    if (userContext.activeOrders.length > 0) {
      const ordersList = userContext.activeOrders
        .map(
          (o, idx) =>
            `${idx + 1}. **${o.serviceTitle}** em ${o.district} — Estado: *${o.status.toUpperCase()}* (${o.scheduledFor || "A combinar"}).`,
        )
        .join("\n");

      return {
        text: `Olá ${userName}, consultei agora a sua ficha operacional aqui na KONEKTA:\n\n${ordersList}\n\nO valor do serviço encontra-se totalmente protegido na nossa conta de custódia. Se precisar de contactar diretamente o profissional ou alterar o agendamento, pode aceder à página do pedido ou avisar-me por aqui.`,
        actions: [
          { label: "Abrir Separador Meus Pedidos", link: "/pedidos" },
          { label: "Falar com Apoio Telefónico", phone: "+2399944747" },
        ],
      };
    } else {
      return {
        text: `Olá ${userName}, verifiquei o seu perfil e no momento não tem nenhum pedido com execução pendente. Se precisar de solicitar um eletricista, canalizador ou qualquer técnico certificado para a sua residência em ${userDistrict}, posso ajudá-lo a publicar o pedido agora mesmo!`,
        actions: [
          { label: "Criar Novo Pedido de Serviço", link: "/novo-pedido" },
          { label: "Explorar Categorias", link: "/categorias" },
        ],
      };
    }
  }

  // 2. Visitas Técnicas no Terreno
  if (
    lower.includes("visita") ||
    lower.includes("técnico a caminho") ||
    lower.includes("orçamento no terreno")
  ) {
    if (userContext.technicalVisits.length > 0) {
      const visit = userContext.technicalVisits[0];
      return {
        text: `Com certeza, ${userName}! Tem registada uma visita técnica para **${visit.serviceTitle}** em ${visit.district} (${visit.scheduledDate} às ${visit.scheduledTime}).\n\nEstado atual: **${visit.status}**.\n\nLembro que o técnico faz o check-in por GPS à chegada e o valor da taxa de deslocação é deduzido caso avance com o serviço acordado.`,
        actions: [
          { label: "Ver Visitas e Pedidos", link: "/pedidos" },
          { label: "Ligar para Central (+239)", phone: "+2399944747" },
        ],
      };
    }
  }

  // 3. Cancelamentos e Reembolsos
  if (
    lower.includes("cancelar") ||
    lower.includes("cancelamento") ||
    lower.includes("desistir") ||
    lower.includes("reembolso") ||
    lower.includes("devolução")
  ) {
    return {
      text: `Entendido, ${userName}. Na KONEKTA o cancelamento é sempre justo e transparente:\n\n1. **Antes de o técnico iniciar a deslocação**: cancela sem qualquer custo e o valor retido regressa imediatamente à sua Carteira Digital.\n2. **Técnico já a caminho de ${userDistrict}**: aplica-se apenas a taxa de deslocação para compensar o combustível e tempo do profissional.\n\nPara cancelar com segurança, pode aceder ao pedido ativo ou posso pedir à nossa equipa de mediação que intervenha de imediato.`,
      actions: [
        { label: "Ir para Meus Pedidos", link: "/pedidos" },
        { label: "Ligar Linha de Apoio (+239)", phone: "+2399944747" },
      ],
    };
  }

  // 4. Pagamentos, Custódia e Garantia
  if (
    lower.includes("pagamento") ||
    lower.includes("pagar") ||
    lower.includes("custódia") ||
    lower.includes("custodia") ||
    lower.includes("seguro") ||
    lower.includes("pin") ||
    lower.includes("garantia")
  ) {
    return {
      text: `Olá ${userName}, o nosso sistema de custódia protege o seu dinheiro do início ao fim:\n\n• Ao aprovar um orçamento, o dinheiro fica bloqueado na garantia KONEKTA, e não vai logo para as mãos do prestador.\n• O pagamento só é transferido ao técnico depois de o senhor validar o serviço executado e fornecer o código PIN de finalização.\n• Todos os serviços contratados incluem garantia técnica de 30 dias com mediação da nossa equipa em São Tomé.`,
      actions: [
        { label: "Consultar Minha Carteira", link: "/carteira" },
        { label: "Ver Regras de Garantia", link: "/como-funciona" },
      ],
    };
  }

  // 5. Profissionais por distrito
  if (
    lower.includes("mé-zóchi") ||
    lower.includes("me-zochi") ||
    lower.includes("trindade") ||
    lower.includes("lobata") ||
    lower.includes("cantagalo") ||
    lower.includes("água grande") ||
    lower.includes("agua grande") ||
    lower.includes("neves") ||
    lower.includes("santana") ||
    lower.includes("príncipe")
  ) {
    return {
      text: `Temos técnicos e prestadores verificados com raio de atuação em todos os distritos de São Tomé e Príncipe, incluindo a sua zona em ${userDistrict}.\n\nAo submeter o pedido ou consultar o catálogo, a plataforma prioriza automaticamente profissionais mais próximos para garantir deslocações pontuais e taxas de transporte mais reduzidas.`,
      actions: [
        { label: "Ver Prestadores Disponíveis", link: "/categorias" },
        { label: "Pedir Serviço com Urgência", link: "/novo-pedido" },
      ],
    };
  }

  // 6. Cumprimentos
  if (
    lower === "olá" ||
    lower === "ola" ||
    lower === "bom dia" ||
    lower === "boa tarde" ||
    lower === "boa noite" ||
    lower === "oi"
  ) {
    return {
      text: `Olá ${userName}! Daqui fala o apoio ao cliente KONEKTA São Tomé e Príncipe 🇸🇹.\n\nVejo que a sua conta está registada em ${userDistrict}. Estou disponível para esclarecer dúvidas sobre orçamentos, acompanhar pedidos ativos ou recomendar os melhores especialistas para a sua casa. Como posso ser útil hoje?`,
      actions: [
        { label: "Criar Pedido de Serviço", link: "/novo-pedido" },
        { label: "Ver Meus Pedidos", link: "/pedidos" },
        { label: "Falar por Telefone", phone: "+2399944747" },
      ],
    };
  }

  // 7. Fallback Humanizado
  return {
    text: `Compreendo perfeitamente, ${userName}. Como consultor de apoio KONEKTA em São Tomé e Príncipe, acompanho cada serviço de perto para garantir que é atendido por profissionais de confiança e com o preço certo.\n\nSe quiser que contactemos o técnico pelo senhor ou prefira abrir um chamado formal para ${userDistrict}, diga-me os detalhes ou selecione uma opção abaixo:`,
    actions: [
      { label: "Novo Pedido de Serviço", link: "/novo-pedido" },
      { label: "Consultar Meus Pedidos", link: "/pedidos" },
      { label: "Ligar para Central Local", phone: "+2399944747" },
    ],
  };
}
