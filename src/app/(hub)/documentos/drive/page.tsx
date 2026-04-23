import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { obterConfiguracoes } from "@/modules/administracao/application";
import { avaliarGoogleWorkspace, extrairGoogleWorkspaceConfig } from "@/modules/administracao/domain/google-workspace";

export default async function DocumentosDrivePage() {
  const configuracoes = await obterConfiguracoes();
  const googleConfig = extrairGoogleWorkspaceConfig(configuracoes);
  const readiness = avaliarGoogleWorkspace(googleConfig);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Google Drive"
        description="Frente dedicada para acesso operacional a pastas e arquivos do escritório, separada da sincronização da Biblioteca Jurídica."
        meta={
          <>
            <StatusBadge label={readiness.driveExplorerOk ? "base pronta" : "base pendente"} variant={readiness.driveExplorerOk ? "sucesso" : "alerta"} />
            <StatusBadge label={googleConfig.authMode.replace(/_/g, " ")} variant="neutro" />
          </>
        }
        actions={(
          <Link
            href="/administracao/configuracoes"
            className="rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            Configurar Google
          </Link>
        )}
      />

      <InlineAlert title="Estado atual do projeto" variant="info">
        Hoje o repositório já sincroniza documentos do Drive para a Biblioteca Jurídica, mas ainda não possui
        navegação direta por pastas, preview operacional nem abertura do arquivo real pelo usuário.
      </InlineAlert>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Explorer do Drive" subtitle="Navegação real por pastas e arquivos." eyebrow="Operação">
          <StatusBadge label={readiness.driveExplorerOk ? "próximo para implementação" : "dependência pendente"} variant={readiness.driveExplorerOk ? "sucesso" : "alerta"} />
          <p className="text-sm text-[var(--color-muted)]">
            O produto precisa de OAuth por usuário para refletir permissões individuais e permitir abrir o arquivo certo no contexto do caso.
          </p>
        </Card>
        <Card title="Biblioteca Sync" subtitle="Importação para indexação e RAG." eyebrow="Conhecimento">
          <StatusBadge label={readiness.bibliotecaSyncOk ? "ativo" : "incompleto"} variant={readiness.bibliotecaSyncOk ? "sucesso" : "alerta"} />
          <p className="text-sm text-[var(--color-muted)]">
            A sincronização institucional continua separada para ingestão, classificação e pesquisa semântica.
          </p>
        </Card>
        <Card title="Vínculo operacional" subtitle="Casos, petições e documentos." eyebrow="Fluxo futuro">
          <StatusBadge label="planejado" variant="planejado" />
          <p className="text-sm text-[var(--color-muted)]">
            O Explorer vai permitir vincular o arquivo certo ao caso ou pedido sem duplicação desnecessária.
          </p>
        </Card>
      </div>

      <Card title="O que será entregue nesta frente" subtitle="Arquitetura-alvo do acesso direto ao Google Drive." eyebrow="Roadmap">
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.3rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Capacidades do Explorer</p>
            <div className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              <p>1. Listar pastas e arquivos com busca, filtros e caminho completo.</p>
              <p>2. Abrir o arquivo no Drive ou em preview contextual.</p>
              <p>3. Vincular arquivos a casos, pedidos e clientes.</p>
              <p>4. Importar seletivamente para a Biblioteca quando fizer sentido.</p>
            </div>
          </div>
          <div className="rounded-[1.3rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
            <p className="text-sm font-semibold text-[var(--color-ink)]">Dependências técnicas</p>
            <div className="mt-3 space-y-2 text-sm text-[var(--color-muted)]">
              <p>1. OAuth por usuário para respeitar permissões reais do Google Drive.</p>
              <p>2. Rotas server-side para listagem, metadados e links seguros.</p>
              <p>3. Tela própria em Documentos para navegação operacional.</p>
              <p>4. Vínculo com casos e pedidos sem misturar com a Biblioteca RAG.</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
