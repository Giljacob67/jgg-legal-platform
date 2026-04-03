import { getDataMode } from "@/lib/data-mode";
import { MockAuthRepository } from "@/modules/auth/infrastructure/mockAuthRepository";
import { MockModulesRepository } from "@/modules/hub/infrastructure/mockModulesRepository";
import { MockCasosRepository } from "@/modules/casos/infrastructure/mockCasosRepository";
import { PostgresCasosRepository } from "@/modules/casos/infrastructure/postgresCasosRepository";
import { MockDocumentosRepository } from "@/modules/documentos/infrastructure/mockDocumentosRepository";
import { MockPeticoesRepository } from "@/modules/peticoes/infrastructure/mockPeticoesRepository";
import { PostgresPeticoesRepository } from "@/modules/peticoes/infrastructure/postgresPeticoesRepository";
import { MockBibliotecaRepository } from "@/modules/biblioteca/infrastructure/mockBibliotecaRepository";
import { MockDashboardRepository } from "@/modules/dashboard/infrastructure/mockDashboardRepository";

const mode = getDataMode();

export const services = {
  authRepository: new MockAuthRepository(),
  modulesRepository: new MockModulesRepository(),
  casosRepository: mode === "real" ? new PostgresCasosRepository() : new MockCasosRepository(),
  documentosRepository: new MockDocumentosRepository(),
  peticoesRepository: mode === "real" ? new PostgresPeticoesRepository() : new MockPeticoesRepository(),
  bibliotecaRepository: new MockBibliotecaRepository(),
  dashboardRepository: new MockDashboardRepository(),
};
