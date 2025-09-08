# Estruturas de Dados do Backend - Ajuda de Berço

Este documento explica como as diferentes entidades do sistema são representadas no backend da aplicação.

## Produtos (Product)

Os produtos representam os itens disponíveis para doação no sistema. Cada produto possui:

```go
type Product struct {
   ID             string `json:"id"`      // Identificador único do produto
   Name           string `json:"name"`    // Nome do produto
   NormalizedName string `json:"-"`       // Campo não exportado para JSON
   Unit           string `json:"unit"`    // Unidade de medida (kg, unidade, litros, etc.)
   Created        string `json:"created"` // Data de criação do registro
}
```

### Observações sobre Produtos:
- O ID é definido manualmente na criação do produto (não é autogerado)
- Produtos são armazenados no banco de dados SQLite
- A unidade (Unit) é importante para definir como o produto é contabilizado no stock

## Carrinhos de Compras (Car)

Os carrinhos representam agrupamentos temporários de produtos que serão processados. A implementação inclui:

```go
// Produto dentro do carrinho, exige mais do que os da Base de Dados
type ProductInCar struct {
   ID             string    `json:"id"`              // ID do produto
   Name           string    `json:"name"`            // Nome do produto
   Quantity       int       `json:"quantity"`        // Quantidade do produto
   Unit           string    `json:"unit"`            // Unidade de medida
   ExpirationDate time.Time `json:"expiration_date"` // Data de validade do produto
}

// Carrinho
type Car struct {
   ID        string                    `json:"id"`         // Identificador único do carrinho
   Products  map[string][]ProductInCar `json:"products"`   // Produtos agrupados por ID e depois por datas de validade
   CreatedAt time.Time                 `json:"created_at"` // Data de criação do carrinho
}
```

### Características dos Carrinhos:
1. **Tempo de Vida Limitado**:
   - Os carrinhos expiram automaticamente após 24 horas de inatividade
   - Existe uma rotina de limpeza que remove carrinhos expirados periodicamente

2. **Estrutura de Armazenamento**:
   - Carrinhos são armazenados em memória (não persistem após reinicialização do servidor)
   - Utiliza-se um `CarStore` global para gerenciar todos os carrinhos:
     ```go
     type CarStore struct {
         cars     map[string]Car       // Mapa de carrinhos por ID
         expiry   map[string]time.Time // Tempo em que expira por ID
         mutex    sync.RWMutex         // Mutex para operações thread-safe
         lifetime time.Duration        // Tempo de vida de um carrinho (24h)
     }
     ```

3. **Produtos com Data de Validade**:
   - Cada produto no carrinho possui uma data de validade (`ExpirationDate`)
   - Produtos com o mesmo ID são agrupados numa lista em que o que distingue elementos da lista é a data de validade

4. **Operações Principais**:
   - Criação de carrinhos com ID específico
   - Adição de produtos com quantidade e data de validade
   - Remoção de produtos (específicos ou todos com mesmo ID)
   - Atualização de quantidade de produtos

## Autenticação

O sistema utiliza autenticação baseada em JWT (JSON Web Tokens)

### Características da Autenticação:
1. **Token JWT**:
   - Gerado após login bem-sucedido
   - Contém o nome do usuário e informações padrão de JWT (tempo de expiração, etc.)
   - Validade de 8 horas

2. **Middleware**:
   - Verifica a presença e validade do token JWT nas requisições
   - Protege rotas que exigem autenticação

3. **Rotas Públicas vs. Protegidas**:
   - Rotas públicas: login, consulta de produtos (GET), busca de produtos
   - Rotas protegidas: criação, atualização e exclusão de produtos (ADMIN)
   - Rotas de carrinhos: atualmente públicas, exceto ao criar

## Considerações de Implementação

1. **Estrutura de Dados em Memória vs. Banco de Dados**:
   - Produtos: persistentes em banco de dados SQLite
   - Carrinhos: armazenados em memória (não persistem após reinicialização)

2. **Controlo de Datas de Validade**:
   - O sistema está preparado para lidar com produtos que possuem prazo de validade

3. **Segurança**:
   - Autenticação baseada em JWT para proteger rotas sensíveis (privilégios: voluntário, admin)
   - As rotas de carrinhos estão temporariamente públicas para fins de desenvolvimento

4. **Escalabilidade**:
   - Se houver necessidade de maior escabilidade mover os carrinhos para uma Base de Dados
