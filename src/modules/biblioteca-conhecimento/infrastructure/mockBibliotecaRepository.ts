/**
 * Repositório em memória para a Biblioteca de Conhecimento.
 * Substitua por PostgresRepository quando os embeddings estiverem no Neon.
 */

import type { DocumentoBiblioteca, StatusEmbedding, TipoDocumentoBC } from "../domain/types";

let _id = 0;
function nextId() { return `BC-${String(++_id).padStart(4, "0")}`; }

let documentosStore: DocumentoBiblioteca[] = [];

export class MockBibliotecaRepository {
  async listar(filtros?: { tipo?: TipoDocumentoBC; fonte?: string; status?: StatusEmbedding }): Promise<DocumentoBiblioteca[]> {
    let r = [...documentosStore];
    if (filtros?.tipo) r = r.filter((d) => d.tipo === filtros.tipo);
    if (filtros?.fonte) r = r.filter((d) => d.fonte === filtros.fonte);
    if (filtros?.status) r = r.filter((d) => d.embeddingStatus === filtros.status);
    return r.sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }

  async encontrarPorDriveId(driveFileId: string): Promise<DocumentoBiblioteca | null> {
    return documentosStore.find((d) => d.driveFileId === driveFileId) ?? null;
  }

  async criar(dados: Omit<DocumentoBiblioteca, "id" | "criadoEm" | "chunksGerados" | "embeddingStatus">): Promise<DocumentoBiblioteca> {
    const id = nextId();
    const doc: DocumentoBiblioteca = {
      id,
      ...dados,
      chunksGerados: 0,
      embeddingStatus: "pendente",
      criadoEm: new Date().toISOString(),
    };
    documentosStore.push(doc);
    return doc;
  }

  async atualizarStatus(id: string, status: StatusEmbedding, chunksGerados?: number, erro?: string): Promise<void> {
    const idx = documentosStore.findIndex((d) => d.id === id);
    if (idx !== -1) {
      documentosStore[idx] = {
        ...documentosStore[idx],
        embeddingStatus: status,
        chunksGerados: chunksGerados ?? documentosStore[idx].chunksGerados,
        erroProcessamento: erro,
        processadoEm: status === "concluido" ? new Date().toISOString() : documentosStore[idx].processadoEm,
      };
    }
  }

  async remover(id: string): Promise<void> {
    documentosStore = documentosStore.filter((d) => d.id !== id);
  }

  async contar(): Promise<{ total: number; concluidos: number; pendentes: number; erros: number; chunks: number }> {
    return {
      total: documentosStore.length,
      concluidos: documentosStore.filter((d) => d.embeddingStatus === "concluido").length,
      pendentes: documentosStore.filter((d) => d.embeddingStatus === "pendente").length,
      erros: documentosStore.filter((d) => d.embeddingStatus === "erro").length,
      chunks: documentosStore.reduce((acc, d) => acc + d.chunksGerados, 0),
    };
  }
}

// Singleton
let _repo: MockBibliotecaRepository | null = null;
export function getBibliotecaRepo(): MockBibliotecaRepository {
  if (!_repo) _repo = new MockBibliotecaRepository();
  return _repo;
}
