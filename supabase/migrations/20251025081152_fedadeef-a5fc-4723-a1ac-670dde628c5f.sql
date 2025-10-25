-- Pridať enum typ pre typ pracovného vzťahu
CREATE TYPE public.employment_type AS ENUM ('zivnost', 'dohoda');

-- Pridať stĺpec employment_type do profiles tabuľky
ALTER TABLE public.profiles 
ADD COLUMN employment_type public.employment_type DEFAULT 'zivnost';