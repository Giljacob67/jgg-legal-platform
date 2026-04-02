import { services } from "@/services/container";
import type { DashboardViewModel } from "@/modules/dashboard/domain/types";

export function obterVisaoDashboard(): DashboardViewModel {
  return services.dashboardRepository.obterVisaoGeral();
}
