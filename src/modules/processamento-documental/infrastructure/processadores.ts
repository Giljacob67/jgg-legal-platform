import type { DocumentoComArquivoEVinculos } from "@/modules/documentos/domain/types";
import type { ProcessadorEtapaDocumental } from "@/modules/processamento-documental/application/contracts";
import type {
  EventoCronologico,
  FatoRelevante,
  ResultadoClassificacaoDocumental,
  ResultadoExtracaoFatos,
  ResultadoLeituraDocumental,
  ResultadoResumoDocumental,
  SaidaEtapaDocumental,
} from "@/modules/processamento-documental/domain/types";

function normalizarTexto(texto: string): string {
  return texto
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function obterTextoBase(documento: DocumentoComArquivoEVinculos): string {
  if (documento.documento.textoNormalizado?.trim()) {
    return documento.documento.textoNormalizado.trim();
  }

  if (documento.documento.textoExtraido?.trim()) {
    return normalizarTexto(documento.documento.textoExtraido);
  }

  if (documento.documento.resumoJuridico?.trim()) {
    return documento.documento.resumoJuridico.trim();
  }

  return `${documento.documento.titulo}. Documento do tipo ${documento.documento.tipoDocumento}.`;
}

function extrairDatas(texto: string): string[] {
  const datas = new Set<string>();
  const regex = /(\b\d{2}\/\d{2}\/\d{4}\b)|(\b\d{4}-\d{2}-\d{2}\b)/g;

  for (const match of texto.matchAll(regex)) {
    const data = match[0];
    if (data) {
      datas.add(data);
    }
  }

  return [...datas];
}

function extrairPalavrasChave(texto: string): string[] {
  const stopwords = new Set([
    "de",
    "da",
    "do",
    "das",
    "dos",
    "e",
    "a",
    "o",
    "para",
    "com",
    "em",
    "no",
    "na",
    "por",
    "que",
    "um",
    "uma",
    "os",
    "as",
  ]);

  const frequencia = new Map<string, number>();
  for (const termo of texto.toLowerCase().replace(/[^a-z0-9à-úç\s]/gi, " ").split(/\s+/)) {
    if (termo.length < 4 || stopwords.has(termo)) {
      continue;
    }

    frequencia.set(termo, (frequencia.get(termo) ?? 0) + 1);
  }

  return [...frequencia.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([termo]) => termo);
}

function construirFatos(documento: DocumentoComArquivoEVinculos, texto: string): FatoRelevante[] {
  const frases = texto
    .split(/[.\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 20)
    .slice(0, 6);

  return frases.map((frase) => {
    const dataReferencia = extrairDatas(frase)[0];
    return {
      descricao: frase,
      trechoBase: frase,
      documentoId: documento.documento.id,
      dataReferencia,
    };
  });
}

function construirCronologia(documento: DocumentoComArquivoEVinculos, texto: string): EventoCronologico[] {
  const datas = extrairDatas(texto);
  return datas.slice(0, 6).map((data, index) => ({
    data,
    descricao: `Marco documental ${index + 1} identificado na leitura do documento.`,
    documentoId: documento.documento.id,
  }));
}

function construirPontosControvertidos(texto: string): string[] {
  const candidatos = texto
    .split(/[.\n]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 35 && /(contest|diverg|impugn|inadimpl|descumpr|nulidad)/i.test(item));

  if (candidatos.length > 0) {
    return candidatos.slice(0, 4);
  }

  return [
    "Necessidade de validar cronologia completa para reduzir risco de lacunas narrativas.",
    "Pontos de impugnação ainda dependem de confirmação com documentação complementar.",
  ];
}

const processadorLeitura: ProcessadorEtapaDocumental = {
  etapa: "leitura",
  async executar(documento): Promise<SaidaEtapaDocumental> {
    const textoPersistido =
      documento.documento.textoNormalizado?.trim() || documento.documento.textoExtraido?.trim();

    return {
      textoExtraido: textoPersistido ? documento.documento.textoExtraido : undefined,
      textoNormalizado: textoPersistido
        ? documento.documento.textoNormalizado ?? normalizarTexto(textoPersistido)
        : undefined,
      observacao:
        textoPersistido
          ? "Leitura realizada com conteúdo textual persistido."
          : "Leitura concluída sem extração textual integral; conteúdo estrutural mantido para etapas seguintes.",
    } satisfies ResultadoLeituraDocumental;
  },
};

const processadorClassificacao: ProcessadorEtapaDocumental = {
  etapa: "classificacao",
  async executar(documento): Promise<SaidaEtapaDocumental> {
    const texto = obterTextoBase(documento).toLowerCase();
    let classePrincipal = `documento ${documento.documento.tipoDocumento.toLowerCase()}`;
    let confianca = 0.74;

    if (texto.includes("trabalh")) {
      classePrincipal = "contencioso trabalhista";
      confianca = 0.81;
    } else if (texto.includes("contrat")) {
      classePrincipal = "contencioso contratual";
      confianca = 0.84;
    } else if (texto.includes("tribut")) {
      classePrincipal = "contencioso tributário";
      confianca = 0.8;
    }

    return {
      classePrincipal,
      confianca,
      justificativa: "Classificação heurística derivada do tipo documental e termos predominantes.",
    } satisfies ResultadoClassificacaoDocumental;
  },
};

const processadorResumo: ProcessadorEtapaDocumental = {
  etapa: "resumo",
  async executar(documento): Promise<SaidaEtapaDocumental> {
    const texto = obterTextoBase(documento);
    const resumo = texto.length > 500 ? `${texto.slice(0, 497)}...` : texto;

    return {
      resumo,
      palavrasChave: extrairPalavrasChave(texto),
    } satisfies ResultadoResumoDocumental;
  },
};

const processadorExtracaoFatos: ProcessadorEtapaDocumental = {
  etapa: "extracao_fatos",
  async executar(documento): Promise<SaidaEtapaDocumental> {
    const texto = obterTextoBase(documento);

    return {
      fatosRelevantes: construirFatos(documento, texto),
      cronologia: construirCronologia(documento, texto),
      pontosControvertidos: construirPontosControvertidos(texto),
    } satisfies ResultadoExtracaoFatos;
  },
};

export function criarProcessadoresDocumentais(): ProcessadorEtapaDocumental[] {
  return [processadorLeitura, processadorClassificacao, processadorResumo, processadorExtracaoFatos];
}
