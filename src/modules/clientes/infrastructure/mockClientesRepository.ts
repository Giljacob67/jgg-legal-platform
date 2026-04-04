import type { Cliente, NovoClientePayload, StatusCliente } from "../domain/types";

let _id = 5;
function nextId() { return `CLI-2026-${String(++_id).padStart(3, "0")}`; }

const CLIENTES_MOCK: Cliente[] = [
  {
    id: "CLI-2026-001",
    nome: "Atlas Engenharia S.A.",
    tipo: "pessoa_juridica",
    cpfCnpj: "12.345.678/0001-90",
    email: "juridico@atlas.com.br",
    telefone: "(65) 3321-4455",
    endereco: { cidade: "Cuiabá", estado: "MT", cep: "78000-000" },
    status: "ativo",
    responsavelId: "usr-001",
    responsavelNome: "Gilberto Jacob",
    casosIds: ["CAS-2026-001"],
    contratosIds: ["CTR-2026-001"],
    anotacoes: "Empresa de engenharia com propriedades rurais em Mato Grosso. Demandas frequentes em direito agrário.",
    criadoEm: "2025-06-01T08:00:00Z",
    atualizadoEm: "2026-03-15T10:00:00Z",
  },
  {
    id: "CLI-2026-002",
    nome: "Prod. Rural Benedito Ferreira",
    tipo: "pessoa_fisica",
    cpfCnpj: "012.345.678-90",
    email: "benedito@fazendaferreira.com.br",
    telefone: "(65) 99823-4567",
    endereco: { cidade: "Sinop", estado: "MT" },
    status: "ativo",
    responsavelId: "usr-002",
    responsavelNome: "Ana Paula Mendes",
    casosIds: ["CAS-2026-003"],
    contratosIds: ["CTR-2026-002"],
    anotacoes: "Produtor rural, área de grãos. Processos envolvendo execução bancária de crédito rural.",
    criadoEm: "2025-09-10T09:00:00Z",
    atualizadoEm: "2026-01-10T14:00:00Z",
  },
  {
    id: "CLI-2026-003",
    nome: "Cooperativa Agrícola do Cerrado Ltda.",
    tipo: "pessoa_juridica",
    cpfCnpj: "98.765.432/0001-10",
    email: "juridico@cerrado.coop.br",
    telefone: "(64) 3312-0099",
    endereco: { cidade: "Rio Verde", estado: "GO" },
    status: "ativo",
    responsavelId: "usr-003",
    responsavelNome: "Rafael Costa",
    casosIds: [],
    contratosIds: ["CTR-2026-001"],
    anotacoes: "Cooperativa com mais de 800 associados. Assuntos: arrendamento, contratos de parceria, financiamentos.",
    criadoEm: "2025-03-01T10:00:00Z",
    atualizadoEm: "2026-02-20T09:00:00Z",
  },
  {
    id: "CLI-2026-004",
    nome: "Marcos Antônio Teixeira",
    tipo: "pessoa_fisica",
    cpfCnpj: "456.789.012-34",
    email: "marcos@teixeiraagricultura.com",
    telefone: "(64) 99712-3344",
    endereco: { cidade: "Jataí", estado: "GO" },
    status: "prospecto",
    casosIds: [],
    contratosIds: ["CTR-2026-003"],
    criadoEm: "2026-03-18T10:00:00Z",
    atualizadoEm: "2026-03-18T10:00:00Z",
  },
  {
    id: "CLI-2026-005",
    nome: "Terrafort Investimentos S.A.",
    tipo: "pessoa_juridica",
    cpfCnpj: "11.222.333/0001-44",
    email: "legal@terrafort.com.br",
    status: "prospecto",
    casosIds: [],
    contratosIds: ["CTR-2026-004"],
    anotacoes: "Empresa de investimentos com foco em agropecuária. Processo de reestruturação societária em andamento.",
    criadoEm: "2026-04-01T10:00:00Z",
    atualizadoEm: "2026-04-01T10:00:00Z",
  },
];

const clientesStore: Cliente[] = [...CLIENTES_MOCK];

export class MockClientesRepository {
  async listar(filtros?: { status?: StatusCliente }): Promise<Cliente[]> {
    let resultado = [...clientesStore];
    if (filtros?.status) resultado = resultado.filter((c) => c.status === filtros.status);
    return resultado.sort((a, b) => a.nome.localeCompare(b.nome));
  }

  async obterPorId(id: string): Promise<Cliente | null> {
    return clientesStore.find((c) => c.id === id) ?? null;
  }

  async criar(payload: NovoClientePayload): Promise<Cliente> {
    const id = nextId();
    const agora = new Date().toISOString();
    const novo: Cliente = { id, ...payload, status: payload.status ?? "ativo", casosIds: [], contratosIds: [], criadoEm: agora, atualizadoEm: agora };
    clientesStore.push(novo);
    return novo;
  }

  async atualizar(id: string, dados: Partial<NovoClientePayload>): Promise<Cliente> {
    const idx = clientesStore.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error(`Cliente ${id} não encontrado.`);
    clientesStore[idx] = { ...clientesStore[idx], ...dados, atualizadoEm: new Date().toISOString() };
    return clientesStore[idx];
  }
}
