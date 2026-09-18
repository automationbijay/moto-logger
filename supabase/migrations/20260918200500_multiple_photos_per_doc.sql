ALTER TABLE public.vehicle_documents 
ADD COLUMN storage_paths TEXT[] DEFAULT '{}';

UPDATE public.vehicle_documents 
SET storage_paths = ARRAY[storage_path] 
WHERE storage_path IS NOT NULL;

ALTER TABLE public.vehicle_documents 
DROP COLUMN storage_path;
