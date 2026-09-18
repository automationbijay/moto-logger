-- Migration: add_updated_at
-- Description: Add updated_at columns and triggers

-- 1. Add updated_at column to tables that don't have it
ALTER TABLE service_records ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE fuel_records ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Create a generic function to update the updated_at column
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach the trigger to all tables
CREATE TRIGGER set_vehicles_updated_at
BEFORE UPDATE ON vehicles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_service_records_updated_at
BEFORE UPDATE ON service_records
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_fuel_records_updated_at
BEFORE UPDATE ON fuel_records
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();
