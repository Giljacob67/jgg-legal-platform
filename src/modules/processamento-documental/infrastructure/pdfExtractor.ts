import "server-only";

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * Função responsável por simular ou realizar o OCR verdadeiro usando 
 * um modelo Multimodal (ex: gpt-4o) para ler o buffer da imagem/pdf.
 */
export async function extrairTextoDocumentoViaAI(
  filename: string,
  contentType: string,
  buffer: Buffer
): Promise<{ textoExtraido: string }> {
  // Para fins de POC/Mock se o usuário não tiver configurado `OPENAI_API_KEY`:
  if (!process.env.OPENAI_API_KEY) {
    return {
      textoExtraido: `[OCR Mockado] Texto extraído simulado do arquivo ${filename}. A chave OPENAI_API_KEY não está configurada, então a extração real foi pulada.`
    };
  }

  // Se a chave existir, rodamos multimodal se suportado
  try {
    const isImage = contentType.startsWith("image/");
    const isPdf = contentType === "application/pdf";

    if (!isImage && !isPdf) {
       return { textoExtraido: `Arquivo ${filename} não é PDF ou Imagem suportada por visão.` };
    }

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Você é um assistente OCR legal. Transcreva todo o texto legível neste documento para formato de texto estruturado. Foque em datas, partes envolvidas e cláusulas principais." },
            { type: "file", data: buffer.toString('base64'), mimeType: contentType } as { type: string; data: string; mimeType: string },
          ]
        }
      ]
    });

    return { textoExtraido: text };

  } catch (error) {
    console.error("Erro na extração multimodal OCR:", error);
    return { textoExtraido: `Erro ao extrair contexto: ${error instanceof Error ? error.message : "Desconhecido"}` };
  }
}
