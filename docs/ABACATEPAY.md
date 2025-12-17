# AbacatePay - Documentação Completa

**Base URL:** `https://api.abacatepay.com/v1`
**Dashboard:** https://www.abacatepay.com/app
**Docs oficiais:** https://docs.abacatepay.com

---

## 1. Autenticação

Todas as requisições usam **Bearer Token** no header:

```
Authorization: Bearer <sua_api_key>
```

### Obter API Key:
1. Acesse o Dashboard → Integrações
2. Clique em "Criar Key"
3. Adicione uma descrição
4. Copie e guarde com segurança

> O mesmo endpoint serve dev e produção. O ambiente é determinado pela chave usada.

---

## 2. Dev Mode (Ambiente de Testes)

### Características:
- Ativado automaticamente ao criar conta
- Todas as operações são simuladas
- Nenhuma transação real é processada
- Dados isolados da produção

### Para ir para Produção:
1. Desativar Dev Mode no dashboard
2. Completar verificação da conta
3. Aguardar aprovação
4. Começar a processar transações reais

---

## 3. Endpoints da API

### 3.1 PIX QRCode

#### Criar QR Code PIX
```
POST /pixQrCode/create
```

**Parâmetros:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| amount | number | Sim | Valor em centavos |
| expiresIn | number | Não | Tempo de expiração em segundos |
| description | string | Não | Mensagem (max 140 chars) |
| customer | object | Não | Dados do cliente |
| metadata | object | Não | Dados extras |

**Customer (se informado, todos são obrigatórios):**
```json
{
  "name": "Nome Completo",
  "cellphone": "(11) 99999-9999",
  "email": "email@exemplo.com",
  "taxId": "123.456.789-00"
}
```

**Resposta:**
```json
{
  "data": {
    "id": "pix_char_123456",
    "amount": 1000,
    "status": "PENDING",
    "brCode": "00020101021226...",
    "brCodeBase64": "data:image/png;base64,...",
    "platformFee": 80,
    "createdAt": "2025-01-01T00:00:00Z",
    "expiresAt": "2025-01-02T00:00:00Z"
  }
}
```

#### Consultar Status
```
GET /pixQrCode/check?id=pix_char_123456
```

**Resposta:**
```json
{
  "data": {
    "status": "PENDING|EXPIRED|CANCELLED|PAID|REFUNDED",
    "expiresAt": "2025-01-02T00:00:00Z"
  }
}
```

#### Simular Pagamento (Dev Mode)
```
POST /pixQrCode/simulate-payment?id=pix_char_123456
```

**Body:**
```json
{
  "metadata": {}
}
```

---

### 3.2 Billing (Cobranças com Checkout)

#### Criar Cobrança
```
POST /billing/create
```

**Parâmetros:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| frequency | enum | Sim | `ONE_TIME` ou `MULTIPLE_PAYMENTS` |
| methods | array | Sim | `["PIX"]` e/ou `["CARD"]` (beta) |
| products | array | Sim | Lista de produtos |
| returnUrl | URI | Sim | URL ao clicar "voltar" |
| completionUrl | URI | Sim | URL após pagamento |
| customerId | string | Não | ID de cliente existente |
| customer | object | Não | Criar novo cliente |
| allowCoupons | boolean | Não | Permitir cupons (default: false) |
| coupons | array | Não | Lista de códigos de cupom |
| metadata | object | Não | Dados extras |

**Produto:**
```json
{
  "externalId": "prod-001",
  "name": "Nome do Produto",
  "quantity": 1,
  "price": 1000,
  "description": "Descrição opcional"
}
```

**Resposta:**
```json
{
  "data": {
    "id": "bill_123456",
    "url": "https://pay.abacatepay.com/bill-xxx",
    "status": "PENDING",
    "devMode": true,
    "methods": ["PIX"],
    "products": [...],
    "frequency": "ONE_TIME",
    "amount": 1000,
    "customer": {...}
  }
}
```

#### Listar Cobranças
```
GET /billing/list
```

---

### 3.3 Customer (Clientes)

#### Criar Cliente
```
POST /customer/create
```

