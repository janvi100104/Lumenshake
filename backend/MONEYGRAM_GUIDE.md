# MoneyGram Cash-Out Integration Guide

## Overview

LumenShake integrates with **MoneyGram** to enable workers to convert their USDC earnings to local cash that can be picked up at any MoneyGram location worldwide.

---

## Architecture

```
Worker Stellar Wallet
        │
        ├── Send USDC to Escrow
        │
        └── LumenShake Backend
             │
             ├── Create MoneyGram Order
             │
             ├── Get Exchange Rate (USDC → Local Currency)
             │
             ├── Find Nearby Pickup Locations
             │
             └── Generate Tracking Number + PIN
                  │
                  └── Worker picks up cash at MoneyGram
```

---

## Database Schema

### Tables

1. **moneygram_transactions** - Cash-out transaction records
2. **moneygram_locations** - Cached MoneyGram agent locations
3. **exchange_rates** - Cached crypto-to-fiat exchange rates

### Transaction Statuses

| Status | Description |
|--------|-------------|
| `pending` | Transaction created, awaiting USDC payment |
| `processing` | USDC received, MoneyGram order being created |
| `ready_for_pickup` | Cash ready at location, tracking number issued |
| `picked_up` | Worker collected cash |
| `cancelled` | Transaction cancelled |
| `expired` | Transaction expired (not picked up in time) |
| `failed` | Transaction failed |

---

## API Endpoints

### 1. Initiate Cash-Out

```bash
POST /api/moneygram/initiate
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "receiver_name": "Maria Garcia",
  "receiver_country": "MX",
  "receiver_id_type": "passport",
  "receiver_id_number": "AB123456",
  "crypto_amount": "100.00",
  "crypto_currency": "USDC",
  "fiat_currency": "MXN",
  "payout_method": "cash_pickup",
  "payout_location_id": "MGLOC123"
}

Response:
{
  "success": true,
  "data": {
    "transaction_id": "uuid",
    "moneygram_reference": "MG1704067200ABC123",
    "status": "pending",
    "crypto_amount": "100.00",
    "fiat_amount": "1715.00",
    "fiat_currency": "MXN",
    "exchange_rate": "17.50",
    "fee": "43.75",
    "expires_at": "2024-01-08T00:00:00.000Z"
  },
  "next_steps": [
    "Send USDC to the provided escrow address",
    "Transaction will be processed automatically",
    "You will receive tracking details once ready for pickup"
  ]
}
```

### 2. Get Cash-Out Status

```bash
GET /api/moneygram/status/:reference
Authorization: Bearer <JWT>

Response:
{
  "success": true,
  "data": {
    "moneygram_reference": "MG1704067200ABC123",
    "status": "ready_for_pickup",
    "crypto_amount": "100.00",
    "fiat_amount": "1715.00",
    "fiat_currency": "MXN",
    "tracking_number": "123-456-7890",
    "payout_location_name": "MoneyGram Agent - OXXO",
    "payout_city": "Mexico City",
    "payout_country": "MX",
    "expires_at": "2024-01-08T00:00:00.000Z"
  }
}
```

### 3. Get All Cash-Out Transactions

```bash
GET /api/moneygram/transactions?limit=20
Authorization: Bearer <JWT>

Response:
{
  "success": true,
  "data": [
    {
      "moneygram_reference": "MG1704067200ABC123",
      "status": "ready_for_pickup",
      "crypto_amount": "100.00",
      "fiat_amount": "1715.00",
      "fiat_currency": "MXN"
    }
  ]
}
```

### 4. Get Exchange Rate

```bash
GET /api/moneygram/exchange-rate?base=USDC&target=MXN

Response:
{
  "success": true,
  "data": {
    "base_currency": "USDC",
    "target_currency": "MXN",
    "rate": "17.50",
    "fee_percentage": 2.5,
    "valid_until": "2024-01-01T00:05:00.000Z"
  }
}
```

### 5. Find Pickup Locations

```bash
GET /api/moneygram/locations?country=MX&city=Mexico+City&latitude=19.4326&longitude=-99.1332&radius_km=10

Response:
{
  "success": true,
  "data": [
    {
      "location_id": "MGLOC123",
      "name": "MoneyGram Agent - OXXO",
      "address_line1": "Av. Insurgentes Sur 1234",
      "city": "Mexico City",
      "country": "MX",
      "distance_km": "0.5",
      "phone": "+52 55 1234 5678",
      "services_offered": ["cash_pickup"],
      "supported_currencies": ["MXN", "USD"]
    }
  ],
  "count": 1
}
```

---

## Frontend Integration

### Using the CashOutDashboard Component

```tsx
import CashOutDashboard from '../components/CashOutDashboard';

export default function Page() {
  return (
    <div>
      <CashOutDashboard />
    </div>
  );
}
```

### Component Features

✅ **Multi-step form**:
1. Enter amount and select currency
2. Provide receiver information
3. Select nearby pickup location
4. Review and confirm
5. Success with tracking details

✅ **Real-time exchange rates**  
✅ **Location finder with distance calculation**  
✅ **Fee transparency**  
✅ **Wallet integration**  

---

## Configuration

### Environment Variables

Add to `backend/.env`:

