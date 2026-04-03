import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { obterClientePorId } from "@/modules/clientes/application";
import { LABEL_STATUS_CLIENTE, STATUS_CLIENTE_COR } from "@/modules/clientes/domain/types";
import Link from "next/link";

type Params = { params: Promise<{ clienteId: string }> };

export default async function ClienteDetalhe({ params }: Params) {
  const { clienteId } = await params;
  const cliente = await obterClientePorId(clienteId);
  if (!cliente) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_CLIENTE_COR[cliente.status]}`}>
              {LABEL_STATUS_CLIENTE[cliente.status]}
            </span>
            <span className="text-xs text-[var(--color-muted)]">{cliente.tipo === "pessoa_juridica" ? "🏢 Pessoa Jurídica" : "👤 Pessoa Física"}</span>
          </div>
          <PageHeader title={cliente.nome} description={cliente.email ?? cliente.cpfCnpj ?? ""} />
        </div>
        <Link href="/clientes" className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]">← Voltar</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,300px]">
        <div className="space-y-6">
          <Card title="Dados do cliente" subtitle="">
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              {[
                { label: "CPF/CNPJ", valor: cliente.cpfCnpj },
                { label: "E-mail", valor: cliente.email },
                { label: "Telefone", valor: cliente.telefone },
                { label: "Responsável", valor: cliente.responsavelNome },
                { label: "Cidade/UF", valor: cliente.endereco ? `${cliente.endereco.cidade ?? ""}/${cliente.endereco.estado ?? ""}` : undefined },
                { label: "Cadastrado em", valor: new Date(cliente.criadoEm).toLocaleDateString("pt-BR") },
              ].filter((f) => f.valor).map((f) => (
                <div key={f.label}>
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wide">{f.label}</p>
                  <p className="mt-0.5 text-[var(--color-ink)]">{f.valor}</p>
                </div>
              ))}
            </div>
            {cliente.anotacoes && (
              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3 text-sm text-[var(--color-muted)]">
                📝 {cliente.anotacoes}
              </div>
            )}
          </Card>

          {/* Casos vinculados */}
          <Card title={`Casos (${cliente.casosIds.length})`} subtitle="">
            {cliente.casosIds.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Nenhum caso vinculado.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {cliente.casosIds.map((id) => (
                  <Link key={id} href={`/casos/${id}`} className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-surface-alt)]">
                    {id} →
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Contratos vinculados */}
          <Card title={`Contratos (${cliente.contratosIds.length})`} subtitle="">
            {cliente.contratosIds.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Nenhum contrato vinculado.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {cliente.contratosIds.map((id) => (
                  <Link key={id} href={`/contratos/${id}`} className="rounded-xl border border-[var(--color-border)] px-3 py-1.5 text-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-surface-alt)]">
                    {id} →
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card title="ID" subtitle="">
            <p className="font-mono text-sm text-[var(--color-muted)]">{cliente.id}</p>
            <p className="mt-2 text-xs text-[var(--color-muted)]">Atualizado: {new Date(cliente.atualizadoEm).toLocaleString("pt-BR")}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
