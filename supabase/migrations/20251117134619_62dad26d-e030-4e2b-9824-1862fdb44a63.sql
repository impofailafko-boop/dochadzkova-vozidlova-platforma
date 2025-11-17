-- Add column for cell colors (JSON object storing colors for individual cells)
ALTER TABLE public.finance_records 
ADD COLUMN cell_colors JSONB DEFAULT '{}'::jsonb;