import "server-only";

import type { TipoDocumento } from "@/modules/documentos/domain/types";
import { validarTipoDocumento } from "@/modules/documentos/application/validation";
import { getDocumentosInfra } from "@/modules/documentos/infrastructure/provider.server";

type VinculoInput = {
  tipoEntidade: "caso" | "pedido_peca";
  entidadeId: string;
  papel?: "principal" | "apoio";
};

function obterExtensao(filename: string): string | undefined {
  if (!filename.includes(".")) {
    return undefined;
  }

  return filename.split(".").pop()?.toLowerCase();
}

export async function registrarUploadClienteDocumento(input: {
  filename: string;
  titulo: string;
  tipoDocumento: TipoDocumento;
  vinculos: VinculoInput[];
  sizeBytes: number;
  blob: {
    pathname: string;
    url: string;
    contentType: string;
  };
}): Promise<{ documentoId: string; arquivoId: string }> {
  validarTipoDocumento(input.tipoDocumento);

  if (input.vinculos.length === 0) {
    throw new Error("Pelo menos um vínculo deve ser informado.");
  }

  const infra = getDocumentosInfra();

  const arquivo = await infra.arquivoFisicoRepository.criar({
    provider: "vercel_blob",
    providerKey: input.blob.pathname,
    url: input.blob.url,
    nomeOriginal: input.filename,
    mimeType: input.blob.contentType || "application/octet-stream",
    extensao: obterExtensao(input.filename),
    tamanhoBytes: input.sizeBytes,
    sha256: undefined,
    checksumAlgoritmo: "sha256",
  });

  const documento = await infra.documentoJuridicoRepository.criar({
    arquivoFisicoId: arquivo.id,
    titulo: input.titulo,
    tipoDocumento: input.tipoDocumento,
    statusDocumento: "pendente de leitura",
    metadados: {
      origem: "upload_cliente_blob",
      filename: input.filename,
      providerKey: input.blob.pathname,
    },
  });

  await Promise.all(
    input.vinculos.map((vinculo) =>
      infra.documentoVinculoRepository.vincular({
        documentoJuridicoId: documento.id,
        tipoEntidade: vinculo.tipoEntidade,
        entidadeId: vinculo.entidadeId,
        papel: vinculo.papel,
      }),
    ),
  );

  return {
    documentoId: documento.id,
    arquivoId: arquivo.id,
  };
}
