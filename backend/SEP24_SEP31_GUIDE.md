# SEP-24 & SEP-31 Anchor Payment Rails Guide

## Overview

LumenShake implements **SEP-24 (Interactive Payment Flow)** and **SEP-31 (Send/Receive)** to enable cross-border payment rails through Stellar anchors.

---

## SEP-24: Interactive Payment Flow

SEP-24 enables interactive deposit and withdrawal flows where users can move funds between Stellar and external payment systems (bank accounts, mobile money, cash pickup).

### Flow Diagram

```
1. Client requests deposit/withdrawal → POST /sep24/deposit
2. Server creates transaction with interactive URL
3. User visits interactive URL to complete payment details
4. Anchor processes the payment (bank transfer, mobile money, etc.)
5. User receives funds (Stellar → External or External → Stellar)
6. Webhooks notify client of status changes
```

### API Endpoints

#### 1. Initialize Deposit
```bash
POST /api/sep24/deposit
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "asset_code": "USDC",
  "asset_issuer": "G...",
  "amount": "1000.00",
  "external_account": "BANK_ACCOUNT_NUMBER"
}

Response:
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "kind": "deposit",
    "status": "incomplete",
    "more_info_url": "http://localhost:4000/sep24/interactive/transaction-uuid"
  }
}
```

#### 2. Initialize Withdrawal
```bash
POST /api/sep24/withdraw
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "asset_code": "USDC",
  "asset_issuer": "G...",
  "amount": "1000.00",
  "external_account": "MOBILE_MONEY_NUMBER"
}
```

#### 3. Get Transaction Status
```bash
GET /api/sep24/transaction/:id
Authorization: Bearer <JWT>

Response:
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "kind": "deposit",
    "status": "completed",
    "amount_in": "1000.00",
    "amount_out": "995.00",
    "amount_fee": "5.00",
    "start_time": "2024-01-01T00:00:00.000Z",
    "completed_at": "2024-01-01T01:00:00.000Z"
  }
}
```

#### 4. Get All Transactions
```bash
GET /api/sep24/transactions?limit=20
Authorization: Bearer <JWT>
```

### SEP-24 Status Values

| Status | Description |
|--------|-------------|
| `incomplete` | Transaction created, awaiting user action |
| `pending_user_transfer_start` | Waiting for user to send funds |
| `pending_user_transfer_complete` | User sent funds, processing |
| `pending_external` | Waiting for external system (bank, mobile money) |
| `pending_anchor` | Anchor is processing |
| `completed` | Transaction finished successfully |
| `error` | Transaction failed |
| `expired` | Transaction expired |

---

## SEP-31: Send/Receive Transactions

SEP-31 enables cross-border payments where senders and receivers don't need to be on Stellar. Perfect for remittances and international payroll.

### Flow Diagram

```
1. Sender initiates payment → POST /sep31/send
2. Receiver KYC validated (SEP-12)
3. Sender sends funds to anchor
4. Anchor converts currency (if needed)
5. Anchor delivers to receiver (bank, mobile money, cash pickup)
6. Status updates via webhooks
```

### API Endpoints

#### 1. Create Send Transaction
```bash
POST /api/sep31/send
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "amount": "1000.00",
  "sell_asset": "USDC:G...",
  "buy_asset": "USDC:G...",
  "receiver_account": "G...",
  "receiver_name": "John Doe",
  "receiver_country": "MX",
  "receiver_external_account": "BANK_ACCOUNT_123"
}

Response:
{
  "success": true,
  "data": {
    "id": "transaction-uuid",
    "status": "pending",
    "more_info_url": "http://localhost:4000/sep31/transaction/transaction-uuid"
  }
}
```

#### 2. Get Transaction Details
```bash
GET /api/sep31/transaction/:id
Authorization: Bearer <JWT>
```

#### 3. Get All Transactions
```bash
GET /api/sep31/transactions?limit=20
Authorization: Bearer <JWT>
```

#### 4. Submit Compliance Info
```bash
POST /api/sep31/transaction/:id/compliance
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "sender_id_doc": "base64_encoded_document",
  "receiver_id_doc": "base64_encoded_document",
  "purpose_of_payment": "payroll"
}
```

### SEP-31 Status Values