**Parâmetros (todos obrigatórios):**
```json
{
  "name": "Nome Completo",
  "email": "email@exemplo.com",
  "cellphone": "(11) 99999-9999",
  "taxId": "123.456.789-00"
}
```

#### Listar Clientes
```
GET /customer/list
```

---

### 3.4 Coupon (Cupons)

#### Criar Cupom
```
POST /coupon/create
```

#### Listar Cupons
```
GET /coupon/list
```

---

### 3.5 Withdraw (Saques)

#### Criar Saque
```
POST /withdraw/create
```

#### Consultar Saque
```
GET /withdraw/get
```

#### Listar Saques
```
GET /withdraw/list
```

---

### 3.6 Store (Loja)

#### Obter Dados da Loja
```
GET /store/get
```

---

## 4. Webhooks

### Configuração:
1. Acesse Dashboard → Webhooks
2. Preencha: Nome, URL (HTTPS), Secret

### Validação de Segurança (2 camadas):

**Camada 1 - Query Parameter:**
```
?webhookSecret=seu_secret_aqui
```

**Camada 2 - HMAC-SHA256:**
```javascript
const crypto = require('crypto');

const expectedSig = crypto
  .createHmac("sha256", ABACATEPAY_PUBLIC_KEY)
  .update(rawBody)
  .digest("base64");

// Usar crypto.timingSafeEqual() para comparar
```

### Eventos Disponíveis:

#### `billing.paid`
Disparado quando pagamento é confirmado.

```json
{
  "id": "event_123",
  "devMode": true,
  "event": "billing.paid",
  "data": {
    "amount": 1000,
    "fee": 80,
    "method": "PIX",
    "billing": {
      "id": "bill_xxx",
      "products": [...],
      "customer": {...}
    }
  }
}
```

#### `withdraw.done`
Disparado quando saque é concluído.

```json
{
  "event": "withdraw.done",
  "data": {
    "id": "withdraw_xxx",
    "status": "COMPLETE",
    "amount": 5000,
    "platformFee": 100,
    "receiptUrl": "https://..."
  }
}
```

#### `withdraw.failed`
Disparado quando saque falha.

```json
{
  "event": "withdraw.failed",
  "data": {
    "id": "withdraw_xxx",
    "status": "CANCELLED"
  }
}
```

---

## 5. Status de Pagamento

| Status | Descrição |
|--------|-----------|
| PENDING | Aguardando pagamento |
| EXPIRED | Expirado |
| CANCELLED | Cancelado |
| PAID | Pago |
| REFUNDED | Reembolsado |

---

## 6. Valores Monetários

> Todos os valores são em **centavos** (1 real = 100 centavos)

Exemplos:
- R$ 10,00 = 1000
- R$ 1,50 = 150
- R$ 0,99 = 99

---

## 7. Idempotência

A API suporta requisições idempotentes - você pode executar a mesma requisição múltiplas vezes sem efeitos colaterais.

---

## 8. Diferença: PIX QRCode vs Billing

| Característica | PIX QRCode | Billing |
|----------------|------------|---------|
| ID retornado | `pix_char_xxx` | `bill_xxx` |
| Interface | QR Code direto | Checkout hospedado |
| Simulação Dev | Sim | Não |
| Métodos | Só PIX | PIX e Cartão |
| URL de pagamento | Não | Sim |

**Use PIX QRCode para:** testes com simulação, integração direta
**Use Billing para:** checkout completo, múltiplos métodos

---

## 9. Exemplo de Fluxo de Teste

```bash
# 1. Criar QR Code PIX
curl -X POST https://api.abacatepay.com/v1/pixQrCode/create \
  -H "Authorization: Bearer SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount": 1000}'

# Resposta: {"data": {"id": "pix_char_abc123", ...}}

# 2. Simular pagamento (Dev Mode)
curl -X POST "https://api.abacatepay.com/v1/pixQrCode/simulate-payment?id=pix_char_abc123" \
  -H "Authorization: Bearer SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"metadata": {}}'

# 3. Verificar status
curl -X GET "https://api.abacatepay.com/v1/pixQrCode/check?id=pix_char_abc123" \
  -H "Authorization: Bearer SUA_API_KEY"
```

---

## 10. Suporte

Email: contato@abacatepay.com
GitHub: https://github.com/AbacatePay
