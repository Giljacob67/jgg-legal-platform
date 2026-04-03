# Skill: Testar Pipeline

Executa um teste end-to-end do pipeline de IA.

## Pré-requisitos
- `OPENROUTER_API_KEY` configurada em `.env.local`
- Banco de dados acessível (ou `DATA_MODE=mock`)

## Passos

1. Iniciar dev server: `npm run dev`
2. Abrir http://localhost:3000/peticoes
3. Criar novo pedido de peça ou usar pedido existente
4. Acessar `/peticoes/pipeline/[pedidoId]`
5. Executar cada estágio em ordem clicando "Executar com IA":
   - triagem → extracao-fatos → analise-adversa → estrategia → minuta
6. Verificar que o texto chega em streaming na UI
7. Verificar que o snapshot do estágio é salvo antes de avançar ao próximo

## Verificação do prompt enviado ao modelo
Para inspecionar o prompt enviado, adicionar temporariamente ao início de `executarEstagioComIA.ts`:

```typescript
console.log("PROMPT:", JSON.stringify({ system, prompt }, null, 2));
```

O output aparece no terminal do servidor Next.js.

## Verificação de erros
- `503`: `OPENROUTER_API_KEY` não configurada ou inválida
- `401`: sessão expirada — fazer login novamente
- `400`: estágio inválido — verificar URL e `ESTAGIOS_VALIDOS` no route handler
- `500`: erro interno — verificar logs do servidor para stack trace

## Testes automatizados
```bash
npm test  # roda os 47 testes unitários (Vitest)
```
