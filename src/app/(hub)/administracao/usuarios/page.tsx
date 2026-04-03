import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { ListaUsuarios } from "@/modules/administracao/ui/lista-usuarios";
import { FormConvidarUsuario } from "@/modules/administracao/ui/form-convidar-usuario";
import { listarUsuarios } from "@/modules/administracao/application";

export default async function UsuariosPage() {
  const usuarios = await listarUsuarios();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description={`${usuarios.length} usuários cadastrados · ${usuarios.filter((u) => u.ativo).length} ativos`}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        <Card title="Equipe" subtitle="Gerencie perfis e status de acesso de cada membro.">
          <ListaUsuarios usuariosIniciais={usuarios} />
        </Card>

        <Card title="Convidar usuário" subtitle="Envie um acesso para um novo membro da equipe.">
          <FormConvidarUsuario />
        </Card>
      </div>
    </div>
  );
}
