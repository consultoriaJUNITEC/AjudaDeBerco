# AjudaDeBerco Backend

Backend API desenvolvido em TypeScript usando Next.js API Routes, baseado na estrutura original em Go.

## Estrutura da API

### Autenticação
- `POST /api/auth/login` - Login com senha
- `POST /api/auth/verify` - Verificar senha/token

### Carrinhos
- `GET /api/cars` - Listar todos os carrinhos (requer autenticação)
- `POST /api/cars/create` - Criar novo carrinho
- `GET /api/cars/get?id={cartId}` - Buscar carrinho por ID
- `POST /api/cars/add-product?cart_id={cartId}` - Adicionar produto ao carrinho
- `DELETE /api/cars/remove-product?cart_id={cartId}` - Remover produto do carrinho
- `PUT /api/cars/update-quantity?cart_id={cartId}` - Atualizar quantidade do produto

### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products/create` - Criar novo produto

### Doadores
- `GET /api/donors` - Listar doadores
- `POST /api/donors/create` - Criar novo doador

### Busca
- `GET /api/search?q={query}&type={type}` - Busca geral (products, donors, all)

### Utilitários
- `GET /api/health` - Health check
- `POST /api/init` - Inicializar banco de dados

## Configuração

### Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local` e configure:

```bash
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/ajudadeberco

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Authentication Configuration (plain text passwords)
ADMIN_PASSWORD=admin123
VOLUNTARIO_PASSWORD=voluntario123

# Development environment
NODE_ENV=development
```

### Instalação

1. Instalar dependências:
```bash
npm install
```

2. Configurar banco de dados PostgreSQL

3. Configurar variáveis de ambiente no arquivo `.env.local`

4. Inicializar o banco de dados:
```bash
curl -X POST http://localhost:3000/api/init
```

5. Executar o projeto:
```bash
npm run dev
```

## Banco de Dados

O sistema usa PostgreSQL com as seguintes tabelas:

- `products` - Produtos do sistema
- `donors` - Doadores
- `cars` - Carrinhos
- `products_car` - Produtos em cada carrinho

## Autenticação

O sistema suporta dois tipos de autenticação:
- Senhas diretas armazenadas nas variáveis de ambiente: `ADMIN_PASSWORD` e `VOLUNTARIO_PASSWORD`
- Tokens JWT (gerados após login bem-sucedido)

### Configuração de Senhas
- As senhas são armazenadas em texto plano nas variáveis de ambiente
- Durante a autenticação, o sistema compara diretamente a senha enviada com as senhas configuradas
- Para produção, é recomendado usar senhas seguras e complexas

## Tipos TypeScript

Todos os tipos estão definidos em:
- `src/types/backend/cars.ts` - Tipos relacionados a carrinhos
- `src/types/backend/products.ts` - Tipos relacionados a produtos
- `src/types/backend/donors.ts` - Tipos relacionados a doadores
- `src/types/backend/auth.ts` - Tipos relacionados à autenticação

## Migração do Go

Este backend foi migrado do original em Go mantendo:
- Mesma estrutura de API
- Mesmos endpoints
- Mesma funcionalidade
- Compatibilidade com frontend existente
