import "server-only";

import type {
  DocumentoComArquivoEVinculos,
  DocumentoListItem,
  DocumentoVinculo,
} from "@/modules/documentos/domain/types";
import { getDocumentosInfra } from "@/modules/documentos/infrastructure/provider.server";

function obterEntidade(vinculos: DocumentoVinculo[], tipo: "caso" | "pedido_peca"): string | undefined {
  return vinculos.find((item) => item.tipoEntidade === tipo)?.entidadeId;
}

function toListItem(input: DocumentoComArquivoEVinculos): DocumentoListItem {
  return {
    id: input.documento.id,
    casoId: obterEntidade(input.vinculos, "caso"),
    pedidoId: obterEntidade(input.vinculos, "pedido_peca"),
    titulo: input.documento.titulo,
    tipo: input.documento.tipoDocumento,
    status: input.documento.statusDocumento,
    statusProcessamento: input.documento.statusProcessamento,
    dataUpload: input.arquivo.criadoEm,
    tamanhoMb: Number((input.arquivo.tamanhoBytes / (1024 * 1024)).toFixed(1)),
    resumo: input.documento.resumoJuridico ?? "Resumo pendente de processamento.",
    urlArquivo: input.arquivo.url,
    sha256: input.arquivo.sha256,
  };
}

export async function listarDocumentosComDetalhes(filtro?: {
  casoId?: string;
  pedidoId?: string;
}): Promise<DocumentoComArquivoEVinculos[]> {
  const infra = getDocumentosInfra();
  const documentos = await infra.documentoJuridicoRepository.listar(filtro);

  const detalhes = await Promise.all(
    documentos.map(async (documento) => {
      const [arquivo, vinculos] = await Promise.all([
        infra.arquivoFisicoRepository.obterPorId(documento.arquivoFisicoId),
        infra.documentoVinculoRepository.listarPorDocumento(documento.id),
      ]);

      if (!arquivo) {
        throw new Error(`Arquivo físico não encontrado para documento ${documento.id}.`);
      }

      return {
        documento,
        arquivo,
        vinculos,
      } satisfies DocumentoComArquivoEVinculos;
    }),
  );

  return detalhes;
}

export async function listarDocumentos(filtro?: {
  casoId?: string;
  pedidoId?: string;
}): Promise<DocumentoListItem[]> {
  const detalhes = await listarDocumentosComDetalhes(filtro);
  return detalhes.map(toListItem);
}
