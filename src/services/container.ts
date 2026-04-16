import { getDataMode } from "@/lib/data-mode";
import { MockAuthRepository } from "@/modules/auth/infrastructure/mockAuthRepository";
import { MockModulesRepository } from "@/modules/hub/infrastructure/mockModulesRepository";
import { MockCasosRepository } from "@/modules/casos/infrastructure/mockCasosRepository";
import { PostgresCasosRepository } from "@/modules/casos/infrastructure/postgresCasosRepository";
import { MockDocumentosRepository } from "@/modules/documentos/infrastructure/mockDocumentosRepository";
import { MockPeticoesRepository } from "@/modules/peticoes/infrastructure/mockPeticoesRepository";
import { PostgresPeticoesRepository } from "@/modules/peticoes/infrastructure/postgresPeticoesRepository";
import { MockDashboardRepository } from "@/modules/dashboard/infrastructure/mockDashboardRepository";
import { PostgresDashboardRepository } from "@/modules/dashboard/infrastructure/postgresDashboardRepository";
import { MockClientesRepository } from "@/modules/clientes/infrastructure/mockClientesRepository";
import { PostgresClientesRepository } from "@/modules/clientes/infrastructure/postgresClientesRepository";
import { MockJurisprudenciaRepository } from "@/modules/jurisprudencia/infrastructure/mockJurisprudenciaRepository";
import { PostgresJurisprudenciaRepository } from "@/modules/jurisprudencia/infrastructure/postgresJurisprudenciaRepository";
import { MockContratosRepository } from "@/modules/contratos/infrastructure/mockContratosRepository";
import { PostgresContratosRepository } from "@/modules/contratos/infrastructure/postgresContratosRepository";
import { MockAdministracaoRepository } from "@/modules/administracao/infrastructure/mockAdministracaoRepository";
import { PostgresAdministracaoRepository } from "@/modules/administracao/infrastructure/postgresAdministracaoRepository";
import { MockBIRepository } from "@/modules/bi/infrastructure/mockBIRepository";
import { PostgresBIRepository } from "@/modules/bi/infrastructure/postgresBIRepository";

const mode = getDataMode();

export const services = {
  authRepository: new MockAuthRepository(),
  modulesRepository: new MockModulesRepository(),
  casosRepository: mode === "real" ? new PostgresCasosRepository() : new MockCasosRepository(),
  documentosRepository: new MockDocumentosRepository(), // DEPRECADO — use getDocumentosInfra() de documentos/infrastructure/provider.server.ts
  peticoesRepository: mode === "real" ? new PostgresPeticoesRepository() : new MockPeticoesRepository(),
  dashboardRepository: mode === "real" ? new PostgresDashboardRepository() : new MockDashboardRepository(),
  clientesRepository: mode === "real" ? new PostgresClientesRepository() : new MockClientesRepository(),
  jurisprudenciaRepository: mode === "real" ? new PostgresJurisprudenciaRepository() : new MockJurisprudenciaRepository(),
  contratosRepository: mode === "real" ? new PostgresContratosRepository() : new MockContratosRepository(),
  administracaoRepository: mode === "real" ? new PostgresAdministracaoRepository() : new MockAdministracaoRepository(),
  biRepository: mode === "real" ? new PostgresBIRepository() : new MockBIRepository(),
};
