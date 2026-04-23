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
