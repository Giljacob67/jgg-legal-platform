import type { SessaoMock } from "@/modules/auth/domain/types";

export interface AuthRepository {
  obterSessao(): SessaoMock | null;
}

export class MockAuthRepository implements AuthRepository {
  private readonly sessaoAtual: SessaoMock = {
    usuarioId: "usr-adv-001",
    nome: "Mariana Couto",
    iniciais: "MC",
    perfil: "Advogado",
    ativo: true,
  };

  obterSessao(): SessaoMock | null {
    return this.sessaoAtual.ativo ? this.sessaoAtual : null;
  }
}
