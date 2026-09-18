-- Migration: secondary_tables
-- Description: Add tax_records, upgrade_records, reminders, and notes tables

-- 1. Create tax_records table
CREATE TABLE tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC DEFAULT 0.0,
    notes TEXT,
    is_recurring BOOLEAN DEFAULT false,
    recurring_interval_months INT DEFAULT 12,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create upgrade_records table
CREATE TABLE upgrade_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    odometer INT NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC DEFAULT 0.0,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create reminders table
CREATE TABLE reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,
    metric TEXT NOT NULL, -- 'Date', 'Odometer', or 'Both'
    target_odometer INT,
    recurring_odometer_interval INT,
    target_date DATE,
    recurring_date_interval_months INT,
    is_recurring BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create notes table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    notes_content TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Attach updated_at triggers
CREATE TRIGGER set_tax_records_updated_at
BEFORE UPDATE ON tax_records
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_upgrade_records_updated_at
BEFORE UPDATE ON upgrade_records
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_reminders_updated_at
BEFORE UPDATE ON reminders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 6. Enable Row Level Security (RLS)
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE upgrade_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- 7. Define RLS Policies
-- Policies for 'tax_records'
CREATE POLICY "Users can view tax records for their vehicles"
    ON tax_records FOR SELECT
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = tax_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can insert tax records for their vehicles"
    ON tax_records FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = tax_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can update tax records for their vehicles"
    ON tax_records FOR UPDATE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = tax_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can delete tax records for their vehicles"
    ON tax_records FOR DELETE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = tax_records.vehicle_id AND vehicles.user_id = auth.uid()));

-- Policies for 'upgrade_records'
CREATE POLICY "Users can view upgrade records for their vehicles"
    ON upgrade_records FOR SELECT
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = upgrade_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can insert upgrade records for their vehicles"
    ON upgrade_records FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = upgrade_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can update upgrade records for their vehicles"
    ON upgrade_records FOR UPDATE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = upgrade_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can delete upgrade records for their vehicles"
    ON upgrade_records FOR DELETE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = upgrade_records.vehicle_id AND vehicles.user_id = auth.uid()));

-- Policies for 'reminders'
CREATE POLICY "Users can view reminders for their vehicles"
    ON reminders FOR SELECT
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = reminders.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can insert reminders for their vehicles"
    ON reminders FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = reminders.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can update reminders for their vehicles"
    ON reminders FOR UPDATE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = reminders.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can delete reminders for their vehicles"
    ON reminders FOR DELETE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = reminders.vehicle_id AND vehicles.user_id = auth.uid()));

-- Policies for 'notes'
CREATE POLICY "Users can view notes for their vehicles"
    ON notes FOR SELECT
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = notes.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can insert notes for their vehicles"
    ON notes FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = notes.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can update notes for their vehicles"
    ON notes FOR UPDATE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = notes.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can delete notes for their vehicles"
    ON notes FOR DELETE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = notes.vehicle_id AND vehicles.user_id = auth.uid()));
