-- Funktion zum Abrufen aller aktuellen Trips (nicht gelöschte)
CREATE OR REPLACE FUNCTION get_active_trips()
RETURNS SETOF trips AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.trips
  WHERE deleted = FALSE
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Abrufen aller Entries für einen bestimmten Trip
CREATE OR REPLACE FUNCTION get_entries_by_trip_id(trip_uuid UUID)
RETURNS SETOF entries AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM public.entries
  WHERE trip_id = trip_uuid AND deleted = FALSE
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Funktion zum Abrufen der Anzahl von Entries pro Trip
CREATE OR REPLACE FUNCTION get_entry_count_per_trip()
RETURNS TABLE (
  trip_id UUID,
  trip_title TEXT,
  entry_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id, 
    t.title, 
    COUNT(e.id)::BIGINT
  FROM 
    public.trips t
  LEFT JOIN 
    public.entries e ON t.id = e.trip_id AND e.deleted = FALSE
  WHERE 
    t.deleted = FALSE
  GROUP BY 
    t.id, t.title
  ORDER BY 
    t.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Erstelle eine View für Trip-Zusammenfassungen
CREATE OR REPLACE VIEW trip_summaries AS
SELECT 
  t.id AS trip_id,
  t.title AS trip_title,
  t.description,
  t.start_date,
  t.end_date,
  COUNT(e.id) AS entry_count,
  MIN(e.created_at) AS first_entry_date,
  MAX(e.created_at) AS last_entry_date,
  string_agg(DISTINCT e.location, ', ') FILTER (WHERE e.location IS NOT NULL) AS locations
FROM 
  public.trips t
LEFT JOIN 
  public.entries e ON t.id = e.trip_id AND e.deleted = FALSE
WHERE 
  t.deleted = FALSE
GROUP BY 
  t.id, t.title, t.description, t.start_date, t.end_date
ORDER BY 
  t.created_at DESC;

-- Zusätzlicher Index für schnellere Volltextsuche in Entries
CREATE INDEX IF NOT EXISTS idx_entries_fulltext 
ON public.entries 
USING gin(to_tsvector('german', title || ' ' || COALESCE(content, '')));

-- Funktion für Volltextsuche in Entries
CREATE OR REPLACE FUNCTION search_entries(search_term TEXT)
RETURNS SETOF entries AS $$
BEGIN
  RETURN QUERY
  SELECT e.*
  FROM public.entries e
  WHERE 
    to_tsvector('german', e.title || ' ' || COALESCE(e.content, '')) @@ to_tsquery('german', search_term)
    AND e.deleted = FALSE
  ORDER BY ts_rank(to_tsvector('german', e.title || ' ' || COALESCE(e.content, '')), to_tsquery('german', search_term)) DESC;
END;
$$ LANGUAGE plpgsql; 