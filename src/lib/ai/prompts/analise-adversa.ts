import { SYSTEM_PROMPT_BASE } from "./base";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";

export function buildAnaliseAdversaPrompt(
  contexto: ContextoJuridicoPedido | null,
  fatos: unknown,
): { system: string; prompt: string } {
  return {
    system: SYSTEM_PROMPT_BASE,
    prompt: `Realize uma análise adversarial (perspectiva da parte contrária) do caso.

FATOS EXTRAÍDOS:
${JSON.stringify(fatos ?? {}, null, 2)}

CONTEXTO ADICIONAL:
${JSON.stringify(contexto ?? {}, null, 2)}

INSTRUÇÕES:
1. Liste os PONTOS FORTES do nosso cliente (argumentos favoráveis)
2. Liste as VULNERABILIDADES do nosso cliente (pontos que a parte adversa vai explorar)
3. Antecipe os principais argumentos da DEFESA/PARTE CONTRÁRIA
4. Identifique riscos processuais (incompetência, prescrição, ilegitimidade, etc.)

FORMATO:
{
  "pontos_fortes": ["...", "..."],
  "pontos_vulneraveis": ["...", "..."],
  "argumentos_adversos_previstos": ["...", "..."],
  "riscos_processuais": ["...", "..."],
  "nivel_risco_geral": "baixo|medio|alto",
  "recomendacoes_cautela": "..."
}`,
  };
}
