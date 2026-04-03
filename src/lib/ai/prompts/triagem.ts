import { SYSTEM_PROMPT_BASE } from "./base";
import type { SnapshotPipelineEtapa } from "@/modules/peticoes/domain/types";

export function buildTriagemPrompt(
  snapshots: SnapshotPipelineEtapa[],
): { system: string; prompt: string } {
  const leituraDocumentalSnapshot = snapshots.find(s => s.etapa === "leitura_documental");
  const resumoDocumentos = leituraDocumentalSnapshot?.saidaEstruturada ?? {};

  return {
    system: SYSTEM_PROMPT_BASE,
    prompt: `Analise os dados dos documentos abaixo e determine:

1. **TIPO DE PEÇA** mais adequado (ex: Petição Inicial, Contestação, Recurso de Apelação, etc.)
2. **MATÉRIA JURÍDICA PRINCIPAL** (ex: civel, trabalhista, tributario, criminal, consumidor, empresarial, familia, ambiental, agrario_agronegocio, bancario)
3. **URGÊNCIA** (urgente / normal) com justificativa
4. **COMPLEXIDADE** (simples / média / complexa) com justificativa

DADOS DOS DOCUMENTOS:
${JSON.stringify(resumoDocumentos, null, 2)}

Responda em JSON estruturado:
{
  "tipo_peca": "...",
  "materia": "...",
  "urgencia": "urgente|normal",
  "complexidade": "simples|media|complexa",
  "justificativa_urgencia": "...",
  "justificativa_complexidade": "..."
}`,
  };
}
