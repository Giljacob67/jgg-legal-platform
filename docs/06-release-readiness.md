# Release Readiness (Core v1)

## Escopo
- Inclui apenas módulos core: `peticoes`, `documentos`, `casos`.
- Módulos placeholder (`bi`, `gestao`, `hub` etc.) não bloqueiam go-live funcional do core.

## Gate final (obrigatório)
1. Segurança
- `AUTH_SECRET` definido no ambiente.
- `DATA_MODE=real` em produção.
- Upload validando tamanho e MIME real.
- RBAC ativo em rotas API e escopo de recurso sensível.

2. Confiabilidade de pipeline
- Saída dos estágios executáveis com validação estruturada.
- Controle de execução ativo (`rate-limit`, lock e idempotência).
- Revisão humana explícita obrigatória via `POST /api/peticoes/pipeline/[pedidoId]/revisar`.
- Aprovação final obrigatória via `POST /api/peticoes/pipeline/[pedidoId]/aprovar` (bloqueada sem revisão concluída).

3. Observabilidade
- Sentry com contexto de execução (`pedidoId`, `casoId`, `estagio`, `executionMode`).
- Painel `/bi` exibindo erro e latência por estágio.
- Trilha de auditoria disponível em `/api/administracao/auditoria`.

4. Qualidade
- `npm run release:check` concluído com sucesso.
- CI verde no PR.

## Comandos de validação
```bash
# Check completo local (integração opcional)
npm run release:check

# Verificar se todas as migrations do repositório já foram aplicadas no banco alvo
MIGRATION_CHECK_DATABASE_URL=postgres://... npm run check:migrations-applied

# Exigir integração com DB real no ambiente local
TEST_DATABASE_URL=postgres://... REQUIRE_INTEGRATION_TESTS=true npm run release:check
```

## Smoke pós-deploy automatizado
```bash
# Uso básico no preview/produção
BASE_URL=https://seu-deploy.vercel.app \
SMOKE_EMAIL=smoke.bot@jgg.adv.br \
SMOKE_PASSWORD=senha-segura \
npm run smoke:deploy

# Preview protegido por Vercel Authentication (Automation Bypass)
BASE_URL=https://seu-deploy.vercel.app \
SMOKE_EMAIL=smoke.bot@jgg.adv.br \
SMOKE_PASSWORD=senha-segura \
VERCEL_AUTOMATION_BYPASS_SECRET=seu_token \
npm run smoke:deploy

# Permite continuar quando o perfil não for admin para auditoria
BASE_URL=https://seu-deploy.vercel.app \
SMOKE_EMAIL=smoke.bot@jgg.adv.br \
SMOKE_PASSWORD=senha-segura \
npm run smoke:deploy -- --allow-non-admin-audit
```

O script `scripts/post-deploy-smoke.mjs` valida, em sequência:
1. disponibilidade da home;
2. login via NextAuth credentials;
3. criação de pedido (triagem);
4. upload de documento com vínculo;
5. execução de estágio (`triagem`) com aceitação de `200` ou `409` (lock/idempotência);
6. trilha de auditoria para execução de estágio (ou `403` opcional com `--allow-non-admin-audit`).

Recomendação operacional:
- usar conta técnica dedicada (`smoke.bot@jgg.adv.br`) com perfil `socio_direcao` (ou outro perfil com `peticoes: total` e leitura de auditoria);
- não usar credenciais pessoais para smoke de release.

Parâmetros adicionais:
- `--base-url` (ou `BASE_URL`);
- `--email` / `--password` (ou `SMOKE_EMAIL` / `SMOKE_PASSWORD`);
- `--case-id` (default `CAS-2026-001`);
- `--timeout-ms` (default `30000`);
- `--vercel-bypass-token` (ou `VERCEL_AUTOMATION_BYPASS_SECRET`);
- `--allow-non-admin-audit`.

## Checklist de deploy
1. Confirmar branch/PR aprovada com CI verde.
2. Confirmar variáveis críticas no ambiente Vercel:
- `DATA_MODE=real`
- `DATABASE_URL`
- `AUTH_SECRET`
- `OPENROUTER_API_KEY` (ou provedor IA equivalente)
- `BLOB_READ_WRITE_TOKEN`
   Observação: com `DATA_MODE=real` em runtime de produção, a aplicação falha na inicialização sem `AUTH_SECRET`.
3. Rodar migrações no banco alvo.
4. Publicar deploy preview e validar smoke:
   - `npm run smoke:deploy`
   - para usuários sem perfil admin na auditoria: `npm run smoke:deploy -- --allow-non-admin-audit`
   - validar adicionalmente na UI: revisão humana e aprovação final do pipeline
5. Promover para produção.

## Rollback
1. Reverter para deploy anterior estável no Vercel.
2. Se necessário, desabilitar rotas de execução de estágio via configuração de runtime.
3. Registrar incidente com timestamp, impacto e causa raiz.
