import { describe, expect, it } from "vitest";
import { buildDossieJuridicoPedido } from "@/modules/peticoes/domain/dossie-juridico";

describe("buildDossieJuridicoPedido", () => {
  it("deriva um dossie progressivo a partir do contexto consolidado", () => {
    const dossie = buildDossieJuridicoPedido({
      pedido: {
        id: "PED-001",
        casoId: "CASO-001",
        titulo: "Petição de teste",
        tipoPeca: "Petição inicial",
        status: "em produção",
        prioridade: "alta",
      },
      pedidoId: "PED-001",
      versaoContexto: 3,
      fatosRelevantes: ["Contrato foi inadimplido.", "Houve notificação sem resposta."],
      cronologia: [{ data: "2026-04-01", descricao: "Envio de notificação.", documentoId: "DOC-002" }],
      pontosControvertidos: ["Alcance da cláusula penal."],
      documentosChave: [
        { documentoId: "DOC-001", titulo: "Contrato", tipoDocumento: "Contrato" },
        { documentoId: "DOC-002", titulo: "Notificação", tipoDocumento: "Comprovante" },
      ],
      referenciasDocumentais: [
        { documentoId: "DOC-001", titulo: "Contrato", tipoDocumento: "Contrato" },
        { documentoId: "DOC-002", titulo: "Notificação", tipoDocumento: "Comprovante", trecho: "Recebida em 01/04." },
      ],
      estrategiaSugerida: "Priorizar tutela de urgência e cobrança da cláusula penal.",
      teses: [
        {
          id: "TSE-1",
          titulo: "Tese principal",
          descricao: "Cobrança da cláusula penal contratual.",
          fundamentos: ["Contrato válido", "Inadimplemento comprovado"],
          documentosRelacionados: ["DOC-001", "DOC-002"],
          origem: "ia",
          statusValidacao: "aprovada",
        },
      ],
      validacaoHumanaTesesPendente: false,
      fontesSnapshot: [
        { etapa: "classificacao", versao: 1 },
        { etapa: "leitura_documental", versao: 1 },
        { etapa: "extracao_de_fatos", versao: 1 },
      ],
      snapshotsSaida: {
        leitura_documental: { totalDocumentos: 2, documentosLidos: 2, coberturaLeitura: 1 },
        analise_adversa: { pontos_fortes: ["Documentação contratual consistente."], nivel_risco_geral: "medio" },
        estrategia_juridica: { pedidos_recomendados: ["Tutela de urgência", "Condenação ao pagamento"] },
        redacao: { orientacaoRedacao: "Abrir pela urgência e depois consolidar a narrativa fática." },
      },
    });

    expect(dossie.briefingJuridico.pedidoId).toBe("PED-001");
    expect(dossie.leituraDocumentalEstruturada.totalDocumentos).toBe(2);
    expect(dossie.matrizFatosEProvas).toHaveLength(2);
    expect(dossie.analiseAdversa.pontosFortes).toContain("Documentação contratual consistente.");
    expect(dossie.estrategiaAprovada.liberadaParaEstruturacao).toBe(true);
    expect(dossie.estruturaDaPeca.pedidosPrioritarios).toContain("Tutela de urgência");
  });
});
