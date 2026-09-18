-- Create vehicle_documents table
CREATE TABLE public.vehicle_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE CASCADE NOT NULL,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('driving_license', 'insurance', 'bluebook')),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(vehicle_id, doc_type)
);

-- RLS policies for vehicle_documents
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vehicle documents"
  ON public.vehicle_documents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vehicle documents"
  ON public.vehicle_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vehicle documents"
  ON public.vehicle_documents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vehicle documents"
  ON public.vehicle_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_vehicle_documents_updated_at
  BEFORE UPDATE ON public.vehicle_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle_documents', 'vehicle_documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Users can view their own document files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'vehicle_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own document files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vehicle_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own document files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'vehicle_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own document files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vehicle_documents' AND auth.uid()::text = (storage.foldername(name))[1]);
