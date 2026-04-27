-- Seed MoneyGram locations for testing
-- This adds sample pickup locations for common corridors

INSERT INTO moneygram_locations (location_id, name, address_line1, city, state_province, country, postal_code, latitude, longitude, phone, services_offered, is_active)
VALUES 
  ('MG-MEX-001', 'MoneyGram - Oxxo Store Reforma', 'Av. Reforma 123', 'Mexico City', 'CDMX', 'MX', '06600', 19.4326, -99.1332, '+52 55 1234 5678', ARRAY['cash_pickup','bank_deposit'], true),
  ('MG-MEX-002', 'MoneyGram - Walmart Polanco', 'Calle Masaryk 456', 'Mexico City', 'CDMX', 'MX', '11560', 19.4363, -99.1913, '+52 55 2345 6789', ARRAY['cash_pickup'], true),
  ('MG-MEX-003', 'MoneyGram - Soriana Centro', 'Av. Juarez 789', 'Guadalajara', 'Jalisco', 'MX', '44100', 20.6737, -103.3440, '+52 33 3456 7890', ARRAY['cash_pickup','bank_deposit'], true),
  ('MG-MEX-004', 'MoneyGram - Chedraui Monterrey', 'Av. Constitucion 321', 'Monterrey', 'Nuevo Leon', 'MX', '64000', 25.6866, -100.3161, '+52 81 4567 8901', ARRAY['cash_pickup'], true),
  
  ('MG-IND-001', 'MoneyGram - HDFC Bank Mumbai', 'Nariman Point', 'Mumbai', 'Maharashtra', 'IN', '400021', 18.9298, 72.8275, '+91 22 6789 0123', ARRAY['cash_pickup','bank_deposit'], true),
  ('MG-IND-002', 'MoneyGram - ICICI Delhi', 'Connaught Place', 'New Delhi', 'Delhi', 'IN', '110001', 28.6315, 77.2167, '+91 11 7890 1234', ARRAY['cash_pickup'], true),
  ('MG-IND-003', 'MoneyGram - SBI Bangalore', 'MG Road', 'Bangalore', 'Karnataka', 'IN', '560001', 12.9716, 77.5946, '+91 80 8901 2345', ARRAY['cash_pickup','bank_deposit'], true),
  
  ('MG-PHL-001', 'MoneyGram - BDO Manila', 'Makati Avenue', 'Manila', 'Metro Manila', 'PH', '1200', 14.5547, 121.0244, '+63 2 9012 3456', ARRAY['cash_pickup','bank_deposit'], true),
  ('MG-PHL-002', 'MoneyGram - Cebuana Lhuillier', 'Colon Street', 'Cebu City', 'Cebu', 'PH', '6000', 10.3104, 123.8982, '+63 32 0123 4567', ARRAY['cash_pickup'], true),
  
  ('MG-GHA-001', 'MoneyGram - Ecobank Accra', 'Independence Avenue', 'Accra', 'Greater Accra', 'GH', '00233', 5.5560, -0.1969, '+233 30 123 4567', ARRAY['cash_pickup','bank_deposit'], true),
  ('MG-GHA-002', 'MoneyGram - Stanbic Bank', 'Kwame Nkrumah Ave', 'Kumasi', 'Ashanti', 'GH', '00233', 6.6885, -1.6244, '+233 32 234 5678', ARRAY['cash_pickup'], true),
  
  ('MG-NGA-001', 'MoneyGram - GTBank Lagos', 'Victoria Island', 'Lagos', 'Lagos', 'NG', '101241', 6.4281, 3.4219, '+234 1 345 6789', ARRAY['cash_pickup','bank_deposit'], true),
  ('MG-NGA-002', 'MoneyGram - First Bank Abuja', 'Central Business District', 'Abuja', 'FCT', 'NG', '900211', 9.0579, 7.4951, '+234 9 456 7890', ARRAY['cash_pickup'], true)
  
ON CONFLICT (location_id) DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as total_locations, country 
FROM moneygram_locations 
GROUP BY country 
ORDER BY country;
