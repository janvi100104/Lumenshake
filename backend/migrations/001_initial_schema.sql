-- Migration: 001_initial_schema.sql
-- Create initial database schema for LumenShake payroll system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Employers table
CREATE TABLE IF NOT EXISTS employers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stellar_address VARCHAR(56) UNIQUE NOT NULL,
    kyc_hash VARCHAR(64),
    is_paused BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID REFERENCES employers(id) ON DELETE CASCADE,
    stellar_address VARCHAR(56) NOT NULL,
    salary BIGINT NOT NULL,
    currency VARCHAR(10) DEFAULT 'USDC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employer_id, stellar_address)
);

-- Payroll periods table
CREATE TABLE IF NOT EXISTS payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID REFERENCES employers(id) ON DELETE CASCADE,
    period_number BIGINT NOT NULL,
    total_amount BIGINT NOT NULL,
    is_claimed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employer_id, period_number)
);

-- Payroll claims table
CREATE TABLE IF NOT EXISTS payroll_claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    payroll_period_id UUID REFERENCES payroll_periods(id) ON DELETE CASCADE,
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, payroll_period_id)
);

-- Transactions table (for tracking all blockchain transactions)
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tx_hash VARCHAR(64) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'register_employer', 'add_employee', 'run_payroll', 'claim_payroll', 'deposit_escrow'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
    stellar_address VARCHAR(56) NOT NULL,
    amount BIGINT,
    period_number BIGINT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Outbox table (for reliable event processing)
CREATE TABLE IF NOT EXISTS outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Idempotency keys table (to prevent duplicate operations)
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(255) UNIQUE NOT NULL,
    request_method VARCHAR(10),
    request_path VARCHAR(255),
    response_status INTEGER,
    response_body JSONB,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table (comprehensive audit trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    level VARCHAR(20) NOT NULL, -- 'info', 'warn', 'error', 'debug'
    action VARCHAR(100) NOT NULL,
    actor_address VARCHAR(56),
    target_address VARCHAR(56),
    details JSONB,
    tx_hash VARCHAR(64),
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- Create indexes for better query performance (IF NOT EXISTS to handle re-runs)
CREATE INDEX IF NOT EXISTS idx_employers_stellar_address ON employers(stellar_address);
CREATE INDEX IF NOT EXISTS idx_employees_employer_id ON employees(employer_id);
CREATE INDEX IF NOT EXISTS idx_employees_stellar_address ON employees(stellar_address);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_employer_id ON payroll_periods(employer_id);
CREATE INDEX IF NOT EXISTS idx_payroll_claims_employee_id ON payroll_claims(employee_id);
CREATE INDEX IF NOT EXISTS idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_stellar_address ON transactions(stellar_address);
CREATE INDEX IF NOT EXISTS idx_outbox_processed ON outbox(processed);
CREATE INDEX IF NOT EXISTS idx_outbox_event_type ON outbox(event_type);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_address);

-- Create updated_at trigger function (OR REPLACE to handle re-runs)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers (drop if exists first to handle re-runs)
DROP TRIGGER IF EXISTS update_employers_updated_at ON employers;
CREATE TRIGGER update_employers_updated_at BEFORE UPDATE ON employers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_outbox_updated_at ON outbox;
CREATE TRIGGER update_outbox_updated_at BEFORE UPDATE ON outbox
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE employers IS 'Registered employers with KYC information';
COMMENT ON TABLE employees IS 'Employees enrolled in payroll by employers';
COMMENT ON TABLE payroll_periods IS 'Payroll periods created by employers';
COMMENT ON TABLE payroll_claims IS 'Employee claims for payroll periods';
COMMENT ON TABLE transactions IS 'All blockchain transactions tracked by the system';
COMMENT ON TABLE outbox IS 'Outbox pattern for reliable event processing';
COMMENT ON TABLE idempotency_keys IS 'Prevents duplicate API requests';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for compliance';
