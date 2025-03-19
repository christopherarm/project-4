# Reise-App Supabase Setup

Dieses Verzeichnis enthält alle notwendigen Dateien und Skripte, um die Supabase-Datenbank für die Reise-App einzurichten und zu verwenden.

## Voraussetzungen

- [Supabase CLI](https://supabase.com/docs/guides/cli) installiert
- Docker installiert (für lokale Supabase-Entwicklung)

## Struktur

- `migrations/` - SQL-Migrations-Skripte
  - `initial_schema.sql` - Erstellt die grundlegenden Tabellen und Indizes
  - `advanced_functions.sql` - Erstellt zusätzliche Funktionen und Views
  - `test_data.sql` - Fügt Testdaten in die Datenbank ein
- `setup.sh` - Skript zur Einrichtung der Supabase-Umgebung

## Einrichtung

1. Stellen Sie sicher, dass die Supabase CLI installiert ist:

   ```bash
   supabase -v
   ```

2. Führen Sie das Setup-Skript aus:

   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   Das Skript führt folgende Schritte aus:

   - Initialisierung von Supabase lokal (falls noch nicht geschehen)
   - Starten der lokalen Supabase-Instanz
   - Ausführen der Migrations-Skripte
   - Optional: Einfügen von Testdaten

## Tabellenstruktur

### Trips

- `id` - UUID, Primärschlüssel
- `title` - Titel der Reise
- `description` - Beschreibung der Reise
- `start_date` - Startdatum
- `end_date` - Enddatum
- `created_at` - Erstellungszeitpunkt
- `updated_at` - Letzter Aktualisierungszeitpunkt
- `deleted` - Soft-Delete-Flag

### Entries

- `id` - UUID, Primärschlüssel
- `trip_id` - Fremdschlüssel zur trips-Tabelle
- `title` - Titel des Eintrags
- `content` - Inhalt des Eintrags
- `location` - Ortsname
- `latitude` - Breitengrad
- `longitude` - Längengrad
- `created_at` - Erstellungszeitpunkt
- `updated_at` - Letzter Aktualisierungszeitpunkt
- `deleted` - Soft-Delete-Flag

## Hilfreiche Funktionen

- `get_active_trips()` - Gibt alle aktiven (nicht gelöschten) Trips zurück
- `get_entries_by_trip_id(trip_uuid)` - Gibt alle Einträge für einen bestimmten Trip zurück
- `get_entry_count_per_trip()` - Gibt die Anzahl der Einträge pro Trip zurück
- `search_entries(search_term)` - Volltextsuche in Einträgen

## Synchronisierung mit der lokalen SQLite-Datenbank

Die App verwendet eine lokale SQLite-Datenbank für den Offline-Modus und synchronisiert die Daten mit Supabase, wenn eine Internetverbindung verfügbar ist. Alle Änderungen werden in der lokalen Datenbank mit einem Sync-Status versehen, um den Synchronisierungsstatus zu verfolgen.

## Entwicklung

Für die Entwicklung können Sie die Supabase-Instanz wie folgt starten/stoppen:

```bash
# Starten
supabase start

# Stoppen
supabase stop
```

Die Supabase-Konsole ist unter `http://localhost:54323` verfügbar.

## Produktionsumgebung

Für die Produktionsumgebung müssen Sie ein Supabase-Projekt erstellen und die Migrations-Skripte dort ausführen. Stellen Sie sicher, dass die entsprechenden Umgebungsvariablen in der App konfiguriert sind.

```bash
# Ausführen der Migrations in der Produktionsumgebung
supabase db push --db-url="postgres://postgres:postgres@db.example.com:5432/postgres"
```
