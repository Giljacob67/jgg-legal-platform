# JGG Legal Platform

Plataforma jurídica modular com foco operacional em **Petições**, cobrindo intake, estratégia, produção, revisão e auditoria do ciclo da peça.

## Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS
- Zod
- Vitest + Playwright

## Estrutura principal
```txt
src/
  app/                # páginas e rotas API (App Router)
  components/         # shell visual e componentes base do design system
  modules/            # módulos por domínio (domain/application/infrastructure/ui)
  services/           # container de dependências e seleção mock/real
  lib/                # utilitários compartilhados (auth, IA, validação, etc.)
docs/                 # visão de produto, módulos, roadmap, arquitetura e qualidade
```

## Fluxo operacional de Petições
1. **Intake**: wizard em `/peticoes/novo` estrutura caso, objetivo, estratégia inicial e documentos.
2. **Estratégia**: triagem assistida e confirmação humana de prioridade/tipo de peça.
3. **Produção**: pipeline por estágios e geração assistida de conteúdo.
4. **Revisão**: checklist operacional e editor de minuta com contexto jurídico.
5. **Auditoria**: snapshots versionados por etapa e histórico de decisões.

## Como rodar localmente
```bash
npm ci
npm run dev
```

## Modos de dados (`DATA_MODE`)
- `mock` (padrão): dados em memória para desenvolvimento rápido.
- `real`: persistência em Postgres + integrações reais de documentos/infra.

## Qualidade
```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## Banco e migrações
```bash
npm run db:migrate
npm run db:seed
```

## Variáveis de ambiente
Use `.env.example` como referência para `.env.local`.
- `DATA_MODE=mock|real`
- `DATABASE_URL`
- `BLOB_READ_WRITE_TOKEN`
- chaves de IA (quando aplicável) para recursos assistidos

## Documentação
- [Visão do Produto](docs/01-product-vision.md)
- [Mapa de Módulos](docs/03-modules-map.md)
- [Roadmap](docs/05-roadmap.md)
- [Arquitetura](docs/arquitetura.md)
- [Qualidade e Débitos Técnicos](docs/06-qualidade-e-debitos.md)

## CI
Workflow em `.github/workflows/ci.yml` executa checks de lint, tipagem e build.
