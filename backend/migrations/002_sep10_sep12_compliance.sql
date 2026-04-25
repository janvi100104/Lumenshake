-- Migration: 002_sep10_sep12_compliance.sql
-- SEP-10 (Authentication) and SEP-12 (Customer Information) tables

-- SEP-10: Nonce tracking to prevent replay attacks
CREATE TABLE IF NOT EXISTS sep10_nonces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nonce VARCHAR(64) UNIQUE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP
);

CREATE INDEX idx_sep10_nonces_nonce ON sep10_nonces(nonce);
CREATE INDEX idx_sep10_nonces_used ON sep10_nonces(used);

-- SEP-12: Customer information registry
CREATE TABLE IF NOT EXISTS sep12_customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stellar_address VARCHAR(56) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'employer', 'employee', 'both'
    
    -- Personal Information
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone_number VARCHAR(50),
    date_of_birth DATE,
    
    -- Address Information
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(2), -- ISO 3166-1 alpha-2 country code
    
    -- KYC Information
    kyc_status VARCHAR(20) DEFAULT 'not_started', -- 'not_started', 'pending', 'approved', 'rejected', 'revoked'
    kyc_level VARCHAR(20) DEFAULT 'tier_0', -- 'tier_0', 'tier_1', 'tier_2'
    kyc_updated_at TIMESTAMP,
    
    -- External References
    external_id VARCHAR(100), -- Reference to external KYC provider
    metadata JSONB, -- Additional flexible data
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(stellar_address, type)
);

CREATE INDEX idx_sep12_customers_address ON sep12_customers(stellar_address);
CREATE INDEX idx_sep12_customers_type ON sep12_customers(type);
CREATE INDEX idx_sep12_customers_kyc_status ON sep12_customers(kyc_status);
CREATE INDEX idx_sep12_customers_email ON sep12_customers(email);

-- SEP-12: KYC status change history (audit trail)
CREATE TABLE IF NOT EXISTS sep12_kyc_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_address VARCHAR(56) NOT NULL,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    old_level VARCHAR(20),
    new_level VARCHAR(20),
    notes TEXT,
    changed_by VARCHAR(56), -- Admin who made the change
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sep12_kyc_history_address ON sep12_kyc_history(customer_address);
CREATE INDEX idx_sep12_kyc_history_created ON sep12_kyc_history(created_at);

-- Trigger for updating updated_at on customers
CREATE TRIGGER update_sep12_customers_updated_at BEFORE UPDATE ON sep12_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE sep10_nonces IS 'SEP-10: Tracks nonces to prevent replay attacks';
COMMENT ON TABLE sep12_customers IS 'SEP-12: Customer information and KYC status';
COMMENT ON TABLE sep12_kyc_history IS 'SEP-12: Audit trail for KYC status changes';

COMMENT ON COLUMN sep12_customers.kyc_status IS 'KYC verification status: not_started, pending, approved, rejected, revoked';
COMMENT ON COLUMN sep12_customers.kyc_level IS 'KYC tier level: tier_0 (basic), tier_1 (verified), tier_2 (enhanced)';
COMMENT ON COLUMN sep12_customers.country IS 'ISO 3166-1 alpha-2 country code (e.g., US, GB, IN)';
