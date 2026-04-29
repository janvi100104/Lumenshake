-- Add metadata column to transactions table for storing additional transaction data
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
