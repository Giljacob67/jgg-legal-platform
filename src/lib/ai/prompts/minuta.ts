import { SYSTEM_PROMPT_BASE } from "./base";
import { criarTemplatesJuridicosPadrao, criarChecklistsJuridicosPadrao } from "@/modules/peticoes/base-juridica-viva/infrastructure/defaultCatalog";
import type { MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";
import type { ContextoJuridicoPedido } from "@/modules/peticoes/domain/types";
import type { ChunkRelevante } from "@/modules/biblioteca-conhecimento/infrastructure/vectorStore";

export function buildMinutaPrompt(
  contexto: ContextoJuridicoPedido,
  estrategia: unknown,
  materia: MateriaCanonica,
  tipoPeca: TipoPecaCanonica,
  chunksRelevantes: ChunkRelevante[] = [],
): { system: string; prompt: string } {
  const template = criarTemplatesJuridicosPadrao().find(
    (t) => t.tiposPecaCanonica.includes(tipoPeca) && t.materias.includes(materia),
  );
  const checklists = criarChecklistsJuridicosPadrao().filter(
    (c) => c.materias.includes(materia) && c.tiposPecaCanonica.includes(tipoPeca),
  );

  return {
    system: SYSTEM_PROMPT_BASE,
    prompt: `Redija a minuta completa da peça jurídica.

TIPO: ${tipoPeca} | MATÉRIA: ${materia}

CONTEXTO JURÍDICO DO CASO:
- Fatos relevantes: ${contexto.fatosRelevantes.join("; ")}
- Estratégia: ${JSON.stringify(estrategia, null, 2)}
- Documentos chave: ${contexto.documentosChave.map((d) => `${d.titulo} (${d.documentoId})`).join(", ")}

TEMPLATE BASE:
${template ? JSON.stringify(template.blocos, null, 2) : "Usar estrutura padrão: Cabeçalho → Qualificação → Fatos → Fundamentos → Pedidos → Fecho"}

CHECKLIST DE QUALIDADE A CUMPRIR:
${checklists.map((c) => `[${c.categoria === "obrigatorio" ? "OBRIGATÓRIO" : "RECOMENDADO"}] ${c.descricao}`).join("\n") || "Seguir boas práticas de redação jurídica."}
${
  chunksRelevantes.length > 0
    ? `\nTRECHOS DA BIBLIOTECA DE CONHECIMENTO (usar como referência doutrinária/jurisprudencial):\n${chunksRelevantes.map((c, i) => `[${i + 1}] ${c.conteudo}`).join("\n\n")}\n`
    : ""
}
INSTRUÇÕES DE REDAÇÃO:
1. Siga EXATAMENTE a estrutura do template acima
2. Use linguagem técnico-jurídica formal e objetiva
3. Cite artigos de lei com número exato — se não tiver certeza, escreva [verificar art. X da Lei Y]
4. Referencie documentos pelo ID (ex: "conforme DOC-001, fls. X")
5. Pedidos devem ser específicos, mensuráveis e juridicamente possíveis
6. Ao final, indique quais itens do CHECKLIST foram atendidos

Redija a minuta completa:`,
  };
}
