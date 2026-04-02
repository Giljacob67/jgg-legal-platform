import type { TemplateJuridicoVersionado, TipoPecaCanonica } from "@/modules/peticoes/domain/geracao-minuta";
import { mapTemplateAtivoParaGeracao } from "@/modules/peticoes/base-juridica-viva/domain/types";
import { criarTemplatesJuridicosPadrao } from "@/modules/peticoes/base-juridica-viva/infrastructure/defaultCatalog";

export function listarTemplatesJuridicosVersionados(): TemplateJuridicoVersionado[] {
  return criarTemplatesJuridicosPadrao()
    .filter((item) => item.status === "ativo")
    .map((item) =>
      mapTemplateAtivoParaGeracao({
        template: item,
        tipoPecaCanonica: item.tiposPecaCanonica[0] ?? "manifestacao",
      }),
    );
}

export function obterTemplateJuridicoAtivoPorTipoPeca(tipoPecaCanonica: TipoPecaCanonica): TemplateJuridicoVersionado {
  const templates = criarTemplatesJuridicosPadrao().filter(
    (item) => item.status === "ativo" && item.tiposPecaCanonica.includes(tipoPecaCanonica),
  );
  const template = templates[0] ?? criarTemplatesJuridicosPadrao()[0];

  return mapTemplateAtivoParaGeracao({
    template,
    tipoPecaCanonica,
  });
}
