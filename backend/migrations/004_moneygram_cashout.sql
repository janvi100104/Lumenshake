-- Migration: 004_moneygram_cashout.sql
-- MoneyGram cash-out integration tables

-- MoneyGram cash-out transactions
CREATE TABLE IF NOT EXISTS moneygram_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Transaction References
    moneygram_reference VARCHAR(64) UNIQUE NOT NULL, -- MoneyGram order reference
    stellar_transaction_id VARCHAR(64), -- Related Stellar transaction
    sep24_transaction_id UUID REFERENCES sep24_transactions(id), -- Related SEP-24 transaction
    
    -- Transaction Details
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- MoneyGram status
    transaction_type VARCHAR(20) NOT NULL DEFAULT 'cash_out',
    
    -- Amount Information
    crypto_amount VARCHAR(50) NOT NULL, -- Amount in USDC
    crypto_currency VARCHAR(10) DEFAULT 'USDC',
    fiat_amount VARCHAR(50), -- Amount in local currency
    fiat_currency VARCHAR(10), -- Local currency code (MXN, INR, etc.)
    exchange_rate VARCHAR(20), -- USDC to local currency rate
    service_fee VARCHAR(50), -- MoneyGram service fee
    total_fee VARCHAR(50), -- Total fees
    
    -- Sender (Worker) Information
    sender_stellar_account VARCHAR(56) NOT NULL,
    sender_name VARCHAR(100),
    sender_country VARCHAR(2),
    sender_phone VARCHAR(20),
    
    -- Receiver (Payee) Information
    receiver_name VARCHAR(100) NOT NULL,
    receiver_country VARCHAR(2) NOT NULL,
    receiver_id_type VARCHAR(30), -- passport, national_id, etc.
    receiver_id_number VARCHAR(50),
    
    -- Payout Location
    payout_location_id VARCHAR(50), -- MoneyGram agent location ID
    payout_location_name VARCHAR(200),
    payout_location_address TEXT,
    payout_city VARCHAR(100),
    payout_country VARCHAR(2),
    payout_method VARCHAR(20) DEFAULT 'cash_pickup', -- cash_pickup, bank_deposit, mobile_wallet
    
    -- Compliance & Verification
    kyc_verified BOOLEAN DEFAULT FALSE,
    compliance_check_status VARCHAR(30), -- pending, approved, rejected
    compliance_response JSONB,
    
    -- MoneyGram API Response
    moneygram_response JSONB,
    
    -- Tracking
    tracking_number VARCHAR(50), -- For customer to track payout
    pin_code VARCHAR(10), -- PIN for cash pickup (encrypted)
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP, -- Cash pickup expiration
    
    -- Additional data
    message TEXT,
    metadata JSONB
);

CREATE INDEX idx_moneygram_reference ON moneygram_transactions(moneygram_reference);
CREATE INDEX idx_moneygram_sender ON moneygram_transactions(sender_stellar_account);
CREATE INDEX idx_moneygram_status ON moneygram_transactions(status);
CREATE INDEX idx_moneygram_receiver_country ON moneygram_transactions(receiver_country);

-- MoneyGram agent locations cache
CREATE TABLE IF NOT EXISTS moneygram_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    state_province VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    operating_hours JSONB, -- { "monday": "09:00-18:00", ... }
    services_offered TEXT[], -- ['cash_pickup', 'bank_deposit', ...]
    supported_currencies TEXT[], -- ['MXN', 'USD', ...]
    distance_km DECIMAL(10, 2), -- Calculated distance from user
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_moneygram_locations_country ON moneygram_locations(country);
CREATE INDEX idx_moneygram_locations_city ON moneygram_locations(city);
CREATE INDEX idx_moneygram_locations_active ON moneygram_locations(is_active);

-- Exchange rate cache
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency VARCHAR(10) NOT NULL, -- USDC
    target_currency VARCHAR(10) NOT NULL, -- MXN, INR, etc.
    rate VARCHAR(20) NOT NULL,
    fee_percentage DECIMAL(5, 2), -- Service fee percentage
    source VARCHAR(50), -- 'moneygram', 'coinbase', etc.
    valid_until TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_exchange_rates_pair ON exchange_rates(base_currency, target_currency);
CREATE INDEX idx_exchange_rates_valid ON exchange_rates(valid_until);

-- Trigger for updating updated_at
CREATE TRIGGER update_moneygram_transactions_updated_at BEFORE UPDATE ON moneygram_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE moneygram_transactions IS 'MoneyGram cash-out transactions from USDC to local currency';
COMMENT ON TABLE moneygram_locations IS 'Cached MoneyGram agent locations for cash pickup';
COMMENT ON TABLE exchange_rates IS 'Cached exchange rates for crypto-to-fiat conversion';

COMMENT ON COLUMN moneygram_transactions.status IS 'Status: pending, processing, ready_for_pickup, picked_up, cancelled, expired, failed';
COMMENT ON COLUMN moneygram_transactions.payout_method IS 'cash_pickup, bank_deposit, mobile_wallet';
