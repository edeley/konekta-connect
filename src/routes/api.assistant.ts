import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI } from "@google/genai";
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
                activeOrders: [],
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

          // Resumo dos pedidos ativos para injeção contextual viva
          let activeOrdersSummary = "Nenhum pedido ativo no momento.";
          if (userContext.activeOrders && userContext.activeOrders.length > 0) {
            activeOrdersSummary = userContext.activeOrders
              .map(
                (o) =>
                  `• Pedido #${o.id}: Serviço "${o.serviceTitle}" · Estado: ${o.status.toUpperCase()} · Agendado: ${o.scheduledFor} · Distrito: ${o.district} · Valor: ${o.total} Dobras (STN)`,
              )
              .join("\n");
          }

          let activeVisitsSummary = "Nenhuma visita técnica agendada.";
          if (userContext.technicalVisits && userContext.technicalVisits.length > 0) {
            activeVisitsSummary = userContext.technicalVisits
              .map(
                (v) =>
                  `• Visita #${v.id}: "${v.serviceTitle}" · Estado: ${v.status} · Data: ${v.scheduledDate} às ${v.scheduledTime} · Distrito: ${v.district}`,
              )
              .join("\n");
          }

          // Sistema de Instrução Avançado do Gemini (Assistente Especialista KONEKTA STP)
          const systemInstruction = `Você é o KONEKTA AI, o Assistente Inteligente e Especialista Oficial da plataforma KONEKTA em São Tomé e Príncipe (STP) 🇸🇹.
Você está alimentado pelo modelo gratuito e de alta inteligência Gemini (gemini-3.8-flash) do Google.

### DADOS ATUALIZADOS DO UTILIZADOR (TEMPO REAL):
- Nome Completo: ${userContext.name} (Chame-o cordialmente por ${userContext.firstName})
- Perfil: ${userContext.role.toUpperCase()}
- Distrito de Residência: ${userContext.district}, São Tomé e Príncipe
- Membro desde: ${userContext.memberSinceFormatted}
- Pedidos Ativos na App:
${activeOrdersSummary}
- Visitas Técnicas Ativas:
${activeVisitsSummary}

### AS SUAS DIRETRIZES FUNDAMENTAIS:
1. **CONHECIMENTO PROFUNDO DO UTILIZADOR**:
   - Você SEMPRE sabe quem é o utilizador. Se ele tiver pedidos em curso, faça referência direta a eles quando for relevante (ex: "Em relação ao seu pedido de ${userContext.activeOrders[0]?.serviceTitle || "serviço"}...").
   - Trate o utilizador pelo seu primeiro nome (${userContext.firstName}) com respeito, simpatia e calor humano típico de São Tomé e Príncipe ("Leve-Leve", acolhedor e profissional).

2. **ESPECIALISTA EM RESOLVER PROBLEMAS DA APP**:
   - **Custódia Segura (Escrow)**: Explique com clareza que o dinheiro do cliente fica protegido pela app e só é transferido ao prestador quando o cliente validar o código PIN secreto de 4 dígitos.
   - **Código PIN de Conclusão**: O PIN de 4 dígitos está disponível no ecrã do pedido ativo. Sem esse PIN, o prestador não recebe, garantindo que o serviço foi bem executado.
   - **Cancelamentos**: Antes do prestador iniciar a deslocação, o cancelamento é 100% gratuito e o dinheiro volta à carteira imediatamente. Se o técnico já se deslocou, cobra-se a taxa de deslocação acordada (mínimo 150 STN).
   - **Visita Técnica Tabelada**: Diagnóstico presencial transparente no valor fixo de 150 Dobras (STN).
   - **Garantia Técnica de 30 Dias**: Todos os serviços concluídos na app têm garantia de re-intervenção gratuita em caso de defeito.

3. **ESPECIALISTA EM RESOLVER PROBLEMAS DO UTILIZADOR (AVARIAS E ENGENHARIA)**:
   - Se o utilizador relatar uma avaria (ex: curto-circuito, disjuntor a disparar, fuga de água, ar condicionado a deitar água ou sem gelar, infiltrações, motor de bomba de água, pintura danificada por maresia tropical):
     a) Dê orientações imediatas de **segurança** (ex: desligar o disjuntor geral, fechar a torneira de segurança de água).
     b) Faça um diagnóstico técnico rápido com prováveis causas raízes adaptadas ao clima tropical de São Tomé.
     c) Recomende materiais necessários e onde encontrar em STP (ex: Sococil na Avenida 12 de Julho, lojas de ferragens na baixa de São Tomé, Canto de Monte).
     d) Indique a contratação de um especialista verificado na app para evitar danos maiores.

4. **FLUXOS DIRETOS AO PROPÓSITO**:
   - Seja objetivo, claro e sem rodeios teóricos inúteis. Dê passos numerados práticos (Passo 1, Passo 2, Passo 3).
   - Formate a resposta em Markdown limpo (títulos em negrito, tópicos claros, valores em Dobras STN).

5. **BLINDAGEM CONTRA NEGOCIAÇÕES FORA DA APP**:
   - Jamais incentive ou autorize negociações por fora da app, troca de telefones pessoais ou pagamentos em dinheiro direto sem registo.
   - Esclareça com firmeza que transações fora da plataforma anulam a garantia técnica de 30 dias, expõem a burlas e violam os termos do KONEKTA.

Responda sempre em Português claro, assertivo e adaptado ao contexto de São Tomé e Príncipe.`;

          // Formatar conteúdo multi-turn no padrão da API do Gemini
          const contents = rawMessages.map((m) => ({
            role: m.role,
            parts: [{ text: m.text }],
          }));

          const apiKey = process.env.GEMINI_API_KEY;

          // Modelo gratuito e padrão do Gemini 3
          const selectedModel = "gemini-3.8-flash";

          if (apiKey && apiKey.trim().length > 0) {
            try {
              const ai = new GoogleGenAI({
                apiKey,
                httpOptions: {
                  headers: {
                    "User-Agent": "aistudio-build",
                  },
                },
              });

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

              const response = await ai.models.generateContent({
                model: selectedModel,
                contents,
                config,
              });

              const replyText = response.text?.trim() || "";

              // Extrair locais do Google Maps Grounding
              const groundingPlaces: GroundingPlace[] = [];
              const rawChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

              if (Array.isArray(rawChunks)) {
                for (const chunk of rawChunks) {
                  const mapsItem = (chunk as Record<string, unknown>).maps as
                    Record<string, unknown> | undefined;
                  const webItem = (chunk as Record<string, unknown>).web as
                    Record<string, unknown> | undefined;

                  if (mapsItem) {
                    const title =
                      (mapsItem.title as string) ||
                      (mapsItem.sourcePlaceId as string) ||
                      "Local no Google Maps";
                    const uri = (mapsItem.uri as string) || undefined;
                    groundingPlaces.push({ title, uri });
                  } else if (webItem?.uri) {
                    groundingPlaces.push({
                      title: (webItem.title as string) || "Referência externa",
                      uri: webItem.uri as string,
                    });
                  }
                }
              }

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
                  model: selectedModel,
                  groundingPlaces,
                  isMapsGrounded: groundingPlaces.length > 0 || isMapsQuery,
                  actionLink,
                }),
                {
                  headers: { "Content-Type": "application/json" },
                },
              );
            } catch (geminiError) {
              console.warn(
                "Chamada à API Gemini retornou erro. A recorrer ao motor local KONEKTA:",
                geminiError,
              );
            }
          }

          // Fallback local robusto caso a chave Gemini não esteja configurada ou haja indisponibilidade temporária de rede
          let fallbackReply = `Olá, **${userContext.firstName}**! Sou o seu Assistente KONEKTA em São Tomé e Príncipe.`;

          if (userContext.activeOrders.length > 0) {
            const firstOrd = userContext.activeOrders[0];
            fallbackReply += `\n\nIdentifiquei que tem o pedido **#${firstOrd.id} (${firstOrd.serviceTitle})** em estado **${firstOrd.status}**.`;
          }

          if (
            lowerMsg.includes("pagar") ||
            lowerMsg.includes("pin") ||
            lowerMsg.includes("custodia")
          ) {
            fallbackReply += `\n\n🔒 **Como funciona o Pagamento Seguro:**\n1. O valor fica retido na custódia da app durante a execução do serviço.\n2. Quando o trabalho for concluído com qualidade, forneça o seu **PIN secreto de 4 dígitos** ao prestador para libertar os fundos.\n3. O serviço fica protegido pela nossa **garantia técnica de 30 dias**.`;
          } else if (
            lowerMsg.includes("avaria") ||
            lowerMsg.includes("curto") ||
            lowerMsg.includes("fuga")
          ) {
            fallbackReply += `\n\n⚠️ **Medidas Imediatas de Segurança:**\n1. Desligue imediatamente o disjuntor geral (para eletricidade) ou a torneira de corte (para canalização).\n2. Não tente reparações improvisadas em instalações sob tensão.\n3. Publique um pedido para receber um técnico verificado com equipamento de teste certificado.`;
          } else {
            fallbackReply += `\n\nComo posso ajudá-lo hoje? Posso orientá-lo sobre a resolução de avarias, custos médios em Dobras (STN), acompanhamento de pedidos ou localização de materiais em São Tomé.`;
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
