import type { Clausula, TipoContrato } from "../domain/types";

/**
 * Biblioteca de cláusulas padrão por tipo de contrato.
 * Base inicial para geração de minutas e análise de lacunas.
 */
export const CLAUSULAS_PADRAO: Record<TipoContrato, Omit<Clausula, "id">[]> = {
  prestacao_servicos: [
    { numero: 1, titulo: "Do Objeto", tipo: "essencial", conteudo: "O presente contrato tem por objeto a prestação de serviços de [DESCREVER SERVIÇO], conforme especificações técnicas anexas." },
    { numero: 2, titulo: "Do Prazo", tipo: "essencial", conteudo: "O prazo de vigência do presente contrato é de [PRAZO], contado a partir da assinatura, podendo ser prorrogado mediante acordo escrito." },
    { numero: 3, titulo: "Do Preço e Pagamento", tipo: "essencial", conteudo: "Pelos serviços prestados, o CONTRATANTE pagará ao CONTRATADO o valor de R$ [VALOR], mediante [FORMA DE PAGAMENTO]." },
    { numero: 4, titulo: "Das Obrigações do Contratado", tipo: "essencial", conteudo: "O CONTRATADO obriga-se a executar os serviços com diligência, competência técnica e dentro dos prazos estabelecidos." },
    { numero: 5, titulo: "Das Obrigações do Contratante", tipo: "essencial", conteudo: "O CONTRATANTE obriga-se a fornecer ao CONTRATADO todos os subsídios e informações necessários à execução dos serviços." },
    { numero: 6, titulo: "Da Confidencialidade", tipo: "negociavel", conteudo: "As partes comprometem-se a manter sigilo sobre todas as informações confidenciais a que tiverem acesso em razão deste contrato." },
    { numero: 7, titulo: "Da Rescisão", tipo: "essencial", conteudo: "O presente contrato poderá ser rescindido por qualquer das partes, mediante notificação escrita com antecedência mínima de [PRAZO] dias." },
    { numero: 8, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO] para dirimir quaisquer controvérsias oriundas do presente contrato." },
  ],

  arrendamento_rural: [
    { numero: 1, titulo: "Do Objeto e Localização", tipo: "essencial", conteudo: "O presente contrato tem por objeto o arrendamento da propriedade rural denominada [NOME DA PROPRIEDADE], inscrita no CCIR n.º [NÚMERO], localizada no Município de [MUNICÍPIO], Estado de [ESTADO], com área total de [ÁREA] hectares." },
    { numero: 2, titulo: "Da Destinação", tipo: "essencial", conteudo: "A área arrendada destina-se exclusivamente à exploração [AGRÍCOLA/PECUÁRIA/MISTA], sendo vedada qualquer alteração de destinação sem prévia e expressa autorização do ARRENDADOR." },
    { numero: 3, titulo: "Do Prazo", tipo: "essencial", conteudo: "O prazo de arrendamento é de [PRAZO], nos termos do art. 13 do Decreto n.º 59.566/66, iniciando-se em [DATA INÍCIO] e encerrando-se em [DATA FIM]." },
    { numero: 4, titulo: "Do Preço e Pagamento", tipo: "essencial", conteudo: "O preço do arrendamento é de [VALOR EM REAIS OU SACAS], a ser pago em [FORMA], conforme disposto no art. 18 do Estatuto da Terra (Lei n.º 4.504/64)." },
    { numero: 5, titulo: "Da Impenhorabilidade", tipo: "essencial", conteudo: "A pequena propriedade rural, assim definida em lei (art. 5.º, XXVI, CF/88), quando trabalhada pela família, é impenhorável para pagamento de débitos decorrentes de sua atividade produtiva, ressalvada hipoteca para fins de financiamento agropecuário." },
    { numero: 6, titulo: "Das Benfeitorias", tipo: "negociavel", conteudo: "As benfeitorias necessárias realizadas pelo ARRENDATÁRIO serão indenizadas pelo ARRENDADOR ao término do contrato. As benfeitorias úteis dependem de prévia autorização escrita." },
    { numero: 7, titulo: "Da Preferência na Renovação", tipo: "essencial", conteudo: "O ARRENDATÁRIO terá preferência na renovação do contrato, devendo o ARRENDADOR comunicar-lhe sua intenção de não renovar com antecedência mínima de 6 (seis) meses, conforme art. 95, XII, Estatuto da Terra." },
    { numero: 8, titulo: "Da Rescisão e Retomada", tipo: "essencial", conteudo: "O ARRENDADOR poderá retomar o imóvel para exploração direta ou por seus familiares, observadas as hipóteses e prazos previstos no art. 95, VI do Estatuto da Terra." },
    { numero: 9, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE], Estado de [ESTADO], competente para o julgamento das causas que envolvam litígios entre posseiros e proprietários rurais, nos termos da Lei n.º 4.947/66." },
  ],

  parceria_agricola: [
    { numero: 1, titulo: "Do Objeto", tipo: "essencial", conteudo: "O presente instrumento tem por objeto a celebração de parceria agrícola para a exploração de [CULTURA/ATIVIDADE] na propriedade denominada [NOME], conforme art. 96 do Estatuto da Terra." },
    { numero: 2, titulo: "Da Participação nos Frutos", tipo: "essencial", conteudo: "Os frutos da parceria serão divididos na proporção de [X%] para o PARCEIRO-OUTORGANTE (proprietário) e [Y%] para o PARCEIRO-OUTORGADO (lavrador), sendo vedado percentual inferior a 25% para o outorgado por força do art. 96, VI, 'a' do Estatuto da Terra." },
    { numero: 3, titulo: "Do Prazo", tipo: "essencial", conteudo: "O prazo da parceria é de [PRAZO], iniciando-se em [DATA] e encerrando-se após a colheita da última safra do período." },
    { numero: 4, titulo: "Dos Insumos e Despesas", tipo: "negociavel", conteudo: "Os insumos e despesas de produção serão custeados na proporção de [X%] pelo OUTORGANTE e [Y%] pelo OUTORGADO, conforme discriminado no Anexo I." },
    { numero: 5, titulo: "Do Foro", tipo: "essencial", conteudo: "As partes elegem o foro da Comarca de [CIDADE/ESTADO] para dirimir eventuais conflitos." },
  ],

  honorarios_advocaticios: [
    { numero: 1, titulo: "Do Objeto", tipo: "essencial", conteudo: "O presente contrato tem por objeto a prestação de serviços advocatícios pelo ADVOGADO ao CLIENTE, nos termos do art. 22 da Lei n.º 8.906/94 (EOAB)." },
    { numero: 2, titulo: "Do Serviço Contratado", tipo: "essencial", conteudo: "O ADVOGADO compromete-se a [DESCREVER ESCOPO: patrocinar a ação/orientação jurídica/elaboração de peças], referente a [DESCREVER A CAUSA/MATÉRIA]." },
    { numero: 3, titulo: "Dos Honorários", tipo: "essencial", conteudo: "Os honorários advocatícios são fixados em R$ [VALOR], sendo: (a) R$ [VALOR INICIAL] a título de honorários de contratação, pagos no ato; e (b) R$ [VALOR ÊXITO] a título de honorários de êxito, condicionados ao resultado favorável." },
    { numero: 4, titulo: "Das Despesas Processuais", tipo: "essencial", conteudo: "As despesas processuais (custas, diligências, perícias, etc.) correrão por conta do CLIENTE e serão custeadas mediante prévia comunicação e aprovação." },
    { numero: 5, titulo: "Da Revogação do Mandato", tipo: "essencial", conteudo: "A revogação do mandato pelo CLIENTE não o exime do pagamento dos honorários pelos serviços já prestados e pelo trabalho necessário até a substituição (art. 1.025, CC e Código de Ética da OAB)." },
    { numero: 6, titulo: "Do Sigilo Profissional", tipo: "essencial", conteudo: "O ADVOGADO está obrigado ao sigilo profissional, nos termos do art. 37 do Código de Ética e Disciplina da OAB." },
    { numero: 7, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Seccional da OAB e, subsidiariamente, o foro da Comarca de [CIDADE] para dirimir conflitos." },
  ],

  compra_venda: [
    { numero: 1, titulo: "Do Objeto", tipo: "essencial", conteudo: "O VENDEDOR vende ao COMPRADOR o bem descrito no Anexo I, pelo preço e condições estabelecidos neste instrumento." },
    { numero: 2, titulo: "Do Preço e Pagamento", tipo: "essencial", conteudo: "O preço total é de R$ [VALOR], a ser pago conforme cronograma constante do Anexo II." },
    { numero: 3, titulo: "Da Tradição e Transferência de Domínio", tipo: "essencial", conteudo: "A tradição do bem objeto deste contrato dar-se-á no ato da quitação integral do preço, ocasião em que ocorrerá a transferência definitiva da propriedade." },
    { numero: 4, titulo: "Da Garantia", tipo: "negociavel", conteudo: "O VENDEDOR responde pelos vícios redibitórios ocultos que tornem o bem impróprio ao uso a que se destina, pelo prazo previsto no art. 445 do Código Civil." },
    { numero: 5, titulo: "Da Rescisão e Multa", tipo: "negociavel", conteudo: "O descumprimento injustificado de qualquer cláusula sujeitará a parte infratora ao pagamento de multa correspondente a [X%] do valor total do contrato." },
    { numero: 6, titulo: "Do Foro", tipo: "essencial", conteudo: "As partes elegem o foro da Comarca de [CIDADE/ESTADO]." },
  ],

  locacao: [
    { numero: 1, titulo: "Do Objeto", tipo: "essencial", conteudo: "O LOCADOR cede ao LOCATÁRIO o imóvel situado à [ENDEREÇO COMPLETO], pelo prazo e valor estabelecidos neste contrato." },
    { numero: 2, titulo: "Do Prazo", tipo: "essencial", conteudo: "A locação é celebrada pelo prazo de [PRAZO], iniciando-se em [DATA INÍCIO] e encerrando-se em [DATA FIM], aplicando-se subsidiariamente a Lei n.º 8.245/91." },
    { numero: 3, titulo: "Do Aluguel", tipo: "essencial", conteudo: "O aluguel mensal é de R$ [VALOR], a ser pago até o dia [DIA] de cada mês, com reajuste anual pelo IGPM ou índice substituto." },
    { numero: 4, titulo: "Da Garantia Locatícia", tipo: "essencial", conteudo: "Como garantia, fica estabelecido [CAUÇÃO/FIANÇA/SEGURO FIANÇA], nos termos do art. 37 da Lei n.º 8.245/91." },
    { numero: 5, titulo: "Das Obrigações do Locatário", tipo: "essencial", conteudo: "Compete ao LOCATÁRIO: pagar pontualmente o aluguel; conservar o imóvel; não sublocar sem autorização; restituir o imóvel no estado em que o recebeu." },
    { numero: 6, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO], com renúncia a qualquer outro." },
  ],

  confissao_divida: [
    { numero: 1, titulo: "Do Reconhecimento da Dívida", tipo: "essencial", conteudo: "O DEVEDOR reconhece e confessa dever ao CREDOR a quantia de R$ [VALOR], proveniente de [ORIGEM DA DÍVIDA], constitutiva de título executivo extrajudicial (art. 784, III, CPC)." },
    { numero: 2, titulo: "Do Prazo e Forma de Pagamento", tipo: "essencial", conteudo: "O pagamento será realizado em [Nº] parcelas de R$ [VALOR PARCELA], vencendo-se a primeira em [DATA] e as demais no mesmo dia dos meses subsequentes." },
    { numero: 3, titulo: "Dos Encargos Moratórios", tipo: "essencial", conteudo: "O inadimplemento de qualquer parcela acarretará incidência de multa de 2%, juros de 1% ao mês e correção monetária pelo IPCA." },
    { numero: 4, titulo: "Da Garantia", tipo: "negociavel", conteudo: "Em garantia do pagamento, o DEVEDOR oferece [DESCREVER GARANTIA], avaliada em R$ [VALOR]." },
    { numero: 5, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO], renunciando as partes a qualquer outro." },
  ],

  comodato: [
    { numero: 1, titulo: "Do Objeto", tipo: "essencial", conteudo: "O COMODANTE empresta gratuitamente ao COMODATÁRIO o bem descrito no Anexo I, para uso pelo prazo e fins estipulados." },
    { numero: 2, titulo: "Do Prazo e Destinação", tipo: "essencial", conteudo: "O comodato tem prazo de [PRAZO], destinando-se exclusivamente a [FINALIDADE], sendo vedado uso diverso." },
    { numero: 3, titulo: "Da Conservação e Devolução", tipo: "essencial", conteudo: "O COMODATÁRIO obriga-se a conservar o bem com o mesmo cuidado que dispensaria ao seu próprio, devolvendo-o ao término do prazo no mesmo estado em que foi recebido (art. 582, CC)." },
    { numero: 4, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO]." },
  ],

  cessao_direitos: [
    { numero: 1, titulo: "Do Objeto da Cessão", tipo: "essencial", conteudo: "O CEDENTE cede e transfere ao CESSIONÁRIO, em caráter [ONEROSO/GRATUITO], todos os direitos que possui sobre [DESCREVER DIREITOS/CRÉDITOS]." },
    { numero: 2, titulo: "Do Preço", tipo: "negociavel", conteudo: "Pela cessão, o CESSIONÁRIO paga ao CEDENTE o valor de R$ [VALOR]." },
    { numero: 3, titulo: "Da Notificação do Devedor", tipo: "essencial", conteudo: "A cessão de crédito produz efeitos em relação ao devedor desde que a ele notificada, nos termos do art. 290 do Código Civil." },
    { numero: 4, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO]." },
  ],

  nda_confidencialidade: [
    { numero: 1, titulo: "Das Informações Confidenciais", tipo: "essencial", conteudo: "As partes consideram confidenciais todas as informações técnicas, comerciais, jurídicas, financeiras e estratégicas que trocarem no contexto de [DESCREVER RELAÇÃO/PROJETO]." },
    { numero: 2, titulo: "Das Obrigações de Confidencialidade", tipo: "essencial", conteudo: "Cada parte obriga-se a: (i) manter sigilo absoluto; (ii) utilizar as informações somente para os fins do presente instrumento; (iii) não divulgar a terceiros sem consentimento prévio e escrito." },
    { numero: 3, titulo: "Das Exceções", tipo: "essencial", conteudo: "As obrigações de confidencialidade não se aplicam a informações: (i) já públicas; (ii) desenvolvidas independentemente; (iii) cuja divulgação seja determinada por lei ou decisão judicial." },
    { numero: 4, titulo: "Da Vigência", tipo: "essencial", conteudo: "As obrigações de confidencialidade vigoram pelo prazo de [PRAZO] anos, mesmo após extinção de qualquer relação jurídica entre as partes." },
    { numero: 5, titulo: "Das Penalidades", tipo: "negociavel", conteudo: "O descumprimento das obrigações de confidencialidade sujeitará a parte infratora ao pagamento de multa de R$ [VALOR] por evento, além de perdas e danos." },
    { numero: 6, titulo: "Do Foro", tipo: "essencial", conteudo: "As partes elegem o foro da Comarca de [CIDADE/ESTADO]." },
  ],

  society_constituicao: [
    { numero: 1, titulo: "Do Tipo Societário e Denominação", tipo: "essencial", conteudo: "As partes resolvem constituir uma [SOCIEDADE SIMPLES/LTDA/SA], sob a denominação [NOME DA EMPRESA], nos termos dos arts. [ARTIGOS APLICÁVEIS] do Código Civil." },
    { numero: 2, titulo: "Do Capital Social", tipo: "essencial", conteudo: "O capital social é de R$ [VALOR], dividido em [Nº] cotas, sendo [Nº] cotas pertencentes a [SÓCIO A] e [Nº] cotas a [SÓCIO B]." },
    { numero: 3, titulo: "Do Objeto Social", tipo: "essencial", conteudo: "A sociedade terá por objeto: [DESCREVER OBJETO]." },
    { numero: 4, titulo: "Da Administração", tipo: "essencial", conteudo: "A administração da sociedade caberá a [SÓCIO/ADMINISTRADOR], que a representará ativa e passivamente." },
    { numero: 5, titulo: "Da Distribuição de Lucros", tipo: "essencial", conteudo: "Os lucros e perdas serão distribuídos na proporção das cotas de cada sócio." },
    { numero: 6, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO] para dirimir conflitos societários." },
  ],

  empreitada: [
    { numero: 1, titulo: "Do Objeto e Especificações", tipo: "essencial", conteudo: "O presente contrato tem por objeto a execução de [DESCREVER OBRA/SERVIÇO], conforme memorial descritivo, projetos e especificações técnicas constantes do Anexo I." },
    { numero: 2, titulo: "Do Preço e Modalidade", tipo: "essencial", conteudo: "O preço total da empreitada é de R$ [VALOR], na modalidade [POR PREÇO GLOBAL/POR MEDIÇÃO], com pagamento conforme cronograma físico-financeiro do Anexo II." },
    { numero: 3, titulo: "Do Prazo de Execução", tipo: "essencial", conteudo: "O prazo de execução é de [PRAZO] dias corridos a partir da emissão da Ordem de Serviço, admitida prorrogação por caso fortuito, força maior ou alteração de escopo formalizada." },
    { numero: 4, titulo: "Da Responsabilidade Técnica", tipo: "essencial", conteudo: "A EMPREITEIRA responde pela solidez e segurança da obra por 5 (cinco) anos, nos termos do art. 618 do Código Civil, incluídos os vícios ocultos." },
    { numero: 5, titulo: "Das Alterações de Escopo", tipo: "negociavel", conteudo: "Quaisquer alterações de escopo deverão ser formalizadas por aditivo contratual, com reajuste de prazo e preço proporcionais." },
    { numero: 6, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO] para dirimir quaisquer controvérsias." },
  ],

  representacao_comercial: [
    { numero: 1, titulo: "Do Objeto da Representação", tipo: "essencial", conteudo: "O REPRESENTANTE promove, em caráter não exclusivo/exclusivo, por conta e risco do REPRESENTADO, a colocação de pedidos dos produtos/serviços descritos no Anexo I, na zona geográfica do Anexo II." },
    { numero: 2, titulo: "Da Comissão", tipo: "essencial", conteudo: "O REPRESENTANTE fará jus à comissão de [X]% sobre o valor líquido de cada pedido aceito e adimplido, creditada até o [X]º dia útil do mês seguinte ao recebimento." },
    { numero: 3, titulo: "Das Obrigações do Representante", tipo: "essencial", conteudo: "O REPRESENTANTE obriga-se a: (i) dedicar esforços à promoção dos produtos; (ii) prestar contas mensalmente; (iii) não representar produtos concorrentes na mesma zona." },
    { numero: 4, titulo: "Da Indenização Rescisória", tipo: "essencial", conteudo: "A rescisão imotivada pelo REPRESENTADO assegura ao REPRESENTANTE indenização de 1/12 das comissões auferidas durante toda a vigência, nos termos do art. 27, j, da Lei 4.886/65." },
    { numero: 5, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO]." },
  ],

  joint_venture: [
    { numero: 1, titulo: "Do Objeto e Propósito", tipo: "essencial", conteudo: "As partes constituem entre si uma associação (joint venture) sem personalidade jurídica, com o propósito específico de [DESCREVER PROJETO/NEGÓCIO], pelo prazo previsto neste instrumento." },
    { numero: 2, titulo: "Da Participação e Aportes", tipo: "essencial", conteudo: "Cada parte aportará os recursos descritos no Anexo I, sendo a participação de [X]% para [PARTE A] e [Y]% para [PARTE B] nos resultados e responsabilidades." },
    { numero: 3, titulo: "Da Gestão e Decisões", tipo: "essencial", conteudo: "As decisões estratégicas exigem aprovação unânime ou por quórum de [X]%. A gestão operacional caberá a [GESTOR DESIGNADO], com poderes definidos em Anexo." },
    { numero: 4, titulo: "Da Distribuição de Resultados", tipo: "essencial", conteudo: "Os lucros e perdas serão distribuídos na proporção das participações, após dedução de custos operacionais e reservas acordadas." },
    { numero: 5, titulo: "Da Dissolução", tipo: "essencial", conteudo: "A joint venture se dissolve pelo término do projeto, pelo mútuo acordo ou por resolução judicial, com apuração e liquidação dos ativos e passivos comuns." },
    { numero: 6, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO]." },
  ],

  acordo_acionistas: [
    { numero: 1, titulo: "Do Objeto", tipo: "essencial", conteudo: "O presente Acordo de Acionistas disciplina o exercício do direito de voto e o direito de preferência na alienação de ações da [NOME DA SOCIEDADE], nos termos do art. 118 da Lei 6.404/76." },
    { numero: 2, titulo: "Do Tag Along e Drag Along", tipo: "essencial", conteudo: "Em caso de alienação de controle, os demais signatários têm direito de vender suas ações nas mesmas condições (tag along). O controlador poderá exigir venda conjunta (drag along) mediante notificação prévia." },
    { numero: 3, titulo: "Do Direito de Primeira Oferta (ROFR)", tipo: "negociavel", conteudo: "Antes de alienar ações a terceiros, o acionista alienante deverá ofertá-las aos demais signatários pelo mesmo preço e condições, que terão [X] dias para exercer o direito." },
    { numero: 4, titulo: "Do Voto em Bloco", tipo: "negociavel", conteudo: "Os signatários obrigam-se a votar em bloco nas deliberações sobre matérias elencadas no Anexo I, conforme orientação prévia acordada." },
    { numero: 5, titulo: "Do Prazo", tipo: "essencial", conteudo: "O presente acordo vigorará por [PRAZO] anos, renovando-se automaticamente por iguais períodos salvo denúncia com antecedência de [X] meses." },
    { numero: 6, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO]." },
  ],

  licenciamento_software: [
    { numero: 1, titulo: "Do Objeto da Licença", tipo: "essencial", conteudo: "O LICENCIANTE concede ao LICENCIADO uma licença [EXCLUSIVA/NÃO EXCLUSIVA] e intransferível para uso do software [NOME DO SOFTWARE], versão [X], conforme documentação técnica do Anexo I." },
    { numero: 2, titulo: "Do Escopo e Restrições de Uso", tipo: "essencial", conteudo: "O LICENCIADO poderá instalar o software em [Nº] dispositivos/usuários. É expressamente vedada a cópia, sublicença, engenharia reversa ou qualquer forma de redistribuição." },
    { numero: 3, titulo: "Do Preço e Forma de Pagamento", tipo: "essencial", conteudo: "Pela licença, o LICENCIADO pagará [VALOR ÚNICO/ASSINATURA MENSAL/ANUAL] de R$ [VALOR], conforme cronograma do Anexo II." },
    { numero: 4, titulo: "Do Suporte e Atualizações", tipo: "negociavel", conteudo: "O LICENCIANTE prestará suporte técnico por [CANAIS/PRAZO] e disponibilizará atualizações de segurança sem custo adicional durante a vigência." },
    { numero: 5, titulo: "Da Propriedade Intelectual", tipo: "essencial", conteudo: "O software é de propriedade exclusiva do LICENCIANTE, protegido pela Lei 9.609/98 (Lei do Software). A licença não implica cessão de qualquer direito de propriedade intelectual." },
    { numero: 6, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO]." },
  ],

  outro: [
    { numero: 1, titulo: "Do Objeto", tipo: "essencial", conteudo: "O presente contrato tem por objeto [DESCREVER OBJETO]." },
    { numero: 2, titulo: "Das Obrigações das Partes", tipo: "essencial", conteudo: "As partes obrigam-se a cumprir os termos e condições estabelecidos neste instrumento de boa-fé." },
    { numero: 3, titulo: "Do Prazo", tipo: "essencial", conteudo: "O prazo de vigência do presente instrumento é de [PRAZO]." },
    { numero: 4, titulo: "Do Foro", tipo: "essencial", conteudo: "Fica eleito o foro da Comarca de [CIDADE/ESTADO]." },
  ],
};
