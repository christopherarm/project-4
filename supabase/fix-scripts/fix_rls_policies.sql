-- Dieses Skript behebt RLS-Probleme, indem es angepasste Richtlinien erstellt
-- Führe dieses Skript in der Supabase SQL-Konsole aus

-- Option 1: RLS für öffentlichen Zugriff temporär deaktivieren (NICHT für Produktion empfohlen)
-- ALTER TABLE public.trips DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.entries DISABLE ROW LEVEL SECURITY;

-- Option 2: Erlaube anonymen Benutzern das Lesen/Schreiben (VORSICHT bei sensiblen Daten)
-- Lösche existierende Richtlinien für trips
DROP POLICY IF EXISTS "Authentifizierte Benutzer können alle Trips sehen" ON public.trips;
DROP POLICY IF EXISTS "Authentifizierte Benutzer können alle Trips bearbeiten" ON public.trips;

-- Neue Richtlinien für trips erstellen (für anonyme und authentifizierte Benutzer)
CREATE POLICY "Alle Benutzer können Trips lesen" ON public.trips
    FOR SELECT USING (true);

CREATE POLICY "Alle Benutzer können Trips erstellen" ON public.trips
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Alle Benutzer können Trips aktualisieren" ON public.trips
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Alle Benutzer können Trips löschen" ON public.trips
    FOR DELETE USING (true);

-- Lösche existierende Richtlinien für entries
DROP POLICY IF EXISTS "Authentifizierte Benutzer können alle Entries sehen" ON public.entries;
DROP POLICY IF EXISTS "Authentifizierte Benutzer können alle Entries bearbeiten" ON public.entries;

-- Neue Richtlinien für entries erstellen (für anonyme und authentifizierte Benutzer)
CREATE POLICY "Alle Benutzer können Entries lesen" ON public.entries
    FOR SELECT USING (true);

CREATE POLICY "Alle Benutzer können Entries erstellen" ON public.entries
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Alle Benutzer können Entries aktualisieren" ON public.entries
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Alle Benutzer können Entries löschen" ON public.entries
    FOR DELETE USING (true);

-- Option 3 (sicherer): Erlaubt nur Zugriff für den Besitzer des Eintrags
-- Dies erfordert, dass jede Tabelle eine user_id-Spalte hat und jeder Eintrag mit der
-- entsprechenden Benutzer-ID verknüpft wird.
-- Diese Option wird hier nicht implementiert, da sie eine Änderung des Datenbankschemas
-- und des App-Codes erfordern würde. 