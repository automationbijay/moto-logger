-- Migration: init_schema
-- Description: Initialize the base relational schema for Motorcycle Log

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL, -- references auth.users(id) in a real setup, assuming Supabase Auth
    year INT NOT NULL,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    license_plate TEXT,
    purchase_date DATE,
    sold_date DATE,
    purchase_price NUMERIC,
    sold_price NUMERIC,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    odometer INT NOT NULL,
    description TEXT NOT NULL,
    cost NUMERIC DEFAULT 0.0,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE fuel_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    odometer INT NOT NULL,
    liters NUMERIC NOT NULL,
    cost NUMERIC NOT NULL,
    is_fill_to_full BOOLEAN DEFAULT true,
    missed_previous_fill BOOLEAN DEFAULT false,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_records ENABLE ROW LEVEL SECURITY;

-- Basic Policies for 'vehicles'
CREATE POLICY "Users can view their own vehicles"
    ON vehicles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicles"
    ON vehicles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicles"
    ON vehicles FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicles"
    ON vehicles FOR DELETE
    USING (auth.uid() = user_id);

-- Basic Policies for 'service_records' (Inherits access from vehicle)
CREATE POLICY "Users can view service records for their vehicles"
    ON service_records FOR SELECT
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = service_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can insert service records for their vehicles"
    ON service_records FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = service_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can update service records for their vehicles"
    ON service_records FOR UPDATE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = service_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can delete service records for their vehicles"
    ON service_records FOR DELETE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = service_records.vehicle_id AND vehicles.user_id = auth.uid()));

-- Basic Policies for 'fuel_records'
CREATE POLICY "Users can view fuel records for their vehicles"
    ON fuel_records FOR SELECT
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = fuel_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can insert fuel records for their vehicles"
    ON fuel_records FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = fuel_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can update fuel records for their vehicles"
    ON fuel_records FOR UPDATE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = fuel_records.vehicle_id AND vehicles.user_id = auth.uid()));

CREATE POLICY "Users can delete fuel records for their vehicles"
    ON fuel_records FOR DELETE
    USING (EXISTS (SELECT 1 FROM vehicles WHERE vehicles.id = fuel_records.vehicle_id AND vehicles.user_id = auth.uid()));
