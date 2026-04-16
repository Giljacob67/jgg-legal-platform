# Skill: Análise de Operação Mata-Mata

## Quando usar
Invocar quando um caso envolver execução bancária contra produtor rural com CCB ou CCR, suspeita de rolagem de crédito, ou menção a "renegociação", "novo crédito", "liquidação de dívida anterior".

## Checklist de Análise (executar em sequência)

### Seção 1 — Mapeamento da Cadeia de Crédito
- [ ] Listar todos os contratos bancários com o mesmo credor (tipo, data, valor, finalidade declarada)
- [ ] Verificar se cada novo contrato liquidou o contrato anterior
- [ ] Identificar se houve disponibilidade real dos recursos entre cada renegociação
- [ ] Calcular o saldo original (primeiro contrato) vs. saldo atual executado — crescimento anormal indica acúmulo ilegal de encargos

### Seção 2 — Prova de Simulação
- [ ] Obter extrato bancário do dia da contratação do novo crédito
- [ ] Verificar se houve crédito na conta do produtor seguido de débito imediato para quitar o contrato anterior (mesmo dia ou até 48h)
- [ ] Identificar nota de liquidação do contrato anterior no mesmo instrumento ou no mesmo dia
- [ ] Verificar se há DOC comprovando destinação produtiva dos recursos (NF de insumos, laudo técnico, CONAB, etc.)
- [ ] Se não houver prova de destinação produtiva → configurada a simulação (art. 167, CC + art. 49, DL 167/67)

### Seção 3 — Desvio de Finalidade do Crédito Rural
- [ ] Identificar a finalidade declarada no contrato (custeio / investimento / comercialização)
- [ ] Verificar se o banco é habilitado a operar com recursos controlados do MCR (BNDES, BB, BNB)
- [ ] Crédito de custeio: exige comprovante de plantio ou aquisição de insumos
- [ ] Crédito de investimento: exige aquisição de equipamentos, benfeitorias ou sementes para ciclos futuros
- [ ] Crédito de comercialização: exige comprovante de venda da produção
- [ ] Se nenhuma dessas provas existir → desvio de finalidade confirmado → nulidade absoluta (art. 49, DL 167/67)

### Seção 4 — Agravamento Ilegal de Encargos na Cadeia
Para cada contrato da cadeia, verificar:
- [ ] **CDI como indexador?** → Nulo — Súmula 176/STJ. Substituir por IPCA ou TR conforme o período.
- [ ] **Mora acima de 1% a.a.?** → Nulo — art. 5º, DL 167/67. Reduzir ao teto legal.
- [ ] **Capitalização de juros não expressamente pactuada?** → Nulo — verificar cláusula expressa (MP 1.963-17/00 não se aplica a crédito rural controlado).
- [ ] **Comissão de permanência + multa + juros?** → Nulo — Súmulas 294 e 296/STJ.
- [ ] **Juros acima do limite CMN para crédito rural?** → Nulo — confrontar com Resolução CMN vigente à época do contrato.
- [ ] Preparar planilha de recálculo com expurgo de cada encargo ilegal (valor exigível correto).

### Seção 5 — Alongamento Negado (Mandado de Segurança)
- [ ] O banco opera com recursos controlados do MCR? (verificar cláusula de fonte de recursos no contrato)
- [ ] O produtor solicitou formalmente o alongamento/securitização? (Lei 9.138/95)
- [ ] O banco respondeu por escrito negando? (ato coator)
- [ ] Prazo decadencial: **120 dias** do ato coator para impetrar MS (Lei 12.016/09, art. 23)
- [ ] Se prazo ainda não expirou → preparar Mandado de Segurança invocando Súmula 298/STJ
- [ ] Se prazo expirou → incluir como argumento subsidiário nos Embargos à Execução (inexigibilidade da dívida por direito ao alongamento negado)

## Peças Recomendadas por Situação

| Situação | Peça Principal | Template |
|---|---|---|
| Execução em andamento, dentro do prazo | Embargos à Execução | `tpl-embargos-execucao-credito-rural-v1` |
| Execução em andamento, matéria de ordem pública | Exceção de Pré-Executividade | `tpl-excecao-pre-executividade-v1` |
| Alongamento negado, dentro de 120 dias | Mandado de Segurança | `tpl-mandado-seguranca-v1` |
| Tutela urgente para sustar penhora | Tutela de Urgência | `tpl-tutela-urgencia-v1` |
| Penhora de bem impenhorável decretada | Agravo de Instrumento | `tpl-agravo-instrumento-v1` |

## Teses a Invocar (por padrão, para toda Operação Mata-Mata)
- `TES-MM-001` — Nulidade por simulação (sempre incluir como pedido principal)
- `TES-MM-002` — Revisão da cadeia (Súmula 286/STJ)
- `TES-MM-004` — Limitação de juros pelo DL 167/67
- `TES-MM-005` — Nulidade do CDI (Súmula 176/STJ) — se houver CDI na cadeia
- `TES-MM-006` — Mora limitada a 1% a.a. (art. 5º DL 167/67)
- `TES-MM-003` — Alongamento (Súmula 298/STJ) — se banco opera com MCR e houve negativa
- `TES-MM-007` — Impenhorabilidade — se há CPR/CCR anterior ou pequena propriedade familiar

## Documentos Críticos a Solicitar ao Cliente
1. Todos os contratos de crédito rural com o banco (desde o primeiro)
2. Extratos bancários dos dias de contratação de cada crédito novo
3. Notas de liquidação dos contratos anteriores
4. Comprovantes de destinação produtiva dos recursos (NF insumos, notas de venda, etc.)
5. DAP (Declaração de Aptidão ao Pronaf) ou prontuário ATER para comprovar atividade rural
6. CCIR e matrícula do imóvel (para impenhorabilidade)
7. Protocolo de pedido de alongamento e eventual resposta do banco
