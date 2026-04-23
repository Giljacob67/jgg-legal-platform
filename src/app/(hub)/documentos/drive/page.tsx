import Link from "next/link";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineAlert } from "@/components/ui/inline-alert";
import { obterConfiguracoes } from "@/modules/administracao/application";
import { avaliarGoogleWorkspace, extrairGoogleWorkspaceConfig } from "@/modules/administracao/domain/google-workspace";
import { listarArquivosDriveExplorer } from "@/modules/drive-explorer/application/listarArquivosDriveExplorer";
import { obterStatusAgendaGoogle } from "@/modules/agenda/application/google-calendar";
import { formatarDataHora } from "@/lib/utils";
import { listarVinculosDriveExplorer } from "@/modules/drive-explorer/application/vinculos";
import { listarCasos } from "@/modules/casos/application/listarCasos";
import { listarPedidosDePeca } from "@/modules/peticoes/application/listarPedidosDePeca";
import { listarClientes } from "@/modules/clientes/application";
import { DriveExplorerItemVinculos } from "@/modules/drive-explorer/ui/drive-explorer-item-vinculos";

type DocumentosDrivePageProps = {
  searchParams: Promise<{
    folderId?: string;
    q?: string;
  }>;
};

export default async function DocumentosDrivePage({ searchParams }: DocumentosDrivePageProps) {
  const session = await auth();
  const params = await searchParams;
  const configuracoes = await obterConfiguracoes();
  const googleConfig = extrairGoogleWorkspaceConfig(configuracoes);
  const readiness = avaliarGoogleWorkspace(googleConfig);
  const query = params.q?.trim() ?? "";

  let connection:
    | Awaited<ReturnType<typeof obterStatusAgendaGoogle>>
    | { conectada: false; calendarios: []; pendencia: string } = { conectada: false, calendarios: [], pendencia: "Sessão indisponível." };
  let explorer:
    | Awaited<ReturnType<typeof listarArquivosDriveExplorer>>
    | null = null;
  let vinculosPorArquivo: Record<string, Awaited<ReturnType<typeof listarVinculosDriveExplorer>>> = {};
  let casos: Awaited<ReturnType<typeof listarCasos>> = [];
  let pedidos: Awaited<ReturnType<typeof listarPedidosDePeca>> = [];
  let clientes: Awaited<ReturnType<typeof listarClientes>> = [];
  let detalheErro: string | null = null;

  if (session?.user?.id) {
    try {
      connection = await obterStatusAgendaGoogle(session.user.id);
      if (connection.conectada && readiness.driveExplorerOk) {
        [explorer, casos, pedidos, clientes] = await Promise.all([
          listarArquivosDriveExplorer(session.user.id, {
            folderId: params.folderId,
            query,
          }),
          listarCasos(),
          listarPedidosDePeca(),
          listarClientes({ status: "ativo" }),
        ]);
        const vinculos = await listarVinculosDriveExplorer(session.user.id, {
          driveFileIds: explorer.itens.filter((item) => item.tipo === "arquivo").map((item) => item.id),
        });
        vinculosPorArquivo = vinculos.reduce<Record<string, typeof vinculos>>((acc, item) => {
          acc[item.driveFileId] = [...(acc[item.driveFileId] ?? []), item];
          return acc;
        }, {});
      }
    } catch (error) {
      detalheErro = error instanceof Error ? error.message : "Falha ao carregar arquivos do Google Drive.";
    }
  }

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

      {!connection.conectada ? (
        <InlineAlert title="Conexão Google pendente" variant="warning">
          Conecte sua conta Google para navegar no Drive com as permissões reais do seu usuário.
        </InlineAlert>
      ) : detalheErro ? (
        <InlineAlert title="Falha ao carregar arquivos do Drive" variant="warning">
          {detalheErro}
        </InlineAlert>
      ) : (
        <InlineAlert title="Drive operacional ativo" variant="success">
          Esta tela já navega em pastas e arquivos reais do Google Drive sem misturar isso com a sincronização da Biblioteca Jurídica.
        </InlineAlert>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Explorer do Drive" subtitle="Navegação real por pastas e arquivos." eyebrow="Operação">
          <StatusBadge label={connection.conectada && explorer ? "ativo" : readiness.driveExplorerOk ? "pronto para conectar" : "dependência pendente"} variant={connection.conectada && explorer ? "sucesso" : readiness.driveExplorerOk ? "sucesso" : "alerta"} />
          <p className="text-sm text-[var(--color-muted)]">
            O Explorer usa OAuth por usuário para refletir permissões individuais e abrir o arquivo real no contexto certo.
          </p>
        </Card>
        <Card title="Biblioteca Sync" subtitle="Importação para indexação e RAG." eyebrow="Conhecimento">
          <StatusBadge label={readiness.bibliotecaSyncOk ? "ativo" : "incompleto"} variant={readiness.bibliotecaSyncOk ? "sucesso" : "alerta"} />
          <p className="text-sm text-[var(--color-muted)]">
            A sincronização institucional continua separada para ingestão, classificação e pesquisa semântica.
          </p>
        </Card>
        <Card title="Vínculo operacional" subtitle="Casos, petições e documentos." eyebrow="Fluxo futuro">
          <StatusBadge label="próxima camada" variant="planejado" />
          <p className="text-sm text-[var(--color-muted)]">
            A próxima fase vai permitir vincular o arquivo certo ao caso ou pedido sem duplicação desnecessária.
          </p>
        </Card>
      </div>

      <section className="grid gap-6 xl:grid-cols-[1.45fr,0.95fr]">
        <Card title="Explorer do Google Drive" subtitle="Navegação por pasta atual, busca e abertura do arquivo real." eyebrow="Arquivos">
          {!connection.conectada ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted)]">
                A conexão OAuth é obrigatória para refletir o que este usuário realmente pode abrir no Google Drive.
              </p>
              <Link
                href="/api/integracoes/google/authorize?redirectTo=/documentos/drive"
                className="inline-flex rounded-2xl bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
              >
                Conectar Google Drive
              </Link>
            </div>
          ) : !explorer ? (
            <p className="text-sm text-[var(--color-muted)]">
              O Explorer ainda não conseguiu carregar a pasta atual.
            </p>
          ) : (
            <div className="space-y-4">
              <form className="grid gap-3 md:grid-cols-[1fr,auto]">
                <input type="hidden" name="folderId" value={explorer.pastaAtual.id} />
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Buscar arquivo ou pasta dentro do contexto atual"
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-sm text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)]"
                />
                <button
                  type="submit"
                  className="rounded-2xl bg-[var(--color-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
                >
                  Buscar
                </button>
              </form>

              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-muted)]">
                {explorer.breadcrumbs.map((crumb, index) => (
                  <span key={crumb.id} className="inline-flex items-center gap-2">
                    <Link href={`/documentos/drive?folderId=${crumb.id}`} className="font-medium text-[var(--color-accent)]">
                      {crumb.nome}
                    </Link>
                    {index < explorer.breadcrumbs.length - 1 ? <span>/</span> : null}
                  </span>
                ))}
              </div>

              <div className="grid gap-3">
                {explorer.itens.length === 0 ? (
                  <div className="rounded-[1.3rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-alt)] p-6 text-sm text-[var(--color-muted)]">
                    Nenhum item encontrado nesta pasta{query ? " para a busca informada" : ""}.
                  </div>
                ) : (
                  explorer.itens.map((item) => (
                    <article key={item.id} className="rounded-[1.3rem] border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--color-ink)]">{item.nome}</p>
                            <StatusBadge
                              label={item.tipo === "pasta" ? "pasta" : "arquivo"}
                              variant={item.tipo === "pasta" ? "neutro" : "sucesso"}
                            />
                          </div>
                          <p className="text-xs text-[var(--color-muted)]">{item.mimeType}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-[var(--color-muted)]">
                            {item.modificadoEm ? <span>Atualizado em {formatarDataHora(item.modificadoEm)}</span> : null}
                            {item.tamanhoLabel ? <span>{item.tamanhoLabel}</span> : null}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.tipo === "pasta" ? (
                            <Link
                              href={`/documentos/drive?folderId=${item.id}`}
                              className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition hover:bg-[var(--color-card)]"
                            >
                              Abrir pasta
                            </Link>
                          ) : null}
                          {item.webViewLink ? (
                            <a
                              href={item.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded-xl bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[var(--color-accent-strong)]"
                            >
                              Abrir no Drive
                            </a>
                          ) : null}
                        </div>
                      </div>
                      {item.tipo === "arquivo" ? (
                        <DriveExplorerItemVinculos
                          driveFileId={item.id}
                          driveFileName={item.nome}
                          driveMimeType={item.mimeType}
                          driveWebViewLink={item.webViewLink}
                          vinculosIniciais={vinculosPorArquivo[item.id] ?? []}
                          opcoes={{
                            casos: casos.map((caso) => ({ id: caso.id, label: `${caso.id} • ${caso.titulo}` })),
                            pedidos: pedidos.map((pedido) => ({ id: pedido.id, label: `${pedido.id} • ${pedido.titulo}` })),
                            clientes: clientes.map((cliente) => ({ id: cliente.id, label: `${cliente.id} • ${cliente.nome}` })),
                          }}
                        />
                      ) : null}
                    </article>
                  ))
                )}
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="Contexto do Explorer" subtitle="Como a navegação está sendo interpretada nesta fase." eyebrow="Escopo">
            <div className="space-y-3 text-sm text-[var(--color-muted)]">
              <p>
                <strong className="text-[var(--color-ink)]">Conta Google:</strong>{" "}
                {connection.conectada ? connection.emailGoogle || "conectada" : "não conectada"}
              </p>
              <p>
                <strong className="text-[var(--color-ink)]">Pasta raiz institucional:</strong>{" "}
                {googleConfig.driveSharedFolderId || "não definida"}
              </p>
              <p>
                <strong className="text-[var(--color-ink)]">Escopo atual:</strong>{" "}
                {explorer?.pastaAtual.nome ?? "aguardando conexão"}
              </p>
            </div>
          </Card>

          <Card title="Separação correta" subtitle="Explorer operacional não substitui a Biblioteca." eyebrow="Arquitetura">
            <div className="space-y-2 text-sm text-[var(--color-muted)]">
              <p>1. Aqui o usuário navega e abre o arquivo real no Google Drive.</p>
              <p>2. Na Biblioteca Jurídica o documento é importado, processado e indexado para IA.</p>
              <p>3. A próxima fase vai adicionar vínculo de arquivo com casos, pedidos e clientes.</p>
            </div>
          </Card>

          <Card title="Próximas camadas" subtitle="O que falta para o módulo ficar operacionalmente completo." eyebrow="Roadmap">
            <div className="space-y-2 text-sm text-[var(--color-muted)]">
              <p>1. Vincular arquivo do Drive a caso, pedido ou cliente.</p>
              <p>2. Importar seletivamente para a Biblioteca a partir do Explorer.</p>
              <p>3. Exibir preview contextual para Google Docs, PDFs e planilhas.</p>
              <p>4. Salvar favoritos e pastas de trabalho por usuário.</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
