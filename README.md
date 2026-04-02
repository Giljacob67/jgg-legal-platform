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

## Qualidade obrigatória
```bash
npm run lint
npm run typecheck
npm run build
```

## Variáveis de ambiente
Use o arquivo `.env.example` como referência e crie um `.env.local` quando necessário.

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
