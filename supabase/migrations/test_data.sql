-- Testdaten für die Trips-Tabelle einfügen
INSERT INTO public.trips (id, title, description, start_date, end_date, created_at, updated_at, deleted)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'Italien-Urlaub', 'Urlaub in Südtirol und Gardasee', '2023-06-15'::timestamp with time zone, '2023-06-25'::timestamp with time zone, '2023-05-10 10:00:00'::timestamp with time zone, '2023-05-10 10:00:00'::timestamp with time zone, false),
  ('22222222-2222-2222-2222-222222222222', 'Städtetrip Berlin', 'Wochenende in Berlin mit Freunden', '2023-07-21'::timestamp with time zone, '2023-07-23'::timestamp with time zone, '2023-07-10 14:30:00'::timestamp with time zone, '2023-07-10 14:30:00'::timestamp with time zone, false),
  ('33333333-3333-3333-3333-333333333333', 'Wanderung im Schwarzwald', 'Mehrtägige Wanderung durch den Schwarzwald', '2023-08-05'::timestamp with time zone, '2023-08-10'::timestamp with time zone, '2023-07-20 09:15:00'::timestamp with time zone, '2023-07-20 09:15:00'::timestamp with time zone, false);

-- Testdaten für die Entries-Tabelle einfügen
INSERT INTO public.entries (id, trip_id, title, content, location, latitude, longitude, created_at, updated_at, deleted)
VALUES
  -- Einträge für den Italien-Urlaub
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Ankunft in Bozen', 'Nach einer langen Fahrt endlich in Bozen angekommen. Das Hotel ist wunderschön.', 'Bozen, Italien', 46.4983, 11.3548, '2023-06-15 18:30:00'::timestamp with time zone, '2023-06-15 18:30:00'::timestamp with time zone, false),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Wanderung Seiser Alm', 'Heute haben wir eine tolle Wanderung auf der Seiser Alm gemacht. Die Aussicht war atemberaubend.', 'Seiser Alm, Südtirol', 46.5403, 11.6574, '2023-06-17 14:45:00'::timestamp with time zone, '2023-06-17 14:45:00'::timestamp with time zone, false),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111', 'Tag am Gardasee', 'Entspannter Tag am Gardasee mit Gelato und Schwimmen.', 'Riva del Garda, Italien', 45.8871, 10.8425, '2023-06-20 12:15:00'::timestamp with time zone, '2023-06-20 12:15:00'::timestamp with time zone, false),
  
  -- Einträge für den Berlin-Trip
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '22222222-2222-2222-2222-222222222222', 'Ankunft am Hauptbahnhof', 'Gerade in Berlin angekommen, checken als nächstes ins Hotel ein.', 'Berlin Hauptbahnhof', 52.5250, 13.3692, '2023-07-21 10:20:00'::timestamp with time zone, '2023-07-21 10:20:00'::timestamp with time zone, false),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'Brandenburger Tor', 'Besuch am Brandenburger Tor und Spaziergang durch den Tiergarten.', 'Brandenburger Tor, Berlin', 52.5163, 13.3777, '2023-07-21 15:00:00'::timestamp with time zone, '2023-07-21 15:00:00'::timestamp with time zone, false),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '22222222-2222-2222-2222-222222222222', 'Museum Insel', 'Heute haben wir mehrere Museen auf der Museumsinsel besucht. Besonders beeindruckend war das Pergamonmuseum.', 'Museumsinsel, Berlin', 52.5208, 13.3971, '2023-07-22 11:30:00'::timestamp with time zone, '2023-07-22 11:30:00'::timestamp with time zone, false),
  
  -- Einträge für die Schwarzwald-Wanderung
  ('gggggggg-gggg-gggg-gggg-gggggggggggg', '33333333-3333-3333-3333-333333333333', 'Start in Freudenstadt', 'Unsere Wanderung beginnt heute in Freudenstadt. Das Wetter ist perfekt.', 'Freudenstadt, Schwarzwald', 48.4646, 8.4108, '2023-08-05 09:00:00'::timestamp with time zone, '2023-08-05 09:00:00'::timestamp with time zone, false),
  ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', '33333333-3333-3333-3333-333333333333', 'Mummelsee', 'Heute haben wir den Mummelsee erreicht. Die Landschaft hier ist wunderschön.', 'Mummelsee, Schwarzwald', 48.5972, 8.2006, '2023-08-07 16:20:00'::timestamp with time zone, '2023-08-07 16:20:00'::timestamp with time zone, false),
  ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', '33333333-3333-3333-3333-333333333333', 'Abstieg nach Baden-Baden', 'Der letzte Tag unserer Wanderung. Wir steigen heute nach Baden-Baden ab.', 'Baden-Baden', 48.7616, 8.2410, '2023-08-10 14:10:00'::timestamp with time zone, '2023-08-10 14:10:00'::timestamp with time zone, false);

-- Zusätzliche gelöschte Einträge zum Testen der Löschfunktionalität
INSERT INTO public.trips (id, title, description, start_date, end_date, created_at, updated_at, deleted)
VALUES
  ('44444444-4444-4444-4444-444444444444', 'Gelöschte Reise', 'Diese Reise wurde gelöscht', '2023-05-01'::timestamp with time zone, '2023-05-05'::timestamp with time zone, '2023-04-15 10:30:00'::timestamp with time zone, '2023-05-06 08:00:00'::timestamp with time zone, true);

INSERT INTO public.entries (id, trip_id, title, content, location, latitude, longitude, created_at, updated_at, deleted)
VALUES
  ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', '11111111-1111-1111-1111-111111111111', 'Gelöschter Eintrag', 'Dieser Eintrag wurde gelöscht', 'Irgendwo in Italien', 45.4642, 9.1900, '2023-06-18 11:25:00'::timestamp with time zone, '2023-06-19 10:15:00'::timestamp with time zone, true); 