import type { AlcadaAdvogado, AlertaGestao, KpiOperacional } from "@/modules/gestao/domain/types";

export interface GestaoRepository {
  obterKpis(): Promise<KpiOperacional>;
  listarAlcadas(): Promise<AlcadaAdvogado[]>;
  listarAlertas(): Promise<AlertaGestao[]>;
}
