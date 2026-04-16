import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { FormEditarContrato } from "@/modules/contratos/ui/form-editar-contrato";
import { obterContratoPorId } from "@/modules/contratos/application";
import Link from "next/link";

type Params = { params: Promise<{ contratoId: string }> };

export default async function EditarContratoPage({ params }: Params) {
  const { contratoId } = await params;
  const contrato = await obterContratoPorId(contratoId);
  if (!contrato) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader title={`Editar: ${contrato.titulo}`} description="Altere os campos e clique em Salvar." />
        <Link href={`/contratos/${contrato.id}`} className="text-sm text-[var(--color-muted)] hover:text-[var(--color-accent)]">
          ← Voltar ao contrato
        </Link>
      </div>

      <FormEditarContrato contrato={contrato} />
    </div>
  );
}