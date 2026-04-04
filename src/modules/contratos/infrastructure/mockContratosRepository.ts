import type {
  Contrato,
  NovoContratoPayload,
  StatusContrato,
} from "../domain/types";
import { CLAUSULAS_PADRAO } from "./templatesClausulas";

let _idCounter = 10;
function nextId() {
  _idCounter++;
  return `CTR-2026-${String(_idCounter).padStart(3, "0")}`;
}

function clausulasParaContrato(tipo: Contrato["tipo"]) {
  return (CLAUSULAS_PADRAO[tipo] ?? CLAUSULAS_PADRAO["outro"]).map((c, i) => ({
    ...c,
    id: `cl-${i + 1}`,
  }));
}

const CONTRATOS_MOCK: Contrato[] = [
  {
    id: "CTR-2026-001",
    casoId: "CAS-2026-001",
    titulo: "Arrendamento Rural — Fazenda São João",
    tipo: "arrendamento_rural",
    status: "vigente",
    objeto: "Arrendamento de 320 hectares de terra agricultável para cultivo de soja e milho.",
    partes: [
      { papel: "arrendador", nome: "Atlas Engenharia S.A.", cpfCnpj: "12.345.678/0001-90", qualificacao: "pessoa jurídica de direito privado" },
      { papel: "arrendatario", nome: "Cooperativa Agrícola do Cerrado Ltda.", cpfCnpj: "98.765.432/0001-10", qualificacao: "cooperativa agrícola regularmente constituída" },
    ],
    clausulas: clausulasParaContrato("arrendamento_rural"),
    valorReais: 18000000, // R$ 180.000,00 (em centavos)
    vigenciaInicio: "2025-07-01",
    vigenciaFim: "2028-06-30",
    conteudoAtual: "CONTRATO DE ARRENDAMENTO RURAL\n\nPelo presente instrumento particular...",
    versoes: [
      { id: "v1", numero: 1, autorNome: "Gilberto Jacob", resumoMudancas: "Versão inicial", conteudo: "", criadoEm: "2025-06-15T10:00:00Z" },
    ],
    responsavelId: "usr-001",
    criadoEm: "2025-06-15T10:00:00Z",
    atualizadoEm: "2025-07-01T09:00:00Z",
  },
  {
    id: "CTR-2026-002",
    casoId: "CAS-2026-003",
    titulo: "Honorários Advocatícios — Impugnação ao Cumprimento de Sentença",
    tipo: "honorarios_advocaticios",
    status: "assinado",
    objeto: "Contrato de prestação de serviços advocatícios para defesa em impugnação ao cumprimento de sentença.",
    partes: [
      { papel: "contratante", nome: "Prod. Rural Benedito Ferreira", cpfCnpj: "012.345.678-90" },
      { papel: "contratado", nome: "JGG Group — Advocacia e Consultoria", cpfCnpj: "00.000.000/0001-00" },
    ],
    clausulas: clausulasParaContrato("honorarios_advocaticios"),
    valorReais: 1500000, // R$ 15.000,00
    conteudoAtual: "CONTRATO DE HONORÁRIOS ADVOCATÍCIOS\n\nPelo presente instrumento...",
    versoes: [],
    responsavelId: "usr-002",
    criadoEm: "2026-01-10T14:30:00Z",
    atualizadoEm: "2026-01-12T11:00:00Z",
  },
  {
    id: "CTR-2026-003",
    titulo: "Parceria Agrícola — Safra 2026/2027",
    tipo: "parceria_agricola",
    status: "em_revisao",
    objeto: "Parceria agrícola para cultivo de soja na propriedade Fazenda Esperança, com divisão de 40% ao outorgante e 60% ao outorgado.",
    partes: [
      { papel: "outro", nome: "Marcos Antônio Teixeira", cpfCnpj: "456.789.012-34", qualificacao: "proprietário rural" },
      { papel: "outro", nome: "Agropecuária Souza & Irmãos Ltda.", cpfCnpj: "34.567.890/0001-12" },
    ],
    clausulas: clausulasParaContrato("parceria_agricola"),
    vigenciaInicio: "2026-07-01",
    vigenciaFim: "2027-06-30",
    conteudoAtual: "CONTRATO DE PARCERIA AGRÍCOLA\n\nAo [dia] de [mês] de [ano]...",
    versoes: [],
    responsavelId: "usr-003",
    criadoEm: "2026-03-20T08:00:00Z",
    atualizadoEm: "2026-03-28T16:00:00Z",
  },
  {
    id: "CTR-2026-004",
    titulo: "NDA — Projeto de Reestruturação Societária",
    tipo: "nda_confidencialidade",
    status: "rascunho",
    objeto: "Acordo de confidencialidade para proteção de informações no contexto de reestruturação societária.",
    partes: [
      { papel: "cedente", nome: "Terrafort Investimentos S.A." },
      { papel: "cessionario", nome: "JGG Group — Advocacia e Consultoria" },
    ],
    clausulas: clausulasParaContrato("nda_confidencialidade"),
    conteudoAtual: "ACORDO DE CONFIDENCIALIDADE\n\nAs partes identificadas neste instrumento...",
    versoes: [],
    criadoEm: "2026-04-01T09:00:00Z",
    atualizadoEm: "2026-04-01T09:00:00Z",
  },
];

const contratosStore: Contrato[] = [...CONTRATOS_MOCK];

export class MockContratosRepository {
  async listar(filtros?: { status?: StatusContrato; tipo?: Contrato["tipo"] }): Promise<Contrato[]> {
    let resultado = [...contratosStore];
    if (filtros?.status) resultado = resultado.filter((c) => c.status === filtros.status);
    if (filtros?.tipo) resultado = resultado.filter((c) => c.tipo === filtros.tipo);
    return resultado.sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm));
  }

  async obterPorId(id: string): Promise<Contrato | null> {
    return contratosStore.find((c) => c.id === id) ?? null;
  }

  async criar(payload: NovoContratoPayload): Promise<Contrato> {
    const id = nextId();
    const agora = new Date().toISOString();
    const clausulas = clausulasParaContrato(payload.tipo);

    const novo: Contrato = {
      id,
      ...payload,
      status: "rascunho",
      clausulas,
      conteudoAtual: `CONTRATO DE ${payload.titulo.toUpperCase()}\n\n${clausulas.map((c) => `${c.numero}. ${c.titulo.toUpperCase()}\n\n${c.conteudo}`).join("\n\n")}`,
      versoes: [{ id: "v1", numero: 1, autorNome: "Sistema", resumoMudancas: "Versão inicial gerada automaticamente", conteudo: "", criadoEm: agora }],
      criadoEm: agora,
      atualizadoEm: agora,
    };
    contratosStore.push(novo);
    return novo;
  }

  async atualizarStatus(id: string, status: StatusContrato): Promise<Contrato> {
    const idx = contratosStore.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Contrato ${id} não encontrado.`);
    contratosStore[idx] = { ...contratosStore[idx], status, atualizadoEm: new Date().toISOString() };
    return contratosStore[idx];
  }

  async salvarAnaliseRisco(id: string, analise: Contrato["analiseRisco"]): Promise<void> {
    const idx = contratosStore.findIndex((c) => c.id === id);
    if (idx !== -1) {
      contratosStore[idx] = { ...contratosStore[idx], analiseRisco: analise, atualizadoEm: new Date().toISOString() };
    }
  }
}