| Status | Description |
|--------|-------------|
| `pending` | Transaction created |
| `pending_sender` | Waiting for sender to send funds |
| `pending_stellar` | Funds received on Stellar |
| `pending_receiver` | Processing for receiver |
| `pending_external` | Sent to external system |
| `completed` | Transaction finished |
| `error` | Transaction failed |
| `expired` | Transaction expired |

---

## Webhooks

Webhooks provide real-time notifications for transaction status changes.

### Subscribe to Webhooks

```bash
POST /api/webhooks/subscribe
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "event_types": [
    "transaction.status_changed",
    "sep31.transaction.status_changed"
  ],
  "secret": "your-webhook-secret" // Optional, auto-generated if not provided
}

Response:
{
  "success": true,
  "data": {
    "id": "webhook-uuid",
    "url": "https://your-app.com/webhook",
    "event_types": ["transaction.status_changed"],
    "active": true
  }
}
```

### Webhook Payload Example

```json
{
  "id": "transaction-uuid",
  "kind": "deposit",
  "status": "completed",
  "amount_in": "1000.00",
  "amount_out": "995.00",
  "amount_fee": "5.00",
  "stellar_account": "G...",
  "completed_at": "2024-01-01T01:00:00.000Z"
}
```

### Webhook Signature Verification

All webhooks include an HMAC signature for security:

```javascript
const crypto = require('crypto');

function verifyWebhook(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return `sha256=${expected}` === signature;
}

// Usage in Express
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const isValid = verifyWebhook(req.body, signature, WEBHOOK_SECRET);
  
  if (!isValid) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  handleWebhook(req.body);
  res.status(200).send('OK');
});
```

### Webhook Events

| Event Type | Description |
|------------|-------------|
| `transaction.status_changed` | SEP-24 transaction status updated |
| `sep31.transaction.status_changed` | SEP-31 transaction status updated |

---

## Background Worker

The background worker handles webhook delivery and transaction reconciliation.

### Start Worker

```bash
npm run worker
```

### Worker Tasks

1. **Webhook Delivery** (every 30 seconds)
   - Processes pending webhook deliveries
   - Retries failed deliveries with exponential backoff
   - Max 3 attempts per delivery

2. **Transaction Reconciliation** (every 5 minutes)
   - Checks pending transactions against blockchain
   - Updates status based on on-chain confirmations

3. **Cleanup** (every hour)
   - Removes webhook deliveries older than 30 days

---

## Integration Example: Cross-Border Payroll

```javascript
// 1. Employer initiates international payroll payment
const sendTx = await fetch('/api/sep31/send', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwt}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    amount: '1500.00',
    sell_asset: 'USDC:G...',
    buy_asset: 'USDC:G...',
    receiver_account: 'G...',
    receiver_name: 'Maria Garcia',
    receiver_country: 'MX',
    receiver_external_account: 'CLABE1234567890',
  }),
}).then(res => res.json());

// 2. Monitor transaction status via webhooks
// OR poll the transaction endpoint
setInterval(async () => {
  const status = await fetch(`/api/sep31/transaction/${sendTx.data.id}`, {
    headers: { 'Authorization': `Bearer ${jwt}` },
  }).then(res => res.json());
  
  console.log('Transaction status:', status.data.status);
  
  if (status.data.status === 'completed') {
    console.log('Payment delivered!');
    clearInterval(polling);
  }
}, 30000); // Check every 30 seconds
```

---

## Database Schema

### SEP-24 Tables
- `sep24_transactions` - Interactive deposit/withdrawal transactions

### SEP-31 Tables
- `sep31_transactions` - Cross-border send/receive transactions

### Webhook Tables
- `webhook_subscriptions` - Registered webhook endpoints
- `webhook_deliveries` - Delivery tracking and retry logic

---

## Configuration

Update `.env` with anchor settings:

```bash
# Anchor Configuration
ANCHOR_URL=http://localhost:4000
```

---

## Use Cases

### 1. Employer pays international worker
```
Employer (US) → SEP-31 → Anchor → Bank Transfer → Worker (Mexico)
```

### 2. Worker cashes out to local currency
```
Worker Stellar USDC → SEP-24 Withdraw → MoneyGram → Cash Pickup
```

### 3. Employer funds payroll account
```
Employer Bank → SEP-24 Deposit → Stellar USDC → Payroll Contract
```

---

## Next Steps (Phase 6)

Phase 6 will integrate **MoneyGram Ramps** for actual cash-out flows, enabling workers to convert USDC to local cash pickup.
