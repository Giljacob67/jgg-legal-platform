import "server-only";
import type { PerfilUsuario } from "@/modules/administracao/domain/types";
import { LABEL_PERFIL } from "@/modules/administracao/domain/types";

export type ResultadoEnvioEmail = {
  enviado: boolean;
  provider: "resend" | "log";
  mensagem: string;
};

function buildHtmlConvite(nome: string, email: string, perfil: PerfilUsuario, nomeEscritorio: string): string {
  const labelPerfil = LABEL_PERFIL[perfil] ?? perfil;
  const loginUrl = process.env.NEXTAUTH_URL ?? "https://jgg-legal-platform.vercel.app";

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Convite — ${nomeEscritorio}</title>
</head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a3a5c;padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:0.5px;">${nomeEscritorio}</p>
              <p style="margin:8px 0 0;color:#94b8d4;font-size:13px;">Plataforma Jurídica</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 16px;font-size:16px;color:#1a1a2e;font-weight:600;">Olá, ${nome}!</p>
              <p style="margin:0 0 24px;font-size:14px;color:#4a4a68;line-height:1.6;">
                Você foi convidado(a) para acessar a plataforma jurídica do ${nomeEscritorio} com o perfil de
                <strong style="color:#1a3a5c;">${labelPerfil}</strong>.
              </p>
              <p style="margin:0 0 32px;font-size:14px;color:#4a4a68;line-height:1.6;">
                Clique no botão abaixo para fazer seu primeiro acesso. Suas credenciais iniciais serão o e-mail
                <strong>${email}</strong> com a senha temporária enviada pelo administrador.
              </p>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:#1a3a5c;border-radius:12px;padding:14px 32px;text-align:center;">
                    <a href="${loginUrl}/login" style="color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;display:inline-block;">
                      Acessar a plataforma →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Info box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:0.5px;">Seus dados de acesso</p>
                    <p style="margin:0 0 4px;font-size:13px;color:#4a4a68;">📧 E-mail: <strong>${email}</strong></p>
                    <p style="margin:0 0 4px;font-size:13px;color:#4a4a68;">👤 Perfil: <strong>${labelPerfil}</strong></p>
                    <p style="margin:0;font-size:13px;color:#4a4a68;">🔗 URL: <strong>${loginUrl}/login</strong></p>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:12px;color:#9a9ab0;line-height:1.5;">
                Se você não esperava este convite, ignore este e-mail. Em caso de dúvidas, entre em contato com o administrador do sistema.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8f9fa;padding:20px 40px;text-align:center;border-top:1px solid #e8ecf0;">
              <p style="margin:0;font-size:11px;color:#9a9ab0;">${nomeEscritorio} · Plataforma Jurídica Interna</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function enviarEmailConvite(
  nome: string,
  email: string,
  perfil: PerfilUsuario,
): Promise<ResultadoEnvioEmail> {
  const apiKey = process.env.RESEND_API_KEY;
  const nomeEscritorio = process.env.NOME_ESCRITORIO ?? "JGG Legal";
  const remetente = process.env.EMAIL_REMETENTE ?? "noreply@jgg.adv.br";

  if (!apiKey) {
    // Sem RESEND_API_KEY: loga o convite para fins de desenvolvimento/auditoria
    console.info(
      `[email][convite] RESEND_API_KEY não configurado. Convite para ${email} (${LABEL_PERFIL[perfil]}) registrado localmente.`,
    );
    return {
      enviado: false,
      provider: "log",
      mensagem: "E-mail registrado. Configure RESEND_API_KEY para envio real.",
    };
  }

  try {
    const html = buildHtmlConvite(nome, email, perfil, nomeEscritorio);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${nomeEscritorio} <${remetente}>`,
        to: [email],
        subject: `Você foi convidado(a) para ${nomeEscritorio}`,
        html,
      }),
    });

    if (!response.ok) {
      const err = (await response.json()) as { message?: string };
      throw new Error(err.message ?? `Resend retornou ${response.status}`);
    }

    return {
      enviado: true,
      provider: "resend",
      mensagem: `E-mail de convite enviado para ${email}.`,
    };
  } catch (error) {
    const mensagem = error instanceof Error ? error.message : "Falha desconhecida";
    console.error(`[email][convite] Falha ao enviar para ${email}: ${mensagem}`);
    return {
      enviado: false,
      provider: "resend",
      mensagem: `Falha ao enviar e-mail: ${mensagem}`,
    };
  }
}
