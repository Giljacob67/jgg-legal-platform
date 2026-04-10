import { SYSTEM_PROMPT_BASE } from "./base";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";
import type { MateriaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

interface DocumentoResumo {
  titulo: string;
  tipo: string;
  resumo: string;
}

export function buildAnaliseDocumentalClientePrompt(
  contexto: ContextoJuridicoPedido | null,
  fatos: unknown,
  documentos: DocumentoResumo[],
  materia: MateriaCanonica,
): { system: string; prompt: string } {
  return {
    system: SYSTEM_PROMPT_BASE,
    prompt: `Analise os documentos do cliente para um caso na área de ${materia.toUpperCase()}.

FATOS EXTRAÍDOS ANTERIORMENTE:
${JSON.stringify(fatos ?? {}, null, 2)}

DOCUMENTOS DO CLIENTE:
${documentos.length > 0 ? documentos.map((d, i) => `[${i + 1}] ${d.titulo} (${d.tipo}): ${d.resumo || "(sem resumo)"}`).join("\n") : "(Nenhum documento disponível)"}

CONTEXTO ADICIONAL:
${JSON.stringify(contexto ?? {}, null, 2)}

INSTRUÇÕES:
1. Identifique documentos relevantes para o caso e avalie sua relevância (alta/media/baixa)
2. Liste pontos-chave de cada documento relevante
3. Confirme fatos que têm suporte documental direto
4. Identifique fatos que contradizem a narrativa do caso
5. Liste pendências documentais (documentos que ainda precisam ser obtidos)
6. Forneça uma avaliação geral do corpo documental

FORMATO:
{
  "documentos_identificados": [
    {
      "titulo": "nome do documento",
      "tipo": "tipo do documento",
      "relevancia": "alta|media|baixa",
      "pontos_chave": ["ponto 1", "ponto 2"]
    }
  ],
  "fatos_confirmados": ["fato que tem suporte documental direto"],
  "fatos_contraditorios": ["fato que contradiz a narrativa do caso"],
  "pendencias_documentais": ["documento que ainda precisa ser obtido"],
  "avaliacao_geral": "avaliação geral do corpo documental do cliente"
}`,
  };
}