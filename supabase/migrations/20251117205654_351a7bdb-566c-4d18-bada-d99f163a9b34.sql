-- Add column configuration to finance sheets
ALTER TABLE finance_sheets
ADD COLUMN column_config JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN finance_sheets.column_config IS 'Stores custom column configuration including names, visibility, and order';