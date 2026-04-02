import { MockAuthRepository } from "@/modules/auth/infrastructure/mockAuthRepository";
import { MockModulesRepository } from "@/modules/hub/infrastructure/mockModulesRepository";
import { MockCasosRepository } from "@/modules/casos/infrastructure/mockCasosRepository";
import { MockDocumentosRepository } from "@/modules/documentos/infrastructure/mockDocumentosRepository";
import { MockPeticoesRepository } from "@/modules/peticoes/infrastructure/mockPeticoesRepository";
import { MockBibliotecaRepository } from "@/modules/biblioteca/infrastructure/mockBibliotecaRepository";
import { MockDashboardRepository } from "@/modules/dashboard/infrastructure/mockDashboardRepository";

export const services = {
  authRepository: new MockAuthRepository(),
  modulesRepository: new MockModulesRepository(),
  casosRepository: new MockCasosRepository(),
  documentosRepository: new MockDocumentosRepository(),
  peticoesRepository: new MockPeticoesRepository(),
  bibliotecaRepository: new MockBibliotecaRepository(),
  dashboardRepository: new MockDashboardRepository(),
};
