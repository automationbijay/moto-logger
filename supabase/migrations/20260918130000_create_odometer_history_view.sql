-- Migration: create_odometer_history_view
-- Description: Create a unified view of all odometer readings across the app

CREATE OR REPLACE VIEW odometer_history AS
SELECT 
    vehicle_id, 
    date, 
    odometer, 
    'fuel' AS source_type, 
    id AS source_id,
    created_at
FROM fuel_records
UNION ALL
SELECT 
    vehicle_id, 
    date, 
    odometer, 
    'service' AS source_type, 
    id AS source_id,
    created_at
FROM service_records
UNION ALL
SELECT 
    vehicle_id, 
    date, 
    odometer, 
    'upgrade' AS source_type, 
    id AS source_id,
    created_at
FROM upgrade_records
UNION ALL
SELECT 
    vehicle_id, 
    date, 
    odometer, 
    'standalone' AS source_type, 
    id AS source_id,
    created_at
FROM odometer_records;

-- Grant access to authenticated users
GRANT SELECT ON odometer_history TO authenticated;
GRANT SELECT ON odometer_history TO service_role;
