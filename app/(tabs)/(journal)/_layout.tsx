import { Stack } from 'expo-router';

export default function JournalLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen 
        name="new-trip"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen 
        name="trip/[id]"
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="trip/[id]/new-entry"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}