# Arquitetura do Sistema

## Visão geral
Arquitetura modular orientada a domínio.

## Camadas
- Interface (UI)
- Aplicação (casos de uso)
- Domínio (regras de negócio)
- Infraestrutura (APIs, IA, storage)

## Diretrizes
- desacoplamento entre módulos
- escalabilidade
- separação de responsabilidades
- tipagem forte

## Stack sugerida
- Next.js
- TypeScript
- Tailwind
- Node.js

## Organização
```
/src
  /modules
  /components
  /lib
  /services
```
