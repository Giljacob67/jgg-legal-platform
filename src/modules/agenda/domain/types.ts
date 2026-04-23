export type AgendaViewMode = "mes" | "semana" | "dia";

export interface EventoAgendaDemo {
  id: string;
  titulo: string;
  horario: string;
  tipo: "audiencia" | "prazo" | "reuniao" | "interno";
  responsavel: string;
  origem: string;
  destaque?: boolean;
}

export const EVENTOS_AGENDA_DEMO: EventoAgendaDemo[] = [
  {
    id: "evt-001",
    titulo: "Audiência de instrução • Fazenda Atlas",
    horario: "09:00",
    tipo: "audiencia",
    responsavel: "Mariana Couto",
    origem: "Caso CAS-2026-014",
    destaque: true,
  },
  {
    id: "evt-002",
    titulo: "Prazo final • réplica em execução",
    horario: "11:30",
    tipo: "prazo",
    responsavel: "Rafael Costa",
    origem: "Pedido PED-2026-031",
  },
  {
    id: "evt-003",
    titulo: "Reunião de estratégia com cliente",
    horario: "15:00",
    tipo: "reuniao",
    responsavel: "Gilberto Jacob",
    origem: "Cliente Agrovale",
  },
  {
    id: "evt-004",
    titulo: "Janela interna de revisão técnica",
    horario: "17:30",
    tipo: "interno",
    responsavel: "Coordenação Jurídica",
    origem: "Operação Contencioso",
  },
];
