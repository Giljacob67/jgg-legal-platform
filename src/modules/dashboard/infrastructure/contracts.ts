import type { DashboardViewModel } from "@/modules/dashboard/domain/types";

export interface DashboardRepository {
  obterVisaoGeral(): Promise<DashboardViewModel>;
}
