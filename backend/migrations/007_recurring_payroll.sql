-- Migration 007: Recurring Payroll Feature
-- Adds support for automatic recurring payroll schedules

-- ============================================================
-- 1. Recurring Payroll Schedules Table
-- ============================================================

CREATE TABLE IF NOT EXISTS recurring_payroll_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID REFERENCES employers(id) ON DELETE CASCADE,
    
    -- Schedule configuration
    schedule_name VARCHAR(100) NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly')),
    day_of_week INTEGER CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)), -- 0=Sunday, 6=Saturday
    day_of_month INTEGER CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
    
    -- Payroll settings
    start_date DATE NOT NULL,
    end_date DATE, -- NULL = indefinite
    auto_run BOOLEAN DEFAULT TRUE, -- Automatically run payroll on schedule
    
    -- Employee selection
    include_all_employees BOOLEAN DEFAULT TRUE,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    last_run_at TIMESTAMP,
    next_run_at TIMESTAMP,
    total_runs INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Ensure valid schedule configuration
    CONSTRAINT valid_schedule CHECK (
        (frequency = 'weekly' OR frequency = 'biweekly') AND day_of_week IS NOT NULL
        OR
        (frequency = 'monthly' OR frequency = 'quarterly') AND day_of_month IS NOT NULL
    )
);

-- Indexes for recurring schedules
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_employer 
ON recurring_payroll_schedules(employer_id);

CREATE INDEX IF NOT EXISTS idx_recurring_schedules_active 
ON recurring_payroll_schedules(is_active) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_recurring_schedules_next_run 
ON recurring_payroll_schedules(next_run_at) 
WHERE is_active = TRUE AND auto_run = TRUE;

CREATE INDEX IF NOT EXISTS idx_recurring_schedules_frequency 
ON recurring_payroll_schedules(frequency);

-- ============================================================
-- 2. Recurring Payroll Employees (override default employees)
-- ============================================================

