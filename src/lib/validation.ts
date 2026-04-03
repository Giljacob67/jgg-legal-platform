import { z } from "zod";

// ─── Petições ───────────────────────────────────────────────

export const NovoPedidoPayloadSchema = z.object({
  casoId: z
    .string()
    .trim()
    .min(1, "Informe um caso válido para criar o pedido."),
  titulo: z
    .string()
    .trim()
    .min(1, "Informe um título para o pedido."),
  tipoPeca: z.enum([
    "Petição inicial",
    "Contestação",
    "Réplica",
    "Embargos à execução",
    "Impugnação",
    "Recurso",
    "Manifestação",
    "Apelação cível",
    "Recurso especial cível",
    "Agravo de instrumento",
    "Agravo interno",
    "Embargos de declaração",
    "Mandado de segurança",
    "Habeas corpus",
    "Reconvenção",
    "Exceção de pré-executividade",
    "Pedido de tutela de urgência",
    "Contrarrazões",
  ], { message: "Selecione um tipo de peça válido." }),
  prioridade: z.enum(["baixa", "média", "alta"], {
    message: "Selecione uma prioridade válida.",
  }),
  prazoFinal: z
    .string()
    .trim()
    .min(1, "Informe um prazo final.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "O prazo deve estar no formato AAAA-MM-DD."),
});

export type NovoPedidoPayloadInput = z.infer<typeof NovoPedidoPayloadSchema>;

// ─── Documentos ─────────────────────────────────────────────

export const UploadDocumentoPayloadSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(1, "Informe um título para o documento."),
  tipoDocumento: z.enum(["Contrato", "Petição", "Comprovante", "Procuração", "Parecer"], {
    message: "Selecione um tipo de documento válido.",
  }),
  vinculos: z
    .array(
      z.object({
        tipoEntidade: z.enum(["caso", "pedido_peca"]),
        entidadeId: z.string().min(1),
        papel: z.enum(["principal", "apoio"]).optional(),
      }),
    )
    .optional()
    .default([]),
});

export type UploadDocumentoPayloadInput = z.infer<typeof UploadDocumentoPayloadSchema>;

// ─── Autenticação ───────────────────────────────────────────

export const LoginPayloadSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Informe seu email.")
    .email("Email inválido."),
  password: z
    .string()
    .min(1, "Informe sua senha."),
});

export type LoginPayloadInput = z.infer<typeof LoginPayloadSchema>;

// ─── AI Generation ──────────────────────────────────────────

export const GerarMinutaAIPayloadSchema = z.object({
  pedidoId: z.string().min(1, "Informe o ID do pedido."),
  templateId: z.string().optional(),
  tipoPecaCanonica: z.string().optional(),
  materiaCanonica: z.string().optional(),
});

export type GerarMinutaAIPayloadInput = z.infer<typeof GerarMinutaAIPayloadSchema>;

// ─── Utilitário ─────────────────────────────────────────────

/**
 * Parse a payload with a Zod schema and return either the parsed data or
 * a list of formatted error messages.
 */
export function parseOrError<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map((issue) => issue.message);
  return { success: false, errors };
}
