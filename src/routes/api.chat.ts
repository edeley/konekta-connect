import { createFileRoute } from "@tanstack/react-router";
import { geminiEngine } from "../lib/gemini-service";
import {
  stripAnyDocumentFields,
  type SanitizedUserChatContext,
} from "../lib/chat-specialist-context";
import {
  buildGeminiSpecialistSystemPrompt,
  generateSpecialistResponse,
} from "../lib/specialist-ai";
import { getProvider, providers } from "../lib/konekta-data";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            status: "ok",
            endpoint: "/api/chat",
            model: "gemini-3.8-flash / gemini-3.1-flash-lite",
            hasApiKey: Boolean(process.env.GEMINI_API_KEY),
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            providerId: string;
            message: string;
            userContext: SanitizedUserChatContext;
            isPhoto?: boolean;
          };

          const { providerId, message, userContext, isPhoto } = body;

          // Regra obrigatória: Higienização rigorosa contra documentos
          const safeUserContext: SanitizedUserChatContext = userContext
            ? (stripAnyDocumentFields(userContext) as SanitizedUserChatContext)
            : {
                name: "Cliente KONEKTA",
                firstName: "Cliente",
                phone: "+239 9900000",
                role: "cliente",
                district: "Água Grande",
                city: "São Tomé",
                activeOrders: [],
                technicalVisits: [],
                hasCompletedOrders: false,
                memberSinceFormatted: "Membro KONEKTA",
              };

          const provider = getProvider(providerId) || providers.find((p) => p.id === providerId);
          const providerName = provider?.name || "Especialista KONEKTA";
          const category = provider?.category || "Serviços Técnicos";
          const bio = provider?.bio;
          const district = provider?.district || "Água Grande";

          // 1. Se existir GEMINI_API_KEY configurada no servidor, utiliza o motor resiliente Gemini
          if (process.env.GEMINI_API_KEY) {
            try {
              const systemInstruction = buildGeminiSpecialistSystemPrompt({
                providerName,
                category,
                bio,
                district,
                userContext: safeUserContext,
              });

              const userPrompt = isPhoto
                ? `[O cliente ${safeUserContext.firstName || "Cliente"} acabou de enviar uma fotografia da avaria/local para diagnóstico técnico. A legenda ou mensagem enviada com a foto é: "${message || "Foto da avaria"}". Analisa a situação com rigor técnico e responde como especialista.]`
                : message;

              const cascadeRes = await geminiEngine.generateWithCascade({
                contents: [userPrompt],
                config: {
                  systemInstruction,
                  temperature: 0.7,
                },
                models: ["gemini-3.8-flash", "gemini-3.1-flash-lite"],
                cacheCategory: `specialist-${providerId}`,
                rawUserQuery: message,
              });

              if (cascadeRes.text) {
                return new Response(
                  JSON.stringify({
                    success: true,
                    text: cascadeRes.text,
                    source: cascadeRes.model,
                  }),
                  {
                    headers: { "Content-Type": "application/json" },
                  },
                );
              }
            } catch (geminiError) {
              console.warn(
                "Aviso: Motor Gemini falhou ou atingiu limite transitório. A usar motor especialista local de contingência STP:",
                geminiError,
              );
            }
          }

          // 2. Fallback resiliente: Motor Especialista KONEKTA de alta fidelidade
          const localResult = generateSpecialistResponse({
            providerId,
            messageText: message,
            userContext: safeUserContext,
            isPhoto,
          });

          return new Response(
            JSON.stringify({
              success: true,
              text: localResult.text,
              source: "specialist_engine_local_stp",
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Erro no processamento do chat:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error: "Falha ao processar a resposta do especialista.",
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