CREATE TABLE IF NOT EXISTS recurring_payroll_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES recurring_payroll_schedules(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    
    -- Override salary for this schedule
    override_salary BIGINT, -- NULL = use default employee salary
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(schedule_id, employee_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_recurring_employees_schedule 
ON recurring_payroll_employees(schedule_id);

CREATE INDEX IF NOT EXISTS idx_recurring_employees_active 
ON recurring_payroll_employees(is_active) 
WHERE is_active = TRUE;

-- ============================================================
-- 3. Recurring Payroll Run History
-- ============================================================

CREATE TABLE IF NOT EXISTS recurring_payroll_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID REFERENCES recurring_payroll_schedules(id) ON DELETE CASCADE,
    payroll_period_id UUID REFERENCES payroll_periods(id) ON DELETE SET NULL,
    
    -- Run details
    run_status VARCHAR(20) NOT NULL DEFAULT 'scheduled' 
        CHECK (run_status IN ('scheduled', 'processing', 'completed', 'failed', 'skipped')),
    
    -- Results
    total_amount BIGINT,
    employee_count INTEGER,
    transaction_hash VARCHAR(100),
    
    -- Error handling
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    
    -- Timing
    scheduled_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for run history
CREATE INDEX IF NOT EXISTS idx_recurring_runs_schedule 
ON recurring_payroll_runs(schedule_id);

CREATE INDEX IF NOT EXISTS idx_recurring_runs_status 
ON recurring_payroll_runs(run_status);

CREATE INDEX IF NOT EXISTS idx_recurring_runs_scheduled 
ON recurring_payroll_runs(scheduled_at) 
WHERE run_status = 'scheduled';

CREATE INDEX IF NOT EXISTS idx_recurring_runs_failed 
ON recurring_payroll_runs(run_status, retry_count) 
WHERE run_status = 'failed' AND retry_count < 3;

CREATE INDEX IF NOT EXISTS idx_recurring_runs_period 
ON recurring_payroll_runs(payroll_period_id);

-- ============================================================
-- 4. Add columns to payroll_periods for recurring tracking
-- ============================================================

ALTER TABLE payroll_periods 
ADD COLUMN IF NOT EXISTS schedule_id UUID REFERENCES recurring_payroll_schedules(id) ON DELETE SET NULL;

ALTER TABLE payroll_periods 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Index for recurring periods
CREATE INDEX IF NOT EXISTS idx_payroll_periods_recurring 
ON payroll_periods(schedule_id) 
WHERE is_recurring = TRUE;

-- ============================================================
-- 5. Helper Functions
-- ============================================================

-- Function to calculate next run date
CREATE OR REPLACE FUNCTION calculate_next_run(
    p_frequency VARCHAR,
    p_current_date DATE,
    p_day_of_week INTEGER,
    p_day_of_month INTEGER
) RETURNS DATE AS $$
DECLARE
    next_date DATE;
BEGIN
    CASE p_frequency
        WHEN 'weekly' THEN
            -- Next week on same day
            next_date := p_current_date + INTERVAL '7 days';
            
        WHEN 'biweekly' THEN
            -- Every 2 weeks
            next_date := p_current_date + INTERVAL '14 days';
            
        WHEN 'monthly' THEN
            -- Same day next month
            next_date := (p_current_date + INTERVAL '1 month')::DATE;
            -- Adjust if day doesn't exist in next month
            WHILE EXTRACT(DAY FROM next_date) != p_day_of_month LOOP
                next_date := next_date - INTERVAL '1 day';
            END LOOP;
            
        WHEN 'quarterly' THEN
            -- Every 3 months
            next_date := (p_current_date + INTERVAL '3 months')::DATE;
            -- Adjust if day doesn't exist
            WHILE EXTRACT(DAY FROM next_date) != p_day_of_month LOOP
                next_date := next_date - INTERVAL '1 day';
            END LOOP;
            
        ELSE
            next_date := p_current_date + INTERVAL '1 month';
    END CASE;
    
    RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Function to update next_run_at after a run
CREATE OR REPLACE FUNCTION update_schedule_next_run() RETURNS TRIGGER AS $$
BEGIN
    -- Update the schedule's next_run_at and total_runs
    UPDATE recurring_payroll_schedules
    SET 
        last_run_at = NEW.completed_at,
        next_run_at = calculate_next_run(
            s.frequency,
            NEW.scheduled_at::DATE,
            s.day_of_week,
            s.day_of_month
        ),
        total_runs = s.total_runs + 1
    FROM recurring_payroll_schedules s
    WHERE s.id = NEW.schedule_id
    AND NEW.run_status = 'completed';
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update schedule after run
CREATE TRIGGER trg_update_schedule_next_run
    AFTER INSERT ON recurring_payroll_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_schedule_next_run();

-- ============================================================
-- 6. Views for Analytics
-- ============================================================

-- View: Active recurring schedules summary
CREATE OR REPLACE VIEW v_active_recurring_schedules AS
SELECT 
    s.id,
    s.employer_id,
    s.schedule_name,
    s.frequency,
    s.is_active,
    s.auto_run,
    s.last_run_at,
    s.next_run_at,
    s.total_runs,
    COUNT(DISTINCT re.employee_id) as employee_count,
    SUM(CASE WHEN re.override_salary IS NOT NULL THEN re.override_salary ELSE e.salary END) as total_payroll_amount
FROM recurring_payroll_schedules s
LEFT JOIN recurring_payroll_employees re ON s.id = re.schedule_id AND re.is_active = TRUE
LEFT JOIN employees e ON re.employee_id = e.id
WHERE s.is_active = TRUE
GROUP BY s.id;

-- View: Upcoming payroll runs
CREATE OR REPLACE VIEW v_upcoming_payroll_runs AS
SELECT 
    s.id as schedule_id,
    s.schedule_name,
    s.frequency,
    s.next_run_at,
    s.auto_run,
    COUNT(DISTINCT re.employee_id) as employee_count,
    SUM(CASE WHEN re.override_salary IS NOT NULL THEN re.override_salary ELSE e.salary END) as estimated_amount
FROM recurring_payroll_schedules s
LEFT JOIN recurring_payroll_employees re ON s.id = re.schedule_id AND re.is_active = TRUE
LEFT JOIN employees e ON re.employee_id = e.id
WHERE s.is_active = TRUE 
  AND s.auto_run = TRUE
  AND s.next_run_at <= NOW() + INTERVAL '7 days'
GROUP BY s.id;

-- ============================================================
-- Verify Migration
-- ============================================================

-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'recurring%'
ORDER BY table_name;

-- Check indexes
SELECT COUNT(*) as index_count
FROM pg_indexes 
WHERE tablename LIKE 'recurring%';

-- Check functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%next_run%'
  OR routine_name LIKE '%calculate%';
