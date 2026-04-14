import { PageHeader } from "@/components/ui/page-header";
import { BibliotecaConhecimento } from "@/modules/biblioteca-conhecimento/ui/biblioteca-conhecimento";
import { getBibliotecaRepository } from "@/modules/biblioteca-conhecimento/infrastructure/provider.server";
import { isDriveConfigurado } from "@/modules/biblioteca-conhecimento/infrastructure/driveClient.server";

export default async function BibliotecaJuridicaPage() {
  const repo = getBibliotecaRepository();
  const [documentos, stats] = await Promise.all([repo.listar(), repo.contar()]);

  const driveConfigurado = isDriveConfigurado();
  const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Biblioteca de Conhecimento"
        description="Base vetorial do escritório — petições aprovadas, contratos, teses e jurisprudência indexados para uso nos agentes de IA."
      />
      <BibliotecaConhecimento
        documentosIniciais={documentos}
        statsIniciais={stats}
        driveConfigurado={driveConfigurado}
        driveFolderId={driveFolderId}
        ultimaSync={null}
      />
    </div>
  );
}
