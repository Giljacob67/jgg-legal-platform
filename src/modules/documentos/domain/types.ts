export type TipoDocumento =
  | "Contrato"
  | "Petição"
  | "Comprovante"
  | "Procuração"
  | "Parecer";

export type StatusDocumento = "pendente de leitura" | "lido" | "extraído";

export interface Documento {
  id: string;
  casoId: string;
  titulo: string;
  tipo: TipoDocumento;
  status: StatusDocumento;
  dataUpload: string;
  tamanhoMb: number;
  resumo: string;
}
