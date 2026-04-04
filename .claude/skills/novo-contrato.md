# Skill: Novo Tipo de Contrato

Adiciona um novo tipo ao objeto `CLAUSULAS_PADRAO` em `src/modules/contratos/infrastructure/templatesClasuulas.ts`.

## Schema de cláusula

```typescript
{
  numero: number,
  titulo: string,
  classificacao: "essencial" | "negociavel",
  conteudo: string  // usar [PLACEHOLDER] para campos variáveis
}
```

## Tipos canônicos existentes
`prestacao_servicos | arrendamento_rural | parceria_agricola | honorarios_advocaticios | compra_venda | locacao | confissao_divida | comodato | cessao_direitos | nda_confidencialidade | society_constituicao | outro`

## Passos
1. Verificar o arquivo `templatesClasuulas.ts` para entender a estrutura existente
2. Adicionar o novo tipo como chave do objeto `CLAUSULAS_PADRAO`
3. Definir ao menos 3 cláusulas: 1 essencial (identificação das partes) + cláusulas específicas
4. Usar `[PLACEHOLDER_NOME]`, `[PLACEHOLDER_DATA]`, etc. para campos variáveis
5. Rodar `npm test` para garantir que nenhum teste foi quebrado
