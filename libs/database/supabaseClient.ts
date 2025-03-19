import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Hole die Umgebungsvariablen
const supabaseUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Überprüfe, ob die Umgebungsvariablen vorhanden sind
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anon Key is not set in environment variables');
}

// Erstelle den Supabase-Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Überprüfe, ob der Benutzer angemeldet ist - wenn nicht, anonyme Anmeldung
export const ensureAuthenticated = async (): Promise<boolean> => {
  try {
    // Prüfe, ob eine aktive Session existiert
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('Keine aktive Session gefunden, starte anonyme Anmeldung...');
      
      // Anonyme Anmeldung (Sign Up)
      const { error } = await supabase.auth.signUp({
        email: `anonymous_${Date.now()}@example.com`,
        password: `anon_${Math.random().toString(36).substring(2, 10)}`,
      });
      
      if (error) {
        console.error('Fehler bei anonymer Anmeldung:', error);
        return false;
      }
      
      console.log('Anonyme Anmeldung erfolgreich');
    } else {
      console.log('Existierende Session gefunden:', session.user.id);
    }
    
    return true;
  } catch (error) {
    console.error('Authentifizierungsfehler:', error);
    return false;
  }
}; 