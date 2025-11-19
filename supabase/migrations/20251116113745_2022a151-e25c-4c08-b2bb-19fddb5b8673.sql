-- Update documents table to support multiple file URLs
ALTER TABLE public.documents 
DROP COLUMN file_url;

ALTER TABLE public.documents 
ADD COLUMN file_urls text[] DEFAULT ARRAY[]::text[];