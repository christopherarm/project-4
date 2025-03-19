-- Erstelle die Trips-Tabelle
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted BOOLEAN DEFAULT FALSE
);

-- Erstelle die Entries-Tabelle
CREATE TABLE IF NOT EXISTS public.entries (
  id UUID PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id),
  title TEXT NOT NULL,
  content TEXT,
  location TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted BOOLEAN DEFAULT FALSE
);

-- Erstelle Indizes für bessere Abfrageleistung
CREATE INDEX IF NOT EXISTS idx_trips_updated_at ON public.trips(updated_at);
CREATE INDEX IF NOT EXISTS idx_entries_updated_at ON public.entries(updated_at);
CREATE INDEX IF NOT EXISTS idx_entries_trip_id ON public.entries(trip_id);

-- Aktiviere Row-Level-Security
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Erstelle RLS-Richtlinien (Row Level Security)
-- Einfache Beispielrichtlinie: Authentifizierte Benutzer können alles sehen
CREATE POLICY "Authentifizierte Benutzer können alle Trips sehen" ON public.trips
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authentifizierte Benutzer können alle Trips bearbeiten" ON public.trips
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authentifizierte Benutzer können alle Entries sehen" ON public.entries
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authentifizierte Benutzer können alle Entries bearbeiten" ON public.entries
  FOR ALL USING (auth.role() = 'authenticated');

-- Erstelle Funktion für die automatische Aktualisierung des updated_at-Felds
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Erstelle Trigger für die automatische Aktualisierung des updated_at-Felds
CREATE TRIGGER set_updated_at_trips
BEFORE UPDATE ON public.trips
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_entries
BEFORE UPDATE ON public.entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at(); 