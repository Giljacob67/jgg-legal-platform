# Skill: Novo Template de Petição

Adiciona um novo template ao array retornado por `criarTemplatesJuridicosPadrao()` em `defaultCatalog.ts`.

## Schema obrigatório (TemplateJuridicoAtivoVersionado)

```typescript
{
  id: string,                         // único, ex: "template_contestacao_trabalhista"
  codigo: string,                     // mesmo que id
  tipo: "template",
  versao: 1,
  status: "ativo",
  nome: string,
  tiposPecaCanonica: TipoPecaCanonica[],
  materias: MateriaCanonica[],
  blocos: BlocoTemplateJuridico[],    // usar BLOCOS_PADRAO ou customizar
  clausulasBase: {
    fundamentos: string[],
    pedidos: string[],
  },
  especializacaoPorMateria: Record<MateriaCanonica, EspecializacaoTemplateMateria>,
  criadoEm: string,
  atualizadoEm: string,
}
```

## Blocos padrão disponíveis
`cabecalho | qualificacao_identificacao | sintese_fatica | fundamentos | pedidos | fechamento`

## EspecializacaoTemplateMateria
```typescript
{
  diretrizFundamentos: string,
  diretrizPedidos: string,
  termosPreferenciais: string[],
}
```

## Após adicionar
Rodar `npm test` — `defaultCatalog.test.ts` valida ids únicos e campos obrigatórios.
