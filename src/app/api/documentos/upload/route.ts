import { NextResponse } from "next/server";
import type { TipoDocumento } from "@/modules/documentos/domain/types";
import { uploadDocumento } from "@/modules/documentos/application/uploadDocumento";
import { requireAuth } from "@/lib/api-auth";

type VinculoInput = {
  tipoEntidade: "caso" | "pedido_peca";
  entidadeId: string;
  papel?: "principal" | "apoio";
};

function parseVinculos(raw: string | null):
  | { ok: true; value: VinculoInput[] }
  | { ok: false; message: string } {
  if (!raw || raw.trim().length === 0) {
    return { ok: true, value: [] };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, message: "Campo vinculos inválido: JSON malformado." };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, message: "Campo vinculos deve ser uma lista." };
  }

  const vinculos: VinculoInput[] = [];
  for (const item of parsed) {
    if (typeof item !== "object" || item === null) {
      return { ok: false, message: "Campo vinculos contém item inválido." };
    }

    const { tipoEntidade, entidadeId, papel } = item as {
      tipoEntidade?: string;
      entidadeId?: string;
      papel?: string;
    };

    const tipoValido = tipoEntidade === "caso" || tipoEntidade === "pedido_peca";
    const entidadeValida = typeof entidadeId === "string" && entidadeId.trim().length > 0;
    const papelValido = !papel || papel === "principal" || papel === "apoio";

    if (!tipoValido || !entidadeValida || !papelValido) {
      return { ok: false, message: "Campo vinculos contém valores inválidos." };
    }

    vinculos.push({
      tipoEntidade,
      entidadeId: entidadeId.trim(),
      papel: papel as "principal" | "apoio" | undefined,
    });
  }

  return { ok: true, value: vinculos };
}

function obterStatusHttpPorErro(mensagem: string): number {
  const mensagemNormalizada = mensagem.toLowerCase();
  const ehErroValidacao =
    mensagemNormalizada.includes("obrigatório") ||
    mensagemNormalizada.includes("obrigatoria") ||
    mensagemNormalizada.includes("inválido") ||
    mensagemNormalizada.includes("invalido") ||
    mensagemNormalizada.includes("formato não suportado") ||
    mensagemNormalizada.includes("formato nao suportado") ||
    mensagemNormalizada.includes("vínculo") ||
    mensagemNormalizada.includes("vinculo");

  return ehErroValidacao ? 400 : 500;
}

export async function POST(request: Request) {
  const unauth = await requireAuth();
  if (unauth) return unauth;

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Arquivo obrigatório." }, { status: 400 });
    }

    const titulo = String(formData.get("titulo") ?? "").trim();
    const tipoDocumento = String(formData.get("tipoDocumento") ?? "").trim() as TipoDocumento;
    const parseVinculosResult = parseVinculos(String(formData.get("vinculos") ?? "[]"));

    if (!titulo) {
      return NextResponse.json({ error: "Título é obrigatório." }, { status: 400 });
    }

    if (!parseVinculosResult.ok) {
      return NextResponse.json({ error: parseVinculosResult.message }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const resultado = await uploadDocumento({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      bytes: buffer,
      titulo,
      tipoDocumento,
      vinculos: parseVinculosResult.value,
    });

    return NextResponse.json({
      documentoId: resultado.documento.id,
      arquivoId: resultado.arquivo.id,
      url: `/api/documentos/${resultado.documento.id}/arquivo`,
      sha256: resultado.arquivo.sha256,
      vinculos: resultado.vinculos,
    });
  } catch (error) {
    const mensagem =
      error instanceof Error ? error.message : "Falha ao processar upload de documento.";

    return NextResponse.json(
      {
        error: mensagem,
      },
      { status: obterStatusHttpPorErro(mensagem) },
    );
  }
}
