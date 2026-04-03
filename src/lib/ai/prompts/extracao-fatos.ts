import { SYSTEM_PROMPT_BASE } from "./base";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";

export function buildExtracaoFatosPrompt(
  contexto: ContextoJuridicoPedido | null,
  tipoPeca: string,
): { system: string; prompt: string } {
  return {
    system: SYSTEM_PROMPT_BASE,
    prompt: `Extraia e organize os fatos jurídicos relevantes para uma "${tipoPeca}".

CONTEXTO PROCESSADO ANTERIORMENTE:
${JSON.stringify(contexto ?? {}, null, 2)}

INSTRUÇÕES:
1. Liste os fatos em ORDEM CRONOLÓGICA (do mais antigo ao mais recente)
2. Para cada fato: data (ou "sem data"), descrição objetiva, documentos que comprovam
3. Identifique explicitamente: prazo prescricional aplicável e prazo decadencial (se houver)
4. Destaque fatos CONTROVERSOS (que podem ser contestados pela parte adversa)

FORMATO DE RESPOSTA:
{
  "fatos_cronologicos": [
    {
      "data": "DD/MM/AAAA ou 'sem data'",
      "descricao": "Descrição objetiva do fato",
      "documentos_referenciados": ["DOC-001", "..."],
      "controverso": true
    }
  ],
  "prazo_prescricional": "X anos — fundamento: Art. XX do CC/CLT/CTN",
  "prazo_decadencial": "X anos — fundamento: Art. XX | ou: 'não identificado'",
  "observacoes": "..."
}`,
  };
}
