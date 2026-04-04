# Skill: Nova Tese Jurídica

Adiciona uma nova tese ao catálogo em `defaultCatalog.ts` via a função `criarTesesJuridicasPadrao()`.

## Schema obrigatório (TeseJuridicaAtivaVersionada)

```typescript
{
  id: string,                        // "tese_<materia>_<numero>" — deve ser único
  codigo: string,                    // mesmo valor que id
  tipo: "tese",
  versao: 1,
  status: "ativo",
  titulo: string,
  fundamentoSintetico: string,       // fundamento legal em 1-2 frases
  palavrasChave: string[],
  gatilhos: GatilhoTese[],           // pode ser []
  tiposPecaCanonica: TipoPecaCanonica[],
  materias: MateriaCanonica[],
  criadoEm: string,                  // ISO 8601
  atualizadoEm: string,              // ISO 8601
}
```

## Matérias canônicas válidas
`civel | trabalhista | tributario | criminal | consumidor | empresarial | familia | ambiental | agrario_agronegocio | bancario`

## Tipos de peça válidos
`peticao_inicial | contestacao | replica | embargos_execucao | impugnacao | manifestacao | apelacao_civel | recurso_especial_civel | agravo_instrumento | agravo_interno | embargos_declaracao | mandado_seguranca | habeas_corpus | reconvencao | excecao_pre_executividade | tutela_urgencia | contrarrazoes`

## Após adicionar
Rodar `npm test` — o teste `defaultCatalog.test.ts` valida o schema de todas as teses automaticamente.
