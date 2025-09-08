# Documentação do Sistema de Autenticação

## Visão Geral

O sistema de autenticação tem dois objetivos principais:
- Proteger endpoints da API que requerem autorização
- Validar permissões para criação de carrinhos

O sistema utiliza autenticação por senha e tokens JWT para manter sessões.

## Mecanismos de Segurança

- **Senhas com Hash**: Todas as senhas são protegidas com hash bcrypt (fator 12)
- **Autenticação JWT**: Autenticação stateless usando tokens JWT assinados
- **Expiração de Tokens**: Os tokens JWT expiram automaticamente após 8 horas

## Fluxo de Autenticação

### Login
1. Cliente envia a senha para o endpoint `/login`
2. Servidor verifica contra os hashes armazenados
3. Se válido, gera um token JWT que é retornado ao cliente

### Verificação de Requisições
1. Cliente inclui o token no cabeçalho: `Authorization: Bearer <token>`
2. Servidor extrai, valida a assinatura e verifica expiração
3. Se válido, a requisição prossegue

## Proteção de Endpoint

Os endpoints da API são protegidos por um middleware que verifica cada requisição.

## Autenticação para Criação de Carrinhos

A criação de carrinhos usa um processo simplificado:
1. Cliente envia senha no corpo da requisição para `/cars/create`
2. Servidor verifica contra senhas de admin ou voluntário
3. Se válida, o carrinho é criado

---

O sistema foi projetado para ser seguro mantendo simplicidade.
