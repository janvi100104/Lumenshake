-- Migration 006: Comprehensive Data Indexing
-- Adds indexes for fast queries, analytics, and reporting
-- Focuses on common query patterns and performance optimization

-- ============================================================
-- 1. SEP-12 Customers (KYC) Indexes
-- ============================================================

-- Fast lookup by KYC status
CREATE INDEX IF NOT EXISTS idx_sep12_customers_kyc_status 
ON sep12_customers(kyc_status);

-- Fast lookup by account type
CREATE INDEX IF NOT EXISTS idx_sep12_customers_type 
ON sep12_customers(type);

-- Composite index for KYC queries
CREATE INDEX IF NOT EXISTS idx_sep12_customers_kyc_type 
ON sep12_customers(kyc_status, type);

-- Search by email
CREATE INDEX IF NOT EXISTS idx_sep12_customers_email 
ON sep12_customers(email) WHERE email IS NOT NULL;

-- Search by phone
CREATE INDEX IF NOT EXISTS idx_sep12_customers_phone 
ON sep12_customers(phone_number) WHERE phone_number IS NOT NULL;

-- Search by country
CREATE INDEX IF NOT EXISTS idx_sep12_customers_country 
ON sep12_customers(country);

-- Created at for user growth analytics
CREATE INDEX IF NOT EXISTS idx_sep12_customers_created_at 
ON sep12_customers(created_at);

-- ============================================================
-- 2. SEP-24 Transactions Indexes
-- ============================================================

-- Fast lookup by status
CREATE INDEX IF NOT EXISTS idx_sep24_transactions_status 
ON sep24_transactions(status);

-- Fast lookup by kind (deposit/withdraw)
CREATE INDEX IF NOT EXISTS idx_sep24_transactions_kind 
ON sep24_transactions(kind);

-- Fast lookup by stellar account
CREATE INDEX IF NOT EXISTS idx_sep24_transactions_stellar_account 
ON sep24_transactions(stellar_account);

-- Composite index for user transaction history
CREATE INDEX IF NOT EXISTS idx_sep24_transactions_account_status 
ON sep24_transactions(stellar_account, status);

-- Time-based queries for analytics
CREATE INDEX IF NOT EXISTS idx_sep24_transactions_updated_at 
ON sep24_transactions(updated_at);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_sep24_transactions_date_range 
ON sep24_transactions(updated_at DESC);

-- ============================================================
-- 3. SEP-31 Transactions Indexes
-- ============================================================

-- Fast lookup by status
CREATE INDEX IF NOT EXISTS idx_sep31_transactions_status 
ON sep31_transactions(status);

-- Fast lookup by sender account
CREATE INDEX IF NOT EXISTS idx_sep31_transactions_sender 
ON sep31_transactions(sender_account);

-- Fast lookup by receiver account
CREATE INDEX IF NOT EXISTS idx_sep31_transactions_receiver 
ON sep31_transactions(receiver_account);

-- Composite index for cross-border payment queries
CREATE INDEX IF NOT EXISTS idx_sep31_transactions_status_updated 
ON sep31_transactions(status, updated_at);

-- Time-based analytics
CREATE INDEX IF NOT EXISTS idx_sep31_transactions_updated_at 
ON sep31_transactions(updated_at);

-- ============================================================
-- 4. MoneyGram Transactions Indexes
-- ============================================================

-- Composite index for status polling (worker queries)
CREATE INDEX IF NOT EXISTS idx_moneygram_status_updated 
ON moneygram_transactions(status, updated_at) 
WHERE status IN ('submitted', 'processing', 'processing_payment');

-- Fast lookup by fiat currency
CREATE INDEX IF NOT EXISTS idx_moneygram_fiat_currency 
ON moneygram_transactions(fiat_currency);

-- Fast lookup by crypto currency
CREATE INDEX IF NOT EXISTS idx_moneygram_crypto_currency 
ON moneygram_transactions(crypto_currency);

-- Date range queries for financial reports
CREATE INDEX IF NOT EXISTS idx_moneygram_created_at 
ON moneygram_transactions(created_at);

-- Composite index for user transaction history
CREATE INDEX IF NOT EXISTS idx_moneygram_sender_status 
ON moneygram_transactions(sender_stellar_account, status);

-- KYC status queries
CREATE INDEX IF NOT EXISTS idx_moneygram_kyc_verified 
ON moneygram_transactions(kyc_verified);

-- ============================================================
-- 5. Payroll Periods Indexes
-- ============================================================

-- Fast lookup by status
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status 
ON payroll_periods(status);

-- Date range queries
CREATE INDEX IF NOT EXISTS idx_payroll_periods_dates 
ON payroll_periods(start_date, end_date);

-- Composite index for employer active periods
CREATE INDEX IF NOT EXISTS idx_payroll_periods_employer_status 
ON payroll_periods(employer_id, status);

-- ============================================================
-- 6. Payroll Claims Indexes
-- ============================================================

