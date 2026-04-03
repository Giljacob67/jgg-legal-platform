export type StatusCaso =
  | "novo"
  | "em análise"
  | "estratégia"
  | "minuta em elaboração"
  | "revisão"
  | "protocolado";

/**
 * O polo representa qual lado do processo o escritório está patrocinando.
 * É fundamental para que os agentes de IA analisem documentos e estratégias
 * pelo ângulo correto, favorecendo sempre o cliente.
 */
export type PoloRepresentado = "ativo" | "passivo" | "indefinido";

export interface Parte {
  nome: string;
  papel: "autor" | "réu" | "terceiro";
}

export interface EventoCaso {
  id: string;
  data: string;
  descricao: string;
}

export interface Caso {
  id: string;
  titulo: string;
  cliente: string;
  materia: string;
  tribunal: string;
  status: StatusCaso;
  prazoFinal: string;
  resumo: string;
  partes: Parte[];
  documentosRelacionados: string[];
  eventos: EventoCaso[];
  /** Polo que o escritório representa neste caso. Detectado automaticamente ou definido manualmente. */
  poloRepresentado?: PoloRepresentado;
}

/**
 * Dado um caso, detecta automaticamente o polo representado
 * cruzando o nome do cliente com as partes processuais.
 */
export function detectarPoloRepresentado(caso: Caso): PoloRepresentado {
  if (caso.poloRepresentado && caso.poloRepresentado !== "indefinido") {
    return caso.poloRepresentado;
  }

  if (!caso.partes || caso.partes.length === 0) return "indefinido";

  const clienteNormalizado = caso.cliente.toLowerCase().trim();

  for (const parte of caso.partes) {
    const nomeNormalizado = parte.nome.toLowerCase().trim();
    const bateNome =
      nomeNormalizado.includes(clienteNormalizado) ||
      clienteNormalizado.includes(nomeNormalizado);

    if (bateNome) {
      if (parte.papel === "autor") return "ativo";
      if (parte.papel === "réu") return "passivo";
    }
  }

  return "indefinido";
}
