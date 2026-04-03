"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import type { NovoCLientePayload, StatusCliente, TipoCliente } from "@/modules/clientes/domain/types";
import { LABEL_STATUS_CLIENTE } from "@/modules/clientes/domain/types";

const TIPOS_CLIENTE: Array<{ value: TipoCliente; label: string }> = [
  { value: "pessoa_juridica", label: "Pessoa Jurídica" },
  { value: "pessoa_fisica", label: "Pessoa Física" },
];

const STATUS_CLIENTE: StatusCliente[] = ["ativo", "prospecto", "inativo", "encerrado"];

export function FormNovoCliente() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoCliente>("pessoa_juridica");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [status, setStatus] = useState<StatusCliente>("prospecto");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [anotacoes, setAnotacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setLoading(true);

    const payload: NovoCLientePayload = {
      nome,
      tipo,
      status,
      cpfCnpj: cpfCnpj || undefined,
      email: email || undefined,
      telefone: telefone || undefined,
      anotacoes: anotacoes || undefined,
      endereco: cidade || estado ? { cidade: cidade || undefined, estado: estado || undefined } : undefined,
    };

    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Erro ao criar cliente.");
      }

      const data = (await response.json()) as { cliente: { id: string } };
      router.push(`/clientes/${data.cliente.id}`);
    } catch (submitError) {
      setErro(submitError instanceof Error ? submitError.message : "Erro inesperado ao criar cliente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Informações principais" subtitle="Cadastre os dados básicos do cliente.">
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
              Nome ou razão social <span className="text-rose-600">*</span>
            </label>
            <input
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              required
              placeholder="Ex: Fazenda São Lucas Agropecuária Ltda."
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">
                Tipo de cliente <span className="text-rose-600">*</span>
              </label>
              <select
                value={tipo}
                onChange={(event) => setTipo(event.target.value as TipoCliente)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              >
                {TIPOS_CLIENTE.map((tipoCliente) => (
                  <option key={tipoCliente.value} value={tipoCliente.value}>
                    {tipoCliente.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">CPF/CNPJ</label>
              <input
                value={cpfCnpj}
                onChange={(event) => setCpfCnpj(event.target.value)}
                placeholder="00.000.000/0000-00"
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Status inicial</label>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusCliente)}
                className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
              >
                {STATUS_CLIENTE.map((itemStatus) => (
                  <option key={itemStatus} value={itemStatus}>
                    {LABEL_STATUS_CLIENTE[itemStatus]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Contato e localização" subtitle="Campos opcionais para facilitar relacionamento e segmentação.">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="juridico@empresa.com.br"
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Telefone</label>
            <input
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
              placeholder="(65) 99999-9999"
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">Cidade</label>
            <input
              value={cidade}
              onChange={(event) => setCidade(event.target.value)}
              placeholder="Cuiabá"
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-[var(--color-ink)]">UF</label>
            <input
              value={estado}
              onChange={(event) => setEstado(event.target.value.toUpperCase())}
              placeholder="MT"
              maxLength={2}
              className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm uppercase"
            />
          </div>
        </div>
      </Card>

      <Card title="Observações" subtitle="Informações estratégicas para atendimento jurídico.">
        <textarea
          value={anotacoes}
          onChange={(event) => setAnotacoes(event.target.value)}
          rows={4}
          placeholder="Ex: Cliente com foco em contratos de parceria agrícola e operações de crédito rural."
          className="w-full rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-sm"
        />
      </Card>

      {erro ? <p className="text-sm text-rose-700">⚠️ {erro}</p> : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-[var(--color-accent)] px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 hover:bg-[var(--color-accent-strong)]"
        >
          {loading ? "Salvando..." : "Salvar cliente"}
        </button>
      </div>
    </form>
  );
}
