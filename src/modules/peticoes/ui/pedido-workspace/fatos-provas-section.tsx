"use client";

import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { InlineAlert } from "@/components/ui/inline-alert";
import { SearchIcon } from "@/components/ui/icons";
import { normalizarMatrizFatoProva } from "@/modules/peticoes/domain/fatos-provas";
import { gerarMockMatrizFatosProvas } from "@/modules/peticoes/application/mock-matriz-fatos-provas";
import { SinteseFatosProvas } from "./sintese-fatos-provas";
import { MatrizFatosProvas } from "./matriz-fatos-provas";
import type { PedidoWorkspaceData } from "./types";

type FatosProvasSectionProps = Pick<PedidoWorkspaceData, "dossie" | "pedido">;

export function FatosProvasSection({ dossie, pedido }: FatosProvasSectionProps) {
  const matrizExistente = dossie?.matrizFatosEProvas;
  const documentosChave = dossie?.leituraDocumentalEstruturada?.documentosChave ?? [];

  // Se não houver matriz no dossiê, usa mock coerente com o pedido
  const matrizNormalizada =
    matrizExistente && matrizExistente.length > 0
      ? normalizarMatrizFatoProva(matrizExistente, documentosChave)
      : gerarMockMatrizFatosProvas(pedido);


  return (
    <div className="space-y-6">
      <SinteseFatosProvas itens={matrizNormalizada} />

      <Card
        title="Matriz de fatos e provas"
        subtitle="Cada fato mapeado com sua classificação jurídica, prova de suporte e recomendação de uso na peça."
        eyebrow="Prova"
      >
        {matrizNormalizada.length === 0 ? (
          <EmptyState
            title="Matriz ainda não construída"
            message="Execute o estágio de extração de fatos no pipeline ou aguarde a leitura documental para formar a matriz probatória."
            icon={<SearchIcon size={22} />}
          />
        ) : (
          <MatrizFatosProvas itens={matrizNormalizada} />
        )}

        {!dossie && matrizNormalizada.length > 0 ? (
          <InlineAlert title="Dados de demonstração" variant="info" className="mt-4">
            Esta matriz está sendo exibida com dados simulados coerentes com o tipo de peça e a matéria do pedido. Execute o pipeline para substituir por análise real.
          </InlineAlert>
        ) : null}
      </Card>
    </div>
  );
}
