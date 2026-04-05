import { services } from "@/services/container";

export const obterMetricasFinanceiras = () => services.biRepository.obterFinanceiro();
export const obterMetricasJuridicas = () => services.biRepository.obterJuridico();
export const obterInsightsIA = () => services.biRepository.obterInsights();
