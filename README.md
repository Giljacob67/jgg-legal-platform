# HUB JGG Group

Plataforma jurídica modular em Next.js com foco inicial no módulo de **Petições** e base preparada para expansão dos demais módulos do HUB.

## Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- ESLint

## Estrutura principal
```txt
src/
  app/                # rotas e layouts
  components/         # design system e layout reutilizável
  modules/            # organização por domínio (domain/application/infrastructure/ui)
  services/           # container de dependências mockadas
  lib/                # utilitários compartilhados
docs/                 # documentação de produto e arquitetura
```

## Como rodar
```bash
npm install
npm run dev
```

## Modo de dados (`DATA_MODE`)
- `mock` (padrão): usa dados em memória para desenvolvimento rápido.
- `real`: habilita upload real em Blob + persistência em Postgres.

## Qualidade obrigatória
```bash
npm run lint
npm run typecheck
npm run build
```

## Testes
```bash
# Unitários (Vitest)
npm run test

# E2E (Playwright)
npm run test:e2e

# Integração com banco real (core: casos, petições, documentos)
TEST_DATABASE_URL=postgres://... npm run test:integration
```

## Migrations SQL
```bash
npm run db:migrate
```
As migrations ficam em `db/migrations` e são aplicadas em ordem.

## Variáveis de ambiente
Use o arquivo `.env.example` como referência e crie um `.env.local` quando necessário.
- `DATA_MODE=mock|real`
- `DATABASE_URL` para Postgres
- `TEST_DATABASE_URL` para a suíte de integração (deve apontar para base dedicada de testes)
- `BLOB_READ_WRITE_TOKEN` para upload via Vercel Blob
- `AUTH_SECRET` obrigatório para autenticação segura
- `MOCK_USERS_JSON` e `MOCK_DEFAULT_PASSWORD` para credenciais de demonstração em `DATA_MODE=mock`

## Deploy na Vercel
1. Conecte o repositório ao projeto na Vercel.
2. Defina o comando de build padrão: `npm run build`.
3. Defina o diretório raiz como a raiz do repositório.
4. Configure variáveis de ambiente conforme `.env.example`.

## CI no GitHub
Workflow em `.github/workflows/ci.yml` executa:
- lint
- typecheck
- build
- integração com Postgres real (pgvector) via `npm run test:integration`
