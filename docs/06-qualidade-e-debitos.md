# Qualidade e Débitos Técnicos

## Objetivo
Registrar o estado atual de qualidade técnica, inconsistências observadas e prioridades de saneamento.

## Checks de qualidade recomendados
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

## Revisão de consistência de nomenclatura

### Padrão adotado
- Negócio e experiência de usuário em português-BR.
- Contratos técnicos e infraestrutura em inglês técnico.
- Mapeamentos explícitos quando houver formatos diferentes entre domínio e rota.

### Inconsistências remanescentes (não bloqueantes)
1. `biblioteca-juridica` (rota/módulo de hub) versus `biblioteca-conhecimento` (pasta de módulo).
2. Presença de nomenclatura legada no container global (`documentosRepository` marcado como depreciado).
3. Mistura de termos “infra”, “infrastructure”, “repository” e “provider” em alguns domínios sem padronização completa.
4. Tipos de payload em alguns casos ainda referenciam implementações mock de infraestrutura em vez de contratos dedicados de domínio/aplicação.

## Débitos técnicos priorizados

### Alta prioridade
1. Remover acoplamento legado entre `application` e tipos exportados de `mock*Repository`.
2. Introduzir testes de integração focados no fluxo crítico de Petições:
   - criação via wizard,
   - sincronização de pipeline,
   - aprovação e snapshots.
3. Padronizar tratamento de erro/telemetria em APIs de Petições e agentes IA.

### Média prioridade
1. Migrar seleção de infraestrutura para providers por módulo (reduzindo dependência de `services/container.ts` global).
2. Padronizar nomenclatura entre `infra`, `provider` e `repository` por convenção única.
3. Eliminar vestígios de iconografia antiga em fontes de dados de navegação.

### Baixa prioridade
1. Revisar normalização textual e internacionalização para evitar termos mistos em labels internas.
2. Consolidar documentação ADR para decisões arquiteturais críticas (mock/real, estratégia de pipeline, trilha de auditoria).

## Próximos passos sugeridos
1. Criar contratos de input/output por caso de uso em `application/contracts`.
2. Cobrir fluxos críticos com suíte mínima de testes de regressão.
3. Executar refino de nomenclatura com lint/custom checks para impedir regressões.
