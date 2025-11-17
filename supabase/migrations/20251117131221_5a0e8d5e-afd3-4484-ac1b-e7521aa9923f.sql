-- Create finance_records table
CREATE TABLE public.finance_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL,
  location TEXT,
  completion_deadline DATE,
  worker TEXT,
  scope_by_order TEXT,
  total_vsd NUMERIC,
  paid_employees NUMERIC,
  profit NUMERIC,
  completion_date DATE,
  invoice_number TEXT,
  scope_by_invoice TEXT,
  actual_scope TEXT,
  by_employee TEXT,
  notes TEXT,
  row_color TEXT DEFAULT '#ffffff',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.finance_records ENABLE ROW LEVEL SECURITY;

-- Admins can manage all finance records
CREATE POLICY "Admins can view all finance records"
ON public.finance_records
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert finance records"
ON public.finance_records
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update finance records"
ON public.finance_records
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete finance records"
ON public.finance_records
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));