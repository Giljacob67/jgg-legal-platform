export interface DriveExplorerItem {
  id: string;
  nome: string;
  mimeType: string;
  tipo: "pasta" | "arquivo";
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  tamanhoBytes?: number;
  tamanhoLabel?: string;
  modificadoEm?: string;
  importavel?: boolean;
}

export interface DriveExplorerBreadcrumb {
  id: string;
  nome: string;
}

export interface DriveExplorerResultado {
  pastaAtual: DriveExplorerBreadcrumb;
  breadcrumbs: DriveExplorerBreadcrumb[];
  itens: DriveExplorerItem[];
  query: string;
  pastaRaizId?: string;
  pastaRaizConfigurada: boolean;
}

export interface DriveExplorerVinculo {
  id: string;
  driveFileId: string;
  driveFileName: string;
  driveMimeType?: string;
  driveWebViewLink?: string;
  tipoEntidade: "caso" | "pedido" | "cliente";
  entidadeId: string;
  entidadeLabel: string;
  criadoEm: string;
}
