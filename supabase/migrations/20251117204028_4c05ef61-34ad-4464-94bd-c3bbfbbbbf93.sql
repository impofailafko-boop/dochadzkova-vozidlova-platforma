-- Create finance_sheets table for managing multiple finance sheets
CREATE TABLE public.finance_sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NULL,
  is_default BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.finance_sheets ENABLE ROW LEVEL SECURITY;

-- RLS policies for finance_sheets
CREATE POLICY "Admins can view all finance sheets"
ON public.finance_sheets
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert finance sheets"
ON public.finance_sheets
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update finance sheets"
ON public.finance_sheets
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete finance sheets"
ON public.finance_sheets
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add sheet_id to finance_records
ALTER TABLE public.finance_records
ADD COLUMN sheet_id UUID NULL REFERENCES public.finance_sheets(id) ON DELETE CASCADE;

-- Create default sheet and migrate existing records
DO $$
DECLARE
  default_sheet_id UUID;
BEGIN
  -- Create default sheet
  INSERT INTO public.finance_sheets (name, is_default)
  VALUES ('Hlavný hárok', true)
  RETURNING id INTO default_sheet_id;
  
  -- Update existing records to use default sheet
  UPDATE public.finance_records
  SET sheet_id = default_sheet_id
  WHERE sheet_id IS NULL;
END $$;

-- Make sheet_id required after migration
ALTER TABLE public.finance_records
ALTER COLUMN sheet_id SET NOT NULL;