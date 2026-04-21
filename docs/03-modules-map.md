# Mapa de Módulos

## Visão geral
Todos os módulos listados no hub estão atualmente configurados como `ativo` na navegação.  
A principal profundidade operacional hoje está em **Petições** e seus módulos satélites.

## Módulos do hub

| Módulo | Rota | Grupo | Status | Foco atual |
|---|---|---|---|---|
| Dashboard | `/dashboard` | Gestão | Ativo | leitura executiva de produção e prazos |
| Petições | `/peticoes` | Produção Jurídica | Ativo | intake, pipeline, editor, auditoria |
| Casos | `/casos` | Produção Jurídica | Ativo | cadastro e contexto processual |
| Documentos | `/documentos` | Produção Jurídica | Ativo | acervo, upload, vínculos e processamento |
| Contratos | `/contratos` | Produção Jurídica | Ativo | gestão contratual e minutas |
| Jurisprudência | `/jurisprudencia` | Inteligência | Ativo | pesquisa e suporte argumentativo |
| Biblioteca Jurídica | `/biblioteca-juridica` | Inteligência | Ativo | base de conhecimento e sync |
| Gestão | `/gestao` | Gestão | Ativo | operação, distribuição e métricas |
| Clientes | `/clientes` | Gestão | Ativo | carteira e relacionamento |
| BI | `/bi` | Gestão | Ativo | indicadores estratégicos |
| Administração | `/administracao` | Administração | Ativo | RBAC, usuários e configuração |

## Profundidade por domínio (camadas)

| Domínio | Domain | Application | Infrastructure | UI |
|---|---:|---:|---:|---:|
| Petições | Alto | Alto | Alto | Alto |
| Documentos | Alto | Alto | Alto | Médio |
| Casos | Médio | Médio | Médio | Médio |
| Clientes | Médio | Médio | Médio | Médio |
| Contratos | Médio | Médio | Médio | Médio |
| Jurisprudência | Médio | Médio | Médio | Médio |
| Administração | Médio | Médio | Médio | Médio |
| Dashboard/BI/Gestão | Médio | Médio | Médio | Médio |

## Submódulos críticos de Petições
- `src/modules/peticoes/novo-pedido`: wizard (UI + application + domain).
- `src/modules/peticoes/application/operacional`: sincronização de pipeline, contexto jurídico e geração operacional.
- `src/modules/peticoes/infrastructure/operacional`: repositories de snapshots/contexto/rastro.
- `src/modules/peticoes/inteligencia-juridica`: avaliação de qualidade e suporte ao editor.
- `src/modules/peticoes/base-juridica-viva`: catálogo de templates, teses e checklists.

## Fronteira de integração
- `src/app/(hub)/*`: composição de páginas e wiring de casos de uso.
- `src/app/api/*`: borda HTTP (auth, RBAC, validação de input, resposta).
- `src/services/container.ts`: seleção mock/real para repositories legados e centrais.
