import { services } from "@/services/container";
import type { DashboardViewModel } from "@/modules/dashboard/domain/types";

export async function obterVisaoDashboard(): Promise<DashboardViewModel> {
  return services.dashboardRepository.obterVisaoGeral();
}
