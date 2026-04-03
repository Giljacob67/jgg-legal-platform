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
import { createHash } from "node:crypto";

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
    // ── 1. USUÁRIO ADMINISTRADOR ─────────────────────────────────────
    console.log("👤 Semeando usuário admin...");
    await sql`
      INSERT INTO users (id, email, password_hash, name, initials, role)
      VALUES (
        gen_random_uuid(),
        'admin@jgg.adv.br',
        ${createHash("sha256").update("jgg@2026!").digest("hex")},
        'Gilberto Jacob',
        'GJ',
        'Sócio / Direção'
      )
      ON CONFLICT (email) DO NOTHING
    `;

    await sql`
      INSERT INTO users (id, email, password_hash, name, initials, role)
      VALUES (
        gen_random_uuid(),
        'assessor@jgg.adv.br',
        ${createHash("sha256").update("jgg@2026!").digest("hex")},
        'Ana Beatriz Santos',
        'AB',
        'Advogado'
      )
      ON CONFLICT (email) DO NOTHING
    `;
    console.log("   ✅ Usuários inseridos.\n");

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
    ];

    for (const parte of PARTES) {
      await sql`
        INSERT INTO partes (id, caso_id, nome, papel)
        VALUES (gen_random_uuid(), ${parte.casoId}, ${parte.nome}, ${parte.papel})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log(`   ✅ ${PARTES.length} partes inseridas.\n`);

    console.log("╔═══════════════════════════════════════════════════════╗");
    console.log("║  🎉 Seed concluído com sucesso!                       ║");
    console.log("║                                                       ║");
    console.log(`║  📁 ${CASOS.length} casos jurídicos           ║`);
    console.log(`║  📚 ${TESES.length} teses do catálogo         ║`);
    console.log(`║  👥 ${PARTES.length} partes processuais        ║`);
    console.log("║  👤 2 usuários (admin + assessor)                     ║");
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
