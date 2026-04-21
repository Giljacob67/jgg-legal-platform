# Plano de Estruturação Profissional

## Objetivo
Consolidar o JGG Legal Platform como produto jurídico enterprise, com foco em confiabilidade operacional, governança técnica e evolução modular previsível.

## Diagnóstico de fechamento (abril/2026)
- O núcleo de Petições já tem fluxo integrado de intake, produção, revisão e auditoria.
- O design system e shell visual foram padronizados para reduzir aparência de protótipo.
- Persistem lacunas de robustez em APIs legadas e nomenclatura entre domínios.
- A cobertura de testes melhorou no domínio e no wizard, mas ainda falta integração ponta a ponta.

## Estrutura-alvo

### Camadas obrigatórias por módulo
- `ui`: composição de telas e interação.
- `application`: orquestração de casos de uso e regras de fluxo.
- `domain`: invariantes, tipos canônicos e validação jurídica.
- `infrastructure`: repositories, providers externos e persistência.

### Padrões transversais
- Resposta de API com `requestId` rastreável.
- Erro padronizado por domínio (`error`, `details`, `requestId`).
- Logs estruturados por rota crítica.
- Contratos dedicados para evitar acoplamento entre aplicação e mocks.

## Plano de execução priorizado

### Fase 1 — Confiabilidade (imediata)
1. Padronizar APIs críticas com request id, telemetria e erros consistentes.
2. Garantir lock/versionamento nas operações de escrita concorrente.
3. Cobrir fluxos críticos com testes unitários de regressão no wizard.
4. Exigir `lint`, `typecheck`, `test` e `build` na CI.

### Fase 2 — Governança operacional (curto prazo)
1. Formalizar SLA por etapa no pipeline de Petições.
2. Tornar aprovação/rejeição sempre justificável e auditável.
3. Consolidar trilha de responsabilidade (`responsável`, `prazo`, `próximo passo`) em todas as telas operacionais.

### Fase 3 — Arquitetura e nomenclatura (curto/médio prazo)
1. Reduzir dependência do `services/container.ts` global com providers por módulo.
2. Unificar convenções (`infra`, `repository`, `provider`) com regra única.
3. Alinhar nomenclatura de módulos de conhecimento (`biblioteca-juridica` vs `biblioteca-conhecimento`).

### Fase 4 — Escala de produto (médio prazo)
1. Replicar maturidade operacional de Petições em Contratos, Jurisprudência e Gestão.
2. Consolidar métricas jurídicas em BI (tempo de ciclo, retrabalho, taxa de aprovação).
3. Fortalecer score de qualidade jurídica com explicabilidade e fallback de IA.

## Critérios de prontidão
- Nenhuma regra jurídica crítica concentrada em componente de UI.
- Rotas críticas com logs estruturados e erro padronizado.
- Check de qualidade completo bloqueando merge.
- Documentação atualizada com fronteiras técnicas e fluxo operacional.
