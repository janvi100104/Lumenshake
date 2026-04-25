-- Migration: 003_sep24_sep31_anchor_rails.sql
-- SEP-24 (Interactive Payment Flow) and SEP-31 (Send/Receive) tables

-- SEP-24: Interactive transactions (deposit/withdraw)
CREATE TABLE IF NOT EXISTS sep24_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(64) UNIQUE NOT NULL, -- Stellar transaction ID
    
    -- Transaction Details
    kind VARCHAR(20) NOT NULL, -- 'deposit' or 'withdrawal'
    status VARCHAR(30) NOT NULL DEFAULT 'incomplete', -- SEP-24 status values
    amount_expected VARCHAR(50),
    amount_in VARCHAR(50),
    amount_out VARCHAR(50),
    amount_fee VARCHAR(50),
    
    -- Asset Information
    asset_code VARCHAR(10) NOT NULL,
    asset_issuer VARCHAR(56),
    
    -- Customer Information
    stellar_account VARCHAR(56),
    external_account VARCHAR(100), -- Bank account, mobile money, etc.
    
    -- KYC & Compliance
    kyc_verified BOOLEAN DEFAULT FALSE,
    
    -- URLs for interactive flow
    more_info_url TEXT,
    refund_memo TEXT,
    refund_memo_type VARCHAR(20),
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Additional data
    message TEXT,
    metadata JSONB
);

CREATE INDEX idx_sep24_transaction_id ON sep24_transactions(transaction_id);
CREATE INDEX idx_sep24_stellar_account ON sep24_transactions(stellar_account);
CREATE INDEX idx_sep24_kind ON sep24_transactions(kind);
CREATE INDEX idx_sep24_status ON sep24_transactions(status);

-- SEP-31: Send/Receive transactions
CREATE TABLE IF NOT EXISTS sep31_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stellar_transaction_id VARCHAR(64) UNIQUE,
    
    -- Transaction Details
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- SEP-31 status values
    
    -- Amounts
    amount_expected VARCHAR(50),
    amount_in VARCHAR(50),
    amount_out VARCHAR(50),
    amount_fee VARCHAR(50),
    
    -- Asset Information
    sell_asset VARCHAR(50), -- e.g., "USDC:G..."
    buy_asset VARCHAR(50),  -- e.g., "USDC:G..."
    
    -- Sender Information
    sender_account VARCHAR(56),
    sender_name VARCHAR(100),
    sender_country VARCHAR(2),
    
    -- Receiver Information
    receiver_account VARCHAR(56),
    receiver_name VARCHAR(100),
    receiver_country VARCHAR(2),
    receiver_external_account VARCHAR(100),
    
    -- Compliance
    kyc_verified BOOLEAN DEFAULT FALSE,
    compliance_response JSONB,
    
    -- Stellar Transaction Details
    deposit_memo VARCHAR(100),
    deposit_memo_type VARCHAR(20),
    withdraw_memo VARCHAR(100),
    withdraw_memo_type VARCHAR(20),
    
    -- URLs
    more_info_url TEXT,
    
    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Additional data
    message TEXT,
    metadata JSONB
);

CREATE INDEX idx_sep31_stellar_tx ON sep31_transactions(stellar_transaction_id);
CREATE INDEX idx_sep31_sender ON sep31_transactions(sender_account);
CREATE INDEX idx_sep31_receiver ON sep31_transactions(receiver_account);
CREATE INDEX idx_sep31_status ON sep31_transactions(status);

-- Webhook subscriptions for external notifications
CREATE TABLE IF NOT EXISTS webhook_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url VARCHAR(500) NOT NULL,
    event_types TEXT[] NOT NULL, -- Array of event types to subscribe to
    secret VARCHAR(100), -- HMAC secret for verification
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_triggered_at TIMESTAMP
);

CREATE INDEX idx_webhook_active ON webhook_subscriptions(active);

-- Webhook delivery log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID REFERENCES webhook_subscriptions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    response_status INTEGER,
    response_body TEXT,
    success BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX idx_webhook_deliveries_success ON webhook_deliveries(success);
CREATE INDEX idx_webhook_deliveries_retry ON webhook_deliveries(next_retry_at);

-- Trigger for updating updated_at
CREATE TRIGGER update_sep24_transactions_updated_at BEFORE UPDATE ON sep24_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sep31_transactions_updated_at BEFORE UPDATE ON sep31_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_subscriptions_updated_at BEFORE UPDATE ON webhook_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE sep24_transactions IS 'SEP-24: Interactive deposit/withdrawal transactions';
COMMENT ON TABLE sep31_transactions IS 'SEP-31: Send/receive cross-border payment transactions';
COMMENT ON TABLE webhook_subscriptions IS 'Webhook endpoints for event notifications';
COMMENT ON TABLE webhook_deliveries IS 'Webhook delivery tracking and retry logic';

COMMENT ON COLUMN sep24_transactions.kind IS 'Transaction type: deposit or withdrawal';
COMMENT ON COLUMN sep24_transactions.status IS 'SEP-24 status: incomplete, pending_user_transfer_start, pending_user_transfer_complete, pending_external, pending_anchor, completed, error, expired';
COMMENT ON COLUMN sep31_transactions.status IS 'SEP-31 status: pending, pending_sender, pending_stellar, pending_receiver, pending_external, completed, error, expired';
