-- Create monthly vehicle summary function with full filtering options
-- This function aggregates vehicle usage data for a specific month
-- Includes vehicles with no activity, project filter, and both active/archived vehicles

CREATE OR REPLACE FUNCTION public.get_monthly_vehicle_summary(
  _month INTEGER,
  _year INTEGER,
  _vehicle_id UUID DEFAULT NULL,
  _project_id UUID DEFAULT NULL,
  _include_inactive BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  vehicle_id UUID,
  vehicle_spz TEXT,
  vehicle_brand TEXT,
  vehicle_type TEXT,
  is_active BOOLEAN,
  total_km INTEGER,
  total_fuel_liters NUMERIC,
  total_fuel_cost NUMERIC,
  avg_consumption NUMERIC,
  drive_count BIGINT,
  fueling_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security check: only admins can execute this function
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Validate month and year
  IF _month < 1 OR _month > 12 THEN
    RAISE EXCEPTION 'Invalid month. Must be between 1 and 12.';
  END IF;

  IF _year < 2000 OR _year > 2100 THEN
    RAISE EXCEPTION 'Invalid year. Must be between 2000 and 2100.';
  END IF;

  RETURN QUERY
  SELECT
    v.id AS vehicle_id,
    v.spz AS vehicle_spz,
    v.brand AS vehicle_brand,
    v.type AS vehicle_type,
    v.is_active,
    COALESCE(SUM(vl.km_driven), 0)::INTEGER AS total_km,
    COALESCE(SUM(fl.liters), 0) AS total_fuel_liters,
    COALESCE(SUM(fl.price), 0) AS total_fuel_cost,
    CASE 
      WHEN COALESCE(SUM(vl.km_driven), 0) > 0 AND COALESCE(SUM(fl.liters), 0) > 0 
      THEN ROUND((COALESCE(SUM(fl.liters), 0) / COALESCE(SUM(vl.km_driven), 0)) * 100, 2)
      ELSE 0
    END AS avg_consumption,
    COUNT(DISTINCT vl.id) AS drive_count,
    COUNT(DISTINCT fl.id) AS fueling_count
  FROM public.vehicles v
  LEFT JOIN public.vehicle_logs vl 
    ON v.id = vl.vehicle_id
    AND EXTRACT(MONTH FROM vl.date) = _month
    AND EXTRACT(YEAR FROM vl.date) = _year
    AND (_project_id IS NULL OR vl.project_id = _project_id)
  LEFT JOIN public.fuel_logs fl
    ON v.id = fl.vehicle_id
    AND EXTRACT(MONTH FROM fl.date) = _month
    AND EXTRACT(YEAR FROM fl.date) = _year
    AND (_project_id IS NULL OR fl.project_id = _project_id)
  WHERE 
    (_vehicle_id IS NULL OR v.id = _vehicle_id)
    AND (_include_inactive = TRUE OR v.is_active = TRUE)
  GROUP BY v.id, v.spz, v.brand, v.type, v.is_active
  ORDER BY v.spz;
END;
$$;