-- Migration: add_odometer_records
-- Description: Add odometer_records table for standalone odometer readings

CREATE TABLE odometer_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    odometer INT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attach updated_at trigger
CREATE TRIGGER set_odometer_records_updated_at
BEFORE UPDATE ON odometer_records
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- Enable Row Level Security (RLS)
ALTER TABLE odometer_records ENABLE ROW LEVEL SECURITY;

-- Define RLS Policies
CREATE POLICY "Users can view odometer records for their vehicles"
    ON odometer_records FOR SELECT
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = odometer_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can insert odometer records for their vehicles"
    ON odometer_records FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = odometer_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can update odometer records for their vehicles"
    ON odometer_records FOR UPDATE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = odometer_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can delete odometer records for their vehicles"
    ON odometer_records FOR DELETE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = odometer_records.vehicle_id AND vehicles.user_id = auth.uid()));
