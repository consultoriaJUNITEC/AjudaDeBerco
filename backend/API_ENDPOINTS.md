# Guia Completo de Endpoints da API Ajuda de Berço

Este documento apresenta exemplos práticos de como interagir com os endpoints da API, incluindo autenticação, produtos, carrinhos, doadores e funcionalidades de websocket.

## Autenticação

### Login
```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{"password": "senha123"}'
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI...",
  "expires_at": "2025-05-29T12:00:00Z"
}
```

### Verificar Autenticação
```bash
curl -X GET http://localhost:8080/login \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

**Observação**: O token JWT gerado no login tem validade limitada e expira automaticamente. Não há necessidade de fazer logout explicitamente.

## Produtos

### Listar Produtos
```bash
curl -X GET http://localhost:8080/products
```

### Obter Produto por ID
```bash
curl -X GET http://localhost:8080/products/1
```

### Criar Produto
```bash
curl -X POST http://localhost:8080/products \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"id": "10", "name": "Café", "unit": "kg"}'
```

### Atualizar Produto
```bash
curl -X PUT http://localhost:8080/products/10 \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name": "Café Premium", "unit": "kg", "position_x": 100, "position_y": 200}'
```

### Eliminar Produto
```bash
curl -X DELETE http://localhost:8080/products/10 \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## Doadores

### Listar Doadores
```bash
curl -X GET http://localhost:8080/donors
```

### Obter Doador por ID
```bash
curl -X GET http://localhost:8080/donors/1
```

### Criar Doador
```bash
curl -X POST http://localhost:8080/donors \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"id": "10", "name": "Ana Silva"}'
```

### Atualizar Doador
```bash
curl -X PUT http://localhost:8080/donors/10 \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"name": "Ana Maria Silva"}'
```

### Eliminar Doador
```bash
curl -X DELETE http://localhost:8080/donors/10 \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

## Procura

O endpoint de procura pode ser usado tanto para procurar por nome quanto por ID, dependendo do parâmetro fornecido.

### Procurar Produtos por Nome
```bash
curl -X GET "http://localhost:8080/search/products?name=cafe"
```

### Procurar Produtos por ID
```bash
curl -X GET "http://localhost:8080/search/products?id=10"
```

### Procurar Doadores por Nome
```bash
curl -X GET "http://localhost:8080/search/donors?name=silva"
```

### Procurar Doadores por ID
```bash
curl -X GET "http://localhost:8080/search/donors?id=10"
```

**Observação**: Os endpoints GET de produtos (`/products` e `/products/{id}`) e o endpoint de busca (`/search/products`) não requerem autenticação. Todas as outras operações em produtos (POST, PUT, DELETE) precisam do token JWT.

## Carrinhos

### Listar Todos os Carrinhos
```bash
curl -X GET http://localhost:8080/cars \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### Criar Novo Carrinho
```bash
curl -X POST http://localhost:8080/cars/create \
  -H "Content-Type: application/json" \
  -d '{"password": "senha_admin_ou_voluntario", "type": "Entrada"}'
```

**Observação**: Para criar um carrinho, é necessário fornecer a senha de admin ou voluntário diretamente no pedido. O tipo pode ser "Entrada" ou "Saída".

### Obter Carrinho por ID
```bash
curl -X GET "http://localhost:8080/cars/get?id=carrinho123"
```

### Adicionar Produto ao Carrinho
```bash
curl -X POST "http://localhost:8080/cars/add-product?id=carrinho123" \
  -H "Content-Type: application/json" \
  -d '{
    "product_id": "10", 
    "quantity": 2, 
    "expiration_date": "2025-05-15T00:00:00Z"
  }'
```
**Importante**: A data de expiração (`expiration_date`) é obrigatória e deve estar no formato ISO 8601.

### Remover Produto do Carrinho
```bash
# Remover produto específico com data de expiração
curl -X DELETE "http://localhost:8080/cars/remove-product?car_id=carrinho123&product_id=10&expiration_date=2025-05-15T00:00:00Z"

# Remover todas as unidades de um produto (independente da data de expiração)
curl -X DELETE "http://localhost:8080/cars/remove-product?car_id=carrinho123&product_id=10"
```

### Atualizar Quantidade de Produto
```bash
curl -X PUT "http://localhost:8080/cars/update-quantity?car_id=carrinho123&product_id=10" \
  -H "Content-Type: application/json" \
  -d '{
    "quantity": 5,
    "expiration_date": "2025-05-15T00:00:00Z"
  }'
```

**Observação**: As operações de carrinho não requerem token JWT, com exceção da listagem de todos os carrinhos e criação de carrinhos que requer autenticação por senha.

## WebSocket

A API também fornece comunicação em tempo real via WebSocket para atualizações de carrinhos.

### Conectar ao WebSocket
```javascript
// Exemplo em JavaScript
const socket = new WebSocket(`ws://localhost:8080/ws?id_car=carrinho123`);

socket.onopen = () => {
  console.log("Conectado ao WebSocket");
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Mensagem recebida:", data);
};
```

### Mensagens do WebSocket

#### Solicitar Dados do Carrinho
```javascript
socket.send(JSON.stringify({
  action: "GetCar",
  id_car: "carrinho123"
}));
```

#### Adicionar Produto ao Carrinho
```javascript
socket.send(JSON.stringify({
  action: "AddProductCar",
  id_car: "carrinho123",
  id_product: "10",
  quantity: 2,
  expiration: "2025-05-15T00:00:00Z",
  description: "Descrição opcional"
}));
```

#### Remover Produto do Carrinho
```javascript
socket.send(JSON.stringify({
  action: "DeleteProductCar",
  id_car: "carrinho123",
  id: 1 // ID do produto no carrinho
}));
```

#### Notificar Exportação
```javascript
socket.send(JSON.stringify({
  action: "Export",
  id_car: "carrinho123"
}));
```

**Observação**: O servidor envia mensagens de atualização com a ação "UpdateCar" para todos os clientes conectados ao mesmo ID de carrinho sempre que houver alterações nos produtos do carrinho.

## Limpeza Automática

Os carrinhos são automaticamente limpos a cada 24 horas às 00:00 (meia-noite) no horário de Lisboa. Carrinhos antigos são removidos do sistema.

