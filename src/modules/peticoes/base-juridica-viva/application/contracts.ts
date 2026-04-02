import type {
  ChecklistJuridicoAtivoVersionado,
  FiltrosAtivosJuridicos,
  StatusAtivoJuridico,
  TemplateJuridicoAtivoVersionado,
  TeseJuridicaAtivaVersionada,
} from "@/modules/peticoes/base-juridica-viva/domain/types";
import type { MateriaCanonica, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";

export interface BaseJuridicaVivaRepository {
  listarTemplates(filtros?: FiltrosAtivosJuridicos): Promise<TemplateJuridicoAtivoVersionado[]>;
  obterTemplatePorId(id: string): Promise<TemplateJuridicoAtivoVersionado | null>;
  atualizarStatusTemplate(id: string, status: StatusAtivoJuridico): Promise<TemplateJuridicoAtivoVersionado>;
  criarNovaVersaoTemplate(id: string): Promise<TemplateJuridicoAtivoVersionado>;
  obterTemplateAtivoParaGeracao(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
  }): Promise<TemplateJuridicoAtivoVersionado | null>;

  listarTeses(filtros?: FiltrosAtivosJuridicos): Promise<TeseJuridicaAtivaVersionada[]>;
  obterTesePorId(id: string): Promise<TeseJuridicaAtivaVersionada | null>;
  atualizarStatusTese(id: string, status: StatusAtivoJuridico): Promise<TeseJuridicaAtivaVersionada>;
  criarNovaVersaoTese(id: string): Promise<TeseJuridicaAtivaVersionada>;
  listarTesesAtivas(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
  }): Promise<TeseJuridicaAtivaVersionada[]>;

  listarChecklists(filtros?: FiltrosAtivosJuridicos): Promise<ChecklistJuridicoAtivoVersionado[]>;
  obterChecklistPorId(id: string): Promise<ChecklistJuridicoAtivoVersionado | null>;
  atualizarStatusChecklist(id: string, status: StatusAtivoJuridico): Promise<ChecklistJuridicoAtivoVersionado>;
  criarNovaVersaoChecklist(id: string): Promise<ChecklistJuridicoAtivoVersionado>;
  listarChecklistsAtivos(input: {
    tipoPecaCanonica: TipoPecaCanonica;
    materiaCanonica: MateriaCanonica;
  }): Promise<ChecklistJuridicoAtivoVersionado[]>;
}