-- Fast lookup by status
CREATE INDEX IF NOT EXISTS idx_payroll_claims_status 
ON payroll_claims(status);

-- Fast lookup by employee
CREATE INDEX IF NOT EXISTS idx_payroll_claims_employee 
ON payroll_claims(employee_id);

-- Composite index for employee claims
CREATE INDEX IF NOT EXISTS idx_payroll_claims_employee_status 
ON payroll_claims(employee_id, status);

-- Time-based queries for payroll reports
CREATE INDEX IF NOT EXISTS idx_payroll_claims_updated_at 
ON payroll_claims(updated_at);

-- Composite index for payroll period claims
CREATE INDEX IF NOT EXISTS idx_payroll_claims_period_status 
ON payroll_claims(payroll_period_id, status);

-- ============================================================
-- 7. Webhook Subscriptions & Deliveries Indexes
-- ============================================================

-- Fast lookup by active status
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_active 
ON webhook_subscriptions(active);

-- Fast lookup by event types (array containment)
CREATE INDEX IF NOT EXISTS idx_webhook_subscriptions_events 
ON webhook_subscriptions USING GIN(event_types);

-- Webhook deliveries: fast lookup by success status
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_success 
ON webhook_deliveries(success);

-- Composite index for retry queries (worker)
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry 
ON webhook_deliveries(success, attempts, next_retry_at)
WHERE success = FALSE AND attempts < max_attempts;

-- Time-based cleanup queries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at 
ON webhook_deliveries(created_at);

-- Event type queries
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event_type 
ON webhook_deliveries(event_type);

-- ============================================================
-- 8. Audit Logs Indexes
-- ============================================================

-- Composite index for common audit queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_timestamp 
ON audit_logs(action, timestamp DESC);

-- Fast lookup by actor
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_timestamp 
ON audit_logs(actor_stellar_address, timestamp DESC);

-- ============================================================
-- 9. Outbox Pattern Indexes
-- ============================================================

-- Fast lookup for unprocessed events
CREATE INDEX IF NOT EXISTS idx_outbox_unprocessed 
ON outbox(processed_at) 
WHERE processed_at IS NULL;

-- Event type queries
CREATE INDEX IF NOT EXISTS idx_outbox_event_type_processed 
ON outbox(event_type, processed_at);

-- ============================================================
-- 10. Exchange Rates Indexes
-- ============================================================

-- Fast lookup by base/target currency pair
CREATE INDEX IF NOT EXISTS idx_exchange_rates_base_target 
ON exchange_rates(base_currency, target_currency);

-- Valid rates only
CREATE INDEX IF NOT EXISTS idx_exchange_rates_valid_until 
ON exchange_rates(valid_until) 
WHERE valid_until > NOW();

-- ============================================================
-- 11. Idempotency Keys Indexes
-- ============================================================

-- Already have indexes, but adding composite for common pattern
CREATE INDEX IF NOT EXISTS idx_idempotency_key_method 
ON idempotency_keys(key, request_method);

-- ============================================================
-- 12. BRIN Indexes for Large Time-Series Tables
-- ============================================================

-- BRIN indexes are space-efficient for time-ordered data
-- Good for tables with natural time ordering

-- Audit logs (time-ordered)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_brin 
ON audit_logs USING brin(timestamp);

-- Webhook deliveries (time-ordered)
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at_brin 
ON webhook_deliveries USING brin(created_at);

-- ============================================================
-- 13. Partial Indexes for Common Queries
-- ============================================================

-- Only index active employees (most common query)
CREATE INDEX IF NOT EXISTS idx_employees_active 
ON employees(employer_id) 
WHERE stellar_address IS NOT NULL;

-- Only index completed MoneyGram transactions (for reports)
CREATE INDEX IF NOT EXISTS idx_moneygram_completed 
ON moneygram_transactions(created_at DESC, fiat_amount) 
WHERE status = 'completed';

-- Only index approved KYC customers
CREATE INDEX IF NOT EXISTS idx_sep12_customers_approved 
ON sep12_customers(created_at) 
WHERE kyc_status = 'APPROVED';

-- ============================================================
-- 14. Covering Indexes for Analytics Queries
-- ============================================================

-- Covering index for user growth reports
CREATE INDEX IF NOT EXISTS idx_sep12_customers_growth 
ON sep12_customers(created_at) 
INCLUDE (type, kyc_status, country);

-- Covering index for transaction volume reports
CREATE INDEX IF NOT EXISTS idx_moneygram_volume 
ON moneygram_transactions(created_at DESC, status) 
INCLUDE (crypto_amount, fiat_amount, fiat_currency);

-- Covering index for payroll reports
CREATE INDEX IF NOT EXISTS idx_payroll_claims_report 
ON payroll_claims(updated_at DESC, status) 
INCLUDE (employee_id, amount);

-- ============================================================
-- Verify Index Creation
-- ============================================================

-- Count total indexes
SELECT COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public';

-- List indexes by table
SELECT 
    tablename,
    COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY index_count DESC;

-- Index size analysis
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC
LIMIT 20;
