# SEP-10 & SEP-12 Compliance Guide

## Overview

LumenShake implements **SEP-10 (Authentication)** and **SEP-12 (Customer Information)** to provide production-grade compliance for cross-border payroll operations.

---

## SEP-10: Stellar Web Authentication

SEP-10 provides a standardized way to authenticate Stellar account holders using challenge transactions and JWT tokens.

### Authentication Flow

```
1. Client requests challenge → GET /api/auth/challenge?account=G...
2. Server returns challenge transaction (XDR)
3. Client signs transaction with their wallet (Freighter)
4. Client submits signed transaction → POST /api/auth
5. Server verifies signature and issues JWT token
6. Client uses JWT in Authorization header for all subsequent requests
```

### API Endpoints

#### 1. Get Challenge
```bash
GET /api/auth/challenge?account=<STELLAR_ADDRESS>

Response:
{
  "transaction": "AAAAA...",  // Base64 XDR
  "network_passphrase": "Test SDF Network ; September 2015"
}
```

#### 2. Authenticate
```bash
POST /api/auth
Content-Type: application/json

{
  "transaction": "SIGNED_XDR_HERE"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "account": "G...",
  "expires_in": "24h",
  "token_type": "Bearer"
}
```

#### 3. Verify Token (Optional)
```bash
POST /api/auth/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}

Response:
{
  "valid": true,
  "account": "G...",
  "expires_at": "2024-01-01T00:00:00.000Z"
}
```

### Using JWT in Requests

```bash
curl -X POST http://localhost:4000/api/payroll/employers \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{...}'
```

---

## SEP-12: Customer Information

SEP-12 manages customer KYC (Know Your Customer) data and compliance status.

### KYC Status Levels

| Status | Description |
|--------|-------------|
| `not_started` | Customer registered but KYC not initiated |
| `pending` | KYC verification in progress |
| `approved` | KYC verified, full access granted |
| `rejected` | KYC failed, access denied |
| `revoked` | Previously approved, now revoked |

### KYC Tiers

| Tier | Requirements | Operations Allowed |
|------|--------------|-------------------|
| `tier_0` | Basic registration | Claim payroll only |
| `tier_1` | Identity verified | All employer operations |
| `tier_2` | Enhanced due diligence | High-value transactions |

### API Endpoints

#### 1. Register/Update Customer
```bash
PUT /api/customer
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "type": "employer",  // or "employee"
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "country": "US",
  "date_of_birth": "1990-01-01",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postal_code": "10001",
  "phone_number": "+1234567890"
}
```

#### 2. Get Customer Info
```bash
GET /api/customer?type=employer
Authorization: Bearer <JWT>

Response:
{
  "success": true,
  "data": {
    "stellar_address": "G...",
    "type": "employer",
    "first_name": "John",
    "kyc_status": "pending",
    "kyc_level": "tier_0"
  }
}
```

#### 3. Update KYC Status (Admin)
```bash
POST /api/customer/kyc
Content-Type: application/json

{
  "account": "G...",
  "kyc_status": "approved",
  "kyc_level": "tier_1",
  "notes": "Identity verified via third-party provider"
}
```

#### 4. Check KYC Requirements
```bash
GET /api/customer/kyc/requirements?operation=run_payroll

Response:
{
  "success": true,
  "data": {
    "operation": "run_payroll",
    "requirements": {
      "status": "approved",
      "level": "tier_1"
    }
  }
}
```

#### 5. Validate KYC for Operation
```bash
POST /api/customer/kyc/validate
Authorization: Bearer <JWT>
Content-Type: application/json

{
  "operation": "claim_payroll"
}

Response:
{
  "success": true,
  "data": {
    "approved": true,
    "customer": {...}
  }
}
```

---

## KYC-Gated Operations

All payroll operations now require KYC verification:

| Operation | Required Status | Required Level |
|-----------|----------------|----------------|
| Register Employer | `approved` | `tier_1` |
| Add Employee | `approved` | `tier_1` |
| Run Payroll | `approved` | `tier_1` |
| Claim Payroll | `approved` | `tier_0` |
| Deposit Escrow | `approved` | `tier_1` |

### Example: Access Denied Response

```json
{
  "error": "KYC verification required",
  "message": "KYC status 'pending' does not meet requirement 'approved'",
  "kyc_status": "pending",
  "action_required": "Please complete KYC verification to access this feature"
}
```

---

## Security Features

### SEP-10 Security
- ✅ Challenge transactions expire after 5 minutes
- ✅ Nonce-based replay attack prevention
- ✅ Cryptographic signature verification
- ✅ JWT tokens expire after 24 hours
- ✅ Unique token ID (jti) for tracking

### SEP-12 Security
- ✅ All customer endpoints require JWT authentication
- ✅ Comprehensive audit trail for KYC changes
- ✅ Tiered access control
- ✅ Admin-only KYC status updates
- ✅ Data validation and sanitization

---

## Database Schema

### SEP-10 Tables
- `sep10_nonces` - Tracks used nonces to prevent replay attacks

### SEP-12 Tables
- `sep12_customers` - Customer information and KYC status
- `sep12_kyc_history` - Audit trail for KYC status changes

---

## Integration Example (Frontend)

```javascript
import { signTransaction } from '@stellar/freighter-api';

// Step 1: Get challenge
const challenge = await fetch(
  `/api/auth/challenge?account=${walletAddress}`
).then(res => res.json());

// Step 2: Sign with Freighter
const { signedTxXdr } = await signTransaction(challenge.transaction);

// Step 3: Authenticate
const auth = await fetch('/api/auth', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transaction: signedTxXdr }),
}).then(res => res.json());

// Step 4: Store JWT
localStorage.setItem('jwt_token', auth.token);

// Step 5: Use in API calls
const response = await fetch('/api/payroll/employers', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${auth.token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({...}),
});
```

---

## Configuration

Update `.env` with your settings:

```bash
# SEP-10 Authentication
HOME_DOMAIN=yourdomain.com
WEB_AUTH_DOMAIN=Your App Name
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=24h
```

---

## Compliance Notes

- All KYC changes are logged in `sep12_kyc_history`
- Audit trails include IP addresses and user agents
- Failed authentication attempts are logged
- Nonce expiration prevents replay attacks
- JWT tokens should be rotated regularly in production
