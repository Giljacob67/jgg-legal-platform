# Arquitetura do Sistema

## Visão geral
A plataforma segue arquitetura modular orientada a domínio, com separação explícita de responsabilidades entre:
- composição de interface,
- casos de uso,
- regras de domínio,
- infraestrutura e persistência.

O objetivo é permitir evolução contínua de produto sem concentrar regra jurídica em componentes de UI.

## Estrutura-base
```txt
src/
  app/         # páginas e APIs (borda HTTP)
  modules/     # domain, application, infrastructure, ui por domínio
  components/  # shell e design system compartilhado
  services/    # container e seleção mock/real
  lib/         # auth, IA, validação, utilitários transversais
```

## Fronteiras entre camadas

### UI (`ui`)
- Renderiza estado, coleta interação e aciona casos de uso/rotas.
- Não deve concentrar decisão jurídica crítica nem regras de validação de negócio complexas.
- Exemplo: `src/modules/peticoes/novo-pedido/ui/novo-pedido-wizard.tsx`.

### Application (`application`)
- Orquestra fluxo de negócio, valida progressão de etapas e integra adapters.
- Pode coordenar múltiplos módulos (Petições + Documentos + IA).
- Exemplo: `src/modules/peticoes/application/operacional/sincronizarPipelinePedido.ts`.

### Domain (`domain`)
- Tipos canônicos, regras invariantes e validações de negócio.
- Independente de framework de UI.
- Exemplo: `src/modules/peticoes/domain/types.ts` e `validarNovoPedidoPayload.ts`.

### Repositories/Infrastructure (`infrastructure`)
- Implementação de acesso a dados e serviços externos (mock/real).
- Expostos por contratos estáveis para a camada de aplicação.
- Exemplo: `src/modules/peticoes/infrastructure/operacional/*`, `src/services/container.ts`.

## Fluxo operacional de Petições

### 1) Intake
- Entrada pelo wizard em `/peticoes/novo`.
- Coleta de caso e contexto, objetivo jurídico, estratégia inicial e documentos.
- O sistema explicita itens inferidos, confirmados e pendentes antes de criar o pedido.
- Rotas principais: `src/app/(hub)/peticoes/novo/page.tsx`, `src/app/api/peticoes/route.ts`, `src/app/api/agents/triagem/route.ts`.

### 2) Estratégia
- Triagem assistida (IA/mock) sugere tipo de peça, prioridade, responsável e alertas.
- Usuário confirma explicitamente antes da abertura final.
- Regras de consolidação ficam em `src/modules/peticoes/novo-pedido/application/wizard.ts`.

### 3) Produção
- Pipeline por estágio com execução técnica e snapshots versionados.
- Execução via API: `src/app/api/peticoes/pipeline/[pedidoId]/executar/[estagio]/route.ts`.
- Consolidação de contexto jurídico e sincronização por `sincronizarPipelinePedido`.

### 4) Revisão
- Editor de minuta mostra contexto jurídico, versões e painel de inteligência.
- Handoff de revisão conecta pedido, contexto e rastro de geração.
- Entrada: `src/app/(hub)/peticoes/minutas/[minutaId]/editor/page.tsx`.

### 5) Auditoria
- Cada etapa relevante gera snapshot com versão, status e metadados.
- Aprovação humana registra resultado e observações.
- Rastro persistido em repositories operacionais (`pipelineSnapshotRepository`, `contextoJuridicoPedidoRepository`, `minutaRastroContextoRepository`).

## Padrão de dados: mock vs real
- `DATA_MODE=mock`: acelera desenvolvimento e demonstração.
- `DATA_MODE=real`: ativa persistência e integrações reais para produção.
- Seleção central feita em `src/services/container.ts` e providers específicos de infraestrutura.

## Convenções de nomenclatura
- **Domínio de negócio**: português e termos jurídicos canônicos (`pedido`, `minuta`, `etapa`, `prazo`).
- **Termos técnicos**: inglês quando alinhado ao ecossistema (`repository`, `provider`, `route`, `pipeline`).
- **IDs de etapa**: `snake_case` no domínio (`analise_adversa`) e `kebab-case` na URL (`analise-adversa`) com mapeamento explícito.
- **Rotas de produto**: sempre em português para experiência do usuário (`/peticoes`, `/clientes`, `/biblioteca-juridica`).
- **Namespace canônico de módulo**: usar `@/modules/biblioteca-juridica/*` em imports de produto, mantendo compatibilidade interna com a estrutura física legada.

## Diretrizes de evolução
- Manter regra jurídica em `domain`/`application`, não em componentes UI.
- Garantir que novas features de Petições integrem snapshots e histórico.
- Evitar duplicação de contratos entre mock e real; priorizar interfaces únicas.
- Expandir testes nos casos de uso críticos antes de introduzir nova automação.
