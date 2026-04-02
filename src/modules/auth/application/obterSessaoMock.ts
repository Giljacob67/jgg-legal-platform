import { services } from "@/services/container";
import type { SessaoMock } from "@/modules/auth/domain/types";

export function obterSessaoMock(): SessaoMock | null {
  return services.authRepository.obterSessao();
}
