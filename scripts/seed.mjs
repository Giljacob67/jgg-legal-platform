#!/usr/bin/env node
/**
 * JGG Legal Platform — Script de Seed do Banco de Dados
 * 
 * Popula o banco Neon com:
 *   1. Casos jurídicos (do repositório mock)
 *   2. Teses jurídicas do catálogo de inteligência viva
 *   3. Usuário administrador padrão
 * 
 * Uso:
 *   DATABASE_URL="..." node scripts/seed.mjs
 * 
 * @module seed
 */

import postgres from "postgres";
import bcrypt from "bcrypt";

const AGORA = new Date();
const FORMAT_DATE = (d) => d.toISOString().split("T")[0];

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "⛔ DATABASE_URL não definida. Configure a variável de ambiente para rodar o seed.\nExemplo: DATABASE_URL=postgresql://... node scripts/seed.mjs"
    );
  }

  const sql = postgres(databaseUrl, { max: 1, prepare: false });

  console.log("🌱 Iniciando seed da base JGG Legal Platform...\n");

  try {
    // ── 1. USUÁRIOS DO ESCRITÓRIO ────────────────────────────────────
    console.log("👤 Semeando usuários do escritório...");
    const senhaDefault = "jgg@2026!";

    const USUARIOS_SEED = [
      { email: "gilberto@jgg.adv.br",     senha: senhaDefault, name: "Gilberto Jacob",      initials: "GJ", role: "Sócio / Direção",           perfil: "socio_direcao" },
      { email: "admin@jgg.adv.br",         senha: senhaDefault, name: "Administrador",        initials: "AD", role: "Administrador do Sistema",    perfil: "administrador_sistema" },
      { email: "coordenador@jgg.adv.br",   senha: senhaDefault, name: "Carlos Mendes",        initials: "CM", role: "Coordenador Jurídico",        perfil: "coordenador_juridico" },
      { email: "mariana@jgg.adv.br",       senha: senhaDefault, name: "Mariana Couto",        initials: "MC", role: "Advogado",                    perfil: "advogado" },
      { email: "assessor@jgg.adv.br",      senha: senhaDefault, name: "Ana Beatriz Santos",   initials: "AB", role: "Advogado",                    perfil: "advogado" },
      { email: "estagiario@jgg.adv.br",    senha: senhaDefault, name: "Lucas Ferreira",       initials: "LF", role: "Estagiário / Assistente",     perfil: "estagiario_assistente" },
      { email: "operacional@jgg.adv.br",   senha: senhaDefault, name: "Fernanda Oliveira",    initials: "FO", role: "Operacional / Administrativo", perfil: "operacional_admin" },
    ];

    for (const u of USUARIOS_SEED) {
      await sql`
        INSERT INTO users (id, email, password_hash, name, initials, role, perfil, ativo)
        VALUES (
          gen_random_uuid(),
          ${u.email},
          ${await bcrypt.hash(u.senha, 12)},
          ${u.name},
          ${u.initials},
          ${u.role},
          ${u.perfil},
          true
        )
        ON CONFLICT (email) DO UPDATE SET
          perfil = EXCLUDED.perfil,
          role   = EXCLUDED.role,
          ativo  = true
      `;
    }
    console.log(`   ✅ ${USUARIOS_SEED.length} usuários inseridos/atualizados.\n`);

    // ── 2. ATIVAR EXTENSÃO PGVECTOR ──────────────────────────────────
    console.log("🧩 Habilitando extensão pgvector...");
    try {
      await sql`CREATE EXTENSION IF NOT EXISTS vector`;
      console.log("   ✅ pgvector habilitado.\n");
    } catch (e) {
      console.log("   ⚠️  pgvector já ativo ou sem permissão — continuando.\n");
    }

    // ── 3. CASOS JURÍDICOS ───────────────────────────────────────────
    console.log("⚖️  Semeando casos jurídicos...");
    const CASOS = [
      {
        id: "CAS-2026-001",
        titulo: "Ação de Rescisão Contratual com Pedido Liminar",
        cliente: "Atlas Engenharia S.A.",
        materia: "Cível Empresarial",
        tribunal: "TJSP",
        status: "estratégia",
        prazoFinal: new Date("2026-04-09"),
        resumo: "Discussão sobre inadimplemento contratual com solicitação de tutela de urgência para suspensão de multas contratuais de R$ 45.000/dia.",
      },
      {
        id: "CAS-2026-002",
        titulo: "Contestação Trabalhista - Horas Extras e Adicional Noturno",
        cliente: "Rede Supernova Comércio",
        materia: "Trabalhista",
        tribunal: "TRT-2",
        status: "minuta em elaboração",
        prazoFinal: new Date("2026-04-05"),
        resumo: "Defesa em reclamação trabalhista sobre horas extras, adicional noturno e reflexos. Foco na prova documental de jornada.",
      },
      {
        id: "CAS-2026-003",
        titulo: "Mandado de Segurança Tributário - ICMS sobre Transferências",
        cliente: "Horizonte Logística Ltda.",
        materia: "Tributário",
        tribunal: "TRF-3",
        status: "em análise",
        prazoFinal: new Date("2026-04-15"),
        resumo: "Impetração de mandado de segurança para suspensão da exigibilidade de ICMS sobre transferências interestaduais entre filiais, com base no Tema 1099 do STF.",
      },
      {
        id: "CAS-2026-004",
        titulo: "Ação Indenizatória por Falha em Produto - Recall",
        cliente: "Marina Cavalcanti",
        materia: "Consumidor",
        tribunal: "TJSP",
        status: "em triagem",
        prazoFinal: new Date("2026-04-20"),
        resumo: "Consumidora lesionada em decorrência de produto com recall não comunicado oportunamente. Pedido de danos materiais e extrapatrimoniais.",
      },
      {
        id: "CAS-2026-005",
        titulo: "Embargos à Execução - Excesso de Execução Bancária",
        cliente: "Agropecuária Cerrado Vivo Ltda.",
        materia: "Bancário",
        tribunal: "TJGO",
        status: "redação",
        prazoFinal: new Date("2026-04-08"),
        resumo: "Embargos opostos pelo devedor rural discutindo excesso de execução, capitalização ilegal de juros e impenhorabilidade da sede rural.",
      },
      {
        id: "CAS-2026-006",
        titulo: "Ação de Usucapião Especial Rural - Pro Labore",
        cliente: "Família Sebastião Costa",
        materia: "Agrário",
        tribunal: "TJMG",
        status: "em análise",
        prazoFinal: new Date("2026-05-01"),
        resumo: "Ação de usucapião especial rural (pro labore) de área de 24,5 hectares ocupada pela família há mais de 14 anos com produção de subsistência e sem contestação da posse.",
      },
      {
        id: "CAS-2026-007",
        titulo: "Reintegração de Posse - Invasão de Área Rural",
        cliente: "Fazenda São Benedito Agros S/A",
        materia: "Agrário",
        tribunal: "TJMT",
        status: "novo",
        prazoFinal: new Date("2026-04-03"),
        resumo: "Invasão de área rural produtiva por aproximadamente 80 famílias. Área: 1.200 hectares. Necessidade de liminar de reintegração com força policial e risco de perda da safra.",
      },
      {
        id: "CAS-2026-008",
        titulo: "Ação de Recuperação Judicial - Médio Porte",
        cliente: "Metalúrgica Dinâmica S.A.",
        materia: "Empresarial",
        tribunal: "TJSP",
        status: "estratégia",
        prazoFinal: new Date("2026-04-25"),
        resumo: "Processo de recuperação judicial de empresa com dívidas de R$ 38 milhões. Passivo concentrado em três credores principais. Plano de 36 meses.",
      },
      {
        id: "CAS-2026-009",
        titulo: "Embargos à Execução — Operação Mata-Mata em Crédito Rural",
        cliente: "Fazenda Três Irmãos Agropecuária Ltda.",
        materia: "Bancário / Agrário",
        tribunal: "TJMT",
        status: "em análise",
        prazoFinal: new Date("2026-05-15"),
        resumo: "Produtor rural executado por CCB de R$ 2.800.000,00 que decorreu de operação mata-mata: o banco concedeu novo crédito para quitar CCR anterior do mesmo cliente sem disponibilização real dos recursos. Cadeia de três renegociações com incorporação de CDI e mora acima de 1% a.a. Defesa: nulidade do título por simulação (art. 167 CC), revisão da cadeia (Súmula 286/STJ), impenhorabilidade da sede rural familiar.",
      },
    ];

    for (const caso of CASOS) {
      await sql`
        INSERT INTO casos (id, titulo, cliente, materia, tribunal, status, prazo_final, resumo)
        VALUES (
          ${caso.id}, ${caso.titulo}, ${caso.cliente}, ${caso.materia},
          ${caso.tribunal}, ${caso.status}, ${caso.prazoFinal}, ${caso.resumo}
        )
        ON CONFLICT (id) DO UPDATE SET
          titulo = EXCLUDED.titulo,
          status = EXCLUDED.status,
          resumo = EXCLUDED.resumo
      `;
    }
    console.log(`   ✅ ${CASOS.length} casos inseridos/atualizados.\n`);

    // ── 4. TESES JURÍDICAS ───────────────────────────────────────────
    console.log("📚 Semeando teses jurídicas do catálogo...");
    const TESES = [
      {
        id: "tese-civ-001-v1",
        codigo: "TES-CIV-001",
        titulo: "Tutela de urgência por risco de dano contratual contínuo",
        teseBase: "A urgência é justificada pelo dano progressivo e pela plausibilidade documental da narrativa fática.",
        status: "ativo",
      },
      {
        id: "tese-civ-002-v1",
        codigo: "TES-CIV-002",
        titulo: "Responsabilidade por descumprimento contratual com prova documental",
        teseBase: "A violação contratual comprovada por documentos autoriza condenação e reparação integral.",
        status: "ativo",
      },
      {
        id: "tese-ban-001-v1",
        codigo: "TES-BAN-001",
        titulo: "Revisão de encargos e transparência contratual bancária",
        teseBase: "A ausência de clareza na evolução da dívida impõe revisão dos encargos e exibição analítica.",
        status: "ativo",
      },
      {
        id: "tese-agr-001-v1",
        codigo: "TES-AGR-001",
        titulo: "Preservação da atividade produtiva no agronegócio",
        teseBase: "A tutela jurisdicional deve evitar interrupção da cadeia produtiva e perda da safra.",
        status: "ativo",
      },
      {
        id: "tese-agr-002-v1",
        codigo: "TES-AGR-002",
        titulo: "Usucapião Especial Rural (Pro Labore) - Função Social",
        teseBase: "O cumprimento cumulativo dos requisitos constitucionais — área inferior a 50ha, moradia e exploração com trabalho familiar — enseja a aquisição originária independentemente de justo título.",
        status: "ativo",
      },
      {
        id: "tese-agr-003-v1",
        codigo: "TES-AGR-003",
        titulo: "Reintegração de Posse por Invasão Rural (Força Nova)",
        teseBase: "Comprovada a posse anterior e o esbulho a menos de ano e dia, é imperativa a concessão de liminar com auxílio de força policial.",
        status: "ativo",
      },
      {
        id: "tese-agr-004-v1",
        codigo: "TES-AGR-004",
        titulo: "Direito de Retenção por Benfeitorias no Arrendamento Rural",
        teseBase: "A restituição do imóvel rural fica condicionada ao prévio adimplemento das benfeitorias úteis e necessárias implementadas de boa-fé.",
        status: "ativo",
      },
      {
        id: "tese-agr-005-v1",
        codigo: "TES-AGR-005",
        titulo: "Liquidez da CPR e Arresto Cautelar de Grãos",
        teseBase: "O inadimplemento de obrigação em CPR enseja execução célere e eventual tutela cautelar de arresto sobre grãos em armazéns.",
        status: "ativo",
      },
      {
        id: "tese-agr-006-v1",
        codigo: "TES-AGR-006",
        titulo: "Impenhorabilidade da Pequena Propriedade Rural Familiar",
        teseBase: "A pequena propriedade rural (1-4 módulos fiscais) explorada pela família é absolutamente impenhorável para dívidas de sua atividade produtiva.",
        status: "ativo",
      },
      {
        id: "tese-agr-007-v1",
        codigo: "TES-AGR-007",
        titulo: "Direito à Prorrogação do Débito Rural (Securitização - Súmula 298/STJ)",
        teseBase: "A negativa bancária de prorrogação de crédito rural nos termos da lei autoriza o Mandado de Segurança. (Súmula 298/STJ)",
        status: "ativo",
      },
      {
        id: "tese-def-001-v1",
        codigo: "TES-DEF-001",
        titulo: "Impugnação por insuficiência probatória da parte adversa",
        teseBase: "A narrativa adversa sem prova robusta deve ser rejeitada por ausência de suporte mínimo.",
        status: "ativo",
      },
      {
        id: "tese-rec-001-v1",
        codigo: "TES-REC-001",
        titulo: "Reforma por error in judicando com revaloração do conjunto fático",
        teseBase: "A sentença deve ser reformada quando dissociada da prova documental e dos fatos incontroversos.",
        status: "ativo",
      },
      {
        id: "tese-esp-001-v1",
        codigo: "TES-ESP-001",
        titulo: "Violação de dispositivo federal e prequestionamento (Recurso Especial)",
        teseBase: "A admissibilidade recursal depende da demonstração analítica de violação legal e prequestionamento.",
        status: "ativo",
      },
      {
        id: "tese-emb-001-v1",
        codigo: "TES-EMB-001",
        titulo: "Excesso de execução e inexigibilidade parcial",
        teseBase: "A execução deve ser limitada ao valor efetivamente exigível, com abatimento de parcelas indevidas.",
        status: "ativo",
      },
      // ── Operação Mata-Mata ──────────────────────────────────────────
      {
        id: "tese-mm-001-v1",
        codigo: "TES-MM-001",
        titulo: "Nulidade da Operação Mata-Mata — Simulação e Desvio de Finalidade do Crédito Rural",
        teseBase: "A concessão de novo crédito rural (CCB ou CCR) para liquidar débito pretérito do mesmo produtor, sem disponibilização real dos recursos, configura negócio jurídico simulado (art. 167 do CC) com desvio de finalidade (art. 49 do DL 167/67). O título é nulo de pleno direito.",
        status: "ativo",
      },
      {
        id: "tese-mm-002-v1",
        codigo: "TES-MM-002",
        titulo: "Revisão da Cadeia de Crédito Rural — Súmula 286/STJ",
        teseBase: "Pela Súmula 286/STJ, a renegociação ou confissão de dívida não impede a discussão sobre ilegalidades dos contratos anteriores. A cadeia de operações mata-mata pode ser integralmente revisada, com expurgo de encargos ilegais incorporados nas renegociações.",
        status: "ativo",
      },
      {
        id: "tese-mm-003-v1",
        codigo: "TES-MM-003",
        titulo: "Direito ao Alongamento/Securitização — Súmula 298/STJ e MCR",
        teseBase: "A Súmula 298/STJ garante o alongamento de dívida rural mesmo sem concordância do credor. O banco que opera com recursos controlados do MCR está vinculado às regras de prorrogação obrigatória da Lei 9.138/95. A recusa ilegal ao alongamento justifica Mandado de Segurança.",
        status: "ativo",
      },
      {
        id: "tese-mm-004-v1",
        codigo: "TES-MM-004",
        titulo: "Limitação de Juros em Crédito Rural — DL 167/67 e Decreto 22.626/33",
        teseBase: "Operações de crédito rural reguladas pelo DL 167/67 estão sujeitas a limites de encargos fixados pelo CMN. Taxas acima do MCR e capitalização não autorizada configuram encargos abusivos, sujeitos a revisão e expurgo.",
        status: "ativo",
      },
      {
        id: "tese-mm-005-v1",
        codigo: "TES-MM-005",
        titulo: "Nulidade de Indexação por CDI em Crédito Rural — Súmula 176/STJ",
        teseBase: "A Súmula 176/STJ declara nula a cláusula que sujeita o devedor à taxa CDI (ANBID/CETIP). Em crédito rural, a indexação ao CDI é duplamente nula: pela Súmula 176/STJ e pelo DL 167/67, impondo-se substituição por índice oficial.",
        status: "ativo",
      },
      {
        id: "tese-mm-006-v1",
        codigo: "TES-MM-006",
        titulo: "Mora Limitada a 1% a.a. em Crédito Rural — Art. 5º do DL 167/67",
        teseBase: "O art. 5º do DL 167/67 limita os juros de mora em crédito rural a 1% ao ano. Qualquer encargo moratório superior — incluindo comissão de permanência, multa cumulada com juros ou capitalização de mora — é nulo de pleno direito.",
        status: "ativo",
      },
      {
        id: "tese-mm-007-v1",
        codigo: "TES-MM-007",
        titulo: "Impenhorabilidade do Produto Rural Vinculado a CPR/CCR",
        teseBase: "O produto rural objeto de CPR ou dado em penhor cedular em CCR é impenhorável por credor sem preferência sobre aquele bem. Em operações mata-mata, o produto destinado ao crédito legítimo não pode ser penhorado pelo crédito simulado.",
        status: "ativo",
      },
    ];

    for (const tese of TESES) {
      await sql`
        INSERT INTO teses_juridicas (id, codigo, titulo, tese_base, status)
        VALUES (${tese.id}, ${tese.codigo}, ${tese.titulo}, ${tese.teseBase}, ${tese.status})
        ON CONFLICT (id) DO UPDATE SET
          titulo = EXCLUDED.titulo,
          tese_base = EXCLUDED.tese_base,
          status = EXCLUDED.status
      `;
    }
    console.log(`   ✅ ${TESES.length} teses jurídicas inseridas/atualizadas.\n`);

    // ── 5. PARTES DOS CASOS ──────────────────────────────────────────
    console.log("👥 Semeando partes dos casos...");
    const PARTES = [
      { casoId: "CAS-2026-001", nome: "Atlas Engenharia S.A.", papel: "autor" },
      { casoId: "CAS-2026-001", nome: "Delta Fornecimentos Ltda.", papel: "réu" },
      { casoId: "CAS-2026-002", nome: "Thiago Alves", papel: "autor" },
      { casoId: "CAS-2026-002", nome: "Rede Supernova Comércio", papel: "réu" },
      { casoId: "CAS-2026-003", nome: "Horizonte Logística Ltda.", papel: "autor" },
      { casoId: "CAS-2026-003", nome: "Fazenda Pública do Estado de São Paulo", papel: "réu" },
      { casoId: "CAS-2026-004", nome: "Marina Cavalcanti", papel: "autor" },
      { casoId: "CAS-2026-004", nome: "ElectroMax Produtos Eletrônicos S.A.", papel: "réu" },
      { casoId: "CAS-2026-005", nome: "Agropecuária Cerrado Vivo Ltda.", papel: "autor" },
      { casoId: "CAS-2026-005", nome: "Banco RuralPrime S.A.", papel: "réu" },
      { casoId: "CAS-2026-006", nome: "Sebastião Costa", papel: "autor" },
      { casoId: "CAS-2026-006", nome: "Herdeiros Ramos da Silva", papel: "réu" },
      { casoId: "CAS-2026-007", nome: "Fazenda São Benedito Agros S/A", papel: "autor" },
      { casoId: "CAS-2026-007", nome: "Movimento Via Campesina (representados)", papel: "réu" },
      { casoId: "CAS-2026-008", nome: "Metalúrgica Dinâmica S.A.", papel: "autor" },
      { casoId: "CAS-2026-008", nome: "Banco Meridional S.A.", papel: "terceiro" },
      { casoId: "CAS-2026-009", nome: "Fazenda Três Irmãos Agropecuária Ltda.", papel: "autor" },
      { casoId: "CAS-2026-009", nome: "Banco AgriFinance S.A.", papel: "réu" },
    ];

    for (const parte of PARTES) {
      await sql`
        INSERT INTO partes (id, caso_id, nome, papel)
        VALUES (gen_random_uuid(), ${parte.casoId}, ${parte.nome}, ${parte.papel})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log(`   ✅ ${PARTES.length} partes inseridas.\n`);

    // ── 6. CLIENTES ─────────────────────────────────────────────
    console.log("🏢 Semeando clientes...");
    const CLIENTES = [
      { id: "CLI-2026-001", nome: "Atlas Engenharia S.A.", tipo: "pessoa_juridica", cpfCnpj: "12.345.678/0001-90", email: "juridico@atlas.com.br", telefone: "(65) 3321-4455", endereco: { cidade: "Cuiabá", estado: "MT", cep: "78000-000" }, status: "ativo", responsavelId: null, anotacoes: "Empresa de engenharia com propriedades rurais em Mato Grosso. Demandas frequentes em direito agrário.", criadoEm: new Date("2025-06-01"), atualizadoEm: new Date("2026-03-15") },
      { id: "CLI-2026-002", nome: "Prod. Rural Benedito Ferreira", tipo: "pessoa_fisica", cpfCnpj: "012.345.678-90", email: "benedito@fazendaferreira.com.br", telefone: "(65) 99823-4567", endereco: { cidade: "Sinop", estado: "MT" }, status: "ativo", responsavelId: null, anotacoes: "Produtor rural, área de grãos. Processos envolvendo execução bancária de crédito rural.", criadoEm: new Date("2025-09-10"), atualizadoEm: new Date("2026-01-10") },
      { id: "CLI-2026-003", nome: "Cooperativa Agrícola do Cerrado Ltda.", tipo: "pessoa_juridica", cpfCnpj: "98.765.432/0001-10", email: "juridico@cerrado.coop.br", telefone: "(64) 3312-0099", endereco: { cidade: "Rio Verde", estado: "GO" }, status: "ativo", responsavelId: null, anotacoes: "Cooperativa com mais de 800 associados. Assuntos: arrendamento, contratos de parceria, financiamentos.", criadoEm: new Date("2025-03-01"), atualizadoEm: new Date("2026-02-20") },
      { id: "CLI-2026-004", nome: "Marcos Antônio Teixeira", tipo: "pessoa_fisica", cpfCnpj: "456.789.012-34", email: "marcos@teixeiraagricultura.com", telefone: "(64) 99712-3344", endereco: { cidade: "Jataí", estado: "GO" }, status: "prospecto", responsavelId: null, anotacoes: null, criadoEm: new Date("2026-03-18"), atualizadoEm: new Date("2026-03-18") },
      { id: "CLI-2026-005", nome: "Terrafort Investimentos S.A.", tipo: "pessoa_juridica", cpfCnpj: "11.222.333/0001-44", email: "legal@terrafort.com.br", telefone: null, endereco: null, status: "prospecto", responsavelId: null, anotacoes: "Empresa de investimentos com foco em agropecuária. Processo de reestruturação societária em andamento.", criadoEm: new Date("2026-04-01"), atualizadoEm: new Date("2026-04-01") },
    ];

    for (const c of CLIENTES) {
      await sql`
        INSERT INTO clientes (id, nome, tipo, cpf_cnpj, email, telefone, endereco_json, status, responsavel_id, anotacoes, criado_em, atualizado_em)
        VALUES (${c.id}, ${c.nome}, ${c.tipo}, ${c.cpfCnpj}, ${c.email}, ${c.telefone}, ${c.endereco ? JSON.stringify(c.endereco) : null}, ${c.status}, ${c.responsavelId}, ${c.anotacoes}, ${c.criadoEm}, ${c.atualizadoEm})
        ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, status = EXCLUDED.status
      `;
    }
    console.log(`   ✅ ${CLIENTES.length} clientes inseridos/atualizados.\n`);

    // ── 7. JURISPRUDÊNCIA ────────────────────────────────────────
    console.log("⚖️  Semeando jurisprudência...");
    const JD = [
      { id: "JD-001", titulo: "REsp 1.857.852/MT — Impenhorabilidade da pequena propriedade rural", ementa: "PROCESSUAL CIVIL. RECURSO ESPECIAL. EXECUÇÃO. PEQUENA PROPRIEDADE RURAL. IMPENHORABILIDADE. ART. 5º, XXVI, CF/88. REQUISITOS. TRABALHO FAMILIAR. 1. A impenhorabilidade da pequena propriedade rural, prevista no art. 5º, XXVI, da Constituição Federal, pressupõe que o imóvel seja trabalhado pela família do devedor. 2. A proteção constitucional independe da existência de débito derivado de sua atividade produtiva, abarcando também dívidas de origem diversa. 3. Recurso especial provido.", ementaResumida: "A pequena propriedade rural trabalhada pela família é impenhorável, inclusive para dívidas não vinculadas à atividade agrícola.", tribunal: "STJ", relator: "Min. Marco Buzzi", dataJulgamento: "2021-08-24", tipo: "acordao", materias: ["direito agrário","impenhorabilidade","pequena propriedade rural","execução"], tese: "A impenhorabilidade da pequena propriedade rural (art. 5º, XXVI, CF/88) é ampla e independe da natureza da dívida, desde que o imóvel seja trabalhado pela família.", fundamentos: ["Art. 5º, XXVI, CF/88","Art. 833, VIII, CPC","Lei n.º 8.009/90","Estatuto da Terra"], urlOrigem: "https://stj.jusbrasil.com.br/jurisprudencia/1857852", relevancia: 5, criadoEm: new Date("2026-01-10") },
      { id: "JD-002", titulo: "Tema 1099 STJ — Prorrogação automática de contratos de crédito rural", ementa: "DIREITO BANCÁRIO E AGRÁRIO. TEMA REPETITIVO 1099. CRÉDITO RURAL. CONTRATO. PRORROGAÇÃO. MORA. A mora do devedor rural não se configura enquanto não houver notificação específica para pagamento após o término do prazo originalmente ajustado, sendo automática a prorrogação quando verificadas as hipóteses do art. 50, §§ 5º e 6º, do Decreto-Lei n.º 167/67.", ementaResumida: "Contratos de crédito rural têm prorrogação automática nas hipóteses do Decreto-Lei 167/67. A mora só se constitui após notificação específica.", tribunal: "STJ", relator: "Min. Ricardo Villas Bôas Cueva", dataJulgamento: "2022-11-09", tipo: "tema_stj", materias: ["crédito rural","prorrogação de débito rural","mora","direito bancário"], tese: "A prorrogação de contratos de crédito rural é automática nas hipóteses legais. Sem notificação pós-prorrogação, não há mora configurada.", fundamentos: ["Art. 50, §§ 5º e 6º, Decreto-Lei n.º 167/67","Art. 397, CC"], urlOrigem: null, relevancia: 5, criadoEm: new Date("2026-01-12") },
      { id: "JD-003", titulo: "Súmula 648 STJ — Alienação fiduciária e produtor rural", ementa: "A superveniência da Lei n.º 13.986/2020 (Lei do Agro), ao instituir a Cédula Imobiliária Rural (CIR) e disciplinar a alienação fiduciária de imóvel rural, não implica revogação tácita das disposições anteriores sobre garantias reais rurais.", ementaResumida: "A Lei do Agro (13.986/2020) não revogou normas anteriores sobre garantias rurais — convivem harmonicamente.", tribunal: "STJ", relator: null, dataJulgamento: "2023-05-10", tipo: "sumula", materias: ["direito agrário","alienação fiduciária","lei do agro","garantias rurais"], tese: null, fundamentos: ["Lei n.º 13.986/2020","Decreto-Lei n.º 167/67"], urlOrigem: null, relevancia: 4, criadoEm: new Date("2026-01-15") },
      { id: "JD-004", titulo: "ARE 1.258.645 STF — Repercussão Geral: competência para ação de arrendamento rural", ementa: "COMPETÊNCIA. AÇÃO RELATIVA A CONTRATO DE ARRENDAMENTO RURAL. VARA AGRÁRIA. ART. 126, CF/88. A Constituição Federal impõe a criação de varas agrárias com competência exclusiva para processar e julgar questões possessórias e dominiais relativas à terras rurais. Repercussão geral reconhecida.", ementaResumida: "Ações de arrendamento rural devem tramitar em varas agrárias especializadas, conforme art. 126 da CF/88.", tribunal: "STF", relator: "Min. Edson Fachin", dataJulgamento: "2020-09-15", tipo: "repercussao_geral", materias: ["competência","arrendamento rural","vara agrária","direito processual"], tese: null, fundamentos: ["Art. 126, CF/88","Lei n.º 4.947/66"], urlOrigem: null, relevancia: 4, criadoEm: new Date("2026-01-20") },
      { id: "JD-005", titulo: "REsp 1.920.300/GO — Parceria agrícola: percentual mínimo ao parceiro-outorgado", ementa: "DIREITO AGRÁRIO. PARCERIA AGRÍCOLA. PERCENTUAL MÍNIMO. ESTATUTO DA TERRA. Art. 96, VI, 'a'. É nula de pleno direito a cláusula de parceria agrícola que estipule participação inferior a 25% dos frutos ao parceiro-outorgado, por violação ao piso protetivo do Estatuto da Terra.", ementaResumida: "Cláusula de parceria agrícola que atribui menos de 25% dos frutos ao parceiro-outorgado é nula — violação ao Estatuto da Terra.", tribunal: "STJ", relator: "Min. Nancy Andrighi", dataJulgamento: "2022-03-22", tipo: "acordao", materias: ["parceria agrícola","estatuto da terra","percentual mínimo","nulidade"], tese: "O piso de 25% ao parceiro-outorgado em contratos de parceria agrícola é norma cogente — cláusula que o reduza é nula.", fundamentos: ["Art. 96, VI, 'a', Estatuto da Terra (Lei n.º 4.504/64)"], urlOrigem: null, relevancia: 5, criadoEm: new Date("2026-02-01") },
      { id: "JD-006", titulo: "AgRg no REsp 1.654.321/MT — Prazo de arrendamento rural abaixo do mínimo legal", ementa: "DIREITO AGRÁRIO. ARRENDAMENTO RURAL. PRAZO MÍNIMO LEGAL. DECRETO N.º 59.566/66. O prazo de arrendamento inferior ao mínimo legal é automaticamente prorrogado pelo prazo mínimo previsto no art. 13 do Decreto n.º 59.566/66, independentemente de manifestação das partes.", ementaResumida: "Prazo de arrendamento rural abaixo do mínimo legal é prorrogado automaticamente pelo Decreto 59.566/66.", tribunal: "STJ", relator: null, dataJulgamento: "2021-06-15", tipo: "acordao", materias: ["arrendamento rural","prazo mínimo","prorrogação automática"], tese: null, fundamentos: ["Art. 13, Decreto n.º 59.566/66","Estatuto da Terra"], urlOrigem: null, relevancia: 4, criadoEm: new Date("2026-02-10") },
      { id: "JD-007", titulo: "REsp 1.789.654/MT — Honorários advocatícios em execução fiscal vs. produtor rural", ementa: "PROCESSUAL CIVIL. EXECUÇÃO FISCAL. PRODUTOR RURAL. HONORÁRIOS ADVOCATÍCIOS. SÚMULA 7/STJ. Em execução fiscal promovida contra produtor rural pessoa física, os honorários advocatícios devem ser fixados com base no CPC, respeitada a capacidade econômica do executado apurada nos autos.", ementaResumida: "Em execução fiscal contra produtor rural, honorários são fixados pelo CPC considerando a capacidade econômica apurada nos autos.", tribunal: "STJ", relator: null, dataJulgamento: "2020-11-03", tipo: "acordao", materias: ["honorários advocatícios","execução fiscal","produtor rural"], tese: null, fundamentos: ["Art. 85, §§ 2º e 8º, CPC","Súmula 7/STJ"], urlOrigem: null, relevancia: 3, criadoEm: new Date("2026-02-15") },
      { id: "JD-008", titulo: "Súmula 331/TST — Terceirização lícita e responsabilidade subsidiária", ementa: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS. LEGALIDADE. I — A contratação de trabalhadores por empresa interposta é ilegal, formando-se o vínculo diretamente com o tomador dos serviços, salvo no caso de trabalho temporário (Lei n.º 6.019/74). II — A contratação irregular de trabalhador, mediante empresa interposta, não gera vínculo de emprego com os órgãos da Administração Pública direta, indireta ou fundacional (art. 37, II, da CF/88). III — Não forma vínculo de emprego com o tomador a contratação de serviços de vigilância (Lei n.º 7.102/83) e de conservação e limpeza, bem como a de serviços especializados ligados à atividade-meio do tomador, desde que inexistente a pessoalidade e a subordinação direta. IV — O inadimplemento das obrigações trabalhistas, por parte do empregador, implica a responsabilidade subsidiária do tomador dos serviços quanto àquelas obrigações, desde que hajam participado da relação processual e constem também do título executivo judicial.", ementaResumida: "Terceirização é lícita para atividade-meio. Tomador de serviços responde subsidiariamente pelo inadimplemento trabalhista da empresa terceirizada.", tribunal: "TST", relator: null, dataJulgamento: "2011-05-24", tipo: "sumula", materias: ["terceirização","vínculo empregatício","responsabilidade subsidiária","direito do trabalho"], tese: "A empresa tomadora de serviços responde subsidiariamente pelas obrigações trabalhistas inadimplidas pela prestadora (terceirizada), quando há terceirização lícita de atividade-meio.", fundamentos: ["Art. 37, II, CF/88","Lei n.º 6.019/74","CLT"], urlOrigem: null, relevancia: 5, criadoEm: new Date("2026-02-20") },
      { id: "JD-009", titulo: "Súmula 308/TST — Prescrição bienal em ação trabalhista", ementa: "PRESCRIÇÃO BIENAL. EXTINÇÃO DO CONTRATO. A prescrição bienal prevista no art. 7.º, XXIX, da CF/88 tem como marco inicial a data da extinção do contrato de trabalho. Proposta a ação dentro desse prazo, as parcelas anteriores a 5 anos da propositura da ação podem ser alcançadas pela prescrição quinquenal.", ementaResumida: "A ação trabalhista deve ser proposta em até 2 anos da rescisão. Dentro desse prazo, podem ser reclamadas verbas dos últimos 5 anos do contrato.", tribunal: "TST", relator: null, dataJulgamento: "2005-09-19", tipo: "sumula", materias: ["prescrição bienal","prescrição quinquenal","prazo","direito do trabalho"], tese: "Extinção do contrato de trabalho inicia o prazo prescricional bienal (2 anos). Dentro desse prazo, podem ser reclamados créditos dos últimos 5 anos.", fundamentos: ["Art. 7º, XXIX, CF/88","Art. 11, CLT"], urlOrigem: null, relevancia: 5, criadoEm: new Date("2026-02-22") },
      { id: "JD-010", titulo: "Tema 69/STF — ICMS não compõe base de cálculo do PIS e da COFINS", ementa: "TRIBUTÁRIO. PIS. COFINS. BASE DE CÁLCULO. ICMS. EXCLUSÃO. O ICMS não compõe a base de cálculo para fins de incidência do PIS e da COFINS.", ementaResumida: "O ICMS não integra a base de cálculo do PIS/COFINS. Contribuintes têm direito à restituição/compensação dos valores indevidamente recolhidos desde 15/03/2017.", tribunal: "STF", relator: "Min. Cármen Lúcia", dataJulgamento: "2017-03-15", tipo: "repercussao_geral", materias: ["PIS","COFINS","ICMS","base de cálculo","restituição","direito tributário"], tese: "O ICMS não compõe a base de cálculo do PIS/COFINS. Contribuintes têm direito à restituição/compensação dos valores recolhidos a maior desde a modulação (15/03/2017).", fundamentos: ["Art. 195, I, 'b', CF/88","Lei n.º 10.637/2002","Lei n.º 10.833/2003"], urlOrigem: null, relevancia: 5, criadoEm: new Date("2026-02-25") },
      { id: "JD-011", titulo: "REsp 1.111.003/PR — Compensação tributária e prazo prescricional", ementa: "TRIBUTÁRIO. COMPENSAÇÃO. PRAZO PRESCRICIONAL. PRESCRIÇÃO QUINQUENAL. A pretensão de compensação de créditos tributários é prescritível no prazo de 5 (cinco) anos contados do pagamento indevido, nos termos do art. 168, I, do CTN.", ementaResumida: "O prazo para requerer compensação de tributos pagos indevidamente é de 5 anos contados do pagamento, nos termos do art. 168, I, CTN.", tribunal: "STJ", relator: null, dataJulgamento: "2009-06-24", tipo: "acordao", materias: ["compensação tributária","prescrição quinquenal","repetição de indébito","direito tributário"], tese: "O prazo prescricional para compensação/restituição de tributo pago indevidamente é de 5 anos do pagamento (art. 168, I, CTN).", fundamentos: ["Art. 168, I, CTN","Art. 170, CTN","Lei n.º 9.430/96"], urlOrigem: null, relevancia: 4, criadoEm: new Date("2026-03-01") },
      { id: "JD-012", titulo: "REsp 1.195.642/RJ — Responsabilidade objetiva do fornecedor por vício do serviço", ementa: "CONSUMIDOR. RESPONSABILIDADE OBJETIVA. VÍCIO DO SERVIÇO. DANO MORAL. NEXO CAUSAL. A responsabilidade civil do fornecedor de serviços por vício é objetiva (art. 14, CDC), dispensando prova de culpa.", ementaResumida: "O fornecedor responde objetivamente pelo defeito no serviço. O consumidor precisa provar apenas o dano e o nexo causal — não precisa provar culpa.", tribunal: "STJ", relator: null, dataJulgamento: "2010-10-13", tipo: "acordao", materias: ["responsabilidade objetiva","vício do serviço","dano moral","CDC","direito do consumidor"], tese: "A responsabilidade do fornecedor é objetiva: basta ao consumidor provar dano e nexo causal. A culpa é irrelevante; eventuais excludentes devem ser demonstradas pelo fornecedor.", fundamentos: ["Art. 14, CDC (Lei 8.078/90)","Art. 12, CDC","Art. 6º, VIII, CDC (inversão do ônus)"], urlOrigem: null, relevancia: 5, criadoEm: new Date("2026-03-05") },
      { id: "JD-013", titulo: "Súmula 297/STJ — Aplicação do CDC às instituições financeiras", ementa: "O Código de Defesa do Consumidor é aplicável às instituições financeiras.", ementaResumida: "Bancos e financeiras estão sujeitos ao CDC — relações bancárias com clientes pessoas físicas são relações de consumo.", tribunal: "STJ", relator: null, dataJulgamento: "2004-05-12", tipo: "sumula", materias: ["CDC","instituição financeira","banco","relação de consumo","direito do consumidor"], tese: "Instituições financeiras são fornecedoras de serviços para fins do CDC. Contratos bancários com consumidores admitem revisão por abusividade, inversão do ônus da prova e dano moral.", fundamentos: ["Lei 8.078/90 (CDC)","Art. 3º, § 2º, CDC"], urlOrigem: null, relevancia: 5, criadoEm: new Date("2026-03-08") },
    ];

    for (const j of JD) {
      await sql`
        INSERT INTO jurisprudencia (id, titulo, ementa, ementa_resumida, tribunal, relator, data_julgamento, tipo, materias_json, tese, fundamentos_legais_json, url_origem, relevancia, criado_em)
        VALUES (
          ${j.id}, ${j.titulo}, ${j.ementa}, ${j.ementaResumida}, ${j.tribunal},
          ${j.relator}, ${j.dataJulgamento}, ${j.tipo},
          ${JSON.stringify(j.materias)}, ${j.tese},
          ${JSON.stringify(j.fundamentos)}, ${j.urlOrigem}, ${j.relevancia}, ${j.criadoEm}
        )
        ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, relevancia = EXCLUDED.relevancia
      `;
    }
    console.log(`   ✅ ${JD.length} jurisprudências inseridas/atualizadas.\n`);

    // ── 8. CONTRATOS ────────────────────────────────────────────
    console.log("📄 Semeando contratos...");
    const CONTRATOS = [
      { id: "CTR-2026-001", casoId: "CAS-2026-001", clienteId: "CLI-2026-001", titulo: "Arrendamento Rural — Fazenda São João", tipo: "arrendamento_rural", status: "vigente", objeto: "Arrendamento de 320 hectares de terra agricultável para cultivo de soja e milho.", partes: [{ papel: "arrendador", nome: "Atlas Engenharia S.A.", cpfCnpj: "12.345.678/0001-90" }, { papel: "arrendatario", nome: "Cooperativa Agrícola do Cerrado Ltda.", cpfCnpj: "98.765.432/0001-10" }], valorReais: 18000000, vigenciaInicio: "2025-07-01", vigenciaFim: "2028-06-30", conteudo: "CONTRATO DE ARRENDAMENTO RURAL\n\nPelo presente instrumento particular...", criadoEm: new Date("2025-06-15"), atualizadoEm: new Date("2025-07-01") },
      { id: "CTR-2026-002", casoId: "CAS-2026-003", clienteId: "CLI-2026-002", titulo: "Honorários Advocatícios — Impugnação ao Cumprimento de Sentença", tipo: "honorarios_advocaticios", status: "assinado", objeto: "Contrato de prestação de serviços advocatícios para defesa em impugnação ao cumprimento de sentença.", partes: [{ papel: "contratante", nome: "Prod. Rural Benedito Ferreira", cpfCnpj: "012.345.678-90" }, { papel: "contratado", nome: "JGG Group — Advocacia e Consultoria" }], valorReais: 1500000, vigenciaInicio: null, vigenciaFim: null, conteudo: "CONTRATO DE HONORÁRIOS ADVOCATÍCIOS\n\nPelo presente instrumento...", criadoEm: new Date("2026-01-10"), atualizadoEm: new Date("2026-01-12") },
      { id: "CTR-2026-003", casoId: null, clienteId: "CLI-2026-004", titulo: "Parceria Agrícola — Safra 2026/2027", tipo: "parceria_agricola", status: "em_revisao", objeto: "Parceria agrícola para cultivo de soja na propriedade Fazenda Esperança, com divisão de 40% ao outorgante e 60% ao outorgado.", partes: [{ papel: "outro", nome: "Marcos Antônio Teixeira", cpfCnpj: "456.789.012-34" }, { papel: "outro", nome: "Agropecuária Souza & Irmãos Ltda." }], valorReais: null, vigenciaInicio: "2026-07-01", vigenciaFim: "2027-06-30", conteudo: "CONTRATO DE PARCERIA AGRÍCOLA\n\nAo [dia] de [mês] de [ano]...", criadoEm: new Date("2026-03-20"), atualizadoEm: new Date("2026-03-28") },
      { id: "CTR-2026-004", casoId: null, clienteId: "CLI-2026-005", titulo: "NDA — Projeto de Reestruturação Societária", tipo: "nda_confidencialidade", status: "rascunho", objeto: "Acordo de confidencialidade para proteção de informações no contexto de reestruturação societária.", partes: [{ papel: "cedente", nome: "Terrafort Investimentos S.A." }, { papel: "cessionario", nome: "JGG Group — Advocacia e Consultoria" }], valorReais: null, vigenciaInicio: null, vigenciaFim: null, conteudo: "ACORDO DE CONFIDENCIALIDADE\n\nAs partes identificadas neste instrumento...", criadoEm: new Date("2026-04-01"), atualizadoEm: new Date("2026-04-01") },
    ];

    for (const c of CONTRATOS) {
      await sql`
        INSERT INTO contratos (id, caso_id, cliente_id, titulo, tipo, status, objeto, partes_json, clausulas_json, valor_reais, vigencia_inicio, vigencia_fim, conteudo_atual, versoes_json, criado_em, atualizado_em)
        VALUES (
          ${c.id}, ${c.casoId}, ${c.clienteId}, ${c.titulo}, ${c.tipo}, ${c.status}, ${c.objeto},
          ${JSON.stringify(c.partes)}, ${'[]'}, ${c.valorReais},
          ${c.vigenciaInicio}, ${c.vigenciaFim}, ${c.conteudo}, ${'[]'},
          ${c.criadoEm}, ${c.atualizadoEm}
        )
        ON CONFLICT (id) DO UPDATE SET titulo = EXCLUDED.titulo, status = EXCLUDED.status
      `;
    }
    console.log(`   ✅ ${CONTRATOS.length} contratos inseridos/atualizados.\n`);

    console.log("╔═══════════════════════════════════════════════════════╗");
    console.log("║  🎉 Seed concluído com sucesso!                       ║");
    console.log("║                                                       ║");
    console.log(`║  📁 ${CASOS.length} casos jurídicos                          ║`);
    console.log(`║  📚 ${TESES.length} teses do catálogo                       ║`);
    console.log(`║  👥 ${PARTES.length} partes processuais                      ║`);
    console.log(`║  🏢 ${CLIENTES.length} clientes                               ║`);
    console.log(`║  ⚖️  ${JD.length} jurisprudências                         ║`);
    console.log(`║  📄 ${CONTRATOS.length} contratos                              ║`);
    console.log(`║  👤 ${USUARIOS_SEED.length} usuários do escritório                 ║`);
    console.log("║                                                       ║");
    console.log("║  Acesse com DATA_MODE=real para ver os dados reais.   ║");
    console.log("╚═══════════════════════════════════════════════════════╝");

  } finally {
    await sql.end();
  }
}

main().catch((err) => {
  console.error("❌ Erro fatal no seed:", err.message ?? err);
  process.exit(1);
});
