# Skill: Novo Módulo

Cria o scaffold completo de um novo módulo seguindo o padrão DDD do projeto.

## Passos

1. Criar pasta `src/modules/<nome>/domain/types.ts` com os tipos TypeScript do domínio
2. Criar `src/modules/<nome>/application/index.ts` com os use cases principais
3. Criar `src/modules/<nome>/infrastructure/mock<Nome>Repository.ts` com dados mock
4. Criar `src/modules/<nome>/ui/` com componentes básicos (lista, form)
5. Adicionar rota em `src/app/(hub)/<nome>/page.tsx`
6. Adicionar API routes em `src/app/api/<nome>/route.ts`
7. Registrar módulo no nav em `src/modules/hub/`

## Padrão de tipos do domínio

```typescript
// domain/types.ts
export interface <Nome> {
  id: string;
  // campos do domínio...
  criadoEm: Date;
}
```

## Padrão de repositório mock

```typescript
// infrastructure/mock<Nome>Repository.ts
const DADOS_MOCK: <Nome>[] = [...];

export function listar(): Promise<<Nome>[]> {
  return Promise.resolve(DADOS_MOCK);
}
```

## Após criar
Rodar `npm test` para garantir que nenhum teste existente foi quebrado.
