import { createFileRoute } from "@tanstack/react-router";
import { GoogleGenAI } from "@google/genai";

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      GET: async () => {
        return new Response(
          JSON.stringify({
            status: "ok",
            endpoint: "/api/transcribe",
            model: "gemini-3.5-transcribe",
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
            audioBase64?: string;
            mimeType?: string;
            promptContext?: string;
          };

          const { audioBase64, mimeType = "audio/webm", promptContext } = body || {};

          if (!audioBase64 || audioBase64.trim().length === 0) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Nenhum dado de áudio fornecido para transcrição.",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          // Higienizar o tipo MIME: remover parâmetros adicionais como ;codecs=opus que o Gemini rejeita
          let cleanMime = (mimeType || "audio/webm").split(";")[0].trim().toLowerCase();
          if (cleanMime.includes("webm")) cleanMime = "audio/webm";
          else if (cleanMime.includes("ogg")) cleanMime = "audio/ogg";
          else if (cleanMime.includes("mp4") || cleanMime.includes("m4a")) cleanMime = "audio/mp4";
          else if (cleanMime.includes("wav")) cleanMime = "audio/wav";
          else if (cleanMime.includes("mp3") || cleanMime.includes("mpeg")) cleanMime = "audio/mp3";
          else cleanMime = "audio/webm";

          // Limpar cabeçalhos data:audio/...;base64 e espaços em branco
          let cleanBase64 = audioBase64;
          if (cleanBase64.includes(",")) {
            cleanBase64 = cleanBase64.split(",")[1];
          }
          cleanBase64 = cleanBase64.replace(/\s+/g, "");

          if (!cleanBase64) {
            return new Response(
              JSON.stringify({
                success: false,
                error: "Ficheiro de áudio vazio ou corrompido.",
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          const apiKey = process.env.GEMINI_API_KEY;
          let transcribedText = "";

          if (apiKey && apiKey.trim().length > 0) {
            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: {
                headers: {
                  "User-Agent": "aistudio-build",
                },
              },
            });

            const audioPart = {
              inlineData: {
                mimeType: cleanMime,
                data: cleanBase64,
              },
            };

            const instructionText = promptContext
              ? `Transcreva este áudio com fidelidade em português de São Tomé e Príncipe. Contexto do pedido ou mensagem: ${promptContext}. Retorne apenas a transcrição literal do que foi falado, sem introduções, aspas extras ou comentários adicionais.`
              : "Transcreva este áudio com fidelidade em português de São Tomé e Príncipe. Retorne apenas o texto transcrito literal sem introduções, explicações ou comentários.";

            // 1ª Tentativa: gemini-3.5-transcribe (modelo dedicado de áudio)
            try {
              const response = await ai.models.generateContent({
                model: "gemini-3.5-transcribe",
                contents: {
                  parts: [audioPart, { text: instructionText }],
                },
              });

              transcribedText = response.text?.trim() || "";
              if (!transcribedText && response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                  if (part.text) {
                    transcribedText += (transcribedText ? " " : "") + part.text.trim();
                  }
                }
              }
            } catch (transcribeError) {
              console.warn(
                "gemini-3.5-transcribe não processou o áudio, acionando fallback:",
                transcribeError,
              );
            }

            // 2ª Tentativa (Fallback): gemini-3.8-flash (multimodal de alta performance)
            if (!transcribedText) {
              try {
                const fallbackResponse = await ai.models.generateContent({
                  model: "gemini-3.8-flash",
                  contents: {
                    parts: [
                      audioPart,
                      {
                        text: `${instructionText} Se houver apenas ruído de fundo ou silêncio, retorne vazio.`,
                      },
                    ],
                  },
                });

                transcribedText = fallbackResponse.text?.trim() || "";
                if (!transcribedText && fallbackResponse.candidates?.[0]?.content?.parts) {
                  for (const part of fallbackResponse.candidates[0].content.parts) {
                    if (part.text) {
                      transcribedText += (transcribedText ? " " : "") + part.text.trim();
                    }
                  }
                }
              } catch (fallbackError) {
                console.warn("Fallback gemini-3.8-flash também falhou:", fallbackError);
              }
            }
          }

          if (transcribedText) {
            return new Response(
              JSON.stringify({
                success: true,
                text: transcribedText,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Não foi possível identificar voz no áudio gravado. Fale mais perto do microfone ou digite a sua mensagem.",
              text: "",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Erro interno ao transcrever áudio:", error);
          return new Response(
            JSON.stringify({
              success: false,
              error:
                "Instabilidade temporária no processamento do áudio. Por favor, tente novamente.",
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      },
    },
  },
});
