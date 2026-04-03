/**
 * Serviço de chunking de texto para RAG.
 * Divide texto em chunks com sobreposição para melhor recuperação.
 */

const CHUNK_SIZE = 500;        // tokens aproximados (chars / 4)
const CHUNK_OVERLAP = 80;      // tokens de sobreposição

export interface Chunk {
  sequencia: number;
  conteudo: string;
}

/**
 * Divide o texto em chunks sobrepostos de ~500 tokens.
 * Tenta respeitar parágrafos como fronteiras naturais.
 */
export function dividirEmChunks(texto: string): Chunk[] {
  const CHARS = CHUNK_SIZE * 4;
  const OVERLAP = CHUNK_OVERLAP * 4;

  // Normaliza espaços e quebras de linha
  const textNorm = texto.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

  if (textNorm.length <= CHARS) {
    return [{ sequencia: 0, conteudo: textNorm }];
  }

  const chunks: Chunk[] = [];
  let pos = 0;
  let seq = 0;

  while (pos < textNorm.length) {
    let fim = Math.min(pos + CHARS, textNorm.length);

    // Tenta cortar num ponto natural (fim de parágrafo ou frase)
    if (fim < textNorm.length) {
      const corteParagrafo = textNorm.lastIndexOf("\n\n", fim);
      const corteFrase = textNorm.lastIndexOf(". ", fim);
      const corte = corteParagrafo > pos + CHARS / 2
        ? corteParagrafo
        : corteFrase > pos + CHARS / 2
          ? corteFrase + 2
          : fim;
      fim = corte;
    }

    const conteudo = textNorm.slice(pos, fim).trim();
    if (conteudo.length > 50) {
      chunks.push({ sequencia: seq++, conteudo });
    }

    pos = Math.max(fim - OVERLAP, pos + 1);
  }

  return chunks;
}
