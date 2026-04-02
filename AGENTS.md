# AGENTS.md

## Projeto
HUB JGG Group

Plataforma jurídica web com arquitetura modular e expansão progressiva, focada inicialmente no módulo de Petições, mas já preparada para comportar Contratos, Jurisprudência, Gestão, Atendimento, BI e Administração.

## Objetivo do produto
Centralizar a operação jurídica em um único ambiente com apoio de agentes de IA especializados, garantindo:
- produtividade
- padronização
- rastreabilidade
- revisão humana
- base de conhecimento própria
- expansão por módulos

## Princípios obrigatórios
1. O sistema deve ser modular e escalável.
2. O módulo de Petições é o foco inicial do MVP.
3. O redator final nunca deve ser o primeiro leitor do caso.
4. Sempre separar análise documental, extração de fatos, estratégia e redação.
5. Toda saída jurídica crítica exige revisão humana.
6. Toda geração deve deixar rastros auditáveis.
7. O sistema deve suportar múltiplos perfis de acesso.
8. A interface deve nascer pronta para módulos futuros, mesmo que inicialmente estejam apenas como placeholders.
9. A arquitetura deve permitir especialização por matéria e por tipo de peça.
10. A base jurídica deve ser desacoplada da camada visual.

## Escopo atual
Implementar a estrutura inicial da plataforma com foco em:
- autenticação simulada ou inicial
- layout principal
- navegação completa do HUB
- cadastro/listagem de casos
- upload e exibição de documentos
- módulo Petições como primeiro fluxo funcional
- pipeline visual da peça
- editor de minuta
- histórico de versões mockado
- documentação técnica base

## Módulos da plataforma
- Dashboard
- Petições
- Casos
- Documentos
- Biblioteca Jurídica
- Contratos
- Jurisprudência
- Gestão
- Clientes
- BI
- Administração

## Estados dos módulos
Cada módulo deve suportar estes estados:
- ativo
- em implantação
- planejado

## Regras do módulo Petições
1. O módulo Petições não é apenas um gerador de texto.
2. Ele deve funcionar como centro de produção jurídica.
3. O pipeline deve prever:
   - classificação
   - leitura documental
   - extração de fatos
   - análise adversa
   - análise documental do cliente
   - estratégia jurídica
   - pesquisa de apoio
   - redação
   - revisão
   - aprovação
4. Mesmo que parte desse pipeline esteja mockada no início, a estrutura deve existir.
5. O editor da minuta deve estar preparado para comparação entre versões.

## Especialização do agente de petições
A arquitetura deve prever especialização em 3 níveis:
- por matéria
- por tipo de peça
- por base de conhecimento

## Perfis de usuário
- Sócio / Direção
- Coordenador Jurídico
- Advogado
- Estagiário / Assistente
- Operacional / Administrativo
- Administrador do sistema

## Diretrizes de UX
- interface sóbria, profissional e jurídica
- foco em clareza e produtividade
- navegação lateral
- cards por etapa do pipeline
- estados claros de loading, vazio e erro
- histórico e auditoria visíveis quando fizer sentido
- visual moderno, mas sem exageros visuais

## Diretrizes técnicas
- usar TypeScript
- código organizado por domínio
- componentes reutilizáveis
- tipagem explícita
- validação de payloads
- separação entre domínio, aplicação e interface
- preparar o projeto para deploy na Vercel
- preparar o projeto para versionamento profissional no GitHub

## Qualidade mínima obrigatória
Antes de concluir qualquer entrega:
- rodar lint
- rodar typecheck
- garantir build
- evitar hardcode de secrets
- documentar variáveis de ambiente em `.env.example`

## Restrições
- não usar secrets reais
- não assumir integrações reais com tribunais neste primeiro momento
- não acoplar a lógica do produto a uma única implementação de IA
- não construir um único agente genérico para tudo

## Resultado esperado
Entregar uma base sólida, visualmente consistente e tecnicamente organizada, que permita expandir o HUB JGG Group por fases sem reestruturação drástica futura.
