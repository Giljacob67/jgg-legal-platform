"use client";

import { useState } from "react";
import { PedidoWorkspaceTabs } from "./pedido-workspace-tabs";
import { ResumoSection } from "./resumo-section";
import { BriefingSection } from "./briefing-section";
import { DocumentosSection } from "./documentos-section";
import { FatosProvasSection } from "./fatos-provas-section";
import { AnaliseAdversaSection } from "./analise-adversa-section";
import { EstrategiaSection } from "./estrategia-section";
import { TesesSection } from "./teses-section";
import { EstruturaPecaSection } from "./estrutura-peca-section";
import { MinutaSection } from "./minuta-section";
import { RevisaoAuditoriaSection } from "./revisao-auditoria-section";
import { AssistenteSection } from "./assistente/assistente-section";
import type { PedidoWorkspaceData, SecaoPedidoId } from "./types";

type PedidoWorkspaceClientProps = PedidoWorkspaceData;

export function PedidoWorkspaceClient(props: PedidoWorkspaceClientProps) {
  const [secaoAtiva, setSecaoAtiva] = useState<SecaoPedidoId>("assistente");

  return (
    <PedidoWorkspaceTabs secaoAtiva={secaoAtiva} onSelecionarSecao={setSecaoAtiva}>
      {secaoAtiva === "resumo" && (
        <ResumoSection
          pedido={props.pedido}
          diasRestantes={props.diasRestantes}
          responsavelDefinido={props.responsavelDefinido}
          percentualConclusao={props.percentualConclusao}
          proximaAcao={props.proximaAcao}
          prontidaoAprovacao={props.prontidaoAprovacao}
        />
      )}

      {secaoAtiva === "briefing" && (
        <BriefingSection
          pedido={props.pedido}
          contextoAtual={props.contextoAtual}
          dossie={props.dossie}
        />
      )}

      {secaoAtiva === "documentos" && (
        <DocumentosSection
          documentos={props.documentos}
          dossie={props.dossie}
        />
      )}

      {secaoAtiva === "fatos-provas" && (
        <FatosProvasSection dossie={props.dossie} pedido={props.pedido} />
      )}

      {secaoAtiva === "analise-adversa" && (
        <AnaliseAdversaSection dossie={props.dossie} />
      )}

      {secaoAtiva === "estrategia" && (
        <EstrategiaSection dossie={props.dossie} />
      )}

      {secaoAtiva === "teses" && (
        <TesesSection pedido={props.pedido} contextoAtual={props.contextoAtual} />
      )}

      {secaoAtiva === "estrutura-peca" && (
        <EstruturaPecaSection contextoAtual={props.contextoAtual} />
      )}

      {secaoAtiva === "minuta" && (
        <MinutaSection minuta={props.minuta} pedido={props.pedido} />
      )}

      {secaoAtiva === "revisao-auditoria" && (
        <RevisaoAuditoriaSection
          historico={props.historico}
          prontidaoAprovacao={props.prontidaoAprovacao}
          snapshots={props.snapshots}
          etapaAtual={props.etapaAtual}
        />
      )}

      {secaoAtiva === "assistente" && (
        <AssistenteSection
          pedido={props.pedido}
          documentos={props.documentos}
          dossie={props.dossie}
          contextoAtual={props.contextoAtual}
        />
      )}
    </PedidoWorkspaceTabs>
  );
}
