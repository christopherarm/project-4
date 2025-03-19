#!/bin/bash

# Supabase CLI Setup-Skript für Reise-App Datenbank

# Prüft, ob die Supabase CLI installiert ist
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI ist nicht installiert. Bitte installieren Sie sie zuerst."
    echo "Anleitung: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Setze Umgebungsvariablen (falls nötig)
# export SUPABASE_ACCESS_TOKEN=your_access_token

# Initialisiere Supabase lokal (falls noch nicht geschehen)
if [ ! -d .supabase ]; then
    echo "Initialisiere Supabase lokal..."
    supabase init
fi

# Starte Supabase lokal
echo "Starte Supabase lokal..."
supabase start

# Warte, bis Supabase vollständig hochgefahren ist
echo "Warte, bis Supabase bereit ist..."
sleep 10

# Führe die Migrations-Skripte aus
echo "Führe Migrations-Skripte aus..."
supabase db reset

echo "Setup abgeschlossen. Supabase läuft lokal und die Datenbank ist initialisiert."
echo "Sie können nun mit der Entwicklung beginnen."

# Ausgabe der Supabase-URL und des Anon-Keys
echo "--------------------------------------"
echo "Supabase-URL: $(supabase status | grep 'API URL' | awk '{print $3}')"
echo "Supabase-Anon-Key: $(supabase status | grep 'service_role key' | awk '{print $3}')"
echo "--------------------------------------"

# Frage, ob Testdaten eingefügt werden sollen
read -p "Möchten Sie Testdaten einfügen? (j/n): " insert_test_data

if [ "$insert_test_data" = "j" ] || [ "$insert_test_data" = "J" ]; then
    echo "Füge Testdaten ein..."
    
    # SQL-Skript zum Einfügen von Testdaten ausführen
    supabase db execute --file ./migrations/test_data.sql
    
    echo "Testdaten wurden eingefügt."
fi

echo "Setup abgeschlossen!" 