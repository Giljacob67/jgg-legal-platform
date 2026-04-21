# Roadmap

## Estado atual (abril/2026)

### Concluído recentemente
- Refatoração de **Novo Pedido de Peça** para wizard jurídico com validação progressiva.
- Evolução do **design system e shell visual** do hub.
- Reforço das telas operacionais de **listagem, detalhe, pipeline e editor** em Petições.
- Consolidação de snapshots e contexto jurídico versionado para rastreabilidade.

## Próximas entregas priorizadas

### Fase A — Confiabilidade operacional (curto prazo)
- Padronizar retorno de erros e telemetria nos fluxos críticos de Petições.
- Cobrir wizard, pipeline e aprovação com testes unitários/integrados adicionais.
- Fechar lacunas de nomenclatura e remover pontos de legado explícitos.

### Fase B — Governança e produtividade (curto/médio prazo)
- SLA por etapa com alertas ativos por responsável.
- Melhorar trilha de auditoria para aprovação/rejeição e justificativas obrigatórias.
- Evoluir gestão de pendências e handoff entre triagem, produção e revisão.

### Fase C — Inteligência jurídica aplicada (médio prazo)
- Tornar base jurídica viva mais integrada à geração de minuta.
- Melhorar score de qualidade jurídica e explicabilidade das sugestões.
- Aumentar robustez de fallback de modelos e reprocessamento por estágio.

### Fase D — Expansão modular (médio/longo prazo)
- Elevar maturidade operacional de Contratos, Jurisprudência e Gestão.
- Convergir padrões de UX e arquitetura entre os módulos.
- Consolidar BI jurídico com métricas por ciclo, risco e resultado.

## Critérios de prontidão por fase
- Escopo funcional fechado com comportamento auditável.
- Cobertura mínima de qualidade (lint, typecheck, testes e build).
- Documentação técnica e operacional atualizada.
- Sem débitos críticos bloqueando evolução do próximo ciclo.
