import type { MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";
import type {
  ChecklistItem,
  EntradaMotorInteligenciaJuridica,
  PainelInteligenciaJuridica,
  PesosScoreQualidade,
  TeseJuridicaCatalogo,
} from "@/modules/peticoes/inteligencia-juridica/domain/types";

export interface CatalogoTesesRepository {
  listarPorTipoEMateria(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
    contextoTexto?: string;
  }): Promise<TeseJuridicaCatalogo[]>;
}

export interface ChecklistRepository {
  listarPorTipoPeca(input: { tipoPecaCanonica: TipoPecaCanonica }): Promise<ChecklistItem[]>;
}

export interface ConfigScoreRepository {
  obterPesos(): Promise<PesosScoreQualidade>;
}

export interface InteligenciaJuridicaInfra {
  catalogoTesesRepository: CatalogoTesesRepository;
  checklistRepository: ChecklistRepository;
  configScoreRepository: ConfigScoreRepository;
}

export interface MotorInteligenciaJuridica {
  avaliar(input: EntradaMotorInteligenciaJuridica): Promise<PainelInteligenciaJuridica>;
}
