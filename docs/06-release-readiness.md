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

# Exigir integração com DB real no ambiente local
TEST_DATABASE_URL=postgres://... REQUIRE_INTEGRATION_TESTS=true npm run release:check
```

## Checklist de deploy
1. Confirmar branch/PR aprovada com CI verde.
2. Confirmar variáveis críticas no ambiente Vercel:
- `DATA_MODE=real`
- `DATABASE_URL`
- `AUTH_SECRET`
- `OPENROUTER_API_KEY` (ou provedor IA equivalente)
- `BLOB_READ_WRITE_TOKEN`
3. Rodar migrações no banco alvo.
4. Publicar deploy preview e validar smoke:
- login
- criação de pedido
- upload de documento
- execução de estágio
- aprovação humana
- visualização de auditoria
5. Promover para produção.

## Rollback
1. Reverter para deploy anterior estável no Vercel.
2. Se necessário, desabilitar rotas de execução de estágio via configuração de runtime.
3. Registrar incidente com timestamp, impacto e causa raiz.
