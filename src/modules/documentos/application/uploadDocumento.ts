import "server-only";

import type {
  DocumentoComArquivoEVinculos,
  UploadDocumentoPayload,
} from "@/modules/documentos/domain/types";
import { validarArquivoPermitido, validarTipoDocumento } from "@/modules/documentos/application/validation";
import { getDocumentosInfra } from "@/modules/documentos/infrastructure/provider.server";

function obterExtensao(filename: string): string | undefined {
  if (!filename.includes(".")) {
    return undefined;
  }

  return filename.split(".").pop()?.toLowerCase();
}

export async function uploadDocumento(payload: UploadDocumentoPayload): Promise<DocumentoComArquivoEVinculos> {
  validarArquivoPermitido(payload.filename, payload.contentType);
  validarTipoDocumento(payload.tipoDocumento);

  if (payload.vinculos.length === 0) {
    throw new Error("Pelo menos um vínculo (caso ou pedido) deve ser informado.");
  }

  const infra = getDocumentosInfra();

  const [uploadResult, hash] = await Promise.all([
    infra.fileStorageGateway.upload({
      filename: payload.filename,
      contentType: payload.contentType,
      bytes: payload.bytes,
    }),
    infra.fileHashService.sha256(payload.bytes),
  ]);

  const arquivo = await infra.arquivoFisicoRepository.criar({
    provider: uploadResult.provider,
    providerKey: uploadResult.providerKey,
    url: uploadResult.url,
    nomeOriginal: payload.filename,
    mimeType: payload.contentType,
    extensao: obterExtensao(payload.filename),
    tamanhoBytes: uploadResult.sizeBytes,
    sha256: hash ?? undefined,
    checksumAlgoritmo: "sha256",
  });

  const documento = await infra.documentoJuridicoRepository.criar({
    arquivoFisicoId: arquivo.id,
    titulo: payload.titulo,
    tipoDocumento: payload.tipoDocumento,
    statusDocumento: "pendente de leitura",
    metadados: {
      origem: "upload",
      filename: payload.filename,
    },
  });

  const vinculos = await Promise.all(
    payload.vinculos.map((vinculo) =>
      infra.documentoVinculoRepository.vincular({
        documentoJuridicoId: documento.id,
        tipoEntidade: vinculo.tipoEntidade,
        entidadeId: vinculo.entidadeId,
        papel: vinculo.papel,
      }),
    ),
  );

  return {
    documento,
    arquivo,
    vinculos,
  };
}
