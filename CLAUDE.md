# CLAUDE.md — JGG Legal Platform

## Visão Geral
Plataforma jurídica modular para o escritório JGG Group. Stack: Next.js 16, TypeScript, Tailwind v4, Drizzle ORM + PostgreSQL (Neon), OpenRouter (IA), Vercel Blob.

## Arquitetura (DDD por módulo)
Cada módulo em `src/modules/<nome>/` segue:
```
domain/        — tipos TypeScript e regras de negócio
application/   — use cases (funções puras, sem framework)
infrastructure/— repositórios, clientes externos, providers
ui/            — componentes React do módulo
__tests__/     — testes unitários Vitest
```

## Modos de Dados
- `DATA_MODE=mock` (padrão): dados em memória, sem banco
- `DATA_MODE=real`: banco Postgres real + Vercel Blob

Alternar via `.env.local`:
```
DATA_MODE=real
DATABASE_URL=postgres://...
BLOB_READ_WRITE_TOKEN=...
OPENROUTER_API_KEY=sk-or-...
```

## Comandos
```bash
npm run dev          # Dev server (localhost:3000)
npm run build        # Build de produção
npm test             # Vitest (unitários)
npm run migrate      # Rodar migrations SQL (alias: npm run db:migrate)
npm run seed         # Popular banco com dados de teste (alias: npm run db:seed)
npm run db:setup     # migrate + seed em sequência (inicialização completa)
npx tsc --noEmit     # Verificar tipos
```

## Nomenclatura
- **Domínio jurídico**: português (ex: `pedido`, `minuta`, `etapa`)
- **Infraestrutura**: inglês (ex: `repository`, `gateway`, `provider`)
- **Arquivos de use case**: verbo + substantivo em camelCase (ex: `obterPedidoPorId.ts`)

## Prompts de IA
Ficam em `src/lib/ai/prompts/`. Cada arquivo exporta uma função `build<Estagio>Prompt()`.
Para adicionar um prompt: criar `src/lib/ai/prompts/<estagio>.ts` e exportar no `index.ts`.

## Catálogo Jurídico
- Templates de petições: `src/modules/peticoes/base-juridica-viva/infrastructure/defaultCatalog.ts`
- Cláusulas de contratos: `src/modules/contratos/infrastructure/templatesClausulas.ts`
- Todo item novo deve passar nos testes de schema em `__tests__/defaultCatalog.test.ts`

## Provider de IA
Sempre usar o provider server-side via `provider.server.ts` de cada módulo.
Nunca chamar o cliente de IA diretamente em componentes React (client-side).

## Pipeline de Petições
Estágios: classificacao → leitura_documental → extracao_de_fatos → analise_adversa → estrategia_juridica → redacao → revisao → aprovacao

Snapshots persistidos em `SnapshotPipelineEtapa` via `pipelineSnapshotRepository.salvarNovaVersao()`.

**IMPORTANTE:** `sincronizarPipelinePedido` é um orquestrador que reprocessa TODOS os documentos. Para persistir apenas o output de IA de um único estágio, use `pipelineSnapshotRepository.salvarNovaVersao()` diretamente.

## Skills disponíveis
`.claude/skills/` contém skills para tarefas comuns:
- `novo-modulo.md` — scaffold de módulo DDD
- `nova-tese.md` — adicionar tese jurídica ao catálogo
- `novo-template.md` — adicionar template de petição
- `novo-contrato.md` — adicionar tipo de contrato
- `testar-pipeline.md` — teste end-to-end do pipeline
