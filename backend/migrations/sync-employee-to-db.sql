-- Manual SQL to add the employee that was added via smart contract
-- This employee was added on-chain but not synced to the database

-- First, get the employer ID (replace with your actual employer address)
INSERT INTO employees (employer_id, employee_address, salary, currency, created_at)
SELECT 
  id as employer_id,
  'GCB45M5QPCYQMPD7SQRIF5KIBFKJEL2GW5KDVS36FO7WI2OYGYNWC5EA' as employee_address,
  100000000 as salary,  -- 10 USDC in stroops (7 decimals)
  'USDC' as currency,
  CURRENT_TIMESTAMP as created_at
FROM employers
WHERE stellar_address = 'GCA7HGBAXWA4VOXDEU6I5RMLDDDXH6RDES4SEYON3TR62NUEJY5ER6WQ'  -- Replace with your employer wallet address
ON CONFLICT DO NOTHING;

-- Verify the employee was added
SELECT e.*, emp.stellar_address as employer_address
FROM employees e
JOIN employers emp ON e.employer_id = emp.id
WHERE e.employee_address = 'GCB45M5QPCYQMPD7SQRIF5KIBFKJEL2GW5KDVS36FO7WI2OYGYNWC5EA';