```bash
# MoneyGram Configuration
MONEYGRAM_API_KEY=your-moneygram-api-key
MONEYGRAM_API_SECRET=your-moneygram-api-secret
MONEYGRAM_API_URL=https://api.moneygram.com/api/v1
PIN_ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### Production Setup

1. **Obtain MoneyGram API Credentials**:
   - Apply at [MoneyGram Developer Portal](https://developer.moneygram.com)
   - Complete compliance requirements
   - Receive API key and secret

2. **Set Strong PIN Encryption Key**:
   ```bash
   # Generate a secure 32-byte key
   openssl rand -hex 32
   ```

3. **Update API URL** (if using sandbox):
   ```bash
   MONEYGRAM_API_URL=https://api.moneygram.com/api/v1/sandbox
   ```

---

## Flow Examples

### Example 1: Worker Cash-Out (Mexico)

```javascript
// 1. Worker initiates cash-out
const response = await fetch('/api/moneygram/initiate', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${jwt}` },
  body: JSON.stringify({
    receiver_name: 'Juan Perez',
    receiver_country: 'MX',
    receiver_id_type: 'passport',
    receiver_id_number: 'MX123456',
    crypto_amount: '150.00',
    fiat_currency: 'MXN',
    payout_location_id: 'MGLOC456',
  }),
});

const { data } = await response.json();
console.log('Reference:', data.moneygram_reference);
// Output: MG1704067200XYZ789

// 2. Worker sends USDC to escrow (via Stellar transaction)
// This is handled by the smart contract

// 3. Check status
const status = await fetch(`/api/moneygram/status/${data.moneygram_reference}`, {
  headers: { 'Authorization': `Bearer ${jwt}` },
});

const { data: statusData } = await status.json();
console.log('Status:', statusData.status);
// Output: "ready_for_pickup"
console.log('Tracking:', statusData.tracking_number);
// Output: "123-456-7890"

// 4. Worker visits MoneyGram location with ID and tracking number
// 5. Worker provides PIN and collects 2,587.50 MXN cash
```

---

## Supported Currencies

| Country | Currency | Code | Typical Fee |
|---------|----------|------|-------------|
| Mexico | Mexican Peso | MXN | 2.5% |
| India | Indian Rupee | INR | 2.0% |
| Philippines | Philippine Peso | PHP | 2.5% |
| Ghana | Ghanaian Cedi | GHS | 3.0% |
| Nigeria | Nigerian Naira | NGN | 3.5% |

---

## Security Features

✅ **PIN Encryption**: AES-256-CBC encryption for pickup PINs  
✅ **JWT Authentication**: All endpoints require valid JWT  
✅ **KYC Validation**: Transactions gated by SEP-12 KYC status  
✅ **Audit Trail**: Complete logging of all operations  
✅ **Expiry Time**: Cash pickup expires after 7 days  
✅ **Idempotency**: Prevents duplicate transactions  

---

## Webhook Events

The MoneyGram service triggers webhooks for key events:

| Event | Description |
|-------|-------------|
| `cashout.ready_for_pickup` | Cash is ready at pickup location |
| `cashout.completed` | Worker successfully picked up cash |

### Webhook Payload Example

```json
{
  "moneygram_reference": "MG1704067200XYZ789",
  "status": "ready_for_pickup",
  "crypto_amount": "150.00",
  "fiat_amount": "2587.50",
  "fiat_currency": "MXN",
  "tracking_number": "123-456-7890",
  "payout_location_name": "MoneyGram Agent - OXXO",
  "payout_city": "Mexico City",
  "updated_at": "2024-01-01T01:00:00.000Z"
}
```

---

## Testing

### 1. Run Migration

```bash
cd backend
npm run migrate
```

### 2. Start Backend

```bash
npm run dev
```

### 3. Test Exchange Rate

```bash
curl http://localhost:4000/api/moneygram/exchange-rate?base=USDC&target=MXN
```

### 4. Test Location Search

```bash
curl "http://localhost:4000/api/moneygram/locations?country=MX"
```

### 5. Test Frontend

Add `CashOutDashboard` to your app and test the full flow.

---

## Production Considerations

### 1. MoneyGram API Integration

Replace mock data with actual API calls:

```javascript
// In moneygram.js, uncomment and implement:
const moneygramOrder = await this.createMoneyGramOrder(transaction);
await this.notifyPaymentReceived(transaction);
```

### 2. Location Data Sync

Set up a cron job to sync MoneyGram locations:

```javascript
// worker.js - Add this task
setInterval(async () => {
  await moneygramService.syncLocationsFromAPI();
}, 24 * 60 * 60 * 1000); // Daily
```

### 3. Rate Monitoring

Monitor exchange rates and alert on significant changes:

```javascript
if (Math.abs(newRate - oldRate) / oldRate > 0.05) { // 5% change
  await logger.alert('Significant exchange rate change detected');
}
```

### 4. Compliance

- Ensure KYC requirements are met for each country
- Comply with local money transmission laws
- Maintain audit logs for regulatory reporting
- Implement AML (Anti-Money Laundering) checks

---

## Troubleshooting

### Issue: Exchange rate not available

**Solution**: Check if currency pair is supported. Add to mock rates or connect to real API.

### Issue: No locations found

**Solution**: Verify country code and ensure location data is synced. Run location sync job.

### Issue: PIN encryption error

**Solution**: Ensure `PIN_ENCRYPTION_KEY` is set in `.env` and is exactly 32 characters.

### Issue: Transaction stuck in "pending"

**Solution**: Check if Stellar transaction completed. Verify webhook delivery to `process-payment` endpoint.

---

## Next Steps (Phase 7)

Phase 7 will focus on:
- Security audit of smart contracts
- Load testing and performance optimization
- Production deployment preparation
- MoneyGram API production integration
- Final compliance review
