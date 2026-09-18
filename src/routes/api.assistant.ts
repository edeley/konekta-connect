import { createFileRoute } from "@tanstack/react-router";
import { geminiEngine } from "../lib/gemini-service";
import {
  stripAnyDocumentFields,
  type SanitizedUserChatContext,
} from "../lib/chat-specialist-context";

interface GroundingPlace {
  title: string;
  uri?: string;
  snippet?: string;
}

interface ActionLink {
  label: string;
  url: string;
  icon?: string;
}

export const Route = createFileRoute("/api/assistant")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            status: "ok",
            endpoint: "/api/assistant",
            hasApiKey: Boolean(process.env.GEMINI_API_KEY),
            model: "gemini-3.8-flash",
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            message?: string;
            messages?: Array<{ role: "user" | "model"; text: string }>;
            history?: Array<{ role: "user" | "model"; text: string }>;
            role?: "concierge" | "specialist" | "fast" | "maps";
            userContext?: SanitizedUserChatContext;
            userLocation?: { latitude: number; longitude: number };
            forceMapsGrounding?: boolean;
          };

          // Suporta tanto o formato unificado { messages: [...] } quanto { message, history }
          let rawMessages: Array<{ role: "user" | "model"; text: string }> = [];
          if (Array.isArray(body.messages) && body.messages.length > 0) {
            rawMessages = body.messages;
          } else if (body.message && body.message.trim()) {
            const hist = Array.isArray(body.history) ? body.history : [];
            rawMessages = [...hist, { role: "user", text: body.message.trim() }];
          }

          if (rawMessages.length === 0) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Nenhuma mensagem fornecida para o assistente.",
              }),
              {
                status: 400,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const {
            role = "concierge",
            userContext: rawUserContext,
            userLocation = { latitude: 0.3365, longitude: 6.7273 }, // Coordenadas de São Tomé
            forceMapsGrounding = false,
          } = body;

          // Higienização estrita de segurança do contexto (NUNCA expõe documentos ou senhas)
          const userContext: SanitizedUserChatContext = rawUserContext
            ? (stripAnyDocumentFields(rawUserContext) as SanitizedUserChatContext)
            : {
                name: "Utilizador KONEKTA",
                firstName: "Utilizador",
                phone: "+239 9900000",
                role: "cliente",
                district: "Água Grande",
                city: "São Tomé",
                financialState: {
                  walletBalance: 0,
                  currency: "STN",
                  escrowInCustody: 0,
                  totalSpentSTN: 0,
                  recentTransactions: [],
                },
                activeOrders: [],
                history: {
                  completedOrdersCount: 0,
                  completedOrders: [],
                  cancelledOrdersCount: 0,
                  pastTechnicalVisits: [],
                  openRequests: [],
                },
                technicalVisits: [],
                hasCompletedOrders: false,
                memberSinceFormatted: "Membro KONEKTA",
              };

          const lastUserMessage = rawMessages[rawMessages.length - 1]?.text || "";
          const lowerMsg = lastUserMessage.toLowerCase();

          // Deteção inteligente de necessidade de Google Maps
          const isMapsQuery =
            forceMapsGrounding ||
            role === "maps" ||
            lowerMsg.includes("onde fica") ||
            lowerMsg.includes("onde comprar") ||
            lowerMsg.includes("loja") ||
            lowerMsg.includes("ferragem") ||
            lowerMsg.includes("materiais") ||
            lowerMsg.includes("distância") ||
            lowerMsg.includes("estrada") ||
            lowerMsg.includes("distrito") ||
            lowerMsg.includes("são tomé") ||
            lowerMsg.includes("príncipe") ||
            lowerMsg.includes("perto de") ||
            lowerMsg.includes("localização") ||
            lowerMsg.includes("morada") ||
            lowerMsg.includes("mapa");

          // 1. Resumo dos Pedidos Ativos para injeção contextual viva
          let activeOrdersSummary = "Nenhum pedido ativo no momento.";
          if (userContext.activeOrders && userContext.activeOrders.length > 0) {
            activeOrdersSummary = userContext.activeOrders
              .map(
                (o) =>
                  `• Pedido #${o.id}: Serviço "${o.serviceTitle}" · Estado: ${o.status.toUpperCase()} · Agendado: ${o.scheduledFor} · Distrito: ${o.district} · Valor: ${o.total} Dobras (STN)`,
              )
              .join("\n");
          }

          // 2. Resumo das Visitas Técnicas Ativas
          let activeVisitsSummary = "Nenhuma visita técnica agendada.";
          if (userContext.technicalVisits && userContext.technicalVisits.length > 0) {
            activeVisitsSummary = userContext.technicalVisits
              .map(
                (v) =>
                  `• Visita #${v.id}: "${v.serviceTitle}" · Estado: ${v.status} · Data: ${v.scheduledDate} às ${v.scheduledTime} · Distrito: ${v.district} · Taxa Tabelada: 150 STN`,
              )
              .join("\n");
          }

          // 3. Resumo do Histórico Completo
          let historySummary = "Sem histórico prévio.";
          if (userContext.history) {
            const hist = userContext.history;
            const completedItems =
              hist.completedOrders && hist.completedOrders.length > 0
                ? hist.completedOrders
                    .map(
                      (co) =>
                        `• Concluído: "${co.serviceTitle}" (${co.total} STN) em ${co.district}${co.providerName ? ` com ${co.providerName}` : ""}${co.date ? ` a ${co.date}` : ""}`,
                    )
                    .join("\n")
                : "Nenhum serviço concluído registado.";

            const pastVisitsItems =
              hist.pastTechnicalVisits && hist.pastTechnicalVisits.length > 0
                ? hist.pastTechnicalVisits
                    .map(
                      (pv) =>
                        `• Visita Passada: "${pv.serviceTitle}" · Estado: ${pv.status} · Data: ${pv.scheduledDate}${pv.diagnosticNotes ? ` · Diagnóstico: ${pv.diagnosticNotes}` : ""}`,
                    )
                    .join("\n")
                : "Nenhuma visita técnica anterior.";

            const openReqsItems =
              hist.openRequests && hist.openRequests.length > 0
                ? hist.openRequests
                    .map(
                      (or) =>
                        `• Pedido Aberto: "${or.title}" em ${or.district} (${or.proposalsCount} propostas recebidas)`,
                    )
                    .join("\n")
                : "Nenhum pedido de cotação aberto.";

            historySummary = `Total de Serviços Concluídos: ${hist.completedOrdersCount} pedidos | Cancelamentos: ${hist.cancelledOrdersCount}\n${completedItems}\n\nVisitas Anteriores:\n${pastVisitsItems}\n\nPedidos Abertos de Cotação:\n${openReqsItems}`;
          }

          // 4. Resumo Financeiro Atual da App (STN Dobras)
          let financialSummary = "Dados financeiros padrão.";
          if (userContext.financialState) {
            const fs = userContext.financialState;
            const txList =
              fs.recentTransactions && fs.recentTransactions.length > 0
                ? fs.recentTransactions
                    .map(
                      (tx) =>
                        `  - [${tx.kind === "in" ? "ENTRADA" : "SAÍDA"}] ${tx.label}: ${tx.amount} STN (${tx.dateFormatted})`,
                    )
                    .join("\n")
                : "  - Nenhuma transação recente.";

            financialSummary = `• Saldo Disponível na Carteira Digital: ${fs.walletBalance} Dobras (STN)
• Fundos Bloqueados em Custódia Segura (Escrow): ${fs.escrowInCustody} Dobras (STN)
• Total Investido / Transacionado em Serviços: ${fs.totalSpentSTN} Dobras (STN)
${typeof fs.providerBalance === "number" ? `• [Área do Prestador] Saldo Disponível para Levantamento: ${fs.providerBalance} STN` : ""}
${typeof fs.providerPendingBalance === "number" ? `• [Área do Prestador] Saldo Pendente a Concluir: ${fs.providerPendingBalance} STN` : ""}
${typeof fs.providerWithdrawnBalance === "number" ? `• [Área do Prestador] Total Já Levantado: ${fs.providerWithdrawnBalance} STN` : ""}
${typeof fs.providerDebt === "number" ? `• [Área do Prestador] Dívida de Comissões Presenciais: ${fs.providerDebt} STN (Tolerância Máxima: 300 STN | Bloqueado: ${fs.isProviderBlockedForDebt ? "SIM ⚠️" : "NÃO ✅"})` : ""}
• Transações Recentes na Carteira:
${txList}`;
          }

          // 5. Resumo do Perfil Profissional (se aplicável)
          let providerSummary = "Utilizador cliente padrão.";
          if (userContext.providerProfile) {
            const pp = userContext.providerProfile;
            const servicesList =
              pp.services && pp.services.length > 0
                ? pp.services.map((s) => `  - ${s.name}: ${s.price} STN`).join("\n")
                : "  - Serviços sob orçamento.";

            providerSummary = `• Especialidade Principal: ${pp.category || "Técnico Especialista"}
• Experiência: ${pp.experienceYears || 5}+ anos no terreno em STP
• Classificação: ${pp.rating || 5.0} estrelas | Trabalhos Concluídos: ${pp.completedJobs || 0}
• Apresentação Técnica: "${pp.bio || "Profissional certificado KONEKTA"}"
• Tabela de Serviços e Preços Base:
${servicesList}`;
          }

          // Sistema de Instrução Avançado do Gemini (Assistente Técnico & Consultor KONEKTA CONNECT STP)
          const systemInstruction = `Você é o ASSISTENTE TÉCNICO OFICIAL e CONSULTOR DE NEGÓCIOS da plataforma KONEKTA CONNECT em São Tomé e Príncipe (STP) 🇸🇹.
Você está alimentado pelo modelo de inteligência técnica avançada Gemini (gemini-3.8-flash) do Google.

====================================================================
DIRETRIZ MÁXIMA DE IDENTIDADE: NÃO SE ESQUEÇA QUE VOCÊ É O ASSISTENTE TÉCNICO!
====================================================================
Você reúne a competência de um Engenheiro Prático e Mestre de Obras Especialista (com domínio total em Eletricidade, Climatização/Frio, Canalização, Bombas de Água, Geradores, Construção e Mecânica) COM a visão estratégica de um Consultor de Negócios e Gestão Financeira especializado no mercado de São Tomé e Príncipe.

### 👤 DADOS COMPLETOS DO UTILIZADOR (CONTEXTO EM TEMPO REAL):
- Nome: ${userContext.name} (Dirija-se cordialmente como ${userContext.firstName})
- Função no App: ${userContext.role.toUpperCase()}
- Localização: ${userContext.district}, ${userContext.city} (Endereço: ${userContext.address || "São Tomé e Príncipe"})
- Membro desde: ${userContext.memberSinceFormatted}
- Telefone: ${userContext.phone}

### 💰 ESTADO FINANCEIRO ATUAL DA CONTA NA APP (DOBRAS - STN):
${financialSummary}

### 📋 HISTÓRICO E ATIVIDADES DO UTILIZADOR:
- Pedidos Ativos em Andamento:
${activeOrdersSummary}
- Visitas Técnicas Ativas:
${activeVisitsSummary}
- Histórico Geral (Serviços Anteriores e Propostas):
${historySummary}
${userContext.providerProfile ? `\n### 🛠️ PERFIL TÉCNICO PROFISSIONAL (PRESTADOR):\n${providerSummary}` : ""}

====================================================================
DIRETRIZES DE ATUAÇÃO E PROTOCOLOS 'KONEKTA CONNECT':
====================================================================

1. **ASSISTÊNCIA TÉCNICA RIGOROSA & RESOLUÇÃO DE AVARIAS ("ASSISTENTE TÉCNICO")**:
   Quando o utilizador relatar qualquer falha ou avaria, aja imediatamente como o assistente técnico especializado:
   • **Segurança em Primeiro Lugar**: Indique o procedimento preventivo imediato (desligar o disjuntor geral no quadro elétrico, cortar o registro geral de água, desligar a chave de combustível do gerador).
   • **Diagnóstico de Engenharia Prática**: Identifique as prováveis causas raízes levando em conta o ambiente tropical de São Tomé (alta humidade relativa, maresia corrosiva costeira, oscilações severas de tensão 220V da EMAE, água com sedimentos/areia que danifica selos mecânicos de bombas, calcário, etc.).
   • **Eletricidade**: Análise de disparos de disjuntores magnetotérmicos vs diferenciais (30mA), curtos-circuitos por cabos roídos ou humidade, sobrecargas por ar condicionado ou termoacumuladores, necessidade de cabos de 2.5mm² para tomadas e 4/6mm² para aparelhos potentes, haste de aterramento (terra).
   • **Climatização e Refrigeração**: Frigoríficos/geladeiras que não gelam (falta de gás R134a/R600a, relé térmico/PTC desarmando, compressor travado, termostato avariado); Splits de ar condicionado a pingar água para dentro (dreno de condensados entupido por lodo/fungo tropical), perda de gás R410a/R32 (tubos congelados), limpeza periódica de filtros.
   • **Canalização e Bombas de Água**: Falta de pressão, bombas periféricas/autoferrantes que trabalham a seco sem puxar água (perda de ferragem/escorvamento, ar na linha de sucção, válvula de retenção de pé encravada com areia), pressostato descalibrado, boias elétricas de corte de tanques elevados.
   • **Geradores a Gasolina e Diesel**: Gerador que não arranca ou desliga com carga (vela carbonizada, gasolina envelhecida com água no carburador, purga de ar no filtro de gasóleo, escovas de carvão gastas ou regulador automático de voltagem AVR queimado).
   • **Onde Comprar Peças e Materiais em STP**: Cite lojas reais do mercado local santomense (Sococil na Avenida 12 de Julho para materiais elétricos, sanitários e bombas; Canto de Monte para ferragens e construção; lojas de eletricidade e refrigeração na Baixa de São Tomé; oficinas em Trindade e Guadalupe).
   • **Solução Definitiva**: Oriente a agendar a Visita Técnica Oficial de 150 STN ou publicar o pedido na app para que um técnico certificado e equipado faça a intervenção com segurança e garantia.

2. **CONSELHOS DE NEGÓCIOS & OTIMIZAÇÃO FINANCEIRA (BUSINESS ADVICE)**:
   • **Para Prestadores**:
     - *Precificação Concorrencial em Dobras (STN)*: Alinhe os orçamentos com a tabela de referência do mercado da Konekta. Separe sempre claramente o custo de mão de obra do custo de materiais.
     - *Gestão do Limite de Dívida de Comissões (300 STN)*: Oriente o prestador a liquidar comissões de pagamentos presenciais antes que a dívida atinja os 300 STN, prevenindo o bloqueio automático de novas oportunidades.
     - *Diferencial Profissional*: Elaborar diagnósticos fotográficos antes/depois, pontualidade no GPS Check-in, e propor planos de manutenção preventiva (revisão de A/C antes da Gravana/seca e revisão de geradores antes da época das chuvas tropicais).
   • **Para Clientes**:
     - *Planeamento de Custos e Orçamento*: Evitar orçamentos superfaturados aproveitando a taxa tabelada de 150 STN para inspeção prévia no terreno.
     - *Proteção Total por Custódia (Escrow)*: O dinheiro fica garantido na plataforma. O prestador só recebe quando o cliente testar e fornecer o **PIN secreto de 4 dígitos**.
     - *Garantia Técnica de 30 Dias*: Qualquer serviço executado pela plataforma conta com 30 dias de cobertura com intervenção gratuita se persistir a anomalia.

3. **CONSCIÊNCIA CONTEXTUAL PROFUNDA**:
   • Conecte a sua resposta ao histórico real do utilizador. Se o cliente tiver ${userContext.activeOrders.length} pedido(s) ativo(s), faça menção direta a eles quando fizer sentido.
   • Se o utilizador perguntar pelo saldo da carteira ou transações, utilize com precisão o saldo atual (${userContext.financialState.walletBalance} STN) e os fundos protegidos em custódia (${userContext.financialState.escrowInCustody} STN).

4. **BLINDAGEM E INTEGRIDADE DA PLATAFORMA**:
   • Jamais incentive ou consinta pagamentos por fora da app ou partilha de contactos pessoais no chat para fugir da plataforma. Explique que pagar por fora extingue a garantia de 30 dias, anula a proteção de custódia e expõe o utilizador a fraudes sem amparo legal.

5. **COMUNICAÇÃO**:
   • Tom caloroso, solícito e assertivo de São Tomé e Príncipe ("Leve-Leve", profissional, educado e focado na solução).
   • Responda em Markdown limpo, estruturado com tópicos diretos e passos numerados claros.`;

          // Formatar conteúdo multi-turn no padrão da API do Gemini
          const contents = rawMessages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          }));

          let replyText = "";
          let usedModel = "gemini-3.8-flash";
          const groundingPlaces: GroundingPlace[] = [];

          if (process.env.GEMINI_API_KEY) {
            const config: Record<string, unknown> = {
              systemInstruction,
            };

            // Adicionar ferramenta de Google Maps se relevante para geolocalização em STP
            if (isMapsQuery || role === "maps") {
              config.tools = [{ googleMaps: {} }];
              config.toolConfig = {
                retrievalConfig: {
                  latLng: {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  },
                },
              };
            }

            try {
              const res = await geminiEngine.generateWithCascade({
                contents,
                config,
                models: ["gemini-3.8-flash", "gemini-3.1-flash-lite"],
                cacheCategory: `assistant-${role}`,
                rawUserQuery: lastUserMessage,
              });

              replyText = res.text;
              usedModel = res.model;
              if (res.groundingPlaces && res.groundingPlaces.length > 0) {
                groundingPlaces.push(...res.groundingPlaces);
              }
            } catch (engineErr) {
              console.warn(
                "[AssistenteAPI] Falha transitória com motor Gemini, ativando fallback local:",
                engineErr instanceof Error ? engineErr.message : String(engineErr),
              );
            }
          }

          if (replyText) {
            // Determinar sugestão de ação inteligente para o utilizador
            let actionLink: ActionLink | undefined;
            if (
              userContext.activeOrders.length > 0 &&
              (lowerMsg.includes("meu pedido") ||
                lowerMsg.includes("estado") ||
                lowerMsg.includes("pin") ||
                lowerMsg.includes("cancelar") ||
                lowerMsg.includes("prestador"))
            ) {
              const firstOrder = userContext.activeOrders[0];
              actionLink = {
                label: `Ver Pedido #${firstOrder.id} (${firstOrder.serviceTitle})`,
                url: `/pedido/${firstOrder.id}`,
                icon: "briefcase",
              };
            } else if (
              lowerMsg.includes("novo pedido") ||
              lowerMsg.includes("preciso de") ||
              lowerMsg.includes("contratar") ||
              lowerMsg.includes("eletricista") ||
              lowerMsg.includes("canalizador") ||
              lowerMsg.includes("reparar") ||
              lowerMsg.includes("avaria")
            ) {
              actionLink = {
                label: "Publicar Novo Pedido de Serviço",
                url: "/novo-pedido",
                icon: "plus",
              };
            } else if (
              lowerMsg.includes("carteira") ||
              lowerMsg.includes("saldo") ||
              lowerMsg.includes("recarregar") ||
              lowerMsg.includes("depositar") ||
              lowerMsg.includes("pagamento")
            ) {
              actionLink = {
                label: "Aceder à Minha Carteira Digital",
                url: "/carteira",
                icon: "wallet",
              };
            } else if (lowerMsg.includes("prestador") || lowerMsg.includes("trabalhar")) {
              actionLink = {
                label: "Tornar-se Prestador Verificado KONEKTA",
                url: "/tornar-prestador",
                icon: "user-check",
              };
            }

            return new Response(
              JSON.stringify({
                success: true,
                text: replyText,
                model: usedModel,
                groundingPlaces,
                isMapsGrounded: groundingPlaces.length > 0 || isMapsQuery,
                actionLink,
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          // Fallback local robusto caso haja indisponibilidade temporária do modelo na rede
          let fallbackReply = `Olá, **${userContext.firstName}**! Sou o seu **Assistente Técnico e Consultor KONEKTA CONNECT** em São Tomé e Príncipe.`;

          if (userContext.activeOrders.length > 0) {
            const firstOrd = userContext.activeOrders[0];
            fallbackReply += `\n\nIdentifiquei que tem o pedido **#${firstOrd.id} (${firstOrd.serviceTitle})** em estado **${firstOrd.status}**.`;
          }

          if (
            lowerMsg.includes("saldo") ||
            lowerMsg.includes("carteira") ||
            lowerMsg.includes("finança") ||
            lowerMsg.includes("dinheiro")
          ) {
            const fs = userContext.financialState;
            fallbackReply += `\n\n💰 **Estado Financeiro da sua Conta:**\n• **Saldo Disponível na Carteira:** ${fs.walletBalance} STN\n• **Fundos Bloqueados em Custódia Segura:** ${fs.escrowInCustody} STN\n• **Total Investido na Plataforma:** ${fs.totalSpentSTN} STN\n\nTodos os pagamentos são protegidos por custódia (escrow) e só são transferidos após validação do PIN de 4 dígitos.`;
          } else if (
            lowerMsg.includes("pagar") ||
            lowerMsg.includes("pin") ||
            lowerMsg.includes("custodia")
          ) {
            fallbackReply += `\n\n🔒 **Como funciona o Pagamento Seguro:**\n1. O valor fica retido na custódia da app durante a execução do serviço.\n2. Quando o trabalho for concluído com qualidade, forneça o seu **PIN secreto de 4 dígitos** ao prestador para libertar os fundos.\n3. O serviço fica protegido pela nossa **garantia técnica de 30 dias**.`;
          } else if (
            lowerMsg.includes("geladeira") ||
            lowerMsg.includes("frigorifico") ||
            lowerMsg.includes("frio") ||
            lowerMsg.includes("ar condicionado")
          ) {
            fallbackReply += `\n\n❄️ **Diagnóstico Técnico de Refrigeração & Climatização:**\n• **Frigorífico que não gela / desliga**: Verifique se o compressor está a arrancar ou a desarmar com estalido (relé térmico/PTC ou capacitor). Em São Tomé, a maresia e as oscilações de 220V da EMAE danificam frequentemente os relés e vedantes.\n• **Falta de Gás (R134a / R600a)**: Se o motor trabalha continuamente mas as placas não arrefecem, pode haver fuga de gás refrigerante.\n• **Split de Ar Condicionado que pinga**: Quase sempre é o tubo de dreno de condensados entupido com lodo tropical ou falta de limpeza de filtros.\n\nRecomendo agendar uma **Visita Técnica Tabelada de 150 STN** com um técnico de frio verificado da Konekta.`;
          } else if (
            lowerMsg.includes("avaria") ||
            lowerMsg.includes("curto") ||
            lowerMsg.includes("disjuntor") ||
            lowerMsg.includes("eletric")
          ) {
            fallbackReply += `\n\n⚡ **Segurança e Diagnóstico Elétrico:**\n1. **Ação Imediata**: Desligue o disjuntor geral no quadro elétrico antes de inspecionar qualquer tomada ou equipamento.\n2. **Disjuntor a disparar**: Se for o Diferencial (30mA), há fuga para a terra (comum devido à humidade de STP). Se for o Magnetotérmico, trata-se de curto-circuito ou sobrecarga.\n3. **Peças em STP**: Pode adquirir disjuntores e cabos na **Sococil** (Av. 12 de Julho) ou lojas na Baixa de São Tomé.\n4. Para a sua segurança, agende um eletricista certificado na app para teste com multímetro.`;
          } else if (
            lowerMsg.includes("bomba") ||
            lowerMsg.includes("água") ||
            lowerMsg.includes("fuga") ||
            lowerMsg.includes("cano")
          ) {
            fallbackReply += `\n\n💧 **Diagnóstico Hidráulico & Bombas de Água:**\n1. **Feche o registro geral** de água para conter inundações.\n2. **Bomba que não puxa água**: Verifique o escorvamento/ferragem do corpo da bomba e a válvula de retenção de pé no poço/cisterna (areia a bloquear a vedação).\n3. **Pressostato**: Verifique a calibragem e membrana do balão autoclave.`;
          } else {
            fallbackReply += `\n\nComo seu assistente técnico e consultor, posso ajudá-lo com diagnósticos técnicos (eletricidade, frio, canalização, geradores), estimativa de preços em Dobras (STN), lojas de peças em São Tomé (Sococil, Canto de Monte) e gestão financeira da sua conta.`;
          }

          return new Response(
            JSON.stringify({
              success: true,
              text: fallbackReply,
              model: "konekta-profile-assistant",
              groundingPlaces: [],
              isMapsGrounded: false,
              actionLink:
                userContext.activeOrders.length > 0
                  ? {
                      label: `Ver Meu Pedido #${userContext.activeOrders[0].id}`,
                      url: `/pedido/${userContext.activeOrders[0].id}`,
                    }
                  : { label: "Criar Pedido de Serviço", url: "/novo-pedido" },
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Erro interno no assistente Gemini:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: "Falha interna ao processar a resposta do assistente.",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
